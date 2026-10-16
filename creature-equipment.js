import {STARTER_GEAR} from './starter-equipment.js';
import {AFFINITY_GEAR} from './affinity-gear.js';
import {gearCompatibility,equipmentSlotType,EQUIPMENT_SLOTS} from './equipment-affinity.js';
export {gearCompatibility,equipmentAffinity,AFFINITY_LABELS,gearWeaponClass,equipmentAlignment,equipmentSlotType,EQUIPMENT_SLOTS,gearAudience} from './equipment-affinity.js';
import {EXPANDED_GEAR} from './equipment-catalog.js';
import {itemStrength,scaledEffect,combatEffectDescription} from './item-effects.js';
export const CREATURE_GEAR=[
 {id:'sunsteel-edge',name:'Sunsteel Edge',slot:'Weapon',attack:1.16,color:'#e7c477',cost:85,desc:'+16% attack. A gold-edged weapon accent.'},
 {id:'reliquary-plate',name:'Reliquary Plate',slot:'Armor',health:1.16,poise:16,color:'#b2cccb',cost:85,desc:'+16% health and 16 poise. Visible shoulder plating.'},
 {id:'mooncloth-mantle',name:'Mooncloth Mantle',slot:'Cape',cooldown:.92,color:'#b5a0d4',cost:85,desc:'8% faster cooldowns and a longer, violet cloth mantle.'},
 {id:'windstep-boots',name:'Windstep Boots',slot:'Boots',speed:1.12,color:'#a8c6a1',cost:75,desc:'+12% movement speed.'},
 {id:'prism-focus',name:'Prism Focus',slot:'Focus',healing:1.18,color:'#99d5de',cost:90,desc:'+18% healing. A luminous cast focus.'},
 {id:'citadel-core',name:'Citadel Core',slot:'Core',shield:38,poise:12,color:'#90bdcb',cost:90,desc:'Start battles with 38 shield and 12 extra poise.'},
 ...EXPANDED_GEAR,
 ...STARTER_GEAR,
 ...AFFINITY_GEAR,
];
export const GEAR_BY_ID=Object.fromEntries(CREATURE_GEAR.map(g=>[g.id,g]));
export function equipmentSlots(c){return c.equipmentVersion>=2?EQUIPMENT_SLOTS.length:((c.balanceVersion||0)>=15?3:0)+Math.max(0,Math.min(2,c.evolution||0));}
export function equipmentSlotViews(c){
 return (c.equipmentVersion>=2?EQUIPMENT_SLOTS:Array.from({length:equipmentSlots(c)},(_,i)=>'Slot '+(i+1))).map((type,i)=>{
  const slot=c.equipmentVersion>=2?(c.equipment||[]).findIndex(id=>equipmentSlotType(GEAR_BY_ID[id])===type):i;
  return {type,slot,gear:GEAR_BY_ID[c.equipment?.[slot]],roll:c.equipmentRolls?.[slot]};
 });
}
export const equipmentStrength=c=>(c.equipmentVersion>=2?1:itemStrength(c))*Math.max(.25,Math.min(1.3,c.equipmentQuality??1));
export function gearQuality(c,id){return Math.max(.25,Math.min(1.3,c.equipmentRolls?.[(c.equipment||[]).indexOf(id)]?.quality??1));}
export function equipmentEffects(c){const out={attack:1,health:1,cooldown:1,speed:1,healing:1,poise:0,shield:0,armor:0,regenStamina:1,attackSpeed:1,actionSpeed:1,dashCooldown:1,atkFlat:0,hpFlat:0,speedFlat:0,actionSpeedFlat:0,hpRegen:0};for(const id of c.equipment||[]){const strength=equipmentStrength(c)*gearQuality(c,id),g=GEAR_BY_ID[id];if(!g)continue;for(const key of ['attack','health','cooldown','speed','healing'])out[key]*=1+((g[key]||1)-1)*strength;out.poise+=(g.poise||0)*strength;out.shield+=(g.shield||0)*strength;out.armor+=(g.armor||0)*strength;if(g.hook==='flat'){const e=scaledEffect(g.effect,strength);out.attack*=e.atk||1;out.health*=e.hp||1;out.cooldown*=e.cd||1;out.speed*=e.speed||1;out.healing*=e.healing||1;out.armor+=e.armor||0;out.regenStamina*=e.regenStamina||1;out.attackSpeed*=e.attackSpeed||1;out.actionSpeed*=e.actionSpeed||1;out.dashCooldown*=e.dashCooldown||1;for(const key of ['atkFlat','hpFlat','speedFlat','actionSpeedFlat','hpRegen'])out[key]+=e[key]||0;}}return out;}
export function equipmentTraits(c){return (c.equipment||[]).map(id=>GEAR_BY_ID[id]).filter(g=>g?.hook&&g.hook!=='flat').map(g=>({...g,id:'gear:'+g.id,wearerOnly:true,effect:scaledEffect(g.effect,equipmentStrength(c)*gearQuality(c,g.id))}));}
export function equipmentDescription(g,c={balanceVersion:17,equipmentVersion:2}){if(g.hook)return combatEffectDescription({...g,effect:scaledEffect(g.effect,equipmentStrength(c)*gearQuality(c,g.id))},{balanceVersion:12}).replace(/all allies|nearby allies|the weakest ally|lowest-health ally|all friendly creatures/gi,'the wearer').replace(/team armor/g,'wearer armor').replace(/team shield/g,'wearer shield').replace(/team stamina/g,'wearer stamina').replace(/team haste/g,'wearer haste').replace(/cleanse the team/g,'cleanse the wearer').replace(/weakest ally/g,'wearer')+(g.armor?` Base armor: ${+(g.armor*equipmentStrength(c)*gearQuality(c,g.id)).toFixed(1)}.`:'');const e=equipmentEffects({...c,equipment:[g.id],equipmentRolls:[c.equipmentRolls?.[(c.equipment||[]).indexOf(g.id)]||null]});return Object.entries({attack:e.attack,health:e.health,cooldown:e.cooldown,speed:e.speed,healing:e.healing}).filter(([,v])=>v!==1).map(([key,v])=>`${v>1?'+':''}${+((v-1)*100).toFixed(1)}% ${key}`).concat(e.poise?`${e.poise} poise`:[],e.shield?`${e.shield} opening shield`:[]).join(' · ');}
export function armorReduction(armor,role='Striker'){const effective=Math.max(0,Number(armor)||0)*(role==='Guardian'?1.4:1);return effective/(100+effective);}
export function enemyEquipment(c,seed,progress=0,chaos=0){
 c.balanceVersion=Math.max(17,c.balanceVersion||0);c.equipmentVersion=2;c.equipmentQuality=Math.min(1.25,.38+progress*.045+chaos*.018+(c.elite?.12:0)+(c.boss?.18:0));
 const compatible=CREATURE_GEAR.filter(g=>gearCompatibility(c,g).allowed),limit=c.elite||c.boss?2:1;
 const preferred=({Guardian:'Armor',Striker:'Weapon',Ranger:'Weapon',Support:'Accessory'})[c.role]||'Weapon';
 const pool=compatible.filter(g=>equipmentSlotType(g)===preferred);
 const first=(pool.length?pool:compatible)[Math.abs(seed)%Math.max(1,pool.length||compatible.length)];
 c.equipment=first?[first.id]:[];
 const remaining=compatible.filter(g=>equipmentSlotType(g)!==equipmentSlotType(first));
 if(limit>1&&remaining.length)c.equipment.push(remaining[Math.abs(seed*31)%remaining.length].id);
 return c;
}
export function claimEvolutionGear(run,index,id){const c=run.team[index];if(!c||!GEAR_BY_ID[id]||(c.gearClaimed||0)>=((c.balanceVersion||0)>=15?(c.evolution||0):equipmentSlots(c)))return false;c.gearClaimed=(c.gearClaimed||0)+1;run.gearInventory??=[];run.gearInventory.push({uid:`${c.uid}:gear:${c.gearClaimed}`,id});return true;}
export function equipGear(run,index,uid){
 const c=run.team[index],i=run.gearInventory?.findIndex(g=>g.uid===uid),item=run.gearInventory?.[i],g=GEAR_BY_ID[item?.id];
 if(!c||i===undefined||i<0||!gearCompatibility(c,g).allowed||c.equipment?.includes(item.id))return false;
 c.equipment??=[];c.equipmentRolls??=c.equipment.map(()=>null);
 const slot=c.equipmentVersion>=2?c.equipment.findIndex(id=>equipmentSlotType(GEAR_BY_ID[id])===equipmentSlotType(g)):-1;
 if(slot<0&&c.equipment.length>=equipmentSlots(c))return false;
 run.gearInventory.splice(i,1);
 if(slot>=0){const old={...c.equipmentRolls[slot],id:c.equipment[slot],uid:`${c.uid}:swap:${run.gearSerial=(run.gearSerial||0)+1}`};run.gearInventory.push(old);c.equipment[slot]=item.id;c.equipmentRolls[slot]={...item};}
 else{c.equipment.push(item.id);c.equipmentRolls.push({...item});}return true;
}
export function removeGear(run,index,slot){const c=run.team[index],id=c?.equipment?.[slot];if(!id)return false;const roll=c.equipmentRolls?.[slot]||{};c.equipment.splice(slot,1);c.equipmentRolls?.splice(slot,1);run.gearInventory??=[];run.gearInventory.push({...roll,uid:`${c.uid}:unsocket:${slot}:${run.gearSerial=(run.gearSerial||0)+1}`,id});return true;}
export function buyGear(run,id,seed=0,price=GEAR_BY_ID[id]?.cost){const g=GEAR_BY_ID[id];if(!g||!Number.isFinite(price)||price<0||run.gold<price)return false;run.gold-=price;run.gearInventory??=[];run.gearInventory.push({uid:`gear:${seed}:${run.gearSerial=(run.gearSerial||0)+1}`,id});return true;}

// Preserve rolled quality/provenance while migrating to one item per category.
export function reconcileEquipment(run){
 let moved=0;run.gearInventory??=[];
 for(const c of [...run.team,...run.bench||[]]){
  c.equipmentVersion=2;const occupied=new Set();
  for(let slot=0;slot<(c.equipment?.length||0);slot++){
   const id=c.equipment[slot],g=GEAR_BY_ID[id],type=equipmentSlotType(g);
   if(g&&gearCompatibility(c,g).allowed&&!occupied.has(type)){occupied.add(type);continue;}
   const roll=c.equipmentRolls?.[slot]||{};
   run.gearInventory.push({...roll,id,uid:`${c.uid}:slots:${run.gearSerial=(run.gearSerial||0)+1}`});
   c.equipment.splice(slot,1);c.equipmentRolls?.splice(slot,1);slot--;moved++;
  }
 }return moved;
}
