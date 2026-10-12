# Starfall Menagerie overhaul roadmap

Status: Native Pixel v7 is accepted as sufficient for the current gameplay pass. Native Expedition v9 integrates the nine finished families with the full expedition. A legal UI campaign clears all three planets. Representative portions of iterations 2–6 are implemented: nine families with evolution bonuses, formation/cover, conditional AI/intentions, committed skills, build practice and opening doctrines. Defeat replay, broader balance, mastery/hunts, route objectives and boss variants remain planned. See NATIVE-EXPEDITION-V9.md and CONTINUATION.md.

## Starting point

The working baseline is v0.4.0: six-creature teams, 60 families, 128 named abilities, 30 support gems, 24 expedition relics, three planets, evolution, permanent family unlocks, physical combat, casualty protection, and twenty Chaos tiers. The additional fantasy roster in `expedition.js` is a draft and is not connected to the released game.

The earlier whole-game provisional review averaged **7.6/10**. Across 480 automated campaigns, Expedition wins differed substantially by build: Tide 13/24, balanced 8/24, assassins 4/24, Venom 1/24. Veteran produced 5/96 victories versus Chaos 10's 10/96. Those results identify investigation targets; they are scripted-policy outcomes rather than human win rates.

The uploaded **Dimraeth Early Access trailer** remains the movement reference. The user's updated art direction is **32-bit-era pixel fantasy chibi**: broad expressive heads, compact bodies, sturdy limbs, clear equipment and strong silhouettes under the raised three-quarter camera. Preserve grounded motion and readable physical impacts. The five-pass [chibi movement plan](CHIBI-MOTION-PLAN.md) targets at least 9/10 in each of the seven movement categories before full-roster production.

## Rules for every iteration

- Keep the six-versus-six autobattler: player agency comes from preparation, builds, orders, routes, and captures.
- Preserve signature auto-attacks, two or three cooldown skills, rarity-scaled sockets, and permanent collection progress.
- Produce a playable milestone with a short change report, relevant checks, known limitations, and repeatable evidence.
- Maintain a working offline HTML build and migrate saves explicitly when data changes. Back up saves before migrations.
- Validate new systems on a small representative roster before expanding them. Add complexity only when players can understand its effect.
- Revisit scope and balance after each milestone. Release the validated portion; keep unfinished work clearly marked.
- Report automated simulation separately from human playtime. A completed feature checklist does not establish a 9/10 fun score.

## Milestone sequence

| Iteration | Playable milestone | Exit evidence |
|---|---|---|
| 1 | Representative visual and movement prototype with nine anatomies | Normal-speed movement and combat clips compared with the reference |
| 2 | Roster production pipeline and distinctive evolutions | Reviewed batches with different silhouettes, mechanics, and movement |
| 3 | Formation, terrain, and physical attack refinement | Matched encounters demonstrate placement and contact consequences |
| 4 | Conditional AI, readable intent, and defeat explanations | Decisions can be understood in live combat and replay |
| 5 | Skills, transformative gems, and build-defining relics | Several recognizable builds work in an accessible practice arena |
| 6 | Economy, consequential rewards, and recovery choices | Purchases compete; losses offer costly but useful recovery |
| 7 | Captures, mastery, and permanent progression | Rare hunts feel earned; future starts retain strategic constraints |
| 8 | Branching routes, world objectives, and connected events | Different seeds create genuinely different expedition plans |
| 9 | Alternative bosses and route-dependent encounters | Multiple bosses reward different, learnable counterplans |
| 10 | Balanced difficulty, Chaos, and repeatable challenges | Legal campaign cohorts support several strategies across tiers |
| 11 | Integrated release and sustained player testing | Browser/offline checks plus actual player sessions support the review |

Each milestone may need multiple internal passes: implementation, test, feedback, revision. No calendar dates are promised before the first art milestone establishes production cost.

## Iteration 1 — Establish the visual and movement target

Build an isolated arena scene containing a knight, orc brawler, elf archer, caster, and quadruped. Prototype original art at gameplay scale before committing to the full roster.

- [x] **Q13.1** Replace stretched cutouts with articulated source parts and directional animation frames; refine key poses manually where needed.
- [x] **Q12.1** Match recoil and displacement to body mass, weapon weight, and attack type.
- [x] **Q12.2** Synchronize preparation, contact, audio, particles, and follow-through with the actual collision event.

Include idle, walk, run, turn, attack, cast, dodge, hit, stagger, and death states. Keep world movement smooth while choosing a consistent sprite animation cadence. Match foot travel to ground movement, use foot-anchored shadows, and avoid sudden pose changes or sliding.

