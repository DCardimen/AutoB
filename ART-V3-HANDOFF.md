# Authored Art V3 · unfinished handoff

Continue the existing sprite overhaul. This is a saved work checkpoint, not a release. The user's chat kept reconnecting, so they requested a handoff to a new chat.

Recovery evidence: **tests/reports/authored-art-v3-wip.json** records the unfinished state, known failures and asset hashes. **public/art-v3-recovery-evidence.zip** preserves sixteen intermediate review files and targeted test logs for a new checkout. These are debugging evidence, not final acceptance results.

Repository: **DCardimen/AutoB**. Released branch: **codex/starfall-menagerie**, commit **eb63e00** (V13 / Art V2). Work checkpoint branch: **codex/authored-art-v3-wip**. Working directory in the current environment: **/workspace/AutoB**.

## User's goal and quality requirement

Implement the agreed eight-step plan to approach the supplied concept art: detailed 64×64 pixel chibi characters, rounded expressive heads, compact clothed bodies, short connected limbs, rich controlled shading, clean outlines, consistent top-left light and three-quarter top-down perspective. Reference heroes are a red-plumed knight, green orc, blonde elf, silver mage and fox ranger; a second reference has four fairies and four goblins in the same mossy forest arena.

The user explicitly said: **review again out of 10 when done; if any of the same six qualities is below 9/10, go back to the drawing board.** Those six qualities are chibi proportions; faces/personality; clothing/equipment; shading/color; creature individuality; fit with the environment. The previous release was honestly assessed around 5.5/10 overall. Do not relabel passing tests as artistic 9/10, or claim 95% similarity / fifty hours of human play without evidence. Rework actual weaknesses and review live motion as well as sheets.

Eight-step sequence: visual specification → knight/goblin/fairy benchmarks → eight directions → material/detail polish → animation key poses → physics/weapon/cape/ragdoll integration → roster batches/evolutions → final consistency review and release.

## Current implementation

- Three art masters and their imports now cover **29 different source identities × eight facings**, feeding the 89-family collection through anatomy templates and recoloring. The masters are image-generated, then imported into exact 64×64 cells with binary alpha and 48-color shared palettes; do not describe these as 29 hand-drawn animation sheets.
- Main masters: **public/authored-characters-source.png** (7 identities), **public/authored-bodies-source.png** (12), **public/authored-families-source.png** (10).
- Importer: **scripts/import-authored-sprites.mjs**, with no arguments / `--bodies` / `--families`. Output: **authored-sprite-data.js**, **authored-body-data.js**, **authored-family-data.js**, plus three public idle-sheet PNGs. Masters have nonuniform row spacing; current manual row boundaries are correct for those current masters. A naive uniform-row import was visibly wrong and was fixed.
- **authored-sprite-renderer.js** skins the art to the existing physical pose. It uses material-aware recoloring, foot/arm displacement, head rotation during falls, cape mesh lag, pixel footprint expansion and joint seam welding. **native-forms.js** attaches artBind/artScale/artCapeBind and recolor flags. **prototype-pixel-art.js** uses this renderer first and preserves the old physical weapon painting function. **grand-pixels.js** now uses actual art anchors, shaded armor and imported head fragments for grand forms.
- **prototype-rig.js remains unchanged**: do not retarget the calibrated skeleton casually; an earlier V2 attempt changed a legal campaign outcome and was reverted. Physics, the requested default 50% size and species size ranges, skills, saves, two-starter progression, relic/capture/loss gameplay remain the established systems.
- **authored-pixel-maps.js / authored-pixel-art.js** are the initial manually authored fallback heads/costumes. That first iteration was judged too simple; the stronger source atlas replaced it for production identities.
- **server.js** whitelists the new JS modules. A newly started server is needed after whitelist edits. Current server is **port 3019**, session 55687; do not assume it survives a new task. Start an unused port and set `BASE_URL`.

## Immediate next action: finish weapon separation

The latest displayed runtime art is still below the requested quality threshold in gear and animation. The neutral art masters included painted weapons; moving their pixels independently caused duplicates, seams, or distorted costume pixels. The renderer now masks old weapon footprints and paints the real physical weapon from the existing rig, but remnants remain because some masks are inaccurate.

**Three newer, weaponless masters have already finished and are saved in the checkpoint:**

- **public/authored-characters-weaponless-source.png**: remove handheld weapons/shields from all seven hero/goblin/fairy rows, preserve empty hands and all identities.
- **public/authored-bodies-weaponless-source.png**: preserve the nine nonhumanoid rows and the mech's mounted cannon; remove handheld gear from dwarf/minotaur/skeleton rows.
- **public/authored-families-weaponless-source.png**: preserve seven animal rows; remove handheld gear from rogue/frost elf/troll rows.

