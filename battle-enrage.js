export const ENRAGE_START = 30;
export const HEALING_DECAY_INTERVAL = 5;

// Combat seconds, independent of playback speed and animation time.
export function enrageAt(time) {
  const active = time + 1e-8 >= ENRAGE_START;
  const elapsed = active ? Math.max(0, time - ENRAGE_START) : 0;
  const tier = active ? Math.min(5, Math.floor((elapsed + 1e-8) / HEALING_DECAY_INTERVAL)) : 0;
  const effectiveness = (5 - tier) / 5;
  return {
    active, elapsed, damage: active ? 3 : 1, actionSpeed: active ? 1.5 : 1,
    effectiveness, healing: active ? 3 * effectiveness : 1,
    nextChange: active ? (tier < 5 ? (tier + 1) * 5 - elapsed : 0) : ENRAGE_START - time,
  };
}

export function actionElapsed(from, to) {
  return Math.max(0, to - from) + .5 * Math.max(0, to - Math.max(from, ENRAGE_START));
}
