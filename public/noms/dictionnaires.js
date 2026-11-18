// Dictionnaires du générateur de noms absurdes. Tous les mots sont originaux ou
// courants ; aucune référence à une franchise existante.
//
// Format compact (analysé par names.logic.js) :
// - Noms :        'm:fromage'   'f:sardine'   'm:chou/choux' (pluriel irrégulier)
//                 '!' après le genre = h aspiré ou pas d'élision : 'm:!hamster' → « le hamster »
// - Adjectifs :   'furieux'                      (féminin et pluriels réguliers calculés)
//                 'fou/folle/fous/folles'        (formes explicites m/f/mp/fp)
//                 'fluo*'                        (invariable)
// - Technos :     même format que les noms.
// - Lieux :       noms de villes (« Le Mans » → « au Mans » géré par le moteur).

const split = (s) => s.trim().split(/\s*\|\s*/).filter(Boolean);

export const NOUNS = split(`
m:fromage | m:pingouin | m:cornichon | m:radiateur | m:croissant | m:!hamster | m:aspirateur | m:tracteur |
m:poulpe | m:flamant rose/flamants roses | m:yaourt | m:tabouret | m:parapluie | m:lama | m:!hérisson | m:saucisson |
m:boulon | m:grille-pain/grille-pains | m:accordéon | m:castor | m:cactus | m:chausson | m:escargot | m:wapiti |
m:ornithorynque | m:bigoudi | m:dinosaure | m:robot | m:cyclope | m:coussin | m:kiwi | m:!homard | m:crapaud |
m:raton laveur/ratons laveurs | m:ananas | m:citron | m:poireau | m:navet | m:panda | m:!ouistiti | m:slip |
m:nuage | m:volcan | m:lutin | m:gnome | m:sandwich | m:burrito | m:crumble | m:flan | m:gratin | m:cassoulet |
m:camembert | m:biscuit | m:marshmallow | m:tournevis | m:frigo | m:micro-ondes | m:karaoké | m:pyjama |
m:moustique | m:bourdon | m:pigeon | m:goéland | m:morse | m:mammouth | m:yéti | m:zombie | m:vampire |
m:fantôme | m:pirate | m:astronaute | m:sumo | m:moine | m:notaire | m:comptable | m:pharaon | m:viking |
m:chevalier | m:troubadour | m:trombone | m:ukulélé | m:kazoo | m:xylophone | m:tambourin | m:jambon | m:poney |
m:chameau | m:phoque | m:koala | m:ours | m:blaireau | m:renard | m:lapin | m:!hibou/hiboux | m:chou/choux |
m:caillou/cailloux | m:bijou/bijoux | m:bonnet | m:sombrero | m:dentier | m:monocle | m:canapé | m:hamac |
f:chaussette | f:sardine | f:licorne | f:baguette | f:tartiflette | f:raclette | f:choucroute | f:moustache |
f:pantoufle | f:girafe | f:autruche | f:limace | f:mouette | f:crêpe | f:galette | f:banane | f:patate |
f:carotte | f:courgette | f:aubergine | f:betterave | f:citrouille | f:saucisse | f:brioche | f:madeleine |
f:guimauve | f:tomate | f:olive | f:cacahuète | f:noisette | f:cerise | f:framboise | f:mangue | f:clémentine |
f:tondeuse | f:bouilloire | f:trottinette | f:mobylette | f:fusée | f:soucoupe | f:théière | f:casserole |
f:passoire | f:perruque | f:cravate | f:salopette | f:charentaise | f:armoire | f:baignoire | f:ampoule |
f:calculatrice | f:imprimante | f:photocopieuse | f:disquette | f:cassette | f:fanfare | f:chorale | f:sirène |
f:sorcière | f:momie | f:fée | f:mamie | f:belette | f:grenouille | f:tortue | f:baleine | f:méduse | f:crevette |
f:huître | f:anguille | f:chèvre | f:vache | f:poule | f:dinde | f:abeille | f:fourmi | f:coccinelle |
f:chenille | f:araignée | f:loutre | f:marmotte | f:pieuvre | f:taupe | f:mésange | f:pastèque | f:pizza |
f:quiche | f:fondue | f:purée | f:omelette | f:frite | f:nouille | f:meringue | f:!harpe | f:tong |
f:moussaka | f:brouette | f:bicyclette | f:sauterelle | f:mandoline | f:gaufre | f:chipolata | f:perceuse
`);

