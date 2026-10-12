# Development continuation

Current branch: codex/starfall-menagerie. Do not stage, alter or delete the pre-existing untracked expedition.js draft.

The user asked to continue milestones, save/push near 90% usage and resume when usage returns. The agent cannot inspect the user's quota percentage or wake itself after replenishment. Work is saved at validated checkpoints; a new user turn can resume from this file.

## Checkpoint v8

Native expedition integration is implemented. Open Starfall-Menagerie.html and start a New expedition for the six native starters; existing legacy saves remain valid. Nine native families, 69 total families, 146 skills, native courtyard rendering/weapon contacts, charge protection, held-weapon projectiles, family evolution bonuses and save schema-1 backup are connected to the full expedition.

125 tests pass. The native UI campaign clears all three planets with nine wins and exercises shops, gems, captures, evolution, reloads and reset growth. The rebuilt offline legacy fixture passes with zero external requests.

## Next work

Finish native-tactics.js (an unshipped helper under development), then connect hold/advance/flank/escort orders, two conditional rules, solid pillars, safe steering, projectile obstruction and live intentions. Add committed native skill windups with proper interruption, healing coordination, early build rewards and a practice encounter. Validate before pushing each stable slice.

Useful commands: npm test; npm run build:standalone; BASE_URL=http://127.0.0.1:3010 node tests/native-expedition.browser.mjs; BASE_URL=http://127.0.0.1:3010 node tests/standalone.browser.mjs. Start a fresh server with PORT=<unused> npm start; server whitelist changes require a restart. Browser tools use /usr/bin/chromium. Godot 4.6.3 uses scripts/check-godot.mjs with writable XDG directories under /tmp.

Tests and artifacts: playtest-artifacts/v8-all-tests.log, native-expedition-browser-report.json, v8-campaign-browser.log, v8-offline.log. Keep automated simulation separate from human playtime. No 9/10 claim has been established.
