import {PARTS,poseAt,createDynamics,stepDynamics,dynamicsErrors} from './model.mjs';
import {prepareKit,renderCharacter,renderScene} from './renderer.mjs';
window.foxLayeredPreviewTools={poseAt,createDynamics,stepDynamics,renderCharacter,renderScene};
const $=id=>document.getElementById(id),names={rowan:'Rowan',mature:'Mature art',moontrail:'Moontrail Ranger'};
const manifest=await fetch('./base-directions.json').then(r=>{if(!r.ok)throw Error('Kit manifest not built');return r.json();});
const kits=await Promise.all(manifest.forms.map(async data=>{const image=new Image();image.src=data.image;await image.decode();return prepareKit(image,data);}));
const actors=kits.map(kit=>{
 const div=document.createElement('div');div.className='specimen';const label=document.createElement('div');label.className='label';label.textContent=names[kit.form];const canvas=document.createElement('canvas');canvas.width=400;canvas.height=320;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',names[kit.form]+' stocky chibi animation preview');div.append(label,canvas);$('specimens').append(div);
 const buffer=document.createElement('canvas');buffer.width=buffer.height=manifest.rasterSize;return {kit,canvas,buffer,sim:createDynamics(kit.form)};
});
let time=0,last=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
$('action').value='attack';
$('pause').textContent=paused?'Play':'Pause';
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';};
$('native').onchange=()=>{$('specimens').classList.toggle('native',$('native').checked);};
$('action').onchange=()=>{time=0;actors.forEach(a=>a.sim=createDynamics(a.kit.form));};
function inspect(){
 $('parts').replaceChildren();const kit=kits.find(k=>k.form===$('parts-form').value);
 for(const [name,part]of Object.entries(kit.parts)){const div=document.createElement('div'),canvas=document.createElement('canvas'),label=document.createElement('span');div.className='part';canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;const scale=Math.min(112/part.w,112/part.h);ctx.drawImage(part.image,64-part.w*scale/2,64-part.h*scale/2,part.w*scale,part.h*scale);label.textContent=name;div.append(canvas,label);$('parts').append(div);}
}
$('parts-form').onchange=inspect;inspect();
function tick(now){
 const delta=last?Math.min(.25,(now-last)/1000):0;last=now;const dt=paused?0:delta*Number($('speed').value);time+=dt;
 let pose,errors=[];
 for(const actor of actors){pose=poseAt($('action').value,time,{stride:Number($('stride').value),bowProfile:actor.kit.bowProfile,stocky:manifest.stocky});actor.pose=pose;stepDynamics(actor.sim,pose,dt,Number($('wind').value));renderCharacter(actor.buffer.getContext('2d'),actor.kit,pose,actor.sim,{guides:$('guides').checked});renderScene(actor.canvas,actor.buffer,pose,actor.kit);errors.push(dynamicsErrors(actor.sim,pose));}
 $('status').textContent=pose.attackPhase+' · right-hand grip attached · '+(pose.blink?'blink':'eyes open');
 document.documentElement.dataset.ready='true';document.documentElement.dataset.action=$('action').value;
 window.foxLayeredPreview={actors,pose,errors,paused,seek:value=>{time=value;}};requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
