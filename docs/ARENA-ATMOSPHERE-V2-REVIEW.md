# Arena, capture and atmosphere v2 review

Reviewed October 16, 2026. This follow-up preserves the supplied paintings and authored creature sprites while improving selection stability, arena framing, capture feedback, equipment, progression and reward motion.

## Final behavior

- Team and loadout selections patch the existing dialog. The dialog, decoded portraits and animated background keep their identities and full opacity. [Before](evidence/arena-atmosphere-v2/selection-before.json) / [after](evidence/arena-atmosphere-v2/selection-after.json).
- Clicking a wild creature or its scouting portrait plans its capture. The compact monitor shows actual current HP, HP percentage, threshold progress, engine capture chance and attempt state. It sits outside the playfield, collapses, and exposes retry/tool controls without covering creatures.
- Each companion has one Weapon, Armor, Ring, Boots and Accessory slot. Replacement returns the old item with its rolled quality and provenance intact. Equipment effects use full strength. Fangs serve beasts, spears serve warriors, bows remain archer equipment, and unusable equipment is shaded with a readable reason. All 25 supplied animal item illustrations are represented.
- Ordinary enemies carry one item; elites and bosses carry two compatible items from distinct categories. Captured equipment appears as **From capture** reward cards after victory or retreat. Collection saves once before animation, hides each source card when its flight starts, and cannot duplicate rewards after reloading.
- Damage text is smaller, with gold friendly damage and crimson enemy damage, including critical and status damage. Healing and shields retain their semantic colors.
- The new ring and flair atlases distinguish both teams and creature rarity. Rings remain stationary; the entire flair and its trail disappear on the rear half of the orbit. Battle opacity is exactly 20% of preparation opacity; elite flame intensity follows the same reduction. Capture success uses animated arena text, with more confetti, beams, streamers and rainbow color at higher rarities.
- The arena fits desktop and phone screens without page scrolling. Management remains available through its tool buttons. Camera containment and authored alpha hit masks make high-positioned creatures selectable and draggable.
- Stage selection restores the approved green waterfall/floating-cliff grasslands. Water glints travel downhill, cloud veils drift, birds cross the distance, and masked foliage sways. Other worlds retain their lava, ember, star, moonlight and mist treatments. Reduced motion keeps these scenes still.
- Chest opening blends adjacent authored frames with easing and a fixed ground plane. Rocks, foliage and mist anchor the chest to the summit. Every relic acquisition travels to the collection; the next stage-select screen highlights its arrival.
- Every encounter type locks the trail on the first click and enters on the second, with a gradual zoom. Continue remains an accessible entry control after selection.
- Elite Tier IV is the base and most common tier. III, II and I multiply the buff amount by 1.2, 1.44 and 1.728; deterministic frequencies are 65%, 23%, 9% and 3%. The tier is visible in scouting, combat and captured-creature records.
- Standard ordinary first-world encounters have no Rare+ creatures in the first three rooms, then at most one Rare and no Epic/Legendary. Elite/capture/boss encounters retain their dangerous pools. Chaos 4 restores early rare pressure; the cap rises to two at Chaos 10 and three at Chaos 16, with increasing rarity odds. These changes are named in the Chaos descriptions.
- Hovering, focusing or tapping Health/Attack shows the actual next-level value, delta, rarity growth and newly unlocked skills with the current build. Modern HP/attack growth per level is Common **10.5%**, Uncommon **11.5%**, Rare **13%**, Epic **15%**, Legendary **17.5%** of base stats. Armor growth follows the rarity ratio; level-one stats and the existing Common/Uncommon awakening are retained.

## Visual evidence

| View | Evidence |
| --- | --- |
| Arena and stationary rarity rings | [Desktop preparation](evidence/arena-atmosphere-v2/arena-preparation.png) |
| Next-level preview | [Attack tooltip](evidence/arena-atmosphere-v2/level-preview.png) |
| Distinct equipment categories and compatibility | [Desktop](evidence/arena-atmosphere-v2/equipment-desktop.png), [phone](evidence/arena-atmosphere-v2/equipment-mobile.png) |
| Compact capture planning | [Phone monitor](evidence/arena-atmosphere-v2/capture-mobile.png) |
| Capture gear after retreat | [Phone rewards](evidence/arena-atmosphere-v2/capture-rewards-mobile.png) |
| Smaller opposing damage colors | [Combat text](evidence/arena-atmosphere-v2/damage-colors.png) |
| Legendary capture | [Arena celebration](evidence/arena-atmosphere-v2/legendary-capture.png) |
| Summit chest and contained cards | [Rewards](evidence/arena-atmosphere-v2/mountaintop-rewards.png) |
| Restored landscape and relic arrival | [Stage selection](evidence/arena-atmosphere-v2/grasslands-relic-arrival.png) |
| Normal-clock motion | [Arena/reward/relic/stage video](evidence/arena-atmosphere-v2/atmosphere-normal-speed.webm), [equipment/capture video](evidence/arena-atmosphere-v2/equipment-capture-normal-speed.webm), [decoded frames](evidence/arena-atmosphere-v2/normal-speed-review.png) |

