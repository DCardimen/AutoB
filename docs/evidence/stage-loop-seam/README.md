# Continuous stage background

The eight-second hard wrap is replaced by a seven-second circular crossfade made from the selected vibrant landscape source. The browser also preloads a second muted player and fades it in for 600ms before the outgoing player reaches its end. The visible player therefore never has to seek back to the first frame. Both players pause offscreen, in hidden tabs and with reduced motion; disposal releases both decoders. They share one MP4 URL/blob.

Verified source and direct-file offline playback at normal 1× speed across two consecutive handoffs each. Incoming players were already decoded (`readyState=4`) and moving at 0.62–0.65 seconds when promoted. Displayed RGB changes at promotion were 0.46–0.50 on a 0–255 scale, below other ordinary frame changes. [Measured frames](browser.json), [lifecycle/layout checks](lifecycle.json), [19 focused checks](focused-tests.txt).

Reviewed [source recording](source-normal-speed.webm), [offline recording](offline-normal-speed.webm), [decoded native frame](decoded-handoff-native.png) and [enlarged detail](decoded-handoff-detail.png). Five responsive widths, mouse/keyboard stage selection, autoplay denial/retry, media failure fallback, reduced motion, visibility and offscreen pause/resume continue to pass.

Rebuild: set `FFMPEG_PATH` and run `node scripts/build-stage-loop.mjs "<Fantasy_Landscape_Vibrant_Enhanced (2).mp4>"`, then both offline builders. Main offline output is 99.1 MiB; Training Glade rebuilds unchanged. Run `node tests/stage-background.browser.mjs` and `node tests/stage-loop-seam.browser.mjs` against the local server.
