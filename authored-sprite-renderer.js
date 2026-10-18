import {AUTHORED_SPRITES as HERO_ART} from './authored-sprite-data.js';
import {AUTHORED_BODIES} from './authored-body-data.js';
import {AUTHORED_FAMILIES} from './authored-family-data.js';
import {AUTHORED_SPRITES_STAGE1} from './authored-sprite-stage1-data.js';
import {AUTHORED_SPRITES_STAGE2} from './authored-sprite-stage2-data.js';
import {AUTHORED_BODIES_STAGE1} from './authored-body-stage1-data.js';
import {AUTHORED_BODIES_STAGE2} from './authored-body-stage2-data.js';
import {AUTHORED_FAMILIES_STAGE1} from './authored-family-stage1-data.js';
import {AUTHORED_FAMILIES_STAGE2} from './authored-family-stage2-data.js';
import {AUTHORED_LEGACY} from './authored-legacy-data.js';
import {AUTHORED_LEGACY_STAGE1} from './authored-legacy-stage1-data.js';
import {AUTHORED_LEGACY_STAGE2} from './authored-legacy-stage2-data.js';
import {meleeWeaponBounds} from './melee-weapon-art.js';
import {authoredArmArt} from './authored-arm-skin.js';
import {authoredParts,connectAuthoredArm,constrainHeldGrip} from './authored-parts.js';
import {NATURAL_ANATOMY,naturalHeadWeight,naturalHeadDelta,companionFallAngle} from './companion-anatomy.js';
import {portraitExpressionAt,portraitExpressionLayer,portraitSourceOffset} from './portrait-expressions.js';
import {characterRig,projectRig} from './prototype-rig.js';
import {buildLegVolumes} from './leg-volume.js';
import {creatureLegArt,skinCreatureLegs,QUADRUPEDS} from './creature-leg-volume.js';
import {creatureMouthSource} from './creature-attacks.js';
import {legAnatomy,sampleLegMaterial} from './leg-anatomy.js';
// Directional artwork is skinned to the same anatomical action poses as combat.
// The imported art is never blurred, rotated by Canvas, or stretched as one bitmap.
const decoded=new Map(),rests=new Map(),CELL=64,PIVOT={x:32,y:44};
const variantPalettes=new WeakMap(),materialRamps=new WeakMap(),colorInfo=new Map();
const AUTHORED_SPRITES={...HERO_ART,...AUTHORED_BODIES,...AUTHORED_FAMILIES,...AUTHORED_LEGACY};
const STAGES=[AUTHORED_SPRITES,{...AUTHORED_SPRITES_STAGE1,...AUTHORED_BODIES_STAGE1,...AUTHORED_FAMILIES_STAGE1,...AUTHORED_LEGACY_STAGE1},{...AUTHORED_SPRITES_STAGE2,...AUTHORED_BODIES_STAGE2,...AUTHORED_FAMILIES_STAGE2,...AUTHORED_LEGACY_STAGE2}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
const point=(p,angle)=>{const q=projectRig(p,angle);return {x:32+q.x/3,y:44+q.y/3};};
export function atlasIdentity(id,rig){
 const species=rig.artSpecies==='faerie'?'fairy':rig.artSpecies==='flyer'?'harpy':rig.artSpecies;
 if(AUTHORED_SPRITES[species])return species;
 const designs={goblin:'goblin',faerie:'fairy',dwarf:'dwarf',minotaur:'minotaur',skeleton:'skeleton',serpent:'serpent',harpy:'harpy',moth:'moth',crab:'crab',centipede:'centipede',lion:'lion',bear:'bear',stag:'stag',drake:'drake',beetle:'beetle',bat:'bat',phoenix:'phoenix',rogue:'rogue',frostelf:'frostelf',troll:'troll'};
 if(rig.grand?.motif==='leviathan')return id==='serpent'?'serpent':'jelly';
 if(designs[rig.design]&&AUTHORED_SPRITES[designs[rig.design]])return designs[rig.design];
 if(id==='flyer')return 'harpy';
 return AUTHORED_SPRITES[id]?id:null;
}
// A few evolved crab/walker source frames begin halfway through a crystal, even
// though the atlas has transparent space above that flat cut. Restore a
// tapered, faceted cap in the existing crystal palette before pose fitting.
// Virtual source rows can extend above zero; fitting gives the entire crown
// headroom rather than clipping it back to the original cell.
function restoreCrystalCrown(pixels,colors){
 const top=Math.min(...pixels.map(p=>p.y)),blue=p=>p.rgb[2]>p.rgb[0]*1.5&&p.rgb[2]>p.rgb[1]*1.04;
 const rim=pixels.filter(p=>p.y===top&&blue(p));if(rim.length<6)return;
 const left=Math.min(...rim.map(p=>p.x)),right=Math.max(...rim.map(p=>p.x)),width=right-left+1;
 if(width<7)return;
 const center=(left+right)/2,height=Math.min(9,Math.max(5,Math.round(width*.32)));
 // Reuse the intact juvenile crystal's painted facets, rather than inventing
 // a flat triangle above a textured shell. Palette matching stays inside this
 // evolved frame's blue material, including its dark rim and bright glints.
 const source=STAGES[0].crab,hex=source.frames[0],template=[];
 for(let y=0;y<18;y++)for(let x=0;x<64;x++){
  const index=parseInt(hex.slice((y*64+x)*2,(y*64+x)*2+2),16);if(!index)continue;
  const rgb=source.palette[index].match(/../g).map(c=>parseInt(c,16));if(blue({rgb}))template.push({x,y,rgb});
 }
 const tip=Math.min(...template.map(p=>p.y)),cap=template.filter(p=>p.y<tip+8),base=cap.filter(p=>p.y===tip+7),tl=Math.min(...base.map(p=>p.x)),tr=Math.max(...base.map(p=>p.x)),tc=(tl+tr)/2;
 const grid=new Map(cap.map(p=>[p.y*64+p.x,p])),swatches=pixels.filter(p=>p.y<top+12&&blue(p));
 const matched=new Map();
 for(let row=0;row<height;row++)for(let x=Math.floor(center-width*.6);x<=Math.ceil(center+width*.6);x++){
  const sx=Math.round(tc+(x-center)*(tr-tl+1)/width),sy=tip+Math.min(7,Math.floor(row*8/height)),sample=grid.get(sy*64+sx);if(!sample)continue;
  const key=sample.rgb.join(',');if(!matched.has(key))matched.set(key,swatches.reduce((best,p)=>p.rgb.reduce((n,v,i)=>n+(v-sample.rgb[i])**2,0)<best.rgb.reduce((n,v,i)=>n+(v-sample.rgb[i])**2,0)?p:best,swatches[0]));
  const p=matched.get(key);pixels.push({x,y:top-height+row,index:p.index,rgb:p.rgb,color:colors[p.index],crownRepair:true});
 }
}
// The apex stag sheet includes a blue/brown painted ground strip in six
// facings. It is scenery, not a hoof: retaining it creates a colored platform
// that moves with the legs. These measured trims leave the actual toe rows.
function cleanStagSoles(pixels,colors,dir){
 const trim=[2,2,0,0,3,2,1,2][dir];if(!trim)return;
 const bottom=Math.max(...pixels.map(p=>p.y)),sole=bottom-trim;
 for(let i=pixels.length-1;i>=0;i--)if(pixels[i].y>sole)pixels.splice(i,1);
 const dark=colors.indexOf('#453329'),shadow=colors.indexOf('#331f13');
 for(const p of pixels)if(p.y===sole&&dark>=0&&shadow>=0){p.index=p.x%3?dark:shadow;p.color=colors[p.index];p.rgb=p.color.slice(1).match(/../g).map(c=>parseInt(c,16));}
}
function frameFor(id,dir,stage=0){const key=id+':'+dir+':'+stage;if(!decoded.has(key)){const a=STAGES[stage][id],hex=a.frames[dir],colors=a.palette.map(c=>'#'+c),pixels=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=parseInt(hex.slice((y*64+x)*2,(y*64+x)*2+2),16);if(n)pixels.push({x,y,color:colors[n],rgb:colors[n].slice(1).match(/../g).map(v=>parseInt(v,16)),index:n});}if(['crab','mech'].includes(id)&&stage)restoreCrystalCrown(pixels,colors,id,stage);if(id==='stag'&&stage===2)cleanStagSoles(pixels,colors,dir);const shades=pixels.filter(p=>Math.max(...p.rgb)-Math.min(...p.rgb)<48&&Math.min(...p.rgb)>45&&Math.max(...p.rgb)<232).sort((a,b)=>a.rgb.reduce((n,v)=>n+v,0)-b.rgb.reduce((n,v)=>n+v,0));const metal=shades.length>12?[.08,.4,.72,.95].map(t=>shades[Math.floor((shades.length-1)*t)].color):null;decoded.set(key,{pixels,colors,metal});}return decoded.get(key);}
export const authoredIdentities=Object.keys(AUTHORED_SPRITES);
export const authoredSourceFrame=(identity,dir,stage=0)=>frameFor(identity,dir,stage);
const eyeColor=(id,[r,g,b])=>id==='elf'?g>r*1.2&&g>b*1.1:id==='caster'?b>g*1.5&&r<90&&b<90:['knight','fox','orc','goblin','fairy','dwarf','minotaur','rogue','troll','skeleton','frostelf'].includes(id)?Math.max(r,g,b)<65:false;
function restFor(id){if(!rests.has(id))rests.set(id,characterRig(id,'idle',.25));return rests.get(id);}
function difference(a,b){return {x:a.x-b.x,y:a.y-b.y};}
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function handLandmarks(asset,identity,stage){
 if(asset.hands)return asset.hands;
 const hands={},expectedY=stage?(['orc','minotaur','troll','knight','goblin','dwarf','rogue'].includes(identity)?38:31):34;
 for(const side of [-1,1]){
  const expectedX=32+side*11,candidates=asset.pixels.filter(p=>p.y>=expectedY-4&&p.y<=expectedY+3&&Math.abs(p.x-expectedX)<=5).filter(p=>{const [r,g,b]=p.rgb;return ['orc','goblin','troll'].includes(identity)?g>r*.9&&g>b*1.12:identity==='knight'?Math.max(r,g,b)-Math.min(r,g,b)<65&&r>40:r>g*1.12&&g>b*1.1&&r>65;});
  const seed=candidates.sort((a,b)=>Math.hypot(a.x-expectedX,a.y-expectedY)-Math.hypot(b.x-expectedX,b.y-expectedY))[0];if(seed)hands[side]={...seed};
 }asset.hands=hands;asset.handMask=new Set(asset.pixels.filter(p=>Object.values(hands).some(h=>Math.hypot(p.x-h.x,p.y-h.y)<3.6||Math.abs(p.x-h.x)<2.8&&p.y>=h.y-5&&p.y<=h.y)));return hands;
}
// Variant materials are selected by palette color, never by pixel height. A
// swatch therefore has one meaning across the face, body, limbs and animation.
// Neutral highlights, white fur, warm skin and unrelated costume accents stay
// in the authored palette. Complete evolved atlases already carry their colors.
const MATERIAL_HUES={
 knight:{neutral:true},orc:[54,100],goblin:[54,100],troll:[48,105],minotaur:[12,40],
 elf:[65,165],fox:[65,165],fairy:[65,165],dwarf:[155,200],caster:[270,330],
 rogue:[200,250],frostelf:[205,255],skeleton:[270,325],harpy:[195,265],
 wolf:[15,45],mech:[17,45],feralfox:[17,45],rabbit:[17,45],rodent:[22,48],owl:[17,45],stag:[17,45],
 rhino:{neutral:true},cat:{neutral:true},turtle:[55,160],drake:[190,280],
 beetle:[265,320],bat:[265,320],phoenix:[15,55],spider:[265,315],
 jelly:[155,225],serpent:[155,225],fish:[155,225],mushroom:[345,15],
 moth:[270,335],crab:[50,110],mantis:[55,150],clam:[270,335],squid:[270,335],
};
const COSTUME_VARIANTS=new Set(['elf','fox','fairy','dwarf','caster','rogue','frostelf','skeleton','harpy']);
const colorHsl=hex=>{if(colorInfo.has(hex))return colorInfo.get(hex);const [r,g,b]=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=d?(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60:0;const value={h,s:d?d/(1-Math.abs(2*l-1)):0,l};colorInfo.set(hex,value);return value;};
const hslColor=({h,s,l})=>{h=(h%360+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2,rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');};
function materialColor(identity,color){
 const profile=MATERIAL_HUES[identity];if(!profile)return false;
 const {h,s,l}=colorHsl(color);if(l<.13||l>.85)return false;
 if(profile.neutral)return s<.23&&l<.76;
 return s>.2&&(profile[0]<=profile[1]?h>=profile[0]&&h<=profile[1]:h>=profile[0]||h<=profile[1]);
}
export function authoredMaterialColors(identity,colors,rig){
 // Equipment is rendered at its own attachment; it cannot dye a whole body.
 if(!rig.artVariant||!MATERIAL_HUES[identity])return colors;
 const material=COSTUME_VARIANTS.has(identity)?'cloth':'skin',target=(rig.artVariantPalette||rig.palette)?.[material]?.[1];if(!target)return colors;
 let cache=variantPalettes.get(colors);if(!cache){cache=new Map();variantPalettes.set(colors,cache);}
 const key=identity+':'+target;if(cache.has(key))return cache.get(key);
 const to=colorHsl(target),profile=MATERIAL_HUES[identity],center=profile.neutral?to.h:(profile[0]+((profile[1]-profile[0]+360)%360)/2)%360;
 const mapped=colors.map(color=>{if(!materialColor(identity,color))return color;const from=colorHsl(color),offset=((from.h-center+540)%360)-180;return hslColor({h:to.h+(profile.neutral?0:offset*.3),s:to.s*.65+from.s*.35,l:from.l});});
 cache.set(key,mapped);return mapped;
}
function materialRamp(identity,colors,mapped){
 let cache=materialRamps.get(mapped);if(!cache){cache=new Map();materialRamps.set(mapped,cache);}if(cache.has(identity))return cache.get(identity);
 const shades=colors.map((color,index)=>({color:mapped[index],l:colorHsl(color).l,match:materialColor(identity,color)})).filter(p=>p.match).sort((a,b)=>a.l-b.l);
 const ramp=shades.length>=3?[.15,.5,.85].map(t=>shades[Math.floor((shades.length-1)*t)].color):null;cache.set(identity,ramp);return ramp;
}
function handHighlight(asset,mapped,hand){
 if(!hand)return null;
 if(hand.highlightIndex===undefined){const base=colorHsl(hand.color),shades=asset.colors.map((color,index)=>({index,...colorHsl(color)})).filter(p=>p.l>base.l+.04&&p.l<base.l+.22&&Math.abs(p.s-base.s)<.25&&(base.s<.15||Math.abs(((p.h-base.h+540)%360)-180)<22)).sort((a,b)=>a.l-b.l);hand.highlightIndex=shades[0]?.index??hand.index;}
 return mapped[hand.highlightIndex];
}
const GEAR={
 knight:[[35,33,45,25],[27,33,44,28],[24,33,17,25],[39,33,23,28],[29,33,18,25],[40,33,43,24],[41,34,43,25],[25,33,42,26]],
 orc:[[38,34,44,28],[39,34,44,28],[23,35,17,29],[26,34,20,28],[26,34,19,29],[25,35,19,29],[25,35,19,29],[39,34,43,28]],
 elf:[[43,33,44,25],[44,33,45,25],[43,33,44,25],[22,33,21,25],[22,33,21,25],[23,34,22,25],[43,34,44,25],[44,33,45,25]],
 caster:[[45,32,46,17],[45,32,46,17],[44,32,45,17],[21,32,20,17],[20,32,19,17],[20,32,19,17],[45,32,46,17],[45,32,46,17]],
 fox:[[43,34,44,27],[44,34,45,27],[43,34,44,27],[22,34,21,27],[21,34,20,27],[23,34,22,27],[44,34,45,27],[44,34,45,27]],
 goblin:[[37,36,45,30],[27,36,43,34],[24,36,20,30],[39,36,24,34],[26,36,19,30],[39,36,44,30],[42,36,43,31],[25,36,39,30]],
};
GEAR.dwarf=GEAR.knight;GEAR.rogue=GEAR.knight;GEAR.frostelf=GEAR.caster;GEAR.skeleton=GEAR.elf;GEAR.troll=GEAR.orc;GEAR.minotaur=GEAR.orc;
function gearDistance(x,y,g){const dx=g[2]-g[0],dy=g[3]-g[1],t=clamp(((x-g[0])*dx+(y-g[1])*dy)/(dx*dx+dy*dy),-.18,1.15);return Math.hypot(x-g[0]-t*dx,y-g[1]-t*dy);}
function completeBodyLayer(asset,identity,stage,sourceGear,armMask){
 if(asset.parts){asset.bodyRepairs=asset.parts.repairs;return asset.parts.body;}
 if(asset.bodyLayer)return asset.bodyLayer;
 const removed=p=>armMask?.has(p.y*64+p.x)||(asset.handMask?.has(p)&&Math.abs(p.x-32)>6)||(!AUTHORED_SPRITES[identity].weaponless&&sourceGear&&gearDistance(p.x,p.y,sourceGear)<(identity==='orc'?4.5:identity==='caster'?3:2.8)&&Math.abs(p.x-32)>7&&p.y>=(identity==='caster'?12:25));
 const retained=asset.pixels.filter(p=>!removed(p)),grid=new Map(retained.map(p=>[p.y*64+p.x,p])),rows=new Map(),repairs=[];
 const top=identity==='orc'?28:30,bottom=stage?41:38,radius=stage?12:9;
 // Infer the chest/waist silhouette from connected costume pixels. Never
 // fill the empty space outside the body where a resting fist used to be.
 for(let y=top-2;y<=bottom+2;y++){
  const seed=[32,31,33,30,34].find(x=>grid.has(y*64+x));if(seed===undefined)continue;
  let left=seed,right=seed;
  while(left>32-radius&&grid.has(y*64+left-1))left--;
  while(right<32+radius&&grid.has(y*64+right+1))right++;
  rows.set(y,{left,right});
 }
 for(const p of asset.pixels){
  if(!removed(p)||p.y<top||p.y>bottom)continue;
  const neighbors=[-2,-1,0,1,2].map(dy=>rows.get(p.y+dy)).filter(Boolean);if(!neighbors.length)continue;
  const left=neighbors.map(r=>r.left).sort((a,b)=>a-b)[Math.floor((neighbors.length-1)*.25)],right=neighbors.map(r=>r.right).sort((a,b)=>a-b)[Math.ceil((neighbors.length-1)*.75)];
  if(p.x<left||p.x>right)continue;
  // Continue the adjacent material into the covered area, including its
  // existing folds, belt and armor shading. Sample inward, never from a hand.
  const side=Math.sign(p.x-32)||1,core=[32,31,33,30,34].map(x=>grid.get(p.y*64+x)).find(Boolean);if(!core)continue;
  const material=colorHsl(core.color);let sample;
  for(let step=1;step<=radius&&!sample;step++){
   const candidate=grid.get(p.y*64+p.x-side*step);if(!candidate)continue;
   const tone=colorHsl(candidate.color),hue=Math.abs(((tone.h-material.h+540)%360)-180);
   if(material.s<.18?tone.s<.28:tone.s>=.18&&hue<=24)sample=candidate;
  }
  sample??=core;
  if(sample)repairs.push({...p,color:sample.color,rgb:sample.rgb,index:sample.index,bodyUnderlay:true});
 }
 asset.bodyRepairs=repairs;
 return asset.bodyLayer=[...retained,...repairs];
}
function legProfiles(asset,footIndices,footDeltas,identity,stage){
 const key=footDeltas.map(f=>f.anchor.x.toFixed(2)).join(':');asset.legProfiles??=new Map();if(asset.legProfiles.has(key))return asset.legProfiles.get(key);
 const robe=['caster','frostelf','elf','fox','skeleton'].includes(identity),cut=robe?(stage?43:41):(stage?40:38),mask=new Set(),repairs=[];
 const profiles=footDeltas.map((foot,index)=>{
  let pixels=asset.pixels.filter(p=>p.y>=cut&&Math.abs(p.x-32)<15&&footIndices[p.y*65+p.x]===index);
  if(!pixels.length)pixels=asset.pixels.filter(p=>p.y>=cut&&Math.abs(p.x-foot.anchor.x)<5);
  const bottom=pixels.length?Math.max(...pixels.map(p=>p.y)):46,sole=pixels.filter(p=>p.y>=bottom-2),centerX=sole.length?sole.reduce((n,p)=>n+p.x,0)/sole.length:foot.anchor.x;
  const rows=new Map();for(const p of pixels)rows.set(p.y,(rows.get(p.y)||0)+1);
  const width=Math.min(stage?9:7,Math.max(4,...rows.values())),anatomy=legAnatomy(identity),radius=anatomy.radius*(1+stage*.13),ankleY=bottom-1.5,hipY=robe?cut-3:cut-.5;
  for(const p of pixels)if(Math.abs(p.x-centerX)<=width*.65+1)mask.add(p.y*64+p.x);
  const clothPixels=pixels.filter(p=>!asset.handMask?.has(p));
  const material=(lo,hi)=>{
   const region=clothPixels.filter(p=>p.y>=lo&&p.y<=hi);
   return sampleLegMaterial(asset,region.length?region:clothPixels);
  };
  const mid=(hipY+ankleY)/2,boot=material(bottom-3,bottom),materials={thigh:material(cut,mid+1),calf:material(mid-1,bottom-2),boot,sole:[boot[0],boot[0],boot[1],boot[1]]},bands={};
  // A thigh/calf/boot keeps its material through the bend. Resampling every
  // vertical stripe made folds turn into unrelated colors along one shin.
  return {centerX,hipY,ankleY,radius,calf:anatomy.calf,bootLength:radius*2.35,materials,bands};
 });
 // The pelvis remains complete when either thigh moves away. Only the upper
 // two rows inside the hips are restored; the natural gap between legs stays.
 const grid=new Map(asset.pixels.map(p=>[p.y*64+p.x,p]));
 for(const p of asset.pixels)if(mask.has(p.y*64+p.x)&&p.y<=cut+1&&Math.abs(p.x-32)<(stage?10:8)){
  const sample=grid.get((cut-1)*64+p.x)||grid.get((cut-2)*64+p.x)||grid.get((cut-1)*64+32);
  if(sample)repairs.push({...p,index:sample.index,color:sample.color,rgb:sample.rgb,hipUnderlay:true});
 }
 const result={profiles,mask,repairs};asset.legProfiles.set(key,result);return result;
}
export function paintAtlasCharacter(b,id,rig,at){
 const identity=atlasIdentity(id,rig);if(!identity)return false;
 const artStage=Math.min(2,rig.artStage??rig.form??0),asset=frameFor(identity,rig.dir,artStage),rest=rig.artBind||restFor(id),angle=rig.dir*Math.PI/4,base=q=>point(q,angle),poseHead=at(rig.head),poseBody=at(rig.body),posePelvis=at(rig.pelvis),head0=base(rest.head),body0=base(rest.body),pelvis0=base(rest.pelvis),dh=difference(poseHead,head0),dc=difference(poseBody,body0),dp=difference(posePelvis,pelvis0);
 const bodyPlan=NATURAL_ANATOMY[identity]?.plan,idleAmplitude=['shell','crustacean','walker','rooted'].includes(bodyPlan)?.65:['floating','tentacled','finned'].includes(bodyPlan)?.8:rig.legs.length>2?.7:1;
 const idleLift=rig.state==='idle'?Math.sin(rig.phase*Math.PI*2)*idleAmplitude:0;dh.y+=idleLift;dc.y+=idleLift;dp.y+=idleLift*.55;
 const humanoid=rig.arms.length>0||identity==='fairy'||identity==='harpy'||identity==='skeleton'||identity==='rogue'||identity==='frostelf',parts=rig.arms.length?authoredParts(asset,identity,artStage,rig.dir):null,scale=rig.artScale||{width:1,height:1},headCut=parts?.registration.neck??(identity==='orc'?27:29),headCenter={x:32,y:headCut-9},bodyCenter={x:32,y:33};
 const sourceHands=parts?.hands||(rig.arms.length?handLandmarks(asset,identity,artStage):{}),artColors=authoredMaterialColors(identity,asset.colors,rig);
 rig.artArmPalette=materialRamp(identity,asset.colors,artColors);
 const headRoll=rig.ragdoll?0:clamp((rig.lean||0)*Math.cos(angle)+(rig.sideLean||0)*Math.sin(angle),-.08,.08),cos=Math.cos(headRoll),sin=Math.sin(headRoll);
 const footDeltas=rig.legs.map((l,i)=>{const original=rest.legs[i]||rest.legs[0],end0=base(original.end);return {delta:difference(at(l.end),end0),knee:difference(at(l.joint),base(original.joint)),root:difference(at(l.root),base(original.root)),pitch:l.foot?.pitch||0,anchor:{x:32+(end0.x-32)*(humanoid?2.4:1.45),y:45+(end0.y-43)*.6}};});
 // Source-foot ownership is constant for a bind pose. Cache it once instead
 // of doing a nearest-leg search three times for every painted pixel/frame.
 const footKey=JSON.stringify(footDeltas.map(f=>f.anchor));asset.footAssignments??=new Map();
 let footIndices=asset.footAssignments.get(footKey);
 if(!footIndices&&footDeltas.length){footIndices=new Uint8Array(65*65);for(let y=31;y<65;y++)for(let x=0;x<65;x++){let best=0,bestD=Infinity;for(let i=0;i<footDeltas.length;i++){const f=footDeltas[i],d=humanoid?Math.abs(x-f.anchor.x):Math.hypot(x-f.anchor.x,y-f.anchor.y);if(d<bestD){best=i;bestD=d;}}footIndices[y*65+x]=best;}asset.footAssignments.set(footKey,footIndices);}
 const footAt=(x,y)=>footDeltas[footIndices[Math.max(0,Math.min(64,Math.round(y)))*65+Math.max(0,Math.min(64,Math.round(x)))]];
 const naturalLegs=rig.legs.length>2;
 const solidLegs=Boolean(rig.debugLegVolumes)&&!naturalLegs&&humanoid&&rig.legs.length===2&&['knight','orc','elf','caster','fox'].includes(id),authoredLegs=rig.legs.length>0&&!solidLegs;
 if(QUADRUPEDS.has(rig.design||id)&&['walk','run','sprint','turn','stop'].includes(rig.state)){const oldY=dc.y;dc.y=clamp(dc.y,-.7,.7);dh.y=dc.y+clamp(dh.y-oldY,-1,1);dc.x=clamp(dc.x,-1.2,1.2);}
 const legArt=authoredLegs?creatureLegArt(asset,rig,artColors):solidLegs?legProfiles(asset,footIndices,footDeltas,identity,artStage):null;
 const trunkTop=headCut+3,trunkLength=Math.max(4,(legArt?.rootY??40)-trunkTop),trunkLimit=(v,extent)=>extent*Math.tanh(v/extent),paintedPelvis={x:dc.x+trunkLimit(dp.x-dc.x,trunkLength*.35*scale.width),y:dc.y+trunkLimit(dp.y-dc.y,trunkLength*.35*scale.height)};
 const legSkin=authoredLegs?skinCreatureLegs(rig,rest,angle,legArt,humanoid&&!NATURAL_ANATOMY[identity]?paintedPelvis:dc):null;
 const legMesh=solidLegs?buildLegVolumes(rig,legArt.profiles,rest,angle,scale,artColors):null;
 const mouthSource=rig.creatureAttack&&creatureMouthSource(rig);
 const armDeltas=rig.arms.map((a,i)=>{const orig=rest.arms[i]||rest.arms[0],end0=base(orig.end);return {side:a.side,delta:difference(at(a.end),end0),end:at(a.end),anchor:{x:32+(end0.x-32)*1.7,y:32+(end0.y-30)*.5}};});
 const sourceGear=GEAR[identity]?.[rig.dir],grip=rig.weapon&&at(rig.weapon.grip),tip=rig.weapon&&at(rig.weapon.tip),sourceLen=sourceGear&&Math.hypot(sourceGear[2]-sourceGear[0],sourceGear[3]-sourceGear[1]),weaponLen=grip&&Math.hypot(tip.x-grip.x,tip.y-grip.y),weaponAngle=grip?Math.atan2(tip.y-grip.y,tip.x-grip.x):0,sourceAngle=sourceGear?Math.atan2(sourceGear[3]-sourceGear[1],sourceGear[2]-sourceGear[0]):0;
 const action=['attack','slash','charge','cast'].includes(rig.state),align=1;
 const paintedHead=naturalHeadDelta(identity,dc,dh,scale,action);
 const fallAngle=rig.ragdoll?companionFallAngle(identity,rig.dir,rig.death):0,fallCos=Math.cos(fallAngle),fallSin=Math.sin(fallAngle),fallOrigin={x:32+(bodyCenter.x-32)*scale.width+dc.x,y:44+(bodyCenter.y-45)*scale.height+dc.y};
 const rotateFall=(p,inverse=false)=>{const dx=p.x-fallOrigin.x,dy=p.y-fallOrigin.y,s=inverse?-fallSin:fallSin;return {x:fallOrigin.x+dx*fallCos-dy*s,y:fallOrigin.y+dx*s+dy*fallCos};};
 const cape=rig.capeMesh,capeBind=rig.artCapeBind,capeOffsets=cape&&capeBind?cape.map((col,i)=>col.map((p,j)=>difference(at(p),at(capeBind[i][j])))):null;
 const expression=rig.portraitMenu?'open':rig.state==='death'?'dead':['hit','stagger','knockdown'].includes(rig.state)?'hurt':rig.state==='idle'&&rig.phase>=.9375?'blink':'open';
 const portraitMenu=rig.portraitMenu&&artStage===0&&rig.dir===2?portraitExpressionAt(identity,rig.portraitMenu.progress):null;
 const eyePixels=rig.dir<5?(asset.eyePixels??=asset.pixels.filter(p=>p.y>=14&&p.y<21&&p.x>=17&&p.x<47&&eyeColor(identity,p.rgb))):[];
 // A fall rotates the connected painted body. Neck travel alone cannot
 // express a collapse without folding a short source neck inside out.
 function warped(x,y,gearPixel=false,armPixel=false,clothPixel=false,hairPixel=false){const p=deformed(x,y,gearPixel,armPixel,clothPixel,hairPixel);return fallAngle?rotateFall(p):p;}
 function deformed(x,y,gearPixel=false,armPixel=false,clothPixel=false,hairPixel=false){
  if(gearPixel&&sourceGear&&grip&&gearDistance(x,y,sourceGear)<(identity==='orc'?4:identity==='caster'?2.8:2.4)&&Math.abs(x-32)>6){
   const dx=x-sourceGear[0],dy=y-sourceGear[1],theta=(weaponAngle-sourceAngle)*align,cos=Math.cos(theta),sin=Math.sin(theta),ratio=1+(clamp(weaponLen/sourceLen,.1,3)-1)*align;
   const arm=armDeltas.find(a=>a.side===(rig.weapon.hand==='left'?-1:1)),drift=arm?.delta||dc,g={x:sourceGear[0]+drift.x,y:sourceGear[1]+drift.y},target=mix(g,grip,align);
   return {x:target.x+(dx*cos-dy*sin)*ratio,y:target.y+(dx*sin+dy*cos)*ratio};
  }
  let delta=dc;
  if(humanoid&&!NATURAL_ANATOMY[identity]){
   const headWeight=ease((headCut+3-y)/5);
   const trunk=mix(dc,paintedPelvis,ease((y-trunkTop)/trunkLength));
   delta=mix(trunk,paintedHead,headWeight);
   if(!legSkin&&!solidLegs&&footDeltas.length&&y>=37){
    const foot=footAt(x,y);
    // A fixed thigh/shin seam, rather than independently shearing every pixel.
    const a={x:foot.anchor.x,y:y<41?35:40},z={x:foot.anchor.x,y:y<41?40:45},da=y<41?foot.root:foot.knee,dz=y<41?foot.knee:foot.delta;
    const pa={x:a.x+da.x,y:a.y+da.y},pz={x:z.x+dz.x,y:z.y+dz.y},theta=Math.atan2(pz.y-pa.y,pz.x-pa.x)-Math.PI/2,ratio=clamp(Math.hypot(pz.x-pa.x,pz.y-pa.y)/5,.7,1.3),dx=x-a.x,dy=y-a.y;
    // Thigh and shin are separate rigid sections sharing exactly one knee.
    delta={x:pa.x+dx*Math.cos(theta)-dy*ratio*Math.sin(theta)-x,y:pa.y+dx*Math.sin(theta)+dy*ratio*Math.cos(theta)-y};
    if(['caster','frostelf'].includes(identity)&&Math.abs(x-32)<5&&y<44)delta=dc;
   }
   if(headWeight&&headRoll){const dx=x-headCenter.x,dy=y-headCenter.y;delta={x:delta.x+(dx*cos-dy*sin-dx)*headWeight,y:delta.y+(dx*sin+dy*cos-dy)*headWeight};}
   // The physical shoulders turn during a cross-body swing. Foreshorten
   // the connected painted chest with that same yaw, tapering into the
   // neck and waist. Leaving a front-facing torso rigid made the two-hand
   // reach circles disjoint during the middle of a side-swing recovery.
   const shoulder=ease((y-headCut+2)/3),waist=1-ease((y-headCut-2)/Math.max(4,(parts?.registration.pelvis??40)-headCut-2));
   delta={x:delta.x+(x-32)*scale.width*(Math.cos(rig.torsoYaw||0)-1)*shoulder*waist,y:delta.y};
  }else{
   const anatomy=NATURAL_ANATOMY[identity],headWeight=anatomy?.lockedHead||anatomy?.lockedTravelHead&&!action?0:naturalHeadWeight(identity,artStage,rig.dir,x,y);
   delta=mix(dc,paintedHead,headWeight);
   if(mouthSource?.visible&&action&&rig.creatureAttack.jaw>0){
    const dx=Math.abs(x-mouthSource.x),dy=y-mouthSource.y,r=mouthSource.jawRadius;
    // Move the painted lower jaw, with a soft hinge at its cheek. No new
    // muzzle, teeth palette or detached black oval is drawn over the face.
    const jawWeight=clamp(1-dx/(r+1),0,1)*clamp(dy+1,0,1)*clamp((r+2-dy)/2,0,1);
    delta={x:delta.x,y:delta.y+Math.min(1.5,rig.creatureAttack.jaw*.25)*jawWeight};
   }
   if(!legSkin&&!naturalLegs&&footDeltas.length&&y>33){const foot=footAt(x,y),leg=y<39?mix(foot.root,foot.knee,ease((y-33)/6)):mix(foot.knee,foot.delta,ease((y-39)/6));delta=mix(delta,leg,ease((y-31)/10));}
   if(['jelly','squid','mushroom'].includes(identity)){const squash=bodyPlan==='rooted'?1:rig.squash||1,pulse=Math.sin(rig.phase*Math.PI),action=['dodge','dash','stop'].includes(rig.state)?1+.18*pulse:1,t=ease((y-27)/17),fan=identity==='jelly'?1+(artStage===2?.4:artStage===1?.25:0)*t:1,ripple=artStage?Math.sin(rig.phase*Math.PI*2+(x-32)*.2)*t:0,offset=portraitMenu?portraitSourceOffset(identity,x,y,portraitMenu):{x:0,y:0};return {x:32+(x-32)*scale.width*squash*action*fan+delta.x+ripple+offset.x*scale.width,y:44+(y-45)*scale.height/(squash*action)+delta.y+offset.y*scale.height};}
  }
  // Evolution already selects a separately painted form. Preserve its
  // proportions instead of applying the old juvenile-to-adult widening too.
  if(identity==='serpent'&&artStage)delta={x:delta.x+(x-32)*(artStage===2?.3:.2)*ease((y-27)/10),y:delta.y};
  if(identity==='crab'&&artStage)delta={x:delta.x+(x-32)*(artStage===2?.55:.45)*ease((y-27)/10),y:delta.y};
  if(identity==='bear'&&artStage)delta={x:delta.x+(x-32)*(artStage===2?.48:.35)*ease((y-16)/17),y:delta.y};
  // Fold/flap only the outer wing region; roots remain attached to the torso.
  if(['fairy','moth','bat','harpy','drake','phoenix','owl','fish','mantis'].includes(identity)&&(!legSkin||y<legArt.rootY-2)&&Math.abs(x-32)>9&&y>17){const weight=ease((Math.abs(x-32)-9)/15)*ease((y-17)/4)*(legSkin?ease((legArt.rootY-2-y)/4):1)*(1-naturalHeadWeight(identity,artStage,rig.dir,x,y)),flap=Math.sin(rig.phase*Math.PI*2);delta={x:delta.x+Math.sign(x-32)*weight*(flap*2+(artStage===2?3:artStage?2:0))*scale.width,y:delta.y+weight*flap*2*scale.height};}
  if(identity==='fox'&&y>32&&Math.abs(x-32)>12){const weight=ease((Math.abs(x-32)-12)/12);delta={x:delta.x,y:delta.y+Math.sin(rig.phase*Math.PI*2)*weight*2};}
  if(['feralfox','cat','rodent','rabbit'].includes(identity)&&y>26&&Math.abs(x-32)>14){const weight=ease((Math.abs(x-32)-14)/10)*ease((y-26)/4)*(1-naturalHeadWeight(identity,artStage,rig.dir,x,y));delta={x:delta.x,y:delta.y+Math.sin(rig.phase*Math.PI*2)*weight*2};}
  if(identity==='clam')delta={x:delta.x,y:delta.y-(rig.creatureAttack?.active?(rig.creatureAttack.jaw||0)*ease((34-y)/7):Math.sin(rig.phase*Math.PI*2)*ease((35-y)/18)*1.5)};
  if(hairPixel&&y>headCut+4&&Math.abs(x-32)>8){const lag=ease((y-19)/20),moving=['walk','run','sprint','turn','stop','dodge','dash'].includes(rig.state),drive=moving?(rig.state==='sprint'?1.3:1):.55,wave=Math.sin(rig.phase*Math.PI*2-lag*2.1+(x<32?-.25:.25));delta={x:delta.x+wave*lag*drive*1.1-(rig.lean||0)*lag*4,y:delta.y+Math.cos(rig.phase*Math.PI*2-lag*2.1)*lag*drive*.35};}
  const ownedCape=parts?.capeMask.has(Math.round(y)*64+Math.round(x)),capeWeight=ownedCape?ease((y-parts.registration.neck-2)/Math.max(4,parts.registration.pelvis-parts.registration.neck)):0;
  if(ownedCape&&!capeOffsets){const wave=Math.sin(rig.phase*Math.PI*2-(y-headCut)*.13);delta={x:delta.x+wave*capeWeight*(action?1.1:.55),y:delta.y+Math.cos(rig.phase*Math.PI*2-(y-headCut)*.13)*capeWeight*.2};}
  if(cape&&capeBind&&ownedCape){
   const u=clamp((x-18)/28,0,1)*(cape.length-1),v=clamp((y-26)/19,0,1)*(cape[0].length-1),i=Math.floor(u),j=Math.floor(v),ii=Math.min(i+1,cape.length-1),jj=Math.min(j+1,cape[0].length-1),lag=mix(mix(capeOffsets[i][j],capeOffsets[ii][j],u-i),mix(capeOffsets[i][jj],capeOffsets[ii][jj],u-i),v-j);delta={x:delta.x+clamp(lag.x-dc.x,-3,3)*capeWeight,y:delta.y+clamp(lag.y-dc.y,-3,3)*capeWeight};
  }
  if(legSkin&&y>=legArt.rootY){const leg=legSkin.offset(x,y);delta=humanoid&&!NATURAL_ANATOMY[identity]?leg:{x:delta.x+leg.x-dc.x,y:delta.y+leg.y-dc.y};}
  if(portraitMenu&&identity!=='owl'){
   const offset=portraitSourceOffset(identity,x,y,portraitMenu);delta={x:delta.x+offset.x*scale.width,y:delta.y+offset.y*scale.height};
  }
  return {x:32+(x-32)*scale.width+delta.x,y:44+(y-45)*scale.height+delta.y};
 }
 // A complete costume sits behind the articulated arms and held equipment.
 // Its repaired pixels use palette indices, so collection recolors stay exact.
 const armArt=parts?.arms||(identity==='orc'&&artStage===0?authoredArmArt(asset,sourceHands):null);
 const bodyLayer=completeBodyLayer(asset,identity,artStage,sourceGear,armArt?.mask),baseLayer=solidLegs?[...bodyLayer.filter(p=>p.bodyUnderlay||!legArt.mask.has(p.y*64+p.x)),...legArt.repairs]:bodyLayer;
 const layer=rig.portraitMenu&&artStage===0&&rig.dir===2?portraitExpressionLayer(baseLayer,asset,identity,rig.portraitMenu.progress):baseLayer;
 const pixels=naturalLegs?layer.map(p=>({...warped(p.x,p.y),color:artColors[p.index],spanX:1,spanY:1})):layer.flatMap(p=>{
  const rgb=p.rgb,lum=(rgb[0]+rgb[1]+rgb[2])/3,range=Math.max(...rgb)-Math.min(...rgb),metal=range<45&&lum>55,wood=rgb[0]>rgb[1]*1.18&&rgb[1]>rgb[2]*1.15,gem=rgb[2]>rgb[0]*1.25&&rgb[1]>rgb[0]*1.2;
  const gearPixel=['elf','fox'].includes(identity)?wood:identity==='caster'?wood||gem:metal||wood&&sourceGear&&gearDistance(p.x,p.y,sourceGear)<1;
  const skin=identity==='orc'||identity==='goblin'?rgb[1]>rgb[0]*1.08&&rgb[1]>rgb[2]*1.2:rgb[0]>rgb[1]*1.1&&rgb[1]>rgb[2]*1.15&&rgb[0]>100&&rgb[0]<220;
  const armPixel=identity==='knight'?metal:skin,cloth=identity==='knight'?rgb[0]>rgb[1]*1.18&&rgb[0]>rgb[2]*1.1:['caster','frostelf','rogue','skeleton'].includes(identity)?rgb[2]>rgb[1]*1.08&&rgb[0]>38:rgb[1]>rgb[0]*1.07;
  const hair=!p.bodyUnderlay&&!p.hipUnderlay&&p.y>19&&p.y<42&&(['caster','frostelf'].includes(identity)?range<55&&lum>105:['elf','fairy','dwarf'].includes(identity)?rgb[0]>rgb[1]*1.1&&rgb[1]>rgb[2]*1.4&&rgb[0]>110:identity==='orc'&&artStage?lum<65&&range<35:false);
  const clothMotion=cloth&&!p.bodyUnderlay&&!p.hipUnderlay;
  const q=warped(p.x,p.y,false,armPixel,clothMotion,hair),alongX=warped(p.x+1,p.y,false,armPixel,clothMotion,hair),alongY=warped(p.x,p.y+1,false,armPixel,clothMotion,hair),spanX=clamp(Math.max(Math.abs(alongX.x-q.x),Math.abs(alongY.x-q.x)),1,3),spanY=clamp(Math.max(Math.abs(alongX.y-q.y),Math.abs(alongY.y-q.y)),1,3);
  let color=artColors[p.index];
  if(expression!=='open'&&eyePixels.includes(p)){const below=asset.pixels.find(z=>z.x===p.x&&z.y===p.y+3);color=below?artColors[below.index]:(identity==='fox'?'#d48b3d':'#d3a879');}
  return [{...q,color,spanX,spanY}];
 });
 // Refit a complete pose only when a fall/large limb excursion exceeds its cell.
 // This preserves the full silhouette and never crops a limb or weapon.
 const sourceXs=asset.pixels.map(p=>32+(p.x-32)*scale.width),sourceYs=asset.pixels.map(p=>44+(p.y-45)*scale.height);
 const minX=Math.min(...pixels.map(p=>p.x)),maxX=Math.max(...pixels.map(p=>p.x)),minY=Math.min(...pixels.map(p=>p.y)),maxY=Math.max(...pixels.map(p=>p.y));
 const sourceLeft=Math.min(...sourceXs),sourceRight=Math.max(...sourceXs),sourceTop=Math.min(...sourceYs),sourceBottom=Math.max(...sourceYs);
 let fit=Math.min(1,54/((sourceRight-sourceLeft||1)+(artStage&&identity==='serpent'?18:artStage&&['fairy','moth','bat','harpy','drake','phoenix','owl','fish','mantis'].includes(identity)?8:0)),54/(sourceBottom-sourceTop||1));
 let ox=32-(sourceLeft+sourceRight)/2,oy=Math.max(0,4-sourceTop)-(rig.ragdoll?9*(rig.death||0):0);
 if(pixels.length){
  const vertices=legMesh?.faces.flatMap(f=>f.vertices)||[],padding=authoredLegs?1:3,left=Math.min(minX,...vertices.map(v=>v.x))-1,right=Math.max(maxX,...vertices.map(v=>v.x))+padding,top=Math.min(minY,...vertices.map(v=>v.y))-1,bottom=Math.max(maxY,...vertices.map(v=>v.y))+padding;
  fit=Math.min(fit,60/(right-left||1),60/(bottom-top||1));
  const lx=32+(left-32+ox)*fit,rx=32+(right-32+ox)*fit,ty=44+(top-44+oy)*fit,by=44+(bottom-44+oy)*fit;
  ox+=(lx<1?1-lx:rx>62?62-rx:0)/fit;oy+=(ty<1?1-ty:by>62?62-by:0)/fit;
 }
 if(!authoredLegs)for(const p of pixels){const x=32+(p.x-32+ox)*fit,y=44+(p.y-44+oy)*fit;b.dot(x,y,p.color);if(p.spanX*fit>1.01||p.spanY*fit>1.01)b.rect(clamp(Math.round(x-p.spanX*.3),0,63),clamp(Math.round(y-p.spanY*.3),0,63),Math.min(64-Math.round(x-p.spanX*.3),Math.ceil(p.spanX*fit)),Math.min(64-Math.round(y-p.spanY*.3),Math.ceil(p.spanY*fit)),p.color);}
 if(!authoredLegs){
  // Fins and wing membranes need the same source-edge continuity as legs.
  // Connect only originally adjacent painted pixels; never add a skeleton
  // or bridge two source parts which were authored as separate ornaments.
  const mapped=new Map(layer.map((p,i)=>[p.y*64+p.x,{...p,color:pixels[i].color,q:{x:32+(pixels[i].x-32+ox)*fit,y:44+(pixels[i].y-44+oy)*fit}}]));
  for(const p of mapped.values())for(const [dx,dy]of [[1,0],[0,1],[-1,1],[1,1]]){
   const other=mapped.get((p.y+dy)*64+p.x+dx);if(!other||Math.abs(other.x-p.x)>1)continue;
   if(dx&&dy&&(mapped.has(p.y*64+other.x)||mapped.has(other.y*64+p.x)))continue;
   if(Math.max(Math.abs(Math.round(other.q.x)-Math.round(p.q.x)),Math.abs(Math.round(other.q.y)-Math.round(p.q.y)))>1)b.line(p.q,other.q,p.color);
  }
 }
 // Inverse nearest-neighbor skinning preserves the source texture and fills
 // every destination sample. Forward splats and seam-colored cylinders lost
 // both width and texture, and left disconnected pixels at bent joints.
 if(authoredLegs){
  // Rasterize the source adjacency edges first. Thin diagonal hooves can
  // otherwise vanish under nearest-neighbor sampling at a fractional scale.
  // These edges connect only pixels adjacent in the original artwork and use
  // its exact colors; inverse samples below restore the full painted detail.
  const mapped=new Map(layer.map((p,i)=>[p.y*64+p.x,{...p,shade:pixels[i].color,q:{x:32+(pixels[i].x-32+ox)*fit,y:44+(pixels[i].y-44+oy)*fit}}]));
  for(const p of mapped.values()){
   b.dot(p.q.x,p.q.y,p.shade);
   for(const [dx,dy]of [[1,0],[0,1],[-1,1],[1,1]]){
    const other=mapped.get((p.y+dy)*64+p.x+dx);if(!other||Math.abs(other.x-p.x)>1)continue;
    if(dx&&dy&&(mapped.has(p.y*64+other.x)||mapped.has(other.y*64+p.x)))continue;
    if(Math.max(Math.abs(Math.round(other.q.x)-Math.round(p.q.x)),Math.abs(Math.round(other.q.y)-Math.round(p.q.y)))>1)b.line(p.q,other.q,p.shade);
   }
  }
  const l=Math.max(0,Math.floor(32+(minX-32+ox)*fit)-1),r=Math.min(63,Math.ceil(32+(maxX-32+ox)*fit)+1),t=Math.max(0,Math.floor(44+(minY-44+oy)*fit)-1),z=Math.min(63,Math.ceil(44+(maxY-44+oy)*fit)+1);
  for(let y=t;y<=z;y++)for(let x=l;x<=r;x++){
   const tx=32+(x-32)/fit-ox,ty=44+(y-44)/fit-oy;
   const target=fallAngle?rotateFall({x:tx,y:ty},true):{x:tx,y:ty};
   let sx=32+(target.x-32)/scale.width,sy=45+(target.y-44)/scale.height;
   for(let i=0;i<4;i++){const q=deformed(sx,sy);sx+=(target.x-q.x)/scale.width;sy+=(target.y-q.y)/scale.height;}
   const xx=Math.round(sx),yy=Math.round(sy);if(xx<0||xx>63)continue;
   const source=mapped.get(yy*64+xx);if(source)b.dot(x,y,source.shade);
  }
  // A discontinuous inverse estimate can land in a different foot's source
  // branch. Keep only samples connected to the forward-mapped source graph;
  // every actual authored pixel (including separate ornaments) is a seed.
  const reached=new Uint8Array(4096),queue=new Uint16Array(4096);let count=0;
  for(const p of mapped.values()){const x=Math.round(p.q.x),y=Math.round(p.q.y),k=y*64+x;if(x>=0&&x<64&&y>=0&&y<64&&!reached[k]){reached[k]=1;queue[count++]=k;}}
  for(let i=0;i<count;i++){const k=queue[i],x=k%64,y=Math.floor(k/64);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*64+xx;if(xx<0||xx>63||yy<0||yy>63||reached[n]||!b.data[n*4+3])continue;reached[n]=1;queue[count++]=n;}}
  for(let i=0;i<4096;i++)if(b.data[i*4+3]&&!reached[i])b.data.fill(0,i*4,i*4+4);
 }
 // Close one-pixel interior gaps left by nearest-pixel skeletal deformation.
 const fills=[];if(!authoredLegs)for(let y=Math.max(1,Math.floor(minY+oy));y<Math.min(63,Math.ceil(maxY+oy));y++)for(let x=Math.max(1,Math.floor(minX+ox));x<Math.min(63,Math.ceil(maxX+ox));x++){const n=(y*64+x)*4;if(b.data[n+3])continue;const l=n-4,r=n+4,t=n-256,d=n+256;if(b.data[l+3]&&b.data[r+3]&&(b.data[t+3]||b.data[d+3])){const near=b.data[t+3]?t:l;fills.push([x,y,'#'+[0,1,2].map(k=>b.data[near+k].toString(16).padStart(2,'0')).join('')]);}}
 for(const p of fills)b.dot(...p);
 if(expression!=='open'&&eyePixels.length){for(const side of [-1,1]){const eye=eyePixels.filter(p=>side<0?p.x<32:p.x>=32);if(eye.length<2)continue;const x=eye.reduce((n,p)=>n+p.x,0)/eye.length,y=eye.reduce((n,p)=>n+p.y,0)/eye.length,v=warped(x,y),q={x:32+(v.x-32+ox)*fit,y:44+(v.y-44+oy)*fit},color='#30212b';b.line({x:q.x-1,y:q.y},{x:q.x+1,y:q.y},color);if(expression==='dead'){b.dot(q.x-1,q.y-1,color);b.dot(q.x+1,q.y+1,color);}}}
 // Weld only uncovered pixels at joint seams, preserving the painted costume.
 const weld=(a,z,color)=>{const length=Math.hypot(z.x-a.x,z.y-a.y),steps=Math.max(1,Math.ceil(length*2));for(let i=0;i<=steps;i++){const x=Math.round(a.x+(z.x-a.x)*i/steps),y=Math.round(a.y+(z.y-a.y)*i/steps);if(x>0&&x<63&&y>0&&y<63&&!b.data[(y*64+x)*4+3])b.dot(x,y,color);}};
 const anchor=q=>({x:32+(q.x-32+ox)*fit,y:44+(q.y-44+oy)*fit});
 rig.artLegLayered=false;
 rig.artLegCoverY=legArt?.coverY===undefined?0:anchor({x:32,y:legArt.coverY}).y;
 rig.artLegRegistration=authoredLegs?{cutY:anchor(warped(32,legArt.rootY)).y,soleY:anchor(warped(32,legArt.bottom)).y}:null;
 rig.artNaturalPalette=authoredLegs?legArt.materialIndices.map(i=>artColors[i]):legArt?.material||rig.palette?.skin;
 rig.artCreatureFit=fit;
 rig.artSourceTransform={scale,fit,ox,oy,fallAngle};
 rig.artCreatureProject=q=>anchor({x:32+(at(q).x-poseBody.x)*1.5+dc.x,y:34+(at(q).y-poseBody.y)*1.1+dc.y});
 rig.artCreatureMouth=mouthSource&&anchor(warped(mouthSource.x,mouthSource.y));
 rig.artMouthRegistration=mouthSource;
 rig.artJawDeformation=mouthSource?.visible&&action?Math.min(1.5,(rig.creatureAttack?.jaw||0)*.25)*fit:0;
 rig.artLegFaces=legMesh?.faces.map(f=>({...f,vertices:f.vertices.map(v=>({...anchor(v),depth:v.depth}))}));
 rig.artLegVolumes=legMesh?.legs.map(l=>({...l,hip:anchor(l.hip),knee:anchor(l.knee),ankle:anchor(l.ankle),radius:l.radius*fit}));
 rig.artLegSkin=legSkin&&{...legSkin,offset:undefined,limbs:legSkin.limbs.map(l=>({...l,hip:anchor(warped(l.root.x,l.root.y)),ankle:anchor(warped(l.x,l.sole))})),palette:artColors};
 rig.artHipRepairs=legArt?.repairs?.map(p=>({...anchor(warped(p.x,p.y)),color:artColors[p.index]}));
 rig.artBodyRepairs=asset.bodyRepairs.map(p=>({...anchor(warped(p.x,p.y)),color:artColors[p.index],source:{x:p.x,y:p.y}}));
 rig.artAnchors={head:anchor(warped(32,headCenter.y)),body:anchor(warped(32,34)),pelvis:anchor(warped(32,38))};
 // Bind shoulders to the connected painted torso, rather than a guessed
 // row in the source sheet. Different species and evolved costumes have
 // different shoulder heights, widths and rear silhouettes.
 const torsoPixels=[];
 if(rig.arms.length){
  const center=rig.artAnchors.body,near=[];
  for(let y=Math.round(center.y)-3;y<=Math.round(center.y)+3;y++)for(let x=Math.round(center.x)-3;x<=Math.round(center.x)+3;x++)if(x>=0&&x<64&&y>=0&&y<64&&b.data[(y*64+x)*4+3])near.push({x,y});
  near.sort((a,z)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(z.x-center.x,z.y-center.y));
  if(near.length){rig.artAnchors.body={...near[0]};const todo=[near[0]],seen=new Set([near[0].y*64+near[0].x]);for(let i=0;i<todo.length;i++){const v=todo[i];if(v.y>=center.y-7&&v.y<=center.y+3)torsoPixels.push(v);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=v.x+dx,y=v.y+dy,k=y*64+x;if(x<0||x>=64||y<0||y>=64||Math.abs(x-center.x)>14||y<center.y-7||y>center.y+4||seen.has(k)||!b.data[k*4+3])continue;seen.add(k);todo.push({x,y});}}}
 }
 rig.artArmRoots={};rig.artHandColors={};rig.artHandHighlights={};
 // One torso-relative projection for every shoulder, elbow and hand. This
 // respects side/rear depth instead of guessing the hand from screen side.
 const limbPoint=q=>{const v=at(q);return {...v,...anchor({x:32+(v.x-poseBody.x)*1.65+dc.x,y:30+(v.y-poseBody.y)*.95+dc.y})};};
 const melee=rig.weapon&&['sword','axe'].includes(rig.weapon.kind),weaponScale=melee?1.02:id==='caster'?.83:.9;
 // Relax into the authored hand positions between strikes; a weapon's carry
 // angle must never pull the hands across the chest to improve its silhouette.
 const carrying=melee&&!['cannon','gauntlet'].includes(rig.gear)&&!rig.ragdoll;
 const carryWeight=!carrying?0:rig.portraitGreeting!==undefined?1-rig.portraitGreeting:['attack','slash','charge'].includes(rig.state)?(rig.stage==='windup'?1-ease(rig.phase/.72):ease((rig.phase-.26)/.74)):['cast','death','knockdown','getup'].includes(rig.state)?0:1;
 // Bows and wands keep their upright physical axis, but use the same stable
 // painted hand sockets while travelling. Arm swing must not swap the grip
 // across the torso in a profile sprint. Active casts/draws retain their rig.
 const handCarryWeight=rig.portraitGreeting!==undefined?1-rig.portraitGreeting:humanoid&&rig.weapon&&!rig.ragdoll&&['idle','walk','run','sprint','turn','stop'].includes(rig.state)?1:carryWeight;
 rig.artLimbPoints=new Map();rig.artArmScreens={};
 for(const arm of rig.arms){
  const root=limbPoint(arm.root),joint=limbPoint(arm.joint),end=limbPoint(arm.end);
  const bindGear=(GEAR[identity]||GEAR[id])?.[rig.dir],wield=rig.weapon?.hand==='left'?-1:1,mainSide=bindGear?Math.sign(bindGear[0]-32)||1:(rig.dir>=1&&rig.dir<=4?-1:1),screenSide=arm.side===wield?mainSide:-mainSide,hand=sourceHands[screenSide];
  rig.artArmScreens[arm.side]=screenSide;
  const armCarryWeight=rig.portraitWave?.side===arm.side?handCarryWeight*(1-rig.portraitWave.weight):handCarryWeight;
  root.y-=3*fit;joint.y-=1.5*fit;
  if(armCarryWeight){
   // Hands below the waist still belong to the torso, not the leg warp.
   // Occluded/recolored hands may have no detectable skin patch. Their fixed
   // directional equipment grip is a better fallback than an animated arm.
   const socket=hand||{x:32+screenSide*(Math.abs((bindGear?.[0]??41)-32)||9),y:bindGear?.[1]??34};
   const neutral=anchor({x:32+(socket.x-32)*scale.width+dc.x,y:44+(socket.y-45)*scale.height+dc.y}),bind=rest.arms.find(a=>a.side===arm.side),drift=bind?difference(limbPoint(arm.end),limbPoint(bind.end)):{x:0,y:0};
   neutral.x+=drift.x*.4;neutral.y+=drift.y*.4;
   if(armCarryWeight===1)neutral.x=rig.artAnchors.body.x+screenSide*Math.max(2*fit,screenSide*(neutral.x-rig.artAnchors.body.x));
   end.x+=(neutral.x-end.x)*armCarryWeight;end.y+=(neutral.y-end.y)*armCarryWeight;
   root.x+=(neutral.x-screenSide*1.5*fit-root.x)*armCarryWeight;root.y+=(neutral.y-5.5*fit-root.y)*armCarryWeight;
  }
  if(torsoPixels.length){const socket=torsoPixels.reduce((best,v)=>Math.hypot(v.x-root.x,v.y-root.y)<Math.hypot(best.x-root.x,best.y-root.y)?v:best,torsoPixels[0]);const dx=socket.x-root.x,dy=socket.y-root.y;root.x=socket.x;root.y=socket.y;joint.x+=dx*.35;joint.y+=dy*.35;}
  if(armCarryWeight){joint.x+=((root.x+end.x)/2+screenSide*.6*fit-joint.x)*armCarryWeight;joint.y+=((root.y+end.y)/2-joint.y)*armCarryWeight;}
  rig.artArmRoots[arm.side]=root;rig.artHandColors[arm.side]=hand&&artColors[hand.index];rig.artHandHighlights[arm.side]=handHighlight(asset,artColors,hand);
  if(parts){
   const profile=armArt.profiles.get(screenSide);
   if(profile){const attachedRoot=anchor(warped(profile.root.x,profile.root.y)),pose=connectAuthoredArm(profile,attachedRoot,end,joint,fit*(scale.width+scale.height)/2);Object.assign(root,pose.root);Object.assign(joint,pose.joint);Object.assign(end,pose.end);}
  }
  rig.artLimbPoints.set(arm.root,root);rig.artLimbPoints.set(arm.joint,joint);rig.artLimbPoints.set(arm.end,end);
 }
 const main=rig.weapon&&rig.arms.find(a=>a.side===(rig.weapon.hand==='left'?-1:1)),paintedGrip=main&&rig.artLimbPoints.get(main.end),physicalGrip=rig.weapon&&at(rig.weapon.grip);
 // Hang the weapon below its relaxed hand. During an active swing the weight
 // is zero and the exact physical contact axis wins.
 const g3=rig.weapon?.grip,t3=rig.weapon?.tip;
 const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/n,y:v.y/n,z:v.z/n};};
 const actual=g3?normalize({x:t3.x-g3.x,y:t3.y-g3.y,z:t3.z-g3.z}):null;
 const carryBind=(GEAR[identity]||GEAR[id])?.[rig.dir],screenSign=carryBind?Math.sign(carryBind[0]-32)||1:(rig.dir>=1&&rig.dir<=4?-1:1);
 rig.artWeaponIdentity=rig.weapon&&{kind:rig.gear||rig.weapon.kind,hand:rig.weapon.hand,screenSide:screenSign};
 const carry=normalize({x:.32*screenSign*Math.cos(angle),y:-.32*screenSign*Math.sin(angle),z:-1});
 const presented=actual&&normalize({x:actual.x+(carry.x-actual.x)*carryWeight,y:actual.y+(carry.y-actual.y)*carryWeight,z:actual.z+(carry.z-actual.z)*carryWeight});
 const cross=(v,w)=>({x:v.y*w.z-v.z*w.y,y:v.z*w.x-v.x*w.z,z:v.x*w.y-v.y*w.x});
 const axis=actual&&cross(actual,presented),cosine=actual&&(actual.x*presented.x+actual.y*presented.y+actual.z*presented.z);
 const rotate=v=>{if(!carryWeight||!axis)return v;const first=cross(axis,v),second=cross(axis,first),denom=Math.max(.0001,1+cosine);return {x:v.x+first.x+second.x/denom,y:v.y+first.y+second.y/denom,z:v.z+first.z+second.z/denom};};
 const heldPoint=q=>{
  const v=at(q);if(!paintedGrip)return v;
  const offset=rotate({x:q.x-g3.x,y:q.y-g3.y,z:q.z-g3.z}),projected=projectRig(offset,angle);
  const reach=weaponScale*(1-.36*carryWeight);
  return {...v,x:paintedGrip.x+projected.x/3*fit*reach,y:paintedGrip.y+projected.y/3*fit*reach};
 };
 // Measure the complete silhouette, including the head/guard, before
 // rasterization. Refit an exceptional carry or sprint pose by a few pixels
 // at the hand and elbow so no axe cheek or hammer corner is cropped.
 if(melee&&paintedGrip){
  const bounds=meleeWeaponBounds(rig,paintedGrip,heldPoint(rig.weapon.tip));
  const dx=bounds.minX<1?1-bounds.minX:bounds.maxX>62?62-bounds.maxX:0,dy=bounds.minY<1?1-bounds.minY:bounds.maxY>62?62-bounds.maxY:0;
  if(dx||dy){paintedGrip.x+=dx;paintedGrip.y+=dy;const elbow=rig.artLimbPoints.get(main.joint);elbow.x+=dx*.5;elbow.y+=dy*.5;}
 }
 // Solve the held object and BOTH wrists before solving the elbows. Moving
 // a support wrist after IK stretched the source forearm into a loose strip.
 const support=main&&(id==='orc'||rig.bowString?.draw>.05)?rig.arms.find(a=>a!==main):null;
 if(parts&&main){
  const radius=arm=>{const p=armArt.profiles.get(rig.artArmScreens[arm.side]);return Math.hypot(p.end.x-p.root.x,p.end.y-p.root.y)*fit*(scale.width+scale.height)/2;};
  const constraints=[{center:rig.artArmRoots[main.side],radius:radius(main)}];
  const relaxed=support&&rig.artLimbPoints.get(support.end),held=support&&heldPoint(support.end),weight=1-carryWeight;
  if(support&&weight>1e-6){const root=rig.artArmRoots[support.side],offset=difference(held,paintedGrip);constraints.push({center:{x:(root.x-relaxed.x*carryWeight)/weight-offset.x,y:(root.y-relaxed.y*carryWeight)/weight-offset.y},radius:radius(support)/weight});}
  const bounds=melee&&meleeWeaponBounds(rig,paintedGrip,heldPoint(rig.weapon.tip)),cell=bounds&&{minX:1+paintedGrip.x-bounds.minX,maxX:62+paintedGrip.x-bounds.maxX,minY:1+paintedGrip.y-bounds.minY,maxY:62+paintedGrip.y-bounds.maxY};
  const fitted=constrainHeldGrip(paintedGrip,constraints,cell);Object.assign(paintedGrip,fitted);
  rig.artGripConstraints={constraints,cell};
  if(support){const held=heldPoint(support.end);Object.assign(relaxed,mix(held,relaxed,carryWeight));}
  for(const arm of rig.arms){
   const profile=armArt.profiles.get(rig.artArmScreens[arm.side]),root=rig.artArmRoots[arm.side],end=rig.artLimbPoints.get(arm.end),joint=rig.artLimbPoints.get(arm.joint),pose=connectAuthoredArm(profile,root,end,joint,fit*(scale.width+scale.height)/2);
   // Keep the held object's exact contact. An infeasible pair is observable
   // by the arm-length regression, never hidden by replacing just one wrist.
   Object.assign(joint,pose.joint);
   if(arm!==main&&arm!==support)Object.assign(end,pose.end);
  }
 }else if(support){const held=heldPoint(support.end),relaxed=rig.artLimbPoints.get(support.end);Object.assign(relaxed,mix(held,relaxed,carryWeight));}
 rig.artProject=q=>rig.artLimbPoints.has(q)?rig.artLimbPoints.get(q):heldPoint(q);
 rig.artShieldProject=q=>{const arm=rig.arms.find(a=>a.side===-1),h=arm&&rig.artLimbPoints.get(arm.end),g=rig.shield&&at(rig.shield.grip),v=at(q);return h&&g?{...v,x:h.x+(v.x-g.x)*fit,y:h.y+(v.y-g.y)*fit}:v;};
 rig.artGearPalette=asset.metal&&!rig.equipment?.includes('sunsteel-edge')?{...rig.palette,metal:asset.metal}:rig.palette;
 rig.artArmSkin=armArt?{art:armArt,colors:artColors,fit,scale,bodyPixels:bodyLayer}:null;
 rig.artGripPixels=new Map();rig.artArmPixels=new Map();
 rig.artSourceProject=(x,y)=>anchor(warped(x,y));
 rig.artSourcePixels=new Map(layer.map((p,i)=>[p.y*64+p.x,anchor(pixels[i])]));
 rig.artParts=parts;
 rig.authoredEvolution=true;b.data.artIdentity=identity;b.data.artStage=artStage;b.data.artFit=fit;b.data.contactGear=Boolean(rig.weapon&&rig.arms.length);b.data.expression=eyePixels.length?expression:'hidden';return true;
}
export function paintAtlasHead(b,id,rig,center){
 const identity=atlasIdentity(id,rig);if(!identity)return false;const a=frameFor(identity,rig.dir),animal=['wolf','lion','bear','stag','drake','serpent','bat'].includes(identity),x=animal?(rig.dir===0?40:rig.dir===4?24:32):32,y=identity==='serpent'?14:animal?20:20;
 for(const p of a.pixels)if(Math.abs(p.x-x)<=9&&Math.abs(p.y-y)<=8)b.dot(center.x+(p.x-x)*.8,center.y+(p.y-y)*.8,p.color);
 return true;
}
