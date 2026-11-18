import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBirth, validateBirth, addMonths, ageBreakdown, milestones, nextMilestone, nextBirthday,
  planetAges, lunarPhaseTime, countFullMoons, nextFullMoon, moonPhase, estimates,
  weekdayOf, westernZodiac, chineseNewYear, chineseZodiac, buildIcs, foldLine, decemberSolstice,
} from '../public/ce-jour-la/life.logic.js';

const local = (y, m, d, hh = 0, mm = 0, ss = 0) => new Date(y, m - 1, d, hh, mm, ss);
const MIN = 60_000;

test('parseBirth : formats valides et invalides', () => {
  assert.deepEqual(parseBirth('1990-05-17'), local(1990, 5, 17));
  assert.deepEqual(parseBirth('1990-05-17', '14:30'), local(1990, 5, 17, 14, 30));
  assert.equal(parseBirth('1990-02-30'), null);
  assert.equal(parseBirth('17/05/1990'), null);
  assert.equal(parseBirth('1990-05-17', '25:00'), null);
  assert.equal(parseBirth(''), null);
});

test('validateBirth', () => {
  const now = local(2026, 11, 18);
  assert.equal(validateBirth(local(1990, 1, 1), now), null);
  assert.match(validateBirth(local(2030, 1, 1), now), /passée/);
  assert.match(validateBirth(local(1850, 1, 1), now), /1900/);
  assert.ok(validateBirth(null, now));
});

test('addMonths gère les fins de mois et le 29 février', () => {
  assert.deepEqual(addMonths(local(2026, 1, 31), 1), local(2026, 2, 28));
  assert.deepEqual(addMonths(local(2024, 2, 29), 12), local(2025, 2, 28));
  assert.deepEqual(addMonths(local(2024, 2, 29), 48), local(2028, 2, 29));
  assert.deepEqual(addMonths(local(2026, 3, 15, 10, 5), -2), local(2026, 1, 15, 10, 5));
});

test('ageBreakdown : décomposition calendaire exacte', () => {
  const a = ageBreakdown(local(1990, 5, 17, 8, 0), local(2026, 11, 18, 10, 30, 15));
  assert.deepEqual([a.years, a.months, a.days, a.hours, a.minutes, a.seconds], [36, 6, 1, 2, 30, 15]);
  // Pas encore l'anniversaire cette année
  const b = ageBreakdown(local(2000, 12, 25), local(2026, 11, 18));
  assert.deepEqual([b.years, b.months, b.days], [25, 10, 24]);
  // Le jour même de l'anniversaire
  const c = ageBreakdown(local(2000, 11, 18, 0, 0), local(2026, 11, 18, 0, 0));
  assert.deepEqual([c.years, c.months, c.days, c.hours], [26, 0, 0, 0]);
  // Totaux cohérents
  const d = ageBreakdown(local(2026, 1, 1), local(2026, 1, 11));
  assert.equal(d.totalDays, 10);
  assert.ok(d.totalHours >= 239 && d.totalHours <= 241); // ±1 h selon le fuseau local
});

test('jalons : 10 000 jours, 1 milliard de secondes, 1 million de minutes', () => {
  const birth = new Date(Date.UTC(1990, 0, 1));
  const now = new Date(Date.UTC(2026, 10, 18));
  const all = milestones(birth, now);
  const byId = Object.fromEntries(all.map((m) => [m.id, m]));
  assert.equal(byId.j10000.date.toISOString(), '2017-05-19T00:00:00.000Z');
  assert.equal(byId.s1e9.date.toISOString(), '2021-09-09T01:46:40.000Z');
  assert.equal(byId.m1e6.date.toISOString(), '1991-11-26T10:40:00.000Z');
  assert.equal(byId.j10000.past, true);
  assert.equal(byId.j15000.past, false);
  // Triés chronologiquement
  for (let i = 1; i < all.length; i++) assert.ok(all[i].date >= all[i - 1].date);
  // Le prochain est bien le premier futur
  const next = nextMilestone(birth, now);
  assert.equal(next.past, false);
  assert.ok(all.filter((m) => m.date < next.date).every((m) => m.past));
});

