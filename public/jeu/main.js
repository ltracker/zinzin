// App C — Le jeu du jour : interface des deux modes. Logique dans game.logic.js / geo.logic.js.
import {
  MAX_GUESSES, puzzleNumber, dailyIndex, findEntry, suggest, restoreGame, addGuess, recordResult,
  emptyStats, currentStreak, shareText, filmHints, normalize,
} from './game.logic.js';
import { compareCountries } from './geo.logic.js';
import { FILMS } from './data/films.js';
import { parisDateKey, msUntilParisMidnight, formatHMS, formatNumber } from '../shared/dates.js';
import { load, save } from '../shared/storage.js';
import { shareOrCopy } from '../shared/share.js';
import { attachAutocomplete } from '../shared/autocomplete.js';
import { $, el, toast, everySecond } from '../shared/ui.js';
import { unlock, bump, collect, trackVisit } from '../shared/stickers.js';

trackVisit('jeu');

let today = parisDateKey();
let activeMode = load('jeu:mode', 'film') === 'pays' ? 'pays' : 'film';
let PAYS = null;

const storeKey = (mode, what) => `jeu:${mode}:${what}`;

/* ================================================================== */
/* Onglets                                                            */
/* ================================================================== */

const tabs = { film: $('#tab-film'), pays: $('#tab-pays') };
const panels = { film: $('#panel-film'), pays: $('#panel-pays') };

async function selectMode(mode, focus = false) {
  activeMode = mode;
  save('jeu:mode', mode);
  for (const m of ['film', 'pays']) {
    const on = m === mode;
    tabs[m].setAttribute('aria-selected', String(on));
    tabs[m].tabIndex = on ? 0 : -1;
    panels[m].hidden = !on;
  }
  if (focus) tabs[mode].focus();
  if (mode === 'pays') await ensurePays();
  history.replaceState(null, '', mode === 'pays' ? '#silhouette' : '#emojifilm');
}

for (const m of ['film', 'pays']) {
  tabs[m].addEventListener('click', () => selectMode(m));
  tabs[m].addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectMode(m === 'film' ? 'pays' : 'film', true);
    }
  });
}

/* ================================================================== */
/* Utilitaires communs                                                */
/* ================================================================== */

function finish(mode, game) {
  const stats = recordResult(load(storeKey(mode, 'stats'), emptyStats()), game);
  save(storeKey(mode, 'stats'), stats);
  // Autocollants
  if (game.status === 'won') {
    unlock('jeu-victoire');
    if (game.guesses.length === 1) unlock('jeu-un-coup');
    if (stats.streak >= 3) unlock('jeu-serie-3');
    if (stats.streak >= 7) unlock('jeu-serie-7');
    const other = load(storeKey(mode === 'film' ? 'pays' : 'film', 'partie'));
    if (other && other.key === game.key && other.status === 'won') unlock('jeu-double');
  } else {
    unlock('jeu-defaite');
  }
  setTimeout(() => openStats(mode, game), 1200);
}

function outcomeBlock(container, { won, title, answer, onShare }) {
  container.hidden = false;
  container.classList.toggle('is-lost', !won);
  container.replaceChildren(
    el('p', { class: 'outcome__title' }, title),
    el('p', { class: 'outcome__answer' }, answer),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn', onclick: onShare }, '📤 Partager mon score'),
      el('button', { type: 'button', class: 'btn', onclick: () => openStats(activeMode) }, '📊 Stats'),
    ),
  );
}

async function share(mode, game, details) {
  const text = shareText(mode, game, puzzleNumber(today), details, location.origin);
  const r = await shareOrCopy({ title: 'Zinzin — le jeu du jour', text });
  if (r === 'copied') toast('Résultat copié, sans spoiler 📋');
  else if (r === 'failed') toast('Impossible de copier 😕');
}

/* ================================================================== */
/* Mode Émojifilm                                                     */
/* ================================================================== */

