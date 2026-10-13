# V14 · Sprite Art V3

Application 0.10.0 completes the recovered sprite overhaul. Open
`Starfall-Menagerie.html` for the expedition or `Starfall-Training-Glade.html`
for movement, combat and pose inspection. Both files work offline. Existing
collections use the new artwork immediately; save schema remains 5.

## Artwork and motion

There are 41 source anatomies, each with juvenile, mature and apex artwork and
eight directional views. These serve the existing 89 collection families through
anatomy templates and elemental palettes; they are not 89 bespoke source sheets.
Evolution preserves body type and develops proportions, manes, horns, wings,
shells and other defining features. Unrelated humanoid substitutions and
extra-head overlays are removed. Single-evolution families use apex art at their
final stage. Wild/Warden branches retain existing mechanics and have different
equipment finishes where applicable.

The sixty retained collection entries have explicit anatomy assignments.
Twelve new source types include foxes, cats, rabbits, rodents, rhinos, turtles,
owls, fish, mushrooms, mantises, clams and squid. Related legacy entries still
share templates; this release adds no new gameplay families.

Walk/run/sprint deform textured legs with the physical gait. Weapons, bows,
shields and staffs attach to moving hands through articulated forearms. Blade
bevels, axe sockets, hammer faces and bow limbs are rebuilt. Hair uses a delayed
travelling wave; capes follow the shoulder-anchored cloth mesh. Wings, tails and
tendrils move with their poses. Suitable faces blink and express hurt/death.
Imported costumes replace flat evolution overlays. Native animal sprites no
longer expose the calibration skeleton beneath their painted limbs.

The masters were AI-generated, then imported deterministically into 64×64,
binary-alpha, shared-palette cells. Animation is rig-driven deformation with
separately drawn equipment, not hand-drawn sheets for every action. Rear NE
views mirror genuine NW views; newer legacy sheets also mirror paired side and
three-quarter views. Masters are retained in `public/`. `npm run import:art`
rebuilds the datasets.

## Visual self-review

Reviewed knight/goblin/fairy benchmarks, eight-direction sheets, all 89
families' actual base/final forms, movement/combat footage and the live arena.
These are subjective self-assessments, separate from automated checks:

| Quality | Score | Review basis |
| --- | ---: | --- |
| Chibi proportions | 9/10 | Rounded juvenile heads and compact bodies; developed mature/apex proportions. |
| Faces/personality | 9/10 | Readable eyes, varied ears/muzzles, expressions and genuine rear views. |
| Clothing/equipment | 9/10 | Layered costumes, shaded gear and physical hand-to-grip connections. |
| Shading/color | 9/10 | Material ramps, preserved pale bellies/glints and elemental recoloring. |
| Creature individuality | 9/10 | 41 anatomies replace generic substitutions; lineages keep recognizable bodies. |
| Environment fit | 9/10 | Consistent pixel scale, perspective and forest-arena contrast. |

Limitations: related legacy creatures share anatomy, some views mirror, and
procedural deformation can look stiffer than bespoke frame animation. Scores
do not establish user acceptance, percentage reference similarity, human
playtime or a measured fun rating.

## Verification

- Full suite: 182 tests covering connected hands, independent hair/cape motion,
  stage contracts, anatomy, silhouettes, all-family bounds, combat and saves.
- Training Glade: eight views, seventeen states, joint coverage, planted gait,
  run/sprint/stamina, physical combat, controls, mobile and offline play.
- Main game: legacy migration and fresh native offline play with zero external
  requests; equipment, roster, practice and mobile checks.
- Standard and Chaos 1 legal UI campaigns each clear three worlds/fifteen fights,
  growing from two companions to six without cheat state.
- Default-size retention: Aurel 864/864, Syl 1007/1007, Nyra 1053/1053 compared
  opaque source texels retained (100% each).
- Native Godot export: 29 families, 117 variants, 127,296 checked cells. Training
  export: nine actors, 9,792 checked cells. Godot import/run checks pass.

Evidence: `tests/reports/sprite-art-v3.json` and
`public/art-v3-release-evidence.zip`. The preview is an 18-second, 30 fps WebM
from the rebuilt renderer and actual Training Glade combat.

## Artifacts and rebuilds

- `public/Starfall-V14-Art-V3.zip`: both offline games, this guide and previews.
- `public/native-roster-godot-v14-part*.zip`: native forms and runnable showcase; extract all parts into the same directory, then open project.godot.
- `public/training-glade-godot-v9.zip`: Training Glade Godot sprite project.

Verified locally with Node 24, Chrome and Godot 4.6.2. Set `CHROMIUM_PATH`,
`GODOT_PATH` and `BASE_URL` for the host. Build with `npm run build:prototype`
and `npm run build:standalone`; record with `npm run record:art`. Later gameplay
roadmap items remain in `CONTINUATION.md`; this release completes the sprite work.
