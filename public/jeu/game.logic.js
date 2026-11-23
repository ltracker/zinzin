// Le jeu du jour — logique pure (tests/game.test.js) : puzzle du jour, comparaison
// des réponses, état d'une partie, statistiques et texte de partage.
import { createRng, shuffle } from '../shared/rng.js';
import { dayNumber, addDaysToKey } from '../shared/dates.js';
import { SITE } from '../shared/site.js';
import { proximitySquares } from './geo.logic.js';

export const MAX_GUESSES = 6;

/* ------------------------------------------------------------------ */
/* Puzzle du jour                                                      */
/* ------------------------------------------------------------------ */

/** Numéro du puzzle (1 le jour du lancement). */
export function puzzleNumber(dateKey, launchKey = SITE.launchKey) {
  return dayNumber(dateKey) - dayNumber(launchKey) + 1;
}

const permCache = new Map();
/** Permutation fixe des indices [0, length) pour un mode (graine constante). */
export function permutation(length, salt) {
  const k = `${salt}:${length}`;
  if (!permCache.has(k)) permCache.set(k, shuffle(createRng(`zinzin-jeu-${salt}`), [...Array(length).keys()]));
  return permCache.get(k);
}

/**
 * Index de l'élément du jour. Même date (Europe/Paris) → même index pour tout le monde ;
 * aucune répétition avant d'avoir parcouru toute la liste.
 */
export function dailyIndex(dateKey, length, salt, launchKey = SITE.launchKey) {
  const n = dayNumber(dateKey) - dayNumber(launchKey);
  return permutation(length, salt)[((n % length) + length) % length];
}

/* ------------------------------------------------------------------ */
/* Comparaison des réponses                                            */
/* ------------------------------------------------------------------ */

/** Normalise un texte : minuscules, sans accents, ligatures ni ponctuation, articles initiaux ignorés. */
export function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' et ')
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^(le|la|les|l|the|un|une) /, '')
    .replace(/\s+/g, ' ');
}

/** Vrai si la proposition correspond au titre ou à l'un des alias. */
export function matches(guess, answer, aliases = []) {
  const g = normalize(guess);
  if (!g) return false;
  return [answer, ...aliases].some((a) => normalize(a) === g);
}

/** Trouve l'élément d'une liste correspondant à la saisie (titre ou alias). */
export function findEntry(input, list, getName, getAliases = () => []) {
  const g = normalize(input);
  if (!g) return null;
  return list.find((x) => normalize(getName(x)) === g || getAliases(x).some((a) => normalize(a) === g)) || null;
}

/**
 * Suggestions pour l'autocomplétion : d'abord les débuts de mot, puis les contenus.
 * @returns {Array} au plus `limit` éléments
 */
export function suggest(input, list, getName, limit = 8, getAliases = () => []) {
  const g = normalize(input);
  if (!g) return [];
  const starts = [], contains = [];
  for (const x of list) {
    const names = [getName(x), ...getAliases(x)].map(normalize);
    if (names.some((n) => n.startsWith(g) || n.includes(` ${g}`))) starts.push(x);
    else if (names.some((n) => n.includes(g))) contains.push(x);
  }
  return [...starts, ...contains].slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Partie et statistiques                                              */
/* ------------------------------------------------------------------ */

export function newGame(dateKey) {
  return { key: dateKey, guesses: [], status: 'playing' };
}

/** Recharge la partie du jour si elle correspond à la date, sinon en crée une neuve. */
export function restoreGame(saved, dateKey) {
  if (saved && saved.key === dateKey && Array.isArray(saved.guesses)) return saved;
  return newGame(dateKey);
}

/**
 * Ajoute une proposition (immuable). `correct` indique si c'est la bonne réponse.
 * Les doublons et les coups après la fin sont ignorés.
 */
export function addGuess(game, guessId, correct) {
  if (game.status !== 'playing' || game.guesses.includes(guessId)) return game;
  const guesses = [...game.guesses, guessId];
  const status = correct ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
  return { ...game, guesses, status };
}

export function emptyStats() {
  return { played: 0, wins: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0], lastKey: null, lastWinKey: null };
}

/** Met à jour les stats à la fin d'une partie (idempotent pour un même jour). */
export function recordResult(stats, game) {
  const s = { ...emptyStats(), ...stats, dist: [...(stats?.dist || emptyStats().dist)] };
  if (game.status === 'playing' || s.lastKey === game.key) return s;
  s.played += 1;
  s.lastKey = game.key;
  if (game.status === 'won') {
    s.wins += 1;
    s.dist[game.guesses.length - 1] += 1;
    s.streak = s.lastWinKey === addDaysToKey(game.key, -1) ? s.streak + 1 : 1;
    s.lastWinKey = game.key;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
  } else {
    s.streak = 0;
  }
  return s;
}

/** La série affichée retombe à 0 si le dernier jour gagné n'est ni aujourd'hui ni hier. */
export function currentStreak(stats, todayKey) {
  if (!stats || !stats.lastWinKey) return 0;
  return stats.lastWinKey === todayKey || stats.lastWinKey === addDaysToKey(todayKey, -1) ? stats.streak : 0;
}

/* ------------------------------------------------------------------ */
/* Partage (sans spoiler)                                              */
/* ------------------------------------------------------------------ */

/**
 * @param {'film'|'pays'} mode
 * @param {object} game
 * @param {number} number   numéro du puzzle
 * @param {Array<{proximity:number, arrow:string}>} [details]  pour le mode pays
 */
