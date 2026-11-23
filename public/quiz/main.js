// Quiz de personnalité : interface. URL de résultat partagé : ?q=<quiz>&r=<résultat>.
import { QUIZZES, computeResult, findQuiz, findResult } from './quiz.logic.js';
import { load, save } from '../shared/storage.js';
import { readParams, buildUrl, shareOrCopy, replaceUrlParams } from '../shared/share.js';
import { renderCard, downloadCanvas } from '../shared/image.js';
import { $, el, toast } from '../shared/ui.js';
import { unlock, trackVisit } from '../shared/stickers.js';

trackVisit('quiz');
const DONE_KEY = 'quiz:resultats';
let quiz = null;
let answers = [];
let result = null;

function renderList() {
  const done = load(DONE_KEY, {});
  $('#quiz-list').replaceChildren(...QUIZZES.map((q) => {
    const r = findResult(q, done[q.id]);
    return el('button', { type: 'button', class: 'card card--hover quiz-pick', onclick: () => start(q) },
      el('span', { class: 'quiz-pick__emoji', 'aria-hidden': 'true' }, q.emoji),
      el('span', { class: 'quiz-pick__title' }, q.title),
      el('span', { class: 'quiz-pick__done' }, r ? `Ton dernier résultat : ${r.name}` : `${q.questions.length} questions`));
  }));
}

function start(q) {
  quiz = q;
  answers = [];
  $('#quiz-result').hidden = true;
  $('#quiz-run').hidden = false;
  showQuestion();
  $('#quiz-run').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function showQuestion() {
  const i = answers.length;
  const qq = quiz.questions[i];
  $('#quiz-progress').textContent = `${quiz.emoji} ${quiz.title} · question ${i + 1} sur ${quiz.questions.length}`;
  $('#quiz-bar').style.width = `${(i / quiz.questions.length) * 100}%`;
  $('#quiz-question').textContent = qq.text;
  $('#quiz-answers').replaceChildren(...qq.answers.map((a, ai) => el('button', { type: 'button', class: 'btn', onclick: () => {
    answers.push(ai);
    if (answers.length < quiz.questions.length) showQuestion();
    else finish();
  } }, a.label)));
  $('#quiz-question').focus();
}

function finish() {
  result = computeResult(quiz, answers).result;
  const done = load(DONE_KEY, {});
  done[quiz.id] = result.id;
  save(DONE_KEY, done);
  unlock('quiz-1');
  if (QUIZZES.every((q) => done[q.id])) unlock('quiz-tous');
  showResult();
  renderList();
}

function showResult() {
  $('#quiz-run').hidden = true;
  $('#quiz-result').hidden = false;
  $('#result-quiz').textContent = `${quiz.emoji} ${quiz.title}`;
  $('#result-emoji').textContent = result.emoji;
  $('#result-name').textContent = `Tu es ${result.name.charAt(0).toLowerCase()}${result.name.slice(1)} !`;
  $('#result-text').textContent = result.text;
  replaceUrlParams({ q: quiz.id, r: result.id });
  $('#quiz-result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

$('#result-share').addEventListener('click', async () => {
  const r = await shareOrCopy({ title: quiz.title, text: `${quiz.emoji} ${quiz.title} Moi : ${result.name.charAt(0).toLowerCase()}${result.name.slice(1)} ${result.emoji} ! Et toi ?`, url: buildUrl({ q: quiz.id, r: result.id }) });
  if (r === 'copied') toast('Copié 📋');
});
$('#result-img').addEventListener('click', async () => {
  const canvas = await renderCard({ kicker: quiz.title, emoji: result.emoji, title: `Je suis ${result.name.charAt(0).toLowerCase()}${result.name.slice(1)} !`, lines: [result.text], accent: quiz.color });
  downloadCanvas(canvas, `zinzin-quiz-${quiz.id}.png`);
});
$('#result-again').addEventListener('click', () => {
  $('#quiz-result').hidden = true;
  history.replaceState(null, '', location.pathname);
  $('#quiz-list').scrollIntoView({ behavior: 'auto', block: 'start' });
});

renderList();
const params = readParams();
const shared = findQuiz(params.q);
if (shared && findResult(shared, params.r)) {
  quiz = shared;
  result = findResult(shared, params.r);
  showResult();
}
