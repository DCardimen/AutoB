# Base fox: archer's stance, connected turning and a combat demo

This patch updates the isolated Meshy base fox preview. The uploaded model, repaired input, costume, texture and palette are preserved. Evolution forms and the production game's 2D creature renderer are outside this pass.

## Ten improvements

1. **Archer's wind-up.** At full draw the chest turns about 46° from square, over hips held square by the split stance (see 7). Moving shots keep the same chest turn while the hips turn toward the travel direction.
2. **Head and neck counter-rotation.** The neck and head unwind the twist (about 27° and 0° world yaw at anchor), so the face holds the target and the collar is never wrung by one joint. The arrow line runs under the left eye, so the fox sights down the arrow, with a slight head tilt toward the string.
3. **Locked bow arm.** At bake time the grip depth is fitted along the aim line, by bisection across the anchor hold, until the bow arm reaches 98.8% of its reach (about 162° interior). These short chibi segments only read as straight that close to full reach. The bow elbow rolls down and out of the string path.
4. **Elbow-back draw to a real anchor.** The draw elbow folds to about 99° at shoulder height, out to the side and 0.2 behind the nock. The draw is 0.13 past brace, against 0.04 before. Limb flex is stronger and the arrow is shorter, so the head sits just past the bow. The pinch channels in the draw paw were recarved to follow the string's fan through the whole draw.
5. **Push–pull phasing.** Set-up raises the bow at partial extension. The draw then pushes the bow arm out while the string paw pulls to anchor. At anchor the draw shoulder creeps back under back tension. The paw closes on the nock fingertips-first from the archer's side.
6. **Real follow-through.** On release, the draw paw slides back and out along the jaw and the draw shoulder snaps back. The bow tips forward in the relaxed paw while the grip stays attached. The loosed arrow and its glint keep the aim line instead of following the bow.
7. **Archer's footwork.** The front paw (`STANCE.front`, now the left paw as requested) steps forward onto the target line and points at the target. The rear paw steps back and turns out about 85° to its side. Knees soften and the hips sink for the wider base. Each paw is one lifted step in and one step back during recovery. Soles stay flat and planted.
8. **Turn-in-place clips** (`Turn_Left_45`, `Turn_Right_45`, `Turn_Left_90`, `Turn_Right_90`). The gaze leads, then the chest, then the hips. The paws step about the turn centre (two or three lifted steps) and the stance dips. The tail and cape trail and settle, and a blink rides the gaze shift. Every turn starts on Idle's first frame and ends on it rotated by the turn. The arm-frame hints and the leg-IK swing follow the turning root, so a turned pose is the rest pose rotated, with no twist gained about a bone's axis. In the viewer, changing Facing while idle plays the turn, cross-faded in from the current idle moment.
9. **Connected look-at chain.** Looking around turns the spine (10%), chest (16%) and neck (24%) with the head, so the head never swivels alone. While shooting, the spine and chest share the aim about one vertical axis through both pivots, so the bow, string and loose arrow turn as one frame. The aim is solved for the arrow's own line, which runs beside that axis, so the arrow passes through the target rather than parallel to the pivot's bearing. During turns the neck and head track the target while the clip drives the trunk.
10. **Gait gaze and counterbalance.** In walk and run the neck and head absorb nine tenths of the trunk's yaw and lean, so the gaze stays level. Walking arms follow the opposite paw's real travel through the long walk stance (contralateral correlation 0.77 → 0.92). The tail counterbalances the hip turn and trails turns.

## Smooth transitions, real run, natural tail, directional legs

A second pass made every hand-over smooth and added the missing locomotion.

- **No stutter between motions.** Across the 34 s fight, no frame's body-bone acceleration exceeds what the baked clips themselves contain: the worst is 18.5 mm/frame² in both. Before this pass the worst was 266 mm/frame². The causes found and fixed:
  - the aim solve followed the hidden arrow before nocking and after the loose;
  - the tracking-style weights changed with a velocity step (they now follow timed smoothsteps);
  - a clip fading into itself (one turn into the next) lost its outgoing pose (a second action set now plays it);
  - a just-committed turn counted twice for one frame of the look state;
  - the draw arm's sleeve twist flipped when the arm reached out along a fixed twist hint (it now follows the elbow hinge);
  - the dummy's stop-start arrival made the lead aim flicker.
