# V15 recovery checkpoint

This commit preserves the current Fieldcraft / UI V2 implementation while the chat is repeatedly disconnecting. **It is not the final quality-approved release.** Continue on `codex/expedition-depth-v15`; create a new PR, never reuse PR #1. Do not deploy or push the released branch. Preserve the untracked `expedition.js` unchanged and unstaged.

The full unit run passed 196 tests; the latest affected suite passed 91. The first eight browser scenario groups passed. Real touch equipment transfer and native/legacy embedded offline combat passed. Current source adds occasional character equipment reward choices and lower gear prices; the final standalone/ZIP still need rebuilding after validation.

Known unfinished checks:

- The new equipment reward browser scenario fails because Node and Chromium predict different reward options from the random sort comparator. Replace reward sorting with a deterministic seeded shuffle, preserving two choices, and rerun. The effect and exact-once item transfer need the final browser proof.
- Legal bot campaign policies have not cleared all three worlds under the harder rules. Some clear the first planet and fail on the second; others fail earlier. This is a balance investigation, not evidence for a human fun rating. Do not call these campaign checks passing.
- `tests/reports/fieldcraft-v15.json` records checkpoint evidence. Update it to final evidence, then refresh FIELDCRAFT-V15.md / CONTINUATION.md, rebuild both necessary artifacts, and package `public/Starfall-V15-UI-V2.zip`.
- Git push works. GitHub API destination access remains blocked. A saved additive `api.github.com` environment network rule needs user review/save/publication before retrying API-based new PR creation. Do not bypass the proxy or extract authentication.

The completed Art V3 masters and requested 30% arena baseline / 150% type cap remain. No fifty-hour human playtest, final 9/10 rating, or completed campaign balance claim is made.
