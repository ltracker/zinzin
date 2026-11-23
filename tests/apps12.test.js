// Étape 12 : horoscope, quiz, chrono, équipes et dés, excuses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horoscope, SIGNS, starsText } from '../public/horoscope/horoscope.logic.js';
import { QUIZZES, computeResult, findQuiz, findResult } from '../public/quiz/quiz.logic.js';
import { dailyTarget, rate, formatSeconds, formatDiff, best } from '../public/chrono/chrono.logic.js';
import { makeTeams, teamsForSize, teamName, rollDice, DICE } from '../public/equipes/equipes.logic.js';
import { excuse, CONTEXTS } from '../public/excuses/excuses.logic.js';
import { mulberry32 } from '../public/shared/rng.js';
import { addDaysToKey } from '../public/shared/dates.js';

const clean = (t) => !/undefined|NaN|null|\[object|\bde (le|les) |\bà (le|les) |  /.test(t);

test('horoscope : 12 signes, stable par jour, différent selon le signe et le jour', () => {
  assert.equal(SIGNS.length, 12);
  assert.deepEqual(horoscope(3, '2026-12-01'), horoscope(3, '2026-12-01'));
  assert.notDeepEqual(horoscope(3, '2026-12-01').amour + horoscope(3, '2026-12-01').travail, horoscope(4, '2026-12-01').amour + horoscope(4, '2026-12-01').travail);
  let k = '2026-11-01';
  for (let d = 0; d < 60; d++, k = addDaysToKey(k, 1)) {
    for (let s = 0; s < 12; s++) {
      const h = horoscope(s, k);
      const txt = [h.amour, h.travail, h.sante, h.conseil].join(' ');
      assert.ok(clean(txt), txt);
      assert.ok(Object.values(h.stars).every((n) => n >= 1 && n <= 5));
    }
  }
  assert.equal(starsText(3), '★★★☆☆');
});

test('quiz : structure valide et chaque résultat atteignable', () => {
  assert.ok(QUIZZES.length >= 3);
  for (const quiz of QUIZZES) {
    const ids = new Set(quiz.results.map((r) => r.id));
    assert.ok(quiz.questions.length >= 5, quiz.id);
    for (const qq of quiz.questions) {
      assert.ok(qq.answers.length >= 3, `${quiz.id} : ${qq.text}`);
      for (const a of qq.answers) for (const id of Object.keys(a.points)) assert.ok(ids.has(id), `${quiz.id} : ${id}`);
    }
    // Exploration de toutes les combinaisons (≤ 4^6 = 4 096) : chaque résultat doit être possible.
    const reached = new Set();
    const total = quiz.questions.reduce((n, qq) => n * qq.answers.length, 1);
    for (let c = 0; c < total; c++) {
      let x = c;
      const answers = quiz.questions.map((qq) => { const a = x % qq.answers.length; x = Math.floor(x / qq.answers.length); return a; });
      reached.add(computeResult(quiz, answers).result.id);
    }
    assert.deepEqual([...reached].sort(), [...ids].sort(), `${quiz.id} : résultats inatteignables`);
  }
  assert.equal(findQuiz('fromage').id, 'fromage');
  assert.equal(findQuiz('nope'), null);
  assert.equal(findResult(findQuiz('fromage'), 'comte').name, 'Le comté');
});

test('chrono : cible du jour, notes, formats', () => {
  const t = dailyTarget('2026-12-01');
  assert.equal(t, dailyTarget('2026-12-01'));
  let k = '2026-11-01';
  for (let i = 0; i < 100; i++, k = addDaysToKey(k, 1)) {
    const v = dailyTarget(k);
    assert.ok(v >= 4000 && v <= 15000 && v % 10 === 0, `${v}`);
  }
  assert.equal(rate(0).stars, 5);
  assert.equal(rate(-120).stars, 4);
  assert.equal(rate(5000).stars, 1);
  assert.equal(formatSeconds(9870), '9,87 s');
  assert.equal(formatDiff(130), '+0,13 s');
  assert.equal(formatDiff(-420), '−0,42 s');
  assert.equal(best([300, -20, 150]), -20);
  assert.equal(best([]), null);
});

test('équipes : tout le monde placé, tailles équilibrées', () => {
  const names = Array.from({ length: 11 }, (_, i) => `p${i}`);
  const rng = mulberry32(1);
  for (let k = 1; k <= 6; k++) {
    const teams = makeTeams(names, k, rng);
    assert.equal(teams.length, k);
    assert.deepEqual(teams.flat().sort(), [...names].sort());
    const sizes = teams.map((t) => t.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `${sizes}`);
  }
  assert.equal(makeTeams(['a', 'b'], 5, rng).length, 2, 'pas plus d\'équipes que de personnes');
  assert.equal(teamsForSize(10, 3), 3);
  assert.equal(teamsForSize(10, 0), 10);
  const taken = new Set();
  const n1 = teamName(rng, taken), n2 = teamName(rng, taken);
  assert.notEqual(n1, n2);
  assert.match(n1, /^Les /);
});

test('dés : valeurs dans les bornes et distribution uniforme', () => {
  const rng = mulberry32(2);
  for (const f of DICE) {
    const counts = new Array(f + 1).fill(0);
    for (let i = 0; i < 20000; i++) {
      const { rolls, total } = rollDice(2, f, rng);
      assert.equal(total, rolls[0] + rolls[1]);
      for (const v of rolls) { assert.ok(v >= 1 && v <= f); counts[v]++; }
    }
    const expected = 40000 / f;
    for (let v = 1; v <= f; v++) assert.ok(Math.abs(counts[v] - expected) < expected * 0.08, `d${f} face ${v} : ${counts[v]}`);
  }
});

test('excuses : stables par graine et sans faute de construction', () => {
  assert.deepEqual(excuse('retard', 'x'), excuse('retard', 'x'));
  for (const c of CONTEXTS) {
    for (let i = 0; i < 400; i++) {
      const e = excuse(c.id, i);
      assert.ok(clean(e.text), e.text);
      assert.ok(!/\bque [aeiouyéè]/i.test(e.text), `élision : ${e.text}`);
      assert.ok(e.credibility >= 0 && e.credibility <= 42);
    }
  }
  assert.equal(excuse('inconnu', 1).context.id, 'retard');
});
