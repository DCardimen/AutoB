# Stage select video background

Verdant Reach's stage selection now plays the supplied vibrant landscape clip behind the route. The video fills the scene with the same center / 42% framing as the painting. A shaded overlay keeps route icons, labels and world copy readable; the original painting remains available during loading, playback rejection, decode failure and gentle motion.

The user selected `Fantasy_Landscape_Vibrant_Enhanced (2).mp4` after inspection found that `Stage Background 1.mp4` contained only an audio track. The selected clip is packaged as [stage-grasslands.mp4](../public/ui/uploaded/stage-grasslands.mp4): eight seconds, H.264, 720 × 1280, 24 fps, 727,963 bytes, fast-start metadata and no audio track. The resolution and compression keep the single-file offline build below GitHub's 100 MiB file limit. Cinderwake and The Silent Expanse retain their own painted backgrounds.

Playback loops at normal speed, stays inline and muted, pauses offscreen or in gentle motion, and pauses immediately at the hidden-document visibility event. Pointer or keyboard interaction retries a denied autoplay request. Stage selection preserves the decoded player, and leaving the map releases its media source. Retained ambient thumbnails also recover their positioning after stage selection so their painted layers stay inside the thumbnail.

## Visual evidence

- [Desktop source game](evidence/stage-background/source-1672.png), [offline phone](evidence/stage-background/offline-390.png).
- [Selected stage](evidence/stage-background/source-selected-stage.png), [gentle motion](evidence/stage-background/source-gentle.png).
- [Decode/network failure fallback](evidence/stage-background/fallback-failed.png).
- Normal-speed playback: [decoded frame](evidence/stage-background/decoded-4.png), [enlarged waterfall detail](evidence/stage-background/decoded-detail-2x.png), [complete MP4](../public/ui/uploaded/stage-grasslands.mp4). The browser test regenerates all beginning/middle/end frames and viewport captures in `playtest-artifacts/stage-background/`.
- [Source live combat](evidence/stage-background/source-live-combat.png), [offline live combat](evidence/stage-background/offline-live-combat.png).

The decoded frames and complete scene captures were visually reviewed at native size and with enlarged detail. The scene fills its bounds without stretching or letterboxing, and the labels and route controls remain readable.

## Validation

- `npm run build:standalone` and `npm run build:prototype` succeeded. Training Glade output is unchanged after rebuilding.
- `node --test tests/journey-polish.test.js tests/uploaded-art.test.js tests/rarity-atmosphere.test.js tests/route-preview.test.js`: **19 passed**, zero failures. [Test output](evidence/stage-background/focused-tests.txt).
- `BASE_URL=http://127.0.0.1:3107 node tests/stage-background.browser.mjs`: source and direct `file://` offline playback; offline context blocks network access. Checks actual decoded frame changes and normal-speed looping, 1672/1440/768/390/320px layouts, scene bounds, mouse/keyboard stage selection, retained video and contained thumbnail layers, entering live combat, gentle motion, offscreen pause/resume, visibility-event pause/resume, autoplay rejection/recovery, media failure fallback, and other world backgrounds. [Browser report](evidence/stage-background/browser-checks.json).
- Visibility-event handling is exercised with a simulated hidden-document event. Browser and visual checks used Chrome on Windows; Safari/iOS were not directly exercised.
- The full unit suite was also attempted with explicit PowerShell file expansion, then stopped during the unrelated exhaustive `grand-forms.test.js` creature-render traversal. No full-suite pass is claimed.
- `git diff --check` passed.
