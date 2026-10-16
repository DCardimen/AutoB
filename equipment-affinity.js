// Family identity is independent of pose, wielding hand and reused physics rigs.
const families={aurel:'sword',brakk:'two-handed',syl:'bow',rowan:'bow',morrow:'bow',nyra:'staff',eira:'staff',brom:'two-handed',grum:'two-handed',tarka:'two-handed',grit:'sword',sable:'sword',cogwalker:'cannon',luma:'staff'};
const weapons={
 'sunsteel-edge':'sword','venom-sabre':'sword','cinder-cleaver':'two-handed','frost-rapier':'sword','thorn-halberd':'two-handed','siege-maul':'two-handed','hunters-claw':'fang','duelists-edge':'sword','storm-conductor':'staff','vampire-tooth':'fang','sundering-glaive':'two-handed',
 'frostfire-edge':'sword','silver-disruptor':'cannon','predators-tooth':'fang','tempo-rapier':'sword','quickdraw-string':'bow','sanguine-needle':'sword','glacial-tuning-fork':'staff','shatter-chisel':'two-handed','vitality-scythe':'two-handed','siegebreaker-pick':'two-handed','virulent-fan':'staff','practice-copper':'sword','apprentice-grip':'sword',
};
export const AFFINITY_LABELS={sword:'Swords & daggers',bow:'Bows','two-handed':'Two-handed weapons',staff:'Staves & spell focuses',cannon:'Cannons',fang:'Fangs & jewelry'};
export function equipmentAffinity(creature){return families[creature?.id]||'fang';}
export function gearWeaponClass(gear){return gear?.weaponClass||weapons[gear?.id]||(gear?.slot==='Fang'?'fang':null);}
export function gearCompatibility(creature,gear){
 if(!creature||!gear)return {allowed:false,reason:'Choose a companion and a known item.'};
 const affinity=equipmentAffinity(creature),weapon=gearWeaponClass(gear);
 const allowed=affinity==='fang'?(weapon==='fang'||gear.slot==='Jewelry'):gear.slot!=='Jewelry'&&(!weapon||weapon===affinity)&&(gear.slot!=='Weapon'||weapon===affinity);
 return {allowed,reason:allowed?'Compatible':`${AFFINITY_LABELS[affinity]} only${affinity==='fang'?'':'; armor and accessories also allowed'}.`};
}
