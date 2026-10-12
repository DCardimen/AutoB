import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {PROTOTYPE_CHARACTERS,ANIMATION_STATES} from '../prototype-engine.js';
const output='godot-sprites';fs.mkdirSync(path.join(output,'sprites'),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const manifest={version:8,artRevision:2,cell:[64,64],pivot:[32,44],sampling:'nearest',characters:[]};
try{
 const page=await browser.newPage();await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.goto((process.env.BASE_URL||'http://127.0.0.1:3007')+'/prototype.html');await page.clock.runFor(100);await page.waitForFunction(()=>prototypeLab.state.artLoaded);
 for(const spec of PROTOTYPE_CHARACTERS){
   const atlas=await page.evaluate(id=>prototypeLab.exportAtlas(id),spec.id);assert.deepEqual(atlas.issues,[],spec.id+' must have no clipped frames');
   fs.writeFileSync(path.join(output,'sprites',spec.id+'.png'),Buffer.from(atlas.image.split(',')[1],'base64'));
   const total=atlas.animations.reduce((n,a)=>n+a.frames.length,0),lines=[`[gd_resource type="SpriteFrames" load_steps=${total+2} format=3]`,'',`[ext_resource type="Texture2D" path="res://sprites/${spec.id}.png" id="1"]`,''];let index=0;
   for(const animation of atlas.animations)for(const f of animation.frames){lines.push(`[sub_resource type="AtlasTexture" id="Frame_${index++}"]`,'atlas = ExtResource("1")',`region = Rect2(${f.x}, ${f.y}, 64, 64)`,'');}
   lines.push('[resource]','animations = [');index=0;
   atlas.animations.forEach((a,i)=>{lines.push('{','"frames": [');a.frames.forEach((f,j)=>lines.push(`{ "duration": 1.0, "texture": SubResource("Frame_${index++}") }${j<a.frames.length-1?',':''}`));lines.push('],',`"loop": ${a.loop},`,`"name": &"${a.name}",`,`"speed": ${a.fps}.0`,`}${i<atlas.animations.length-1?',':''}`);});lines.push(']','');
   fs.writeFileSync(path.join(output,spec.id+'.tres'),lines.join('\n'));
   delete atlas.image;delete atlas.issues;manifest.characters.push({...atlas,name:spec.name});console.log(`${spec.id}: ${total} checked 64×64 frames, ${atlas.animations.length} animations`);
 }
}finally{await browser.close();}
fs.writeFileSync(path.join(output,'sprites','manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.copyFileSync('public/prototype-glade-pixel.png',path.join(output,'environment.png'));
fs.writeFileSync(path.join(output,'project.godot'),`config_version=5\n[application]\nconfig/name="Starfall · Native Pixel Showcase"\nrun/main_scene="res://showcase.tscn"\n[display]\nwindow/size/viewport_width=1002\nwindow/size/viewport_height=654\n[rendering]\nrenderer/rendering_method="gl_compatibility"\ntextures/default_filters/use_nearest_mipmap_filter=false\n`);
fs.writeFileSync(path.join(output,'showcase.tscn'),`[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://showcase.gd" id="1"]\n[node name="Showcase" type="Node2D"]\ntexture_filter = 1\nscript = ExtResource("1")\n`);
fs.writeFileSync(path.join(output,'showcase.gd'),`extends Node2D
const IDS = ["knight", "orc", "elf", "caster", "wolf", "fox", "mech", "spider", "jelly"]
const DIRECTIONS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"]
const STATES = ["idle", "walk", "run", "sprint", "turn", "stop", "attack", "slash", "charge", "cast", "dash", "dodge", "hit", "stagger", "knockdown", "getup", "death"]
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
 print("Loaded 9 native 64x64 SpriteFrames resources, ${ANIMATION_STATES.length*8} animations each.")
func _status() -> void:
 status.text = "1–9: select  ·  arrows: move  ·  Shift: sprint  ·  Space: next pose  ·  Q/E: facing\\n" + IDS[selected] + "  |  " + STATES[state_index] + "  |  " + DIRECTIONS[direction]
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
`);
console.log(`Exported ${manifest.characters.length} actors: ${manifest.characters.reduce((n,c)=>n+c.animations.reduce((sum,a)=>sum+a.frames.length,0),0)} cells. Open godot-sprites/project.godot in Godot 4.`);
