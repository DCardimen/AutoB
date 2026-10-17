import {paintSkillHazard,paintSkillProjectile,paintSkillEffect,paintSkillImpact} from './skill-vfx.js';
import {auraProfile,paintRarityRing,paintRarityFlair} from './rarity-aura.js';
import {arenaCamera} from './arena-camera.js';
import {paintAmbient} from './ambient-art.js';
import {idleRhythm,eliteModifier} from './elite-modifiers.js';
import {paintActionFeedback,paintImpact} from './combat-feedback.js';
import {interpolatedNativeUnit} from './native-motion.js';
import {activeAilments} from './status-ailments.js';
import {nativeFormRig,formProfile} from './native-forms.js';
import {nativePoseRig} from './native-poses.js';
import {PIXEL_SPECIES,NATIVE_BOSS_RIGS} from './native-content.js';
import {makePrototypeUnit,animationState} from './prototype-engine.js';
import {spriteSample} from './prototype-sprites.js';
import {characterRig} from './prototype-rig.js';
import {ragdollRig} from './prototype-dynamics.js';
import {renderCharacterFrame} from './prototype-renderer.js';
import {PIXEL_PALETTES,PIVOT,CELL} from './prototype-pixel-art.js';
import {nativeSpawn,nativeBodyHeight} from './native-combat.js';
import {nativeRigFor} from './grand-designs.js';
import {creatureWorldScale} from './native-size.js';
import {paintCombatTexts} from './combat-text.js';
import {terrainFor} from './native-tactics.js';
import {getTuning} from './tuning.js';
let characterHeight=1;
export function setCharacterHeight(value){characterHeight=Math.max(.85,Math.min(1.1,Number(value)||1));}
export function getCharacterHeight(){return characterHeight;}
export function nativePreviewFrame(c,state='idle',phase=.25,dir=1){const key=['preview',c.id,c.evolution,c.evolutionPath,state,phase,dir,characterHeight,getTuning().strideLength].join(':');if(!frames.has(key)){const spec=byId[c.id];frames.set(key,renderCharacterFrame(nativeRigFor(spec,c),nativePoseRig(spec,c,state,phase,characterHeight),dir*Math.PI/4));if(frames.size>256)frames.delete(frames.keys().next().value);}return frames.get(key);}
export const nativeScreen=(x,y)=>({x,y:y*.58+75});
export const NATIVE_RENDER_SCALE=1;
export const NATIVE_SPRITE_GRID=[1002,654];
const scene=document.createElement('canvas');scene.width=NATIVE_SPRITE_GRID[0];scene.height=NATIVE_SPRITE_GRID[1];
const pixel=document.createElement('canvas');pixel.width=NATIVE_SPRITE_GRID[0];pixel.height=NATIVE_SPRITE_GRID[1];
const backdrop=new Image();backdrop.src='/public/prototype-glade-pixel.png';
backdrop.addEventListener('load',()=>window.dispatchEvent(new Event('art-ready')));
const portraits=new Map(),frames=new Map();
const byId=Object.fromEntries(PIXEL_SPECIES.map(s=>[s.id,s]));
export function nativePortrait(c){
 const spec=byId[c.id];if(!spec)return null;const key=c.id+':'+(c.evolution||0)+':'+c.evolutionPath+':'+(c.equipment||[]).join(',');if(portraits.has(key))return portraits.get(key);
 const out=document.createElement('canvas');out.width=128;out.height=128;
 drawNativeUnit(out.getContext('2d'),c,spec,64,88,0,2);const result=out.toDataURL();portraits.set(key,result);return result;
}
function actorFor(u,spec){
 const id=nativeRigFor(spec,u)||NATIVE_BOSS_RIGS[spec.id]||'mech',actor=u.nativeActor||makePrototypeUnit(id,u.side||0,0,u.x||0,u.y||0);
 return {...actor,hp:u.hp??1,facing:u.facing??actor.facing,evolution:u.evolution||0,evolutionPath:u.evolutionPath};
}
export function drawNativeUnit(c,u,spec,x,y,time,pixelScale=3){
 const actor=actorFor(u,spec),rhythm=idleRhythm(u),idle=!u.nativeActor||animationState(actor)==='idle',sample=spriteSample(actor,time,idle?{state:'idle',phase:(time*rhythm.rate+rhythm.offset)%1}:null);
 const key=u.id+':'+characterHeight+':'+sample.key+':'+u.evolution+':'+u.evolutionPath+':'+(u.equipment||[]).join(',')+':'+(actor.capeMeshKey||'')+(actor.ragdoll?':'+actor.ragdoll.time.toFixed(4):'');
 let frame=u.deploymentRig?null:frames.get(key);
 if(!frame){
  const posePhase=sample.state==='idle'?Math.round(sample.phase*16)/16:sample.phase;
  let rig=characterRig(actor.id,sample.state,posePhase,sample.stage,{...sample,stride:actor.stride});rig.cape=sample.cape;
  if(u.deploymentRig)rig=u.deploymentRig;else if(actor.ragdoll)rig=ragdollRig(actor.ragdoll,actor.getup>0?1-actor.getup/.45:0);
  rig.capeMesh=actor.capeMesh;rig=nativeFormRig(spec,u,rig,characterHeight);
  frame=renderCharacterFrame(actor.id,rig,sample.angleIndex*Math.PI/4);if(!u.deploymentRig)frames.set(key,frame);if(frames.size>256)frames.delete(frames.keys().next().value);
 }
 const grid=Math.abs(c.getTransform().a)||1,dx=Math.round((x-PIVOT.x*pixelScale)*grid)/grid,dy=Math.round((y-PIVOT.y*pixelScale)*grid)/grid;
 c.imageSmoothingEnabled=false;c.drawImage(frame,dx,dy,CELL*pixelScale,CELL*pixelScale);return dy+(frame.spriteTop??0)*pixelScale;
}
const hitCanvas=document.createElement('canvas');hitCanvas.width=hitCanvas.height=CELL;
export function nativeUnitHit(u,spec,pointer,time=0,index=0,options={}){
 spec=byId[u.id]||spec;
 const position=nativeSpawn(spec,u,u.side||0,index),scale=3*creatureWorldScale(spec,u),p=nativeScreen(position.x,position.y);
 const x=Math.round((pointer.x-p.x)/scale+PIVOT.x),y=Math.round((pointer.y-p.y)/scale+PIVOT.y),ctx=hitCanvas.getContext('2d',{willReadFrequently:true});
 if(!options.padding&&(x<-3||y<-3||x>=CELL+3||y>=CELL+3))return false;
 ctx.clearRect(0,0,CELL,CELL);drawNativeUnit(ctx,u,spec,PIVOT.x,PIVOT.y,time,1);
 const left=Math.max(0,x-3),top=Math.max(0,y-3),right=Math.min(CELL,x+4),bottom=Math.min(CELL,y+4);
 if(right>left&&bottom>top){const pixels=ctx.getImageData(left,top,right-left,bottom-top).data;
  for(let i=3;i<pixels.length;i+=4)if(pixels[i]>80)return true;}
 if(!options.padding)return false;
 // Small companions need a usable pointer target even between feathers or
 // beside a narrow staff. Derive it from the authored painted silhouette.
 const rgba=ctx.getImageData(0,0,CELL,CELL).data;let minX=CELL,minY=CELL,maxX=-1,maxY=-1;
 for(let n=0;n<CELL*CELL;n++)if(rgba[n*4+3]>80){minX=Math.min(minX,n%CELL);maxX=Math.max(maxX,n%CELL);minY=Math.min(minY,Math.floor(n/CELL));maxY=Math.max(maxY,Math.floor(n/CELL));}
 if(maxX<0)return false;
 const pad=options.padding,l=p.x+(minX-PIVOT.x)*scale-pad,r=p.x+(maxX+1-PIVOT.x)*scale+pad,
  t=p.y+(minY-PIVOT.y)*scale-pad,b=options.includeMarker?Math.max(p.y+26,p.y+(maxY+1-PIVOT.y)*scale+pad):p.y+(maxY+1-PIVOT.y)*scale+pad;
 return pointer.x>=l&&pointer.x<=r&&pointer.y>=t&&pointer.y<=b;
}
const ring=(c,x,y,r,color,fill)=>{const p=nativeScreen(x,y);c.beginPath();c.ellipse(p.x,p.y,r,r*.58,0,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=2;if(fill){c.fillStyle=fill;c.fill();}c.stroke();};
export function renderNativeBattle(display,w,h,battle,planet,time,team,foes,species){
 const camera=arenaCamera(w,h),c=scene.getContext('2d');c.setTransform(NATIVE_RENDER_SCALE,0,0,NATIVE_RENDER_SCALE,0,0);c.clearRect(0,0,1002,654);c.imageSmoothingEnabled=false;
 const units=battle?battle.units.map(u=>battle.done?u:interpolatedNativeUnit(u,battle.renderAlpha)):[...team.map((u,i)=>({...u,side:0,...nativeSpawn(species[u.id],u,0,i),hp:1,maxHp:1})),...foes.map((u,i)=>({...u,side:1,...nativeSpawn(species[u.id],u,1,i),hp:1,maxHp:1}))];
 if(battle){
  for(const f of battle.fields)ring(c,f.x,f.y,f.r,'#a3d8b277','#88c7a119');
  for(const h of battle.hazards){paintSkillHazard(c,h,nativeScreen,battle.time,{reduced:!!battle.reducedMotion,intensity:(battle.tuning?.effectIntensity??100)/100});const p=nativeScreen(h.x,h.y);c.fillStyle=h.source.side?'#f0c6ad':'#d9e8c3';c.font='11px sans-serif';c.textAlign='center';c.fillText(h.ttl.toFixed(1)+'s',p.x,p.y);}
  for(const a of battle.strikes){if(a.cancelled)continue;const p=nativeScreen(a.source.x,a.source.y);c.save();c.translate(p.x,p.y);c.scale(1,.58);const angle=Math.atan2(a.dy,a.dx);c.strokeStyle=a.charged?'#aee8ef':a.heavy?'#edaa77':a.source.side?'#ec977d':'#e1d5a0';c.lineWidth=a.charged?4:2;c.beginPath();if(a.beam){c.moveTo(0,0);c.lineTo(a.dx*a.reach,a.dy*a.reach);}else{c.moveTo(0,0);c.arc(0,0,a.reach,angle-a.arc,angle+a.arc);c.closePath();}c.stroke();c.restore();}
 }
 const auraSize=(battle?.tuning||getTuning()).auraSize??100;
 const auraTime=battle?battle.time:time,auraReduced=battle?.reducedMotion||document.body.classList.contains('gentle-ui');
 for(const u of units){if(u.captured||u.hp<=0)continue;const p=nativeScreen(u.x,u.y),spec=species[u.id];paintRarityRing(c,p.x,p.y,auraProfile(spec.rarity,{side:u.side,battle:!!battle,elite:!!u.elite||!!u.boss,size:auraSize}),creatureWorldScale(spec,u));}
 const terrain=battle?.terrain||foes[0]?.terrain||[];
 for(const u of [...units,...terrain.map(t=>({...t,pillar:true}))].sort((a,b)=>a.y-b.y)){
  if(u.pillar){const p=nativeScreen(u.x,u.y);c.fillStyle="#10231d77";c.beginPath();c.ellipse(p.x,p.y,u.r+8,14,0,0,Math.PI*2);c.fill();c.fillStyle="#454d47";c.fillRect(p.x-u.r,p.y-50,u.r*2,50);c.fillStyle="#808776";c.fillRect(p.x-u.r*.65,p.y-47,u.r*.35,46);c.fillStyle="#a1a58a";c.beginPath();c.ellipse(p.x,p.y-50,u.r,u.r*.58,0,0,Math.PI*2);c.fill();c.fillStyle="#37493a";for(let i=0;i<5;i++)c.fillRect(p.x-u.r*.6+i*10,p.y-50+(i%2)*8,7,6);continue;}
  const p=nativeScreen(u.x,u.y),spec=species[u.id],scale=creatureWorldScale(spec,u);if(u.captured)continue;c.fillStyle=u.hp>0?'#0d1b1577':'#0d1b1544';c.beginPath();c.ellipse(p.x,p.y,(u.boss?68:46)*scale,14*scale,0,0,Math.PI*2);c.fill();

  if(eliteModifier(u)&&u.hp>0)paintEliteFlame(c,p,scale,battle?battle.time:time,u,battle?.2:1,auraSize/100);
  if(battle&&u.hp>0){const radius=u.radius;c.strokeStyle=u.side?'#dc9c8155':'#c6df9d55';c.lineWidth=1;c.beginPath();c.ellipse(p.x,p.y,radius,radius*.58,0,0,Math.PI*2);c.stroke();}
  const visualTop=drawNativeUnit(c,u,spec,p.x,p.y,battle?battle.time:time,3*scale);
  if(u.hp<=0)continue;
  paintRarityFlair(c,p.x,p.y,auraTime,auraProfile(spec.rarity,{side:u.side,battle:!!battle,elite:!!u.elite||!!u.boss,size:auraSize}),scale,{phase:(u.seat||0)*.55,reducedMotion:auraReduced});
  const width=u.boss?58:30,bar=Math.min(visualTop-9,p.y-(({knight:115,orc:100,elf:105,caster:116,wolf:77,fox:112,mech:90,spider:83,jelly:92,serpent:65,flyer:112,crab:80,centipede:75}[actorFor(u,spec).id]||112)+12)*scale*characterHeight*formProfile(spec,u).height);
  c.fillStyle='#12251c';c.fillRect(p.x-width/2-1,bar-1,width+2,6);c.fillStyle='#edc184';if(battle&&battle.time-(u.lastHitTime??-10)<.45)c.fillRect(p.x-width/2,bar,width*Math.min(1,(u.lastHpBeforeHit??u.hp)/u.maxHp),4);c.fillStyle=u.side?'#d48976':'#bad79a';c.fillRect(p.x-width/2,bar,width*u.hp/u.maxHp,4);
  if(u.shield>0){c.fillStyle='#99dfe0';c.fillRect(p.x-width/2,bar-4,width*Math.min(1,u.shield/u.maxHp),2);}
  if(battle){c.fillStyle='#14251e';c.fillRect(p.x-width/2-1,bar+7,width+2,6);c.fillStyle=u.stamina<30?'#e69367':'#e5bf78';c.fillRect(p.x-width/2,bar+8,width*u.stamina/100,4);c.fillStyle="#e5a47d";c.fillRect(p.x-width/2,bar+16,width*Math.min(1,(u.poise||0)/(u.maxPoise||1)),2);const a=u.nativeAction;if(a&&!a.released){c.fillStyle=a.charged?'#aee8ef':'#e2a77a';c.fillRect(p.x-width/2,bar+12,width*a.elapsed/a.windup,2);}const status=activeAilments(u);c.font='bold 10px sans-serif';c.textAlign='center';status.slice(0,4).forEach((a,i)=>{const x=p.x+(i-(Math.min(4,status.length)-1)/2)*13;c.fillStyle='#14251c';c.fillRect(x-6,bar-18,12,12);c.strokeStyle=a.color;c.lineWidth=1;c.strokeRect(x-6,bar-18,12,12);c.fillStyle=a.color;c.fillText(a.icon,x,bar-8);});if(status.length){const color=status[0].color;c.fillStyle=color;const pulse=.5+.5*Math.sin(battle.time*5);c.globalAlpha=.35+pulse*.25;for(let i=0;i<3;i++)c.fillRect(p.x+Math.cos(i*2.1+battle.time)*9,p.y-5+Math.sin(i*2.1+battle.time)*3,2,2);c.globalAlpha=1;}}
  c.textAlign='center';c.fillStyle=u.side?'#ecc8b3':'#e0e8c2';c.font='10px sans-serif';c.fillText(spec.name+(eliteModifier(u)?' \u00b7 '+eliteModifier(u).tierLabel:''),p.x,p.y+21);
  if(battle&&u.side===0&&battle.selectedUid===u.uid){ring(c,u.x,u.y,30,"#c4df99");c.font="11px sans-serif";c.fillStyle="#dbe4b9";c.fillText(u.intention||"Ready",p.x,p.y+36);}
  if(battle?.capturePlan?.uid===u.uid&&!battle.captureSettled)ring(c,u.x,u.y,35,'#e8d385');
 }
 if(battle)paintActionFeedback(c,battle,characterHeight);
 if(battle?.captureScene)paintCapture(c,battle,species);
 if(battle){
  for(const p of battle.projectiles){const z=((p.originZ||45)+((p.targetZ??45)-(p.originZ||45))*Math.min(1,p.age/(p.flightTime||p.passTime||1)))*characterHeight;paintSkillProjectile(c,p,nativeScreen,z,battle.time,{reduced:!!battle.reducedMotion,intensity:(battle.tuning?.effectIntensity??100)/100});}
  for(const e of battle.effects){const p=nativeScreen(e.x,e.y);c.save();c.globalAlpha=Math.min(1,e.ttl/(e.max||.45))*Math.min(1,(battle.tuning?.effectIntensity??100)/100);c.strokeStyle=e.color;c.fillStyle=e.color;c.lineWidth=(e.width||3)*Math.max(.5,(battle.tuning?.effectIntensity??100)/100);const bodyHeight=(e.victimUid?nativeBodyHeight(battle.units.find(u=>u.uid===e.victimUid)):e.sourceUid?nativeBodyHeight(battle.units.find(u=>u.uid===e.sourceUid)):40)*characterHeight;if(paintSkillEffect(c,e,p,nativeScreen,bodyHeight,battle.time,{reduced:!!battle.reducedMotion,heightScale:characterHeight})){c.restore();continue;}if(e.type==='text'){c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(e.text,p.x,p.y-55-(1-e.ttl)*20);}else if(e.type==='impact'){paintImpact(c,e,p,(e.victimUid?nativeBodyHeight(battle.units.find(u=>u.uid===e.victimUid)):40)*characterHeight);paintSkillImpact(c,e,p,bodyHeight,{reduced:!!battle.reducedMotion});}else if(e.type==='blink'){const f=1-e.ttl/e.max;c.beginPath();c.ellipse(p.x,p.y-20,10+35*f,30*(1-f)+6,0,0,Math.PI*2);c.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3+f*3;c.fillRect(p.x+Math.cos(a)*25*f,p.y-20+Math.sin(a)*35,3,3);}}else if(['bite','claw','scythe','pinch','ram'].includes(e.type)){
 c.translate(p.x,p.y-(e.originZ||12)*characterHeight);c.rotate(e.angle||0);const f=1-e.ttl/(e.max||.22),r=Math.max(4,Math.min(10,(e.r||12)*.6));c.lineWidth=1.5;
 if(e.type==='bite'||e.type==='pinch'){for(const side of [-1,1]){c.beginPath();c.arc(0,side*(1-f)*r,r*.7,side<0?0:Math.PI,side<0?Math.PI:Math.PI*2);c.stroke();}c.fillStyle='#fff0d3';c.fillRect(-1,-1,2,2);}
 else if(e.type==='claw'){for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-r,i*3-r*.3);c.lineTo(r*f+2,i*3+r*.3);c.stroke();}}
 else if(e.type==='scythe'){for(const side of [-1,1]){c.beginPath();c.moveTo(-r,side*r);c.quadraticCurveTo(r*.3,0,r,-side*r);c.stroke();}}
 else{for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(-r,i*3);c.lineTo(2,i);c.stroke();}}
 }else if(e.type==='slash'){c.translate(p.x,p.y-18);c.scale(1,.58);c.rotate(e.angle||0);c.lineWidth=5;c.beginPath();c.arc(0,0,(e.r||40)*.8,-.75,.75);c.stroke();}else if(e.tx!==undefined){const t=nativeScreen(e.tx,e.ty);c.beginPath();c.moveTo(p.x,p.y-45);c.lineTo(t.x,t.y-45);c.stroke();}else if(['impact','slash','cast','defeat','nova','ring','shield'].includes(e.type)){c.beginPath();c.arc(p.x,p.y-(e.victimUid?nativeBodyHeight(battle.units.find(u=>u.uid===e.victimUid)):40)*characterHeight,e.type==='impact'?10:(e.r||20)*.3,0,Math.PI*2);c.stroke();}c.restore();}
  for(const p of battle.particles){const q=nativeScreen(p.x,p.y);c.fillStyle=p.color;c.globalAlpha=Math.min(1,p.ttl/(p.max||1))*Math.min(1,(battle.tuning?.effectIntensity??100)/100);c.fillRect(q.x,q.y-30,3,3);}c.globalAlpha=1;
 }
 const pc=pixel.getContext('2d');pc.imageSmoothingEnabled=false;pc.clearRect(0,0,pixel.width,pixel.height);pc.drawImage(scene,0,0,pixel.width,pixel.height);display.imageSmoothingEnabled=false;display.clearRect(0,0,w,h);const shake=battle&&!battle.reducedMotion?(battle.shake||0)*(battle.tuning?.cameraShake??100)/100:0,offset=shake?Math.round(Math.sin(battle.time*83)*shake*w/1002):0;display.fillStyle="#15251e";display.fillRect(0,0,w,h);if(backdrop.complete&&backdrop.naturalWidth){// Show the complete arena illustration; cover cropped away the scenery in wide viewports.
 const bg={x:0,y:0,w,h};display.drawImage(backdrop,bg.x,bg.y,bg.w,bg.h);}if(!battle?.reducedMotion&&!document.body.classList.contains('gentle-ui'))paintAmbient(display,'glade',battle?battle.time:time,{width:w,height:h,image:backdrop,geometry:{x:0,y:0,w,h}});if(planet){display.fillStyle=planet===1?'#8e382524':'#3c21523d';display.fillRect(0,0,w,h);}display.drawImage(pixel,camera.x*pixel.width/1002,camera.y*pixel.height/654,camera.width*pixel.width/1002,camera.height*pixel.height/654,offset,Math.round(offset*.5),w,h);if(battle){display.save();display.translate(offset,Math.round(offset*.5));display.scale(camera.scale,camera.scale);display.translate(-camera.x,-camera.y);paintCombatTexts(display,battle,byId,characterHeight,camera);display.restore();}
}

