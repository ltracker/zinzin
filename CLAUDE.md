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
  (ex. `feat(roue): tirage pondéré et confettis`).

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
├── package.json            ← scripts npm (test, serve, data) ; "type": "module"
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

- **shared/rng.js** : `hashString(str) → uint32` et `mulberry32(seed) → () => [0,1)`.
  Helpers `pick(rng, arr)`, `shuffle(rng, arr)`, `int(rng, min, max)`. Sert aux puzzles
  du jour, au générateur de noms à graine et aux tirages.
- **shared/dates.js** : `parisDateKey(date) → 'AAAA-MM-JJ'`, `msUntilParisMidnight(date)`,
  `dayNumber(key)` (nombre de jours depuis l'époque, pour indexer les puzzles).
- **shared/storage.js** : `load(key, fallback)` et `save(key, value)` en JSON, avec try/catch et fallback mémoire.
- **shared/share.js** : `copyText`, `shareOrCopy` (Web Share API si dispo), `buildUrl(params)`.
- **shared/image.js** : `renderCard(options) → canvas` et `downloadCanvas(canvas, filename)`.
- **ce-jour-la/life.logic.js** : âge décomposé, jalons (10 000 jours, 10⁹ s, 10⁶ min…),
  âges planétaires, pleines lunes (cycle synodique réel), estimations, zodiaque
  occidental et chinois, prochain anniversaire, génération ICS.
- **noms/names.logic.js** : moteur de gabarits avec accords (genre et nombre), une fonction par
  catégorie et le pitch associé.
- **jeu/game.logic.js** : choix du puzzle du jour, normalisation et comparaison des réponses
  (sans accents ni casse), état de la partie, statistiques et texte de partage.
- **jeu/geo.logic.js** : distance haversine, cap initial → flèche (8 directions), % de proximité.
- **roue/wheel.logic.js** : tirage pondéré, angle cible, courbe de décélération, (dé)sérialisation des listes dans l'URL.

---

## 5. Commandes utiles

```bash
npm install              # une seule fois (devDependencies pour /scripts)
npm test                 # node --test tests/
npx serve public         # serveur local → http://localhost:3000
npm run data             # (re)génère public/jeu/data/pays.json depuis world-atlas
```

Déploiement : `git push origin main` → Cloudflare Pages redéploie automatiquement.

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
| D6 | Pleines lunes : nouvelle lune de référence 2000-01-06 18:14 UTC + cycle synodique moyen 29,530588853 j | Calcul astronomique réel, précis à quelques heures près, documenté dans l'UI |
| D7 | Données pays pré-traitées une fois par `scripts/` puis commitées en JSON | Le site n'a aucune étape de build et Cloudflare sert le fichier statique |
| D8 | Police display auto-hébergée (OFL) | Identité visuelle forte, sans CDN (contrainte perf et vie privée) |
| D9 | Outils manquants (Node, git, gh) installés via winget | Absents de la machine au démarrage (2026-11-18) |

---

## 7. ROADMAP

### Étape 0 — Mémoire et initialisation
- [x] Choisir le nom du site (Zinzin)
- [x] Rédiger CLAUDE.md (vision, stack, conventions, roadmap)
- [x] `.gitignore`
- [x] Installer Node LTS, Git et GitHub CLI (winget) — Node 26.13.1, git 2.56, gh 2.105
- [x] `git init` (branche `main`) + premier commit

### Étape 1 — Socle et design system
- [ ] `package.json` (`"type": "module"`, scripts `test`, `serve`, `data`)
- [ ] `shared/tokens.css` + `shared/base.css` (reset, layout mobile-first, cartes, boutons, formulaires, toasts, mode sombre, reduced-motion)
- [ ] Police display auto-hébergée + `favicon.svg`
- [ ] `shared/rng.js`, `shared/dates.js`, `shared/storage.js`, `shared/share.js`, `shared/image.js`, `shared/ui.js`
- [ ] Tests : RNG à graine, `parisDateKey`, n° du jour
- [ ] Page d'accueil (hub des 4 apps) + page À propos
- [ ] Vérification navigateur + commit

### Étape 2 — App A « Ce jour-là »
- [ ] Formulaire date (+ heure optionnelle), lecture et écriture des paramètres d'URL
- [ ] Âge exact avec compteur en temps réel
- [ ] Jalons (passés/futurs) + compte à rebours du prochain
- [ ] Âge sur chaque planète
- [ ] Pleines lunes vécues
- [ ] Estimations (cœur, respirations, nuits, km Terre/Soleil), présentées comme telles
- [ ] Jour de la semaine, signe astrologique, signe chinois
- [ ] Compte à rebours jusqu'au prochain anniversaire
- [ ] Export .ics du prochain jalon
- [ ] Carte PNG partageable (canvas)
- [ ] Tests : âges, jalons, pleines lunes, zodiaques, ICS
- [ ] Vérification navigateur + commit

### Étape 3 — App B « Générateur de noms absurdes »
- [ ] Dictionnaires FR (≥ 80 éléments par liste) avec genre et nombre
- [ ] Moteur de gabarits avec accords
- [ ] 7 catégories + pitch par catégorie
- [ ] Mode graine (prénom → résultat stable)
- [ ] Favoris (localStorage), copie, carte PNG
- [ ] Tests : accords, déterminisme de la graine, tailles des dictionnaires
- [ ] Vérification navigateur + commit

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
- [ ] `gh auth login` + création du repo GitHub `zinzin` + push sur `main`
- [ ] Cloudflare Pages : connexion au repo (guidée pas à pas)
- [ ] Vérification de l'URL de production et report ci-dessous

---

## 8. Déploiement (procédure)

1. **GitHub** : `gh auth login` (une fois), puis `gh repo create zinzin --public --source . --remote origin --push`.
2. **Cloudflare Pages** (tableau de bord) : *Workers & Pages* → *Créer* → *Pages* →
   *Connecter à Git* → autoriser GitHub → choisir le repo `zinzin`.
   - Branche de production : `main`
   - Préréglage de framework : **None**
   - Commande de build : **(vide)**
   - Répertoire de sortie : **`public`**
3. Chaque `git push` sur `main` redéploie automatiquement. Les autres branches donnent des URL de prévisualisation.
4. `public/_headers` définit le cache (long pour `/assets/*`, court pour le HTML) et les
   en-têtes de sécurité (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

**URL de production : _(à renseigner après déploiement)_**

---

## 9. Idées pour la suite

*(Section à compléter et classer par rapport impact/effort à la fin de la V1.)*

---

## 10. Journal

- **2026-11-18** : Étape 0. Nom choisi, CLAUDE.md rédigé. Node, git et gh absents de la machine, puis installés via winget. Dépôt git initialisé sur `main`. gh n'est pas encore connecté (`gh auth login` à faire avant l'étape 7).
