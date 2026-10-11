# Iteration 1 — The Training Glade

Implemented an isolated, playable visual and movement prototype containing Aurel the knight, Brakk the orc, Syl the elf archer, Nyra the caster, and Ember the wolf.

## Play

Open **Starfall-Training-Glade.html** directly in a browser. Artwork, scene code, styles, and generated audio are embedded. No installation or network connection is needed for the scene. To use the Expedition navigation, keep **Starfall-Menagerie.html** alongside it.

With the development server running, open `prototype.html`; the game footer also links to the Training Glade.

- **Sparring match:** five companions face five challengers. Select a companion, then click the ground to issue movement. Strike, dash, and dodge buttons let you inspect the selected character's actions.
- **Movement:** five independent circuits show different body types, stride lengths, walking, running, and direction changes.
- **Pose study:** inspect eleven animation states in eight directions. Use Focus selected, slow playback, pause, and Step frame for close inspection.

Keyboard controls work while the arena has focus: Space pauses, R restarts, D dashes, F strikes, and arrow keys issue movement orders.

## Artwork and animation

Original modular character artwork and a forest courtyard establish a direction inspired by the supplied Dimraeth trailer. No reference artwork is copied. The atlas contains front/back heads and torsos, upper/lower limbs, and weapons for five different bodies.

The source parts form articulated poses that are baked into cached directional sprite frames. Animation uses separate preparation and recovery clips, grounded gait phases, body-type proportions, recoil, dodge compression, and progressive falls. A bounded cache avoids generating an unbounded full-roster atlas. Ground position determines drawing order and shadows. World simulation interpolates between fixed physics steps.

Physics advances at 120 Hz. Melee commits its aim and connects only after the windup. Arrows and spells travel along their released path and hit the first hostile body. Rolls use actual displacement and stamina, without invulnerability. Mass controls impact displacement; poise breaks interrupt pending attacks. The final knockout continues falling after combat settles. Audio and impact effects are attached to actual contact/release events.

## Validation

- **77 rules tests passed**, including ten new prototype checks for windup timing, committed misses, physical rolls, projectile screening, mass-dependent impacts, interruption, final death, frame-interval independence, and planted gait geometry.
- **Seven browser scenarios passed**: scene controls; selected movement; locomotion and speeds; eight directions and eleven states; complete rendered sparring and sound controls; a 390px mobile layout; and the embedded standalone scene.
- **No uncaught browser errors** were recorded. The embedded prototype made **zero external requests**.
- The existing expedition's standalone browser check also passed combat, evolution, skill links, and save reload with zero external requests.
- The managed browser blocks direct `file:` navigation. Standalone checks execute the exact generated HTML through one intercepted local document and block all other requests. Opening a downloaded file in the user's own browser remains the final distribution check.
- A repeatable recording script captures the rendered movement, combat, close attack, and death sequence at normal simulation speed in a 30 fps MP4.

Commands: `npm test`, `npm run build:prototype`, and `npm run test:prototype`. The prototype browser check defaults to port 3003; set `BASE_URL` to the running server when needed. `node scripts/record-prototype.mjs` requires the installed system FFmpeg and Chromium and writes the normal-speed preview into `playtest-artifacts/`.

The [18-second normal-speed preview](public/prototype-preview.mp4) shows movement circuits, live sparring, a close attack, and a fall. [The recorded browser results](tests/reports/milestone-1.json) retain the seven scenarios and the default match's contact, evasion, and interruption counts. These are automated validation results, not human playtime or a fun score.

## Remaining review

This milestone supplies the five-body production prototype and the evidence needed to review the visual direction. The user has not yet accepted its resemblance, movement quality, or silhouettes. The poses are articulated composites rather than individually hand-painted frames; refinement may be needed before scaling production. Full-roster conversion, evolution art, campaign balance, terrain strategy, and the other roadmap systems remain in later iterations.
