import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adventState, isUnlocked, doorOrder, elfName, absurdGift, absurdMenu, absurdWish, finalMessage, DAYS } from '../public/avent/avent.logic.js';
import { CALENDAR } from '../public/avent/calendrier.js';
import { parisDateKey } from '../public/shared/dates.js';

test('phases du calendrier', () => {
  assert.deepEqual(adventState('2026-11-23'), { phase: 'avant', season: 2026, openUpTo: 0, daysUntilStart: 8 });
  assert.deepEqual(adventState('2026-11-30'), { phase: 'avant', season: 2026, openUpTo: 0, daysUntilStart: 1 });
  assert.deepEqual(adventState('2026-12-01'), { phase: 'pendant', season: 2026, openUpTo: 1, daysUntilStart: 0 });
  assert.deepEqual(adventState('2026-12-24'), { phase: 'pendant', season: 2026, openUpTo: 24, daysUntilStart: 0 });
  assert.deepEqual(adventState('2026-12-31'), { phase: 'apres', season: 2026, openUpTo: 24, daysUntilStart: 0 });
  assert.deepEqual(adventState('2027-01-06'), { phase: 'apres', season: 2026, openUpTo: 24, daysUntilStart: 0 });
  assert.equal(adventState('2027-01-07').phase, 'avant');
  assert.equal(adventState('2027-01-07').season, 2027);
});

test('déverrouillage selon la date', () => {
  assert.equal(isUnlocked(1, '2026-11-30'), false);
  assert.equal(isUnlocked(1, '2026-12-01'), true);
  assert.equal(isUnlocked(2, '2026-12-01'), false);
  assert.equal(isUnlocked(24, '2026-12-24'), true);
  assert.equal(isUnlocked(24, '2027-01-03'), true);
  assert.equal(isUnlocked(25, '2026-12-25'), false);
  assert.equal(isUnlocked(0, '2026-12-10'), false);
});

test('la case s\'ouvre à minuit heure de Paris, pas UTC', () => {
  const before = parisDateKey(new Date('2026-12-04T22:59:59Z')); // 23:59:59 le 4 à Paris
  const after = parisDateKey(new Date('2026-12-04T23:00:00Z'));  // 00:00:00 le 5 à Paris
  assert.equal(isUnlocked(5, before), false);
  assert.equal(isUnlocked(5, after), true);
});

test('ordre des portes : permutation stable de 1 à 24', () => {
  const o = doorOrder();
  assert.deepEqual([...o].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i + 1));
  assert.deepEqual(doorOrder(), o);
  assert.notDeepEqual(o, Array.from({ length: 24 }, (_, i) => i + 1));
});

test('contenu : 24 cases complètes, une par jour', () => {
  assert.equal(CALENDAR.length, DAYS);
  CALENDAR.forEach((c, i) => {
    assert.equal(c.day, i + 1);
    assert.ok(c.title && c.emoji && c.type, `case ${c.day}`);
    if (c.type === 'blague') assert.ok(c.question && c.answer, `case ${c.day}`);
    if (['anecdote', 'defi', 'lien'].includes(c.type)) assert.ok(c.text, `case ${c.day}`);
    if (c.type === 'quiz') assert.ok(c.items.length >= 2 && c.items.every((x) => x.emojis && x.answer), `case ${c.day}`);
    if (c.type === 'lien') assert.ok(c.href && c.cta, `case ${c.day}`);
  });
  const types = new Set(CALENDAR.map((c) => c.type));
  assert.ok(types.size >= 8, 'contenu varié');
  assert.equal(CALENDAR.at(-1).type, 'final');
});

test('générateurs à graine : stables et sans trou', () => {
  assert.deepEqual(elfName('Léa'), elfName(' léa '));
  assert.notDeepEqual(elfName('Léa'), elfName('Tom'));
  assert.deepEqual(absurdGift('2026-8'), absurdGift('2026-8'));
  for (let i = 0; i < 300; i++) {
    const txt = JSON.stringify([elfName(`p${i}`), absurdGift(i), absurdMenu(i), absurdWish(i)]);
    assert.ok(!/undefined|NaN|null|\bde (le|les) |\bà (le|les) |  /.test(txt), txt);
  }
  assert.equal(absurdMenu(1).length, 4);
  assert.match(absurdGift(3).price, /^\d+(,\d+)? €$/);
});

test('message final', () => {
  assert.match(finalMessage(24), /élite/);
  assert.match(finalMessage(1), /1 case sur 24/);
  assert.match(finalMessage(10), /10 cases/);
});
