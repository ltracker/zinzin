// App A — Ce jour-là : interface (DOM, événements). Toute la logique est dans life.logic.js.
import {
  parseBirth, validateBirth, ageBreakdown, milestones, nextMilestone, nextBirthday, planetAges,
  countFullMoons, nextFullMoon, moonPhase, estimates, weekdayOf, westernZodiac, chineseZodiac, buildIcs,
} from './life.logic.js';
import { formatNumber, formatLongDate } from '../shared/dates.js';
import { readParams, replaceUrlParams, buildUrl, copyText, shareOrCopy, downloadText } from '../shared/share.js';
import { renderCard, downloadCanvas } from '../shared/image.js';
import { $, el, toast, everySecond } from '../shared/ui.js';
import { unlock, bump, collect, trackVisit } from '../shared/stickers.js';

trackVisit('ce-jour-la');

const form = $('#birth-form');
const dateInput = $('#birth-date');
const timeInput = $('#birth-time');
const errorEl = $('#form-error');
const results = $('#results');

let birth = null;
let stopTicker = null;

/* ---------------- Formatage ---------------- */

const n0 = (x) => formatNumber(Math.floor(x));
const plural = (n, one, many = `${one}s`) => `${n0(n)} ${n === 1 ? one : many}`;
const longDate = (d) => formatLongDate(d);

