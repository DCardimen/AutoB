# Iteration 1 — Training Glade · Connected Rigs v4

The five-character prototype now renders Aurel the knight, Brakk the orc, Syl the elf archer, Nyra the caster and Ember the wolf from original skinned 3D models under a fixed isometric camera. Heads, necks, torsos and limb roots belong to one welded skin surface per character. Armor, hair, equipment and cloth attach to their bones. This replaces the independently cropped painted heads, torsos and limb images used in v3.

Character proportions are defined once. Facing rotates the model continuously through 256 sampled angles while the interface retains eight named directions. Every direction uses the same geometry and scale. Muted materials, pigment variation, original modeled equipment and the existing forest courtyard establish the new visual pass. These are procedural character sculptures, not commissioned production models or a claim that the reference's art quality has been reached.

## Play

In GitHub Desktop, select `codex/starfall-menagerie`, click Fetch origin and Pull origin when available, then open `Starfall-Training-Glade.html` from Show in Explorer. Refresh the browser after updates. Look for **CONNECTED RIGS V4** in the header.

The HTML includes the renderer, character construction, scene code, background, styles and generated sound. It needs a browser with WebGL2 support; Chrome and Edge support it with hardware acceleration enabled. It makes no network requests and needs no Node installation for playing. Keep `Starfall-Menagerie.html` alongside it to use the Expedition link.

- **8 directions:** compare the selected companion in all eight views; click a view for close inspection.
- **Movement:** choose Auto, Walk, Run or Sprint. Click the ground to send the selected companion to a point. Sprint requires 25 stamina, costs 20 stamina/second, and falls back to walking at 8 stamina. Release and request again after recovery.
- **Sparring:** five companions fight five challengers. Select a companion, issue ground orders, or inspect Strike, Dash and Dodge.
- **Pose study:** inspect twelve states, pause, step individual frames, slow playback and focus the selected character.

While the arena has focus: Space pauses, R restarts, Shift holds sprint and S toggles it. Sparring also supports D for dash, F for strike and arrow keys for movement orders.

## Motion and contact

Authored periodic curves supply landing compression, support-side pelvis sway, opposing arm swings and spine counterrotation. Profiles differ between the armored knight, heavy orc, light archer, caster and quadruped. Walk, run and sprint blend their stride, support duration, foot lift and pose strength. The wolf has four-beat walking, diagonal trotting and a separate gallop rhythm with rear hocks.

The anatomical IK solver and physical weapon paths remain shared between rendering and simulation. Supporting feet retain world-space positions and orientation while the torso turns. Heel strikes lift the toe; toe-off raises the ankle around the modeled sole contact. Supporting shoes and paws remain at floor level. Stopping completes one short recovery step at a time. Acceleration and braking limits control actual travel speed; gait advances by distance traveled. Walking speeds and longer run/sprint strides keep footfall cadence plausible instead of speeding up a walk cycle. Sprint has forward lean, stronger arm drive and aerial support intervals. Hip height follows continuous authored tracks through takeoff and landing.

Movement-to-attack blends preserve the carried body/hand pose and finish before active contact. Dash and dodge poses enter and exit at the resting stance. Dodges lean and step toward the actual escape direction, lifting the leading foot while the trailing foot supports the body. Melee adds shoulder/spine rotation through preparation, contact and recovery. The rigid sword and axe move with the same hand transforms used by collision sweeps. Both axe hands share one handle. The archer's draw hand follows the animated string; staff and arrow release positions come from the same rig. Connected impacts briefly pause the strike, apply mass-dependent displacement and interrupt windups when poise breaks. Dodges use real displacement without invulnerability. Hit/stagger poses lean with recoil; falls rotate and lower the posed model onto the ground.

Rigid detail meshes are batched by material within each bone to reduce draw calls. Animated skin remains welded and bone-driven; boot, weapon and cloth articulation is retained. Portraits and isolated pose inspections rasterize at 1.5× into a bounded 192-frame cache. The arena draws all posed character instances in one WebGL pass, then combines that pass with the existing 2D background, controls and combat effects. Arena resolution follows device pixel density up to 1.5×.

## Development and verification

Use Node 20+, `npm ci --cache /tmp/autob-npm-cache --ignore-scripts --no-audit --no-fund`, then `npm run build:prototype` and `npm start`. Building bundles the locally pinned Three.js dependency into `public/prototype-bundle.js` and embeds that bundle in the offline HTML. Rebuild after editing prototype source.

`npm test` covers game rules, rig/contact behavior and the new model checks. `BASE_URL=http://127.0.0.1:3006 npm run test:prototype` checks the running prototype; change the port to the server in use. `BASE_URL=... node scripts/record-prototype.mjs output.mp4` records 42 seconds at normal simulation speed using the installed Chromium and FFmpeg.

Model checks verify one connected skin component per character, normalized finite bone weights, canonical height across directions, matching rendered/physical weapon grips, both axe hands, anchored boot orientation and closed authored gait curves. Browser checks inspect rendered neck paths as well as shoulders, hips, elbows, knees, ankles and hocks across directions and gait phases. The v3 pixel check did not cover neck joins and was insufficient evidence for natural-looking anatomy.

The final build passes **105 rules/model tests and nine browser scenarios**, including **9,792 rendered neck and limb samples with no gaps**. The exact embedded HTML runs with **zero external requests**. The preview records 42 seconds at 30 fps with simulation time explicitly stepped at normal speed. Recorded results are in `tests/reports/milestone-1.json`. Automated checks establish specific technical properties; they do not award a visual 9/10 or establish human playtime.

## Review status

This remains the five-character movement prototype. The 9/10 target requires normal-speed visual review of anatomy, proportions, walking, ground contact, sprinting, transitions and combat motion. In particular, the new stylized model finish and movement need comparison against the supplied reference before full-roster production. Campaign systems and the wider roster remain later roadmap iterations.
