# Base fox: archer v2

A full second pass over the isolated Meshy base fox preview. The uploaded model, repaired input, costume, texture and palette are preserved. Evolution forms and the production game's 2D creature renderer are outside this pass.

## Requested fixes

- **Tail no longer clips the tunic; carried straight out behind.** The tail's root bone is sewn across the back of the belt and hem, and v1 swung that bone (an 18° rest turn plus a ±27° sway), which sheared the junction through the hem's gold trim. The root bone now keeps its authored junction in every clip. The tail is carried straight out behind by bending the next four bones, and all sway, swish and turn lag act past the junction. The twelve hem-trim vertices that carried up to a fifth of a tail weight now belong to the pelvis. A new tail-against-costume check (whole tail, root junction included, against green and gold costume surfaces) finds contact in v1's Idle and fall, and none in any v2 frame.
- **The head no longer disappears.** v1 blinked by swapping two whole head meshes by scale. Whenever two clips cross-faded with different blink states, both heads were blended to partial scale (for example 0.45 and 0.55), so the head shrank and popped back. There is now one head mesh. Blinks and expressions are morph targets, which blend safely. The test drives the runtime through walk, turn, run, stop-and-turn, attack and idle hand-overs and checks every frame that the head stays visible at full scale.
- **Subtle blinks.** v1's closed state replaced each eye socket and a band of the face, about 2.2 times the eye in each direction, with flat fur and a white stripe. v2 has small upper and lower lids that slide inside each socket, follow the surface by raycast, and take their colour from the fur beside the eye, with a fine lash line. A blink takes about 60 ms to close, holds for two frames, opens in 100 ms, and comes at irregular 2.6–5.4 s intervals with an occasional double. Each lid spans under a fifth of the head's width.
- **The stance holds through repeated shots.** The standing shot is now entered through `Bow_Attack_Enter` and left through `Bow_Attack_Exit`. The paws never move during the shot loop, at any bow angle. The runtime (`FoxActor.play`) steps into the stance once, holds it for any number of shots, and steps out only for something done standing (idle, a turn). Running, kiting, dashing, dodging or ducking leave it directly.
- **The arrow comes from a back quiver over the shoulder, every shot.** A leather quiver with three spare arrows lies diagonally across the back, its mouth behind the left (draw) shoulder. The draw paw reaches out past the shoulder and back, closes on a nock, draws the arrow up the quiver's axis until the head clears the mouth, swings it up and out, then forward, and slides it onto the string from the archer's side. The arrow stays in the paw on every baked frame (2.3 mm at most between keys; shot clips are baked at 120 Hz).
- **A satisfying bow drop.** On the loose, a sprung drop (about a third of overshoot) throws the straight bow arm down about the shoulder. The bow falls about 0.23 within a quarter second, bounces back, falls into the relaxed paw tipped slightly forward, and then recovers to ready.
- **Run stop and turn.** New `Run_Stop_Turn_Left_180`, `Run_Stop_Turn_Right_180`, `Run_Stop_Turn_Left_90` and `Run_Stop_Turn_Right_90` brake out of the run (crouch, lean back, slide) into a pivot on the planted paws, and end exactly on Idle turned. `FoxActor.stopAndTurn(yaw)` picks the half or quarter turn. The combat demo now brakes and pivots back to face the dummy after running away.

## v2 across every animation

- **Smoother:** all eases are quintic (zero acceleration at both ends). Walk and run shift the weight over each support paw with a matching hip roll, and Idle slowly shifts its weight. Cross-fades never stack: a clip replaced within a few frames keeps the fade it began with. A moving shot taken up from outside the shot cycle starts in its still ready hold. Across the 34 s fight, no frame is rougher than the baked clips themselves.
- **Sharper turns:** 45° in 0.42 s (was 0.62), 90° in 0.60 s (was 0.95), half-turn pivot in 0.62 s (was 0.75). The head leads, the hips make a small counter-move first, and there is a slight overshoot that settles exactly on Idle. Head speed stays under the fight's existing 16° per frame limit (13.5° at most).
- **Angry face while shooting:** brows pressed down toward the nose, lids slanting down at the inner corners, ears pinned back. The eyes themselves never move. It eases in with the stance and out after it.
- **Faster dodges and dashes:** a front-loaded burst. Dodges travel 0.42 (was 0.30) in 0.8 s (was 1.25), peaking at 3.3 u/s (v1: 1.3). The dash peaks at 5.5 u/s (v1: 3.5). Both have a dip, a lean into the move and a sprung landing.
- **Different upright angles for the bow:** `Bow_Attack_Upright` (about 5° from vertical), `Bow_Attack` (canted, about 29°) and `Bow_Attack_Tilted` (about 39°). They share one ready pose, so the angle can change at any loop boundary without a pop. The viewer has a Bow angle setting. The demo's standing volley cycles all three. A flatter cant was measured and rejected: at 60° the paw needs a 78° wrist bend.

