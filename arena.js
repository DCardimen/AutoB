// Deterministic arena geometry. Coordinates use the creature's ground position.
export const ARENA_BOUNDS = { left: 55, right: 945, top: 90, bottom: 460 };
const limit = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function bodyProperties(species, unit = {}) {
  const heavy =
    ["golem", "turtle", "bear", "rhino"].includes(species.shape) ||
    species.role === "Guardian";
  return {
    radius: unit.boss ? 29 : heavy ? 22 : 17,
    mass: unit.boss
      ? 5.5
      : heavy
        ? 2.2
        : species.role === "Striker"
          ? 1.2
          : 0.9,
    maxPoise: unit.boss ? 115 : heavy ? 70 : 42,
  };
}
export function sweepCircle(start, end, center, radius) {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    ox = start.x - center.x,
    oy = start.y - center.y;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a < 1e-10) return null;
  const b = 2 * (ox * dx + oy * dy),
    disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
export function movingBodyHit(start, end, unit, radius = 4) {
  return sweepCircle(
    {
      x: start.x - (unit.px ?? unit.x),
      y: start.y - ((unit.py ?? unit.y) - 14),
    },
    { x: end.x - unit.x, y: end.y - (unit.y - 14) },
    { x: 0, y: 0 },
    (unit.radius || 17) + radius,
  );
}
export function strikeContains(strike, unit) {
  const dx = unit.x - strike.source.x,
    dy = unit.y - strike.source.y,
    distance = Math.hypot(dx, dy),
    radius = unit.radius || 17;
  if (distance > strike.reach + radius) return false;
  if (strike.beam) {
    const along = dx * strike.dx + dy * strike.dy,
      across = Math.abs(dx * strike.dy - dy * strike.dx);
    return (
      along >= -radius &&
      along <= strike.reach + radius &&
      across <= (strike.width || 12) + radius
    );
  }
  if (distance < radius) return true;
  const cosine = (dx * strike.dx + dy * strike.dy) / distance;
  return (
    cosine >= Math.cos(strike.arc + Math.asin(Math.min(0.7, radius / distance)))
  );
}
export function confineBody(unit) {
  const b = ARENA_BOUNDS,
    r = unit.radius || 17;
  const x = limit(unit.x, b.left + r, b.right - r),
    y = limit(unit.y, b.top + r, b.bottom - r);
  if (x !== unit.x) {
    unit.velocityX = 0;
    unit.impulseX = 0;
  }
  if (y !== unit.y) {
    unit.velocityY = 0;
    unit.impulseY = 0;
  }
  unit.x = x;
  unit.y = y;
}
export function separateBodies(units) {
  const alive = units.filter((u) => u.hp > 0 && !u.captured);
  let contacts = 0;
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < alive.length; i++)
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i],
          b = alive[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          distance = Math.hypot(dx, dy),
          gap = (a.radius || 17) + (b.radius || 17);
        if (distance >= gap - 0.1) continue;
        contacts += pass === 0;
        const nx = distance > 0.001 ? dx / distance : (i + j) % 2 ? 1 : -1,
          ny = distance > 0.001 ? dy / distance : 0;
        const wa = 1 / (a.mass || 1),
          wb = 1 / (b.mass || 1),
          penetration = gap - distance + 0.02;
        a.x -= (nx * penetration * wa) / (wa + wb);
        a.y -= (ny * penetration * wa) / (wa + wb);
        b.x += (nx * penetration * wb) / (wa + wb);
        b.y += (ny * penetration * wb) / (wa + wb);
        const closing =
          ((a.velocityX || 0) - (b.velocityX || 0)) * nx +
          ((a.velocityY || 0) - (b.velocityY || 0)) * ny;
        if (closing > 0) {
          const impulse = (closing / (wa + wb)) * 0.85;
          a.velocityX = (a.velocityX || 0) - nx * impulse * wa;
          a.velocityY = (a.velocityY || 0) - ny * impulse * wa;
          b.velocityX = (b.velocityX || 0) + nx * impulse * wb;
          b.velocityY = (b.velocityY || 0) + ny * impulse * wb;
        }
        confineBody(a);
        confineBody(b);
      }
  }
  return contacts;
}
