// Animation v2: gait, acceleration lean, anticipation, follow-through, and a timed fall.
const TAU = Math.PI * 2;
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
export function creaturePose(unit, time = 0, shape = "fox") {
  let seed = 0;
  for (const ch of unit.uid || unit.id || "")
    seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const t = time + (seed % 997) / 137,
    movement = clamp(unit.motion || 0);
  const flying = ["bird", "dragon", "fish", "sprite"].includes(shape),
    heavy = ["golem", "turtle", "bear"].includes(shape);
  const stride = t * (flying ? 6.5 : heavy ? 7.5 : 11.5),
    attack = clamp((unit.attackAnim || 0) / 0.32),
    cast = clamp((unit.castAnim || 0) / 0.65),
    hit = clamp((unit.hitAnim || 0) / 0.22),
    dodge = clamp(Math.max(unit.dodgeAnim || 0, unit.dodgeLock || 0) / 0.3);
  const fallen = unit.hp !== undefined && unit.hp <= 0,
    death = smooth((unit.deathTime || 0) / 0.65),
    dash = clamp((unit.dashAnim || 0) / 0.38);
  const progress = 1 - attack;
  const anticipation =
    attack > 0
      ? Math.sin(clamp(progress / 0.22) * Math.PI) *
        Math.max(0, 1 - progress / 0.3)
      : 0;
  const thrust =
    attack > 0
      ? Math.sin(clamp((progress - 0.15) / 0.85) * Math.PI) *
        Math.exp(-Math.max(0, progress - 0.6) * 3)
      : 0;
  const windup = Math.sin(cast * Math.PI),
    breathe = Math.sin(t * (heavy ? 1.8 : 2.6)) * 0.012;
  const state = fallen
    ? "fallen"
    : dash
      ? "dash"
      : hit
        ? "hit"
        : dodge
          ? "dodge"
          : cast
            ? "cast"
            : attack
              ? "attack"
              : movement > 0.12
                ? "walk"
                : "idle";
  const lean = ((unit.velocityX || 0) * (unit.face || 1)) / 250;
  return {
    state,
    t,
    stride,
    movement,
    flying,
    heavy,
    shape,
    dash,
    death,
    x: thrust * (heavy ? 11 : 19) - anticipation * 5 - hit * 7,
    y: fallen
      ? death * 15
      : (flying
          ? Math.sin(t * 3.8) * 3.4 - 6
          : -Math.abs(Math.sin(stride)) * movement * (heavy ? 1.8 : 3.5)) -
        thrust * 3 +
        windup * 1.5,
    rotation: fallen
      ? -death * 0.88
      : Math.sin(stride) * movement * (heavy ? 0.018 : 0.035) -
        thrust * 0.12 -
        dodge * 0.2 +
        hit * 0.1 -
        lean * 0.04,
    scaleX: fallen
      ? 1 + death * 0.08
      : 1 + breathe + thrust * 0.085 - anticipation * 0.045 - windup * 0.035,
    scaleY: fallen
      ? 1 - death * 0.4
      : 1 -
        breathe * 0.65 -
        thrust * 0.045 +
        anticipation * 0.025 +
        windup * 0.04,
    wing: flying
      ? Math.sin(t * (shape === "fish" ? 4.5 : 7)) * (0.04 + movement * 0.045)
      : 0,
    tail: Math.sin(t * 4.2 + movement) * 0.015,
    glow: cast ? windup : 0,
    alpha: fallen
      ? Math.max(0.06, 1 - smooth(((unit.deathTime || 0) - 0.45) / 1.1) * 0.94)
      : 1,
  };
}
export function spriteBone(pose, fraction, dimension) {
  const head = Math.max(0, 1 - fraction * 2.6),
    feet = Math.max(0, (fraction - 0.7) / 0.3),
    torso = Math.sin(fraction * Math.PI);
  const stride = Math.sin(pose.stride + fraction * TAU * 0.65),
    amplitude = pose.heavy ? 0.008 : 0.014;
  return {
    x:
      (pose.tail * head +
        pose.wing * head +
        stride * feet * pose.movement * amplitude +
        Math.sin(pose.t * 2) * torso * 0.002) *
      dimension *
      (1 - pose.death),
    y: pose.flying
      ? Math.sin(pose.t * 7 + fraction * 2) * head * dimension * 0.01
      : -Math.abs(stride) * feet * pose.movement * dimension * 0.011,
  };
}
export function dashPosition(unit) {
  if (!unit.dashFrom || unit.dashAnim <= 0) return { x: unit.x, y: unit.y };
  const progress = clamp((0.38 - unit.dashAnim) / 0.2),
    eased = 1 - (1 - progress) ** 3;
  return {
    x: unit.dashFrom.x + (unit.x - unit.dashFrom.x) * eased,
    y: unit.dashFrom.y + (unit.y - unit.dashFrom.y) * eased,
  };
}
export function visualUnit(unit, alpha = 0, finishTime = 0) {
  const fraction = clamp(alpha),
    dt = fraction * 0.04 + finishTime;
  const result = { ...unit };
  if (
    !finishTime &&
    unit.hp > 0 &&
    !unit.dashAnim &&
    Number.isFinite(unit.px)
  ) {
    result.x = unit.px + (unit.x - unit.px) * fraction;
    result.y = unit.py + (unit.y - unit.py) * fraction;
  }
  for (const key of [
    "attackAnim",
    "castAnim",
    "hitAnim",
    "dodgeAnim",
    "dashAnim",
  ])
    result[key] = Math.max(0, (unit[key] || 0) - dt);
  if (unit.hp <= 0) result.deathTime = (unit.deathTime || 0) + dt;
  return result;
}
