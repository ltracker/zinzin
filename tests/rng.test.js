import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashString, mulberry32, createRng, int, pick, shuffle } from '../public/shared/rng.js';

test('hashString est déterministe et renvoie un uint32', () => {
  const a = hashString('zinzin');
  assert.equal(a, hashString('zinzin'));
  assert.ok(Number.isInteger(a) && a >= 0 && a <= 0xffffffff);
  assert.notEqual(hashString('zinzin'), hashString('Zinzin'));
  assert.notEqual(hashString('abc', 1), hashString('abc', 2));
});

test('mulberry32 : même graine → même suite, valeurs dans [0, 1)', () => {
  const r1 = mulberry32(42);
  const r2 = mulberry32(42);
  for (let i = 0; i < 1000; i++) {
    const v = r1();
    assert.equal(v, r2());
    assert.ok(v >= 0 && v < 1);
  }
  assert.notEqual(mulberry32(1)(), mulberry32(2)());
});

test('mulberry32 : valeurs de référence figées (stabilité entre versions)', () => {
  const r = mulberry32(123456);
  // Si ce test casse, TOUS les puzzles du jour et les noms à graine changent : ne pas modifier l'algorithme.
  assert.deepEqual([r(), r(), r()].map((x) => Math.floor(x * 1e6)), [382333, 797262, 996530]);
  assert.equal(hashString('zinzin'), 3898001777);
});

test('mulberry32 : distribution à peu près uniforme', () => {
  const r = mulberry32(7);
  const buckets = new Array(10).fill(0);
  const N = 100_000;
  for (let i = 0; i < N; i++) buckets[Math.floor(r() * 10)]++;
  for (const b of buckets) assert.ok(Math.abs(b - N / 10) < N / 100, `bucket ${b}`);
});

test('createRng normalise les graines texte (casse, espaces)', () => {
  assert.equal(createRng('Léa')(), createRng('  léa ')());
  assert.equal(createRng('Jean  Paul')(), createRng('jean paul')());
  assert.notEqual(createRng('léa')(), createRng('lea')());
});

test('int reste dans les bornes et les atteint', () => {
  const r = mulberry32(99);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = int(r, 3, 7);
    assert.ok(v >= 3 && v <= 7 && Number.isInteger(v));
    seen.add(v);
  }
  assert.equal(seen.size, 5);
});

test('pick et shuffle', () => {
  const r = mulberry32(5);
  const arr = ['a', 'b', 'c', 'd', 'e'];
  assert.ok(arr.includes(pick(r, arr)));
  assert.throws(() => pick(r, []));
  const s = shuffle(mulberry32(5), arr);
  assert.deepEqual([...s].sort(), arr);
  assert.deepEqual(arr, ['a', 'b', 'c', 'd', 'e'], "l'original n'est pas modifié");
  assert.deepEqual(shuffle(mulberry32(5), arr), s, 'même graine → même mélange');
});
