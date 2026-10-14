// Original mechanics derived from design patterns, not individual game items.
// Numerical effects follow modern runs' existing 50% item-strength convention.
const n=value=>+value.toFixed(2);
export const DESIGN_RELICS=[
 {id:'clockwork-orchard',name:'Clockwork Orchard',hook:'hit',effect:{auto:true,every:4,stamina:4},mechanic:{id:'orchard',hits:4,cap:3,echo:.4},icon:'♧'},
 {id:'pilgrims-debt',name:'Pilgrim’s Debt',hook:'cast',effect:{selfHP:.025},mechanic:{id:'debt',casts:3,power:1.6,radius:130},icon:'◈'},
 {id:'borrowed-tomorrow',name:'Borrowed Tomorrow',hook:'dodge',effect:{stamina:4},mechanic:{id:'bank',cap:3,refresh:1.6},icon:'⌛'},
 {id:'weather-vane-covenant',name:'Weather Vane Covenant',hook:'cast',effect:{shield:4},mechanic:{id:'covenant',window:4,interval:2,power:.5,ward:4},icon:'✥'},
 {id:'last-lantern',name:'Last Lantern',hook:'tick',effect:{interval:1,condition:'lastAlly',stamina:12},mechanic:{id:'lantern',bonus:.8},icon:'☼'},
 {id:'hollow-reed',name:'Hollow Reed Reliquary',hook:'heal',effect:{overflow:.3},statEffect:{healing:.5},mechanic:{id:'reed',conversion:1,capPower:3,radius:100},icon:'♜'},
 {id:'triune-crucible',name:'Triune Crucible',hook:'hit',effect:{condition:'triad',interval:4,refresh:.4},mechanic:{id:'triune',power:1.2,consume:1,interval:4,radius:110},icon:'△'},
 {id:'second-dawn-thread',name:'Second Dawn Thread',hook:'heal',effect:{shield:4,interval:4},mechanic:{id:'rescue',threshold:.25,ward:6,dodgeRefund:3},icon:'☷'},
].map((r,i)=>({...r,category:'combat',tier:'build',color:['#b9dba1','#e0b48d','#aabbe5','#d1b3e3'][i%4],cost:270+i*10,desc:mechanicDescription(r,.5)}));

export function mechanicDescription(r,strength=.5){
 const m=r.mechanic,amount=key=>n(m[key]*strength);
 switch(m.id){
  case 'orchard':return `Every ${m.hits} basic hits grow a seed (max ${m.cap}) and restore ${n(r.effect.stamina*strength)} stamina. Your next cooldown skill spends the seeds to echo at ${amount('echo')*100}% power each.`;
  case 'debt':return `Cooldown skills cost ${r.effect.selfHP*100}% max HP, without killing you. Every ${m.casts} casts erupt for ${amount('power')*100}% attack around you.`;
  case 'bank':return `Dodges bank a moment (max ${m.cap}) and restore ${n(r.effect.stamina*strength)} stamina. A basic hit spends one moment to advance every skill ${amount('refresh')}s.`;
  case 'covenant':return `Cast within ${m.window}s of a different allied element casting to arc ${amount('power')*100}% attack to two enemies and grant the weakest ally ${amount('ward')}s ailment immunity. ${m.interval}s team cooldown. Casting also grants ${n(r.effect.shield*strength)} shield.`;
  case 'lantern':return `When only one ally remains, it deals ${amount('bonus')*100}% more hit damage and recovers ${n(r.effect.stamina*strength)} extra stamina each second. No bonus while other allies live.`;
  case 'reed':return `${n((1-(1+(r.statEffect.healing-1)*strength))*100)}% less healing. Convert ${n(r.effect.overflow*strength*100)}% overhealing to shields; bank ${amount('conversion')*100}% excess healing, capped at ${amount('capPower')*100}% attack. Your next basic hit spends the bank in a nearby burst.`;
  case 'triune':return `Hit a target with three of burn, poison, bleed and slow to consume ${amount('consume')}s of each and burst for ${amount('power')*100}% attack, advancing skills ${n(r.effect.refresh*strength)}s. ${m.interval}s cooldown.`;
  case 'rescue':return `Heal an ally from below ${m.threshold*100}% HP across that threshold: it gains ${amount('ward')}s ailment immunity and your dodge recovers ${amount('dodgeRefund')}s. Once per rescued ally per battle. Healing also grants ${n(r.effect.shield*strength)} shield every ${r.effect.interval}s.`;
  default:return r.desc||'';
 }
}

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const afflictions=t=>['burn','poison','bleed','slow'].filter(k=>t?.[k]>0);
function announce(b,u,r){b.metrics.designProcs=(b.metrics.designProcs||0)+1;b.effect(u.x,u.y-45,r.name,r.color);}
function burst(b,u,power,radius,center=u){for(const t of b.living(1-u.side).filter(t=>dist(t,center)<radius))b.hit(t,power,u,u.loadout.auto,1,false,'curio');b.fx('ring',center.x,center.y,'#d6d7a4',{r:radius,ttl:.4,max:.4});}