**Exit gate:** show the five characters moving and fighting at 1× speed, including misses, dodges, interrupted attacks, and deaths. Inspect transitions at normal speed and frame by frame. Have the user review the visual direction before multiplying the asset workload; this is an art milestone review, not a technical permission requirement.

**Implementation:** open `prototype.html` through the development server, or open the self-contained `Starfall-Training-Glade.html`. The Training Glade link is in the expedition footer. The opening **8 directions** scene compares eight views of connected skinned models of any selected companion; click a view for close inspection. Sparring, movement circuits, and pose study expose the five original characters, twelve animation states, slow playback, frame stepping, and a close view. See [MILESTONE-1.md](MILESTONE-1.md) for validation and the remaining visual review.

The Motion v2 revision replaces distorted limbs with an anatomical rig and separate feet, plants supporting feet in world coordinates, blends locomotion, and attaches rigid weapons to their grips. Physical tip sweeps determine melee contact and impact pauses. The small roster remains the basis for iteration 2 production, pending visual review.

Natural Motion v3 adds sustained stamina-paid sprinting, heel/toe transfer, opposing arm motion, acceleration and braking limits, a distinct wolf gallop with rear hocks, and connected painted joint overlaps. Directional joint coverage and live gait tests validate the five-body prototype before roster production.

Connected Rigs v4 replaces the cropped-image anatomy with five welded skinned models, fixed body scale, continuous facing, authored gait curves, stopping recovery steps and torso-driven strikes. Neck coverage and model topology checks address gaps missed by the earlier limb-only pixel checks. The new visual finish and movement still require review against the reference; the 9/10 target is not established by technical checks.

## Iteration 2 — Expand identities, body types, and evolution

Initial expansion target: 36 new fantasy families beyond the existing 60, delivered in reviewed batches of roughly six to twelve. Adjust batch size to measured asset quality and effort. Cover humans, elves, orcs, dwarves, goblins, undead, trolls, minotaurs, constructs, and other distinct bodies. Bring existing animals into the same visual language over successive batches.

- [ ] **Q03.3** Give lower-rarity specialists exclusive useful tools rather than making rarity a universal replacement rule.
- [ ] **Q04.1** Give each family a defining mechanic that changes its tactical role.
- [ ] **Q04.3** Establish family-specific habitats and recruitment conditions, visible in the collection.
- [ ] **Q13.2** Build separate locomotion sets for humanoids, heavy bodies, quadrupeds, insects, serpents, and flyers.
- [ ] **Q13.3** Differentiate families and evolved forms through silhouette, equipment, anatomy, and scale.
- [ ] **Q14.1** Replace generic evolution branches with family-specific tactical transformations.
- [ ] **Q14.2** Add combat accomplishment routes to evolution, with progress shown before commitment.
- [ ] **Q14.3** Change appearance, movement, signature attack, and team function together when evolving.

**Exit gate:** every released family has complete required animations, valid skills, a discoverable habitat, and functional evolution. Check recognition at arena scale and on mobile. Retain only draft status for unfinished families.

## Iteration 3 — Refine physical combat and formation

- [ ] **Q05.3** Make powerful skills visibly committed, with interruption windows and meaningful recovery.
- [ ] **Q09.1** Preview opening movement, attack reach, and protection coverage on deployment.
- [x] **Q09.2** Add hold, advance, flank, and escort orders with explicit strengths and vulnerabilities.
- [x] **Q09.3** Add arena obstacles and chokepoints that affect navigation, screening, and projectile paths.
- [ ] **Q12.3** Give major knockouts distinctive finish animations without overwhelming ordinary attacks.

**Exit gate:** controlled encounters demonstrate why placement changes an outcome. Bodies, terrain, shots, dashes, and attack geometry must agree with their presentation. Check navigation around obstacles and ensure every encounter can resolve.

## Iteration 4 — Make AI and combat explanations trustworthy

- [ ] **Q04.2** Introduce behavioral personalities with useful tradeoffs, such as holding ground or seeking isolated targets.
- [ ] **Q10.1** Improve threat prediction before creatures spend dodge stamina; account for projectile travel and safe escape paths.
- [x] **Q10.2** Allow two conditional orders per creature, with precedence and fallback behavior explained.
- [ ] **Q10.3** Coordinate squad healing, control timing, and focus fire to reduce waste.
- [ ] **Q11.1** Establish a visual hierarchy: lethal telegraphs and interrupts stand out; routine numbers remain quiet.
- [x] **Q11.2** Show current intentions for targeting, healing, retreating, and major attacks.
- [ ] **Q11.3** Add a short defeat replay that highlights decisive events and counterplay opportunities.

