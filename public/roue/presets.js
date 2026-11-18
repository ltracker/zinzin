// Listes prêtes à l'emploi pour la roue.
const P = ['#ffd23f', '#ff6fae', '#3ddc97', '#4cc3ff', '#ff7a45', '#b28dff', '#ffe08a', '#7ef0c4', '#ffa3c9', '#9be3ff'];
const list = (title, emoji, labels) => ({
  title,
  emoji,
  options: labels.map((l, i) => (Array.isArray(l) ? { label: l[0], weight: l[1], color: P[i % P.length] } : { label: l, weight: 1, color: P[i % P.length] })),
});

export const PRESETS = [
  list('On mange quoi ?', '🍕', ['Pizza', 'Sushis', 'Burger', 'Crêpes', 'Raclette', 'Salade (courage)', 'Pâtes', 'Tacos', 'Restes du frigo']),
  list('Qui fait la vaisselle ?', '🧽', ['Moi', 'Toi', 'Le chat', ['Celui qui a cuisiné', 1], ['Celui qui n\'a pas cuisiné', 3], 'Personne, on commande']),
  list('Film ou série ?', '🍿', [['Film', 2], ['Série', 2], ['Un épisode… ou six', 1], ['Documentaire animalier', 1]]),
  list('Action ou vérité', '🎲', [['Action', 1], ['Vérité', 1]]),
  list('On fait quoi ce week-end ?', '🌤️', ['Balade', 'Musée', 'Jeux de société', 'Cinéma', 'Sieste olympique', 'Pique-nique', 'Bricolage', 'Rien, et c\'est très bien']),
  list('Oui, non, peut-être', '🤔', [['Oui', 2], ['Non', 2], ['Peut-être', 1], ['Demande à ta mère', 1]]),
  list('Pile ou face', '🪙', ['Pile', 'Face']),
  list('Quel sport aujourd\'hui ?', '🏃', ['Course', 'Vélo', 'Yoga', 'Natation', 'Pompes devant la télé', 'Marche jusqu\'au frigo']),
];
