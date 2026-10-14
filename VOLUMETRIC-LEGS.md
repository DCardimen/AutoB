# Rounded legs and complete hips · Art revision 9

Two-legged characters now use rounded 3D leg geometry, shaded into the native
pixel artwork. Thighs and calves have tapered volume, knees have rounded caps,
and boots have distinct top, toe, heel, side and sole faces. Thickness stays
consistent across all eight views. Clothing, greave and boot shading bands
come from the original stage-specific artwork and palette.

Each surface follows the existing hip, knee and ankle joints. A depth buffer
resolves which leg is in front; contact shading separates overlapping legs.
Foot pitch and planted-foot yaw turn the boot geometry. The simulation's
anatomy, foot anchors, stride, stamina and physical weapon contacts are intact.
The short/tall character setting scales the new legs with the body.

The original flat leg regions are removed from the body layer. Matching hip
detail remains behind the moving thighs, while long garments and the natural
gap between legs remain. Quadruped and many-legged body types retain their
existing anatomical renderers.

Open `Starfall-Menagerie.html` for the game, or
`Starfall-Training-Glade.html` to inspect movement. Both are rebuilt, as is
`public/prototype-bundle.js`. The complete download is
`public/Starfall-Volumetric-Legs.zip`.

`public/leg-volume-preview.webm` shows normal-speed walking, running and
sprinting through eight facings, with juvenile and developed forms. Review
sheets include eight-direction poses, gait phases and frames decoded from the
recording. `scripts/review-leg-volume.mjs` rebuilds this evidence;
`tests/reports/leg-volume.json` records the pose and video playback checks.

Regression coverage includes solid thickness and lighting, depth-order
independence, boot yaw, complete hips with the leg mesh hidden, unchanged
planted-foot physics, all-family pose bounds and both character-height limits.
The Training Glade browser check probes actual rendered joint coordinates.
Save schema 7, rules 17, creature scale and the accepted hand/body fixes remain.