**Exit gate:** AI follows its configured rules in representative scenarios, including conflicting orders and low stamina. A reviewer can explain the decisive cause of a defeat from the presentation and replay. Verify pause, speed changes, and replay do not alter settled outcomes.

## Iteration 5 — Build expressive skills and customization

- [ ] **Q05.1** Audit mechanical duplicates; replace weaker duplicates with distinct positioning or timing requirements.
- [ ] **Q05.2** Add deliberate status and positioning combos, including roots into heavy hits and shield breaks into executions.
- [ ] **Q06.1** Add transformative supports such as orbiting attacks, healing tethers, and returning dashes.
- [ ] **Q06.2** Define incompatibilities, stacking limits, and meaningful costs for powerful support combinations.
- [x] **Q06.3** Add an accessible practice arena with moving, shielded, and clustered targets and before/after comparisons.
- [ ] **Q07.1** Add build-defining relics with restrictions that materially change team construction.
- [ ] **Q07.2** Add relic interactions with weather, formation, and boss conditions.

**Exit gate:** at least five distinct build concepts produce understandable combat patterns. The practice arena exposes actual effects, not only tooltip arithmetic. Reject inert links and test high-risk interactions such as repeated casts, reflections, tethers, and summons.

## Iteration 6 — Make resources and setbacks interesting

- [x] **Q01.1** Offer a build-defining reward after the first battle.
- [ ] **Q01.3** Add costly recovery opportunities after setbacks, including rescue encounters and replacement recruitment.
- [ ] **Q02.1** Preview capture penalties, casualty exposure, and purchase-versus-evolution consequences before commitment.
- [x] **Q02.2** Add mutually exclusive reward upgrades with different tactical purposes.
- [ ] **Q02.3** Identify endangered allies before combat and offer protection at a substantial resource cost.
- [ ] **Q07.3** Allow sacrificing ordinary relics for a specialized replacement to pivot a struggling build.
- [ ] **Q08.1** Tune earnings and prices so gear, evolution, recruitment, and protection remain credible alternatives.
- [ ] **Q08.2** Add unwanted-gem salvage with a clear immediate-value versus future-use tradeoff.
- [ ] **Q08.3** Allow one reserved shop purchase with a deposit and explicit reservation rules.

Retain one randomly selected ally facing a rarity-dependent casualty roll on defeat, with upgradeable mitigation. Improve the explanation of selection, risk, and recovery; do not silently replace this requested mechanic.

**Exit gate:** validate that recovery has a cost and cannot be farmed through deliberate losses. Confirm reservations, exchanges, protection, and salvage cannot duplicate resources through reloads. Inspect whether any purchase is routinely mandatory.

## Iteration 7 — Make collecting and progression worth pursuing

- [ ] **Q15.1** Add distinctive rare-capture preparation conditions, such as breaking armor or interrupting a ritual.
- [ ] **Q15.2** Add a costly extraction or follow-up opportunity after a failed rare capture, with bounded retries.
- [ ] **Q15.3** Offer pre-expedition field, status, and Legendary capture kits with different costs and strengths.
- [ ] **Q16.1** Expand permanent progression through starting-skill choices, evolution access, and recruitment options alongside restrained stat gains.
- [ ] **Q16.2** Add family mastery challenges based on using its specialty successfully.
- [ ] **Q16.3** Add rotating Legendary expeditions with visible requirements and purposeful recruitment routes.

**Exit gate:** demonstrate a rare hunt from discovery through preparation and permanent unlock. New and progressed collections must both support interesting starter-budget choices. Verify capture commitments, mastery rewards, casualty records, and unlocks survive reloads exactly once.

## Iteration 8 — Make the journey change between runs

- [ ] **Q01.2** Give each planet an expedition objective, such as a migration hunt or escalating environmental threat.
- [ ] **Q17.1** Replace shuffled fixed lanes with branching routes that vary length, encounter density, and services.
- [ ] **Q17.2** Add connected event stories whose earlier choices affect later encounters and rewards.
- [ ] **Q17.3** Add optional detours for rare recruits, specialist shops, or weakening a guardian, with explicit opportunity costs.

**Exit gate:** several seeded maps demonstrate materially different plans. Validate reachability, branch merging, hidden discoveries, story-state persistence, and boss access. Tune EXP and gold for variable route length so longer paths do not automatically dominate.

