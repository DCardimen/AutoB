# Compact team selection

The team selector now starts with smaller cards and a crisp gold start button. Its S/M/L control selects Compact, Comfortable or Large cards and saves that display preference to the local profile. Card resizing changes the grid and preview dimensions directly, preserving the selected party, dialog, animated portrait canvases, focus and decoded artwork.

The start button uses CSS gradients, borders and live text instead of stretching the raster button artwork. Hover and press feedback remain restrained. Selected cards keep a constant border width so choosing a companion does not shift its content. Spacing in the heading, grid and party bar is tighter.

| View | Evidence |
| --- | --- |
| Default compact desktop | [Screenshot](evidence/team-select-v2/source-compact.png) |
| Large desktop option | [Screenshot](evidence/team-select-v2/source-large.png) |
| Phone card controls | [Screenshot](evidence/team-select-v2/source-mobile.png) |
| Phone party and start button | [Screenshot](evidence/team-select-v2/source-mobile-start.png) |

[Source/offline browser verification](evidence/team-select-v2/browser.json) passed with zero page errors. Checks covered all three sizes, party retention, unchanged dialog/canvas identities, preference persistence after reload, card-content containment and no horizontal overflow at 1440, 1280, 768, 390 and 320px widths. Starting the expedition reaches the initial optional relic choice. The offline check blocked all external requests.

`node --check app.js`, `npm run build:standalone` and `git diff --check` pass. No creature artwork, anatomy, animation frames, combat stats or global creature-size settings changed. The pre-existing `expedition.js` draft remains untouched.

This branch builds on the merged PR #33's seamless dialog rendering. The new PR contains only this team-selection follow-up.