- **The head turns to a target instead of locking on.** Gaze (fast) and trunk (slower) each follow the target's bearing with a second-order spring with feed-forward, so smooth target motion is tracked exactly (settled error 0.006° at p95) while a new target or a swapped aim point becomes a visible head turn. Tracking fades in at the start, and fades out while the target is beyond reach behind. A target behind one shoulder is held at the neck's limit there, a glance back, and a change of side sweeps round through the front. The largest head swing in the fight is 13.5° per frame, inside the quick pivot.
- **Varying cross-fades.** Fade lengths depend on the transition: 0.10 s into Idle from a turn or stop (they already end on its first frame), 0.10 s into a dash, 0.24 s for runs, 0.28 s for aim changes. Travel velocity blends through each fade instead of jumping.
- **A real run.**
  - The stride is 0.17, against 0.11 before, with a flight phase: each paw is down 38% of the cycle and both are visibly up between.
  - The knee lift is 7.5 cm and clears the ground quickly.
  - The trunk leans and counter-rotates more, and the body sinks at each mid-stance.
  - The arms pump from the shoulder with the elbows near a right angle, against the opposite paw (correlation 0.97). The bow arm pumps with a straighter elbow so the bow stays upright.
  - Speed is 0.66 u/s.
- **Stance foot.** As requested, the left (draw-side) paw now steps forward and points at the target, and the right paw steps back and turns out. The hips stay square over this split stance while the chest turns. `STANCE.front` switches it back to the bow-side foot, the usual archery form.
- **Constant tail.** A layered sway (periods of 4, 1.6 and 2.67 s, so the 8 s idle loop still seals) runs down the tail with a phase lag at all times, about ±27° at the root, under a milder occasional swish. The tip never rests for more than 0.2 s.
- **3D directional legs.** Four diagonal shooting gaits complete eight travel directions. While kiting, the actor blends the two nearest by the travel direction relative to the facing, so the paws step along any direction. Hips and toes turn toward lateral travel while the chest holds the aim, and the body keeps turning to face the target at a walking pace.
- **Quick pivot** (`Quick_Turn_Left_180`, `Quick_Turn_Right_180`, 0.75 s). A half-circle escape turn with a deeper dip and three steps, timed so the paws keep up with the hips. It is used to run away.
- **Abrupt run stop** (`Run_Stop`). Starts at the run's crouch. The bow-side paw lands and holds while the trunk leans back against the brake and sinks, the other paw swings through beside it, the arms carry forward and the tail flicks up. It slides 12.6 cm and ends exactly on Idle.

## Combat: [demo page](../../../public/meshy-fox-preview/combat-demo.html) and [recording](combat-demo.webm)

A fixed-step (60 Hz) scripted skirmish with a blank training dummy, built on a new runtime layer, [`FoxActor`](../../../public/meshy-fox-preview/fox-actor.mjs). The actor cross-fades clips (0.18 s), commits root motion and turns into the model transform, and queues 90/45° turns toward a world yaw. The [simulation](../../../public/meshy-fox-preview/fox-combat-sim.mjs) has no DOM, so the page, the recording and a Node test all run the same fight.

