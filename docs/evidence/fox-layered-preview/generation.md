# Painted fox part generation

Mode: built-in `image_gen`, with the approved three-tier fox archer art-direction board as the style/identity reference. These are new raster puppet assets; the game has not adopted them.

Selected output files are retained at:

- `public/fox-layered-preview/sources/rowan-master.png`
- `public/fox-layered-preview/sources/mature-master.png`
- `public/fox-layered-preview/sources/moontrail-master.png`

Their SHA-256 hashes and source crop bounds are recorded in `public/fox-layered-preview/kits.json`. Extracted runtime-preview atlases are the corresponding `*-parts.png` files. The kit builder isolates complete connected source objects, registers joint landmarks, and establishes one stable 48-color palette per tier. It does not rely on a perfectly spaced generated grid.

## Final generation specification

Create a true-transparent 4×4 grid of sixteen independent painted puppet parts for a compact orange/cream fox ranger, front-left three-quarter facing, matching the approved reference's crisp square-pixel style, green cloth, brown leather, dark outlines and upper-left light. Keep every part complete and isolated with generous transparent padding. No labels, skeletons, assembled character, or effects. Limb segments have painted overlapping joint caps and a downward bind orientation. Both boot toes face left. The torso is complete beneath the arm sockets and contains no head, arms, legs, cape, quiver or tails. The cape and tail are separate textured mesh sources.

| Tile | Painted part |
| --- | --- |
| 1 | Complete head, eyes open |
| 2 | Same head and pose, eyes closed |
| 3 | Complete torso from neck to pelvis |
| 4 | Anatomical right upper arm |
| 5 | Anatomical right forearm and gripping hand |
| 6 | Anatomical left upper arm |
| 7 | Anatomical left forearm and string hand |
| 8 | Anatomical right thigh |
| 9 | Anatomical right lower leg and boot |
| 10 | Anatomical left thigh |
| 11 | Anatomical left lower leg and boot |
| 12 | Complete hanging cape textile |
| 13 | One bushy tail, root left, cream tip right |
| 14 | Complete unstrung vertical wooden/recurve bow |
| 15 | Leather quiver with three arrows |
| 16 | Complete horizontal arrow, tip left |

Form prompts:

- **Rowan:** simple forest-green tunic/capelet, plain leather and wood shortbow, no crown or gold ornaments.
- **Mature:** richer green ranger tunic and longer mantle, restrained gold edging/buckles, richer wooden bow, same compact identity.
- **Moontrail/apex:** low complete gold circlet on both head states, ornate but readable green/gold costume and royal gold/wood bow. Generate one tail texture; the rig assembles five separately simulated painted tails, with no tails baked into the torso or cape.

The right-hand bow is a rig contract, not a guess from the source object's screen location. Both arms are registered anatomically; the right wrist owns the bow, and the left hand owns the drawn string. Bow tips are registered from the selected source and transformed with its grip. The released arrow uses the physical full-draw nock-to-rest direction.

## Targeted source corrections

- Rowan's initial left boot pointed right. Regenerated only that boot with its toe pointing left, preserving the other parts and costume.
- The initial apex bow resembled an S-shaped staff. Regenerated only the bow as a recurved archer's bow, with a central leftmost grip and aligned upper/lower tips to its right.
- Verified alpha data rather than assuming a thumbnail's colored background was opaque.

Blinking uses the painted closed-eye regions over the open head, retaining the original ears, muzzle, silhouette and registration. The retained source head states remain inspectable in the kit.
