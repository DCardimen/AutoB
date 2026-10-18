# Pass 2: opening expedition and post-match equipment

This pass addresses onboarding, opening decisions, reward clarity and specific game copy. It also fixes the reported gold-card artwork and the post-match weapon drag.

## Result

- The first expedition teaches preparation, combat, rewards, routes and capture in context. The combat prompt expires after eight combat seconds; completed or skipped steps stay dismissed across reloads. Help can replay the guide. Experienced saves receive no automatic guide.
- First preparation keeps advanced orders behind an accessible Advanced prep toggle. The existing combat controls and companion inspection remain available.
- New opening relic offers contain an immediate combat benefit and another direction. Conditional choices require the relevant party members, and cards explain recipients and inactive effects. Existing saved offers stay unchanged. A mixed seeded generator avoids repetitive offers without consuming route randomness.
- Rewards distinguish gold/EXP already granted from remaining cache items, show the two continuation requirements, and display actual EXP remaining to the next spell choice. Early equipment upgrade offers require a compatible deployed companion. Training describes the current party's actual stat gains.
- Intro, starter selection, rewards and help use concrete rules and outcomes. Help is six expandable topics instead of a single dense page.
- Gold reward cards, gold upgrade choices and Pilgrim's Coin use the complete existing gold emblem. The old treasure-pile image contains clipped neighbouring art in the source pixels; uploaded originals were preserved.
- Dragging equipment or stones from reward cards carries the item medallion artwork, rather than the earlier inspect-button icon. Legal slots highlight, the carried sprite follows the pointer, and a successful drop settles into the field. Escape or a missed drop cleans up without claiming the reward.
- Phone reward fields fill the available width. Reserved grade space prevents hover from shifting cards, and the footer no longer covers their drop/quick-equip controls.

## Visual review

| Evidence | What to inspect |
| --- | --- |
| [Opening choices](source-1440-relic.png) | Party-fit notes and complete gold emblem |
| [Desktop preparation](source-1440-ready.png), [phone preparation](source-390-ready.png) | Short guide, optional advanced preparation |
| [Offline phone rewards](offline-390-rewards.png) | Readable result panel, compact equipment and EXP milestones |
| [Phone route](source-390-route.png), [field notes](source-1440-help.png), [intro](source-1440-intro.png) | Contextual guidance and concrete copy |
| [Desktop weapon drag](source-1440-drag.png), [phone weapon drag](source-390-drag.png) | The actual weapon carried onto its companion slot; complete gold card |
| [Desktop journey video](source-1440.webm), [phone journey video](source-390.webm) | Recorded at normal speed, including real combat without HP or outcome overrides |
| [Drag video](quick-equip-normal-speed.webm) | Cancel, miss, successful weapon drop, stone upgrade and collection |
| [Decoded combat frame](source-combat-playback.png) | Native-size video playback review |

## Validation

- **48/48 targeted tests passed**: opening journey, seeded relic decisions, journey presentation, reward loadout, readable combat, chaos opening choices and uploaded-art outcome preservation. [Full output](unit-results.txt).
- **4/4 opening journeys passed**, source and fully embedded offline at 1440px desktop and 390px phone (phone DPR 3). Each completes a real first battle at 1x, pauses inspection, collects rewards, reloads without duplicate gold/EXP/items, follows a connected route, plans capture, verifies guide persistence and replay/skip, and checks the intro. No page errors or failed asset requests; offline requests are blocked. [Results](opening-browser.json).
- **4/4 reward loadout scenarios passed**, source/offline at desktop/phone sizes: carried artwork identity, pointer position, compatible slot highlighting, Escape/missed-drop cleanup, successful equipment and stone upgrades, collection/reload without duplicate claims, gold artwork loading/fit and no horizontal overflow. [Results](reward-browser.json).
- **10/10 layout scenarios passed**, source/offline from 2560px to 390px, preserving the Pass 1 arena layout. [Results](layout-browser.json).
- Both offline build commands completed. Training Glade is unchanged because its inputs did not change; the main offline file remains below 100 MiB.

Reproduce with `npm start` in one terminal, then `npm run test:opening-journey` and `node tests/reward-loadout.browser.mjs` in another. `BASE_URL` can select another local port. The opening browser check is included in field UI CI; the reward regression extends the existing CI check.

The complete repository test suite was not rerun for this UI pass. This evidence does not establish a 9/10 score for every game system or re-review creature anatomy, gait, attack physics or later campaign balance. No creature sprites or rigs changed.
