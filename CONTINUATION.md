# Development continuation

Current branch: codex/starfall-menagerie. Do not stage, alter or delete the pre-existing untracked expedition.js draft.

The user asked to continue milestones, save/push near 90% usage and resume when usage returns. The agent cannot inspect the user's quota percentage or wake itself after replenishment. Work is saved at validated checkpoints; a new user turn can resume from this file.

## Checkpoint v8

Native expedition integration is implemented. Open Starfall-Menagerie.html and start a New expedition for the six native starters; existing legacy saves remain valid. Nine native families, 69 total families, 146 skills, native courtyard rendering/weapon contacts, charge protection, held-weapon projectiles, family evolution bonuses and save schema-1 backup are connected to the full expedition.

125 tests pass. The native UI campaign clears all three planets with nine wins and exercises shops, gems, captures, evolution, reloads and reset growth. The rebuilt offline legacy fixture passes with zero external requests.

## Checkpoint v9

Native Expedition v9 / application 0.5.0 adds four formation orders, two prioritized conditional rules, seeded pillars with steering and shot/beam blocking, live intentions, committed 0.38-second skill channels and cancellation, healing reservations, living knockdown/get-up, build practice with real baseline/loadout comparisons, exclusive opening relic doctrines and native recruitment/evolution explanations. Brakk's signature has actual shield bypass. Shared animation changes preserve the accepted Training Glade.

139 tests pass. The final native browser campaign clears all three worlds with nine wins; controls/practice/reload/mobile checks pass. Legacy arena, native/legacy embedded offline combat and the Training Glade's ten browser scenarios pass. A 36-run first-planet bot sample clears Explorer 12/12, Expedition 12/12, Veteran 7/12. This is one policy and a small sample; no human playtime or fun rating is established.

## Next work

1. Implement a bounded defeat replay and highlight decisive hits, lost channels and counterplay. Keep settled results and save data unchanged during replay.
2. Run multiple legal build/routing policies across difficulty and Chaos. Standard looks forgiving in the current 12-seed policy sample; investigate tactics and encounter composition before simply raising stats.
3. Implement family mastery, prepared rare hunts, bounded failed-capture extraction and pre-expedition capture kits, with reload/exact-once tests.
4. Add connected route objectives/stories, alternative bosses and route-dependent boss preparation.
5. Continue distinct evolution/roster art batches after gameplay review. Current native evolved looks primarily change palette and behavior, and bosses use representative bodies.

## Verification and files

Commands: npm test; npm run build:standalone; BASE_URL=http://127.0.0.1:3011 npm run test:native; BASE_URL=http://127.0.0.1:3011 node tests/prototype.browser.mjs. Start an unused port with PORT=<port> npm start; whitelist changes require a new server. Chromium is /usr/bin/chromium. Godot 4.6.3 uses scripts/check-godot.mjs with writable XDG directories under /tmp.

Evidence: tests/reports/native-expedition-v9.json and tests/reports/native-first-planet-v9.json. Raw logs/reports/screenshots are under playtest-artifacts/v9-*. Playable artifact: Starfall-Menagerie.html. Video: public/native-expedition-preview.mp4. Package: playtest-artifacts/Starfall-Native-Expedition-V9.zip. Existing untracked expedition.js remains untouched.

The agent cannot read the user's quota percentage or resume itself on a timer. The user can send a new continuation message after usage replenishes; continue from this checkpoint without restarting completed milestones. The current branch is codex/starfall-menagerie.
