# First-click stage forecast

The first stage click highlights all reachable branches ahead in light green, following the actual child graph rather than inferring connections from crossing lines. Future encounter identities still use the existing scouting/fog rules. The artificial south-side trail appears only at world zero, encounter zero; it is absent from every later selection, including the first encounter of later worlds.

An anchored, nonmodal preview opens beside the selected stage. Its painted header, mint border and gold Enter button match the expedition UI. Combat previews use the actual archetype, weather, counterplan and elite mutation/tier. Boss previews use the world guardian's guidance. Shops, rests and events describe their available choices without inventing enemy details or guaranteed loot. The expected rewards remain visible in the footer while longer scouting details scroll internally.

The selected stage stays available for the second click. Enter also works from the popup. Close, Escape and clicking elsewhere dismiss it; the scouting shortcut reopens it. Dialog positioning adapts to desktop and phones, and reduced motion skips its arrival animation. Selection preserves the existing map/background canvas.

- [Desktop elite preview and green branches](evidence/stage-route-preview/elite-desktop.png)
- [Phone rest preview](evidence/stage-route-preview/rest-mobile.png)
- [Source/offline browser report](evidence/stage-route-preview/browser.json): all seven stage types, correct reachable paths, exact green stroke, no later south trail, retained canvas, dismissal/reopening and unobstructed second-click entry. Additional 320px opening-stage checks verify the popup Enter action, and later-world checks verify no south trail even at depth zero. Zero page/network errors; offline requests blocked.
- [10/10 focused unit checks](evidence/stage-route-preview/unit-tests.txt): explicit branching/rejoining, legacy lane connectivity, actual combat scouting content, noncombat content and existing journey behavior.

The standalone build and `git diff --check` pass. Background-animation code and creature artwork are unchanged. The pre-existing `expedition.js` draft remains untouched. This PR stacks on #35 and contains only the stage-selection follow-up.
