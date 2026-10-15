# Alternating gaits and stable carries

Wolf, feral fox, cat, lion, bear, rhino, stag, rabbit, rodent and turtle anatomies alternate their diagonal footfall groups through walking, running and sprinting. This applies to every form and facing. Connected source paws are assigned separate visible foot regions instead of moving as one block. At least one diagonal group supports the body throughout the cycle. Body bounce and step travel remain limited by the original anatomy and the stride slider.

Humanoids animate their original painted boots, robes and armor. Production rendering does not replace them with generic leg geometry or draw skeleton lines through the costume. The underlying physical rig still drives movement and combat.

Held weapons use a fixed directional hand assignment while travelling. Painted hand sockets, with directional equipment grips as an occlusion fallback, keep swords, axes, bows and wands on a consistent side of the torso. Melee weapons retain their relaxed downward carry; bows and wands retain their physical orientation. Active swings, casts and bow draws still use their combat poses and contact directions.

## Review

- [Normal-speed playback, native size and 3× enlargement](public/gaits-carry-preview.webm)
- [Bear alternating gait phases](public/gaits-carry-frostursa-motion.png)
- [Knight original/current comparison](public/gaits-carry-knight.png)
- [Orc original/current comparison](public/gaits-carry-orc.png)
- [Caster original/current comparison](public/gaits-carry-caster.png)

`scripts/review-gaits-carry.mjs final` renders 46 source-comparison and motion sheets, checks 1,472 animated poses for clipping, records a 14-second normal-speed preview, and verifies decoded playback frames. Set `BASE_URL` for a server port other than 3000.

## Checks

`tests/gaits-carry.test.js` covers 2,880 quadruped poses, checking actual lower-body pixel changes, alternating support and complete silhouettes. Another 2,496 humanoid poses check weapon identity, grip-to-hand attachment and the actual grip side across movement cycles. A further 624 humanoid poses check original costume palettes and the absence of replacement leg meshes.

The existing strict evolution-silhouette assertion is retained. Connectivity, physical limb constraints, active weapon contacts, idle breathing, source/offline live battles and the Training Glade are checked separately. Both offline HTML builds include this renderer.
