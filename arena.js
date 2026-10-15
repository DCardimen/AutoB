// Deterministic arena geometry. Coordinates use the creature's ground position.
export const ARENA_BOUNDS = { left: 55, right: 945, top: 90, bottom: 460 };
const limit = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function bodyProperties(species, unit = {}) {
  const heavy =
    ["golem", "turtle", "bear", "rhino"].includes(species.shape) ||
    species.role === "Guardian";
  return {
    radius: unit.boss ? 29 : species.bodyRadius ?? (heavy ? 22 : 17),
    mass: unit.boss
      ? 5.5
      : species.mass ?? (species.nativeRig ? ({knight:1.9,orc:2.6,elf:.8,caster:1,wolf:1.15,fox:.9,mech:3.4,spider:.7,jelly:.55,serpent:.8,flyer:.6}[species.nativeRig]) : heavy
        ? 2.2
        : species.role === "Striker"
          ? 1.2
          : 0.9),
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
export function confineBody(unit, bounds = ARENA_BOUNDS) {
  const b = unit.entityBounds || bounds,
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
export function separateBodies(units, bounds = ARENA_BOUNDS) {
  const alive = units.filter((u) => u.hp > 0 && !u.captured);
  let contacts = 0;
  // Swept relative motion catches fast dashes/rolls crossing between fixed steps.
  for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
    const a=alive[i],b=alive[j];if(![a.px,a.py,b.px,b.py].every(Number.isFinite))continue;
    const gap=a.radius+b.radius,start={x:a.px-b.px,y:a.py-b.py},end={x:a.x-b.x,y:a.y-b.y};
    if(Math.hypot(start.x,start.y)<gap-.02)continue;
    const t=sweepCircle(start,end,{x:0,y:0},gap);if(t===null||t>=1)continue;
    const nx=(start.x+(end.x-start.x)*t)/gap,ny=(start.y+(end.y-start.y)*t)/gap;
    const ax=a.x-a.px,ay=a.y-a.py,bx=b.x-b.px,by=b.y-b.py,closing=(ax-bx)*nx+(ay-by)*ny;
    if(closing>=0)continue;
    const wa=1/(a.mass||1),wb=1/(b.mass||1),impulse=closing*(1-t)/(wa+wb);
    a.x-=nx*impulse*wa;a.y-=ny*impulse*wa;b.x+=nx*impulse*wb;b.y+=ny*impulse*wb;
    const speed=((a.velocityX||0)-(b.velocityX||0))*nx+((a.velocityY||0)-(b.velocityY||0))*ny;
    if(speed<0){const reaction=speed/(wa+wb);a.velocityX=(a.velocityX||0)-nx*reaction*wa;a.velocityY=(a.velocityY||0)-ny*reaction*wa;b.velocityX=(b.velocityX||0)+nx*reaction*wb;b.velocityY=(b.velocityY||0)+ny*reaction*wb;}
  }

  for (let pass = 0; pass < 16; pass++) {
    let deepest=0;
    for (let i = 0; i < alive.length; i++)
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i],
          b = alive[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          distance = Math.hypot(dx, dy),
          gap = (a.radius || 17) + (b.radius || 17);
        if (distance >= gap - 0.02) continue;
        contacts += pass === 0;
        deepest=Math.max(deepest,gap-distance);
        const angle=(i*2.399963+j*1.618034)%(Math.PI*2),
          nx = distance > 0.001 ? dx / distance : Math.cos(angle),
          ny = distance > 0.001 ? dy / distance : Math.sin(angle);
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
          const impulse = closing / (wa + wb);
          a.velocityX = (a.velocityX || 0) - nx * impulse * wa;
          a.velocityY = (a.velocityY || 0) - ny * impulse * wa;
          b.velocityX = (b.velocityX || 0) + nx * impulse * wb;
          b.velocityY = (b.velocityY || 0) + ny * impulse * wb;
        }
        confineBody(a, bounds);
        confineBody(b, bounds);
      }
    if(deepest<.02)break;
  }
  return contacts;
}
