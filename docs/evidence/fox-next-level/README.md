# The fox, next level: a game-timed archery set and a life layer

This pass covers the ten "next level" items for the base biped fox (Rowan). The face item was trimmed on request: no eyelids, blinks or expressions. The painted eyes stay as authored. Everything else is in:

- a **new archery set** built for the biped's body and the game's timing;
- a **runtime life layer**: feet, gait, weight, hits, tail, ears, idle and bow;
- a **replay schedule** that follows the game's own windups.

All of it runs in the recorded game fight (Rowan vs Brakk, from the game's `Battle` engine, rules v17).

## The ten items

1. **An archery draw built for the body.** `scripts/author-fox-biped-archery.mjs` poses eight clips directly on the biped:

   | Clip | Length | What happens |
   |---|---|---|
   | `Bow_Ready` | loop | Ready hold |
   | `Bow_Draw` | 0.26 s | String to an anchor under the chin, bow arm extended, draw elbow up |
   | `Bow_Release` | 0.24 s | Paw flicks back past the jaw |
   | `Bow_Reload` | 0.55 s | Over the shoulder to the quiver, arrow pulled out along it, carried round outside the shoulder onto the string |
   | `Bow_Nock` | 0.30 s | Rapid fire: a held spare arrow goes straight from the anchor to the string |
   | `Bow_Ready_Enter` | 0.70 s | From rest into the ready hold |
   | `Bow_Ready_Exit` | 0.70 s | Back to rest |
   | `Victory` | 1.6 s | Bow raised overhead, then lowered |

   - **Timing:** the draw and release lengths are the game's auto-shot windup and recovery (`game.js`, rules v17), and a test reads them from the game source.
   - **Quiver path:** the mouth sits 16 cm behind the drawing shoulder, under the big head. Paths to it are arcs around the shoulder, so the arm never folds flat (where its elbow flipped up to 140°).
   - **Elbow direction:** the elbow follows keyed directions: hanging at rest, out and back on the string, up and over the shoulder at the quiver.
   - **Contact:** the bow paw holds the bow and the drawing paw holds the string or arrow to within 2.3 mm in every clip ([build report](archery-build.json)).
   - **Reproducible:** the script rebuilds the committed asset byte for byte from the natural-arms asset.
2. **A living tail.** The tail is a spring chain with inertia. It whips against a pounce, rises when hurt and wags in victory. It runs before the controller's tunic clearance, so one clearance pass covers it every frame, and it found a clear pose on every frame of the fight.
3. **Ears that act** (eyes skipped). The ears are spring chains. They perk while aiming (about 6° over rest), swivel toward the enemy, flatten when hit or below a third of health, and twitch at rest.
4. **Gaits at game speed.** A phase-driven gait replaces clip playback at 3–7× speed:
   - cadence rises with speed (2.6–6.4 steps/s);
   - each stance covers a span the legs can reach, so a walk keeps double support and a run has flight between steps, with a small ballistic hop;
   - the fight reaches 4 m/s.
5. **Feet that stay planted.** A planted foot moves at most 1.0 cm in any frame of the fight (it was 16 cm before the pounce and knockback fixes). Each swing lands where the hip will be at mid-stance; the farthest grounded foot is 25 cm from the body. The pelvis never sinks more than 5 cm to reach. The first version's lag-triggered steps let feet trail 1–3 m behind at speed and crouched the body by up to 32 cm. Standing feet re-home and step through turns.
6. **Weight and anticipation.**
   - The body leans into acceleration and settles with overshoot.
   - A pounce crouches *before* the game's dodge starts (the replay knows the dodge times) and leaves the ground on its first frame.
   - Landings squash.
7. **Hits that scale.** Flinches are springs scaled by damage and turned away from the blow, with a hurt posture below a third of health. A stagger or knockback faster than a run is a skid: the feet drag under the body instead of running.
8. **A fox dodge.** Sidesteps are pounces: crouch, tucked leap along the game's roll, squash.
9. **Personality.** After the knockout the fox puts an arrow away if one is nocked, plays `Victory`, then idles with glances, weight shifts, ear flicks and tail swishes.
10. **Bow and arrows.** The string thrums after each release and the limbs flex. A spare arrow leaves the quiver on each grab and the next rises into place; the game has unlimited arrows, so the quiver does not empty.

### Replay and runtime fixes

- **Shot schedule.** The replay schedules shots from the game's own timing: auto shots wind up for 0.26 s and recover for 0.24 s; the Moontrail Fan skill takes 0.40 s and 0.34 s. Between shots the fox reloads from the quiver when there is time and nocks a held arrow when there is not. Previously, a follow-up 0.64 s later began the reload mid-clip, snapping the arm 93°.
- **Gaze.** The trunk's gaze fades out for a target passing behind the fox, as the head's already did, instead of swinging 63° to the other side in one frame.
- **Pops.** The fight has [0 isolated pops](replay-pops.txt) above 25° (the previous replay had 4 at about 26°).

## Visual evidence

- **Archery set, eight facings** (S, SE, E, NE, N, NW, W, SW), at its key moments:
  - [Bow_Ready](Bow_Ready-eight-views.png), [Bow_Draw](Bow_Draw-eight-views.png), [Bow_Release](Bow_Release-eight-views.png);
  - [Bow_Reload](Bow_Reload-eight-views.png), [Bow_Nock](Bow_Nock-eight-views.png);
  - [Bow_Ready_Enter](Bow_Ready_Enter-eight-views.png), [Bow_Ready_Exit](Bow_Ready_Exit-eight-views.png), [Victory](Victory-eight-views.png).
- **Full draw before and after:** [before](draw-before-eight-views.png) (retargeted `Bow_Attack` at 1.12 s) and [after](draw-after-eight-views.png) (`Bow_Draw` at 0.26 s).
- **The fight, wide:** [video](combat-demo.webm) at normal speed (14.4 s), [decoded sheet](combat-decoded.png) and decoded frames, with [enlarged frames](combat-decoded-2.15-enlarged.png). The [review](combat-review.json) records 7 shots, 7 stuck arrows matching 7 game hits, 2 pounces and 3 Brakk strikes.
- **The fight, close-up:** a [follow camera](life-closeup.webm) at a three-quarter view, normal speed, with a [decoded sheet](life-decoded.png), native frames and enlarged [draw](life-decoded-1.5-enlarged.png) and [pounce](life-decoded-5.55-enlarged.png) frames ([review](life-review.json)). It shows the run, the quiver reach, the draw, the release, a nock, a reload, the Rush hit, both pounces and the victory.

The reviewed scope is the base biped fox: the eight new clips in eight facings, plus the recorded fight wide and close up. The other 44 clips are unchanged; their audit is in [clip-audit.txt](clip-audit.txt). No gameplay families, evolution forms or game code change.

## Audits

- [clip-audit.txt](clip-audit.txt): peak angular acceleration per clip. The archery set peaks at 112k °/s², below the existing acrobatic clips (170k).
- [archery-frame-turns.txt](archery-frame-turns.txt): the fastest arm, paw or bow turn in each archery clip is at most 23.7° per 120 Hz frame (the test limit is 25°).
- [life-audit.json](life-audit.json): foot reach and skating, pelvis drop, ears, quiver, thrum, tail and quiver clearance over the whole fight.
- [gltf-validation.txt](gltf-validation.txt): 0 errors and the same 3 source warnings.

## Tests

- [80/80 pass](unit-tests.txt).
- `tests/fox-biped.test.js` has one new test: the archery set keeps the game timing (read from `game.js`); the bow stays in the bow paw; a nocked arrow sits on the drawing paw; the reload and entry reach the quiver mouth; the drawing arm never folds flat on quiver trips. The existing test now counts 52 clips and lists the archery clips as actions.
- `tests/game-skirmish.test.js` adds life checks to the replay. Grounded feet stay within 35 cm of the body. Planted feet slide less than 1.5 cm a frame. The pelvis sinks at most 5 cm. The tail always finds a clear pose. The snap check is unchanged.
- [Both offline builds](offline-builds.txt) and the [source and offline game checks](game-source-offline.txt) pass.

## Limitations

- **Frame rate:** a replay step on the live combat page costs 101 ms in Chrome, against 63 ms before (about 10 steps/s instead of 15; headless Node shows 90 ms against 59 ms). Almost all of it is the controller's tail and quiver clearance on the CPU-skinned mesh, which searches more often now that the legs and tail move; the life layer itself costs 0.3 ms. The recorded videos step at exact times and are unaffected.
- **Quiver mount:** the quiver refit finds no clearance on 6 frames while the paw is inside its mouth, and keeps the baked mount for those frames, as before.
- **Upper body while running:** the upper body holds the bow ready while the legs run; there is no arm pump during a run.
- **Brakk:** still the stand-in brute body.
- **Close-up camera:** in the close-up video the camera crops the ears at a pounce's apex, and Brakk's body blocks the view during the Rush hit.
