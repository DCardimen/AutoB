# Arena UI and elite hunting

The arena painting remains unchanged. The interface uses the supplied blue/gold frame, panel, emblem and icon atlases from `example of arena UI.png` and its companion images. Team and opponent cards now share the arena's bordered surface. Preparation orders and predicted targets sit above ally portraits; inspection, capture odds and mutation details sit above opponent portraits. During combat both rosters remain visible with health, stamina, cooldowns, conditions and focus controls. On narrow screens each roster scrolls independently. No controls float through the creature sprites. Spawn/deployment positions and body margins keep creatures inside the courtyard.

Idle motion uses a stable phase and cadence for each creature identity. Opponents and teammates no longer share a synchronized bob.

Every elite encounter assigns exactly one permanent mutation to one opponent. The encounter seed fixes both mutation and recipient; reloading cannot reroll it. Stage labels, stage scouting, the encounter banner and character inspection show the mutation before combat. A moving red flame surrounds its bearer, including after capture.

There are 50 mutations: ten effect families with five different strengths and recipient rules. Ties use a seeded choice. Health, attack and speed recipient rules use the species' base stats; level uses the encounter level. The columns below also determine the name suffix: Wanderer, Underdog, Survivor, Champion and Runner.

| Family / effect | Random opponent | Lowest level | Lowest base HP | Highest base attack | Fastest |
| --- | ---: | ---: | ---: | ---: | ---: |
| Quickfire / action speed | +10% | +13% | +16% | +12% | +18% |
| Bloodtempo / basic attack speed | +15% | +20% | +25% | +18% | +22% |
| Warbrand / attack | +18% | +22% | +26% | +14% | +20% |
| Giantheart / max health | +25% | +30% | +35% | +20% | +28% |
| Redwind / movement speed | +22% | +26% | +30% | +24% | +18% |
| Ironhide / armor | +14 | +18 | +22 | +12 | +16 |
| Everburn / stamina recharge | +30% | +35% | +40% | +25% | +32% |
| Ghoststep / dash cooldown | −25% | −30% | −35% | −22% | −28% |
| Emberblood / HP per second | +2 | +2.5 | +3 | +1.5 | +2.2 |
| Spellflame / skill cooldown | −18% | −22% | −25% | −15% | −20% |

Capture preserves the mutation on the temporary combat ally and on the recruited companion for the rest of the run. The individual is also saved in **Menagerie → Your Elite Captures**, with its own source identity, mutation, nature and genes. Same-species captures remain separate records. Choose an individual there, or use the **Captured individual** selector under its species in the starter menu. Normal starter costs still apply. New expeditions begin at level 1 with fresh equipment; the individual's mutation, nature and genes persist. Capture/reload ledgers prevent duplicate records.

Validation covers all 50 effects, recipient rules, seeded stage/battle consistency, capture conversion/recruitment, save idempotence, individual starter inheritance, independent idle cadence and courtyard bounds. Browser coverage exercises source/offline stage scouting, flame/idle animation, inspection, capture, menagerie selection, future runs and responsive paired rosters.
