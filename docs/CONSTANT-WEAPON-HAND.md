# Constant wielding hand

Companions swapped weapon hands while turning. The physics rig always wields melee weapons and staves in the right hand and bows in the left, but the renderer chose which painted arm carried the weapon from `GEAR`, the table of where each source sprite happened to draw its weapon. The knight/dwarf/rogue/goblin table and the orc/troll/minotaur table disagreed with anatomy in different facings:

| Facing | E | SE | S | SW | W | NW | N | NE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Right hand on screen | left | left | left | left | left | right | right | right |
| Knight, dwarf, rogue, goblin (before) | **right** | left | left | **right** | left | right | right | **left** |
| Orc, troll, minotaur (before) | **right** | **right** | left | left | left | **left** | **left** | right |

The five authored frames from E to W are all turned toward the viewer, so the right hand is on the viewer's left in those five and on the right in the three away-facing frames. `rightHandScreen(dir)` in `authored-sprite-renderer.js` encodes this. Each physical arm now always uses its own painted arm, and the carry direction follows the actual wielding hand. Shields stay in the left hand automatically.

Swing poses were already physical and are unchanged; the defect was in the idle, walk and run carry.

## Evidence

[Before/after turn-arounds](evidence/constant-weapon-hand/): each sheet shows the previous release (red bar) and this change (green bar) at idle, then at 60% of an attack, in all eight facings from E to NE.

`tests/constant-weapon-hand.test.js` checks the screen-side rule against the rig's own shoulders, and that every armed family, form, facing and travel/attack state keeps each arm on its own painted arm. It fails on the previous release.

## Trade-off

When the right hand is on the far side of the body (SW, W, NW, N), a held weapon can be partly or fully hidden behind the body at idle. This is most visible for the caster, whose staff disappears behind the hair and robe in those facings. Swing and cast frames already behaved this way.

## Two-handed holds that cannot be reached

With each arm on its own painted arm, Grum's short far arm cannot always reach the shared axe grip while tumbling. Previously the solver stretched the painted arm past its length. Now, when no grip satisfies both reach limits, the support hand lets go and keeps its own relaxed pose while the weapon hand keeps exact contact (`rig.artSupportReleased`). Across 14,688 orc-rig poses (Brakk, Grum and Tarka, all forms, paths, states, facings and six phases) this happens in 24, all of them Grum's knockdown, get-up or death frames. Attacks, travel and idle remain two-handed.

## Travel sway near the centre line

Brom's apex right hand is painted in front of his belly in the E frame, about five pixels from the torso centre. Walk and sprint sway could carry the grip a pixel across the centre, which `gaits-carry.test.js` treats as a hand jump. Sway may now bring a carried hand toward the centre line but not past it; a hand painted closer than half a pixel keeps its painted distance, so resting poses stay exact.
