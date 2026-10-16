# Post-match EXP celebration

EXP travels from the chest to each companion, then fills the bar from the actual pre-battle snapshot through every earned level. Each crossing gets a short pause, gold title, particles, portrait badge and sound. The original and final levels/EXP remain visible together. Counters settle on the actual saved reward; replay changes only the presentation. Reduced motion immediately presents the final values.

The reward animation survives an upgrade selection during the fill, and collecting spoils waits for the sequence. Skill choices stay queued until the player continues the journey. Levels 3, 5 and 7 unlock the three additional cooldown slots, for four cooldowns plus the basic attack.

- [Desktop before/after](before-after-1440.png), [mobile before/after](before-after-390.png)
- [Desktop level-up](level-up-1440.png), [mobile level-up](level-up-390.png)
- [Normal-speed recording](experience-normal-speed.webm), [decoded recording frame](video-frame.png)
- [Four source/offline desktop/mobile checks](browser.json): multiple level crossings, exact EXP, cosmetic replay, reduced motion, reopen behavior and horizontal layout containment.
- [Real battle-to-skill journey](journey.json): actual combat victory, level-3 reward, upgrade while EXP animates, spoils collection, three skill choices, saved selection and no duplicate EXP, in source and offline builds.

Four focused unit tests verify segment boundaries, monotonic earned EXP, zero/exact-boundary rewards and immutable before/after snapshots. Both offline HTML builds were rebuilt. No authored creature sprites, anatomy, equipment sockets or animation rigs changed.

Final regression: **439/441 tests passed** (Node 22, two workers, 4 GiB heap; 404 seconds). The two inherited failures remain the grand-form radius expectation (3.3 expected, 6.6 actual) and the seeded shield-counter outcome expectation. The authored ability catalog assertion now separately verifies the original 562 abilities and all 468 learned quality variants. All 26 browser cases across EXP, Aura Stones, authored stone art, equipment landing, roster vacancies and manual skills passed. Full local log: `playtest-artifacts/xp-final-suite.txt`.
