import {equipGear,removeGear,equipmentSlots} from './creature-equipment.js';
import {equipRelic,unequipRelic,linkRelic,relicSlots,canSupport,BY_ID} from './game.js';
import {loadoutFor} from './skills.js';
export function applyLoadoutDrop(run,payload,target){
 const c=run.team[Number(target.index)],from=run.team[payload.fromIndex];
 if(target.pack){if(payload.kind==='gear'&&from)return removeGear(run,payload.fromIndex,payload.slot);if(payload.kind==='gem'&&from)return unequipRelic(run,payload.fromIndex,payload.slot);return false;}
 if(!c)return false;
 if(payload.kind==='skill'){
  if(from!==c||!target.skill)return false;const skills=loadoutFor(BY_ID[c.id],c.level,c).active;
  if(!skills.includes(payload.id)||!skills.includes(target.skill))return false;
  const order=[...(c.skillOrder||[]).filter(id=>skills.includes(id)),...skills.filter(id=>!c.skillOrder?.includes(id))],i=order.indexOf(payload.id),j=order.indexOf(target.skill);
  order.splice(i,1);order.splice(j,0,payload.id);c.skillOrder=order;return true;
 }
 if(payload.kind==='gear'){
  const replace=Number.isInteger(target.gearSlot)&&target.gearSlot>=0&&target.gearSlot<(c.equipment||[]).length;
  if(from===c||c.equipment?.includes(payload.id)||((c.equipment||[]).length>=equipmentSlots(c)&&!replace))return false;
  if(!from&&!run.gearInventory?.some(g=>g.uid===payload.uid&&g.id===payload.id))return false;
  if(from&&from.equipment?.[payload.slot]!==payload.id)return false;
  if(replace)removeGear(run,Number(target.index),target.gearSlot);
  if(from){if(from.equipment?.[payload.slot]!==payload.id)return false;removeGear(run,payload.fromIndex,payload.slot);return equipGear(run,Number(target.index),run.gearInventory.at(-1).uid);}
  return equipGear(run,Number(target.index),payload.uid);
 }
 if(payload.kind==='gem'){
  const loadout=loadoutFor(BY_ID[c.id],c.level,c),skills=[loadout.auto,...loadout.active];
  if(target.skill&&(!skills.includes(target.skill)||!canSupport(payload.id,target.skill)))return false;
  if(from===c)return target.skill?linkRelic(run,Number(target.index),payload.slot,target.skill):false;
  if(c.relics?.some(g=>g.id===payload.id)||(c.relics||[]).length>=relicSlots(c)||!skills.some(id=>canSupport(payload.id,id)))return false;
  if(from){if(from.relics?.[payload.slot]?.uid!==payload.uid)return false;unequipRelic(run,payload.fromIndex,payload.slot);}
  if(!equipRelic(run,Number(target.index),payload.uid))return false;
  return target.skill?linkRelic(run,Number(target.index),c.relics.length-1,target.skill):true;
 }
 return false;
}
