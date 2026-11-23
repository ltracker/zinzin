// Étape 8 — Calendrier de l'Avent : interface. Logique dans avent.logic.js, contenu dans calendrier.js.
import { adventState, isUnlocked, doorOrder, elfName, absurdGift, absurdMenu, absurdWish, finalMessage, DAYS } from './avent.logic.js';
import { CALENDAR } from './calendrier.js';
import { encodeList } from '../roue/wheel.logic.js';
import { confetti } from '../roue/confetti.js';
import { parisDateKey, parisMidnight, formatHMS } from '../shared/dates.js';
import { load, save } from '../shared/storage.js';
import { shareOrCopy } from '../shared/share.js';
import { renderCard, downloadCanvas } from '../shared/image.js';
import { $, el, toast, everySecond } from '../shared/ui.js';

let today = parisDateKey();
let state = adventState(today);
const storeKey = () => `avent:${state.season}`;
const opened = () => new Set(load(storeKey(), []));

const dialog = $('#door-dialog');
let currentDay = null;

/* ---------------- Grille ---------------- */

function renderDoors() {
  const o = opened();
  $('#doors').replaceChildren(...doorOrder().map((day) => {
    const unlocked = isUnlocked(day, today);
    const isOpened = unlocked && o.has(day);
    const isToday = state.phase === 'pendant' && day === state.openUpTo;
    const cls = ['door', unlocked ? '' : 'is-locked', isOpened ? 'is-opened' : '', isToday ? 'is-today' : ''].filter(Boolean).join(' ');
    const label = unlocked
      ? `Case ${day}${isOpened ? ', déjà ouverte' : ', à ouvrir'}${isToday ? ' (aujourd\'hui)' : ''}`
      : `Case ${day}, verrouillée jusqu'au ${day} décembre`;
    return el('li', {},
      el('button', { type: 'button', class: cls, 'aria-label': label, onclick: (e) => openDoor(day, e.currentTarget) },
        isOpened ? el('span', { class: 'door__emoji', 'aria-hidden': 'true' }, CALENDAR[day - 1].emoji) : String(day),
        unlocked ? null : el('span', { class: 'door__lock', 'aria-hidden': 'true' }, '🔒')));
  }));
  $('#opened-count').textContent = String([...o].filter((d) => isUnlocked(d, today)).length);
}

function renderStatus() {
  const pill = $('#countdown-pill');
  if (state.phase === 'avant') {
    $('#status').textContent = state.daysUntilStart === 1
      ? 'Ouverture demain ! La première case s\'ouvre à minuit (heure de Paris).'
      : `Ouverture le 1er décembre, dans ${state.daysUntilStart} jours. En attendant, tu peux regarder les portes (sans tricher).`;
    pill.hidden = false;
    $('#countdown-label').textContent = 'Ouverture dans';
  } else if (state.phase === 'pendant') {
    $('#status').textContent = `Nous sommes le ${state.openUpTo} décembre : la case n° ${state.openUpTo} t'attend !`;
    pill.hidden = state.openUpTo >= DAYS;
    $('#countdown-label').textContent = 'Prochaine case dans';
  } else {
    $('#status').textContent = 'Joyeuses fêtes ! Toutes les cases sont ouvertes jusqu\'au 6 janvier.';
    pill.hidden = true;
  }
}

/* ---------------- Contenu d'une case ---------------- */

const seed = (day) => `${state.season}-${day}`;

