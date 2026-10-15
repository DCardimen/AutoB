# Arena reference and reward journey

This pass follows **`arena example.png`**, confirmed by the user, and builds on the supplied-art integration in PR #29. The complete pending art pass and this follow-up are carried together in the new feature branch.

## Arena

The battlefield spans the main column beside the encounter briefing. The compact companion strip shows real portraits, HP, stamina, poise and targeting policies. A five-button bottom dock opens Arena, Deployment & AI, Companions, Capture, and Intel & log. The standalone large roster, equipment trays, reserve cards and tactical explanations have moved into their menus. Global targeting, practice, movement controls and capture planning remain reachable through Deployment & AI. Enemy builds, mutations and inspection remain available in the briefing, capture kit and intel menus.

The wide camera uses one scale for both axes. Deployment and physical enemy clicks use its inverse transform, and target-preview lines, defeat effects and ground loot use the same coordinates. The scenery fills the wide frame independently; creature sprites retain their proportions and existing physics sizes. On phones the battlefield retains its native aspect ratio, controls wrap, and the single Enter battle button moves into the compact controls.

- [Desktop arena](evidence/journey-polish/journey-source-arena.png), [320px arena](evidence/journey-polish/journey-source-arena-320.png), [offline arena](evidence/journey-polish/journey-offline-arena.png)
- [Top relic bar and inscription panel](evidence/journey-polish/journey-source-relic.png)

## Rewards and relics

The twelve authored chest frames open before cards rise from the measured chest mouth into their display positions. Coins leave the same source and arc into the knapsack mouth. Individual EXP orbs travel to each recipient's portrait; each EXP bar and level notice responds on arrival. Phone recipients appear above the chest so the destination remains understandable.

Collection sends miniature versions of the complete reward cards into the knapsack. All twelve uploaded knapsack frames now participate: opening, the receiving swirl, closing, and the final glint. The gold readout counts the cosmetic arrivals. The claim is committed and saved before animation, and revisiting the screen leaves it settled. Reloading mid-flight cannot duplicate or lose rewards. Defeat retains its casualty presentation and does not show a treasure chest or claim action.

Relics occupy a top rail across expedition views. Hover, keyboard focus, or touch opens a viewport-positioned inscription panel using the actual current-rule descriptions, with numerical effects highlighted. The panel stays open when hovered, fits the viewport, and dismisses with Escape. Hunters' Lens now describes its actual current capture modifier and conditions.

- [Settled rewards](evidence/journey-polish/journey-source-rewards.png), [320px rewards](evidence/journey-polish/journey-source-rewards-320.png), [offline rewards](evidence/journey-polish/journey-offline-rewards.png)
- [Cards and EXP emerging](evidence/journey-polish/journey-source-playback-emergence.png), [EXP arrival](evidence/journey-polish/journey-source-playback-arrival.png), [cards entering the bag](evidence/journey-polish/journey-source-playback-collection.png)

## Combat text and scenery

Damage numbers are smoothly typeset at the final display resolution, with outlined gradient ink, an impact pop, critical rays and readable healing/absorption captions. HP damage, shield absorption and status accumulation retain their real engine values. Stable lanes fan simultaneous values around a recipient, and text is clamped to the visible camera. Pause freezes its combat clock. Gentle motion removes travel and pops.

Environmental overlays add painted-water shimmer and travelling glints inside waterfall masks, slow lava glows, drifting mist and cloud veils, moonlight breathing, star twinkles and lantern flicker. They cover the rewards landscape, three world paintings and previews, route and encounter art, menagerie, menu backdrops, team selection, header and page atmosphere, arena and Training Glade. They render below controls, ignore pointer input, skip offscreen surfaces, and use a capped 20 FPS environmental pass. Hidden documents and gentle motion stop the overlays.

