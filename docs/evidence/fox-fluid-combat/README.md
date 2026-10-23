# Fluid fox arms and a game-accurate combat replay

This pass has two parts. Ten improvements to the biped fox's motion, found by auditing every clip and the live fight for discontinuities. And the combat demo rebuilt so that it replays a **real fight recorded from the game's Battle engine**, using the game's stats and rules rather than invented ones.

## The ten improvements

1. **Arms never snap.** The retarget left one-frame elbow flips, sleeve-roll flips and a drawing paw that teleported to the quiver. These reached 180° in one 120 Hz frame, in 40 of the 44 clips. Every arm is now rebuilt about a canonical elbow hinge, so the bone roll depends on the pose alone. Hand sockets hold their rest rotation. Remaining snaps are eased into, with lead-ins scaled to their size. The worst per-frame turn of any arm, paw or bow in any clip is now under 25°; the fastest is a paw riding a side flip's spin. Peak angular acceleration fell from about 2.5M to 0.17M °/s² ([before](clip-audit-before.txt), [after](clip-audit-after.txt)).
2. **The free arm has its own resting place.** The bow arm bends 40° to carry the bow. The empty arm hangs looser (32°) and slightly back, with its paw turned toward the thigh, 3 cm behind the bow paw ([values](arm-values-after.txt)).
3. **Idle breathes.** The arms rise and settle on a 4 s breath. Elbow range is now about 5° (it was 0°), and the 8 s loop closes exactly.
4. **Overlapping action.** A damped spring makes the forearm trail the upper arm's swing and settle after stops. The arms also trail the chest through turns. All of these effects fade to the shared rest pose at clip ends.
5. **Gait-matched swing.** Walk counter-swings from the thighs (correlation −0.82/−0.84 with the same-side leg). The free arm swings more than the bow arm (44° vs 37°). Run's bow-arm snaps are low-passed around its loop.
6. **Smooth shot hand-offs.** C2 blends move into and out of each shot. The drawing paw now travels from rest straight to the quiver mouth instead of through the old ready pose behind the hip, where it passed through the tail.
7. **Blend-safe runtime.** Every clip shares one arm-roll convention, and a fade interrupted mid-way keeps the whole on-screen mixture. Clips can now cross-fade at any moment without flipping. In the same game fight the previous asset shows 103 isolated snaps, up to 163°; this one shows 4 marginal frames at about 26° ([replay audit](replay-pops.txt)).
8. **Gaze and trunk aim on the biped.**
   - The head tracks the enemy, and the spine and chest turn the nocked arrow's own line onto a leading aim point.
   - Targets are eased, so a dodge roll is crossed in a quick turn rather than one frame.
   - A target passing behind fades out of the head turn instead of flipping it to the other side.
9. **Layered locomotion and shooting.**
   - The legs follow the game's movement: forward run or the eight bow-walk directions, at the measured speed.
   - The upper body shoots on the game's cadence, with each release on the game's shot.
   - Close shots run as one continuous cycle, changing bow angle at the shared rest pose.
10. **Combat interactions from the game.** The enemy body plays Brakk's real actions:
    - telegraph sectors sized from the game's reach and arc;
    - the windup raise, then the swing through the game's contact phase (the last 28% of the windup);
    - the Sundering Rush lunge, the braced cast and dodge rolls;
    - spring flinches, arrows stuck where they land, and the knockout.

    Rowan's sidesteps play as airborne leaps; a stagger plays the hit reaction. HP bars and the caption follow the game.

## The game-accurate fight

[`scripts/record-game-skirmish.mjs`](../../../scripts/record-game-skirmish.mjs) runs the game's own `Battle` headless (rules v17, seed 7). The fight is Rowan, in seat 1 with the Copper Practice Bow a Ranger starts with, against the Unseasoned level 1 Brakk that the first-world encounter builder rolls. The recorder hooks the engine's projectile and hit paths and writes every 0.04 s step to [`game-skirmish.json`](../../../public/meshy-fox-preview/game-skirmish.json).

| | Rowan | Brakk |
|---|---|---|
| HP / attack | 187 / 39 | 247.5 / 21.4 |
| Armor / range | 7 / 230 | 12 / 30.2 |
| Attack interval | 1.3 s | 1.3 s |
| Speed | 94.9 u/s | 75.5 u/s |

The fight takes 11.92 s:

- **Arrows:** Rowan fires 7, including one Moontrail Fan, and all 7 hit.
- **Brakk's strikes:** Sundering Rush deals 72.7 plus bleed, followed by two Ironjaw Cleaves.
- **Dodges:** Rowan sidesteps twice; Brakk rolls away from arrows three times.
- **Result:** Rowan wins on 34 HP.

[`game-replay.mjs`](../../../public/meshy-fox-preview/game-replay.mjs) shows that fight on the 3D models. Units map by the game's own size rule (a creature is 120 × its world scale tall), so Rowan's 45.6 units equal the 3D fox's 1.10 m: 41.4 units per metre.

Game movement is 2.5–5× faster in body-lengths than the authored clips, so they play faster to match, as chosen. Positions and facing are always the game's.

- [Replay video](combat-demo.webm) (14.2 s at 1×), [decoded sheet](combat-decoded.png), [enlarged frames](combat-decoded-2.15-enlarged.png), [review summary](combat-review.json).
- [`tests/game-skirmish.test.js`](../../../tests/game-skirmish.test.js) checks the replay against the game:
  - The committed recording must equal a fresh engine run, so a game rules change fails until it is re-recorded.
  - The fox's ground position equals the game's every frame.
  - Each 3D arrow leaves the bow within one frame of the game's shot.
  - Stuck arrows equal the game's hits.
  - No isolated snap exceeds 30°.

The old training-dummy demo (`combat-demo.html`, prior proxy fox) is unchanged.

## Visual review

- Arm before/after:
  - five poses × 4 facings: [before](arms-before-close.png), [after](arms-after-close.png);
  - 15 poses × 8 facings: [before](arms-before-eight-facings.png), [after](arms-after-eight-facings.png);
  - [normal-speed sequence](arms-sequence.webm), with a [decoded sheet](arms-decoded-sheet.png), [native](arms-decoded-native.png) and [enlarged](arms-decoded-enlarged.png) frames.
- All 44 actions in S/SE/E/NE/N/NW/W/SW (`*-eight-views.png`), the [action reel](all-actions.webm), the [acrobatic combo](acrobatic-combo.webm) and the [browser review](browser-review.json).

Reviewed scope is the **base biped fox, all 44 actions, eight facings, plus the recorded fight**. This is the isolated 3D preview; no gameplay families or evolution forms change, and the game's code is only read.

## Validation and limits

- [79 passing tests](unit-tests.txt). New tests: no arm, paw or bow snap in any clip; the bow and free arms' different rest poses and Idle breathing; Walk's gait-matched swing; and the game-replay checks. The snap and asymmetry tests fail on the previous asset (179.8° per frame; mirrored arms). Existing thresholds are unchanged.
- [glTF validation](gltf-validation.txt): zero errors, the same three source warnings.
- [Both offline builds](offline-builds.txt) and [source/offline game checks](game-source-offline.txt) pass.
- **Limitations:**
  - At game speed the clips run up to about 3–7×, so gaits are quick: the run cycle at 2.3 m/s turns arms 40–60° a frame, and chained shots 0.64 s apart flick the drawing arm.
  - Brakk is drawn with the stand-in brute body; there is no orc model in the repository.
  - The draw itself still crosses the chest seen from directly in front, as before.
