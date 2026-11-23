// Calendrier de l'Avent — logique pure (tests/avent.test.js).
// Les cases se déverrouillent à minuit heure de Paris (on travaille sur des clés 'AAAA-MM-JJ'
// obtenues avec parisDateKey). Du 25 décembre au 6 janvier, tout reste ouvert.
import { parseKey, dayNumber } from '../shared/dates.js';
import { createRng, shuffle, pick } from '../shared/rng.js';
import { NOUNS, ADJECTIVES, FIRST_NAMES, INGREDIENTS, VERBS } from '../noms/dictionnaires.js';
import { parseNoun, parseAdjective, phrase, withArticle, agree, cap, de } from '../noms/names.logic.js';

export const DAYS = 24;

/**
 * État du calendrier pour une date (heure de Paris).
 * @returns {{ phase: 'avant'|'pendant'|'apres', season: number, openUpTo: number, daysUntilStart: number }}
 *   season : année du mois de décembre concerné ; openUpTo : dernière case ouvrable (0 à 24).
 */
export function adventState(dateKey) {
  const { year, month, day } = parseKey(dateKey);
  if (month === 12) {
    if (day <= DAYS) return { phase: 'pendant', season: year, openUpTo: day, daysUntilStart: 0 };
    return { phase: 'apres', season: year, openUpTo: DAYS, daysUntilStart: 0 };
  }
  if (month === 1 && day <= 6) return { phase: 'apres', season: year - 1, openUpTo: DAYS, daysUntilStart: 0 };
  const start = `${year}-12-01`;
  return { phase: 'avant', season: year, openUpTo: 0, daysUntilStart: dayNumber(start) - dayNumber(dateKey) };
}

export function isUnlocked(doorDay, dateKey) {
  return doorDay >= 1 && doorDay <= DAYS && doorDay <= adventState(dateKey).openUpTo;
}

/** Ordre d'affichage des portes (mélangé, mais identique pour tout le monde). */
export function doorOrder() {
  return shuffle(createRng('zinzin-avent'), Array.from({ length: DAYS }, (_, i) => i + 1));
}

/* ------------------------------------------------------------------ */
/* Générateurs à graine (réutilisent le moteur d'accords des noms)     */
/* ------------------------------------------------------------------ */

const nouns = NOUNS.map(parseNoun);
const adjs = ADJECTIVES.map(parseAdjective);

const ELF_SUFFIXES = ['des Neiges', 'Grelot', 'Pain-d\'Épice', 'Flocon', 'Guirlande', 'Sucre-d\'Orge', 'Cheminée', 'Bûche', 'Paillette', 'Clochette', 'Moufle', 'Chocolat-Chaud'];
const ELF_JOBS = ['emballeur·se de chaussettes', 'testeur·se officiel·le de luges', 'responsable des rennes enrhumés', 'dresseur·se de guirlandes', 'goûteur·se de bûches', 'contrôleur·se des cheminées étroites', 'chef·fe du rayon papier cadeau', 'réparateur·se de traîneaux turbo'];

/** Nom de lutin à partir d'un prénom (stable). */
export function elfName(firstName) {
  const rng = createRng(`lutin#${String(firstName).trim().toLowerCase()}`);
  const n = pick(rng, nouns);
  const a = pick(rng, adjs);
  return {
    name: `${cap(n.s)} ${cap(agree(a, n.g))} ${pick(rng, ELF_SUFFIXES)}`,
    job: cap(pick(rng, ELF_JOBS)),
    power: `${cap(pick(rng, VERBS))} ${withArticle(pick(rng, nouns), 'p')} en moins de 3 secondes`,
  };
}

/** Cadeau absurde (stable pour une graine donnée). */
export function absurdGift(seed) {
  const rng = createRng(`cadeau#${seed}`);
  const n = pick(rng, nouns);
  return {
    gift: cap(phrase(n, pick(rng, adjs), 's', 'indef')),
    usage: `Idéal pour ${pick(rng, VERBS)} ${withArticle(pick(rng, nouns), 'p')}.`,
    price: `${(1 + Math.floor(rng() * 9999)) / 100} €`.replace('.', ','),
  };
}

/** Menu de réveillon absurde (stable pour une graine donnée). */
export function absurdMenu(seed) {
  const rng = createRng(`menu#${seed}`);
  // Renvoie le plat et un participe accordé avec son genre (« une grenouille nappée »).
  const dish = (participle = '') => {
    const n = pick(rng, nouns);
    const p = participle ? ` ${n.g === 'f' ? `${participle}e` : participle}` : '';
    return `${cap(phrase(n, pick(rng, adjs), 's', 'indef'))}${p}`;
  };
  const sauce = pick(rng, INGREDIENTS);
  return [
    ['Apéritif', `${dish()} et ses toasts`],
    ['Entrée', `${dish('nappé')} ${de(sauce)}`],
    ['Plat', `${dish('farci')} aux marrons`],
    ['Dessert', `Bûche ${withArticle(pick(rng, nouns), 's', 'a')} ${agree(pick(rng, adjs), 'f')}`],
  ];
}

/** Vœu absurde pour la carte du jour. */
export function absurdWish(seed) {
  const rng = createRng(`voeu#${seed}`);
  const n = pick(rng, nouns);
  return `Je te souhaite ${phrase(n, pick(rng, adjs), 's', 'indef')} et une année ${agree(pick(rng, adjs), 'f')} !`;
}

/** Dernière case : bilan. */
export function finalMessage(opened) {
  if (opened >= DAYS) return 'Les 24 cases ouvertes : tu es officiellement un·e lutin·e d\'élite. 🏅';
  if (opened >= 18) return `${opened} cases sur 24 : presque parfait, le Père Noël ferme les yeux. 😉`;
  if (opened >= 8) return `${opened} cases sur 24 : pas mal, il en reste à rattraper !`;
  return `${opened} case${opened > 1 ? 's' : ''} sur 24 : tu peux encore toutes les rattraper jusqu'au 6 janvier.`;
}
