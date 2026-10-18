# Pass 3: menus, collecting and rewards motion

This pass makes the permanent collection easier to browse, shortens equipment navigation on phones, integrates the uploaded rewards MP4 and improves delivery/test reporting. No creature anatomy, rig, palette or combat balance changed.

## Delivered behavior

| Area | Change | Evidence |
| --- | --- | --- |
| Menagerie | Search by discovered name, displayed element, role and rarity; sort by discovery, name, rarity, bond or element; combine with ownership/element filters. Input focus stays in the search field. Empty results have a working reset. Hidden family names remain undiscovered. | [Desktop](menus-source-1440-menagerie.png), [phone](menus-source-390-menagerie.png), [offline phone](menus-offline-390-menagerie.png) |
| Collecting | Visible family progress, larger portraits, discovered families first, and starter-point/bond rules in an expandable section. The collection hides the expedition-only relic/resource/breadcrumb strips. Phone element filters scroll within their own rail. | [Menu recording](menus-source-390.webm) |
| Equipment | Phone equipment uses paired fields. Sticky section shortcuts reach equipment, pouches and reserves. The close button remains reachable after scrolling; footer tools no longer cover the pouch contents. | [Phone expedition](menus-source-390-companions.png) |
| Outpost | Clear purchase destinations, wrapping supply/recruit rows, consistent touch targets and a one-column phone relic grid. Current-run defeat guidance describes starter priority, destroyed equipment and recovered stones; legacy rescue rules are preserved. | [Phone outpost](menus-source-390-shop-top.png) |
| Rewards MP4 | Uses the uploaded `enchanted_valley_post_match_loop_1080p.mp4`, with a 1920x1080, 24fps, 6.5-second delivery encode. Muted inline playback, two decoded players, a finished fade before handoff, viewport-sized cover framing, a 35% phone crop, contrast scrim, reduced-motion pause, poster fallback and decoder cleanup on close. Updating the reward dialog preserves its players. | [Desktop](rewards-source-1440-playing.png), [phone](rewards-source-390-playing.png), [offline phone](rewards-offline-390-playing.png) |
| Delivery | Embed the large intro/header-placeholder logo once, reuse the existing crest for the favicon, and enforce a 99 MiB build budget. The rewards movie is 1,823,947 bytes; the original upload is preserved. Main HTML is 98.749 MiB, 421,035 bytes smaller than Pass 2 despite adding the movie. Both offline build commands completed; Training Glade is unchanged. | [Measured sizes](delivery-size.json), [video provenance and exact encoding arguments](../../../public/ui/uploaded/rewards-valley.json) |
| Test workflow | `npm test` discovers files without a shell glob, limits concurrency to four files, streams one status per completed file and saves complete logs plus JSON timings. A five-minute per-file limit reports a timeout as a failure and stops its process tree. `TEST_WORKERS` and `TEST_TIMEOUT_MS` are configurable. | [Focused runner result](runner-targeted.json), [timeout cleanup smoke check](timeout.json) |

## Verification

- **19/19 targeted tests passed**, covering collection search/sort, journey/reward presentation, uploaded art identities, loadout outcomes and opening offers. [Output](targeted-tests.txt).
- **6/6 menu scenarios passed**, source and embedded offline at 1440, 768 and 390px: search focus, sorting, ownership, empty-result recovery, companion inspection, section shortcuts, persistent phone close button, paired phone equipment fields, a real outpost purchase, loaded crest/favicon and no horizontal page/dialog overflow. No page errors or failed asset requests. [Results](menus.json).
- **4/4 rewards-video scenarios passed**, source/offline at desktop/phone sizes. Each observes two actual loop handoffs at 1x, verifies decoded 1080p video, mute, an opaque incoming player and no promotion jump beyond surrounding crossfade motion, then tests dialog patch retention, OS reduced motion, playback resumption, an injected decoder-error poster fallback, and decoder cleanup after close. Offline external requests are blocked. [Measurements](rewards-video.json).
- **4/4 existing quick-equip scenarios passed** after the new movie: correct weapon follows the pointer, compatible fields highlight, cancellation/missed drops clean up, stones upgrade, reload/collection do not duplicate items, and gold art fits. [Results](reward-drag.json).
- **2/2 existing stage-select loop checks passed**, including actual file-based offline playback. The original absolute decoded-seam gate is unchanged. [Results](stage-loop.json).
- The new menu/media checks have an independent CI job, so unrelated failures in the full suite cannot prevent them from running. `npm run test:menus` rebuilds and runs the focused tests and all three menu/reward browser checks. Start `npm start` first; `BASE_URL` and `CHROMIUM_PATH` select another server/browser.

Normal-speed rewards recordings: [desktop](rewards-source-1440.webm), [phone](rewards-source-390.webm). [Decoded desktop playback](decoded-desktop.png) was reviewed alongside the original and delivery-encoded movie frames at native resolution. The original upload and the delivery encode retain the same painting, dimensions, frame rate and duration; the delivery encode uses lossy H.264 compression. Run `npm run build:rewards-video` with `FFMPEG_PATH` pointing to an FFmpeg build with libx264 to reproduce it.

The new movie has more frame motion than the stage-select clip. Its seam check therefore measures each promotion against its own preceding blend frames, records the decoded incoming frame movement, and requires opacity 1; it does not copy the stage clip's unrelated absolute motion threshold. Stage-select assertions were preserved.

## Full-suite findings and limits

The full 61-file audit attempted all pre-existing tests with four workers. **55 files passed**, two reported assertion failures, and four exhaustive art files exceeded the initial 120-second cap. With the final 300-second cap and two workers, companion-parts, companion-deformation and legs-v3 passed; grand-forms still exceeded 300 seconds. Combined, **58 of the 61 pre-existing files completed successfully**. The new menagerie file also passes. [Initial audit](suite-initial.json), [exhaustive retry](suite-art-retry.json).

Outstanding findings are preserved, not weakened or reclassified:

- [Crab contact regression](combat-spacing-failure.txt): Coalcrab and Mireclaw do not register authored melee contact in the exhaustive form/facing fixture.
- [Linked-counter regression](linked-counter-failure.txt): the unlinked baseline already wins, contradicting that legacy test's expected baseline defeat.
- `grand-forms.test.js`: the exhaustive cell sweep did not complete inside the five-minute per-file budget. Increase `TEST_TIMEOUT_MS` for a longer audit; this pass does not claim it passed.

This is a menu/media delivery pass, not evidence that every game factor is now 9/10. No combat assertion, anatomy threshold or source sprite was changed to obtain these results.
