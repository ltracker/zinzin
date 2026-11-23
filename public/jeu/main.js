// App C — Le jeu du jour : 3 modes « devinette » (film, pays, chanson) + « Plus ou moins ».
// Archives (?m=mode&n=numéro) et défis (&defi=score) ; logique dans game.logic.js / geo.logic.js.
import {
  MAX_GUESSES, puzzleNumber, dailyIndex, findEntry, suggest, restoreGame, addGuess, recordResult,
  emptyStats, currentStreak, shareText, itemHints, normalize, puzzleKey, challengeUrl, parseChallenge,
  challengeVerdict, recordHistory, dailyRotation, nextOpponent, biggerOrSmaller, scoreOf, MODE_TITLES,
} from './game.logic.js';
import { compareCountries } from './geo.logic.js';
import { FILMS } from './data/films.js';
import { CHANSONS } from './data/chansons.js';
import { parisDateKey, msUntilParisMidnight, formatHMS, formatNumber } from '../shared/dates.js';
import { load, save } from '../shared/storage.js';
import { shareOrCopy, readParams } from '../shared/share.js';
import { attachAutocomplete } from '../shared/autocomplete.js';
import { $, el, toast, everySecond } from '../shared/ui.js';
import { unlock, trackVisit } from '../shared/stickers.js';

trackVisit('jeu');

const MODES = ['film', 'pays', 'chanson', 'plusmoins'];
const HASHES = { film: '#emojifilm', pays: '#silhouette', chanson: '#emojichanson', plusmoins: '#plus-ou-moins' };
const LABELS = { film: 'Émojifilm', pays: 'Silhouette', chanson: 'Émojichanson', plusmoins: 'Plus ou moins' };

let today = parisDateKey();
let PAYS = null;
const storeKey = (mode, what) => `jeu:${mode}:${what}`;

// Archive ou défi demandé par l'URL (null = puzzle du jour)
const challenge = parseChallenge(readParams(), puzzleNumber(today));
const isArchive = (mode) => Boolean(challenge && challenge.mode === mode && challenge.n !== puzzleNumber(today));
const playKey = (mode) => (challenge && challenge.mode === mode ? puzzleKey(challenge.n) : today);
const gameSlot = (mode) => (isArchive(mode) ? storeKey(mode, 'archive') : storeKey(mode, 'partie'));

let activeMode = MODES.includes(load('jeu:mode', 'film')) ? load('jeu:mode', 'film') : 'film';
if (challenge) activeMode = challenge.mode;
const fromHash = Object.entries(HASHES).find(([, h]) => h === location.hash);
if (fromHash && !challenge) activeMode = fromHash[0];

/* ================================================================== */
/* Onglets                                                            */
/* ================================================================== */

const tabs = Object.fromEntries(MODES.map((m) => [m, $(`#tab-${m}`)]));
const panels = Object.fromEntries(MODES.map((m) => [m, $(`#panel-${m}`)]));

async function selectMode(mode, focus = false) {
  activeMode = mode;
  save('jeu:mode', mode);
  for (const m of MODES) {
    const on = m === mode;
    tabs[m].setAttribute('aria-selected', String(on));
    tabs[m].tabIndex = on ? 0 : -1;
    panels[m].hidden = !on;
  }
  if (focus) tabs[mode].focus();
  if (mode === 'pays' || mode === 'plusmoins') await ensurePays();
  if (mode === 'plusmoins') pm.start();
  $('#stats-btn').hidden = mode === 'plusmoins';
  $('#archives-btn').hidden = mode === 'plusmoins';
  if (!challenge) history.replaceState(null, '', HASHES[mode]);
}

MODES.forEach((m, i) => {
  tabs[m].addEventListener('click', () => selectMode(m));
  tabs[m].addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const j = (i + (e.key === 'ArrowRight' ? 1 : MODES.length - 1)) % MODES.length;
    selectMode(MODES[j], true);
  });
});

/* ================================================================== */
/* Fin de partie, partage, défis                                      */
/* ================================================================== */

