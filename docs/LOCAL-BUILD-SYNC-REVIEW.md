# Consolidated local game

The local game was missing recent work because PRs #43–#47 were merged into successive feature branches rather than the default `codex/starfall-menagerie` branch. The MP4 branch followed that default branch. GitHub marked those PRs merged, but the default game and its local build still lacked their changes.

`feat/consolidate-recent-prs` combines the latest default game, the complete merged feature chain through #47, and the verified MP4 work from #49. Its pull request targets the default branch directly.

| PR | Included behavior |
| --- | --- |
| [#43](https://github.com/DCardimen/AutoB/pull/43) | Equipment previews and dragged sprites land on the left-hand slot artwork. |
| [#44](https://github.com/DCardimen/AutoB/pull/44) | Uploaded Aura Stone illustrations and shared companion attachment slots. |
| [#45](https://github.com/DCardimen/AutoB/pull/45) | Vacant roster seats can be filled by clicking or dragging reserves. |
| [#46](https://github.com/DCardimen/AutoB/pull/46) | Saved manual skill choices at levels 3, 5 and 7, with four cooldown slots. |
| [#47](https://github.com/DCardimen/AutoB/pull/47) | Post-match EXP fills through every earned level with visible before/after totals. |
| [#48](https://github.com/DCardimen/AutoB/pull/48) | Animated pregame capture target marker from the default branch. |
| [#49](https://github.com/DCardimen/AutoB/pull/49) | Muted, looping stage-select MP4 with still-image fallback and offline playback. |

The server on port 3000 also retained an old module allow-list and returned HTTP 404 for `aura-stones.js`. It was restarted with the current `server.js`; both `aura-stones.js` and `xp-celebration.js` now return HTTP 200. The canonical source preview is `http://localhost:3000/`, and the offline game is this checkout's `Starfall-Menagerie.html`. Browser storage was not cleared.

## Offline packaging

Both offline HTML files were rebuilt. The main file embeds PNG, WebP and MP4 assets, preserving the uploaded stone art and stage video. Shared CSS assets now embed once and use compact blob URLs, removing the duplicated 1.9 MB arena icon atlas without changing image bytes. Font declarations retain their inline font sources. This keeps the combined offline file at approximately **98.2 MiB**, below GitHub's 100 MiB limit.

## Verification

- 70 focused unit checks passed for Aura Stones, vacancies/reserves, manual skill progression, EXP celebration, game rules and stage previews.
- Desktop/mobile source and offline browser flows verify equipment landing, uploaded Aura Stone art and transfers, filling exact vacant seats and persistence, manual skill choices/replacement and live four-cooldown combat, multi-level EXP replay/reduced motion, and real combat → rewards → manual skill choice without duplicate EXP.
- The stage-video browser checks cover actual decoded motion, looping, direct `file://` loading with networking blocked, five viewport widths, stage selection, reduced motion, fallback/recovery and combat entry.
- Offline asset checks verify authored font loading, shared atlas URLs, exact decoded atlas pixel equality with source, and no external offline asset requests.
- Browser validation uses Chrome on Windows, including phone-sized viewports.

Evidence: [PR ancestry audit](evidence/local-build-sync/pr-audit.json), [70 unit checks](evidence/local-build-sync/focused-tests.txt), [feature browser flows](evidence/local-build-sync/browser-flows.json), [offline asset equality](evidence/local-build-sync/offline-assets.json), [stage-video checks](evidence/local-build-sync/stage-background.json).

Reviewed captures: [uploaded Aura Stone art](evidence/aura-stone-art/shared-equip-390.png), [manual skill choices](evidence/manual-skills-v2/three-choices-390.png), [multi-level EXP totals](evidence/xp-celebration/before-after-1440.png).
