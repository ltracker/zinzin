// Générateur de noms absurdes — logique pure (testée par tests/names.test.js).
// Moteur de gabarits avec accords en genre et en nombre, articles et élisions.
import {
  NOUNS, ADJECTIVES, FIRST_NAMES, INGREDIENTS, TECH, PLACES, MUSIC_STYLES, CREATURE_STARTS,
  CREATURE_ENDS, VERBS, VILLAIN_TITLES, STARTUP_SUFFIXES, BOAT_TYPES, MEASURES,
} from './dictionnaires.js';
import { createRng, pick, int, chance } from '../shared/rng.js';

/* ------------------------------------------------------------------ */
/* Analyse des dictionnaires                                           */
/* ------------------------------------------------------------------ */

/** 'm:chou/choux' → { s: 'chou', p: 'choux', g: 'm', elide: false } */
export function parseNoun(entry) {
  const m = /^([mf]):(!?)(.+)$/.exec(entry);
  if (!m) throw new Error(`Nom mal formé : ${entry}`);
  const [s, p] = m[3].split('/');
  return { s, p: p || pluralize(s), g: m[1], elide: !m[2] && startsWithVowel(s) };
}

/** 'fou/folle/fous/folles' | 'furieux' | 'fluo*' → { m, f, mp, fp } */
export function parseAdjective(entry) {
  if (entry.endsWith('*')) {
    const w = entry.slice(0, -1);
    return { m: w, f: w, mp: w, fp: w };
  }
  const [m, f, mp, fp] = entry.split('/');
  const fem = f || feminize(m);
  return { m, f: fem, mp: mp || pluralizeAdj(m), fp: fp || `${fem}s` };
}

export function startsWithVowel(word) {
  return /^[aeiouyàâäéèêëîïôöûüh]/i.test(word) && !/^y[aeiou]/i.test(word);
}

/** Pluriel régulier d'un nom. */
export function pluralize(word) {
  if (/[sxz]$/.test(word)) return word;
  if (/(eau|au|eu)$/.test(word) && !/(pneu|bleu)$/.test(word)) return `${word}x`;
  if (/al$/.test(word) && !/(bal|carnaval|festival|chacal|régal)$/.test(word)) return word.replace(/al$/, 'aux');
  return `${word}s`;
}

function pluralizeAdj(word) {
  if (/[sx]$/.test(word)) return word;
  if (/eau$/.test(word)) return `${word}x`;
  if (/al$/.test(word) && !/(banal|fatal|naval|natal)$/.test(word)) return word.replace(/al$/, 'aux');
  return `${word}s`;
}

/** Féminin régulier d'un adjectif. */
export function feminize(word) {
  if (/e$/.test(word)) return word;
  if (/eux$/.test(word)) return word.replace(/eux$/, 'euse');
  if (/if$/.test(word)) return word.replace(/if$/, 'ive');
  if (/el$/.test(word)) return `${word}le`;
  if (/(ien|éen)$/.test(word)) return `${word}ne`;
  if (/on$/.test(word)) return `${word}ne`;
  if (/er$/.test(word)) return word.replace(/er$/, 'ère');
  if (/et$/.test(word)) return `${word}te`;
  return `${word}e`;
}

const nouns = NOUNS.map(parseNoun);
const adjectives = ADJECTIVES.map(parseAdjective);
const tech = TECH.map(parseNoun);
const titles = VILLAIN_TITLES.map((e) => { const n = parseNoun(e); return { ...n, name: n.s }; });

/* ------------------------------------------------------------------ */
/* Accords                                                             */
/* ------------------------------------------------------------------ */

/** Forme d'un adjectif accordée en genre ('m'|'f') et nombre ('s'|'p'). */
export function agree(adj, g, n = 's') {
  const a = typeof adj === 'string' ? parseAdjective(adj) : adj;
  if (n === 'p') return g === 'f' ? a.fp : a.mp;
  return g === 'f' ? a.f : a.m;
}

/** Forme du nom selon le nombre. */
export const nounForm = (noun, n = 's') => (n === 'p' ? noun.p : noun.s);

/**
 * Article + nom. type : 'def' (le/la/l'/les), 'indef' (un/une/des), 'de' (du/de la/de l'/des)
 * ou 'a' (au/à la/à l'/aux).
 */
