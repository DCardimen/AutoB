# Melee arm ownership and complete bodies

This review supersedes the PR65 torso-fill review. That repair followed the outside of the resting arm, leaving an arm-shaped body bulge under the animated arm. Some source cuffs and hand outlines also remained stationary. A filled silhouette alone did not establish correct anatomy.

The current pass covers Aurel, Brakk, Brom, Grum, Grit, Tarka, Sable, Mossguard, Glacier, Abyssal, Gravitan and Cloverimp: seven source families, all three authored forms and eight facings. Actual combat also covers every available evolution and path: 52 variants in 104 separate source/offline fights.

## Source ownership

- The torso has an independent chest/waist boundary. It does not inherit the resting fist's outside contour. Original shirt, armor and chest indices supply the underpainting.
- Complete painted sleeves, cuffs, hands and their outlines move with the arm. Extraction preserves capes and the inner thigh below the fist. The original connected shoulder pivot and authored arm thickness remain in use.
- Eight evolved west-view hand bindings were corrected from cape, belt or cuff-edge samples to the actual hand. Relaxed melee carry respects those source positions, including profile views where both hands lie left of the torso. It does not force a hand across the chest.
- Rogue rear views explicitly conceal one or both hands beneath the cloak (NW: right source arm; N: both; NE: left). The entire original cloak stays on the body. The same form's front-view indexed arm skin supplies the concealed limbs beneath it; depth determines when a glove emerges. No generic limb or new palette is introduced.
- Complete source skin bounds are measured with the same projection used to paint the arm. An exceptional tall falling troll is translated upward as a whole; its cuff and limb retain their original size. A fit never persists into a subsequent facing.
- Sprite revision 18 and both offline builds invalidate the earlier cached frames.

## Regression oracles

The previous test required torso fill at the original outside arm silhouette, including Grum's `(18,32)` front-view forearm pixel. That assertion enforced the defect. The replacement checks require those source outline pixels to move with the arm and to be absent from both the static body and its underpainting. Separate reviewed chest-side spans require a filled actual torso in every melee source cell.

The full body-only raster check covers 39,168 poses across all 17 states, both paths, three forms and eight facings. Arms and weapons are omitted, so they cannot cover a hole. Indexed material, shoulder/hand connections, complete source adjacencies, final bone lengths, fixed grips, gait/carry and all-roster cell/height bounds are also checked.

## Visual review and reproduction

Run `node scripts/serve-arm-review.mjs --review=melee --port=3050` and open <http://127.0.0.1:3050>.

The [review index](../public/melee-arm-review/index.html) links an individual page for every companion. Each has source/offline combat movies, every available form/path, native and enlarged actual battle sprites, windup/contact/recovery frames and five separate visual findings: arm ownership, torso continuity, grip contact, sprite completeness, and motion/cell bounds.

The right inspection panels capture the actual cached battle sprite before the hit-flash overlay; the arena panel retains real combat effects. White hit flashes are not used as anatomy evidence. Source and offline image loading is checked independently.

The 21 comparison sheets include original artwork, the archived PR65 body, corrected independent torso, moving source ownership, before/after attacks, recovery and the actual moving body with arms hidden. Both full-cycle movies cover all seven melee families, three forms, eight facings and 17 states. Movies are decoded at normal 1x speed, with native and enlarged samples.

Reproduce with the current Node runtime and Chrome available:

```text
node scripts/build-standalone.mjs
node scripts/build-prototype.mjs
node scripts/review-melee-ownership.mjs
node tests/melee-individual.browser.mjs
node scripts/review-companion-animation.mjs --families=melee --out=playtest-artifacts/melee-arms/wild
node scripts/review-companion-animation.mjs --families=melee --path=warden --out=playtest-artifacts/melee-arms/warden
node scripts/verify-animation-video.mjs --out=playtest-artifacts/melee-arms/wild
node scripts/verify-animation-video.mjs --out=playtest-artifacts/melee-arms/warden
node scripts/verify-melee-combat-video.mjs
node scripts/package-melee-review.mjs
node scripts/verify-melee-review-pages.mjs
```

`BASE_URL`, `REVIEW_URL`, `CHROMIUM_PATH` and `FFMPEG_PATH` select the local game, review server and tools. Review sheets require the game server; recorded evidence is served by the review server. Packaging requires completed test logs, matching source/offline hashes, decoded movies and the explicit visual-review record. It does not infer a visual pass from metadata.

The verification report discloses the two unchanged base-branch contact/balance failures separately. Their 48 coalcrab/mireclaw contact cases and shield-counter expectation are compared with the base-branch log.

The review-page browser check opens all 12 companion pages and both full-cycle players, selects all 104 individual movies, verifies their dimensions and duration, checks all linked images and files, and exercises byte-range video scrubbing. Its [result](../public/melee-arm-review/checks/review-browser.json) records 15 pages, 393 valid links, 104 playable individual movies and 14 enlarged family views, with no page or asset errors.
