# Body detail behind moving limbs · Art revision 8

The torso and clothing now have a separate completed layer underneath the
articulated arms and held weapons. When a hand or weapon leaves its resting
position, the exposed area shows matching body detail rather than a cutout.

The renderer infers the covered torso edge from nearby connected costume
pixels and restores the masked portion inside that silhouette. Shading comes
from the adjacent clothing, belt or armor palette. Material matching prevents
skin from being copied into a clothed torso. Empty space outside the torso is
preserved, so no resting fist is drawn behind the moving arm. Repairs are
cached per identity, developmental stage and facing, then follow the body pose.

The relaxed hands and downward carry from the preceding fix are retained.
Physical attack contacts, creature scale, combat rules and save schema remain.
Both offline games and the Training Glade bundle are rebuilt. The updated
download is `public/Starfall-Natural-Carry.zip`.

`tests/swing-body.test.js` renders the body alone, without arms or equipment
covering possible gaps. It checks exposed pixels throughout windup, contact
and recovery, plus clothing colors and equipment-independent material mapping.
The existing grip, cell bounds and palette checks also apply.

`node scripts/review-swing-body.mjs` records body-only and actual swing frames
for Brakk, Aurel, Brom and Tarka through all three developmental stages.
Set `BASE_URL` and optionally `CHROMIUM_PATH` for the local server/browser.
The report is `tests/reports/swing-body.json`; review sheets are in
`playtest-artifacts/swing-body-*.png` and the PR Actions artifact.
