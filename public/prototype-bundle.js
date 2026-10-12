(() => {
  // prototype-motion.js
  var TAU = Math.PI * 2;
  var MOTION_PROFILES = {
    crab: { sway: 0.3, arm: 0, runArm: 0, sprintArm: 0, landing: 0.5, spine: 0.02 },
    centipede: { sway: 0.4, arm: 0, runArm: 0, sprintArm: 0, landing: 0.3, spine: 0.03 },
    serpent: { sway: 1.1, arm: 0, runArm: 0, sprintArm: 0, landing: 0.25, spine: 0.08 },
    flyer: { sway: 0.4, arm: 0, runArm: 0, sprintArm: 0, landing: 0.2, spine: 0.025 },
    knight: { sway: 1.1, arm: 5.5, runArm: 9, sprintArm: 12, landing: 1, spine: 0.035 },
    orc: { sway: 1.65, arm: 2.5, runArm: 4, sprintArm: 5, landing: 1.3, spine: 0.025 },
    elf: { sway: 0.9, arm: 6.5, runArm: 10.5, sprintArm: 14, landing: 0.85, spine: 0.045 },
    caster: { sway: 1, arm: 5, runArm: 8, sprintArm: 10, landing: 0.95, spine: 0.035 },
    fox: { sway: 0.8, arm: 5, runArm: 8, sprintArm: 11, landing: 0.8, spine: 0.045 },
    mech: { sway: 0.65, arm: 0, runArm: 0, sprintArm: 0, landing: 0.5, spine: 0.025 },
    spider: { sway: 0.3, arm: 0, runArm: 0, sprintArm: 0, landing: 0.35, spine: 0.03 },
    jelly: { sway: 0.3, arm: 0, runArm: 0, sprintArm: 0, landing: 0.5, spine: 0.025 },
    wolf: { sway: 0.35, arm: 0, runArm: 0, sprintArm: 0, landing: 0.7, spine: 0.055 }
  };
  var walk = [[0, 0.45], [0.12, -0.65], [0.3, 0.35], [0.5, 0.45], [0.62, -0.65], [0.8, 0.35], [1, 0.45]];
  var run = [[0, 0.5], [0.1, -1.1], [0.32, 0.4], [0.47, 1.4], [0.5, 0.5], [0.6, -1.1], [0.82, 0.4], [0.97, 1.4], [1, 0.5]];
  var sprint = [[0, 0.5], [0.1, -1.2], [0.24, -0.2], [0.43, 1.55], [0.5, 0.5], [0.6, -1.2], [0.74, -0.2], [0.93, 1.55], [1, 0.5]];
  var gallop = [[0, -0.6], [0.12, -1.2], [0.28, 0.1], [0.45, 1.6], [0.5, -0.7], [0.62, -1.1], [0.78, 0.4], [0.95, 2], [1, -0.6]];
  function samplePoseTrack(track, phase) {
    const p = (phase % 1 + 1) % 1;
    for (let i = 1; i < track.length; i++) if (p <= track[i][0]) {
      const a = track[i - 1], b = track[i], t = (p - a[0]) / (b[0] - a[0]), s = t * t * (3 - 2 * t);
      return a[1] + (b[1] - a[1]) * s;
    }
    return track[0][1];
  }
  function locomotionPose(id, phase, runBlend = 0, sprintBlend = 0) {
    const p = MOTION_PROFILES[id], wave = Math.sin(phase * TAU), arm = p.arm + (p.runArm - p.arm) * runBlend + (p.sprintArm - p.runArm) * sprintBlend;
    let bob = samplePoseTrack(walk, phase) * (1 - runBlend) + samplePoseTrack(run, phase) * runBlend;
    if (id === "wolf") bob = bob * (1 - sprintBlend) + samplePoseTrack(gallop, phase) * sprintBlend;
    else bob = bob * (1 - sprintBlend) + samplePoseTrack(sprint, phase) * sprintBlend;
    return {
      bob: bob * p.landing,
      sway: -wave * p.sway,
      arm: Math.cos(phase * TAU) * arm,
      yaw: wave * (p.spine + runBlend * 0.025),
      pitch: id === "wolf" ? Math.sin(phase * TAU + 0.5) * sprintBlend * 0.045 : 0,
      spine: id === "wolf" ? Math.cos(phase * TAU) * sprintBlend * 4 : 0
    };
  }

  // prototype-rig.js
  var TAU2 = Math.PI * 2;
  var bound = (n, a, b) => Math.max(a, Math.min(b, n));
  var ease = (p) => {
    p = bound(p, 0, 1);
    return p * p * (3 - 2 * p);
  };
  var point = (x = 0, y = 0, z = 0) => ({ x, y, z });
  var plus = (a, b) => point(a.x + b.x, a.y + b.y, a.z + b.z);
  var times = (a, s) => point(a.x * s, a.y * s, a.z * s);
  var minus = (a, b) => point(a.x - b.x, a.y - b.y, a.z - b.z);
  var dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  var length = (a) => Math.hypot(a.x, a.y, a.z);
  var unit = (a) => times(a, 1 / (length(a) || 1));
  var mix = (a, b, t) => plus(times(a, 1 - t), times(b, t));
  var RIGS = {
    knight: { hip: 34, thigh: 16, shin: 16, stance: 7, shoulder: 13, arm: 13, forearm: 13, bodyW: 37, bodyH: 32, headW: 38, headH: 36, legW: 14, calfW: 12, armW: 12, footW: 17 },
    orc: { hip: 28, thigh: 14, shin: 14, stance: 10, shoulder: 18, arm: 14, forearm: 14, bodyW: 54, bodyH: 34, headW: 43, headH: 36, legW: 20, calfW: 17, armW: 17, footW: 22 },
    elf: { hip: 34, thigh: 16, shin: 16, stance: 6.5, shoulder: 11, arm: 13, forearm: 13, bodyW: 33, bodyH: 32, headW: 37, headH: 35, legW: 13, calfW: 11, armW: 10, footW: 16 },
    caster: { hip: 32, thigh: 15, shin: 15, stance: 7, shoulder: 13, arm: 13, forearm: 13, bodyW: 35, bodyH: 33, headW: 39, headH: 36, legW: 15, calfW: 12, armW: 12, footW: 17 },
    wolf: { hip: 24, thigh: 15.5, shin: 15.5, hock: 7, stance: 7, bodyW: 61, bodyH: 31, headW: 43, headH: 34, legW: 11, calfW: 8, footW: 13 },
    fox: { hip: 33, thigh: 16, shin: 16, stance: 7, shoulder: 11, arm: 13, forearm: 13, headW: 44, headH: 38, bodyW: 34, bodyH: 28 },
    mech: { hip: 30, thigh: 16, shin: 18, stance: 11, body: "walker", headW: 35, bodyW: 62 },
    spider: { hip: 21, thigh: 21, shin: 23, stance: 6, body: "arachnid", headW: 30, bodyW: 48 },
    jelly: { hip: 17, body: "gel", headW: 45, bodyW: 48 },
    crab: { hip: 21, thigh: 17, shin: 18, stance: 8, body: "crab", headW: 30, bodyW: 54 },
    centipede: { hip: 18, thigh: 14, shin: 17, stance: 8, body: "centipede", headW: 30, bodyW: 60 },
    serpent: { hip: 10, body: "serpent", headW: 34, bodyW: 50 },
    flyer: { hip: 29, body: "flyer", headW: 32, bodyW: 30 }
  };
  function projectRig(p, angle) {
    return { x: p.x * Math.cos(angle) - p.y * Math.sin(angle), y: (p.x * Math.sin(angle) + p.y * Math.cos(angle)) * 0.58 - p.z, depth: p.x * Math.sin(angle) + p.y * Math.cos(angle) };
  }
  function solveLimb(root, target, upper, lower, pole = point(1, 0, 0)) {
    const delta = minus(target, root), raw = length(delta), dir = unit(raw > 1e-7 ? delta : point(0, 0, -1));
    const distance3 = bound(raw, Math.abs(upper - lower) + 1e-3, upper + lower - 1e-3);
    const end = plus(root, times(dir, distance3));
    const along = (upper * upper - lower * lower + distance3 * distance3) / (2 * distance3);
    let normal = minus(pole, times(dir, dot(pole, dir)));
    if (length(normal) < 1e-5) normal = minus(point(0, 1, 0), times(dir, dir.y));
    normal = unit(normal);
    const joint = plus(plus(root, times(dir, along)), times(normal, Math.sqrt(Math.max(0, upper * upper - along * along))));
    return { root, joint, end, upper, lower, clamped: Math.abs(raw - distance3) > 0.01 };
  }
  function locomotionStride(stride, run2 = 0, sprint2 = 0, id = "knight") {
    return stride * (1 + (id === "wolf" ? 0.08 : ["mech", "spider", "jelly"].includes(id) ? 0.18 : 0.35) * run2 + (id === "wolf" ? 0.36 : ["mech", "spider", "jelly"].includes(id) ? 0.25 : 0.45) * sprint2);
  }
  function footSoleLift(id, pitch, ankleZ = 3) {
    const s = Math.sin(pitch), c2 = Math.cos(pitch);
    const profiles = id === "wolf" ? [[3, -0.7, 6, 2.9], [6, -1.2, 2.5, 1.3]] : [[3, 1, 8, 3.6], [3, -1.8, 8, 1.2]];
    const bottom = Math.min(...profiles.map(([x, z, rx, rz]) => -x * s + z * c2 - Math.hypot(rx * s, rz * c2)));
    return Math.max(0, -ankleZ - bottom);
  }
  function legLayout(id, run2 = 0, sprint2 = 0) {
    if (["jelly", "serpent", "flyer"].includes(id)) return [];
    if (id === "centipede") return Array.from({ length: 12 }, (_, i) => ({ x: (i % 6 - 2.5) * 8, y: i < 6 ? -7 : 7, footY: i < 6 ? -24 : 24, offset: i % 6 * 0.13 + (i < 6 ? 0 : 0.5) }));
    if (id === "crab") return Array.from({ length: 8 }, (_, i) => ({ x: (i % 4 - 1.5) * 8, y: i < 4 ? -8 : 8, footY: i < 4 ? -29 : 29, offset: i % 4 * 0.1 + (i < 4 ? 0 : 0.5) }));
    if (id === "mech") return Array.from({ length: 6 }, (_, i) => ({ x: (i % 3 - 1) * 14, y: i < 3 ? -11 : 11, footY: i < 3 ? -25 : 25, offset: (i % 3 + (i < 3 ? 0 : 1)) % 2 * 0.5 }));
    if (id === "spider") return Array.from({ length: 8 }, (_, i) => ({ x: (1.5 - i % 4) * 8, y: i < 4 ? -6 : 6, footX: (1.5 - i % 4) * 12, footY: i < 4 ? -32 : 32, offset: (i % 4 + (i < 4 ? 0 : 1)) % 2 * 0.5 + i % 4 * 0.025 }));
    if (id !== "wolf") return [{ x: 0, y: -RIGS[id].stance, offset: 0 }, { x: 0, y: RIGS[id].stance, offset: 0.5 }];
    return [
      { x: 18, y: -7, offset: 0, front: true },
      { x: -18, y: -7, offset: 0.75 - 0.25 * run2, front: false },
      { x: 18, y: 7, offset: 0.5 + 0.38 * sprint2, front: true },
      { x: -18, y: 7, offset: 0.25 * (1 - run2) + 0.38 * sprint2, front: false }
    ];
  }
  function rigFoot(phase, stride, running = false, sprinting = 0) {
    const run2 = typeof running === "number" ? bound(running, 0, 1) : running ? 1 : 0;
    const sprint2 = bound(sprinting, 0, 1), duty = 0.62 - 0.16 * run2 - 0.08 * sprint2, p = (phase % 1 + 1) % 1, half = stride * duty / 2;
    if (p < duty) {
      const contact = p / duty;
      const pitch = -0.16 * (1 - ease(contact / 0.17)) + 0.28 * ease((contact - 0.77) / 0.23);
      return { x: half - p * stride, z: 0, pitch, planted: true, duty };
    }
    const t = (p - duty) / (1 - duty);
    return { x: -half + 2 * half * ease(t), z: Math.sin(Math.PI * t) ** 1.35 * (8 + run2 * 5 + sprint2 * 5), pitch: 0.28 * (1 - ease(t)) - 0.16 * ease(t), planted: false, duty };
  }
  function canineFoot(phase, stride, run2 = 0, sprint2 = 0) {
    const duty = 0.64 - 0.1 * run2 - 0.26 * sprint2, p = (phase % 1 + 1) % 1, half = stride * duty / 2;
    if (p < duty) return { x: half - p * stride, z: 0, pitch: 0, planted: true, duty };
    const t = (p - duty) / (1 - duty);
    return { x: -half + 2 * half * ease(t), z: Math.sin(Math.PI * t) ** 1.5 * (4 + run2 * 2 + sprint2 * 3), pitch: -0.08 * Math.sin(t * Math.PI), planted: false, duty };
  }
  function weaponMotion(id, phase, stage, style = "overhead") {
    const heavy = id === "orc", hip = RIGS[id].hip, rest = point(heavy ? 10 : 9, heavy ? 8 : 14, hip + (heavy ? 18 : 7)), restTilt = heavy ? 1.1 : 1.85;
    if (style === "side") {
      const prepared = point(-4, heavy ? 3 : 16, hip + 20), contact2 = point(heavy ? 15 : 22, heavy ? 0 : 12, hip + 14), follow2 = point(heavy ? 8 : 16, heavy ? -5 : -3, hip + 8);
      const restAxis = point(Math.sin(restTilt), 0, Math.cos(restTilt)), readyAxis = unit(point(-0.75, 0.6, 0.2)), contactAxis = unit(point(1, 0, 0.12)), followAxis = unit(point(0.4, -0.9, -0.1));
      if (stage === "windup") {
        const active = phase >= 0.72, t = ease(active ? (phase - 0.72) / 0.28 : phase / 0.72);
        return { hand: mix(active ? prepared : rest, active ? contact2 : prepared, t), axis: unit(mix(active ? readyAxis : restAxis, active ? contactAxis : readyAxis, t)), active, weight: active ? 1 - t * 0.4 : t, tilt: Math.PI / 2 };
      }
      if (stage === "recovery") {
        const active = phase < 0.26, t = ease(active ? phase / 0.26 : (phase - 0.26) / 0.74);
        return { hand: mix(active ? contact2 : follow2, active ? follow2 : rest, t), axis: unit(mix(active ? contactAxis : followAxis, active ? followAxis : restAxis, t)), active, weight: active ? 0.6 * (1 - t) : 0, tilt: Math.PI / 2 };
      }
    }
    const raised = point(heavy ? -8 : -11, heavy ? 3 : 13, hip + (heavy ? 36 : 33));
    const contact = point(heavy ? 22 : 21, heavy ? 2 : 12, hip + (heavy ? 15 : 9));
    const follow = point(14, heavy ? 0 : 9, hip + 8);
    if (stage === "windup") {
      if (phase < 0.72) {
        const t2 = ease(phase / 0.72);
        return { hand: mix(rest, raised, t2), tilt: restTilt + (-1.05 - restTilt) * t2, active: false, weight: t2 };
      }
      const t = ease((phase - 0.72) / 0.28);
      return { hand: mix(raised, contact, t), tilt: -1.05 + (1.53 + 1.05) * t, active: true, weight: 1 - t * 0.4 };
    }
    if (stage === "recovery") {
      if (phase < 0.26) {
        const t2 = ease(phase / 0.26);
        return { hand: mix(contact, follow, t2), tilt: 1.53 + (2.1 - 1.53) * t2, active: true, weight: 0.6 * (1 - t2) };
      }
      const t = ease((phase - 0.26) / 0.74);
      return { hand: mix(follow, rest, t), tilt: 2.1 + (restTilt - 2.1) * t, active: false, weight: 0 };
    }
    return { hand: rest, tilt: restTilt, active: false, weight: 0 };
  }
  function characterRig(id, state = "idle", phase = 0, stage = "", options = {}) {
    const requestedState = state;
    if (state === "slash") {
      state = "attack";
      options = { ...options, swing: "side" };
    }
    if (state === "charge") {
      state = "attack";
      options = { ...options, charged: true, anticipation: 3 };
    }
    const d = RIGS[id];
    if (d.body) return { ...creatureRig(id, state, phase, stage, options), state: requestedState, charged: Boolean(options.charged), anticipation: options.anticipation || 1 };
    const wolf = id === "wolf", heavy = id === "orc", bow = id === "elf" || id === "fox", moving = ["walk", "run", "sprint", "turn"].includes(state), running = state === "run" || state === "sprint";
    const motion = moving ? options.motion ?? 1 : 0, gait = phase;
    const runBlend = options.runBlend ?? (running ? 1 : 0);
    const sprintBlend = options.sprintBlend ?? (state === "sprint" ? 1 : 0);
    const stride = locomotionStride(options.stride || (wolf ? 72 : heavy ? 72 : id === "caster" ? 70 : id === "fox" ? 74 : 76), runBlend, sprintBlend, id);
    const layout = legLayout(id, runBlend, sprintBlend);
    const breath = Math.sin(phase * TAU2) * 0.25;
    const authored = locomotionPose(id, gait, runBlend, sprintBlend);
    const bob = moving ? authored.bob * motion : breath;
    let crouch = moving ? (wolf ? 6 + runBlend + sprintBlend : heavy ? 10 + runBlend * 1.5 + sprintBlend : 11 + runBlend * 1.5 + sprintBlend) * motion : 0, shift = 0, sideShift = 0, sideLean = 0;
    const rollAngle = options.rollAngle ?? (state === "dodge" ? Math.PI / 2 : 0);
    let lean = moving ? (0.04 + runBlend * 0.09 + sprintBlend * 0.1 + (options.acceleration || 0) * 0.04 + authored.pitch) * motion : 0;
    let torsoYaw = moving ? authored.yaw * motion : 0;
    const wm = weaponMotion(id, phase, state === "attack" ? stage : "", options.swing || "overhead");
    if (state === "attack" && (id === "knight" || heavy)) {
      torsoYaw = stage === "recovery" ? 0.22 * (1 - ease(phase)) : phase < 0.72 ? -0.2 * ease(phase / 0.72) : -0.2 + 0.42 * ease((phase - 0.72) / 0.28);
      crouch += wm.weight * (heavy ? 4 : 2);
      const swing = ease((phase - 0.72) / 0.28);
      shift = stage === "recovery" ? 3 * (1 - ease(phase)) : wm.active ? -2 + 5 * swing : -wm.weight * 2;
      lean = stage === "recovery" ? 0.08 * (1 - ease(phase)) : wm.active ? -0.055 + 0.135 * swing : -wm.weight * 0.055;
      if (options.swing === "side") torsoYaw = stage === "recovery" ? 0.38 * (1 - ease(phase)) : -0.42 * ease(phase / 0.72) + 0.8 * swing;
      if (options.charged) {
        const brace = stage === "windup" && phase < 0.72 ? ease(phase / 0.72) : stage === "recovery" ? 1 - ease(phase) : 1 - ease((phase - 0.72) / 0.28);
        crouch += brace * 3;
        lean -= brace * 0.035;
      }
    }
    if (state === "attack" && bow) {
      crouch = 1.5 * (stage === "windup" ? ease(phase) : 1 - ease(phase));
      shift = 1.2;
    }
    if (state === "attack" && wolf) {
      const swing = ease((phase - 0.72) / 0.28);
      shift = stage === "recovery" ? 5 * (1 - ease(phase)) : phase < 0.72 ? -3 * ease(phase / 0.72) : -3 + 8 * swing;
      crouch = stage === "recovery" ? 1.5 * (1 - ease(phase)) : 1.5 * ease(phase);
      if (options.charged && stage === "windup" && phase < 0.72) {
        crouch += 3 * ease(phase / 0.72);
        shift -= 2 * ease(phase / 0.72);
      }
    }
    if (state === "cast") crouch = 2 * Math.sin(phase * Math.PI);
    if (state === "dash") {
      const pulse = Math.sin(phase * Math.PI);
      crouch = 7 * pulse;
      lean = 0.22 * pulse;
      shift = 7 * pulse;
    }
    if (state === "dodge") {
      const pulse = Math.sin(phase * Math.PI);
      crouch = 15 * pulse;
      lean = 0.13 * Math.cos(rollAngle) * pulse;
      sideLean = 0.12 * Math.sin(rollAngle) * pulse;
      shift = 4 * Math.cos(rollAngle) * pulse;
      sideShift = 3 * Math.sin(rollAngle) * pulse;
    }
    if (state === "hit") {
      crouch = 2 * Math.sin(phase * Math.PI);
      shift = -4 * Math.sin(phase * Math.PI);
      lean = -0.1 * Math.sin(phase * Math.PI);
      torsoYaw = -0.08 * Math.sin(phase * Math.PI);
    }
    if (state === "stagger") {
      crouch = 8 * Math.sin(phase * Math.PI);
      shift = -3 * Math.sin(phase * Math.PI);
      lean = -0.16 * Math.sin(phase * Math.PI);
      torsoYaw = -0.13 * Math.sin(phase * Math.PI);
    }
    if (state === "turn") {
      shift = Math.sin(phase * TAU2) * 1.5;
      crouch += Math.sin(phase * Math.PI) * 1.5;
      torsoYaw += Math.sin(phase * TAU2) * 0.12;
      lean += Math.sin(phase * TAU2) * 0.04;
    }
    if (state === "stop") {
      crouch = 11 * (1 - ease(phase)) + 4 * Math.sin(phase * Math.PI);
      lean = -0.16 * Math.sin(phase * Math.PI);
      shift = 3 * Math.sin(phase * Math.PI);
    }
    if (state === "getup") {
      crouch = 18 * (1 - ease(phase));
      lean = -0.25 * (1 - ease(phase));
    }
    if (state === "knockdown") {
      crouch = 18 * ease(phase);
      lean = -0.45 * ease(phase);
    }
    if (state === "death") {
      crouch = ease(phase / 0.5) * (wolf ? 12 : 24);
      shift = -4 * ease(phase);
    }
    let hipHeight = d.hip - crouch + bob;
    let pelvis = point(shift, authored.sway * motion + sideShift, hipHeight);
    let body = point(shift + lean * 14, pelvis.y * 0.55 + sideLean * 14, wolf ? hipHeight + 7 : hipHeight + 11);
    let head = point(wolf ? 24 + shift + authored.spine : shift + lean * 22 + 1, pelvis.y * 0.3 + sideLean * 22, wolf ? hipHeight + 10 + authored.pitch * 18 : hipHeight + 30 - bob * 0.65);
    const transition = options.transition && !moving ? options.transition : null;
    const prior = transition ? characterRig(id, transition.sprintBlend > 0.35 ? "sprint" : transition.runBlend > 0.4 ? "run" : "walk", transition.gait, "", { stride: options.stride, motion: transition.motion ?? 1, runBlend: transition.runBlend || 0, sprintBlend: transition.sprintBlend || 0 }) : null;
    if (prior) {
      const w = transition.weight;
      pelvis = mix(pelvis, prior.pelvis, w);
      body = mix(body, prior.body, w);
      head = mix(head, prior.head, w);
      hipHeight = pelvis.z;
      lean = lean * (1 - w) + prior.lean * w;
      torsoYaw = torsoYaw * (1 - w) + prior.torsoYaw * w;
    }
    const shoulderZ = hipHeight + 19, shoulderX = body.x;
    if (wolf && state === "attack") head.x += stage === "recovery" ? 6 * (1 - ease(phase / 0.35)) : 6 * ease((phase - 0.72) / 0.28);
    const movementAngle = options.movementAngle || 0;
    const legs = layout.map((l, i) => {
      let foot = wolf ? canineFoot(gait + l.offset, stride, runBlend, sprintBlend) : rigFoot(gait + l.offset, stride, runBlend, sprintBlend);
      if (!moving) {
        const pulse = Math.sin(phase * Math.PI), action = state === "dash" || state === "dodge";
        foot = { x: (i % 2 ? 1 : -1) * (2 + (action ? (state === "dash" ? 9 : 7) * pulse : 0)), z: state === "dash" ? pulse * (i % 2 ? 5 : 2) : 0, pitch: action ? -0.12 * pulse : 0, planted: state !== "dash" || pulse < 0.05 };
      }
      if (state === "dodge") {
        const pulse = Math.sin(phase * Math.PI), side = Math.sign(l.y), lead = side * Math.sin(rollAngle) > 0;
        foot.x = (i % 2 ? 2 : -2) + side * 7 * pulse * Math.cos(rollAngle);
        foot.lateral = side * 7 * pulse * Math.sin(rollAngle);
        foot.z = lead ? 3 * pulse : 0;
        foot.planted = !lead || pulse < 0.05;
      }
      if (state === "turn") {
        foot.x += Math.sin((phase + l.offset) * TAU2) * 3;
        foot.z = Math.max(0, Math.sin((phase + l.offset) * TAU2)) * 3;
      }
      if (prior) {
        const old = prior.legs[i], t = transition.weight;
        foot.x = foot.x * (1 - t) + (old.end.x - l.x) * t;
        foot.z = foot.z * (1 - t) + (old.end.z - 3) * t;
        foot.pitch = foot.pitch * (1 - t) + old.foot.pitch * t;
      }
      const root = point(pelvis.x + l.x, pelvis.y + l.y, hipHeight + (wolf ? (l.front ? 1 : 0) + authored.pitch * l.x : 0));
      const ground = options.feet?.[i] || point(l.x + foot.x * Math.cos(movementAngle) * (moving ? motion : 1), l.y + (foot.lateral || 0) + foot.x * Math.sin(movementAngle) * (moving ? motion : 1), foot.z * (moving ? motion : 1) + 3);
      const soleLift = footSoleLift(id, foot.pitch, ground.z), target = { ...ground, z: ground.z + soleLift };
      const pole = point(wolf && l.front ? -1 : 1, 0, 0);
      const hock = wolf && !l.front ? plus(target, point(-d.hock * 0.65, 0, d.hock * Math.sqrt(1 - 0.65 ** 2))) : null;
      const solved = solveLimb(root, hock || target, wolf && l.front ? 14.5 : d.thigh, wolf && l.front ? 15.5 : d.shin, pole);
      return {
        ...solved,
        hock: hock ? solved.end : null,
        hockLength: hock ? d.hock : 0,
        end: hock ? plus(solved.end, minus(target, hock)) : solved.end,
        side: l.y,
        front: l.front,
        foot: { ...foot, position: target, ground, soleLift, angle: options.feet?.[i]?.angle || 0 },
        index: i
      };
    });
    const arms = [];
    let weapon = null, shield = null, bowString = null;
    if (!wolf) {
      let right = point(8, d.shoulder + 1, hipHeight + 8), left = point(6, -d.shoulder - 1, hipHeight + 9), tilt = 0.22, weaponAxis = null;
      const swing = moving ? authored.arm * motion : 0;
      const elbowLift = (runBlend * 4 + sprintBlend * 5) * motion;
      if (id === "knight") {
        right = point(9 + swing * 0.4, 14, hipHeight + 7 + elbowLift * 0.4);
        left = point(7 - swing * 0.7, -17, hipHeight + 17 + elbowLift * 0.4);
        tilt = 1.85 - runBlend * 0.12 - sprintBlend * 0.08;
      }
      if (heavy) {
        right = point(10, 8, hipHeight + 18);
        left = point(5, -5, hipHeight + 12);
      }
      if (bow) {
        right = point(7 + swing, 13, hipHeight + 6 + elbowLift);
        left = point(14 - swing * 0.5, -17, hipHeight + 14 + elbowLift * 0.5);
        bowString = { draw: 0 };
      }
      if (id === "caster") {
        right = point(11 + swing * 0.3, 15, hipHeight + 14 + elbowLift * 0.4);
        left = point(5 - swing, -15, hipHeight + 9 + elbowLift);
      }
      if (moving) {
        right.x += shoulderX;
        left.x += shoulderX;
      }
      if (heavy) {
        tilt = state === "attack" ? tilt : 1.1 + Math.sin(gait * TAU2) * motion * 0.08;
        left = plus(right, times(point(Math.sin(tilt), 0, Math.cos(tilt)), -11));
      }
      if (state === "attack" && (id === "knight" || heavy)) {
        right = { ...wm.hand, z: wm.hand.z + hipHeight - d.hip };
        tilt = wm.tilt;
        weaponAxis = wm.axis || null;
        if (heavy) left = plus(right, times(weaponAxis || point(Math.sin(tilt), 0, Math.cos(tilt)), -11));
        else left = point(7, -17, hipHeight + 20);
      }
      if (bow && state === "attack") {
        const raise = stage === "windup" ? ease(phase / 0.2) : 1 - ease(Math.max(0, (phase - 0.25) / 0.75));
        const pull = stage === "windup" ? ease((phase - 0.2) / 0.8) : 1 - ease(Math.min(1, phase * 6));
        left = mix(left, point(18, -7, hipHeight + 19), raise);
        right = mix(right, point(left.x - pull * 18, left.y, left.z), raise);
        bowString = { draw: pull, distance: 18 };
        tilt = 0;
      }
      if (state === "cast" && !heavy) {
        const channel = stage === "windup" ? ease(phase) : 1 - ease(phase);
        right = point(14, 12, hipHeight + 22 + channel * 8);
        left = point(13 + channel * 9, -12, hipHeight + 23 + channel * 4);
        tilt = -0.08;
      }
      if (state === "dash" || state === "dodge") {
        const pulse = Math.sin(phase * Math.PI);
        right.x = right.x * (1 - pulse) - 8 * pulse;
        left.x = left.x * (1 - pulse) - 6 * pulse;
        right.z += 6 * pulse;
        left.z += 4 * pulse;
        tilt = tilt * (1 - pulse) - 0.25 * pulse;
      }
      if (prior) {
        const w = transition.weight;
        right = mix(right, prior.arms.find((a) => a.side === 1).end, w);
        left = mix(left, prior.arms.find((a) => a.side === -1).end, w);
        tilt = tilt * (1 - w) + prior.weapon.tilt * w;
        if (weaponAxis) weaponAxis = unit(mix(weaponAxis, prior.weapon.axis, w));
      }
      if (heavy && !weaponAxis) tilt = Math.min(tilt, Math.acos(bound((20 - right.z) / 48, -1, 1)));
      if (heavy) left = plus(right, times(weaponAxis || point(Math.sin(tilt), 0, Math.cos(tilt)), -11));
      for (const [side, target] of [[-1, left], [1, right]]) {
        const root = point(shoulderX - side * d.shoulder * Math.sin(torsoYaw), body.y + side * d.shoulder * Math.cos(torsoYaw), shoulderZ);
        const solved = solveLimb(root, target, d.arm, d.forearm, point(-0.6, side * 0.7, -0.7));
        arms.push({ ...solved, side });
      }
      const r = arms.find((a) => a.side === 1).end, l = arms.find((a) => a.side === -1).end;
      const grip = bow ? l : r, axis = weaponAxis || point(Math.sin(tilt), 0, Math.cos(tilt));
      const reach = id === "knight" ? 45 : heavy ? 48 : bow ? 27 : 43;
      const roll = heavy ? state !== "attack" ? 0.85 : stage === "windup" ? 0.85 * (1 - ease(phase / 0.5)) : 0.85 * ease((phase - 0.26) / 0.74) : 0;
      weapon = { kind: id === "knight" ? "sword" : heavy ? "axe" : bow ? "bow" : "staff", grip, axis, tip: plus(grip, times(axis, reach)), length: reach, tilt, roll, active: state === "attack" && wm.active, hand: bow ? "left" : "right", style: options.swing || "overhead" };
      if (heavy) {
        const hand = arms.find((a) => a.side === -1), target = plus(grip, times(axis, -11));
        Object.assign(hand, solveLimb(hand.root, target, d.arm, d.forearm, point(-0.5, -0.7, -0.7)));
      }
      if (id === "knight") shield = { grip: l };
    }
    return { id, state: requestedState, phase, stage, dimensions: d, pelvis, body, head, legs, arms, weapon, shield, bowString, lean, sideLean, torsoYaw, crouch, death: state === "death" ? ease(phase) : 0, tail: point(-27 + shift - authored.spine, 0, hipHeight + 9), anticipation: options.anticipation || 1, charged: Boolean(options.charged), spine: authored.spine };
  }
  function creatureRig(id, state, phase, stage, options) {
    const d = RIGS[id], moving = ["walk", "run", "sprint", "turn"].includes(state), run2 = options.runBlend ?? (["run", "sprint"].includes(state) ? 1 : 0), sprint2 = options.sprintBlend ?? (state === "sprint" ? 1 : 0), motion = options.motion ?? 1;
    const authored = locomotionPose(id, phase, run2, sprint2), pulse = Math.sin(Math.PI * phase), dead = state === "death" ? ease(phase) : 0;
    const lean = moving ? 0.05 + run2 * 0.1 + sprint2 * 0.13 : state === "stop" ? -0.15 * pulse : state === "dodge" ? 0.1 * pulse : 0;
    let hip = d.hip - (moving ? 5 : 0) + authored.bob;
    if (state === "dodge" || state === "dash") hip -= 6 * pulse;
    if (state === "hit" || state === "stagger") hip -= 4 * pulse;
    if (state === "attack" && id === "spider") hip -= stage === "windup" ? 3 * ease(phase / 0.72) : 3 * (1 - ease(phase));
    if (options.charged && state === "attack") hip -= 2 * (stage === "windup" ? ease(phase / 0.72) : 1 - ease(phase));
    hip -= dead * 12;
    const pelvis = point(0, 0, hip), body = point(lean * 8, authored.sway * motion, hip + 7), head = point(id === "mech" ? 14 : 12, 0, hip + 10);
    if (state === "attack" && id === "spider") head.x += stage === "windup" ? 7 * ease((phase - 0.72) / 0.28) : 7 * (1 - ease(phase));
    const layout = legLayout(id), stride = locomotionStride(options.stride || (id === "mech" ? 44 : 62), run2, sprint2, id);
    const legs = layout.map((l, i) => {
      const foot = moving ? rigFoot(phase + l.offset, stride, run2 * 0.25, 0) : { x: 0, z: 0, pitch: 0, planted: true, duty: 0.62 };
      const root = point(l.x, l.y, hip), ground = options.feet?.[i] || point((l.footX ?? l.x) + foot.x * motion, l.footY, 3 + foot.z);
      const lift = footSoleLift(id, foot.pitch, ground.z), target = { ...ground, z: ground.z + lift }, solved = solveLimb(root, target, d.thigh, d.shin, point(0, Math.sign(l.y), 0.3));
      return { ...solved, index: i, side: l.y, front: l.x > 0, foot: { ...foot, position: target, ground, soleLift: lift, angle: options.feet?.[i]?.angle || 0 } };
    });
    if (id === "jelly") {
      body.z = 17 + Math.max(0, Math.sin(phase * TAU2)) * ((moving ? 1 : 0) * (7 + run2 * 4 + sprint2 * 4));
      head.z = body.z + 3;
    }
    if (id === "serpent") {
      body.z = 10 - dead * 5;
      head.x = 17 + (state === "attack" ? Math.sin(phase * Math.PI) * 9 : 0);
      head.z = 19 - dead * 12;
    }
    if (id === "flyer") {
      body.z = 30 + (moving ? Math.sin(phase * TAU2) * 3 : Math.sin(phase * TAU2) * 1.5) - dead * 20;
      head.x = 7;
      head.z = body.z + 15;
      head.y = body.y * 0.5;
    }
    if (id === "centipede") {
      head.x = 30;
      body.x = 0;
    }
    const grip = point(head.x + 3, 0, head.z), axis = point(1, 0, 0), weapon = { kind: id === "mech" ? "cannon" : id === "jelly" ? "gel" : "fangs", grip, axis, tip: plus(grip, times(axis, id === "spider" ? 19 : 24)), length: 24, tilt: Math.PI / 2 };
    const segments = id === "centipede" ? Array.from({ length: 7 }, (_, i) => point(23 - i * 8, Math.sin(phase * TAU2 - i * 0.7) * 2, body.z)) : id === "serpent" ? Array.from({ length: 9 }, (_, i) => point(17 - i * 6, Math.sin(phase * TAU2 - i * 0.68) * (moving ? 9 : 3), 6 + Math.sin(phase * TAU2 - i * 0.68) * 1.4)) : null;
    const flap = Math.sin(phase * TAU2) * (dead ? 0 : 1), wings = id === "flyer" ? [-1, 1].map((side) => [point(-2, side * 5, body.z + 3), point(-10, side * (21 + run2 * 3), body.z + flap * 10), point(-18, side * (37 + run2 * 3), body.z + flap * 20), point(-15, side * 12, body.z - 8)]) : null;
    return { id, state, phase, stage, dimensions: d, pelvis, body, head, legs, arms: [], weapon, segments, wings, lean, sideLean: 0, torsoYaw: 0, crouch: d.hip - hip, death: dead, squash: id === "jelly" ? dead ? 1 + dead * 1.8 : 1 + Math.sin(phase * TAU2) * 0.2 : 1, tail: point(-18, 0, hip) };
  }
  function weaponContactPath(id, angle, options = {}) {
    const points = [];
    for (let i = 0; i <= 10; i++) {
      points.push(weaponTipAt(id, 0.72 + i * 0.028, angle, options));
    }
    return points;
  }
  function weaponTipAt(id, phase, angle, options = {}) {
    const rig = characterRig(id, "attack", phase, "windup", options);
    const p = id === "wolf" ? point(rig.head.x + 16, rig.head.y, rig.head.z - 3) : rig.weapon.tip;
    return { x: p.x * Math.cos(angle) - p.y * Math.sin(angle), y: p.x * Math.sin(angle) + p.y * Math.cos(angle), z: p.z };
  }
  function plantFeet(u, dt) {
    if (u.hp <= 0 || u.roll || u.stagger > 0 || u.knockdown > 0 || u.getup > 0) {
      u.groundFeet = null;
      return;
    }
    const rigScale = u.rigScale || 1, speed2 = Math.hypot(u.vx, u.vy), moving = speed2 > 4 && !u.action;
    const motion = bound((u.moving || 0) / 0.5, 0, 1), runBlend = u.runBlend || 0, sprintBlend = u.sprintBlend || 0;
    const rig = characterRig(u.id, moving ? sprintBlend > 0.35 ? "sprint" : runBlend > 0.4 ? "run" : "walk" : "idle", u.gait % 1, "", { stride: u.stride, motion, runBlend, sprintBlend, acceleration: u.acceleration, movementAngle: Math.atan2(Math.sin(u.moveFacing - u.facing), Math.cos(u.moveFacing - u.facing)) });
    const layout = legLayout(u.id, runBlend, sprintBlend), stride = locomotionStride(u.stride, runBlend, sprintBlend, u.id);
    const world = (p) => ({ x: u.x + rigScale * (p.x * Math.cos(u.facing) - p.y * Math.sin(u.facing)), y: u.y + rigScale * (p.x * Math.sin(u.facing) + p.y * Math.cos(u.facing)) });
    if (!u.groundFeet) u.groundFeet = rig.legs.map((leg) => ({ ...world(leg.end), z: leg.end.z - leg.foot.soleLift, angle: u.facing, planted: leg.foot.planted, serial: 0 }));
    for (let i = 0; i < rig.legs.length; i++) {
      const leg = rig.legs[i], f = u.groundFeet[i], goal = world(leg.end), phase = ((u.gait + layout[i].offset) % 1 + 1) % 1;
      if (!moving) {
        if (!u.action && f.planted && !u.groundFeet.some((other) => other.settling) && Math.hypot(goal.x - f.x, goal.y - f.y) > 7) {
          f.settling = { x: f.x, y: f.y, elapsed: 0 };
          f.planted = false;
        }
        if (f.settling) {
          f.settling.elapsed += dt;
          const t = Math.min(1, f.settling.elapsed / 0.19), blend = ease(t);
          f.x = f.settling.x + (goal.x - f.settling.x) * blend;
          f.y = f.settling.y + (goal.y - f.settling.y) * blend;
          f.z = 3 + Math.sin(t * Math.PI) * 4;
          f.angle = u.facing;
          if (t >= 1) {
            f.settling = null;
            f.z = 3;
            f.planted = true;
            f.serial++;
          }
        } else if (!f.planted) {
          f.x += (goal.x - f.x) * Math.min(1, dt * 15);
          f.y += (goal.y - f.y) * Math.min(1, dt * 15);
          f.z += (3 - f.z) * Math.min(1, dt * 22);
          if (f.z < 3.05) {
            f.z = 3;
            f.planted = true;
            f.serial++;
          }
        }
      } else if (leg.foot.planted) {
        f.settling = null;
        if (!f.planted) {
          f.planted = true;
          f.z = 3;
          f.serial++;
        }
      } else {
        f.settling = null;
        if (f.planted) {
          f.start = { x: f.x, y: f.y };
          f.planted = false;
        }
        const duty = leg.foot.duty, t = bound((phase - duty) / (1 - duty), 0, 1), remaining = (1 - phase) * stride * rigScale / speed2;
        const half = stride * duty / 2, base = layout[i].x;
        const lateral = layout[i].footY ?? leg.side, local = point((layout[i].footX ?? base) + half, lateral, 0), landing = world(local);
        landing.x += u.vx * remaining;
        landing.y += u.vy * remaining;
        const start = f.start || f, blend = ease(t);
        f.x = start.x + (landing.x - start.x) * blend;
        f.y = start.y + (landing.y - start.y) * blend;
        f.z = leg.foot.ground.z;
        f.angle = u.moveFacing;
      }
      const root = world(leg.root), reach = leg.upper + leg.lower - 0.2;
      const hockOffset = leg.hock ? world(minus(leg.hock, leg.end)) : null;
      const targetX = f.x + (hockOffset ? hockOffset.x - u.x : 0), targetY = f.y + (hockOffset ? hockOffset.y - u.y : 0), targetZ = f.z + footSoleLift(u.id, leg.foot.pitch, f.z) + (leg.hock ? leg.hock.z - leg.end.z : 0);
      if (Math.hypot((targetX - root.x) / rigScale, (targetY - root.y) / rigScale, targetZ - leg.root.z) > reach) {
        f.x = goal.x;
        f.y = goal.y;
        f.z = leg.end.z - leg.foot.soleLift;
        f.angle = u.facing;
        f.serial++;
      }
    }
  }
  function localFootContacts(u) {
    if (!u.groundFeet) return null;
    return u.groundFeet.map((f) => {
      const x = (f.x - u.x) / (u.rigScale || 1), y = (f.y - u.y) / (u.rigScale || 1);
      return { x: x * Math.cos(u.facing) + y * Math.sin(u.facing), y: -x * Math.sin(u.facing) + y * Math.cos(u.facing), z: f.z, angle: Math.atan2(Math.sin(f.angle - u.facing), Math.cos(f.angle - u.facing)) };
    });
  }

  // prototype-dynamics.js
  var copy = (p) => ({ x: p.x, y: p.y, z: p.z });
  var distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  function createRagdoll(id, rig = characterRig(id), impulse = { x: -90, y: 24 }) {
    const points = {}, links = [];
    function point2(name, p, mass = 1) {
      const floor = name === "head" ? id === "wolf" ? 9 : ["mech", "spider"].includes(id) ? 12 : id === "jelly" ? 6 : 15 : name === "body" ? 15 : name === "pelvis" ? 6 : 3;
      points[name] = { ...copy(p), floor, previous: { x: p.x - impulse.x / 120 * (name === "head" ? 1.2 : 0.5), y: p.y - impulse.y / 120, z: p.z + (name === "head" ? 0.4 : 0) }, mass };
    }
    function link(a, b) {
      links.push({ a, b, length: distance(points[a], points[b]) });
    }
    point2("pelvis", rig.pelvis, 2.5);
    point2("body", rig.body, 2);
    point2("head", rig.head, 1.2);
    link("pelvis", "body");
    link("body", "head");
    rig.legs.forEach((l, i) => {
      point2("root" + i, l.root);
      point2("knee" + i, l.joint);
      if (l.hock) point2("hock" + i, l.hock);
      point2("foot" + i, l.end);
      link("pelvis", "root" + i);
      link("root" + i, "knee" + i);
      link("knee" + i, l.hock ? "hock" + i : "foot" + i);
      if (l.hock) link("hock" + i, "foot" + i);
    });
    rig.arms.forEach((a, i) => {
      point2("shoulder" + i, a.root);
      point2("elbow" + i, a.joint);
      point2("hand" + i, a.end);
      link("body", "shoulder" + i);
      link("shoulder" + i, "elbow" + i);
      link("elbow" + i, "hand" + i);
    });
    return { id, points, links, base: rig, time: 0 };
  }
  function stepRagdoll(d, dt) {
    d.time += dt;
    for (const p of Object.values(d.points)) {
      const old = copy(p), vx = (p.x - p.previous.x) * 0.985, vy = (p.y - p.previous.y) * 0.985, vz = (p.z - p.previous.z) * 0.985;
      p.x += vx;
      p.y += vy;
      p.z += vz - 700 * dt * dt;
      p.previous = old;
      if (p.z < p.floor) {
        p.z = p.floor;
        p.previous.z = p.floor + vz * 0.12;
        p.previous.x = p.x - vx * 0.66;
        p.previous.y = p.y - vy * 0.66;
      }
    }
    for (let iteration = 0; iteration < 12; iteration++) for (const l of d.links) {
      const a = d.points[l.a], b = d.points[l.b], n = distance(a, b) || 1, correction = (n - l.length) / n, wa = 1 / a.mass, wb = 1 / b.mass;
      const dx = (b.x - a.x) * correction, dy = (b.y - a.y) * correction, dz = (b.z - a.z) * correction;
      a.x += dx * wa / (wa + wb);
      a.y += dy * wa / (wa + wb);
      a.z = Math.max(a.floor, a.z + dz * wa / (wa + wb));
      b.x -= dx * wb / (wa + wb);
      b.y -= dy * wb / (wa + wb);
      b.z = Math.max(b.floor, b.z - dz * wb / (wa + wb));
    }
  }
  function ragdollRig(d, recover = 0) {
    const base = d.base, idle = characterRig(d.id, "idle", 0), p = d.points, get = (name, target) => {
      const q = { x: p[name].x - p.pelvis.x, y: p[name].y - p.pelvis.y, z: p[name].z };
      return recover ? mix(q, target, ease(recover)) : q;
    };
    const rig = { ...base, ragdoll: true, state: recover ? "getup" : "death", death: recover ? 1 - recover : Math.min(1, d.time / 0.4), phase: Math.min(1, d.time), pelvis: get("pelvis", idle.pelvis), body: get("body", idle.body), head: get("head", idle.head), lean: 0, sideLean: 0, torsoYaw: 0 };
    rig.legs = base.legs.map((l, i) => ({ ...l, root: get("root" + i, idle.legs[i].root), joint: get("knee" + i, idle.legs[i].joint), hock: l.hock ? get("hock" + i, idle.legs[i].hock) : null, end: get("foot" + i, idle.legs[i].end) }));
    rig.arms = base.arms.map((a, i) => ({ ...a, root: get("shoulder" + i, idle.arms[i].root), joint: get("elbow" + i, idle.arms[i].joint), end: get("hand" + i, idle.arms[i].end) }));
    if (rig.weapon) {
      const original = base.weapon, grip = rig.arms.length ? rig.arms.find((a) => a.side === (["elf", "fox"].includes(d.id) ? -1 : 1)).end : rig.head;
      rig.weapon = { ...original, grip, axis: { x: 1, y: 0, z: 0 }, tip: { x: grip.x + original.length, y: grip.y, z: grip.z } };
    }
    if (rig.shield) rig.shield = { grip: rig.arms.find((a) => a.side === -1).end };
    rig.tail = { x: rig.pelvis.x - 27, y: rig.pelvis.y, z: rig.pelvis.z + 2 };
    if (d.id === "jelly") rig.squash = 1 + Math.min(1, d.time) * 2 * (1 - recover);
    if (base.wings) rig.wings = base.wings.map((w) => w.map((q) => ({ ...q, x: q.x + rig.body.x - base.body.x, y: q.y + rig.body.y - base.body.y, z: Math.max(3, q.z + rig.body.z - base.body.z) })));
    if (base.segments) rig.segments = base.segments.map((q) => ({ ...q, z: Math.max(3, q.z * (1 - rig.death)) }));
    return rig;
  }
  var previewCache = /* @__PURE__ */ new Map();
  function previewRagdoll(id, phase, recover = false) {
    const key = id + ":" + phase.toFixed(7) + ":" + recover;
    if (previewCache.has(key)) return previewCache.get(key);
    const d = createRagdoll(id, characterRig(id, "idle", 0));
    for (let i = 0; i < Math.round(Math.min(1, phase) * 100); i++) stepRagdoll(d, 1 / 120);
    if (recover) for (let i = 0; i < 100; i++) stepRagdoll(d, 1 / 120);
    const rig = ragdollRig(d, recover ? phase : 0);
    previewCache.set(key, rig);
    if (previewCache.size > 512) previewCache.delete(previewCache.keys().next().value);
    return rig;
  }
  function stepCape(u, dt) {
    if (!u.cape) u.cape = [{ angle: 0, velocity: 0 }, { angle: 0, velocity: 0 }, { angle: 0, velocity: 0 }];
    const drive = Math.min(1.5, Math.hypot(u.vx, u.vy) / u.run), turn = Math.sin(u.moveFacing - u.facing);
    u.cape.forEach((panel, i) => {
      const target = drive * 0.7 + turn * (i - 1) * 0.35 + Math.sin(u.gait * Math.PI * 2 - i * 0.6) * drive * 0.14;
      panel.velocity += (target - panel.angle) * 65 * dt;
      panel.velocity *= Math.exp(-8 * dt);
      panel.angle += panel.velocity * dt;
    });
  }
  function impactImpulse(u) {
    const c2 = Math.cos(u.facing), s = Math.sin(u.facing);
    return { x: (u.ix * c2 + u.iy * s) * 0.65, y: (-u.ix * s + u.iy * c2) * 0.65 };
  }

  // arena.js
  function sweepCircle(start, end, center, radius) {
    const dx = end.x - start.x, dy = end.y - start.y, ox = start.x - center.x, oy = start.y - center.y;
    const c2 = ox * ox + oy * oy - radius * radius;
    if (c2 <= 0) return 0;
    const a = dx * dx + dy * dy;
    if (a < 1e-10) return null;
    const b = 2 * (ox * dx + oy * dy), disc = b * b - 4 * a * c2;
    if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / (2 * a);
    return t >= 0 && t <= 1 ? t : null;
  }

  // prototype-engine.js
  var PROTOTYPE_CHARACTERS = [
    { id: "knight", name: "Aurel \xB7 Knight", role: "Vanguard", mass: 1.9, hp: 420, speed: 90, run: 180, reach: 64, damage: 40, windup: 0.32, recovery: 0.36, cooldown: 1.2, radius: 19, stride: 76, color: "#e7ba74", weapon: "sword", row: 0 },
    { id: "orc", name: "Brakk \xB7 Orc", role: "Brawler", mass: 2.6, hp: 470, speed: 78, run: 157, reach: 72, damage: 59, windup: 0.48, recovery: 0.46, cooldown: 1.5, radius: 23, stride: 72, color: "#b3c985", weapon: "axe", row: 1 },
    { id: "elf", name: "Syl \xB7 Elven rogue", role: "Rogue", mass: 0.8, hp: 235, speed: 110, run: 215, reach: 340, damage: 31, windup: 0.27, recovery: 0.28, cooldown: 1.08, radius: 15, stride: 76, color: "#b8daa0", weapon: "bow", row: 2 },
    { id: "caster", name: "Nyra \xB7 Silver mage", role: "Arcanist", mass: 1, hp: 255, speed: 92, run: 178, reach: 290, damage: 45, windup: 0.54, recovery: 0.4, cooldown: 1.7, radius: 16, stride: 70, color: "#a8d9ed", weapon: "staff", row: 3 },
    { id: "wolf", name: "Ember \xB7 Hound", role: "Pursuer", mass: 1.15, hp: 285, speed: 130, run: 240, reach: 53, damage: 29, windup: 0.23, recovery: 0.23, cooldown: 0.88, radius: 17, stride: 72, color: "#e3a879", weapon: "claws", row: 4 },
    { id: "fox", name: "Rowan \xB7 Fox ranger", role: "Ranger", mass: 0.9, hp: 245, speed: 106, run: 204, reach: 310, damage: 28, windup: 0.24, recovery: 0.28, cooldown: 1.05, radius: 16, stride: 74, color: "#edb465", weapon: "shortbow", row: 5, ranged: true },
    { id: "mech", name: "Cog \xB7 Brass walker", role: "Artillery", mass: 3.4, hp: 520, speed: 65, run: 135, reach: 275, damage: 48, windup: 0.6, recovery: 0.45, cooldown: 1.9, radius: 27, stride: 44, color: "#9fdcf1", weapon: "cannon", row: 6, ranged: true },
    { id: "spider", name: "Vesper \xB7 Rune spider", role: "Ambusher", mass: 0.7, hp: 240, speed: 94, run: 195, reach: 48, damage: 24, windup: 0.22, recovery: 0.25, cooldown: 0.88, radius: 22, stride: 62, color: "#bd8cec", weapon: "fangs", row: 7 },
    { id: "jelly", name: "Dew \xB7 Moon jelly", role: "Channeler", mass: 0.55, hp: 220, speed: 80, run: 155, reach: 230, damage: 30, windup: 0.42, recovery: 0.3, cooldown: 1.35, radius: 19, stride: 62, color: "#87e8ed", weapon: "gelbolt", row: 8, ranged: true, casts: true }
  ];
  var PROTOTYPE_BY_ID = Object.fromEntries(PROTOTYPE_CHARACTERS.map((x) => [x.id, x]));
  for (const spec of PROTOTYPE_CHARACTERS) {
    if (["elf", "caster"].includes(spec.id)) spec.ranged = true;
    if (spec.id === "caster") spec.casts = true;
  }
  var HERO_IDS = ["knight", "orc", "elf", "caster", "fox"];
  var circuitCenter = (i) => ({ x: 230 + i % 3 * 270, y: 205 + Math.floor(i / 3) * 225 });
  for (const id of ["serpent", "flyer", "crab", "centipede"]) PROTOTYPE_BY_ID[id] = { id, name: id, mass: 0.8, hp: 250, speed: 100, run: 185, sprint: 235, reach: id === "flyer" ? 250 : 50, damage: 25, windup: 0.3, recovery: 0.3, cooldown: 1.2, radius: 18, stride: 80, ranged: id === "flyer" };
  for (const spec of PROTOTYPE_CHARACTERS) spec.sprint = Math.round(spec.run * (spec.id === "wolf" ? 1.4 : spec.id === "orc" ? 1.3 : 1.35));
  var ANIMATION_STATES = ["idle", "walk", "run", "sprint", "turn", "attack", "slash", "charge", "cast", "dash", "dodge", "hit", "stagger", "knockdown", "getup", "stop", "death"];
  var ANTICIPATION_LEVELS = { 1: { name: "Quick", color: "#e7d39d" }, 2: { name: "Heavy", color: "#eea96e" }, 3: { name: "Charged \xB7 uninterruptible", color: "#aee8ef" } };
  var TEAM_SIZE = 6;
  var previousComposition = "";
  function seededRandom(seed) {
    let n = seed >>> 0;
    return () => {
      n = n + 1831565813 >>> 0;
      let t = Math.imul(n ^ n >>> 15, 1 | n);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function battleRosters(seed) {
    const random = seededRandom(seed), shuffle = (values) => {
      const a = values.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    return [0, 1].map(() => {
      const melee = shuffle(PROTOTYPE_CHARACTERS.filter((s) => !s.ranged)), ranged = shuffle(PROTOTYPE_CHARACTERS.filter((s) => s.ranged));
      const chosen = [...melee.slice(0, 2), ...ranged.slice(0, 2)], remaining = shuffle([...melee.slice(2), ...ranged.slice(2)]);
      return shuffle([...chosen, ...remaining.slice(0, TEAM_SIZE - chosen.length)]).map((s) => s.id);
    });
  }
  var ARENA_LIMITS = { left: 70, right: 930, top: 110, bottom: 805 };
  var clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  var distance2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  var angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  function groundToScreen(x, y) {
    return { x, y: y * 0.58 + 75 };
  }
  function screenToGround(x, y) {
    return { x, y: (y - 75) / 0.58 };
  }
  function directionalFrame(angle) {
    return (Math.round(angle / (Math.PI / 4)) % 8 + 8) % 8;
  }
  function makePrototypeUnit(id, side = 0, index = 0, x = 200, y = 300) {
    const spec = PROTOTYPE_BY_ID[id];
    if (!spec) throw new Error("Unknown prototype character");
    return {
      uid: `${side}-${id}-${index}`,
      id,
      side,
      ...spec,
      x,
      y,
      px: x,
      py: y,
      hp: spec.hp,
      maxHp: spec.hp,
      facing: side ? Math.PI : 0,
      previousFacing: side ? Math.PI : 0,
      vx: 0,
      vy: 0,
      ix: 0,
      iy: 0,
      gait: 0.25,
      travel: 0,
      moving: 0,
      runBlend: 0,
      sprintBlend: 0,
      acceleration: 0,
      sprintRequested: false,
      sprintActive: false,
      sprintExhausted: false,
      moveFacing: side ? Math.PI : 0,
      aimFacing: null,
      action: null,
      actionSerial: 0,
      attackCooldown: 0.25 + index * 0.12,
      stamina: 100,
      poise: 0,
      stagger: 0,
      hitTime: 0,
      roll: null,
      dodgeCooldown: 0.7 + index * 0.1,
      deathTime: 0,
      knockdown: 0,
      getup: 0,
      stopTime: 0,
      turnTime: 0,
      turnCooldown: 0,
      turning: 0,
      target: null,
      manualUntil: 0,
      order: null,
      intention: "ready",
      attackCount: 0,
      chargeRequested: false,
      hits: 0,
      misses: 0,
      damageDealt: 0,
      dodges: 0,
      interrupts: 0,
      lastState: "idle"
    };
  }
  function animationState(u) {
    if (u.hp <= 0) return "death";
    if (u.knockdown > 0) return "knockdown";
    if (u.getup > 0) return "getup";
    if (u.action?.charged) return "charge";
    if (u.stagger > 0) return "stagger";
    if (u.hitTime > 0) return "hit";
    if (u.roll) return u.roll.kind;
    if (u.action) return u.casts ? "cast" : u.action.style === "side" ? "slash" : "attack";
    if (u.stopTime > 0) return "stop";
    if (u.turnTime > 0) return "turn";
    if (u.sprintBlend > 0.35) return "sprint";
    if (u.runBlend > 0.4) return "run";
    if (u.moving > 0.07) return "walk";
    if (u.turning > 0.8) return "turn";
    return "idle";
  }
  function meleeConnects(source, target, angle, reach, arc = 0.68) {
    const dx = target.x - source.x, dy = target.y - source.y, d = Math.hypot(dx, dy);
    return d <= reach + target.radius && d > 0 && (dx * Math.cos(angle) + dy * Math.sin(angle)) / d >= Math.cos(arc + Math.asin(Math.min(0.6, target.radius / d)));
  }
  var PrototypeArena = class {
    constructor(mode2 = "battle", options = {}) {
      this.mode = mode2;
      this.locomotion = "auto";
      this.time = 0;
      this.accumulator = 0;
      this.alpha = 0;
      this.done = false;
      this.winner = null;
      this.units = [];
      this.projectiles = [];
      this.particles = [];
      this.effects = [];
      this.audio = [];
      this.events = [];
      this.shake = 0;
      this.serial = 0;
      this.metrics = { hits: 0, misses: 0, rolls: 0, avoided: 0, interrupts: 0, projectiles: 0, contacts: 0, knockouts: 0, charged: 0, armorResists: 0 };
      this.seed = options.seed ?? Math.floor(Math.random() * 4294967296);
      this.rosters = mode2 === "battle" ? battleRosters(this.seed) : [PROTOTYPE_CHARACTERS.map((s) => s.id)];
      if (mode2 === "battle" && options.seed === void 0) {
        const composition = () => this.rosters.map((ids) => ids.slice().sort().join(",")).join("|");
        while (composition() === previousComposition) {
          this.seed = this.seed + 1 >>> 0;
          this.rosters = battleRosters(this.seed);
        }
        previousComposition = composition();
      }
      for (let side = 0; side < (mode2 === "battle" ? 2 : 1); side++)
        this.rosters[side].forEach((id, i) => {
          const s = PROTOTYPE_BY_ID[id], x = mode2 === "battle" ? (side ? 760 : 240) + Math.floor(i / 3) * (side ? -65 : 65) : circuitCenter(i).x;
          const y = mode2 === "battle" ? 205 + i % 3 * 200 : circuitCenter(i).y;
          const u = makePrototypeUnit(s.id, side, i, x, y);
          if (mode2 === "movement") {
            u.trackPhase = i * 0.4;
            u.x = circuitCenter(i).x + Math.cos(u.trackPhase) * 45;
            u.y = circuitCenter(i).y + Math.sin(u.trackPhase) * 90;
            u.px = u.x;
            u.py = u.y;
            u.facing = Math.atan2(Math.cos(u.trackPhase) * 90, -Math.sin(u.trackPhase) * 45);
            u.previousFacing = u.facing;
            u.moveFacing = u.facing;
          }
          this.units.push(u);
        });
    }
    living(side) {
      return this.units.filter((u) => u.hp > 0 && (side === void 0 || u.side === side));
    }
    setLocomotion(pace) {
      if (!["auto", "walk", "run", "sprint"].includes(pace)) return false;
      this.locomotion = pace;
      for (const u of this.units) {
        u.sprintRequested = false;
        if (pace === "sprint") u.sprintExhausted = u.stamina < 25;
      }
      return true;
    }
    setSprint(uid, on) {
      const u = this.units.find((u2) => u2.uid === uid && u2.hp > 0);
      if (!u || this.done || !["battle", "movement"].includes(this.mode)) return false;
      if (on && u.stamina < 25) return false;
      u.sprintRequested = Boolean(on);
      if (on) u.sprintExhausted = false;
      return true;
    }
    event(type, u, detail = {}) {
      const event = { type, time: this.time, uid: u.uid, id: u.id, ...detail };
      this.events.push(event);
      if (this.events.length > 300) this.events.shift();
      if (["contact", "release", "death"].includes(type)) this.audio.push({ type: type === "contact" ? u.id === "orc" ? "crit" : "hit" : type === "release" ? "skill" : "death", element: u.id === "orc" || u.id === "wolf" ? "ember" : u.id === "elf" ? "grove" : u.id === "caster" ? "storm" : "tide", time: this.time });
    }
    moveOrder(uid, point2) {
      const u = this.units.find((u2) => u2.uid === uid && u2.hp > 0);
      if (!u) return false;
      if (Math.hypot(u.vx, u.vy) > 30 && Math.abs(angleDelta(u.moveFacing, Math.atan2(point2.y - u.y, point2.x - u.x))) > 0.7) {
        u.turnTime = 0.32;
        u.turnCooldown = 0.5;
      }
      u.order = { x: clamp(point2.x, 85, 915), y: clamp(point2.y, 130, 785) };
      u.manualUntil = this.time + 6;
      return true;
    }
    attack(u, target, options = {}) {
      const charged = Boolean(!u?.ranged && (options.charged ?? (u?.chargeRequested || (u?.attackCount + 1) % 3 === 0))), cost = charged ? 28 : 10;
      if (!u || !target || u.hp <= 0 || target.hp <= 0 || u.action || u.roll || u.stagger > 0 || u.knockdown > 0 || u.getup > 0 || u.stamina < cost) return false;
      const angle = Math.atan2(target.y - u.y, target.x - u.x);
      u.aimFacing = angle;
      if (Math.abs(angleDelta(u.facing, angle)) > 0.5) return false;
      u.transitionFoot = { gait: u.gait, moving: u.moving, runBlend: u.runBlend, sprintBlend: u.sprintBlend, time: this.time };
      u.attackCount++;
      u.chargeRequested = false;
      const style = ["knight", "orc"].includes(u.id) && u.attackCount % 2 === 0 ? "side" : "overhead", windup = charged ? Math.max(0.85, u.windup * 2.4) : u.windup, recovery = u.recovery * (charged ? 1.15 : 1), anticipation = charged ? 3 : u.id === "orc" || u.casts || u.id === "mech" ? 2 : 1;
      u.action = { elapsed: 0, windup, duration: windup + recovery, style, charged, anticipation, damage: u.damage * (charged ? 1.7 : 1), angle, aim: { x: target.x, y: target.y }, targetUid: target.uid, targetDodges: target.dodges, released: false, impactHold: 0, hitUids: [], key: ++this.serial };
      u.stamina -= cost;
      u.intention = charged ? "bracing an uninterruptible charged strike" : u.casts ? "channeling" : u.ranged ? "aiming a projectile" : "committed " + style + " strike";
      if (charged) this.metrics.charged++;
      this.event("windup", u, { targetUid: target.uid, angle, style, charged, anticipation });
      return true;
    }
    chargeAttack(u, target) {
      if (!u || !target || u.ranged || u.hp <= 0 || target.hp <= 0 || u.action || u.stamina < 28) return false;
      u.chargeRequested = true;
      u.aimFacing = Math.atan2(target.y - u.y, target.x - u.x);
      if (distance2(u, target) <= u.reach) this.attack(u, target, { charged: true });
      return true;
    }
    roll(u, angle, kind = "dodge") {
      if (!u || u.hp <= 0 || u.action || u.roll || u.stagger > 0 || u.knockdown > 0 || u.getup > 0 || u.stamina < 30 || u.dodgeCooldown > 0) return false;
      u.roll = { elapsed: 0, duration: kind === "dash" ? 0.34 : 0.29, dx: Math.cos(angle), dy: Math.sin(angle), kind };
      u.stamina -= 30;
      u.dodgeCooldown = 2.8;
      u.dodges++;
      this.metrics.rolls++;
      this.event(kind, u);
      return true;
    }
    hit(target, source, damage, kind = "melee", contactHeight = null, contactPoint = null) {
      if (target.hp <= 0) return;
      const dx = target.x - source.x, dy = target.y - source.y, d = Math.hypot(dx, dy) || 1;
      const protectedCharge = Boolean(target.action?.charged), path = kind === "melee" ? weaponContactPath(source.id, 0, { swing: source.action?.style, charged: source.action?.charged }) : null;
      const arc = path ? path.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0) : 0;
      const weaponMass = source.id === "orc" ? 3.4 : source.id === "knight" ? 1.5 : 1;
      const impulse = kind === "spell" ? 65 : kind === "melee" ? clamp(arc / (source.windup * 0.28) * weaponMass * 0.035, 75, 230) : 80;
      const force = impulse / target.mass;
      if (kind === "melee" && source.action) source.action.impactHold = source.id === "orc" ? 0.055 : 0.032;
      if (protectedCharge) {
        target.poise = 0;
        target.hitTime = 0;
        this.metrics.armorResists++;
        this.event("armor", target, { sourceUid: source.uid });
      } else {
        target.ix += dx / d * force;
        target.iy += dy / d * force;
        target.hitTime = 0.13;
        target.poise += damage * (source.id === "orc" ? 1.05 : 0.62);
      }
      if (target.poise > 50 + target.mass * 15) {
        target.poise = 0;
        target.stagger = 0.46;
        if (target.action && !target.action.released) {
          target.action = null;
          target.interrupts++;
          this.metrics.interrupts++;
          this.event("interrupt", target, { sourceUid: source.uid });
        }
        target.roll = null;
      }
      if (!protectedCharge && kind === "melee" && source.mass > 2 && damage >= 45 && target.stagger > 0 && target.hp > damage) {
        target.knockdown = 0.65;
        target.getup = 0;
        target.ragdoll = createRagdoll(target.id, characterRig(target.id, "hit", 0.25), impactImpulse(target));
        target.action = null;
        target.roll = null;
        this.event("knockdown", target, { sourceUid: source.uid });
      }
      target.hp = Math.max(0, target.hp - damage);
      source.hits++;
      source.damageDealt += damage;
      this.metrics.hits++;
      this.event("contact", source, { targetUid: target.uid, damage, kind, point: contactPoint, targetPosition: { x: target.x, y: target.y, radius: target.radius } });
      this.effects.push({ kind: "impact", x: contactPoint?.x ?? target.x, y: contactPoint?.y ?? target.y, z: contactHeight ?? (source.id === "wolf" ? 28 : 52), age: 0, duration: 0.26, color: source.color, heavy: source.id === "orc" });
      this.effects.push({ kind: "number", x: target.x, y: target.y, z: 76, age: 0, duration: 0.8, text: Math.round(damage), color: "#f4e8c9" });
      this.shake = Math.min(3, this.shake + (source.id === "orc" ? 1.7 : 0.45));
      for (let i = 0; i < (source.id === "orc" ? 12 : 5); i++) {
        const a = i * 2.399 + this.serial * 0.17, speed2 = 30 + i % 4 * 24;
        this.particles.push({ x: target.x, y: target.y, z: 30, vx: Math.cos(a) * speed2, vy: Math.sin(a) * speed2, vz: 45 + i % 3 * 20, age: 0, duration: 0.35 + i % 3 * 0.08, color: source.color });
      }
      if (target.hp <= 0) {
        target.action = null;
        target.roll = null;
        target.deathTime = 0;
        target.moving = 0;
        target.lastState = "death";
        this.metrics.knockouts++;
        this.event("death", target, { sourceUid: source.uid });
      }
    }
    swingContact(u, from, to) {
      const a = u.action;
      if (!a || u.ranged || to < 0.72 || from >= 1) return;
      const options = { swing: a.style, charged: a.charged, anticipation: a.anticipation }, before = weaponTipAt(u.id, Math.max(0.72, from), a.angle, options), after = weaponTipAt(u.id, Math.min(1, to), a.angle, options);
      const start = { x: u.x + before.x, y: u.y + before.y }, end = { x: u.x + after.x, y: u.y + after.y }, limit = u.id === "orc" ? 2 : 1;
      for (const target of this.living(1 - u.side)) {
        if (a.hitUids.length >= limit) break;
        if (a.hitUids.includes(target.uid) || !meleeConnects(u, target, a.angle, u.reach, u.id === "orc" ? 0.85 : 0.65)) continue;
        const fraction = sweepCircle(start, end, target, target.radius + (u.id === "orc" ? 8 : 4));
        if (fraction === null) continue;
        const contact = { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction, z: before.z + (after.z - before.z) * fraction };
        a.hitUids.push(target.uid);
        this.hit(target, u, a.damage, "melee", contact.z, contact);
      }
    }
    release(u) {
      const a = u.action;
      if (!a || a.released) return;
      a.released = true;
      if (u.ranged) {
        const rig = characterRig(u.id, u.casts ? "cast" : "attack", 1, "windup"), hand = ["elf", "fox"].includes(u.id) ? rig.weapon.grip : rig.weapon.tip;
        const sx = u.x + hand.x * Math.cos(a.angle) - hand.y * Math.sin(a.angle), sy = u.y + hand.x * Math.sin(a.angle) + hand.y * Math.cos(a.angle);
        const dx = a.aim.x - sx, dy = a.aim.y - sy, d = Math.hypot(dx, dy) || 1, speed2 = ["elf", "fox"].includes(u.id) ? 560 : 360;
        this.projectiles.push({ key: ++this.serial, x: sx, y: sy, px: sx, py: sy, vx: dx / d * speed2, vy: dy / d * speed2, source: u, damage: u.damage, z: hand.z, originZ: hand.z, kind: ["elf", "fox"].includes(u.id) ? "arrow" : "spell", age: 0, ttl: 2.5, targetUid: a.targetUid, targetDodges: a.targetDodges, passTime: d / speed2 });
        this.metrics.projectiles++;
        this.event("release", u, { actionKey: a.key, kind: ["elf", "fox"].includes(u.id) ? "arrow" : "spell" });
      } else {
        if (!a.hitUids.length) {
          this.metrics.misses++;
          u.misses++;
          this.event("miss", u, { actionKey: a.key });
          const target = this.units.find((t) => t.uid === a.targetUid);
          if (target && target.dodges > a.targetDodges) {
            this.metrics.avoided++;
            this.event("evade", target, { sourceUid: u.uid });
          }
        }
      }
    }
    threat(u) {
      const candidates = [];
      for (const e of this.living(1 - u.side)) if (e.action && !e.action.released && !e.ranged) {
        if (e.action.hitUids.includes(u.uid) || e.action.hitUids.length >= (e.id === "orc" ? 2 : 1)) continue;
        const left = e.action.windup - e.action.elapsed;
        if (left > 0.04 && left < 0.19 && meleeConnects(e, u, e.action.angle, e.reach + 8)) candidates.push({ angle: e.action.angle + Math.PI / 2, deadline: left, key: e.action.key, source: e });
      }
      for (const p of this.projectiles) if (p.source.side !== u.side) {
        const t = sweepCircle(p, { x: p.x + p.vx * 0.2, y: p.y + p.vy * 0.2 }, u, u.radius + 4);
        if (t !== null) candidates.push({ angle: Math.atan2(p.vy, p.vx) + Math.PI / 2, deadline: t * 0.2, key: p.key, source: p.source });
      }
      return candidates.sort((a, b) => a.deadline - b.deadline)[0] || null;
    }
    target(u) {
      return this.living(1 - u.side).sort((a, b) => {
        const sa = distance2(u, a) + (u.id === "wolf" && ["elf", "caster"].includes(a.id) ? -85 : 0);
        const sb = distance2(u, b) + (u.id === "wolf" && ["elf", "caster"].includes(b.id) ? -85 : 0);
        return sa - sb;
      })[0];
    }
    confine(u) {
      u.x = clamp(u.x, ARENA_LIMITS.left + u.radius, ARENA_LIMITS.right - u.radius);
      u.y = clamp(u.y, ARENA_LIMITS.top + u.radius, ARENA_LIMITS.bottom - u.radius);
    }
    separate() {
      const units = this.living();
      for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
        const a = units[i], b = units[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), gap = a.radius + b.radius;
        if (d >= gap) continue;
        const nx = d > 1e-3 ? dx / d : 1, ny = d > 1e-3 ? dy / d : 0, wa = 1 / a.mass, wb = 1 / b.mass, p = gap - d;
        a.x -= nx * p * wa / (wa + wb);
        a.y -= ny * p * wa / (wa + wb);
        b.x += nx * p * wb / (wa + wb);
        b.y += ny * p * wb / (wa + wb);
        this.metrics.contacts++;
        this.confine(a);
        this.confine(b);
      }
    }
    advance(dt) {
      this.time += dt;
      this.shake = Math.max(0, this.shake - dt * 12);
      for (const e of this.effects) e.age += dt;
      this.effects = this.effects.filter((e) => e.age < e.duration);
      for (const p of this.particles) {
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vz -= 210 * dt;
      }
      this.particles = this.particles.filter((p) => p.age < p.duration);
      for (const u of this.units) {
        u.px = u.x;
        u.py = u.y;
        u.previousFacing = u.facing;
        stepCape(u, dt);
        u.stopTime = Math.max(0, u.stopTime - dt);
        u.turnTime = Math.max(0, u.turnTime - dt);
        u.turnCooldown = Math.max(0, u.turnCooldown - dt);
        if (u.hp <= 0) {
          u.deathTime += dt;
          if (!u.ragdoll) u.ragdoll = createRagdoll(u.id, characterRig(u.id, "idle", u.gait % 1), impactImpulse(u));
          stepRagdoll(u.ragdoll, dt);
          u.x += u.ix * dt;
          u.y += u.iy * dt;
          u.ix *= Math.exp(-6 * dt);
          u.iy *= Math.exp(-6 * dt);
          this.confine(u);
          continue;
        }
        u.hitTime = Math.max(0, u.hitTime - dt);
        u.stagger = Math.max(0, u.stagger - dt);
        u.dodgeCooldown = Math.max(0, u.dodgeCooldown - dt);
        if (u.knockdown > 0) {
          u.knockdown = Math.max(0, u.knockdown - dt);
          stepRagdoll(u.ragdoll, dt);
          u.vx = 0;
          u.vy = 0;
          if (!u.knockdown) u.getup = 0.45;
          continue;
        }
        if (u.getup > 0) {
          u.getup = Math.max(0, u.getup - dt);
          if (!u.getup) u.ragdoll = null;
          continue;
        }
        u.attackCooldown -= dt;
        u.poise = Math.max(0, u.poise - dt * 10);
        if (this.done) {
          u.moving *= Math.exp(-8 * dt);
          continue;
        }
        if (u.action) {
          const action = u.action, previous = action.elapsed;
          if (action.impactHold > 0) action.impactHold = Math.max(0, action.impactHold - dt);
          else action.elapsed += dt;
          if (action.elapsed > previous) this.swingContact(u, previous / action.windup, action.elapsed / action.windup);
          const aim = angleDelta(u.facing, u.action.angle);
          u.facing += clamp(aim, -dt * 7, dt * 7);
          if (u.action.elapsed >= u.action.windup) this.release(u);
          if (u.action.elapsed >= u.action.duration) {
            u.action = null;
            u.attackCooldown = u.cooldown;
            u.transitionFoot = { gait: u.gait, moving: 0, time: this.time };
          }
        }
        let desiredX = 0, desiredY = 0, running = false;
        if (this.mode === "movement") {
          const derivative = Math.hypot(Math.sin(u.trackPhase) * 45, Math.cos(u.trackPhase) * 90);
          u.trackPhase += Math.hypot(u.vx, u.vy) * dt / (derivative || 1);
          const angle = u.trackPhase;
          const goal = { x: circuitCenter(u.row).x + Math.cos(angle) * 45, y: circuitCenter(u.row).y + Math.sin(angle) * 90 };
          const tx2 = -Math.sin(angle) * 45 / (derivative || 1) + (goal.x - u.x) * 0.024, ty2 = Math.cos(angle) * 90 / (derivative || 1) + (goal.y - u.y) * 0.024, normal = Math.max(1, Math.hypot(tx2, ty2));
          desiredX = tx2 / normal;
          desiredY = ty2 / normal;
          running = this.locomotion === "run" || this.locomotion === "sprint" || this.locomotion === "auto" && Math.sin(this.time * 0.7) > 0.2;
          u.intention = running ? "running circuit" : "walking circuit";
          if (u.order && this.time < u.manualUntil) {
            const d = distance2(u, u.order), arrival = Math.min(1, d / 45);
            desiredX = d > 3 ? (u.order.x - u.x) / (d || 1) * arrival : 0;
            desiredY = d > 3 ? (u.order.y - u.y) / (d || 1) * arrival : 0;
            u.intention = "following your order";
          }
        } else if (this.mode === "battle") {
          const target = this.target(u);
          u.target = target?.uid || null;
          if (target) {
            const dist = distance2(u, target);
            let goal = target;
            if (u.order && this.time < u.manualUntil) {
              goal = u.order;
              u.intention = "following your order";
            } else if (u.ranged && dist < 135) {
              goal = { x: u.x + (u.x - target.x) * 2, y: u.y + (u.y - target.y) * 2 };
              u.intention = "creating distance";
            } else u.intention = dist > u.reach ? "closing distance" : "ready to strike";
            const dg = distance2(u, goal);
            if (goal !== target && dg > 7 || goal === target && dist > u.reach * 0.87) {
              const arrival = goal !== target ? Math.min(1, dg / 45) : 1;
              desiredX = (goal.x - u.x) / (dg || 1) * arrival;
              desiredY = (goal.y - u.y) / (dg || 1) * arrival;
              running = goal === target && dist > 170;
            }
            if (goal === target) u.aimFacing = Math.atan2(target.y - u.y, target.x - u.x);
            if (goal === target && dist <= u.reach && u.attackCooldown <= 0 && !u.action) this.attack(u, target);
            if (!u.action && !u.roll) {
              const threat = this.threat(u);
              if (threat) {
                const sign = u.y < 455 ? -1 : 1;
                if (this.roll(u, threat.angle + (sign < 0 ? Math.PI : 0))) {
                  u.intention = "escaping an aimed attack";
                  u.lastThreat = threat.key;
                }
              }
            }
          }
        }
        const busy = u.action || u.roll || u.stagger > 0;
        if (busy) {
          desiredX = 0;
          desiredY = 0;
        }
        const wantsSprint = u.sprintRequested || this.mode === "movement" && this.locomotion === "sprint";
        if (u.stamina <= 8 && wantsSprint) u.sprintExhausted = true;
        u.sprintActive = Boolean(wantsSprint && !u.sprintExhausted && !busy && Math.hypot(desiredX, desiredY) > 0.1);
        if (wantsSprint && u.sprintExhausted) running = false;
        if (u.sprintActive) u.intention = "sprinting";
        else if (wantsSprint && u.sprintExhausted) u.intention = "catching breath";
        u.stamina = clamp(u.stamina + dt * (busy ? 8 : u.sprintActive ? -20 : u.moving > 0.1 ? 15 : 22), 0, 100);
        if (!busy && (Math.hypot(desiredX, desiredY) > 0.1 || u.aimFacing !== null)) {
          const steering = Math.hypot(desiredX, desiredY) > 0.1;
          const a = steering ? Math.hypot(u.vx, u.vy) > 20 ? Math.atan2(u.vy, u.vx) : Math.atan2(desiredY, desiredX) : u.aimFacing, change = angleDelta(u.facing, a);
          u.facing += clamp(change, -dt * (u.mass > 2 ? 5 : 7.5), dt * (u.mass > 2 ? 5 : 7.5));
          u.turning = Math.abs(change);
        } else u.turning *= Math.exp(-10 * dt);
        const targetSpeed = u.sprintActive ? u.sprint : running ? u.run : u.speed;
        const previousSpeed = Math.hypot(u.vx, u.vy), turn = previousSpeed > 8 && Math.hypot(desiredX, desiredY) > 0.1 ? Math.abs(angleDelta(Math.atan2(u.vy, u.vx), Math.atan2(desiredY, desiredX))) : 0;
        const cornerSpeed = 1 - (u.sprintActive ? 0.48 : 0.25) * Math.sin(Math.min(Math.PI / 2, turn));
        const accelerationLimit = (u.mass > 2 ? 260 : 390) * (u.sprintActive ? 0.85 : 1), brakingLimit = u.mass > 2 ? 400 : 600;
        const tx = desiredX * targetSpeed * cornerSpeed, ty = desiredY * targetSpeed * cornerSpeed, deltaX = tx - u.vx, deltaY = ty - u.vy, deltaSpeed = Math.hypot(deltaX, deltaY);
        const limit = (Math.hypot(tx, ty) < previousSpeed ? brakingLimit : accelerationLimit) * dt, blend = Math.min(1, limit / (deltaSpeed || 1));
        u.vx += deltaX * blend;
        u.vy += deltaY * blend;
        const actualSpeed = Math.hypot(u.vx, u.vy);
        if (!busy && previousSpeed > 35 && Math.hypot(tx, ty) < previousSpeed * 0.55) u.stopTime = 0.24;
        if (!busy && turn > 0.9 && u.turnCooldown <= 0) {
          u.turnTime = 0.28;
          u.turnCooldown = 0.6;
        }
        u.acceleration += (clamp((actualSpeed - previousSpeed) / (dt * accelerationLimit), -1, 1) - u.acceleration) * Math.min(1, dt * 10);
        const gaitBlend = 1 - Math.exp(-dt * 10);
        u.runBlend += (clamp((actualSpeed - u.speed) / (u.run - u.speed), 0, 1) - u.runBlend) * gaitBlend;
        u.sprintBlend += (clamp((actualSpeed - u.run) / (u.sprint - u.run), 0, 1) - u.sprintBlend) * gaitBlend;
        if (u.roll) {
          const roll = u.roll;
          roll.elapsed += dt;
          const p = roll.elapsed / roll.duration, speed3 = (roll.kind === "dash" ? 480 : 440) * (0.62 + 0.38 * Math.sin(Math.PI * clamp(p, 0, 1))) * (u.mass > 2 ? 0.84 : 1);
          u.x += roll.dx * speed3 * dt;
          u.y += roll.dy * speed3 * dt;
          if (roll.elapsed >= roll.duration) {
            u.roll = null;
            u.vx = 0;
            u.vy = 0;
          }
        } else if (!u.action && u.stagger <= 0) {
          const move = Math.hypot(u.vx, u.vy) * dt;
          u.x += u.vx * dt;
          u.y += u.vy * dt;
          u.travel += move;
          u.gait += move / locomotionStride(u.stride, u.runBlend, u.sprintBlend, u.id);
        }
        const speed2 = Math.hypot(u.vx, u.vy);
        if (speed2 > 3) u.moveFacing = Math.atan2(u.vy, u.vx);
        u.moving += (busy ? 0 : clamp(speed2 / u.run, 0, 1) - u.moving) * (1 - Math.exp(-dt * 12));
        if (busy) u.moving *= Math.exp(-12 * dt);
        u.x += u.ix * dt;
        u.y += u.iy * dt;
        u.ix *= Math.exp(-5 * dt);
        u.iy *= Math.exp(-5 * dt);
        this.confine(u);
        u.lastState = animationState(u);
      }
      if (!this.done) this.separate();
      for (const u of this.units) plantFeet(u, dt);
      for (const p of this.projectiles) {
        p.age += dt;
        p.ttl -= dt;
        p.z = p.originZ + (52 - p.originZ) * clamp(p.age / p.passTime, 0, 1);
        const start = { x: p.x, y: p.y }, end = { x: p.x + p.vx * dt, y: p.y + p.vy * dt };
        let hit = null, t = Infinity;
        for (const target of this.living(1 - p.source.side)) {
          const fraction = sweepCircle({ x: start.x - target.px, y: start.y - target.py }, { x: end.x - target.x, y: end.y - target.y }, { x: 0, y: 0 }, target.radius + (p.kind === "spell" ? 8 : 3));
          if (fraction !== null && fraction < t) {
            t = fraction;
            hit = target;
          }
        }
        p.px = p.x;
        p.py = p.y;
        p.x = end.x;
        p.y = end.y;
        if (hit) {
          this.hit(hit, p.source, p.damage, p.kind === "spell" ? "spell" : "arrow", p.z);
          p.ttl = 0;
        }
        if (!hit && !p.avoidChecked && p.age >= p.passTime + 0.08) {
          p.avoidChecked = true;
          const target = this.units.find((u) => u.uid === p.targetUid);
          if (target?.hp > 0 && target.dodges > p.targetDodges && target.lastThreat === p.key) {
            this.metrics.avoided++;
            this.event("evade", target, { sourceUid: p.source.uid });
          }
        }
        if (p.ttl <= 0 && !hit) {
          p.source.misses++;
          this.metrics.misses++;
          this.event("miss", p.source, { kind: p.kind });
        }
      }
      this.projectiles = this.projectiles.filter((p) => p.ttl > 0);
      if (this.mode === "battle" && !this.done && (!this.living(0).length || !this.living(1).length)) {
        this.done = true;
        this.winner = this.living(0).length ? 0 : 1;
        this.projectiles = [];
        for (const u of this.living()) {
          u.action = null;
          u.roll = null;
          u.vx = 0;
          u.vy = 0;
        }
        this.event("finished", this.units[0]);
      }
    }
    step(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      this.accumulator += Math.min(dt, 0.1);
      while (this.accumulator + 1e-9 >= 1 / 120) {
        this.advance(1 / 120);
        this.accumulator = Math.max(0, this.accumulator - 1 / 120);
      }
      this.alpha = this.accumulator * 120;
    }
  };

  // pixel-face-tools.js
  var FACE_OUTLINE = "#192328";
  function faceShape(b, x, y, rx, ry, p, sign = 0, back = false) {
    const O2 = FACE_OUTLINE;
    b.outlined([{ x: x - rx, y: y - 3 }, { x: x - rx + 2, y: y - ry }, { x: x + rx - 2, y: y - ry }, { x: x + rx, y: y - 3 }, { x: x + rx, y: y + 3 }, { x: x + rx - 3, y: y + ry }, { x: x - rx + 3, y: y + ry }, { x: x - rx, y: y + 3 }], p.skin[0]);
    b.poly([{ x: x - rx + 1, y: y - 3 }, { x: x - rx + 3, y: y - ry + 1 }, { x: x + rx - 2, y: y - ry + 1 }, { x: x + rx - 1, y: y - 2 }, { x: x + rx - 1, y: y + 2 }, { x: x + rx - 3, y: y + ry - 1 }, { x: x - rx + 3, y: y + ry - 1 }, { x: x - rx + 1, y: y + 2 }], p.skin[1]);
    b.poly([{ x: x - rx + 2, y: y - 3 }, { x: x - rx + 3, y: y - ry + 2 }, { x: x + 1, y: y - ry + 1 }, { x: x + 3, y: y - 3 }, { x: x + 1, y: y - 1 }, { x: x - rx + 2, y: y - 1 }], p.skin[2]);
    b.line({ x: x + rx - 1, y }, { x: x + rx - 2, y: y + 4 }, p.skin[0]);
    if (!back) b.line({ x: x - 2 + sign, y: y + ry - 1 }, { x: x + 2 + sign, y: y + ry - 1 }, p.skin[0]);
  }
  function faceEyes(b, x, y, v, color, p, state, death) {
    if (!v.eyes.length) return;
    for (const [i, dx] of v.eyes.entries()) {
      const far = v.view === "quarter" && i === (v.sign > 0 ? 0 : 1), xx = x + dx;
      if (death > 0 || ["hit", "stagger"].includes(state)) {
        b.rect(xx - 1, y, far ? 1 : 2, 1, FACE_OUTLINE);
        continue;
      }
      b.rect(xx - 1, y - 1, far ? 1 : 2, 3, FACE_OUTLINE);
      if (!far) {
        b.dot(xx - 1, y - 1, p.metal[3]);
        b.dot(xx, y, color);
      }
    }
  }
  function hairShape(b, x, y, v, p, { long = false, silver = false } = {}) {
    const back = !v.eyes.length, s = v.sign, rx = v.view === "profile" ? 6 : 7;
    if (back) {
      b.outlined([{ x: x - rx, y: y - 3 }, { x: x - rx + 2, y: y - 7 }, { x: x - 2, y: y - 9 }, { x: x + 3, y: y - 8 }, { x: x + rx, y: y - 4 }, { x: x + rx, y: y + 4 }, { x: x + rx - 2, y: y + 6 }, { x: x - 4, y: y + 6 }, { x: x - rx, y: y + 3 }], p.hair[0]);
      b.poly([{ x: x - rx + 1, y: y - 3 }, { x: x - rx + 3, y: y - 6 }, { x: x + 2, y: y - 7 }, { x: x + rx - 1, y: y - 3 }, { x: x + rx - 1, y: y + 3 }, { x: x + 3, y: y + 5 }, { x: x - rx + 2, y: y + 3 }], p.hair[1]);
      b.poly([{ x: x - rx + 2, y: y - 3 }, { x: x - rx + 3, y: y - 5 }, { x: x + 1, y: y - 6 }, { x: x + 3, y: y - 4 }, { x, y: y - 3 }], p.hair[2]);
      b.line({ x: x + 3 + s, y: y + 1 }, { x: x + 2 + s, y: y + 4 }, p.hair[0]);
    } else {
      b.outlined([{ x: x - rx, y }, { x: x - rx, y: y - 4 }, { x: x - 3, y: y - 8 }, { x: x + 2, y: y - 8 }, { x: x + rx, y: y - 5 }, { x: x + rx, y: y - 1 }, { x: x + 4 - s, y: y - 3 }, { x: x + 1 - s, y: y - 2 }, { x: x - 2, y: y - 3 }, { x: x - 4, y: y - 1 }], p.hair[0]);
      b.poly([{ x: x - rx + 1, y: y - 1 }, { x: x - rx + 1, y: y - 4 }, { x: x - 3, y: y - 7 }, { x: x + 2, y: y - 7 }, { x: x + rx - 1, y: y - 4 }, { x: x + rx - 1, y: y - 2 }, { x: x + 3 - s, y: y - 4 }, { x: x - s, y: y - 3 }, { x: x - 2, y: y - 4 }, { x: x - 4, y: y - 2 }], p.hair[1]);
      b.poly([{ x: x - 5, y: y - 4 }, { x: x - 3, y: y - 6 }, { x, y: y - 6 }, { x: x + 2, y: y - 5 }, { x: x - 1, y: y - 4 }], p.hair[2]);
      const sides = v.view === "profile" ? [-s * 5] : [-6, 6];
      for (const dx of sides) {
        b.rect(x + dx - 1, y - 1, 2, long ? 7 : 5, p.hair[0]);
        b.rect(x + dx - 1, y, 1, long ? 5 : 3, p.hair[silver ? 2 : 1]);
      }
    }
  }

  // native-faces.js
  function drawFamilyFace(b, h, dir, p, rig, views) {
    let id = ["leviathan", "stormwyrm", "nightdragon"].includes(rig.grand?.motif) ? "drake" : rig.grand?.motif === "lich" ? "skeleton" : rig.design;
    if (!["dwarf", "goblin", "skeleton", "troll", "minotaur", "serpent", "harpy", "faerie", "bat", "rogue", "frostelf", "phoenix", "crab", "beetle", "centipede", "lion", "bear", "stag", "drake", "moth"].includes(id)) return false;
    const v = views[dir], x = Math.round(h.x), y = Math.round(h.y), back = !v.eyes.length, sign = v.sign, profile = v.view === "profile", dead = rig.death > 0, O2 = "#192328";
    const oval = (x2, y2, rx, ry, c2) => {
      b.oval(x2, y2, rx + 1, ry + 1, O2);
      b.oval(x2, y2, rx, ry, c2);
    };
    const eyes = (color) => faceEyes(b, x, y, v, color, p, rig.state, rig.death);
    const horns = (r = 9) => {
      for (const s of profile ? [-sign] : [-1, 1]) {
        b.line({ x: x + s * 5, y: y - 4 }, { x: x + s * r, y: y - 8 }, O2, 1);
        b.line({ x: x + s * 5, y: y - 4 }, { x: x + s * r, y: y - 8 }, p.metal[2]);
        b.dot(x + s * r, y - 9, p.metal[3]);
      }
    };
    const skin = id === "skeleton" ? p.skin[2] : p.skin[1];
    if (["crab", "beetle", "centipede"].includes(id)) {
      oval(x, y, 5, 4, p.skin[0]);
      b.oval(x - 1, y - 1, 4, 3, p.skin[1]);
      if (!back) {
        for (const dx of profile ? [sign * 3] : [-3, 3]) {
          b.rect(x + dx, y - 1, 2, 2, p.metal[3]);
          b.dot(x + dx, y + 1, O2);
        }
        b.line({ x: x - 2, y: y + 3 }, { x: x + 2, y: y + 3 }, p.skin[2]);
      }
      for (const side of [-1, 1]) b.line({ x: x + side * 3, y: y - 3 }, { x: x + side * 6, y: y - 8 }, p.hair[2]);
      return true;
    }
    if (["lion", "bear", "stag", "drake"].includes(id)) {
      if (id === "lion") {
        b.oval(x, y, 8, 7, p.hair[0]);
        for (const s of [-1, 1]) b.oval(x + s * 6, y + 2, 2, 4, p.hair[1]);
      }
      oval(x, y, 6, 5, skin);
      b.oval(x - 1, y - 2, 3, 2, p.skin[2]);
      for (const s of profile ? [-sign] : [-1, 1]) oval(x + s * 5, y - 5, 2, 2, p.skin[0]);
      if (!back) {
        eyes("#f2da98");
        oval(x + sign * 3, y + 3, profile ? 3 : 4, 2, p.metal[2]);
        b.dot(x + sign * 4, y + 2, O2);
      }
      if (id === "stag" || id === "drake") horns(id === "stag" ? 11 : 9);
      return true;
    }
    if (id === "moth") {
      oval(x, y, 4, 5, skin);
      if (!back) eyes("#fff1c7");
      for (const s of [-1, 1]) b.line({ x: x + s * 2, y: y - 4 }, { x: x + s * 6, y: y - 10 }, p.hair[1], 1);
      return true;
    }
    if (["serpent", "phoenix", "bat"].includes(id)) {
      oval(x, y, 6, 5, skin);
      b.oval(x - 2, y - 2, 3, 2, p.skin[2]);
    } else faceShape(b, x, y, id === "troll" || id === "minotaur" ? 8 : 6, 7, p, sign, back);
    if (id === "skeleton") {
      if (!back) {
        for (const dx of v.eyes) b.rect(x + dx - 1, y - 1, 2, 3, O2);
        b.dot(x + sign * 2, y + 2, O2);
        b.rect(x - 3 + sign * 2, y + 4, 6, 1, O2);
        for (const dx of [-2, 0, 2]) b.dot(x + dx + sign * 2, y + 5, p.skin[0]);
      } else b.line({ x: x - 3, y: y + 2 }, { x: x + 2, y: y - 1 }, p.skin[0]);
    } else if (id === "serpent" || id === "phoenix") {
      if (!back) {
        const nx = x + (profile ? sign * 6 : sign * 3);
        b.outlined([{ x: nx - sign, y: y + 1 }, { x: nx + (sign || 1) * 5, y: y + 2 }, { x: nx, y: y + 4 }], id === "phoenix" ? p.metal[3] : p.skin[0]);
        eyes(id === "phoenix" ? "#fff3b9" : "#f3d579");
      }
      b.line({ x: x - 3, y: y - 4 }, { x, y: y - 8 }, p.hair[1], 1);
      b.line({ x, y: y - 8 }, { x: x + 3, y: y - 5 }, p.hair[2]);
    } else if (id === "bat") {
      for (const s of profile ? [-sign] : [-1, 1]) b.outlined([{ x: x + s * 4, y: y - 3 }, { x: x + s * 7, y: y - 12 }, { x: x + s * 1, y: y - 6 }], p.skin[0]);
      if (!back) {
        eyes("#e7bd7b");
        oval(x + sign * 3, y + 3, 3, 2, p.skin[0]);
        for (const dx of [-2, 2]) b.dot(x + dx + sign * 2, y + 5, p.metal[3]);
      }
    } else {
      if (["goblin", "faerie", "frostelf"].includes(id)) for (const s of profile ? [-sign] : [-1, 1]) b.outlined([{ x: x + s * 5, y: y - 1 }, { x: x + s * (id === "goblin" ? 12 : 9), y: y - 3 }, { x: x + s * 6, y: y + 3 }], p.skin[1]);
      if (id === "minotaur") horns(10);
      if (id === "rogue") {
        b.outlined([{ x: x - 7, y: y + 3 }, { x: x - 7, y: y - 4 }, { x: x - 3, y: y - 8 }, { x: x + 3, y: y - 8 }, { x: x + 7, y: y - 4 }, { x: x + 7, y: y + 3 }, { x: x + 4, y: y + 5 }, { x: x + 4, y: y - 2 }, { x: x - 4, y: y - 2 }, { x: x - 4, y: y + 5 }], p.cloth[0]);
      } else if (id === "dwarf") {
        b.rect(x - 6, y - 6, 12, 3, p.metal[1]);
        b.rect(x - 4, y - 7, 8, 1, p.metal[3]);
      } else if (id === "troll") {
        b.oval(x, y - 7, 5, 2, p.hair[1]);
        b.dot(x - 4, y - 8, p.hair[2]);
      } else hairShape(b, x, y, v, p, { silver: id === "frostelf" });
      if (back) {
        if (["rogue", "dwarf"].includes(id)) b.oval(x, y + 1, 4, 5, id === "rogue" ? p.cloth[0] : p.hair[0]);
      } else {
        eyes(id === "goblin" ? "#f1d77e" : id === "frostelf" ? "#80d1dc" : "#ddcda6");
        b.dot(x + (profile ? sign * 5 : sign * 2), y + 3, p.skin[0]);
        b.rect(x - 1 + sign * 2, y + 5, 3, 1, p.skin[0]);
      }
      if (id === "dwarf") {
        b.outlined([{ x: x - 5, y: y + 2 }, { x: x - 2, y: y + 4 }, { x: x + 2, y: y + 4 }, { x: x + 5, y: y + 2 }, { x: x + 4, y: y + 8 }, { x, y: y + 11 }, { x: x - 4, y: y + 8 }], p.hair[1]);
        b.line({ x: x - 2, y: y + 5 }, { x: x - 1, y: y + 9 }, p.hair[2]);
        b.line({ x: x + 2, y: y + 5 }, { x: x + 1, y: y + 9 }, p.hair[0]);
        b.dot(x, y + 9, p.metal[3]);
      }
      if (id === "minotaur" && !back) {
        oval(x + sign * 2, y + 3, 4, 2, p.skin[0]);
        b.dot(x - 1 + sign * 2, y + 3, O2);
        b.dot(x + 2 + sign * 2, y + 3, O2);
      }
      if (id === "harpy") b.line({ x, y: y - 7 }, { x: x - sign * 3, y: y - 11 }, p.hair[2], 1);
    }
    if (rig.form) {
      if (rig.formPath === "wild") {
        horns(rig.form === 2 ? 11 : 8);
        b.dot(x, y - 9, p.cloth[2]);
      } else {
        b.line({ x: x - 5, y: y - 5 }, { x: x + 5, y: y - 5 }, p.metal[2]);
        b.dot(x, y - 6, p.metal[3]);
      }
    }
    return true;
  }

  // prototype-faces.js
  var FACE_VIEWS = [
    { view: "profile", sign: 1, eyes: [4], nose: 7 },
    { view: "quarter", sign: 1, eyes: [0, 5], nose: 5 },
    { view: "front", sign: 0, eyes: [-3, 3], nose: 0 },
    { view: "quarter", sign: -1, eyes: [-5, 0], nose: -5 },
    { view: "profile", sign: -1, eyes: [-4], nose: -7 },
    { view: "rear-quarter", sign: -1, eyes: [], nose: 0 },
    { view: "back", sign: 0, eyes: [], nose: 0 },
    { view: "rear-quarter", sign: 1, eyes: [], nose: 0 }
  ];
  function drawNativeFace(b, id, center, dir, p, rig) {
    if (drawFamilyFace(b, center, dir, p, rig, FACE_VIEWS)) return;
    const x = Math.round(center.x), y = Math.round(center.y), v = FACE_VIEWS[dir], back = !v.eyes.length, profile = v.view === "profile", quarter = v.view === "quarter", s = v.sign, dead = rig.death > 0;
    const oval = (x2, y2, rx2, ry, c2) => {
      b.oval(x2, y2, rx2 + 1, ry + 1, FACE_OUTLINE);
      b.oval(x2, y2, rx2, ry, c2);
    }, eyes = (color) => faceEyes(b, x, y, v, color, p, rig.state, rig.death);
    if (id === "knight") {
      const rx2 = profile ? 6 : 7;
      b.outlined([{ x: x - rx2, y: y - 3 }, { x: x - rx2 + 1, y: y - 6 }, { x: x - 3, y: y - 8 }, { x: x + 2, y: y - 8 }, { x: x + rx2, y: y - 5 }, { x: x + rx2, y: y + 4 }, { x: x + rx2 - 2, y: y + 7 }, { x: x - rx2 + 2, y: y + 7 }, { x: x - rx2, y: y + 4 }], p.metal[0]);
      b.poly([{ x: x - rx2 + 1, y: y - 3 }, { x: x - rx2 + 2, y: y - 5 }, { x: x - 3, y: y - 7 }, { x: x + 2, y: y - 7 }, { x: x + rx2 - 1, y: y - 4 }, { x: x + rx2 - 1, y: y + 3 }, { x: x + 3, y: y + 5 }, { x: x - rx2 + 1, y: y + 3 }], p.metal[1]);
      b.poly([{ x: x - rx2 + 2, y: y - 4 }, { x: x - 3, y: y - 6 }, { x, y: y - 6 }, { x: x + 2, y: y - 3 }, { x: x - 1, y: y - 2 }, { x: x - rx2 + 2, y: y - 2 }], p.metal[2]);
      b.line({ x: x - rx2 + 3, y: y - 5 }, { x, y: y - 6 }, p.metal[3]);
      if (back) {
        b.line({ x: x + s * 2, y: y - 5 }, { x: x + s * 2, y: y + 3 }, p.metal[0]);
        b.rect(x - 3, y + 4, 6, 2, p.metal[0]);
        b.rect(x - 2, y + 4, 4, 1, p.metal[1]);
        for (const dx of [-5, 5]) b.dot(x + dx, y + 1, p.metal[2]);
      } else {
        const faceX = x + (profile ? s * 3 : quarter ? s : 0), w = profile ? 5 : quarter ? 9 : 11;
        b.rect(faceX - Math.floor(w / 2), y - 1, w, 3, FACE_OUTLINE);
        for (const dx of v.eyes) {
          b.dot(x + dx, y, p.metal[3]);
          if (!profile) b.dot(x + dx, y + 1, p.skin[0]);
        }
        b.rect(faceX - (profile ? 1 : 3), y + 2, profile ? 3 : 6, 2, p.skin[0]);
        b.line({ x: faceX - 1, y: y + 2 }, { x: faceX + 1, y: y + 2 }, p.skin[1]);
        b.line({ x: x + (profile ? s * 6 : quarter ? s * 4 : 0), y: y - 2 }, { x: x + (profile ? s * 6 : quarter ? s * 4 : 0), y: y + 4 }, p.metal[2]);
        b.line({ x: x - rx2 + 1, y: y + 5 }, { x: x + rx2 - 1, y: y + 5 }, p.metal[0]);
        b.dot(x - rx2 + 2, y + 5, p.metal[2]);
      }
      const wave = Math.round(Math.sin(rig.phase * Math.PI * 2) * (["run", "sprint"].includes(rig.state) ? 1 : 0));
      b.outlined([{ x: x - 1, y: y - 7 }, { x: x - 1, y: y - 10 }, { x: x + 1 + wave, y: y - 13 }, { x: x + 4 + wave, y: y - 14 }, { x: x + 5 + wave, y: y - 11 }, { x: x + 3, y: y - 10 }, { x: x + 2, y: y - 7 }], p.hair[0]);
      b.poly([{ x, y: y - 8 }, { x, y: y - 10 }, { x: x + 2 + wave, y: y - 12 }, { x: x + 4 + wave, y: y - 13 }, { x: x + 4 + wave, y: y - 11 }, { x: x + 2, y: y - 9 }], p.hair[1]);
      b.line({ x: x + 1, y: y - 10 }, { x: x + 3 + wave, y: y - 12 }, p.hair[2]);
      return;
    }
    if (id === "orc") {
      faceShape(b, x, y, profile ? 7 : 9, 7, p, s, back);
      for (const side of profile ? [-s] : [-1, 1]) {
        b.outlined([{ x: x + side * 8, y: y - 2 }, { x: x + side * 11, y: y - 2 }, { x: x + side * 9, y: y + 1 }, { x: x + side * 7, y: y + 2 }], p.skin[0]);
        b.dot(x + side * 9, y - 1, p.skin[1]);
      }
      b.rect(x - 2, y - 10, 4, 3, p.hair[0]);
      b.rect(x - 1, y - 9, 2, 2, p.hair[1]);
      if (back) {
        b.line({ x: x - 4, y: y + 4 }, { x: x + 4, y: y + 4 }, p.skin[0]);
        b.rect(x - 1, y + 5, 2, 2, p.skin[1]);
        return;
      }
      eyes("#dcca77");
      for (const dx of v.eyes) b.line({ x: x + dx - 2, y: y - 3 }, { x: x + dx + 1, y: y - 2 }, p.skin[0]);
      const mx = x + (profile ? s * 5 : quarter ? s * 2 : 0);
      b.rect(mx - 2, y + 4, 5, 2, p.skin[0]);
      b.line({ x: mx - 1, y: y + 4 }, { x: mx + 2, y: y + 4 }, "#cdc498");
      for (const dx of profile ? [s * 5] : [-4 + s, 4 + s]) {
        b.rect(x + dx, y + 2, 2, 3, p.metal[2]);
        b.dot(x + dx, y + 1, p.metal[3]);
      }
      b.dot(x + (profile ? s * 6 : s * 2), y + 2, p.skin[0]);
      return;
    }
    if (id === "wolf" || id === "fox") {
      const dog = id === "wolf", rx2 = profile ? 6 : dog ? 5 : 7;
      oval(x, y, rx2, dog ? 5 : 6, p.skin[0]);
      b.oval(x - 1, y - 1, rx2 - 1, dog ? 4 : 5, p.skin[1]);
      b.oval(x - 2, y - 3, 3, 2, p.skin[2]);
      for (const side of profile ? [-s] : [-1, 1]) {
        const dx = side * (dog ? 4 : 5);
        if (dog) {
          b.outlined([{ x: x + dx - 2, y: y - 4 }, { x: x + dx + 2, y: y - 4 }, { x: x + dx + 2, y: y + 1 }, { x: x + dx, y: y + 3 }, { x: x + dx - 2, y }], p.skin[0]);
          b.line({ x: x + dx, y: y - 3 }, { x: x + dx + 1, y }, p.skin[1]);
        } else {
          b.outlined([{ x: x + dx - side * 2, y: y - 4 }, { x: x + dx + side, y: y - 12 }, { x: x + dx + side * 2, y: y - 4 }], p.skin[0]);
          b.poly([{ x: x + dx, y: y - 6 }, { x: x + dx + side, y: y - 9 }, { x: x + dx + side, y: y - 5 }], p.skin[2]);
        }
      }
      if (back) {
        b.line({ x: x - 3, y: y + 4 }, { x: x + 3, y: y + 4 }, p.skin[0]);
        return;
      }
      const mx = x + (profile ? s * 5 : quarter ? s * 3 : 0);
      b.poly([{ x: mx - 4, y: y + 2 }, { x: mx - 2, y: y + 1 }, { x: mx + 3, y: y + 1 }, { x: mx + 4, y: y + 3 }, { x: mx + 2, y: y + 5 }, { x: mx - 2, y: y + 5 }, { x: mx - 4, y: y + 3 }], p.metal[2]);
      b.line({ x: mx - 2, y: y + 4 }, { x: mx + 2, y: y + 4 }, p.skin[0]);
      b.rect(mx - 1 + (profile ? s : 0), y + 1, 2, 1, FACE_OUTLINE);
      eyes(dog ? "#b89658" : "#e6bf61");
      return;
    }
    if (id === "mech") {
      b.outlined([{ x: x - 5, y: y - 4 }, { x: x + 3, y: y - 5 }, { x: x + 6, y: y - 2 }, { x: x + 5, y: y + 4 }, { x: x - 4, y: y + 4 }, { x: x - 6, y }], p.skin[0]);
      b.poly([{ x: x - 4, y: y - 3 }, { x: x + 2, y: y - 4 }, { x: x + 4, y: y - 1 }, { x: x + 3, y: y + 3 }, { x: x - 3, y: y + 3 }], p.skin[1]);
      b.line({ x: x - 3, y: y - 3 }, { x: x + 1, y: y - 3 }, p.skin[2]);
      if (back) {
        b.rect(x - 3, y - 1, 6, 3, p.metal[0]);
        for (const dx of [-2, 0, 2]) b.rect(x + dx, y, 1, 2, p.metal[1]);
      } else {
        const q = x + (profile ? s * 3 : quarter ? s * 2 : 0);
        oval(q, y, 2, 2, p.metal[0]);
        b.oval(q, y, 1.5, 1.5, p.hair[1]);
        b.dot(q - 1, y - 1, p.hair[2]);
        b.dot(x - 4, y + 2, p.metal[2]);
      }
      return;
    }
    if (id === "spider") {
      oval(x, y, profile ? 5 : 6, 4, p.skin[0]);
      b.oval(x - 1, y - 1, 4, 3, p.skin[1]);
      b.line({ x: x - 3, y: y - 2 }, { x: x + 1, y: y - 3 }, p.skin[2]);
      if (back) {
        b.line({ x: x - 3, y: y - 1 }, { x: x + 2, y: y + 1 }, p.hair[0]);
        return;
      }
      const positions = profile ? [[s * 3, -1], [s * 4, 1]] : quarter ? [[s * 1, -2], [s * 3, -1], [s * 5, 0], [s * 2, 1]] : [[-4, -1], [-2, -2], [2, -2], [4, -1], [-2, 1], [2, 1]];
      for (const [dx, dy] of positions) {
        b.dot(x + dx, y + dy, FACE_OUTLINE);
        b.dot(x + dx, y + dy - 1, p.hair[2]);
      }
      for (const dx of profile ? [s * 4] : [-2 + s, 2 + s]) {
        b.line({ x: x + dx, y: y + 2 }, { x: x + dx + s, y: y + 5 }, FACE_OUTLINE, 1);
        b.line({ x: x + dx, y: y + 3 }, { x: x + dx + s, y: y + 4 }, p.metal[2]);
      }
      return;
    }
    const silver = id === "caster", rx = profile ? 6 : 7;
    faceShape(b, x, y, rx, 7, p, s, back);
    if (!silver) for (const side of profile ? [-s] : [-1, 1]) {
      b.outlined([{ x: x + side * 5, y: y - 1 }, { x: x + side * 10, y: y - 2 }, { x: x + side * 6, y: y + 2 }], p.skin[0]);
      b.line({ x: x + side * 6, y }, { x: x + side * 8, y: y - 1 }, p.skin[2]);
    }
    hairShape(b, x, y, v, p, { long: !silver, silver });
    if (!back) {
      eyes(silver ? "#9276ad" : "#547c45");
      b.dot(x + (profile ? s * 6 : quarter ? s * 3 : 0), y + 2, p.skin[0]);
      b.rect(x + (profile ? s * 4 : quarter ? s * 2 : 0) - 1, y + 4, 2, 1, p.skin[0]);
    }
    if (silver) {
      if (!back) {
        b.line({ x: x - 4, y: y - 3 }, { x: x + 4, y: y - 3 }, p.metal[0]);
        b.line({ x: x - 3, y: y - 3 }, { x: x + 3, y: y - 3 }, p.metal[2]);
        b.dot(x + s * 2, y - 3, "#4b99b7");
        b.dot(x + s * 2, y - 4, "#b6e5e0");
      }
    } else {
      const bx = x - (s || 1) * 5;
      for (let i = 0; i < 3; i++) {
        b.rect(bx + i % 2, y + 4 + i * 2, 2, 2, p.hair[i % 2 ? 0 : 1]);
      }
      b.rect(bx, y + 10, 2, 1, p.cloth[2]);
    }
  }

  // grand-pixels.js
  var O = "#192328";
  function paintGrandPixels(b, rig, at, p, layer) {
    if (layer === "body") {
      const body2 = at(rig.body), mark = rig.pixelMark;
      if (mark !== void 0) {
        const x = body2.x + (mark % 2 ? 2 : -2), y = body2.y + 1;
        b.rect(x, y, 2, 2, p.cloth[0]);
        b.dot(x, y, p.cloth[2]);
      }
      if (rig.equipment?.includes("reliquary-plate")) for (const s of [-1, 1]) b.outlined([{ x: body2.x + s * 4, y: body2.y - 4 }, { x: body2.x + s * 8, y: body2.y - 3 }, { x: body2.x + s * 8, y: body2.y }, { x: body2.x + s * 4, y: body2.y + 1 }], p.metal[2]);
      if (rig.equipment?.includes("prism-focus")) {
        const q = at(rig.weapon?.tip || rig.head);
        b.outlined([{ x: q.x, y: q.y - 3 }, { x: q.x + 2, y: q.y }, { x: q.x, y: q.y + 3 }, { x: q.x - 2, y: q.y }], p.hair[2]);
      }
    }
    const g = rig.grand;
    if (!g) return;
    const h = at(rig.head), body = at(rig.body), stage = rig.form || 1, light = p.metal[3], gold = p.cloth[2];
    if (layer === "far") {
      if (stage === 2 && !rig.ragdoll) {
        for (const side of [-1, 1]) {
          const q = at({ ...rig.body, x: rig.body.x - 26, y: side * 49, z: rig.body.z + 22 });
          q.y = Math.min(52, q.y);
          b.outlined([{ x: q.x, y: q.y - 4 }, { x: q.x + 3, y: q.y }, { x: q.x, y: q.y + 4 }, { x: q.x - 3, y: q.y }], p.cloth[1]);
          b.dot(q.x, q.y, light);
          b.line(q, { x: q.x, y: q.y + 8 }, gold);
        }
      }
      if (g.halo) {
        const r = stage === 2 ? 12 : 10, pts = Array.from({ length: 8 }, (_, i) => ({ x: h.x + Math.cos(i * Math.PI / 4) * r, y: h.y + Math.sin(i * Math.PI / 4) * r * 0.7 - 2 }));
        for (let i = 0; i < 8; i++) {
          b.line(pts[i], pts[(i + 1) % 8], O, 1);
          b.line(pts[i], pts[(i + 1) % 8], light);
        }
        for (const q of pts) b.dot(q.x, q.y, gold);
      }
      const fold = rig.ragdoll ? 0.45 + 0.55 * (1 - (rig.death || 0)) : 1;
      if (g.wings && rig.id !== "flyer") for (const side of [-1, 1]) {
        const root = at({ ...rig.body, x: rig.body.x - 6, y: rig.body.y + side * 7, z: rig.body.z + 9 }), joint = at({ ...rig.body, x: rig.body.x - 15, y: side * 38 * fold, z: rig.body.z + 17 }), tip = at({ ...rig.body, x: rig.body.x - 23, y: side * 65 * fold, z: rig.body.z + 7 + Math.sin(rig.phase * Math.PI * 2) * 8 });
        tip.y = Math.min(stage === 2 ? 42 : 48, tip.y);
        b.outlined([root, joint, tip, { x: tip.x - side * 2, y: tip.y + 13 }, { x: root.x, y: root.y + 5 }], p.cloth[0]);
        b.poly([root, joint, tip], ["angel", "dryad", "frostregent"].includes(g.motif) ? p.metal[2] : p.cloth[1]);
        for (let i = 0; i < 6; i++) {
          const t = i / 6;
          b.line({ x: root.x + (tip.x - root.x) * t, y: root.y + (tip.y - root.y) * t }, { x: tip.x + (root.x - tip.x) * t * 0.7, y: tip.y + 12 - i }, ["angel", "frostregent"].includes(g.motif) ? light : gold, 1);
        }
        if (stage === 2 && !rig.ragdoll) {
          b.outlined([root, { x: tip.x - side * 3, y: tip.y + 12 }, { x: tip.x - side * 8, y: tip.y + 19 }, { x: root.x, y: root.y + 7 }], p.cloth[1]);
          b.line({ x: tip.x - side * 3, y: tip.y + 12 }, { x: tip.x - side * 8, y: tip.y + 19 }, light, 1);
        }
      }
      if (g.tailFan) {
        const root = at(rig.pelvis);
        for (let i = 0; i < g.tailFan; i++) {
          const s = i - (g.tailFan - 1) / 2, tip = at({ ...rig.pelvis, x: rig.pelvis.x - 26 - Math.abs(s) * 3, y: s * 11 + Math.sin(rig.phase * 6.28 + i) * 4, z: rig.pelvis.z + 3 + Math.abs(s) * 5 });
          b.line(root, tip, O, 3);
          b.line(root, tip, p.skin[1], 2);
          b.oval(tip.x, tip.y, 2, 2, light);
        }
      }
    }
    if (layer === "body") {
      if (stage === 2) {
        for (const s of [-1, 1]) b.outlined([{ x: body.x + s * 5, y: body.y - 4 }, { x: body.x + s * 11, y: body.y - 8 }, { x: body.x + s * 10, y: body.y + 3 }, { x: body.x + s * 4, y: body.y + 8 }], p.cloth[1]);
        b.line({ x: body.x, y: body.y }, { x: body.x, y: body.y + 11 }, light, 1);
      }
      if (!["hydra", "cerberus", "spiderqueen", "solarlion"].includes(g.motif)) {
        b.outlined([{ x: body.x - 7, y: body.y - 6 }, { x: body.x + 7, y: body.y - 6 }, { x: body.x + 9, y: body.y + 2 }, { x: body.x + 5, y: body.y + 6 }, { x: body.x - 5, y: body.y + 6 }, { x: body.x - 9, y: body.y + 2 }], p.metal[0]);
        b.poly([{ x: body.x - 5, y: body.y - 4 }, { x: body.x + 5, y: body.y - 4 }, { x: body.x + 6, y: body.y + 2 }, { x: body.x, y: body.y + 5 }, { x: body.x - 6, y: body.y + 2 }], p.metal[1]);
        b.line({ x: body.x - 4, y: body.y - 4 }, { x: body.x + 4, y: body.y - 4 }, light);
        b.outlined([{ x: body.x, y: body.y - 3 }, { x: body.x + 2, y: body.y }, { x: body.x, y: body.y + 3 }, { x: body.x - 2, y: body.y }], gold);
        b.dot(body.x, body.y - 1, light);
      } else {
        for (let i = -2; i <= 2; i++) b.outlined([{ x: body.x + i * 3 - 2, y: body.y - 2 }, { x: body.x + i * 3, y: body.y - 8 - Math.abs(i) }, { x: body.x + i * 3 + 2, y: body.y + 1 }], p.cloth[1]);
      }
    }
    if (layer === "head") {
      if (g.extraHeads) {
        for (const side of g.extraHeads === 4 ? [-1.8, -0.8, 0.8, 1.8] : [-1, 1]) {
          const q = at({ ...rig.head, x: rig.head.x - 7, y: rig.head.y + side * 18, z: rig.head.z - 3 }), root = at({ ...rig.body, x: rig.body.x + 10, z: rig.body.z + 3 });
          b.line(root, q, O, 2);
          b.line(root, q, p.skin[1], 1);
          drawNativeFace(b, rig.id, q, rig.dir, p, { ...rig, grand: null, form: 0 });
        }
      }
      if (g.crest === "crown" || g.crest === "reactor" || g.crest === "pearl") {
        const y = h.y - 7;
        b.outlined([{ x: h.x - 8, y }, { x: h.x - 8, y: y - 6 }, { x: h.x - 4, y: y - 2 }, { x: h.x, y: y - 8 }, { x: h.x + 4, y: y - 2 }, { x: h.x + 8, y: y - 6 }, { x: h.x + 8, y }, { x: h.x - 8, y }], p.metal[1]);
        b.line({ x: h.x - 6, y: y - 1 }, { x: h.x + 6, y: y - 1 }, light);
        for (const dx of [-5, 0, 5]) b.dot(h.x + dx, y - 2, gold);
      } else if (g.crest === "horns" || g.crest === "antlers" || g.crest === "fins") for (const side of [-1, 1]) {
        const a = { x: h.x + side * 5, y: h.y - 5 }, z = { x: h.x + side * 12, y: h.y - 13 };
        b.line(a, z, O, 2);
        b.line(a, z, light, 1);
        if (g.crest === "antlers") {
          b.line({ x: h.x + side * 8, y: h.y - 8 }, { x: h.x + side * 16, y: h.y - 10 }, light, 1);
          b.line({ x: h.x + side * 9, y: h.y - 10 }, { x: h.x + side * 7, y: h.y - 15 }, light);
        }
      }
      else if (g.crest === "hat") b.outlined([{ x: h.x - 10, y: h.y - 5 }, { x: h.x - 6, y: h.y - 8 }, { x: h.x - 3, y: h.y - 18 }, { x: h.x + 3, y: h.y - 14 }, { x: h.x + 7, y: h.y - 6 }, { x: h.x + 10, y: h.y - 5 }], p.cloth[1]);
      else if (g.crest === "flame") {
        for (let i = -2; i <= 2; i++) b.outlined([{ x: h.x + i * 3 - 2, y: h.y - 4 }, { x: h.x + i * 3, y: h.y - 13 + Math.abs(i) * 2 }, { x: h.x + i * 3 + 2, y: h.y - 4 }], i % 2 ? p.skin[2] : gold);
      }
      if (["runetitan", "scarabking"].includes(g.motif)) {
        b.outlined([{ x: h.x - 7, y: h.y - 5 }, { x: h.x + 7, y: h.y - 5 }, { x: h.x + 8, y: h.y + 3 }, { x: h.x + 4, y: h.y + 7 }, { x: h.x - 5, y: h.y + 7 }, { x: h.x - 8, y: h.y + 3 }], p.metal[1]);
        b.line({ x: h.x - 5, y: h.y - 4 }, { x: h.x + 4, y: h.y - 4 }, light);
        if (!rig.back) {
          b.rect(h.x - 5, h.y - 1, 10, 3, O);
          b.rect(h.x - 3, h.y, 6, 1, gold);
        } else b.rect(h.x - 3, h.y, 6, 3, p.metal[0]);
      }
    }
  }

  // native-cloth.js
  function paintCapeMesh(b, rig, at, p, layer) {
    if (!rig.capeMesh) return;
    const grid = rig.capeMesh, body = at(rig.body);
    for (let col = 0; col < grid.length - 1; col++) for (let row = 0; row < grid[col].length - 1; row++) {
      const points = [grid[col][row], grid[col + 1][row], grid[col + 1][row + 1], grid[col][row + 1]].map(at), depth = points.reduce((n, q) => n + q.depth, 0) / 4;
      if ((depth > body.depth ? "near" : "far") !== layer) continue;
      b.poly(points, p.cloth[col === 1 || col === 2 ? 1 : 0]);
      if (col === 0 || col === grid.length - 2) {
        b.line(points[col === 0 ? 0 : 1], points[col === 0 ? 3 : 2], "#20272a", 1);
        b.line(points[col === 0 ? 0 : 1], points[col === 0 ? 3 : 2], p.metal[2]);
      }
      if (row === 0) b.line(points[0], points[1], p.cloth[2]);
      if (row === grid[col].length - 2) {
        b.line(points[2], points[3], "#20272a", 1);
        b.line(points[2], points[3], p.metal[2]);
      }
    }
  }

  // prototype-pixel-art.js
  var CELL = 64;
  var PIVOT = { x: 32, y: 44 };
  var PIXEL_WORLD = 3;
  var OUT = "#192328";
  var PIXEL_PALETTES = {
    crab: { skin: ["#496b63", "#7daca0", "#c6d9be"], cloth: ["#385c69", "#5b95aa", "#a9d1db"], metal: ["#324d52", "#668d8c", "#b0c8bd", "#e5e0b9"], hair: ["#364c58", "#638e99", "#abd5ce"] },
    centipede: { skin: ["#3b454e", "#6f8f96", "#b7d0c4"], cloth: ["#4d4540", "#9b8054", "#d2ba76"], metal: ["#37434b", "#6c8790", "#b3b9b2", "#e0daba"], hair: ["#43516d", "#87acba", "#d0e5d9"] },
    knight: { skin: ["#82563d", "#c18b60", "#efd09e"], cloth: ["#552b35", "#a4433e", "#df7955"], metal: ["#43545c", "#8b9b99", "#c9cfc0", "#f0e3ba"], hair: ["#722c30", "#bd473b", "#f18a51"] },
    orc: { skin: ["#3e5939", "#7c9d49", "#b7ca73"], cloth: ["#3d322b", "#805d3d", "#bf9055"], metal: ["#344c53", "#708483", "#b7c3ad", "#e4ddae"], hair: ["#242c2b", "#3d4733", "#6c7348"] },
    elf: { skin: ["#976c50", "#d5a479", "#f4d3a1"], cloth: ["#203d37", "#397653", "#71a467"], metal: ["#48534d", "#899882", "#c9cba1", "#edd698"], hair: ["#95703d", "#c8a153", "#f0cc7a"] },
    caster: { skin: ["#976674", "#d3a8a0", "#f1d7b6"], cloth: ["#382d58", "#69528d", "#9b76bd"], metal: ["#3a5061", "#648aa1", "#b6d6dd", "#e8ead4"], hair: ["#647081", "#a6acb8", "#e6ded3"] },
    fox: { skin: ["#97532f", "#d48b3d", "#f0b863"], cloth: ["#1f3e37", "#3b7450", "#79a367"], metal: ["#5c5544", "#a89969", "#d2c19a", "#eee0b5"], hair: ["#97532f", "#d48b3d", "#f0b863"] },
    wolf: { skin: ["#954e31", "#cd7c38", "#edae58"], cloth: ["#642c35", "#a64140", "#dd674d"], metal: ["#5e5541", "#a9a070", "#dbcf9f", "#f3deba"], hair: ["#8f4a31", "#c77a39", "#edab55"] },
    mech: { skin: ["#4e473b", "#9b7043", "#d8a85e"], cloth: ["#36484d", "#647b7b", "#a1ad9b"], metal: ["#3c4549", "#6b797d", "#b4bcac", "#e3d3a5"], hair: ["#354b58", "#63979e", "#a5e6e3"] },
    spider: { skin: ["#312b43", "#76648e", "#b6a1c4"], cloth: ["#2b233b", "#50345f", "#8b5496"], metal: ["#483957", "#786089", "#bea1cd", "#e9c7eb"], hair: ["#372844", "#725395", "#c190df"] },
    jelly: { skin: ["#185674", "#358ca2", "#72c8ce"], cloth: ["#174d68", "#278ba1", "#7ce0df"], metal: ["#356b8c", "#67a9bf", "#a6e8e0", "#e0faf0"], hair: ["#195673", "#428fa8", "#86d9df"] },
    serpent: { skin: ["#244f53", "#498981", "#a2c7a0"], cloth: ["#33476b", "#6989a4", "#abd1d0"], metal: ["#4a787b", "#8eb8b0", "#c6d9bd", "#ecedd0"], hair: ["#274d6f", "#5294b0", "#b0dfd5"] },
    flyer: { skin: ["#68554b", "#b89a75", "#e2c49b"], cloth: ["#304c61", "#5f92aa", "#b3d9ce"], metal: ["#425970", "#7897a6", "#c5d1c5", "#f0dfae"], hair: ["#52527c", "#9497bd", "#d1d6dc"] }
  };
  var colors = /* @__PURE__ */ new Map();
  function rgba(c2) {
    if (!colors.has(c2)) colors.set(c2, [parseInt(c2.slice(1, 3), 16), parseInt(c2.slice(3, 5), 16), parseInt(c2.slice(5, 7), 16), 255]);
    return colors.get(c2);
  }
  var PixelBrush = class {
    constructor() {
      this.data = new Uint8ClampedArray(CELL * CELL * 4);
      this.clipped = 0;
      this.data.clipSamples = [];
    }
    dot(x, y, c2) {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= CELL || y >= CELL) {
        this.clipped++;
        if (this.data.clipSamples.length < 12) this.data.clipSamples.push({ x, y, c: c2 });
        return;
      }
      this.data.set(rgba(c2), (y * CELL + x) * 4);
    }
    rect(x, y, w, h, c2) {
      for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) this.dot(i, j, c2);
    }
    oval(x, y, rx, ry, c2) {
      x = Math.round(x);
      y = Math.round(y);
      for (let j = Math.floor(y - ry); j <= Math.ceil(y + ry); j++) for (let i = Math.floor(x - rx); i <= Math.ceil(x + rx); i++) if (((i - x) / (rx || 1)) ** 2 + ((j - y) / (ry || 1)) ** 2 <= 1) this.dot(i, j, c2);
    }
    line(a, b, c2, r = 0) {
      let x = Math.round(a.x), y = Math.round(a.y), tx = Math.round(b.x), ty = Math.round(b.y), dx = Math.abs(tx - x), sx = x < tx ? 1 : -1, dy = -Math.abs(ty - y), sy = y < ty ? 1 : -1, err = dx + dy;
      for (let k = 0; k < 160; k++) {
        this.oval(x, y, r || 0.6, r || 0.6, c2);
        if (x === tx && y === ty) break;
        const e = 2 * err;
        if (e >= dy) {
          err += dy;
          x += sx;
        }
        if (e <= dx) {
          err += dx;
          y += sy;
        }
      }
    }
    poly(vertices, c2) {
      vertices = vertices.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
      const xs = vertices.map((p) => p.x), ys = vertices.map((p) => p.y);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
          const a = vertices[i], b = vertices[j];
          if (a.y > y !== b.y > y && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
        }
        if (inside) this.dot(x, y, c2);
      }
    }
    rotated(layer, center, angle) {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
        const dx = x - center.x, dy = y - center.y, sx = Math.round(center.x + dx * cos + dy * sin), sy = Math.round(center.y - dx * sin + dy * cos);
        if (sx < 0 || sy < 0 || sx >= CELL || sy >= CELL) continue;
        const src = (sy * CELL + sx) * 4;
        if (layer.data[src + 3]) this.data.set(layer.data.subarray(src, src + 4), (y * CELL + x) * 4);
      }
      for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (layer.data[(y * CELL + x) * 4 + 3]) {
        const dx = x - center.x, dy = y - center.y, tx = Math.round(center.x + dx * cos - dy * sin), ty = Math.round(center.y + dx * sin + dy * cos);
        if (tx < 0 || ty < 0 || tx >= CELL || ty >= CELL) this.clipped++;
      }
      this.clipped += layer.clipped;
    }
    outlined(points, c2) {
      this.poly(points, c2);
      points.forEach((p, i) => this.line(p, points[(i + 1) % points.length], OUT));
    }
  };
  function spritePoint(p, angle) {
    const s = projectRig(p, angle);
    return { x: PIVOT.x + s.x / PIXEL_WORLD, y: PIVOT.y + s.y / PIXEL_WORLD, depth: s.depth };
  }
  function paintCharacterPixels(id, rig, angle) {
    let b = new PixelBrush();
    const p = rig.palette || PIXEL_PALETTES[id], dir = (Math.round(angle / (Math.PI / 4)) % 8 + 8) % 8, front = dir === 2, back = !FACE_VIEWS[dir].eyes.length, side = FACE_VIEWS[dir].sign, at = (q) => spritePoint(q, angle);
    rig.dir = dir;
    rig.back = back;
    const body = at(rig.body), pelvis = at(rig.pelvis), head = at(rig.head), moving = ["walk", "run", "sprint", "turn", "stop"].includes(rig.state), dead = rig.death > 0;
    const bind = rig.ragdoll ? characterRig(id, "idle", 0) : null;
    let headRoll = 0;
    if (bind) {
      const h = at(bind.head), c2 = at(bind.body), rest = Math.atan2(h.x - c2.x, -(h.y - c2.y)), current = Math.atan2(head.x - body.x, -(head.y - body.y));
      headRoll = Math.round(Math.atan2(Math.sin(current - rest), Math.cos(current - rest)) / (Math.PI / 12)) * (Math.PI / 12);
    }
    if (["knight", "orc", "elf", "caster", "fox"].includes(id)) {
      if (rig.ragdoll) {
        const dx = head.x - body.x, dy = head.y - body.y, len = Math.hypot(dx, dy) || 1;
        head.x += dx / len * 2;
        head.y += dy / len * 2;
      } else head.y -= 2;
    }
    if (rig.state === "idle") head.y += Math.round(Math.sin(rig.phase * Math.PI * 2) * 0.7);
    function outlinedOval(x, y, rx, ry, color) {
      b.oval(x, y, rx + 1, ry + 1, OUT);
      b.oval(x, y, rx, ry, color);
    }
    function segment(a, c2, width2, color, highlight) {
      const x = at(a), y = at(c2);
      b.line(x, y, OUT, width2 + 1);
      b.line(x, y, color, width2);
      if (highlight) b.line({ x: x.x - 1, y: x.y - 1 }, { x: y.x - 1, y: y.y - 1 }, highlight, 0);
    }
    function leg(l) {
      const animal = ["wolf", "spider", "crab", "centipede"].includes(id), metal = ["knight", "mech"].includes(id), upper = id === "orc" ? 2.1 : id === "mech" ? 1.7 : animal ? 1 : 1.4, lower = animal ? 1 : id === "orc" ? 1.8 : 1.3;
      segment(l.root, l.joint, upper, animal ? p.skin[0] : id === "orc" ? p.skin[0] : p.cloth[0], animal ? p.skin[1] : id === "orc" ? p.skin[1] : p.cloth[1]);
      segment(l.joint, l.hock || l.end, lower, metal ? p.metal[0] : animal ? p.skin[0] : p.cloth[0], metal ? p.metal[1] : animal ? p.skin[1] : p.cloth[1]);
      if (l.hock) segment(l.hock, l.end, 0.8, p.skin[0], p.skin[1]);
      const f = at(l.end);
      if (id === "mech") {
        for (const part of [l.root, l.joint]) {
          const j = at(part);
          outlinedOval(j.x, j.y, 1.6, 1.6, p.metal[0]);
          b.dot(j.x - 1, j.y - 1, p.skin[2]);
        }
      }
      if (animal) {
        outlinedOval(f.x + 0.5, f.y, id === "spider" ? 1.1 : 2, id === "spider" ? 0.7 : 1.2, id === "wolf" ? p.skin[1] : p.skin[0]);
        if (id === "wolf") b.line({ x: f.x, y: f.y - 1 }, { x: f.x + 1, y: f.y - 1 }, p.skin[2]);
      } else {
        const w = id === "orc" ? 2.7 : id === "mech" ? 2.5 : 2.3;
        b.outlined([{ x: f.x - w, y: f.y - 2 }, { x: f.x + w - 1, y: f.y - 2 }, { x: f.x + w + 1, y: f.y }, { x: f.x + w, y: f.y + 2 }, { x: f.x - w, y: f.y + 2 }], metal ? p.metal[0] : "#49382e");
        b.rect(f.x - w + 1, f.y - 1, w * 1.5, 2, metal ? p.metal[1] : "#826648");
        b.line({ x: f.x - w + 1, y: f.y - 1 }, { x: f.x + w - 1, y: f.y - 1 }, metal ? p.metal[2] : "#bfa278");
        b.line({ x: f.x - w, y: f.y + 2 }, { x: f.x + w, y: f.y + 2 }, OUT);
      }
    }
    const sorted = rig.legs.slice().sort((a, c2) => at(a.root).depth - at(c2.root).depth), far = sorted.filter((l) => at(l.root).depth < 0), near = sorted.filter((l) => at(l.root).depth >= 0);
    far.forEach(leg);
    paintGrandPixels(b, rig, at, p, "far");
    paintCapeMesh(b, rig, at, p, "far");
    if (id === "crab" || id === "centipede") {
      const segments = rig.segments || [rig.body];
      for (const q of segments) {
        const a = at(q);
        outlinedOval(a.x, a.y, id === "crab" ? 9 : 4.5, id === "crab" ? 6 : 4, p.skin[0]);
        b.oval(a.x - 1, a.y - 1, id === "crab" ? 7 : 3.5, id === "crab" ? 4 : 3, p.skin[1]);
        b.line({ x: a.x - 3, y: a.y - 2 }, { x: a.x + 2, y: a.y - 2 }, p.skin[2]);
      }
      if (id === "crab") for (const side2 of [-1, 1]) {
        const root = { ...rig.body, x: rig.body.x + 7, y: side2 * 11 }, end = { ...root, x: root.x + 22 + Math.sin(rig.phase * 6.28) * 3, y: side2 * 22, z: root.z - 3 };
        segment(root, end, 2, p.skin[0], p.skin[1]);
        const q = at(end);
        b.outlined([{ x: q.x - 3, y: q.y - 3 }, { x: q.x + 3, y: q.y - 5 }, { x: q.x + 5, y: q.y + 1 }, { x: q.x, y: q.y + 3 }, { x: q.x - 3, y: q.y }], p.skin[1]);
        b.line({ x: q.x, y: q.y - 2 }, { x: q.x + 3, y: q.y + 1 }, p.skin[0]);
      }
      drawNativeFace(b, id, head, dir, p, rig);
      paintGrandPixels(b, rig, at, p, "body");
      near.forEach(leg);
      paintGrandPixels(b, rig, at, p, "head");
      paintCapeMesh(b, rig, at, p, "near");
      b.data.clipped = b.clipped;
      return b.data;
    }
    if (id === "serpent") {
      for (const [i, q] of [...rig.segments].reverse().entries()) {
        const t = at(q), r = 2 + Math.min(3, i * 0.4);
        outlinedOval(t.x, t.y, r, r * 0.65, p.skin[0]);
        b.oval(t.x - 1, t.y - 1, Math.max(1, r - 1), Math.max(1, r * 0.65 - 1), p.skin[1]);
        b.dot(t.x, t.y - 2, p.skin[2]);
      }
      segment(rig.body, rig.head, 2, p.skin[0], p.skin[1]);
      paintGrandPixels(b, rig, at, p, "body");
      drawNativeFace(b, id, head, dir, p, rig);
      if (rig.form) {
        for (const s of [-1, 1]) {
          const q = { x: head.x + s * 6, y: head.y + 3 };
          b.line(head, q, p.skin[1], 1);
          if (rig.formPath === "wild") drawNativeFace(b, id, q, dir, p, { ...rig, form: 0 });
          else b.outlined([{ x: q.x, y: q.y - 3 }, { x: q.x + s * 3, y: q.y }, { x: q.x, y: q.y + 4 }], p.metal[2]);
        }
      }
      paintGrandPixels(b, rig, at, p, "head");
      paintCapeMesh(b, rig, at, p, "near");
      b.data.clipped = b.clipped;
      return b.data;
    }
    if (id === "flyer") {
      for (const wing of rig.wings) {
        const qs = wing.map(at);
        b.outlined(qs, p.cloth[0]);
        b.poly([qs[0], qs[1], qs[2]], p.cloth[1]);
        b.line(qs[0], qs[2], p.cloth[2]);
        if (rig.design === "bat") b.line(qs[1], qs[3], p.skin[0]);
        else for (let i = 0; i < 4; i++) {
          const t = i / 4;
          b.line({ x: qs[1].x + (qs[2].x - qs[1].x) * t, y: qs[1].y + (qs[2].y - qs[1].y) * t }, qs[3], p.cloth[2]);
        }
      }
      if (rig.grand) for (const wing of rig.wings) {
        const qs = wing.map(at);
        for (let i = 1; i <= 3; i++) {
          const t = i / 4;
          b.line({ x: qs[0].x + (qs[1].x - qs[0].x) * t, y: qs[0].y + (qs[1].y - qs[0].y) * t }, { x: qs[3].x + (qs[2].x - qs[3].x) * t, y: qs[3].y + (qs[2].y - qs[3].y) * t }, p.metal[2], 1);
        }
      }
      outlinedOval(body.x, body.y, rig.design === "faerie" ? 3 : 5, 5, p.skin[0]);
      b.oval(body.x - 1, body.y - 1, 3, 4, p.cloth[1]);
      segment(rig.body, rig.head, 2, p.skin[0], p.skin[1]);
      for (const s of [-1, 1]) {
        b.line({ x: body.x + s * 2, y: body.y + 3 }, { x: body.x + s * 3, y: body.y + 7 }, p.metal[2]);
        b.dot(body.x + s * 4, body.y + 7, p.metal[3]);
      }
      paintGrandPixels(b, rig, at, p, "body");
      drawNativeFace(b, id, head, dir, p, rig);
      if (rig.form) {
        b.outlined([{ x: body.x - 3, y: body.y - 1 }, { x: body.x + 3, y: body.y - 1 }, { x: body.x + 5, y: body.y + 8 }, { x: body.x, y: body.y + 5 }, { x: body.x - 5, y: body.y + 8 }], rig.formPath === "warden" ? p.metal[1] : p.cloth[2]);
      }
      paintGrandPixels(b, rig, at, p, "head");
      paintCapeMesh(b, rig, at, p, "near");
      b.data.clipped = b.clipped;
      return b.data;
    }
    if (!rig.capeMesh && ["knight", "elf", "caster", "fox"].includes(id)) {
      const wind = rig.cape?.map((v) => typeof v === "number" ? v : v.angle) || [0, 1, 2].map((i) => (moving ? 0.7 : 0.06) + Math.sin(rig.phase * Math.PI * 2 - i * 0.65) * (moving ? 0.2 : 0.04));
      const root = at({ ...rig.body, x: rig.body.x - 5, z: rig.body.z + 6 }), rear = at({ ...rig.pelvis, x: rig.pelvis.x - 12 - (wind[1] || 0) * 12, z: rig.pelvis.z - 7 + (wind[1] || 0) * 9 });
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * 3, tip = { x: rear.x + dx + (wind[i] || 0) * Math.sin(angle) * 4, y: rear.y + (i === 1 ? 2 : 0) };
        b.outlined([{ x: root.x + dx - 2, y: root.y }, { x: root.x + dx + 2, y: root.y }, { x: tip.x + 2, y: tip.y }, { x: tip.x - 2, y: tip.y }], p.cloth[i === 1 ? 1 : 0]);
        b.line({ x: root.x + dx, y: root.y + 2 }, { x: tip.x, y: tip.y - 1 }, p.cloth[2]);
      }
    }
    if (id === "jelly") {
      const actionPulse = Math.sin(rig.phase * Math.PI), squash = (rig.squash || 1) * (["dodge", "dash"].includes(rig.state) ? 1 + 0.26 * actionPulse : rig.state === "stop" ? 1 + 0.17 * actionPulse : 1), rx = 8 * squash, ry = 9 / squash, x = body.x, y = Math.min(54, body.y + 2);
      outlinedOval(x, y, rx, ry, p.skin[0]);
      b.oval(x - 1, y - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), p.skin[1]);
      b.oval(x - 2, y - 3, Math.max(1, rx - 3), Math.max(1, ry - 4), p.skin[2]);
      b.line({ x: x - rx + 3, y: y - ry + 4 }, { x: x - rx + 5, y: y - ry + 2 }, p.metal[3], 1);
      b.oval(x + 3, y - ry + 4, 1, 1, p.metal[2]);
      if (!dead) {
        const pearl = at({ ...rig.body, x: rig.body.x + 8, z: rig.body.z + 1 });
        b.oval(pearl.x, pearl.y, 2, 1, p.skin[0]);
        b.dot(pearl.x - 1, pearl.y - 1, p.metal[2]);
      }
      if (!back && !dead) {
        for (const dx of FACE_VIEWS[dir].eyes) {
          b.rect(Math.round(x) + dx, y - 2, 1, 2, OUT);
          b.dot(Math.round(x) + dx, y - 3, p.metal[3]);
        }
        b.dot(Math.round(x) + FACE_VIEWS[dir].sign * 2, y + 2, p.metal[3]);
      }
      for (let i = 0; i < 3; i++) b.oval(x + (i - 1) * 6, y + ry - 1, 2, 1, p.skin[1]);
      if (rig.form) {
        const crownY = y - ry - 2;
        for (const dx of [-5, 0, 5]) {
          b.line({ x: x + dx, y: crownY + 2 }, { x: x + dx, y: crownY - 2 }, p.metal[1]);
          b.dot(x + dx, crownY - 3, p.metal[3]);
        }
        if (rig.formPath === "warden") for (const s of [-1, 1]) b.outlined([{ x: x + s * rx, y }, { x: x + s * (rx + 3), y: y + 4 }, { x: x + s * rx, y: y + 7 }], p.cloth[2]);
        else for (const s of [-1, 1]) outlinedOval(x + s * (rx + 3), y - 3, 2, 2, p.metal[2]);
      }
      if (rig.state === "cast" || rig.state === "attack") {
        const q = at(rig.weapon.tip);
        outlinedOval(q.x, q.y, 2 + Math.round(rig.phase * 2), 2, p.metal[2]);
        b.dot(q.x - 1, q.y - 1, p.metal[3]);
      }
      paintGrandPixels(b, rig, at, p, "head");
      paintCapeMesh(b, rig, at, p, "near");
      b.data.clipped = b.clipped;
      return b.data;
    }
    if (id === "mech" || id === "spider" || id === "wolf") {
      const rx = id === "wolf" ? Math.hypot((27 + (rig.spine || 0)) * Math.cos(angle), 14 * Math.sin(angle)) / 3 : 7, ry = id === "wolf" ? 4 + Math.abs(Math.sin(angle)) * 2 : 5;
      outlinedOval(body.x, body.y, id === "mech" ? 9 : rx, id === "mech" ? 7 : ry, id === "mech" ? p.metal[0] : p.skin[0]);
      b.oval(body.x - 1, body.y - 1, rx - 1, ry - 1, p.skin[1]);
      b.oval(body.x - 3, body.y - 2, rx - 3, Math.max(1, ry - 3), p.skin[2]);
      if (id === "mech") {
        b.outlined([{ x: body.x - 8, y: body.y - 4 }, { x: body.x - 4, y: body.y - 7 }, { x: body.x + 5, y: body.y - 6 }, { x: body.x + 9, y: body.y - 2 }, { x: body.x + 7, y: body.y + 5 }, { x: body.x - 6, y: body.y + 5 }, { x: body.x - 9, y: body.y }], p.skin[0]);
        b.poly([{ x: body.x - 7, y: body.y - 3 }, { x: body.x - 3, y: body.y - 6 }, { x: body.x + 4, y: body.y - 5 }, { x: body.x + 7, y: body.y - 2 }, { x: body.x + 5, y: body.y + 3 }, { x: body.x - 6, y: body.y + 3 }], p.skin[1]);
        b.poly([{ x: body.x - 6, y: body.y - 3 }, { x: body.x - 3, y: body.y - 5 }, { x: body.x + 2, y: body.y - 4 }, { x: body.x + 3, y: body.y - 2 }, { x: body.x - 3, y: body.y }], p.skin[2]);
        b.rect(body.x - 3, body.y + 2, 6, 2, p.metal[0]);
        for (const dx of [-2, 0, 2]) b.dot(body.x + dx, body.y + 2, p.metal[1]);
        b.line({ x: body.x - 5, y: body.y - 3 }, { x: body.x + 2, y: body.y - 4 }, p.skin[2]);
        for (const dx of [-4, 3]) for (const dy of [-2, 2]) b.dot(body.x + dx, body.y + dy, p.metal[3]);
        const muzzle = at(rig.weapon.tip), grip = at(rig.weapon.grip);
        b.line(grip, muzzle, OUT, 2.5);
        b.line(grip, muzzle, p.metal[0], 1.5);
        b.line({ x: grip.x - 1, y: grip.y - 1 }, { x: muzzle.x - 1, y: muzzle.y - 1 }, p.metal[2]);
        outlinedOval(muzzle.x, muzzle.y, 1.5, 1.5, p.metal[0]);
        b.dot(muzzle.x, muzzle.y, p.hair[2]);
        drawNativeFace(b, id, head, dir, p, rig);
        const antenna = at({ ...rig.body, z: rig.body.z + 20 });
        b.line({ x: body.x, y: body.y - 5 }, antenna, p.metal[1]);
        b.dot(antenna.x, antenna.y, p.skin[2]);
      } else if (id === "spider") {
        drawNativeFace(b, id, head, dir, p, rig);
        b.outlined([{ x: body.x, y: body.y - 4 }, { x: body.x + 2, y: body.y - 1 }, { x: body.x, y: body.y + 2 }, { x: body.x - 2, y: body.y - 1 }], p.hair[1]);
        b.dot(body.x, body.y - 1, p.hair[2]);
      } else {
        const tail = at(rig.tail), tip = at({ ...rig.tail, x: rig.tail.x - 15, y: Math.sin(rig.phase * Math.PI * 2) * 6, z: rig.tail.z + 5 });
        b.line(tail, tip, OUT, 2);
        b.line(tail, tip, p.skin[1], 1);
        b.oval(tip.x, tip.y, 2, 1, p.metal[3]);
        segment({ ...rig.body, x: rig.body.x + 15, z: rig.body.z + 3 }, rig.head, 2.5, p.skin[0], p.skin[1]);
        const torsoBrush2 = b;
        if (rig.ragdoll) b = new PixelBrush();
        drawNativeFace(b, id, head, dir, p, rig);
        if (rig.ragdoll) {
          torsoBrush2.rotated(b, head, headRoll);
          b = torsoBrush2;
        }
      }
      if (rig.form) {
        const armor = rig.formPath === "warden";
        if (id === "mech") {
          b.outlined([{ x: body.x - 7, y: body.y - 3 }, { x: body.x, y: body.y - 7 }, { x: body.x + 6, y: body.y - 2 }, { x: body.x + 5, y: body.y + 4 }, { x: body.x - 7, y: body.y + 3 }], armor ? p.metal[1] : p.cloth[1]);
          const q = at(rig.weapon.tip);
          for (const s of [-1, 1]) b.line({ x: head.x, y: head.y + s * 2 }, { x: q.x, y: q.y + s * (armor ? 2 : 4) }, p.metal[2], 1);
        } else if (id === "spider") {
          for (const s of [-1, 1]) b.outlined([{ x: body.x + s * 4, y: body.y - 1 }, { x: body.x + s * 9, y: body.y - 5 }, { x: body.x + s * 7, y: body.y + 2 }], armor ? p.metal[2] : p.cloth[2]);
          b.line({ x: head.x - 4, y: head.y + 2 }, { x: head.x - 5, y: head.y + 7 }, p.metal[3]);
          b.line({ x: head.x + 4, y: head.y + 2 }, { x: head.x + 5, y: head.y + 7 }, p.metal[3]);
        } else {
          for (let i = -1; i <= 1; i++) b.outlined([{ x: body.x + i * 4 - 2, y: body.y - 3 }, { x: body.x + i * 4, y: body.y - (armor ? 5 : 8) }, { x: body.x + i * 4 + 2, y: body.y - 3 }], armor ? p.metal[1] : p.cloth[2]);
          b.line({ x: body.x - 5, y: body.y }, { x: body.x + 5, y: body.y }, armor ? p.metal[3] : p.cloth[1], 1);
        }
      }
      paintGrandPixels(b, rig, at, p, "body");
      near.forEach(leg);
      paintGrandPixels(b, rig, at, p, "head");
      paintCapeMesh(b, rig, at, p, "near");
      b.data.clipped = b.clipped;
      return b.data;
    }
    function drawArm(arm) {
      const metal = id === "knight", skin = id === "orc", root = at(arm.root);
      segment(arm.root, arm.joint, skin ? 2.2 : 1.6, metal ? p.metal[0] : skin ? p.skin[0] : p.cloth[0], metal ? p.metal[1] : skin ? p.skin[1] : p.cloth[1]);
      segment(arm.joint, arm.end, skin ? 1.6 : 1.2, metal ? p.metal[0] : p.skin[0], metal ? p.metal[1] : p.skin[1]);
      if (metal) {
        outlinedOval(root.x, root.y, 2.7, 2, p.metal[0]);
        b.oval(root.x - 1, root.y - 1, 1.7, 1, p.metal[2]);
      } else if (!skin) {
        b.oval(root.x, root.y, 1.8, 1.5, p.cloth[1]);
        b.dot(root.x - 1, root.y - 1, p.cloth[2]);
      }
      const h = at(arm.end);
      outlinedOval(h.x, h.y, 1.5, 1.4, metal ? p.metal[1] : p.skin[1]);
    }
    function gearLayer(grip) {
      const depth = at(grip).depth;
      return depth < body.depth - 0.5 ? "far" : depth < head.depth ? "middle" : "near";
    }
    function drawGear(layer) {
      drawGearPart(b, id, rig, angle, p, at, outlinedOval, rig.weapon && gearLayer(rig.weapon.grip) === layer, rig.shield && gearLayer(rig.shield.grip) === layer);
    }
    rig.arms.filter((a) => at(a.root).depth < body.depth).forEach(drawArm);
    drawGear("far");
    segment(rig.body, rig.head, 1.4, p.skin[0], p.skin[1]);
    const width = id === "orc" ? 8 : id === "knight" ? 6.5 : 5.8;
    b.outlined([{ x: body.x - width + 1, y: body.y - 4 }, { x: body.x - 3, y: body.y - 6 }, { x: body.x + 3, y: body.y - 6 }, { x: body.x + width - 1, y: body.y - 4 }, { x: body.x + width, y: body.y + 2 }, { x: pelvis.x + width - 1, y: pelvis.y + 2 }, { x: pelvis.x - width + 1, y: pelvis.y + 2 }, { x: body.x - width, y: body.y + 2 }], id === "orc" ? p.skin[0] : id === "knight" ? p.metal[0] : p.cloth[0]);
    const fill = id === "orc" ? p.skin[1] : id === "knight" ? p.metal[1] : p.cloth[1], light = id === "orc" ? p.skin[2] : id === "knight" ? p.metal[2] : p.cloth[2];
    b.poly([{ x: body.x - width + 2, y: body.y - 3 }, { x: body.x - 1, y: body.y - 5 }, { x: body.x + width - 2, y: body.y - 3 }, { x: pelvis.x + width - 2, y: pelvis.y }, { x: pelvis.x - width + 2, y: pelvis.y }], fill);
    b.line({ x: body.x - width + 2, y: body.y - 3 }, { x: body.x, y: body.y - 4 }, light);
    if (id === "orc") {
      for (const s of [-1, 1]) b.oval(body.x + s * 3, body.y - 2, 2, 2, p.skin[2]);
      b.line({ x: body.x - 1, y: body.y + 1 }, { x: body.x + 2, y: body.y + 1 }, p.skin[0]);
      const belt = at({ ...rig.pelvis, z: rig.pelvis.z + 5 });
      b.line({ x: belt.x - 6, y: belt.y }, { x: belt.x + 6, y: belt.y + 2 }, p.cloth[0], 1);
      b.line({ x: body.x - 5, y: body.y - 4 }, { x: body.x + 5, y: body.y + 3 }, p.cloth[1], 1);
      b.dot(body.x - 3, body.y - 2, p.metal[3]);
    }
    if (id === "knight") {
      b.outlined([{ x: body.x - 3, y: body.y - 2 }, { x: body.x + 2, y: body.y - 2 }, { x: pelvis.x + 2, y: pelvis.y + 4 }, { x: pelvis.x - 3, y: pelvis.y + 4 }], p.cloth[0]);
      b.poly([{ x: body.x - 2, y: body.y - 1 }, { x: body.x, y: body.y - 1 }, { x: pelvis.x, y: pelvis.y + 3 }, { x: pelvis.x - 2, y: pelvis.y + 3 }], p.cloth[1]);
      if (!back) {
        b.rect(body.x - 1, body.y + 1, 1, 4, p.metal[3]);
        b.rect(body.x - 2, body.y + 2, 3, 1, p.metal[3]);
      }
    }
    if (id === "caster") {
      b.outlined([{ x: body.x - 5, y: body.y }, { x: body.x + 5, y: body.y }, { x: pelvis.x + 7, y: pelvis.y + 6 }, { x: pelvis.x + 3, y: pelvis.y + 7 }, { x: pelvis.x - 6, y: pelvis.y + 6 }], p.cloth[0]);
      b.poly([{ x: body.x - 3, y: body.y + 1 }, { x: body.x + 2, y: body.y + 1 }, { x: pelvis.x + 4, y: pelvis.y + 5 }, { x: pelvis.x - 4, y: pelvis.y + 5 }], p.cloth[1]);
      b.line({ x: body.x - 2, y: body.y + 1 }, { x: pelvis.x - 3, y: pelvis.y + 5 }, p.cloth[2]);
      b.line({ x: pelvis.x - 5, y: pelvis.y + 5 }, { x: pelvis.x + 5, y: pelvis.y + 5 }, p.metal[2]);
    }
    if (id === "elf" || id === "fox") {
      b.line({ x: body.x - 4, y: body.y - 3 }, { x: pelvis.x + 3, y: pelvis.y + 1 }, "#75563a", 1);
      b.line({ x: body.x - 3, y: body.y - 3 }, { x: pelvis.x + 3, y: pelvis.y }, "#b09257");
      if (!back) b.outlined([{ x: pelvis.x + 3, y: pelvis.y }, { x: pelvis.x + 6, y: pelvis.y }, { x: pelvis.x + 6, y: pelvis.y + 3 }, { x: pelvis.x + 3, y: pelvis.y + 3 }], "#805c3d");
    }
    b.line({ x: pelvis.x - 5, y: pelvis.y }, { x: pelvis.x + 5, y: pelvis.y }, "#342e28", 1);
    b.rect(pelvis.x - 1, pelvis.y - 1, 2, 2, p.metal[2]);
    if (rig.design === "skeleton") {
      for (const dy of [-2, 0, 2]) b.line({ x: body.x - 3, y: body.y + dy }, { x: body.x + 3, y: body.y + dy }, p.skin[2]);
      b.line({ x: body.x, y: body.y - 3 }, { x: body.x, y: body.y + 3 }, p.skin[0]);
    }
    if (rig.form) {
      const armor = rig.formPath === "warden", r = rig.form === 2 ? 4 : 3;
      for (const s of [-1, 1]) b.outlined([{ x: body.x + s * 3, y: body.y - 4 }, { x: body.x + s * (3 + r), y: body.y - 3 }, { x: body.x + s * (4 + r), y: body.y }, { x: body.x + s * 3, y: body.y + 1 }], armor ? p.metal[1] : p.cloth[1]);
      b.line({ x: body.x - 2, y: body.y - 3 }, { x: body.x + 2, y: body.y - 3 }, p.metal[3]);
    }
    near.forEach(leg);
    rig.arms.filter((a) => at(a.root).depth >= body.depth).forEach(drawArm);
    drawGear("middle");
    if (id === "fox" && !rig.grand?.tailFan) {
      const tail = at({ ...rig.pelvis, x: rig.pelvis.x - 12, y: Math.sin(rig.phase * Math.PI * 2) * 6, z: rig.pelvis.z - 4 });
      b.line({ x: pelvis.x, y: pelvis.y + 2 }, tail, OUT, 3);
      b.line({ x: pelvis.x, y: pelvis.y + 2 }, tail, p.skin[1], 2);
      b.oval(tail.x, tail.y, 2, 2, p.metal[3]);
    }
    paintGrandPixels(b, rig, at, p, "body");
    paintCapeMesh(b, rig, at, p, "near");
    const torsoBrush = b;
    if (rig.ragdoll) b = new PixelBrush();
    drawNativeFace(b, id, head, dir, p, rig);
    if (rig.form && ["knight", "orc", "elf", "caster", "wolf", "fox"].includes(rig.design)) {
      const armor = rig.formPath === "warden";
      for (const s of [-1, 1]) b.line({ x: head.x + s * 4, y: head.y - 5 }, { x: head.x + s * (armor ? 7 : 8), y: head.y - (armor ? 7 : 10) }, armor ? p.metal[2] : p.cloth[2], 1);
    }
    if (rig.ragdoll) {
      torsoBrush.rotated(b, head, headRoll);
      b = torsoBrush;
    }
    drawGear("near");
    paintGrandPixels(b, rig, at, p, "head");
    b.data.clipped = b.clipped;
    return b.data;
  }
  function drawGearPart(b, id, rig, angle, p, at, outlinedOval, weapon, shield) {
    if (weapon && rig.weapon) {
      const g = at(rig.weapon.grip), tip = at(rig.weapon.tip);
      if (["elf", "fox"].includes(id)) {
        const top = at({ ...rig.weapon.grip, x: rig.weapon.grip.x - 6, z: rig.weapon.grip.z + 24 }), bottom = at({ ...rig.weapon.grip, x: rig.weapon.grip.x - 6, z: rig.weapon.grip.z - 24 }), mid = g;
        b.line(top, mid, OUT, 1);
        b.line(mid, bottom, OUT, 1);
        b.line(top, mid, "#8c683d");
        b.line(mid, bottom, "#8c683d");
        b.dot(top.x, top.y, "#c8b17d");
        b.dot(bottom.x, bottom.y, "#c8b17d");
        const pull = rig.arms.find((a) => a.side === 1);
        if (rig.state === "attack" && rig.bowString?.draw > 0.05) {
          b.line(top, at(pull.end), p.metal[3]);
          b.line(at(pull.end), bottom, p.metal[3]);
        } else b.line(top, bottom, p.metal[3]);
        if (rig.bowString?.draw > 0.4) b.line(at(pull.end), { x: g.x + Math.cos(angle) * 7, y: g.y + Math.sin(angle) * 4 }, p.metal[2]);
      } else if (id === "caster") {
        b.line(g, tip, OUT, 1);
        b.line(g, tip, "#8a6342");
        const collar = { x: g.x + (tip.x - g.x) * 0.8, y: g.y + (tip.y - g.y) * 0.8 };
        b.oval(collar.x, collar.y, 1, 1, p.metal[2]);
        b.outlined([{ x: tip.x, y: tip.y - 3 }, { x: tip.x + 2, y: tip.y }, { x: tip.x, y: tip.y + 3 }, { x: tip.x - 2, y: tip.y }], "#4a95b0");
        b.rect(tip.x - 1, tip.y - 2, 2, 3, "#8bd2d4");
        b.dot(tip.x - 1, tip.y - 2, "#e6f3d9");
        if (rig.state === "cast") {
          const q = Math.round(rig.phase * 3);
          for (const dx of [-4 - q, 4 + q]) b.dot(tip.x + dx, tip.y - 2, "#a393e9");
          b.dot(tip.x, tip.y - 2 - Math.min(2, q), "#dfd9f7");
        }
      } else {
        const dx = tip.x - g.x, dy = tip.y - g.y, len = Math.hypot(dx, dy) || 1, tx = dx / len, ty = dy / len, nx = -ty, ny = tx;
        const q = (along, across) => ({ x: g.x + tx * along + nx * across, y: g.y + ty * along + ny * across });
        b.line(q(-2, 0), tip, OUT, 1);
        b.line(q(-2, 0), tip, id === "orc" ? "#9a744d" : p.metal[0]);
        b.line(q(-2, -0.5), q(2, -0.5), "#b6a077");
        if (rig.gear === "cannon") {
          b.line(g, tip, OUT, 3);
          b.line(g, tip, p.metal[1], 2);
          b.line(g, tip, p.metal[2], 1);
          b.oval(tip.x, tip.y, 2, 2, p.cloth[2]);
        } else if (["royal-hammer", "great-axe", "sunblade", "moonblade", "branch-club", "gauntlet"].includes(rig.gear)) {
          b.outlined([q(2, -2), q(len - 2, -4), q(len + 2, 0), q(len - 2, 4), q(2, 2)], p.metal[1]);
          b.line(q(3, -1), tip, p.metal[3], 1);
          if (rig.gear === "great-axe" || rig.gear === "royal-hammer") b.outlined([q(len - 5, -6), q(len + 2, -6), q(len + 4, 5), q(len - 5, 5)], p.metal[2]);
        } else if (rig.gear === "hammer" || rig.gear === "club") {
          const r = rig.gear === "hammer" ? 3 : 2;
          b.outlined([q(len - 3, -r), q(len + 1, -r), q(len + 2, r), q(len - 3, r)], rig.gear === "hammer" ? p.metal[1] : p.cloth[1]);
          b.line(q(len - 2, -r), q(len + 1, -r), p.metal[3]);
        } else if (rig.gear === "knife" || rig.gear === "rapier") {
          b.line(q(1, 0), tip, p.metal[3], rig.gear === "knife" ? 1 : 0);
          b.line(q(2, -2), q(2, 2), p.metal[1]);
        } else if (id === "orc") {
          const blade = (along, across) => ({ x: tip.x + tx * along + nx * across, y: tip.y + ty * along + ny * across });
          b.outlined([blade(-4, -2), blade(-5, -5), blade(-2, -6), blade(1, -5), blade(2, -2), blade(0, 2), blade(-2, 3), blade(-3, 1)], p.metal[0]);
          b.poly([blade(-4, -3), blade(-3, -5), blade(-1, -5), blade(1, -3), blade(0, 1), blade(-2, 2)], p.metal[1]);
          b.line(blade(-3, -5), blade(0, -4), p.metal[3]);
          b.line(blade(0, -4), blade(1, -1), p.metal[2]);
        } else {
          b.outlined([q(3, -1.4), q(len - 3, -1.1), q(len, 0), q(len - 3, 1.1), q(3, 1.4)], p.metal[1]);
          b.line(q(4, -0.7), tip, p.metal[3]);
          b.line(q(2, -2.5), q(2, 2.5), p.metal[0], 1);
          b.line(q(2, -2), q(2, 2), p.metal[2]);
          b.oval(q(-2, 0).x, q(-2, 0).y, 1, 1, p.metal[1]);
        }
      }
      for (const hand of rig.arms.filter((a) => a.side === (rig.weapon.hand === "left" ? -1 : 1) || id === "orc")) {
        const h = at(hand.end);
        outlinedOval(h.x, h.y, 1.2, 1.2, id === "knight" ? p.metal[1] : p.skin[1]);
        b.dot(h.x - 1, h.y - 1, id === "knight" ? p.metal[3] : p.skin[2]);
      }
    }
    if (shield && rig.shield) {
      const q = at(rig.shield.grip), w = 1.5 + Math.abs(Math.sin(angle)) * 2.5;
      b.outlined([{ x: q.x - w, y: q.y - 4 }, { x: q.x + w, y: q.y - 4 }, { x: q.x + w, y: q.y + 2 }, { x: q.x, y: q.y + 5 }, { x: q.x - w, y: q.y + 2 }], p.metal[2]);
      b.poly([{ x: q.x - w + 1, y: q.y - 3 }, { x: q.x + w - 1, y: q.y - 3 }, { x: q.x + w - 1, y: q.y + 1 }, { x: q.x, y: q.y + 4 }, { x: q.x - w + 1, y: q.y + 1 }], rig.back ? "#614735" : p.cloth[0]);
      if (rig.back) {
        b.line({ x: q.x, y: q.y - 2 }, { x: q.x, y: q.y + 2 }, "#b28f61", 1);
        b.rect(q.x - 1, q.y, 2, 1, p.metal[0]);
      } else if (w > 2) {
        b.poly([{ x: q.x - w + 2, y: q.y - 2 }, { x: q.x, y: q.y - 2 }, { x: q.x, y: q.y + 3 }, { x: q.x - w + 2, y: q.y + 1 }], p.cloth[1]);
        b.line({ x: q.x, y: q.y - 2 }, { x: q.x, y: q.y + 2 }, p.metal[3]);
        b.line({ x: q.x - 2, y: q.y }, { x: q.x + 2, y: q.y }, p.metal[3]);
      }
    }
  }

  // prototype-renderer.js
  var queue = null;
  var lastCalls = 0;
  function initializeCharacterRenderer() {
    return true;
  }
  function renderCharacterFrame(id, rig, angle) {
    const canvas2 = document.createElement("canvas");
    canvas2.width = CELL;
    canvas2.height = CELL;
    const pixels = paintCharacterPixels(id, rig, angle);
    canvas2.getContext("2d").putImageData(new ImageData(pixels, CELL, CELL), 0, 0);
    let top = CELL;
    rows: for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (pixels[(y * CELL + x) * 4 + 3]) {
      top = y;
      break rows;
    }
    canvas2.spriteTop = top;
    return canvas2;
  }
  function beginCharacterFrame() {
    queue = [];
  }
  function queueCharacter(id, rig, angle, x, y, scale, transform) {
    if (queue === null) return false;
    queue.push({ id, rig, angle, x: transform.a * x + transform.c * y + transform.e, y: transform.b * x + transform.d * y + transform.f, scale: scale * transform.a });
    return true;
  }
  function flushCharacterFrame(c2) {
    if (queue === null) return;
    lastCalls = queue.length;
    c2.save();
    c2.resetTransform();
    c2.imageSmoothingEnabled = false;
    for (const u of queue) {
      const frame2 = renderCharacterFrame(u.id, u.rig, u.angle), scale = PIXEL_WORLD * u.scale;
      c2.drawImage(frame2, Math.round(u.x - PIVOT.x * scale), Math.round(u.y - PIVOT.y * scale), CELL * scale, CELL * scale);
    }
    c2.restore();
    queue = null;
  }
  function characterRendererStats() {
    return { type: "Canvas2D", artStyle: "native 64x64 pixel chibi", nativeArena: [334, 218], nativePortrait: [64, 64], nearestNeighbor: true, antialias: false, facings: 8, arenaPasses: 1, drawCalls: lastCalls };
  }

  // prototype-sprites.js
  var FRAME_SIZE = CELL;
  var ROOT_Y = PIVOT.y;
  var RASTER_SCALE = 1;
  var MAX_FRAMES = 192;
  var frames = /* @__PURE__ */ new Map();
  var ready = false;
  var failed = false;
  function spritesReady() {
    if (!ready && !failed) {
      try {
        initializeCharacterRenderer();
        ready = true;
      } catch (error) {
        failed = true;
        window.dispatchEvent(new CustomEvent("prototype-render-error", { detail: error.message }));
      }
    }
    return ready;
  }
  function poseFrame(spec, state, phase, angle, stage = "", options = {}) {
    const rig = characterRig(spec.id, state, phase, stage, { ...options, stride: spec.stride });
    return renderCharacterFrame(spec.id, ["death", "knockdown", "getup"].includes(state) ? previewRagdoll(spec.id, phase, state === "getup") : rig, angle);
  }
  function spriteSample(u, time = 0, override = null) {
    const state = override?.state || animationState(u), dir = directionalFrame(u.facing || 0), angleIndex = dir;
    let phase = 0, stage = "", count = ["walk", "run", "sprint"].includes(state) ? 16 : 12;
    if (override) phase = override.phase;
    else if (["walk", "run", "sprint"].includes(state)) phase = (u.gait % 1 + 1) % 1;
    else if (["attack", "slash", "charge", "cast"].includes(state)) {
      const a = u.action;
      if (a && !a.released) {
        stage = "windup";
        phase = a.elapsed / a.windup;
        count = 16;
      } else {
        stage = "recovery";
        phase = a ? (a.elapsed - a.windup) / (a.duration - a.windup) : 0;
        count = 16;
      }
    } else if (state === "death") {
      phase = Math.min(1, u.deathTime / 0.95);
      count = 16;
    } else if (state === "dodge" || state === "dash") phase = u.roll ? u.roll.elapsed / u.roll.duration : 0;
    else if (state === "hit") phase = 1 - u.hitTime / 0.13;
    else if (state === "stagger") phase = 1 - u.stagger / 0.46;
    else if (state === "knockdown") phase = 1 - u.knockdown / 0.65;
    else if (state === "getup") phase = 1 - u.getup / 0.45;
    else if (state === "stop") phase = 1 - u.stopTime / 0.24;
    else if (state === "turn") phase = u.turnTime > 0 ? 1 - u.turnTime / 0.32 : time % 1;
    else phase = time * 0.65 % 1;
    if (override && ["attack", "slash", "charge", "cast"].includes(state)) {
      if (override.stage) stage = override.stage;
      else {
        stage = phase < 0.5 ? "windup" : "recovery";
        phase = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
      }
      count = 16;
    }
    const index = clamp(Math.floor(phase * count), 0, count - 1), foot = u.transitionFoot, weight = foot && !override ? Math.max(0, 1 - (time - foot.time) / (foot.duration || 0.2)) : 0;
    const transition = weight > 0 && foot.moving > 0.1 ? { gait: foot.gait % 1, weight, motion: Math.min(1, foot.moving / 0.5), runBlend: foot.runBlend || 0, sprintBlend: foot.sprintBlend || 0 } : null;
    const motion = override ? 1 : Math.round(clamp((u.moving || 0) / 0.5, 0, 1) * 8) / 8;
    const runBlend = override ? ["run", "sprint"].includes(state) ? 1 : 0 : Math.round(clamp(u.runBlend || 0, 0, 1) * 12) / 12;
    const sprintBlend = override ? state === "sprint" ? 1 : 0 : Math.round(clamp(u.sprintBlend || 0, 0, 1) * 12) / 12;
    const acceleration = override ? 0 : Math.round((u.acceleration || 0) * 8) / 8;
    const feet = override ? null : localFootContacts({ ...u, facing: angleIndex * Math.PI / 4 })?.map((f) => ({ x: Math.round(f.x * 2) / 2, y: Math.round(f.y * 2) / 2, z: Math.round(f.z * 2) / 2, angle: Math.round(f.angle * 8) / 8 }));
    const movementAngle = override ? 0 : Math.round(Math.atan2(Math.sin((u.moveFacing ?? u.facing) - u.facing), Math.cos((u.moveFacing ?? u.facing) - u.facing)) * 8) / 8;
    const rollAngle = u.roll ? Math.atan2(u.roll.dy, u.roll.dx) - (u.facing || 0) : state === "dodge" ? Math.PI / 2 : 0;
    const cape = override ? null : u.cape?.map((p) => Math.round(p.angle * 8) / 8);
    const swing = state === "slash" ? "side" : u.action?.style || "overhead", charged = state === "charge", anticipation = u.action?.anticipation || (charged ? 3 : u.id === "orc" ? 2 : 1);
    const key = [u.id, state, angleIndex, stage, index, motion, runBlend, sprintBlend, acceleration, movementAngle, rollAngle, swing, anticipation, transition ? transition.gait + ":" + transition.weight : "", feet ? JSON.stringify(feet) : "", cape ? cape.join(",") : ""].join(":");
    return { state, dir, angleIndex, index, phase: ["walk", "run", "sprint"].includes(state) ? index / count : index / (count - 1), stage, transition, motion, runBlend, sprintBlend, acceleration, movementAngle, rollAngle, feet, cape, swing, charged, anticipation, key };
  }
  function drawPrototypeSprite(c2, u, x, y, time = 0, scale = 1, override = null) {
    if (!spritesReady()) return;
    const s = spriteSample(u, time, override);
    let rig = characterRig(u.id, s.state, s.phase, s.stage, { ...s, stride: PROTOTYPE_BY_ID[u.id].stride });
    rig.cape = s.cape;
    if (u.ragdoll && !override) rig = ragdollRig(u.ragdoll, u.getup > 0 ? 1 - u.getup / 0.45 : 0);
    else if (override && ["death", "knockdown", "getup"].includes(s.state)) rig = previewRagdoll(u.id, s.phase, s.state === "getup");
    if (queueCharacter(u.id, rig, s.angleIndex * Math.PI / 4, x, y, scale, c2.getTransform())) return;
    let frame2 = frames.get(s.key);
    if (!frame2) {
      frame2 = poseFrame(PROTOTYPE_BY_ID[u.id], s.state, s.phase, s.angleIndex * Math.PI / 4, s.stage, s);
      frames.set(s.key, frame2);
      if (frames.size > MAX_FRAMES) frames.delete(frames.keys().next().value);
    }
    c2.save();
    c2.globalAlpha *= u.hp <= 0 ? 0.82 : 1;
    c2.imageSmoothingEnabled = false;
    const drawScale = scale * PIXEL_WORLD;
    c2.drawImage(frame2, Math.round(x - FRAME_SIZE * drawScale / 2), Math.round(y - ROOT_Y * drawScale), FRAME_SIZE * drawScale, FRAME_SIZE * drawScale);
    c2.restore();
  }
  function spriteCacheStats() {
    return { frames: frames.size, maxFrames: MAX_FRAMES, sourceReady: spritesReady(), frameSize: FRAME_SIZE, rasterScale: RASTER_SCALE, rigVersion: 7, directionalArt: { columns: 8, characters: PROTOTYPE_CHARACTERS.length, nativeCell: [64, 64] }, renderer: characterRendererStats() };
  }
  function prototypeDirectionFrames(id, state = "idle", phase = 0.25) {
    return Array.from({ length: 8 }, (_, dir) => {
      const canvas2 = document.createElement("canvas");
      canvas2.width = FRAME_SIZE;
      canvas2.height = FRAME_SIZE;
      drawPrototypeSprite(canvas2.getContext("2d"), { id, facing: dir * Math.PI / 4, hp: 1, gait: 0 }, FRAME_SIZE / 2, ROOT_Y, 0, 1 / PIXEL_WORLD, { state, phase });
      return canvas2.toDataURL();
    });
  }
  function prototypePortrait(id) {
    const canvas2 = document.createElement("canvas");
    canvas2.width = 128;
    canvas2.height = 128;
    drawPrototypeSprite(canvas2.getContext("2d"), { id, facing: Math.PI / 4, hp: 1, gait: 0 }, 64, 88, 0, 2 / 3);
    return canvas2.toDataURL();
  }

  // prototype-export.js
  var DIRECTIONS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
  var FRAME_COUNTS = 8;
  var LOOP_STATES = ["idle", "walk", "run", "sprint", "turn"];
  var FPS = { idle: 6, walk: 10, run: 14, sprint: 18, turn: 12, attack: 12, slash: 12, charge: 6, cast: 10, dash: 24, dodge: 24, hit: 30, stagger: 18, knockdown: 10, getup: 18, stop: 24, death: 10 };
  function exportPixels(id, state, phase, dir) {
    const spec = PROTOTYPE_BY_ID[id];
    let stage = "", time = phase;
    if (["attack", "slash", "charge", "cast"].includes(state)) {
      const windup = state === "charge" ? Math.max(0.85, spec.windup * 2.4) : spec.windup, recovery = spec.recovery * (state === "charge" ? 1.15 : 1), split = windup / (windup + recovery);
      stage = phase < split ? "windup" : "recovery";
      time = phase < split ? phase / split : (phase - split) / (1 - split);
    }
    const rig = ["death", "knockdown", "getup"].includes(state) ? previewRagdoll(id, phase, state === "getup") : characterRig(id, state, time, stage, { stride: spec.stride });
    return paintCharacterPixels(id, rig, dir * Math.PI / 4);
  }
  function exportAtlas(id) {
    const canvas2 = document.createElement("canvas"), columns = 16, frames2 = ANIMATION_STATES.length * 8 * FRAME_COUNTS;
    canvas2.width = columns * CELL;
    canvas2.height = Math.ceil(frames2 / columns) * CELL;
    const c2 = canvas2.getContext("2d"), animations = [], issues = [];
    let index = 0;
    for (const state of ANIMATION_STATES) for (let dir = 0; dir < 8; dir++) {
      const cells = [];
      for (let frame2 = 0; frame2 < FRAME_COUNTS; frame2++) {
        const phase = frame2 / (LOOP_STATES.includes(state) ? FRAME_COUNTS : FRAME_COUNTS - 1), pixels = exportPixels(id, state, phase, dir), x = index % columns * CELL, y = Math.floor(index / columns) * CELL;
        if (pixels.clipped) issues.push({ state, dir, frame: frame2, clipped: pixels.clipped });
        c2.putImageData(new ImageData(pixels, CELL, CELL), x, y);
        cells.push({ x, y, width: CELL, height: CELL });
        index++;
      }
      animations.push({ name: state + "_" + DIRECTIONS[dir], state, direction: DIRECTIONS[dir], fps: FPS[state], loop: LOOP_STATES.includes(state), frames: cells });
    }
    return { image: canvas2.toDataURL("image/png"), id, cell: [64, 64], pivot: [32, 44], width: canvas2.width, height: canvas2.height, animations, issues };
  }

  // sound.js
  var Soundscape = class {
    constructor() {
      this.context = null;
      this.enabled = false;
      this.lastEffect = -10;
      this.beat = -1;
      this.noise = null;
    }
    init() {
      if (this.context) return;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      this.context = new Audio();
      this.master = this.context.createGain();
      this.master.gain.value = 0.22;
      const compressor = this.context.createDynamicsCompressor();
      this.master.connect(compressor);
      compressor.connect(this.context.destination);
      this.noise = this.context.createBuffer(
        1,
        this.context.sampleRate * 0.5,
        this.context.sampleRate
      );
      const channel = this.noise.getChannelData(0);
      let seed = 17;
      for (let i = 0; i < channel.length; i++) {
        seed = seed * 1664525 + 1013904223 >>> 0;
        channel[i] = seed / 4294967296 * 2 - 1;
      }
    }
    setEnabled(enabled) {
      this.enabled = enabled;
      if (this.context)
        this.master.gain.setTargetAtTime(
          enabled ? 0.22 : 0,
          this.context.currentTime,
          0.03
        );
    }
    begin(planet, enabled) {
      this.setEnabled(enabled);
      if (!enabled) return;
      this.init();
      this.context?.resume();
      this.beat = -1;
    }
    tone(frequency, duration = 0.18, type = "sine", volume = 0.2, delay = 0, slide = 1) {
      if (!this.context || !this.enabled) return;
      const t = this.context.currentTime + delay, osc = this.context.createOscillator(), gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, t);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, frequency * slide),
        t + duration
      );
      gain.gain.setValueAtTime(1e-4, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(1e-3, volume), t + 8e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    }
    hiss(frequency, duration = 0.16, volume = 0.18) {
      if (!this.context || !this.enabled) return;
      const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain(), t = this.context.currentTime;
      source.buffer = this.noise;
      filter.type = "bandpass";
      filter.frequency.value = frequency;
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(t);
      source.stop(t + duration);
    }
    event(event) {
      if (!this.enabled || !this.context) return;
      const time = this.context.currentTime;
      if (time - this.lastEffect < 0.075 && !["death", "phase", "capture"].includes(event.type))
        return;
      this.lastEffect = time;
      if (event.type === "death") {
        this.tone(160, 0.4, "triangle", 0.18, 0, 0.3);
        this.hiss(250, 0.3, 0.16);
        return;
      }
      if (event.type === "phase") {
        [65, 98, 130].forEach(
          (f, i) => this.tone(f, 0.8, "triangle", 0.2, i * 0.09, 0.7)
        );
        return;
      }
      if (event.type === "capture") {
        this.action("capture");
        return;
      }
      const heavy = event.type === "crit" || event.type === "skill", volume = heavy ? 0.24 : 0.12, element = event.element;
      if (element === "ember") {
        this.hiss(700, heavy ? 0.25 : 0.1, volume);
        this.tone(95, 0.12, "triangle", volume, 0, 0.45);
      } else if (element === "tide") {
        this.tone(420, 0.17, "sine", volume, 0, 1.8);
        this.hiss(1700, 0.12, volume * 0.4);
      } else if (element === "storm") {
        this.hiss(3800, 0.08, volume);
        this.tone(820, 0.11, "sawtooth", volume * 0.3, 0, 0.25);
      } else if (element === "grove") {
        this.hiss(350, 0.11, volume);
        this.tone(150, 0.12, "triangle", volume, 0, 0.5);
      } else {
        this.tone(90, 0.22, "sine", volume, 0, 0.45);
        this.tone(260, 0.18, "triangle", volume * 0.4, 0, 0.55);
      }
      if (heavy) this.tone(55, 0.14, "sine", 0.24, 0, 0.6);
    }
    update(time, planet) {
      if (!this.enabled || !this.context) return;
      const beat = Math.floor(time / 0.55);
      if (beat === this.beat) return;
      this.beat = beat;
      const root = [130.81, 110, 98][planet], scale = [0, 3, 7, 10, 7, 3, 5, 7], note = root * 2 ** (scale[beat % 8] / 12);
      this.tone(note, 0.35, "triangle", 0.035);
      if (beat % 4 === 0) {
        this.tone(root / 2, 0.55, "sine", 0.12);
        this.hiss(90, 0.13, 0.09);
      }
      if (beat % 8 === 0)
        [0, 7, 12].forEach(
          (n) => this.tone(root * 2 ** (n / 12), 1.3, "sine", 0.028)
        );
    }
    action(kind) {
      this.enabled = true;
      this.init();
      if (!this.context) return;
      this.setEnabled(true);
      this.context.resume();
      const notes = {
        start: [196, 293, 392],
        win: [392, 493, 587, 784],
        loss: [220, 196],
        capture: [523, 659, 784, 1046],
        buy: [440, 660]
      };
      (notes[kind] || [330]).forEach(
        (f, i) => this.tone(f, 0.26, "triangle", 0.12, i * 0.1)
      );
    }
  };

  // prototype.js
  var $ = (s) => document.querySelector(s);
  var canvas = $("#prototype-canvas");
  var display = canvas.getContext("2d");
  var sceneCanvas = document.createElement("canvas");
  sceneCanvas.width = 1002;
  sceneCanvas.height = 654;
  var c = sceneCanvas.getContext("2d");
  var pixelCanvas = document.createElement("canvas");
  var backdropPixels = document.createElement("canvas");
  backdropPixels.width = 334;
  backdropPixels.height = 218;
  var backdrop = new Image();
  backdrop.src = "/public/prototype-glade-pixel.png";
  backdrop.addEventListener("load", () => {
    const b = backdropPixels.getContext("2d");
    b.imageSmoothingEnabled = false;
    b.drawImage(backdrop, 0, 0, 334, 218);
  });
  backdrop.addEventListener("error", () => {
    $("#loading").textContent = "The artwork could not load. Reload this page.";
  });
  var sound = new Soundscape();
  var mode = "directions";
  var arena = new PrototypeArena(mode);
  var selected = "0-knight-0";
  var paused = false;
  var speed = 1;
  var last = performance.now();
  var uiClock = 0;
  var sounding = false;
  var pose = "idle";
  var poseFacing = 0;
  var labels = true;
  var telegraphs = true;
  var artLoaded = false;
  var focusView = false;
  var heldSprintUid = null;
  var directions = ["East", "Southeast", "South", "Southwest", "West", "Northwest", "North", "Northeast"];
  var descriptions = { knight: "Silver plate, a measured stride, and a committed sword strike. Aurel resists displacement and recovers deliberately.", orc: "A broad stance and a slower, heavier axe swing. Brakk hits hard, but a missed windup leaves an opening.", elf: "Light footsteps, a drawn bow, and aimed arrows. Syl creates distance; released arrows keep their original path.", caster: "Silver hair, a flowing purple cape, a planted casting stance, and a visible channel. Nyra releases an arcane bolt at the end of the windup.", wolf: "A four-legged hound with front paws, rear hocks, a diagonal trot and a bounding gallop. Ember closes on the backline and changes direction quickly.", fox: "A fox ranger with short limbs, a forest cape, springy steps and a drawn shortbow.", mech: "Six metal legs step in alternating tripods beneath a brass reactor and physical cannon.", spider: "Eight articulated legs scuttle in alternating support groups. Luminous eyes and fangs lead each turn.", jelly: "A moon jelly has no artificial limbs: it compresses, hops and reforms, throwing globules after a channel." };
  function selectedUnit() {
    return arena.units.find((u) => u.uid === selected) || arena.units[0];
  }
  function selectedId() {
    return selectedUnit().id;
  }
  function studyPose(u) {
    if (["attack", "slash", "charge", "cast"].includes(pose)) {
      const windup = pose === "charge" ? Math.max(0.85, u.windup * 2.4) : u.windup, recovery = u.recovery * (pose === "charge" ? 1.15 : 1), elapsed = arena.time % (windup + recovery);
      return { state: pose, phase: elapsed < windup ? elapsed / windup : (elapsed - windup) / recovery, stage: elapsed < windup ? "windup" : "recovery" };
    }
    const duration = pose === "walk" ? u.stride / u.speed : pose === "run" ? locomotionStride(u.stride, 1, 0, u.id) / u.run : pose === "sprint" ? locomotionStride(u.stride, 1, 1, u.id) / u.sprint : pose === "dash" ? 0.34 : pose === "dodge" ? 0.29 : pose === "hit" ? 0.13 : pose === "stagger" ? 0.46 : pose === "death" || pose === "knockdown" ? 0.95 : pose === "getup" ? 0.45 : pose === "stop" ? 0.24 : pose === "turn" ? 0.32 : 1.8;
    return { state: pose, phase: pose === "death" ? Math.min(1, arena.time / duration) : arena.time / duration % 1 };
  }
  function chooseUnit(uid) {
    selected = uid;
    updateUI();
    const r = canvas.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) canvas.scrollIntoView({ block: "center" });
  }
  function makeCards() {
    const companions = arena.units.filter((u) => u.side === 0);
    $("#roster-select").innerHTML = companions.map((s) => `<option value="${s.uid}">${s.name}</option>`).join("");
    $("#character-cards").innerHTML = companions.map((s) => `<button class="character-card ${selected === s.uid ? "active" : ""}" data-select="${s.uid}"><img src="${spritesReady() ? prototypePortrait(s.id) : ""}" alt="${s.name}"><span class="role">${s.role.toUpperCase()}</span><strong>${s.name.split(" \xB7 ")[0]}</strong><small>${s.id === "wolf" ? "Four-legged hound" : s.name.split(" \xB7 ")[1]}</small><div class="stats"><span>${s.mass.toFixed(1)} mass</span><span class="card-state">Ready</span></div><div class="hp-track"><i style="width:100%"></i></div><small class="card-health">${s.hp} / ${s.hp} HP</small></button>`).join("");
  }
  function changeMode(next) {
    heldSprintUid = null;
    const id = selectedId();
    mode = next;
    arena = new PrototypeArena(mode);
    selected = (arena.units.find((u) => u.id === id && u.side === 0) || arena.units[0]).uid;
    makeCards();
    $("#result").hidden = true;
    $("#pose-controls").hidden = !["study", "directions"].includes(mode);
    $("#facing-control").hidden = mode === "directions";
    $("#focus-view").disabled = mode === "directions";
    $("#locomotion-controls").hidden = mode !== "movement";
    for (const b of document.querySelectorAll("[data-scene]")) {
      b.classList.toggle("active", b.dataset.scene === mode);
      b.setAttribute("aria-pressed", b.dataset.scene === mode);
    }
    $("#scene-title").textContent = mode === "battle" ? "THE OLD COURTYARD" : mode === "movement" ? "THE LONG WAY AROUND" : mode === "directions" ? "ONE CHARACTER. EIGHT VIEWS." : "A STUDY IN MOTION";
    $("#scene-status").textContent = mode === "battle" ? "Six companions \xB7 six challengers \xB7 new lineup each round" : mode === "movement" ? "Walk \xB7 run \xB7 sprint" : mode === "directions" ? "Click a view to inspect it up close" : "Seventeen states \xB7 eight directions";
    updateUI();
  }
  function updateUI() {
    const u = selectedUnit(), spec = PROTOTYPE_BY_ID[u.id];
    $("#roster-select").value = u.uid;
    $("#inspect-name").textContent = spec.name;
    $("#inspect-role").textContent = spec.role.toUpperCase();
    $("#inspect-description").textContent = descriptions[u.id];
    for (const card of document.querySelectorAll("[data-select]")) {
      const unit2 = arena.units.find((u2) => u2.uid === card.dataset.select);
      if (!unit2) continue;
      card.classList.toggle("active", unit2.uid === selected);
      card.setAttribute("aria-pressed", unit2.uid === selected);
      card.querySelector(".card-state").textContent = ["study", "directions"].includes(mode) ? pose : animationState(unit2);
      card.querySelector(".hp-track i").style.width = Math.max(0, unit2.hp / unit2.maxHp * 100) + "%";
      card.querySelector(".card-health").textContent = `${Math.ceil(unit2.hp)} / ${unit2.maxHp} HP`;
    }
    for (const b of document.querySelectorAll(".action-buttons button")) b.disabled = mode !== "battle" || u.hp <= 0 || arena.done;
    $("#order-charge").disabled = mode !== "battle" || u.hp <= 0 || arena.done || u.ranged || u.stamina < 28 || Boolean(u.action);
    $("#order-charge").textContent = u.chargeRequested ? "Charge queued" : "Charged strike";
    const anticipation = u.action ? ANTICIPATION_LEVELS[u.action.anticipation] : null;
    $("#anticipation-status").textContent = anticipation ? `${anticipation.name} \xB7 ${u.action.released ? "recovery" : "windup"} \xB7 ${u.action.charged ? "takes damage, resists stun" : ""}` : "Quick \xB7 Heavy \xB7 Charged \u2014 every third melee strike charges";
    const sprintOn = u.sprintRequested || mode === "movement" && arena.locomotion === "sprint";
    $("#order-sprint").disabled = !["battle", "movement"].includes(mode) || u.hp <= 0 || arena.done || !sprintOn && u.stamina < 25;
    $("#order-sprint").title = u.stamina < 25 && !sprintOn ? "Recover to 25 stamina to sprint" : "Toggle sprint for the selected companion";
    $("#order-sprint").textContent = sprintOn ? "Stop sprint" : "Sprint";
    $("#order-sprint").setAttribute("aria-pressed", sprintOn);
    $("#stamina-meter").value = u.stamina;
    $("#sprint-status").textContent = u.sprintExhausted && sprintOn ? "Winded \xB7 release and restart after recovery" : u.sprintActive ? "Sprinting \xB7 stamina " + Math.ceil(u.stamina) : "Stamina " + Math.ceil(u.stamina) + " \xB7 sprint costs 20/s";
    for (const b of document.querySelectorAll("[data-pace]")) {
      b.classList.toggle("active", b.dataset.pace === arena.locomotion);
      b.setAttribute("aria-pressed", b.dataset.pace === arena.locomotion);
    }
    $("#scene-clock").textContent = `${String(Math.floor(arena.time / 60)).padStart(2, "0")}:${String(Math.floor(arena.time % 60)).padStart(2, "0")}`;
    $("#contact-count").textContent = `${arena.metrics.hits} CONTACTS \xB7 ${arena.metrics.misses} MISSES`;
    const facing = mode === "directions" ? "All eight views" : directions[mode === "study" ? poseFacing : directionalFrame(u.facing)];
    $("#facing-status").textContent = `${spec.name.split(" \xB7 ")[0]} \xB7 ${facing}`;
    const events = arena.events.filter((e) => ["contact", "miss", "interrupt", "death", "dodge", "armor"].includes(e.type)).slice(-5).reverse();
    const name = (uid) => arena.units.find((u2) => u2.uid === uid)?.name.split(" \xB7 ")[0] || "target";
    $("#event-feed").innerHTML = events.map((e) => `<li><time>${e.time.toFixed(1)}s</time>${e.type === "contact" ? `${name(e.uid)} connects with ${name(e.targetUid)} \xB7 ${Math.round(e.damage)} damage` : e.type === "miss" ? `${name(e.uid)} misses the committed attack` : e.type === "interrupt" ? `${name(e.uid)} is staggered; the windup breaks` : e.type === "death" ? `${name(e.uid)} falls` : e.type === "armor" ? `${name(e.uid)} holds the charged strike through impact` : `${name(e.uid)} dodges an aimed threat`}</li>`).join("") || "<li>Contact events appear here during the sparring match.</li>";
    if (arena.done && mode === "battle") {
      $("#result").hidden = false;
      $("#result").innerHTML = `<strong>${arena.winner === 0 ? "The companions prevail." : "The challengers prevail."}</strong><p>${arena.metrics.hits} hits \xB7 ${arena.metrics.rolls} rolls \xB7 ${arena.metrics.interrupts} interruptions</p><button data-replay>Another round \u2192</button>`;
    }
  }
  function ellipse(x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }
  function background() {
    if (backdrop.complete && backdrop.naturalWidth) {
      for (let row = -1; row <= 1; row++) for (let col = -1; col <= 1; col++) {
        c.save();
        c.imageSmoothingEnabled = false;
        c.translate((col === 0 ? 0 : col + 1) * 1e3, (row === 0 ? 0 : row + 1) * 650);
        c.scale(col === 0 ? 1 : -1, row === 0 ? 1 : -1);
        c.drawImage(backdropPixels, 0, 0, 1e3, 650);
        c.restore();
      }
    } else {
      const g = c.createLinearGradient(0, 0, 0, 650);
      g.addColorStop(0, "#273d2c");
      g.addColorStop(0.6, "#65734a");
      g.addColorStop(1, "#31412c");
      c.fillStyle = g;
      c.fillRect(0, 0, 1e3, 650);
      c.fillStyle = "#9a976f";
      c.beginPath();
      c.ellipse(500, 345, 420, 255, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#343f2977";
      c.lineWidth = 1;
      for (let y = 120; y < 610; y += 38) for (let x = 70; x < 940; x += 65) c.strokeRect(x + Math.floor(y / 38) % 2 * 30, y, 63, 36);
    }
    const vignette = c.createRadialGradient(500, 330, 220, 500, 330, 660);
    vignette.addColorStop(0, "#14211900");
    vignette.addColorStop(1, "#0b181abb");
    c.fillStyle = vignette;
    c.fillRect(0, 0, 1e3, 650);
    for (let i = 0; i < 18; i++) ellipse(i * 137 % 1e3 + Math.sin(arena.time * 0.18 + i) * 5, 100 + i * 53 % 470 + Math.sin(arena.time * 0.23 + i) * 7, 1, 1, "#edd99b55");
  }
  function drawScene() {
    c.clearRect(0, 0, 1002, 654);
    c.save();
    if (spritesReady()) beginCharacterFrame();
    if (mode === "directions") {
      background();
      const u = selectedUnit();
      for (let dir = 0; dir < 8; dir++) {
        const x = 125 + dir % 4 * 250, y = 285 + Math.floor(dir / 4) * 282;
        c.fillStyle = "#101e18aa";
        c.strokeStyle = "#a3b98c35";
        c.lineWidth = 1;
        c.beginPath();
        c.roundRect(x - 109, y - 221, 218, 260, 8);
        c.fill();
        c.stroke();
        ellipse(x, y, u.id === "wolf" ? 41 : 27, 9, "#091811aa");
        drawPrototypeSprite(c, { ...u, facing: dir * Math.PI / 4, hp: pose === "death" ? 0 : u.hp }, x, y, arena.time, 2, studyPose(u));
        c.textAlign = "center";
        c.fillStyle = "#e4e9cf";
        c.font = "13px system-ui";
        c.fillText(directions[dir].toUpperCase(), x, y + 25);
      }
      flushCharacterFrame(c);
      c.restore();
      return;
    }
    if (focusView) {
      const p = groundToScreen(selectedUnit().x, selectedUnit().y);
      c.translate(500, 370);
      c.scale(2, 2);
      c.translate(-p.x, -p.y);
    }
    background();
    c.save();
    if (arena.shake && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) c.translate(Math.sin(arena.time * 92) * arena.shake, Math.cos(arena.time * 71) * arena.shake * 0.6);
    if (mode === "movement") {
      c.strokeStyle = "#e4d9ad30";
      c.lineWidth = 1;
      c.setLineDash([3, 8]);
      for (let i = 0; i < PROTOTYPE_CHARACTERS.length; i++) {
        const center = circuitCenter(i), p = groundToScreen(center.x, center.y);
        c.beginPath();
        c.ellipse(p.x, p.y, 45, 52, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.setLineDash([]);
    }
    const live = arena.units.slice().sort((a, b) => a.y - b.y);
    for (const u of live) {
      const p = groundToScreen(u.x, u.y);
      ellipse(p.x, p.y + 1, u.id === "wolf" ? 27 : u.radius * 0.88, 6, u.hp <= 0 ? "#0a131b40" : "#0a131b75");
      if (u.uid === selected && u.hp > 0) {
        c.strokeStyle = "#d7e4a6aa";
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(p.x, p.y, u.radius + 9, (u.radius + 9) * 0.38, 0, 0, Math.PI * 2);
        c.stroke();
      }
      if (u.order && arena.time < u.manualUntil && u.uid === selected) {
        const q = groundToScreen(u.order.x, u.order.y);
        c.strokeStyle = "#d9d9a477";
        c.setLineDash([3, 5]);
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(q.x, q.y);
        c.stroke();
        c.setLineDash([]);
        c.beginPath();
        c.ellipse(q.x, q.y, 8, 4, 0, 0, Math.PI * 2);
        c.stroke();
      }
    }
    if (telegraphs) {
      for (const u of live) if (u.action && !u.action.released && !u.ranged) {
        const a = u.action, p = groundToScreen(u.x, u.y), progress = a.elapsed / a.windup;
        c.save();
        c.translate(p.x, p.y);
        c.scale(1, 0.58);
        c.strokeStyle = ANTICIPATION_LEVELS[a.anticipation].color;
        c.fillStyle = a.charged ? "#7fc8dc30" : u.side ? "#d86b5422" : "#e2cf8d17";
        c.lineWidth = a.anticipation + progress * 2;
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, u.reach, a.angle - 0.7, a.angle + 0.7);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
    }
    for (const u of live) {
      const x = u.px + (u.x - u.px) * arena.alpha, y = u.py + (u.y - u.py) * arena.alpha, p = groundToScreen(x, y);
      const override = mode === "study" ? studyPose(u) : null;
      const renderUnit = mode === "study" ? { ...u, facing: poseFacing * Math.PI / 4, hp: pose === "death" ? 0 : u.hp } : { ...u, x, y };
      drawPrototypeSprite(c, renderUnit, p.x, p.y, arena.time, 1, override);
      if (u.hp > 0 && mode === "battle") {
        const barY = p.y - { knight: 112, orc: 98, elf: 100, caster: 125, fox: 113, wolf: 84, mech: 80, spider: 80, jelly: 90 }[u.id];
        c.fillStyle = "#12201a";
        c.fillRect(p.x - 21, barY, 42, 4);
        c.fillStyle = u.side ? "#ce8979" : "#bcd796";
        c.fillRect(p.x - 20, barY + 1, 40 * u.hp / u.maxHp, 2);
        c.fillStyle = "#d4b47466";
        c.fillRect(p.x - 20, barY + 6, 40 * u.stamina / 100, 1.5);
        if (u.action && !u.action.released) {
          c.fillStyle = ANTICIPATION_LEVELS[u.action.anticipation].color;
          c.fillRect(p.x - 20, barY + 10, 40 * u.action.elapsed / u.action.windup, 2);
          for (let level = 0; level < u.action.anticipation; level++) c.fillRect(p.x - 4 + level * 4, barY - 5, 2, 2);
        }
      }
      if (labels && u.side === 0 && u.hp > 0) {
        c.font = "10px system-ui";
        c.textAlign = "center";
        c.fillStyle = "#ebebd2";
        c.shadowColor = "#0c2117";
        c.shadowBlur = 4;
        c.fillText(u.name.split(" \xB7 ")[0], p.x, p.y + 19);
        c.font = "8px system-ui";
        c.fillText(directions[mode === "study" ? poseFacing : directionalFrame(u.facing)], p.x, p.y + 31);
        c.shadowBlur = 0;
      }
    }
    flushCharacterFrame(c);
    for (const p of arena.projectiles) {
      const q = groundToScreen(p.x, p.y), angle = Math.atan2(p.vy * 0.58, p.vx);
      c.save();
      c.translate(q.x, q.y - p.z);
      c.rotate(angle);
      if (p.kind === "arrow") {
        c.strokeStyle = "#e3c39b";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-17, 0);
        c.lineTo(7, 0);
        c.stroke();
        c.fillStyle = "#e5e8d9";
        c.beginPath();
        c.moveTo(10, 0);
        c.lineTo(3, -3);
        c.lineTo(3, 3);
        c.fill();
      } else {
        c.shadowColor = "#8ed7fa";
        c.shadowBlur = 12;
        ellipse(0, 0, 6, 4, "#e0fcff");
        c.shadowBlur = 0;
        c.strokeStyle = "#8cbeeaaa";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-22, 0);
        c.lineTo(-7, 0);
        c.stroke();
      }
      c.restore();
    }
    for (const e of arena.effects) {
      const p = groundToScreen(e.x, e.y), f = e.age / e.duration;
      c.save();
      c.globalAlpha = 1 - f;
      if (e.kind === "slash") {
        c.translate(p.x, p.y - e.z);
        c.scale(1, 0.58);
        c.strokeStyle = e.color;
        c.lineWidth = e.heavy ? 6 : 3;
        c.lineCap = "round";
        c.beginPath();
        c.arc(0, 0, e.reach * 0.65, e.angle - 1.15 + f * 0.5, e.angle + 0.6 + f * 0.5);
        c.stroke();
      } else if (e.kind === "impact") {
        c.translate(p.x, p.y - e.z);
        c.rotate(e.age * 5);
        c.strokeStyle = e.color;
        c.lineWidth = e.heavy ? 3 : 2;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          c.moveTo(Math.cos(a) * (4 + f * 15), Math.sin(a) * (4 + f * 15));
          c.lineTo(Math.cos(a) * (13 + f * 22), Math.sin(a) * (13 + f * 22));
        }
        c.stroke();
      } else if (e.kind === "number") {
        c.font = "bold 12px Georgia";
        c.fillStyle = e.color;
        c.textAlign = "center";
        c.shadowColor = "#14241c";
        c.shadowBlur = 3;
        c.fillText(e.text, p.x, p.y - e.z - e.age * 21);
      }
      c.restore();
    }
    for (const particle of arena.particles) {
      const p = groundToScreen(particle.x, particle.y);
      c.globalAlpha = 1 - particle.age / particle.duration;
      ellipse(p.x, p.y - particle.z, 1.8, 1.8, particle.color);
    }
    c.globalAlpha = 1;
    c.restore();
    c.restore();
  }
  function render() {
    drawScene();
    const zoom = focusView && mode !== "directions" ? 2 : 1, w = Math.round(334 / zoom), h = Math.round(218 / zoom);
    if (pixelCanvas.width !== w || pixelCanvas.height !== h) {
      pixelCanvas.width = w;
      pixelCanvas.height = h;
    }
    const p = pixelCanvas.getContext("2d");
    p.imageSmoothingEnabled = false;
    p.drawImage(sceneCanvas, 0, 0, w, h);
    display.imageSmoothingEnabled = false;
    display.clearRect(0, 0, 1002, 654);
    display.drawImage(pixelCanvas, 0, 0, 1002, 654);
  }
  var showcase = $("#hero-showcase").getContext("2d");
  var animationShowcase = $("#animation-showcase").getContext("2d");
  function renderShowcase(force = false) {
    if (!force) {
      const a = showcase.canvas.getBoundingClientRect(), b = animationShowcase.canvas.getBoundingClientRect();
      if ((a.top > innerHeight || a.bottom < 0) && (b.top > innerHeight || b.bottom < 0)) return;
    }
    showcase.clearRect(0, 0, 1e3, 610);
    showcase.fillStyle = "#13231f";
    showcase.fillRect(0, 0, 1e3, 610);
    showcase.imageSmoothingEnabled = false;
    showcase.font = "14px system-ui";
    showcase.textAlign = "center";
    showcase.fillStyle = "#d8d4b1";
    ["FRONT", "RIGHT", "BACK", "LEFT"].forEach((name, i) => showcase.fillText(name, 330 + i * 175, 28));
    HERO_IDS.forEach((id, index) => {
      const y = 145 + index * 110, spec = PROTOTYPE_BY_ID[id];
      showcase.textAlign = "left";
      showcase.fillStyle = "#d8d4b1";
      showcase.fillText(spec.name.split(" \xB7 ")[1].toUpperCase(), 24, y - 45);
      showcase.font = "11px system-ui";
      showcase.fillStyle = "#859b87";
      showcase.fillText("64 \xD7 64 \xB7 4 views", 24, y - 25);
      showcase.font = "14px system-ui";
      [2, 0, 6, 4].forEach((dir, i) => drawPrototypeSprite(showcase, { id, facing: dir * Math.PI / 4, hp: 1, gait: 0 }, 330 + i * 175, y, arena.time, 1, { state: "idle", phase: arena.time * 0.6 % 1 }));
    });
    animationShowcase.clearRect(0, 0, 1e3, 330);
    animationShowcase.fillStyle = "#13231f";
    animationShowcase.fillRect(0, 0, 1e3, 330);
    animationShowcase.imageSmoothingEnabled = false;
    ["idle", "walk", "run", "turn", "stop", "attack", "slash", "charge", "cast", "dodge", "getup", "death"].forEach((state, i) => {
      const x = 84 + i % 6 * 166, y = 135 + Math.floor(i / 6) * 160, phase = state === "death" ? Math.min(1, arena.time % 2) : arena.time % 1;
      drawPrototypeSprite(animationShowcase, { id: selectedId(), facing: Math.PI / 2, hp: 1, gait: 0 }, x, y, arena.time, 1, { state, phase });
      animationShowcase.font = "12px system-ui";
      animationShowcase.textAlign = "center";
      animationShowcase.fillStyle = "#d8d4b1";
      animationShowcase.fillText(state.toUpperCase(), x, y + 20);
    });
  }
  function togglePause() {
    paused = !paused;
    $("#play-pause").textContent = paused ? "Play" : "Pause";
    $("#play-pause").setAttribute("aria-label", paused ? "Resume scene" : "Pause scene");
  }
  function selectedRoll(kind) {
    const u = selectedUnit();
    arena.roll(u, u.facing + (kind === "dodge" ? Math.PI / 2 : 0), kind);
  }
  function toggleSprint() {
    if (mode === "movement" && arena.locomotion === "sprint") arena.setLocomotion("walk");
    else arena.setSprint(selected, !selectedUnit().sprintRequested);
    updateUI();
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.dataset.select) chooseUnit(el.dataset.select);
    if (el.dataset.scene) changeMode(el.dataset.scene);
    if (el.dataset.pace) {
      arena.setLocomotion(el.dataset.pace);
      updateUI();
    }
    if (el.dataset.speed) {
      speed = Number(el.dataset.speed);
      for (const b of document.querySelectorAll("[data-speed]")) b.classList.toggle("active", Number(b.dataset.speed) === speed);
    }
    if (el.dataset.pose) {
      pose = el.dataset.pose;
      arena.time = 0;
      for (const b of document.querySelectorAll("[data-pose]")) b.classList.toggle("active", b.dataset.pose === pose);
    }
    if (el.id === "play-pause") togglePause();
    if (el.id === "restart" || el.hasAttribute("data-replay")) changeMode(mode);
    if (el.id === "frame-step") {
      if (!paused) togglePause();
      arena.step(1 / 12);
      render();
      updateUI();
    }
    if (el.id === "order-dash") selectedRoll("dash");
    if (el.id === "order-dodge") selectedRoll("dodge");
    if (el.id === "order-sprint") toggleSprint();
    if (el.id === "order-charge") {
      const u = selectedUnit(), target = arena.target(u);
      if (target) arena.chargeAttack(u, target);
      updateUI();
    }
    if (el.id === "order-attack") {
      const u = selectedUnit(), target = arena.target(u);
      if (target) arena.attack(u, target);
    }
    if (el.id === "sound-toggle") {
      sounding = !sounding;
      sound.begin(0, sounding);
      el.textContent = sounding ? "Sound on" : "Sound off";
      el.setAttribute("aria-pressed", sounding);
    }
    if (el.id === "focus-view") {
      focusView = !focusView;
      el.textContent = focusView ? "Wide view" : "Focus selected";
      el.setAttribute("aria-pressed", focusView);
    }
  });
  $("#roster-select").addEventListener("change", (e) => chooseUnit(e.target.value));
  window.addEventListener("scroll", () => renderShowcase(true), { passive: true });
  $("#pose-facing").addEventListener("change", (e) => poseFacing = Number(e.target.value));
  $("#show-labels").addEventListener("change", (e) => labels = e.target.checked);
  $("#show-telegraphs").addEventListener("change", (e) => telegraphs = e.target.checked);
  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    let sx = (e.clientX - r.left) * 1002 / r.width, sy = (e.clientY - r.top) * 654 / r.height;
    if (mode === "directions") {
      if (sy < 64 || sy > 606) return;
      poseFacing = clamp(Math.floor(sx / 250), 0, 3) + (sy >= 346 ? 4 : 0);
      $("#pose-facing").value = String(poseFacing);
      changeMode("study");
      focusView = true;
      $("#focus-view").textContent = "Wide view";
      $("#focus-view").setAttribute("aria-pressed", "true");
      return;
    }
    if (focusView) {
      const p = groundToScreen(selectedUnit().x, selectedUnit().y);
      sx = p.x + (sx - 500) / 2;
      sy = p.y + (sy - 370) / 2;
    }
    const point2 = screenToGround(sx, sy);
    if (!["battle", "movement"].includes(mode)) return;
    const near = arena.units.filter((u) => u.side === 0 && u.hp > 0).sort((a, b) => Math.hypot(a.x - point2.x, a.y - point2.y) - Math.hypot(b.x - point2.x, b.y - point2.y))[0];
    if (near && Math.hypot(near.x - point2.x, near.y - point2.y) < 35) chooseUnit(near.uid);
    else arena.moveOrder(selected, point2);
    canvas.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("select,input,button,a")) return;
    if (e.code === "Space") {
      e.preventDefault();
      togglePause();
    }
    if (e.key.toLowerCase() === "r") changeMode(mode);
    if (e.key === "Shift" && ["battle", "movement"].includes(mode) && !e.repeat) {
      e.preventDefault();
      if (arena.setSprint(selected, true)) heldSprintUid = selected;
      updateUI();
    }
    if (e.key.toLowerCase() === "s" && ["battle", "movement"].includes(mode) && !e.repeat) toggleSprint();
    if (mode !== "battle") return;
    if (e.key.toLowerCase() === "d") selectedRoll("dash");
    if (e.key.toLowerCase() === "c") {
      const u = selectedUnit(), t = arena.target(u);
      if (t) arena.chargeAttack(u, t);
    }
    if (e.key.toLowerCase() === "f") {
      const u = selectedUnit(), t = arena.target(u);
      if (t) arena.attack(u, t);
    }
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const u = selectedUnit(), v = { ArrowLeft: [-90, 0], ArrowRight: [90, 0], ArrowUp: [0, -90], ArrowDown: [0, 90] }[e.key];
      arena.moveOrder(u.uid, { x: u.x + v[0], y: u.y + v[1] });
    }
  });
  function releaseHeldSprint() {
    if (heldSprintUid) {
      arena.setSprint(heldSprintUid, false);
      heldSprintUid = null;
      updateUI();
    }
  }
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") releaseHeldSprint();
  });
  window.addEventListener("blur", releaseHeldSprint);
  $("#pose-states").innerHTML = ANIMATION_STATES.map((s) => `<button data-pose="${s}" class="${s === pose ? "active" : ""}">${{ attack: "Overhead strike", slash: "Side slash", charge: "Charged strike", getup: "Get up", stop: "Fast stop", turn: "Change direction", dodge: "Physical dodge" }[s] || s[0].toUpperCase() + s.slice(1)}</button>`).join("");
  window.addEventListener("prototype-art-ready", () => {
    makeCards();
    updateUI();
  });
  window.addEventListener("prototype-render-error", (e) => {
    $("#loading").textContent = "The sprite renderer could not initialize. Reload this page. " + e.detail;
  });
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
  });
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    if (!artLoaded && spritesReady() && backdrop.complete && backdrop.naturalWidth) {
      artLoaded = true;
      $("#loading").hidden = true;
      makeCards();
      updateUI();
    }
    if (!paused && artLoaded && !document.hidden) arena.step(dt * speed);
    const events = arena.audio.splice(0);
    if (sounding) for (const event of events) sound.event(event);
    render();
    renderShowcase();
    uiClock += dt;
    if (uiClock > 0.1) {
      updateUI();
      uiClock = 0;
    }
    requestAnimationFrame(frame);
  }
  makeCards();
  changeMode("directions");
  renderShowcase(true);
  requestAnimationFrame(frame);
  window.prototypeLab = { get state() {
    return { arena, mode, selected, paused, speed, pose, poseFacing, artLoaded, focusView, cache: spriteCacheStats() };
  }, get sample() {
    return { id: selectedId(), state: ["study", "directions"].includes(mode) ? pose : animationState(selectedUnit()) };
  }, directionFrames: prototypeDirectionFrames, exportAtlas };
})();

/* Three.js license
The MIT License

Copyright © 2010-2025 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
