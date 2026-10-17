# Separate, granted evolution skills

Regular spells retain their existing level-based limit: the family signature plus choices earned at levels 3, 5 and 7, up to four cooldown spells. Evolution automatically grants the selected path's stage skill in a separate bonus slot. Ascension grants a second bonus. Neither consumes, replaces or suppresses a regular spell or its level-up choice.

The Skills menu counts regular spells independently and places the granted skills under **Evolution bonuses**. Evolution reveal/help text describes the automatic grant; the old choice/replacement prompt is removed.

Existing saves preserve earlier evolution selections, complete pending selections, restore archived spells displaced by the shared cap, and grant any missing stage bonuses. Previously dropped level choices are offered again when there is a free regular slot. Migration runs once and remains idempotent. If a displaced spell has since been learned at another quality, its archived version stays in history instead of occupying a second regular slot. Conflicting old offers are refreshed. Enemy preparation and captures preserve the same separate bonuses.

## Evidence

- [Four regular slots after evolution](first-evolution-1440.png)
- [Two separate granted bonuses](second-evolution-1440.png), [phone layout](second-evolution-390.png)
- [Recovered existing save](migrated-1440.png), [phone save](migrated-390.png)
- [Source live combat](combat-1440.png), [phone combat](combat-390.png)
- [Normal-speed choices, both evolutions and combat recording](evolution-bonuses-normal-speed.webm)
- [Eight browser results](browser.json), [37 passing unit checks](unit-tests.txt)

The browser suite exercises fresh runs and saves paused at the old replacement prompt at 1440px and 390px, in source and direct `file://` offline builds. It verifies saved level offers, all three learned spells surviving both transformations, no replacement prompt, the separate menu, reload persistence, six live cooldowns, both bonus cast calls and finite combat stats, without page errors. Screenshots were reviewed after the dialog's fade completed.

Unit coverage includes every evolvable native family on both paths, accomplishment evolution at level 3, regular cap enforcement, pending/displaced/archived save recovery, duplicate-quality migration, deterministic enemy skills and captures.

```powershell
node --test tests/game.test.js tests/evolution.test.js tests/manual-skills-v2.test.js tests/evolution-bonus-skills.test.js
npm run build:standalone
npm run build:prototype
node tests/manual-skills-v2.browser.mjs
```

Both offline files rebuilt. Creature artwork, anatomy, palettes, gait and attachment rendering are unchanged; this change concerns spell grants, save migration and menu presentation.