/** « 179 j 13 h 29 min 45 s » */
function countdown(ms) {
  if (ms <= 0) return "C'est maintenant ! 🎉";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d ? `${n0(d)} j ` : ''}${h} h ${String(m).padStart(2, '0')} min ${String(sec).padStart(2, '0')} s`;
}

/** « dans 3 ans » / « il y a 12 jours » */
function relative(date, now) {
  const diff = date - now;
  const days = Math.round(Math.abs(diff) / 86_400_000);
  let txt;
  if (days < 1) txt = "aujourd'hui";
  else if (days < 60) txt = plural(days, 'jour');
  else if (days < 730) txt = `${Math.round(days / 30.44)} mois`;
  else txt = `${formatNumber(days / 365.25, 1)} ans`;
  if (txt === "aujourd'hui") return txt;
  return diff > 0 ? `dans ${txt}` : `il y a ${txt}`;
}

/* ---------------- Rendu ---------------- */

function setLive(key, text) {
  for (const node of results.querySelectorAll(`[data-live="${key}"]`)) node.textContent = text;
}

function tick() {
  const now = new Date();
  const a = ageBreakdown(birth, now);
  setLive('years', n0(a.years));
  setLive('ymd', `${plural(a.months, 'mois', 'mois')} · ${plural(a.days, 'jour')} · ${a.hours} h ${String(a.minutes).padStart(2, '0')} min ${String(a.seconds).padStart(2, '0')} s`);
  setLive('totalSeconds', n0(a.totalSeconds));
  setLive('totalMinutes', n0(a.totalMinutes));
  setLive('totalHours', n0(a.totalHours));
  setLive('totalDays', n0(a.totalDays));
  setLive('totalWeeks', n0(a.totalWeeks));
  setLive('bdayCountdown', countdown(nextBirthday(birth, now).ms));
  const nm = nextMilestone(birth, now);
  setLive('msCountdown', nm ? countdown(nm.date - now) : '');
  const e = estimates(birth, now);
  for (const [k, v] of Object.entries(e)) setLive(`est-${k}`, formatEstimate(k, v));
}

function formatEstimate(key, v) {
  if (key === 'sleepYears') return `${formatNumber(v, 1)} ans`;
  if (key.endsWith('Km')) return `${n0(v)} km`;
  return n0(v);
}

const ESTIMATES = [
  { key: 'heartbeats', emoji: '❤️', label: 'battements de cœur', note: '≈ 80 par minute en moyenne sur une vie' },
  { key: 'breaths', emoji: '🌬️', label: 'respirations', note: '≈ 16 par minute' },
  { key: 'nights', emoji: '🛌', label: 'nuits de sommeil', note: 'une par jour, sieste non comprise' },
  { key: 'sleepYears', emoji: '😴', label: 'passées à dormir', note: '≈ 8 h 30 par jour en moyenne sur une vie' },
  { key: 'blinks', emoji: '👁️', label: 'clignements des yeux', note: '≈ 15 par minute éveillée' },
  { key: 'laughs', emoji: '😂', label: 'éclats de rire', note: '≈ 15 par jour (et sans doute plus depuis que tu connais Zinzin)' },
  { key: 'earthOrbitKm', emoji: '🌍', label: 'parcourus avec la Terre autour du Soleil', note: 'à 29,78 km/s' },
  { key: 'galaxyKm', emoji: '🌌', label: 'parcourus autour du centre de la Voie lactée', note: 'le Soleil file à ≈ 230 km/s' },
];

function render() {
  const now = new Date();
  results.hidden = false;

  // Anniversaire
  const nb = nextBirthday(birth, now);
  $('#bday-what').textContent = nb.isToday
    ? `C'est aujourd'hui ! Joyeux anniversaire 🥳 Le prochain : ${nb.turning} ans le ${longDate(nb.date)}.`
    : `${nb.turning} ans le ${longDate(nb.date)}`;

  // Prochain jalon
  const all = milestones(birth, now);
  const next = all.find((m) => !m.past);
  $('#ms-what').textContent = next ? `${next.emoji} ${next.label} le ${longDate(next.date)}` : 'Tous les jalons sont derrière toi. Respect. 🫡';
  $('#ics-btn').hidden = !next;

  // Frise : par défaut, les 3 derniers jalons passés et les 5 prochains ; le reste est replié.
  const timeline = $('#timeline');
  const iNext = next ? all.indexOf(next) : all.length;
  const visible = (i) => i >= iNext - 3 && i < iNext + 5;
  timeline.replaceChildren(...all.map((m, i) => el('li', { class: m.past ? 'is-past' : m === next ? 'is-next' : '', hidden: !visible(i), 'data-extra': visible(i) ? null : '1' },
    el('span', { class: 'timeline__emoji', 'aria-hidden': 'true' }, m.past ? '✅' : m.emoji),
    el('span', {},
      el('span', { class: 'timeline__label' }, m.label), el('br'),
      el('span', { class: 'timeline__date' }, longDate(m.date))),
    el('span', { class: 'timeline__status' }, m === next ? `PROCHAIN · ${relative(m.date, now)}` : relative(m.date, now)),
  )));
  const toggle = $('#timeline-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = `Voir les ${all.length} jalons`;

  // Planètes
  $('#planets').replaceChildren(...planetAges(birth, now).map((p) => el('li', { class: 'card planet', 'data-planet': p.id },
    el('span', { class: 'planet__ball', 'aria-hidden': 'true' }),
    el('span', { class: 'planet__name' }, p.name),
    el('span', { class: 'planet__age' }, `${formatNumber(p.age, p.age < 10 ? 2 : 1)} ${p.age >= 2 ? 'ans' : 'an'}`),
    el('span', { class: 'planet__next' }, `prochain anniversaire : ${p.nextBirthday.toLocaleDateString('fr-FR')}`),
  )));

  // Lune
  const fm = countFullMoons(birth, now);
  const phase = moonPhase(birth);
  $('#moon-count').textContent = `${n0(fm)} pleines lunes vécues`;
  $('#moon-birth').textContent = `Le jour de ta naissance, la Lune était en phase « ${phase.name} » ${phase.emoji}.`;
  $('#moon-next').textContent = `Prochaine pleine lune : ${longDate(nextFullMoon(now))}. Calcul astronomique (algorithme de Meeus), précis à quelques minutes près.`;

  // Identité cosmique
  const wd = weekdayOf(birth);
  const z = westernZodiac(birth);
  const cz = chineseZodiac(birth);
  const item = (emoji, main, sub) => el('li', {},
    el('span', { class: 'identity__emoji', 'aria-hidden': 'true' }, emoji),
    el('span', {}, el('span', { class: 'identity__main' }, main), el('br'), el('span', { class: 'identity__sub' }, sub)));
  $('#identity').replaceChildren(
    item('📅', `Né·e un ${wd.name}`, wd.rhyme),
    item(z.emoji, `Signe : ${z.name}`, 'Zodiaque occidental (tropical)'),
    item(cz.emoji, `Signe chinois : ${cz.name} de ${cz.element}`, `Année lunaire commencée en ${cz.year}`),
  );

  // Estimations
  $('#estimates').replaceChildren(...ESTIMATES.map((e) => el('li', { class: 'card estimate' },
    el('span', { class: 'estimate__emoji', 'aria-hidden': 'true' }, e.emoji),
    el('span', { class: 'estimate__value' }, '≈ ', el('span', { 'data-live': `est-${e.key}` })),
    el('span', { class: 'estimate__label' }, e.label),
    el('span', { class: 'card__note' }, e.note),
  )));

  const a = ageBreakdown(birth, now);
  $('#results-summary').textContent = `Résultats : tu as ${a.years} ans, ${a.months} mois et ${a.days} jours.`;

  stopTicker?.();
  stopTicker = everySecond(tick);

  // Autocollants
  unlock('cjl-calcul');
  if (birth.getDay() === 5 && birth.getDate() === 13) unlock('cjl-vendredi13');
  if (birth.getMonth() === 1 && birth.getDate() === 29) unlock('cjl-29fevrier');
  if (nb.isToday) unlock('cjl-anniv');
}

$('#timeline-toggle').addEventListener('click', (e) => {
  const open = e.currentTarget.getAttribute('aria-expanded') !== 'true';
  e.currentTarget.setAttribute('aria-expanded', String(open));
  for (const li of $('#timeline').querySelectorAll('[data-extra]')) li.hidden = !open;
  e.currentTarget.textContent = open ? 'Replier la liste' : `Voir les ${$('#timeline').children.length} jalons`;
});

/* ---------------- Formulaire ---------------- */

function compute({ scroll = true } = {}) {
  const b = parseBirth(dateInput.value, timeInput.value);
  const err = validateBirth(b, new Date());
  errorEl.textContent = dateInput.value ? (err || '') : 'Indique ta date de naissance 🙂';
  dateInput.setAttribute('aria-invalid', String(Boolean(err || !dateInput.value)));
  if (err || !dateInput.value) { dateInput.focus(); return; }
  birth = b;
  replaceUrlParams({ d: dateInput.value, h: timeInput.value });
  render();
  if (scroll) results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

form.addEventListener('submit', (e) => { e.preventDefault(); compute(); });

$('#random-date').addEventListener('click', () => {
  const start = Date.UTC(1945, 0, 1);
  const end = Date.now() - 5 * 365.25 * 86_400_000;
  const d = new Date(start + Math.random() * (end - start));
  dateInput.value = d.toISOString().slice(0, 10);
  timeInput.value = '';
  compute();
});

dateInput.max = new Date().toISOString().slice(0, 10);

/* ---------------- Partage ---------------- */

const shareUrl = () => buildUrl({ d: dateInput.value, h: timeInput.value });

$('#share-link').addEventListener('click', async () => {
  toast((await copyText(shareUrl())) ? 'Lien copié 🔗' : 'Impossible de copier le lien 😕');
});

if (navigator.share) {
  const btn = $('#share-native');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    const a = ageBreakdown(birth, new Date());
    const r = await shareOrCopy({ title: 'Ce jour-là · Zinzin', text: `J'ai ${a.years} ans… et ${n0(a.totalSeconds)} secondes ! 🎂`, url: shareUrl() });
    if (r === 'copied') toast('Copié dans le presse-papiers 📋');
  });
}

