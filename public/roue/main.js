// App D — Roue de la décision : dessin, animation, son, éditeur. Logique dans wheel.logic.js.
import {
  sanitizeOptions, segments, weightedIndex, indexAtRotation, targetRotation, spinProgress, removeAt,
  probabilities, encodeList, decodeList, PALETTE, MAX_OPTIONS, TAU,
} from './wheel.logic.js';
import { PRESETS } from './presets.js';
import { confetti } from './confetti.js';
import { load, save } from '../shared/storage.js';
import { readParams, buildUrl, copyText } from '../shared/share.js';
import { $, el, toast, prefersReducedMotion } from '../shared/ui.js';

const CURRENT_KEY = 'roue:courante';
const LISTS_KEY = 'roue:listes';
const SETTINGS_KEY = 'roue:reglages';

const canvas = $('#wheel');
const ctx = canvas.getContext('2d');
const spinBtn = $('#spin');
const resultEl = $('#result');

let state = { title: PRESETS[0].title, options: sanitizeOptions(PRESETS[0].options) };
let eliminated = [];
let rotation = 0;
let spinning = false;
const settings = { sound: true, eliminate: false, ...load(SETTINGS_KEY, {}) };

/* ================================================================== */
/* Dessin                                                             */
/* ================================================================== */

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let shadowColor = '#24104f';
function resize() {
  shadowColor = css('--shadow-color') || '#24104f';
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const size = canvas.clientWidth;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  draw();
}

