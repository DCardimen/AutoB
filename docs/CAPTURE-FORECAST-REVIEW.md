# Capture target forecasts

The compact target monitor now shows a colored rarity label, the engine's capture odds at the chosen auto-throw HP threshold, and an approximate all-focus knockout risk. Current live capture odds remain separate. The capture kit repeats the threshold, rarity and risk and explains the estimate.

The knockout percentage estimates the risk of a coordinated basic-attack volley killing the target before capture. It uses surviving allies' attack, Mercy/Swift restraint, rage/weakness, target armor (including Guardian scaling and active armor buffs), shield, fortification and exposure. It evaluates the selected threshold, or current HP if already lower. A smooth logistic curve models uncertain volley damage; it is a planning heuristic, not an empirically calibrated probability. Specials, crits, attack timing, travel, evasion and damage over time can change the actual outcome. No combat or capture rules change.

Opening forecasts use the cached scouting battle's actual combat stats, including enemy difficulty and progression modifiers. Forecast updates patch the existing monitor in place. The rarity remains visible when collapsed. Short phones hide the arena resource heading while a target is selected and allow a smaller battlefield minimum so the expanded monitor stays below the companion cards.

Validation:

- 9/9 focused unit tests: exact engine odds, opening HP, nonmutation, risk response to health/attack/armor/shields/restraint/dead allies, live statuses and terminal/retry regressions.
- Source and self-contained offline browser checks at 1440×900, 390×844 and 320×568: threshold changes through the capture kit, collapsed rarity, live forecast updates, no page scrolling, no tracker/card overlap, and no browser errors. Offline requests blocked after navigation.
- Both offline HTML builds completed; Training Glade output was unchanged. `git diff --check` passed.

Visual evidence: [desktop](evidence/capture-forecast/capture-1440.png), [phone](evidence/capture-forecast/capture-390.png), [small phone](evidence/capture-forecast/capture-320.png), [browser report](evidence/capture-forecast/browser-report.json).

This PR is stacked on the aura-size settings PR. No creature art, equipment, anatomy or animation changed. The original untracked expedition.js draft was not touched.
