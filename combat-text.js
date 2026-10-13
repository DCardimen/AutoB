import {creatureWorldScale} from './native-size.js';
const glyphs={
 '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
 '2':['111','001','111','100','111'],'3':['111','001','111','001','111'],
 '4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
 '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],
 '8':['111','101','111','101','111'],'9':['111','101','111','001','111'],
 '+':['000','010','111','010','000'],'!':['010','010','010','000','010'],
 'B':['110','101','110','101','110'],'A':['010','101','111','101','101'],
};
export function queueCombatText(battle,target,amount,kind='hit'){
 if(amount<.5){if(!['status','heal','armor'].includes(kind))return;target.textRemainders??={};amount=target.textRemainders[kind]=(target.textRemainders[kind]||0)+amount;if(amount<1)return;target.textRemainders[kind]=0;}
 const merged=battle.combatTexts.find(t=>t.uid===target.uid&&t.kind===kind&&battle.time-t.updated<.16&&['status','heal','shield','armor'].includes(kind));
 if(merged){merged.amount+=amount;merged.updated=battle.time;merged.ttl=Math.max(merged.ttl,.65);return;}
 const stack=battle.combatTexts.filter(t=>t.uid===target.uid&&t.ttl>.4).length;
 battle.combatTexts.push({id:++battle.textSerial,uid:target.uid,amount,kind,ttl:1.05,max:1.05,updated:battle.time,stack:stack%3,x:target.x,y:target.y});
 if(battle.combatTexts.length>80)battle.combatTexts.shift();
}
export function advanceCombatTexts(battle,dt){battle.combatTexts=(battle.combatTexts||[]).filter(t=>(t.ttl-=dt)>0);}
function textPixels(c,label,x,y,color,scale){
 const points=[];for(let i=0;i<label.length;i++){const rows=glyphs[label[i]];if(!rows)continue;for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(rows[row][col]==='1')points.push([x+(i*4+col)*scale,y+row*scale]);}
 c.fillStyle='#111b25';for(const [x,y]of points)c.fillRect(x-1,y-1,scale+2,scale+2);
 c.fillStyle=color;for(const [x,y]of points)c.fillRect(x,y,scale,scale);
}
export function paintCombatTexts(c,battle,species,height=1){
 for(const t of battle.combatTexts||[]){
  const u=battle.units.find(u=>u.uid===t.uid),spec=species[u?.id];if(!u||!spec)continue;
  const grid=(c.canvas?.width||334)/334,age=t.max-t.ttl,crit=t.kind==='crit',scale=grid*(crit&&age<.18?2:1);
  const label=(t.kind==='heal'?'+':t.kind==='shield'?'B':t.kind==='armor'?'A':'')+Math.max(1,Math.round(t.amount))+(crit?'!':'');
  const color={crit:'#fff0a0',heal:'#a7ef9b',shield:'#88ddef',armor:'#b5c9ed',status:'#dfa2f4',hit:u.side?'#fff4cf':'#f7a194'}[t.kind];
  const x=Math.max(3*grid,Math.min(331*grid-label.length*4*scale,Math.round(u.x/3*grid-label.length*2*scale+(t.stack-1)*7*grid)));
  const headHeight=110*creatureWorldScale(spec,u)*height;
  const y=Math.max(4*grid,Math.round(((u.y*.58+75-headHeight)/3-9-t.stack*7-age*11-Math.sin(Math.min(1,age/.18)*Math.PI)*2)*grid));
  c.globalAlpha=Math.min(1,t.ttl/.22);textPixels(c,label,x,y,color,scale);c.globalAlpha=1;
 }
}
