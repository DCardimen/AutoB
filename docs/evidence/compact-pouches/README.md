# Compact equipment and Aura Stone pouches

Opening Companions shows worn equipment in the center, with the equipment knapsack and a smaller Aura Stone pouch on the right. Hover, keyboard focus or a touch opens each bag once per menu session. The authored animation holds at `pack-08`, the fully open frame; the later closing frames are deliberately excluded. Items spring out of a compact cluster, collide gently and settle into a stable pile with light overlap. Reduced motion opens immediately.

Equipment and stones have separate drop targets. Equipping, unequipping and switching companions keeps the current menu and open bags. Item effects, compatibility, quality and stone tiers remain available in the fixed-height inspector and accessible labels. Four worn Aura Stones fit on one compact row.

The drag lifecycle now handles missed drops, Escape, pointer cancellation, lost capture, focus loss, a missing mouse button, removed source nodes and menu closure. A bounded watchdog removes paused/cancelled landing animations and restores hidden destination art. Every new primary press clears stale click suppression. Combat entry also removes drag artifacts.

## Visual evidence

- [Closed bags](source-closed-1440.png), [open desktop layout](source-open-1440.png), [1228px layout](source-open-1228.png), [tablet layout](source-open-1024.png).
- [Phone pouches](source-pouches-390.png), [320px pouches](source-pouches-320.png), [compact worn slots](source-open-390.png).
- [Normal-speed opening, interrupted drags, transfers and combat recording](pouches-and-drag-normal-speed.webm).
- [Decoded opening sequence](opening-contact-sheet.png): both bags open and items spread without escaping the pouch. Native-size and enlarged frames were inspected; the ending art was corrected after noticing the authored sequence returns to a closed bag.
- [Source combat](source-combat-1440.png), [offline combat](offline-combat-390.png), [offline open layout](offline-open-1440.png).

## Verification

| Flow | Result |
| --- | --- |
| Source and direct `file://` offline game, 1440px and 390px | Passed; no page errors or failed requests |
| Closed bags, independent opening, moving items, open-frame latch | Passed |
| Four compact Aura slots, small separate pouch below equipment | Passed |
| Eight interrupted drag paths in all four browser cases | Passed; inventory unchanged and no residual ghosts/highlights |
| Paused landing animation | Cleaned by watchdog; destination art restored |
| Equip, return to correct pouch, reject wrong pouch, click immediately after cancellation | Passed |
| Equipment quality and Aura tier preservation | Passed |
| Keyboard opening and reduced-motion mode | Passed |
| Source/offline live combat after loadout interaction | Passed; no drag artifacts |

[Browser report](browser.json) and [50 passing unit checks](unit-tests.txt).

Also passed existing source/offline browser suites for equipment landing (zero center/size error), authored Aura Stone transfers, sprite-only mouse and real touch equipment dragging, companion/reserve swaps, empty-seat deployment, manual skill/evolution flows, and embedded fonts/atlas. The old Aura card size assertion now verifies the requested compact height, readable width and no horizontal overflow; authored art and tier checks remain intact.

Rebuilt both `Starfall-Menagerie.html` and `Starfall-Training-Glade.html`; the training output is byte-identical. No creature art, anatomy, gait, palette or attachment rendering changed.

Reproduce with:

```powershell
node --test tests/inventory-pouches.test.js tests/sprite-drag.test.js tests/equipment-capture-polish.test.js tests/aura-stones.test.js tests/empty-roster.test.js
npm run build:standalone
npm run build:prototype
node tests/inventory-pouches.browser.mjs
```

Interruption events for pointer cancellation, blur and missing buttons are injected deliberately; normal mouse/touch transfers and combat use actual browser input.
