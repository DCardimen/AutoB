import {creatureWorldScale} from './native-size.js';
export function queueCombatText(battle,target,amount,kind='hit'){
 if(amount<.5){if(!['status','heal','armor'].includes(kind))return;target.textRemainders??={};amount=target.textRemainders[kind]=(target.textRemainders[kind]||0)+amount;if(amount<1)return;target.textRemainders[kind]=0;}
 const merged=battle.combatTexts.find(t=>t.uid===target.uid&&t.kind===kind&&battle.time-t.updated<.16&&['status','heal','shield','armor'].includes(kind));
 if(merged){merged.amount+=amount;merged.updated=battle.time;merged.ttl=Math.max(merged.ttl,.65);return;}
 const occupied=new Set(battle.combatTexts.filter(t=>t.uid===target.uid&&t.ttl>.1).map(t=>t.stack));let stack=0;while(occupied.has(stack)&&stack<9)stack++;
 battle.combatTexts.push({id:++battle.textSerial,uid:target.uid,amount,kind,ttl:1.05,max:1.05,updated:battle.time,stack,x:target.x,y:target.y});
 if(battle.combatTexts.length>80)battle.combatTexts.shift();
}
export function advanceCombatTexts(battle,dt){battle.combatTexts=(battle.combatTexts||[]).filter(t=>(t.ttl-=dt)>0);}

const styles={crit:{top:'#fffbe0',bottom:'#ffb344',caption:'CRITICAL',size:35},hit:{top:'#fff7df',bottom:'#efc077',size:27},heal:{top:'#eaffde',bottom:'#80e4ac',caption:'HEAL',size:26},shield:{top:'#e9fcff',bottom:'#83cbe9',caption:'ABSORB',size:22},armor:{top:'#eff1ff',bottom:'#a3b7ec',caption:'ARMOR',size:22},status:{top:'#f7e4ff',bottom:'#d09ae8',size:23}};
export function combatTextPresentation(t,{reducedMotion=false,size=100,hostile=false}={}){
 const style=styles[t.kind]||styles.hit,age=Math.max(0,t.max-t.ttl),crit=t.kind==='crit';
 const impact=reducedMotion?1:age<.075?.55+.65*age/.075:age<.21?1.2-.2*(age-.075)/.135:1;
 return {...style,bottom:t.kind==='hit'&&!hostile?'#ef8f89':style.bottom,label:(t.kind==='heal'?'+':'')+Math.max(1,Math.round(t.amount)),scale:impact*size/100,
  rise:reducedMotion?0:Math.min(1,age/.9)*34,drift:reducedMotion?0:((t.id%2)*2-1)*Math.sin(Math.min(1,age/.85)*Math.PI/2)*(crit?14:8),alpha:Math.min(1,Math.max(0,t.ttl)/.28)};
}

// Typeset after the pixel scene is enlarged. Creatures retain authored square
// pixels; combat feedback keeps smooth curves at the actual display resolution.
export function paintCombatTexts(c,battle,species,height=1,view={x:0,y:0,width:1002,height:654}){
 for(const t of battle.combatTexts||[]){
  const u=battle.units.find(u=>u.uid===t.uid),spec=species[u?.id];if(!u||!spec)continue;
  const p=combatTextPresentation(t,{reducedMotion:battle.reducedMotion,size:battle.tuning?.damageTextSize??100,hostile:!!u.side});
  c.save();c.font=`900 ${p.size*p.scale}px "Trebuchet MS", Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  const half=c.measureText(p.label).width/2+10,lane=[0,-62,62,-124,124][t.stack%5],x=Math.max(view.x+half,Math.min(view.x+view.width-half,u.x+lane+p.drift));
  const head=110*creatureWorldScale(spec,u)*height,y=Math.max(view.y+p.size*p.scale+14,Math.min(view.y+view.height-p.size,u.y*.58+75-head-28-Math.floor(t.stack/5)*35-(t.stack%5>2?16:0)-p.rise));
  c.translate(x,y);if(!battle.reducedMotion)c.rotate((t.kind==='crit'?-.09:-.025)*(1-Math.min(1,(t.max-t.ttl)/.65)));
  c.globalAlpha=p.alpha;c.strokeStyle='#10212b';c.lineWidth=5;c.shadowColor='#06121bbb';c.shadowBlur=5;c.shadowOffsetY=3;c.strokeText(p.label,0,0);c.shadowBlur=0;c.shadowOffsetY=0;
  const ink=c.createLinearGradient(0,-p.size/2,0,p.size/2);ink.addColorStop(0,p.top);ink.addColorStop(.45,p.top);ink.addColorStop(1,p.bottom);c.fillStyle=ink;c.fillText(p.label,0,0);
  if(p.caption){c.font='800 8px "Trebuchet MS", Arial, sans-serif';c.lineWidth=3;c.strokeText(p.caption,0,-p.size*p.scale*.68);c.fillStyle=p.top;c.fillText(p.caption,0,-p.size*p.scale*.68);}
  if(t.kind==='crit'&&!battle.reducedMotion){const f=Math.min(1,(t.max-t.ttl)/.3);c.globalAlpha=p.alpha*(1-f);c.strokeStyle=p.bottom;c.lineWidth=1.5;for(let i=0;i<5;i++){const a=i*Math.PI*2/5,r=12+f*22;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+6),Math.sin(a)*(r+6));c.stroke();}}
  c.restore();
 }
}
