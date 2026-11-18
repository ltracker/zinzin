import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  puzzleNumber, dailyIndex, permutation, normalize, matches, findEntry, suggest, newGame, restoreGame,
  addGuess, recordResult, emptyStats, currentStreak, shareText, filmHints, MAX_GUESSES,
} from '../public/jeu/game.logic.js';
import { haversine, bearing, direction8, proximity, compareCountries, proximitySquares, simplify, ringArea } from '../public/jeu/geo.logic.js';
import { FILMS } from '../public/jeu/data/films.js';
import { parisDateKey, addDaysToKey } from '../public/shared/dates.js';

const PAYS = JSON.parse(readFileSync(new URL('../public/jeu/data/pays.json', import.meta.url), 'utf8'));

/* ---------- Puzzle du jour ---------- */

test('numéro du puzzle', () => {
  assert.equal(puzzleNumber('2026-11-18', '2026-11-18'), 1);
  assert.equal(puzzleNumber('2026-11-19', '2026-11-18'), 2);
  assert.equal(puzzleNumber('2027-11-18', '2026-11-18'), 366);
});

test('puzzle du jour : déterministe, stable et sans répétition sur un cycle', () => {
  const L = FILMS.length;
  const key = '2026-12-25';
  assert.equal(dailyIndex(key, L, 'film'), dailyIndex(key, L, 'film'));
  const seen = new Set();
  let k = '2026-11-18';
  for (let i = 0; i < L; i++) { seen.add(dailyIndex(k, L, 'film')); k = addDaysToKey(k, 1); }
  assert.equal(seen.size, L, 'chaque film exactement une fois par cycle');
  assert.equal(dailyIndex(k, L, 'film'), dailyIndex('2026-11-18', L, 'film'), 'le cycle recommence');
  // Les deux modes n'utilisent pas la même permutation
  assert.notDeepEqual(permutation(150, 'film'), permutation(150, 'pays'));
});

test('le puzzle change à minuit heure de Paris, pas à minuit UTC', () => {
  const L = FILMS.length;
  const before = parisDateKey(new Date('2026-12-01T22:59:59Z')); // 23:59:59 à Paris
  const after = parisDateKey(new Date('2026-12-01T23:00:00Z'));  // 00:00:00 à Paris
  assert.notEqual(before, after);
  assert.notEqual(dailyIndex(before, L, 'film'), dailyIndex(after, L, 'film'));
});

/* ---------- Comparaison des réponses ---------- */

test('normalize : accents, casse, ponctuation, ligatures, articles', () => {
  assert.equal(normalize('  Le Fabuleux Destin d’Amélie Poulain '), 'fabuleux destin d amelie poulain');
  assert.equal(normalize('ÉLÉPHANT'), 'elephant');
  assert.equal(normalize('Le Cœur'), 'coeur');
  assert.equal(normalize('Monstres & Cie'), 'monstres et cie');
  assert.equal(normalize("L'Âge de glace"), 'age de glace');
  assert.equal(normalize('WALL-E'), 'wall e');
});

test('matches : tolère accents et majuscules, accepte les alias', () => {
  assert.ok(matches('le roi lion', 'Le Roi lion'));
  assert.ok(matches('ROI LION', 'Le Roi lion'));
  assert.ok(matches('amelie poulain', "Le Fabuleux Destin d'Amélie Poulain", ['Amélie Poulain']));
  assert.ok(matches('vice versa', 'Vice-versa'));
  assert.ok(matches('Cote d’Ivoire', "Côte d'Ivoire"));
  assert.ok(!matches('roi', 'Le Roi lion'));
  assert.ok(!matches('', 'Le Roi lion'));
});

test('findEntry et suggest', () => {
  const t = (f) => f.title;
  const a = (f) => f.aliases;
  assert.equal(findEntry('star wars', FILMS, t, a)?.year, 1977);
  assert.equal(findEntry('n importe quoi', FILMS, t, a), null);
  const s = suggest('roi', FILMS, t, 8, a).map(t);
  assert.ok(s.includes('Le Roi lion'));
  assert.ok(suggest('ELEPH', [{ title: 'Éléphant' }], t).length === 1);
  assert.ok(suggest('x', FILMS, t, 3).length <= 3);
});

