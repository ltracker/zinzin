// Contenu des 24 cases. Types :
//   anecdote { text }          blague { question, answer }       defi { text }
//   lutin    (générateur : nom de lutin à partir d'un prénom)
//   cadeau / menu (générateurs à graine = jour + saison)       carte (carte de vœux PNG)
//   quiz { items: [{ emojis, answer }] }   chrono (compter 10 s dans sa tête)
//   lien { text, href, cta }   final (bilan + confettis)
// Les anecdotes sont choisies parmi des faits bien établis.

export const CALENDAR = [
  { day: 1, type: 'anecdote', emoji: '🌲', title: 'Le sapin, une invention alsacienne ?', text: "L'une des plus anciennes mentions d'arbres de Noël se trouve dans un registre de Sélestat, en Alsace, daté de 1521. La ville payait des gardes pour surveiller les sapins coupés dans la forêt… déjà la crainte des voleurs de sapin." },
  { day: 2, type: 'blague', emoji: '🎄', title: 'Blague de sapin', question: 'Quel est le comble pour un sapin de Noël ?', answer: 'Se faire planter le 26 décembre.' },
  { day: 3, type: 'lien', emoji: '🎡', title: 'La roue des desserts', text: "Bûche, papillotes ou les deux ? Pas de dispute cette année : c'est la roue qui décide.", cta: 'Faire tourner la roue', href: 'roue-desserts' },
  { day: 4, type: 'defi', emoji: '🐱', title: 'Défi du jour', text: 'Chante « Vive le vent » en entier en remplaçant chaque mot par « miaou ». Bonus : avec quelqu\'un qui écoute.' },
  { day: 5, type: 'lutin', emoji: '🧝', title: 'Ton nom de lutin', text: 'Le Père Noël recrute. Entre ton prénom pour découvrir ton nom de lutin et ton poste à l\'atelier.' },
  { day: 6, type: 'anecdote', emoji: '🎅', title: 'Joyeuse Saint-Nicolas !', text: "Le 6 décembre, on fête saint Nicolas, très populaire dans l'est de la France, en Belgique et aux Pays-Bas. Il apporte friandises et pains d'épice aux enfants sages, souvent accompagné du Père Fouettard." },
  { day: 7, type: 'blague', emoji: '❄️', title: 'Blague givrée', question: 'Pourquoi les flocons de neige ne vont-ils jamais à l\'école ?', answer: 'Parce qu\'ils fondent en cours.' },
  { day: 8, type: 'cadeau', emoji: '🎁', title: 'Le cadeau absurde du jour', text: 'Tu ne sais pas quoi offrir ? Voici une idée parfaitement inutile.' },
  { day: 9, type: 'defi', emoji: '💌', title: 'Défi du jour', text: 'Envoie un compliment complètement inattendu à trois personnes aujourd\'hui. Exemple : « Tu as une très belle façon de dire bonjour. »' },
  { day: 10, type: 'anecdote', emoji: '🚀', title: 'Noël dans l\'espace', text: "En décembre 1965, les astronautes de Gemini 6 ont joué « Jingle Bells » à l'harmonica, accompagné de clochettes, depuis l'orbite terrestre. Ce fut l'un des premiers morceaux de musique joués dans l'espace." },
  { day: 11, type: 'quiz', emoji: '🎬', title: 'Émojifilm spécial Noël', text: 'Trois films en émojis. Saurais-tu les retrouver ?', items: [
    { emojis: '👦🏠🎄🪤', answer: "Maman, j'ai raté l'avion !" },
    { emojis: '💚🎄🎁😒', answer: 'Le Grinch' },
    { emojis: '🎃🎄💀🐶', answer: "L'Étrange Noël de monsieur Jack" },
  ] },
  { day: 12, type: 'blague', emoji: '🛷', title: 'Blague de traîneau', question: "Qu'est-ce qui est rouge et blanc, et qui descend par la cheminée en marchant tout doucement ?", answer: 'Le Père Noël qui a mal au dos.' },
  { day: 13, type: 'anecdote', emoji: '🏰', title: 'Le doyen des marchés de Noël', text: 'Le marché de Noël de Strasbourg, le « Christkindelsmärik », existe depuis 1570. C\'est l\'un des plus anciens d\'Europe.' },
  { day: 14, type: 'defi', emoji: '🧀', title: 'Défi poétique', text: 'Écris un poème de quatre vers dont chaque vers rime avec « raclette ». Lis-le à voix haute pendant le dîner.' },
  { day: 15, type: 'carte', emoji: '💌', title: 'Ta carte de vœux absurde', text: 'Une carte de vœux unique (et un peu bizarre), à télécharger et à envoyer.' },
  { day: 16, type: 'anecdote', emoji: '🦃', title: 'La dinde, une immigrée', text: "La dinde est originaire d'Amérique. Elle n'est arrivée en Europe qu'au XVIᵉ siècle, après les voyages vers le Nouveau Monde, avant de s'inviter sur les tables de fête." },
  { day: 17, type: 'blague', emoji: '⛄', title: 'Blague fondante', question: 'Comment appelle-t-on un bonhomme de neige en plein mois d\'août ?', answer: 'Une flaque.' },
  { day: 18, type: 'chrono', emoji: '⏱️', title: 'Le chrono dans la tête', text: 'Lance le chrono, ferme les yeux et arrête-le quand tu penses que 10 secondes sont passées. Le chrono est caché, pas de triche !' },
  { day: 19, type: 'anecdote', emoji: '🦌', title: 'Les rennes du Père Noël sont… des rennes', text: "Chez les rennes, mâles comme femelles portent des bois. Les mâles adultes perdent généralement les leurs au début de l'hiver, alors que beaucoup de femelles les gardent jusqu'au printemps." },
  { day: 20, type: 'defi', emoji: '🎀', title: 'Défi du jour', text: 'Porte un accessoire de Noël (bonnet, pull moche, serre-tête à bois de renne…) toute la journée, et réponds « quel accessoire ? » à toute question.' },
  { day: 21, type: 'anecdote', emoji: '✉️', title: 'Le secrétariat du Père Noël', text: "Depuis 1962, La Poste fait répondre aux lettres adressées au Père Noël par un secrétariat installé à Libourne, en Gironde. Chaque année, des centaines de milliers d'enfants y écrivent." },
  { day: 22, type: 'menu', emoji: '🍽️', title: 'Ton menu de réveillon absurde', text: 'Le chef de Zinzin a composé un menu de fête. On ne garantit rien.' },
  { day: 23, type: 'lien', emoji: '🎅', title: 'Père Noël secret de dernière minute', text: 'Tu organises un échange de cadeaux ? Tire au sort qui offre à qui, avec un lien secret par personne, sans compte ni serveur.', cta: 'Organiser un tirage', href: '/pere-noel-secret/' },
  { day: 24, type: 'final', emoji: '🌟', title: 'Joyeux Noël !', text: 'Merci d\'avoir ouvert le calendrier zinzin. Passe de très belles fêtes, et que ta bûche soit moelleuse.' },
];
