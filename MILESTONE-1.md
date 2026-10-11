# Iteration 1 — The Training Glade · Natural Motion v3

Implemented an isolated, playable visual and movement prototype containing Aurel the knight, Brakk the orc, Syl the elf archer, Nyra the caster, and Ember the wolf. The direction correction replaces the initial shared front/back heads and torsos with **40 painted head views and 40 painted torso views**.

Motion v2 replaces the distorted limb and weapon rendering with **30 aligned limb/foot parts**, original vertical weapon artwork, and an anatomical rig. The knight has full greaves and boots, the orc has a wider, lower stance, and the wolf has different foreleg and hind-leg bends. Painted neck joins, higher-resolution frames, and correct overlap at grips keep the pieces connected.

Natural Motion v3 refines the gait and adds a playable sprint. Humanoids transfer weight through a heel strike, support, toe-off, and lifted recovery; opposing arm swings and a modest torso counterturn replace the rigid upper body. Sprint has a stronger forward lean, longer stride, increased foot lift, and a brief aerial phase. Velocity changes have acceleration and braking limits; characters face their direction of travel while moving and slow through tight turns.

The wolf now walks with a four-beat sequence, trots on diagonal pairs, and transitions to a gallop while sprinting. Its rear legs have separate knee and hock joints. The revised limb atlas removes paws from the lower-leg pieces; paws are drawn only once. Painted limbs overlap at their shared joints, with narrow shaded bridges underneath the artwork at shoulders, hips, knees, elbows and ankles. The axe remains in both hands while moving as well as attacking.

## Play

Open **Starfall-Training-Glade.html** directly in a browser. Artwork, scene code, styles, and generated audio are embedded. No installation or network connection is needed for the scene. To use the Expedition navigation, keep **Starfall-Menagerie.html** alongside it.

With the development server running, open `prototype.html`; the game footer also links to the Training Glade.

- **8 directions (opening scene):** the selected character appears in East, Southeast, South, Southwest, West, Northwest, North, and Northeast views side by side. Choose any companion to compare it. Click a view to open its focused pose inspection; animation buttons apply to all eight views.
- **Sparring match:** five companions face five challengers. Select a companion, then click the ground to issue movement. Strike, dash, and dodge buttons let you inspect the selected character's actions.
- **Movement:** five independent circuits show different body types, stride lengths, walking, running, sprinting, and direction changes. Choose Auto, Walk, Run, or Sprint to change the entire scene. The selected companion also has a Sprint toggle. Click the ground to send that companion along a straight order while the others continue their circuits.
- **Pose study:** inspect twelve animation states in eight directions. Use Focus selected, slow playback, pause, and Step frame for close inspection.

Keyboard controls work while the arena has focus: Space pauses and R restarts. In sparring, D dashes, F strikes, and arrow keys issue movement orders. Hold Shift to sprint with the selected companion, or press S to toggle it. Sprint costs 20 stamina per second, needs 25 stamina to request, and falls back to walking at 8 stamina. Release it and request it again after recovering. Sprint is a sustained pace; Dash remains a separate short action.

## Artwork and animation

Original modular character artwork and a forest courtyard establish a direction inspired by the supplied Dimraeth trailer. No reference artwork is copied. The original limb/weapon atlas is joined by two five-row, eight-column head and torso atlases. Side profiles show different anatomical contours; rear views show the backs of helmets, hair, hoods, armor, and fur. Head and torso views are drawn directly from their own direction cells, without using mirrored frontal art for diagonal or profile views.

The source parts form articulated poses baked at 1.5× resolution into a bounded 192-frame cache. Two-segment inverse kinematics keeps thigh, shin, hock, upper-arm, and forearm lengths consistent. Boots and paws are independent from the shins. Supporting feet are stored in world coordinates; turning the torso does not drag them across the floor. Swinging feet lift and ease toward their next landing. Collision-forced support changes replant a foot explicitly rather than stretching a bone.

Walking, running, and sprinting blend their support timing, stride, and lift. Acceleration controls pose strength, hips absorb the step, and the head has a smaller bob. Bone geometry turns in smaller angular increments while the head/torso retain their eight painted views. Characters align toward a target before beginning an attack; movement orders slow near their destination. Pose study uses the character's actual walk/run and attack durations instead of one slow cycle for every action.

