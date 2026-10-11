// A deterministic sprite rig. The game clock freezes every pose when combat pauses.
const TAU = Math.PI * 2;
export function creaturePose(unit, time = 0, shape = "fox") {
  let seed = 0;
  for (const ch of unit.uid || unit.id || "")
    seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const t = time + (seed % 997) / 137;
  const flying = shape === "bird" || shape === "fish" || shape === "sprite";
  const movement = Math.max(0, Math.min(1, unit.motion || 0));
  const stride = t * (flying ? 7 : 12);
  const attack = Math.max(0, Math.min(1, (unit.attackAnim || 0) / 0.32));
  const cast = Math.max(0, Math.min(1, (unit.castAnim || 0) / 0.65));
  const hit = Math.max(0, Math.min(1, (unit.hitAnim || 0) / 0.22));
  const dodge = Math.max(
    0,
    Math.min(1, Math.max(unit.dodgeAnim || 0, unit.dodgeLock || 0) / 0.3),
  );
  const fallen = unit.hp !== undefined && unit.hp <= 0;
  const state = fallen
    ? "fallen"
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
  const breathe = Math.sin(t * 2.6) * 0.018;
  const windup = Math.sin(cast * Math.PI);
  const thrust = Math.sin((1 - attack) * Math.PI) * attack;
  return {
    state,
    t,
    stride,
    movement,
    flying,
    x: thrust * 18 - hit * 7,
    y: fallen
      ? 10
      : (flying
          ? Math.sin(t * 3.8) * 3.6 - 5
          : -Math.abs(Math.sin(stride)) * movement * 3.5) +
        windup * 2,
    rotation: fallen
      ? -0.8
      : Math.sin(stride) * movement * 0.035 -
        thrust * 0.1 -
        dodge * 0.22 +
        hit * 0.1,
    scaleX: fallen ? 1.05 : 1 + breathe + thrust * 0.11 - windup * 0.055,
    scaleY: fallen ? 0.64 : 1 - breathe * 0.8 - thrust * 0.07 + windup * 0.065,
    wing: flying ? Math.sin(t * 7) * (0.035 + movement * 0.035) : 0,
    tail: Math.sin(t * 4.2) * 0.012,
    glow: cast ? windup : 0,
    alpha: fallen ? Math.max(0.12, 0.5 - (unit.deathTime || 0) * 0.45) : 1,
  };
}

// Smooth connected horizontal bones bend the painted silhouette instead of sliding a rigid image.
export function spriteBone(pose, fraction, dimension) {
  const head = Math.max(0, 1 - fraction * 2.4);
  const feet = Math.max(0, (fraction - 0.68) / 0.32);
  const stride = Math.sin(pose.stride + fraction * TAU * 0.6);
  return {
    x:
      (pose.tail * (1 - fraction) +
        pose.wing * head +
        stride * feet * pose.movement * 0.016) *
      dimension,
    y: pose.flying
      ? Math.sin(pose.t * 7 + fraction * 2) * head * dimension * 0.009
      : -Math.abs(stride) * feet * pose.movement * dimension * 0.012,
  };
}