export const ADJECTIVES = split(`
radioactif | mélancolique | interdit | cosmique | sauvage | électrique | géant | minuscule | timide | furieux |
glorieux | mystérieux | tiède | gluant | moelleux | croustillant | fondant | épicé | sucré | salé | rouillé |
dodu | rebelle | poli | maudit | sacré | discret/discrète | inquiet/inquiète | fou/folle/fous/folles | gentil/gentille |
cruel | éternel | officiel | artificiel | ancien | breton | mignon | grognon | fluo* | kitsch* | chic | rose |
bleu | vert | jaune | violet | orange* | turquoise | doré | argenté | pailleté | intergalactique | quantique |
numérique | nucléaire | atomique | magnétique | hypnotique | poétique | dramatique | tragique | héroïque |
épique | mythique | lunaire | solaire | polaire | tropical | royal | brutal | génial | normal | joyeux | peureux |
paresseux | heureux | nerveux | gracieux | savoureux | poussiéreux | dangereux | vaporeux | sérieux | frileux |
chanceux | actif | naïf | sportif | créatif | explosif | impulsif | pensif | agressif | oublié | déchaîné |
enragé | endormi | ébouriffé | déboussolé | décongelé | surgelé | gonflable | inoxydable | imperméable |
comestible | invisible | incroyable | indomptable | inflammable | incassable | adorable | misérable | aimable |
robuste | rapide | lent | immense | colossal | gigantesque | ridicule | magnifique | sublime | splendide |
solide | liquide | humide | acide | perfide | stupide | perplexe | rustique | exotique | mécanique |
cybernétique | diabolique | angélique | nostalgique | sarcastique | fantastique | élastique | gothique |
baroque | rococo* | punk* | disco* | funky* | vintage* | costaud | malin/maligne | coquin | taquin | câlin |
divin | clandestin | souterrain | lointain | rural | mortel | sensationnel | irrésistible | flamboyant |
scintillant | hurlant | rampant | volant | dansant | ronflant | bavard | trouillard | ringard | vantard |
flemmard | bizarre | louche | moche | agricole | administratif | fiscal | municipal | démoniaque | légendaire
`);

export const FIRST_NAMES = split(`
Gérard | Josiane | Kevin | Brigitte | Jean-Michel | Ginette | Patrick | Martine | Thierry | Sylvie | Didier |
Chantal | Bernard | Monique | Francis | Odette | Roger | Huguette | Jacky | Mireille | Pascal | Nathalie |
Dédé | Josette | Lulu | Gaston | Raymonde | Marcel | Simone | Robert | Yvette | Jean-Claude | Paulette |
Gilbert | Germaine | Michel | Colette | Serge | Jacqueline | René | Lucienne | Hervé | Bernadette | Thibault |
Capucine | Enzo | Jade | Lucas | Léa | Hugo | Manon | Nathan | Chloé | Théo | Inès | Maxime | Camille |
Romain | Pauline | Quentin | Margaux | Baptiste | Clémence | Jordan | Océane | Dylan | Cindy | Brandon |
Jennifer | Steevy | Priscilla | Rodrigue | Ursule | Barnabé | Philibert | Eulalie | Anatole | Berthe |
Hector | Ignace | Gertrude | Octave | Fernand | Solange
`);

