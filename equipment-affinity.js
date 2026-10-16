// Family identity is independent of pose, wielding hand and reused physics rigs.
const families={aurel:'sword',brakk:'two-handed',syl:'bow',rowan:'bow',morrow:'bow',nyra:'staff',eira:'staff',brom:'two-handed',grum:'two-handed',tarka:'two-handed',grit:'sword',sable:'sword',cogwalker:'cannon',luma:'staff'};
const weapons={
 'sunsteel-edge':'sword','venom-sabre':'sword','cinder-cleaver':'two-handed','frost-rapier':'sword','thorn-halberd':'spear','siege-maul':'two-handed','hunters-claw':'fang','duelists-edge':'sword','storm-conductor':'staff','vampire-tooth':'fang','sundering-glaive':'spear',
 'frostfire-edge':'sword','silver-disruptor':'cannon','predators-tooth':'fang','tempo-rapier':'sword','quickdraw-string':'bow','sanguine-needle':'sword','glacial-tuning-fork':'staff','shatter-chisel':'two-handed','vitality-scythe':'two-handed','siegebreaker-pick':'two-handed','virulent-fan':'staff','practice-copper':'sword','apprentice-grip':'sword',
};
export const AFFINITY_LABELS={sword:'Swords, daggers & spears',bow:'Bows','two-handed':'Two-handed weapons & spears',staff:'Staves & spell focuses',cannon:'Cannons',fang:'Fangs, beast armor & jewelry'};
export function equipmentAffinity(creature){return families[creature?.id]||'fang';}
export function equipmentAlignment(creature){return ({sword:'Warrior','two-handed':'Warrior',bow:'Archer',staff:'Arcane',cannon:'Construct',fang:'Beast'})[equipmentAffinity(creature)];}
export function gearWeaponClass(gear){return gear?.weaponClass||weapons[gear?.id]||(gear?.slot==='Fang'?'fang':null);}
export const EQUIPMENT_SLOTS=['Weapon','Armor','Ring','Boots','Accessory'];
export function equipmentSlotType(gear){return ({Fang:'Weapon',Cape:'Accessory',Core:'Accessory',Focus:'Accessory',Jewelry:'Accessory'})[gear?.slot]||gear?.slot;}
export function gearAudience(gear){const weapon=gearWeaponClass(gear);return weapon?({sword:'Sword & dagger warriors',spear:'All warriors',bow:'Archers',staff:'Arcane companions',cannon:'Constructs',fang:'All beast companions'})[weapon]:gear?.audience==='beast'||gear?.slot==='Jewelry'?'Beast companions':gear?.slot==='Ring'?'All companions':'Non-beast companions';}
export function gearCompatibility(creature,gear){
 if(!creature||!gear)return {allowed:false,reason:'Choose a companion and a known item.'};
 const affinity=equipmentAffinity(creature),weapon=gearWeaponClass(gear);
 const beastItem=gear.audience==='beast'||gear.slot==='Jewelry';
 const allowed=weapon?(weapon===affinity||weapon==='spear'&&equipmentAlignment(creature)==='Warrior'):gear.slot==='Ring'||(affinity==='fang'?beastItem:!beastItem&&gear.slot!=='Fang');
 return {allowed,reason:allowed?'Compatible':`${gearAudience(gear)} only. ${equipmentAlignment(creature)} companion: ${AFFINITY_LABELS[affinity]}.`};
}