- **Head follows the enemy.** The gaze target is the dummy's head, or the point of aim along the arrow while shooting. In-view gaze error is below 1e-6° at the 95th percentile. Turning away to run, the head holds on as far as the neck allows.
- **Slower movement while attacking.** The eight moving-shot gaits creep on a planted walking stride, two per draw cycle, at 0.16 u/s, a quarter of the 0.66 u/s run. Planted-paw drift remains zero in all eight facings.
- **Running away.** After the dash back and a kiting shot, the fox pivots away (quick 180° turn), runs, glances back, stops abruptly and turns to fight again. The dummy pursues more slowly than a run.
- **Natural turns.** Every re-facing in the fight uses the turn clips. Clip boundaries move no bone further than the clips' own motion per frame.
- **Dashing toward and away.** The new `Dash_Back` is a 0.50 hop away with a back lean, the head counter-pitched to stay on target. `Dash_Forward` closes in for the final shot.
- **Arrows make contact.** The aim leads the moving dummy by the arrow's flight time. Each arrow leaves from the clip's own release transform, flies at 9 u/s, is swept against the dummy's capsule, sticks at chest height and makes the dummy flinch. All shots hit; the dummy topples on the sixth.
- **Also fixed on the way:** a NaN in the spine, chest and head while the hidden arrow was at zero scale (the aim now reads the arrow's local transform); a parallax aim error of 4–17°; the camera letting the dummy hide the archer (it now frames the fight side-on).

## Other motion sources tried

| Source (CC0) | Result |
|---|---|
| KayKit `Ranged_Bow_Draw` (full draw) | Twist 71°/40°. Retargeted to the fox's proportions it needs a 0.52 draw (90% of the bow's height), with the arrow line 12° off target and the draw paw inside the chest. Not usable; it confirms the fitted pose. |
| KayKit `Ranged_Bow_Idle` | Aiming idle at 54°/33°; the retargeted bow forearm enters the torso. |
| KayKit `Ranged_Bow_Release` | Draw hand flies outward and back. Same direction as the fox follow-through. |
| KayKit `Running_HoldingBow` | Arms locked (swing/stride 0.01, no contralateral swing). Rejected: the arms must swing. |
| KayKit `Running_A` | Contralateral 0.89, swing/stride 0.67. The fox run is already 0.97. |
| KayKit `Walking_A` | Contralateral 0.85. Better than the fox walk's 0.77; its lesson (follow the opposite paw) was adopted, giving 0.92. |
| KayKit `Dodge_Left`, `Dodge_Right`, `Hit_A`, `Death_A` | Already represented by fox-fitted dodges, hit and fall; no gain from arm-only retargeting. |
| Quaternius/three.js RobotExpressive `Running`, `Walking`, `Jump`, `Punch` | The exported foot bones are IK targets that never move (legs not baked), and the head wobbles 21° while running. Not usable. |

No source was clearly better once fitted to this fox's short arms, big head and thick sleeves. RobotExpressive was downloaded only for measurement and is not committed.

## Visual review

Family/form reviewed: **fox / Meshy base only**. Facings: **S, SE, E, NE, N, NW, W, SW**.

- [Original eight views](../meshy-fox-rig/original-eight-directions.png); current [idle](idle-eight-views.png), [walk](walk-eight-views.png), [run](run-eight-views.png)
- Archery: [stance step](attackStep-eight-views.png), [full draw](attack-eight-views.png), [follow-through](attackRelease-eight-views.png); shooting [forward](shootForward-eight-views.png), [backward](shootBackward-eight-views.png), [left](shootLeft-eight-views.png), [right](shootRight-eight-views.png)
- Turns: [left 45°](turnLeft45-eight-views.png), [right 45°](turnRight45-eight-views.png), [left 90°](turnLeft90-eight-views.png), [right 90°](turnRight90-eight-views.png), [quick 180°](quickTurnLeft-eight-views.png); [run stop](runStop-eight-views.png)
- Directional kiting: [forward-left](shootForwardLeft-eight-views.png), [back-right](shootBackwardRight-eight-views.png)
- [Dash](dash-eight-views.png), [dash back](dashBack-eight-views.png), [left dodge](dodgeLeft-eight-views.png), [right dodge](dodgeRight-eight-views.png), [hit](hit-eight-views.png), [fall](death-eight-views.png), [blink](blink-eight-views.png), [ears](earRight-eight-views.png), [sniff](sniff-eight-views.png), [tail sweep](tailSwish-eight-views.png)
- [Clip recording](motion-preview.webm), [decoded frames](motion-decoded.png), enlarged decoded [attack](decoded-attack-enlarged.png) and [run](decoded-run-enlarged.png)
- [Combat recording](combat-demo.webm), [decoded combat frames](combat-decoded.png), enlarged [kiting shot](combat-decoded-11.2-enlarged.png) and [final shot](combat-decoded-25.8-enlarged.png)

