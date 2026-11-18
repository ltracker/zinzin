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
- **jeu/game.logic.js** : choix du puzzle du jour, normalisation et comparaison des réponses
  (sans accents ni casse), état de la partie, statistiques et texte de partage.
- **jeu/geo.logic.js** : distance haversine, cap initial → flèche (8 directions), % de proximité.
- **roue/wheel.logic.js** : tirage pondéré, angle cible, courbe de décélération, (dé)sérialisation des listes dans l'URL.

---

## 5. Commandes utiles

```bash
npm install              # une seule fois (devDependencies pour /scripts)
npm test                 # node --test tests/
npm run serve            # serveur local → http://localhost:3000 (scripts/serve.mjs ; `npx serve public` marche aussi)
npm run check            # vérif. navigateur de toutes les pages (Edge headless) + captures dans tmp/screens/
node scripts/check-pages.mjs / /roue/   # vérifier seulement certaines pages
npm run data             # (re)génère public/jeu/data/pays.json depuis world-atlas
npm run deploy           # envoie public/ sur le Worker Cloudflare (wrangler, déjà connecté)
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
- [ ] Base ≥ 200 films (titre FR, émojis, année, genre, réalisateur)
- [ ] `scripts/build-countries.mjs` → `public/jeu/data/pays.json` (contours simplifiés + centroïdes)
- [ ] Choix du puzzle du jour (Europe/Paris), compte à rebours jusqu'à minuit
- [ ] Mode Émojifilm : 6 essais, indices progressifs, autocomplétion, tolérance accents/casse
- [ ] Mode Silhouette : rendu de la forme en SVG/canvas, distance, flèche, % de proximité
- [ ] Sauvegarde de la partie en cours, statistiques, série, histogramme
- [ ] Partage émojis sans spoiler
- [ ] Tests : puzzle du jour, comparaison avec accents, distance/direction
- [ ] Vérification navigateur + commit

### Étape 5 — App D « Roue de la décision »
- [ ] Roue canvas + physique (accélération puis décélération)
- [ ] Cliquetis Web Audio optionnel
- [ ] Édition des options (ajout, suppression, couleur, poids)
- [ ] Listes prêtes à l'emploi
- [ ] Listes perso (localStorage) + partage URL
- [ ] Mode « éliminer l'option tirée » + confettis
- [ ] Tests : tirage pondéré, angle cible, sérialisation URL
- [ ] Vérification navigateur + commit

### Étape 6 — SEO et finitions
- [ ] Meta, Open Graph et Twitter card par page + images OG (stockées dans le repo)
- [ ] `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, page `404.html`
- [ ] `_headers` (cache + sécurité, CSP stricte) et `_redirects`
- [ ] Audit accessibilité (clavier, contrastes, ARIA)
- [ ] Lighthouse > 90 partout
- [ ] README.md complet (captures, lancement, déploiement)
- [ ] Bonus : service worker (PWA hors ligne)
- [ ] Commit

### Étape 7 — Déploiement
- [x] `gh auth login` (compte `ltracker`) + création du repo GitHub public `ltracker/zinzin` + push sur `main`
- [x] Worker Cloudflare `zinzin` créé (URL workers.dev) + `wrangler.jsonc` (assets statiques `./public`)
- [x] wrangler connecté (`wrangler login`) + premier `npm run deploy` réussi
- [x] Vérification de l'URL de production (accueil 200, 404 OK, police OK, aucune erreur console)
- [ ] (Optionnel) Déploiement auto à chaque push : Worker → Settings → Builds → Connect, voir §8

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

*(Section à compléter et classer par rapport impact/effort à la fin de la V1.)*

---

## 10. Journal

- **2026-11-18** : Étape 0. Nom choisi, CLAUDE.md rédigé. Node, git et gh absents de la machine, puis installés via winget. Dépôt git initialisé sur `main`. gh n'est pas encore connecté (`gh auth login` à faire avant l'étape 7).
- **2026-11-18** : Étape 1 terminée. Design system, modules partagés, accueil et À propos en place. 17 tests verts, `npm run check` propre sur `/` et `/a-propos/`. Prochaine étape : **App A « Ce jour-là »**.
- **2026-11-18** : gh connecté (compte `ltracker`). Repo https://github.com/ltracker/zinzin créé et poussé (avancé depuis l'étape 7 à la demande de l'utilisateur). Cloudflare Pages pas encore branché.
- **2026-11-18** : l'utilisateur a créé un **Worker** Cloudflare (https://zinzin.johan-saez-craponne.workers.dev/) qui servait « Hello world » (pas relié à Git). Ajout de `wrangler.jsonc` (assets statiques) et de `404.html`, `SITE.url` mis à jour. Reste à relier le Worker au repo dans Settings → Builds.
- **2026-11-18** : diagnostic : le Worker n'avait reçu que les envois du modèle « Hello world », sans build Git. `wrangler login` puis `wrangler deploy` : **site en ligne et vérifié**. Script `npm run deploy` ajouté.
- **2026-11-18** : **Étape 2 terminée : app A « Ce jour-là »** en ligne. 18 tests (Meeus, Nouvel An chinois 1900-2026, ICS…), parcours testé dans Edge (clavier, .ics, PNG, lien). Prochaine étape : **app B « Noms absurdes »**.
- **2026-11-18** : **Étape 3 terminée : app B « Noms absurdes »** en ligne. Accords corrigés grâce au fuzzing (h aspiré, « toutes les », « le nouvel », « d'avaler », « du Mans »). 44 tests au total. Prochaine étape : **app C « Le jeu du jour »**.
