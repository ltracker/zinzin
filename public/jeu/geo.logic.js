// Géographie pour le mode « Silhouette » — fonctions pures (tests/geo.test.js).

export const EARTH_RADIUS_KM = 6371.0088;
export const MAX_DISTANCE_KM = Math.PI * EARTH_RADIUS_KM; // ≈ 20 015 km (antipodes)
const RAD = Math.PI / 180;

/** Distance orthodromique (formule de haversine), en km. */
export function haversine(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Cap initial (azimut) de 1 vers 2, en degrés [0, 360) : 0 = nord, 90 = est. */
export function bearing(lat1, lon1, lat2, lon2) {
  const φ1 = lat1 * RAD, φ2 = lat2 * RAD, Δλ = (lon2 - lon1) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) / RAD) + 360) % 360;
}

export const DIRECTIONS = [
  { arrow: '⬆️', label: 'nord' },
  { arrow: '↗️', label: 'nord-est' },
  { arrow: '➡️', label: 'est' },
  { arrow: '↘️', label: 'sud-est' },
  { arrow: '⬇️', label: 'sud' },
  { arrow: '↙️', label: 'sud-ouest' },
  { arrow: '⬅️', label: 'ouest' },
  { arrow: '↖️', label: 'nord-ouest' },
];

/** Direction sur 8 secteurs de 45° centrés sur les points cardinaux. */
export function direction8(deg) {
  return DIRECTIONS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Proximité en % : 100 % au même endroit, 0 % aux antipodes. */
export function proximity(distanceKm) {
  return Math.round(Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM) * 100);
}

/**
 * Compare une proposition à la cible. `a` et `b` : { lat, lon, c }.
 * Renvoie { distance (km arrondis), bearing, arrow, label, proximity, exact }.
 */
export function compareCountries(guess, target) {
  if (guess.c === target.c) return { distance: 0, bearing: 0, arrow: '🎯', label: 'pile dessus', proximity: 100, exact: true };
  const d = haversine(guess.lat, guess.lon, target.lat, target.lon);
  const b = bearing(guess.lat, guess.lon, target.lat, target.lon);
  const dir = direction8(b);
  return { distance: Math.round(d), bearing: b, arrow: dir.arrow, label: dir.label, proximity: Math.min(99, proximity(d)), exact: false };
}

/** Carrés façon Wordle selon la proximité (5 cases). */
export function proximitySquares(pct) {
  const full = Math.floor(pct / 20);
  const half = pct - full * 20 >= 10 ? 1 : 0;
  return '🟩'.repeat(full) + '🟨'.repeat(half) + '⬜'.repeat(5 - full - half);
}

/* ---------- Outils de géométrie plane (utilisés par scripts/build-countries.mjs) ---------- */

/** Aire signée (shoelace) d'un anneau [[x, y], …]. */
export function ringArea(ring) {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return s / 2;
}

/** Centroïde d'un anneau (polygone simple). */
export function ringCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f;
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  if (Math.abs(a) < 1e-12) {
    const n = ring.length;
    return [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

/** Simplification de Douglas-Peucker. */
export function simplify(points, tolerance) {
  if (points.length <= 3) return points.slice();
  const sq = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxD = 0, idx = -1;
    const [ax, ay] = points[first], [bx, by] = points[last];
    const dx = bx - ax, dy = by - ay;
    const len = dx * dx + dy * dy;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px, ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > sq && idx > 0) {
      keep[idx] = 1;
      stack.push([first, idx], [idx, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}
