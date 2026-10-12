# Native Pixel v7 — faces, grips and committed melee

Open **Starfall-Training-Glade.html** and verify **NATIVE PIXEL V7** in the header. This updates the Training Glade movement prototype; the main expedition retains its separate combat/renderer until integration.

## What changed

- **Nine distinct faces.** Fixed front, profile, diagonal and rear layouts replace fractional feature positioning. A gold visor/red crest, square orc jaw/tusks, blonde fringe/green eyes, silver bob/violet eyes/circlet and fox cream muzzle distinguish the heroes. The hound has folded ears and cream jowls; the walker has a single lens, the spider an eye cluster and the jelly a pearl smile. Rear views omit frontal eyes and mouths.
- **Attached equipment in eight views.** Sword and staff grips follow the anatomical right hand, shield and bows the left. The axe has two fists spaced along one rigid handle. Weapon and shield layers follow depth; rear-facing equipment can pass behind the torso/head. Fists wrap handles, crossguards rotate with the shaft, and axe heads follow their handle. A low sword guard keeps a carried blade out of the face. Follow-through stays within the short arms' reach.
- **Canine movement.** Flat paws replace heel/toe roll. Low paw clearance, a four-beat walk, diagonal trot pairs, staggered front/rear gallop pairs, spine flex and matching loading/aerial intervals keep the dog quadrupedal. Supporting paws remain world anchors; rear hocks retain their lengths.
- **Fresh teams of six.** Each battle or restart draws six distinct creatures per side from the nine types, retaining at least two melee and two ranged creatures. Cards and the selector match the actual allied lineup. The directions, movement and pose labs retain all nine. Tests can supply a seed to replay a battle exactly.
- **Varied melee and anticipation.** The knight and orc alternate overhead and side swings. The actual weapon-tip sweep supplies contact for each style. Three levels show quick (gold), heavy (orange) and charged (cyan) windups, with one/two/three marks above the health bar and a matching telegraph. The hound and spider retain bite/lunge anatomy.

## Charged strikes

Every third melee strike charges. **Charged strike** or **C** requests one for the selected melee companion; a distant or unaligned request queues until the unit can strike. Ranged creatures cannot request this melee attack.

A charge costs **28 stamina** instead of 10, prepares for at least **0.85 seconds** (or 2.4 times the creature's normal windup), deals **1.7 times normal damage**, and has 15% longer recovery. From preparation through recovery it resists stun, knockdown and new impact displacement. Incoming damage still applies and lethal hits still kill the creature. Uncharged attacks retain poise interruption, and a target can physically dodge the committed path.

## Inspection and export

Use **8 directions** to compare faces. **Pose study → Overhead strike / Side slash / Charged strike** exposes the new actions from any facing. Use **Movement → Walk / Run / Sprint** with the hound selected to compare its gait. Restart a **Sparring match** for a new composition.

Cells remain native **64×64**, pivot **(32,44)**, with binary alpha and nearest filtering. The shared arena grid is 334×218, displayed at 1002×654. The Godot kit has **9,792 cells**: 17 states × 8 facings × 8 frames × 9 actors, with **136 clips per actor** and 1,224 total clips. Open `godot-sprites/project.godot` in Godot 4. Death/knockdown clips are baked from the browser solver; the Godot showcase demonstrates sprites and movement, while live combat, cloth and particle physics remain in the browser.

Rebuild with `npm run build:prototype`. With the server running, set `BASE_URL` and use `npm run export:prototype`; `npm run check:godot` imports, validates all resources and starts the demo. No new dependencies are required.

## Validation

The build passes **118 tests**, including directional grips through both swing stages, charged damage/interruption/death behavior, composition diversity and canine support. Browser verification covers ten scenarios, **18,048 rendered joint samples without gaps**, the shared pixel grid, controls, mobile layout and the embedded HTML with zero external requests. All 9,792 exported cells fit their bounds with binary alpha. Godot 4.6.3 imports and validates the resources and starts the demo.

Fifty seeded battles all finish within 120 simulated seconds; the longest takes 87 seconds. They cover about **41.9 simulated minutes**, 931 charged strikes and 541 resisted impacts. These are simulation results, not human playtime or a subjective quality score. See `tests/reports/milestone-1.json` for final build evidence and `public/prototype-preview.mp4` for the normal-speed recording.
