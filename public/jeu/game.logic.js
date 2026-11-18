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
export function shareText(mode, game, number, details = [], url = SITE.url) {
  const score = game.status === 'won' ? `${game.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const title = mode === 'film' ? `🎬 Zinzin Émojifilm n° ${number}` : `🗺️ Zinzin Silhouette n° ${number}`;
  let grid;
  if (mode === 'film') {
    const row = game.guesses.map((_, i) => (game.status === 'won' && i === game.guesses.length - 1 ? '🟩' : '🟥'));
    grid = row.join('') + '⬛'.repeat(MAX_GUESSES - row.length);
  } else {
    grid = details.map((d) => (d.proximity === 100 ? '🟩🟩🟩🟩🟩🎉' : `${proximitySquares(d.proximity)}${d.arrow}`)).join('\n');
  }
  return `${title} — ${score}\n${grid}\n${url}/jeu/`;
}

/* ------------------------------------------------------------------ */
/* Indices progressifs (Émojifilm)                                     */
/* ------------------------------------------------------------------ */

/** Indices débloqués après `errors` erreurs. */
export function filmHints(film, errors) {
  const hints = [];
  if (errors >= 1) hints.push({ label: 'Année', value: String(film.year) });
  if (errors >= 2) hints.push({ label: 'Genre', value: film.genre });
  if (errors >= 3) hints.push({ label: 'Réalisation', value: film.director });
  if (errors >= 4) hints.push({ label: 'Nombre de mots', value: String(film.title.split(/[\s']+/).filter(Boolean).length) });
  if (errors >= 5) hints.push({ label: 'Première lettre', value: film.title.replace(/^(Le |La |Les |L')/, '').charAt(0).toUpperCase() });
  return hints;
}