## Toward the agile archer (v3 preview)

In response to the "Legolas" request, three cheap additions ride on the same stance and shot cycle:

- `Bow_Attack_Crouched`: the canted shot with the hips sunk 7.5 cm over the same planted paws.
- `Bow_Attack_Double`: two arrows drawn and nocked together, 3 cm apart on the string, loosed on slightly diverging lines.
- `Duck`: a quick drop under a swing, returning exactly to Idle.

Weaving while kiting, rolls, shots from a dodge or slide, and stance changes mid-volley are left for v3.

## Visual review

Family/form reviewed: **fox / Meshy base only**. Facings: **S, SE, E, NE, N, NW, W, SW**.

- Original [eight views](../meshy-fox-rig/original-eight-directions.png). Current eight-view sheets for all 43 states, including:
  - [idle](idle-eight-views.png), [walk](walk-eight-views.png), [run](run-eight-views.png)
  - quiver [reach](quiverReach-eight-views.png), [draw out](quiverDraw-eight-views.png) and [carry](quiverCarry-eight-views.png); [full draw](attack-eight-views.png), [loose](attackRelease-eight-views.png), [bow drop](bowDrop-eight-views.png)
  - [upright](attackUpright-eight-views.png), [tilted](attackTilted-eight-views.png), [crouched](attackCrouched-eight-views.png), double [nocked](doubleNocked-eight-views.png) and [loosed](doubleLoosed-eight-views.png)
  - stance [enter](attackEnterStep-eight-views.png) and [exit](attackExitStep-eight-views.png), [angry](angry-eight-views.png)
  - turns [45](turnLeft45-eight-views.png), [90](turnLeft90-eight-views.png), [quick 180](quickTurnLeft-eight-views.png); [run stop](runStop-eight-views.png); run stop and turn [180](runStopTurnLeft-eight-views.png) and [90](runStopTurnRight90-eight-views.png)
  - [dodge](dodgeLeft-eight-views.png), [dash](dash-eight-views.png), [duck](duck-eight-views.png), [fall](death-eight-views.png), [blink](blink-eight-views.png), [tail swish](tailSwish-eight-views.png)
- Close-ups: [blink](blink-front.png), [angry face](angry-front.png), [quiver draw from behind](quiver-draw-rear.png), [bow drop](bow-drop.png), [double shot](double-shot.png), [crouched shot](crouched-shot.png), [run stop and turn](run-stop-turn.png), [tail from behind](tail-rear.png)
- [True-speed clip recording](motion-preview.webm) (44 s), [decoded frames](motion-decoded.png), enlarged decoded [shot](decoded-attack-enlarged.png) and [double shot](decoded-double-enlarged.png)
- [Combat demo recording](combat-demo.webm) (34 s), [decoded combat frames](combat-decoded.png), enlarged [tilted shot](combat-decoded-7.8-enlarged.png) and [final shot](combat-decoded-23.1-enlarged.png)
- Inline previews: [stance and shot cycle](rowan-pose-preview.html), [combat movement](rowan-combat-preview.html)

Recordings are rendered frame by frame at exact animation times and encoded at 30 fps, so they play at true speed. Rig guides are off.

## Verification

- **51 unit checks pass** ([TAP](unit-tests.tap)): the existing rig, motion and archer checks plus 14 new v2 checks. The new checks cover:
  - the held stance and shared ready pose; enter/exit settling exactly on Idle and the loop; runtime stance holding and bow-angle cycling
  - the quiver draw; the bow drop; the three cants
  - anger morphs (eyes fixed); eyelid size and the never-hidden head through cross-fades
  - the fixed tail root and straight-back tail; the hem weights
  - sharper turns; burst dodges and dashes; run stop and turn
  - quintic eases; crouched, double and duck
