const templates={
 'Guardian-wild':[{kind:'wave',power:1.6,radius:145,root:.6,knockback:25,cd:18},{kind:'awakening',power:1.7,radius:180,healPercent:.1,shield:35,cd:25}],
 'Guardian-warden':[{kind:'shield',shield:110,radius:260,taunt:3,cd:19},{kind:'awakening',power:1,radius:170,healPercent:.18,shield:65,cd:26}],
 'Striker-wild':[{kind:'charge',power:2.9,shieldPierce:.35,root:.4,cd:18},{kind:'gravity',power:2.1,radius:150,root:.8,cd:24}],
 'Striker-warden':[{kind:'buff',haste:4.5,evade:4.5,cd:18},{kind:'wave',power:1.6,radius:170,shield:45,slow:2,cd:24}],
 'Ranger-wild':[{kind:'salvo',power:1.25,targets:4,cd:18},{kind:'blast',power:2.4,radius:155,delay:1.1,root:1,cd:25}],
 'Ranger-warden':[{kind:'blast',power:1.35,radius:135,delay:.8,root:1.6,cd:18},{kind:'shield',shield:95,radius:250,slow:2,cd:24}],
 'Support-wild':[{kind:'drain',power:1.7,targets:3,lifesteal:.25,cd:19},{kind:'spores',heal:70,power:1.5,poison:4,cd:24}],
 'Support-warden':[{kind:'heal-all',heal:48,shield:30,cleanse:true,cd:19},{kind:'awakening',power:1,radius:180,healPercent:.2,shield:60,cd:26}],
};
const names={'Guardian-wild':['Ruinwake','Titan Requiem'],'Guardian-warden':['Royal Bulwark','Citadel Renewal'],'Striker-wild':['Sovereign Rush','Worldrend'],'Striker-warden':['Phantom Dance','Sentinel Reprisal'],'Ranger-wild':['Sovereign Barrage','Celestial Impact'],'Ranger-warden':['Binding Constellation','Skyward Aegis'],'Support-wild':['Soul Harvest','Dreamweave'],'Support-warden':['Royal Sanctuary','Grand Benediction']};
const unique={
 'aurel-wild-1':{kind:'wave',power:1.8,burn:3,radius:165,cd:18},
 'aurel-warden-1':{kind:'shield',all:true,shield:105,radius:300,taunt:3,cd:20},
 'nyra-wild-1':{kind:'chain',power:1.8,targets:3,slow:1,cd:18},
 'syl-wild-1':{kind:'salvo',power:1.2,targets:4,poison:3,cd:18},
 'cogwalker-wild-1':{kind:'beam',power:2.5,pierce:true,root:.6,cd:19},
 'cogwalker-warden-1':{kind:'shield',all:true,shield:120,radius:300,cd:20},
 'moonjelly-wild-1':{kind:'gravity',power:1.7,radius:190,shield:40,slow:2,cd:19},
 'moonjelly-warden-1':{kind:'heal-all',heal:55,shield:45,cleanse:true,haste:2,cd:20},
 'nix-wild-1':{kind:'salvo',power:1.2,targets:3,poison:5,cd:17},
 'grum-wild-1':{kind:'wave',power:1.8,radius:175,root:1.2,cd:20},
 'brom-wild-1':{kind:'wave',power:1.7,radius:145,shieldPierce:.5,knockback:25,cd:18},
 'stormdrake-wild-1':{kind:'beam',power:2.4,pierce:true,slow:2,cd:20},
 'crownstag-warden-1':{kind:'heal-all',heal:52,shield:35,cleanse:true,cd:20},
};
export function buildEvolutionSkills(species){return species.flatMap(s=>Array.from({length:2},(_,i)=>i+1).flatMap(stage=>['wild','warden'].map(path=>{
 const key=s.role+'-'+path,def={...templates[key][stage-1],...unique[s.id+'-'+path+'-'+stage]},name=s.name+' '+names[key][stage-1];
 if(s.element==='ember'&&def.power&&!def.burn)def.burn=2+stage;
 if(s.element==='tide'&&def.power&&!def.slow)def.slow=1+stage*.25;
 return {id:`evolve-${s.id}-${path}-${stage}`,species:s.id,path,stage,evolutionSkill:true,compatibilityOnly:stage>(s.evolutionLimit??2),icon:'✹',name,...def,desc:`Unlocked by ${stage===1?'evolution':'ascension'}. ${name}: ${def.kind} with ${def.power?Math.round(def.power*100)+'% attack':def.heal?def.heal+' team healing':def.shield?def.shield+' shield':'haste and evasion'}${def.targets?' across '+def.targets+' targets':''}${def.root?' and '+def.root+'s root':''}.`};
})));}
export function evolutionSkillIds(c){return c?.evolution?Array.from({length:Math.min(2,c.evolution)},(_,i)=>`evolve-${c.id}-${c.evolutionPath||'wild'}-${i+1}`):[];}
