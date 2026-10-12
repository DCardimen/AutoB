# Development continuation

Current branch: codex/starfall-menagerie. Do not stage, alter or delete the pre-existing untracked expedition.js draft.

The user asked to continue milestones, save/push near 90% usage and resume when usage returns. The agent cannot inspect the user's quota percentage or wake itself after replenishment. Work is saved at validated checkpoints; a new user turn can resume from this file.

## Checkpoint v8

Native expedition integration is implemented. Open Starfall-Menagerie.html and start a New expedition for the six native starters; existing legacy saves remain valid. Nine native families, 69 total families, 146 skills, native courtyard rendering/weapon contacts, charge protection, held-weapon projectiles, family evolution bonuses and save schema-1 backup are connected to the full expedition.

125 tests pass. The native UI campaign clears all three planets with nine wins and exercises shops, gems, captures, evolution, reloads and reset growth. The rebuilt offline legacy fixture passes with zero external requests.

## Checkpoint v9

Native Expedition v9 / application 0.5.0 adds four formation orders, two prioritized conditional rules, seeded pillars with steering and shot/beam blocking, live intentions, committed 0.38-second skill channels and cancellation, healing reservations, living knockdown/get-up, build practice with real baseline/loadout comparisons, exclusive opening relic doctrines and native recruitment/evolution explanations. Brakk's signature has actual shield bypass. Shared animation changes preserve the accepted Training Glade.

139 tests pass. The final native browser campaign clears all three worlds with nine wins; controls/practice/reload/mobile checks pass. Legacy arena, native/legacy embedded offline combat and the Training Glade's ten browser scenarios pass. A 36-run first-planet bot sample clears Explorer 12/12, Expedition 12/12, Veteran 7/12. This is one policy and a small sample; no human playtime or fun rating is established.

## Checkpoint v10 · Milestone 2 production batch

Twelve new families bring the roster to 21 native / 81 total families and 182 unique abilities. Native roster atelier, 17 poses/eight views, serpent/flyer locomotion, family geometry/equipment profiles, silhouette-changing forms, habitats, varied one/two/three-form lineages and combat accomplishment evolution routes are connected. Grit and Morrow have deliberately modest base power. Skill IDs and gem links remain stable. Older ascended companions are retained; schema-2 saves back up before upgrading to schema 3.

Character height is a saved 85–110% visual slider. Winning Chaos 1 raises the six-member starter budget to 13, once. Both Expedition and Chaos 1 completed three-planet UI campaigns. 147 unit tests pass; native/legacy offline, mobile, migration, growth settlement and Training Glade checks pass. Godot imports/loads 85 exported form variants, 136 animations each, 92,480 checked cells with zero clipping. See MILESTONE-2.md and tests/reports/native-roster-v10.json.

The twelve-family batch is complete; the planned 36-family expansion has fifteen families remaining after the 21 released native families. Default Training Glade continues to contain nine representative bodies; new family inspection is in Starfall-Menagerie.html → Roster & forms. Open the main game to see v10.

## Checkpoint v11 · Grand forms and pixel-only collection

29 authored families / 89 pixel families. Eight new families, crab/centipede locomotion, 50% baseline with 70%–400% type sizes, physical scaling and safe margins, major base/evolved/ascendant silhouettes, one new cooldown + equipment slot + support socket per stage, gear caches/purchases/equip/unsocket, actual gear stat changes, shoulder-anchored cloth mesh and victim-linked pixel damage text are implemented. 562 named skill definitions include 28 older-save compatibility unlocks; evolution mechanics share role templates. Sixty retained families are converted using shared pixel anatomy templates rather than sixty new bespoke rigs. Six original painted atlases and the old renderer are removed; old collections and encounter pools remain valid. Save schema 4 backs up schema 1/2/3. Older ascended companions stay usable.

157 unit tests pass. Standard and Chaos 1 UI campaigns each clear all three planets; captures/shops/gems/evolutions/reloads, the thirteen-point Chaos starter budget, practice and mobile checks pass. New gear UI tests verify true extra cooldowns, two equipment slots, saved choices, exact-once caches/purchases and mixed-size physical combat with live cloth and pixel text. Fresh/migrated offline HTML uses zero external requests. All 89 pixel families' current forms/branches pass 170,136 sampled cell bounds checks. Authored Godot export: 29 families, 117 variants, 127,296 cells, 136 animations each. See GRAND-FORMS-V11.md and tests/reports/grand-forms-v11.json.

Run the main game, not Training Glade, for these changes. The native expansion target has seven authored families remaining to reach 36. New creatures and changes are visible through Roster & forms and creature evolution/equipment panels. Next work remains the later roadmap items below; do not reimplement the v11 scale or legacy conversion. No human 50-hour playtime or fun 9/10 claim is established.

## Checkpoint v12 · Two beginnings, six ambitions

The previously queued eight-part gameplay pass is implemented in application 0.8.0. New runs start with two companions and accrue places at wins 3 / 6 / 9 / 12, with shop permits after win 3. Early common fights are two to three unseasoned enemies. Seeded individual stat tradeoffs, explicit eight-room routes (one to four outgoing edges), four-room fog/scouting/warp curios, enemy relic buffs/overhead inspection, 100 new executable curios (124 total), four capturer tiers, adjustable HP capture thresholds, slow-motion angular lattice encounters, exact-once enemy victory caches, body-part arena pickup/drop and guaranteed starter loss/item destruction are connected.