function bodyFor(c) {
  const p = (t) => el('p', {}, t);
  switch (c.type) {
    case 'anecdote':
    case 'defi':
      return [p(c.text)];
    case 'blague': {
      const answer = el('p', { class: 'reveal', hidden: true }, c.answer);
      return [el('p', { class: 'gen__big' }, c.question), answer,
        el('button', { type: 'button', class: 'btn btn--primary', onclick: (e) => { answer.hidden = false; e.currentTarget.remove(); } }, '🥁 Voir la réponse')];
    }
    case 'lien': {
      const href = c.href === 'roue-desserts'
        ? `/roue/?l=${encodeList({ title: 'Quel dessert de Noël ?', options: ['Bûche glacée', 'Bûche pâtissière', 'Papillotes', 'Chocolats', 'Clémentines', "Pain d'épices", 'Marrons glacés', 'Les sept desserts'].map((label) => ({ label, weight: 1 })) })}`
        : c.href;
      return [p(c.text), el('a', { class: 'btn btn--primary', href }, `${c.cta} →`)];
    }
    case 'lutin': {
      const out = el('div', { class: 'gen', hidden: true, 'aria-live': 'polite' });
      const input = el('input', { class: 'input', id: 'elf-name', type: 'text', maxlength: '40', placeholder: 'Ton prénom' });
      const form = el('form', { class: 'row', onsubmit: (e) => {
        e.preventDefault();
        if (!input.value.trim()) { input.focus(); return; }
        const r = elfName(input.value);
        out.replaceChildren(el('p', { class: 'gen__big' }, `🧝 ${r.name}`), el('dl', {},
          el('div', {}, el('dt', {}, 'Poste'), el('dd', {}, r.job)),
          el('div', {}, el('dt', {}, 'Super-pouvoir'), el('dd', {}, r.power))));
        out.hidden = false;
      } }, el('label', { class: 'visually-hidden', for: 'elf-name' }, 'Ton prénom'), input, el('button', { type: 'submit', class: 'btn btn--primary' }, 'Découvrir'));
      return [p(c.text), form, out];
    }
    case 'cadeau': {
      const g = absurdGift(seed(c.day));
      return [p(c.text), el('div', { class: 'gen' }, el('p', { class: 'gen__big' }, `🎁 ${g.gift}`), el('p', {}, g.usage), el('p', {}, `Prix conseillé : ${g.price}`))];
    }
    case 'menu':
      return [p(c.text), el('div', { class: 'gen' }, el('dl', {}, ...absurdMenu(seed(c.day)).map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))))];
    case 'carte': {
      const wish = absurdWish(seed(c.day));
      return [p(c.text), el('div', { class: 'gen' }, el('p', { class: 'gen__big' }, wish)),
        el('button', { type: 'button', class: 'btn btn--primary', onclick: async () => {
          const canvas = await renderCard({ kicker: 'Joyeuses fêtes !', emoji: '🎄', title: wish, lines: ['Avec tout mon amour absurde.'], accent: '#ff7a45' });
          downloadCanvas(canvas, 'zinzin-carte-de-voeux.png');
          toast('Carte téléchargée 💌');
        } }, '🖼️ Télécharger la carte')];
    }
    case 'quiz':
      return [p(c.text), el('ol', { class: 'quiz' }, ...c.items.map((it) => {
        const ans = el('span', { class: 'reveal', hidden: true }, it.answer);
        return el('li', {}, el('span', { class: 'quiz__emojis', 'aria-label': `Émojis : ${it.emojis}` }, it.emojis), ans,
          el('button', { type: 'button', class: 'btn btn--small', onclick: (e) => { ans.hidden = false; e.currentTarget.remove(); } }, 'Révéler'));
      }))];
    case 'chrono': {
      let start = 0;
      const value = el('p', { class: 'chrono__value', 'aria-live': 'polite' }, '??,?? s');
      const verdict = el('p', {});
      const btn = el('button', { type: 'button', class: 'btn btn--primary btn--big', onclick: () => {
        if (!start) {
          start = performance.now();
          btn.textContent = '⏹️ Stop !';
          value.textContent = '…';
          verdict.textContent = 'Compte dans ta tête…';
        } else {
          const s = (performance.now() - start) / 1000;
          start = 0;
          btn.textContent = '🔁 Rejouer';
          value.textContent = `${s.toFixed(2).replace('.', ',')} s`;
          const d = Math.abs(s - 10);
          verdict.textContent = d < 0.1 ? '🤯 Horloge atomique humaine !' : d < 0.5 ? '👏 Très fort !' : d < 1.5 ? '🙂 Pas mal du tout.' : '🐌 Le temps est relatif, paraît-il.';
        }
      } }, '▶️ Démarrer');
      return [p(c.text), value, btn, verdict];
    }
    case 'final': {
      setTimeout(() => confetti(), 300);
      return [p(c.text), el('p', { class: 'gen' }, finalMessage(opened().size))];
    }
    default:
      return [p(c.text || '')];
  }
}

function openDoor(day, button) {
  if (!isUnlocked(day, today)) {
    button.classList.remove('is-shaking');
    void button.offsetWidth;
    button.classList.add('is-shaking');
    toast(state.phase === 'avant' ? `Patience ! Cette case s'ouvre le ${day} décembre 🎁` : `Encore un peu de patience : le ${day} décembre !`);
    return;
  }
  const o = opened();
  if (!o.has(day)) { o.add(day); save(storeKey(), [...o]); }
  const c = CALENDAR[day - 1];
  currentDay = day;
  $('#door-day').textContent = `${day} décembre`;
  $('#door-emoji').textContent = c.emoji;
  $('#door-title').textContent = c.title;
  $('#door-body').replaceChildren(...bodyFor(c));
  dialog.showModal();
  renderDoors();
}

dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

$('#door-share').addEventListener('click', async () => {
  const c = CALENDAR[currentDay - 1];
  const r = await shareOrCopy({ title: 'Calendrier de l\'Avent zinzin', text: `🎄 Case n° ${currentDay} du calendrier de l'Avent zinzin : « ${c.title} » ${c.emoji}`, url: `${location.origin}/avent/` });
  if (r === 'copied') toast('Copié 📋');
});

/* ---------------- Horloge ---------------- */

renderStatus();
renderDoors();

everySecond(() => {
  const now = new Date();
  const key = parisDateKey(now);
  if (key !== today) {
    today = key;
    state = adventState(today);
    renderStatus();
    renderDoors();
    if (state.phase === 'pendant') toast(`La case n° ${state.openUpTo} vient de s'ouvrir ! 🎉`);
  }
  if (!$('#countdown-pill').hidden) {
    const target = state.phase === 'avant'
      ? parisMidnight(`${state.season}-12-01`)
      : parisMidnight(`${state.season}-12-${String(state.openUpTo + 1).padStart(2, '0')}`);
    const ms = target - now;
    const days = Math.floor(ms / 86_400_000);
    $('#countdown').textContent = `${days > 0 ? `${days} j ` : ''}${formatHMS(ms - days * 86_400_000)}`;
  }
});

