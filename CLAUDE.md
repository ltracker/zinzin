# CLAUDE.md — Mémoire du projet « Zinzin »

> Ce fichier est la **source de vérité** du projet. Une nouvelle session doit pouvoir
> reprendre le travail en lisant uniquement ce fichier. **Le mettre à jour à la fin de
> chaque étape** (cases de la ROADMAP, décisions, URL de prod…).
>
> Pour reprendre : lire ce fichier → aller à la première case non cochée de la ROADMAP →
> coder → tester (`npm test`) → vérifier dans le navigateur → cocher → commit.

---

## 1. Vision

**Zinzin** est un site web *fun*, 100 % statique et 100 % en français : un **hub** de
4 mini-applications légères, drôles et partageables. Aucun back-end, aucun cookie, aucun
tracker : tout reste dans le navigateur de l'utilisateur.

| App | Chemin | Résumé |
|-----|--------|--------|
| A. **Ce jour-là** | `/ce-jour-la/` | Stats marrantes sur sa vie à partir de sa date de naissance |
| B. **Générateur de noms absurdes** | `/noms/` | Groupes de rock, startups, créatures, cocktails, vilains, bateaux, wifi |
| C. **Le jeu du jour** | `/jeu/` | Wordle-like quotidien, 2 modes : Émojifilm et Silhouette (pays) |
| D. **La roue de la décision** | `/roue/` | Roue animée en canvas, pondérée, listes perso, confettis |

Pages annexes : accueil `/`, `/a-propos/`, `404.html`.

Nom : **Zinzin** (« un peu fou », en français familier). Slug du repo et du projet Cloudflare : `zinzin`.
Autres noms proposés : Bric-à-Broc, Le Bazar Cosmique, Turbobidule.

---

## 2. Stack et conventions

### Stack
- **HTML + CSS + JavaScript vanilla** (modules ES natifs `<script type="module">`).
- **Aucun framework, aucun bundler, aucune étape de build** pour le site : `/public` est servi tel quel.
- **Aucune ressource tierce chargée à l'exécution** : ni CDN ni Google Fonts. Polices, données et icônes sont en local.
- **Tests** : test runner natif de Node (`node --test`), sans dépendance de test.
- **Node ≥ 20** n'est requis que pour les tests et les scripts de pré-traitement (`/scripts`).
- `devDependencies` (utilisées uniquement par `/scripts`, jamais servies) : `world-atlas`, `topojson-client`.

### Conventions de code
- Fichiers et dossiers en `kebab-case`. URL en français et sans accents (`/ce-jour-la/`).
- **Logique métier = fonctions pures** dans des fichiers `*.logic.js` (ou `public/shared/*.js`)
  **sans accès au DOM**, importables à la fois par le navigateur et par Node. Le fichier
  `main.js` de chaque app gère le DOM et les événements, et appelle la logique.
- Imports ES relatifs avec extension explicite (`import { x } from '../shared/rng.js'`).
- Pas de `localStorage` direct : toujours passer par `shared/storage.js` (try/catch, fallback mémoire).
  Clés préfixées `zinzin:` (ex. `zinzin:noms:favoris`).
- Dates : calculs en millisecondes UTC. Le « jour du puzzle » se calcule dans le fuseau **Europe/Paris** via `Intl.DateTimeFormat`.
- CSS : variables dans `shared/tokens.css` (design system). Pas de valeurs magiques de
  couleur hors des tokens. Classes BEM légères (`.card`, `.card__title`, `.card--pop`).
- Accessibilité : chaque contrôle a un label, focus visible (`:focus-visible`), navigation
  au clavier testée, `aria-live` pour les résultats dynamiques.
- Animations : toujours désactivées ou réduites sous `@media (prefers-reduced-motion: reduce)`.
- Langue : interface, commentaires utilisateur et messages de commit **en français**.
- Commits : un commit par étape livrable, message clair au format `type(portée): description`
  (ex. `feat(roue): tirage pondéré et confettis`). Après chaque commit d'étape : `git push`
  (le repo GitHub existe déjà ; une fois Cloudflare branché, chaque push sur `main` déploie).

### Design system (identité « Zinzin »)
- Ambiance : **pop, sticker, rétro-néon**. Cartes à bords épais façon autocollant, ombres
  portées décalées et pleines (sans flou), légères rotations au survol.
- Couleurs (tokens) : violet profond `--c-ink`, jaune citron `--c-lemon`, rose bonbon
  `--c-candy`, vert menthe `--c-mint`, bleu piscine `--c-pool`, orange tomate `--c-tomato`,
  fond crème `--c-paper` (clair) ou nuit violette (sombre). Chaque app a sa couleur signature.
- Typo : une police display auto-hébergée (woff2, licence OFL, sous-ensemble latin) pour les
  titres, et une pile système pour le texte (`system-ui, …`).
- Thème sombre automatique (`prefers-color-scheme`) et contrastes AA vérifiés.

---

## 3. Arborescence (cible)

```
/
├── CLAUDE.md               ← ce fichier (mémoire du projet)
├── README.md               ← présentation humaine
├── package.json            ← scripts npm (test, serve, data, check) ; "type": "module"
├── wrangler.jsonc          ← config Cloudflare Workers : sert ./public en statique, 404-page
├── .gitignore
├── scripts/
│   ├── build-countries.mjs ← pré-traitement world-atlas → public/jeu/data/pays.json (à lancer une fois)
│   └── build-og.mjs        ← (optionnel) génération des images Open Graph
├── tests/                  ← tests node --test (*.test.js)
└── public/                 ← TOUT le site servi (répertoire de sortie Cloudflare Pages)
    ├── index.html          ← hub / accueil
    ├── 404.html
    ├── a-propos/index.html
    ├── manifest.webmanifest, robots.txt, sitemap.xml, favicon.svg, _headers, _redirects
    ├── sw.js               ← service worker (bonus PWA)
    ├── assets/             ← polices, images OG, icônes
    ├── shared/
    │   ├── tokens.css      ← variables du design system
    │   ├── base.css        ← reset, layout, composants communs
    │   ├── rng.js          ← RNG à graine (mulberry32 + hash cyrb53 de chaîne)
    │   ├── storage.js      ← localStorage sécurisé
    │   ├── share.js        ← copie presse-papiers, Web Share API, liens
    │   ├── image.js        ← génération de cartes PNG en canvas
    │   ├── dates.js        ← date du jour à Paris, utilitaires de dates
    │   └── ui.js           ← toasts, en-tête et pied de page, helpers DOM
    ├── ce-jour-la/  index.html, main.js, life.logic.js, style.css
    ├── noms/        index.html, main.js, names.logic.js, dictionnaires.js, style.css
    ├── jeu/         index.html, main.js, game.logic.js, geo.logic.js, data/films.js, data/pays.json, style.css
    └── roue/        index.html, main.js, wheel.logic.js, presets.js, style.css
```

