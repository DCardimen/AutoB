# Pregame capture marker

Selecting a wild capture target now adds a rotating segmented ring, a pulsing ground halo, and a hovering CAPTURE badge with a small lattice symbol. The color follows the selected capturer. The marker follows the enemy UID, updates immediately when the plan changes, survives reload, clears with the order, and hides when battle starts. Its accessible label identifies the creature and planned HP threshold.

The SVG overlay shares the arena camera and keeps a readable screen size across desktop and phone layouts. Its nodes remain stable between frames so the animation runs continuously. Pointer events pass through it. Reduced motion keeps the marker static. Short phone layouts hide the redundant field heading/tools while the marker is present, leaving the target visible; these controls remain available in the dock. Enemy selection prefers actual painted pixels, then the nearest padded target, so adjacent small targets can switch in either direction.

All six source/offline browser scenarios pass at 1440×900, 390×844 and 320×568: real canvas selection and switching between same-species enemies, animation progress with stable DOM nodes, threshold updates, cancellation, persistence, battle transition, reduced motion, no page scrolling, and zero browser errors. Offline scenarios block requests after navigation. Both offline HTML builds completed; Training Glade output was unchanged. `git diff --check` passed.

Evidence: [desktop](evidence/pregame-capture-marker/marker-1440.png), [phone](evidence/pregame-capture-marker/marker-390.png), [small phone](evidence/pregame-capture-marker/marker-320.png), [browser report](evidence/pregame-capture-marker/browser-report.json).

The marker is UI around the creature; no creature art, anatomy, gait or combat/capture odds changed. The expedition.js draft was not edited, staged or deleted. This PR stacks on the sprite-drag/arena-framing PR.
