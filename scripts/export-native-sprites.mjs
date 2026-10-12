import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {NATIVE_SPECIES,lineageLimit} from '../native-content.js';
const output=process.argv[2]||'playtest-artifacts/native-sprites-v10';
fs.mkdirSync(path.join(output,'sprites'),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const manifest={version:10,cell:[64,64],pivot:[32,44],sampling:'nearest',families:[],forms:[]};
try{
 const page=await browser.newPage();await page.goto((process.env.BASE_URL||'http://127.0.0.1:3012')+'/index.html');await page.waitForFunction(()=>window.nativeRosterLab);
 for(const spec of NATIVE_SPECIES){
  const limit=lineageLimit({id:spec.id});manifest.families.push({id:spec.id,name:spec.name,rig:spec.nativeRig,design:spec.nativeDesign,totalLineageForms:limit+1,habitat:spec.habitat,accomplishment:spec.accomplishment});
  for(let stage=0;stage<=limit;stage++)for(const branch of stage?['wild','warden']:['wild']){
   const atlas=await page.evaluate(({id,branch,stage})=>nativeRosterLab.exportAtlas(id,branch,stage),{id:spec.id,branch,stage});assert.deepEqual(atlas.issues,[],spec.id+' '+branch+' '+stage);
   const key=spec.id+'-'+(stage?branch+'-'+stage:'base');fs.writeFileSync(path.join(output,'sprites',key+'.png'),Buffer.from(atlas.image.split(',')[1],'base64'));
   const frames=atlas.animations.reduce((n,a)=>n+a.frames.length,0),lines=[`[gd_resource type="SpriteFrames" load_steps=${frames+2} format=3]`,'',`[ext_resource type="Texture2D" path="res://sprites/${key}.png" id="1"]`,''];let index=0;
   for(const animation of atlas.animations)for(const f of animation.frames)lines.push(`[sub_resource type="AtlasTexture" id="Frame_${index++}"]`,'atlas = ExtResource("1")',`region = Rect2(${f.x}, ${f.y}, 64, 64)`,'');
   lines.push('[resource]','animations = [');index=0;
   atlas.animations.forEach((a,i)=>{lines.push('{','"frames": [');a.frames.forEach((f,j)=>lines.push(`{ "duration": 1.0, "texture": SubResource("Frame_${index++}") }${j<a.frames.length-1?',':''}`));lines.push('],',`"loop": ${a.loop},`,`"name": &"${a.name}",`,`"speed": ${a.fps}.0`,`}${i<atlas.animations.length-1?',':''}`);});lines.push(']','');fs.writeFileSync(path.join(output,key+'.tres'),lines.join('\n'));
   delete atlas.image;delete atlas.issues;manifest.forms.push({...atlas,key,frames});console.log(key+': '+frames+' checked native cells');
  }
 }
}finally{await browser.close();}
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(output,'project.godot'),'config_version=5\n[application]\nconfig/name="Starfall Native Roster v10"\nrun/main_scene="res://showcase.tscn"\n[display]\nwindow/size/viewport_width=1002\nwindow/size/viewport_height=654\n[rendering]\nrenderer/rendering_method="gl_compatibility"\ntextures/default_filters/use_nearest_mipmap_filter=false\n');
fs.copyFileSync('public/prototype-glade-pixel.png',path.join(output,'environment.png'));
fs.writeFileSync(path.join(output,'showcase.tscn'),'[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://showcase.gd" id="1"]\n[node name="Showcase" type="Node2D"]\ntexture_filter = 1\nscript = ExtResource("1")\n');
fs.writeFileSync(path.join(output,'showcase.gd'),`extends Node2D
var forms: Array = []
var selected: int = 0
var state_index: int = 2
var direction: int = 2
var sprite: AnimatedSprite2D
var label: Label
const STATES = ["idle", "walk", "run", "sprint", "turn", "stop", "attack", "slash", "charge", "cast", "dash", "dodge", "hit", "stagger", "knockdown", "getup", "death"]
const DIRECTIONS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"]
func _ready() -> void:
 forms = JSON.parse_string(FileAccess.get_file_as_string("res://manifest.json"))["forms"]
 for form in forms:
  var frames: SpriteFrames = load("res://" + str(form["key"]) + ".tres")
  assert(frames != null and frames.get_animation_names().size() == 136)
 var background := Sprite2D.new()
 background.texture = load("res://environment.png")
 background.centered = false
 background.scale = Vector2(1002.0 / background.texture.get_width(), 654.0 / background.texture.get_height())
 add_child(background)
 sprite = AnimatedSprite2D.new()
 sprite.position = Vector2(501, 375)
 sprite.scale = Vector2(4, 4)
 sprite.centered = false
 sprite.offset = -Vector2(32, 44)
 sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
 add_child(sprite)
 label = Label.new()
 label.position = Vector2(30, 24)
 label.add_theme_color_override("font_color", Color("e9dfbd"))
 add_child(label)
 _show()
 print("Validated " + str(forms.size()) + " native form resources, 136 animations each.")
func _show() -> void:
 sprite.sprite_frames = load("res://" + str(forms[selected]["key"]) + ".tres")
 sprite.play(STATES[state_index] + "_" + DIRECTIONS[direction])
 label.text = "A/D: family form · Space: pose · Q/E: direction · arrows: move · Shift: sprint\\n" + str(forms[selected]["key"]) + " · " + STATES[state_index] + " · " + DIRECTIONS[direction]
func _unhandled_key_input(event: InputEvent) -> void:
 if not event is InputEventKey or not event.pressed or event.echo:
  return
 if event.keycode == KEY_A:
  selected = posmod(selected - 1, forms.size())
 if event.keycode == KEY_D:
  selected = (selected + 1) % forms.size()
 if event.keycode == KEY_SPACE:
  state_index = (state_index + 1) % STATES.size()
 if event.keycode == KEY_Q:
  direction = posmod(direction - 1, 8)
 if event.keycode == KEY_E:
  direction = (direction + 1) % 8
 _show()
func _process(delta: float) -> void:
 var move := Vector2(float(Input.is_physical_key_pressed(KEY_RIGHT)) - float(Input.is_physical_key_pressed(KEY_LEFT)), float(Input.is_physical_key_pressed(KEY_DOWN)) - float(Input.is_physical_key_pressed(KEY_UP)))
 if move.length_squared() > 0.0:
  direction = posmod(int(round(move.angle() / (PI / 4.0))), 8)
  sprite.position += move.normalized() * (190.0 if Input.is_physical_key_pressed(KEY_SHIFT) else 115.0) * delta
  sprite.position = sprite.position.clamp(Vector2(80, 150), Vector2(925, 610))
  state_index = 3 if Input.is_physical_key_pressed(KEY_SHIFT) else 2
  _show()
`);
console.log('Exported '+manifest.families.length+' families, '+manifest.forms.length+' form variants, '+manifest.forms.reduce((n,f)=>n+f.frames,0)+' native cells.');