Recordings are rendered frame by frame at exact animation times and encoded at 30 fps ([encoder](../../../scripts/lib/encode-webm.mjs)), so they play at true speed even though headless software rendering is slower than real time. The previous real-time `MediaRecorder` capture produced choppy few-fps video in this environment. Rig guides are off.

## Verification

- **38 unit checks pass** ([results](unit-review.json)): the 25 existing rig and motion checks (contacts, seams, paws, string, tail, ears, blink and so on), plus 13 new ones:
  - stance: wind-up over square hips, locked bow arm, elbow-back draw, open footwork;
  - draw: push–pull, back tension and follow-through;
  - turns and quick pivots: exact Idle start and end, head-led, stepping paws;
  - run: flight phase, bent pumping arms and stride; gait swing and gaze;
  - look-around chain; constant tail; eight-way kiting with planted paws; run stop settling into Idle;
  - actor cross-fades;
  - the full skirmish: 6/6 hits, settled gaze p95 under 0.05°, every head swing under 16° per frame, and **no frame rougher than the baked clips**.
- [Export](export-review.json) and [runtime tracking](runtime-review.json) reviews each sample all **2,598 exported frames** of 25 clips at 60 Hz: **no collisions** in any tested pair, no non-finite vertices, and nothing below the ground beyond floating-point precision. Right grip error is zero and left nock separation is below 0.0000001. Khronos validation reports zero errors (three preserved source tangent warnings). Final IK error is about 3e-16, the largest bow-wrist bend is 49° (the loose follow-through) and cloth length error is about 3e-7 ([build](build.json)).
- [Browser review](browser-review.json): 29 states in eight views, all framed, plus repeatable scrubbing, connected head tracking, moving-target contact, travel and true-speed playback. [Combat review](combat-review.json): 34.0 s recording for 34 s of fight, 6/6 hits, settled gaze p95 0.006°. [Inline previews](inline-review.json): chapter selection, normal-speed playback, widths 320/736/1024.
- Both offline HTML files rebuilt unchanged. [Production checks](production-smoke.json) pass: source and offline live movement and combat (`tests/legs-v2.browser.mjs`), the prototype scenes (`tests/prototype.browser.mjs`), and the 50 creature-art regression tests. This patch does not touch the game; these confirm nothing regressed. The pre-existing expedition.js draft was not touched.
- Rendering: the reviews run Playwright's Chromium on Mesa llvmpipe ([launcher](../../../scripts/lib/review-browser.mjs)). That is about 3× faster than the headless shell's SwiftShader on this GPU-less machine, and matches it to 45–48 dB PSNR on checked combat frames. The combat arena's floor grid is a texture, because llvmpipe rasterized long grid lines running behind the camera as stepped slabs.

The final asset SHA256 is recorded in the unit, export, runtime, browser and combat reports.

## Reproduce

```sh
node scripts/build-meshy-fox-animated.mjs
node scripts/build-meshy-fox-preview.mjs
node --test tests/meshy-fox-rig.test.js tests/meshy-fox-motion.test.js tests/meshy-fox-archer.test.js
node scripts/inspect-fox-motion.mjs
node scripts/inspect-fox-motion.mjs --tracking
node scripts/review-fox-animated.browser.mjs
node scripts/review-fox-combat.browser.mjs
node scripts/build-fox-motion-inline.mjs
node scripts/review-fox-inline.browser.mjs
node scripts/serve-meshy-fox-preview.mjs
```

Requires installed project dependencies, Python with Pillow, Playwright's Chromium and ffmpeg (`npx playwright install chromium`), and on Linux Mesa's EGL driver (`libegl-mesa0`) for the llvmpipe reviews. `CHROMIUM_PATH` and `FFMPEG_PATH` override the browser and encoder. Open `http://127.0.0.1:3109/animated.html` or `/combat-demo.html`.

## Limits

This is a base-form preview. Clips are baked; the actor cross-fades whole clips and blends pairs of directional shots, but does not layer partial-body blends. The dummy and its arrows are scripted demo props, not game AI or physics, and hits are swept against a capsule. The chest twist is held to about 46° because more twist puts the anchor beyond the fox's arm reach. Sampled surface tests are not continuous collision detection. No numerical art-quality score is claimed.