function fitLabel(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function draw() {
  const W = canvas.width;
  const R = W / 2;
  const r = R * 0.94;
  const ink = '#24104f';
  ctx.clearRect(0, 0, W, W);
  ctx.save();
  ctx.translate(R, R);
  // Ombre pleine décalée (style « sticker »), fixe : dessinée avant la rotation.
  ctx.beginPath();
  ctx.arc(W * 0.022, W * 0.022, r, 0, TAU);
  ctx.fillStyle = shadowColor;
  ctx.fill();

  const opts = state.options;
  if (!opts.length) {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = css('--surface-2'); ctx.fill();
    ctx.lineWidth = W * 0.012; ctx.strokeStyle = ink; ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.rotate(rotation);
  const segs = segments(opts);
  const fontSize = Math.max(W * 0.028, Math.min(W * 0.05, (W * 0.5) / Math.max(4, opts.length)));
  ctx.font = `700 ${fontSize}px Bricolage, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';

  segs.forEach((s, i) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, s.start, s.end);
    ctx.closePath();
    ctx.fillStyle = opts[i].color;
    ctx.fill();
    ctx.lineWidth = W * 0.006;
    ctx.strokeStyle = ink;
    ctx.stroke();

    // Libellé le long du rayon, retourné sur la moitié gauche pour rester lisible.
    ctx.save();
    ctx.rotate(s.mid);
    ctx.fillStyle = ink;
    const maxW = r * 0.58; // s'arrête avant le bouton central (≈ 0,28 r)
    let size = fontSize;
    ctx.font = `700 ${size}px Bricolage, system-ui, sans-serif`;
    while (ctx.measureText(opts[i].label).width > maxW && size > fontSize * 0.65) {
      size *= 0.92;
      ctx.font = `700 ${size}px Bricolage, system-ui, sans-serif`;
    }
    const label = fitLabel(opts[i].label, maxW);
    const abs = (((s.mid + rotation) % TAU) + TAU) % TAU;
    const flip = abs > Math.PI / 2 && abs < (3 * Math.PI) / 2;
    if (s.span * r * 0.7 > size * 0.8) {
      if (flip) {
        ctx.rotate(Math.PI);
        ctx.textAlign = 'left';
        ctx.fillText(label, -r * 0.9, 0);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(label, r * 0.9, 0);
      }
    }
    ctx.restore();
  });

  // Picots aux frontières
  for (const s of segs) {
    ctx.beginPath();
    ctx.arc(Math.cos(s.start) * r * 0.965, Math.sin(s.start) * r * 0.965, W * 0.009, 0, TAU);
    ctx.fillStyle = '#fff6e5';
    ctx.fill();
    ctx.lineWidth = W * 0.003;
    ctx.stroke();
  }

  // Bord extérieur
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.lineWidth = W * 0.014;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.restore();
}

/* ================================================================== */
/* Son (Web Audio, aucun fichier)                                     */
/* ================================================================== */

let audio;
function tick() {
  $('#pointer').classList.remove('is-tick');
  void $('#pointer').offsetWidth;
  $('#pointer').classList.add('is-tick');
  if (!settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1900, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  } catch { /* son indisponible */ }
}

function fanfare() {
  if (!settings.sound || !audio) return;
  const t = audio.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.08, t + i * 0.09 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.25);
    osc.connect(gain).connect(audio.destination);
    osc.start(t + i * 0.09);
    osc.stop(t + i * 0.09 + 0.3);
  });
}

/* ================================================================== */
/* Lancer                                                             */
/* ================================================================== */

function secureRandom() {
  const c = globalThis.crypto;
  return c?.getRandomValues ? c.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random();
}

function spin() {
  if (spinning) return;
  if (state.options.length < 2) { toast('Il faut au moins 2 options 🙂'); return; }
  spinning = true;
  spinBtn.disabled = true;
  resultEl.classList.remove('is-winner');
  resultEl.textContent = 'Ça tourne… 🌀';

  const opts = state.options;
  const index = weightedIndex(opts, secureRandom());
  const start = rotation;
  const reduced = prefersReducedMotion();
  const target = targetRotation(opts, index, secureRandom(), start, reduced ? 1 : 5 + Math.floor(secureRandom() * 3));
  const duration = reduced ? 700 : 4800 + secureRandom() * 1400;
  const t0 = performance.now();
  let lastIdx = indexAtRotation(opts, rotation);

  function frame(now) {
    const t = Math.min(1, (now - t0) / duration);
    rotation = start + (target - start) * spinProgress(t);
    const idx = indexAtRotation(opts, rotation);
    if (idx !== lastIdx) { lastIdx = idx; if (!reduced) tick(); }
    draw();
    if (t < 1) requestAnimationFrame(frame);
    else done(index);
  }
  requestAnimationFrame(frame);
}

function done(index) {
  rotation %= TAU;
  const winner = state.options[index];
  resultEl.textContent = `🎉 ${winner.label} !`;
  resultEl.classList.add('is-winner');
  confetti();
  fanfare();
  spinning = false;
  spinBtn.disabled = false;
  if (settings.eliminate && state.options.length > 2) {
    setTimeout(() => {
      eliminated.push(winner);
      state.options = removeAt(state.options, index);
      persist();
      renderEditor();
      draw();
      toast(`« ${winner.label} » est éliminé·e 🗑️`);
    }, 1400);
  } else if (settings.eliminate) {
    toast('Plus que 2 options : on arrête d\'éliminer 😉');
  }
}

spinBtn.addEventListener('click', spin);
canvas.addEventListener('click', spin);
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target === document.body) { e.preventDefault(); spin(); }
});

/* ================================================================== */
/* Éditeur                                                            */
/* ================================================================== */

function persist() {
  save(CURRENT_KEY, state);
}

function renderEditor() {
  $('#wheel-title').textContent = state.title || 'Ma roue';
  $('#title-input').value = state.title;
  const pct = probabilities(state.options);
  $('#options').replaceChildren(...state.options.map((o, i) => {
    const li = el('li', { class: 'option' },
      el('input', { type: 'color', value: o.color, 'aria-label': `Couleur de « ${o.label} »`, oninput: (e) => { state.options[i].color = e.target.value; persist(); draw(); } }),
      el('input', { class: 'input', type: 'text', value: o.label, maxlength: '40', 'aria-label': `Libellé de l'option ${i + 1}`,
        onchange: (e) => {
          const v = e.target.value.trim();
          if (v) state.options[i].label = v; else e.target.value = state.options[i].label;
          persist(); draw(); renderEditor();
        } }),
      el('input', { class: 'input weight', type: 'number', min: '1', max: '10', step: '1', value: String(o.weight), 'aria-label': `Poids de « ${o.label} » (1 à 10)`,
        onchange: (e) => {
          state.options = sanitizeOptions(state.options.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)));
          persist(); draw(); renderEditor();
        } }),
      el('button', { class: 'btn btn--small', type: 'button', 'aria-label': `Supprimer « ${o.label} »`,
        onclick: () => {
          state.options = removeAt(state.options, i);
          persist(); draw(); renderEditor();
        } }, '✕'),
      el('span', { class: 'option__pct' }, `${Math.round(pct[i] * 100)} % de chances`),
    );
    return li;
  }));
  $('#restore').hidden = eliminated.length === 0;
  const saved = load(LISTS_KEY, []);
  $('#delete-list').hidden = !saved.some((l) => l.title === state.title);
}

