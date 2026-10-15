# Expedition team selection

The first visit and **New expedition** now open the supplied forest team-selection composition: challenge choices on the left, companion cards on the right, and a party/points/start bar below. Gold frames, the forest backdrop, start button, icons, and foreground foliage come from the uploaded artwork. The foreground layer overlaps the side and lower panel borders without intercepting controls.

## Companion cards

Cards have opaque backgrounds and different scenery for Ember / Fire (warm woodland), Grove / Grass (flower meadow), Tide / Water (aquatic bed), Storm / Lightning (charged stone), and Void / Shadow (twilight log). Sprites face the viewer, use the existing idle renderer, and rest near the bottom of their scenery immediately above the role badge. A union of all 16 idle samples trims only transparent padding; it preserves painted pixels, equipment, horns and feet. Category bonuses, actual bond-adjusted point costs, and captured elite choices remain beside each companion.

The top of the companion section contains point-cost and elemental-type filters, plus cost ascending/descending, elemental-type, name, and featured sorting. Filters combine, show a useful empty state, and preserve the party and elite choices. The party bar permits removing a selected companion while its card is filtered out.

Chaos rules and the companion collection scroll independently. Field notes explain capture timing, permanent elite inheritance, points, rarity costs, bonds, cumulative Chaos rules, starlight, and the third-place unlock. The displayed bonuses and budgets use the existing game rules.

## Visual review

- [Uploaded reference](evidence/team-select/reference.png)
- [Current desktop](evidence/team-select/team-select-desktop.png) and [offline desktop](evidence/team-select/team-select-offline-desktop.png)
- [Mobile section top](evidence/team-select/team-select-mobile.png) and [mobile party controls](evidence/team-select/team-select-mobile-party.png)
- Category scenery: [Ember](evidence/team-select/team-select-type-ember.png), [Grove](evidence/team-select/team-select-type-grove.png), [Tide](evidence/team-select/team-select-type-tide.png), [Storm](evidence/team-select/team-select-type-storm.png), [Void](evidence/team-select/team-select-type-void.png)
- [Original/front-idle and UI comparisons at native, 2× and 3× size](evidence/team-select/team-select-idles.png)
- [Normal-speed idle recording](evidence/team-select/team-select-idle.webm) and [decoded video frame](evidence/team-select/team-select-video-frame.png)

Reviewed the existing base forms of Cinderfox, Mossguard, Brookfin, Voltwing, Pyrehorn, Bloomkin, Aurel, Brakk, Syl, Nyra, Emberhound, and Rowan in the front-facing idle. The five scenery specimens additionally include Duskcap. This changes their menu presentation; source sprite data, anatomy, gait rigs, equipment bindings, palettes and evolution forms are unchanged. The reference's illustrated creature examples are replaced by the actual game's front-facing sprites and live names, costs and bonuses. Additional information and filter controls require scrolling the full roster; no numerical “99%” visual-match score is claimed.

## Validation

- `node tests/team-select.browser.mjs`: source and embedded offline builds pass first-visit selection, empty/over-budget parties, all five opaque category backgrounds, grounded idle placement/animation, combined filters, empty results, all sort modes, preserved selections, active synergies, all 20 Chaos rules, elite inheritance, desktop/mobile layout, and live combat. The offline pass blocks non-navigation network requests.
- `node tests/arena-elite.browser.mjs`: source and offline combat capture, permanent elite archive, reload idempotence, next-run choice, and mobile layout pass.
- Focused game/art regression run: 46 tests pass across native tactics, elite modifiers, Chaos combat, gaits/carry and sprite colors.
- Both offline HTML files rebuilt successfully. The Training Glade rebuild is unchanged.
- Browser reports: [team selection](evidence/team-select/team-select-browser.json), [elite capture/combat](evidence/team-select/arena-elite-browser.json).

`scripts/prepare-team-select-art.py` reproduces UI slices from the supplied `download (9)` through `download (14)` sheets in Downloads (or a directory passed as its first argument). It does not change creature artwork. The pre-existing `expedition.js` draft was not edited, staged or deleted.
