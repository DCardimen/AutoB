# Chaos, relics and combat update

Latest update: three randomized Common starter equipment pieces appear beneath the creatures; eight original build-around relics add resource banks and team interactions. Enrage ramps continuously after 30 seconds with live damage, healing and action modifiers. See [relic research and current rules](RELIC-DESIGN.md).

Three starter points plus one per cleared Chaos tier; a third starting companion at Chaos 3. Adds 30 relics, 50 equipment types, speed and stamina stats, temporary captured allies, weakest-first and click-to-focus targeting, varied opening encounters and new combat effects. Relics are retained after companion deaths. See [changes and play instructions](CHAOS-COMBAT.md).

**Melee weapon and arm polish · Art 6:** Complete connected arms, original weapon silhouettes and readable carry poses; phone AI controls moved below the creatures. See [the changes and validation](MELEE-WEAPONS.md). After pulling, run `npm ci` and `npm start`, or `npm run build:standalone` for the updated offline game.

**Reference field UI:** Illustrated route scene and encounter sheet, matching menus, mobile combat layout and original vector artwork. See [UI notes and build instructions](FIELD-UI-V3.md). Run `npm ci` and `npm start` to play the latest source after pulling. For the updated offline game, run `npm run build:standalone`, or use the **Starfall-Reference-UI** Actions artifact.

# Previous release · V17.1 palette fix

A single-player creature-collecting roguelike autobattler with physical arena combat. Start with two companions and grow a team of six across three planets, build individual companions with personal relics and equipment, capture permanent starters, and climb twenty Chaos tiers.

**V17.1 fixes sprites with mismatched lower-body colors.** Authored colors remain consistent across equipment, evolution and animation; collection variants now color the entire material instead of only the lower half. See the [fix and checks](SPRITE-PALETTE-FIX.md), [directional examples](public/sprite-palette-fix-directions.png), and [updated offline games](public/Starfall-V17.1-Palette-Fix.zip).

**Creature Motion V17 is playable in Starfall-Menagerie.html.** See [V17 changes](CREATURE-MOTION-V17.md), [movement preview](public/creature-motion-v17-preview.webm), [planet chart](public/creature-motion-v17-planets.png), [team controls](public/creature-motion-v17-team.png), [EXP and team comparison](public/creature-motion-v17-recap.png), and [offline package](public/Starfall-V17-Creature-Motion.zip). V17 adds interpolated movement, shared hand/weapon attachments, crouched bow attacks, idle motion on every family, whole-creature personal relics, wearer-only equipment, automatic capture retries, a reserve tray, AI target previews, biome maps and menus that keep your scroll position.

**Arena Feel V16 is playable in Starfall-Menagerie.html.** See [V16 rules and validation](ARENA-FEEL-V16.md), [Settings preview](public/arena-feel-v16-settings.png), [battle recap](public/arena-feel-v16-recap.png), [mobile recap](public/arena-feel-v16-mobile.png), and [offline package](public/Starfall-V16-Arena-Feel.zip). V16 adds 30-second enrage, accessible early captures with two retries, thirteen live tuning sliders, visible equipment transfers, opponent-based loot rarity and quality, and per-creature combat charts and knockout timelines.

