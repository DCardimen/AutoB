import test from 'node:test';
import assert from 'node:assert/strict';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {authoredParts} from '../authored-parts.js';
import {authoredSourceFrame,paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {PixelBrush,spritePoint} from '../prototype-pixel-art.js';

// Reviewed holes beneath the shoulders, in E/SE/S/SW/W/NW/N/NE order.
// Every one of these was transparent in the previous completed-body layer.
// Checking explicit missing regions prevents a test from only validating
// whatever small set of repairs the implementation happened to generate.
const holes={
 knight:[[[26,33],[26,33],[25,33],[25,32],[25,30],[25,33],[25,33],[25,33]],[[25,26],[24,26],[24,26],[24,25],[22,26],[22,26],[23,26],[24,26]],[[41,26],[22,25],[20,26],[19,26],[20,26],[21,26],[21,26],[20,26]]],
 orc:[[[24,32],[24,32],[24,32],[38,32],[24,31],[26,33],[24,31],[24,32]],[[20,27],[19,27],[21,27],[19,27],[20,27],[20,27],[19,27],[19,27]],[[20,27],[18,27],[18,27],[19,27],[19,27],[18,27],[18,27],[18,27]]],
 dwarf:[[[25,26],[25,26],[25,26],[25,26],[25,26],[25,26],[25,26],[25,26]],[[22,26],[21,26],[21,26],[22,26],[23,26],[21,26],[21,26],[21,26]],[[41,26],[23,26],[20,26],[21,26],[20,26],[21,26],[20,26],[20,26]]],
 troll:[[[22,32],[23,32],[22,32],[22,32],[22,32],[24,32],[23,32],[22,32]],[[19,27],[17,27],[18,27],[17,27],[17,27],[18,27],[18,27],[17,27]],[[19,27],[17,27],[17,27],[17,27],[17,27],[17,27],[17,27],[17,27]]],
 goblin:[[[25,31],[25,31],[39,30],[39,30],[38,31],[25,31],[25,31],[38,31]],[[24,27],[23,27],[23,27],[22,27],[39,27],[23,28],[22,27],[23,28]],[[24,25],[22,26],[23,26],[39,26],[22,25],[41,28],[42,26],[23,27]]],
 minotaur:[[[23,31],[22,31],[22,31],[22,31],[22,31],[39,31],[22,31],[22,31]],[[20,26],[18,26],[18,26],[18,26],[19,26],[18,26],[18,26],[18,26]],[[19,25],[18,25],[17,25],[19,25],[16,25],[18,25],[17,25],[16,25]]],
 rogue:[[[25,30],[24,30],[24,30],[24,30],[24,29],[24,30],[24,30],[24,30]],[[26,25],[24,26],[23,26],[23,26],[23,24],[39,26],[23,26],[24,26]],[[26,25],[24,25],[23,25],[23,25],[23,23],[38,25],[23,25],[26,25]]],
};

test('all 168 reviewed melee shoulder cutouts contain independent body material',()=>{
 for(const [identity,forms]of Object.entries(holes))for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const [x,y]=forms[stage][dir],parts=authoredParts(authoredSourceFrame(identity,dir,stage),identity,stage,dir),pixel=parts.body.find(p=>p.x===x&&p.y===y);
  assert.ok(pixel?.bodyUnderlay,`${identity}/${stage}/${dir}: missing chest at ${x},${y}`);
 }
});

test('the fill reaches the painted outer side of the sleeve opening, rather than stopping at the central chest',()=>{
 for(const [identity,stage,dir,x,y]of [['troll',0,2,18,32],['orc',0,2,19,33],['knight',2,2,19,29],['troll',1,2,15,29]]){
  const parts=authoredParts(authoredSourceFrame(identity,dir,stage),identity,stage,dir);
  assert.ok(parts.underbody.some(p=>p.x===x&&p.y===y),`${identity}/${stage}/${dir}: outer sleeve cutout at ${x},${y}`);
 }
});

test('every complete torso row is opaque, retains source indices and leaves skeleton rib spaces intact',()=>{
 for(const identity of Object.keys(ARM_ANATOMY))for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const source=authoredSourceFrame(identity,dir,stage),parts=authoredParts(source,identity,stage,dir),body=new Map(parts.body.map(p=>[p.y*64+p.x,p])),original=new Set(source.pixels.map(p=>p.y*64+p.x));
  for(const [y,{left,right}]of parts.bodyRows)for(let x=left;x<=right;x++){
   const key=y*64+x;if(identity==='skeleton'&&!original.has(key))assert.ok(!body.has(key),'authored rib gaps stay transparent');
   else assert.ok(body.has(key),`${identity}/${stage}/${dir}: torso row cutout at ${x},${y}`);
  }
  for(const p of parts.repairs){assert.equal(p.color,source.colors[p.index]);assert.ok(p.bodyUnderlay);}
 }
});

test('the chest stays filled through every motion without an arm or weapon hiding its holes',()=>{
 let poses=0,probes=0;
 for(const identity of Object.keys(ARM_ANATOMY)){
  const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted);
  for(const evolution of [0,1,2])for(const evolutionPath of ['wild','warden'])for(const state of NATIVE_POSES)for(const phase of [.13,.49,.625,.78])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath},state,phase),brush=new PixelBrush(),angle=dir*Math.PI/4;
   rig.dir=dir;paintAtlasCharacter(brush,rig.id,rig,q=>spritePoint(q,angle));poses++;
   assert.equal(brush.clipped,0,`${identity}/${evolution}/${state}/${dir}: complete body fits`);
   const body=new Map(rig.artParts.underbody.map(p=>[p.y*64+p.x,p]));
   for(const [y,{left,right}]of rig.artParts.bodyRows)for(let x=left;x<right;x++){
    if(![[x,y],[x+1,y],[x,y+1],[x+1,y+1]].every(([xx,yy])=>body.has(yy*64+xx)))continue;
    for(const offset of [0,.5]){
     const p=rig.artSourceProject(x+offset,y+offset),xx=Math.round(p.x),yy=Math.round(p.y);probes++;
     assert.equal(brush.data[(yy*64+xx)*4+3],255,`${identity}/${evolution}/${evolutionPath}/${state}/${phase}/${dir}: exposed body at ${x+offset},${y+offset}`);
    }
   }
  }
 }
 console.log(JSON.stringify({bodyOnlyPoses:poses,opaqueTorsoProbes:probes}));
});
