// Horoscope absurde : interface.
import { westernZodiac, ZODIAC } from '../ce-jour-la/life.logic.js';
import { parisDateKey, formatLongDate } from '../shared/dates.js';
import { load, save } from '../shared/storage.js';
import { shareOrCopy } from '../shared/share.js';
import { renderCard, downloadCanvas } from '../shared/image.js';
import { $, el, toast } from '../shared/ui.js';
import { unlock, trackVisit } from '../shared/stickers.js';

trackVisit('horoscope');

const SIGNS = ZODIAC.map((z, i) => ({ ...z, index: i }));
// Moteur de textes (dictionnaires des noms) chargé après le premier affichage.
let engine = null;
const loadEngine = () => (engine ||= import('./horoscope.logic.js'));
const today = parisDateKey();
let current = load('horoscope:signe', null);

function renderSigns() {
  $('#signs').replaceChildren(...SIGNS.map((s) => el('button', {
    type: 'button', class: 'sign', role: 'radio', 'aria-checked': String(s.index === current),
    tabindex: s.index === (current ?? 0) ? '0' : '-1',
    onclick: () => choose(s.index),
    onkeydown: (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      choose((s.index + d + 12) % 12, true);
    },
  }, el('span', { class: 'sign__emoji', 'aria-hidden': 'true' }, s.emoji), s.name)));
}

function choose(index, focus = false) {
  current = index;
  save('horoscope:signe', index);
  renderSigns();
  if (focus) $(`#signs .sign:nth-child(${index + 1})`).focus();
  renderHoroscope();
  unlock('horo-1');
}

async function renderHoroscope() {
  if (current === null) return;
  const { horoscope, starsText } = await loadEngine();
  const h = horoscope(current, today);
  $('#horo').hidden = false;
  $('#horo-date').textContent = formatLongDate(new Date(`${today}T12:00:00`));
  $('#horo-emoji').textContent = h.sign.emoji;
  $('#horo-sign').textContent = h.sign.name;
  $('#horo-mood').textContent = h.mood;
  const row = (label, stars, text) => el('div', {},
    el('dt', {}, label, stars ? el('span', { class: 'horo__stars', 'aria-label': `${stars} sur 5` }, starsText(stars)) : null),
    el('dd', {}, text));
  $('#horo-list').replaceChildren(
    row('❤️ Amour', h.stars.amour, h.amour),
    row('💼 Travail', h.stars.travail, h.travail),
    row('🍏 Santé', h.stars.sante, h.sante),
    row('✨ Conseil du jour', 0, h.conseil));
  $('#horo-extra').textContent = `Chiffre porte-bonheur : ${h.chiffre} · Couleur du jour : ${h.couleur}`;
}

$('#find-sign').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#birth').value;
  if (!v) { $('#birth').focus(); return; }
  const sign = westernZodiac(new Date(`${v}T12:00:00`));
  choose(SIGNS.findIndex((s) => s.name === sign.name));
  toast(`Tu es ${sign.name} ${sign.emoji}`);
});

$('#horo-share').addEventListener('click', async () => {
  const { horoscope } = await loadEngine();
  const h = horoscope(current, today);
  const r = await shareOrCopy({ title: 'Horoscope absurde', text: `🔮 ${h.sign.name} ${h.sign.emoji} aujourd'hui : « ${h.conseil} »`, url: `${location.origin}/horoscope/` });
  if (r === 'copied') toast('Copié 📋');
});

$('#horo-img').addEventListener('click', async () => {
  const { horoscope } = await loadEngine();
  const h = horoscope(current, today);
  const canvas = await renderCard({ kicker: `Horoscope · ${h.sign.name}`, emoji: '🔮', title: h.conseil, lines: [`Humeur : ${h.mood}`, `Couleur : ${h.couleur}`], accent: '#b28dff' });
  downloadCanvas(canvas, `zinzin-horoscope-${h.sign.name.toLowerCase()}.png`);
});

renderSigns();
requestAnimationFrame(() => setTimeout(renderHoroscope, 0));