/* ---------- Données ---------- */

test('base de films : ≥ 200 films complets, titres uniques et sans ambiguïté', () => {
  assert.ok(FILMS.length >= 200, `${FILMS.length} films`);
  const seen = new Map();
  for (const f of FILMS) {
    assert.ok(f.title && f.emojis && f.genre && f.director, f.title);
    assert.ok(f.year >= 1900 && f.year <= 2026, f.title);
    for (const name of [f.title, ...f.aliases]) {
      const n = normalize(name);
      assert.ok(!seen.has(n) || seen.get(n) === f.title, `« ${name} » ambigu entre ${seen.get(n)} et ${f.title}`);
      seen.set(n, f.title);
    }
  }
});

test('données pays : complètes et cohérentes', () => {
  assert.ok(PAYS.length >= 150);
  assert.ok(PAYS.filter((p) => p.pool).length >= 100);
  const codes = new Set(PAYS.map((p) => p.c));
  assert.equal(codes.size, PAYS.length);
  for (const p of PAYS) {
    assert.match(p.c, /^[A-Z]{2}$/);
    assert.ok(p.n && p.p.startsWith('M') && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180, p.c);
  }
  const fr = PAYS.find((p) => p.c === 'FR');
  assert.ok(Math.abs(fr.lat - 46.5) < 1.5 && Math.abs(fr.lon - 2.5) < 1.5, 'centroïde de la France métropolitaine');
});

/* ---------- Géographie ---------- */

test('distance haversine', () => {
  assert.ok(Math.abs(haversine(48.8566, 2.3522, 51.5074, -0.1278) - 344) < 3, 'Paris-Londres ≈ 344 km');
  assert.ok(Math.abs(haversine(48.8566, 2.3522, 40.7128, -74.006) - 5837) < 15, 'Paris-New York ≈ 5 837 km');
  assert.equal(haversine(10, 20, 10, 20), 0);
  assert.ok(Math.abs(haversine(0, 0, 0, 180) - 20015) < 5, 'antipodes');
});

test('direction et cap', () => {
  assert.equal(direction8(bearing(48.85, 2.35, 60, 2.35)).label, 'nord');
  assert.equal(direction8(bearing(48.85, 2.35, 48.85, 20)).label, 'est');
  assert.equal(direction8(bearing(48.85, 2.35, 30, 2.35)).label, 'sud');
  assert.equal(direction8(bearing(48.85, 2.35, 48.85, -20)).label, 'ouest');
  assert.equal(direction8(bearing(48.8566, 2.3522, 52.52, 13.405)).label, 'nord-est', 'Paris → Berlin (cap ≈ 60°)');
  assert.equal(direction8(bearing(48.8566, 2.3522, 41.9, 12.5)).label, 'sud-est', 'Paris → Rome');
  assert.equal(direction8(bearing(48.8566, 2.3522, 40.4168, -3.7038)).label, 'sud-ouest', 'Paris → Madrid');
  assert.equal(direction8(359).arrow, '⬆️');
  assert.equal(direction8(-45).label, 'nord-ouest');
});

test('compareCountries et proximité', () => {
  const fr = PAYS.find((p) => p.c === 'FR');
  const es = PAYS.find((p) => p.c === 'ES');
  const au = PAYS.find((p) => p.c === 'AU');
  const r = compareCountries(es, fr);
  assert.equal(r.exact, false);
  assert.ok(r.distance > 500 && r.distance < 1200);
  assert.equal(r.label, 'nord-est');
  assert.ok(r.proximity > 90 && r.proximity < 100);
  assert.ok(compareCountries(au, fr).proximity < 30);
  assert.deepEqual(compareCountries(fr, fr), { distance: 0, bearing: 0, arrow: '🎯', label: 'pile dessus', proximity: 100, exact: true });
  assert.equal(proximity(0), 100);
  assert.equal(proximitySquares(100), '🟩🟩🟩🟩🟩');
  assert.equal(proximitySquares(55), '🟩🟩⬜⬜⬜'.replace('⬜', '🟨'));
  assert.equal(proximitySquares(0), '⬜⬜⬜⬜⬜');
});

