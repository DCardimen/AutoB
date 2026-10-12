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
let characterHeight=1;
export function setCharacterHeight(value){characterHeight=Math.max(.85,Math.min(1.1,Number(value)||1));}
export function getCharacterHeight(){return characterHeight;}
export function nativePreviewFrame(c,state='idle',phase=.25,dir=1){const key=['preview',c.id,c.evolution,c.evolutionPath,state,phase,dir,characterHeight].join(':');if(!frames.has(key)){const spec=byId[c.id];frames.set(key,renderCharacterFrame(nativeRigFor(spec,c),nativePoseRig(spec,c,state,phase,characterHeight),dir*Math.PI/4));if(frames.size>256)frames.delete(frames.keys().next().value);}return frames.get(key);}
export const nativeScreen=(x,y)=>({x,y:y*.58+75});
const scene=document.createElement('canvas');scene.width=1002;scene.height=654;
const pixel=document.createElement('canvas');pixel.width=334;pixel.height=218;
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
 const actor=actorFor(u,spec),sample=spriteSample(actor,time,u.nativeActor?null:{state:'idle',phase:.25});
 let rig=characterRig(actor.id,sample.state,sample.phase,sample.stage,{...sample,stride:actor.stride});rig.cape=sample.cape;
 if(u.deploymentRig)rig=u.deploymentRig;else if(actor.ragdoll)rig=ragdollRig(actor.ragdoll,actor.getup>0?1-actor.getup/.45:0);
 rig.capeMesh=actor.capeMesh;rig=nativeFormRig(spec,u,rig,characterHeight);
 const key=u.id+':'+characterHeight+':'+sample.key+':'+u.evolution+':'+u.evolutionPath+':'+(u.equipment||[]).join(',')+':'+(actor.capeMeshKey||'')+(actor.ragdoll?':'+actor.ragdoll.time.toFixed(4):'');let frame=u.deploymentRig?null:frames.get(key);if(!frame){frame=renderCharacterFrame(actor.id,rig,sample.angleIndex*Math.PI/4);if(!u.deploymentRig)frames.set(key,frame);if(frames.size>256)frames.delete(frames.keys().next().value);}
 c.imageSmoothingEnabled=false;c.drawImage(frame,Math.round(x-PIVOT.x*pixelScale),Math.round(y-PIVOT.y*pixelScale),CELL*pixelScale,CELL*pixelScale);
}
const ring=(c,x,y,r,color,fill)=>{const p=nativeScreen(x,y);c.beginPath();c.ellipse(p.x,p.y,r,r*.58,0,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=2;if(fill){c.fillStyle=fill;c.fill();}c.stroke();};
export function renderNativeBattle(display,w,h,battle,planet,time,team,foes,species){
 const c=scene.getContext('2d');c.clearRect(0,0,1002,654);c.imageSmoothingEnabled=false;
 if(backdrop.complete&&backdrop.naturalWidth)c.drawImage(backdrop,0,0,1002,654);else{c.fillStyle='#253c31';c.fillRect(0,0,1002,654);}
 if(planet){c.fillStyle=planet===1?'#8e382524':'#3c21523d';c.fillRect(0,0,1002,654);}
 const units=battle?battle.units:[...team.map((u,i)=>({...u,side:0,...nativeSpawn(species[u.id],u,0,i),hp:1,maxHp:1})),...foes.map((u,i)=>({...u,side:1,...nativeSpawn(species[u.id],u,1,i),hp:1,maxHp:1}))];
 if(battle){
  for(const f of battle.fields)ring(c,f.x,f.y,f.r,'#a3d8b277','#88c7a119');
  for(const h of battle.hazards){ring(c,h.x,h.y,h.r,h.source.side?'#f48d72':'#b2d998',h.source.side?'#d763492e':'#8ac47422');const p=nativeScreen(h.x,h.y);c.fillStyle='#f1d2b5';c.font='14px sans-serif';c.textAlign='center';c.fillText(h.ttl.toFixed(1)+'s',p.x,p.y);}
  for(const a of battle.strikes){if(a.cancelled)continue;const p=nativeScreen(a.source.x,a.source.y);c.save();c.translate(p.x,p.y);c.scale(1,.58);const angle=Math.atan2(a.dy,a.dx);c.strokeStyle=a.charged?'#aee8ef':a.heavy?'#edaa77':a.source.side?'#ec977d':'#e1d5a0';c.lineWidth=a.charged?4:2;c.beginPath();if(a.beam){c.moveTo(0,0);c.lineTo(a.dx*a.reach,a.dy*a.reach);}else{c.moveTo(0,0);c.arc(0,0,a.reach,angle-a.arc,angle+a.arc);c.closePath();}c.stroke();c.restore();}
 }
 const terrain=battle?.terrain||foes[0]?.terrain||[];
 for(const u of [...units,...terrain.map(t=>({...t,pillar:true}))].sort((a,b)=>a.y-b.y)){
  if(u.pillar){const p=nativeScreen(u.x,u.y);c.fillStyle="#10231d77";c.beginPath();c.ellipse(p.x,p.y,u.r+8,14,0,0,Math.PI*2);c.fill();c.fillStyle="#454d47";c.fillRect(p.x-u.r,p.y-50,u.r*2,50);c.fillStyle="#808776";c.fillRect(p.x-u.r*.65,p.y-47,u.r*.35,46);c.fillStyle="#a1a58a";c.beginPath();c.ellipse(p.x,p.y-50,u.r,u.r*.58,0,0,Math.PI*2);c.fill();c.fillStyle="#37493a";for(let i=0;i<5;i++)c.fillRect(p.x-u.r*.6+i*10,p.y-50+(i%2)*8,7,6);continue;}
  const p=nativeScreen(u.x,u.y),spec=species[u.id];if(u.captured)continue;c.fillStyle=u.hp>0?'#0d1b1577':'#0d1b1544';c.beginPath();c.ellipse(p.x,p.y,u.boss?34:23,7,0,0,Math.PI*2);c.fill();
  const scale=creatureWorldScale(spec,u);drawNativeUnit(c,u,spec,p.x,p.y,battle?battle.time:time,3*scale);
  if(u.hp<=0)continue;
  const width=u.boss?70:42,bar=p.y-({knight:115,orc:100,elf:105,caster:116,wolf:77,fox:112,mech:90,spider:83,jelly:92,serpent:65,flyer:112,crab:80,centipede:75}[actorFor(u,spec).id]||112)*scale*characterHeight*formProfile(spec,u).height;
  c.fillStyle='#12251c';c.fillRect(p.x-width/2-1,bar-1,width+2,6);c.fillStyle=u.side?'#d48976':'#bad79a';c.fillRect(p.x-width/2,bar,width*u.hp/u.maxHp,4);
  if(u.shield>0){c.fillStyle='#99dfe0';c.fillRect(p.x-width/2,bar-4,width*Math.min(1,u.shield/u.maxHp),2);}
  if(battle){c.fillStyle='#e5bf78';c.fillRect(p.x-width/2,bar+8,width*u.stamina/100,2);c.fillStyle="#e5a47d";c.fillRect(p.x-width/2,bar+16,width*Math.min(1,(u.poise||0)/(u.maxPoise||1)),2);const a=u.nativeAction;if(a&&!a.released){c.fillStyle=a.charged?'#aee8ef':'#e2a77a';c.fillRect(p.x-width/2,bar+12,width*a.elapsed/a.windup,2);}const status=['burn','poison','root','slow','stagger','bleed'].filter(k=>u[k]>0);c.font='11px sans-serif';c.fillStyle='#e8d5b4';c.textAlign='center';if(status.length)c.fillText(status.map(k=>({burn:'F',poison:'P',root:'R',slow:'S',stagger:'!',bleed:'B'})[k]).join(' '),p.x,bar-7);}
  c.textAlign='center';c.fillStyle=u.side?'#ecc8b3':'#e0e8c2';c.font='12px sans-serif';c.fillText(spec.name,p.x,p.y+21);
  if(battle&&u.side===0&&battle.selectedUid===u.uid){ring(c,u.x,u.y,30,"#c4df99");c.font="11px sans-serif";c.fillStyle="#dbe4b9";c.fillText(u.intention||"Ready",p.x,p.y+36);}
  if(battle?.capturePlan?.uid===u.uid&&!battle.captureSettled)ring(c,u.x,u.y,35,'#e8d385');
 }
 if(battle?.captureScene)paintCapture(c,battle,species);
 if(battle){
  for(const p of battle.projectiles){const q=nativeScreen(p.x,p.y+14),z=(p.originZ||45)+((p.targetZ??45)-(p.originZ||45))*Math.min(1,p.age/(p.flightTime||p.passTime||1));c.save();c.translate(q.x,q.y-z*characterHeight);c.rotate(Math.atan2(p.vy*.58,p.vx));c.fillStyle=p.nativeArrow?'#e4d7b7':p.color;c.fillRect(p.nativeArrow?-9:-3,-2,p.nativeArrow?13:6,4);c.restore();for(const t of p.trail){const v=nativeScreen(t.x,t.y+14);c.fillStyle=p.color+'66';c.fillRect(v.x-1,v.y-z*characterHeight,3,3);}}
  for(const e of battle.effects){const p=nativeScreen(e.x,e.y);c.save();c.globalAlpha=Math.min(1,e.ttl/(e.max||.45));c.strokeStyle=e.color;c.fillStyle=e.color;c.lineWidth=e.width||3;if(e.type==='text'){c.font='bold 13px sans-serif';c.textAlign='center';c.fillText(e.text,p.x,p.y-55-(1-e.ttl)*20);}else if(e.tx!==undefined){const t=nativeScreen(e.tx,e.ty);c.beginPath();c.moveTo(p.x,p.y-45);c.lineTo(t.x,t.y-45);c.stroke();}else if(['impact','slash','cast','defeat','nova','ring','shield'].includes(e.type)){c.beginPath();c.arc(p.x,p.y-(e.victimUid?nativeBodyHeight(battle.units.find(u=>u.uid===e.victimUid)):40)*characterHeight,e.type==='impact'?10:(e.r||20)*.3,0,Math.PI*2);c.stroke();}c.restore();}
  for(const p of battle.particles){const q=nativeScreen(p.x,p.y);c.fillStyle=p.color;c.globalAlpha=Math.min(1,p.ttl/(p.max||1));c.fillRect(q.x,q.y-30,3,3);}c.globalAlpha=1;
 }
 const pc=pixel.getContext('2d');pc.imageSmoothingEnabled=false;pc.drawImage(scene,0,0,334,218);if(battle)paintCombatTexts(pc,battle,byId,characterHeight);display.imageSmoothingEnabled=false;display.clearRect(0,0,w,h);display.drawImage(pixel,0,0,w,h);
}

function paintCapture(c,battle,species){
 const event=battle.captureScene,u=battle.units.find(u=>u.uid===event.uid);if(!u)return;const p=nativeScreen(u.x,u.y),t=event.elapsed,f=t/event.duration,scale=creatureWorldScale(species[u.id],u),color={scout:'#a3e2c5',runic:'#93dbe9',astral:'#caadfa',mythic:'#f8d58c'}[event.tool],z=p.y-nativeBodyHeight(u)*characterHeight/2;
 c.save();c.translate(p.x,z);const size=24+12*Math.sin(Math.min(1,f*3)*Math.PI/2),shake=f>.35&&f<.8?Math.sin(t*35)*3:0;c.translate(shake,0);c.strokeStyle=color;c.lineWidth=3;c.fillStyle='#10252be0';
 // An angular, four-wing lattice closes around a shrinking silhouette.
 if(u.captured&&f<.6){c.save();c.globalAlpha=1-f;c.translate(-p.x,-z);drawNativeUnit(c,{...u,captured:false},species[u.id],p.x,p.y,battle.time,3*scale*(1-f*.9));c.restore();}
 for(let i=0;i<4;i++){const a=i*Math.PI/2+f*.5,r=size*(f<.3?1+(1-f*3):1);c.save();c.rotate(a);c.beginPath();c.moveTo(r,0);c.lineTo(r+8,-8);c.lineTo(r+15,0);c.lineTo(r+8,8);c.closePath();c.fill();c.stroke();c.restore();}
 c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+f*.5,xx=Math.cos(a)*size,yy=Math.sin(a)*size;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.closePath();c.stroke();
 if(f>.8){c.globalAlpha=Math.max(0,1-(f-.8)*4);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=size+(f-.8)*(event.success?35:180);c.fillStyle=color;c.fillRect(Math.cos(a)*r,Math.sin(a)*r,4,4);}}
 c.globalAlpha=1;c.font='bold 13px sans-serif';c.textAlign='center';c.fillStyle=color;c.fillText(f<.8?'LATTICE LOCK · '+Math.round(event.chance*100)+'%':event.success?'COMPANION CAPTURED':'LATTICE BROKEN',0,-size-18);c.restore();
}
