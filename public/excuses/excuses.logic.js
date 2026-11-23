// Générateur d'excuses bidon — logique pure.
import { createRng, pick, int } from '../shared/rng.js';
import { NOUNS, ADJECTIVES, VERBS, FIRST_NAMES, PLACES } from '../noms/dictionnaires.js';
import { parseNoun, parseAdjective, phrase, withArticle, cap, fromPlace } from '../noms/names.logic.js';

const nouns = NOUNS.map(parseNoun);
const adjs = ADJECTIVES.map(parseAdjective);

export const CONTEXTS = [
  { id: 'retard', emoji: '⏰', label: 'Être en retard', intro: 'Désolé·e pour le retard,' },
  { id: 'devoirs', emoji: '📚', label: 'Devoirs pas faits', intro: 'Je n\'ai pas pu faire mes devoirs :' },
  { id: 'reunion', emoji: '💼', label: 'Rater une réunion', intro: 'Je n\'ai pas pu assister à la réunion :' },
  { id: 'anniversaire', emoji: '🎂', label: 'Anniversaire oublié', intro: 'Je n\'ai pas oublié ton anniversaire, c\'est juste que' },
  { id: 'vaisselle', emoji: '🍽️', label: 'Vaisselle pas faite', intro: 'Je n\'ai pas fait la vaisselle parce que' },
  { id: 'soiree', emoji: '🎉', label: 'Annuler une soirée', intro: 'Je ne vais pas pouvoir venir ce soir :' },
];

const CAUSES = [
  (r) => { const n = pick(r, nouns); return `${phrase(n, pick(r, adjs), 's', 'indef')} s'est ${n.g === 'f' ? 'coincée' : 'coincé'} dans ma boîte aux lettres`; },
  (r) => `mon voisin ${pick(r, FIRST_NAMES)} m'a demandé de l'aider à ${pick(r, VERBS)} ${withArticle(pick(r, nouns), 'p')}`,
  (r) => `${withArticle(pick(r, nouns), 'p')} de mon quartier ont fait grève`,
  (r) => `j'ai été retenu·e par une délégation officielle ${fromPlace(pick(r, PLACES))}`,
  (r) => `mon GPS m'a envoyé·e ${pick(r, ['au Havre', 'à Romorantin', 'dans un champ de betteraves', 'chez ma tante'])}`,
  (r) => `j'ai dû ${pick(r, VERBS)} ${withArticle(pick(r, nouns), 'p')} en urgence`,
  (r) => `un pigeon voyageur m'a livré ${phrase(pick(r, nouns), pick(r, adjs), 's', 'indef')} au lieu de mon courrier`,
  (r) => `mon horoscope m'interdisait formellement de sortir avant ${int(r, 11, 17)} h`,
  (r) => `${phrase(pick(r, nouns), pick(r, adjs), 's', 'def')} a mangé mon réveil`,
];
const PROOFS = [
  'J\'ai une photo floue qui le prouve.',
  'Un témoin peut confirmer (il s\'appelle Gérard et il est très occupé).',
  'C\'est passé aux infos régionales, il me semble.',
  'Je peux te montrer la facture.',
  'Demande à mon chat, il était là.',
  'Je ne peux pas en dire plus, c\'est confidentiel.',
];

/** Excuse pour un contexte et une graine. */
export function excuse(contextId, seed) {
  const ctx = CONTEXTS.find((c) => c.id === contextId) || CONTEXTS[0];
  const r = createRng(`excuse#${ctx.id}#${seed}`);
  return {
    context: ctx,
    // « que un » → « qu'un » (élision après « c'est juste que », « parce que »)
    text: `${ctx.intro} ${pick(r, CAUSES)(r)}. ${pick(r, PROOFS)}`.replace(/\bque ([aeiouyàâéèêëîïôû])/gi, "qu'$1"),
    credibility: int(r, 0, 42),
  };
}

export { cap };
