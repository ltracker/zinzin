import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parisDateKey, parisOffsetMs, dayNumber, addDaysToKey, parisMidnight,
  msUntilParisMidnight, formatHMS, parseKey,
} from '../public/shared/dates.js';

test('parisDateKey : bascule à minuit heure de Paris, pas UTC', () => {
  // Hiver (UTC+1) : 22:59 UTC = 23:59 Paris, 23:00 UTC = 00:00 Paris le lendemain
  assert.equal(parisDateKey(new Date('2026-01-14T22:59:59Z')), '2026-01-14');
  assert.equal(parisDateKey(new Date('2026-01-14T23:00:00Z')), '2026-01-15');
  // Été (UTC+2) : 21:59 UTC = 23:59 Paris
  assert.equal(parisDateKey(new Date('2026-07-14T21:59:59Z')), '2026-07-14');
  assert.equal(parisDateKey(new Date('2026-07-14T22:00:00Z')), '2026-07-15');
});

test('parisOffsetMs : +1 h en hiver, +2 h en été', () => {
  assert.equal(parisOffsetMs(new Date('2026-01-10T12:00:00Z')), 3_600_000);
  assert.equal(parisOffsetMs(new Date('2026-07-10T12:00:00Z')), 7_200_000);
});

test('dayNumber et addDaysToKey', () => {
  assert.equal(dayNumber('1970-01-01'), 0);
  assert.equal(dayNumber('1970-01-02'), 1);
  assert.equal(dayNumber('2026-11-18') - dayNumber('2026-11-17'), 1);
  assert.equal(addDaysToKey('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysToKey('2028-03-01', -1), '2028-02-29');
  // Indépendant du changement d'heure
  assert.equal(dayNumber('2026-03-30') - dayNumber('2026-03-29'), 1);
  assert.equal(dayNumber('2026-10-26') - dayNumber('2026-10-25'), 1);
});

test('parseKey rejette les formats invalides', () => {
  assert.throws(() => parseKey('18/11/2026'));
  assert.deepEqual(parseKey('2026-11-18'), { year: 2026, month: 11, day: 18 });
});

test('parisMidnight : bon instant UTC, y compris les jours de changement d\'heure', () => {
  assert.equal(parisMidnight('2026-01-15').toISOString(), '2026-01-14T23:00:00.000Z');
  assert.equal(parisMidnight('2026-07-15').toISOString(), '2026-07-14T22:00:00.000Z');
  assert.equal(parisMidnight('2026-03-29').toISOString(), '2026-03-28T23:00:00.000Z'); // passage à l'heure d'été
  assert.equal(parisMidnight('2026-03-30').toISOString(), '2026-03-29T22:00:00.000Z');
  assert.equal(parisMidnight('2026-10-25').toISOString(), '2026-10-24T22:00:00.000Z'); // retour à l'heure d'hiver
  assert.equal(parisMidnight('2026-10-26').toISOString(), '2026-10-25T23:00:00.000Z');
});

test('msUntilParisMidnight', () => {
  assert.equal(msUntilParisMidnight(new Date('2026-01-14T22:00:00Z')), 3_600_000);
  assert.equal(msUntilParisMidnight(new Date('2026-07-14T21:59:59Z')), 1000);
  // Juste après minuit : presque 24 h
  assert.equal(msUntilParisMidnight(new Date('2026-01-14T23:00:00Z')), 86_400_000);
  // Jour de 23 h (passage à l'heure d'été)
  assert.equal(msUntilParisMidnight(new Date('2026-03-28T23:00:00Z')), 23 * 3_600_000);
});

test('formatHMS', () => {
  assert.equal(formatHMS(0), '00:00:00');
  assert.equal(formatHMS(3_661_000), '01:01:01');
  assert.equal(formatHMS(-5), '00:00:00');
  assert.equal(formatHMS(100 * 3_600_000), '100:00:00');
});
