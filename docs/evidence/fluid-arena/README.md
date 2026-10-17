# Browser arena space

Desktop fills the browser width instead of stopping at 1700px. Companion orders and live status use the existing sidebar below the briefing, freeing the arena's full height. Resizing back to a tablet or phone returns the same roster nodes below the battlefield. The uniform camera remains shared by sprites and pointer input.

At 1900 × 935, the main area grows from 1700 to 1900px and the battlefield from 1226 × 510 to 1423 × 650px. The tool dock stays within the viewport. Source and offline checks pass at 2560 × 1440, 1900 × 935, 1366 × 768, 1024 × 768 and 390 × 844, including sidebar placement, desktop → phone → desktop resizing, all companion cards, live combat/status, no overflow and zero page errors. Both offline outputs build.

- [Measured layouts and checks](browser.json)
- [1900px](source-1900.png) · [2560px](source-2560.png) · [1366px](source-1366.png) · [tablet](source-1024.png) · [phone](source-390.png)
- [Live combat](source-battle.png) · [offline combat](offline-battle.png)