export const MODE_TITLES = { film: '🎬 Zinzin Émojifilm', pays: '🗺️ Zinzin Silhouette', chanson: '🎵 Zinzin Émojichanson' };

/** Score court : '3' (gagné en 3) ou 'X' (perdu). */
export const scoreOf = (game) => (game.status === 'won' ? String(game.guesses.length) : 'X');

export function shareText(mode, game, number, details = [], url = `${SITE.url}/jeu/`) {
  const score = `${scoreOf(game)}/${MAX_GUESSES}`;
  const title = `${MODE_TITLES[mode]} n° ${number}${game.hard ? ' 🔥' : ''}`;
  let grid;
  if (mode !== 'pays') {
    const row = game.guesses.map((_, i) => (game.status === 'won' && i === game.guesses.length - 1 ? '🟩' : '🟥'));
    grid = row.join('') + '⬛'.repeat(MAX_GUESSES - row.length);
  } else {
    grid = details.map((d) => (d.proximity === 100 ? '🟩🟩🟩🟩🟩🎉' : `${proximitySquares(d.proximity)}${d.arrow}`)).join('\n');
  }
  return `${title} — ${score}\n${grid}\n${url}`;
}

/* ------------------------------------------------------------------ */
/* Archives et défis                                                   */
/* ------------------------------------------------------------------ */

/** Clé de date du puzzle n° n (1 = jour du lancement). */
export function puzzleKey(n, launchKey = SITE.launchKey) {
  return addDaysToKey(launchKey, n - 1);
}

export const PLAYABLE_MODES = ['film', 'pays', 'chanson'];

/** Lien de défi : rejouer le même puzzle et tenter de battre ce score. */
export function challengeUrl(base, mode, number, game) {
  return `${base}?m=${mode}&n=${number}&defi=${scoreOf(game)}`;
}

/**
 * Lit les paramètres d'URL d'archive/défi. Renvoie null si absents ou invalides.
 * @returns {{ mode: string, n: number, defi: string|null } | null}
 */
export function parseChallenge(params, todayNumber) {
  const n = Number(params.n);
  if (!PLAYABLE_MODES.includes(params.m) || !Number.isInteger(n) || n < 1 || n > todayNumber) return null;
  const defi = /^[1-6X]$/.test(params.defi || '') ? params.defi : null;
  return { mode: params.m, n, defi };
}

/** Verdict d'un défi une fois la partie terminée. */
export function challengeVerdict(game, defi) {
  const mine = game.status === 'won' ? game.guesses.length : 99;
  const theirs = defi === 'X' ? 99 : Number(defi);
  if (mine < theirs) return { result: 'gagne', text: '🏆 Défi remporté ! Tu as fait mieux.' };
  if (mine === theirs) return { result: 'egalite', text: mine === 99 ? '🤝 Égalité… dans la défaite.' : '🤝 Égalité parfaite !' };
  return { result: 'perdu', text: '😤 Défi perdu… mais la revanche est permise.' };
}

/** Historique { clé de date: score } des parties terminées (pour la liste des archives). */
export function recordHistory(history, game) {
  if (game.status === 'playing') return history || {};
  return { ...(history || {}), [game.key]: scoreOf(game) };
}

/* ------------------------------------------------------------------ */
/* Mode difficile (Silhouette pivotée)                                 */
/* ------------------------------------------------------------------ */

/** Rotation du jour pour le mode difficile : 90, 180 ou 270 degrés (même pour tout le monde). */
export function dailyRotation(dateKey) {
  return [90, 180, 270][Math.floor(createRng(`zinzin-rotation-${dateKey}`)() * 3)];
}

/* ------------------------------------------------------------------ */
/* Plus ou moins (aires des pays)                                      */
/* ------------------------------------------------------------------ */

/**
 * Tire un nouveau pays « mystère » différent du pays de référence et d'aire nettement
 * différente (au moins 5 %), pour que la question ait une réponse claire.
 */
export function nextOpponent(pool, reference, rng) {
  for (let tries = 0; tries < 500; tries++) {
    const c = pool[Math.floor(rng() * pool.length)];
    if (c.c !== reference.c && Math.abs(c.a - reference.a) / Math.max(c.a, reference.a) >= 0.05) return c;
  }
  return pool.find((c) => c.c !== reference.c);
}

/** 'plus' si le mystère est plus grand que la référence, sinon 'moins'. */
export function biggerOrSmaller(reference, mystery) {
  return mystery.a > reference.a ? 'plus' : 'moins';
}

/* ------------------------------------------------------------------ */
/* Indices progressifs (Émojifilm)                                     */
/* ------------------------------------------------------------------ */

/**
 * Indices débloqués après `errors` erreurs.
 * Film : année → genre → réalisation → nombre de mots → première lettre.
 * Chanson : année → langue → interprète → nombre de mots → première lettre.
 */
export function itemHints(item, errors, kind = 'film') {
  const order = kind === 'chanson'
    ? [['Année', String(item.year)], ['Langue', item.language], ['Interprète', item.artist]]
    : [['Année', String(item.year)], ['Genre', item.genre], ['Réalisation', item.director]];
  order.push(['Nombre de mots', String(item.title.split(/[\s']+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length)]);
  order.push(['Première lettre', item.title.replace(/^[…\s.]+/, '').replace(/^(Le |La |Les |L')/, '').charAt(0).toUpperCase()]);
  return order.slice(0, Math.max(0, Math.min(errors, order.length))).map(([label, value]) => ({ label, value }));
}

export const filmHints = (film, errors) => itemHints(film, errors, 'film');
