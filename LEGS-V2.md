# Legs V2

Fang & Feather now uses anatomy-specific leg proportions and compact gaits. Heavy animals have thicker supporting thighs, calves and paws; deer, insects and spiders retain their more slender shapes. Humanoids have separate proportions for armored, bulky, light and skeletal bodies.

The **Stride length** slider in Settings runs from 50% to 150%, with 100% as the new default. It changes foot travel and cadence together, including the small-sprite cadence limit. Short legs trim an unreachable landing arc before inverse kinematics instead of stretching a bone. Running uses less crouch and knee lift; heavy creatures and segmented bodies lift their feet more conservatively. World-space contacts, heel/toe support, canine hocks and natural attacks remain connected to the same rig.

Rounded joint surfaces replace the transverse cylinders that produced dark bands across fur. Hip attachment corrections now follow the leg axis. The existing painted feet are removed before the modeled limbs are drawn, leaving one set of legs. Foot shapes distinguish paws, hooves, armored feet, insect tips and boots.

Material selection follows the authored color at the attachment, retaining its palette indices for collection recolors. White fur keeps its highlights; neighboring crystals and outlines cannot become the dominant leg material. Thighs, calves and boots keep coherent materials through bends rather than changing color in independently sampled horizontal stripes. Cached material profiles avoid repeating that analysis every frame.

## Visual review

The review covered 41 anatomy families across juvenile, mature and apex forms, enlarged directional sheets, live twelve-creature combat, and decoded normal-speed walking/running/sprinting footage. Refinements removed a flat body seam and blocky joint shading, then improved segmented-leg readability. My visual acceptance assessment is **9/10** for leg proportions, attachment, material continuity and motion in the established pixel style; this is a subjective art judgment.

- [Heavy-body detail sheet](public/legs-v2-heavy.png)
- [Paws and hooves detail sheet](public/legs-v2-paws.png)
- [Normal-speed motion preview](public/legs-v2-preview.webm)

## Verification

`tests/legs-v2.test.js` checks all 89 collection families in three forms, eight facings and five movement/fall poses (10,680 rendered poses). Every anatomy also passes 64-phase walk/run/sprint reach checks at 50%, 100% and 150% stride length. Additional checks cover heavy-leg widths, coherent materials, older-setting defaults, reset, cadence response and unchanged combat stats.

The source and offline browser checks exercise twelve live creatures, both-team stride changes, animation, reset, 320/390px layouts and zero external offline dependencies. The settings suite verifies all 19 sliders, saved values and five-second creature rotation. The Training Glade suite checks directions, locomotion, sprint/stamina, pose inspection, combat and offline operation.

Rebuild with `npm run build:standalone` and `npm run build:prototype`. Legacy offline HTML filenames and save identifiers remain compatible. Run the visual review with `node scripts/review-legs-v2.mjs final` against the local server; it writes enlarged sheets under `playtest-artifacts/` and regenerates the motion preview.