The offline skin shares compact blob URLs with the existing embedded asset registry. This avoids browser CSS custom-property size limits that otherwise discard the large waterfall painting, and removes duplicate uploaded PNG data from CSS. The complete game is about **73.4 MiB**; Training Glade is **15.34 MiB**. Both remain single HTML files with no external asset dependencies. The builder also verifies that embedding does not alter JavaScript source.

- [Damage at native recording resolution](evidence/journey-polish/journey-source-playback-damage.png), [2× source details](evidence/journey-polish/journey-source-detail-2x.png), [2× offline details](evidence/journey-polish/journey-offline-detail-2x.png)
- [Grove](evidence/journey-polish/journey-source-world-0.png), [cinder](evidence/journey-polish/journey-source-world-1.png), [astral](evidence/journey-polish/journey-source-world-2.png), [team-selection night scene](evidence/journey-polish/journey-source-team-select.png)

## Visual review and validation

Reviewed the original arena examples, all six background paintings, and the original knapsack sheet. Reviewed actual source and offline normal-speed recordings and decoded frames at native size and 2× enlargement. The recorder runs real combat before deterministically finishing the opposing team through the engine's settlement path. Rewards are generated by the real loot function; the displayed gear is not an invented grant.

- [Source normal-speed video](../public/journey-polish-source.webm), [source timing](evidence/journey-polish/journey-source-motion.json)
- [Offline normal-speed video](../public/journey-polish-offline.webm), [offline timing](evidence/journey-polish/journey-offline-motion.json)

No creature source art, anatomy, painted limb skinning, material palette, equipment attachment or gait rig was changed. Camera/feedback live review includes base Aurel, Brakk, Voltwing, Nyra and Glassfang. The existing source/offline leg browser check additionally exercises twelve live creatures, including evolved crab, drake and stag, and stride values 50/150/100%. Training Glade verification exercises all nine rigs, eight directions and seventeen animation states. Existing unit cell-boundary and contact checks remain unchanged; no assertions were weakened to accommodate art defects.

| Check | Result |
| --- | --- |
| New camera/reward/relic/motion and existing art-provenance unit checks | 8/8 pass |
| Targeted real HP/shield text and weapon-contact checks after presentation refinements | 4/4 pass |
| Full unit suite | 346/348 pass; the same two pre-existing failures described below |
| New journey browser suite | Source/offline pass: desktop, 320/390/768px, keyboard/touch relics, full background resolution, card/coin/EXP destinations, all twelve bag frames, save during flight, gentle motion and team-selection layout |
| Uploaded UI browser suite | Source/offline pass: equipment click/remove/drag, capture controls, four intel tabs, inspection/report, rewards, defeat, capture success/failure, reload and continuation |
| Field UI, arena elite, capture recruitment | Source/offline pass |
| Arena feel, live roster, relic supplies, Chaos combat | Source/offline pass |
| Legs browser and Training Glade browser | Source/offline pass |
| Builds | Both offline HTML files rebuilt; embedded-script verification passes |

[Journey browser evidence](evidence/journey-polish/journey-browser.json), [full unit output](evidence/journey-polish/journey-unit-tests.txt), [uploaded UI evidence](evidence/journey-polish/uploaded-ui-browser.json), [live roster](evidence/journey-polish/live-roster-browser.json), [capture recruitment](evidence/journey-polish/capture-recruitment-browser.json), [Chaos flow](evidence/journey-polish/chaos-combat-browser.json).

The two known unit failures also occur before this follow-up: `grand-forms.test.js` expects an old 3.3 radius while the inherited weighted-footprint model returns 6.6; `overhaul.test.js` expects the seeded baseline shield-counter scenario to lose, while the inherited engine wins. They were documented in PR #29. Those assertions and gameplay outcomes have not been changed. CI should not be described as green while they remain.

To reproduce: `npm ci`, `npm run build:standalone`, `npm run build:prototype`, start the game with `npm start`, then run `npm run test:journey`. Use `npm run record:journey` for source and offline recordings. `BASE_URL`, `CHROMIUM_PATH`, and `FFMPEG_PATH` can select the local server and installed browser/decoder.
