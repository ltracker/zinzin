// Album d'autocollants : succès transverses à toutes les apps.
// Chaque app appelle unlock('id') ou bump('compteur') ; l'album est dans zinzin:album.
// Importable dans Node (tests) : la notification n'est affichée que s'il y a un DOM.
import { load, save } from './storage.js';

const KEY = 'album';
const COUNTERS_KEY = 'album:compteurs';

/** Catalogue. `app` sert au regroupement dans l'album ; `hint` est montré tant que c'est verrouillé. */
export const STICKERS = [
  { id: 'bienvenue', app: 'zinzin', emoji: '👋', name: 'Bienvenue', hint: 'Passer la porte de Zinzin.' },
  { id: 'explorateur', app: 'zinzin', emoji: '🧭', name: 'Explorateur·rice', hint: 'Visiter les 4 apps principales.' },
  { id: 'noctambule', app: 'zinzin', emoji: '🦉', name: 'Noctambule', hint: 'Jouer entre minuit et 5 h du matin.' },
  { id: 'licorne', app: 'zinzin', emoji: '🦄', name: 'Licorne secrète', hint: 'Un code légendaire… ↑↑↓↓' },
  { id: 'cjl-calcul', app: 'ce-jour-la', emoji: '🎂', name: 'Compteur de vie', hint: 'Calculer ton âge à la seconde.' },
  { id: 'cjl-vendredi13', app: 'ce-jour-la', emoji: '🖤', name: 'Vendredi 13', hint: 'Être né·e un vendredi 13.' },
  { id: 'cjl-29fevrier', app: 'ce-jour-la', emoji: '🐸', name: 'Bissextile', hint: 'Être né·e un 29 février.' },
  { id: 'cjl-anniv', app: 'ce-jour-la', emoji: '🥳', name: 'Joyeux anniversaire', hint: 'Passer le jour de ton anniversaire.' },
  { id: 'cjl-ics', app: 'ce-jour-la', emoji: '📅', name: 'Prévoyant·e', hint: 'Ajouter un jalon à ton calendrier.' },
  { id: 'noms-10', app: 'noms', emoji: '🎲', name: 'Baptiseur·se', hint: 'Générer 10 noms.' },
  { id: 'noms-100', app: 'noms', emoji: '🤯', name: 'Usine à noms', hint: 'Générer 100 noms.' },
  { id: 'noms-fav', app: 'noms', emoji: '⭐', name: 'Coup de cœur', hint: 'Mettre un nom en favori.' },
  { id: 'noms-toutes', app: 'noms', emoji: '🌈', name: 'Touche-à-tout', hint: 'Essayer les 7 catégories.' },
  { id: 'jeu-victoire', app: 'jeu', emoji: '🏆', name: 'Première victoire', hint: 'Gagner une partie du jeu du jour.' },
  { id: 'jeu-un-coup', app: 'jeu', emoji: '🎯', name: 'Du premier coup', hint: 'Trouver la réponse au premier essai.' },
  { id: 'jeu-serie-3', app: 'jeu', emoji: '🔥', name: 'Sur sa lancée', hint: 'Une série de 3 jours.' },
  { id: 'jeu-serie-7', app: 'jeu', emoji: '🌋', name: 'Inarrêtable', hint: 'Une série de 7 jours.' },
  { id: 'jeu-double', app: 'jeu', emoji: '🎬', name: 'Le doublé', hint: 'Gagner les deux modes le même jour.' },
  { id: 'jeu-defaite', app: 'jeu', emoji: '🫠', name: 'Beau joueur', hint: 'Perdre une partie (ça arrive).' },
  { id: 'roue-1', app: 'roue', emoji: '🎡', name: 'Premier tour', hint: 'Faire tourner la roue.' },
  { id: 'roue-100', app: 'roue', emoji: '🌀', name: 'Tête qui tourne', hint: 'Faire tourner la roue 100 fois.' },
  { id: 'roue-liste', app: 'roue', emoji: '💾', name: 'Organisé·e', hint: 'Enregistrer une liste perso.' },
  { id: 'roue-poids', app: 'roue', emoji: '⚖️', name: 'Tricheur·se assumé·e', hint: 'Donner un poids de 10 à une option.' },
  { id: 'avent-1', app: 'avent', emoji: '🎄', name: 'Première case', hint: 'Ouvrir une case du calendrier de l\'Avent.' },
  { id: 'avent-24', app: 'avent', emoji: '🌟', name: 'Lutin·e d\'élite', hint: 'Ouvrir les 24 cases.' },
  { id: 'pns-tirage', app: 'pere-noel-secret', emoji: '🎅', name: 'Grand organisateur', hint: 'Organiser un Père Noël secret.' },
  { id: 'pns-revele', app: 'pere-noel-secret', emoji: '🎁', name: 'Paquet ouvert', hint: 'Découvrir à qui tu offres.' },
  { id: 'album-10', app: 'zinzin', emoji: '📒', name: 'Collectionneur·se', hint: 'Obtenir 10 autocollants.' },
  { id: 'album-20', app: 'zinzin', emoji: '📚', name: 'Archiviste', hint: 'Obtenir 20 autocollants.' },
  { id: 'album-complet', app: 'zinzin', emoji: '👑', name: 'Zinzin suprême', hint: 'Compléter tout l\'album.' },
];

