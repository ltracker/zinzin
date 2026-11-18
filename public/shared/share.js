// Partage : presse-papiers, Web Share API, URL avec paramètres.

/** Copie du texte dans le presse-papiers. Renvoie true en cas de succès. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* on tente le repli */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Partage natif si disponible (mobile), sinon copie dans le presse-papiers.
 * @returns {Promise<'shared'|'copied'|'failed'|'cancelled'>}
 */
export async function shareOrCopy({ title, text, url }) {
  // Partage natif seulement sur écran tactile (mobile) ; sur ordinateur, la copie est plus pratique.
  const touch = globalThis.matchMedia?.('(pointer: coarse)').matches;
  if (navigator.share && touch) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
    }
  }
  const full = [text, url].filter(Boolean).join('\n');
  return (await copyText(full)) ? 'copied' : 'failed';
}

/** Partage un fichier image (canvas) si l'appareil le permet. */
export async function shareCanvas(canvas, filename, { title, text } = {}) {
  try {
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return true;
    }
  } catch { /* rien */ }
  return false;
}

/**
 * Construit une URL absolue de la page courante avec des paramètres.
 * Les valeurs nulles, vides ou undefined sont ignorées.
 */
export function buildUrl(params = {}, base = location.origin + location.pathname) {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** Remplace les paramètres de l'URL courante sans recharger la page. */
export function replaceUrlParams(params) {
  history.replaceState(null, '', buildUrl(params));
}

/** Lit les paramètres de l'URL courante sous forme d'objet. */
export function readParams() {
  return Object.fromEntries(new URLSearchParams(location.search));
}

/** Déclenche le téléchargement d'un contenu texte (ex. fichier .ics). */
export function downloadText(content, filename, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
