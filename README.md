# Starfall Menagerie · Native Expedition v8

A single-player creature-collecting roguelike autobattler with physical arena combat. Explore three planets with six companions, modify individual abilities with support gems, capture permanent starters, and climb twenty Chaos tiers.

**Native Expedition v8 is playable in Starfall-Menagerie.html.** Start a New expedition to use the native pixel roster; existing collections and legacy runs remain compatible. Nine native families, 146 abilities and the native physical renderer are connected to skills, gems, relics, captures, evolution and all three planets. See [native expedition notes](NATIVE-EXPEDITION-V8.md) and [continuation checkpoints](CONTINUATION.md).

The next overhaul follows [ROADMAP.md](ROADMAP.md), with eleven playable milestones covering reference-inspired directional animation, a broader fantasy roster, the sixty proposed gameplay improvements, and player testing. [Iteration 1](MILESTONE-1.md) now has a playable nine-body movement prototype: open **Starfall-Training-Glade.html**, or use the Training Glade link in the game footer. Its visual direction awaits review; later roadmap items remain planned.

The prototype opens with an **8 directions** comparison. Choose a companion to see all eight views; click one to inspect it closely. Watch the [normal-speed preview](public/prototype-preview.mp4) for walking, running, sprinting, combat and a fall, or inspect the [current pixel glade](public/prototype-pixel-world.png).

**Native Pixel v7** uses original 64×64 sprites with shorter limbs and crisp nearest-neighbor enlargement. The five heroes have four-view and animation showcases. Ember remains a four-legged hound; a fox ranger, six-legged brass walker, eight-legged spider and moon jelly bring the prototype to nine body types. Running, cape flow, direction changes, fast braking, physical dodges, death ragdolls and heavy-hit knockdown/get-up motion are implemented. v7 cleans up faces in all views, sorts gear by depth, keeps fists on the handles, and adds a flat-paw canine walk/trot/gallop. Sparring rolls fresh teams of six, with alternating overhead/side swings and three anticipation levels; charged attacks take damage but resist stun, knockdown and knockback.

Open **Starfall-Training-Glade.html** in Chrome, Edge or Firefox and look for **NATIVE PIXEL V7**. Select companions from the dropdown beside the scene controls or the cards. Choose **Movement → Run/Sprint**, or inspect the new states in **Pose study**. The game works offline with Canvas 2D.

[Native v7 details](NATIVE-PIXEL-V7.md) cover controls, physics and validation. [godot-sprites/project.godot](godot-sprites/project.godot) opens a Godot 4 demo with nine PNG sheets and SpriteFrames resources: 9,792 exact 64×64 cells, eight facings and 136 animations per actor. Use `npm run export:prototype` to regenerate assets and `npm run check:godot` to validate import/startup. Rebuild the offline HTML with `npm run build:prototype` after source edits. The [movement plan](CHIBI-MOTION-PLAN.md) keeps 9/10 visual targets separate from automated checks.

## Play

Download this branch with **Code → Download ZIP**, extract it, and open **Starfall-Menagerie.html** in Chrome or Firefox. The HTML embeds all code, artwork, audio synthesis, and fonts. It needs no installation, server, or internet connection.

Keep the file at the same location to retain its browser-local save. Existing collections are preserved on the same browser origin. New runs use the new route generator; an existing run keeps its saved route.

## What changed in 0.4.0