function finish(mode, game) {
  save(storeKey(mode, 'historique'), recordHistory(load(storeKey(mode, 'historique'), {}), game));
  if (isArchive(mode)) {
    unlock('jeu-archive');
  } else {
    const stats = recordResult(load(storeKey(mode, 'stats'), emptyStats()), game);
    save(storeKey(mode, 'stats'), stats);
    if (game.status === 'won') {
      if (stats.streak >= 3) unlock('jeu-serie-3');
      if (stats.streak >= 7) unlock('jeu-serie-7');
      const others = ['film', 'pays', 'chanson'].filter((m) => m !== mode).map((m) => load(storeKey(m, 'partie')));
      if (others.some((o) => o && o.key === game.key && o.status === 'won')) unlock('jeu-double');
    }
    setTimeout(() => openStats(mode, game), 1200);
  }
  if (game.status === 'won') {
    unlock('jeu-victoire');
    if (game.guesses.length === 1) unlock('jeu-un-coup');
  } else unlock('jeu-defaite');
  if (challenge?.defi && challenge.mode === mode && challengeVerdict(game, challenge.defi).result === 'gagne') unlock('jeu-defi');
}

function outcomeBlock(mode, container, { won, title, answer, details }) {
  const game = guessModes[mode].game;
  container.hidden = false;
  container.classList.toggle('is-lost', !won);
  const verdict = challenge?.defi && challenge.mode === mode ? challengeVerdict(game, challenge.defi) : null;
  container.replaceChildren(...[
    el('p', { class: 'outcome__title' }, title),
    el('p', { class: 'outcome__answer' }, answer),
    verdict ? el('p', { class: 'outcome__verdict' }, verdict.text) : null,
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn', onclick: () => share(mode, game, details) }, '📤 Partager / défier'),
      isArchive(mode)
        ? el('a', { class: 'btn', href: `/jeu/${HASHES[mode]}` }, '🏠 Puzzle du jour')
        : el('button', { type: 'button', class: 'btn', onclick: () => openStats(mode) }, '📊 Stats'),
    ),
  ].filter(Boolean)); // replaceChildren(null) insérerait le texte « null »
}

async function share(mode, game, details) {
  const n = isArchive(mode) ? challenge.n : puzzleNumber(today);
  const url = challengeUrl(`${location.origin}/jeu/`, mode, n, game);
  const r = await shareOrCopy({ title: 'Zinzin — le jeu du jour', text: shareText(mode, game, n, details, url) });
  if (r === 'copied') toast('Résultat copié (avec lien de défi) 📋');
  else if (r === 'failed') toast('Impossible de copier 😕');
}

function renderBanner() {
  const b = $('#banner');
  if (!challenge) { b.hidden = true; return; }
  const what = `${LABELS[challenge.mode]} n° ${challenge.n}`;
  const defi = challenge.defi ? (challenge.defi === 'X' ? ' Ton ami·e n\'a pas trouvé : à toi de briller !' : ` Ton ami·e a trouvé en ${challenge.defi} essai${challenge.defi === '1' ? '' : 's'}. Fais mieux !`) : '';
  b.replaceChildren(...[
    challenge.defi ? '🥊 Défi : ' : '📚 Archive : ',
    `${what}.${defi} `,
    isArchive(challenge.mode) ? el('a', { href: `/jeu/${HASHES[challenge.mode]}` }, 'Revenir au puzzle du jour') : null,
  ].filter(Boolean));
  b.hidden = false;
}

/* ================================================================== */
/* Modes « devinette » (fabrique commune)                             */
/* ================================================================== */

const PAYS_ALIASES = {
  US: ['USA', 'Etats-Unis d’Amérique', 'Amérique'], GB: ['Angleterre', 'Grande-Bretagne', 'UK'], NL: ['Hollande'],
  CD: ['RDC', 'Congo-Kinshasa'], CG: ['Congo', 'Congo-Brazzaville'], MM: ['Myanmar'], CZ: ['République tchèque'],
  SZ: ['Swaziland'], MK: ['Macédoine'], KR: ['Corée'], RU: ['Fédération de Russie'], CI: ['Cote d Ivoire'],
  AE: ['Émirats', 'EAU'], BA: ['Bosnie'], CF: ['Centrafrique'], DO: ['Dominicaine'], TL: ['Timor oriental'],
};

/**
 * @param {object} cfg
 *  mode, list() → éléments, salt, idOf(x), nameOf(x), aliasesOf(x), notFound, renderBoard(), renderAttempt(id, i), answer(target)
 */