export const INGREDIENTS = split(`
sirop d'érable | jus de cornichon | rhum arrangé | limonade tiède | eau gazeuse | lait de coco | sauce soja |
crème fouettée | café froid | thé glacé | jus de betterave | purée de mangue | sirop de violette |
bière sans alcool | vinaigre balsamique | eau de rose | ketchup | moutarde à l'ancienne | sauce piquante |
jus d'ananas | jus de pamplemousse | cidre brut | sirop de menthe | grenadine | jus de citron vert |
miel de lavande | sucre pétillant | poivre rose | piment d'Espelette | gingembre frais | cannelle | vanille |
cardamome | basilic | menthe fraîche | romarin | thym | persil | curry | paprika fumé | chocolat chaud |
caramel au beurre salé | crème de marrons | confiture de fraises | compote de pommes | yaourt à boire |
lait d'avoine | lait fraise | soda à l'orange | tonic | ginger beer | jus de tomate | bouillon de poule |
jus de choucroute | eau de cuisson des pâtes | sirop de canne | liqueur de noisette | crème de cassis |
jus de litchi | nectar d'abricot | jus de pastèque | fruit de la passion | sirop d'orgeat | jus de raisin |
kombucha | kéfir | lait concentré sucré | crème anglaise | sauce barbecue | mayonnaise | poudre de licorne |
paillettes comestibles | sel de Guérande | zeste d'orange | zeste de citron | pétales de rose |
coriandre fraîche | sirop de pain d'épices | eau de Vichy | jus de carotte | jus de céleri | jus de concombre |
purée de banane | sorbet citron | glace à la pistache | bonbons qui piquent | jus de cerise
`);

export const TECH = split(`
f:blockchain | m:cloud | m:machine learning | m:big data | m:métavers | f:réalité augmentée | f:réalité virtuelle |
m:Internet des objets | f:5G | f:6G | m:calcul quantique | f:cybersécurité | m:no-code | m:low-code |
f:data science | m:deep learning | m:edge computing | m:serverless | m:Web3 | f:robotique | f:domotique |
f:biotech | f:fintech | f:foodtech | f:greentech | f:gamification | f:ubérisation | f:disruption | f:synergie |
f:agilité | m:DevOps | m:growth hacking | m:storytelling | m:personal branding | f:tokenisation |
m:crowdfunding | m:drone | f:impression 3D | f:nanotechnologie | m:GPS | m:Bluetooth | m:laser | m:hologramme |
f:télépathie | f:photosynthèse | m:algorithme | m:chatbot | f:API | m:SaaS | m:bitcoin | f:reconnaissance faciale |
m:capteur connecté | f:montre connectée | m:frigo connecté | m:slip connecté | f:fibre optique |
m:supercalculateur | f:puce RFID | m:QR code | m:cloud souverain | m:jumeau numérique | m:exosquelette | m:cobot |
f:IA générative | m:prompt engineering | f:vision par ordinateur | f:analyse prédictive | m:microservice |
m:conteneur | m:Kubernetes | m:!hackathon | m:open source | f:souveraineté numérique | m:moteur de recommandation |
f:neurotech | m:bracelet connecté | m:hyperloop | f:voiture autonome | m:dirigeable | m:satellite |
f:fusion froide | m:compost intelligent | m:réseau neuronal | m:cloud hybride | f:réalité mixte | f:IA éthique |
m:paiement sans contact | f:signature électronique | m:badge NFC | f:intelligence collective
`);

