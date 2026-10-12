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

## User-requested next pass · queued after v11 completion

The user explicitly said to finish this first pass before implementing the following additions. They are queued requirements, not v11 features. Preserve this ordering and do not restart the completed art/scale work.

1. Begin new runs with two active slots/companions. Team building should accumulate through a run. Early enemy teams have two to three enemies; the first two or three ordinary rounds should be beatable by two starters, with occasional dangerous control/synergy combinations. Define how earned deployable slots and starting-point budgets coexist before coding.
2. Give enemies random relic buffs according to Chaos and encounter difficulty. Show clear nearby icons and inspectable descriptions before battle.
3. Support pre-battle arena drag/drop placement. Pickup location determines the held body anchor; use a ragdoll while lifted and on release. Persist deployment only after a valid drop and prevent placement edits after combat starts.
4. Add above-head enemy inspection and capture setup before combat. Show configurable HP threshold and estimated success rate. Halve capture success chances. Attempt automatically when the threshold is crossed, slow the action, and show an original capture device/encounter over the creature (no Poké Balls).
5. Losing a battle kills a random starter for the rest of the run, with a death animation and an X on its team position. Worn items disappear when their wearer dies. Destroy one random relic as well. Clarify the interaction with the existing upgradable rarity-based rescue system through an explicit implementation choice; the new guaranteed-starter-loss request must not be silently replaced by the old rescue odds.
6. Let flat creature stats vary widely as a strategic recruit choice. Add capturer tiers purchasable at outposts and available from difficult-battle loot. Add satisfying enemy loot drops with real rewards, clear ownership and reload/exact-once protection.
7. Each route step should offer one to four explicit connections, with diverging long-term branches. Show four steps ahead by default; scouting relics modify visibility. The current adjacent-lane rule is not this new explicit graph.
8. Add 100 relics, each inspected individually for interesting build effects. Limit plain flat-stat items to about 10–15%. Requested examples: longer sight, lower enemy HP, poison on hit, repeat spells, cooldown and movement modifiers; broader possibilities should alter targeting, status interactions, capture, economy, mobility, recovery, route plans and composition.

Suggested sequencing: two-starter economy and encounter calibration; explicit route graph and scouting; capturer tiers/capture/loss settlement; physical deployment/overhead controls; staged relic batches with executable effect tests and legal campaign comparisons. These are distinct product changes and must be verified together before claiming completion or a fun score.

## Next work

1. Implement a bounded defeat replay and highlight decisive hits, lost channels and counterplay. Keep settled results and save data unchanged during replay.
2. Run multiple legal build/routing policies across difficulty and Chaos. Standard looks forgiving in the current 12-seed policy sample; investigate tactics and encounter composition before simply raising stats.
3. Implement family mastery, prepared rare hunts, bounded failed-capture extraction and pre-expedition capture kits, with reload/exact-once tests.
4. Add connected route objectives/stories, alternative bosses and route-dependent boss preparation.
5. Continue milestone 2 with another reviewed native roster batch toward the remaining seven-family authored expansion target. Current native forms have equipment/silhouette and behavior changes; bosses still use representative bodies.

## Verification and files

Commands: npm test; npm run build:standalone; BASE_URL=http://127.0.0.1:3013 npm run test:native; BASE_URL=http://127.0.0.1:3013 node tests/prototype.browser.mjs. Start an unused port with PORT=<port> npm start; whitelist changes require a new server. Chromium is /usr/bin/chromium. Godot 4.6.3 uses scripts/check-godot.mjs with writable XDG directories under /tmp.

Evidence: tests/reports/grand-forms-v11.json and historical v9/v10 reports. Raw logs/reports/screenshots are under playtest-artifacts/v9-*. Playable artifact: Starfall-Menagerie.html. Video: public/native-expedition-preview.mp4. Package: playtest-artifacts/Starfall-Native-Expedition-V11.zip. Roster video: public/native-roster-preview.mp4. Godot assets: public/native-roster-godot-v11.zip. Existing untracked expedition.js remains untouched.

The agent cannot read the user's quota percentage or resume itself on a timer. The user can send a new continuation message after usage replenishes; continue from this checkpoint without restarting completed milestones. The current branch is codex/starfall-menagerie.