test('simplify et ringArea', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
  assert.equal(Math.abs(ringArea(sq)), 100);
  const noisy = [[0, 0], [5, 0.01], [10, 0], [10, 10], [0, 10], [0, 0]];
  assert.equal(simplify(noisy, 0.5).length, 5);
});

/* ---------- Partie, stats, partage ---------- */

test('déroulé d\'une partie', () => {
  let g = newGame('2026-11-18');
  g = addGuess(g, 'a', false);
  g = addGuess(g, 'a', false); // doublon ignoré
  assert.deepEqual(g.guesses, ['a']);
  g = addGuess(g, 'b', true);
  assert.equal(g.status, 'won');
  assert.equal(addGuess(g, 'c', false), g, 'plus de coup après la fin');
  let l = newGame('2026-11-18');
  for (let i = 0; i < MAX_GUESSES; i++) l = addGuess(l, `x${i}`, false);
  assert.equal(l.status, 'lost');
  assert.deepEqual(restoreGame(g, '2026-11-18'), g);
  assert.deepEqual(restoreGame(g, '2026-11-19'), newGame('2026-11-19'));
  assert.deepEqual(restoreGame(null, '2026-11-19'), newGame('2026-11-19'));
});

test('statistiques et séries', () => {
  const win = (key, n) => ({ key, guesses: Array(n).fill(0).map((_, i) => `g${i}`), status: 'won' });
  let s = emptyStats();
  s = recordResult(s, win('2026-11-18', 3));
  s = recordResult(s, win('2026-11-18', 3)); // même jour : ignoré
  assert.equal(s.played, 1);
  s = recordResult(s, win('2026-11-19', 1));
  assert.equal(s.streak, 2);
  s = recordResult(s, win('2026-11-21', 2)); // un jour sauté
  assert.equal(s.streak, 1);
  assert.equal(s.maxStreak, 2);
  s = recordResult(s, { key: '2026-11-22', guesses: ['a', 'b', 'c', 'd', 'e', 'f'], status: 'lost' });
  assert.equal(s.streak, 0);
  assert.deepEqual(s.dist, [1, 1, 1, 0, 0, 0]);
  assert.equal(s.played, 4);
  assert.equal(s.wins, 3);
  assert.equal(recordResult(s, newGame('2026-11-23')).played, 4, 'partie en cours ignorée');
  const t = recordResult(emptyStats(), win('2026-11-18', 2));
  assert.equal(currentStreak(t, '2026-11-19'), 1);
  assert.equal(currentStreak(t, '2026-11-21'), 0);
});

test('texte de partage sans spoiler', () => {
  const film = FILMS[0];
  const g = { key: '2026-11-18', guesses: ['x', 'y', film.title], status: 'won' };
  const txt = shareText('film', g, 12, [], 'https://exemple.test');
  assert.equal(txt, '🎬 Zinzin Émojifilm n° 12 — 3/6\n🟥🟥🟩⬛⬛⬛\nhttps://exemple.test/jeu/');
  assert.ok(!txt.includes(film.title));
  const lost = { key: 'k', guesses: ['a', 'b', 'c', 'd', 'e', 'f'], status: 'lost' };
  assert.match(shareText('film', lost, 3), /X\/6\n🟥🟥🟥🟥🟥🟥/);
  const p = shareText('pays', { key: 'k', guesses: ['ES', 'FR'], status: 'won' }, 5, [{ proximity: 95, arrow: '↗️' }, { proximity: 100, arrow: '🎯' }], 'https://x.test');
  assert.equal(p, '🗺️ Zinzin Silhouette n° 5 — 2/6\n🟩🟩🟩🟩🟨↗️\n🟩🟩🟩🟩🟩🎉\nhttps://x.test/jeu/');
  assert.ok(!/France|Espagne/.test(p));
});

test('indices progressifs', () => {
  const f = FILMS.find((x) => x.title === 'Le Roi lion');
  assert.deepEqual(filmHints(f, 0), []);
  assert.deepEqual(filmHints(f, 1).map((h) => h.value), ['1994']);
  assert.deepEqual(filmHints(f, 3).map((h) => h.label), ['Année', 'Genre', 'Réalisation']);
  assert.equal(filmHints(f, 5).at(-1).value, 'R');
});
