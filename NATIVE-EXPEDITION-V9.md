# Native Expedition v9 · Tactical build checkpoint

Open **Starfall-Menagerie.html** and select **New expedition** to use the six native starters. Look for **NATIVE EXPEDITION V9**. Existing collections and legacy runs remain compatible; schema-1 saves are backed up before upgrading. The Training Glade remains the separate eight-direction animation lab.

## Shipped in this checkpoint

- Nine native families, 69 total families and 146 named abilities, connected to the full three-planet expedition: cooldown skills, gem sockets, relics, EXP, captures, reserves, shops, evolution, casualties and Chaos.
- Native physical weapon-tip contact, alternating overhead/side swings, charged attacks that resist interruption while taking damage, held-weapon projectiles, cape motion, movement transitions, flat-paw dog gaits and physical death/knockdown/get-up motion.
- Advance, hold, flank and escort formation orders. Each native companion can also have two conditional rules; the first matching rule overrides the base policy. Conditions cover wounded allies/self, shields, wounded enemies and interruptible enemy windups. Intentions appear on cards and for the selected fighter.
- Solid broken pillars in selected encounters. Bodies steer around cover; physical shots and beams stop at it. Area spells can land over cover. Collision, steering and dodge choices use the same pillar geometry as the native arena.
- Native cooldown skills prepare for 0.38 seconds before resolving. Poise breaks cancel pending channels, including healing. Healers account for already queued healing. Charged enemy attacks remain uninterruptible. Brakk's Sundering Rush bypasses 35% of shields.
- **Build practice** with moving, shielded and clustered targets. Baseline removes gems/relics; the current-build comparison uses the actual loadout. Both use real combat and leave the parent expedition's gold, EXP, captures and other progress intact.
- The first victory offers one of **Thorn Crown**, **Glass Constellation** or **Storm Relay**. The choice is mutually exclusive and persists once through reloads. Family evolution bonuses and names are visible before purchase. Native recruitment events display and award the same released family.
- Battle reports identify interrupted channels, shots blocked by cover and the strongest enemy threat alongside existing damage, healing, status and shield analysis.

## Evidence and scope

**139 tests pass.** Browser verification covers a legal native starter campaign through all three planets, nine victories, shops, gem links, evolution, captures, reloads and a new run. Separate controls checks verify prioritized rules, practice isolation/comparisons, opening relic settlement and a 390px layout. Legacy arena checks and both legacy/native offline combat pass with zero extra requests. The Training Glade's ten browser scenarios still pass.

A first-planet sample uses one legal service-preferring policy across twelve seeds per mode, with earned gold, legal purchases/evolution and the Thorn Crown opening. It clears **Explorer 12/12**, **Expedition 12/12** and **Veteran 7/12**. This is a 36-run bot sample, not a human win rate or full difficulty/Chaos calibration. The stronger standard-mode result is a reason to test more builds and players before claiming a gameplay score.

The native roster uses the nine accepted bodies. Evolved looks change palette/equipment color and tactical behavior; bespoke evolved silhouettes, more body types and custom boss art remain planned. Bosses retain actual phase mechanics with representative native bodies. Defeat analysis is improved; a recorded defeat replay remains planned. No fifty-hour human playtest or 9/10 fun claim is made.

## Continue from here

1. Add short defeat replays that highlight the decisive hit/channel and explain counterplay.
2. Compare several legal builds and routing policies across difficulty and Chaos tiers; inspect whether standard expeditions need more tactical pressure.
3. Add family mastery and earned rare-hunt preparation/extraction options with exact-once persistence.
4. Add connected route objectives, alternative bosses and route-dependent boss conditions.
5. Produce further creature/evolution art batches only after gameplay review establishes their value.

Use `npm test` and `BASE_URL=<server> npm run test:native`; `npm run build:standalone` refreshes the offline HTML. `scripts/record-expedition.mjs` captures a normal-speed expedition preview. The continuation file records the handoff and saved evidence.
