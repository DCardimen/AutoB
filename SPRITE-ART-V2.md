# Sprite Art V2 · Native Expedition v13

The previous sprites hid their clothing under the heads, mixed isolated face pixels with thin limb outlines, and lost detail when the arena shrank them a second time. This pass refines the actual renderer and exported frames using the supplied chibi arena concept as the visual reference.

Open **Starfall-Menagerie.html** and look for **NATIVE EXPEDITION V13 · ART V2**. Existing runs display the new art immediately. **Starfall-Training-Glade.html** shows **NATIVE PIXEL V8 · ART V2** and remains the movement lab.

[Normal-speed motion preview](public/sprite-art-v2-preview.mp4) · [Five-hero showcase](public/sprite-art-v2-showcase.png) · [Eight-direction sheet](public/sprite-art-v2-directions.png) · [Godot 4 roster](public/native-roster-godot-v13.zip)

## What changed

- **Readable faces.** Integer pixel clusters define cheeks, jaws, eyes, eyebrows and hair. Blonde elf braids, a silver mage bob, orc tusks and topknot, the knight's visor and red feather, and the fox's cream muzzle distinguish the five heroes. Rear views show hair and helmets without front-facing eyes. Related humanoid families use the same face construction while retaining horns, beards, ears and other identities.
- **Connected, compact anatomy.** A visible neck joins the face to the torso. Broader cuirasses, jackets, muscle planes, cloth thighs, belts and solid boots make the bodies read as complete characters. A small visual head lift exposes the chest. The calibrated movement bones, stride distances, collision sizes and gameplay timings are retained.
- **Held, readable equipment.** Bow handles meet the gripping hand. Blades, guards, axe heads and staff gems have clearer material planes. Shields narrow in profile and expose their straps from behind. Humanoid capes no longer repaint the chin after the face is drawn.
- **Cohesive materials and silhouettes.** Warm leather and brass, cool steel, green cloth and purple robes use compact highlight/shadow groups and a shared dark outline. Mechs have broader faceted shells and leg joints; spider limbs remain visible against the arena; jelly dodges and stops visibly squash. Evolution emblems use one clear mark instead of several noisy marks.
- **Arena detail preserved.** The arena now draws directly onto a 668×436 grid. At the default 50% standard creature size, each 64×64 source texel maps to one grid pixel. The previous 334×218 post-render shrink discarded detail. Draw origins snap on the actual output grid, and health bars clear the sprite's measured top, including feathers and hats. Display enlargement uses nearest-neighbor sampling.

Shared anatomy improvements reach all 89 pixel families. Twenty-nine families have authored anatomy; the remaining families use shared body templates. This pass does not claim 89 individually redrawn character sheets.

## Verification

- **177 unit tests pass**, including three new art checks. Pixel connectivity covers five humanoid bodies, eight states, three phases and eight directions. Small idle phase changes preserve the exact pixel clusters; rear facial views omit the eye colors.
- **Browser source-pixel comparison:** Aurel 430/430, Syl 370/370 and Nyra 395/395 opaque source pixels match the rendered arena in controlled default-size fixtures. The roster still exposes eight directions and seventeen states; the 390-pixel mobile layout has no horizontal overflow.
- **Animation and gameplay:** the Training Glade's ten scenarios, deployment/capture/loss/migration checks and grand-form/equipment/cloth/damage-text browser checks pass. A legal Standard campaign completes three planets with sixteen fights, fifteen victories and one recovered casualty. This is an accelerated engine test, not human playtime.
- **Offline builds:** fresh native and migrated standalone fixtures run combat and saves with zero external requests. Direct `file://` automation is blocked by the managed browser policy; these checks serve the exact self-contained HTML locally.
- **Godot 4.6.3:** the authored roster exports 117 form variants and 127,296 checked 64×64 cells; the nine-body lab exports 9,792 cells. Each actor/form has 136 animations. Both projects import and start successfully; export clipping checks report zero failures.
- **Visual review:** actual game contact sheets cover heroes, other bodies, grand forms and running in eight directions. The sixteen-second preview records the real lab at normal speed: hero views, running/turning, combat, casting and a connected death ragdoll.

The source-pixel comparison proves the three tested standard-sized fixtures at the native arena grid. Intentionally smaller creatures, fractional height settings and browser/mobile scaling can resample pixels. Automated checks establish rendering and behavior; they do not establish a human 9/10 art or fun score.

## Reproduce

```sh
npm ci --cache /tmp/autob-npm-cache
npm start
npm test
npm run test:art
node scripts/review-sprites.mjs
node scripts/record-sprite-art-v2.mjs
npm run build:standalone
npm run build:prototype
npm run export:native
node scripts/check-native-godot.mjs
npm run export:prototype
npm run check:godot
```

Browser tools default to port 3000. Set `BASE_URL` for another running server. Restart the development server after updating so its module whitelist includes `pixel-face-tools.js`. The native exporter writes `playtest-artifacts/native-sprites-v13`; imported Godot caches are excluded from the downloadable archive. Recorded acceptance data is in [tests/reports/sprite-art-v2.json](tests/reports/sprite-art-v2.json).
