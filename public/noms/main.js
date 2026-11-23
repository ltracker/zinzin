// App B — Noms absurdes : interface. La génération est dans names.logic.js.
import { CATEGORIES, generate, toText } from './names.logic.js';
import { randomSeed } from '../shared/rng.js';
import { load, save } from '../shared/storage.js';
import { readParams, replaceUrlParams, buildUrl, copyText } from '../shared/share.js';
import { renderCard, downloadCanvas } from '../shared/image.js';
import { $, el, toast, prefersReducedMotion } from '../shared/ui.js';
import { unlock, bump, collect, trackVisit } from '../shared/stickers.js';

trackVisit('noms');

const FAV_KEY = 'noms:favoris';
const MAX_FAVS = 60;

const form = $('#gen-form');
const seedInput = $('#seed');
const nameEl = $('#result-name');
let current = null;

/* ---------------- Catégories ---------------- */

$('#cats').replaceChildren(...CATEGORIES.map((c, i) => el('label', { class: 'cat' },
  el('input', { type: 'radio', name: 'c', value: c.id, checked: i === 0 }),
  el('span', {}, el('span', { 'aria-hidden': 'true' }, c.emoji), c.label),
)));

const selectedCategory = () => form.elements.c.value;
const selectCategory = (id) => {
  const input = form.querySelector(`input[name="c"][value="${CSS.escape(id)}"]`);
  if (input) input.checked = true;
};

/* ---------------- Rendu du résultat ---------------- */

function show(result) {
  current = result;
  $('#result-emoji').textContent = result.emoji;
  $('#result-cat').textContent = result.categoryLabel;
  nameEl.textContent = result.name;
  $('#result-lines').replaceChildren(...result.lines.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v))));
  $('#result-actions').hidden = false;
  refreshFavButton();
}

/** Effet « machine à sous » : quelques noms défilent avant le résultat final. */
async function spinTo(categoryId, seed) {
  const final = generate(categoryId, seed);
  if (!prefersReducedMotion()) {
    nameEl.classList.add('is-spinning');
    for (let i = 0; i < 7; i++) {
      nameEl.textContent = generate(categoryId, `${seed}~${i}~${Math.random()}`).name;
      await new Promise((r) => setTimeout(r, 45 + i * 12));
    }
    nameEl.classList.remove('is-spinning');
  }
  show(final);
  bump('noms', 1, { 10: 'noms-10', 100: 'noms-100' });
  if (collect('noms-categories', categoryId) >= CATEGORIES.length) unlock('noms-toutes');
  nameEl.classList.remove('is-landed');
  void nameEl.offsetWidth; // relance l'animation
  nameEl.classList.add('is-landed');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const typed = seedInput.value.trim();
  const seed = typed || String(randomSeed());
  const c = selectedCategory();
  replaceUrlParams({ c, s: seed });
  spinTo(c, seed);
});

// Changer de catégorie avec une graine saisie régénère immédiatement.
form.addEventListener('change', (e) => {
  if (e.target.name === 'c' && current) form.requestSubmit();
});

/* ---------------- Actions ---------------- */

const resultUrl = (r) => buildUrl({ c: r.category, s: r.seed });

$('#copy-btn').addEventListener('click', async () => {
  toast((await copyText(`${toText(current)}\n${resultUrl(current)}`)) ? 'Copié 📋' : 'Copie impossible 😕');
});

$('#link-btn').addEventListener('click', async () => {
  toast((await copyText(resultUrl(current))) ? 'Lien copié 🔗' : 'Copie impossible 😕');
});

$('#img-btn').addEventListener('click', async () => {
  const canvas = await renderCard({
    kicker: current.categoryLabel,
    emoji: current.emoji,
    title: current.name,
    lines: current.lines.slice(0, 3).map(([k, v]) => `${k} : ${v}`),
    accent: '#ff6fae',
  });
  downloadCanvas(canvas, `zinzin-${current.category}.png`);
  toast('Image téléchargée 🖼️');
});

/* ---------------- Favoris ---------------- */

const favs = () => load(FAV_KEY, []);
const favId = (r) => `${r.category}|${r.seed}`;
const isFav = (r) => favs().some((f) => f.id === favId(r));

function refreshFavButton() {
  const on = current && isFav(current);
  const btn = $('#fav-btn');
  btn.setAttribute('aria-pressed', String(Boolean(on)));
  btn.textContent = on ? '⭐ Favori' : '☆ Favori';
}

$('#fav-btn').addEventListener('click', () => {
  let list = favs();
  if (isFav(current)) {
    list = list.filter((f) => f.id !== favId(current));
    toast('Retiré des favoris');
  } else {
    unlock('noms-fav');
    list.unshift({ id: favId(current), category: current.category, seed: current.seed, name: current.name, emoji: current.emoji, label: current.categoryLabel });
    list = list.slice(0, MAX_FAVS);
    toast('Ajouté aux favoris ⭐');
  }
  save(FAV_KEY, list);
  refreshFavButton();
  renderFavs();
});

function renderFavs() {
  const list = favs();
  $('#favs-count').textContent = String(list.length);
  $('#favs-empty').hidden = list.length > 0;
  $('#favs-clear').hidden = list.length === 0;
  $('#favs-list').replaceChildren(...list.map((f) => el('li', { class: 'fav' },
    el('span', { class: 'fav__emoji', 'aria-hidden': 'true' }, f.emoji),
    el('span', {}, el('span', { class: 'fav__name' }, f.name), el('br'), el('span', { class: 'fav__cat' }, `${f.label} · graine « ${f.seed} »`)),
    el('span', { class: 'fav__actions' },
      el('button', { type: 'button', class: 'btn btn--small', 'aria-label': `Afficher ${f.name}`, onclick: () => {
        selectCategory(f.category);
        seedInput.value = /^\d+$/.test(f.seed) ? '' : f.seed;
        replaceUrlParams({ c: f.category, s: f.seed });
        show(generate(f.category, f.seed));
        $('#result').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      } }, '👀 Voir'),
      el('button', { type: 'button', class: 'btn btn--small', 'aria-label': `Copier ${f.name}`, onclick: async () => {
        toast((await copyText(f.name)) ? 'Copié 📋' : 'Copie impossible 😕');
      } }, '📋'),
      el('button', { type: 'button', class: 'btn btn--small', 'aria-label': `Retirer ${f.name} des favoris`, onclick: () => {
        save(FAV_KEY, favs().filter((x) => x.id !== f.id));
        renderFavs();
        refreshFavButton();
      } }, '🗑️'),
    ),
  )));
}

$('#favs-clear').addEventListener('click', () => {
  if (!confirm('Effacer tous les favoris ?')) return;
  save(FAV_KEY, []);
  renderFavs();
  refreshFavButton();
});

/* ---------------- Démarrage ---------------- */

renderFavs();
const params = readParams();
if (params.c && CATEGORIES.some((c) => c.id === params.c)) selectCategory(params.c);
if (params.s) {
  if (!/^\d+$/.test(params.s)) seedInput.value = params.s;
  show(generate(selectedCategory(), params.s));
}
