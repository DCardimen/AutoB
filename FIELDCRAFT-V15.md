# Native Expedition V15 · Fieldcraft / UI V2

Application 0.11.0. Open **Starfall-Menagerie.html**. New expeditions use the two-point start; existing saves preserve deployed companions and earned places. The save loader backs up schemas 1–5 before schema 6 migration. Art V3 and the requested .15 world baseline / .7–1.5 type factors are retained.

## Interface

UI V2 uses a forest palette, clear action hierarchy, consistent cards, rounded panels and restrained animation. Desktop navigation stays visible. Phones use bottom navigation, safe-area spacing and creature bottom sheets with Overview / Skills / Loadout / AI & growth tabs. Primary actions have 44-pixel touch surfaces. Smaller battle inspection icons remain compact because arena creatures use the requested reduced scale.

Equipment and support gems can be dragged from inventory, between companions, onto empty or occupied equipment places, back into the pack, or onto compatible abilities. Drag cooldown skills to change actual AI priority. Touch dragging uses a floating item preview; tapping still provides the existing equip/link actions. Tap outside or press Escape to dismiss creature inspection. Status terms expose their effects through hover, focus or tap. Armor, enemy equipment quality, enemy relic builds and evolution readiness are visible.

## Progression, capture and rewards

- New runs allow one or two bodies within **two starter points**. Common / Uncommon / Rare / Epic / Legendary cost 1 / 2 / 3 / 4 / 6. Bond 5 reduces the cost by one, or two for Legendary families. Clearing Chaos 1 / 4 / 8 / 12 / 16 / 20 grants another point, to a maximum of eight. A solo Uncommon is legal; an early Legendary starter is not.
- Team places unlock after **2 / 5 / 8 / 11 wins**. Shops offer later hiring permits. Ordinary first-world fights begin with two enemies, occasionally three. An ordinary third-room route reaches the first outpost, avoiding a mandatory rare hunt. New recruits match the local encounter level.
- Captures only happen when **preselected before combat**. Quick-select Scout Prism, Runic Cage, Astral Lattice or Mythic Snare, then choose a 5–75% HP threshold. Exactly one owned tool is reserved. Success and failure appear during combat and in the result screen. There is no post-match capture button or fallback attempt.
- At the same health and tool tier, new capture probability is at most half V12–V14 probability. Remaining HP further multiplies it by `0.2 + 0.8 × (1 − HP fraction)^1.8`. Lower health is much more valuable. A lethal strike or damage-over-time tick can kill the target before the throw; selecting it does not make it immortal. The successful individual retains its stat rolls, bound enemy relics, equipment and equipment quality during this run.
- Regular victories offer **two of four** rewards, choosing one. The item choice sometimes offers character equipment from the expanded catalogue and sometimes a linked gem; it is never granted automatically. Gear prices begin at 90 gold, below team relics. The opening doctrine offers two choices. Elites and bosses offer two unowned expedition relics, choosing one. Shops stock two costly relics; all expedition relic prices begin at 220 gold before difficulty modifiers. Equipment is not guaranteed each round. Gold rewards are reduced; EXP retains its previous pace so creature development remains meaningful.
- Defeat still kills a deployed starter for the run, destroys its worn items and one additional owned relic, and preserves the permanent family unlock. Saved settlement prevents rerolls.

## Equipment, enemies and tactics

**100 new equipment features / 106 total equipment entries.** New passives affect the entire character rather than one linked skill. Three base equipment places expand by one per evolution. Each actual evolution grants one gear-cache entitlement; opening base equipment places grants none. Damage modifiers, on-hit poison/bleed, conditional executions, counters, shielding, dodges, cooldown relays, healing overflow, ailment spreading, emergency survival and death effects use real combat hooks. Only six of the new entries are flat-stat pieces.

V15 normalizes positive numeric gear/relic bonuses to half strength; qualitative mechanics still work. Linked gems also use reduced numeric bonuses and display their current values. Enemy equipment uses an additional quality factor that rises with room depth, Chaos and encounter type. Full three-to-five-piece enemy loadouts accompany five coherent relic themes: Venom pact, Frost hunt, Shield legion, Ember pursuit and Clockwork pack. A separate enemy-side row lists every active relic; above-head inspection shows the individual build.

