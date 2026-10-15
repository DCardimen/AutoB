# Uploaded art and animated rewards

The October upload batches now supply the arena frame and controls, world paintings, inventory illustrations, companion manager, capture kit, encounter intel, battle comparison, and full-screen post-match scene. The implementation follows the supplied teal, cyan, gold, and foliage examples while retaining the game's real rewards, equipment, capture, and progression rules.

The rewards scene plays the twelve authored chest-opening frames on a fixed ground plane, reveals item cards in sequence, animates earned EXP, sends an experience orb toward the expedition panel, and flies collected items into the pack. Selecting an upgrade or returning from inspection keeps the chest open instead of replaying the opening. Both the browser reduced-motion preference and the game's gentle-motion setting show a settled scene immediately.

Collection is committed and saved before its cosmetic flight. Tests cover both reloading during the flight and reloading after it, without losing or duplicating the grant. The next-encounter action still requires the original upgrade and cache conditions. Defeat shows its saved casualty and never offers victory spoils.

## Supplied art coverage

| Uploads | Integration |
| --- | --- |
| `aren 1` through `aren 10` | Navigation and action icons, crest, arena frame, panels, button states, tabs, vitals, elements, ability icons, equipment and empty slots |
| `wep 1`, `wep arm 2`, `arm 1`, `arm 2` | All 100 item illustrations extracted; stable mappings for the existing equipment catalog and inventory/reward/inspection UI |
| `rel 1` through `rel 4` | All 100 relic illustrations extracted; existing expedition and personal relic identities use the supplied art |
| `bAK 1`, `bak 2`, `bak 3` | Verdant, volcanic, and void world paintings in the star chart, world previews, and menu backgrounds |
| `background post match`, `cards and post match 1`, `post match 2` | Waterfall landscape, gold/green reward cards, collection action, result panel, capture success/failure panels |
| `post match 3`, `post match 4`, `post match 5` | Treasure icons, experience effects, plinth, rays, sparkles, foliage, and trails |
| `chest opening`, `chest`, `napsack 1` | Twelve-frame opening, illustrated intel cache, and equipment pack artwork; alternative frames retained in the asset registry |
| `download (11)`, `download (12)` | Companion cards and Grove emblem; the established team-selection implementation continues to use the other team-selection sheets |
| Arena, companion, intel, capture, rewards, and comparison example images | Composition references; their painted sample stats and creatures are replaced with live game data |

[Extraction script](../scripts/prepare-uploaded-ui-art.py) produces **416 PNG assets from 33 source sheets**, with coordinates, dimensions, and original SHA-256 hashes in the [manifest](../public/ui/uploaded/manifest.json). It groups disconnected pieces belonging to an item, including the fractured red gem and broken stained-glass relic. It excludes neighboring item silhouettes instead of cutting complete blades into equal cells. Original uploads are unchanged. Assets represent the existing catalog; illustrations alone do not introduce new item effects or equipment rules.

Reviewed the original upload contact sheets and the extracted [equipment sheet](evidence/uploaded-ui/uploaded-equipment-contact.png) and [relic sheet](evidence/uploaded-ui/uploaded-relics-contact.png) at native size and enlargement, including long blades, crowns, detached shards, and capture-tool states.

## Visual evidence

- [Arena and persistent tool dock](evidence/uploaded-ui/uploaded-arena-desktop.png)
- [Companion management](evidence/uploaded-ui/uploaded-companions-desktop.png), [capture kit](evidence/uploaded-ui/uploaded-capture-kit-desktop.png), [encounter intel](evidence/uploaded-ui/uploaded-intel-desktop.png)
- [Desktop rewards](evidence/uploaded-ui/uploaded-rewards-motion-settled.png), [comparison](evidence/uploaded-ui/uploaded-comparison-desktop.png), [capture success](evidence/uploaded-ui/uploaded-capture-success.png), [capture failure](evidence/uploaded-ui/uploaded-capture-failed.png)
- [320px rewards](evidence/uploaded-ui/uploaded-rewards-320.png), [320px expedition/EXP panel](evidence/uploaded-ui/uploaded-rewards-growth-320.png), [390px rewards](evidence/uploaded-ui/uploaded-rewards-390.png), [defeat](evidence/uploaded-ui/uploaded-defeat-320.png)
- [Normal-speed recording](../public/uploaded-ui-preview.webm), [timing metadata](evidence/uploaded-ui/uploaded-motion.json), decoded [opening](evidence/uploaded-ui/uploaded-playback-opening.png), [card reveal](evidence/uploaded-ui/uploaded-playback-cards.png), [settled scene](evidence/uploaded-ui/uploaded-playback-settled.png), [collection flight](evidence/uploaded-ui/uploaded-playback-collection.png), and [2× details](evidence/uploaded-ui/uploaded-playback-detail.png)

