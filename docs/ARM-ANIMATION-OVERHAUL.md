# Authored arm animation overhaul

Archived review. This evidence was superseded by [explicit authored layers and recovered source references](MELEE-AUTHORED-LAYERS.md). Earlier converted-bind and form labels are not a reliable untouched-art baseline.


The follow-up [torso fill correction](TORSO-FILL.md) fixes the exposed shoulder cutouts missed by this pass. Its before/after evidence and body-only opacity tests are the current acceptance evidence for body completeness.

Moving sleeves, forearms and hands now use one continuous indexed skin. The complete cuff and its outline leave the body together; the torso retains its own underpainting. Weapon rendering no longer draws a second set of generic fists over those original hand pixels.

`companion-arm-bindings.js` registers wrists and shoulder heights separately for every form and facing. Several previous landmarks were on boots, cape hems or fox tails. The shoulder pivot now sits on the body side of the painted cuff seam. The elbow retains its authored bend branch instead of snapping when a projected joint crosses the torso.

Two-handed holds solve the main wrist, support wrist and complete weapon bounds together, then solve both elbows. The reach-circle intersection is solved explicitly, including nearly tangent holds. No subsequent grip or boundary correction stretches an already solved forearm. Active melee axes keep their physical direction. Bowstrings share the held-object transform. Evolved skeleton staves retain their staff identity and do not bind a free hand to a bowstring.

The painted chest and its shoulder sockets also follow the physical torso yaw, blending into the neck and waist. A rigid front-facing chest made the short source arms' reach circles disjoint in two intermediate Brakk side-swing frames. The regression samples include those exact recovery phases, and every frame of both review movies checks the final arm lengths.

Bloomkin is an explicit proxy exception: its caster motion rig supplies body motion to the existing fairy skin, whose painted hands and wings remain in that skin. It does not receive an additional procedural arm pair or staff.

Expanded verification also exposed an older recoil defect. Hit/stagger poses lowered a natural body's torso while leaving its feet at an unbounded zero offset, inverting short painted legs and adjacent skin. Those poses now use the existing source-length compression limit. Idle feet retain zero displacement.

## Reviewed artwork

All 41 original families were inspected in all three forms and eight facings: **984 source cells**. Independent arms were reviewed for knight, orc, dwarf, troll, elf, caster, fox, goblin, minotaur, skeleton, rogue and frostelf: **288 articulated bind frames**. Natural bodies, winged forms, variants and their occluded appendages retain their authored skinning paths and palette indices.

The [review index](../public/arm-animation-review/index.html) links original/current comparisons, isolated arm ownership and torso layers, complete swings, both evolution-path movies, decoded frames and live-combat evidence. Run `node scripts/serve-arm-review.mjs` and open `http://127.0.0.1:3048` for players with byte-range seeking. The [verification report](../public/arm-animation-review/verification.json) contains the exact coverage and results. Movie manifests and the roster audit retain source hashes; generated metadata does not replace visual inspection.

## Reproduce

Use Node 20 or newer, Playwright Chromium (or `CHROMIUM_PATH`), and FFmpeg (`FFMPEG_PATH` if it is not on PATH). Set `BASE_URL` to the local game server.

```sh
node --test tests/arm-animation.test.js tests/brakk-arms.test.js tests/companion-parts.test.js tests/companion-material-ownership.test.js tests/melee-weapon-art.test.js
node scripts/audit-arm-animations.mjs
node scripts/review-arm-animations.mjs
npm run build:standalone
npm run build:prototype
node tests/arm-animation.browser.mjs
node tests/legs-v2.browser.mjs
node tests/prototype.browser.mjs
node scripts/review-gaits-carry.mjs final
node scripts/review-legs-v3.mjs final
node scripts/review-companion-animation.mjs --out=playtest-artifacts/arm-video-wild
node scripts/review-companion-animation.mjs --path=warden --out=playtest-artifacts/arm-video-warden
node scripts/verify-animation-video.mjs --out=playtest-artifacts/arm-video-wild
node scripts/verify-animation-video.mjs --out=playtest-artifacts/arm-video-warden
```

The roster audit renders every one of the 89 characters, three evolution inputs, both evolved paths, eight facings, all 17 states and five cycle samples. Each movie renders every family/form at native size through complete cycles in all eight facings, checks final arm lengths on every encoded frame, and rejects clipped or stretched poses. The decoder plays at 1x and captures native and enlarged pixels from all 136 state/facing segments per path. The live test covers all 89 roster entries in source and isolated offline combat, plus both evolved paths for every articulated roster entry.

The source art and repaired body underpainting retain original palette indices. No assertions were relaxed. The old Brakk west-facing six-pixel assertion was replaced with checks for the actual near glove and its complete width; the earlier landmark had selected its outside outline column.

## Existing failures on the base branch

An isolated checkout of `45b6859` reproduces two unrelated failures: the 48 coalcrab/mireclaw melee-contact cases in `combat-spacing.test.js`, and the shield-counter balance expectation in `overhaul.test.js`. These remain disclosed in the verification report. They prevent claiming that the entire game's test suite is green.
