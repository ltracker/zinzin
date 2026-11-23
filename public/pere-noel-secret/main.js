// Étape 9 — Père Noël secret : interface (organisateur + révélation). Logique dans santa.logic.js.
import { sanitizeNames, draw, isValidDraw, encodeTicket, decodeTicket, inviteMessage, MAX_PEOPLE } from './santa.logic.js';
import { absurdGift } from '../avent/avent.logic.js';
import { confetti } from '../roue/confetti.js';
import { load, save } from '../shared/storage.js';
import { copyText, shareOrCopy } from '../shared/share.js';
import { formatLongDate } from '../shared/dates.js';
import { $, el, toast } from '../shared/ui.js';

const DRAFT_KEY = 'pns:brouillon';

/* ================================================================== */
/* Mode révélation                                                    */
/* ================================================================== */

async function revealMode(hash) {
  const t = await decodeTicket(hash);
  $('#organizer').hidden = true;
  $('#reveal').hidden = false;
  if (!t) {
    $('#reveal-hello').textContent = 'Lien abîmé 😕';
    document.querySelector('.gift__intro').textContent = 'Ce lien est incomplet ou a été modifié. Demande à l\'organisateur de te le renvoyer en entier.';
    $('#reveal-btn').hidden = true;
    $('#reveal-hint').hidden = true;
    return;
  }
  document.title = `${t.event || 'Père Noël secret'} · Zinzin`;
  $('#reveal-event').textContent = `🎅 ${t.event || 'Père Noël secret'}`;
  $('#reveal-hello').textContent = `Bonjour ${t.giver} !`;
  $('#reveal-btn').addEventListener('click', () => {
    $('#reveal-btn').hidden = true;
    $('#reveal-hint').hidden = true;
    $('#reveal-name').textContent = t.receiver;
    const info = [];
    if (t.budget) info.push(['Budget', t.budget]);
    if (t.date) info.push(['Échange des cadeaux', formatLongDate(new Date(`${t.date}T12:00:00`))]);
    if (t.message) info.push(['Le mot de l\'organisateur', t.message]);
    $('#reveal-info').replaceChildren(...info.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v))));
    const idea = absurdGift(`${t.giver}>${t.receiver}`);
    $('#reveal-idea').textContent = `Idée cadeau (déconseillée) : ${idea.gift.toLowerCase()}. ${idea.usage}`;
    $('#reveal-result').hidden = false;
    confetti();
  });
}

/* ================================================================== */
/* Mode organisateur                                                  */
/* ================================================================== */

let people = [];
let exclusions = []; // paires de noms [donneur, receveur]
let lastLinks = [];

function saveDraft() {
  save(DRAFT_KEY, {
    people, exclusions,
    event: $('#ev-name').value, budget: $('#ev-budget').value, date: $('#ev-date').value, message: $('#ev-msg').value,
  });
}

function renderPeople() {
  $('#people-count').textContent = String(people.length);
  $('#people').replaceChildren(...people.map((p) => el('li', { class: 'person' }, p,
    el('button', { type: 'button', 'aria-label': `Retirer ${p}`, onclick: () => {
      people = people.filter((x) => x !== p);
      exclusions = exclusions.filter(([a, b]) => a !== p && b !== p);
      update();
    } }, '✕'))));
  for (const id of ['#ex-a', '#ex-b']) {
    const sel = $(id);
    const keep = sel.value;
    sel.replaceChildren(...people.map((p) => el('option', { value: p }, p)));
    if (people.includes(keep)) sel.value = keep;
  }
  if (people.length > 1 && $('#ex-a').value === $('#ex-b').value) $('#ex-b').selectedIndex = 1;
}

function renderExclusions() {
  $('#exclusions').replaceChildren(...exclusions.map(([a, b], i) => el('li', {},
    `🚫 ${a} n'offre pas à ${b}`,
    el('button', { type: 'button', class: 'btn btn--small', 'aria-label': `Supprimer l'exclusion ${a} vers ${b}`, onclick: () => {
      exclusions.splice(i, 1);
      update();
    } }, '✕'))));
}

function update() {
  renderPeople();
  renderExclusions();
  $('#results').hidden = true;
  saveDraft();
}