export function withArticle(noun, n = 's', type = 'def') {
  const word = nounForm(noun, n);
  if (n === 'p') return `${{ def: 'les', indef: 'des', de: 'des', a: 'aux' }[type]} ${word}`;
  if (type === 'indef') return `${noun.g === 'f' ? 'une' : 'un'} ${word}`;
  if (noun.elide) return `${{ def: "l'", de: "de l'", a: "à l'" }[type]}${word}`;
  if (noun.g === 'f') return `${{ def: 'la', de: 'de la', a: 'à la' }[type]} ${word}`;
  return `${{ def: 'le', de: 'du', a: 'au' }[type]} ${word}`;
}

/** Groupe nominal complet : article + nom + adjectif accordé. */
export function phrase(noun, adj, n = 's', type = 'def') {
  return `${withArticle(noun, n, type)} ${agree(adj, noun.g, n)}`;
}

/** « de » + mot avec élision (de sirop / d'eau). */
export const de = (word) => (startsWithVowel(word) && !/^h/i.test(word) ? `d'${word}` : `de ${word}`);

/** « de » + ville : de Brest, d'Angers, du Mans, des Sables-d'Olonne, de La Rochelle. */
export function fromPlace(place) {
  if (/^Le /.test(place)) return `du ${place.slice(3)}`;
  if (/^Les /.test(place)) return `des ${place.slice(4)}`;
  return de(place);
}

