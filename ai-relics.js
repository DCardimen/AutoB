export const AI_RELICS=[
 {id:'tactician-eye',name:'Tactician’s Eye',effect:{interrupt:true},desc:'Prioritize nearby interruptible windups and reserve control skills for them.'},
 {id:'pack-whistle',name:'Pack Whistle',effect:{focusFire:true},desc:'Coordinate on an ally’s engaged target instead of spreading damage.'},
 {id:'sentinel-map',name:'Sentinel Map',effect:{screen:true},desc:'Guard the most endangered backliner and intercept its nearest pursuer.'},
 {id:'duelist-ribbon',name:'Duelist’s Ribbon',effect:{orbit:true},desc:'Circle an enemy’s committed attack to reach its exposed flank.'},
 {id:'longshot-codex',name:'Longshot Codex',effect:{kite:true},desc:'Rangers preserve firing distance and retreat toward nearby allies.'},
 {id:'battle-surgeon',name:'Battle Surgeon',effect:{triage:true},desc:'Healers reserve healing for actual missing health and cleanse injured allies first.'},
 {id:'predator-chart',name:'Predator Chart',effect:{huntSupport:true},desc:'Threaten isolated healers and avoid healthy fortified Guardians.'},
 {id:'patient-hour',name:'Patient Hour',effect:{reserveStamina:true},desc:'Keep enough stamina for a physical dodge instead of exhausting it on attacks.'},
 {id:'wardens-command',name:'Warden’s Command',effect:{formation:true},desc:'Stay within supporting distance of the weakest ally while approaching threats.'},
 {id:'hazard-compass',name:'Hazard Compass',effect:{anticipate:true},desc:'React earlier to committed attacks and leave hostile areas before impact.'},
 {id:'execution-ledger',name:'Execution Ledger',effect:{execute:true},desc:'Concentrate offense on an enemy that can be finished instead of chasing shields.'},
 {id:'mercy-command',name:'Mercy Command',effect:{captureCare:true},desc:'Before a planned capture, reserve heavy finishers against the selected target; ordinary damage can still knock it out.'},
].map((r,i)=>({...r,hook:'ai',icon:'⌘',color:['#9bcee2','#dfc386','#b4d095'][i%3],cost:230+i*8,category:'tactics'}));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function tacticalTarget(b,u,enemies){
 const ai=u.aiEffects||{};
 if(ai.interrupt){const t=enemies.filter(e=>e.nativeAction&&!e.nativeAction.released&&!e.nativeAction.charged&&dist(u,e)<250).sort((a,c)=>dist(u,a)-dist(u,c))[0];if(t)return t;}
 if(ai.screen){const ally=b.living(u.side).filter(a=>a!==u).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];if(ally)return enemies.slice().sort((a,c)=>dist(a,ally)-dist(c,ally))[0];}
 if(ai.focusFire){const counts=new Map();for(const ally of b.living(u.side))if(ally!==u&&ally.targetMemory?.hp>0)counts.set(ally.targetMemory.uid,(counts.get(ally.targetMemory.uid)||0)+1);const t=enemies.slice().sort((a,c)=>(counts.get(c.uid)||0)-(counts.get(a.uid)||0)||dist(u,a)-dist(u,c))[0];if(counts.get(t?.uid))return t;}
 if(ai.huntSupport){const score=e=>(e.role==='Support'?-2:e.role==='Guardian'?1:0)+e.hp/e.maxHp+dist(u,e)/600;return enemies.slice().sort((a,c)=>score(a)-score(c))[0];}
 if(ai.execute)return enemies.slice().sort((a,c)=>(a.hp+a.shield*.6)/a.maxHp+dist(u,a)/1000-((c.hp+c.shield*.6)/c.maxHp+dist(u,c)/1000))[0];
 return null;
}
export function tacticalMove(b,u,t,goal){
 const ai=u.aiEffects||{},allies=b.living(u.side).filter(a=>a!==u),d=dist(u,t)||1;
 if(ai.orbit&&t.nativeAction&&!t.nativeAction.released&&d<90&&u.range<100){const side=u.uid<t.uid?-1:1;return {x:t.x-(t.y-u.y)/d*side*32,y:t.y+(t.x-u.x)/d*side*32,intent:'Circling a committed windup'};}
 if((ai.formation||ai.screen)&&allies.length&&u.range<100){const ally=allies.slice().sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];if(dist(u,ally)>150&&dist(t,ally)<260){const gap=dist(t,ally)||1;return {x:ally.x+(t.x-ally.x)/gap*70,y:ally.y+(t.y-ally.y)/gap*70,intent:'Keeping the backline covered'};}}
 if(ai.kite&&u.range>100&&d<u.range*.6){const friend=allies.slice().sort((a,c)=>dist(u,a)-dist(u,c))[0],away={x:(u.x-t.x)/d,y:(u.y-t.y)/d};return {x:u.x+away.x*75+(friend?(friend.x-u.x)*.3:0),y:u.y+away.y*75+(friend?(friend.y-u.y)*.3:0),intent:'Kiting toward allied cover'};}
 return goal;
}
