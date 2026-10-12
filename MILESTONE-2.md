# Milestone 2 · Native roster production batch · v10

Open **Starfall-Menagerie.html**. The header reads **NATIVE EXPEDITION V10** for a native run. **Roster & forms** is available in the arena toolbar and menagerie, so this batch can be inspected without first capturing every family. **New expedition** switches an older legacy run to the native roster while retaining the permanent collection.

## This release

Twelve new families bring the released roster to **21 native families, 81 total families and 182 distinct named abilities**. The new families are Brom the dwarf, Grit the goblin, Morrow the skeletal archer, Grum the troll, Tarka the minotaur, Nix the serpent, Zephyr the harpy, Luma the faerie, Vesper the bat, Sable the human duelist, Eira the frost elf and Solara the phoenix.

The batch uses connected anatomy and equipment profiles, distinctive faces in eight directions, grounded strides, separate serpent undulation and flying wingbeats, and all seventeen movement/action states. Art and physical melee contacts share transformed weapon geometry. Small one-handed knives use the right hand; heavy two-handed weapons retain both grips. Family mass and body radius distinguish a light goblin from a heavy troll. Evolved equipment, crowns, wings, armor, animal spines and mechanical barrels change silhouettes alongside palettes.

Every native family has a visible habitat and recruitment guidance in its inspector. Most new families appear in wild encounters in their habitat; Epic and Legendary additions appear in elite/capture/boss encounters. Native outposts recruit from the current planet's native pool. A prepared beacon on Ardent Crater can bring Solara to a capture encounter. Acquisition still consumes the existing gold/orb resources and preserves permanent family unlocks.

## Different lineages and power

Lineage length varies by family: **one, two or three forms along a chosen branch**. Solara is a strong Legendary phoenix that arrives in its final form and cannot evolve. Grit and several other families have one transformation; Brom and others can evolve and ascend. Wild/Warden are alternative branches, so the export contains more visual variants than the number of forms along one chosen lineage. Existing saved ascended companions keep their form even if the family's new production rule has a shorter lineage.

Some recruits have deliberately lower raw power. Grit has 185 base HP and 21 attack; Morrow has 205 HP and 23 attack. Their inexpensive or specialized tools do not make them equal to stronger bodies. The inspector labels their raw-power band honestly. Rarity affects base power, skills and sockets without forcing every family into the same evolution length.

Native transformations keep the familiar level-5/level-8 routes and gold costs. A family combat accomplishment can unlock its first transformation at level 3, or ascension at level 6. Progress counts actual dealt/endured damage, absorbed shield damage, healing, physical rolls, knockouts or resolved cooldown skills, depending on the family. Results settle once; replaying a saved result cannot grant progress again. A genuine retry after losing a life can grant fresh progress. Practice battles leave expedition accomplishments untouched.

Family transformations alter signature behavior and, for selected branches, their auto attack: more targets, longer roots, shields, cleanse, poison, burn, evasion or shield bypass. They also alter movement/reach/poise and inherit the existing role transformation. Skill IDs remain stable, keeping support gems linked through evolution. The inspector shows available forms, progress, costs and the actual transformed skill.

## Requested controls and Chaos reward

**Character height** is a saved 85–110% slider in the native arena and roster viewer. It changes rendered anatomical height, keeps ground positions stable and adjusts projectile/bar presentation. It leaves health, damage, skill reach and starter costs unchanged. Godot exports use the authored 100% height.

Winning **Chaos 1 permanently raises the six-companion starter budget from 12 to 13 points**. It is derived from the saved cleared-tier record, so later wins or reloads cannot stack another point. Existing saves with a Chaos clear receive the budget automatically. The picker displays and enforces the actual budget. Starting-team size remains six.

## Evidence and remaining production

The checkpoint passes **147 unit tests**. Browser checks include complete Expedition and Chaos 1 campaigns through all three planets, the earned thirteen-point reward, form limits, early evolution, retained gem links and branch discoveries, schema-2 save backup, height persistence, 390px controls, legacy combat and native/legacy offline builds. The Training Glade's ten scenarios remain passing.

The production pipeline exports **85 base/branch/stage variants**, each with **136 directional animations and 1,088 64×64 cells**: **92,480 cells** total with no clipped pixels. Godot 4.6.3 imports and loads all 85 SpriteFrames resources. `npm run export:native` regenerates the assets from the actual game art; the downloadable Godot package contains a runnable pose/direction showcase. Normal-speed expedition and roster videos are under `public/`.

This is a complete twelve-family production batch, not completion of the full 36-family expansion target. Twenty-one new native families are released beyond the older 60; fifteen remain in the expansion target. Existing legacy animals will be converted in later batches. More body recognition review, varied encounter balance and human playtesting remain necessary; technical checks establish no numerical fun rating.
