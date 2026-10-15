# Repository workflow

For every requested change, create a fresh feature branch and open a new pull request. Always create a new PR; do not reuse an existing PR or another task's branch.

Preserve the pre-existing untracked expedition.js draft. Do not edit, stage or delete it.

# Creature art and animation

Before adding or changing a creature, read [CREATURE-ART-GUIDE.md](CREATURE-ART-GUIDE.md). These requirements apply to new families, evolution forms, variants, equipment and animation changes.

- Inspect the original sprites in all eight directions and every available form before choosing anatomy or attachment points. A reused physics rig does not establish the creature's visible anatomy.
- Preserve authored limb shapes, appropriate thickness, idle stance, costume texture and palette indices. Animate the painted legs with the authored skinning path. Do not expose procedural skeletons or enable `debugLegVolumes` in production.
- Keep limb sockets connected through the full motion cycle. Respect occluded far legs. Do not cut away a horizontal strip of source art, duplicate existing limbs, or graft generic cylinders under a sprite.
- Register true four-legged families in `QUADRUPEDS`. They must alternate diagonal footfall groups at every movement pace, with distinct visible paw regions and restrained body bounce. Keep stride travel proportional to the original limbs and compatible with the stride slider. Document any anatomy exception explicitly.
- Assign weapon identity and wielding hand independently of gait phase. Bind travelling grips to fixed directional source hands/equipment sockets; never choose a hand from an animated shoulder's screen position. Active swings, casts and bow draws must retain their physical contact direction and hand attachment.
- Fit complete crowns, horns, limbs and weapons inside the cell in all facings. Use the original material palette for repairs; do not hide clipping or bad connections by shrinking only the defective part.
- Run the relevant gait/carry, anatomy, palette, contact and cell-boundary checks. Rebuild both offline HTML files. Review original/current sheets and decoded normal-speed video at native size and enlarged size, then verify source and offline live combat. If an approach repeatedly fails, change the approach; do not lower assertions, mask the defect or claim visual quality from metadata alone.

Every creature-art PR must state which families/forms/facings were reviewed, link its visual evidence, and report test results and any unresolved limitation. A known disconnected, clipped, recolored or hopping limb is unfinished work.
