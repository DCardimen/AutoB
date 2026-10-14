# Melee weapon and arm polish · Art revision 6

The earlier renderer removed neutral hand pixels, used fixed shoulder positions, and painted each whole arm on one depth layer. On some poses that left a visible hand beside the body while its arm was hidden. Thin weapon shapes also lost their silhouette in three-quarter views.

Arms now attach to the connected painted torso for each species, facing and evolution. Shaded upper arms, elbows, forearms, cuffs and hands render at their own depth. The held grip and wielding hand use one transform, including two-handed handles. Authored body swatches and collection variants are preserved.

Original native-pixel weapon artwork lives in `melee-weapon-art.js`: beveled swords and daggers, rapier guards, crescent axes, evolved double axes, capped hammers, carved clubs, gauntlets and the existing evolved cannon. Sunsteel and evolved blade accents retain their own colors. Between strikes the carry pose keeps the silhouette readable to the camera; active swings retain the physical contact direction. The complete head and guard are measured before rasterization, and exceptional poses refit the hand and elbow rather than cropping a weapon corner.

Phone quick AI controls occupy a scrollable lower strip of the arena, allowing creature silhouettes to remain visible. Controls retain their original policy handlers. Rules 17, save schema 7 and the accepted creature scale remain.

## Play the updated game

After pulling `codex/melee-weapon-arms`, run `npm ci` and `npm start`. For offline play, run `npm run build:standalone` before opening `Starfall-Menagerie.html`. The read-only **Build and verify field UI** workflow packages the current offline game, screenshots and reports into its **Starfall-Reference-UI** artifact. Older tracked generated packages are historical.

## Review and validation

Visual self-review reached **9/10 for weapon and limb presentation** after repeated inspection of base, mature and apex forms, idle/carry poses, overhead and side swings, movement, portrait views and the phone arena. This is an artistic judgment, separate from automated functionality checks.

- All 234 existing and added unit tests pass locally, including the complete family/form/motion cell-boundary matrix and both character-height limits.
- Shoulder/hand connectivity now covers every family using the humanoid arm renderer, across all facings, three forms and living poses.
- Additional melee checks cover side/charged swings, sprinting, dodges, hits and falls, both evolution paths, held grips and physical active-contact directions.
- Source and rebuilt offline browser flows pass at 320/390/768/1440px, including combat/pause, rewards/cache, route selection, save reload, all three worlds and menus, with no browser errors or offline network requests.
- `node scripts/review-melee-weapons.mjs` records six representative identities through three stages, desktop preparation and phone preparation/combat at device scale factor 3. It also verifies the moved AI control changes the real policy. Its three-companion setup is an inspection fixture, independent of campaign progression and balance.
