// Étape 10 — Album d'autocollants : affichage de la collection.
import { STICKERS, APP_LABELS, unlockedMap, progress, trackVisit } from '../shared/stickers.js';
import { shareOrCopy } from '../shared/share.js';
import { $, el, toast } from '../shared/ui.js';

trackVisit('album');

function render() {
  const got = unlockedMap();
  const p = progress();
  $('#progress-got').textContent = String(p.got);
  $('#progress-total').textContent = String(p.total);
  $('#progress-fill').style.width = `${p.percent}%`;
  $('#progress-bar').setAttribute('aria-valuenow', String(p.percent));

  const groups = Object.keys(APP_LABELS).map((app) => [app, STICKERS.filter((s) => s.app === app)]).filter(([, list]) => list.length);
  $('#groups').replaceChildren(...groups.map(([app, list]) => el('section', { 'aria-labelledby': `g-${app}` },
    el('h2', { class: 'group__title', id: `g-${app}` }, `${APP_LABELS[app]} · ${list.filter((s) => got[s.id]).length}/${list.length}`),
    el('ul', { class: 'stickers', role: 'list' }, ...list.map((s) => {
      const has = Boolean(got[s.id]);
      return el('li', { class: `sticker ${has ? '' : 'is-locked'}` },
        el('span', { class: 'sticker__disc', 'aria-hidden': 'true' }, has ? s.emoji : '?'),
        el('span', { class: 'sticker__name' }, has ? s.name : 'Mystère'),
        el('span', { class: 'sticker__hint' }, s.hint),
        has ? el('span', { class: 'sticker__date' }, `obtenu le ${new Date(got[s.id]).toLocaleDateString('fr-FR')}`) : null,
        el('span', { class: 'visually-hidden' }, has ? `Obtenu : ${s.name}` : 'Pas encore obtenu'));
    })))));
}

$('#share').addEventListener('click', async () => {
  const p = progress();
  const emojis = STICKERS.filter((s) => unlockedMap()[s.id]).map((s) => s.emoji).join('');
  const r = await shareOrCopy({ title: 'Mon album Zinzin', text: `⭐ Mon album Zinzin : ${p.got}/${p.total} autocollants !\n${emojis}`, url: `${location.origin}/album/` });
  if (r === 'copied') toast('Copié 📋');
});

render();
