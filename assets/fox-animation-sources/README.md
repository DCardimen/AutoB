# Fox motion source and retargeting

Kay Lousberg, **KayKit Character Animations 1.1**, Free tier, downloaded 2026-10-19 from:

https://kaylousberg.itch.io/kaykit-character-animations

The official pack includes Rig_Medium and Rig_Large humanoid skeletons and bow, movement, dodge and general animation sets. The free FBX/GLTF animations are CC0. The paid Blender source tier is not required or used. The author's supplied [license](kaykit/License.txt) is retained.

Downloaded archive: `KayKit_Character_Animations_1.1.zip`.
SHA256: `65882f31f905ad2e953819648a59287cdeab8f623908d5ef701971d3758be20f`.

The JSON files contain selected original Rig_Medium transform tracks, hierarchy and rest transforms extracted from the GLBs. Mannequin meshes, textures and executable content are not included. The selected general, movement, advanced movement and bow tracks remain available for future iterations.

The current fox bake samples **Idle_A**, **Walking_A**, and **Running_A** to supply arm directions, breathing variation and swing. `scripts/lib/kaykit-motion.mjs` normalizes the exported quaternions, removes small loop endpoint drift and samples world-space bone directions. The directions are fitted to the fox's own segment lengths and narrowed stance. The fox's skin, hand identities, tail, costume and inverse bind matrices stay model-specific. Bow attacks, grounded foot paths, dodge steps and the fall are fitted to this fox; they are not claimed to be unmodified KayKit clips.

The right hand carries the bow. The left hand draws. This is a fox-specific user requirement; it does not change the production game's convention for other archers.

For another character, first inspect the actual mesh and bind pose, then map source directions and proportions. Retargeting a stock skeleton alone does not repair polluted skin weights, a detached tail, wrist roll, finger geometry or weapon contacts. Export and test the actual skinned poses, followed by normal-speed rendered review.