The aura sources were inspected at full resolution: [flair](../download%20%2816%29.png), [rings](../download%20%2817%29.png), [composite reference](../download%20%2818%29.png). The restored landscape comes from [the original green world painting](../public/ui/world-0.png). Lossless extracts and source hashes are recorded in [the uploaded-art manifest](../public/ui/uploaded/manifest.json). No generative repainting or destructive sharpening was applied to the supplied artwork.

## Creature review scope

No anatomy, palette, skinning, gait registration, limb socket or wielding-hand changes are introduced. Equipment affinity is family-based and independent of the locomotion proxy. The hit-mask fix now resolves the actual visual species for legacy converted families as well as native families.

The source/current review generated 28 family sheets, each containing all eight directions in all three available forms, and 23 motion sheets covering 1,472 idle/walk/run/sprint poses with **zero clipped poses**. Manually reviewed all eight facings and all three forms for [Aurel/knight](evidence/arena-atmosphere-v2/gaits-knight.png), [Brakk/orc](evidence/arena-atmosphere-v2/gaits-orc.png), [Syl/elf](evidence/arena-atmosphere-v2/gaits-elf.png) and [Nyra/caster](evidence/arena-atmosphere-v2/gaits-caster.png).

Motion review included base/final forms and sampled facings for [Frostursa](evidence/arena-atmosphere-v2/gaits-frostursa-motion.png), [Emberhound](evidence/arena-atmosphere-v2/gaits-emberhound-motion.png), [Pyrehorn](evidence/arena-atmosphere-v2/gaits-pyrehorn-motion.png), [Nightmaw](evidence/arena-atmosphere-v2/gaits-nightmaw-motion.png), [Aurel](evidence/arena-atmosphere-v2/gaits-aurel-motion.png), [Brakk](evidence/arena-atmosphere-v2/gaits-brakk-motion.png), [Syl](evidence/arena-atmosphere-v2/gaits-syl-motion.png) and [Nyra](evidence/arena-atmosphere-v2/gaits-nyra-motion.png). Reviewed [decoded normal-speed playback at native and enlarged size](evidence/arena-atmosphere-v2/gaits-normal-speed-decoded.png), with [decode times](evidence/arena-atmosphere-v2/gaits-video-decode.json), [coverage summary](evidence/arena-atmosphere-v2/gaits-summary.json) and the rebuilt [normal-speed gait video](../public/gaits-carry-preview.webm).

Source and offline live-combat checks exercise the same authored rendering path. No disconnected, clipped, recolored or hopping limb was observed in these reviewed samples. This is sampled visual review, not a quantified 95% screenshot-match claim. The original working tree and pre-existing `expedition.js` draft were left untouched.

## Validation and limitations

| Check | Result |
| --- | --- |
| Focused engine/reward/art/progression suite, Node 22 | [73/73 passed](evidence/arena-atmosphere-v2/focused-final.txt) |
| Complete Node 22 suite, two workers | [368/370 passed](evidence/arena-atmosphere-v2/verified-full-suite.txt); two inherited failures below |
| Aura pixels, alpha hit masks, viewport fit, chest/relic/stage flows | [Passed source/offline](evidence/arena-atmosphere-v2/atmosphere-browser.json); 2,136 family/form/facing hit cases and all seven encounter types |
| Selection identity, equipment, live capture odds and exactly-once loot | [Passed source/offline](evidence/arena-atmosphere-v2/equipment-capture-browser.json), desktop victory and phone retreat |
| Capture recruitment, reserve and old-save recovery | [10 source/offline scenarios passed](evidence/arena-atmosphere-v2/capture-recruitment-browser.json) |
| Reward destinations, touch/reduced motion, three animated worlds | [Passed source/offline](evidence/arena-atmosphere-v2/journey-browser.json) |
| Live authored legs and stride controls | [Passed source/offline](evidence/arena-atmosphere-v2/legs-browser.json), 12 creatures including evolved crab, drake and stag at 50/150/100% stride |
| Training Glade movement/carry/turn/combat and all directional inspection states | [Passed](evidence/arena-atmosphere-v2/prototype-browser.json), source/offline and phone |
| Offline builds | Both HTML files rebuilt; tested with external requests blocked. [Build sizes/hashes](evidence/arena-atmosphere-v2/builds.json) |

The two inherited failures are documented in the earlier [relic review](RELIC-V2-REVIEW.md): `grand-forms.test.js` expects the old 3.3 footprint radius while the inherited weighted model returns 6.6; `overhaul.test.js` expects the seeded baseline shield-counter encounter to lose while the inherited engine already wins. Their assertions were not relaxed. Existing equipment tests were updated for the requested full-strength effects, five categories, shared spears/rings and capture items moving into reward inventory. Full CI is not green while the two inherited assertions remain.

The main offline file is approximately 99.1 MiB and remains below GitHub's 100 MiB per-file limit, with little room for further embedded art. No deployment or production save migration was performed outside the normal client load path.
