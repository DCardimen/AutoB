# Natural melee carry · Art revision 7

Brakk's resting hands now follow the original painted anatomy at his sides.
The axe hangs downward from the wielding hand, angled slightly outward, rather
than pulling both hands across the chest. The same relaxed carry applies to
the other held melee weapons. Cannons and gauntlets retain their own poses.

Resting hand landmarks use the actual lower hand band on evolved melee art.
Hands follow torso and arm motion independently of the leg deformation, even
when their source pixels lie below the waist. The free hand rests separately
while carrying; the second hand rejoins the handle during a swing.

The carry blends into the existing windup/contact/recovery. Active strikes
keep their physical contact axis and full reach. The compact resting reach
keeps the weapon near the feet. Rules 17, save schema 7 and creature scale
remain unchanged.

Both offline HTML games and the Training Glade bundle are rebuilt. Open
`Starfall-Menagerie.html` for the updated game. Previously downloaded HTML
files need to be replaced to receive the fix.
The ready-to-extract download is `public/Starfall-Natural-Carry.zip`.

Validation commands:

```
npm test
npm run build:standalone
npm run build:prototype
node scripts/review-natural-carry.mjs
node tests/field-ui.browser.mjs
```

`BASE_URL` selects the game server; `CHROMIUM_PATH` optionally selects Chrome.
The review script records eight-direction base/evolved, running and attack
poses, plus Brakk's real 390px detail screen in source and offline builds.
The offline review blocks external requests. Evidence is recorded in
`tests/reports/natural-melee-carry.json`; screenshots are under
`playtest-artifacts/natural-carry-*.png` and included in the PR Actions artifact.