function guessMode(cfg) {
  const m = {
    ...cfg,
    target: null,
    game: null,
    input: $(`#${cfg.mode}-input`),
    ready: () => cfg.list().length > 0,
    init() {
      if (!m.ready()) return;
      const key = playKey(cfg.mode);
      const list = cfg.list();
      m.target = list[dailyIndex(key, list.length, cfg.salt)];
      m.game = restoreGame(load(gameSlot(cfg.mode)), key);
      m.render();
    },
    render() {
      if (!m.game) return;
      cfg.renderBoard(m);
      $(`#${cfg.mode}-attempts`).replaceChildren(...m.game.guesses.map((g, i) => cfg.renderAttempt(m, g, i)));
      const playing = m.game.status === 'playing';
      $(`#${cfg.mode}-form`).hidden = !playing;
      if (!playing) {
        const won = m.game.status === 'won';
        const n = m.game.guesses.length;
        outcomeBlock(cfg.mode, $(`#${cfg.mode}-outcome`), {
          won,
          title: won ? `🎉 Bravo, trouvé en ${n} essai${n > 1 ? 's' : ''} !` : `😵 Raté${isArchive(cfg.mode) ? '' : ' pour aujourd\'hui'}…`,
          answer: cfg.answer(m.target),
          details: cfg.details ? cfg.details(m) : [],
        });
      } else $(`#${cfg.mode}-outcome`).hidden = true;
    },
    submit(text) {
      if (!m.game || !text.trim()) return;
      const entry = findEntry(text, cfg.list(), cfg.nameOf, cfg.aliasesOf);
      if (!entry) { toast(cfg.notFound); return; }
      const id = cfg.idOf(entry);
      if (m.game.guesses.includes(id)) { toast('Déjà essayé !'); return; }
      const correct = entry === m.target;
      if (cfg.beforeGuess) cfg.beforeGuess(m);
      m.game = addGuess(m.game, id, correct);
      save(gameSlot(cfg.mode), m.game);
      m.input.value = '';
      m.render();
      if (m.game.status !== 'playing') finish(cfg.mode, m.game);
      else if (!correct && cfg.wrongToast) toast(cfg.wrongToast);
    },
  };
  attachAutocomplete(m.input, {
    source: (t) => (m.ready() ? suggest(t, cfg.list(), cfg.nameOf, 8, cfg.aliasesOf).map((x) => ({ label: cfg.nameOf(x), value: x })) : []),
  });
  $(`#${cfg.mode}-form`).addEventListener('submit', (e) => { e.preventDefault(); m.submit(m.input.value); });
  return m;
}

function textAttempt(m, g, i) {
  const ok = normalize(g) === normalize(m.target.title);
  return el('li', { class: `attempt ${ok ? 'is-right' : 'is-wrong'}` },
    el('span', { class: 'attempt__n' }, `${i + 1}`),
    el('span', { class: 'attempt__name' }, g),
    el('span', { class: 'attempt__meta', 'aria-label': ok ? 'bonne réponse' : 'raté' }, ok ? '✅' : '❌'));
}

function textBoard(kind) {
  return (m) => {
    const errors = m.game.guesses.filter((g) => normalize(g) !== normalize(m.target.title)).length;
    $(`#${kind}-emojis`).textContent = m.target.emojis;
    $(`#${kind}-hints`).replaceChildren(...itemHints(m.target, errors, kind).map((h) =>
      el('li', { class: 'hint' }, `${h.label} : `, el('strong', {}, h.value))));
  };
}

