import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeOption, sanitizeOptions, segments, weightedIndex, indexAtRotation, targetRotation, spinProgress,
  removeAt, probabilities, encodeList, decodeList, TAU, MAX_OPTIONS,
} from '../public/roue/wheel.logic.js';
import { PRESETS } from '../public/roue/presets.js';
import { mulberry32 } from '../public/shared/rng.js';

const opts = (...weights) => weights.map((w, i) => ({ label: `O${i}`, weight: w, color: '#000000' }));

test('sanitize : libellés, poids bornés, couleurs', () => {
  assert.deepEqual(sanitizeOption({ label: '  Pizza ', weight: 99, color: '#FFAA00' }), { label: 'Pizza', weight: 10, color: '#ffaa00' });
  assert.equal(sanitizeOption({ label: 'x', weight: -3 }).weight, 1);
  assert.equal(sanitizeOption({ label: 'x', weight: 'abc' }).weight, 1);
  assert.match(sanitizeOption({ label: 'x', color: 'red' }).color, /^#[0-9a-f]{6}$/);
  assert.equal(sanitizeOption({ label: 'a'.repeat(100) }).label.length, 40);
  assert.equal(sanitizeOptions([{ label: '' }, { label: 'ok' }]).length, 1);
  assert.equal(sanitizeOptions(Array(100).fill({ label: 'x' })).length, MAX_OPTIONS);
  assert.deepEqual(sanitizeOptions(null), []);
});

test('segments proportionnels aux poids', () => {
  const s = segments(opts(1, 1, 2));
  assert.ok(Math.abs(s[0].span - TAU / 4) < 1e-12);
  assert.ok(Math.abs(s[2].span - TAU / 2) < 1e-12);
  assert.ok(Math.abs(s.at(-1).end - TAU) < 1e-12);
  assert.deepEqual(probabilities(opts(1, 3)), [0.25, 0.75]);
});

test('tirage pondéré : bornes exactes', () => {
  const o = opts(1, 3);
  assert.equal(weightedIndex(o, 0), 0);
  assert.equal(weightedIndex(o, 0.2499), 0);
  assert.equal(weightedIndex(o, 0.25), 1);
  assert.equal(weightedIndex(o, 0.9999), 1);
  assert.equal(weightedIndex([], 0.5), -1);
});

test('tirage pondéré : fréquences conformes aux poids (100 000 tirages)', () => {
  const o = opts(1, 2, 7);
  const rng = mulberry32(2026);
  const counts = [0, 0, 0];
  const N = 100_000;
  for (let i = 0; i < N; i++) counts[weightedIndex(o, rng())]++;
  assert.ok(Math.abs(counts[0] / N - 0.1) < 0.01, `${counts}`);
  assert.ok(Math.abs(counts[1] / N - 0.2) < 0.01, `${counts}`);
  assert.ok(Math.abs(counts[2] / N - 0.7) < 0.01, `${counts}`);
});

test('la roue s\'arrête bien sur la part tirée, quel que soit l\'état de départ', () => {
  const rng = mulberry32(7);
  for (let k = 0; k < 2000; k++) {
    const o = opts(...Array.from({ length: 2 + Math.floor(rng() * 10) }, () => 1 + Math.floor(rng() * 10)));
    const idx = weightedIndex(o, rng());
    const current = (rng() - 0.5) * 100;
    const target = targetRotation(o, idx, rng(), current, 5);
    assert.equal(indexAtRotation(o, target), idx);
    assert.ok(target >= current + 5 * TAU && target < current + 6 * TAU, 'entre 5 et 6 tours');
  }
});

test('spinProgress : 0 → 1, monotone, vitesse continue (accélération puis décélération)', () => {
  assert.equal(spinProgress(0), 0);
  assert.equal(spinProgress(1), 1);
  let prev = 0;
  const speeds = [];
  for (let i = 1; i <= 1000; i++) {
    const t = i / 1000;
    const p = spinProgress(t);
    assert.ok(p >= prev - 1e-12, `non monotone à t=${t}`);
    speeds.push(p - prev);
    prev = p;
  }
  const peak = speeds.indexOf(Math.max(...speeds));
  assert.ok(peak > 80 && peak < 160, `pic de vitesse vers t≈0,12 (trouvé ${peak / 1000})`);
  assert.ok(speeds[999] < speeds[peak] / 1000, 'quasi à l\'arrêt à la fin');
  // pas de saut de vitesse au raccord
  const a = 0.12, h = 1e-6;
  const v1 = (spinProgress(a) - spinProgress(a - h)) / h;
  const v2 = (spinProgress(a + h) - spinProgress(a)) / h;
  assert.ok(Math.abs(v1 - v2) / v1 < 1e-3);
});

test('removeAt (mode éliminer)', () => {
  const o = opts(1, 2, 3);
  assert.deepEqual(removeAt(o, 1).map((x) => x.label), ['O0', 'O2']);
  assert.equal(o.length, 3, 'immuable');
});

test('sérialisation URL : aller-retour avec accents et émojis', () => {
  const list = { title: 'On mange quoi ? 🍕', options: [{ label: 'Crêpes', weight: 3, color: '#ffd23f' }, { label: 'Phở 🍜', weight: 1, color: '#4cc3ff' }] };
  const s = encodeList(list);
  assert.match(s, /^[A-Za-z0-9_-]+$/, 'sûr pour une URL');
  assert.deepEqual(decodeList(s), list);
  assert.equal(decodeList('nimporte quoi!!'), null);
  assert.equal(decodeList(''), null);
  assert.equal(decodeList(encodeList({ title: 'vide', options: [] })), null);
});

test('listes prêtes à l\'emploi valides', () => {
  assert.ok(PRESETS.length >= 4);
  for (const p of PRESETS) {
    assert.ok(p.title && p.options.length >= 2, p.title);
    assert.deepEqual(sanitizeOptions(p.options).length, p.options.length, p.title);
  }
  const titles = PRESETS.map((p) => p.title);
  for (const t of ['On mange quoi ?', 'Qui fait la vaisselle ?', 'Film ou série ?', 'Action ou vérité']) assert.ok(titles.includes(t), t);
});