The recording uses the real browser clock and a seeded three-companion/two-opponent encounter. It lets combat run, then deterministically finishes the opposing team to reach the actual settlement code. Its two capturers and equipment drop are generated by the existing loot function. The screenshots and decoded frames were visually inspected, independently of metadata.

## Validation

| Check | Result |
| --- | --- |
| New asset/provenance and pure reward-rendering tests | 2/2 pass |
| New uploaded UI browser suite | Source/offline pass; 320/390/768px dialogs, desktop controls, equipment click/remove/drag, capture settings, intel tabs, live combat, item inspection, reward/EXP data, reload during collection, success/failure, defeat, gentle motion, and continuation |
| Field UI browser suite | Source/offline pass at 320/390/768/1440px; map/world previews, routes, menus, save reload, zero external offline requests |
| Arena/elite browser suite | Source/offline pass, including permanent elite capture inheritance |
| Arena-feel browser suite | Pass: tuning, equipment transfer, three capture attempts, enrage/pause, report charts, collection, and offline play |
| Live roster browser suite | Source/offline pass, including six-versus-six evolved teams and stable live controls |
| Capture recruitment browser suite | All ten source/offline scenarios pass |
| Legs V2 browser suite | Source/offline pass with twelve creatures, evolved crab/drake/stag, 50/150/100% stride, reset, and phone layouts |
| Training Glade browser suite | Pass, including eight directions, seventeen states, 13,296 joint checks, sparring, mobile, and offline |
| Complete pre-existing unit suite on Node 22 | **338/340 pass; two baseline failures remain**, described below |
| Both standalone builds | Rebuilt; game embeds the supplied art and fonts; Training Glade embeds its own assets |

[New browser report](evidence/uploaded-ui/uploaded-ui-browser.json), [field report](evidence/uploaded-ui/field-ui-v3.json), [elite report](evidence/uploaded-ui/arena-elite-browser.json), [live roster report](evidence/uploaded-ui/live-roster-browser.json), [stride report](evidence/uploaded-ui/legs-v2-browser.json), [complete unit output](evidence/uploaded-ui/uploaded-unit-tests.txt).

Two existing unit failures reproduce in the untouched original checkout at `004b371`: `tests/grand-forms.test.js:18` expects the former 3.3 footprint radius while current combat supplies 6.6; `tests/overhaul.test.js:392` expects the old seeded shield encounter to lose without the counter, but the current engine wins it. This pass changes neither those assertions nor combat balance. The new two tests pass separately. CI's full unit step will therefore still report those two baseline failures.

Offline browser checks now load the actual generated HTML while blocking other requests, avoiding a large Playwright route-fulfillment payload. Assertions still require zero external dependencies. The complete game is about **79.4 MiB**, reflecting the embedded art library. Small screens deliberately stack the scene, expedition panel, and report sections and straighten reward cards to preserve their boundaries. The desktop arena fits its native canvas aspect ratio to the available height, preserving authored creature proportions instead of stretching the canvas vertically.

## Creature scope and reproduction

This pass changes inventory and menu artwork, not creature anatomy, equipment sockets, palettes, rigs, contact landmarks, or source atlases. Reviewed live base Aurel, Brakk, and Voltwing, with Luma, Riptalon, and Gloomkit opponents. The unchanged multi-form/eight-direction source baseline and gait evidence are linked in [the existing creature review](COMBAT-SPACING-REVIEW.md#visual-evidence-and-scope). The new menus use the existing authored portrait renderer. No new creature, evolution, or facing is introduced; none is represented by a procedural replacement limb.

The original working checkout and its `expedition.js` draft were not edited, staged, or deleted. This change uses the fresh `feat/uploaded-art-rewards-pass` branch and carries forward the current gameplay work before merging the upload commits.

```sh
npm ci
npm run build:standalone
npm run build:prototype
npm start
# In another terminal, with BASE_URL/CHROMIUM_PATH set if needed:
node tests/uploaded-ui.browser.mjs
node scripts/review-uploaded-ui.mjs
node scripts/record-uploaded-ui.mjs
```

Asset regeneration additionally requires `python -m pip install -r scripts/art-requirements.txt`, then `python scripts/prepare-uploaded-ui-art.py`. Recording frame extraction uses FFmpeg (`FFMPEG_PATH` may override its location).
