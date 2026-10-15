# Logo introduction and expressive first forms

The game opens with the existing Fang & Feather logo and the requested quote: **“For every action, there is an equal and opposite reaction.” — Isaac Newton**. The introduction lasts about two seconds, supports immediate button/Escape/Enter/Space skip, restores usable focus and game controls, and plays once per tab session. Reduced motion removes the zoom and shortens the introduction. The logo is embedded in the offline game.

Team selection now uses a distinct authored-design greeting for each of the 41 base designs, covering all 89 companion variants. The shared whole-sprite sway is removed. Expressions include smiles, scowls, surprised mouths and a moving mechanical optic; local gestures include ear/antenna flicks, rhino cheek/snort motion, dragon wing/head motion, turtle peeking, shell and cap motion, fin/wing movement, and spider fang movement. Human weapon/hand greetings retain the existing fixed grip bindings. The owl keeps its head tilt and smile.

**There are no blink or wink reactions.** Source pupil centers remain visible while brows and mouths change. Team-select idles also avoid the renderer's closed-eye idle phase. The authored appearance is retained where an original face already has a smiling eye shape.

Only first forms receive these menu reactions. No evolved forms are added to team selection. Facial edits use original palette indices and existing opaque source pixels. Source textures are skinned continuously through small regional movements, with no additional limbs, generic limb meshes or production skeleton overlays. Brakk retains the single authored arm pair from the preceding repair.

## Visual scope

Before selecting facial/ear/wing regions, reviewed all eight directions and all three available source-art stages of the 41 designs: feralfox, cat, rabbit, rodent, rhino, turtle, owl, fish, mushroom, mantis, clam, squid, knight, orc, elf, caster, fox, goblin, fairy, lion, bear, stag, drake, beetle, bat, phoenix, rogue, frostelf, troll, wolf, mech, spider, jelly, serpent, harpy, moth, crab, centipede, dwarf, minotaur and skeleton. The original sheets remain linked in the [source-art review](STARTER-REACTIONS-REVIEW.md#review-scope-and-source-anatomy).

The new animations were visually reviewed in the selectable head-on first form at native and enlarged sizes, through 16 samples of each complete cycle. [Specimen manifest](evidence/logo-expressions/expressive-specimens.json) records every design, representative companion, expression, duration and gesture. Each `reaction-cycle-ID.png` in that evidence folder shows the complete corresponding cycle; `starter-reaction-ID.png` shows it inside the actual team-select card.

- Logo and quote: [desktop](evidence/logo-expressions/logo-intro-source.png), [offline](evidence/logo-expressions/logo-intro-offline.png), [320px](evidence/logo-expressions/logo-intro-320.png), [390px](evidence/logo-expressions/logo-intro-390.png).
- Key first forms: [rhino](evidence/logo-expressions/reaction-cycle-pyrehorn.png), [dragon](evidence/logo-expressions/reaction-cycle-stormdrake.png), [owl](evidence/logo-expressions/reaction-cycle-voltwing.png), [mantis](evidence/logo-expressions/reaction-cycle-orchimantis.png), [Brakk](evidence/logo-expressions/reaction-cycle-brakk.png), [machine](evidence/logo-expressions/reaction-cycle-cogwalker.png).
- [Normal-speed recording of all 41 first forms](evidence/logo-expressions/starter-reactions.webm), decoded native/enlarged frames [0](evidence/logo-expressions/starter-reactions-playback-0.png), [1](evidence/logo-expressions/starter-reactions-playback-1.png), [2](evidence/logo-expressions/starter-reactions-playback-2.png), [3](evidence/logo-expressions/starter-reactions-playback-3.png), and [decode times](evidence/logo-expressions/starter-reactions-video.json).
- Existing combat/movement compatibility: [normal-speed gait/carry recording](evidence/logo-expressions/gaits-carry-preview.webm), [decoded frames](evidence/logo-expressions/gaits-carry-motion-playback.png), [decode times](evidence/logo-expressions/gaits-carry-video.json).

## Validation

- **10 focused animation tests pass**, covering every design's distinct gesture; absence of CSS sway and closed-eye modes; unchanged source pupil centers, silhouette mask, palette indices and body pixels; and visible raster movement for all 89 variants at 85/100/110% height (2,403 sampled reaction frames), with zero clipping. The existing weapon-hand and Brakk arm-connection checks remain in place. [Focused test output](evidence/logo-expressions/focused-tests.txt).
- `tests/starter-reactions.browser.mjs`: all 41 first forms pass in source and offline builds, including full-cycle movement, painted card bounds at three cycle positions, idle restoration, repeat clicks, preserved evolved expedition state, filters/sorting, mobile and reduced motion. [Report](evidence/logo-expressions/starter-reactions-browser.json).
- `tests/logo-intro.browser.mjs`: original logo and exact Newton quote, automatic dismissal, skip button/Escape/Enter/Space without dismissing team selection, trapped intro focus, restored focus, protected underlying controls, unchanged run, once-per-session behavior, 320/390px layouts and reduced motion pass in source/offline. [Report](evidence/logo-expressions/logo-intro-browser.json).
- Source/offline selection, points, Chaos, elite capture/inheritance, persistence and live combat pass: [selection](evidence/logo-expressions/team-select-browser.json), [elite capture](evidence/logo-expressions/arena-elite-browser.json), [stride/live combat](evidence/logo-expressions/legs-v2-browser.json).
- Training Glade source/offline sparring and movement pass: 13,296 joint probes, zero gaps; zero external offline requests. [Report](evidence/logo-expressions/prototype-browser.json).
- Gait/carry review: 46 source/motion sheets, 1,472 poses, zero clipped pixels.
- **330 unit tests pass, zero failures.** [Full regression output](evidence/logo-expressions/unit-tests.txt).
- Both offline HTML files rebuilt. [Validated file hashes](evidence/logo-expressions/validated-files.json).

The front-facing gestures remain restrained to respect hidden wings/limbs and the source silhouette. No known detached, clipped or recolored limb remains in the reviewed samples. Evolution animations are outside the menu change. The pre-existing `expedition.js` draft was not edited, staged or deleted.
