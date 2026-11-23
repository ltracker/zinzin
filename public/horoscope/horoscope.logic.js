// Horoscope absurde — logique pure (tests/apps12.test.js). Même signe + même jour = même horoscope pour tous.
import { createRng, pick, int } from '../shared/rng.js';
import { NOUNS, ADJECTIVES, VERBS, FIRST_NAMES, PLACES } from '../noms/dictionnaires.js';
import { parseNoun, parseAdjective, phrase, withArticle, agree, cap, inPlace, de } from '../noms/names.logic.js';
import { ZODIAC } from '../ce-jour-la/life.logic.js';

export const SIGNS = ZODIAC.map((z, i) => ({ ...z, index: i }));
const nouns = NOUNS.map(parseNoun);
const adjs = ADJECTIVES.map(parseAdjective);

const COLORS = ['jaune poussin', 'vert pistache', 'bleu piscine', 'rose bonbon', 'orange carotte', 'violet aubergine', 'gris souris', 'rouge tomate', 'beige mélancolique', 'turquoise lagon'];
const MOODS = ['Radieux·se', 'Pétillant·e', 'Un peu brumeux·se', 'Imprévisible', 'Royal·e', 'Zen comme une huître', 'Survolté·e', 'Moelleux·se'];

const LOVE = [
  (r) => `Un regard échangé près ${withArticle(pick(r, nouns), 's', 'de')} pourrait tout changer. Ou pas.`,
  (r) => `Vénus te conseille d'offrir ${phrase(pick(r, nouns), pick(r, adjs), 's', 'indef')} à la personne qui te plaît.`,
  (r) => `Ton cœur bat pour ${pick(r, FIRST_NAMES)}, mais ${pick(r, FIRST_NAMES)} n'a rien remarqué. Patience.`,
  (r) => `Une déclaration enflammée t'attend… probablement par SMS, avec beaucoup trop d'émojis.`,
  (r) => `En amour, sois comme ${phrase(pick(r, nouns), pick(r, adjs), 's', 'def')} : imprévisible mais attachant·e.`,
];
const WORK = [
  (r) => `Une réunion surprise sur le thème ${withArticle(pick(r, nouns), 's', 'de')} t'attend vers ${int(r, 9, 17)} h ${String(int(r, 0, 5) * 10).padStart(2, '0')}.`,
  (r) => `Ton ou ta collègue va te demander de ${pick(r, VERBS)} ${withArticle(pick(r, nouns), 'p')}. Accepte : c'est le destin.`,
  (r) => `Mercure rétrograde dans ta boîte mail : ${int(r, 12, 99)} messages non lus, dont un important.`,
  (r) => `Une promotion est possible si tu cesses de ${pick(r, VERBS)} ${withArticle(pick(r, nouns), 'p')} pendant les heures de bureau.`,
  (r) => { const n = pick(r, nouns); return `Excellente journée pour lancer une startup ${de(n.p)} ${agree(pick(r, adjs), n.g, 'p')}.`; },
];
const HEALTH = [
  (r) => `Bois ${int(r, 2, 9)} verres d'eau et évite ${withArticle(pick(r, nouns), 'p')} après 18 h.`,
  (r) => `Ton corps réclame une sieste de ${int(r, 7, 42)} minutes, idéalement sous ${withArticle(pick(r, nouns), 's', 'indef')}.`,
  (r) => `Fais ${int(r, 3, 30)} pompes, ou au moins pense très fort à en faire.`,
  (r) => `Une petite marche ${inPlace(pick(r, PLACES))} te ferait le plus grand bien (même en pensée).`,
  (r) => { const n = pick(r, nouns); return `Attention aux courants d'air et ${withArticle(n, 'p', 'a')} trop ${agree(pick(r, adjs), n.g, 'p')}.`; },
];
const ADVICE = [
  (r) => { const n = pick(r, nouns); return `Ne fais jamais confiance ${withArticle(n, 's', 'a')} ${agree(pick(r, adjs), n.g)}.`; },
  (r) => `Aujourd'hui, ose ${pick(r, VERBS)} ${withArticle(pick(r, nouns), 'p')}.`,
  (r) => `Les astres recommandent de porter une chaussette ${pick(r, ['dépareillée', 'à pois', 'fluo', 'à l\'envers'])}.`,
  (r) => `Un·e inconnu·e prénommé·e ${pick(r, FIRST_NAMES)} détient la clé de ton bonheur. Bonne chance.`,
  (r) => `Ton objet porte-bonheur du jour : ${phrase(pick(r, nouns), pick(r, adjs), 's', 'indef')}.`,
];

/** Horoscope du jour pour un signe (0-11) et une clé de date 'AAAA-MM-JJ'. */
export function horoscope(signIndex, dateKey) {
  const r = createRng(`horoscope#${dateKey}#${signIndex}`);
  return {
    sign: SIGNS[signIndex],
    mood: pick(r, MOODS),
    stars: { amour: int(r, 1, 5), travail: int(r, 1, 5), sante: int(r, 1, 5) },
    amour: cap(pick(r, LOVE)(r)),
    travail: cap(pick(r, WORK)(r)),
    sante: cap(pick(r, HEALTH)(r)),
    conseil: cap(pick(r, ADVICE)(r)),
    chiffre: int(r, 1, 99),
    couleur: pick(r, COLORS),
  };
}

export const starsText = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
