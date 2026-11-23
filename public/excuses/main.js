// Générateur d'excuses bidon : interface.
import { excuse, CONTEXTS } from './excuses.logic.js';
import { randomSeed } from '../shared/rng.js';
import { copyText } from '../shared/share.js';
import { $, el, toast } from '../shared/ui.js';
import { bump, trackVisit } from '../shared/stickers.js';

trackVisit('excuses');
let current = null;

$('#contexts').replaceChildren(...CONTEXTS.map((c, i) => el('label', { class: 'pill' },
  el('input', { type: 'radio', name: 'ctx', value: c.id, checked: i === 0 }),
  el('span', {}, el('span', { 'aria-hidden': 'true' }, c.emoji), c.label))));

function generate() {
  const ctx = document.querySelector('input[name="ctx"]:checked').value;
  current = excuse(ctx, randomSeed());
  $('#ex-result').hidden = false;
  $('#ex-text').textContent = current.text;
  $('#ex-cred').textContent = `${current.credibility} %`;
  $('#ex-meter').style.width = `${current.credibility}%`;
  bump('excuses', 1, { 10: 'excuses-10' });
}

$('#generate').addEventListener('click', generate);
$('#ex-again').addEventListener('click', generate);
$('#ex-copy').addEventListener('click', async () => {
  toast((await copyText(current.text)) ? 'Excuse copiée. Bonne chance 🍀' : 'Copie impossible 😕');
});
for (const r of document.querySelectorAll('input[name="ctx"]')) r.addEventListener('change', generate);
