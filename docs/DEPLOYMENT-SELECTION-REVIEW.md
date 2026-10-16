# Companion pickup and deployment

The owl's visible sprite passed the existing hit test, but starting its pickup threw `Cannot read properties of null (reading 'tip')`. Its reused motion proxy contains a weapon while the actual owl form correctly has none. The deployment code dereferenced the absent form weapon before it could establish the drag.

Pickup now attaches a weapon only when both the source rig and actual form have one. Candidate landmarks must also exist in the pickup physics points. This preserves the owl's authored anatomy and the existing pickup motion while allowing every companion to enter the drag lifecycle.

## Verification

- [21/21 focused unit checks](evidence/deployment-selection/unit-tests.txt) pass, including deployment, authored gait/carry checks and native tactics. The new lifecycle sweep covers **1,068** family/form/evolution-path/height combinations, plus all four owl families and rejection of an outside pointer.
- [Actual browser input report](evidence/deployment-selection/browser.json): **267 source + 267 offline mouse drags**, covering every family in all three forms, including high starting positions. Each case selects the visible creature, moves it and releases it through the real canvas handlers.
- Real touch dragging moves the owl on 390px source and offline phone layouts. [Phone result](evidence/deployment-selection/source-owl-touch.png).
- [Normal-speed recording](evidence/deployment-selection/owl-drag-normal-speed.webm) covers base, evolved and ascended owl pickup, recovery, placement and subsequent live combat. [Decoded native/enlarged frames](evidence/deployment-selection/decoded-native-and-enlarged.png) were inspected at 1.1, 2.6, 4.1 and 6.8 seconds.
- Both offline HTML files were rebuilt. Offline browser flows block external requests and report zero page errors. `git diff --check` passes.

## Art review scope

No source sprites, palettes, skinning, gait profiles, physical contacts or weapon identities changed. The fix respects the actual form's lack of a weapon instead of inheriting anatomy from its proxy.

Reviewed the [original/current owl sheet](evidence/deployment-selection/review-owl.png) in all eight directions and all three forms. Reviewed Voltwing's [base/final idle, walk, run and sprint sheet](evidence/deployment-selection/review-voltwing-motion.png), and the recorded pickup/recovery/combat at native and enlarged size. The review also generated motion sheets for [Tempest](evidence/deployment-selection/review-tempest-motion.png), [Canopyowl](evidence/deployment-selection/review-canopyowl-motion.png) and [Thunderroc](evidence/deployment-selection/review-thunderroc-motion.png): **256 poses, zero clipped poses** across the four families. [Coverage summary](evidence/deployment-selection/art-summary.json).

No disconnected limb or source-art clipping was observed in the reviewed owl samples. The broader mouse sweep verifies interaction for every family; it is not a claim of full visual animation review for every family. The pre-existing `expedition.js` draft remains untouched. This PR stacks on #36 and contains only the deployment fix and its evidence.