const guessModes = {
  film: guessMode({
    mode: 'film', salt: 'film', list: () => FILMS,
    idOf: (f) => f.title, nameOf: (f) => f.title, aliasesOf: (f) => f.aliases,
    notFound: "Ce film n'est pas dans la liste 🤔 Choisis une suggestion.",
    wrongToast: 'Raté ! Nouvel indice débloqué 🔓',
    renderBoard: textBoard('film'), renderAttempt: textAttempt,
    answer: (t) => `C'était « ${t.title} » (${t.year}), de ${t.director}.`,
  }),
  chanson: guessMode({
    mode: 'chanson', salt: 'chanson', list: () => CHANSONS,
    idOf: (c) => c.title, nameOf: (c) => c.title, aliasesOf: (c) => c.aliases,
    notFound: "Cette chanson n'est pas dans la liste 🤔 Choisis une suggestion.",
    wrongToast: 'Raté ! Nouvel indice débloqué 🔓',
    renderBoard: textBoard('chanson'), renderAttempt: textAttempt,
    answer: (t) => `C'était « ${t.title} » (${t.year}), par ${t.artist}.`,
  }),
  pays: guessMode({
    mode: 'pays', salt: 'pays', list: () => (PAYS ? PAYS.filter((p) => p.pool) : []),
    idOf: (p) => p.c, nameOf: (p) => p.n, aliasesOf: (p) => PAYS_ALIASES[p.c] || [],
    notFound: 'Pays inconnu 🤔 Choisis une suggestion.',
    beforeGuess: (m) => {
      if (m.game.guesses.length === 0 && $('#pays-hard').checked) m.game = { ...m.game, hard: true };
    },
    details: (m) => m.game.guesses.map((c) => compareCountries(PAYS.find((p) => p.c === c), m.target)),
    renderBoard: (m) => {
      $('#pays-shape path').setAttribute('d', m.target.p);
      const solved = m.game.status !== 'playing';
      const hard = m.game.hard || (m.game.guesses.length === 0 && $('#pays-hard').checked);
      $('#pays-hard').checked = Boolean(hard);
      $('#pays-hard').disabled = m.game.guesses.length > 0 || solved;
      $('#pays-shape').style.transform = hard && !solved ? `rotate(${dailyRotation(m.game.key)}deg)` : '';
      $('#pays-figure').classList.toggle('is-solved', solved);
      $('#pays-shape').setAttribute('aria-label', solved ? `Silhouette : ${m.target.n}` : 'Silhouette du pays mystère');
    },
    renderAttempt: (m, c, i) => {
      const p = PAYS.find((x) => x.c === c);
      const d = compareCountries(p, m.target);
      return el('li', { class: `attempt ${d.exact ? 'is-right' : ''}` },
        el('span', { class: 'attempt__n' }, `${i + 1}`),
        el('span', { class: 'attempt__name' }, p.n),
        el('span', { class: 'attempt__meta' },
          d.exact ? '🎯 Bravo !' : `${formatNumber(d.distance)} km`,
          d.exact ? null : el('span', { class: 'attempt__arrow', role: 'img', 'aria-label': `direction ${d.label}` }, d.arrow),
          el('span', { class: 'attempt__pct' }, `${d.proximity} %`)));
    },
    answer: (t) => `Le pays mystère était : ${t.n}.`,
  }),
};

$('#pays-hard').addEventListener('change', () => guessModes.pays.render());

async function ensurePays() {
  if (PAYS) return;
  try {
    PAYS = await (await fetch('/jeu/data/pays.json')).json();
    guessModes.pays.init();
  } catch {
    toast('Impossible de charger les pays 😕');
  }
}

/* ================================================================== */
/* Plus ou moins                                                      */
/* ================================================================== */

const pm = {
  ref: null, mys: null, score: 0, busy: false,
  rng: () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296,
  start() {
    if (!PAYS || this.ref) return;
    this.restart();
  },
  restart() {
    const pool = PAYS.filter((p) => p.pool);
    this.ref = pool[Math.floor(this.rng() * pool.length)];
    this.mys = nextOpponent(pool, this.ref, this.rng);
    this.score = 0;
    $('#pm-outcome').hidden = true;
    $('#pm-actions').hidden = false;
    this.render(false);
  },
  render(reveal) {
    $('#pm-ref-shape path').setAttribute('d', this.ref.p);
    $('#pm-ref-name').textContent = this.ref.n;
    $('#pm-ref-area').textContent = `${formatNumber(this.ref.a)} km²`;
    $('#pm-mys-shape path').setAttribute('d', this.mys.p);
    $('#pm-mys-name').textContent = this.mys.n;
    $('#pm-mys-area').textContent = reveal ? `${formatNumber(this.mys.a)} km²` : '? km²';
    $('#pm-score').textContent = String(this.score);
    $('#pm-record').textContent = String(load('jeu:plusmoins:record', 0));
    document.querySelector('.pm-card--mystery').classList.remove('is-right', 'is-wrong');
  },
  answer(choice) {
    if (this.busy) return;
    this.busy = true;
    const ok = biggerOrSmaller(this.ref, this.mys) === choice;
    this.render(true);
    document.querySelector('.pm-card--mystery').classList.add(ok ? 'is-right' : 'is-wrong');
    if (ok) {
      this.score += 1;
      $('#pm-score').textContent = String(this.score);
      if (this.score > load('jeu:plusmoins:record', 0)) save('jeu:plusmoins:record', this.score);
      if (this.score >= 10) unlock('jeu-geographe');
      setTimeout(() => {
        this.ref = this.mys;
        this.mys = nextOpponent(PAYS.filter((p) => p.pool), this.ref, this.rng);
        this.render(false);
        this.busy = false;
      }, 1100);
    } else {
      $('#pm-actions').hidden = true;
      const out = $('#pm-outcome');
      out.hidden = false;
      out.classList.add('is-lost');
      out.replaceChildren(
        el('p', { class: 'outcome__title' }, `Perdu ! Série de ${this.score} 🎯`),
        // Pas de « que Sénégal » : les articles des noms de pays sont trop irréguliers, on affiche les aires.
        el('p', { class: 'outcome__answer' }, `${this.mys.n} : ${formatNumber(this.mys.a)} km² · ${this.ref.n} : ${formatNumber(this.ref.a)} km²`),
        el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn', onclick: () => this.restart() }, '🔁 Rejouer'),
          el('button', { type: 'button', class: 'btn', onclick: async () => {
            const r = await shareOrCopy({ title: 'Zinzin — Plus ou moins', text: `⚖️ Zinzin « Plus ou moins » : ${this.score} bonne${this.score > 1 ? 's' : ''} réponse${this.score > 1 ? 's' : ''} d'affilée ! Tu fais mieux ?`, url: `${location.origin}/jeu/#plus-ou-moins` });
            if (r === 'copied') toast('Copié 📋');
          } }, '📤 Partager')));
      this.busy = false;
    }
  },
};
$('#pm-plus').addEventListener('click', () => pm.answer('plus'));
$('#pm-moins').addEventListener('click', () => pm.answer('moins'));

