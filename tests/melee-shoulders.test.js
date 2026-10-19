import test from 'node:test';
import assert from 'node:assert/strict';
import {authoredSourceFrame,paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {authoredParts,MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels,PixelBrush,spritePoint} from '../prototype-pixel-art.js';
import {shoulderInfluence,meleeShoulderSkin} from '../melee-shoulder-skin.js';
const specFor=id=>PIXEL_SPECIES.find(s=>s.nativeDesign===id&&!s.pixelConverted);
function render(id,stage,dir,state,phase,fixed=false){
 const spec=specFor(id),rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,phase);rig.artStage=stage;rig.suppressShoulders=fixed;
 const pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);return {rig,pixels};
}
test('all 168 melee cells save shoulders on the actual authored arms, with zero influence outside the cap and on protected faces',()=>{
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const parts=authoredParts(authoredSourceFrame(id,dir,stage),id,stage,dir);
  for(const arm of parts.arms.profiles.values()){
   const s=arm.shoulder;assert.ok(s&&s.rest.length===2&&s.rest.every(Number.isFinite)&&Math.hypot(...s.rest)>0);const [l,r,t,b]=s.bounds;
   assert.ok(arm.root.x>=l&&arm.root.x<=r&&arm.root.y>=t&&arm.root.y<=b);
   for(const [x,y]of [[l-1,t],[r+1,b],[l,t-1],[r,b+1]])assert.equal(shoulderInfluence(s,x,y),0);
   if(s.protect){const [pl,pr,pt,pb]=s.protect;for(let y=pt;y<=pb;y++)for(let x=pl;x<=pr;x++)assert.equal(shoulderInfluence(s,x,y),0);}
  }
 }
});
test('shoulders remain continuous through actual elbow-branch changes without changing the wrist or socket',()=>{
 for(const id of ['troll','orc','dwarf','minotaur'])for(const stage of [1,2])for(let dir=0;dir<8;dir++)for(const phase of [.203125,.34375,.375,.4375,.625,.875]){
  const {rig}=render(id,stage,dir,'attack',phase),inverse=p=>({x:p.x/rig.artCreatureFit,y:p.y/rig.artCreatureFit}),before=meleeShoulderSkin(rig.artParts,rig,inverse),reflected={...rig,artLimbPoints:new Map(rig.artLimbPoints)};
  for(const arm of rig.arms){const root=rig.artProject(arm.root),joint=rig.artProject(arm.joint),end=rig.artProject(arm.end),dx=end.x-root.x,dy=end.y-root.y,k=((joint.x-root.x)*dx+(joint.y-root.y)*dy)/(dx*dx+dy*dy);reflected.artLimbPoints.set(arm.joint,{x:2*(root.x+k*dx)-joint.x,y:2*(root.y+k*dy)-joint.y});}
  const after=meleeShoulderSkin(rig.artParts,reflected,inverse);assert.deepEqual(after.motions.map(m=>m.theta),before.motions.map(m=>m.theta),'both legal IK branches give the same shoulder pose');
  const next=render(id,stage,dir,'attack',phase+1e-5).rig.artShoulderSkin.motions;for(let i=0;i<next.length;i++)assert.ok(Math.abs(next[i].theta-rig.artShoulderSkin.motions[i].theta)<.01,'no timing snap across former elbow/angle seams');
 }
});
test('shoulder articulation preserves the exact idle raster in every form and facing',()=>{
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const a=render(id,stage,dir,'idle',.25),b=render(id,stage,dir,'idle',.25,true);assert.deepEqual(a.pixels,b.pixels);assert.equal(a.rig.artShoulderSkin.motions.length,0);
 }
});
test('painted bulky shoulder caps actually move while protected face and beard coordinates and weapon contacts remain unchanged',()=>{
 for(const id of ['troll','orc','minotaur','dwarf'])for(const stage of [0,1,2])for(let dir=0;dir<8;dir++){
  const context=`${id}/${stage}/${dir}`;let moved=0,visible=false;
  // A tiny base-form cap can be covered by the swinging arm at one phase.
  // Require actual movement over the cycle, and retain every per-pose guard.
  for(const phase of [.13,.375,.625,.875]){
  const a=render(id,stage,dir,'attack',phase),b=render(id,stage,dir,'attack',phase,true);
  for(const p of a.rig.artParts.body){
   const q=a.rig.artLayerProject(p.layer,p.x,p.y),z=b.rig.artLayerProject(p.layer,p.x,p.y),distance=Math.hypot(q.x-z.x,q.y-z.y);
   if(a.rig.artShoulderSkin.motions.every(m=>shoulderInfluence(m.source,p.x,p.y)===0))assert.ok(distance<1e-8,context+': fixed face/chest');
   if(distance>.1)moved++;
  }
  visible||=a.pixels.some((v,i)=>v!==b.pixels[i]);
  for(let i=0;i<a.rig.arms.length;i++)for(const part of ['root','joint','end'])assert.deepEqual(a.rig.artProject(a.rig.arms[i][part]),b.rig.artProject(b.rig.arms[i][part]),context+': contact and bone length');
  assert.equal(a.pixels.clipped,0,context);
  }
  assert.ok(moved>0,context+': actual painted shoulder coordinates must change');
  assert.ok(visible,context+': visible raster change during the cycle');
 }
});
test('moving shoulder surfaces and their independent backing remain opaque through attack and locomotion in every authored cell',()=>{
 for(const id of MELEE_ARM_FAMILIES)for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++)for(const state of ['walk','sprint','attack'])for(const phase of [.13,.375,.625,.875]){
  const spec=specFor(id),rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,phase);rig.artStage=stage;rig.dir=dir;const b=new PixelBrush();paintAtlasCharacter(b,rig.id,rig,p=>spritePoint(p,dir*Math.PI/4));
  assert.equal(b.clipped,0,`${id}/${stage}/${dir}/${state}/${phase}`);
  const colors=new Set(rig.artArmSkin.colors.map(c=>c.toLowerCase()));
  for(let i=0;i<b.data.length;i+=4)if(b.data[i+3])assert.ok(colors.has('#'+[...b.data.subarray(i,i+3)].map(v=>v.toString(16).padStart(2,'0')).join('')),'body stays in the original indexed material palette');
  for(const p of rig.artParts.underbody){const q=rig.artLayerProject('body',p.x,p.y);assert.equal(b.data[(Math.round(q.y)*64+Math.round(q.x))*4+3],255,'actual raster covers each deformed backing sample');}
  for(const m of rig.artShoulderSkin.motions)assert.deepEqual(rig.artShoulderSkin.project(m.origin,-64,-64),m.origin);
 }
});