export function designRelicEvent(b,u,event,data={}){
 const castLink=event==='cast'?((b.designLinks??={})[u.side]??={last:-100,proc:-100}):null;
 for(const r of u.runCurios||[]){
  const m=r.mechanic;if(!m)continue;
  u.designState??={};const s=u.designState[r.id]??={count:0,charges:0,bank:0,last:-100,rescued:[]};
  if(m.id==='orchard'){
   if(event==='hit'&&data.def?.auto&&data.dealt>0&&++s.count%m.hits===0)s.charges=Math.min(m.cap,s.charges+1);
   if(event==='cast'&&s.charges&&data.skillId){b.queue.push({ttl:.6,source:u,target:data.target,skillId:data.skillId,scale:m.echo*s.charges,relicEcho:true});b.metrics.echoes++;s.charges=0;announce(b,u,r);}
  }
  if(m.id==='debt'&&event==='cast'&&++s.count%m.casts===0){burst(b,u,u.atk*m.power,m.radius);announce(b,u,r);}
  if(m.id==='bank'){
   if(event==='dodge')s.charges=Math.min(m.cap,s.charges+1);
   if(event==='hit'&&data.def?.auto&&data.dealt>0&&s.charges){s.charges--;for(const cd of Object.values(u.cooldowns))cd.remaining=Math.max(0,cd.remaining-m.refresh);announce(b,u,r);}
  }
  if(m.id==='covenant'&&event==='cast'){
   const link=castLink;
   if(link.uid!==u.uid&&link.element!==u.element&&b.time-link.last<=m.window&&b.time-link.proc>=m.interval){
    link.proc=b.time;const foes=b.living(1-u.side).sort((a,c)=>dist(a,u)-dist(c,u)).slice(0,2);
    for(const t of foes)b.hit(t,u.atk*m.power,u,u.loadout.auto,1,false,'curio');
    const ally=b.living(u.side).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];if(ally)ally.statusWard=Math.max(ally.statusWard||0,m.ward);
    announce(b,u,r);
   }
  }
  if(m.id==='reed'){
   if(event==='heal'&&data.excess>0)s.bank=Math.min(u.atk*m.capPower,s.bank+data.excess*m.conversion);
   if(event==='hit'&&data.def?.auto&&data.dealt>0&&s.bank){const power=s.bank;s.bank=0;burst(b,u,power,m.radius,data.target);announce(b,u,r);}
  }
  if(m.id==='triune'&&event==='hit'&&data.dealt>0&&afflictions(data.target).length>=3&&b.time-s.last>=m.interval){
   s.last=b.time;for(const key of afflictions(data.target))data.target[key]=Math.max(0,data.target[key]-m.consume);
   burst(b,u,u.atk*m.power,m.radius,data.target);announce(b,u,r);
  }
  if(m.id==='rescue'&&event==='heal'&&data.real>0&&data.target?.side===u.side){
   const t=data.target,before=(t.hp-data.real)/t.maxHp;
   if(before<m.threshold&&t.hp/t.maxHp>=m.threshold&&!s.rescued.includes(t.uid)){s.rescued.push(t.uid);t.statusWard=Math.max(t.statusWard||0,m.ward);u.dodgeCooldown=Math.max(0,u.dodgeCooldown-m.dodgeRefund);announce(b,u,r);}
  }
 }
 if(castLink){castLink.element=u.element;castLink.uid=u.uid;castLink.last=b.time;}
}

export function designDamageFactor(b,u){return (u.runCurios||[]).reduce((factor,r)=>factor*(r.mechanic?.id==='lantern'&&u.hp>0&&b.living(u.side).length===1?1+r.mechanic.bonus:1),1);}
export function relicBuildSummary(u){
 return (u.runCurios||[]).filter(r=>r.mechanic).map(r=>{
  const s=u.designState?.[r.id],m=r.mechanic;
  if(m.id==='orchard')return `Seeds ${s?.charges||0}/${m.cap}`;
  if(m.id==='bank')return `Moments ${s?.charges||0}/${m.cap}`;
  if(m.id==='debt')return `Debt ${(s?.count||0)%m.casts}/${m.casts}`;
  if(m.id==='reed')return `Stored echo ${Math.round(s?.bank||0)}`;
  return '';
 }).filter(Boolean).join(' · ');
}
