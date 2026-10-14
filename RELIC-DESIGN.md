# Relics that give a build a direction

The existing 30-relic expansion keeps its five jackpot relics and five modest defensive relics. This pass adds eight original interaction relics. The aim is to reward decisions about team composition, attack cadence, healing and dodging, rather than adding more unconditional damage multipliers.

## Research and interpretation

These are design inferences from developer descriptions, not copies of individual items or claims about their exact balance.

| Reference | What the developer emphasizes | Adaptation for this game |
| --- | --- | --- |
| [Slay the Spire — Mega Crit](https://store.steampowered.com/app/646570/Slay_the_Spire/) | Relics create powerful interactions; acquiring them can have costs beyond gold. | Visible resource banks, health costs and a healing tradeoff make a relic change how a companion plays. |
| [Risk of Rain 2 — Hopoo Games](https://store.steampowered.com/app/632360/Risk_of_Rain_2/) | Item combinations create surprising effects while enemies and players grow stronger. | Connected hits, ailments and cooldown skills form bounded chains. Secondary bursts do not trigger themselves. |
| [Hades — Supergiant Games](https://store.steampowered.com/app/1145360/Hades/) | Different divine boons enhance abilities and support many builds. | Mixed allied elements create a team casting interaction; rescue timing rewards a particular support role. |

## Eight original additions

Numbers below are the actual modern-run values after the game's existing item-strength normalization.

| Relic | Mechanic | Build opportunity / limit |
| --- | --- | --- |
| Clockwork Orchard | Four basic hits bank a seed and restore 2 stamina. Up to three seeds make the next cooldown skill echo at 20% power per seed. | Basic attack speed feeds skill echoes; echoes cannot grow more seeds. |
| Pilgrim's Debt | Each cooldown cast costs 2.5% max HP, stopping at 1 HP. Every third cast erupts for 80% attack nearby. | Faster actions need healing or regeneration to sustain their cost. |
| Borrowed Tomorrow | Dodges bank up to three moments. Basic hits spend one to advance every skill by 0.8 seconds. | Dash recovery becomes an offensive resource, but requires connected attacks to cash out. |
| Weather Vane Covenant | Different allies of different elements casting within four seconds arc 25% attack to two enemies and ward the weakest ally for two seconds. | Mixed teams and staggered casts matter; a shared two-second team cooldown bounds the chain. |
| Last Lantern | The final living ally gains 40% hit damage and 6 stamina per second. | A comeback effect with no benefit while teammates are alive. |
| Hollow Reed Reliquary | Lose 25% healing. Excess healing gives 15% shields and banks 50% of the excess, up to 150% attack, for the next basic hit's burst. | Regeneration and healing can support offense, but the healing penalty is real and storage is capped. |
| Triune Crucible | A hit on three different ailments consumes 0.5 seconds of each, erupts for 60% attack and advances skills 0.2 seconds. | Rewards diverse ailment sources instead of one repeated status; four-second reaction cooldown. |
| Second Dawn Thread | Healing an ally across 25% HP grants three seconds of ailment immunity and refunds 1.5 seconds of the healer's dodge recovery. | Rescue timing matters; each ally can trigger it once per battle. |

Seeds, moments, debt and stored healing appear on the live character strip. Casts and reactions also announce their relic in the arena. Descriptions use the same scaling as combat.

## Starter supplies and gradual pressure

New runs receive exactly one random expedition relic and three distinct, seeded Common pieces of equipment in the visible pack beneath the creatures. Starter equipment draws from eight modest items: flat attack, flat action speed, flat movement, HP regeneration, armor, stamina recharge, flat HP and a small attack/action hybrid. Reloading does not reroll them. Only untouched modern saves with the exact old misplaced trio migrate; earned or equipped relics remain intact.

Enrage has a 30-second grace period. It then continuously adds 4 percentage points of base damage and 1 percentage point of action speed each combat second, while subtracting 1 percentage point of healing. Damage caps at 3x and actions at 1.5x at 80 seconds; healing reaches zero at 130 seconds. The topper displays all three modifiers from their baseline. Pausing freezes the ramp, and playback speed changes how quickly combat seconds pass. Exact integration keeps cooldowns and attack animations synchronized across frame sizes. Reflections and HP costs are not amplified twice.

At 31 seconds: **1.04x damage / -1% healing / 1.01x actions**. At 40 seconds: **1.40x / -10% / 1.10x**. At 80 seconds: **3.00x / -50% / 1.50x**.
