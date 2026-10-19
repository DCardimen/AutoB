# Base fox generation and selected art

Mode: built-in `image_gen`. All eight sheets initially used the earlier eight-view base Rowan turnaround as a reference. The selected SW sheet was then restyled against [the earlier approved Rowan art board](style-reference.png), left column only. Twelve parts per sheet are retained in `public/fox-layered-preview/sources/rowan-<direction>-master.png`. Source hashes and crop bounds are in `base-directions.json`.

The shared prompt below was followed by exactly one of the camera-view clauses. The malformed initial bow tiles were replaced by a separate eight-bow source; those initial bow tiles are not consumed by the renderer.

## Shared part-sheet prompt

```text
Use case: illustration-story. Create ONE transparent layered puppet asset sheet for ROWAN BASE FOX RANGER ONLY using the provided eight-view base fox as identity/style reference. This is NOT an assembled character, NOT a turnaround: twelve isolated cutout parts in exact 4 columns by 3 rows, generous transparent gutters and every piece fully contained in its cell, no background, no labels, no cast shadows, no decorative glows. Fine detailed fantasy game sprite painting with crisp small texture, orange/cream fur, dark eye, dark green simple ranger tunic, plain brown leather belt/gloves and chunky brown boots. No circlet, no elaborate gold costume, no evolution, ONE tail. All visible costume surfaces must match the SAME ONE camera view described below. Keep piece proportions consistent as one coherent chibi figure, very large head and stout compact torso. Legs extremely short, mostly big broad boots; NO long shins, no outward curved knees.
EXACT TWELVE PARTS in reading order:
Row1 col1 complete head eyes OPEN; col2 exact same head, silhouette and facing eyes CLOSED (back views identical to open); col3 COMPLETE one-piece TORSO from neck to pelvis, including continuous green tunic skirt, belt, short broad hips, painted hidden neck and shoulder socket overlap, NO head, arms, legs, cape, quiver, tails or weapons; col4 COMPLETE anatomical RIGHT ARM from rounded overlapping shoulder sleeve through elbow to a glove with CLOSED GRIPPING fingers and a clearly defined central palm grip. One connected painted arm, not separated segments, downward relaxed bind orientation.
Row2 col1 COMPLETE anatomical LEFT ARM from shoulder sleeve through elbow to gloved hand ready to draw a bowstring; one connected painted arm, downward bind; col2 COMPLETE extremely SHORT anatomical RIGHT LEG including thigh/shorts, tiny straight knee/shin and BIG WIDE BOOT; col3 same for anatomical LEFT LEG; col4 COMPLETE green rear CAPE fabric, pinned collar width then draping wide hem, without arms, torso or neck.
Row3 col1 ONE whole bushy orange/cream TAIL with root at LEFT and cream tip at RIGHT as a separate horizontal texture; col2 ONE complete plain wooden recurve BOW with simple central green grip, unstrung, no arrow or hand; col3 ONE complete brown leather QUIVER with three white-fletched arrows; col4 ONE complete horizontal ARROW, tip LEFT.
Limb bind shape: full arms painted vertically down, generous hidden overlap at shoulder, elbow inside continuous flesh/cloth, gripping palm center near bottom, no disconnected joint circles. Whole legs have a little upper brown short at top and an extremely short straight shin, with chunky folded boot cuff and broad rounded boot toe. Each whole leg-plus-boot silhouette is squat, almost as WIDE AS IT IS TALL, not a tall narrow tube; boot occupies lower 60 percent. Toes match camera view. Complete torso is a real three-dimensional directional garment, never a generic symmetric frontal tunic except in S view. Direction must be clear from collar, chest centerline, buckle, side panel and tunic hem, all agreeing with head. Front legs not bent sideways, no long curved shins.
Bow is independent unstrung geometry: a readable C-arched wooden bow, grip offset left, BOTH top and bottom limb tips offset RIGHT of grip and aligned with each other; not S-shaped staff. The eight copies may project differently in this view but remain a complete archer bow, no floating scraps. Keep all parts complete, opaque painted silhouettes on genuine alpha. Preserve reference face and broad boot style.
```

## Direction clauses

### E

```text
EAST, true right-facing profile. Head nose points screen RIGHT; chest and pelvis face screen RIGHT with a narrow side silhouette, not toward viewer. Show character's RIGHT side.
```

### SE

```text
SOUTHEAST, FRONT THREE-QUARTER facing down-right. Nose points screen RIGHT, both eyes but far eye narrower. Chest centerline, collar clasp, belt buckle and pelvis all turn RIGHT with head, visible front and right side.
```

### S

