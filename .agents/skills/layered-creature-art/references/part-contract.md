# Part and rig contract

Use the project's existing format when one exists. These are the information requirements, not a mandatory schema.

## Identity and coverage

Record family, authored form, gameplay evolution mapping, variant, facing order and native cell size. Inventory every required part per form/facing, including intentionally hidden far parts. A hidden part needs an explicit occlusion decision, not a missing-file fallback to a different form.

For each source, retain the original path or generation provenance and whether it is approved, a draft, or a diagnostic. Keep normal maps, masks or palette tables only when the renderer actually uses them.

## Painted parts

Each part should supply:

- A transparent painted image or indexed layer, its native dimensions, crop bounds and material palette.
- An anatomical name, independent of viewer side.
- Source-space root and tip points; an elbow/knee landmark or mesh weights when the part bends internally.
- Attachment socket, overlap region, depth/occlusion order and intended visibility for this facing.
- A transformation from source coordinates to the bind pose. All eye states share the same head registration.

Examples of sockets: neck, shoulder.right, elbow.right, wrist.right, hip.left, knee.left, ankle.left, cape.shoulders, tail.0.root, weapon.grip, bow.tip.top, bow.tip.bottom, bowstring.draw, arrow.nock. Adapt socket names to non-biped anatomy.

A complete torso underlay must remain when sleeves move away. Upper/lower limb caps overlap inside the joint, preserving material and width. Fit the full assembled character and its effects to the intended cell; leave useful motion margins. Do not make a clipped weapon fit by shrinking only that weapon.

## Motion and simulation

Bind/idle reconstruction should match the approved assembly. Map movement into the actual limb lengths and keep intended support feet on the ground. Record anatomy classification, contact groups and reach constraints independently of motion pace.

For cloth, record pinned vertices, rest mesh, structural/bend constraints, damping, collision/occlusion regions, and maximum step/substep behavior. For tails, record root sockets, ordered segment lengths, skin weights, angular/length limits and per-tail response offsets. Bound external forces and simulation state; resuming after a hidden tab must not explode the mesh.

For bows, store wielding hand and draw hand explicitly. Derive the bowstring and arrow from the same transformed bow/hand sockets used to paint the pose. Check both full draw and the instant of release, not just idle grip position.

## Evidence

Record what was visually reviewed, not just what a manifest lists. A useful coverage row includes form, variant, facing, state, pace/stride setting, source/offline target, still/video path, check result and any limitation. Keep mechanical checks separate from artistic assessment.