export const PLACES = split(`
Palavas-les-Flots | Saint-Malo | Brest | Quimper | Romorantin | Castelnaudary | Pézenas | Carpentras |
Lons-le-Saunier | Montcuq | Bourg-en-Bresse | Vesoul | Tulle | Guéret | Aurillac | Brive-la-Gaillarde | Cognac |
Angoulême | Arcachon | Biarritz | Dax | Pau | Tarbes | Foix | Carcassonne | Sète | Agde | Béziers | Nîmes |
Arles | Marseille | Toulon | Fréjus | Menton | Grasse | Gap | Briançon | Chamonix | Annecy | Grenoble | Valence |
Montélimar | Vichy | Clermont-Ferrand | Roanne | Mâcon | Dijon | Besançon | Belfort | Colmar | Mulhouse |
Strasbourg | Nancy | Metz | Épinal | Verdun | Reims | Épernay | Troyes | Chaumont | Auxerre | Nevers | Bourges |
Vierzon | Tours | Blois | Orléans | Chartres | Évreux | Lisieux | Caen | Cherbourg | Granville | Fougères |
Rennes | Vannes | Lorient | Concarneau | Douarnenez | Morlaix | Paimpol | Dinan | Laval | Le Mans | Angers |
Cholet | Nantes | Pornic | La Baule | Les Sables-d'Olonne | Niort | La Rochelle | Royan | Limoges | Poitiers |
Châteauroux | Lille | Roubaix | Dunkerque | Calais | Boulogne-sur-Mer | Amiens | Beauvais | Compiègne | Le Havre
`);

export const MUSIC_STYLES = split(`
post-punk | rock | hard rock | metal | heavy metal | death metal | black metal | doom | stoner | grunge | punk |
garage | rockabilly | surf rock | krautrock | rock progressif | glam rock | new wave | cold wave | synthpop |
électro | techno | house | trance | dubstep | drum'n'bass | jungle | disco | funk | soul | jazz | free jazz |
acid jazz | swing | blues | country | bluegrass | folk | néo-folk | reggae | ska | dub | hip-hop | rap | trap |
zouk | musette | yéyé | variété | chanson à texte | opéra | baroque | polka | valse | tango | salsa | cumbia |
bossa nova | samba | flamenco | fado | chiptune | lo-fi | shoegaze | emo | screamo | math rock | post-rock |
noise | ambient | dark wave | hardcore | grindcore | nu metal | metal symphonique | gospel | yodel |
chant grégorien | musique de chambre | eurodance | italo disco | bal folk | biniou-core | accordéon-punk |
kazoo-core | slow qui colle | hymne de stade
`);

// Syllabes des créatures de poche (combinaisons 100 % inventées).
export const CREATURE_STARTS = split(`
Flam | Ronch | Grum | Bzz | Gloub | Snor | Croq | Zig | Floc | Chuch | Mim | Pouf | Krak | Vroum | Glou | Tchou |
Bidul | Patat | Moust | Ploum | Zinz | Frip | Gribou | Tromb | Cacah | Ventr | Ronr | Biscot | Patapl | Tuy |
Pomp | Cracot | Boud | Chafou | Gargouil | Pétoul | Ratat | Saucis | Blob | Grign | Mousk | Plouf | Rataf |
Tambouil | Zoub | Chamboul | Bistr | Frou | Gazouil | Hibern | Jongl | Kaboum | Lamb | Marmit | Nougat |
Oursin | Popot | Quich | Ribamb | Sirot | Toupi | Ukul | Vadrouil | Wouf | Xylo | Yodel | Zéz | Brioch |
Cornich | Doudou | Escarg | Fouin | Grenouil | Hublot | Igl | Jamb | Kiwi | Lapinou | Mastoc | Noisett | Orag
`);

export const CREATURE_ENDS = split(`
ouille | optère | izard | odon | ichon | ouf | aglouf | inator | osaure | ignon | ouillard | amouche | éon | ix |
otron | ulus | apouf | ibulle | ifou | inou | oss | ax | ozor | ibri | arouf | ichu | uche | iflette | ogrin |
aflon | oulou | ipède | ognon | iboum | atruc | oboule | imousse | ugrolle | atine | adingue | ouzou | ifrite |
abidou | otache | ipon | uzz | ombre | oncle | ilou | etto | azaur | imax | onaute | opus | iroule | aplat |
outch | ignole | inette | ogotte | umette | ichou | oupette | aloche | anouille | ibouille | aflouche | atoune |
onfle | oupiot | ipatte | uffin | irelo | apoutre | inouche | ogre | ifax | akoula | ezinzin | iflou | ominet |
ascar | iboss | ouzik | agnole | irgule | ouzette | umbo | ébulle | iquet | oustic | assou
`);

