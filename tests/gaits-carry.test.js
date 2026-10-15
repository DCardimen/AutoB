import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels,spritePoint} from '../prototype-pixel-art.js';
import {paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {QUADRUPEDS} from '../creature-leg-volume.js';

const quadrupeds=[...QUADRUPEDS].map(design=>PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design));
const humanoids=[...new Map(PIXEL_SPECIES.filter(s=>['knight','orc','elf','caster','fox'].includes(s.nativeRig)).map(s=>[s.nativeDesign||s.nativeRig,s])).values()];

test('every four-leg physics proxy has an explicit source-anatomy classification',()=>{
 // The drake source stands on two visible rear feet; a wolf proxy does not
 // justify inventing forelegs beneath its wings. Review new exceptions in art.
 const exceptions=new Map([
  ['drake','Authored bipedal rear-foot stance with wings; covered by Legs V3 source review.'],
  ['mantis','Six-limbed arthropod: four walking legs plus two raptorial arms; creature-anatomy tests cover its gait rig and scythe contacts.'],
 ]);
 for(const spec of PIXEL_SPECIES){
  const rig=nativePoseRig(spec,{id:spec.id},'idle',.25);if(rig.legs.length!==4)continue;
  const design=spec.nativeDesign||spec.nativeRig;
  assert.ok(QUADRUPEDS.has(design)||exceptions.has(design),`${spec.id}: review the original anatomy and register ${design} in QUADRUPEDS or document/test its source-art exception; do not silently skip alternating-gait coverage`);
 }
});

test('all quadruped anatomies alternate visible footfall groups through walk, run and sprint in every form and facing',()=>{
 for(const spec of quadrupeds)for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++)for(const state of ['walk','run','sprint']){
  const support=[],lowerFrames=[];let cut;
  for(const phase of [0,.25,.5,.75]){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4),limbs=rig.artLegSkin.limbs;
   assert.ok(limbs.length>=2,`${spec.id} ${evolution} ${dir}: visible paws must not be merged into one foot`);
   assert.ok(limbs.some(l=>l.planted),`${spec.id} ${state} ${dir}: no synchronized hop`);
   support.push(limbs.map(l=>l.planted));assert.equal(pixels.clipped,0);
   cut??=Math.max(0,Math.floor(rig.artLegRegistration.cutY));lowerFrames.push(createHash('sha256').update(pixels.slice(cut*64*4)).digest('hex'));
  }
  assert.notDeepEqual(support[1],support[3],`${spec.id} ${state} ${dir}: opposite half-cycles alternate`);
  assert.notEqual(lowerFrames[1],lowerFrames[3],`${spec.id} ${state} ${dir}: alternating feet must change the actual lower-body pixels`);
 }
});

test('humanoid weapon identity and authored carry hand remain fixed throughout walking cycles',()=>{
 for(const spec of humanoids)for(const evolution of [0,2])for(let dir=0;dir<8;dir++)for(const state of ['walk','run','sprint']){
  let identity,side;
  for(const phase of [0,.25,.5,.75]){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
   assert.equal(pixels.clipped,0,`${spec.id} ${state} ${dir}`);
   identity??=rig.artWeaponIdentity;assert.deepEqual(rig.artWeaponIdentity,identity,`${spec.id}: carry must not swap hands or weapons with gait phase`);
   if(!rig.weapon)continue;
   assert.ok(rig.artWeaponIdentity?.kind&&rig.artWeaponIdentity?.hand,'carry has a definite weapon and wielding hand');
   const arm=rig.arms.find(a=>a.side===(rig.weapon.hand==='left'?-1:1)),grip=rig.artProject(rig.weapon.grip),hand=rig.artProject(arm.end);
   assert.ok(Math.hypot(grip.x-hand.x,grip.y-hand.y)<1e-7,'weapon stays in its wielding hand');
   const actualSide=Math.sign(grip.x-rig.artAnchors.body.x);side??=actualSide;
   assert.equal(actualSide,side,`${spec.id} ${state} ${dir}: visible grip must not jump across the torso`);
  }
 }
});

class BodyBrush{
 constructor(){this.data=new Uint8ClampedArray(64*64*4);}
 dot(x,y,color){x=Math.round(x);y=Math.round(y);assert.ok(x>=0&&x<64&&y>=0&&y<64,'complete source body fits its cell');this.data.set([...color.slice(1).match(/../g).map(v=>parseInt(v,16)),255],(y*64+x)*4);}
 line(a,z,color){const count=Math.max(1,Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)*2));for(let i=0;i<=count;i++)this.dot(a.x+(z.x-a.x)*i/count,a.y+(z.y-a.y)*i/count,color);}
}

test('production humanoids retain painted boots and clothing with no replacement leg mesh showing through',()=>{
 for(const spec of humanoids)for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++)for(const state of ['idle','run']){
  const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,.25),brush=new BodyBrush();rig.dir=dir;
  paintAtlasCharacter(brush,rig.id,rig,p=>spritePoint(p,dir*Math.PI/4));
  assert.equal(rig.artLegSkin.mode,'authored');assert.equal(rig.artLegFaces,undefined);assert.equal(rig.artLegVolumes,undefined);
  const palette=new Set(rig.artLegSkin.palette.map(c=>c.slice(1)));
  for(let y=Math.ceil(rig.artLegRegistration.cutY);y<64;y++)for(let x=0;x<64;x++){
   const i=(y*64+x)*4;if(!brush.data[i+3])continue;
   const color=[0,1,2].map(k=>brush.data[i+k].toString(16).padStart(2,'0')).join('');assert.ok(palette.has(color),'legs use their costume texture, not skeletal lines');
  }
 }
});
