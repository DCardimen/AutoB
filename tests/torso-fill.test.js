import test from 'node:test';
import assert from 'node:assert/strict';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {authoredParts} from '../authored-parts.js';
import {authoredSourceFrame,paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {PixelBrush,spritePoint} from '../prototype-pixel-art.js';

// Independent chest-side landmarks, reviewed against the jacket/armor in
// every facing. The previous outer-sleeve probes required body material at
// the original hand outline and therefore enforced a second stationary arm.
const chests={knight:[[33,27,37],[27,26,38],[27,25,39]],orc:[[33,27,37],[28,24,40],[28,23,41]],dwarf:[[27,28,36],[27,25,39],[27,25,39]],troll:[[33,26,38],[28,23,41],[28,23,41]],goblin:[[31,28,36],[27,26,38],[26,26,38]],minotaur:[[32,26,38],[27,23,41],[26,22,42]],rogue:[[30,28,36],[27,27,37],[26,27,37]]};

test('both sides of the actual chest stay filled in all 168 melee cells',()=>{
 for(const [identity,forms]of Object.entries(chests))for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const [y,left,right]=forms[stage],parts=authoredParts(authoredSourceFrame(identity,dir,stage),identity,stage,dir);
  for(let x=left;x<=right;x++)assert.ok(parts.underbody.some(p=>p.x===x&&p.y===y),`${identity}/${stage}/${dir}: actual chest at ${x},${y}`);
 }
});

test('former outside sleeve outlines move with the arm and are absent from the independent torso',()=>{
 for(const [identity,stage,dir,x,y]of [['troll',0,2,18,32],['orc',0,2,19,33],['knight',2,2,19,29],['troll',1,2,15,29]]){
  const parts=authoredParts(authoredSourceFrame(identity,dir,stage),identity,stage,dir);
  assert.ok(parts.arms.mask.has(y*64+x),'the complete original arm outline has a moving owner');
  assert.ok(!parts.body.some(p=>p.x===x&&p.y===y),'no stationary arm outline');
  assert.ok(!parts.underbody.some(p=>p.x===x&&p.y===y),'no arm-shaped replacement painted beneath it');
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
