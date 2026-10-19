---
name: layered-creature-art
description: Create or revise layered pixel-art creature assets and rigged animation previews, including directional parts, evolution forms, held equipment, blinking, cloth, and tails. Use for reusable creature-art or animation pipelines; not for standalone illustrations or unrelated UI assets.
---

# Layered creature art

Use painted parts and explicit attachment landmarks to keep character identity stable across animation. A full-character generated flipbook is useful for art direction, but is not evidence that a rig, grip contact, gait, or physics works.

## Scope and discovery

- Read the repository's creature-art rules before choosing anatomy or touching assets. Inspect every existing form and all available facings, including occluded far limbs, equipment and cell edges. Record what is actually visible; a shared motion proxy does not establish anatomy.
- Respect the user's current approval boundary. When asked for a preview first, create an isolated preview; choosing a technique does not by itself cancel an earlier instruction against game integration. Do not impose a preview approval step when integration is already authorized.
- Establish the reference style, target cell size, directional order, material palette, evolution mapping and anatomical weapon hand. Scope character-specific exceptions to that character. Do not turn one character's right-hand bow preference into a universal archer rule.
- For AutoB / Fang and Feather, read [references/autob.md](references/autob.md) for the existing paths, evidence requirements and fox-specific decisions.

## Build a coherent painted kit

Prove one representative facing and all requested forms in an assembled moving pilot before multiplying an unverified attachment design across eight directions. Inspect the original eight-direction sources first; clearly label a one-facing pilot as partial directional coverage.

Typical biped parts are head, eye states, complete torso, anatomical left/right upper arms, forearms with hands, thighs, lower legs with feet, cape, tail, and equipment. Adapt this list to the creature; do not manufacture humanoid arms or four legs for an incompatible design.

- Keep a complete painted torso beneath moving arms and a complete neck beneath the head. Paint hidden joint overlap, not transparent holes or a flat borrowed color patch.
- Preserve intended thickness, boot/paw shape, costume texture and palette. Use the approved material palette for repairs. A redesign can establish a new approved palette; incidental repairs cannot silently recolor it.
- Name left/right parts anatomically. Record far-limb visibility and direction-dependent draw order explicitly. Never assign hand identity from an animated screen coordinate.
- Register source root, joint and tip landmarks, local bounds, overlap regions, palette identity and asset provenance. Record expected anatomy and equipment separately from the selected gait.
- Keep the head/eye silhouette and pivots identical between open, half-closed and closed states. Blink the eyes without morphing the body or bouncing the head.
- Use imagegen for raster generation/editing when available. Give it approved visual references and one clearly scoped asset per call. Small independent part groups are easier to repair than crowded whole-character animation atlases. Do not substitute generic vector limbs for requested painted sprite art.

Read [references/part-contract.md](references/part-contract.md) when defining a new kit or adapting an importer. It describes the minimum useful part and rig metadata without prescribing a universal file format.

## Assemble and animate

Bind artwork to stable named sockets. Keep the physical pose, source art ownership and equipment identity separate.

- Match source segment lengths and widths. Animate painted limbs through the project's authored skinning/mesh path; blend continuously at roots and preserve joint overlap. Use feasible IK targets rather than stretching a detached hand to a weapon.
- Ground locomotion in alternating support and bounded stride travel. Test walking, running, sprinting, turns, starts/stops, and the project's stride extremes. Do not use whole-body bobbing to disguise unanimated feet. For true quadrupeds, use alternating diagonal groups and correct visible paws.
- Anchor weapon grip to the specified anatomical hand in every facing. For bows, attach both string endpoints to the bow, the draw point to the other hand, and the arrow to that same draw system. The arrow's release point and travel direction must match the physical pose.
- Give attacks readable anticipation, nock/setup, windup/draw, aim/contact, release, follow-through and recovery. Keep release effects brief and local so they do not hide bad contacts.
- Pin cloth at its real shoulder/neck attachment. Use a stable, bounded simulation with damping and length constraints, driven by motion, acceleration and wind. A rotating rigid cape or prepainted flutter is not a cloth simulation.
- Skin painted tails along connected chains. Root each tail at the pelvis; use tip lag, damping, collision/occlusion limits and restrained idle sway. A multi-tail form needs distinct chains with staggered response. Keep tail count and roots stable; never leave the old painted tails underneath new ones.
- Keep diagnostic skeletons and joint guides confined to review surfaces. Production should show the painted creature.

## Extract and package assets

Do not assume a generated atlas has an exact grid or that its poses preserve identity. Inspect actual decoded pixels, padding, facings and complete silhouettes. Adjacent arrows or tails can cross nominal cell boundaries; naive rectangular slicing can import a neighbor's limb. Verify extracted parts individually. If objects overlap ambiguously, regenerate a smaller isolated group rather than repeatedly masking contaminants or shrinking one bad part.

Store approved sources, extracted parts, registration metadata and reproducible assembly inputs together. Preserve references to both original and replacement art. Reuse a working rig across compatible evolution forms, while registering their actual proportions, costume layers, tail count and equipment; do not invent gameplay evolution stages from the number of source-art tiers.

## Acceptance and iteration

Distinguish three deliverables: art-direction mockup, assembled rig/physics preview, and integrated game behavior. State which was produced and what remains unverified. JSON landmarks, passing metadata checks and a plausible skeleton cannot establish visual quality.

- Check complete silhouettes and cell boundaries, exact grip/string/arrow contact, source palette/material preservation, joint continuity, foot support, far-limb occlusion, blinking, and cape/tail attachment through full cycles.
- Review original/current sheets and decoded normal-speed recordings at native and enlarged sizes. Slow playback and rig guides help diagnose defects but do not replace normal-speed review.
- Cover every requested form, variant, facing and movement/attack state before calling the whole asset complete. Report partial coverage explicitly.
- For integration, run the relevant existing gait, anatomy, palette, contact and boundary checks; rebuild required offline outputs and verify source plus offline live combat. Preserve assertions and tolerances.
- Repeatedly inconsistent generation or failed skinning calls for a different asset decomposition, registration or rig strategy. Do not lower tests, hide clipping with effects, or describe known disconnected/clipped/hopping limbs as finished.
- Follow the repository's branch/PR rules. Include reviewed families/forms/facings, visual evidence links, checks and unresolved limitations in an art PR. Preview-only changes must be identified as such.
