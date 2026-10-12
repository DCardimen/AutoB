export const CREATURE_GEAR=[
 {id:'sunsteel-edge',name:'Sunsteel Edge',slot:'Weapon',attack:1.16,color:'#e7c477',cost:85,desc:'+16% attack. A gold-edged weapon accent.'},
 {id:'reliquary-plate',name:'Reliquary Plate',slot:'Armor',health:1.16,poise:16,color:'#b2cccb',cost:85,desc:'+16% health and 16 poise. Visible shoulder plating.'},
 {id:'mooncloth-mantle',name:'Mooncloth Mantle',slot:'Cape',cooldown:.92,color:'#b5a0d4',cost:85,desc:'8% faster cooldowns and a longer, violet cloth mantle.'},
 {id:'windstep-boots',name:'Windstep Boots',slot:'Boots',speed:1.12,color:'#a8c6a1',cost:75,desc:'+12% movement speed.'},
 {id:'prism-focus',name:'Prism Focus',slot:'Focus',healing:1.18,color:'#99d5de',cost:90,desc:'+18% healing. A luminous cast focus.'},
 {id:'citadel-core',name:'Citadel Core',slot:'Core',shield:38,poise:12,color:'#90bdcb',cost:90,desc:'Start battles with 38 shield and 12 extra poise.'},
];
export const GEAR_BY_ID=Object.fromEntries(CREATURE_GEAR.map(g=>[g.id,g]));
export function equipmentSlots(c){return Math.max(0,Math.min(2,c.evolution||0));}
export function equipmentEffects(c){const out={attack:1,health:1,cooldown:1,speed:1,healing:1,poise:0,shield:0};for(const id of c.equipment||[]){const g=GEAR_BY_ID[id];if(!g)continue;for(const key of ['attack','health','cooldown','speed','healing'])out[key]*=g[key]||1;out.poise+=g.poise||0;out.shield+=g.shield||0;}return out;}
export function claimEvolutionGear(run,index,id){const c=run.team[index];if(!c||!GEAR_BY_ID[id]||(c.gearClaimed||0)>=equipmentSlots(c))return false;c.gearClaimed=(c.gearClaimed||0)+1;run.gearInventory??=[];run.gearInventory.push({uid:`${c.uid}:gear:${c.gearClaimed}`,id});return true;}
export function equipGear(run,index,uid){const c=run.team[index],i=run.gearInventory?.findIndex(g=>g.uid===uid);if(!c||i===undefined||i<0||(c.equipment||[]).length>=equipmentSlots(c)||c.equipment?.includes(run.gearInventory[i].id))return false;c.equipment??=[];c.equipment.push(run.gearInventory.splice(i,1)[0].id);return true;}
export function removeGear(run,index,slot){const c=run.team[index],id=c?.equipment?.[slot];if(!id)return false;c.equipment.splice(slot,1);run.gearInventory??=[];run.gearInventory.push({uid:`${c.uid}:unsocket:${slot}:${run.gearSerial=(run.gearSerial||0)+1}`,id});return true;}
export function buyGear(run,id,seed=0,price=GEAR_BY_ID[id]?.cost){const g=GEAR_BY_ID[id];if(!g||!Number.isFinite(price)||price<0||run.gold<price)return false;run.gold-=price;run.gearInventory??=[];run.gearInventory.push({uid:`gear:${seed}:${run.gearSerial=(run.gearSerial||0)+1}`,id});return true;}
