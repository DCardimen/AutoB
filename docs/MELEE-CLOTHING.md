# Complete melee clothing behind moving arms

This change supersedes the PR66 arm-ownership review. That review missed visible cape damage: orange highlights, red hem edges and dark folds were still being extracted into arms. A hand-radius shortcut ran before clothing protection, and RGB thresholds could not distinguish the full authored garment palette. Cape hems could also follow the leg skin instead of their shoulder attachment.

The repair uses reviewed indexed garment materials for each authored form, fixed source hand contact patches where a dark cuff shares a palette index, and a separate cloth background beneath moving foreground arms. Background repairs use the exact facing's painted cloth silhouette and existing cloth indices. The independent chest remains underneath the clothing. Arms, armor, skin and fur keep their original source ownership. Garments retain their own deformation below the waist instead of following a foot.

Knight capes, goblin scarves/capes, rogue cloaks, dwarf teal coats, orc loincloths and minotaur red scarves were checked against the original art in all three authored forms and eight facings. Trolls have no separate cape; their original leather and skin remain on the existing body/arm paths. A loincloth, scarf or vest does not receive a new cape background. Rear rogue hands remain concealed under the intact original cloak.

The new regression landmarks include the user's front/SW evolved knight example, orange hem and dark-fold pixels, plus goblin, rogue and dwarf clothing removed by PR66. Separate checks cover all indexed garment pixels and their backgrounds, and 17,136 animated body-only poses across seven families, three forms, eight facings, both paths and all 17 states. Hands and weapons are absent from that check, so they cannot hide a clothing cutout.

The [visual review](../public/melee-clothing-review/index.html) contains original/PR66/current comparisons, isolated garment and arm ownership, posed bodies with arms hidden, and individual source/offline combat for all 12 melee companions. Each companion has findings for arm/cloth ownership, torso/garment continuity, grip contact, original clothing/palette, and motion/cell bounds. Normal-speed decoded movies are reviewed at native and enlarged size.

Serve it with `node scripts/serve-arm-review.mjs --review=clothing --port=3052`, then open http://127.0.0.1:3052.

Reproduction uses the existing build, part, gait, anatomy and contact checks, plus:

```text
node --test tests/melee-clothing.test.js
node scripts/review-melee-clothing.mjs
node tests/melee-individual.browser.mjs --out=public/melee-clothing-review
node scripts/review-companion-animation.mjs --families=melee --out=playtest-artifacts/cape-repair/wild
node scripts/review-companion-animation.mjs --families=melee --path=warden --out=playtest-artifacts/cape-repair/warden
node scripts/verify-animation-video.mjs --out=playtest-artifacts/cape-repair/wild
node scripts/verify-animation-video.mjs --out=playtest-artifacts/cape-repair/warden
node scripts/verify-melee-combat-video.mjs --review=public/melee-clothing-review --out=playtest-artifacts/cape-repair/decoded-individual
node scripts/package-melee-clothing-review.mjs
node scripts/verify-melee-review-pages.mjs --review=public/melee-clothing-review
```

Set `REVIEW_URL=http://127.0.0.1:3052` for the individual decoder and review-page checks. `BASE_URL`, `CHROMIUM_PATH` and `FFMPEG_PATH` select the game server and tools. Packaging requires matching source/offline hashes, completed checks, decoded movies and an explicit completed visual review. The same pre-existing crab contact-spacing and shield-counter balance failures are disclosed separately.

The completed pass has 88 targeted checks passing, plus six animation-pipeline integrity tests. It checks 39,168 body-only poses with 25,689,584 torso probes, and 17,136 clothed poses with 2,596,002 garment probes. All 984 original part frames reassemble with original indexed colors. Both 164-second full-cycle movies and all 104 individual combat movies decoded at normal 1x speed. Manual review includes all 24 combat phase montages, 14 decoded directional family montages and 13 individual decoded montages. The review browser check verified 15 pages, all 104 movie selections and 395 asset links, with no page or asset errors. Both offline HTML files are rebuilt at sprite revision 19.
