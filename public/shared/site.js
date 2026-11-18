// Constantes globales du site.

export const SITE = {
  name: 'Zinzin',
  // URL de production (Cloudflare Workers, assets statiques).
  url: 'https://zinzin.johan-saez-craponne.workers.dev',
  // Jour n° 1 du jeu quotidien (clé de date Europe/Paris).
  launchKey: '2026-11-18',
};

export const APPS = [
  { slug: 'ce-jour-la', emoji: '🎂', name: 'Ce jour-là', color: '--app-ce-jour-la' },
  { slug: 'noms', emoji: '🤪', name: 'Noms absurdes', color: '--app-noms' },
  { slug: 'jeu', emoji: '🧩', name: 'Le jeu du jour', color: '--app-jeu' },
  { slug: 'roue', emoji: '🎡', name: 'La roue', color: '--app-roue' },
];
