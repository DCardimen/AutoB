# Companion greetings and Brakk's arms

Selecting or deselecting a first-form companion plays a short greeting based on its authored animal/design. Aurel rests his sword near his shoulder; Brakk waves with his free hand; Voltwing blinks and tilts its head. Animal foxes nuzzle, fish swish, winged companions flutter, mushrooms wobble, insects skitter, and magic users greet with a cast pose. Hearts or sparkles provide a small additional response. Repeated clicks restart the greeting, filtering/sorting preserves an active greeting, and reduced motion suppresses movement. Evolution forms receive no menu reactions.

Brakk's original painted cuffs, forearms and fists are extracted from the body layer and skinned as one pair. The old arm pixels are removed from the costume, and the generic arm drawing is skipped for base Brakk. The replacement uses the original arm pixels, shape thickness, palette indices and cuff texture. Its shoulder, elbow and fist remain connected; the weapon stays on the original right hand. This base-arm repair also applies in live combat. His evolution artwork and other families' arm renderers are unchanged.

## Review scope and source anatomy

Reviewed original sprites in all eight directions and all three available artwork stages for the 41 authored designs: feralfox, cat, rabbit, rodent, rhino, turtle, owl, fish, mushroom, mantis, clam, squid, knight, orc, elf, caster, fox, goblin, fairy, lion, bear, stag, drake, beetle, bat, phoenix, rogue, frostelf, troll, wolf, mech, spider, jelly, serpent, harpy, moth, crab, centipede, dwarf, minotaur and skeleton. Greetings use that visible design rather than its reused physics proxy. No leg classification or gait is changed.

Original review sheets: [0](evidence/starter-reactions/reaction-source-0.png), [1](evidence/starter-reactions/reaction-source-1.png), [2](evidence/starter-reactions/reaction-source-2.png), [3](evidence/starter-reactions/reaction-source-3.png), [4](evidence/starter-reactions/reaction-source-4.png), [5](evidence/starter-reactions/reaction-source-5.png), [6](evidence/starter-reactions/reaction-source-6.png), [7](evidence/starter-reactions/reaction-source-7.png), [8](evidence/starter-reactions/reaction-source-8.png), [9](evidence/starter-reactions/reaction-source-9.png), [10](evidence/starter-reactions/reaction-source-10.png).

Brakk's west-facing far hand is an authored six-pixel sliver in one column. That occlusion is explicitly preserved and tested; no broad extra arm is manufactured. [Original/current comparison](evidence/starter-reactions/gaits-carry-final-orc.png) covers every facing and form. [Locomotion cycles](evidence/starter-reactions/gaits-carry-final-brakk-motion.png) compare base and evolved movement.

Reviewed native and enlarged greeting cycles for [Brakk](evidence/starter-reactions/reaction-cycle-brakk.png), [Aurel](evidence/starter-reactions/reaction-cycle-aurel.png), [Syl](evidence/starter-reactions/reaction-cycle-syl.png), [Nyra](evidence/starter-reactions/reaction-cycle-nyra.png), [Cinderfox](evidence/starter-reactions/reaction-cycle-cinderfox.png), [Mossguard](evidence/starter-reactions/reaction-cycle-mossguard.png), [Brookfin](evidence/starter-reactions/reaction-cycle-brookfin.png), [Voltwing](evidence/starter-reactions/reaction-cycle-voltwing.png), [Bloomkin](evidence/starter-reactions/reaction-cycle-bloomkin.png), [Duskcap](evidence/starter-reactions/reaction-cycle-duskcap.png), [Cogwalker](evidence/starter-reactions/reaction-cycle-cogwalker.png), and [Runespider](evidence/starter-reactions/reaction-cycle-runespider.png).

## Video and live evidence

- [Normal-speed greeting recording](evidence/starter-reactions/starter-reactions.webm), [decoded native/enlarged frames](evidence/starter-reactions/starter-reactions-playback.png), and [decode times](evidence/starter-reactions/starter-reactions-video.json).
- [Brakk normal-speed motion recording](evidence/starter-reactions/brakk-all-motion.webm): all eight directions and all three forms, through idle, walk, run, sprint, turn, stop, attack, slash, charge, cast, dash, dodge, hit, stagger, knockdown, getup and death. [Decode times](evidence/starter-reactions/brakk-motion-video.json); one decoded `brakk-motion-STATE.png` per state is stored beside the video.
- [Existing gait/carry video playback](evidence/starter-reactions/gaits-carry-motion-playback.png) reviewed after the arm repair.
- Actual menu captures: [Brakk](evidence/starter-reactions/starter-reaction-brakk.png), [Aurel](evidence/starter-reactions/starter-reaction-aurel.png), [owl](evidence/starter-reactions/starter-reaction-voltwing.png).

## Validation

- Focused arm/reaction tests: seven pass. They check source-arm removal, original cuff/hand widths, all eight directions through all 17 motion states, connected painted arms, cell boundaries, physical weapon attachment, greetings for every authored base design, owl palette preservation, unchanged owl body/feet, and light eyelids at 85/100/110% character height ([height review](evidence/starter-reactions/owl-height-review.png)).
- Full unit suite: **327 tests pass, zero failures**, including gait/carry, anatomy, legs V2/V3, weapon art/contact, palette, rig and exhaustive evolution/cell boundaries. [Full output](evidence/starter-reactions/unit-tests.txt).
- `tests/starter-reactions.browser.mjs`: source and offline pass twelve distinct greetings across the full cycle, painted portrait boundaries, return to idle, repeat clicks, an unchanged evolved run, filtering/sorting, mobile and reduced motion. [Report](evidence/starter-reactions/starter-reactions-browser.json).
- `tests/team-select.browser.mjs` and `tests/arena-elite.browser.mjs`: source/offline selection, costs, Chaos, filters, elite capture/inheritance, reload, mobile and live combat pass. [Selection report](evidence/starter-reactions/team-select-browser.json), [elite report](evidence/starter-reactions/arena-elite-browser.json).
- `tests/legs-v2.browser.mjs`: source/offline live combat and 50/150/100% stride settings pass. [Report](evidence/starter-reactions/legs-v2-browser.json).
- `tests/prototype.browser.mjs`: all nine directional/locomotion profiles, 13,296 joint probes with zero gaps, source sparring, and offline combat/pose inspection pass with zero external requests. [Report](evidence/starter-reactions/prototype-browser.json).
- `scripts/review-gaits-carry.mjs final`: 46 source/motion sheets; 1,472 animated poses; zero clipped.
- Both offline HTML files rebuilt with the source changes. Existing local preview servers refreshed to serve the added modules.

No known disconnected, clipped or recolored arm remains in the reviewed samples. Natural-family greetings intentionally use restrained body/wing motion; the owl has an additional painted blink/head tilt. The pre-existing `expedition.js` draft was not edited, staged or deleted.

Reproduce the new visual evidence with `node scripts/review-starter-reactions.mjs` and `node scripts/review-brakk-arms.mjs`; `BASE_URL` selects the local server.
