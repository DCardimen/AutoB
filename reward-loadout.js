import {claimLootDrop,lootDropClaimed} from './expedition-rules.js';
import {applyLoadoutDrop} from './loadout-interactions.js';
import {equipmentEffects,equipmentSlotType,GEAR_BY_ID} from './creature-equipment.js';
import {auraTier,auraSlots} from './aura-stones.js';

const copy=value=>JSON.parse(JSON.stringify(value));
export const rewardGrade={upgrade:{symbol:'↑',label:'Upgrade'},maybe:{symbol:'?',label:'Consider'},blocked:{symbol:'×',label:'Cannot equip'},worse:{symbol:'×',label:'Weaker'}};
export function rewardDropPayload(run,drop){
 if(!drop||!['gear','stone'].includes(drop.kind))return null;
 const payload={kind:drop.kind==='gear'?'gear':'gem',id:drop.gear||drop.stone,uid:drop.id,rewardDropId:drop.id};
 for(const [index,c]of run.team.entries()){
  const slot=drop.kind==='gear'?c.equipmentRolls?.findIndex(g=>g?.uid===drop.id):c.relics?.findIndex(g=>g.uid===drop.id);
  if(slot>=0)return {...payload,fromIndex:index,slot};
 }
 return payload;
}
function resolveTarget(run,payload,target){
 if(!target||target.pack||target.skill||payload.kind!=='gem'||target.relicSlot!==undefined)return target;
 const c=run.team[Number(target.index)],stones=c?.relics||[],same=stones.findIndex(g=>g.id===payload.id);
 const slot=same>=0?same:stones.length<auraSlots(c)?stones.length:stones.reduce((best,g,i)=>auraTier(g)>auraTier(stones[best])?i:best,0);
 return {...target,relicSlot:slot};
}
function prepare(run,cache,payload,target){
 const drop=cache?.drops.find(d=>d.id===payload.rewardDropId);
 if(!drop||rewardDropPayload(run,drop)?.id!==payload.id)return null;
 const nextRun=copy(run),nextCache=copy(cache);
 if(!lootDropClaimed(nextRun,nextCache,drop.id)&&!claimLootDrop(nextRun,nextCache,drop.id))return null;
 const fresh=rewardDropPayload(nextRun,drop),resolved=resolveTarget(nextRun,fresh,target);
 return applyLoadoutDrop(nextRun,fresh,resolved)?{run:nextRun,cache:nextCache,target:resolved}:null;
}
export function canRewardLoadoutDrop(run,cache,payload,target){return !!prepare(run,cache,payload,target);}
export function applyRewardLoadoutDrop(run,cache,payload,target){
 const next=prepare(run,cache,payload,target);if(!next)return false;
 Object.assign(run,next.run);Object.assign(cache,next.cache);return true;
}
function compareGear(c,drop,worn,roll){
 const candidate=GEAR_BY_ID[drop.gear],previous=GEAR_BY_ID[worn];
 // Proc timing and conditional effects depend on the build. Do not pretend
 // that a single DPS score can order healing, control and defensive triggers.
 if([candidate,previous].some(g=>g.hook&&g.hook!=='flat'))return {grade:'maybe',reason:'Different or conditional effects — compare with your build.'};
 const a=equipmentEffects({...c,equipment:[drop.gear],equipmentRolls:[{quality:drop.quality??1}]}),b=equipmentEffects({...c,equipment:[worn],equipmentRolls:[roll||{}]});
 const changes=Object.keys(a).map(key=>(a[key]-b[key])*(key==='cooldown'||key==='dashCooldown'?-1:1));
 const better=changes.some(n=>n>1e-6),worse=changes.some(n=>n< -1e-6);
 if(better&&!worse)return {grade:'upgrade',reason:'Higher stats with no stat loss.'};
 if(worse&&!better)return {grade:'worse',reason:'Lower stats with no stat gain.'};
 return {grade:'maybe',reason:better?'Stat trade-offs — compare with your build.':'Equivalent stats.'};
}
export function rewardRecommendation(run,cache,drop,target){
 const payload=rewardDropPayload(run,drop),c=run.team[Number(target?.index)];
 if(!payload||!c)return {grade:'blocked',reason:'Choose a deployed companion.'};
 const resolved=resolveTarget(run,payload,target);
 if(!canRewardLoadoutDrop(run,cache,payload,resolved))return {grade:'blocked',reason:payload.fromIndex===Number(target.index)?'Already equipped on this companion.':'Cannot equip on this companion yet.',target:resolved};
 if(payload.kind==='gear'){
  const type=equipmentSlotType(GEAR_BY_ID[drop.gear]),slot=(c.equipment||[]).findIndex(id=>equipmentSlotType(GEAR_BY_ID[id])===type);
  return {target:resolved,...(slot<0?{grade:'upgrade',reason:`Empty ${type.toLowerCase()} slot.`}:compareGear(c,drop,c.equipment[slot],c.equipmentRolls?.[slot]))};
 }
 const old=c.relics?.[resolved.relicSlot];
 if(!old)return {grade:'upgrade',reason:'Empty compatible aura slot.',target:resolved};
 if(old.id!==drop.stone)return {grade:'maybe',reason:'Different aura — compare its effect with your team.',target:resolved};
 const difference=auraTier(old)-auraTier(drop);
 return {grade:difference>0?'upgrade':difference<0?'worse':'maybe',reason:difference>0?'Stronger tier of the same aura.':difference<0?'Weaker tier of the same aura.':'Equivalent aura tier.',target:resolved};
}
export function bestRewardRecommendation(run,cache,drop){
 const rank={upgrade:3,maybe:2,worse:1,blocked:0};
 return run.team.map((c,index)=>({...rewardRecommendation(run,cache,drop,{index}),index,name:c.id})).sort((a,b)=>rank[b.grade]-rank[a.grade]||a.index-b.index)[0]||{grade:'blocked',reason:'No deployed companion can equip this.'};
}
