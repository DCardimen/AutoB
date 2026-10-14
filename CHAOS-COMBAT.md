# Chaos, relics and combat update

Start a new expedition to receive one random, seeded expedition relic. Existing saves retain their collections and items.

- Starter points begin at **3**, then gain **1 per cleared Chaos tier**, up to 23. Clearing Chaos 3 unlocks a third starting companion; entering Chaos 3 also makes the third deployment place immediately available.
- **30 new relics** join the expedition pool. Five jackpots: Chrono Throne, Phoenix Covenant, Cataclysm Heart, Endless Banquet and Sovereign’s Seat. Five tiny comforts: Polite Pebble, Slightly Warm Sock, Dented Button, Emergency Napkin and Patient Moss. The other twenty support speed, dodge recovery, ailment combinations, echoes, overhealing and team resources.
- **Sovereign’s Seat** offers any Legendary in exchange for one active place for the remainder of the expedition. Open its highlighted panel in the arena. Overflow companions and the chosen Legendary wait in Reserves; the choice and capacity reduction survive reload. Maximum eventual capacity becomes five.
- **50 new equipment types** bring the equipment catalogue to 156. Shops and reward caches draw from the expanded pool, and enemies can wear new items. Effects, quality and slot names are visible in the equipment UI and under companion cards.
- Character Overview shows basic attacks per second, action-speed multiplier, stamina recovery per second and dodge/dash recovery. Unmodified stamina recovery is **26/s Striker, 22/s Ranger, 20/s Support, 15/s Guardian**. Recovery is reduced to 45% during committed actions and dodges. Gold stamina bars sit beneath health in combat and companion cards.
- **Weakest first** in the pregame team controls chooses the enemy with the fewest current hit points. Individual policies also offer it. Click an enemy or its focus button during battle for an **8-second priority**. Nearby taunts, distant threats and defensive behavior continue to matter.
- Modern opening encounters can roll every wild family and rarity. Weighted draws keep powerful creatures less common, mix free rolls with encounter roles and prefer different creatures within a group. Early creatures retain unseasoned stat scaling.
- Captures **change allegiance for the current battle only**, restore the creature to at least 45% HP and clear hostile commitments. Borrowed allies inherit your team's relic modifiers, keep their equipment and disappear after the round. The family and bond still unlock for future starters. Capturing the last enemy finishes the lattice before victory settles.
- Defeat still removes a companion and its worn equipment. **Expedition relics remain**, and bound curios and personal relics return to your pack. Settlement is saved once.
- Weapon trails follow the actual blade anchors. Impact bursts, brief hit pauses, wand charge motes, spell trails and a constellation/lattice capture sequence add combat feedback. Strikers roll, Rangers sidestep, Supports and Void creatures blink, and Guardians barrel through with a small barrier and contact damage.
- Clicking a reachable combat stage zooms into it and transitions to arena preparation. Collected loot flies toward the gold, equipment and relic totals before its saved settlement. Gentle motion removes zooms, loot flights, capture flourishes and hit pauses.

The existing item-strength rule remains: modern runs apply half of catalogue magnitudes. UI descriptions use the same scaling as combat.

## Play and verify

Run `npm ci` and `npm start`, then open `http://localhost:3000`. Rebuild the portable game with `npm run build:standalone`, or open the updated `Starfall-Menagerie.html`.

`node --test tests/chaos-combat.test.js` covers points, capacity, content counts, actual resource recovery, all dodge styles, Legendary settlement, relic retention, seeded encounter diversity, targeting, borrowed allies and loot idempotency.

With the local server running, `node tests/chaos-combat.browser.mjs` exercises desktop and 390px phone UI, stat and equipment visibility, focus controls, capture allegiance, saved Legendary selection, stage transitions, animated loot settlement and the offline build. Set `CHROMIUM_PATH` for systems without Chrome at the script's Windows default. Screenshots and the JSON report are written under `playtest-artifacts/`.