test('jalons en mois calendaires', () => {
  const all = milestones(local(2000, 1, 31), local(2026, 1, 1));
  const m100 = all.find((m) => m.id === 'mo100');
  assert.deepEqual(m100.date, local(2008, 5, 31));
});

test('nextBirthday, y compris pour un 29 février', () => {
  const nb = nextBirthday(local(1990, 5, 17), local(2026, 11, 18));
  assert.deepEqual(nb.date, local(2027, 5, 17));
  assert.equal(nb.turning, 37);
  const leap = nextBirthday(local(2000, 2, 29), local(2027, 1, 1));
  assert.deepEqual(leap.date, local(2027, 2, 28));
  assert.equal(leap.turning, 27);
  const today = nextBirthday(local(1990, 11, 18), local(2026, 11, 18, 12));
  assert.equal(today.isToday, true);
  assert.deepEqual(today.date, local(2027, 11, 18));
});

test('âges planétaires', () => {
  const birth = new Date(Date.UTC(2000, 0, 1));
  const now = new Date(birth.getTime() + 686.98 * 86_400_000 * 10);
  const ages = Object.fromEntries(planetAges(birth, now).map((p) => [p.id, p]));
  assert.ok(Math.abs(ages.mars.age - 10) < 1e-9);
  assert.ok(Math.abs(ages.terre.age - (686.98 * 10) / 365.256) < 1e-9);
  assert.ok(ages.mercure.age > ages.terre.age && ages.terre.age > ages.neptune.age);
  assert.ok(ages.mars.nextBirthday > now || Math.abs(ages.mars.nextBirthday - now) < 1000);
});

test('phases lunaires (Meeus) : instants de référence à quelques minutes près', () => {
  const near = (ms, iso, tolMin = 6) => assert.ok(Math.abs(ms - Date.parse(iso)) < tolMin * MIN, `${new Date(ms).toISOString()} ≠ ${iso}`);
  near(lunarPhaseTime(-283), '1977-02-18T03:37:42Z'); // exemple 49.a de Meeus (TD)
  near(lunarPhaseTime(0), '2000-01-06T18:14:00Z');
  near(lunarPhaseTime(0.5), '2000-01-21T04:40:00Z'); // éclipse totale de Lune
  near(lunarPhaseTime(297.5), '2024-01-25T17:54:00Z');
  near(decemberSolstice(2024), '2024-12-21T09:20:00Z', 10);
  near(decemberSolstice(1984), '1984-12-21T16:23:00Z', 10);
});

test('nombre de pleines lunes', () => {
  assert.equal(countFullMoons(new Date('2024-01-01T00:00:00Z'), new Date('2024-12-31T23:59:59Z')), 12);
  assert.equal(countFullMoons(new Date('2023-01-01T00:00:00Z'), new Date('2023-12-31T23:59:59Z')), 13); // lune bleue en août
  assert.equal(countFullMoons(new Date('2024-01-26T00:00:00Z'), new Date('2024-02-20T00:00:00Z')), 0);
  assert.equal(countFullMoons(new Date('2024-01-02T00:00:00Z'), new Date('2024-01-01T00:00:00Z')), 0);
  // ≈ 12,37 pleines lunes par an sur 30 ans
  const n = countFullMoons(new Date('1990-01-01T00:00:00Z'), new Date('2020-01-01T00:00:00Z'));
  assert.ok(n === 371 || n === 372, `n = ${n}`);
  const next = nextFullMoon(new Date('2024-01-20T00:00:00Z'));
  assert.ok(Math.abs(next - Date.parse('2024-01-25T17:54:00Z')) < 6 * MIN);
});

test('phase de la Lune à une date', () => {
  assert.equal(moonPhase(new Date('2024-01-25T18:00:00Z')).name, 'Pleine lune');
  assert.equal(moonPhase(new Date('2000-01-06T19:00:00Z')).name, 'Nouvelle lune');
  assert.equal(moonPhase(new Date('2024-01-18T03:00:00Z')).name, 'Premier quartier');
});