/* ================================================================== */
/* Statistiques et archives                                           */
/* ================================================================== */

const dialog = $('#stats-dialog');

function openStats(mode = activeMode, justFinished = null) {
  if (mode === 'plusmoins') return;
  const s = { ...emptyStats(), ...load(storeKey(mode, 'stats'), emptyStats()) };
  $('#stats-mode').textContent = `· ${LABELS[mode]}`;
  const pct = s.played ? Math.round((s.wins / s.played) * 100) : 0;
  const item = (label, value) => el('div', {}, el('dt', {}, label), el('dd', {}, String(value)));
  $('#stats-numbers').replaceChildren(
    item('Parties', s.played), item('% victoires', pct), item('Série', currentStreak(s, today)), item('Record', s.maxStreak));
  const max = Math.max(1, ...s.dist);
  const game = justFinished || (!isArchive(mode) ? guessModes[mode].game : null);
  const todayRow = game && game.status === 'won' ? game.guesses.length - 1 : -1;
  $('#histogram').replaceChildren(...s.dist.map((n, i) => {
    const bar = el('span', { class: 'histogram__bar' }, String(n));
    bar.style.width = `${Math.max(8, (n / max) * 100)}%`;
    return el('li', { class: i === todayRow ? 'is-today' : '' }, el('span', {}, String(i + 1)), bar);
  }));
  if (!dialog.open) dialog.showModal();
}

function openArchives(mode = activeMode) {
  const history = load(storeKey(mode, 'historique'), {});
  const last = puzzleNumber(today) - 1;
  $('#archives-mode').textContent = `· ${LABELS[mode]}`;
  const items = [];
  for (let n = last; n >= 1; n--) {
    const score = history[puzzleKey(n)];
    const status = score ? (score === 'X' ? '❌' : `✅ ${score}/${MAX_GUESSES}`) : 'à jouer';
    items.push(el('li', {}, el('a', { href: `/jeu/?m=${mode}&n=${n}`, 'aria-label': `Puzzle n° ${n}, ${score ? (score === 'X' ? 'perdu' : `gagné en ${score}`) : 'pas encore joué'}` },
      `n° ${n}`, el('small', {}, status))));
  }
  $('#archives-list').replaceChildren(...(items.length ? items : [el('li', {}, 'Pas encore d\'archives : reviens demain !')]));
  $('#archives-dialog').showModal();
}

$('#stats-btn').addEventListener('click', () => openStats(activeMode));
$('#archives-btn').addEventListener('click', () => openArchives(activeMode));
for (const d of [dialog, $('#archives-dialog')]) d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

/* ================================================================== */
/* Compte à rebours et changement de jour                             */
/* ================================================================== */

everySecond(() => {
  const now = new Date();
  const key = parisDateKey(now);
  if (key !== today) {
    today = key;
    for (const m of ['film', 'chanson', 'pays']) if (!isArchive(m)) guessModes[m].init();
    toast('Nouveau puzzle ! 🎉');
  }
  const txt = formatHMS(msUntilParisMidnight(now));
  $('#countdown').textContent = txt;
  $('#countdown-2').textContent = txt;
  $('#puzzle-number').textContent = String(challenge ? challenge.n : puzzleNumber(today));
});

/* ================================================================== */
/* Démarrage                                                          */
/* ================================================================== */

renderBanner();
guessModes.film.init();
guessModes.chanson.init();
selectMode(activeMode);
window.addEventListener('hashchange', () => {
  const m = Object.entries(HASHES).find(([, h]) => h === location.hash);
  if (m) selectMode(m[0]);
});
