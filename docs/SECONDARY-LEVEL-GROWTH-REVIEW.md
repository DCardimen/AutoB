# Secondary level-up growth

Modern companions now receive modest secondary gains on each level, using the same rarity ratio as their existing HP/attack growth. Level-one rates are unchanged. These are additive gains against base rates, rather than exponential compounding.

| Stat | Common gain per level |
| --- | --- |
| Basic attack speed | +1.25% of base |
| Action speed | +1% of base |
| Stamina recharge | +1.5% of base |
| Skill cooldown haste | +1%; cooldown divided by `1 + accumulated haste` |
| Additional dash cooldown haste | +1%; the same reciprocal formula |
| Movement | +0.5% of base |
| Dodge chance | +0.05 percentage points, capped at +6 points from levels |
| HP regeneration | +0.04 HP/sec |

Multiply these gains by the rarity's HP/attack growth divided by 10.5%. For example, Legendary companions gain about 2.08% base attack speed and 2.5% base stamina recharge per level. Reciprocal cooldown scaling stays positive even at extreme levels. Legacy balance versions keep their previous secondary rates.

Health, Attack, Basic Attack Speed, Action Speed, HP Regen, Stamina Recharge, Dodge Chance, Dodge/Dash, Movement and Skill Cooldown all expose the actual next-level build on hover, keyboard focus or tap. Lower cooldowns display a signed reduction and “faster recharge.” Tooltips on the right and lower edges stay inside the dialog and do not intercept other stat controls.

- [Desktop stamina preview](evidence/secondary-level-growth/source-recharge-preview.png)
- [Phone cooldown preview](evidence/secondary-level-growth/source-mobile-cooldown.png)
- [Source/offline browser report](evidence/secondary-level-growth/browser.json): ten previews, desktop/phone layout, signed cooldown improvements and live combat rates; zero errors, with external requests blocked offline.
- [Focused unit results](evidence/secondary-level-growth/focused-tests.txt): growth across every family, rarity ordering, exact next-level builds, no mutation, unchanged level-one/legacy rates, bounded dodge, positive high-level cooldowns and live regeneration.
- [Complete unit results](evidence/secondary-level-growth/full-tests.txt): **374/376 passed**. The same two inherited failures remain: the old 3.3 footprint expectation versus 6.6 in `grand-forms`, and the seeded shield-counter baseline expectation in `overhaul`. They are documented in the [earlier arena review](ARENA-ATMOSPHERE-V2-REVIEW.md); no assertions were relaxed.

The change applies through the shared stat model used by scouting, companions and combat. It changes no creature artwork, rigs, source frames, limb attachments or weapon geometry. Both offline HTML files were rebuilt. The pre-existing `expedition.js` draft remains untouched.

This follow-up branches from PR #34 so it retains the new team-selection card controls. Its PR targets that branch while #34 awaits merging.
