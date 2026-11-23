// Contenu des quiz. points : { idRésultat: points }.
const q = (text, ...answers) => ({ text, answers: answers.map(([label, points]) => ({ label, points })) });

export const QUIZZES = [
  {
    id: 'fromage',
    title: 'Quel fromage es-tu ?',
    emoji: '🧀',
    color: '#ffd23f',
    results: [
      { id: 'camembert', emoji: '🧀', name: 'Le camembert', text: 'Coulant, chaleureux et un peu envahissant : tu mets tout le monde à l\'aise (et tu prends de la place dans le frigo). On t\'adore à l\'apéro.' },
      { id: 'comte', emoji: '⛰️', name: 'Le comté', text: 'Patient·e, solide et plein·e de nuances. Tu t\'améliores avec le temps, et tout le monde finit par te demander conseil.' },
      { id: 'roquefort', emoji: '🐑', name: 'Le roquefort', text: 'Caractère bien trempé, avis tranchés, on t\'aime ou on te fuit. Mais ceux qui t\'aiment, c\'est pour la vie.' },
      { id: 'mozzarella', emoji: '🍕', name: 'La mozzarella', text: 'Doux·ce, souple et toujours partant·e pour tout. Tu t\'adaptes à toutes les situations, surtout si elles sont gratinées.' },
      { id: 'chevre', emoji: '🐐', name: 'Le chèvre', text: 'Frais·che, original·e et un peu têtu·e. Tu as un style bien à toi, et tu adores les salades (de mots aussi).' },
    ],
    questions: [
      q('Ton samedi idéal ?', ['Un apéro qui dure jusqu\'au soir', { camembert: 2, mozzarella: 1 }], ['Une rando à la montagne', { comte: 2, chevre: 1 }], ['Un débat passionné', { roquefort: 2 }], ['Un peu de tout, selon l\'humeur', { mozzarella: 2 }]),
      q('Tes amis te décrivent comme…', ['Chaleureux·se', { camembert: 2 }], ['Fiable', { comte: 2 }], ['Intense', { roquefort: 2 }], ['Original·e', { chevre: 2 }]),
      q('Au restaurant, tu choisis…', ['Le plat du jour, sans hésiter', { comte: 1, camembert: 1 }], ['Le plat le plus bizarre de la carte', { roquefort: 1, chevre: 2 }], ['Une pizza, évidemment', { mozzarella: 2 }], ['Ce que prend la personne d\'à côté', { mozzarella: 1, camembert: 1 }]),
      q('Ton rapport au temps ?', ['Je prends mon temps, ça vaut le coup', { comte: 2 }], ['Toujours en retard, mais avec style', { camembert: 2 }], ['Pressé·e, efficace, tranchant·e', { roquefort: 2 }], ['Je vis au jour le jour', { chevre: 1, mozzarella: 1 }]),
      q('Ta musique préférée ?', ['De la chanson française', { camembert: 1, comte: 1 }], ['Du rock qui dépote', { roquefort: 2 }], ['De la pop qui fait danser', { mozzarella: 2 }], ['Un groupe que personne ne connaît', { chevre: 2 }]),
      q('Face à un problème…', ['J\'en parle autour d\'un bon repas', { camembert: 2 }], ['J\'analyse calmement', { comte: 2 }], ['Je fonce dans le tas', { roquefort: 2 }], ['Je contourne avec souplesse', { mozzarella: 1, chevre: 1 }]),
    ],
  },
  {
    id: 'viennoiserie',
    title: 'Quelle viennoiserie es-tu ?',
    emoji: '🥐',
    color: '#ff7a45',
    results: [
      { id: 'croissant', emoji: '🥐', name: 'Le croissant', text: 'Un grand classique élégant. Tu es la valeur sûre du groupe, celle qu\'on choisit quand on ne sait pas quoi prendre.' },
      { id: 'painchoc', emoji: '🍫', name: 'Le pain au chocolat (ou chocolatine)', text: 'Tu déclenches des débats passionnés partout où tu passes. Généreux·se, réconfortant·e, et un peu polémique.' },
      { id: 'brioche', emoji: '🍞', name: 'La brioche', text: 'Douceur, câlins et dimanche matin. Tu es un plaid humain, et tout le monde a envie de te faire un câlin.' },
      { id: 'chausson', emoji: '🍎', name: 'Le chausson aux pommes', text: 'Discret·e en apparence, mais plein·e de surprises à l\'intérieur. On sous-estime ton potentiel.' },
    ],
    questions: [
      q('Ton réveil sonne. Tu…', ['Te lèves direct, efficace', { croissant: 2 }], ['Négocies cinq minutes de plus (×6)', { brioche: 2 }], ['Te lèves en chantant fort', { painchoc: 2 }], ['Te lèves sans bruit pour surprendre tout le monde', { chausson: 2 }]),
      q('Ton style vestimentaire ?', ['Chic et sobre', { croissant: 2 }], ['Confortable avant tout', { brioche: 2 }], ['Qui fait parler', { painchoc: 2 }], ['Simple, mais avec un détail inattendu', { chausson: 2 }]),
      q('En soirée, tu es…', ['Celui ou celle qui connaît tout le monde', { croissant: 1, painchoc: 1 }], ['Dans le canapé, avec le chat', { brioche: 2 }], ['Au centre du débat', { painchoc: 2 }], ['Celui ou celle qui sort LA blague du siècle', { chausson: 2 }]),
      q('Ton super-pouvoir ?', ['Être toujours à l\'heure', { croissant: 2 }], ['Rassurer n\'importe qui', { brioche: 2 }], ['Convaincre n\'importe qui', { painchoc: 2 }], ['Surprendre n\'importe qui', { chausson: 2 }]),
      q('Le dimanche matin, c\'est…', ['Marché et café en terrasse', { croissant: 2 }], ['Grasse matinée sacrée', { brioche: 2 }], ['Brunch avec dix personnes', { painchoc: 2 }], ['Projet secret dans le garage', { chausson: 2 }]),
    ],
  },
  {
    id: 'legume',
    title: 'Quel légume es-tu ?',
    emoji: '🥕',
    color: '#3ddc97',
    results: [
      { id: 'carotte', emoji: '🥕', name: 'La carotte', text: 'Optimiste et lumineux·se : tu vois toujours le bon côté des choses (et tu vois bien dans le noir, paraît-il).' },
      { id: 'brocoli', emoji: '🥦', name: 'Le brocoli', text: 'On t\'a longtemps sous-estimé·e, mais tu es plein·e de ressources. Tu es l\'arbre miniature de la bienveillance.' },
      { id: 'poireau', emoji: '🌱', name: 'Le poireau', text: 'Patient·e jusqu\'à l\'excès : tu sais attendre (on dit même « faire le poireau »). Fidèle et dans le fond, très doux·ce.' },
      { id: 'courgette', emoji: '🥒', name: 'La courgette', text: 'Polyvalent·e et sociable, tu t\'invites dans tous les plats et toutes les soirées. Un peu trop présent·e l\'été.' },
    ],
    questions: [
      q('Quand tu attends le bus…', ['Je suis sûr·e qu\'il va arriver', { carotte: 2 }], ['J\'en profite pour lire', { brocoli: 2 }], ['J\'attends. Longtemps. Sans broncher.', { poireau: 2 }], ['Je discute avec tout le monde', { courgette: 2 }]),
      q('Ta qualité principale ?', ['L\'optimisme', { carotte: 2 }], ['La sagesse', { brocoli: 2 }], ['La patience', { poireau: 2 }], ['L\'adaptabilité', { courgette: 2 }]),
      q('Ton plat préféré ?', ['Un gâteau (aux carottes, bien sûr)', { carotte: 2 }], ['Un gratin gourmand', { brocoli: 1, courgette: 1 }], ['Une bonne soupe', { poireau: 2 }], ['Une ratatouille', { courgette: 2 }]),
      q('Tes vacances idéales ?', ['Au soleil, en couleurs', { carotte: 2 }], ['En forêt, au calme', { brocoli: 2 }], ['Chez moi, tranquillement', { poireau: 2 }], ['En colo avec 40 personnes', { courgette: 2 }]),
      q('On te confie un secret…', ['Je le garde, et je souris', { carotte: 1, poireau: 1 }], ['Je donne un conseil avisé', { brocoli: 2 }], ['Je l\'emporte dans la tombe', { poireau: 2 }], ['Oups, je l\'ai déjà raconté', { courgette: 2 }]),
    ],
  },
];
