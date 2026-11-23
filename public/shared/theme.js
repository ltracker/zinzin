// Applique le thème choisi (clair/sombre) AVANT le premier affichage, pour éviter un flash.
// Script classique et bloquant, chargé dans le <head> de chaque page (compatible CSP : fichier externe).
(function () {
  try {
    var t = JSON.parse(localStorage.getItem('zinzin:theme'));
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* stockage indisponible : thème automatique */ }
})();
