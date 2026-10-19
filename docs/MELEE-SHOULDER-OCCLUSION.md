# Directional melee shoulders and hidden torso fill

Melee companions with large shoulders or pauldrons (Aurel, Brakk, Brom, Grum, Grit, Tarka and Sable) showed blank or striped torso chunks, loose outline dots and disconnected arms when swinging in the quarter and profile facings. South views were mostly unaffected. Earlier fixes painted more filler under the arms; that made the filler more visible rather than less. This change removes the causes.

## Causes

| # | Cause | Why only non-south facings |
| --- | --- | --- |
| 1 | The reconstructed torso backing was painted with the body, after the far arm, so it erased the far arm wherever the two overlap. | In the south view both arms lie outside the torso. In quarter and profile views the far arm overlaps the chest; up to 100% of its pixels were covered (Sable W: 63/63, Grum W: 152/273). |
| 2 | Saved backing extended over back-cape pixels that the source shows, replacing original artwork at rest. | Back capes are visible beside the torso only in side-facing views (1,524 source pixels). |
| 3 | Arm IK used the average of the horizontal and vertical art scales as bone length. The body uses the two scales separately, so a straight resting arm was bent by up to 2.5 px, uncovering the torso even at idle. | Worst for near-vertical arms on anisotropically scaled evolved forms (Grum, Brom). |
| 4 | 597 arm outline and cuff pixels were saved as tiny islands of torso, cape or leg layers with nothing painted beneath them. Their only painted neighbour is the arm, so they floated in the air when it moved. | Large shoulders have long arm outlines crossing the torso in quarter views. |
| 5 | The arm skin rotated the whole painted deltoid rigidly about the inner cuff, throwing shoulder mass off the body into a wedge. | The shoulder mass faces the camera in quarter views. |

## Rules

1. **Paint order:** hidden backing, then the far arm and far equipment, then the visible body layers, then the near arm. `paintMeleeLayers` records hidden-fill pixels in `brush.data.backingMask` and `paintCharacterPixels` composites them first.
2. **Never cover visible source art with reconstruction.** Backing at a position the source shows as back cape is dropped (`meleeLayerParts`).
3. **Rest is exact.** Arm bone lengths are measured in the same anisotropic screen scale as the body (`authoredArmLength`). Resting hands and elbows sit within 0.05 px of their painted bind positions in every family, form and facing.
4. **Ownership follows connectivity.** An island of at most six pixels that is not its layer's main component, has no other surface painted beneath it, borders exactly one arm and contains no shoulder socket belongs to that arm. Straps lying on the torso stay where they are. `scripts/migrate-melee-arm-fragments.mjs` applies this to the masters and re-derives Sable's concealed rear arms, which are exact translated copies of the front arm. `--check` fails if any island remains. It is idempotent.
5. **Shoulders blend into the torso.** Arm pixels behind the shoulder pivot follow the torso; the weight ramps to the upper-arm bone over 55% of the upper arm (`skinProjection`). In the bind pose both mappings coincide.

## Results

The "visible backing" measure renders every pose with and without the reconstructed backing and counts differing pixels. It covers 7 families × 3 forms × 8 facings.

| Measure | Before | After |
| --- | --- | --- |
| Visible backing at rest, worst frame | 57 px | 14 px |
| Visible backing in a swing, worst frame | 49 px | 11 px |
| Far-arm pixels under backing (Sable W / Grum W) | 63/63, 152/273 | composited above |
| Resting hand/elbow error, worst | 2.5 px | < 0.05 px |
| Floating outline islands next to arms | 597 px | 0 |

`tests/melee-shoulder-occlusion.test.js` asserts all four contracts. Each assertion fails on the previous release.

Visual evidence: [before/after sheets](evidence/melee-shoulder-occlusion/). The red bar marks the previous release and the green bar this change. Columns are the source frame, idle and attack phases at 6×; magenta marks enclosed transparent pixels.

## Known limitations

- The reconstructed backing remains row-mirrored filler. It is now visible in at most a thin sliver while an arm passes, so repainting it was not justified.
- Small transparent gaps at the hem and boots appear in rear-quarter attack frames of Aurel's apex form when the legs lunge. They are leg/hem motion, not shoulder occlusion, and are unchanged by this work.
- Very large evolved forearms (Brakk apex, Tarka) still bend into a broad curve during two-handed swings. The motion is connected and textured, but would benefit from authored action frames.
