import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, APP_LABELS, unlock, isUnlocked, bump, collect, trackVisit, progress, setNotifier } from '../public/shared/stickers.js';
import { clearAll } from '../public/shared/storage.js';

const notified = [];
setNotifier((s) => notified.push(s.id));
beforeEach(() => { clearAll(); notified.length = 0; });

test('catalogue : identifiants uniques, champs complets, apps connues', () => {
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, STICKERS.length);
  for (const s of STICKERS) {
    assert.ok(s.emoji && s.name && s.hint, s.id);
    assert.ok(APP_LABELS[s.app], `${s.id} : app ${s.app}`);
  }
  assert.ok(STICKERS.length >= 25);
});

test('unlock : une seule fois, avec notification', () => {
  assert.equal(unlock('roue-1'), true);
  assert.equal(unlock('roue-1'), false);
  assert.ok(isUnlocked('roue-1'));
  assert.deepEqual(notified, ['roue-1']);
  assert.throws(() => unlock('nexiste-pas'));
});

test('bump : paliers', () => {
  for (let i = 0; i < 9; i++) bump('noms', 1, { 10: 'noms-10', 100: 'noms-100' });
  assert.equal(isUnlocked('noms-10'), false);
  bump('noms', 1, { 10: 'noms-10', 100: 'noms-100' });
  assert.equal(isUnlocked('noms-10'), true);
  assert.equal(isUnlocked('noms-100'), false);
  assert.equal(bump('noms', 90, { 10: 'noms-10', 100: 'noms-100' }), 100);
  assert.equal(isUnlocked('noms-100'), true);
});

test('collect et trackVisit : explorateur après les 4 apps, noctambule la nuit', () => {
  assert.equal(collect('x', 'a'), 1);
  assert.equal(collect('x', 'a'), 1);
  trackVisit('noms', new Date(2026, 10, 23, 14));
  trackVisit('jeu', new Date(2026, 10, 23, 14));
  trackVisit('roue', new Date(2026, 10, 23, 14));
  assert.equal(isUnlocked('explorateur'), false);
  assert.ok(isUnlocked('bienvenue'));
  trackVisit('ce-jour-la', new Date(2026, 10, 23, 3));
  assert.ok(isUnlocked('explorateur'));
  assert.ok(isUnlocked('noctambule'));
});

test('méta-succès et progression', () => {
  const regular = STICKERS.filter((s) => !s.id.startsWith('album-'));
  regular.slice(0, 10).forEach((s) => unlock(s.id));
  assert.ok(isUnlocked('album-10'));
  assert.equal(isUnlocked('album-20'), false);
  regular.forEach((s) => unlock(s.id));
  assert.ok(isUnlocked('album-20'));
  assert.ok(isUnlocked('album-complet'));
  assert.deepEqual(progress(), { got: STICKERS.length, total: STICKERS.length, percent: 100 });
});