- Where v1 assertions referred to v1 timing, they sample the v2 equivalent: full draw at 1.15 s (the push now completes at 1.12 s), the loose at `RELEASE` (1.25 s, was 1.18 s), the nock window from `NOCK`, and the 7-hit fight script. Thresholds are unchanged. One check was re-centred because the request changed the anatomy: the tail used to be held to the side and swept to x>0.5; it now sweeps across the midline behind the fox (x<−0.1 to >0.2).
- **Frame-by-frame surface checks:** [export](export-review.json) and [runtime tracking](runtime-review.json) each sample all **3,271 frames** of 36 clips, with no collisions in any tested pair. New pairs this pass:
  - tail vs. costume
  - quiver vs. torso, head, tail and bow
  - carried arrow vs. head, torso and tail
  - draw paw and forearm vs. head
  - bow vs. legs

  No non-finite vertices, and nothing below the ground beyond float precision. Right grip error is zero; left nock separation is below 1e-7. Khronos validation reports zero errors (the preserved source tangent warnings remain).
- [Build metrics](build.json): worst bow-wrist bend 53.5° (tilted bow, full draw); cloth length error 3e-7. The largest IK shortfall is 3.9 mm (the bow paw lagging its target at the top of the raise arc; the bow stays in the paw).
- Joint motion: during the reach the draw arm's joints change by at most 28° per 1/60 s frame, below v1's 34°. An elbow-flip found mid-pass (134° in one frame) was fixed: off the string, the draw elbow keeps one guide that never lies along the arm.
- [Browser review](browser-review.json): 43 states in eight views, all framed, repeatable scrubbing, connected head tracking, moving-target contact, travel and true-speed playback. [Combat review](combat-review.json): 7/7 hits, settled gaze p95 0.0013°, every head swing under 13.6° per frame. [Inline previews](inline-review.json): chapter selection, normal-speed playback, widths 320/736/1024, each under 1 MB.
- [Production checks](production-smoke.json): both offline files rebuilt unchanged. Source and offline live movement and combat pass, the prototype scenes pass, and the 50 creature-art regression tests pass. This patch does not touch the game.

## Reproduce

```sh
node scripts/build-meshy-fox-animated.mjs
node scripts/build-meshy-fox-preview.mjs
node --test tests/meshy-fox-rig.test.js tests/meshy-fox-motion.test.js tests/meshy-fox-archer.test.js tests/meshy-fox-archer-v2.test.js
node scripts/inspect-fox-motion.mjs
node scripts/inspect-fox-motion.mjs --tracking
node scripts/review-fox-animated.browser.mjs
node scripts/review-fox-combat.browser.mjs
node scripts/build-fox-motion-inline.mjs
node scripts/review-fox-inline.browser.mjs
node scripts/serve-meshy-fox-preview.mjs
```

Open `http://127.0.0.1:3109/animated.html` (choose an action while playing to see the stance sequence; Bow angle picks the cant) or `/combat-demo.html`. `node scripts/render-fox-shots.browser.mjs shots.json out.png` renders chosen moments from chosen cameras. For quick tuning, `FOX_ONLY=mode,mode FOX_OUT=file.glb` bakes a subset of clips, and `GLB=… INSPECT_OUT=… node scripts/inspect-fox-motion.mjs --clip=Name` checks it. The webm encoder now finds Playwright's ffmpeg under `%LOCALAPPDATA%` on Windows.

## Limits

- This is a base-form preview. Clips are baked; the actor cross-fades whole clips and does not layer partial-body blends.
- The free KayKit CC0 set already vendored (Idle, Walking, Running) still supplies arm swing. Its bow clips were re-measured in v1 and remain unsuitable for this rig's proportions. All v2 archery, quiver, drop, dodge and turn motion is fitted to this fox.
- The quiver has no strap, and its lower end stands slightly off the back in side view.
- In the combat demo, standing shots must stay inside the trunk's ±34° aim arc while the stance holds. The demo's dummy is paced for that; a game would step out of the stance and re-face when a target leaves the arc.
- The demo uses the bow angles but not the crouched shot, the double shot or the duck (the double's second arrow is not simulated as a projectile).
- Sampled surface tests are not continuous collision detection. No numerical art-quality score is claimed.
