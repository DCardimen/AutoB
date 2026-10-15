import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {AUTHORED_SPRITES} from '../authored-sprite-data.js';
import {AUTHORED_BODIES} from '../authored-body-data.js';
import {AUTHORED_FAMILIES} from '../authored-family-data.js';
import {AUTHORED_LEGACY} from '../authored-legacy-data.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {PORTRAIT_PROFILES,portraitExpressionAt,portraitExpressionLayer} from '../portrait-expressions.js';
import {starterReactionProfile,starterReactionPose,starterReactionPixels} from '../starter-reactions.js';
const art={...AUTHORED_SPRITES,...AUTHORED_BODIES,...AUTHORED_FAMILIES,...AUTHORED_LEGACY};
const designs=[...new Map(PIXEL_SPECIES.map(s=>[s.nativeDesign||s.nativeRig,s])).values()];
const hash=p=>createHash('sha256').update(p).digest('hex');

test('every authored design has a distinct reviewed gesture and no whole-sprite swing',()=>{
 const gestures=new Set();
 for(const spec of designs){
  const profile=starterReactionProfile(spec);gestures.add(profile.gesture);
  assert.ok(profile.duration>=2000&&profile.duration<=2800);
  for(let i=0;i<=24;i++){
   const pose=starterReactionPose(spec,i/24),expression=portraitExpressionAt(spec.nativeDesign||spec.nativeRig,i/24);
   assert.equal(pose.x,0);assert.equal(pose.y,0);assert.equal(pose.roll,0);
   assert.ok(['open','smile','scowl','surprise','focus'].includes(expression.mode),'no blink, wink or closed-eye mode');
  }
 }
 assert.equal(gestures.size,designs.length,'no family falls back to another family’s generic gesture');
});

test('source expressions keep pupil centers open, retain source palette indices and touch only the face',()=>{
 for(const [design,a]of Object.entries(art)){
  const pixels=[];for(let i=0;i<4096;i++){const index=parseInt(a.frames[2].slice(i*2,i*2+2),16);if(index)pixels.push({x:i%64,y:Math.floor(i/64),index,rgb:a.palette[index].match(/../g).map(c=>parseInt(c,16))});}
  const asset={pixels},profile=PORTRAIT_PROFILES[design];assert.ok(profile,design);
  const original=new Map(pixels.map(p=>[p.y*64+p.x,p.index]));
  for(const progress of [.2,.4,.65,.8]){
   const layer=portraitExpressionLayer(pixels,asset,design,progress),current=new Map(layer.map(p=>[p.y*64+p.x,p.index]));
   assert.deepEqual([...current.keys()],[...original.keys()],'no source silhouette pixels added or removed');
   for(const p of layer){assert.ok(p.index>0&&p.index<a.palette.length);if(p.y>profile.neck)assert.equal(p.index,original.get(p.y*64+p.x),'body costume/limbs are untouched by facial expressions');}
   if(design!=='mech')for(const [cx,cy]of profile.eyes)for(const [dx,dy]of [[0,0],[-1,1],[1,1]])assert.equal(current.get((cy+dy)*64+cx+dx),original.get((cy+dy)*64+cx+dx),design+' retains its visible iris/pupil');
  }
 }
});

test('all 89 companion variants have a visible local greeting and complete cells at every height limit',()=>{
 for(const spec of PIXEL_SPECIES)for(const height of [.85,1,1.1]){
  const frames=new Set();
  for(const progress of [0,.12,.2,.35,.5,.65,.8,.9,1]){
   const pixels=starterReactionPixels(spec,progress,height);assert.equal(pixels.clipped,0,`${spec.id} ${height} ${progress}`);frames.add(hash(pixels));
  }
  assert.ok(frames.size>2,spec.id+' changes painted features, independently of a CSS swing');
 }
});
