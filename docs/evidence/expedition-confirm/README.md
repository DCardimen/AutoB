# Expedition selection and confirmation

New Expedition is in the top application header. Opening it and changing selections preserve the current expedition until the explicit Confirm Expedition button is pressed. The selected party, budget, challenge summary and confirmation sit above the catalogue. Compact challenge cards leave more room for companions; mobile shows companions before the challenge details. Existing size controls, filters, elite choices and selection limits remain usable.

Source and offline checks pass at 1900, 1024, 390 and 320 pixels: header placement, confirmation above the catalogue, cancelling without changing the current seed, stable portrait canvases across changes, starting the confirmed party, no horizontal overflow, and zero page errors. The complete existing team-selection browser check passes source/offline filtering, sorting, point limits, synergies, 20 Chaos tiers, elite inheritance and live combat. Both offline files rebuild successfully.

- [Measurements](browser.json) · [complete selection flow](team-selection.json)
- [Desktop](source-1900.png) · [tablet](source-1024.png) · [phone](source-390.png) · [320px](source-320.png)
- [Offline desktop](offline-1900.png) · [offline phone](offline-390.png)
