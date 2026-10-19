# Authored melee layers and original references

This replaces the PR65–67 torso/ownership/clothing reviews. Their “original” panels were converted bind sprites, and their pose reviews could label an unused mature form while the evolution system actually selected apex artwork. The current inspector keeps the unmodified PNG, frozen converted bind, editable layers and production animation distinct. It forces the requested art form in controlled reviews and uses the real evolution mapping in gameplay reviews.

## The seven steps

1. **Recover and establish the reference.** `art/melee-layers/sources.json` records ten raw PNGs, their SHA-256 values and the earliest available Git commit containing each. The files match those historical blobs byte for byte. The repository cannot establish the artwork's history before that first upload. Its flattened PNGs contain no recoverable pixels behind an arm. The 64px converted bind is separately frozen in every master; conversion includes scaling, alpha filtering, palette quantization, mirroring and earlier import repairs. It is never presented as the untouched original PNG.
2. **Audit every form and direction.** Seven melee families × three authored forms × eight directions give 168 cells. The roster is Aurel, Brakk, Brom, Grum, Grit, Tarka, Sable, Mossguard, Glacier, Abyssal, Gravitan and Cloverimp. Gameplay has 52 available evolution/path variants. Grum and Sable's first evolution selects apex art; their unused mature artwork is still included in controlled inspection. Raw reference rows are cropped without resampling.
3. **Save explicit editable layers.** The 21 JSON masters under `art/melee-layers/masters` save separate body, armor, head, front/back cape, left/right arm, left/right leg and weapon grids for every facing. Every original visible indexed pixel has exactly one saved owner. There is no runtime RGB or nearest-limb classification for these families. The original masters are weaponless, so the weapon grids are intentionally empty; equipped weapons remain on the independent production weapon renderer. Source-only ground marks have their own excluded layer.
4. **Paint complete hidden surfaces.** Each master contains an independent chest/waist/pelvis backing and saved additional cape pixels. These are deliberately reconstructed artwork in the original indexed palette. The underbody ends at the pelvis; it does not fill the natural air between boots. Body and cape may occupy the same bind coordinate while remaining separate surfaces. Rogue cloth uses an explicit blue cloth ramp; floor, glove and belt colors cannot bleed into reconstructed folds. Bronze cloak trim stays on the garment, not a foot.
5. **Attach and animate the layers.** The renderer rasterizes each saved surface independently, skins the original painted limbs and attaches moving arms at body sockets. Grum's evolved upper arms are removed from the stationary head region, with roots at the actual shoulders and grips at the green fists. Sable's sockets follow the painted gloves rather than the cuff, belt or cloak. Its directional torso centers follow the actual artwork. Rear evolved rogue sleeves use visible rear artwork. W/NW far arms and NE far arms remain concealed beneath the cloak and use same-form front indexed arm skin beneath it. Apex NW/NE far boots are fully concealed and receive no invented visible foot.
6. **Inspect the exact knight example.** The front/SW mature knight sheet exposes the torso with arms hidden, isolates the full red cape and shows the actual attack. Orange hem highlights and dark folds retain their source owner and shade. The five factors are underlying body coverage, connected moving limbs without a stationary duplicate, complete costume/palette, hand–weapon attachment and silhouette/cell bounds.
7. **Verify the actual delivered games.** The review includes each companion separately in source and rebuilt offline combat, every available evolution/path, native/enlarged attack phases, and continuously decoded normal-speed movies. Controlled full-cycle movies include all three art forms, eight facings, both paths and 17 states. Automated opacity, palette, limb/contact and boundary checks supplement visual inspection; they do not substitute for it. The five-factor observations are recorded in `art/melee-layers/visual-review.json` after inspection.

## Editing and reproduction

Open `/public/melee-layer-review/index.html` on the source server. Select a family, actual art form, facing, state and phase. Toggle arms and legs off to expose the independent surfaces. Inspect the raw PNG row and converted bind separately. The adjacent links open the editable JSON, ownership sheets, full motion movies and all individual combat pages.