**12 new AI relics / 136 total expedition relics.** They alter focus fire, interrupts, guardian screening, orbiting, retreat toward cover, healing triage, support hunting, stamina reservation, formation discipline, danger response, executions and capture restraint. AI changes are integrated with normal targeting and steering; taunts and physical constraints still apply.

Armor reduces direct hits by `effective armor / (100 + effective armor)`. Guardians receive 40% more effective armor. Each additional point gives less protection. Poison, burn and bleed bypass armor. HP bars carry colored ailment markers, chip damage and status particles; damage text remains tied to the victim and fractional damage accumulates into visible numbers.

## Movement and artwork

Physical collisions, aimed melee arcs, projectile contacts, stamina-driven dodges, charged-attack protection, knockdown and death ragdolls remain active. Central solid blockers are removed from V15 fights. Body separation, flank destinations, strike margins and danger reactions now respect the much smaller shared creature scale. These fixes remove the repeated approach/flank loop seen during testing.

Acceleration, braking and corner speed produce continuous motion. Gait cadence is bounded instead of increasing wildly as sprites shrink. Direction hysteresis prevents rapid switching near facing boundaries. The completed eight-direction Art V3 renderer, articulated hand/weapon grips, alternating swings, anticipation, cape/hair physics and species-specific gaits remain. The main arena now draws at the full 1002×654 grid with nearest-neighbor sprite sampling. Enlarged portraits retain crisp pixel edges; this is a rendering/motion pass, not a new set of art masters.

## Verification

Recorded evidence is in `tests/reports/fieldcraft-v15.json`. The full unit run passed 196 tests. A further 91 relevant checks passed after the outpost/recruit/EXP pacing adjustments, including the additional route and equipment reward tests and observable effects for all 100 new equipment entries. Nine browser scenario groups cover point limits, capture ownership/results, loadout dragging, status help, inspection, rewards, evolution readiness and mobile layouts at 320 / 390 / 768 pixels. Real Chromium touch input transfers equipment without duplication. Both native V15 and migrated legacy embedded-HTML battles complete and reload with zero external requests.

Legal Explorer and Standard campaigns start with Aurel and Syl within two points, grow to six and clear three planets through actual UI purchases, captures, rewards and evolutions. They make no combat-stat or outcome overrides. The Explorer run also wins the first three ordinary rooms with just its original two bodies. Earlier less prepared policies failed; these are one policy/seed per difficulty, not a population win rate.

The attempted Chaos 1 seed-3 policy lost on the first planet and failed its full-clear assertion, with no browser errors. Chaos progression/point unlock unit tests pass, but a V15 tier-clear campaign is not established. Broader policy sampling remains necessary.

The normal-speed preview records twelve seconds of actual combat at 30 FPS with the browser clock explicitly paused between fixed frame steps. Desktop, phone and loadout screenshots come from the running game. The earlier controlled first-room sample won 30/32 unprepared and 29/32 prepared encounters, with one timeout in each policy; average duration was about 38 seconds, down from 62 seconds before the tiny-scale spacing fixes. These samples do not measure human fun or a full campaign win rate.

The 9/10 UI and movement target is a design goal, not an objective consequence of passing tests. Art source files were not repainted, phone testing uses emulated Chromium touch, and broader human device/play balance review remains useful. No fifty-hour human playtest is claimed.

```sh
npm ci --cache /tmp/autob-npm-cache
PORT=3024 npm start
npm test
BASE_URL=http://127.0.0.1:3024 npm run test:fieldcraft
BASE_URL=http://127.0.0.1:3024 node scripts/review-fieldcraft-v15.mjs
BASE_URL=http://127.0.0.1:3024 node tests/expedition-v15-campaign.browser.mjs
npm run build:standalone
BASE_URL=http://127.0.0.1:3024 node tests/standalone.browser.mjs
```

Use `CHROMIUM_PATH` and `FFMPEG_PATH` overrides on other hosts. `public/Starfall-V15-UI-V2.zip` contains both offline games, this document and the current review media. Open the main game for these changes; Training Glade is the separate animation lab.
