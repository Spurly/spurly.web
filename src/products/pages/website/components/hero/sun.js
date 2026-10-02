/* Where the sun is overhead, from the UTC clock. Good to about a degree, which
   is plenty for shading a decorative globe. */

/** Unit vector (x, y, z) in the globe's own coordinate frame. */
export function latLonToVec(lat, lon, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export function subSolarPoint(now = new Date()) {
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const dayOfYear = Math.floor(
    (now - Date.UTC(now.getUTCFullYear(), 0, 0)) / 864e5,
  );
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  return { lat: declination, lon: (12 - hours) * 15 };
}

export function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