- **Committed attacks.** Melee has a visible aimed arc, windup, contact, and recovery. Leaving the arc or reach avoids the swing. Beams telegraph a fixed line. Basic ranged attacks aim before releasing straight-flying projectiles; the first hostile body in their path takes the hit. Shots do not home in or vanish just because their original target dies.
- **Physical movement and weight.** Allied and enemy bodies collide, heavier creatures resist displacement, and arena walls contain them. Hits impart decaying momentum. Dash and charge skills travel through the arena instead of teleporting onto a tracked enemy. Strikers flank an occupied front, while Guardians can screen incoming shots.
- **Real dodge rolls.** AI reacts to incoming swings, projectile paths, and danger zones, scores escape directions, then physically moves. Rolls cost 30 stamina and have a cooldown. Attacks also cost stamina. Roots, stagger, committed actions, exhaustion, and nearby bodies can prevent a successful escape. Dodge stats improve reactions and roll cooldowns; they never randomly cancel a connected hit.
- **Poise and statuses.** Heavy impacts break poise and stagger a creature, cancelling a pending windup. Heavy melee also causes three seconds of bleed; movement makes bleed 60% stronger. Cleanses remove bleed and roots as well as burn and poison. Existing slow, expose, wither, shields, and elemental interactions remain. Gold bars show stamina; orange bars show poise. Reports include whiffs, staggers, and physical body blocks.
- **Permanent run casualties.** After a lost battle, one random active ally faces a rescue roll. Base death chance **when selected** is Common 65%, Uncommon 50%, Rare 35%, Epic 22%, Legendary 12%. A failed roll permanently removes that individual from this expedition. Its family stays unlocked for future runs, and its gems return to the pack. Results persist through reloads and cannot be rerolled after settlement.
- **Upgradeable protection.** Three field-hospital tiers cost 65 / 110 / 155 gold before Chaos pricing. Each tier reduces everyone's remaining casualty risk by 30%. Each creature can buy two survival drills for 30 / 60 gold, reducing its remaining risk by 25% each. Evolution reduces risk another 15%. The reductions multiply. A rest can grant a free hospital tier instead of life, EXP, or orbs. Run protection resets on a new expedition.
- **Real vacancies and reserves.** Losing a companion leaves an empty place. Deploy a captured or recruited reserve without losing its earned progression. You may fight with fewer than six. The save loader now preserves reduced teams, casualty records, protection upgrades, and retry state.

## Creature collection and builds

- **60 families / 120 painted forms / 128 named abilities.** Every family has a signature auto-attack, two or three cooldown skills, and a passive specialty. Common shield-breakers, interceptors, cleansers, and dodge counters can earn a place beside rarer creatures.
- **30 support gems.** Link a gem to one ability. Fork changes targeting; Cryostasis combines slow and burn into steam; Withering counters healing; Reservoir turns excess healing into shields; Soul Link intercepts damage; other supports create traps, healing fields, cooldown relays, and execution builds. Tradeoffs are stated in the item description. Incompatible skills are disabled, and equipment chooses a valid initial link.
- **Rarity-scaled sockets.** Common 1, Uncommon 2, Rare 3, Epic 4, Legendary 5. Evolution and ascension add one socket each. Different supports can share a skill; duplicate supports on one creature are prohibited. Relink and unsocket freely between battles.
- **Behavior-changing evolution.** At level 5, spend 50 gold to choose Wild or Warden. Guardians become retaliators or interceptors; Strikers become executioners or dodge counters; Rangers become artillery or trappers; Supports become curse-weavers or protectors. Level 8 ascension costs 100 gold and strengthens the chosen path. Identity, EXP, and skill links remain intact.
- **24 expedition relics.** Build around excess-healing shields, dodge-driven cooldown relays, poison networks, elemental diversity, execution resets, or one emergency revival. Several strong effects carry an explicit drawback.
- **Scouting and deployment.** Place companions on a three-by-three grid. Choose Adaptive, Hunt Healers, Break Armor, Protect, or Finish Wounded per creature. AI saves healing and barriers for useful conditions, aims areas at clusters, kites, and avoids marked danger. Taunts still matter.
- **Eight enemy compositions, six weather conditions, sixteen events.** Routes vary node placement and scouting across seeds. Contracts exchange immediate resources for an explicitly stronger next battle. Every event can be declined.
- **Three distinct bosses with three phases each.** The Hollow Crown feeds on its retinue, the Sun Eater consumes burn for shields, and the Last Colossus gathers creatures into gravity wells. Their counterplans are visible before combat.
- **Tactical captures.** Choose a wild target before combat. Mercy throws at 35% HP, grants an additional capture bonus, and reduces team damage by 14% until the throw. Swift throws at 55% HP with a 6% damage penalty. Low health and statuses improve odds. One orb is committed at battle start; if conditions are never reached, the attempt fails. Resolved captures persist even after a retreat. After victory, an unprepared attempt can instead target any wild opponent. Planet guardians cannot be captured; their wild families can.
- **More Legendary access.** Every shop offers a Legendary contract and a celestial beacon. Beacons guarantee a Legendary at the next sanctuary. Later sanctuaries can also contain natural Legendary spawns. Migration events trade resources for Legendary recruits. Each expedition victory grants three starlight, enough to adopt one permanent Legendary family from the menagerie.
- **Permanent bonds.** Successful captures raise a family's bond, capped at five. Each bond gives its starters 2% additional base health. Bond 5 reduces starter cost by one, or by two for Legendary families. Two mastered Legendary starters plus four Common starters fit the twelve-point budget. Runs still begin at level 1 in base forms, without expedition relics.
- **Difficulty and Chaos.** Choose Explorer, Expedition, or Veteran. Winning unlocks Chaos 1; clearing Chaos N unlocks N+1, through 20. Rules accumulate: elite improvements, economic constraints, earlier boss phases, enhanced enemy healers, additional shields, and stronger final retinues. The new-expedition screen lists every active rule. Previously won profiles automatically unlock Chaos 1.
- **Animation v2.** Movement accelerates and turns smoothly. Shape-specific gaits, breathing, wing motion, attack anticipation, delayed melee contact, follow-through, interpolated dashes and trails, recoil, and timed death collapses animate the painted sprites. Pause freezes creature poses and camera shake. Gentle motion is available and respects the browser's reduced-motion preference.
- **Combat feedback.** Enemy danger zones use distinct rings and countdowns. Status markers, skill cooldowns, shield bars, elemental impact sounds, and a local procedural score communicate combat. Reports explain poison, burn, area damage, healing threats, interception, and shield absorption. The last report survives reload.

