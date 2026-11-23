// Équipes et dés : interface.
import { makeTeams, teamsForSize, teamName, rollDice, DICE } from './equipes.logic.js';
import { sanitizeNames } from '../pere-noel-secret/santa.logic.js';
import { load, save } from '../shared/storage.js';
import { copyText } from '../shared/share.js';
import { $, el, toast, prefersReducedMotion } from '../shared/ui.js';
import { unlock, trackVisit } from '../shared/stickers.js';

trackVisit('equipes');
const rng = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

/* ---------- Équipes ---------- */

$('#players').value = load('equipes:joueurs', '');
$('#players').addEventListener('input', () => save('equipes:joueurs', $('#players').value));

$('#make-teams').addEventListener('click', () => {
  const names = sanitizeNames($('#players').value.split(/[,;\n]+/));
  if (names.length < 2) { toast('Il faut au moins 2 participants'); $('#players').focus(); return; }
  const n = Math.max(1, Number($('#split-n').value) || 2);
  const bySize = document.querySelector('input[name="split"]:checked').value === 'size';
  const k = bySize ? teamsForSize(names.length, n) : n;
  const teams = makeTeams(names, k, rng);
  const taken = new Set();
  const named = teams.map((members) => ({ name: teamName(rng, taken), members }));
  $('#teams').replaceChildren(...named.map((t) => el('section', { class: 'team' },
    el('h3', { class: 'team__name' }, t.name),
    el('ul', { class: 'team__members' }, ...t.members.map((m) => el('li', {}, m))))),
  el('button', { type: 'button', class: 'btn btn--small', onclick: async () => {
    const txt = named.map((t) => `${t.name} : ${t.members.join(', ')}`).join('\n');
    toast((await copyText(txt)) ? 'Équipes copiées 📋' : 'Copie impossible 😕');
  } }, '📋 Copier les équipes'));
  unlock('equipes-1');
});

/* ---------- Dés ---------- */

$('#dice-faces').replaceChildren(...DICE.map((f) => el('option', { value: String(f), selected: f === 6 }, `D${f}`)));
const history = [];

$('#roll').addEventListener('click', () => {
  const count = Math.min(10, Math.max(1, Number($('#dice-count').value) || 1));
  const faces = Number($('#dice-faces').value);
  const { rolls, total } = rollDice(count, faces, rng);
  const anim = !prefersReducedMotion();
  $('#dice').replaceChildren(...rolls.map((v) => el('span', { class: `die${anim ? ' is-rolling' : ''}${faces === 20 && v === 20 ? ' is-crit' : ''}` }, String(v))));
  $('#dice-total').textContent = count > 1 ? `Total : ${total}` : `Résultat : ${total}`;
  if (faces === 20 && rolls.includes(20)) { unlock('des-20'); toast('🎲 20 naturel ! Coup critique !'); }
  history.unshift(`${count}D${faces} → ${rolls.join(' + ')}${count > 1 ? ` = ${total}` : ''}`);
  $('#dice-history').replaceChildren(...history.slice(0, 5).map((h) => el('li', {}, h)));
});
