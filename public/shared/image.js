// Génération de cartes partageables en PNG (canvas 2D), à l'identité Zinzin.

import { SITE } from './site.js';

const INK = '#24104f';
const PAPER = '#fff6e5';

/** Attend que la police display soit chargée (sinon le canvas utilise la police de secours). */
export async function ensureFonts() {
  try {
    await document.fonts.load('800 64px Bricolage');
    await document.fonts.load('600 32px Bricolage');
  } catch { /* police de secours */ }
}

/** Découpe un texte en lignes qui tiennent dans maxWidth. */
export function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Dessine une carte carrée 1080×1080 façon sticker.
 * @param {object} o
 * @param {string} o.kicker   petite étiquette en haut (ex. « Ce jour-là »)
 * @param {string} o.title    titre principal (gros)
 * @param {string} [o.emoji]  gros émoji décoratif
 * @param {string[]} [o.lines] lignes de détail
 * @param {string} [o.accent] couleur d'accent (#hex)
 * @param {string} [o.footer] texte de pied (URL du site)
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderCard({ kicker, title, emoji, lines = [], accent = '#ffd23f', footer = new URL(SITE.url).hostname }) {
  await ensureFonts();
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Fond crème à pois
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = 'rgba(36,16,79,0.08)';
  for (let y = 12; y < S; y += 36) for (let x = 12; x < S; x += 36) {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Carte sticker : ombre pleine + bord épais
  const m = 80, w = S - m * 2, h = S - m * 2 - 40;
  ctx.fillStyle = INK;
  roundRect(ctx, m + 18, m + 18, w, h, 48); ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, m, m, w, h, 48); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();

  const pad = m + 64;
  const inner = w - 128;
  let y = m + 70;

  // Étiquette
  if (kicker) {
    ctx.font = '700 38px Bricolage, sans-serif';
    const kw = ctx.measureText(kicker).width + 48;
    ctx.save();
    ctx.translate(pad, y);
    ctx.rotate(-0.03);
    ctx.fillStyle = INK; roundRect(ctx, 0, 0, kw, 64, 32); ctx.fill();
    ctx.fillStyle = PAPER; ctx.textBaseline = 'middle'; ctx.fillText(kicker, 24, 34);
    ctx.restore();
    y += 120;
  }

  // Émoji
  if (emoji) {
    ctx.font = '150px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(emoji, pad, y);
    y += 190;
  }

  // Titre (taille adaptative)
  ctx.fillStyle = INK;
  ctx.textBaseline = 'top';
  let size = 110, tl;
  do {
    ctx.font = `800 ${size}px Bricolage, sans-serif`;
    tl = wrapText(ctx, title, inner);
    size -= 6;
  } while ((tl.length > 3 || tl.some((l) => ctx.measureText(l).width > inner)) && size > 40);
  for (const l of tl) { ctx.fillText(l, pad, y); y += size * 1.08; }
  y += 30;

  // Lignes
  ctx.font = '600 40px Bricolage, sans-serif';
  for (const raw of lines) {
    for (const l of wrapText(ctx, raw, inner)) {
      if (y > m + h - 80) break;
      ctx.fillText(l, pad, y);
      y += 54;
    }
  }

  // Pied
  ctx.font = '800 40px Bricolage, sans-serif';
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Zinzin', m, S - 38);
  ctx.font = '600 34px Bricolage, sans-serif';
  const fw = ctx.measureText(footer).width;
  ctx.fillText(footer, S - m - fw, S - 38);

  return canvas;
}

/** Télécharge un canvas en PNG. */
export function downloadCanvas(canvas, filename = 'zinzin.png') {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}
