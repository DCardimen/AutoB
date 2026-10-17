# Hover compatibility preview

Hovering or keyboard-focusing packed equipment or an Aura Stone now paints exactly the same valid/invalid targets as dragging that item. Worn items also preview legal transfers. The compact companion strip accepts drops and shows recipient compatibility on narrow screens. Moving away, changing focus, closing the menu, cancelling a drag or entering combat clears the preview.

The preview calls the existing `canLoadoutDrop` rules on an isolated copy. It creates no drag ghost, changes no inventory and does not set the grabbing cursor. Real dragging takes ownership of the highlights until it ends.

Explicit equipment and Aura sockets now reject the other item type, so a compatible companion does not make its unrelated sockets glow. Both preview and dragging share this rule. All 43 focused unit checks and the existing source/offline sprite-drag and real phone touch suite passed.

Passed all four source/offline desktop/phone cases in `tests/loadout-hover.browser.mjs`: identical hover/drag target sets, weapon affinity, stone role restrictions, full slots, companion strip, keyboard focus, zero run mutation, and cleanup. [Results](browser.json).

- [Equipment preview](fang-1440.png)
- [Aura Stone preview](stone-1440.png)
- [Phone recipient strip](stone-390.png)

Both offline HTML files rebuilt; the training file is unchanged. No creature artwork or attachment rendering changed.
