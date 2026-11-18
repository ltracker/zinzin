import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save, remove, keys, clearAll } from '../public/shared/storage.js';

// Node n'a pas de localStorage par défaut (ou un stockage désactivé) : on
// vérifie le repli en mémoire, puis le comportement avec un faux localStorage.

test('repli en mémoire sans localStorage', () => {
  save('t:a', { x: 1 });
  assert.deepEqual(load('t:a'), { x: 1 });
  assert.equal(load('t:absent', 'défaut'), 'défaut');
  remove('t:a');
  assert.equal(load('t:a'), null);
});

test('localStorage qui jette des exceptions → pas de crash', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('SecurityError'); },
  });
  try {
    assert.doesNotThrow(() => save('t:b', 2));
    assert.equal(load('t:b'), 2);
    assert.doesNotThrow(() => clearAll());
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('avec un faux localStorage : préfixe et clearAll', () => {
  const data = new Map();
  const fake = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: fake });
  try {
    data.set('autre-site', 'x');
    assert.equal(save('jeu:stats', { wins: 3 }), true);
    assert.ok(data.has('zinzin:jeu:stats'));
    data.set('zinzin:cassé', '{pas du json');
    assert.equal(load('cassé', 'ok'), 'ok', 'JSON invalide → fallback');
    assert.ok(keys().includes('jeu:stats'));
    clearAll();
    assert.ok(data.has('autre-site'), 'ne touche pas aux clés des autres');
    assert.equal(data.has('zinzin:jeu:stats'), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
