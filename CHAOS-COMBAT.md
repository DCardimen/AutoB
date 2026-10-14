# Chaos, relics and combat update

Start a new expedition to receive one random, seeded expedition relic. Existing saves retain their collections and items.

- Starter points begin at **3**, then gain **1 per cleared Chaos tier**, up to 23. Clearing Chaos 3 unlocks a third starting companion; entering Chaos 3 also makes the third deployment place immediately available.
- **30 new relics** join the expedition pool. Five jackpots: Chrono Throne, Phoenix Covenant, Cataclysm Heart, Endless Banquet and Sovereign’s Seat. Five tiny comforts: Polite Pebble, Slightly Warm Sock, Dented Button, Emergency Napkin and Patient Moss. The other twenty support speed, dodge recovery, ailment combinations, echoes, overhealing and team resources.
- **Sovereign’s Seat** offers any Legendary in exchange for one active place for the remainder of the expedition. Open its highlighted panel in the arena. Overflow companions and the chosen Legendary wait in Reserves; the choice and capacity reduction survive reload. Maximum eventual capacity becomes five.
- **50 new equipment types** bring the equipment catalogue to 156. Shops and reward caches draw from the expanded pool, and enemies can wear new items. Effects, quality and slot names are visible in the equipment UI and under companion cards.
- Character Overview shows basic attacks per second, action-speed multiplier, stamina recovery per second and dodge/dash recovery. Unmodified stamina recovery is **26/s Striker, 22/s Ranger, 20/s Support, 15/s Guardian**. Recovery is reduced to 45% during committed actions and dodges. Gold stamina bars sit beneath health in combat and companion cards.
- **Weakest first** in the pregame team controls chooses the enemy with the fewest current hit points. Individual policies also offer it. Click an enemy or its focus button during battle for an **8-second priority**. Nearby taunts, distant threats and defensive behavior continue to matter.
- Modern opening encounters can roll every wild family and rarity. Weighted draws keep powerful creatures less common, mix free rolls with encounter roles and prefer different creatures within a group. Early creatures retain unseasoned stat scaling.
- Captures **fight for you immediately and join your expedition at round end**. The battle copy restores at least 45% HP, clears hostile commitments and inherits your team's relic modifiers. Recruitment fills an unlocked empty team place first, otherwise goes to Reserves; gear, quality, individual stats, evolution and bound curios are retained. Captures are saved once, including on retreat. Full reserves do not discard a capture. The family and bond also unlock for future starters. Capturing the last enemy finishes the lattice before victory settles.
- Defeat still removes a companion and its worn equipment. **Expedition relics remain**, and bound curios and personal relics return to your pack. Settlement is saved once.
- Weapon trails follow the actual blade anchors. Impact bursts, brief hit pauses, wand charge motes, spell trails and a constellation/lattice capture sequence add combat feedback. Strikers roll, Rangers sidestep, Supports and Void creatures blink, and Guardians barrel through with a small barrier and contact damage.
- Clicking a reachable combat stage zooms into it and transitions to arena preparation. Collected loot flies toward the gold, equipment and relic totals before its saved settlement. Gentle motion removes zooms, loot flights, capture flourishes and hit pauses.

The existing item-strength rule remains: modern runs apply half of catalogue magnitudes. UI descriptions use the same scaling as combat.

## Live character UI

Live combat has a fixed roster strip at the bottom of the screen. Every ally has a portrait, health and stamina values, skill cooldowns and status text. Knocked-out companions remain visible; captured allies join the strip for their round. Tap a portrait to inspect its character, or switch to Opponents to inspect and focus enemies. The strip scrolls horizontally on phones and keeps its scroll position and keyboard focus as values update.

Pregame enemy inspection/capture controls and allied target policies occupy separate rows above and below the battlefield. Their controls cannot cover a sprite, including during deployment dragging or with large evolved forms. Target-preview lines remain on the arena.

`node tests/live-roster.browser.mjs` verifies source and offline builds with six evolved allies and six enemies at 320/390/768/1440px, maximum size tuning, actual control/canvas separation, live values, inspection, knockouts, captured allies and phone scrolling. Its default preview URL is `http://127.0.0.1:3000`; set `BASE_URL` for another preview port.

## Play and verify

Run `npm ci` and `npm start`, then open `http://localhost:3000`. Rebuild the portable game with `npm run build:standalone`, or open the updated `Starfall-Menagerie.html`.

`node --test tests/chaos-combat.test.js` covers points, capacity, content counts, actual resource recovery, all dodge styles, Legendary settlement, relic retention, seeded encounter diversity, targeting, borrowed allies and loot idempotency.

With the local server running, `node tests/chaos-combat.browser.mjs` exercises desktop and 390px phone UI, stat and equipment visibility, focus controls, capture allegiance, saved Legendary selection, stage transitions, animated loot settlement and the offline build. Set `CHROMIUM_PATH` for systems without Chrome at the script's Windows default. Screenshots and the JSON report are written under `playtest-artifacts/`.