Each grid has an `[x,y]` origin and rows of two-digit hexadecimal palette indices; `00` is transparent. The `ownership` map assigns each frozen visible bind pixel to a layer. `reconstructed` records newly painted body/cape pixels separately. `bodyRows`, arm sockets, `legs` and rogue `legContours` are explicit art registrations. Preserve the frozen `original`, `sourceHash`, palette and raw source provenance when editing. Never repair a hole by retaining the resting arm as body artwork.

Run these with Node 20 or newer (the validation used Node 24):

```powershell
npm run animation:layers
npm run build:standalone
npm run build:prototype
$env:BASE_URL='http://127.0.0.1:3054'
$env:CHROMIUM_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node scripts/review-melee-layers.mjs
node scripts/inspect-layer-ownership.mjs
node scripts/build-melee-layer-review.mjs
node scripts/verify-melee-layers.mjs
node tests/melee-layer-inspector.browser.mjs
node tests/melee-individual.browser.mjs --out=public/melee-layer-review
$env:REVIEW_URL=$env:BASE_URL+'/public/melee-layer-review'
node scripts/verify-melee-combat-video.mjs --review=public/melee-layer-review --out=public/melee-layer-review/decoded-individual
node scripts/review-companion-animation.mjs --families=melee --path=wild --out=public/melee-layer-review/wild
node scripts/review-companion-animation.mjs --families=melee --path=warden --out=public/melee-layer-review/warden
node scripts/verify-animation-video.mjs --out=public/melee-layer-review/wild
node scripts/verify-animation-video.mjs --out=public/melee-layer-review/warden
node scripts/package-melee-layer-cycles.mjs
node scripts/package-melee-layer-combat.mjs
# Inspect the images/video and update visual-review.json before --final.
node scripts/package-melee-layer-combat.mjs --final
node tests/melee-layer-review.browser.mjs
```

Set `FFMPEG_PATH` to a local FFmpeg binary when it is not on PATH. Start `node server.js` with `PORT=3054` for these example URLs. The compiled layer data uses lossless indexed-grid/run-length and dictionary encoding to keep the standalone below the existing 99 MiB limit. Compilation checks exact grid equality and PNG exports independently decode to their saved indexed colors. Compression never resamples artwork.

The latest results, exact runtime/build hashes, five-factor findings and source provenance are linked from [the review](../public/melee-layer-review/index.html) and [verification report](../public/melee-layer-review/verification.json). Historical PR65–67 evidence remains archived and is not the acceptance baseline for this change.

## Completed verification

- 78 targeted tests pass, including unchanged gait/carry, arm, anatomy, indexed palette, weapon and complete-roster cell-boundary thresholds. With arms hidden, 17,136 actual-art-form poses retain 7,429,272 opaque torso/cape probes. All 184,530 converted source pixels retain one explicit owner and their indexed shade.
- 273 exported layer PNGs independently pass checksum, decode, source ownership and palette checks. The live inspector passes all 168 cells without page or asset errors.
- All 104 individual source/offline fights perform complete changing attacks with no missing images, page errors or external offline requests. All movies play continuously at 1×; 312 timed native/enlarged video samples, all 24 phase montages and all 13 decoded individual montages were inspected.
- Both full-cycle movies contain 41,328 poses over 164 seconds each, with no clipped pixels or arm-bone failures. They decode at 1× across all 272 facing/state segments. All 14 decoded family/path sheets were inspected, including every state, form and direction plus enlarged apex attacks.
- Source/offline live gait and Training Glade checks pass. The rebuilt gait review covers 1,472 poses; the natural-leg review covers 512 poses, both with zero clipped poses. Both offline HTML files are rebuilt; the existing 99 MiB standalone limit remains in force.
- The delivered review passes 16 pages, all 104 movie selections, 14 enlarged family selections and 183 asset links with no page or response errors.

The wider contact/balance run has 36 passing tests and the same two failures as the prior baseline: 48 coalcrab/mireclaw reach cases and the shield-counter expectation. These are disclosed rather than described as a clean full suite. No remaining limb/costume gap, duplicate resting arm, missing sprite or crop was observed in the reviewed melee coverage. This is a report of inspected coverage, not a claim that every possible future pose or setting has been exhaustively proven.
