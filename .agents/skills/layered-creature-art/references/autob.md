# AutoB / Fang and Feather

Read current repository instructions; this reference is navigation and session context, not a replacement for them.

## Repository obligations

- `AGENTS.md` and `CREATURE-ART-GUIDE.md` govern anatomy, art, animation and acceptance evidence.
- Create a fresh feature branch and a new PR for each requested change. Do not reuse another task's branch or PR.
- Preserve the pre-existing untracked `expedition.js` draft. Never edit, stage or delete it; it may live in a different linked worktree. Stage task-owned paths explicitly.

## Existing implementation

- Source indexed sprites: `authored-sprite-data.js`, `authored-sprite-stage1-data.js`, `authored-sprite-stage2-data.js`; inspect images or decode pixels rather than printing the large data modules.
- Renderer and direction/hand binding: `authored-sprite-renderer.js`, `prototype-rig.js`, `companion-arm-bindings.js`.
- Existing parts and complete torso underlays: `authored-parts.js`, `companion-anatomy.js`, `melee-layer-art.js`, `indexed-layer-codec.js`.
- Physical/anatomical registration: `leg-anatomy.js`, `creature-leg-volume.js`, `native-forms.js`, `native-poses.js`.
- Export/review helpers: `scripts/build-companion-parts.mjs`, `scripts/verify-companion-parts.mjs`, `scripts/review-gaits-carry.mjs`, `scripts/review-legs-v3.mjs`.
- The isolated fox layered pilot lives in `public/fox-layered-preview/`; its manifest explicitly reports one facing. Build its independent kits and inline viewer with `scripts/build-fox-layered-kits.mjs` and `scripts/build-fox-layered-inline.mjs`, and review it with `scripts/review-fox-layered-preview.mjs`. These are preview helpers, not the production game's integration path.

The current directional order is E, SE, S, SW, W, NW, N, NE. Verify this against the active renderer before importing a new kit. The game uses 64-pixel cells and authored indexed artwork. Respect its production skinning path rather than adding a parallel procedural limb renderer.

## Fox archer decisions from this request

- Family `fox`, character Rowan; preserve the approved orange/cream fox identity, compact chibi proportions, green ranger clothing, leather equipment, quiver and increasingly ornate evolution costumes.
- Three authored tiers exist (base, mature, apex). Rowan currently has one gameplay evolution, Moontrail Ranger, which uses the apex artwork; Wild/Warden variants must be accounted for. Recheck current content before integration. Do not unlock an additional gameplay evolution simply to expose the mature art tier.
- The user's explicit exception: the fox bow belongs to the anatomical RIGHT hand at every facing and gait phase; the LEFT hand draws. The repository normally puts bows in the left hand. Override fox intentionally and locally, with corresponding contact checks; keep other archers' approved hands unchanged.
- Include blinking and a relaxed breathing idle; a grounded alternating run; nock, draw, aim, crisp release flair and recovery; pinned cape dynamics; attached tails with fluid lag and settling. The apex reference has five tails.
- The user rejected the coarse enlarged 64-pixel presentation and thin legs in the first pilot. Subsequent art previews should retain finer source detail, short stocky legs, broad boots with thick soles and a stable stance. Directional coverage must include actual SE/SW front quarters and NE/NW rear quarters; a single facing or mirrored front view is insufficient.
- The user chose layered parts and requested a layered preview before game integration. Keep any active preview-only instruction until the user authorizes integration. A full-sprite flipbook from earlier art direction is not a validated layered rig or cloth simulation.
- Latest scope is the base fox only: eight directional component kits and one assembled working example before expanding to evolution forms. The user rejected the frontal chest, disconnected joins and over-curled knees. The working example uses much shorter legs, continuous painted limbs and separately articulated rigid gloves, with a specific thumb review. Earlier Rowan art is the visual benchmark; mechanical checks do not establish the user's requested 9/10 likeness.
- Current base-only tooling: `scripts/build-fox-base-directions.mjs`, `scripts/build-fox-stocky-inline.mjs`, `scripts/review-fox-stocky-motion.mjs`, and `scripts/inspect-fox-base-art.mjs`. `base-directions.json` records eight art kits, but only SW is rigged for the current example. The original three-tier `kits.json` and old evidence are retained as historical regression data.

## Integration verification

Use relevant checks including `tests/gaits-carry.test.js`, `tests/legs-v3.test.js`, `tests/legs-v2.test.js`, `tests/melee-weapon-art.test.js`, `tests/prototype-rig.test.js`, `tests/sprite-art-v2.test.js`, `tests/grand-forms.test.js` and authored part/contact tests. Extend real fox coverage as needed; do not relax unrelated established hand assertions to accommodate the exception.

Build both offline outputs with `npm run build:standalone` and `npm run build:prototype`. Verify source/offline live movement and combat using the applicable browser scenarios. The complete requirements and current script invocations live in `CREATURE-ART-GUIDE.md`.
