# Native Expedition v12 · Grow the menagerie

Application 0.8.0. Open **Starfall-Menagerie.html**, then **New expedition** for the two-companion progression. Existing six-member saves keep their teams and saved route. The Training Glade remains the v7 movement lab; the new gameplay is in the main game.

## Rules and decisions

| System | Implemented behavior |
|---|---|
| Starting team | Two selected base-form level-1 creatures; twelve rarity points, thirteen after Chaos 1. |
| Team growth | Third place at combat win 3, then places at wins 6 / 9 / 12, capped at six. Hiring permits become purchasable after win 3 and accelerate later growth. |
| Early encounters | First three ordinary rounds have two or three level-1 unseasoned enemies. Most compositions introduce melee pressure; occasional control, ranged or support combinations are dangerous. |
| Individual choices | Six seeded natures and wide HP, attack, speed and cooldown-time rolls. Captures retain the individual’s rolls during this run. Recruit offers show actual stats before purchase. |
| Routes | Eight rooms per world, widths of one to four nodes, explicit one-to-four outgoing connections. All destinations are reachable. Four rooms are scouted by default; unknown node types/counters remain hidden. Scouting and limited warp relics change planning. |
| Enemy relics | Seeded combat buffs scale with Chaos, elites, bosses and planet. Overhead icons show names/descriptions and open the creature inspector. Capturing retains the enemy’s curios as bound equipment. |
| Deployment | Drag a head, limb or weapon on the arena. The grabbed particle is pinned while anatomical constraints and gravity move the remaining body. Moving the cursor creates trailing inertia. Drop ragdoll/get-up, allied-half limits and saved placement are connected. Edits stop during combat. |
| Capture planning | Overhead diamond selects a target; configure 15–75% HP and a capturer. Mercy holds back 14% team damage, Swift 6%, until the attempt. Estimated odds exclude unknown future status bonuses. |
| Capture odds | Basic odds are half the old baseline. Scout / Runic / Astral / Mythic tools multiply the halved chance by 1 / 1.3 / 1.6 / 1.9, capped at 85%. Low health, statuses and capture relics modify odds. |
| Capture encounter | Crossing the threshold triggers an automatic 1.8-second angular lattice scene while combat runs at 18% speed. The reserved tool and resolved result survive reloads. Planet bosses cannot be captured. |
| Capturer economy | Four tiers in shops; stronger tiers in elite/boss caches. Returning Prism refunds failed attempts at its stated chance, exactly once. Events spending capture resources synchronize the tier inventory. |
| Loot | Per-enemy seeded drops, coin fallback, equipment and stronger tools for difficult fights. A brief ground-drop celebration precedes an explicit cache claim. Reload ledgers prevent duplicate grants. |
| Defeat | One random deployed starter dies for this run. Once no starter is deployed, another deployed creature is selected. All worn gear, bound curios and linked gems disappear. One additional owned expedition relic, or packed support gem if none remain, is destroyed. A death/X/item-shatter presentation and team-seat X are saved. Permanent family unlocks remain. |
| Protection | The new guaranteed casualty supersedes the old rarity rescue, hospital and survival-drill system. Combat revival relics still help win battles, but never cancel a settled run casualty. |
| New relics | 100 unique additions, for 124 total. Twenty route/economy/capture, seventy combat hooks, ten flat bonuses. See [the full catalogue](RELICS-V12.md). |

V11 pixel-only families, scaling, capes, equipment/evolutions, skill gems, physics contacts, charge protection and damage text remain. Backpedalling is slower in V12 physical combat so ranged creatures cannot retreat at their full forward pace while melee pursues.

## Verification

The acceptance report is [tests/reports/expedition-v12.json](tests/reports/expedition-v12.json). Raw browser reports, screenshots and logs are in ignored `playtest-artifacts/`.

- **174 unit tests pass**, including seventeen dedicated V12 scenarios. The core suite and dedicated scenarios verify growth, all graph destinations, capture reservations/thresholds/refunds, permanent loss and item destruction, exact-once loot/recruitment, stat variance, relic conditions, overheal/cleansing, held grip connections and old route migration. Every new combat-hook definition is exercised in a suitable condition, alongside integrated poison, echo, healing, dodge, death and economy tests.
- Forty seeds under each of two opening policies: default first-round wins 37/40; prepared 38/40. Three ordinary rounds cleared 27/40 and 30/40 respectively. Teams stay at two throughout that opening sample and choose legal victory upgrades. This is an 80-run automated sample, not a difficulty guarantee for every pair or route.
- Standard and Chaos 1 browser campaigns each grow two starters (Brakk/Nyra) into six through captures and purchases, clear all three planets and recover from a boss casualty by using reserves. They use real combat steps and legal UI actions, with no granted resources or combat stat overrides. Each has 16 battles, 15 wins and one permanent casualty. Earlier attempts with a two-melee team exposed the need for a different build/route rather than assuming all starts perform alike.
- Twelve late-battle relic fixtures at Chaos 5 / 10 / 20 complete with finite positions, health, stamina and damage. Poison, repeated spells, dodge feedback and healer/revival builds use actual curio procs.
- Browser acceptance covers body-part pickup/drop, saved deployment, capture lattice and slow motion, enemy buffs, mobile width, hidden map details, cache ownership, death X and reload protection.
- Fresh native and migrated older pixel collections run from the embedded HTML with zero external requests using the exact embedded HTML. Direct `file://` automation is blocked by this managed Chromium policy; that optional origin check is not claimed as passed. Roster/evolution/equipment, live cloth, victim text, formation/rules, practice comparison and mobile regression checks pass. The Training Glade’s browser scenarios remain valid.

Automated campaigns and simulations verify mechanics and bounded outcomes. They do not establish fifty human playtest hours or a subjective 9/10 fun rating; broad relic balance and player reception still need real sessions.

## Development

```sh
npm ci --cache /tmp/autob-npm-cache
PORT=3014 npm run dev
npm test
npm run build:standalone
BASE_URL=http://127.0.0.1:3014 npm run test:expedition
node tests/expedition-v12-balance.mjs
```

Use an unused port. Server whitelist changes require a new process. Chromium is `/usr/bin/chromium`. Preserve pre-existing untracked `expedition.js`.
