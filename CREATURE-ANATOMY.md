# Creature anatomy and attacks

Multi-legged species retain their original directional limb textures and silhouettes, animated by the physical anatomy rig. Quadrupeds have thighs, knees, calves, hind hocks and paws or hooves in that rig. Walkers and arthropods have plated or slender jointed legs, with eight physical legs for spiders/crabs and twelve for centipedes. Mantises have four walking legs and two raptorial forearms. This anatomy persists through evolution; far limbs hidden by the artwork remain hidden.

The Legs V3 renderer skins the painted legs continuously from body sockets to soles, retaining source width, costume texture and exact palette indices. It does not cut off the lower sprite or add generic replacement limbs. Four-legged animals alternate diagonal groups at every movement pace. Humanoids also retain their painted boots and clothing, and use fixed directional carry hands for equipment. Procedural leg volumes are diagnostic only. See [Legs V3](LEGS-V3.md), [gaits and carries](GAITS-AND-CARRY.md), and the required [future-character guide](CREATURE-ART-GUIDE.md).

Natural attacks follow the same anticipation, contact and recovery clock as combat:

| Creature group | Attack |
| --- | --- |
| Canines and foxes | Open the jaw, pull back, lunge, snap shut and recover. |
| Cats, lions and bears | Raise a forepaw, rake or maul, then plant it again. |
| Mantises | Raise two separate scythes and cross them through the target. |
| Crabs | Extend articulated pincers and close the claws. |
| Rhinos, stags and beetles | Lower the head and drive a horn, antlers or carapace forward. |
| Spiders and centipedes | Brace the legs and strike with paired fangs or mandibles. |
| Serpents and dragons | Rear back and deliver a long, opening-jaw strike. |
| Rabbits, rodents and turtles | Forepaw kick, short nip or a slow beak snap. |
| Birds, harpies and bats | Peck/swoop, rake talons or bite; wings support the motion. |
| Squid, clams, gels, mushrooms and moths | Lash tentacles, snap a shell, pulse, release spores or sweep wings. |

Faces do not gain front-facing mouths in rear views. Fixed-length limb solvers drive the mantis scythes and raised paws. Natural attack tips also drive melee collision/trails and projectile origins, keeping impacts tied to the visible anatomy. A victim can be hit only once per strike.

`scripts/review-creature-anatomy.mjs` generates enlarged facing/action contact sheets and the animation reel. `tests/creature-anatomy.test.js` checks multi-legged families/evolutions, every natural attack category in eight facings, jaw timing, anatomy and physical contacts. The browser test exercises real live actors in source and offline builds.