/** « à » + ville : à Brest, au Mans, aux Sables-d'Olonne, à La Rochelle. */
export function inPlace(place) {
  if (/^Le /.test(place)) return `au ${place.slice(3)}`;
  if (/^Les /.test(place)) return `aux ${place.slice(4)}`;
  return `à ${place}`;
}

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Majuscule à chaque mot significatif (style nom de groupe), sauf petits mots. */
export function titleCase(s) {
  const small = new Set(['de', 'du', 'des', 'et', 'la', 'le', 'les', 'à', 'au', 'aux', "l'", "d'", 'en', 'sur', 'sous']);
  return s.split(' ').map((w, i) => {
    if (i > 0 && small.has(w.toLowerCase())) return w.toLowerCase();
    if (/^[ld]'/i.test(w)) return w.slice(0, 2).toLowerCase() + cap(w.slice(2));
    return cap(w);
  }).join(' ').replace(/^([ld]')/, (m) => m.toUpperCase());
}

const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ------------------------------------------------------------------ */
/* Générateurs par catégorie                                           */
/* ------------------------------------------------------------------ */

const N = (rng) => pick(rng, nouns);
const A = (rng) => pick(rng, adjectives);

function rock(rng) {
  const n1 = N(rng), a1 = A(rng);
  const name = pick(rng, [
    () => titleCase(`les ${nounForm(n1, 'p')} ${agree(a1, n1.g, 'p')}`),
    () => titleCase(`${n1.s} ${agree(a1, n1.g)}`),
    () => titleCase(`${withArticle(n1)} ${pick(rng, ["de l'apocalypse", 'du lundi matin', 'de la mort qui tue', 'du néant', 'de minuit'])}`),
    () => titleCase(`${pick(rng, FIRST_NAMES)} et les ${nounForm(n1, 'p')} ${agree(a1, n1.g, 'p')}`),
    () => titleCase(`${nounForm(n1, 'p')} ${pick(rng, ['contre', 'versus', 'sans', 'pour'])} ${nounForm(N(rng), 'p')}`),
  ])();
  const an = N(rng), aa = A(rng);
  const album = cap(pick(rng, [
    () => phrase(an, aa),
    () => `${nounForm(an, 'p')} et ${nounForm(N(rng), 'p')}`,
    () => `${pick(rng, ['Requiem pour', 'Ballade pour', 'Tango pour'])} ${withArticle(an, 's', pick(rng, ['indef', 'def']))} ${agree(aa, an.g)}`,
    () => `${pick(rng, ['Ode', 'Hymne', 'Lettre ouverte'])} ${withArticle(an, 's', 'a')} ${agree(aa, an.g)}`,
  ])());
  const year = int(rng, 1968, 2026);
  return {
    name,
    emoji: '🎸',
    lines: [
      ['Premier album', `« ${album} » (${year})`],
      ['Style', `${cap(pick(rng, MUSIC_STYLES))}, version ${agree(A(rng), 'f')}`],
      ['Origine', `Formé ${inPlace(pick(rng, PLACES))} dans un garage qui sentait ${withArticle(N(rng), 's', 'def')}`],
    ],
  };
}

function startup(rng) {
  const n1 = N(rng);
  const root = cap(stripAccents(n1.s).replace(/[^a-zA-Z]/g, '').replace(/e?s?$/, ''));
  const name = pick(rng, [
    () => `${root}${pick(rng, STARTUP_SUFFIXES)}`,
    () => `${root}${pick(rng, STARTUP_SUFFIXES)}${chance(rng, 0.3) ? '.io' : ''}`,
    () => `${cap(stripAccents(pick(rng, adjectives).m).replace(/[^a-zA-Z]/g, '').slice(0, 5))}${root}`,
  ])();
  const t = pick(rng, tech), a = A(rng), n2 = N(rng);
  const slogan = pick(rng, [
    () => `L'Uber ${withArticle(n1, 's', 'de')}, mais avec ${withArticle(t)}.`,
    () => `On disrupte le marché ${withArticle(n1, 's', 'de')} grâce ${withArticle(t, 's', 'a')}.`,
    () => `${cap(phrase(n1, a, 's', 'indef'))}, ${n1.g === 'f' ? 'livrée' : 'livré'} en 10 minutes.`,
    () => `Rendre ${withArticle(n1, 'p')} ${agree(a, n1.g, 'p')} à nouveau.`,
    () => `Et si ${withArticle(n1, 's')} était ${n2.g === 'f' ? 'la nouvelle' : n2.elide ? 'le nouvel' : 'le nouveau'} ${n2.s} ?`,
  ])();
  const raise = int(rng, 2, 480);
  return {
    name,
    emoji: '🚀',
    lines: [
      ['Slogan', slogan],
      ['Levée de fonds', `${raise} M€ auprès ${de(`${cap(N(rng).s)} Capital`)}`],
      ['Recrute', `un·e Chief ${cap(stripAccents(pick(rng, nouns).s))} Officer (télétravail ${inPlace(pick(rng, PLACES))})`],
    ],
  };
}

function creature(rng) {
  const name = `${pick(rng, CREATURE_STARTS)}${pick(rng, CREATURE_ENDS)}`;
  const t1 = N(rng), t2 = N(rng);
  const power = () => {
    const n = N(rng);
    return `${cap(pick(rng, VERBS))} ${withArticle(n, 'p')} ${agree(A(rng), n.g, 'p')}`;
  };
  const weak = N(rng), wa = A(rng);
  return {
    name,
    emoji: pick(rng, ['🐾', '🥚', '✨', '🌀', '🔥', '💧', '🌱', '⚡']),
    lines: [
      ['Type', `${cap(t1.s)} / ${cap(t2.s)}`],
      ['Pouvoirs', `${power()} · ${power()}`],
      ['Gabarit', `${int(rng, 3, 240)} cm, ${String(int(rng, 1, 950) / 10).replace('.', ',')} kg, ${pick(rng, ['très câlin', 'un peu mordant', 'imprévisible', 'végétarien', 'nocturne', 'bavard'])}`],
      ['Faiblesse', cap(phrase(weak, wa))],
    ],
  };
}

function cocktail(rng) {
  const n1 = N(rng), a1 = A(rng);
  const name = pick(rng, [
    () => titleCase(phrase(n1, a1)),
    () => titleCase(`${withArticle(n1)} ${de(pick(rng, FIRST_NAMES))}`),
    () => titleCase(`${n1.s} ${agree(a1, n1.g)} on the rocks`),
  ])();
  const ingredients = new Set();
  while (ingredients.size < 3) ingredients.add(pick(rng, INGREDIENTS));
  const recipe = [...ingredients].map((i) => `${pick(rng, MEASURES)} ${de(i)}`).join(', ');
  const deco = N(rng);
  const effect = N(rng);
  return {
    name,
    emoji: pick(rng, ['🍹', '🍸', '🥂', '🧉', '🍷']),
    lines: [
      ['Recette', `${cap(recipe)}.`],
      ['Décoration', cap(phrase(deco, A(rng), 's', 'indef'))],
      ['Préparation', pick(rng, ['Secouer énergiquement en chantant.', 'Remuer dans le sens inverse des aiguilles.', 'Servir dans une botte en caoutchouc.', 'Laisser reposer une nuit sous la Lune.', 'Agiter, pas remuer, puis s\'excuser.'])],
      ['Effet secondaire', `Donne envie ${de(pick(rng, VERBS))} ${withArticle(effect, 'p')}.`],
    ],
  };
}

function villain(rng) {
  const t = pick(rng, titles);
  const n1 = N(rng), a1 = A(rng);
  const name = pick(rng, [
    () => `${t.name} ${cap(n1.s)}`,
    () => `${t.name} ${cap(n1.s)} ${cap(agree(a1, t.g))}`,
    () => titleCase(`${withArticle(t)} ${withArticle(n1, 'p', 'de')} ${agree(a1, n1.g, 'p')}`),
    () => `${pick(rng, FIRST_NAMES)} ${cap(n1.s)}-${pick(rng, ['de-Fer', 'de-Feu', 'qui-Pique', 'des-Ombres', 'Sans-Pitié'])}`,
  ])();
  const victims = N(rng), goal = N(rng), lair = N(rng);
  return {
    name,
    emoji: pick(rng, ['🦹', '😈', '🕴️', '🧪', '💀']),
    lines: [
      ['Plan diabolique', `${cap(pick(rng, VERBS))} ${victims.g === 'f' ? 'toutes' : 'tous'} ${withArticle(victims, 'p')} ${fromPlace(pick(rng, PLACES))} pour devenir ${withArticle(goal)} ${agree(A(rng), goal.g)} suprême.`],
      ['Repaire', `${cap(phrase(lair, A(rng), 's', 'indef'))} sous ${pick(rng, PLACES)}`],
      ['Point faible', `${cap(withArticle(N(rng), 'p'))}. Et les lundis.`],
    ],
  };
}

function boat(rng) {
  const n1 = N(rng), a1 = A(rng);
  const roman = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'XII'];
  const name = pick(rng, [
    () => cap(phrase(n1, a1)),
    () => `${pick(rng, FIRST_NAMES)} ${pick(rng, roman)}`,
    () => cap(`${withArticle(n1)} ${de(pick(rng, FIRST_NAMES))}`),
    () => cap(`${withArticle(n1)} ${fromPlace(pick(rng, PLACES))}`),
  ])();
  const cargo = N(rng), motto1 = N(rng), motto2 = N(rng);
  const motto = pick(rng, [
    () => `Jamais sans ${n1.g === 'f' ? 'ma' : 'mon'} ${n1.s}.`,
    () => `Plus ${agree(A(rng), 'm')} que jamais.`,
    () => `Ni ${motto1.s}, ni ${motto2.s}.`,
    () => `Toujours ${agree(A(rng), 'm')}, jamais ${agree(A(rng), 'm')}.`,
  ])();
  return {
    name,
    emoji: pick(rng, ['⛵', '🚤', '🛥️', '🚢', '🛶']),
    lines: [
      ['Type', cap(pick(rng, BOAT_TYPES))],
      ["Port d'attache", pick(rng, PLACES)],
      ['Cargaison', `${int(rng, 2, 900)} tonnes ${de(nounForm(cargo, 'p'))} ${agree(A(rng), cargo.g, 'p')}`],
      ['Devise', `« ${motto} »`],
    ],
  };
}

function wifi(rng) {
  const n1 = N(rng), a1 = A(rng);
  const ssid = (s) => stripAccents(s).replace(/[' ]/g, '_');
  const name = pick(rng, [
    () => ssid(`Pas_de_wifi_pour_les_${cap(nounForm(n1, 'p'))}`),
    () => `FBI_Camionnette_${int(rng, 2, 999)}`,
    () => ssid(`${pick(rng, FIRST_NAMES)}_${cap(n1.s)}_5G`),
    () => ssid(`${cap(n1.s)}_${cap(agree(a1, n1.g))}`),
    () => ssid(`Livebox-${cap(n1.s)}`),
    () => ssid(`Chez_${pick(rng, FIRST_NAMES)}_pas_chez_toi`),
    () => ssid(`Virus_${cap(n1.s)}_Gratuit`),
  ])();
  const pw = `${cap(stripAccents(agree(A(rng), 'm')))}${cap(stripAccents(N(rng).s).replace(/[^a-zA-Z]/g, ''))}${int(rng, 10, 99)}${pick(rng, ['!', '?', '#', '*'])}`;
  return {
    name,
    emoji: '📶',
    lines: [
      ['Mot de passe', pw],
      ['Débit', `${int(rng, 1, 999)} ${pick(rng, ['kbit/s', 'Mbit/s', 'pigeons voyageurs par heure'])} ${pick(rng, ['les jours de pluie', 'quand le micro-ondes est éteint', 'en levant le bras gauche', 'après minuit'])}`],
      ['Portée', `Jusqu'${withArticle(N(rng), 's', 'a')} du voisin`],
    ],
  };
}

/* ------------------------------------------------------------------ */
/* API publique                                                        */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  { id: 'rock', label: 'Groupe de rock', emoji: '🎸', gen: rock },
  { id: 'startup', label: 'Startup tech', emoji: '🚀', gen: startup },
  { id: 'creature', label: 'Créature de poche', emoji: '🐾', gen: creature },
  { id: 'cocktail', label: 'Cocktail', emoji: '🍹', gen: cocktail },
  { id: 'vilain', label: 'Super-vilain', emoji: '🦹', gen: villain },
  { id: 'bateau', label: 'Bateau', emoji: '⛵', gen: boat },
  { id: 'wifi', label: 'Nom de wifi', emoji: '📶', gen: wifi },
];

/**
 * Génère un nom. Même catégorie + même graine → même résultat.
 * @param {string} categoryId
 * @param {string|number} seed  prénom, mot ou nombre
 */
export function generate(categoryId, seed) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) throw new Error(`Catégorie inconnue : ${categoryId}`);
  const rng = createRng(`${String(seed).trim().toLowerCase()}#${categoryId}`);
  const out = cat.gen(rng);
  return { category: cat.id, categoryLabel: cat.label, seed: String(seed), ...out };
}

/** Texte brut d'un résultat (pour la copie). */
export function toText(result) {
  return [`${result.emoji} ${result.name}`, ...result.lines.map(([k, v]) => `${k} : ${v}`)].join('\n');
}


/* ------------------------------------------------------------------ */
/* Étape 13 : « ton nom de pirate / catcheur / elfe » (prénom + date)   */
/* ------------------------------------------------------------------ */

const WRESTLER_TITLES = ['The', 'El', 'Mister', 'Lady', 'Big', 'Iron'];
const ELF_ENDINGS = ['iel', 'wen', 'ion', 'ael', 'ith', 'or', 'ïa', 'ëa', 'anor', 'ilwë'];
const ELF_PLACES = ['du Bois-Dormant', 'de la Lune-Pâle', 'de la Rivière-Claire', "de la Feuille-d'Argent", 'de la Brume-Douce', "de l'Étoile-Filante", 'du Val-Tranquille', 'des Monts-Brumeux'];

/** « de la Tartiflette », « du Pingouin », « de l'Ananas » (nom en majuscule). */
const fromNoun = (n) => { const w = withArticle(n, 's', 'de'); return w.slice(0, w.length - n.s.length) + cap(n.s); };

/** Trois noms de personnage stables pour un prénom et une date de naissance. */
export function personaNames(firstName, dateStr = '') {
  const who = cap(String(firstName).trim().replace(/\s+/g, ' ')) || 'Anonyme';
  const base = `${who.toLowerCase()}#${dateStr}`;
  const r1 = createRng(`pirate#${base}`);
  const n1 = pick(r1, nouns);
  const pirate = pick(r1, [
    () => `Capitaine ${who} ${fromNoun(n1)}`,
    () => `${who} Barbe-${cap(agree(pick(r1, adjectives), 'f'))}`,
    () => `${who} le Terrible ${fromNoun(n1)}`,
    () => `${who} ${pick(r1, ['Œil', 'Jambe', 'Main', 'Dent'])}-de-${cap(n1.s)}`,
  ])();
  const r2 = createRng(`catcheur#${base}`);
  const n2 = pick(r2, nouns);
  const catcheur = `${pick(r2, WRESTLER_TITLES)} ${cap(n2.s)} ${cap(agree(pick(r2, adjectives), n2.g))}`;
  const r3 = createRng(`elfe#${base}`);
  const root = stripAccents(who).replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'Ael';
  const elfe = `${cap(root.toLowerCase())}${pick(r3, ELF_ENDINGS)} ${pick(r3, ELF_PLACES)}`;
  return { pirate, catcheur, elfe };
}