const film = {
  target: null,
  game: null,
  input: $('#film-input'),
  init() {
    this.target = FILMS[dailyIndex(today, FILMS.length, 'film')];
    this.game = restoreGame(load(storeKey('film', 'partie')), today);
    this.render();
  },
  render() {
    const { game, target } = this;
    const errors = game.guesses.filter((g) => normalize(g) !== normalize(target.title)).length;
    $('#film-emojis').textContent = target.emojis;
    $('#film-hints').replaceChildren(...filmHints(target, game.status === 'playing' ? errors : Math.min(errors, 5)).map((h) =>
      el('li', { class: 'hint' }, `${h.label} : `, el('strong', {}, h.value))));
    $('#film-attempts').replaceChildren(...game.guesses.map((g, i) => {
      const ok = normalize(g) === normalize(target.title);
      return el('li', { class: `attempt ${ok ? 'is-right' : 'is-wrong'}` },
        el('span', { class: 'attempt__n' }, `${i + 1}`),
        el('span', { class: 'attempt__name' }, g),
        el('span', { class: 'attempt__meta', 'aria-label': ok ? 'bonne réponse' : 'raté' }, ok ? '✅' : '❌'));
    }));
    const playing = game.status === 'playing';
    $('#film-form').hidden = !playing;
    if (!playing) {
      const won = game.status === 'won';
      outcomeBlock($('#film-outcome'), {
        won,
        title: won ? `🎉 Bravo, trouvé en ${game.guesses.length} essai${game.guesses.length > 1 ? 's' : ''} !` : '😵 Raté pour aujourd\'hui…',
        answer: `C'était « ${target.title} » (${target.year}), de ${target.director}.`,
        onShare: () => share('film', game),
      });
    } else $('#film-outcome').hidden = true;
  },
  submit(text) {
    if (!text.trim()) return;
    const entry = findEntry(text, FILMS, (f) => f.title, (f) => f.aliases);
    if (!entry) { toast("Ce film n'est pas dans la liste 🤔 Choisis une suggestion."); return; }
    if (this.game.guesses.includes(entry.title)) { toast('Déjà essayé !'); return; }
    const correct = entry === this.target;
    this.game = addGuess(this.game, entry.title, correct);
    save(storeKey('film', 'partie'), this.game);
    this.input.value = '';
    this.render();
    if (this.game.status !== 'playing') finish('film', this.game);
    else if (!correct) toast(`Raté ! Nouvel indice débloqué 🔓`);
  },
};

attachAutocomplete(film.input, {
  source: (t) => suggest(t, FILMS, (f) => f.title, 8, (f) => f.aliases).map((f) => ({ label: f.title, value: f })),
  onSelect: () => {},
});
$('#film-form').addEventListener('submit', (e) => { e.preventDefault(); film.submit(film.input.value); });

/* ================================================================== */
/* Mode Silhouette                                                    */
/* ================================================================== */

const ALIASES = {
  US: ['USA', 'Etats-Unis d’Amérique', 'Amérique'], GB: ['Angleterre', 'Grande-Bretagne', 'UK'], NL: ['Hollande'],
  CD: ['RDC', 'Congo-Kinshasa'], CG: ['Congo', 'Congo-Brazzaville'], MM: ['Myanmar'], CZ: ['République tchèque'],
  SZ: ['Swaziland'], MK: ['Macédoine'], KR: ['Corée'], RU: ['Fédération de Russie'], CI: ['Cote d Ivoire'],
  AE: ['Émirats', 'EAU'], BA: ['Bosnie'], CF: ['Centrafrique'], DO: ['Dominicaine'], TL: ['Timor oriental'],
};
const paysNames = (p) => ALIASES[p.c] || [];

async function ensurePays() {
  if (PAYS) return;
  try {
    const res = await fetch('/jeu/data/pays.json');
    PAYS = await res.json();
    pays.init();
  } catch {
    toast('Impossible de charger les pays 😕');
  }
}