Guaranteed run casualties override the old rarity/hospital rescue rolls. Older six-member UI saves preserve their team capacity and saved routes; they adopt the new loss/capture rules. Schema 5 backs up older versions. Bound enemy curios and stat rolls are retained in a captured individual during the run; future runs still begin in fresh base forms. On defeat worn equipment, bound curios and skill gems disappear, plus one additional owned relic. The team seat retains an X; reserves refill earned places.

174 unit tests pass, including seventeen V12 scenarios. Twelve late-battle relic fixtures at Chaos 5/10/20 finish with finite state. Browser, offline, migration, roster/equipment, practice/mobile and Training Glade checks pass. See EXPEDITION-V12.md, RELICS-V12.md and tests/reports/expedition-v12.json. First-three-round sample: 40 seeds each for default/prepared policies; first round 37/40 and 38/40 wins, all three 27/40 and 30/40 clears. Standard and Chaos 1 legal Brakk/Nyra campaigns each grow from two to six, clear three worlds, and recover from one boss casualty. No human fifty-hour or fun-score claim. The accepted pixel art/Training Glade remain; next work is the later milestones below, not another rewrite of the completed v11/v12 systems.

## Checkpoint v13 · Sprite Art V2

Application 0.9.0 updates the live renderer and both offline HTML files. Shared integer face clusters, clearer rear/profile views, connected necks, wider clothed torsos and boots, cleaner armor/weapon shading, bow grip alignment, shield foreshortening, cape/face depth correction, broader mechs and readable spider/jelly motion are implemented. Grand forms use cleaner emblems. The main arena draws directly at 668×436 instead of shrinking finished sprites into 334×218; three standard-size source-pixel browser fixtures retain 100% of opaque texels. Health bars use measured sprite bounds. The original calibrated physics rig remains unchanged; an experimental bone retarget affected a campaign and was reverted before release.

177 unit tests pass, including three new face/cluster/connectivity tests. Standard legal UI campaign again clears three worlds with sixteen fights, fifteen wins and one casualty. Deployment/capture/loss/migration, grand forms/equipment/cloth/text, Training Glade, mobile and native/migrated standalone checks pass. Both updated Godot projects import and start: 117 authored variants / 127,296 cells, plus nine lab bodies / 9,792 cells, with no export clipping. Actual eight-direction contact sheets and a sixteen-second normal-speed motion recording were reviewed. See SPRITE-ART-V2.md and tests/reports/sprite-art-v2.json. No human art/fun score is asserted.

Main header: NATIVE EXPEDITION V13 · ART V2. Training header: NATIVE PIXEL V8 · ART V2. Public media: sprite-art-v2-preview.mp4, sprite-art-v2-showcase.png and sprite-art-v2-directions.png. Godot package: public/native-roster-godot-v13.zip. Playable package: playtest-artifacts/Starfall-V13-Art-V2.zip. Existing saves immediately use the revised art; no reset is needed. The active development server for this checkpoint is port 3015, with the new pixel-face-tools.js module allowed. New scripts/tests default to port 3000; override BASE_URL for the active port. Do not rewrite the completed v11/v12 systems or touch the untracked expedition.js.

## Next work

1. Implement a bounded defeat replay and highlight decisive hits, lost channels and counterplay. Keep settled results and save data unchanged during replay.
2. Run multiple legal build/routing policies across difficulty and Chaos. Standard looks forgiving in the current 12-seed policy sample; investigate tactics and encounter composition before simply raising stats.
3. Implement family mastery, prepared rare hunts, bounded failed-capture extraction and pre-expedition capture kits, with reload/exact-once tests.
4. Add connected route objectives/stories, alternative bosses and route-dependent boss preparation.
5. Continue milestone 2 with another reviewed native roster batch toward the remaining seven-family authored expansion target. Current native forms have equipment/silhouette and behavior changes; bosses still use representative bodies.

## Verification and files

Commands: npm test; npm run build:standalone; BASE_URL=http://127.0.0.1:3015 npm run test:art; BASE_URL=http://127.0.0.1:3015 npm run test:native; BASE_URL=http://127.0.0.1:3015 node tests/prototype.browser.mjs. Start an unused port with PORT=<port> npm start; whitelist changes require a new server. Chromium is /usr/bin/chromium. Godot 4.6.3 uses scripts/check-godot.mjs with writable XDG directories under /tmp.

Evidence: tests/reports/sprite-art-v2.json, tests/reports/expedition-v12.json, tests/reports/grand-forms-v11.json and historical v9/v10 reports. Raw logs/reports/screenshots are under playtest-artifacts/. Playable artifact: Starfall-Menagerie.html. Current art media and package paths are in the v13 checkpoint above. Existing untracked expedition.js remains untouched.

The agent cannot read the user's quota percentage or resume itself on a timer. The user can send a new continuation message after usage replenishes; continue from this checkpoint without restarting completed milestones. The current branch is codex/starfall-menagerie.
