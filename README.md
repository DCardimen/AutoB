# Starfall Menagerie

A playable, single-player creature-collecting roguelike autobattler. Explore three planets, build a six-creature expedition, socket skill support gems, and carry captured creatures into future runs.

## Play without installation

Download this branch using GitHub's **Code → Download ZIP**, extract the ZIP, and open `Starfall-Menagerie.html` in Chrome or Firefox. The standalone file includes all game code, artwork, and fonts; it needs no server or internet connection. Keep the file in the same location to retain its browser-local save. It is a snapshot of the current game; edits to the source files below do not automatically update it.

## Run locally

Requires Node.js 20+ and a modern browser. There is no build step or external service.

```sh
npm ci --cache /tmp/autob-npm-cache
npm run dev
```

The development server listens on port 3000. Set `PORT` to choose another port. Gameplay, art, and fonts are served locally; the game has no runtime CDN dependency.

## The game

- **20 collectible creatures**, five elements, five rarity tiers, and four combat roles.
- **48 distinct abilities**: 20 signature auto-attacks and 28 cooldown skills. Creatures start with two or three active skills. At level 5, Common and Uncommon companions awaken, gain 20% stronger base stats, and unlock a third active skill.
- **12 skill support gems**: socket them on an individual creature and choose which auto-attack or active skill each supports. Multiple different supports can modify the same ability. Spell Echo repeats casts, Convergence adds targets or radius, Acceleration reduces cooldowns, and other supports add roots, poison, explosions, healing, shielding, or evasion.
- **Rarity-scaled sockets**: Common 1, Uncommon 2, Rare 3, Epic 4, Legendary 5. Unsocket and relink freely between battles. A creature cannot equip two copies of the same support.
- **9 expedition relics** with team-wide effects, distinct from individual support gems.
- **Three branching planet routes**, each with six encounters: battles, elites, wild sanctuaries, shops, events, rest stops, and bosses. Paths connect neighboring lanes. A boss must be defeated to advance; losing a normal battle costs a life and allows a retreat forward.
- **Persistent captures** unlock future starters. Each new run begins at level 1 with a fresh economy and a six-creature, 12-point starter budget. Rarer starters cost more points.
- **Real-time combat** with role-aware targeting, ranged kiting, hazard avoidance, taunts, shields, healing, elemental synergies, status effects, critical hits, and phase-two bosses. Skill trails, dash streaks, lightning, shockwaves, damage numbers, particles, and attack lunges communicate the action.

Two creatures of an element activate a team bonus; four activate a second bonus. Allies recover fully between encounters. EXP, training, support gems, and relics remain for the current run; successful captures remain across runs.

The starter pack contains three support gems. Inspect a creature or open the relic pack to equip them before your first battle.

## Controls

- **Creature card**: inspect abilities, change training focus, socket/relink support gems, or swap a bench creature.
- **Drag creature cards**: change lanes within the formation. Roles determine frontline or backline placement.
- **Balanced / Hunt / Guard**: change the team's targeting priority before combat.
- **Space**: pause/resume. **1 / 2 / 3**: battle speed.
- **Star chart**: select an available encounter.
- **Menagerie**: inspect permanent discoveries and build new starter teams.
- **Sound button**: optional synthesized effects; no audio autoplay.

## Saves

The run and collection use browser `localStorage` on the current origin. Capture attempts and reward choices persist so reloading cannot repeat those rewards. Refreshing during an active battle restarts that encounter from preparation. Clearing browser storage or moving to another origin removes access to that device's save; cloud accounts and cross-device sync are not implemented.

## Validation

```sh
npm test
npm run test:browser   # start npm run dev in another terminal first
npm run playtest      # defaults to 50 simulated combat-hours
```

Browser checks use Playwright and `/usr/bin/chromium`; set `CHROMIUM_PATH` if needed. The game itself has no package dependencies. Playwright is a development dependency only.

The simulation harness generates varied seeded teams, skill links, rarities, expedition relics, planets, and encounters. It checks termination and finite health, shield, and position values. `SIM_HOURS=1 npm run playtest` runs a shorter sample. Results and browser screenshots are written to the ignored `playtest-artifacts/` directory.

See [PLAYTEST.md](PLAYTEST.md) for the actual results and critique. Automated combat-hours are not human playtime and do not establish a subjective fun score.

## Source map

- `game.js`: progression, economy, capture, equipment, and combat rules.
- `skills.js`: the 48-ability catalogue and creature loadouts.
- `app.js`: browser UI, run state machine, local persistence, and input.
- `art.js`: painted sprite-sheet rendering, procedural fallback art, arena, and combat effects.
- `public/`: locally served generated artwork and vendored fonts. Fonts retain their upstream licenses.
- `tests/`: rules tests, browser playthrough, and simulation stress harness.

The creature sheet and arena artwork were generated for this project. The game is inspired by creature-collecting roguelikes and tactical autobattlers; it uses its own creatures, names, art, and systems.
