# Field UI V3

The field follows the supplied dark teal, cyan and gold reference: framed panels, circular encounter marks, illustrated worlds and a clear journey through preparation, battle, rewards and the next connected route.

## Play

Run `npm ci` and `npm start`, then open http://localhost:3000. Build the offline game with `npm run build:standalone` and open `Starfall-Menagerie.html`.

The **Build and verify field UI** GitHub Actions workflow builds, checks and packages the standalone game. Its **Starfall-Reference-UI** artifact includes the playable HTML, ZIP, UI screenshots and browser report. Generated playable files are delivered in the build artifact; they are not automatically pushed to the repository.

## Implemented

- Three illustrated world cards, locked-world previews, current encounter progress and phase-specific instructions.
- Actual connected route nodes placed over the supplied world paintings. Availability, scouting, route selection and progression remain driven by the game.
- Teal and gold panels and controls across arena, capture planning, deployment, equipment, reserves, creature tabs, rewards, outposts, events, rest, menagerie and settings.
- Original vector icons and an original ornamental frame detail drawn for this implementation. The nine supplied component sheets are design references; their rendered text and control labels are not baked into interactive buttons.
- Idle portraits use the existing authored sprite renderer at eight updates per second, only for visible cards. Reduced motion freezes the pose; hidden tabs skip updates. Arena sprite size and accepted artwork remain unchanged.
- Mobile bottom navigation with icons and safe-area padding, 44px primary targets, two-column team cards, responsive capture controls, scrolling creature tabs and sticky dialog actions.
- Source and offline builds use the same UI. The offline build embeds all three paintings, fonts and game code. Embedded paintings become local Blob URLs to avoid large CSS custom-property substitution limits; no network is required.

## Artwork

The uploaded originals remain at the repository root. Their unchanged bytes are reused as:

| Uploaded file | Runtime asset |
| --- | --- |
| ChatGPT Image Oct 13, 2026, 09_44_57 PM.png | public/ui/world-0.png |
| ChatGPT Image Oct 13, 2026, 09_45_01 PM.png | public/ui/world-1.png |
| ChatGPT Image Oct 13, 2026, 09_45_05 PM.png | public/ui/world-2.png |

`field-ui.js` contains the original vector icon paths. `public/ui/ornament.svg` is the original decorative artwork. Source raster artwork was not repainted.

## Validation

`node tests/field-ui.browser.mjs` checks 320, 390, 768 and 1440px widths in source and exact standalone HTML; creature tabs; world previews; real battle and pause; reward choice and cache claim; route selection; reload persistence; all three world paintings; outpost/event/rest menus; menagerie/settings; no browser errors; and no external requests in the offline game.

The browser flow uses an explicitly strengthened saved-team fixture to make the battle outcome deterministic. Later-world and noncombat-menu fixtures exercise presentation; they do not establish campaign balance or a numerical mobile satisfaction score. Existing rules version 17 and save schema 7 are preserved. Training Glade and the pre-existing untracked expedition.js draft are outside this UI change.


## Reference polish

The earlier implementation was functional but visually too fragmented. This pass replaces the tall map panels with the reference composition: illustrated world cards, a title inside the world scene, luminous route marks and connections, and one integrated encounter sheet with thumbnail, rewards, synergy, journey progress and a gold Continue button. Portrait tablet layouts scale this composition; desktop uses a companion detail column.

Selecting a route previews it without changing the saved expedition. Continue enters the selected encounter through the existing game logic. The sheet's scout arrow explains the actual combat counterplan and weather, or the relevant noncombat encounter. Completed alternatives collapse out of the chart while the saved chosen path remains visible. Scouting and route availability still control future choices.

Phone combat removes duplicate page headings and the redundant journey introduction. The arena and Enter battle control fit in the first viewport; enemy relic details remain accessible through an expandable build panel. Character, loadout, collection, settings, outpost, event, rest and rewards reuse the world imagery and framed teal/gold treatment. Header icons and route controls have 44px touch targets while retaining compact visible medallions.

Visual self-review: **9/10 for reference fidelity and UI presentation**. This is my own judgment after inspecting rendered phone, portrait tablet, desktop, preparation, creature, loadout, collection, settings, outpost, event and rest screens. It is not a measured human satisfaction score. The source and offline flow checks and all 232 existing unit tests passed during local review. GitHub Actions validates the exact final commit.

The current package is `Starfall-Reference-UI.zip` in the `Starfall-Reference-UI` Actions artifact. The workflow has read-only repository access and does not push generated files.