function paintCapture(c,battle,species){
 const event=battle.captureScene,u=battle.units.find(u=>u.uid===event.uid);if(!u)return;const p=nativeScreen(u.x,u.y),t=event.elapsed,f=t/event.duration,scale=creatureWorldScale(species[u.id],u),color={scout:'#a3e2c5',runic:'#93dbe9',astral:'#caadfa',mythic:'#f8d58c'}[event.tool],z=p.y-nativeBodyHeight(u)*characterHeight/2;
 c.save();if(!battle.reducedMotion){c.fillStyle='#080f222b';c.fillRect(0,0,1002,654);c.strokeStyle=color;c.lineWidth=2;for(let i=0;i<3;i++){const r=35+70*(1-Math.min(1,f*2))+i*13;c.globalAlpha=.6*(1-f*.4);c.beginPath();c.ellipse(p.x,z,r,r*.55,i*.6+t,0,Math.PI*2);c.stroke();}for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.8,r=95*(1-Math.min(.9,f));c.fillStyle=color;c.fillRect(p.x+Math.cos(a)*r,z+Math.sin(a)*r-80*(1-Math.min(1,f*3)),3,3);}if(f>.7&&event.success){c.globalAlpha=Math.max(0,(1-f)*2);c.lineWidth=5;c.beginPath();c.arc(p.x,z,30+(f-.7)*340,0,Math.PI*2);c.stroke();}}c.globalAlpha=1;c.translate(p.x,z);const size=24+12*Math.sin(Math.min(1,f*3)*Math.PI/2),shake=f>.35&&f<.8?Math.sin(t*35)*3:0;c.translate(shake,0);c.strokeStyle=color;c.lineWidth=3;c.fillStyle='#10252be0';
 // An angular, four-wing lattice closes around a shrinking silhouette.
 if(u.captured&&f<.6){c.save();c.globalAlpha=1-f;c.translate(-p.x,-z);drawNativeUnit(c,{...u,captured:false},species[u.id],p.x,p.y,battle.time,3*scale*(1-f*.9));c.restore();}
 for(let i=0;i<4;i++){const a=i*Math.PI/2+f*.5,r=size*(f<.3?1+(1-f*3):1);c.save();c.rotate(a);c.beginPath();c.moveTo(r,0);c.lineTo(r+8,-8);c.lineTo(r+15,0);c.lineTo(r+8,8);c.closePath();c.fill();c.stroke();c.restore();}
 c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+f*.5,xx=Math.cos(a)*size,yy=Math.sin(a)*size;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.closePath();c.stroke();
 if(f>.8){c.globalAlpha=Math.max(0,1-(f-.8)*4);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=size+(f-.8)*(event.success?35:180);c.fillStyle=color;c.fillRect(Math.cos(a)*r,Math.sin(a)*r,4,4);}}
 c.globalAlpha=1;c.font='bold 13px sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(f<.8?'LATTICE LOCK · '+Math.round(event.chance*100)+'%':event.success?'ALLEGIANCE CHANGED - ROUND ALLY':'LATTICE BROKEN',0,-size-18);c.restore();
}

function paintEliteFlame(c,p,scale,time,u,intensity=1,size=1){
 const rhythm=idleRhythm(u),r=Math.max(12,34*scale),height=Math.max(22,110*scale);
 c.save();c.translate(p.x,p.y);c.scale(size,size);p={x:0,y:0};c.globalAlpha=.65*intensity;c.shadowColor='#ff3424';c.shadowBlur=8*intensity*size;
 for(let i=0;i<11;i++){const f=(time*(.65+i*.025)+rhythm.offset+i/11)%1,a=i*Math.PI*2/11,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r*.32-f*height;
  c.fillStyle=i%3?'#fa3823':'#ffaf52';c.beginPath();c.moveTo(x-3*(1-f),y+6);c.quadraticCurveTo(x-7*Math.sin(time*5+i),y+1,x+Math.sin(time*7+i)*3,y-8*(1-f));c.quadraticCurveTo(x+5,y,x+3*(1-f),y+6);c.fill();
 }
 c.shadowBlur=0;c.strokeStyle='#e74532';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,r,r*.32,0,0,Math.PI*2);c.stroke();c.restore();
}