const pays = {
  target: null,
  game: null,
  input: $('#pays-input'),
  init() {
    const pool = PAYS.filter((p) => p.pool);
    this.target = pool[dailyIndex(today, pool.length, 'pays')];
    this.game = restoreGame(load(storeKey('pays', 'partie')), today);
    this.render();
  },
  details() {
    return this.game.guesses.map((c) => compareCountries(PAYS.find((p) => p.c === c), this.target));
  },
  render() {
    const { game, target } = this;
    $('#pays-shape path').setAttribute('d', target.p);
    const solved = game.status !== 'playing';
    $('.silhouette').classList.toggle('is-solved', solved);
    $('#pays-shape').setAttribute('aria-label', solved ? `Silhouette : ${target.n}` : 'Silhouette du pays mystère');
    const details = this.details();
    $('#pays-attempts').replaceChildren(...game.guesses.map((c, i) => {
      const p = PAYS.find((x) => x.c === c);
      const d = details[i];
      return el('li', { class: `attempt ${d.exact ? 'is-right' : ''}` },
        el('span', { class: 'attempt__n' }, `${i + 1}`),
        el('span', { class: 'attempt__name' }, p.n),
        el('span', { class: 'attempt__meta' },
          d.exact ? '🎯 Bravo !' : `${formatNumber(d.distance)} km`,
          d.exact ? null : el('span', { class: 'attempt__arrow', role: 'img', 'aria-label': `direction ${d.label}` }, d.arrow),
          el('span', { class: 'attempt__pct' }, `${d.proximity} %`)));
    }));
    $('#pays-form').hidden = solved;
    if (solved) {
      const won = game.status === 'won';
      outcomeBlock($('#pays-outcome'), {
        won,
        title: won ? `🎉 Trouvé en ${game.guesses.length} essai${game.guesses.length > 1 ? 's' : ''} !` : '😵 Perdu pour aujourd\'hui…',
        answer: `Le pays mystère était : ${target.n}.`,
        onShare: () => share('pays', game, details),
      });
    } else $('#pays-outcome').hidden = true;
  },
  submit(text) {
    if (!PAYS || !text.trim()) return;
    const entry = findEntry(text, PAYS, (p) => p.n, paysNames);
    if (!entry) { toast("Pays inconnu 🤔 Choisis une suggestion."); return; }
    if (this.game.guesses.includes(entry.c)) { toast('Déjà essayé !'); return; }
    const correct = entry.c === this.target.c;
    this.game = addGuess(this.game, entry.c, correct);
    save(storeKey('pays', 'partie'), this.game);
    this.input.value = '';
    this.render();
    if (this.game.status !== 'playing') finish('pays', this.game);
  },
};

attachAutocomplete(pays.input, {
  source: (t) => (PAYS ? suggest(t, PAYS, (p) => p.n, 8, paysNames).map((p) => ({ label: p.n, value: p })) : []),
  onSelect: () => {},
});
$('#pays-form').addEventListener('submit', (e) => { e.preventDefault(); pays.submit(pays.input.value); });

/* ================================================================== */
/* Statistiques                                                       */
/* ================================================================== */

const dialog = $('#stats-dialog');

function openStats(mode = activeMode, justFinished = null) {
  const s = { ...emptyStats(), ...load(storeKey(mode, 'stats'), emptyStats()) };
  $('#stats-mode').textContent = mode === 'film' ? '· Émojifilm' : '· Silhouette';
  const pct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  const item = (label, value) => el('div', {}, el('dt', {}, label), el('dd', {}, String(value)));
  $('#stats-numbers').replaceChildren(
    item('Parties', s.played), item('% victoires', pct), item('Série', currentStreak(s, today)), item('Record', s.maxStreak));
  const max = Math.max(1, ...s.dist);
  const game = justFinished || (mode === 'film' ? film.game : pays.game);
  const todayRow = game && game.status === 'won' ? game.guesses.length - 1 : -1;
  $('#histogram').replaceChildren(...s.dist.map((n, i) => {
    const bar = el('span', { class: 'histogram__bar' }, String(n));
    bar.style.width = `${Math.max(8, (n / max) * 100)}%`;
    return el('li', { class: i === todayRow ? 'is-today' : '' }, el('span', {}, String(i + 1)), bar);
  }));
  if (!dialog.open) dialog.showModal();
}

$('#stats-btn').addEventListener('click', () => openStats(activeMode));
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

/* ================================================================== */
/* Compte à rebours et changement de jour                             */
/* ================================================================== */

everySecond(() => {
  const now = new Date();
  const key = parisDateKey(now);
  if (key !== today) {
    today = key;
    film.init();
    if (PAYS) pays.init();
    toast('Nouveau puzzle ! 🎉');
  }
  const txt = formatHMS(msUntilParisMidnight(now));
  $('#countdown').textContent = txt;
  $('#countdown-2').textContent = txt;
  $('#puzzle-number').textContent = String(puzzleNumber(today));
});

/* ================================================================== */
/* Démarrage                                                          */
/* ================================================================== */

film.init();
if (location.hash === '#silhouette') activeMode = 'pays';
else if (location.hash === '#emojifilm') activeMode = 'film';
selectMode(activeMode);
window.addEventListener('hashchange', () => {
  if (location.hash === '#silhouette') selectMode('pays');
  else if (location.hash === '#emojifilm') selectMode('film');
});
