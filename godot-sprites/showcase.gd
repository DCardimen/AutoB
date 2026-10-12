extends Node2D
const IDS = ["knight", "orc", "elf", "caster", "wolf", "fox", "mech", "spider", "jelly"]
const DIRECTIONS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"]
const STATES = ["idle", "walk", "run", "sprint", "turn", "stop", "attack", "cast", "dash", "dodge", "hit", "stagger", "knockdown", "getup", "death"]
var actors: Array[Node2D] = []
var sprites: Array[AnimatedSprite2D] = []
var selected: int = 0
var state_index: int = 2
var direction: int = 2
var status: Label
func _ready() -> void:
 var backdrop := Sprite2D.new()
 backdrop.texture = load("res://environment.png")
 backdrop.centered = false
 backdrop.scale = Vector2(1002.0 / backdrop.texture.get_width(), 654.0 / backdrop.texture.get_height())
 backdrop.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
 add_child(backdrop)
 for i in IDS.size():
  var actor := Node2D.new()
  actor.position = Vector2(230 + (i % 3) * 270, 205 + int(i / 3) * 135)
  add_child(actor)
  var sprite := AnimatedSprite2D.new()
  sprite.sprite_frames = load("res://" + IDS[i] + ".tres")
  sprite.centered = false
  sprite.position = -Vector2(32, 44) * 3
  sprite.scale = Vector2(3, 3)
  sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
  actor.add_child(sprite)
  sprite.play("run_s")
  actors.append(actor)
  sprites.append(sprite)
  var label := Label.new()
  label.text = IDS[i].to_upper()
  label.position = Vector2(-35, 15)
  label.add_theme_color_override("font_color", Color("eee2be"))
  actor.add_child(label)
 var layer := CanvasLayer.new()
 add_child(layer)
 status = Label.new()
 status.position = Vector2(18, 16)
 status.add_theme_color_override("font_color", Color("eee2be"))
 layer.add_child(status)
 _status()
 print("Loaded 9 native 64x64 SpriteFrames resources, 120 animations each.")
func _status() -> void:
 status.text = "1–9: select  ·  arrows: move  ·  Shift: sprint  ·  Space: next pose  ·  Q/E: facing\n" + IDS[selected] + "  |  " + STATES[state_index] + "  |  " + DIRECTIONS[direction]
func _unhandled_key_input(event: InputEvent) -> void:
 if not event is InputEventKey or not event.pressed or event.echo:
  return
 if event.keycode >= KEY_1 and event.keycode <= KEY_9:
  selected = int(event.keycode - KEY_1)
 if event.keycode == KEY_SPACE:
  state_index = (state_index + 1) % STATES.size()
 if event.keycode == KEY_Q:
  direction = posmod(direction - 1, 8)
 if event.keycode == KEY_E:
  direction = (direction + 1) % 8
 sprites[selected].play(STATES[state_index] + "_" + DIRECTIONS[direction])
 _status()
func _process(delta: float) -> void:
 var move := Vector2(float(Input.is_physical_key_pressed(KEY_RIGHT)) - float(Input.is_physical_key_pressed(KEY_LEFT)), float(Input.is_physical_key_pressed(KEY_DOWN)) - float(Input.is_physical_key_pressed(KEY_UP)))
 if move.length_squared() > 0.0:
  direction = posmod(int(round(move.angle() / (PI / 4.0))), 8)
  var sprinting := Input.is_physical_key_pressed(KEY_SHIFT)
  actors[selected].position += move.normalized() * (190.0 if sprinting else 115.0) * delta
  actors[selected].position = actors[selected].position.clamp(Vector2(80, 145), Vector2(925, 590))
  sprites[selected].play(("sprint_" if sprinting else "run_") + DIRECTIONS[direction])
  _status()
