// Étape 13 : mode duo, années animales, retraite, noms de personnage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duoStats, petYears, retirement, addMonths } from '../public/ce-jour-la/life.logic.js';
import { personaNames } from '../public/noms/names.logic.js';

const local = (y, m, d) => new Date(y, m - 1, d);

test('duo : écart, jours ensemble, date du double, âges cumulés', () => {
  const a = local(1990, 5, 17), b = local(1995, 1, 10), now = local(2026, 11, 23);
  const s = duoStats(b, a, now); // ordre indifférent
  assert.deepEqual(s.older, a);
  assert.deepEqual([s.gap.years, s.gap.months, s.gap.days], [4, 7, 24]);
  assert.equal(s.together, Math.floor((now - b) / 86_400_000));
  // Le jour du « double » : âge de l'aîné = 2 × âge du cadet
  const ageOlder = s.doubleDate - a, ageYounger = s.doubleDate - b;
  assert.ok(Math.abs(ageOlder - 2 * ageYounger) < 1000);
  // Âge cumulé au jalon = valeur annoncée
  for (const m of s.combined) {
    const sum = (m.date - a) + (m.date - b);
    assert.ok(Math.abs(sum - m.ms) < 1000, m.label);
    assert.equal(m.past, m.date <= now);
    assert.ok(m.date >= b, 'jamais avant la naissance du cadet');
  }
  const twins = duoStats(a, a, now);
  assert.equal(twins.gapDays, 0);
});

test('années de chien et de chat (barème 15 / 9 / 5 ou 4)', () => {
  assert.deepEqual(petYears(0), { chien: 0, chat: 0 });
  assert.deepEqual(petYears(1), { chien: 15, chat: 15 });
  assert.deepEqual(petYears(2), { chien: 24, chat: 24 });
  assert.deepEqual(petYears(10), { chien: 64, chat: 56 });
  assert.deepEqual(petYears(-3), { chien: 0, chat: 0 });
});

test('retraite : âge borné et date d\'anniversaire', () => {
  const birth = local(1990, 5, 17);
  const r = retirement(birth, 64, local(2026, 11, 23));
  assert.deepEqual(r.date, addMonths(birth, 64 * 12));
  assert.equal(r.past, false);
  assert.equal(retirement(birth, 30).age, 50);
  assert.equal(retirement(birth, 99).age, 75);
  assert.ok(retirement(local(1950, 1, 1), 62, local(2026, 1, 1)).past);
});

test('noms de personnage : stables, propres, majuscules et élisions', () => {
  assert.deepEqual(personaNames('Léa', '2001-02-03'), personaNames(' léa ', '2001-02-03'));
  assert.notDeepEqual(personaNames('Léa', '2001-02-03'), personaNames('Léa', '2001-02-04'));
  for (let i = 0; i < 500; i++) {
    const r = personaNames(`P${i}`, `2000-01-${String((i % 28) + 1).padStart(2, '0')}`);
    for (const raw of Object.values(r)) {
      const v = raw.replace('du Ouistiti', 'du X'); // « le ouistiti » : pas d'élision, c'est correct
      assert.ok(!/undefined|NaN|null|\bde la [AEIOUÉÈ]|\bdu [AEIOUÉÈ]|\bde (le|les) |  /.test(v), v);
      assert.ok(!/(de la|du|de l'|-de-) [a-zàâéèêîôû]/.test(v.replace(/de l'/, "de l' ")), `minuscule : ${v}`);
    }
  }
  assert.equal(personaNames('', '').pirate.includes('Anonyme'), true);
});
