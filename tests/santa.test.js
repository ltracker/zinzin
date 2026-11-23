import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNames, draw, isValidDraw, encodeTicket, decodeTicket, inviteMessage } from '../public/pere-noel-secret/santa.logic.js';
import { mulberry32 } from '../public/shared/rng.js';

test('sanitizeNames : espaces, doublons (casse et accents), longueur', () => {
  assert.deepEqual(sanitizeNames(['  Léa ', 'lea', 'Tom', '', 'Tom ', 'Zoé  Martin']), ['Léa', 'Tom', 'Zoé Martin']);
  assert.equal(sanitizeNames(['x'.repeat(100)])[0].length, 40);
  assert.equal(sanitizeNames(Array.from({ length: 80 }, (_, i) => `p${i}`)).length, 50);
});

test('tirage : jamais soi-même, une personne reçoit exactement un cadeau', () => {
  const rng = mulberry32(1);
  for (let n = 2; n <= 30; n++) {
    for (let k = 0; k < 20; k++) {
      const r = draw(n, [], rng);
      assert.ok(isValidDraw(r), `n=${n} : ${r}`);
    }
  }
  assert.equal(draw(1, []), null);
  assert.equal(draw(0, []), null);
});

test('tirage : respecte les exclusions (couples dans les deux sens)', () => {
  const rng = mulberry32(2);
  const ex = [[0, 1], [1, 0], [2, 3], [3, 2], [4, 5], [5, 4]];
  for (let k = 0; k < 500; k++) {
    const r = draw(6, ex, rng);
    assert.ok(isValidDraw(r, ex), `${r}`);
  }
});

test('tirage : cas impossibles détectés', () => {
  assert.equal(draw(2, [[0, 1]]), null, 'à 2, si A ne peut pas offrir à B, impossible');
  assert.equal(draw(3, [[0, 1], [0, 2]]), null, 'A ne peut offrir à personne');
  assert.equal(draw(3, [[0, 2], [1, 2]]), null, 'personne ne peut offrir à C (sauf C lui-même)');
  assert.ok(draw(3, [[0, 1]]), 'mais possible avec une seule exclusion');
});

test('tirage : répartition non biaisée (chacun peut tirer chacun)', () => {
  const rng = mulberry32(3);
  const seen = Array.from({ length: 5 }, () => new Set());
  for (let k = 0; k < 2000; k++) draw(5, [], rng).forEach((r, i) => seen[i].add(r));
  seen.forEach((s, i) => assert.equal(s.size, 4, `le participant ${i} ne tire que ${[...s]}`));
});

test('tickets chiffrés : aller-retour, rien en clair, falsification détectée', async () => {
  const t = { event: 'Noël au bureau', giver: 'Léa', receiver: 'Tom 🎄', budget: '20 €', date: '2026-12-19', message: 'Pas de chaussettes !' };
  const s = await encodeTicket(t);
  assert.match(s, /^[A-Za-z0-9_-]+$/, 'sûr pour une URL');
  assert.ok(!s.includes('Tom') && !Buffer.from(s, 'base64').toString('latin1').includes('Tom'), 'le destinataire n\'apparaît pas en clair');
  assert.deepEqual(await decodeTicket(s), { v: 1, ...t });
  assert.notEqual(await encodeTicket(t), s, 'deux liens du même ticket sont différents (IV aléatoire)');
  const tampered = s.slice(0, -3) + (s.at(-3) === 'A' ? 'B' : 'A') + s.slice(-2);
  assert.equal(await decodeTicket(tampered), null);
  assert.equal(await decodeTicket('nimportequoi'), null);
  assert.equal(await decodeTicket(''), null);
});

test('message d\'invitation', () => {
  const m = inviteMessage({ event: 'Famille', giver: 'Léa', url: 'https://x.test/pere-noel-secret/#abc' });
  assert.match(m, /Léa/);
  assert.match(m, /#abc$/);
});
