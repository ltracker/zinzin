// Quiz de personnalité — logique pure. Chaque réponse donne des points à un ou plusieurs résultats.
export { QUIZZES } from './quizzes.js';
import { QUIZZES } from './quizzes.js';

/**
 * Calcule le résultat : somme des points, égalité départagée par l'ordre de déclaration des résultats.
 * @param {object} quiz
 * @param {number[]} answers  index de la réponse choisie pour chaque question
 */
export function computeResult(quiz, answers) {
  const score = Object.fromEntries(quiz.results.map((r) => [r.id, 0]));
  answers.forEach((a, qi) => {
    const pts = quiz.questions[qi]?.answers[a]?.points || {};
    for (const [id, v] of Object.entries(pts)) if (id in score) score[id] += v;
  });
  let best = quiz.results[0];
  for (const r of quiz.results) if (score[r.id] > score[best.id]) best = r;
  return { result: best, score };
}

export function findQuiz(id) {
  return QUIZZES.find((q) => q.id === id) || null;
}

export function findResult(quiz, id) {
  return quiz?.results.find((r) => r.id === id) || null;
}
