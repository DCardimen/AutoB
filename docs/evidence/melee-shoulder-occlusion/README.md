# Melee shoulder occlusion: before/after sheets

One sheet per family, art form and facing group: `cmp-<family>-<form>-attack-<facings>.png`.

- Families: knight (Aurel), orc (Brakk), dwarf (Brom), troll (Grum), goblin (Grit), minotaur (Tarka), rogue (Sable).
- Forms: 0 base, 1 mature, 2 apex.
- Facings: `1357` = SE, SW, NW, NE; `0246` = E, S, W, N.

Each facing has two rows. The red bar is the previous release (`aeca690`), the green bar is this change. Columns: original source frame, idle, then attack at 30%, 50% and 70%, all rendered by the production `paintCharacterPixels` at 6×. Magenta marks transparent pixels fully enclosed by the sprite; the checkerboard is empty background.

See [MELEE-SHOULDER-OCCLUSION.md](../../MELEE-SHOULDER-OCCLUSION.md) for causes, rules and measurements.
