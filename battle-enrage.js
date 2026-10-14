export const ENRAGE_START = 30;
export const DAMAGE_RAMP_PER_SECOND = .04;
export const HEALING_DECAY_PER_SECOND = .01;
export const ACTION_RAMP_PER_SECOND = .01;
export const ENRAGE_RAMP_DURATION = 50;

const combatTime=value=>Number.isFinite(value)?Math.max(0,value):0;
// Continuous pressure after a 30-second grace period; no sudden damage spike
// or healing boost. Rates use combat seconds, regardless of playback speed.
export function enrageAt(time) {
  time=combatTime(time);
  const active=time>=ENRAGE_START,elapsed=Math.max(0,time-ENRAGE_START);
  const effectiveness=Math.max(0,1-elapsed*HEALING_DECAY_PER_SECOND);
  return {active,elapsed,damage:1+Math.min(2,elapsed*DAMAGE_RAMP_PER_SECOND),
    actionSpeed:1+Math.min(.5,elapsed*ACTION_RAMP_PER_SECOND),
    effectiveness,healing:effectiveness,healingPenalty:1-effectiveness,
    progress:Math.min(1,elapsed/ENRAGE_RAMP_DURATION),
    nextChange:active?1-elapsed%1:ENRAGE_START-time};
}
// Integrate the ramp exactly so frame splitting cannot change action recovery.
const actionClock=time=>{
  const elapsed=Math.max(0,time-ENRAGE_START),ramp=Math.min(ENRAGE_RAMP_DURATION,elapsed);
  return time+ACTION_RAMP_PER_SECOND*ramp*ramp/2+.5*Math.max(0,elapsed-ENRAGE_RAMP_DURATION);
};
export function actionElapsed(from,to){
  from=combatTime(from);to=combatTime(to);
  return Math.max(0,actionClock(to)-actionClock(from));
}
