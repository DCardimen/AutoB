import {CREATURE_GEAR,GEAR_BY_ID} from './creature-equipment.js';
export const EQUIPMENT_DROP_RATES={Common:.08,Uncommon:.14,Rare:.28,Epic:.45,Legendary:.70};
export const EQUIPMENT_QUALITY={Common:.70,Uncommon:.85,Rare:1,Epic:1.12,Legendary:1.25};
const tiers=Object.keys(EQUIPMENT_QUALITY);
const distributions={Common:[.9,.1,0,0,0],Uncommon:[.35,.55,.1,0,0],Rare:[0,.35,.60,.05,0],Epic:[0,0,.4,.55,.05],Legendary:[0,0,.1,.35,.55]};
export function equipmentDropChance(c,spec,type){return c.captured?0:Math.min(.95,(EQUIPMENT_DROP_RATES[spec.rarity]||.08)+((type==='elite'||c.elite)? .15:0)+((type==='boss'||c.boss)? .25:0));}
export function rollEnemyGearDrop(c,spec,type,random){
 if(random()>=equipmentDropChance(c,spec,type))return null;
 let roll=random(),rarity='Common';for(const [i,weight]of (distributions[spec.rarity]||distributions.Common).entries()){roll-=weight;if(roll<0){rarity=tiers[i];break;}}
 const worn=(c.equipment||[]).filter(id=>GEAR_BY_ID[id]),slots={Guardian:['Armor','Core'],Striker:['Weapon','Boots'],Ranger:['Weapon','Focus'],Support:['Focus','Cape']};
 const pool=worn.length?worn:CREATURE_GEAR.filter(g=>slots[spec.role]?.includes(g.slot)).map(g=>g.id);
 return {kind:'gear',gear:pool[Math.min(pool.length-1,Math.floor(random()*pool.length))],rarity,quality:EQUIPMENT_QUALITY[rarity],sourceId:spec.id,sourceName:spec.name,sourceLevel:c.level||1,dropChance:equipmentDropChance(c,spec,type)};
}