$('#share-image').addEventListener('click', async () => {
  const now = new Date();
  const a = ageBreakdown(birth, now);
  const mars = planetAges(birth, now).find((p) => p.id === 'mars');
  const nm = nextMilestone(birth, now);
  const canvas = await renderCard({
    kicker: 'Ce jour-là',
    emoji: '🎂',
    title: `${a.years} ans, ${a.months} mois et ${a.days} jours`,
    lines: [
      `🌕 ${n0(countFullMoons(birth, now))} pleines lunes vécues`,
      `🔴 ${formatNumber(mars.age, 1)} ans sur Mars`,
      `❤️ ≈ ${n0(estimates(birth, now).heartbeats)} battements de cœur`,
      nm ? `🚀 ${nm.label} le ${nm.date.toLocaleDateString('fr-FR')}` : '',
    ].filter(Boolean),
    accent: '#ffd23f',
  });
  downloadCanvas(canvas, 'zinzin-ce-jour-la.png');
  toast('Image téléchargée 🖼️');
});

$('#ics-btn').addEventListener('click', () => {
  const nm = nextMilestone(birth, new Date());
  if (!nm) return;
  const ics = buildIcs({
    title: `${nm.emoji} ${nm.label} de vie !`,
    description: `Aujourd'hui, tu atteins ${nm.label} de vie. Calculé avec Zinzin : ${shareUrl()}`,
    date: nm.date,
    uid: `${nm.id}-${dateInput.value}@zinzin`,
    url: shareUrl(),
  });
  downloadText(ics, `zinzin-${nm.id}.ics`, 'text/calendar');
  unlock('cjl-ics');
  toast('Fichier calendrier téléchargé 📅');
});

/* ---------------- Démarrage ---------------- */

const params = readParams();
if (params.d) {
  dateInput.value = params.d;
  timeInput.value = params.h || '';
  compute({ scroll: false });
}