Surviving allies recover fully between encounters. EXP, training, gems, and expedition relics last for the run; captures, bonds, adopted families, and Chaos unlocks persist.

## Controls

- Inspect a creature to choose AI, training, evolution, and skill links, or swap a bench companion.
- **Field care** opens rarity odds and hospital upgrades; inspect a companion for personal survival drills.
- **Reserves** fills vacancies after a casualty.
- **Deployment & AI** opens the grid. Select a companion, then a cell; occupied cells swap.
- **Tactical capture** selects a target and approach before entering combat.
- **Space** pauses; **1 / 2 / 3** change battle speed.
- The **Star chart** opens neighboring routes. Scout composition, weather, and counters before committing.
- **Menagerie → Celestial adoption** spends victory-earned starlight.
- **New expedition** selects starters, difficulty, and an unlocked Chaos tier.
- The sound button enables optional effects and music. **Motion: gentle** reduces deformation and shake.

## Saves

The game uses `localStorage` on the current origin. Clearing browser storage or changing origin removes access to that device's save. Cloud accounts and cross-device sync are not implemented.

Refreshing during battle returns to preparation. A defeat reservation and its settled casualty result remain. The committed capture orb and any resolved capture result remain: replaying does not charge again or reroll the result. Rewards, purchases, bonds, Chaos unlocks, and the last battle report persist. Each victory grants its starlight once.

## Development and validation

Requires Node.js 20+; Playwright is a development dependency only.

```sh
npm ci --cache /tmp/autob-npm-cache
npm run dev
```

The server listens on port 3000. Use `PORT=3001 npm run dev` if another service occupies it. Check that the arena renders and that `/game.js`, `/tactics.js`, `/sound.js`, and the local artwork load.

```sh
npm test
npm run test:browser
npm run test:balance
npm run playtest
npm run test:standalone
```

Browser tests use `/usr/bin/chromium`; override with `CHROMIUM_PATH`. For another port, use `BASE_URL=http://127.0.0.1:3001 npm run test:browser` and the same variable for the standalone check. `SIM_HOURS=1 npm run playtest` runs a shorter stress sample; the default is fifty **simulated** combat-hours.

`npm run build:standalone` rebuilds the downloadable HTML after source changes. Browser artifacts and raw simulation reports are written to ignored `playtest-artifacts/`. See [PLAYTEST.md](PLAYTEST.md) for recorded results and limitations, and [DESIGN.md](DESIGN.md) for the twenty review targets. Automated tests establish functionality and controlled outcomes; they do not establish a human 9/10 fun rating.

## Source

`arena.js` contains swept collision, attack geometry, body mass, and boundary rules; `game.js` contains progression and combat; `tactics.js` contains specialties, challenge tiers, encounters, new items, and events; `skills.js` and `roster.js` define abilities and families. `app.js` handles UI and persistence. `animation.js`, `art.js`, and `sound.js` handle presentation. `scripts/build-standalone.mjs` embeds the complete game. `public/` contains original generated artwork and licensed, vendored fonts.
