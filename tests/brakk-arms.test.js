import test from 'node:test';
import assert from 'node:assert/strict';
import {pixelSpec} from '../native-content.js';
import {nativePoseRig,NATIVE_POSES} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {starterReactionRig} from '../starter-reactions.js';
const spec=pixelSpec('brakk');
function connected(pixels,from,to){
 const exists=(x,y)=>x>=0&&x<64&&y>=0&&y<64&&pixels[(y*64+x)*4+3],start={x:Math.round(from.x),y:Math.round(from.y)},seen=new Set(),queue=[start];seen.add(start.y*64+start.x);
 for(let i=0;i<queue.length;i++){const p=queue[i];if(Math.hypot(p.x-to.x,p.y-to.y)<2)return true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=p.x+dx,y=p.y+dy,k=y*64+x;if(exists(x,y)&&!seen.has(k)){seen.add(k);queue.push({x,y});}}}return false;
}
test('base Brakk removes the old sleeves/hands from the body and paints one authored pair',()=>{
 for(let dir=0;dir<8;dir++){
  const rig=nativePoseRig(spec,{id:'brakk'},'idle',.25),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),skin=rig.artArmSkin;
  assert.ok(skin,'authored arm skin is active');assert.ok(skin.art.mask.size>=10,'actual source cuff/hand pixels are extracted');
  assert.equal(skin.bodyPixels.filter(p=>!p.bodyUnderlay&&skin.art.mask.has(p.y*64+p.x)).length,0,'no old arm is left in the costume layer');
  for(const profile of skin.art.profiles.values()){
   assert.ok(profile.pixels.length>=8,'source arm width and cuff texture are retained');
   if(dir===4&&profile.side===1){
    // In the original west cell the complete NEAR glove is at x35-39.
    // The old x40 landmark selected only its outside outline column.
    assert.ok(profile.grid.has(35*64+37),'the actual green glove moves');
    assert.ok(new Set(profile.pixels.map(p=>p.x)).size>=4,'the complete source glove retains its width');
   }
  }
  assert.equal(pixels.clipped,0);
 }
});
test('base Brakk arms stay connected and unclipped through every facing and combat motion',()=>{
 for(const state of NATIVE_POSES)for(let dir=0;dir<8;dir++)for(const phase of [0,.2,.43,.7,1]){
  const rig=nativePoseRig(spec,{id:'brakk'},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
  assert.equal(pixels.clipped,0,`${state} ${dir} ${phase}`);
  for(const arm of rig.arms)if(rig.artArmSkin.art.profiles.has(rig.artArmScreens[arm.side]))assert.ok(connected(pixels,rig.artArmRoots[arm.side],rig.artProject(arm.end)),`${state} ${dir} ${phase}: cuff, elbow and fist stay joined`);
 }
});
test('Brakk waves with his free hand while his hatchet remains on its original hand',()=>{
 for(let i=0;i<=32;i++){
  const rig=starterReactionRig(spec,i/32),pixels=paintCharacterPixels(rig.id,rig,Math.PI/2),main=rig.arms.find(a=>a.side===(rig.weapon.hand==='left'?-1:1));
  assert.equal(rig.weapon.hand,'right');assert.equal(rig.weapon.active,false);assert.deepEqual(main.end,rig.weapon.grip);assert.equal(pixels.clipped,0);
  for(const arm of rig.arms)assert.ok(connected(pixels,rig.artArmRoots[arm.side],rig.artProject(arm.end)),'both arms remain connected during the wave');
 }
});