Weapon grips share the arm rig. Both orc hands stay on one rigid axe shaft; the archer's draw hand meets the animated string, which releases without leaving a painted static string behind. Arrows leave the bow grip and bolts leave the staff crystal, following committed trajectories toward torso height. Sword and axe trails follow the actual tip path.

Physics advances at 120 Hz. Melee prepares during the first 72% of its windup, then sweeps the visible weapon tip through each physics step. Only a connected sweep deals damage. Contact briefly pauses the weapon, emits audio/particles at the contact point, and imparts momentum based on swing speed, weapon weight, and target mass. Each swing limits repeat hits. Arrows and spells strike the first hostile body; rolls use actual displacement and stamina, without invulnerability. Poise breaks interrupt pending attacks. Death first lowers the body and folds the legs, then falls; the final knockout continues animating after combat settles.

## Validation

- **92 rules tests passed**, including twenty-five prototype checks. The rig checks cover consistent segment lengths, planted ankle height, fixed world contacts during turns, two hands on one axe handle, continuous contact/recovery poses, blended walk/run timing, the bowstring draw hand, physical blade misses, impact pauses without duplicate damage, and gradual target alignment. New checks cover reachable limbs during live walk/run/sprint turns, carried grips across all three gaits, heel-to-toe transfer, wolf hocks, sprint acceleration and stamina costs, exhaustion and recovery, and sprint frame-interval independence. Contact checks verify the blade/body intersection before recoil moves the target. Existing checks cover physical rolls, projectile screening, mass-dependent displacement, interruption, final death, and frame-interval independence.
- **Nine browser scenarios passed**: opening directional comparison and close inspection; scene controls; selected movement; locomotion and speeds; sprint pace/toggle/Shift controls and stamina recovery; eight directions and twelve states; complete rendered sparring and sound controls; a 390px mobile layout; and the embedded standalone scene.
- Directional verification compares each character's eight isolated sprites at the **same idle phase**, rather than hashing a changing whole scene. All five have eight distinct results. Each character also turns through all eight facings during the movement circuit. The comparison screenshots were visually inspected for profiles, front views, and rear views. Rendered joint coverage checks sample shoulders, hips, elbows, knees, hocks and ankles across all eight directions, three gaits and four fixed gait phases.
- **No uncaught browser errors** were recorded. The embedded prototype made **zero external requests**.
- The existing expedition's prior standalone browser check passed combat, evolution, skill links, and save reload with zero external requests. This revision validates the Training Glade.
- The managed browser blocks direct `file:` navigation. Standalone checks execute the exact generated HTML through one intercepted local document and block all other requests. Opening a downloaded file in the user's own browser remains the final distribution check.
- A repeatable recording script captures rendered walking, running, sprinting, release/braking, close creature motion, combat, attacks, and death at normal simulation speed. It pauses the browser clock before recording so wall time spent encoding frames cannot advance the simulation. The output is a 30 fps MP4.

Commands: `npm test`, `npm run build:prototype`, and `npm run test:prototype`. The prototype browser check defaults to port 3003; set `BASE_URL` to the running server when needed. `node scripts/record-prototype.mjs` requires the installed system FFmpeg and Chromium and writes the normal-speed preview into `playtest-artifacts/`.

The [42-second normal-speed preview](public/prototype-preview.mp4) shows knight/wolf directional comparisons, walking, running, sprint acceleration and release, a close wolf gallop, connected orc walking, sword/bow/staff actions, live sparring, and a fall. Compare the [elf](public/prototype-directions-elf.png) and [wolf](public/prototype-directions-wolf.png) views directly. [The recorded browser results](tests/reports/milestone-1.json) retain the nine scenarios and the default match's contact and evasion counts. These are automated validation results, not human playtime or a fun score.

## Remaining review

This milestone supplies the five-body production prototype and the evidence needed to review the visual direction. The user has not yet accepted its resemblance, movement quality, or silhouettes. The poses are articulated composites rather than individually hand-painted frames; refinement may be needed before scaling production. Full-roster conversion, evolution art, campaign balance, terrain strategy, and the other roadmap systems remain in later iterations.