**Previous V15 / UI V2 release.** See [Fieldcraft / UI V2 changes and verification](FIELDCRAFT-V15.md), [desktop UI](public/fieldcraft-v15-desktop.png), [phone UI](public/fieldcraft-v15-mobile.png), [current movement](public/fieldcraft-v15-motion.webm) and [offline games](public/Starfall-V15-UI-V2.zip). V15 adds a two-point starter budget, harder preselected-only captures, 100 character-wide equipment features, smarter AI relics, armor, full enemy loadouts and touch-friendly loadout screens. Existing Art V3 is preserved. Art V3 adds baby → mature → apex designs, connected weapon grips and articulated hands, walking/running/sprinting, flowing hair and capes, and species-preserving evolution. Forty-one source anatomies across three stages serve the existing 89 families. Existing saves update on refresh. See [changes and visual review](SPRITE-ART-V3.md), [evolution sheet](public/sprite-art-v3-evolutions.png), [motion preview](public/sprite-art-v3-preview.webm), [offline games](public/Starfall-V14-Art-V3.zip) and [Godot export instructions](SPRITE-ART-V3.md#artifacts-and-rebuilds).

New runs begin with one or two companions within two rarity points; team places unlock at 2 / 5 / 8 / 11 combat wins and shop permits accelerate growth after win 3. Early ordinary encounters use two or three unseasoned enemies. Eight-room planets have explicit branching connections and four-room scouting. At 25% HP, default capture odds are 90% Common, 85% Uncommon, 25% Rare, 22% Epic and 8% Legendary, with lower-HP bonuses, zero chance at full HP and real knockout risk; four capturer tiers, configurable HP thresholds and a slow-motion lattice animation make recruitment a build choice. Enemies carry inspectable relic buffs. Arena pickup/drop uses body-part ragdoll anchors. Defeat guarantees a deployed starter casualty, destroys worn items and one owned relic, and leaves a saved X. Victory caches and 100 new relics are connected to real gameplay. See [v12 rules and validation](EXPEDITION-V12.md).

All 89 collection families use the revised pixel renderer, retaining major evolutions, skill/equipment unlocks, physical cape meshes and victim-linked pixel damage text. Twenty-nine native families and sixty retained families use 41 source anatomies with elemental variants. Existing six-member saves keep their teams and saved routes; **New expedition** starts the new two-member progression. The Training Glade remains the animation lab. See [grand-form mechanics](GRAND-FORMS-V11.md) and [continuation checkpoints](CONTINUATION.md).

The next overhaul follows [ROADMAP.md](ROADMAP.md), with eleven playable milestones covering reference-inspired directional animation, a broader fantasy roster, the sixty proposed gameplay improvements, and player testing. [Iteration 1](MILESTONE-1.md) now has a playable nine-body movement prototype: open **Starfall-Training-Glade.html**, or use the Training Glade link in the game footer. It remains the representative movement lab; all 89 pixel families and their forms are inspectable in the main game through Roster & forms. Further production batches and later roadmap items remain planned.

The prototype opens with an **8 directions** comparison. Choose a companion to see all eight views; click one to inspect it closely. Watch the [normal-speed preview](public/prototype-preview.mp4) for walking, running, sprinting, combat and a fall, or inspect the [current pixel glade](public/prototype-pixel-world.png).

**Native Pixel v8 · Art V2** uses original 64×64 sprites with compact proportions and crisp nearest-neighbor enlargement. The five heroes have four-view and animation showcases. Ember remains a four-legged hound; a fox ranger, six-legged brass walker, eight-legged spider and moon jelly bring the prototype to nine body types. Running, cape flow, direction changes, fast braking, physical dodges, death ragdolls and heavy-hit knockdown/get-up motion are implemented. The revised faces, clothing and equipment use coherent pixel clusters in all views. Sparring rolls fresh teams of six, with alternating overhead/side swings and three anticipation levels; charged attacks take damage but resist stun, knockdown and knockback.

Open **Starfall-Training-Glade.html** in Chrome, Edge or Firefox and look for **NATIVE PIXEL V8 · ART V2**. Select companions from the dropdown beside the scene controls or the cards. Choose **Movement → Run/Sprint**, or inspect the states in **Pose study**. The game works offline with Canvas 2D.

[Native v7 details](NATIVE-PIXEL-V7.md) cover controls, physics and validation. [godot-sprites/project.godot](godot-sprites/project.godot) opens a Godot 4 demo with nine PNG sheets and SpriteFrames resources: 9,792 exact 64×64 cells, eight facings and 136 animations per actor. Use `npm run export:prototype` to regenerate assets and `npm run check:godot` to validate import/startup. Rebuild the offline HTML with `npm run build:prototype` after source edits. The [movement plan](CHIBI-MOTION-PLAN.md) keeps 9/10 visual targets separate from automated checks.

## Play

After pulling this UI branch, run `npm ci` and `npm start`, then open http://localhost:3000. To play offline, first run `npm run build:standalone` and open **Starfall-Menagerie.html** in Chrome or Firefox, or extract the tested **Starfall-Reference-UI** GitHub Actions artifact. The rebuilt HTML embeds all code, artwork, audio synthesis, and fonts and needs no server or internet connection. Tracked older generated packages are historical; rebuilding includes the latest source changes.

Keep the file at the same location to retain its browser-local save. Existing collections are preserved on the same browser origin. New runs use the new route generator; an existing run keeps its saved route.

## What changed in 0.4.0

- **Committed attacks.** Melee has a visible aimed arc, windup, contact, and recovery. Leaving the arc or reach avoids the swing. Beams telegraph a fixed line. Basic ranged attacks aim before releasing straight-flying projectiles; the first hostile body in their path takes the hit. Shots do not home in or vanish just because their original target dies.
- **Physical movement and weight.** Allied and enemy bodies collide, heavier creatures resist displacement, and arena walls contain them. Hits impart decaying momentum. Dash and charge skills travel through the arena instead of teleporting onto a tracked enemy. Strikers flank an occupied front, while Guardians can screen incoming shots.
- **Real dodge rolls.** AI reacts to incoming swings, projectile paths, and danger zones, scores escape directions, then physically moves. Rolls cost 30 stamina and have a cooldown. Attacks also cost stamina. Roots, stagger, committed actions, exhaustion, and nearby bodies can prevent a successful escape. Dodge stats improve reactions and roll cooldowns; they never randomly cancel a connected hit.
- **Poise and statuses.** Heavy impacts break poise and stagger a creature, cancelling a pending windup. Heavy melee also causes three seconds of bleed; movement makes bleed 60% stronger. Cleanses remove bleed and roots as well as burn and poison. Existing slow, expose, wither, shields, and elemental interactions remain. Gold bars show stamina; orange bars show poise. Reports include whiffs, staggers, and physical body blocks.
- **Permanent run casualties.** Defeat selects one deployed starter at random; after all starters are gone, it selects another deployed companion. The casualty is guaranteed and lasts for this expedition. Worn gear, bound curios and socketed gems are destroyed. One additional owned expedition relic, or packed support gem if none remain, is destroyed. Permanent family unlocks remain. Settlement cannot be rerolled by reloading. This supersedes the old rarity-based rescue/hospital rule.
- **Real vacancies and reserves.** Losing a companion leaves an empty place. Deploy a captured or recruited reserve without losing its earned progression. You may fight with fewer than six. The save loader now preserves reduced teams, casualty records, protection upgrades, and retry state.

## Creature collection and builds

- **89 pixel families / 29 authored families.** Every family has a signature auto-attack, two or three base cooldown skills, and a passive specialty. Evolution adds a distinct cooldown skill each stage. The 562 named skill definitions include role-based evolution variants and compatibility unlocks for older saves. Common shield-breakers, interceptors, cleansers, and dodge counters can earn a place beside rarer creatures.
- **30 support gems.** Link a gem to one ability. Fork changes targeting; Cryostasis combines slow and burn into steam; Withering counters healing; Reservoir turns excess healing into shields; Soul Link intercepts damage; other supports create traps, healing fields, cooldown relays, and execution builds. Tradeoffs are stated in the item description. Incompatible skills are disabled, and equipment chooses a valid initial link.
- **Rarity-scaled sockets.** Common 1, Uncommon 2, Rare 3, Epic 4, Legendary 5. Evolution and ascension add one socket each. Different supports can share a skill; duplicate supports on one creature are prohibited. Relink and unsocket freely between battles.
- **106 character-wide equipment entries.** Three base equipment places, plus one per evolution. Poison networks, counters, dodge triggers, periodic wards, conditional executions and emergency effects interact with all of a companion’s actions. Numeric bonuses are normalized; enemies wear full sets with coherent relic builds and growing quality. Armor has diminishing returns and is more effective on Guardians.
- **Behavior-changing evolution.** Family lineages vary from one to three forms. Native combat accomplishments can unlock evolution from level 3; otherwise evolve at level 5 for 50 gold. Guardians become retaliators or interceptors; Strikers become executioners or dodge counters; Rangers become artillery or trappers; Supports become curse-weavers or protectors. Where the lineage supports it, level 8 ascension (or a native accomplishment from level 6) costs 100 gold and strengthens the chosen path. Identity, EXP, and skill links remain intact.
- **136 expedition relics, including 100 curios and 12 AI relics.** Build around excess-healing shields, dodge-driven cooldown relays, poison networks, elemental diversity, execution resets, or one emergency revival. Ninety of the new curios change routes, capture, economy, hit conditions, statuses, dodges, healing, spells, kills or deaths. Ten provide flat stats. See the [full new catalogue](RELICS-V12.md).
- **Scouting and deployment.** Drag a head, limb or weapon on the arena before battle to lift a constrained ragdoll, then drop on the allied half. Placement persists. A three-by-three tactical grid also remains available. Choose Adaptive, Hunt Healers, Break Armor, Protect, or Finish Wounded per creature. AI saves healing and barriers for useful conditions, aims areas at clusters, kites, and avoids marked danger. Taunts still matter.
- **Eight enemy compositions, six weather conditions, sixteen events.** Routes vary node placement and scouting across seeds. Contracts exchange immediate resources for an explicitly stronger next battle. Every event can be declined.
- **Three distinct bosses with three phases each.** The Hollow Crown feeds on its retinue, the Sun Eater consumes burn for shields, and the Last Colossus gathers creatures into gravity wells. Their counterplans are visible before combat.
- **Tactical captures.** Use the above-head diamond to select a wild target. Choose a 5–75% HP threshold and Scout Prism / Runic Cage / Astral Lattice / Mythic Snare (1 / 1.3 / 1.6 / 1.9 times the halved basic chance). Mercy reduces team damage 14% until the attempt and improves its base odds; Swift reduces damage 6%. Low HP and statuses improve odds. The selected capturer is reserved at battle start. Crossing the threshold starts an automatic slow-motion lattice attempt; if never reached, the reservation is spent. Resolved captures persist after retreat or reload. Captures must be preselected; there are no post-victory attempts. Captured stat rolls and enemy curios survive recruitment; permanent family unlocks begin future runs with fresh base forms. Planet guardians cannot be captured.
- **Victory caches and creature tradeoffs.** Pick up coins, unique relics, equipment and capturers. Elite/boss caches can drop stronger capturers. Natures and individual HP/attack/speed/cooldown rolls create substantial tradeoffs; shops show the actual recruit stat profile. Claimed caches and sold recruits persist exactly once.
- **Routes.** Eight encounters per planet, one to four outgoing edges per room. Four rooms are visible by default. Scouting relics reveal more; warp relics cross disconnected edges a limited number of times. Choose a safe growing route or risk elites and sanctuaries.
- **More Legendary access.** Every shop offers a Legendary contract and a celestial beacon. Beacons guarantee a Legendary at the next sanctuary. Later sanctuaries can also contain natural Legendary spawns. Migration events trade resources for Legendary recruits. Each expedition victory grants three starlight, enough to adopt one permanent Legendary family from the menagerie.
- **Permanent bonds.** Successful captures raise a family's bond, capped at five. Each bond gives its starters 2% additional base health. Bond 5 reduces starter cost by one, or by two for Legendary families. The budget begins at two points; Chaos clears 1 / 4 / 8 / 12 / 16 / 20 raise it to eight. Legendary starters require later permanent progression. Extra active places are earned within the run. Runs still begin at level 1 in base forms, without expedition relics.
- **Difficulty and Chaos.** Choose Explorer, Expedition, or Veteran. Winning unlocks Chaos 1; clearing Chaos N unlocks N+1, through 20. Rules accumulate: elite improvements, economic constraints, earlier boss phases, enhanced enemy healers, additional shields, and stronger final retinues. The new-expedition screen lists every active rule. Previously won profiles automatically unlock Chaos 1.
- **Animation v2.** Movement accelerates and turns smoothly. Shape-specific gaits, breathing, wing motion, attack anticipation, delayed melee contact, follow-through, interpolated dashes and trails, recoil, and physical ragdolls animate the pixel sprites. Pause freezes creature poses and camera shake. Gentle motion is available and respects the browser's reduced-motion preference.
- **Combat feedback.** Enemy danger zones use distinct rings and countdowns. Status markers, skill cooldowns, shield bars, elemental impact sounds, and a local procedural score communicate combat. Reports explain poison, burn, area damage, healing threats, interception, and shield absorption. The last report survives reload.

Surviving allies recover fully between encounters. EXP, training, gems, and expedition relics last for the run; captures, bonds, adopted families, and Chaos unlocks persist.

## Controls

- Inspect a creature using Overview / Skills / Loadout / AI & growth tabs. Drag equipment, support gems or cooldown skills; touch dragging works too. Tap outside to dismiss. Hover or tap ailment terms for help.
- **Defeat rules** explains guaranteed run casualties and item destruction.
- **Reserves** fills earned places or casualties from captured/recruited companions.
- **Deployment & AI** opens the grid. Select a companion, then a cell; occupied cells swap.
- The **overhead diamond** and **Tactical capture** controls set target, approach, tool and HP threshold.
- **Space** pauses; **1 / 2 / 3** change battle speed.
- The **Star chart** opens neighboring routes. Scout composition, weather, and counters before committing.
- **Menagerie → Celestial adoption** spends victory-earned starlight.
- **New expedition** selects starters, difficulty, and an unlocked Chaos tier.
- The sound button enables optional effects and music. **Motion: gentle** reduces deformation and shake.

## Saves

The game uses `localStorage` on the current origin. Clearing browser storage or changing origin removes access to that device's save. Cloud accounts and cross-device sync are not implemented.

Refreshing during battle returns to preparation. A defeat reservation and its settled casualty result remain. The committed capturer and any resolved capture result remain: replaying does not charge again or reroll the result. Rewards, purchases, bonds, Chaos unlocks, and the last battle report persist. Each victory grants its starlight once.

## Development and validation

Requires Node.js 20+; Playwright is a development dependency only.

```sh
npm ci --cache /tmp/autob-npm-cache
npm run dev
```

The server listens on port 3000. Use `PORT=3001 npm run dev` if another service occupies it. Check that the arena renders and that `/game.js`, `/tactics.js`, `/sound.js`, and the local artwork load.

```sh
npm test
BASE_URL=http://127.0.0.1:3000 npm run test:fieldcraft
BASE_URL=http://127.0.0.1:3000 node scripts/review-fieldcraft-v15.mjs
npm run test:standalone
```

Browser tests use `/usr/bin/chromium`; override with `CHROMIUM_PATH`. For another port, use `BASE_URL=http://127.0.0.1:3001 npm run test:browser` and the same variable for the standalone check. Historical V12 samples are retained; see FIELDCRAFT-V15.md for current evidence. Some older browser scripts target the previous untabbed UI; the V15 fieldcraft suite covers current navigation. Campaign browser checks accelerate the actual engine while using legal UI purchases, captures, routes and evolutions; they do not measure human playtime.

`npm run build:standalone` rebuilds the downloadable HTML after source changes. Browser artifacts and raw simulation reports are written to ignored `playtest-artifacts/`. See [PLAYTEST.md](PLAYTEST.md) for recorded results and limitations, and [DESIGN.md](DESIGN.md) for the twenty review targets. Automated tests establish functionality and controlled outcomes; they do not establish a human 9/10 fun rating.

## Source

`arena.js` contains swept collision, attack geometry, body mass, and boundary rules; `game.js` contains progression and combat; `tactics.js` contains specialties, challenge tiers, encounters, new items, and events; `skills.js` and `roster.js` define abilities and families. `app.js` handles UI and persistence; `status-ailments.js` supplies menu help and live markers; `loadout-interactions.js` validates drag/drop transfers. `equipment-catalog.js`, `item-effects.js` and `ai-relics.js` define V15 builds and normalization. `animation.js`, `art.js`, and `sound.js` handle presentation. `scripts/build-standalone.mjs` embeds the complete game. `native-forms.js`, `grand-designs.js`, `native-cloth.js`, `creature-equipment.js` and `combat-text.js` implement the pixel forms and v11 additions. `expedition-rules.js`, `run-relics.js` and `deployment-physics.js` implement the v12 progression, curios, rewards and arena pickup system. `public/` contains the pixel environment, previews, exported Godot package and licensed, vendored fonts.
