// Étape 11 : chansons, archives, défis, mode difficile, plus ou moins.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalize, itemHints, puzzleKey, challengeUrl, parseChallenge, challengeVerdict, recordHistory,
  dailyRotation, nextOpponent, biggerOrSmaller, scoreOf,
} from '../public/jeu/game.logic.js';
import { CHANSONS } from '../public/jeu/data/chansons.js';
import { mulberry32 } from '../public/shared/rng.js';
import { addDaysToKey } from '../public/shared/dates.js';

const PAYS = JSON.parse(readFileSync(new URL('../public/jeu/data/pays.json', import.meta.url), 'utf8'));

test('base de chansons : ≥ 100, complètes, sans ambiguïté', () => {
  assert.ok(CHANSONS.length >= 100, `${CHANSONS.length} chansons`);
  const seen = new Map();
  for (const c of CHANSONS) {
    assert.ok(c.title && c.emojis && c.language && c.artist && c.year >= 1900 && c.year <= 2026, c.title);
    for (const name of [c.title, ...c.aliases]) {
      const n = normalize(name);
      assert.ok(!seen.has(n) || seen.get(n) === c.title, `« ${name} » ambigu`);
      seen.set(n, c.title);
    }
  }
});

test('indices : film par défaut, chanson sur demande, nombre de mots', () => {
  const c = CHANSONS.find((x) => x.title === "L'Été indien");
  assert.deepEqual(itemHints(c, 3, 'chanson').map((h) => h.value), ['1975', 'Français', 'Joe Dassin']);
  assert.equal(itemHints(c, 5, 'chanson').at(-1).value, 'É');
  assert.equal(itemHints(CHANSONS.find((x) => x.title.startsWith('…Baby')), 4, 'chanson')[3].value, '4');
  assert.equal(itemHints(CHANSONS.find((x) => x.title.startsWith('…Baby')), 5, 'chanson')[4].value, 'B');
  assert.equal(itemHints(c, 99, 'chanson').length, 5);
  assert.equal(itemHints(c, 0, 'chanson').length, 0);
});

test('archives et défis', () => {
  assert.equal(puzzleKey(1, '2026-11-18'), '2026-11-18');
  assert.equal(puzzleKey(14, '2026-11-18'), '2026-12-01');
  const g = { key: 'k', guesses: ['a', 'b'], status: 'won' };
  assert.equal(scoreOf(g), '2');
  assert.equal(challengeUrl('https://x.test/jeu/', 'film', 7, g), 'https://x.test/jeu/?m=film&n=7&defi=2');
  assert.deepEqual(parseChallenge({ m: 'film', n: '7', defi: '2' }, 10), { mode: 'film', n: 7, defi: '2' });
  assert.deepEqual(parseChallenge({ m: 'chanson', n: '3' }, 10), { mode: 'chanson', n: 3, defi: null });
  assert.equal(parseChallenge({ m: 'film', n: '11' }, 10), null, 'pas de puzzle du futur');
  assert.equal(parseChallenge({ m: 'film', n: '0' }, 10), null);
  assert.equal(parseChallenge({ m: 'tricherie', n: '2' }, 10), null);
  assert.equal(parseChallenge({}, 10), null);
  assert.equal(parseChallenge({ m: 'film', n: '2', defi: '9' }, 10).defi, null);
  const lost = { key: 'k', guesses: Array(6).fill('x'), status: 'lost' };
  assert.equal(challengeVerdict(g, '3').result, 'gagne');
  assert.equal(challengeVerdict(g, '2').result, 'egalite');
  assert.equal(challengeVerdict(g, '1').result, 'perdu');
  assert.equal(challengeVerdict(g, 'X').result, 'gagne');
  assert.equal(challengeVerdict(lost, 'X').result, 'egalite');
  assert.equal(challengeVerdict(lost, '4').result, 'perdu');
  assert.deepEqual(recordHistory({}, g), { k: '2' });
  assert.deepEqual(recordHistory({ a: '1' }, { key: 'z', guesses: [], status: 'playing' }), { a: '1' });
});

test('rotation du mode difficile : stable par jour et variée', () => {
  assert.equal(dailyRotation('2026-12-01'), dailyRotation('2026-12-01'));
  const seen = new Set();
  let k = '2026-11-18';
  for (let i = 0; i < 60; i++) { seen.add(dailyRotation(k)); k = addDaysToKey(k, 1); }
  assert.deepEqual([...seen].sort((a, b) => a - b), [90, 180, 270]);
});

test('plus ou moins : adversaire différent et réponse claire', () => {
  const pool = PAYS.filter((p) => p.pool);
  const rng = mulberry32(4);
  let ref = pool[0];
  for (let i = 0; i < 500; i++) {
    const m = nextOpponent(pool, ref, rng);
    assert.notEqual(m.c, ref.c);
    assert.ok(Math.abs(m.a - ref.a) / Math.max(m.a, ref.a) >= 0.05);
    assert.equal(biggerOrSmaller(ref, m), m.a > ref.a ? 'plus' : 'moins');
    ref = m;
  }
  const fr = PAYS.find((p) => p.c === 'FR'), be = PAYS.find((p) => p.c === 'BE');
  assert.equal(biggerOrSmaller(fr, be), 'moins');
  assert.equal(biggerOrSmaller(be, fr), 'plus');
});
