import test from 'node:test';
import assert from 'node:assert/strict';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {authoredParts,authoredArmLength,authoredArmScale,constrainHeldGrip} from '../authored-parts.js';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {paintCharacterPixels,PixelBrush,spritePoint} from '../prototype-pixel-art.js';
import {paintAuthoredArms} from '../authored-arm-skin.js';

const specimens=Object.keys(ARM_ANATOMY).map(identity=>PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted));
function components(pixels){
 const labels=new Uint16Array(4096);let label=0;
 for(let n=0;n<4096;n++)if(pixels[n*4+3]&&!labels[n]){
  const queue=[n];labels[n]=++label;
  for(let i=0;i<queue.length;i++){const x=queue[i]%64,y=queue[i]>>6;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&pixels[k*4+3]&&!labels[k]){labels[k]=label;queue.push(k);}}}
 }return labels;
}
function nearComponents(labels,p){
 const found=new Set(),x=Math.round(p.x),y=Math.round(p.y);
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<64&&yy>=0&&yy<64&&labels[yy*64+xx])found.add(labels[yy*64+xx]);}return found;
}
test('source wrist ownership is complete and exclusive in all 288 articulated bind frames',()=>{
 for(const identity of Object.keys(ARM_ANATOMY))for(let form=0;form<3;form++)for(let dir=0;dir<8;dir++){
  const asset=authoredSourceFrame(identity,dir,form),parts=authoredParts(asset,identity,form,dir),owners=new Set(),body=new Map(parts.body.map(p=>[p.y*64+p.x,p]));
  for(const profile of parts.arms.profiles.values()){
   assert.ok(profile.grid.has(profile.end.y*64+profile.end.x),`${identity}/${form}/${dir}: actual painted wrist`);
   for(const p of profile.pixels){const key=p.y*64+p.x;if(!profile.occluded){assert.ok(!owners.has(key),`${identity}/${form}/${dir}: one moving owner per visible source pixel`);owners.add(key);}else assert.notEqual(profile.sourceDir,dir,'a concealed reconstructed layer is not an original visible pixel in this facing');assert.ok(profile.occluded||!body.has(key)||body.get(key).bodyUnderlay,'no frozen sleeve behind a moving one');assert.equal(p.color,asset.colors[p.index]);}
  }
 }
});
test('reach and cell constraints solve a nearly tangent two-hand hold without stretching either arm',()=>{
 const constraints=[{center:{x:24.5,y:34.7},radius:7},{center:{x:38.5,y:34.7},radius:7}],bounds={minX:1,maxX:62,minY:1,maxY:62};
 const grip=constrainHeldGrip({x:10,y:10},constraints,bounds);assert.ok(Math.abs(grip.x-31.5)<1e-9);assert.ok(Math.abs(grip.y-34.7)<1e-9);
});
test('final elbows retain both authored bone lengths after weapon, support-hand and cell fitting',()=>{
 for(const spec of specimens)for(const evolution of [0,1,2])for(const evolutionPath of ['wild','warden'])for(const state of NATIVE_POSES)for(let dir=0;dir<8;dir++)for(const phase of [.13,.49,.625,.6875,.78]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),scale=authoredArmScale(rig),context=`${spec.id}/${evolution}/${evolutionPath}/${state}/${dir}/${phase}`;
  assert.equal(pixels.clipped,0,context);const labels=components(pixels);
  for(const arm of rig.arms){const p=rig.artArmSkin.art.profiles.get(rig.artArmScreens[arm.side]),points=[rig.artProject(arm.root),rig.artProject(arm.joint),rig.artProject(arm.end)],source=[p.root,p.joint,p.end];
   for(let i=0;i<2;i++)assert.ok(Math.abs(Math.hypot(points[i+1].x-points[i].x,points[i+1].y-points[i].y)-authoredArmLength(source[i],source[i+1],scale))<1e-6,context+': bone '+i);
   const shoulder=nearComponents(labels,points[0]),hand=nearComponents(labels,points[2]);assert.ok([...hand].some(c=>shoulder.has(c)),context+': actual painted shoulder, elbow and hand stay in one connected raster');
  }
 }
});
test('the actual isolated sleeve raster retains every original adjacency through the elbow',()=>{
 for(const spec of specimens)for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++)for(const phase of [.23,.49,.73]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'attack',phase),angle=dir*Math.PI/4;paintCharacterPixels(rig.id,rig,angle);
  for(const arm of rig.arms){const brush=new PixelBrush(),single={...rig,arms:[arm],artArmPixels:new Map(),artGripPixels:new Map()};paintAuthoredArms(brush,single,false,p=>spritePoint(p,angle));paintAuthoredArms(brush,single,true,p=>spritePoint(p,angle));
   const labels=components(brush.data);
   const mapped=single.artArmPixels.get(arm.side),component=p=>labels[Math.round(p.q.y)*64+Math.round(p.q.x)];
   for(const p of mapped.values())for(const [dx,dy]of [[1,0],[0,1]]){const other=mapped.get((p.y+dy)*64+p.x+dx);if(other)assert.ok(component(p)&&component(p)===component(other),`${spec.id}/${evolution}/${dir}/${phase}: sleeve edge ${p.x},${p.y}`);}
   assert.equal(brush.clipped,0);
  }
 }
});
test('an evolved skeleton staff keeps its own weapon identity and has no bowstring attachment',()=>{
 for(const evolution of [1,2])for(const state of ['idle','attack','cast']){const spec=pixelSpec('morrow'),rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,.49);assert.equal(rig.weapon.kind,'staff');assert.equal(rig.bowString,null);}
});
test('every roster entry with an arm rig has registered indexed arm art; fairy proxies retain their painted hands',()=>{
 for(const spec of PIXEL_SPECIES)for(const evolution of [0,1,2]){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},'cast',.49);paintCharacterPixels(rig.id,rig,Math.PI/4);
  if(spec.nativeDesign==='faerie'){assert.equal(rig.arms.length,0,spec.id);assert.equal(rig.weapon,null,spec.id);assert.equal(rig.artArmSkin,null);}
  if(rig.arms.length)assert.ok(rig.artArmSkin,`${spec.id}: no procedural fallback grafted onto an authored body`);
 }
});
