# Arena Feel V16 · application 0.12.0

Open `Starfall-Menagerie.html`, or extract `public/Starfall-V16-Arena-Feel.zip`. Settings is the gear button in the upper right. Existing collection, run, equipment, and route saves are preserved.

## Enrage

At 30 **combat seconds**, both teams deal 3× damage and gain 1.5× action speed. Basic attacks, skill recharge, dodge recharge, committed windups, repeated skills, boss ability recharge, and attack/cast poses use accelerated action time. Walking, projectile flight, status durations, knockdown, and the encounter clock retain their normal timing. Playback speed and pause affect the encounter clock normally.

Healing is multiplied by 3 before the effectiveness tier below. Direct healing, lifesteal, regeneration, healing fields and Grove healing use this rule. Shields and resurrection are separate mechanics. Damage transferred to interceptors or derived from a reflected hit is not amplified again. Blood-price HP costs remain costs and are excluded from damage-dealt totals.

| Combat time | Healing effectiveness | Multiplier versus normal healing |
| --- | --- | --- |
| 30–34.99s | 100% | 3× |
| 35–39.99s | 80% | 2.4× |
| 40–44.99s | 60% | 1.8× |
| 45–49.99s | 40% | 1.2× |
| 50–54.99s | 20% | 0.6× |
| 55s onward | 0% | 0× |

The arena displays the countdown, active multipliers, healing effectiveness and next drop. Current saves migrate to rules 15; archived rules 11/12 simulation fixtures keep their historical timing.

## Captures

Scout Prism + Mercy + the default **25% HP** threshold gives Common 90%, Uncommon 85%, Rare 25%, Epic 22%, Legendary 8%. Above 35% HP, easy-tier odds fall steeply. **Full HP always gives 0%, even with status, relic and tool bonuses.** Lower HP improves the chance, with genuine risk of a lethal hit or damage over time landing before the throw. Advanced tools, capture rooms and statuses can improve the baseline; upgraded low-HP Legendary odds cap at 30%.

The initial throw must be planned before combat. After it fails, select a tool in the strip below the arena and click a living opponent, or its overhead capture diamond, to retry immediately. Each retry consumes that selected tool. There are two retries: **three attempts total per encounter**, ending on success. Dead targets, bosses, full-health targets, full reserves and unavailable tools reject retries without spending another tool. Attempt count, outcome history and stock persist across reload. Captures remain unavailable after combat. Reloading preserves settled capture results and restarts the encounter, as in V15.

## Settings

Thirteen persistent sliders: sprite size, small-type size, large-type size, movement speed, acceleration, braking, turning response, hit knockback, gait pace, cape flow, damage number size, effect intensity and camera shake. The size sliders have a live animated small/regular/large preview. They resize bodies, weapon grips, melee reach, hitboxes, cloth anchors and bounds together. Natural type factors remain 70–150%; user tuning multiplies those factors. The 100% base retains the previous 30%-of-original size.

Combat pauses while Settings is open and restores its previous pause state on close. Changes apply equally to both teams. Size and movement controls change combat; presentation controls change appearance. Reset restores every slider to 100%.

## Equipment and loot

Equipment remains a single-creature system, separate from support gems and expedition relics. Slots are visible below each companion; the equipment pack sits below the team. Drag pack gear onto a companion, move worn gear between companions, or drop it back into the pack. When a recipient is full, dropping on an occupied slot swaps items; dropping on the creature selects a matching equipment category where possible. Item quality and source metadata travel with the item. Existing captured gear retains its effective strength when migrated to individual item rolls.

Equipment drops come from defeated opponents' worn sets. Captured or still-living combatants do not duplicate their worn gear into victory loot. If a fixture/opponent has no worn set, its role supplies an appropriate equipment pool.

| Opponent rarity | Ordinary equipment drop chance |
| --- | --- |
| Common | 8% |
| Uncommon | 14% |
| Rare | 28% |
| Epic | 45% |
| Legendary | 70% |

Elite encounters add 15 percentage points, bosses add 25, capped at 95%. Higher opponent rarity shifts rolls toward higher equipment rarity. Common/Uncommon/Rare/Epic/Legendary equipment has 70/85/100/112/125% item quality; the existing half-strength player item balancing still applies. Quality affects numerical stats and scalable passive effects. Drop cards show rarity, effect, source creature, level and quality; opponent inspection shows its drop chance. Claiming is saved and cannot be repeated. Ground loot has rising beams, crisp category icons, rings and sparkles; reward loot uses staged illustrated cards.

## Post-match recap

Every result shows per-creature damage, kills, healing and mitigation. Interactive bar-chart tabs compare damage, healing, mitigation and damage taken, for either team. The chronological timeline identifies source, victim, ally/wild affiliation, skill and time, including the enrage transition. Mitigation counts armor, defensive relic reduction and absorbed shields, credited to their recipient; dodges are separate. Reports and collected loot persist across reload.

## Validation

140 related Node tests passed. Seven V16 browser groups and nine V15 regression browser groups passed, with no page errors. Checks cover enrage tiers/timers/poses, symmetric damage/healing, capture rarity and health, three-attempt stock/reload limits, actual opponent clicks, equipment transfer and quality preservation, seeded rarity-dependent loot, graph/timeline data, live settings, 320/390px screens, and the exact rebuilt standalone HTML. The standalone requests only its initial HTML and no external artwork, fonts or modules. See `tests/reports/arena-feel-v16.json`.

These are automated functional and simulated combat checks, not a fifty-hour human playtest or a measured 9/10 fun rating. The previous V15 full-campaign Chaos-1 policy failure remains historical evidence; campaign difficulty has not been re-certified by this update.

Run a server with `npm start`, then `BASE_URL=http://127.0.0.1:3000 npm run test:arena-feel`. Rebuild the standalone with `npm run build:standalone` after code edits.
