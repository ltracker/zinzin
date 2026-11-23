// Accueil : numéro du puzzle du jour et compte à rebours jusqu'au prochain.
import { parisDateKey, dayNumber, msUntilParisMidnight, formatHMS } from './shared/dates.js';
import { SITE } from './shared/site.js';
import { everySecond } from './shared/ui.js';
import { trackVisit } from './shared/stickers.js';

trackVisit('accueil');

const numberEl = document.getElementById('daily-number');
const countdownEl = document.getElementById('daily-countdown');

everySecond(() => {
  const now = new Date();
  const n = dayNumber(parisDateKey(now)) - dayNumber(SITE.launchKey) + 1;
  numberEl.textContent = String(Math.max(1, n));
  const ms = msUntilParisMidnight(now);
  countdownEl.textContent = formatHMS(ms);
  countdownEl.setAttribute('datetime', `PT${Math.floor(ms / 1000)}S`);
});
