# Native Pixel v6

Open **Starfall-Training-Glade.html** in Chrome, Edge or Firefox. Look for **NATIVE PIXEL V6** in the header. This offline movement prototype uses Canvas 2D and embeds its artwork, scene code and sound; playing needs no installation, WebGL or internet.

## Creatures and art

The five heroes follow the supplied pixel concept: a red-plumed knight, muscular green orc, blonde elven rogue, silver-haired mage and fox ranger. Ember is a separate **four-legged hound**, with front paws, rear hocks, a diagonal trot and a bounding gallop. Cog is a **six-legged brass walker** using alternating tripod steps. Vesper has **eight spider legs** with alternating support groups. Dew is a limbless moon jelly with squash, hop, channel and reform motion.

All nine characters are painted directly into **64×64 RGBA cells** with a shared **(32, 44) foot pivot**, crisp outlines and controlled color ramps. The sprite painter uses the same anatomical poses and weapon transforms as the physical arena. Limbs are shorter, grips remain connected, and stride/support were retuned to keep joints reachable. Every exported frame has binary alpha and fits its cell without clipped drawing. The forest courtyard retains the mossy ruins, golden lanterns and blue rune. The wide arena uses a 334×218 pixel grid enlarged exactly 3× to 1002×654; focus enlarges world pixels another 2×. Hero and animation showcases enlarge native sprites with nearest-neighbor sampling.

The five-hero showcase includes front, right, back and left views. The game and exports retain eight facings. A separate showcase provides idle, walk, run, turn, stop, attack, cast, dodge, hurt, knockdown, get-up and death examples for the selected companion. The generated concept board in `public/prototype-concept-v6.png` is the visual inspiration artifact; the exported PNG sheets come from the game's pixel painter.

## Motion and physical reactions

- **Walk/run/sprint:** distance-driven gait, acceleration, forward drive, opposing arms, world-planted supporting feet and stamina-paid sprinting. Each anatomy has its own support rhythm.
- **Cape flow:** three shoulder-anchored cloth panels use damped springs driven by speed and turn direction. They retain movement through braking and settle afterwards.
- **Direction changes:** large steering changes enter a turn pose, with stepping, torso counterrotation and delayed cloth movement.
- **Fast stops:** deceleration enters a compressed brake pose, followed by recovery into the standing stance. Foot recovery completes as momentum falls.
- **Physical dodge:** directional lean, lead-foot lift and actual arena displacement. A connected attack still deals damage during a dodge.
- **Ragdolls:** living creatures suffer knockdown when a committed heavy hit breaks poise. Fixed-length particle constraints, gravity, impact direction, collision radii and floor contact drive the fall. Survivors blend back into the standing pose during get-up. Death physics continues after combat ends. Jellies flatten and reform to suit their anatomy.

The Training Glade uses a nine-versus-nine stress scene. The six-creature expedition and its progression remain their own integration milestone in `ROADMAP.md`.

## Controls

Use the roster dropdown or companion cards to select a creature. Cards bring the arena into view. **Movement** has Walk, Run and Sprint controls; click clear ground to issue a destination. **Pose study** has fifteen states, including Change direction, Fast stop, Physical dodge, Knockdown and Get up. Pause, step frames, slow playback and focus are available.

With the arena focused: Shift holds sprint; S toggles sprint; Space pauses; R restarts. During sparring, D dashes, F strikes, and the action buttons issue Attack, Dash and Dodge commands.

## Godot 4 export

Open **godot-sprites/project.godot** in Godot 4. It includes nine PNG atlases, nine `.tres` SpriteFrames resources, an animation manifest and a playable sprite showcase. The export contains **8,640 cells**: 15 states × 8 facings × 8 frames × 9 creatures. Each actor has **120 named animations**, such as `run_s`, `attack_ne`, `knockdown_w` and `getup_e`.

Cells are 64×64, use pivot (32, 44), and keep the same resolution and identity across frames. Use nearest filtering and disable mipmaps for sprite textures. The resources refer to `res://sprites/<id>.png`; keep that folder at the project root when copying resources into another project, or update their texture references. The Godot demo supports 1–9 to select, arrows to move, Shift to sprint, Space to cycle poses, and Q/E to change facing.

Death and knockdown sheets contain baked frames from the physical solver. Live particle ragdoll and cloth simulation run in the browser prototype; the Godot project demonstrates the exported animations and movement, and is a starting point for integrating those live systems.

## Development and checks

Run `npm run build:prototype` after source edits. Start the server with `npm start`, then use `BASE_URL=<running server> npm run test:prototype`. `npm test` includes sprite bounds, alpha, facing, anatomy, ragdoll, knockdown and cloth checks alongside the existing rules and reference-model checks.

`BASE_URL=<running server> npm run export:prototype` regenerates the Godot assets. `npm run check:godot` imports and launches the demo headlessly with the installed Godot binary; the helper uses writable XDG directories under `/tmp`. Set `GODOT_PATH` when needed. Validation used Godot **4.6.3**.

The final build passes **111 tests**, **nine browser scenarios**, **18,048 rendered joint samples with no gaps**, a consistent three-pixel scene-grid check, and **zero external requests** from the exact embedded HTML. All **8,640 exported cells** pass bounds and binary-alpha checks. Godot import and demo startup pass. The preview is **60 seconds at 30 fps**, with simulation time explicitly advanced at normal speed. These checks establish specific behavior and asset properties; visual 9/10 scores and human playtime remain separate review evidence.