**These newer masters have NOT been imported or visually validated yet.** Inspect their actual eight-direction content and alpha, adapt the importer's row boundaries (prefer a validated alpha-density row detector), then import them. Disable the old hard mask in the runtime when using weaponless inputs; otherwise it will cut holes in empty hands or clothing. Draw held weapons from the real grip in the anatomical right hand (bows use their intended two-hand stance), with proper depth behind/in front of the body and head. Add textured, connected sleeves/forearms/hands around those physical anchors. Avoid simply stretching a colored pixel cloud or painting static duplicate weapons.

The latest copied generated originals remain in `/workspace/generated_images`, but all masters needed to resume are now in `public/` and included in the checkpoint.

## Remaining art work

1. Correct all-direction weapon layers/hand contacts and re-review the benchmarks at normal arena size.
2. Stabilize tiny idle-phase changes: this is a real current regression, not a version-label issue. Fix rendering quantization rather than deleting the assertion.
3. Add visible blink/hurt/death expressions, wing/tail motion, clean turns/stops and natural walk/run/sprint poses. Refine ragdoll rotation and pickup/drop so connected anatomy survives real motion.
4. Review and improve grand-form geometry against the new art; current changes are unvalidated and some flat accessories still compete with the textured sprite. Ensure substantial silhouette changes and existing extra skills/equipment remain functional.
5. Review all 29 anatomy identities and color/gear variants across the 89 retained families. Keep consistent lighting, pixel density, silhouettes and material clusters.
6. Rebuild both HTML files and the prototype bundle, export new Godot atlases, complete required tests and the six-parameter visual review, then package and push the finished change back to codex/starfall-menagerie. Do not publish the WIP as the polished release.

## Verification state and pitfalls

- The last targeted run **node --test tests/prototype-pixels.test.js tests/sprite-art-v2.test.js** had **7 passes / 2 failures**. All six prototype raster/rig tests and the connected-head test passed. Failures: the old revision/iris expectation still targets Art V2, and tiny idle phase changes alter the buffer. Version/iris assertions need an appropriate updated test of the new art; keep substantive pixel and face checks meaningful.
- A previous intermediate check of 29 base native families × 17 states × 8 directions × 3 phases found zero clipping; it is not final release validation. Full suites, evolved forms/height limits, campaigns, browser/offline/mobile and Godot checks are still required after final edits.
- Current labels and exporter defaults are still V13 / Native Pixel V8 / Art V2. Update them for a completed V14 / Art V3 release and retain save schema 5 unless an actual persistence change requires more.
- Main-source screenshots are accurate for their stage. Recent sheets: `playtest-artifacts/art-v3-solid-*` and `art-v3-forms2-*`; inspect dates and rerun `BASE_URL=http://127.0.0.1:<port> ART_PREFIX=art-v3-review node scripts/review-sprites.mjs`.
- `scripts/record-sprite-art-v2.mjs` still writes V2 captions and the old public showcase path. **playtest-artifacts/art-v3-draft-preview.mp4 was recorded before rebuilding the Training Glade bundle and is therefore a V2 video; do not use it as V3 proof.** Create a V3 recording script/output, rebuild `npm run build:prototype`, and record the actual new code. The current prototype HTML was rebuilt once after later edits but is already stale again; final builds are mandatory.
- The existing 177-test / Godot / legal campaign evidence in SPRITE-ART-V2.md applies to released V13 only.
- No new agents may be spawned in this task. **Do not touch, stage or delete the pre-existing untracked expedition.js.** Preserve user files and saved collections. Do not restart completed V11/V12 gameplay work.

## Useful commands

```sh
npm ci --cache /tmp/autob-npm-cache
PORT=3020 npm start
BASE_URL=http://127.0.0.1:3020 node scripts/review-sprites.mjs
npm run build:prototype
npm run build:standalone
npm test
BASE_URL=http://127.0.0.1:3020 npm run test:art
BASE_URL=http://127.0.0.1:3020 npm run test:native
BASE_URL=http://127.0.0.1:3020 node tests/prototype.browser.mjs
BASE_URL=http://127.0.0.1:3020 npm run export:native
node scripts/check-native-godot.mjs
BASE_URL=http://127.0.0.1:3020 npm run export:prototype
npm run check:godot
```

Read CONTINUATION.md for established game requirements and earlier checkpoints. Use cloud-environment-runtime at task start and read its networking reference before Git operations. Existing HTTPS Git proxy credentials worked; do not ask for a GitHub token unless a specific operation proves missing access.
