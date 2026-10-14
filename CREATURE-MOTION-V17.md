# Creature Motion V17 · application 0.13.0

V17 addresses movement, attachment, loadout, deployment and route-selection feedback in one new feature branch, `codex/creature-motion-v17`, based on the V16 commit `ddc57f3`. The prior PR #4 is merged. This change is delivered through a new PR.

## Creatures and combat presentation

- Humanoid shoulders, elbows, hands, weapon grips and secondary grips now share a torso-relative projection. Arms are drawn separately, with front/rear depth ordering. Thighs and shins use separate sections with a shared knee.
- The source atlas keeps a stable cell transform across ordinary poses. A moving weapon no longer causes the painted body to resize independently. Fallen bodies use a gradual ground alignment within the same cell.
- Bow users crouch into a full draw, hold the string with the pulling hand, release it quickly, and settle through recovery. Fallen bows lie along the ground. New-rule melee commitments are 12% longer; ranged windup/recovery follow the projectile release queue.
- Walking and attack poses sample 32 frames. A separate render interpolator blends fixed-step positions, gait, action time, planted feet, cape nodes and ragdoll joints. Hit logic, cooldowns and collision simulation remain deterministic.
- All 89 families animate before battle. Authored hair keeps its own palette across equipment and evolution recolors. Weapons use a more compact silhouette and metal colors sampled from the directional artwork.
- Pixel alpha stays binary, source cells stay 64 × 64, and all canvas scaling uses nearest-neighbor sampling. Source-foot ownership and decoded colors are cached; cached frames skip rig construction.

## Builds and deployment

- Current runs use rules version 17. Saves back up schema 6 once, then upgrade to schema 7. Existing items retain their IDs and inventory identity.
- The thirty personal skill supports become thirty whole-creature relics: conditional protection, poison, execution, shield breaking, echoes, dodge rewards, lifesteal, healing suppression, stamina and cooldown recovery, lethal survival, and tradeoffs. There are no skill-link selectors or skill support drops in the current UI. Historical rule fixtures retain their old APIs.
- All beneficial equipment triggers affect the wearer. Ally-targeted shield/heal/haste/armor/cleanse/overflow equipment procs now route to the wearer. Equipment still increases the wearer’s ordinary skill and healing output.
- Both recruit purchase paths and existing companions initialize armor, three base equipment slots and one additional slot per evolution. Legendary frames, a crown label, a ground constellation and colored role badges distinguish rarity and function.
- A reserve tray sits immediately below the team. Drag a reserve onto a deployed creature to swap, or onto an unlocked empty place to deploy. Identity, equipment and relics stay with the individual; replacements inherit the deployment position.
- Pregame overhead AI selectors include Nearest, Hunt healers, Break armor, Protect, Finish wounded and Adaptive. Predicted target lines use the actual battle target selector, including taunts, orders and AI relics. Opening stats compare both teams before commitment.

## Capture, planets and results

- Optional auto retry waits **three combat seconds after a failed lattice breaks**, uses the highlighted capturer, and repeats up to the existing three-throw round cap. Pausing stops the countdown. Missing tools, a dead target, full reserves or success stop retries. Manual throws cannot overlap a capture animation.
- The star chart has separate Verdant ruins, Cinder badlands and Astral tundra illustrations, planetary previews, biome descriptions and larger node spacing. Existing route connections and scouting limits remain authoritative.
- Results show per-creature EXP gained, carried progress, level increases, seven side-by-side team comparisons, existing per-creature charts and the knockout timeline. Reports persist after reload.
- Dialog updates preserve page and dialog scroll; focus uses `preventScroll`. Outside taps and Escape dismiss dialogs, including rewards, which can be reopened without losing their state. Settings restore the previous dialog’s scroll.

## Review and verification

The current machine-readable report is `tests/reports/creature-motion-v17.json`. Review the accompanying team/map/recap screenshots and `public/creature-motion-v17-preview.webm`. The video shows ten body types in idle/run/attack/cast poses and front/rear facings.

Commands:

```sh
npm test
PORT=3031 npm start
BASE_URL=http://127.0.0.1:3031 TEST_OFFLINE=1 node tests/creature-motion-v17.browser.mjs
BASE_URL=http://127.0.0.1:3031 node tests/expedition-v15.browser.mjs
BASE_URL=http://127.0.0.1:3031 node tests/arena-feel.browser.mjs
npm run build:standalone
npm run build:prototype
```

The automated checks establish rendering bounds, attachments, state changes and tested browser interactions. They do not establish a fifty-hour human playtest, a universal frame rate, or a numerical fun score. Legendary/equipment balance and long Chaos campaigns still need player feedback.

The pre-existing untracked `expedition.js` draft is unchanged and excluded from this PR. Its SHA256 is `a4c0ad756a781f8f223e34c1f9cd22d79e9fe47bff81d8ee951f47a16d987ea1`.
