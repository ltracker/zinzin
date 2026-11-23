// Équipes et dés — logique pure.
import { shuffle, pick } from '../shared/rng.js';
import { NOUNS, ADJECTIVES } from '../noms/dictionnaires.js';
import { parseNoun, parseAdjective, agree, titleCase } from '../noms/names.logic.js';

export const DICE = [4, 6, 8, 10, 12, 20];
const nouns = NOUNS.map(parseNoun);
const adjs = ADJECTIVES.map(parseAdjective);

/** Répartit les noms en `k` équipes de tailles égales à ±1 près (mélange aléatoire). */
export function makeTeams(names, k, rng) {
  const list = shuffle(rng, names);
  const teams = Array.from({ length: Math.max(1, Math.min(k, list.length)) }, () => []);
  list.forEach((n, i) => teams[i % teams.length].push(n));
  return teams;
}

/** Nombre d'équipes à partir d'une taille d'équipe souhaitée. */
export function teamsForSize(count, size) {
  return Math.max(1, Math.round(count / Math.max(1, size)));
}

/** Nom d'équipe absurde : « Les Pingouins Radioactifs ». */
export function teamName(rng, taken = new Set()) {
  for (let i = 0; i < 50; i++) {
    const n = pick(rng, nouns);
    const name = titleCase(`les ${n.p} ${agree(pick(rng, adjs), n.g, 'p')}`);
    if (!taken.has(name)) { taken.add(name); return name; }
  }
  return `Équipe ${taken.size + 1}`;
}

/** Lance `count` dés à `faces` faces. */
export function rollDice(count, faces, rng) {
  const rolls = Array.from({ length: count }, () => 1 + Math.floor(rng() * faces));
  return { rolls, total: rolls.reduce((s, v) => s + v, 0) };
}
