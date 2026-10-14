export const STARTER_GEAR=[
 {id:'practice-copper',name:'Practice Copper Blade',slot:'Weapon',effect:{atkFlat:4}},
 {id:'faded-tempo-ribbon',name:'Faded Tempo Ribbon',slot:'Cape',effect:{actionSpeedFlat:.08}},
 {id:'scuffed-trail-boots',name:'Scuffed Trail Boots',slot:'Boots',effect:{speedFlat:8}},
 {id:'moss-stitch-wrap',name:'Moss-stitch Wrap',slot:'Armor',effect:{hpRegen:1.2}},
 {id:'patched-linen',name:'Patched Linen Vest',slot:'Armor',effect:{armor:6}},
 {id:'tin-breathing-coil',name:'Tin Breathing Coil',slot:'Core',effect:{regenStamina:1.16}},
 {id:'soft-heart-lining',name:'Soft Heart Lining',slot:'Armor',effect:{hpFlat:24}},
 {id:'apprentice-grip',name:'Apprentice Grip',slot:'Weapon',effect:{atkFlat:2,actionSpeedFlat:.04}},
].map(g=>({...g,hook:'flat',tier:'starter',color:'#a6b9a1',cost:40,desc:'Modest starter equipment. Equip from the pack beneath your companions.'}));

export function rollStarterGear(seed){
  const pool=STARTER_GEAR.slice();let state=Number(seed)>>>0;
  return Array.from({length:3},(_,i)=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    const gear=pool.splice(state%pool.length,1)[0];
    return {uid:`${seed}:starter-gear:${i}`,id:gear.id,rarity:'Common',quality:1,starter:true,sourceName:'Starter supplies',sourceLevel:1};
  });
}

// Only an untouched opening trio is known to be the misplaced starter gift.
// Earned/equipped personal relics and progressed saves are preserved.
export function migrateStarterGear(run){
  if(run.starterGearVersion||(run.rulesVersion||0)<17)return false;
  const ids=['scorch-fang','ward-stone','quick-shard'];
  const untouched=!run.wins&&!run.depth&&!run.battleSerial&&run.inventory?.length===3&&ids.every(id=>run.inventory.some(g=>g.id===id))&&!run.team.some(c=>c.relics?.length);
  run.starterGearVersion=1;
  if(!untouched)return false;
  run.inventory=[];run.gearInventory??=[];
  run.gearInventory.push(...rollStarterGear(run.seed));return true;
}