// Verbes transitifs (à l'infinitif) pour les pouvoirs, plans et effets.
export const VERBS = split(`
hypnotiser | chatouiller | téléporter | congeler | dédoubler | rétrécir | gonfler | aimanter | cloner |
repeindre en fluo | caraméliser | éblouir | apprivoiser | démagnétiser | pulvériser | faire léviter |
faire rire | faire pleurer | faire éternuer | faire chanter | faire danser | faire roter | endormir |
réveiller | ensorceler | électriser | parfumer | saupoudrer | gratiner | flamber | mixer | compresser |
plier en quatre | éplucher | tricoter | emballer | ranger par taille | dompter | câliner | consoler | effrayer |
intimider | ridiculiser | déguiser | maquiller | coiffer | shampouiner | astiquer | cirer | vernir | glacer |
givrer | réchauffer | refroidir | ramollir | durcir | liquéfier | vaporiser | cristalliser |
transformer en purée | transformer en confettis | changer en statue | mettre en boîte | mettre en orbite |
envoyer sur la Lune | faire disparaître | faire apparaître | multiplier | couper en deux | compter |
renifler | grignoter | avaler | recracher | imiter | remplacer | détecter | localiser | collectionner |
vexer | flatter | interviewer | faire voter | syndiquer | enrhumer | dorloter | caresser à rebrousse-poil
`);

export const VILLAIN_TITLES = split(`
m:Docteur | m:Professeur | m:Baron | m:Comte | m:Duc | m:Marquis | m:Capitaine | m:Général | m:Colonel |
m:Lieutenant | m:Sergent | m:Seigneur | m:Roi | m:Prince | m:Empereur | m:Sultan | m:Maître | m:Grand Sorcier |
m:Mage | m:Nécromancien | m:Chevalier | m:Commandant | m:Amiral | m:Inspecteur | m:Monsieur | m:Tonton |
m:Papy | m:Cousin | m:Notaire | m:Percepteur | m:Contrôleur | m:Concierge | m:Président | m:Directeur |
m:Gourou | m:Shérif | m:Pharaon | m:Tsar | m:Vicomte | m:Archiduc | m:Grand Chambellan |
f:Docteure | f:Professeure | f:Baronne | f:Comtesse | f:Duchesse | f:Marquise | f:Capitaine | f:Générale |
f:Colonelle | f:Lieutenante | f:Sergente | f:Dame | f:Reine | f:Princesse | f:Impératrice | f:Sultane |
f:Maîtresse | f:Grande Sorcière | f:Mage | f:Nécromancienne | f:Chevalière | f:Commandante | f:Amirale |
f:Inspectrice | f:Madame | f:Tata | f:Mamie | f:Cousine | f:Notaire | f:Perceptrice | f:Contrôleuse |
f:Concierge | f:Présidente | f:Directrice | f:Pharaonne | f:Tsarine | f:Vicomtesse | f:Archiduchesse | f:Grande Chambellane
`);

// Listes structurelles courtes (pas du vocabulaire : gabarits, unités…).
export const STARTUP_SUFFIXES = split(`
ify | ly | io | .ai | r | Hub | Lab | Box | Go | Up | oo | zz | Pay | Bot | Mate | Wise | Flow | Nest | Stack |
Base | Verse | Hive | Spot | Kit | ster | ella | ino | ix | ia | Tech | Cloud | Sense | Grid | Link | Loop | Mind
`);

export const BOAT_TYPES = split(`
chalutier | pédalo | paquebot | voilier | catamaran | péniche | galion | sous-marin | radeau | kayak | trimaran |
bateau-mouche | ferry | hors-bord | jonque | drakkar | caravelle | yacht | brise-glace | canot pneumatique
`);

export const MEASURES = split(`
4 cl | 2 cl | 6 cl | un trait | une pincée | une louche | trois gouttes | un doigt | une cuillère | un nuage |
un soupçon | 12 cl | un verre à moutarde | une giclée
`);
