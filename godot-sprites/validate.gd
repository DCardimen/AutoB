extends SceneTree
func _initialize() -> void:
 var file := FileAccess.open("res://sprites/manifest.json", FileAccess.READ)
 var manifest: Dictionary = JSON.parse_string(file.get_as_text())
 var total: int = 0
 for character in manifest.characters:
  var frames: SpriteFrames = load("res://" + character.id + ".tres")
  assert(frames.get_animation_names().size() == 120)
  for clip in character.animations:
   assert(frames.has_animation(clip.name))
   assert(frames.get_frame_count(clip.name) == 8)
   assert(frames.get_animation_loop(clip.name) == clip.loop)
   assert(is_equal_approx(frames.get_animation_speed(clip.name), float(clip.fps)))
   for i in 8:
    var texture: AtlasTexture = frames.get_frame_texture(clip.name, i)
    var expected: Dictionary = clip.frames[i]
    assert(texture.region == Rect2(expected.x, expected.y, 64, 64))
    assert(texture.atlas.get_width() == character.width)
    assert(texture.atlas.get_height() == character.height)
    assert(texture.region.end.x <= texture.atlas.get_width())
    assert(texture.region.end.y <= texture.atlas.get_height())
    total += 1
 assert(total == 8640)
 print("Validated 8640 Godot AtlasTexture cells, 1080 named animations, loop flags and frame rates.")
 quit(0)