## Iteration 9 — Expand bosses and discoveries

- [ ] **Q18.1** Add an alternative boss for each planet with a different preparation requirement.
- [ ] **Q18.2** Add counterable signatures, including interruptible channels, vulnerable recoveries, and positioning-dependent defenses.
- [ ] **Q18.3** Let route decisions alter boss support, mechanics, or rewards.
- [ ] **Q20.2** Add rare event chains, hidden recruitment conditions, and discoveries linked to the expanded encounters.

**Exit gate:** every boss has an observable counterplan, and defeating it does not depend on one specific family or relic. Show how an earlier route choice affects its encounter. Test phase transitions and interrupt/recovery behavior under both slow and rapid damage.

## Iteration 10 — Calibrate challenge and replay goals

- [ ] **Q03.1** Rebalance healing, shielding, attrition, burst, and assassination with matched legal campaigns.
- [ ] **Q03.2** Support poison attrition, stagger chains, protected artillery, mobile assassination, and summons as credible win conditions.
- [ ] **Q19.1** Recalibrate Explorer, Expedition, Veteran, and cumulative Chaos so the intended challenge progression is consistent.
- [ ] **Q19.2** Increase difficulty through tactics and encounter composition as well as restrained stat scaling.
- [ ] **Q19.3** Validate every Chaos tier with several competent build policies and investigate disproportionate archetype failures.
- [ ] **Q20.1** Add expedition variants with meaningful rule changes and explain their rewards and restrictions.
- [ ] **Q20.3** Add seeded challenge runs and personal records for different accomplishments.

**Exit gate:** evaluate starter budgets, earned-resource campaigns, multiple routing policies, and multiple seeds. Compare mechanics with controlled fixtures as well as aggregate win rates. Establish mode-specific targets from player results; do not tune everything to one bot or assume that a higher tier must win fewer games on every small sample. Avoid making one build universally best.

## Iteration 11 — Integrate, playtest, and reassess

Deliver an integrated offline build with migration notes, a changelog, updated rules/help, and recorded test evidence.

- Run relevant rules and browser checks, plus actual offline sessions with no external asset requests.
- Verify complete campaigns, losses, reserves, shops, events, capture retries, evolution, mastery, boss variants, and Chaos unlocks through the user interface.
- Check mobile layout, effect density, animation stability, load time, memory, and download size on representative devices.
- Run a new fifty-hour automated stress sample for interaction stability and termination; separately run balanced legal campaign cohorts.
- Accumulate **fifty hours of actual player sessions**, covering newcomers, experienced strategy players, different builds, and several difficulty levels. Record actual hours rather than inferring them from simulation time.
- Re-rate the same twenty qualities using evidence and player feedback. Repeat the weakest iterations before claiming release-quality enjoyment.

**Exit gate:** no unresolved save-loss, duplicated reward, softlock, or combat-state defects. Review enjoyment, readability, choice quality, and willingness to start another run from human sessions. A 9/10 gameplay rating is a target to validate, not a promised result.

## Coverage of the twenty review qualities

Each quality has three concrete changes above, identified as Q01.1 through Q20.3.

| Quality | Primary iterations |
|---|---|
| 1. Core loop | 6, 8 |
| 2. Meaningful decisions | 6 |
| 3. Team composition | 2, 10 |
| 4. Creature identity | 2, 4 |
| 5. Skills | 3, 5 |
| 6. Support gems | 5 |
| 7. Expedition relics | 5, 6 |
| 8. Economy | 6 |
| 9. Formation | 3 |
| 10. Combat AI | 4 |
| 11. Readability | 4 |
| 12. Combat impact | 1, 3 |
| 13. Creature presentation | 1, 2 |
| 14. Evolution | 2 |
| 15. Capturing | 7 |
| 16. Permanent progression | 7 |
| 17. Routes and events | 8 |
| 18. Bosses | 9 |
| 19. Difficulty | 10 |
| 20. Replayability | 9, 10 |

## Rework triggers

- If the five-character prototype misses the reference's movement or visual quality, repeat iteration 1 before expanding art.
- If a new system cannot be understood from the interface, return to iteration 4 before adding more content.
- If a build dominates matched campaigns, investigate its counterplay, economy, and AI before adding larger enemy stat bonuses.
- If longer routes make pacing or resource balance worse, revisit iterations 6 and 8 together.
- If player sessions reveal repetition or frustrating capture/casualty outcomes, revise the responsible systems before expanding the roster again.
