# Native Pixel v6 · Godot 4 sprite kit

Open `project.godot` in Godot 4. The project was imported and run with Godot 4.6.3.

Nine actors each have a 1024×3840 PNG atlas and a SpriteFrames `.tres` resource: fifteen states, eight facings, eight frames per clip. Each cell is exactly 64×64, with a shared foot pivot of (32, 44). The kit contains 8,640 checked cells and 1,080 named animation clips. `sprites/manifest.json` records regions, frame rates and loop flags.

Set nearest texture filtering and disable mipmaps. Resource texture paths use `res://sprites/<id>.png`; retain that folder at the project root when copying the resources elsewhere, or update their paths.

Demo controls: 1–9 selects an actor, arrows move, Shift sprints, Space cycles poses, and Q/E changes facing. Death, knockdown and get-up are baked from physical falls. The browser Training Glade runs the live particle/cloth systems; this project demonstrates the exported sprite animations and movement.

The hound has four legs, the brass walker six, the spider eight and the jelly none. The five heroes are knight, orc, elven rogue, silver-haired mage and fox ranger.
