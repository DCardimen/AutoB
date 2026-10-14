# Sprite palette fix · V17.1 / application 0.13.1

The old tint pass protected pixels above source row 27, then recolored pixels below it whenever equipment, evolution or a collection variant was present. That produced green heads with blue legs, yellow lower fur and mismatched animated limbs.

The renderer now preserves each complete authored palette, including the evolved artwork. Ordinary equipment does not recolor the body. Collection variants apply one color mapping to the selected material throughout the entire sprite, preserving its light and dark shading. White highlights, warm faces, pale hair and unrelated costume accents retain their source colors. Variant colors come from the species palette rather than the equipment palette.

Animated arm shading and hand highlights use the same authored material colors as the body. Sunsteel's gold accent applies to the held weapon. Geometry, hand attachments, motion timing, combat rules and saves are unchanged by this patch. Both standalone games have been rebuilt.

See [eight-direction running examples](public/sprite-palette-fix-directions.png), [validation report](tests/reports/sprite-palette-fix.json), and [updated offline games](public/Starfall-V17.1-Palette-Fix.zip). The V17 package remains a historical release; use the V17.1 package for this correction. No save reset is needed.

## Reproduce the checks

```sh
npm test
npm run build:standalone
npm run build:prototype
PORT=3032 npm start
BASE_URL=http://127.0.0.1:3032 node tests/sprite-colors.browser.mjs
```

The focused color regression first failed against the old renderer. It now compares equipped and unequipped frames for all 89 families, three forms and eight facings. Additional checks cover original swatch preservation, equipment-independent variants, protected accents, and matching variant colors on both halves of actual idle, running and attacking frames.

The browser check exercises the actual roster atelier and combat in both source and the exact distributed offline HTML. It also renders all 89 families across three forms, eight directions and three motions with equipment, checks cell bounds, and writes the directional review sheet. All 232 unit tests and seven browser check groups passed. The browser sweep rendered 6,408 equipped frames without clipping. Both standalone games ran without external requests or browser errors. The ZIP passed CRC and exact embedded-file checks. Detailed results and file hashes are recorded in the validation report.

This patch is on a fresh feature branch, `codex/sprite-palette-consistency`, based on the merged PR #5 release commit `bb863177ddfc3a41780278620c8ce04a0946b933`. It is delivered through a new PR. The pre-existing untracked `expedition.js` draft is unchanged and excluded.
