# Playtest evidence and critique

This is a playable first version, not a claim of a finished 9/10 game. Automated simulations and browser automation do not replace human playtesting. No 50-hour human playtest or defensible subjective 9/10 rating was completed.

## Completed checks

- **16 rules tests passed**: all 48 ability definitions and loadouts, rarity-scaled socket capacity, equipment ownership, valid skill links, multiple supports on one skill, executed Spell Echo, additional Convergence targets, Fortification, every active skill's executable effects, route reachability, capture economy, sanctuary bonus, purchase limits, EXP, boss phases, level-5 awakening, and finite combat state.
- **Full browser expedition completed**: all three planets and all three bosses, with nine actual rendered battles on a route that also visited shops, events, and rest stops. The starter team used three equipped support gems. Captures increased the permanent collection from 6 to 11 creatures during that run.
- **Browser interactions verified**: socketing and relinking a gem, pause/resume, battle speeds, reward choices, shop purchases and gold deduction, event choices, recovery/training, capture attempts, persistence on reload, preventing a second capture attempt, restarting with a preserved collection and level-1 team, and mobile layouts at 390px without horizontal overflow. No uncaught browser exceptions or failed HTTP responses occurred in the recorded run.
- **Separate boss-loss regression passed**: a deliberately underpowered expedition lost a boss fight, consumed exactly one life, stayed on the same planet and encounter, and retained the retry state after reload. The boss health display appeared.
- **50.002 simulated combat-hours completed** across **13,156 seeded battles**, evenly distributed over all three planets. This was 180,007.55 seconds of game simulation, executed in about 226 seconds of machine time. It is explicitly not 50 hours of human play.

The stress run generated varied creatures, levels, training, team relics, support gems, and skill links. All battles terminated with finite health, shield, and position values. There were **zero 90-second timeouts**, 426,989 cooldown-skill uses, 118,719 recorded dodges/avoided hazards, 17,813 echoes, and 57,382 critical hits. Mean battle duration was 13.68 game seconds; the longest was 76.35 seconds.

The stress sample's 84.2% ally win rate is **not a campaign difficulty measure**: its random teams were not restricted by starter-point budgets and sometimes used multiple powerful Legendary creatures. It demonstrates engine stability and interaction coverage, not a desired player win rate or a fun score.

Generated JSON evidence and screenshots live in the ignored `playtest-artifacts/` directory. The repeatable harnesses are checked into `tests/`.

## Critic's assessment

**The strongest part is building a creature, not just a team.** Linking Echo and Corruption to a delayed area skill produces a different fight from putting Acceleration and Restoration on a heal. More sockets make a rare capture valuable without requiring every rare creature to be an automatic replacement. Supports can be reassigned freely, so discovery invites experimentation.

**The economy creates useful tension.** Gold spent refreshing a shop cannot buy an expedition relic or another companion. Choosing training instead of a support gem improves immediate consistency but gives up a more expressive build. Capture orbs compete with resource-producing rewards and event trades. The 12-point starter budget prevents filling future runs with six Legendary creatures.

**Growth now has a visible milestone.** Early balance checks found that basic starter teams fell behind late bosses. Common and Uncommon creatures now awaken at level 5 with stronger stats and a third active skill. Boss losses no longer incorrectly advance the expedition. Sanctuaries now offer a rare target and an actual capture-chance bonus.

**Combat is legible at normal speed and expressive with supports.** Painted creature art, telegraphs, projectile trails, lightning links, dash streaks, impacts, damage numbers, status indicators, healing rings, cooldown icons, and boss health/phase indicators communicate different actions. The browser run verified that these systems are connected to real damage and effects.

## What still needs human playtests

- Whether the first few fights teach socket links and elemental bonds clearly enough without opening the help panel.
- Whether the safe shop/event/rest route is too consistently attractive compared with elites and capture paths.
- Whether freely moving gems between creatures removes too much commitment, and whether starter budgets produce enough interesting team tradeoffs.
- Whether rare captures feel exciting after many failed or repeated discoveries, and whether the Legendary capture probabilities are fair over longer sessions.
- Whether some damage/Echo/area combinations crowd out defensive supports.
- Whether effects remain readable during dense late-game fights, especially at 3× speed and on small screens.

The content ceiling is still modest: 20 creatures, three worlds, three event stories, and fixed route archetypes with seeded opponents and shops. Creature art is rendered as painted sprites with motion, lunges, and effects; it does not have bespoke frame-by-frame or skeletal animation. Deeper event variety, evolving map layouts, additional enemies, richer creature animation, player telemetry, and sustained human sessions would be needed before assigning a release-quality fun score.