export const APP_LABELS = {
  zinzin: 'Zinzin', 'ce-jour-la': 'Ce jour-là', noms: 'Noms absurdes', jeu: 'Le jeu du jour',
  roue: 'La roue', avent: 'Calendrier de l\'Avent', 'pere-noel-secret': 'Père Noël secret',
};

const byId = new Map(STICKERS.map((s) => [s.id, s]));

/** Notification par défaut (toast), seulement dans un navigateur. */
let notify = async (sticker) => {
  if (typeof document === 'undefined') return;
  const { toast } = await import('./ui.js');
  toast(`${sticker.emoji} Nouvel autocollant : ${sticker.name} !`, 3200);
};
export function setNotifier(fn) { notify = fn; }

/** { id: horodatage } des autocollants obtenus. */
export function unlockedMap() {
  return load(KEY, {});
}

export function isUnlocked(id) {
  return Boolean(unlockedMap()[id]);
}

/** Débloque un autocollant. Renvoie true si c'est une nouveauté. */
export function unlock(id, now = Date.now()) {
  const s = byId.get(id);
  if (!s) throw new Error(`Autocollant inconnu : ${id}`);
  const map = unlockedMap();
  if (map[id]) return false;
  map[id] = now;
  save(KEY, map);
  notify(s);
  // Méta-succès
  const n = Object.keys(map).length;
  if (n >= 10 && !map['album-10']) unlock('album-10', now);
  if (n >= 20 && !map['album-20']) unlock('album-20', now);
  if (Object.keys(unlockedMap()).length >= STICKERS.length - 1 && !unlockedMap()['album-complet']) unlock('album-complet', now);
  return true;
}

/** Incrémente un compteur et débloque les paliers atteints : bump('noms', 1, { 10: 'noms-10', 100: 'noms-100' }). */
export function bump(counter, by = 1, thresholds = {}) {
  const c = load(COUNTERS_KEY, {});
  c[counter] = (c[counter] || 0) + by;
  save(COUNTERS_KEY, c);
  for (const [n, id] of Object.entries(thresholds)) if (c[counter] >= Number(n)) unlock(id);
  return c[counter];
}

/** Ajoute un élément à un ensemble mémorisé et renvoie sa taille (ex. catégories essayées). */
export function collect(setName, value) {
  const c = load(COUNTERS_KEY, {});
  const set = new Set(c[setName] || []);
  set.add(value);
  c[setName] = [...set];
  save(COUNTERS_KEY, c);
  return set.size;
}

/** Succès communs à toutes les pages : visite, apps explorées, heure tardive. */
export function trackVisit(app, date = new Date()) {
  unlock('bienvenue');
  if (['ce-jour-la', 'noms', 'jeu', 'roue'].includes(app) && collect('apps', app) >= 4) unlock('explorateur');
  if (date.getHours() < 5) unlock('noctambule');
}

/** Progression : { got, total, percent }. */
export function progress() {
  const got = STICKERS.filter((s) => isUnlocked(s.id)).length;
  return { got, total: STICKERS.length, percent: Math.round((got / STICKERS.length) * 100) };
}