test('estimations proportionnelles au temps écoulé', () => {
  const birth = new Date(Date.UTC(2000, 0, 1));
  const e1 = estimates(birth, new Date(birth.getTime() + 86_400_000));
  assert.equal(e1.heartbeats, 80 * 1440);
  assert.equal(e1.breaths, 16 * 1440);
  assert.equal(e1.nights, 1);
  assert.ok(Math.abs(e1.earthOrbitKm - 29.78 * 86400) < 1e-6);
  const e10 = estimates(birth, new Date(birth.getTime() + 10 * 86_400_000));
  assert.ok(Math.abs(e10.heartbeats - 10 * e1.heartbeats) < 1e-6);
});

test('jour de la semaine', () => {
  assert.equal(weekdayOf(local(1990, 5, 17)).name, 'jeudi');
  assert.equal(weekdayOf(local(2000, 1, 1)).name, 'samedi');
  assert.equal(weekdayOf(local(2026, 11, 18)).name, 'mercredi');
});

test('zodiaque occidental, y compris aux frontières', () => {
  const z = (m, d) => westernZodiac(local(2001, m, d)).name;
  assert.equal(z(5, 17), 'Taureau');
  assert.equal(z(1, 19), 'Capricorne');
  assert.equal(z(1, 20), 'Verseau');
  assert.equal(z(12, 21), 'Sagittaire');
  assert.equal(z(12, 22), 'Capricorne');
  assert.equal(z(12, 31), 'Capricorne');
  assert.equal(z(3, 21), 'Bélier');
  assert.equal(z(3, 20), 'Poissons');
  assert.equal(z(8, 23), 'Vierge');
});

test('Nouvel An chinois calculé astronomiquement', () => {
  const cases = {
    1985: [2, 20], 1990: [1, 27], 1996: [2, 19], 2000: [2, 5], 2020: [1, 25],
    2021: [2, 12], 2023: [1, 22], 2024: [2, 10], 2025: [1, 29], 2026: [2, 17],
    1900: [1, 31], 1912: [2, 18], 1950: [2, 17], 1966: [1, 21], 1970: [2, 6], 1976: [1, 31], 2006: [1, 29], 2012: [1, 23], 2015: [2, 19], 2017: [1, 28],
  };
  for (const [y, [m, d]] of Object.entries(cases)) {
    assert.deepEqual(chineseNewYear(+y), { month: m, day: d }, `année ${y}`);
  }
});

test('signe chinois (avant/après le Nouvel An)', () => {
  assert.equal(chineseZodiac(local(2024, 2, 9)).name, 'Lapin');
  assert.equal(chineseZodiac(local(2024, 2, 10)).name, 'Dragon');
  const h = chineseZodiac(local(1990, 5, 17));
  assert.equal(h.name, 'Cheval');
  assert.equal(h.element, 'Métal');
  assert.equal(chineseZodiac(local(2000, 1, 15)).name, 'Lapin'); // avant le 5 février 2000
});

test('buildIcs : structure RFC 5545', () => {
  const ics = buildIcs({
    title: '10 000 jours de Léa ; youpi, fête !',
    description: 'Ligne 1\nLigne 2',
    date: local(2027, 3, 4),
    uid: 'abc@zinzin',
    url: 'https://exemple.test/ce-jour-la/?d=2000-01-01',
    now: new Date('2026-11-18T10:00:00Z'),
  });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.match(ics, /DTSTART;VALUE=DATE:20270304\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20270305\r\n/);
  assert.match(ics, /DTSTAMP:20261118T100000Z/);
  assert.match(ics, /SUMMARY:10 000 jours de Léa \\; youpi\\, fête !/);
  assert.match(ics, /DESCRIPTION:Ligne 1\\nLigne 2/);
  assert.equal(ics.split('\r\n').filter((l) => l === 'BEGIN:VEVENT').length, 1);
  assert.ok(!/[^\r]\n/.test(ics), 'uniquement des CRLF');
});

test('foldLine : 75 octets maximum par ligne', () => {
  const long = 'DESCRIPTION:' + 'é'.repeat(100);
  const folded = foldLine(long);
  const enc = new TextEncoder();
  for (const l of folded.split('\r\n')) assert.ok(enc.encode(l).length <= 75);
  assert.equal(folded.split('\r\n').map((l, i) => (i ? l.slice(1) : l)).join(''), long);
});
