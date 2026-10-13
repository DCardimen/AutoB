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
import {characterRig,projectRig} from './prototype-rig.js';
// Directional artwork is skinned to the same anatomical action poses as combat.
// The imported art is never blurred, rotated by Canvas, or stretched as one bitmap.
const decoded=new Map(),rests=new Map(),CELL=64,PIVOT={x:32,y:44};
const recolors=new Map();
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
function frameFor(id,dir,stage=0){const key=id+':'+dir+':'+stage;if(!decoded.has(key)){const a=STAGES[stage][id],hex=a.frames[dir],colors=a.palette.map(c=>'#'+c),pixels=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=parseInt(hex.slice((y*64+x)*2,(y*64+x)*2+2),16);if(n)pixels.push({x,y,color:colors[n],index:n});}decoded.set(key,{pixels,colors});}return decoded.get(key);}
const eyeColor=(id,[r,g,b])=>id==='elf'?g>r*1.2&&g>b*1.1:id==='caster'?b>g*1.5&&r<90&&b<90:['knight','fox','orc','goblin','fairy','dwarf','minotaur','rogue','troll','skeleton','frostelf'].includes(id)?Math.max(r,g,b)<65:false;
function restFor(id){if(!rests.has(id))rests.set(id,characterRig(id,'idle',.25));return rests.get(id);}
function difference(a,b){return {x:a.x-b.x,y:a.y-b.y};}
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function rotation(a,b,c,d){return Math.atan2(a.x-b.x,-(a.y-b.y))-Math.atan2(c.x-d.x,-(c.y-d.y));}
function handLandmarks(asset,identity,stage){
 if(asset.hands)return asset.hands;
 const hands={},expectedY=stage?31:34;
 for(const side of [-1,1]){
  const expectedX=32+side*11,candidates=asset.pixels.filter(p=>p.y>=expectedY-4&&p.y<=expectedY+3&&Math.abs(p.x-expectedX)<=5).filter(p=>{const [r,g,b]=p.color.slice(1).match(/../g).map(v=>parseInt(v,16));return ['orc','goblin','troll'].includes(identity)?g>r*1.08&&g>b*1.12:identity==='knight'?Math.max(r,g,b)-Math.min(r,g,b)<65&&r>40:r>g*1.12&&g>b*1.1&&r>65;});
  const seed=candidates.sort((a,b)=>Math.hypot(a.x-expectedX,a.y-expectedY)-Math.hypot(b.x-expectedX,b.y-expectedY))[0];if(seed)hands[side]={...seed};
 }asset.hands=hands;asset.handMask=new Set(asset.pixels.filter(p=>Object.values(hands).some(h=>Math.hypot(p.x-h.x,p.y-h.y)<3.6||Math.abs(p.x-h.x)<2.8&&p.y>=h.y-5&&p.y<=h.y)));return hands;
}
function recolor(identity,p,rig,rgb){
 if(!rig.artRecolor)return p.color;const pal=rig.palette;if(!pal)return p.color;
 const lum=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];if(lum<35)return p.color;
 let material=null;
 if(['knight','orc','goblin','troll','minotaur','dwarf','rogue','caster','elf','fox','frostelf','fairy','skeleton'].includes(identity)){
  if(rgb[2]>rgb[1]*1.1&&rgb[0]>rgb[1]*1.03||identity==='knight'&&rgb[0]>rgb[1]*1.25&&rgb[0]>rgb[2]*1.15)material='cloth';
  if(['elf','fox','fairy','dwarf','rogue','frostelf'].includes(identity)&&p.y>26&&rgb[1]>rgb[0]*1.05)material='cloth';
  if(['orc','goblin','troll'].includes(identity)&&rgb[1]>rgb[0]*.95&&rgb[1]>rgb[2]*1.2)material=rig.artVariant||rig.grand?.motif==='runetitan'?'skin':null;
  if(['elf','fairy','caster','frostelf'].includes(identity)&&p.y<23&&rig.artVariant)material='hair';
  if(Math.max(...rgb)-Math.min(...rgb)<35&&p.y>26)material='metal';
 }else if(rig.artVariant){
  const range=Math.max(...rgb)-Math.min(...rgb);
  // Preserve white fur, bellies, pearls and eye glints rather than tinting every
  // material into the same flat elemental color. Evolved trim follows its path.
  if(lum>175&&range<42){if(rig.form)material='metal';else return p.color;}
  else if(lum>235)return p.color;
  else if(['mech','beetle','crab','turtle','rhino'].includes(identity)&&rgb[2]>rgb[0]*1.2&&rgb[1]>rgb[0]*1.1)material='cloth';
  else if(identity==='cat'&&p.y<27&&rgb[1]>rgb[0]*1.4&&rgb[1]>rgb[2]*1.3)return p.color;
  else if(['feralfox','cat','rabbit','rodent','owl'].includes(identity)&&rgb[0]>rgb[1]*1.4&&rgb[2]>rgb[1]*1.15)return p.color;
  else material='skin';
 }
 if(!material)return p.color;const ramp=pal[material];if(!ramp)return p.color;
 const key=identity+':'+p.color+':'+ramp.join(',');if(recolors.has(key))return recolors.get(key);
 const t=clamp((lum/255-.13)/.7,0,1)*(ramp.length-1),a=Math.floor(t),z=Math.min(ramp.length-1,a+1),from=ramp[a].slice(1).match(/../g).map(v=>parseInt(v,16)),to=ramp[z].slice(1).match(/../g).map(v=>parseInt(v,16)),color='#'+from.map((v,k)=>Math.round(v+(to[k]-v)*(t-a)).toString(16).padStart(2,'0')).join('');
 recolors.set(key,color);if(recolors.size>4096)recolors.delete(recolors.keys().next().value);return color;
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
export function paintAtlasCharacter(b,id,rig,at){
 const identity=atlasIdentity(id,rig);if(!identity)return false;
 const artStage=Math.min(2,rig.artStage??rig.form??0),asset=frameFor(identity,rig.dir,artStage),rest=rig.artBind||restFor(id),angle=rig.dir*Math.PI/4,base=q=>point(q,angle),poseHead=at(rig.head),poseBody=at(rig.body),posePelvis=at(rig.pelvis),head0=base(rest.head),body0=base(rest.body),pelvis0=base(rest.pelvis),dh=difference(poseHead,head0),dc=difference(poseBody,body0),dp=difference(posePelvis,pelvis0);
 const humanoid=rig.arms.length>0||identity==='fairy'||identity==='harpy'||identity==='skeleton'||identity==='rogue'||identity==='frostelf',scale=rig.artScale||{width:1,height:1},headCut=identity==='knight'?25:identity==='orc'?25:identity==='fairy'?29:27,headCenter={x:32,y:headCut-9},bodyCenter={x:32,y:33};
 const sourceHands=humanoid?handLandmarks(asset,identity,artStage):{};
 const headRoll=rig.ragdoll?rotation(poseHead,poseBody,head0,body0):clamp((rig.lean||0)*Math.cos(angle)+(rig.sideLean||0)*Math.sin(angle),-.25,.25),cos=Math.cos(headRoll),sin=Math.sin(headRoll);
 const footDeltas=rig.legs.map((l,i)=>{const original=rest.legs[i]||rest.legs[0],end0=base(original.end);return {delta:difference(at(l.end),end0),knee:difference(at(l.joint),base(original.joint)),root:difference(at(l.root),base(original.root)),pitch:l.foot?.pitch||0,anchor:{x:32+(end0.x-32)*(humanoid?2.4:1.45),y:45+(end0.y-43)*.6}};});
 const armDeltas=rig.arms.map((a,i)=>{const orig=rest.arms[i]||rest.arms[0],end0=base(orig.end);return {side:a.side,delta:difference(at(a.end),end0),end:at(a.end),anchor:{x:32+(end0.x-32)*1.7,y:32+(end0.y-30)*.5}};});
 const sourceGear=GEAR[identity]?.[rig.dir],grip=rig.weapon&&at(rig.weapon.grip),tip=rig.weapon&&at(rig.weapon.tip),sourceLen=sourceGear&&Math.hypot(sourceGear[2]-sourceGear[0],sourceGear[3]-sourceGear[1]),weaponLen=grip&&Math.hypot(tip.x-grip.x,tip.y-grip.y),weaponAngle=grip?Math.atan2(tip.y-grip.y,tip.x-grip.x):0,sourceAngle=sourceGear?Math.atan2(sourceGear[3]-sourceGear[1],sourceGear[2]-sourceGear[0]):0;
 const action=['attack','slash','charge','cast'].includes(rig.state),align=1;
 const cape=rig.capeMesh,capeBind=rig.artCapeBind,capeOffsets=cape&&capeBind?cape.map((col,i)=>col.map((p,j)=>difference(at(p),at(capeBind[i][j])))):null;
 const expression=rig.state==='death'?'dead':['hit','stagger','knockdown'].includes(rig.state)?'hurt':rig.state==='idle'&&rig.phase>=.9375?'blink':'open';
 const eyePixels=rig.dir<5?asset.pixels.filter(p=>p.y>=14&&p.y<21&&p.x>=17&&p.x<47&&eyeColor(identity,p.color.slice(1).match(/../g).map(v=>parseInt(v,16)))):[];
 function warped(x,y,gearPixel=false,armPixel=false,clothPixel=false,hairPixel=false){
  if(gearPixel&&sourceGear&&grip&&gearDistance(x,y,sourceGear)<(identity==='orc'?4:identity==='caster'?2.8:2.4)&&Math.abs(x-32)>6){
   const dx=x-sourceGear[0],dy=y-sourceGear[1],theta=(weaponAngle-sourceAngle)*align,cos=Math.cos(theta),sin=Math.sin(theta),ratio=1+(clamp(weaponLen/sourceLen,.1,3)-1)*align;
   const arm=armDeltas.find(a=>a.side===(rig.weapon.hand==='left'?-1:1)),drift=arm?.delta||dc,g={x:sourceGear[0]+drift.x,y:sourceGear[1]+drift.y},target=mix(g,grip,align);
   return {x:target.x+(dx*cos-dy*sin)*ratio,y:target.y+(dx*sin+dy*cos)*ratio};
  }
  let delta=dc;
  if(humanoid){
   const headWeight=1-ease((y-headCut+2)/7);delta=mix(dc,dh,headWeight);
   const lower=ease((y-31)/10);delta=mix(delta,dp,lower);
   if(footDeltas.length&&y>=34){const foot=footDeltas.reduce((best,f)=>Math.hypot(x-f.anchor.x,y-f.anchor.y)<Math.hypot(x-best.anchor.x,y-best.anchor.y)?f:best),leg=y<39?mix(foot.root,foot.knee,ease((y-34)/5)):mix(foot.knee,foot.delta,ease((y-39)/5));delta=mix(delta,leg,ease((y-33)/6));if(y>42)delta={x:delta.x,y:delta.y+(x-foot.anchor.x)*Math.sin(foot.pitch)*Math.cos(angle)};}
   if(armPixel&&armDeltas.length&&y>30&&y<39&&Math.abs(x-32)>7){const arm=armDeltas.reduce((best,a)=>Math.abs(x-a.anchor.x)<Math.abs(x-best.anchor.x)?a:best);delta=mix(delta,arm.delta,ease((Math.abs(x-32)-6)/7));}
   if(headWeight>.1&&headRoll){const dx=x-headCenter.x,dy=y-headCenter.y;delta={x:delta.x+(dx*cos-dy*sin-dx)*headWeight,y:delta.y+(dx*sin+dy*cos-dy)*headWeight};}
  }else{
   delta=mix(dc,dh,ease((x-29)/12)*.35);
   if(footDeltas.length&&y>33){const foot=footDeltas.reduce((best,f)=>Math.hypot(x-f.anchor.x,y-f.anchor.y)<Math.hypot(x-best.anchor.x,y-best.anchor.y)?f:best),leg=y<39?mix(foot.root,foot.knee,ease((y-33)/6)):mix(foot.knee,foot.delta,ease((y-39)/6));delta=mix(delta,leg,ease((y-31)/10));}
   if(['jelly','squid','mushroom'].includes(identity)){const squash=rig.squash||1,pulse=Math.sin(rig.phase*Math.PI),action=['dodge','dash','stop'].includes(rig.state)?1+.18*pulse:1,t=ease((y-27)/17),spread=1+(artStage===2?.4:artStage===1?.25:0)*t,ripple=artStage?Math.sin(rig.phase*Math.PI*2+(x-32)*.2)*t:0;return {x:32+(x-32)*scale.width*squash*action*spread+delta.x+ripple,y:44+(y-45)*scale.height/(squash*action)+delta.y};}
  }
  // Maturation changes head-to-body proportions and develops shoulders/legs.
  // Feet retain the same ground pivot; this is skinning, not a physics retarget.
  if(humanoid&&artStage){const headWeight=1-ease((y-headCut+3)/7),headScale=identity==='orc'?(artStage===2?.7:.72):artStage===2?.78:.82,bodyWidth=artStage===2?1.24:1.16;delta={x:delta.x+(x-32)*((headScale-1)*headWeight+(bodyWidth-1)*(1-headWeight)),y:delta.y+((y-headCenter.y)*(headScale-1)-3)*headWeight+(y-45)*.18*(1-headWeight)};}
  if(artStage&&['mech','serpent','crab','spider','beetle'].includes(identity)){
   const upper=1-ease((y-27)/10),lower=1-upper,amount=identity==='crab'?(artStage===2?.55:.45):identity==='serpent'?(artStage===2?.55:.4):artStage===2?.32:.22;
   const weight=identity==='crab'||identity==='spider'?lower:upper;
   delta={x:delta.x+(x-32)*amount*weight,y:delta.y};
  }
  if(artStage&&identity==='lion')delta={x:delta.x+(x-32)*(artStage===2?.3:.2)*(1-ease((y-25)/10)),y:delta.y};
  if(artStage&&identity==='bear')delta={x:delta.x+(x-32)*(artStage===2?.48:.35)*ease((y-16)/17),y:delta.y};
  // Fold/flap only the outer wing region; roots remain attached to the torso.
  if(['fairy','moth','bat','harpy','drake','phoenix','owl','fish','mantis'].includes(identity)&&Math.abs(x-32)>9&&y>17){const weight=ease((Math.abs(x-32)-9)/15),flap=Math.sin(rig.phase*Math.PI*2);delta={x:delta.x+Math.sign(x-32)*weight*flap*2,y:delta.y+weight*flap*2};}
  if(identity==='fox'&&y>32&&Math.abs(x-32)>12){const weight=ease((Math.abs(x-32)-12)/12);delta={x:delta.x,y:delta.y+Math.sin(rig.phase*Math.PI*2)*weight*2};}
  if(['feralfox','cat','rodent','rabbit'].includes(identity)&&y>26&&Math.abs(x-32)>14){const weight=ease((Math.abs(x-32)-14)/10);delta={x:delta.x,y:delta.y+Math.sin(rig.phase*Math.PI*2)*weight*2};}
  if(identity==='clam')delta={x:delta.x,y:delta.y-Math.sin(rig.phase*Math.PI*2)*ease((35-y)/18)*1.5};
  if(hairPixel){const lag=ease((y-19)/20),moving=['walk','run','sprint','turn','stop','dodge','dash'].includes(rig.state),drive=moving?(rig.state==='sprint'?1.3:1):.55,wave=Math.sin(rig.phase*Math.PI*2-lag*2.1+(x<32?-.25:.25));delta={x:delta.x+wave*lag*drive*3.2-(rig.lean||0)*lag*4,y:delta.y+Math.cos(rig.phase*Math.PI*2-lag*2.1)*lag*drive*.8};}
  if(cape&&capeBind&&y>27&&clothPixel&&(rig.dir>=5||Math.abs(x-32)>8)){
   const u=clamp((x-18)/28,0,1)*(cape.length-1),v=clamp((y-26)/19,0,1)*(cape[0].length-1),i=Math.floor(u),j=Math.floor(v),ii=Math.min(i+1,cape.length-1),jj=Math.min(j+1,cape[0].length-1),lag=mix(mix(capeOffsets[i][j],capeOffsets[ii][j],u-i),mix(capeOffsets[i][jj],capeOffsets[ii][jj],u-i),v-j);delta={x:delta.x+clamp(lag.x-dc.x,-5,5),y:delta.y+clamp(lag.y-dc.y,-5,5)};
  }
  return {x:32+(x-32)*scale.width+delta.x,y:44+(y-45)*scale.height+delta.y};
 }
 const pixels=asset.pixels.flatMap(p=>{
  // Neutral fists belong to articulated arm layers, never to the torso bitmap.
  if(asset.handMask?.has(p))return [];
  const rgb=p.color.slice(1).match(/../g).map(v=>parseInt(v,16)),lum=(rgb[0]+rgb[1]+rgb[2])/3,range=Math.max(...rgb)-Math.min(...rgb),metal=range<45&&lum>55,wood=rgb[0]>rgb[1]*1.18&&rgb[1]>rgb[2]*1.15,gem=rgb[2]>rgb[0]*1.25&&rgb[1]>rgb[0]*1.2;
  const gearPixel=['elf','fox'].includes(identity)?wood:identity==='caster'?wood||gem:metal||wood&&sourceGear&&gearDistance(p.x,p.y,sourceGear)<1;
  // The original neutral weapon is a separate piece. Remove its whole footprint,
  // then let the shared weapon renderer paint the actual physical handle/blade.
  if(!AUTHORED_SPRITES[identity].weaponless&&sourceGear&&gearDistance(p.x,p.y,sourceGear)<(identity==='orc'?4.5:identity==='caster'?3:2.8)&&Math.abs(p.x-32)>6&&p.y>=(identity==='caster'?12:22))return [];
  const skin=identity==='orc'||identity==='goblin'?rgb[1]>rgb[0]*1.08&&rgb[1]>rgb[2]*1.2:rgb[0]>rgb[1]*1.1&&rgb[1]>rgb[2]*1.15&&rgb[0]>100&&rgb[0]<220;
  const armPixel=identity==='knight'?metal:skin,cloth=identity==='knight'?rgb[0]>rgb[1]*1.18&&rgb[0]>rgb[2]*1.1:['caster','frostelf','rogue','skeleton'].includes(identity)?rgb[2]>rgb[1]*1.08&&rgb[0]>38:rgb[1]>rgb[0]*1.07;
  const hair=p.y>19&&p.y<42&&(['caster','frostelf'].includes(identity)?range<55&&lum>105:['elf','fairy','dwarf'].includes(identity)?rgb[0]>rgb[1]*1.1&&rgb[1]>rgb[2]*1.4&&rgb[0]>110:identity==='orc'&&artStage?lum<65&&range<35:false);
  const q=warped(p.x,p.y,false,armPixel,cloth,hair),alongX=warped(p.x+1,p.y,false,armPixel,cloth,hair),alongY=warped(p.x,p.y+1,false,armPixel,cloth,hair),spanX=clamp(Math.max(Math.abs(alongX.x-q.x),Math.abs(alongY.x-q.x)),1,3),spanY=clamp(Math.max(Math.abs(alongX.y-q.y),Math.abs(alongY.y-q.y)),1,3);
  let color=recolor(identity,p,rig,rgb);
  if(expression!=='open'&&eyePixels.includes(p)){const below=asset.pixels.find(z=>z.x===p.x&&z.y===p.y+3);color=below?.color||(identity==='fox'?'#d48b3d':'#d3a879');}
  return [{...q,color,spanX,spanY}];
 });
 // Refit a complete pose only when a fall/large limb excursion exceeds its cell.
 // This preserves the full silhouette and never crops a limb or weapon.
 const minX=Math.min(...pixels.map(p=>p.x)),maxX=Math.max(...pixels.map(p=>p.x)),minY=Math.min(...pixels.map(p=>p.y)),maxY=Math.max(...pixels.map(p=>p.y)),fit=Math.min(1,61/(maxX-minX||1),61/(maxY-minY||1));
 const ox=minX<1?1-minX:minX>1&&maxX>62?62-maxX:0,oy=minY<1?1-minY:minY>1&&maxY>62?62-maxY:0;
 // Unscaled Training Glade actors expose the full physical stride. Paint its
 // limbs behind the textured body, with volume rather than skeleton lines.
 if(!humanoid&&!rig.artBind){const ramp=rig.palette?.skin||['#413a35','#786c53','#b0a17c'];for(const leg of rig.legs){const points=[leg.root,leg.joint,leg.hock||leg.end,...(leg.hock?[leg.end]:[])].map(at);for(let i=1;i<points.length;i++){b.line(points[i-1],points[i],ramp[0],1.35);b.line({x:points[i-1].x-.3,y:points[i-1].y-.4},{x:points[i].x-.3,y:points[i].y-.4},ramp[1],.65);}}}
 for(const p of pixels){const x=fit<1?1+(p.x-minX)*fit:p.x+ox,y=fit<1?1+(p.y-minY)*fit:p.y+oy;b.dot(x,y,p.color);if(p.spanX*fit>1.01||p.spanY*fit>1.01)b.rect(clamp(Math.round(x-p.spanX*.3),0,63),clamp(Math.round(y-p.spanY*.3),0,63),Math.min(64-Math.round(x-p.spanX*.3),Math.ceil(p.spanX*fit)),Math.min(64-Math.round(y-p.spanY*.3),Math.ceil(p.spanY*fit)),p.color);}
 // Close one-pixel interior gaps left by nearest-pixel skeletal deformation.
 const fills=[];for(let y=Math.max(1,Math.floor(minY+oy));y<Math.min(63,Math.ceil(maxY+oy));y++)for(let x=Math.max(1,Math.floor(minX+ox));x<Math.min(63,Math.ceil(maxX+ox));x++){const n=(y*64+x)*4;if(b.data[n+3])continue;const l=n-4,r=n+4,t=n-256,d=n+256;if(b.data[l+3]&&b.data[r+3]&&(b.data[t+3]||b.data[d+3])){const near=b.data[t+3]?t:l;fills.push([x,y,'#'+[0,1,2].map(k=>b.data[near+k].toString(16).padStart(2,'0')).join('')]);}}
 for(const p of fills)b.dot(...p);
 if(expression!=='open'&&eyePixels.length){for(const side of [-1,1]){const eye=eyePixels.filter(p=>side<0?p.x<32:p.x>=32);if(eye.length<2)continue;const x=eye.reduce((n,p)=>n+p.x,0)/eye.length,y=eye.reduce((n,p)=>n+p.y,0)/eye.length,q=warped(x,y),color='#30212b';b.line({x:q.x-1,y:q.y},{x:q.x+1,y:q.y},color);if(expression==='dead'){b.dot(q.x-1,q.y-1,color);b.dot(q.x+1,q.y+1,color);}}}
 // Weld only uncovered pixels at joint seams, preserving the painted costume.
 const weld=(a,z,color)=>{const length=Math.hypot(z.x-a.x,z.y-a.y),steps=Math.max(1,Math.ceil(length*2));for(let i=0;i<=steps;i++){const x=Math.round(a.x+(z.x-a.x)*i/steps),y=Math.round(a.y+(z.y-a.y)*i/steps);if(x>0&&x<63&&y>0&&y<63&&!b.data[(y*64+x)*4+3])b.dot(x,y,color);}};
 if(humanoid)weld(warped(32,headCut-2),warped(32,32),id==='orc'?'#708547':'#b69476');
 if(humanoid)weld(poseBody,poseHead,rig.palette?.skin?.[1]||'#b69476');
 const neckStart=id==='wolf'?{...rig.body,x:rig.body.x+18,z:rig.body.z+4}:{...rig.body,z:rig.body.z+12};
 if(humanoid||!rig.artBind)weld(at(neckStart),at({...rig.head,z:rig.head.z-5}),rig.palette?.skin?.[1]||'#89765a');
 // Animal limbs are already painted and skinned above. Their calibration rig
 // can extend beyond the source silhouette; drawing it exposes wire legs.
 if(humanoid||!rig.artBind)for(const leg of rig.legs){const color=rig.palette?.skin?.[0]||'#685546';weld(at(leg.root),at(leg.joint),color);weld(at(leg.joint),at(leg.hock||leg.end),color);if(leg.hock)weld(at(leg.hock),at(leg.end),color);}
 for(const a of rig.arms){weld(at(a.root),at(a.joint),id==='knight'?'#737d78':'#786045');weld(at(a.joint),at(a.end),id==='knight'?'#737d78':id==='orc'?'#788c4d':'#b79473');}
 const anchor=q=>fit<1?{x:1+(q.x-minX)*fit,y:1+(q.y-minY)*fit}:{x:q.x+ox,y:q.y+oy};
 rig.artAnchors={head:anchor(warped(32,headCenter.y)),body:anchor(warped(32,34)),pelvis:anchor(warped(32,38))};
 rig.artArmRoots={};rig.artHandColors={};
 for(const arm of rig.arms){const projected=-arm.side*Math.sin(angle),screenSide=Math.abs(projected)>.15?Math.sign(projected):Math.sign(arm.side*Math.cos(angle)),hand=sourceHands[screenSide];rig.artArmRoots[arm.side]=anchor(warped(32+screenSide*8,artStage?27:29));rig.artHandColors[arm.side]=hand?recolor(identity,hand,rig,hand.color.slice(1).match(/../g).map(v=>parseInt(v,16))):undefined;}
 rig.authoredEvolution=true;b.data.artIdentity=identity;b.data.artStage=artStage;b.data.artFit=fit;b.data.contactGear=Boolean(rig.weapon&&rig.arms.length);b.data.expression=eyePixels.length?expression:'hidden';return true;
}
export function paintAtlasHead(b,id,rig,center){
 const identity=atlasIdentity(id,rig);if(!identity)return false;const a=frameFor(identity,rig.dir),animal=['wolf','lion','bear','stag','drake','serpent','bat'].includes(identity),x=animal?(rig.dir===0?40:rig.dir===4?24:32):32,y=identity==='serpent'?14:animal?20:20;
 for(const p of a.pixels)if(Math.abs(p.x-x)<=9&&Math.abs(p.y-y)<=8)b.dot(center.x+(p.x-x)*.8,center.y+(p.y-y)*.8,p.color);
 return true;
}
