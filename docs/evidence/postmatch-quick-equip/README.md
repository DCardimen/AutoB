# Postmatch quick equip

Companions sit to the left of the rewards on desktop, with five compact equipment fields and the companion's rarity-based aura fields. Hovering or holding a reward highlights compatible fields and shows a recommendation for each companion. The reward's arrow button equips on the best compatible companion; dragging selects the companion or exact field directly.

Green ↑ means an empty compatible field or strictly better comparable stats. Orange ? means equal stats, a trade-off, or conditional effects that need build context. Red × means weaker comparable stats or unavailable equipment. Advice never prevents an intentional, legal drag replacement. Aura comparisons recognize stronger tiers of the same effect; different auras need consideration.

Individual claims and complete-chest claims share a persistent ledger. Failed drops do not collect anything. Same-item rolls and occupied aura fields can be replaced while retaining the displaced item's identity and stats. Already equipped reward cards can be dragged between companions.

Validation: 49 focused rule/EXP tests pass. Source and offline browsers at 1440px and 390px pass hover, five fields, direct drag, one-click stone replacement, individual claim, reload persistence, no duplication, and layout containment with zero page errors. Existing EXP browser coverage also passes all four combinations, including three real level crossings, replay, reduced motion and reopening. Both offline files build; main file remains below 100 MiB.

- [Browser measurements](browser.json)
- [Desktop hover](source-1440-hover.png) · [desktop equipped](source-1440-equipped.png)
- [Phone hover](source-390-hover.png) · [phone equipped](source-390-equipped.png)
- [Offline desktop](offline-1440-equipped.png) · [offline phone](offline-390-equipped.png)
- [Normal-speed interaction recording](quick-equip-normal-speed.webm)
- [Focused tests](unit-tests.txt)
