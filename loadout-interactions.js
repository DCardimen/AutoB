import {equipGear,removeGear,equipmentSlots,GEAR_BY_ID} from './creature-equipment.js';
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
  if(equipmentSlots(c)<=0)return false;
  let slot=target.gearSlot;
  if(!Number.isInteger(slot)&&(c.equipment||[]).length>=equipmentSlots(c))slot=Math.max(0,c.equipment.findIndex(id=>GEAR_BY_ID[id]?.slot===GEAR_BY_ID[payload.id]?.slot));
  const replace=Number.isInteger(slot)&&slot>=0&&slot<(c.equipment||[]).length;
  if(from===c||c.equipment?.includes(payload.id)||((c.equipment||[]).length>=equipmentSlots(c)&&!replace))return false;
  if(!from&&!run.gearInventory?.some(g=>g.uid===payload.uid&&g.id===payload.id))return false;
  if(from&&from.equipment?.[payload.slot]!==payload.id)return false;
  if(replace&&from){const displaced=c.equipment[slot];if(from.equipment.includes(displaced))return false;c.equipmentRolls??=c.equipment.map(()=>null);from.equipmentRolls??=from.equipment.map(()=>null);[c.equipmentRolls[slot],from.equipmentRolls[payload.slot]]=[from.equipmentRolls[payload.slot],c.equipmentRolls[slot]];c.equipment[slot]=payload.id;from.equipment[payload.slot]=displaced;return true;}
  if(replace)removeGear(run,Number(target.index),slot);
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
