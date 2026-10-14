# Creature anatomy and attacks

Multi-legged species now use shaded, closed 3D leg surfaces projected into the existing pixel artwork. Quadrupeds have thighs, knees, calves, hind hocks and rounded paws or hooves. Walkers and arthropods have plated or slender jointed legs, with eight legs for spiders/crabs and twelve for centipedes. Mantises have four walking legs and two raptorial forearms. This anatomy persists through evolution.

The model replaces the original painted leg/sole regions and registers to their hip and foot positions, so it never adds a second leg set underneath the sprite. It uses animated joints, directional lighting, depth ordering, authored material colors and planted-foot orientation. Covered hip surfaces remain filled behind moving limbs, with the face and belly covering the leg roots. The existing two-legged models remain in use for humanoids.

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
