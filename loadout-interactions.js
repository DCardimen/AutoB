import {capacity} from './expedition-rules.js';
import {equipGear,removeGear,equipmentSlots,GEAR_BY_ID,gearCompatibility} from './creature-equipment.js';
import {equipRelic,unequipRelic,linkRelic,relicSlots,canSupport,BY_ID} from './game.js';
import {loadoutFor} from './skills.js';
export function applyLoadoutDrop(run,payload,target){
 if(payload.kind==='reserve'){
  if(target.pack)return false;const j=run.bench.findIndex(c=>c.uid===payload.uid),i=Number(target.index);if(j<0)return false;
  if(target.seat!==undefined){const seat=Number(target.seat);if(!Number.isInteger(seat)||seat<0||seat>=capacity(run)||run.team.some(c=>c.seat===seat)||run.team.length>=capacity(run))return false;const c=run.bench.splice(j,1)[0];c.seat=seat;delete c.placement;run.team.push(c);return true;}
  if(!run.team[i])return false;const old=run.team[i],seat=old.seat;[run.team[i],run.bench[j]]=[run.bench[j],old];run.team[i].seat=seat;
  if(old.placement)run.team[i].placement={...old.placement};else delete run.team[i].placement;delete old.placement;return true;
 }
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
  if(equipmentSlots(c)<=0||!gearCompatibility(c,GEAR_BY_ID[payload.id]).allowed)return false;
  let slot=target.gearSlot;
  if(!Number.isInteger(slot)&&(c.equipment||[]).length>=equipmentSlots(c))slot=Math.max(0,c.equipment.findIndex(id=>GEAR_BY_ID[id]?.slot===GEAR_BY_ID[payload.id]?.slot));
  const replace=Number.isInteger(slot)&&slot>=0&&slot<(c.equipment||[]).length;
  if(from===c||c.equipment?.includes(payload.id)||((c.equipment||[]).length>=equipmentSlots(c)&&!replace))return false;
  if(!from&&!run.gearInventory?.some(g=>g.uid===payload.uid&&g.id===payload.id))return false;
  if(from&&from.equipment?.[payload.slot]!==payload.id)return false;
  if(replace&&from){const displaced=c.equipment[slot];if(from.equipment.includes(displaced)||!gearCompatibility(from,GEAR_BY_ID[displaced]).allowed)return false;c.equipmentRolls??=c.equipment.map(()=>null);from.equipmentRolls??=from.equipment.map(()=>null);[c.equipmentRolls[slot],from.equipmentRolls[payload.slot]]=[from.equipmentRolls[payload.slot],c.equipmentRolls[slot]];c.equipment[slot]=payload.id;from.equipment[payload.slot]=displaced;return true;}
  if(replace)removeGear(run,Number(target.index),slot);
  if(from){if(from.equipment?.[payload.slot]!==payload.id)return false;removeGear(run,payload.fromIndex,payload.slot);return equipGear(run,Number(target.index),run.gearInventory.at(-1).uid);}
  return equipGear(run,Number(target.index),payload.uid);
 }
 if(payload.kind==='gem'){
  if((run.rulesVersion||0)>=17){if(target.skill||from===c||c.relics?.some(g=>g.id===payload.id)||(c.relics||[]).length>=relicSlots(c))return false;if(from){if(from.relics?.[payload.slot]?.uid!==payload.uid)return false;unequipRelic(run,payload.fromIndex,payload.slot);}return equipRelic(run,Number(target.index),payload.uid);}
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