---

## 4. Modules (rôle de chacun)

*(À compléter et préciser au fil des étapes.)*

**Socle (étape 1, en place)**
- **shared/tokens.css** : `@font-face` Bricolage + toutes les variables (couleurs brutes, rôles
  `--bg/--surface/--text/--border`, couleurs d'apps `--app-*`, typo, espacements, rayons,
  ombres pleines, easings). `body[data-app="…"]` fixe `--accent` pour la page.
  Thème sombre par `prefers-color-scheme` : seuls les rôles changent ; les accents restent
  vifs avec du texte `--c-on-accent` (violet foncé).
- **shared/base.css** : reset, `.container`, `.site-header` (sticky) et `.site-nav` (émojis seuls
  sur mobile, libellés lus par les lecteurs d'écran), `.site-footer`, `.page-head` (+ `__kicker`),
  `.card` (`--accent`, `--hover`), `.btn` (`--primary`, `--ink`, `--small`, `--big`, `--icon`),
  `.field/.input/.select/.checkbox`, `.chip`, `.toast`, `.pop-in`, `.wiggle`, `.visually-hidden`,
  `.skip-link`, et un bloc reduced-motion global.
- **shared/site.js** : `SITE` (nom, URL de prod, `launchKey` = jour n° 1 du jeu = 2026-11-18) et `APPS`.
- **shared/rng.js** : `hashString(str, seed) → uint32` (cyrb53), `mulberry32(seed)`,
  `createRng(nombre|chaîne)` (normalise la casse et les espaces), `int`, `pick`, `chance`,
  `shuffle` (non mutant), `randomSeed`. ⚠️ Les valeurs de référence sont figées dans les tests :
  modifier l'algorithme change tous les puzzles et tous les noms à graine.
- **shared/dates.js** : `MS`, `parisParts`, `parisOffsetMs`, `parisDateKey(date) → 'AAAA-MM-JJ'`,
  `parseKey`, `dayNumber(key)`, `addDaysToKey`, `parisMidnight(key) → Date`,
  `msUntilParisMidnight(now)`, `formatHMS`, `formatNumber` (fr-FR), `formatLongDate`.
- **shared/storage.js** : `load(key, fallback)`, `save(key, value)`, `remove`, `keys`, `clearAll`.
  Préfixe automatique `zinzin:`, try/catch partout, repli en mémoire.
- **shared/share.js** : `copyText`, `shareOrCopy({title,text,url})`, `shareCanvas`, `buildUrl(params)`,
  `replaceUrlParams`, `readParams`, `downloadText(content, filename, mime)` (pour le .ics).
- **shared/image.js** : `renderCard({kicker, title, emoji, lines, accent, footer}) → Promise<canvas 1080×1080>`
  façon sticker, `downloadCanvas`, `wrapText`, `ensureFonts`.
- **shared/ui.js** : `$`, `$$`, `el(tag, attrs, ...children)`, `toast(msg)` (aria-live),
  `prefersReducedMotion()`, `everySecond(fn)` (calé sur la seconde, renvoie une fonction d'arrêt).
- **index.html + home.css + home.js** : hub. Logo « Zinzin » en lettres stickers animées, pastille
  « Puzzle n° X · prochain dans HH:MM:SS », 4 cartes d'apps (`data-accent`), encart vie privée.
- **a-propos/** : explications sur la vie privée, résumé des clés stockées et bouton « Effacer mes données ».
- **scripts/serve.mjs** : serveur statique sans dépendance qui imite Pages (redirection 308 vers `/`, 404.html). Exporte `startServer(port)`.
- **scripts/check-pages.mjs** : lance le serveur sur le port 4173 et pilote Edge (ou Chrome) en headless via
  `playwright-core`. Chaque page est testée en mobile 390 px et desktop 1280 px, en clair et en sombre.
  Il remonte les erreurs console et JS, les HTTP ≥ 400, les débordements horizontaux, les contrôles sans nom
  accessible et une police non chargée. Captures dans `tmp/screens/` (ignoré par git).

**Gabarit de page** : en-tête et pied de page sont **dupliqués en HTML statique** dans chaque
page (pas de build ni d'injection JS, meilleur pour le SEO). Pour modifier la navigation, il
faut mettre à jour toutes les pages `public/**/index.html` et `404.html`. Une page d'app suit ce
modèle : `<body data-app="slug">`, CSS `tokens → base → style.css de l'app`, puis
`<script type="module" src="/slug/main.js">`. Le lien actif de la nav porte `aria-current="page"`.
**Aucun attribut `style="…"` ni script inline** dans le HTML (CSP stricte prévue) ; les styles
posés via JS (`el.style.x = …`) restent autorisés.

**Apps (à venir)**
- **ce-jour-la/life.logic.js** (✅ étape 2) : `parseBirth`/`validateBirth` (heure locale),
  `addMonths`/`addDays`, `ageBreakdown` (a/m/j/h/min/s calendaires + totaux), `MILESTONE_DEFS`
  (jours, heures, minutes, secondes, semaines, mois) → `milestones`/`nextMilestone`, `nextBirthday`
  (29/02 fêté le 28/02), `planetAges` (périodes sidérales), **Lune via Meeus chap. 49**
  (`lunarPhaseTime(k)` : k entier = nouvelle lune, k+0,5 = pleine lune, précision ≈ minute),
  `countFullMoons`, `nextFullMoon`, `moonPhase`, `estimates` (taux dans `ESTIMATE_RATES`),
  `weekdayOf`, `westernZodiac`, **`decemberSolstice` (Meeus chap. 27) + `chineseNewYear`**
  (11ᵉ mois = celui du solstice, heure de Pékin ; vérifié 1900-2026), `chineseZodiac`
  (animal + élément), `buildIcs` (RFC 5545 : CRLF, échappement, `foldLine` à 75 octets, rappel).
- **ce-jour-la/main.js** : formulaire (date + heure facultative, `?d=AAAA-MM-JJ&h=HH:MM`),
  rendu une fois, puis `tick()` chaque seconde qui met à jour les éléments `[data-live]`.
  La frise est repliée (3 jalons passés + 5 à venir). Exports : lien, PNG (`renderCard`), .ics.
- **noms/dictionnaires.js** (✅ étape 3) : listes en **format compact** (une chaîne séparée par `|`).
  Noms `m:fromage`, `f:sardine`, `m:chou/choux` (pluriel irrégulier), `m:!hamster` (`!` après les
  deux-points = h aspiré, donc pas d'élision). Adjectifs `furieux` (formes régulières calculées),
  `fou/folle/fous/folles` (formes explicites), `fluo*` (invariable). Les adjectifs sont toujours
  **postposés** : n'ajoute pas beau, vieux, petit…
  Listes de vocabulaire ≥ 80 (vérifié par les tests) : NOUNS, ADJECTIVES, FIRST_NAMES, INGREDIENTS, TECH,
  PLACES, MUSIC_STYLES, CREATURE_STARTS/ENDS, VERBS (infinitifs transitifs), VILLAIN_TITLES (genrés).
  Listes structurelles plus courtes : STARTUP_SUFFIXES, BOAT_TYPES, MEASURES.
- **noms/names.logic.js** : `parseNoun`, `parseAdjective`, `feminize`, `pluralize`, `agree(adj, g, n)`,
  `withArticle(noun, n, 'def'|'indef'|'de'|'a')` (le/la/l'/les, du/de la/des, au/aux…), `phrase`,
  `de(mot)` (élision), `fromPlace`/`inPlace` (du Mans, au Havre), `titleCase`. Une fonction par
  catégorie (rock, startup, creature, cocktail, vilain, bateau, wifi) qui renvoie `{name, emoji, lines:[[label, texte]]}`.
  `generate(cat, seed)` : RNG = `createRng(seed normalisée + '#' + cat)`, donc même graine = même résultat.
  `toText` sert à la copie.
- **noms/main.js** : catégories en vrais boutons radio, effet machine à sous (désactivé si reduced-motion),
  URL `?c=cat&s=graine` (graine aléatoire numérique si le champ est vide), favoris dans
  `zinzin:noms:favoris` (60 maximum), copie, lien, image PNG.
- **jeu/data/films.js** (✅ étape 4) : 221 films `[titre FR, émojis, année, genre, réalisation, [alias]]`.
  ⚠️ Ajouter ou retirer un film change la permutation, donc tous les puzzles à venir : ajouter en fin de liste,
  en connaissance de cause. Les tests vérifient : ≥ 200 films, aucune ambiguïté de titre ou d'alias après normalisation.
- **jeu/data/pays.json** : généré par `npm run data` (`scripts/build-countries.mjs`, Natural Earth 1:50m via
  world-atlas, codes ISO via i18n-iso-countries, noms FR via `Intl.DisplayNames` + `NAME_OVERRIDES`).
  229 pays `{c, n, lat, lon, a (km²), p (tracé SVG 100×100), pool}`, 268 Ko. Les parties lointaines sont
  écartées (outre-mer français…) : on ne garde que ce qui est à moins de max(15°, diagonale du polygone
  principal). L'antiméridien est géré (Russie, Fidji). `pool` = aire ≥ 20 000 km² (152 pays tirables).
  Pour les codes en double (AU), on garde la plus grande aire.
- **jeu/geo.logic.js** : `haversine`, `bearing`, `direction8` (8 flèches), `proximity` (% par rapport aux antipodes),
  `compareCountries`, `proximitySquares` (5 cases), plus les outils du script : `ringArea`, `ringCentroid`,
  `simplify` (Douglas-Peucker).
- **jeu/game.logic.js** : `puzzleNumber`, `permutation(length, salt)` (fixe, graine `zinzin-jeu-<mode>`),
  `dailyIndex(dateKey, length, salt)` = permutation[(jour − lancement) mod length] ; `normalize` (accents,
  ligatures, ponctuation, article initial), `matches`, `findEntry`, `suggest` ; `newGame`/`restoreGame`/`addGuess`
  (6 essais), `recordResult` (idempotent par jour, série = victoires sur des jours consécutifs), `currentStreak`,
  `shareText` (sans spoiler), `filmHints` (année → genre → réalisation → nombre de mots → première lettre).
- **jeu/main.js** : onglets ARIA (flèches gauche et droite, `#emojifilm` / `#silhouette`), `pays.json` chargé à la demande,
  parties dans `zinzin:jeu:<film|pays>:partie`, stats dans `…:stats`, `<dialog>` des statistiques avec histogramme,
  changement de jour détecté à la volée.
- **shared/autocomplete.js** : `attachAutocomplete(input, {source, onSelect})`, motif ARIA combobox/listbox complet.
- **shared/share.js** : `shareOrCopy` n'utilise le partage natif que sur écran tactile (`pointer: coarse`).
- **roue/wheel.logic.js** (✅ étape 5) : convention : rotation dans le sens horaire, pointeur en haut (−π/2). La taille d'une part
  est proportionnelle à son poids, donc ce qu'on voit = la probabilité réelle. `sanitizeOption(s)` (40 options max, libellé
  de 40 caractères max, poids entier de 1 à 10, couleur #hex), `segments`, `weightedIndex(options, r)`, `indexAtRotation`,
  `targetRotation(options, index, offset, current, turns)` (s'arrête dans les 80 % centraux de la part tirée),
  `spinProgress(t)` (vitesse : montée linéaire jusqu'à t = 0,12, puis décroissance quadratique, continue),
  `removeAt`, `probabilities`, `encodeList`/`decodeList` (JSON compact → base64url, compatible UTF-8).
- **roue/presets.js** : 8 listes prêtes à l'emploi (On mange quoi ?, Qui fait la vaisselle ?, Film ou série ?, Action ou vérité…).
- **roue/main.js** : canvas net sur écrans haute densité (ResizeObserver), libellés retournés sur la moitié gauche, réduits puis
  tronqués s'ils sont trop longs. Tirage par `crypto.getRandomValues`, cliquetis Web Audio à chaque changement de part et
  petite fanfare. Mode « éliminer » (minimum 2 options, bouton pour les remettre). Clés : `zinzin:roue:courante`,
  `zinzin:roue:listes` (30 max), `zinzin:roue:reglages`. URL `?l=…` pour une roue partagée (le paramètre est retiré
  après chargement). Espace = lancer.
- **roue/confetti.js** : confettis en canvas plein écran, ignorés si reduced-motion.

**Calendrier de l'Avent (✅ étape 8, `/avent/`)**
- **avent/avent.logic.js** : `adventState(dateKey)` → `{phase: 'avant'|'pendant'|'apres', season, openUpTo, daysUntilStart}`
  (du 25 décembre au 6 janvier, tout est ouvert ; la saison du 1er au 6 janvier = année précédente). `isUnlocked`, `doorOrder`
  (permutation fixe, graine `zinzin-avent`), générateurs à graine qui réutilisent le moteur des noms : `elfName(prénom)`,
  `absurdGift`, `absurdMenu` (participes accordés), `absurdWish`, plus `finalMessage`.
- **avent/calendrier.js** : 24 cases `{day, type, emoji, title, …}`. Types : anecdote, blague, defi, lien (`href: 'roue-desserts'`
  = roue encodée à la volée), lutin, cadeau, menu, carte (PNG), quiz, chrono, final (confettis + bilan). Les anecdotes sont des faits
  bien établis (Sélestat 1521, Gemini 6, Strasbourg 1570, secrétariat de Libourne 1962…).
- **avent/main.js** : grille de portes, `<dialog>` de contenu, cases ouvertes dans `zinzin:avent:<saison>`, compte à rebours
  (avant décembre : jusqu'au 1er ; pendant : jusqu'à la case suivante), changement de jour détecté à la volée.
- Test e2e avec `context.clock.install({ time })` de Playwright pour voyager dans le temps (23 nov., 5 déc., 26 déc.).
  La case du jour pulse en continu : il faut `click({ force: true })` dans les tests.
- Accueil : nouvelle section **« Encore plus de zinzin »** (`.more` + `.mini-card[data-accent]`), où ajouter les apps secondaires.

**Père Noël secret (✅ étape 9, `/pere-noel-secret/`)**
- **pere-noel-secret/santa.logic.js** : `sanitizeNames` (doublons insensibles à la casse et aux accents, 50 personnes maximum),
  `draw(n, exclusions, rng)` (retour arrière randomisé, donneurs les plus contraints d'abord, plafond de 200 000 étapes ;
  renvoie `null` si c'est impossible), `isValidDraw`, `encodeTicket`/`decodeTicket` (AES-GCM Web Crypto ; jeton base64url =
  clé 16 octets + IV 12 octets + texte chiffré ; un jeton modifié est rejeté), `inviteMessage`.
- **Sécurité, à dire honnêtement :** la clé est dans le lien, ce qui protège contre le spoiler accidentel, pas contre un curieux.
  Le jeton est dans le fragment `#` : il n'est jamais envoyé au serveur. Le tirage lui-même n'est stocké nulle part ; seul le
  brouillon (noms, exclusions, infos) est gardé dans `zinzin:pns:brouillon`.
- **pere-noel-secret/main.js** : mode révélation si `location.hash` fait plus de 20 caractères (paquet cadeau, confettis, idée de
  cadeau absurde via `absurdGift`), sinon mode organisateur (collage d'une liste « a, b; c », exclusions dans les deux sens,
  copie des messages un par un ou tous ensemble, retirage avec confirmation).

**Album d'autocollants (✅ étape 10, `/album/`)**
- **shared/stickers.js** : `STICKERS` (30 autocollants `{id, app, emoji, name, hint}`), `APP_LABELS`, `unlock(id)` (une seule fois,
  toast « Nouvel autocollant », méta-succès album-10/20/complet), `bump(compteur, n, {palier: id})`, `collect(ensemble, valeur)`,
  `trackVisit(app)` (bienvenue, explorateur = 4 apps principales, noctambule avant 5 h), `progress()`, `setNotifier` (tests).
  Stockage : `zinzin:album` (`{id: horodatage}`) et `zinzin:album:compteurs`.
- **Ajouter un autocollant :** l'ajouter dans `STICKERS` (avec une `app` présente dans `APP_LABELS`), puis appeler `unlock('id')` dans l'app.
  Chaque `main.js` appelle `trackVisit('<app>')` au chargement. Le succès `licorne` (code Konami) sera branché à l'étape 13.
- **album/** : groupes par app, silhouettes « ? » + indice, date d'obtention, barre de progression, partage des émojis obtenus.

**Jeu du jour V2 (✅ étape 11)**
- **jeu/data/chansons.js** : environ 135 chansons `[titre, émojis, année, langue, interprète, [alias]]` (même règle : ajouter en fin de liste).
- **game.logic.js**, ajouts : `MODE_TITLES`, `scoreOf`, `shareText(mode, game, n, details, url)` (l'URL est passée telle quelle,
  🔥 si `game.hard`), `itemHints(item, errors, 'film'|'chanson')`, `puzzleKey(n)`, `challengeUrl`, `parseChallenge(params, nDuJour)`
  (`?m=film|pays|chanson&n=…&defi=1-6|X`, refuse les puzzles du futur), `challengeVerdict`, `recordHistory`,
  `dailyRotation(dateKey)` (90, 180 ou 270°), `nextOpponent` (écart d'aire ≥ 5 %), `biggerOrSmaller`. Tests dans `tests/game2.test.js`.
- **jeu/main.js** (réécrit) : 4 onglets (`#emojifilm`, `#silhouette`, `#emojichanson`, `#plus-ou-moins`, flèches gauche et droite).
  La fabrique `guessMode(cfg)` est commune aux 3 modes devinettes. Archive (`n` ≠ n° du jour) : partie dans `jeu:<mode>:archive`, sans
  stats ni série. Historique de toutes les parties terminées dans `jeu:<mode>:historique`, ce qui alimente le dialogue « Archives ».
  Le partage contient toujours un lien de défi. Mode difficile = case à cocher avant le 1er essai (`game.hard`, silhouette pivotée).
  Plus ou moins : partie infinie (crypto), record dans `jeu:plusmoins:record`.
- Nouveaux autocollants : `jeu-archive`, `jeu-defi`, `jeu-geographe` (33 au total).
- ⚠️ **Piège DOM :** `parent.replaceChildren(a, null)` insère le texte « null ». Filtrer avec `...[…].filter(Boolean)`
  (`el()` ignore déjà les enfants nuls, mais pas `replaceChildren`).

**Mini-apps (✅ étape 12)** (dans « Encore plus » sur l'accueil, autocollants du groupe `mini`)
- **horoscope/** : `horoscope(signe, dateKey)` à graine `horoscope#date#signe` (amour, travail, santé, conseil, étoiles, chiffre, couleur),
  12 signes en `role="radio"` (flèches), signe retrouvé depuis une date (`westernZodiac`), signe dans `zinzin:horoscope:signe`.
- **quiz/** : `quizzes.js` (fromage, viennoiserie, légume : `{results, questions:[{text, answers:[{label, points}]}]}`),
  `computeResult` (égalité départagée par l'ordre des résultats). Le test parcourt TOUTES les combinaisons et vérifie que
  chaque résultat est atteignable. URL partagée `?q=<quiz>&r=<résultat>`, derniers résultats dans `zinzin:quiz:resultats`.
- **chrono/** : `dailyTarget(dateKey)` (4,00 à 15,00 s), `rate`, `formatSeconds`, `formatDiff`, `best` ; affichage masqué après 3 s,
  `performance.now()`, Espace (seulement si le focus est sur la page), essais dans `zinzin:chrono:libre` et `zinzin:chrono:jour:<date>`.
- **equipes/** : `makeTeams` (écart ≤ 1), `teamsForSize`, `teamName` (moteur des noms), `rollDice` (D4 à D20, crypto) ; 20 naturel = autocollant.
- **excuses/** : `excuse(contexte, graine)` avec 6 contextes, participes accordés, élision « que un » → « qu'un ».
- Composants communs ajoutés à `base.css` : `.pill` (pastille radio) et `.block-title`.
- Pages générées une fois avec un gabarit (script temporaire, hors repo). Pour une nouvelle page, copier une page existante.

**Finitions (✅ étape 6)**
- **scripts/build-og.mjs** : génère (une fois, résultat commité) les images OG 1200×630 `public/assets/og/<slug>.png`
  (liste `OG_PAGES`, déjà prévue pour avent, pere-noel-secret et album) et les icônes `public/assets/icons/`
  (192, 512, maskable-512, apple-touch-icon). La police est intégrée en data: URL.
- **scripts/seo-meta.mjs** : **à relancer après chaque nouvelle page** (ajouter la page à `PAGES`). Il insère ou remplace le
  bloc `<!-- seo -->…<!-- /seo -->` (canonical, manifest, apple-touch-icon, Open Graph, Twitter card) en
  réutilisant le `<title>` et la description de la page, puis réécrit `sitemap.xml` et `robots.txt`.
- **public/manifest.webmanifest** : PWA (standalone, raccourcis vers les 4 apps).
- **public/sw.js** : service worker « réseau d'abord, cache en secours » pour TOUT (pas de mélange de versions
  après un déploiement), précache complet. **Ajouter chaque nouveau fichier à `PRECACHE` et incrémenter
  `VERSION`** (`tests/sw.test.js` échoue sinon). Enregistré depuis `shared/ui.js` (importé par toutes les pages).
- **public/_headers** : CSP stricte `default-src 'self'` (pas d'inline), nosniff, X-Frame-Options DENY,
  Referrer-Policy, Permissions-Policy, HSTS, cache 7 j pour `/assets/*`, 1 j pour `/jeu/data/*`, `no-cache` pour `sw.js`.
- **public/_redirects** : raccourcis (/wordle, /emojifilm, /silhouette, /age, /generateur…).
- **tests/sw.test.js** : précache = fichiers servis ; chaque page a titre, description, bloc SEO, entrée dans le
  sitemap, image OG et aucun inline ; manifest valide.
- **README.md** + `docs/captures/*.jpg` (prises sur la prod avec playwright).
- **Résultats Lighthouse (mobile, prod, 2026-11-23)** : accessibilité, bonnes pratiques et SEO = 100 partout ;
  performance de 97 à 100, roue de 90 à 97 (TBT bruité). Commande :
  `CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" npx lighthouse@12 <url> --chrome-flags="--headless=new"`.

---

## 5. Commandes utiles

```bash
npm install              # une seule fois (devDependencies pour /scripts)
npm test                 # node --test tests/
npm run serve            # serveur local → http://localhost:3000 (scripts/serve.mjs ; `npx serve public` marche aussi)
npm run check            # vérif. navigateur de toutes les pages (Edge headless) + captures dans tmp/screens/
node scripts/check-pages.mjs / /roue/   # vérifier seulement certaines pages
npm run data             # (re)génère public/jeu/data/pays.json depuis world-atlas
npm run deploy           # envoie public/ sur le Worker Cloudflare (wrangler local, déjà connecté)
node scripts/seo-meta.mjs   # balises SEO + sitemap + robots (après ajout de page)
node scripts/build-og.mjs   # images OG + icônes (après ajout de page)
```

Déploiement : `git push` puis `npm run deploy` (voir §8). Le déploiement auto au push n'est pas encore branché.

> Environnement : Windows 11, PowerShell 5.1. Si `node`, `git` ou `gh` sont « introuvables »
> dans un terminal ouvert avant l'installation, recharger le PATH :
> `$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')`

---

## 6. Décisions et justifications

| # | Décision | Raison |
|---|----------|--------|
| D1 | Nom « Zinzin » | Court, mémorisable, ton joueur, 100 % français |
| D2 | Vanilla JS, modules ES, sans build | Exigence du projet ; déploiement trivial et site léger |
| D3 | Logique métier dans `*.logic.js` sans DOM | Testable avec `node --test` sans jsdom ni dépendance |
| D4 | RNG mulberry32 et hash de chaîne cyrb53 | Rapide, déterministe, identique navigateur/Node, domaine public |
| D5 | Puzzle du jour = permutation fixe (graine constante) indexée par le n° du jour à Paris | Même puzzle pour tout le monde, pas de répétition avant d'avoir épuisé la liste |
| D6 | Pleines lunes : algorithme de Meeus (chap. 49, termes principaux) au lieu du cycle moyen | Vrai calcul astronomique, précis à la minute ; réutilisé pour le Nouvel An chinois |
| D7 | Données pays pré-traitées une fois par `scripts/` puis commitées en JSON | Le site n'a aucune étape de build et Cloudflare sert le fichier statique |
| D8 | Police display auto-hébergée (OFL) | Identité visuelle forte, sans CDN (contrainte perf et vie privée) |
| D9 | Outils manquants (Node, git, gh) installés via winget | Absents de la machine au démarrage (2026-11-18) |
| D10 | Police Bricolage Grotesque (variable, sous-ensemble latin, `@fontsource-variable`) copiée dans `public/assets/fonts/` | Caractère « bricolé » qui colle au ton, 41 Ko, licence OFL |
| D11 | Serveur maison `scripts/serve.mjs` plutôt que `npx serve` | Fonctionne hors ligne, imite le routage de Cloudflare Pages (slash final, 404) |
| D12 | Vérification navigateur par `playwright-core` + Edge installé | Pas de navigateur à télécharger ; contrôles reproductibles (console, débordement, a11y de base) |
| D13 | En-tête et pied de page dupliqués dans chaque HTML | Contrainte « zéro build » ; HTML complet dès le premier octet (SEO, sans JS) |
| D14 | Pas de style ni de script inline dans le HTML | Permet une CSP stricte (`script-src 'self'`, `style-src 'self'`) dans `_headers` |
| D15 | `.gitattributes` force les fins de ligne LF | Environnement Windows ; diffs propres et identiques sur Cloudflare |
| D16 | Hébergement Cloudflare **Workers + assets statiques** (`wrangler.jsonc`) au lieu de Pages | C'est ce que l'utilisateur a créé dans le tableau de bord ; même résultat (statique, `_headers` et `_redirects` gérés), et c'est la voie recommandée par Cloudflare |
| D18 | Nouvel An chinois calculé (solstice + nouvelles lunes, heure de Pékin) plutôt qu'une table | Pas de données à saisir ; la règle « 21 janv.-20 févr. » est fausse en 1985 et 1966, la vraie règle passe tous les tests |
| D19 | Python absent de la machine : scripts utilitaires en Node uniquement | Node est déjà requis ; une dépendance de moins |
| D20 | Les noms générés sont « fuzzés » (1 500 par catégorie dans les tests, 35 000 pendant le développement) | Les fautes d'accord n'apparaissent qu'au hasard des combinaisons ; c'est le seul moyen fiable de les débusquer |
| D21 | `[hidden] { display: none !important }` global | Sinon `.btn` (`display: inline-flex`) annule l'attribut `hidden` |
| D22 | Partage natif réservé au tactile | Sur ordinateur, Edge ouvre le panneau de partage Windows au lieu de copier : pas pratique pour coller un score façon Wordle |
| D23 | Silhouettes en SVG (tracés pré-calculés) plutôt qu'en canvas | Net à toutes les tailles, stylable en CSS (thème sombre), aucun calcul au chargement |
| D24 | Après un déploiement, attendre 1 à 2 min avant de vérifier la prod | Les nouveaux fichiers se propagent progressivement sur le réseau Cloudflare (404 temporaires constatés) |
| D25 | wrangler en devDependency (version fixe) au lieu de `npx wrangler@4` | Le paquet téléchargé par npx était incomplet (`workerd-windows-64` manquant) |
| D26 | Service worker « réseau d'abord » (et non « cache d'abord ») | Fichiers non versionnés : évite de servir un ancien JS avec un nouveau HTML ; le cache ne sert que hors ligne |
| D27 | Ombre de la roue dessinée dans le canvas plutôt qu'en `filter: drop-shadow` | Le filtre recalculait toute l'image à chaque image de l'animation (TBT et fluidité sur mobile) |
| D28 | Bloc SEO injecté par un script de maintenance, résultat commité | Respecte « zéro build » tout en évitant 9 copies manuelles des balises |
| D29 | Apps secondaires dans « Encore plus » sur l'accueil, pas dans la nav | La nav doit rester lisible sur mobile (4 émojis) |
| D30 | Scripts de modification écrits dans des fichiers (outil d'écriture), pas en ligne de commande | Un `\\b` passé par bash puis node est devenu un vrai caractère 0x08 dans une regex (bug silencieux, test faussement vert) |
| D17 | `404.html` avancée dès le branchement de Cloudflare | `not_found_handling: 404-page` l'exige ; évite que les apps pas encore codées renvoient l'accueil |

---

## 7. ROADMAP

### Étape 0 — Mémoire et initialisation
- [x] Choisir le nom du site (Zinzin)
- [x] Rédiger CLAUDE.md (vision, stack, conventions, roadmap)
- [x] `.gitignore`
- [x] Installer Node LTS, Git et GitHub CLI (winget) — Node 26.13.1, git 2.56, gh 2.105
- [x] `git init` (branche `main`) + premier commit

### Étape 1 — Socle et design system
- [x] `package.json` (`"type": "module"`, scripts `test`, `serve`, `data`, `check`)
- [x] `shared/tokens.css` + `shared/base.css` (reset, layout mobile-first, cartes, boutons, formulaires, toasts, mode sombre, reduced-motion)
- [x] Police display auto-hébergée (Bricolage Grotesque, 41 Ko) + `favicon.svg`
- [x] `shared/rng.js`, `shared/dates.js`, `shared/storage.js`, `shared/share.js`, `shared/image.js`, `shared/ui.js`, `shared/site.js`
- [x] Tests : RNG à graine (valeurs figées), `parisDateKey`, minuit Paris et changements d'heure, n° du jour, storage
- [x] Page d'accueil (hub des 4 apps + puzzle du jour + compte à rebours) + page À propos (résumé et effacement des données)
- [x] Outils de vérification : `scripts/serve.mjs` (imite Pages) + `scripts/check-pages.mjs` (Edge headless)
- [x] Vérification navigateur + commit

### Étape 2 — App A « Ce jour-là »
- [x] Formulaire date (+ heure optionnelle), lecture et écriture des paramètres d'URL
- [x] Âge exact avec compteur en temps réel
- [x] Jalons (passés/futurs) + compte à rebours du prochain
- [x] Âge sur chaque planète
- [x] Pleines lunes vécues
- [x] Estimations (cœur, respirations, nuits, km Terre/Soleil), présentées comme telles
- [x] Jour de la semaine, signe astrologique, signe chinois
- [x] Compte à rebours jusqu'au prochain anniversaire
- [x] Export .ics du prochain jalon
- [x] Carte PNG partageable (canvas)
- [x] Tests : âges, jalons, pleines lunes, zodiaques, ICS
- [x] Vérification navigateur + commit

### Étape 3 — App B « Générateur de noms absurdes »
- [x] Dictionnaires FR (≥ 80 éléments par liste) avec genre et nombre
- [x] Moteur de gabarits avec accords
- [x] 7 catégories + pitch par catégorie
- [x] Mode graine (prénom → résultat stable)
- [x] Favoris (localStorage), copie, carte PNG
- [x] Tests : accords, déterminisme de la graine, tailles des dictionnaires
- [x] Vérification navigateur + commit

### Étape 4 — App C « Le jeu du jour »
- [x] Base ≥ 200 films (titre FR, émojis, année, genre, réalisateur)
- [x] `scripts/build-countries.mjs` → `public/jeu/data/pays.json` (contours simplifiés + centroïdes)
- [x] Choix du puzzle du jour (Europe/Paris), compte à rebours jusqu'à minuit
- [x] Mode Émojifilm : 6 essais, indices progressifs, autocomplétion, tolérance accents/casse
- [x] Mode Silhouette : rendu de la forme en SVG/canvas, distance, flèche, % de proximité
- [x] Sauvegarde de la partie en cours, statistiques, série, histogramme
- [x] Partage émojis sans spoiler
- [x] Tests : puzzle du jour, comparaison avec accents, distance/direction
- [x] Vérification navigateur + commit

### Étape 5 — App D « Roue de la décision »
- [x] Roue canvas + physique (accélération puis décélération)
- [x] Cliquetis Web Audio optionnel
- [x] Édition des options (ajout, suppression, couleur, poids)
- [x] Listes prêtes à l'emploi
- [x] Listes perso (localStorage) + partage URL
- [x] Mode « éliminer l'option tirée » + confettis
- [x] Tests : tirage pondéré, angle cible, sérialisation URL
- [x] Vérification navigateur + commit

### Étape 6 — SEO et finitions
- [x] Meta, Open Graph et Twitter card par page + images OG (stockées dans le repo)
- [x] `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, page `404.html`
- [x] `_headers` (cache + sécurité, CSP stricte) et `_redirects`
- [x] Audit accessibilité (clavier, contrastes, ARIA)
- [x] Lighthouse > 90 partout
- [x] README.md complet (captures, lancement, déploiement)
- [x] Bonus : service worker (PWA hors ligne)
- [x] Commit

### Étape 7 — Déploiement
- [x] `gh auth login` (compte `ltracker`) + création du repo GitHub public `ltracker/zinzin` + push sur `main`
- [x] Worker Cloudflare `zinzin` créé (URL workers.dev) + `wrangler.jsonc` (assets statiques `./public`)
- [x] wrangler connecté (`wrangler login`) + premier `npm run deploy` réussi
- [x] Vérification de l'URL de production (accueil 200, 404 OK, police OK, aucune erreur console)
- [ ] (Optionnel, action de l'utilisateur dans le tableau de bord) Déploiement auto à chaque push : Worker → Settings → Builds → Connect, voir §8

---

## 7 bis. ROADMAP V2 (validée par l'utilisateur le 2026-11-23 : « je les veux toutes »)

Ordre de réalisation : étape 6 (finitions V1) → 8 (échéance 1er décembre) → 9 → 10 → 11 → 12 → 13.
Chaque nouvelle app suit les conventions V1 : `*.logic.js` pur + tests, page `/slug/`, carte sur l'accueil,
lien dans la nav si pertinent (sinon section « Encore plus » de l'accueil), entrée dans `sitemap.xml` et
précache du service worker, vérif. `check-pages`, commit, `git push`, `npm run deploy`.

### Étape 8 — Calendrier de l'Avent zinzin (`/avent/`) — ⏰ en ligne avant le 1er décembre
- [x] 24 cases, déverrouillées à minuit Europe/Paris (1er-24 décembre) ; avant décembre : aperçu + compte à rebours
- [x] Contenu varié : blagues, défis absurdes, anecdotes, mini-jeux, cartes à partager (fichier de données)
- [x] Cases ouvertes mémorisées (localStorage), animation d'ouverture, partage
- [x] Tests : déverrouillage selon la date de Paris, complétude des 24 contenus

### Étape 9 — Père Noël secret sans serveur (`/pere-noel-secret/`)
- [x] Saisie des participants + exclusions (couples), tirage en dérangement valide (personne ne se tire soi-même)
- [x] Un lien par participant qui ne révèle que SON destinataire (chiffré dans le fragment `#`, jamais envoyé au serveur)
- [x] Budget, date de l'échange, message ; copie et partage des liens
- [x] Tests : tirage valide avec exclusions, cas impossibles détectés, chiffrement aller-retour

### Étape 10 — Album d'autocollants (succès transverses, `/album/`)
- [x] Module `shared/stickers.js` : catalogue + `unlock(id)` (localStorage) + toast « Nouvel autocollant ! »
- [x] Succès dans toutes les apps (gagné en 1 essai, série de 7 jours, 100 tours de roue, né·e un vendredi 13…)
- [x] Page album (autocollants obtenus / silhouettes à découvrir)

### Étape 11 — Nouveaux modes du jeu du jour
- [x] « Plus grand ou plus petit ? » (aires des pays, série, record) — réutilise `pays.json`
- [x] Archives : rejouer les puzzles passés
- [x] Défi entre amis : lien « bats mon score sur le n° X »
- [x] « Chanson en émojis » (nouvelle base de titres)
- [x] Mode difficile (silhouette pivotée/zoomée)

### Étape 12 — Nouvelles mini-apps
- [x] Horoscope absurde du jour (par signe, identique pour tous ce jour-là)
- [x] Quiz « Quel fromage / baguette / légume es-tu ? » + image de résultat
- [x] Chrono parfait (arrêter à 10,00 s) + défi quotidien
- [x] Formeur d'équipes + lanceur de dés
- [x] Générateur d'excuses bidon (moteur d'accords des noms)

### Étape 13 — Améliorations de l'existant
- [ ] Ce jour-là : mode duo (deux dates), âge en années de chien/chat, compte à rebours retraite
- [ ] Noms : « ton nom de pirate / catcheur / elfe » (prénom + date), mode « 10 d'un coup »
- [ ] Roue : mode tournoi, tirage d'équipes, thèmes sonores
- [ ] Partout : bouton clair/sombre manuel, easter egg (code Konami 🦄)

---

## 8. Déploiement (procédure)

> **Hébergement réel : Cloudflare Workers (assets statiques), pas Cloudflare Pages.**
> L'utilisateur a créé un Worker `zinzin` (URL `*.workers.dev`). Un Worker sans script qui
> sert `./public` équivaut à Pages pour un site statique : `_headers` et `_redirects` sont
> pris en charge de la même façon. La config se trouve dans **`wrangler.jsonc`** à la racine :
> `assets.directory = ./public`, `html_handling = auto-trailing-slash` et
> `not_found_handling = 404-page` (sert `public/404.html` avec un statut 404).

**Méthode actuelle (en place) : déploiement direct avec wrangler depuis cette machine.**
wrangler est connecté au compte Cloudflare de l'utilisateur (`npx wrangler@4 login` fait le 2026-11-18,
jeton OAuth stocké localement). À la fin de chaque étape : `git push`, puis **`npm run deploy`**,
puis vérification de l'URL de prod (curl + navigateur). Si wrangler demande à se reconnecter,
relancer `npx wrangler@4 login` (le navigateur s'ouvre, l'utilisateur clique sur « Allow »).

**Optionnel : déploiement automatique à chaque push** (non branché à ce jour). Voir les étapes 2 et 3 ci-dessous ;
il faut le faire dans le tableau de bord, car l'installation de l'app GitHub ne passe pas par la CLI.

1. **GitHub** : `gh auth login` (une fois), puis `gh repo create zinzin --public --source . --remote origin --push`. ✅ Fait.
2. **Cloudflare** (tableau de bord) : *Workers & Pages* → Worker **zinzin** → *Settings* →
   *Builds* → *Connect* (Git repository) → GitHub `ltracker/zinzin`.
   - Branche : `main`
   - Commande de build : **(vide)**
   - Commande de déploiement : `npx wrangler deploy` (valeur par défaut)
   - Répertoire racine : `/` (valeur par défaut)
3. Chaque `git push` sur `main` lance un build Cloudflare (`npx wrangler deploy`), qui envoie `public/`.
   Le site lui-même n'a aucune étape de build : wrangler ne fait qu'envoyer les fichiers.
4. Vérifier la config en local sans déployer : `npx wrangler@4 deploy --dry-run --outdir %TEMP%\wrangler-dry`.
5. `public/_headers` (étape 6) définira le cache (long pour `/assets/*`, court pour le HTML) et les
   en-têtes de sécurité (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
6. Alternative possible : un projet **Pages** (framework None, build vide, sortie `public`). Ignore `wrangler.jsonc` si non utilisé.

**Repo GitHub : https://github.com/ltracker/zinzin** (public, branche `main`, remote `origin`)

**URL de production : https://zinzin.johan-saez-craponne.workers.dev/** (aussi dans `public/shared/site.js` → `SITE.url`)

---

## 9. Idées pour la suite

Toutes ces idées sont **validées** et planifiées dans la ROADMAP V2 (§7 bis). Classement par rapport
impact/effort (I et E notés de 1 à 5 ; ratio = I/E, le plus haut en premier) :

| # | Idée | Impact | Effort | Ratio | Étape |
|---|------|:-:|:-:|:-:|:-:|
| 1 | Chrono parfait (10,00 s) + défi du jour | 3 | 1 | 3,0 | 12 |
| 2 | Archives du jeu du jour | 3 | 1 | 3,0 | 11 |
| 3 | Défi entre amis (score dans l'URL) | 3 | 1 | 3,0 | 11 |
| 4 | « Plus grand ou plus petit ? » (pays) | 4 | 2 | 2,0 | 11 |
| 5 | Horoscope absurde du jour | 4 | 2 | 2,0 | 12 |
| 6 | Quiz « Quel fromage es-tu ? » | 4 | 2 | 2,0 | 12 |
| 7 | Calendrier de l'Avent zinzin (saisonnier) | 5 | 3 | 1,7 | 8 |
| 8 | Père Noël secret sans serveur (saisonnier, viral) | 5 | 3 | 1,7 | 9 |
| 9 | Mode difficile (silhouette pivotée) | 2 | 1 | 2,0 | 11 |
| 10 | Bouton clair/sombre + easter egg Konami | 2 | 1 | 2,0 | 13 |
| 11 | Excuses bidon | 3 | 2 | 1,5 | 12 |
| 12 | Équipes + dés | 3 | 2 | 1,5 | 12 |
| 13 | Album d'autocollants (fidélisation transverse) | 4 | 3 | 1,3 | 10 |
| 14 | Ce jour-là : duo, chien/chat, retraite | 3 | 2 | 1,5 | 13 |
| 15 | Noms : pirate/catcheur/elfe, « 10 d'un coup » | 3 | 2 | 1,5 | 13 |
| 16 | Roue : tournoi, équipes, thèmes sonores | 3 | 3 | 1,0 | 13 |
| 17 | Chanson en émojis (grosse base à saisir) | 3 | 3 | 1,0 | 11 |
| 18 | Déploiement auto à chaque push (tableau de bord Cloudflare) | 2 | 1 | 2,0 | 7 |

L'ordre réel suit d'abord les échéances : l'Avent avant le 1er décembre, le Père Noël secret avant mi-décembre.

---

## 10. Journal

- **2026-11-18** : Étape 0. Nom choisi, CLAUDE.md rédigé. Node, git et gh absents de la machine, puis installés via winget. Dépôt git initialisé sur `main`. gh n'est pas encore connecté (`gh auth login` à faire avant l'étape 7).
- **2026-11-18** : Étape 1 terminée. Design system, modules partagés, accueil et À propos en place. 17 tests verts, `npm run check` propre sur `/` et `/a-propos/`. Prochaine étape : **App A « Ce jour-là »**.
- **2026-11-18** : gh connecté (compte `ltracker`). Repo https://github.com/ltracker/zinzin créé et poussé (avancé depuis l'étape 7 à la demande de l'utilisateur). Cloudflare Pages pas encore branché.
- **2026-11-18** : l'utilisateur a créé un **Worker** Cloudflare (https://zinzin.johan-saez-craponne.workers.dev/) qui servait « Hello world » (pas relié à Git). Ajout de `wrangler.jsonc` (assets statiques) et de `404.html`, `SITE.url` mis à jour. Reste à relier le Worker au repo dans Settings → Builds.
- **2026-11-18** : diagnostic : le Worker n'avait reçu que les envois du modèle « Hello world », sans build Git. `wrangler login` puis `wrangler deploy` : **site en ligne et vérifié**. Script `npm run deploy` ajouté.
- **2026-11-18** : **Étape 2 terminée : app A « Ce jour-là »** en ligne. 18 tests (Meeus, Nouvel An chinois 1900-2026, ICS…), parcours testé dans Edge (clavier, .ics, PNG, lien). Prochaine étape : **app B « Noms absurdes »**.
- **2026-11-18** : **Étape 3 terminée : app B « Noms absurdes »** en ligne. Accords corrigés grâce au fuzzing (h aspiré, « toutes les », « le nouvel », « d'avaler », « du Mans »). 44 tests au total. Prochaine étape : **app C « Le jeu du jour »**.
- **2026-11-18** : **Étape 4 terminée : app C « Le jeu du jour »** en ligne (221 films, 229 pays). Parties complètes jouées dans Edge (essai raté, indice, autocomplétion au clavier sans accents, victoire, stats, rechargement, partage). 60 tests. Prochaine étape : **app D « Roue de la décision »**.
- **2026-11-18** : **Étape 5 terminée : app D « Roue de la décision »** en ligne. Vérifié dans Edge : la part sous le pointeur = le résultat annoncé, édition, élimination, enregistrement, lien partagé. 69 tests. **Les 4 apps sont en ligne.** Prochaine étape : **étape 6, SEO et finitions** (OG, manifest, sitemap, _headers, Lighthouse, README, PWA).
- **2026-11-23** : ROADMAP V2 ajoutée (toutes les idées validées). **Étape 6 terminée** : OG, Twitter card, manifest, icônes, sitemap, robots, _headers (CSP stricte vérifiée en prod), _redirects, service worker (hors ligne vérifié), README avec captures. Lighthouse ≥ 90 partout. wrangler désormais local. Prochaine étape : **8, Calendrier de l'Avent** (avant le 1er décembre).
- **2026-11-23** : **Étape 8 terminée : Calendrier de l'Avent** (`/avent/`) en ligne, prêt pour le 1er décembre. Vérifié par voyage dans le temps (avant, pendant, après) : les 24 cases s'ouvrent sans erreur. 79 tests. Prochaine étape : **9, Père Noël secret**.
- **2026-11-23** : **Étape 9 terminée : Père Noël secret** en ligne. Vérifié de bout en bout : collage d'une liste, exclusion d'un couple, 6 liens ouverts un à un, tirage valide, lien falsifié rejeté. 86 tests. Prochaine étape : **10, Album d'autocollants**.
- **2026-11-23** : **Étape 10 terminée : Album d'autocollants** en ligne (30 autocollants, déclencheurs dans toutes les apps). Non-régression complète : 11 pages, tests e2e jeu/roue/Père Noël secret, 91 tests unitaires. Prochaine étape : **11, nouveaux modes du jeu du jour**.
- **2026-11-23** : **Étape 11 terminée : jeu du jour V2** en ligne (Émojichanson, Plus ou moins, archives, défis entre amis, mode difficile). Bug « null » corrigé dans le jeu et la roue. 96 tests. Prochaine étape : **12, nouvelles mini-apps** (horoscope, quiz, chrono, équipes et dés, excuses).
- **2026-11-23** : **Étape 12 terminée : 5 mini-apps** en ligne (horoscope, quiz, chrono, équipes et dés, excuses). Testées de bout en bout, accords et élisions corrigés, référence à une franchise retirée. 102 tests. Prochaine étape : **13, améliorations de l'existant**.
