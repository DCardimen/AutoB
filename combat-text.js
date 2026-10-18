import {creatureWorldScale} from './native-size.js';
export function queueCombatText(battle,target,amount,kind='hit',source=null){
 if(amount<.5){if(!['status','heal','armor'].includes(kind))return;target.textRemainders??={};amount=target.textRemainders[kind]=(target.textRemainders[kind]||0)+amount;if(amount<1)return;target.textRemainders[kind]=0;}
 const sourceSide=source?.side??(target.side===0?1:0);
 const merged=battle.combatTexts.find(t=>t.uid===target.uid&&t.kind===kind&&t.sourceSide===sourceSide&&battle.time-t.updated<.16&&['status','heal','shield','armor','hit','crit'].includes(kind));
 if(merged){merged.amount+=amount;merged.updated=battle.time;merged.ttl=Math.max(merged.ttl,.65);return;}
 const occupied=new Set(battle.combatTexts.filter(t=>t.uid===target.uid&&t.ttl>.1).map(t=>t.stack));let stack=0;while(occupied.has(stack)&&stack<9)stack++;
 battle.combatTexts.push({id:++battle.textSerial,uid:target.uid,amount,kind,sourceSide,ttl:1.05,max:1.05,updated:battle.time,stack,x:target.x,y:target.y});
 if(battle.combatTexts.length>80)battle.combatTexts.shift();
}
export function advanceCombatTexts(battle,dt){battle.combatTexts=(battle.combatTexts||[]).filter(t=>(t.ttl-=dt)>0);}

export function queueCombatCue(battle,target,kind){
 if(battle.combatTexts.some(t=>t.uid===target.uid&&t.kind===kind&&battle.time-t.updated<.4))return;
 battle.combatTexts.push({id:++battle.textSerial,uid:target.uid,amount:0,kind,sourceSide:target.side,ttl:.85,max:.85,updated:battle.time,stack:0});
 if(battle.combatTexts.length>80)battle.combatTexts.shift();
}

const styles={miss:{top:'#d9d2bd',bottom:'#b1ad9c',size:11,label:'MISS'},block:{top:'#e9fcff',bottom:'#83cbe9',size:12,label:'BLOCK'},dodge:{top:'#e3f9ea',bottom:'#a7dcce',size:12,label:'DODGE'},stagger:{top:'#fff2cf',bottom:'#f4b478',size:13,label:'STAGGER'},crit:{top:'#fff4b5',bottom:'#ffc34f',caption:'CRITICAL',size:21},hit:{top:'#fff1bb',bottom:'#eebc59',size:16},heal:{top:'#eaffde',bottom:'#80e4ac',caption:'HEAL',size:17},shield:{top:'#e9fcff',bottom:'#83cbe9',caption:'ABSORB',size:14},armor:{top:'#eff1ff',bottom:'#a3b7ec',caption:'ARMOR',size:14},status:{top:'#fff1bb',bottom:'#eebc59',size:15}};
export function combatTextPresentation(t,{reducedMotion=false,size=100,hostile=false}={}){
 const style=styles[t.kind]||styles.hit,age=Math.max(0,t.max-t.ttl),crit=t.kind==='crit';
 const impact=reducedMotion?1:age<.075?.55+.65*age/.075:age<.21?1.2-.2*(age-.075)/.135:1;
 const enemyDamage=['hit','crit','status'].includes(t.kind)&&(t.sourceSide!==undefined?t.sourceSide===1:!hostile);
 return {...style,...(enemyDamage?{top:'#ffb1bd',bottom:'#ff526e'}:{}),label:style.label||((t.kind==='heal'?'+':'')+Math.max(1,Math.round(t.amount))),scale:impact*size/100,
  rise:reducedMotion?0:Math.min(1,age/.9)*24,drift:reducedMotion?0:((t.id%2)*2-1)*Math.sin(Math.min(1,age/.85)*Math.PI/2)*(crit?9:5),alpha:Math.min(1,Math.max(0,t.ttl)/.28)};
}

// Typeset after the pixel scene is enlarged. Creatures retain authored square
// pixels; combat feedback keeps smooth curves at the actual display resolution.
export function paintCombatTexts(c,battle,species,height=1,view={x:0,y:0,width:1002,height:654}){
 const counts=new Map(),placed=[];
 const visible=[...(battle.combatTexts||[])].sort((a,b)=>(b.kind==='crit')-(a.kind==='crit')||b.id-a.id).filter(t=>{const n=counts.get(t.uid)||0;counts.set(t.uid,n+1);return n<2;}).slice(0,10);
 const zoom=view.scale||1;
 for(const t of visible){
  const u=battle.units.find(u=>u.uid===t.uid),spec=species[u?.id];if(!u||!spec)continue;
  const p=combatTextPresentation(t,{reducedMotion:battle.reducedMotion,size:(battle.tuning?.damageTextSize??100)/zoom,hostile:!!u.side});
  c.save();c.font=`900 ${p.size*p.scale}px "Trebuchet MS", Arial, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  const half=c.measureText(p.label).width/2+6,lane=[0,-30,30][t.stack%3]/zoom,x=Math.max(view.x+half,Math.min(view.x+view.width-half,u.x+lane+p.drift));
  const head=130*creatureWorldScale(spec,u)*height;let y=Math.max(view.y+p.size*p.scale+10,Math.min(view.y+view.height-p.size,u.y*.58+75-head-(18+p.rise)/zoom));
  const line=26/zoom;for(let attempt=0;attempt<10&&placed.some(a=>Math.abs(a.x-x)<a.half+half&&Math.abs(a.y-y)<line);attempt++)y-=line;
  if(y<view.y+line){c.restore();continue;}placed.push({x,y,half});
  c.translate(x,y);if(!battle.reducedMotion)c.rotate((t.kind==='crit'?-.09:-.025)*(1-Math.min(1,(t.max-t.ttl)/.65)));
  c.globalAlpha=p.alpha;c.strokeStyle='#10212b';c.lineWidth=2.7;c.shadowColor='#06121bbb';c.shadowBlur=3;c.shadowOffsetY=2;c.strokeText(p.label,0,0);c.shadowBlur=0;c.shadowOffsetY=0;
  const ink=c.createLinearGradient(0,-p.size/2,0,p.size/2);ink.addColorStop(0,p.top);ink.addColorStop(.45,p.top);ink.addColorStop(1,p.bottom);c.fillStyle=ink;c.fillText(p.label,0,0);
  if(p.caption){c.font=`800 ${6/zoom}px "Trebuchet MS", Arial, sans-serif`;c.lineWidth=2;c.strokeText(p.caption,0,-p.size*p.scale*.76);c.fillStyle=p.top;c.fillText(p.caption,0,-p.size*p.scale*.76);}
  if(t.kind==='crit'&&!battle.reducedMotion){const f=Math.min(1,(t.max-t.ttl)/.3);c.globalAlpha=p.alpha*(1-f);c.strokeStyle=p.bottom;c.lineWidth=1.5;for(let i=0;i<5;i++){const a=i*Math.PI*2/5,r=12+f*22;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+6),Math.sin(a)*(r+6));c.stroke();}}
  c.restore();
 }
}
