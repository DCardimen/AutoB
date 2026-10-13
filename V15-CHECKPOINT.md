# V15 continuation and recovery

The recovery checkpoint was pushed as `52e8a6baa0a6fc18a4a60f0840e872a4baaf7c0a` on `codex/expedition-depth-v15` while the chat repeatedly disconnected. Later commits on this branch complete its validation and packaging. Read FIELDCRAFT-V15.md, CONTINUATION.md and tests/reports/fieldcraft-v15.json for current state. Always create a NEW PR; never reuse PR #1. Do not push/deploy the released branch. Preserve the untracked expedition.js unchanged and unstaged.

Current checks: full unit run 196/196; final affected checks 91/91; nine current browser scenario groups pass. Real touch equipment transfer and both native/legacy embedded offline battles pass. Legal Explorer and Standard campaigns grow from two starting points to six companions and clear three planets through actual UI decisions, without stat or outcome overrides. The attempted Chaos 1 policy lost on the first planet; its full-clear check remains failing and broader sampling is pending. This does not establish a fifty-hour human playtest or objective 9/10 fun score.

The checkpoint's inconsistent reward-sort prediction is fixed with a seeded Fisher–Yates shuffle. Equipment rewards now have browser proof of choice, ownership and exact-once reload persistence. Loadout refresh no longer animates its entrance again during rapid item transfers. Earlier failed nonadaptive campaign policies remain historical balance evidence; do not describe those as passing.

public/Starfall-V15-UI-V2.zip is the current playable package. Open Starfall-Menagerie.html for the game. The Training Glade remains the separate movement lab. Completed Art V3 masters and the requested 30% arena baseline / 150% type cap remain.

Git push and authenticated PR creation now work. NEW PR #2: https://github.com/DCardimen/AutoB/pull/2, targeting codex/starfall-menagerie. The earlier API/network diagnosis was superseded by the successful gh pr create operation; no further network approval was needed for it. Keep using the platform proxy/authentication. A plugin cannot repair chat transport; the Git checkpoint and this handoff make continuation recoverable in a fresh chat.