function addPeople(text) {
  const before = people.length;
  people = sanitizeNames([...people, ...String(text).split(/[,;\n]+/)]);
  if (people.length === before && text.trim()) toast('Déjà dans la liste (ou liste pleine)');
  if (people.length >= MAX_PEOPLE) toast(`${MAX_PEOPLE} participants maximum`);
  update();
}

$('#people-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#people-input');
  if (!input.value.trim()) return;
  addPeople(input.value);
  input.value = '';
  input.focus();
});

$('#people-input').addEventListener('paste', (e) => {
  const text = e.clipboardData?.getData('text') || '';
  if (/[,;\n]/.test(text)) { e.preventDefault(); addPeople(text); }
});

$('#ex-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const a = $('#ex-a').value, b = $('#ex-b').value;
  if (!a || !b || a === b) { toast('Choisis deux personnes différentes'); return; }
  const add = (x, y) => { if (!exclusions.some(([p, q]) => p === x && q === y)) exclusions.push([x, y]); };
  add(a, b);
  if ($('#ex-both').checked) add(b, a);
  update();
});

for (const id of ['#ev-name', '#ev-budget', '#ev-date', '#ev-msg']) $(id).addEventListener('input', saveDraft);

async function runDraw() {
  const err = $('#draw-error');
  err.textContent = '';
  if (people.length < 3) { err.textContent = 'Il faut au moins 3 participants pour garder le mystère.'; return; }
  const idx = new Map(people.map((p, i) => [p, i]));
  const ex = exclusions.map(([a, b]) => [idx.get(a), idx.get(b)]);
  const rng = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const result = draw(people.length, ex, rng);
  if (!result || !isValidDraw(result, ex)) {
    err.textContent = 'Impossible de faire un tirage avec ces exclusions 😵 Retire-en quelques-unes.';
    return;
  }
  const event = $('#ev-name').value.trim() || 'Père Noël secret';
  const base = { event, budget: $('#ev-budget').value.trim(), date: $('#ev-date').value, message: $('#ev-msg').value.trim() };
  lastLinks = await Promise.all(people.map(async (giver, i) => {
    const url = `${location.origin}/pere-noel-secret/#${await encodeTicket({ ...base, giver, receiver: people[result[i]] })}`;
    return { giver, url, text: inviteMessage({ event, giver, url }) };
  }));
  $('#links').replaceChildren(...lastLinks.map((l) => {
    const li = el('li', {}, el('span', { class: 'links__name' }, `🎅 ${l.giver}`),
      el('span', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn--small', 'aria-label': `Copier le message pour ${l.giver}`, onclick: async () => {
          if (await copyText(l.text)) { li.classList.add('is-copied'); toast(`Message pour ${l.giver} copié 📋`); }
        } }, '📋 Copier'),
        el('button', { type: 'button', class: 'btn btn--small', 'aria-label': `Partager le lien de ${l.giver}`, onclick: async () => {
          const r = await shareOrCopy({ title: event, text: inviteMessage({ event, giver: l.giver, url: '' }).trim(), url: l.url });
          if (r === 'copied') { li.classList.add('is-copied'); toast('Copié 📋'); }
        } }, '📤')));
    return li;
  }));
  $('#results').hidden = false;
  $('#results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  toast('Tirage effectué 🎲');
}

$('#draw-btn').addEventListener('click', runDraw);
$('#redraw').addEventListener('click', () => {
  if (confirm('Refaire le tirage ? Les liens déjà envoyés ne correspondront plus au nouveau tirage.')) runDraw();
});
$('#copy-all').addEventListener('click', async () => {
  toast((await copyText(lastLinks.map((l) => l.text).join('\n\n'))) ? 'Tous les messages copiés 📋' : 'Copie impossible 😕');
});

/* ================================================================== */
/* Démarrage                                                          */
/* ================================================================== */

const hash = location.hash.slice(1);
if (hash.length > 20) {
  revealMode(hash);
} else {
  const d = load(DRAFT_KEY, null);
  if (d) {
    people = sanitizeNames(d.people);
    exclusions = (d.exclusions || []).filter(([a, b]) => people.includes(a) && people.includes(b));
    $('#ev-name').value = d.event || '';
    $('#ev-budget').value = d.budget || '';
    $('#ev-date').value = d.date || '';
    $('#ev-msg').value = d.message || '';
  }
  update();
}
window.addEventListener('hashchange', () => location.reload());
