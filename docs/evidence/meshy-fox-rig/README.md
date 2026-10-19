# Meshy base fox: skeleton and tail repair preview

The supplied fox had a generic 35-joint humanoid skeleton, no tail bones and no animation clips. Its shoulder weights reached the head/ears, and arm/leg weights reached the tail. This pass replaces that skin with a fitted, anatomically named 28-bone rig, including a six-bone pelvis-rooted tail chain. It keeps the source mesh, UVs, normals, topology, material definitions and all embedded textures unchanged.

**Scope:** one supplied base fox, reviewed in S, SE, E, NE, N, NW, W and SW. This is an isolated rig repair and articulation preview. No evolution assets or production game files were changed.

## Visual evidence

- [Original, all eight views](original-eight-directions.png) and [repaired relaxed pose, all eight views](eight-directions.png).
- [Original front](original-front.png), [original rear](original-back.png), [repaired front](tail-front-1.4.png), [repaired rear quarter](tail-quarter-1.4.png), [tail skin weights](tail-weights.png).
- Normal-speed rendered recordings: [tail articulation](tail.webm), [head/arm/leg joint check](joints.webm). The view switches after four seconds. These are the GLB's actual embedded animation clips, played by Three.js AnimationMixer.
- Decoded recording frames: [tail](tail-decoded.png), [joint check](joints-decoded.png). Reviewed at native capture size and through the enlarged 3D preview. The eight-view sheet renders each model in a 256px cell.
- [Downloadable repaired GLB](../../../public/meshy-fox-preview/fox-repaired.glb), [viewer source](../../../public/meshy-fox-preview/index.html).

The tail bulb is exclusively weighted to the tail chain; its root blends into the pelvis. Ear/head vertices no longer have shoulder, arm or tail influence. Gloves remain rigid under their respective anatomical hand bones; fingers and thumbs retain their source geometry. Anatomical right is negative X in this forward-facing source. No bow is present in the supplied model.

## Validation

- `node --test tests/meshy-fox-rig.test.js`: 6 passing checks for normalized weights, exact rest-pose restoration, connected tail hierarchy, isolated head/tail influences, anatomical hands, original BIN payload hash and normalized looping embedded clips. [Source preservation report](source-preservation.json).
- [Decoded browser skin review](review.json): 512 sampled poses, two clips × 32 times × eight facings. No non-finite vertices or viewport clipping. Head drift during tail sway is below 1e-15 model units; tail-tip region moves approximately 0.222 units.
- Khronos glTF Validator: [repaired report](repaired-validation.json), zero errors, one warning. The warning is inherited from the source: its normal-mapped material lacks authored tangents, so the runtime generates tangent space. The [original report](original-validation.json) had the same warning plus a non-root skinned-mesh warning, which this repair removes. Three unused-accessor info messages preserve the original weights and bind matrices for recovery.
- `npm run build:standalone` and `npm run build:prototype`: passed, no output changes. Source/offline live combat checks are not applicable because this model is not integrated into either game renderer.
- Normal-speed recorded videos were decoded and checked for successful 1× playback. [Inline playback and served-viewer checks](inline-review.json) passed at narrow and desktop widths.

## Limitations

The two clips are articulation diagnostics, not a finished idle/run/archery animation set. Individual finger/thumb bones, blink shapes, independent ears, cape cloth bones/physics and runtime tail physics are not included. The cape remains body-bound. Deep combat poses and foot-ground constraints require the subsequent animation pass. No claim of 9/10 reference fidelity or production-ready locomotion is made.

## Reproduce

Source supplied outside the repository: `C:/Users/David Cardimen/Downloads/Meshy_AI_Character_output.glb`, SHA-256 `a8b9f02c6eb810e26b02c0e46b43cbb38e1983b65fc3a8b16c6fafbab8f5bbd0`. The builder rejects other inputs because its anatomy fit and region selection are model-specific. Original rig metadata is retained in `extras.foxRigRepair.originalRig`; original skin/bind accessors and the original BIN payload remain in the repaired file.

```powershell
node scripts/repair-meshy-fox-rig.mjs 'C:/Users/David Cardimen/Downloads/Meshy_AI_Character_output.glb'
node scripts/build-meshy-fox-preview.mjs
node --test tests/meshy-fox-rig.test.js
$env:RECORD='1'
node scripts/review-meshy-fox-rig.mjs public/meshy-fox-preview/fox-repaired.glb docs/evidence/meshy-fox-rig
node scripts/build-meshy-fox-preview.mjs
node scripts/serve-meshy-fox-preview.mjs
```

The viewer is then available at `http://127.0.0.1:3109`. It supports all eight facings, orbiting, pause, original rest pose, both embedded clips, skeleton guides and tail-weight inspection. The inline tail preview is rebuilt from the recorded video. No generated raster art or Meshy API calls were used.