$('#title-input').addEventListener('input', (e) => {
  state.title = e.target.value.slice(0, 60);
  $('#wheel-title').textContent = state.title || 'Ma roue';
  persist();
});

$('#add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#add-input');
  const label = input.value.trim();
  if (!label) return;
  if (state.options.length >= MAX_OPTIONS) { toast(`${MAX_OPTIONS} options maximum`); return; }
  state.options = sanitizeOptions([...state.options, { label, weight: 1, color: PALETTE[state.options.length % PALETTE.length] }]);
  input.value = '';
  persist(); draw(); renderEditor();
  input.focus();
});

$('#restore').addEventListener('click', () => {
  state.options = sanitizeOptions([...state.options, ...eliminated]);
  eliminated = [];
  persist(); draw(); renderEditor();
});

/* ---------- Listes (prêtes à l'emploi + perso) ---------- */

function renderPresetSelect(selected = '') {
  const saved = load(LISTS_KEY, []);
  $('#preset').replaceChildren(
    el('option', { value: '' }, '— Choisir une liste —'),
    el('optgroup', { label: 'Prêtes à l\'emploi' }, ...PRESETS.map((p, i) => el('option', { value: `p${i}` }, `${p.emoji} ${p.title}`))),
    saved.length ? el('optgroup', { label: 'Mes listes' }, ...saved.map((l, i) => el('option', { value: `s${i}` }, `⭐ ${l.title}`))) : null,
  );
  $('#preset').value = selected;
}

function useList(list) {
  state = { title: list.title, options: sanitizeOptions(list.options) };
  eliminated = [];
  rotation = 0;
  resultEl.classList.remove('is-winner');
  resultEl.textContent = 'Appuie sur « Lancer » !';
  persist(); draw(); renderEditor();
}

$('#preset').addEventListener('change', (e) => {
  const v = e.target.value;
  if (!v) return;
  const list = v[0] === 'p' ? PRESETS[+v.slice(1)] : load(LISTS_KEY, [])[+v.slice(1)];
  if (list) useList(list);
});

$('#save-list').addEventListener('click', () => {
  if (state.options.length < 2) { toast('Il faut au moins 2 options'); return; }
  const title = state.title.trim() || 'Ma roue';
  const saved = load(LISTS_KEY, []).filter((l) => l.title !== title);
  saved.unshift({ title, options: state.options });
  save(LISTS_KEY, saved.slice(0, 30));
  renderPresetSelect('s0');
  renderEditor();
  toast(`Liste « ${title} » enregistrée 💾`);
});

$('#delete-list').addEventListener('click', () => {
  if (!confirm(`Supprimer la liste « ${state.title} » de tes listes ?`)) return;
  save(LISTS_KEY, load(LISTS_KEY, []).filter((l) => l.title !== state.title));
  renderPresetSelect();
  renderEditor();
  toast('Liste supprimée');
});

$('#share-list').addEventListener('click', async () => {
  const url = buildUrl({ l: encodeList(state) });
  toast((await copyText(url)) ? 'Lien de la roue copié 🔗' : 'Copie impossible 😕');
});

/* ---------- Réglages ---------- */

for (const k of ['sound', 'eliminate']) {
  const box = $(`#${k}`);
  box.checked = settings[k];
  box.addEventListener('change', () => {
    settings[k] = box.checked;
    save(SETTINGS_KEY, settings);
  });
}

/* ================================================================== */
/* Démarrage                                                          */
/* ================================================================== */

const shared = readParams().l ? decodeList(readParams().l) : null;
if (shared) {
  state = shared;
  history.replaceState(null, '', location.pathname);
  toast('Roue partagée chargée 🎡');
} else {
  const saved = load(CURRENT_KEY, null);
  if (saved && sanitizeOptions(saved.options).length) state = { title: String(saved.title || ''), options: sanitizeOptions(saved.options) };
}
persist();
new ResizeObserver(resize).observe(canvas);
document.fonts?.ready.then(draw);
// L'éditeur (sous la roue sur mobile) est construit dans une tâche séparée, après le premier affichage.
requestAnimationFrame(() => setTimeout(() => { renderPresetSelect(); renderEditor(); }, 0));
