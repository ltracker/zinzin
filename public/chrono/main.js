// Chrono parfait : interface. Le temps est mesuré avec performance.now() (monotone).
import { DEFAULT_TARGET, VISIBLE_FOR, dailyTarget, rate, formatSeconds, formatDiff, best } from './chrono.logic.js';
import { parisDateKey } from '../shared/dates.js';
import { load, save } from '../shared/storage.js';
import { shareOrCopy } from '../shared/share.js';
import { $, el, toast } from '../shared/ui.js';
import { unlock, trackVisit } from '../shared/stickers.js';

trackVisit('chrono');
const today = parisDateKey();
let mode = 'libre';
let start = 0;
let raf = 0;

const target = () => (mode === 'jour' ? dailyTarget(today) : DEFAULT_TARGET);
const storeKey = () => (mode === 'jour' ? `chrono:jour:${today}` : 'chrono:libre');

function renderStats() {
  const attempts = load(storeKey(), []);
  const b = best(attempts);
  $('#target').textContent = formatSeconds(target());
  $('#mode-label').textContent = mode === 'jour' ? `défi du ${today.split('-').reverse().slice(0, 2).join('/')}` : '10 secondes';
  $('#best').textContent = b === null ? '—' : formatDiff(b);
  $('#count').textContent = String(attempts.length);
  $('#history').replaceChildren(...attempts.slice(-10).reverse().map((d) => el('li', {}, `${formatSeconds(target() + d)} (${formatDiff(d)}) ${'★'.repeat(rate(d).stars)}`)));
}

function tick() {
  const t = performance.now() - start;
  const display = $('#display');
  if (t < VISIBLE_FOR) display.textContent = formatSeconds(t);
  else if (!display.classList.contains('is-hidden')) { display.classList.add('is-hidden'); display.textContent = '?,?? s'; }
  raf = requestAnimationFrame(tick);
}

function toggle() {
  const btn = $('#go');
  const display = $('#display');
  if (!start) {
    start = performance.now();
    btn.textContent = 'Stop !';
    btn.classList.add('is-running');
    display.classList.remove('is-hidden');
    $('#result').textContent = '';
    raf = requestAnimationFrame(tick);
  } else {
    const elapsed = performance.now() - start;
    cancelAnimationFrame(raf);
    start = 0;
    btn.textContent = 'Rejouer';
    btn.classList.remove('is-running');
    display.classList.remove('is-hidden');
    display.textContent = formatSeconds(elapsed);
    const diff = Math.round(elapsed - target());
    const r = rate(diff);
    $('#result').textContent = `${formatDiff(diff)} · ${r.label}`;
    const attempts = load(storeKey(), []);
    attempts.push(diff);
    save(storeKey(), attempts.slice(-100));
    unlock('chrono-1');
    if (Math.abs(diff) <= 10) unlock('chrono-pile');
    renderStats();
  }
}

$('#go').addEventListener('click', toggle);
document.addEventListener('keydown', (e) => {
  // Sur le bouton, Espace déclenche déjà un clic natif : on ne gère que le cas « focus sur la page ».
  if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); toggle(); }
});
for (const r of document.querySelectorAll('input[name="mode"]')) {
  r.addEventListener('change', () => {
    mode = r.value;
    if (start) { cancelAnimationFrame(raf); start = 0; $('#go').textContent = 'Démarrer'; $('#go').classList.remove('is-running'); }
    $('#display').classList.remove('is-hidden');
    $('#display').textContent = '0,00 s';
    $('#result').textContent = '';
    renderStats();
  });
}

$('#share').addEventListener('click', async () => {
  const b = best(load(storeKey(), []));
  if (b === null) { toast('Fais au moins un essai 😉'); return; }
  const label = mode === 'jour' ? `le défi du jour (${formatSeconds(target())})` : '10 secondes pile';
  const r = await shareOrCopy({ title: 'Chrono parfait', text: `⏱️ Chrono parfait : ${formatDiff(b)} d'écart sur ${label}. Tu fais mieux ?`, url: `${location.origin}/chrono/` });
  if (r === 'copied') toast('Copié 📋');
});

renderStats();
