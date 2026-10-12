# Native Expedition v11 · Grand forms and pixel-only collection

Open **Starfall-Menagerie.html** after pulling `codex/starfall-menagerie`. The header must say **NATIVE EXPEDITION V11**. The Training Glade is the separate nine-body movement lab; inspect the full roster in the main game with **Roster & forms**.

Ordinary bodies now use **50% of the v10 arena scale**. Creature size multiplies that baseline by **70%–400%**, giving a 35%–200% range relative to v10. Evolution increases the family size within that cap. Collision radius, held-weapon reach, projectile origins, foot planting and safe arena margins use the same factor. The saved 85%–110% character-height preference remains a separate vertical presentation adjustment. Portraits and the atelier use equal-size 64-pixel cells so enlargement cannot hide weak evolution changes.

Eight additional families bring the authored roster to **29**, and the full pixel collection to **89**: Mireclaw, Onyx Scarab, Sunlion, Frostursa, Crownstag, Stormdrake, Iron Scolopendra and Nyxwing. Crabs and centipedes use eight- and twelve-legged rigs. Bears, lions, stags, drakes, scarabs and moths have their own faces and palettes. Iron Scolopendra arrives in its final form. Sixty retained families use pixel rigs and elemental palettes; they share anatomy templates and have stable markings. They are not sixty newly hand-authored anatomies.

The six original painted creature atlases have been deleted. The renderer, portraits, saved collection families and rebuilt offline HTML use the pixel pipeline. Existing run and collection IDs stay valid; old collection campaigns keep their encounter pool. Saves migrate to schema 4 with a one-time schema-1/2/3 backup. Previously ascended companions retain valid cooldown definitions even where a family's current lineage has fewer stages.

## Evolution and equipment

Transformations change body construction and equipment: a walker becomes a bipedal rune titan, a jelly becomes a winged creature and then a serpentine leviathan, a skeletal archer becomes a lich, a dwarf can ascend into a forge walker, a bear becomes a bipedal king, and a hound gains multiple heads. Ascendant costumes add different pinions, plating and orbiting runes. Elemental colors remain recognizable across forms. Wild and Warden branches retain their tactical differences.

Every actual evolution adds **one cooldown skill, one creature equipment slot, and one support-gem socket**. Existing skill IDs and gem links remain intact. Two or three base cooldowns can therefore grow to four or five on a fully ascended companion. The 562 named definitions comprise 89 auto-attacks, 117 base cooldown skills, 328 normal branch/stage unlocks, and 28 compatibility definitions for older saves. Evolution skills use role templates with family-specific overrides; 562 names do not mean 562 unrelated mechanics.

Inspect an evolved companion to claim one free gear cache per stage. Choose Sunsteel Edge, Reliquary Plate or Mooncloth Mantle, then equip it from the pack. Outposts also sell equipment. Gear changes actual attack, health, cooldown, speed, healing, poise or starting shields. Unsocketing returns it to the run inventory. Capacity, duplicate restrictions, purchases and cache settlement are checked and saved. Creature equipment and support gems have separate slots.

## Cloth and combat feedback

Capes use a 5 × 7 constrained particle mesh: fixed shoulder anchors, gravity, floor contact, motion-driven wind and delayed response to turning and braking. The cloth follows the sampled body pose, including a collapsed ragdoll. Gold edging and shaded folds replace the visible mesh grid. Mooncloth changes the color and length of the mantle.

Pixel damage text follows the creature actually hit. HP damage, gold critical hits, blue shield absorption, violet status damage and green healing use different colors. Numbers rise with a short pop; nearby status/healing ticks merge instead of flooding the screen. Fully absorbed hits show shield damage rather than an invented HP number. Cosmetic text does not consume combat randomness.

## Acceptance evidence

| Requirement | Check and observed result |
| --- | --- |
| Size and physical consistency | 50% baseline and both 70%/400% limits tested; body, blade, muzzle and footprint scaling verified; giants fit safe arena margins. |
| Major evolution changes | Normalized silhouettes compared at equal cell size; sampled evolution transitions exceed 18% mean mask change. Multi-stage examples also change rigs or equipment construction. Eight-facing contact sheets inspected. |
| Meaningful unlocks | UI evolves and ascends actual companions; extra skills cast, gear changes stats, old gem links survive, and reloads cannot duplicate gear caches or purchases. |
| Cloth motion | Shoulder-anchor and turn-lag tests pass; mesh settles above the floor. Normal-speed preview shows movement and directional poses. |
| Readable hit feedback | Actual HP loss, shield absorption, criticals, status aggregation and healing are tested on victim IDs; live mixed-size combat screenshots inspected. |
| Expanded coherent roster | All 89 families have pixel portraits and motions. 170,136 sampled cells across their current forms, both branches, 17 poses and eight directions fit 64 × 64 bounds. |
| Retired art and playable delivery | Six painted atlases absent. Fresh and migrated collection runs operate in the exact offline HTML with zero external asset requests. Standard and Chaos 1 browser campaigns clear all three planets. |

157 unit tests pass. The 29-family Godot export contains 117 form variants, 136 animations each, and 127,296 checked cells. Browser checks cover gear, saves, support links, captures, outposts, Chaos starter budget, practice, and 390-pixel controls. Machine-readable evidence is in `tests/reports/grand-forms-v11.json`.

These checks establish the requested behavior and reviewable art changes. They are not 50 hours of human playtesting and do not establish a player fun score of 9/10. That subjective target remains a player-review goal; an automated test count cannot certify it.