```text
SOUTH, straight FRONT view toward viewer. Head muzzle centered, both eyes symmetrical, chest and pelvis centered.
```

### SW

```text
SOUTHWEST, FRONT THREE-QUARTER facing down-left. Nose points screen LEFT, both eyes but far eye narrower. Chest centerline, collar clasp, belt buckle and pelvis all turn LEFT with head; visible front and character's LEFT side. The chest MUST NOT face straight toward viewer. Body front panel is foreshortened toward LEFT, left side panel visible on screen RIGHT.
```

### W

```text
WEST, true LEFT-facing PROFILE. Nose points screen LEFT; chest and pelvis face LEFT with narrow side silhouette, not toward viewer. Show character's LEFT side.
```

### NW

```text
NORTHWEST, REAR THREE-QUARTER facing up-left. Predominantly back of head, small LEFT-pointing muzzle at LEFT edge. Torso back faces viewer, front chest/buckle mostly hidden at LEFT edge. Do not draw front-facing torso.
```

### N

```text
NORTH, straight BACK view. Back of head only, no face or eyes visible. Back of torso and belt, no front chest clasp or front buckle visible.
```

### NE

```text
NORTHEAST, REAR THREE-QUARTER facing up-right. Predominantly back of head, small RIGHT-pointing muzzle at RIGHT edge. Torso back faces viewer, front chest/buckle mostly hidden at RIGHT edge. Do not draw front-facing torso.
```

## Separate equipment prompt

```text
Create a transparent game equipment asset sheet of EIGHT images of the SAME plain wooden archer RECURVE BOW, in a 4-column by 2-row grid, clean isolated generous gutters, no text or arrows or hands or strings or characters or background. Use the wooden bow in the bottom row, second column of the supplied puppet sheet as design reference. Every object must be a real archer bow, not a staff or wavy S shape: middle green leather grip at leftmost point, upper and lower wooden limbs arching symmetrically away to the RIGHT, upper tip and lower tip both right of the grip, with tips vertically aligned. Overall unmistakable bracket C profile opening RIGHT, symmetrical vertically, top limb extends up-right from central grip, bottom extends down-right from central grip. Keep the central grip vertically at center. Plain warm wood with green leather handle, minimal small brass ferrules, no ornate gold. Fine painted fantasy game art, smooth detailed material shading with crisp outline. Eight direction variants in order E SE S SW W NW N NE, upper-left lighting. Give subtle perspective changes in wooden limb width, front/back grip wrap and side shading, but keep a broad readable symmetric C arch and aligned tips in EVERY view. Do not flatten into a straight staff or make upper/lower tips point opposite directions. Transparent alpha, no glow, no shadow. These will be equipped with a dynamically generated bowstring attached to the actual tips.
```

## Selected SW correction against earlier art

```text
EDIT TARGET: Image1, the twelve-part SW Rowan puppet sheet. CANONICAL APPEARANCE: Image2, the earlier fox art preview, specifically ROWAN in LEFT column. The user rejected the newer smooth brown-eyed cartoon interpretation in Image1. Restyle these twelve components to faithfully reproduce the stronger earlier ROWAN asset in Image2: precise orange/cream fur shapes, BLACK dark eyes with small bright highlights rather than large brown irises, compact flatter fox muzzle, crisp detailed pixel-art texture and small dark outlines, forest green ranger cloth and brown leather. Preserve Image1's exact 4-column by 3-row twelve-part layout, all complete isolated parts, genuine transparency and clear gutters, SW/front-left camera direction and directional chest/buckle turned LEFT. Preserve the much shorter straight legs and wide chunky boots (no long shins), one whole right arm and one whole left arm each continuous shoulder to fingers. All arms and hands must match the earlier approved fox art style with clean readable gloves, each with ONE anatomically correct thumb and four fingers, distinct left/right hands. Both hands are viewed mainly from back with fingers pointing down in bind pose: anatomical RIGHT glove's thumb toward sheet LEFT, anatomical LEFT glove's thumb toward sheet RIGHT, with natural perspective/occlusion. Right glove closed around an implied bow grip, left glove a compact archer draw hand. Do not add separate joint circles, grow thin limbs, enlarge irises, smooth into painterly cartoon, change direction to front, or introduce floating source scraps. Keep head open and closed states exactly same silhouette and pose. No assembled character. Do not copy the other two evolution costumes from Image2. This is BASE ROWAN only. The independent bow will be replaced with our verified separate bow texture, so preserve its tile location but do not spend detail elsewhere. Color palette and pixel density should visibly match the earlier ROWAN rather than Image1's smooth illustration.
```
