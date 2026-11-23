// Page À propos : résumé des données stockées et bouton d'effacement.
import { keys, clearAll } from '../shared/storage.js';
import { toast } from '../shared/ui.js';
import { trackVisit } from '../shared/stickers.js';

trackVisit('a-propos');

const summary = document.getElementById('storage-summary');
const button = document.getElementById('clear-data');

function refresh() {
  const k = keys();
  summary.textContent = k.length
    ? `Sur cet appareil : ${k.length} élément${k.length > 1 ? 's' : ''} enregistré${k.length > 1 ? 's' : ''} (${k.join(', ')}).`
    : 'Sur cet appareil : rien du tout pour le moment. 🫥';
  button.disabled = k.length === 0;
}

button.addEventListener('click', () => {
  if (!confirm('Effacer favoris, statistiques et listes perso de Zinzin sur cet appareil ?')) return;
  const n = clearAll();
  refresh();
  toast(n ? 'Données effacées 🧹' : 'Rien à effacer');
});

refresh();
