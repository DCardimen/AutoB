# Aura Stones

Thirty role-specific Aura Stones replace personal Awakening Stones. Rarity limits are Common 0, Uncommon 1, Rare 2, Epic 3 and Legendary 4, without evolution bonuses. Each tier above IV increases potency by 20%. Boss stones are Tier I; elite stones follow the elite's tier; ordinary Rare/Epic/Legendary enemies provide III/II/I stones.

Normal enemies have a 20% stone chance and elites 60%. Socketed stones are active during combat and drop on defeat. Common enemies cannot equip stones but can drop loose Tier IV stones. Bosses carry three. Early elites are limited to one stone per carrier. Shops sell Tier IV stones at their regular catalog price.

Steady auras recalculate with ground distance, allegiance and living state. Timed auras provide local cooldown resets, current-HP healing, shields, haste, stamina or cleansing. Identical auras use the strongest tier, including timed auras; different effects combine with stat caps. Saved items preserve their UIDs and tier; items incompatible with the new limits return to inventory.

Validation: 36 Aura Stone cases cover every definition, tiers, distance, restrictions, migration, carry rates, drops and capture claims. The companion/equipment regression checks pass. Browser checks pass for source and offline builds at 1440px and 390px, including shop purchase pricing/persistence, a single equip pulse, radius preview and real combat, with no browser errors.

- [Browser results](browser.json)
- [Desktop loadout](loadout-1440.png)
- [Mobile loadout](loadout-390.png)
- [Desktop arena radius](range-1440.png)
- [Mobile arena radius](range-390.png)
- [216 seeded battle balance report](balance.json): normal 32/36, elite 18/36 opening wins; normal 36/36, elite 32/36 later wins, across three prepared team combinations. No timeouts. This is a sample, not a guarantee for every team or seed.

No authored creature pixels, limbs, equipment sockets or animation rigs changed. Both offline HTML builds were rebuilt. Broad contact/full-suite verification is recorded separately when complete; inherited radius and shield-counter expectation failures were already present before this change.
