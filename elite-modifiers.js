// Encounter-seeded mutations belong to an individual, including after capture.
const hash=value=>{let n=2166136261;for(const ch of String(value)){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
const targets=[
 {id:'random',name:'a random opponent'},
 {id:'lowest-level',name:'the lowest-level opponent'},
 {id:'lowest-health',name:'the opponent with the lowest base health'},
 {id:'highest-attack',name:'the opponent with the highest base attack'},
 {id:'fastest',name:'the fastest opponent'},
];
const powers=[
 {id:'quickfire',name:'Quickfire',stat:'actionSpeed',amount:.10,text:'+10% action speed'},
 {id:'bloodtempo',name:'Bloodtempo',stat:'attackSpeed',amount:.20,text:'+20% basic attack speed'},
 {id:'warbrand',name:'Warbrand',stat:'atk',amount:.18,text:'+18% attack'},
 {id:'giantheart',name:'Giantheart',stat:'hp',amount:.25,text:'+25% maximum health'},
 {id:'redwind',name:'Redwind',stat:'speed',amount:.22,text:'+22% movement speed'},
 {id:'ironhide',name:'Ironhide',stat:'armor',amount:14,flat:true,text:'+14 armor'},
 {id:'everburn',name:'Everburn',stat:'staminaRecharge',amount:.30,text:'+30% stamina recharge'},
 {id:'ghoststep',name:'Ghoststep',stat:'dashCooldown',amount:-.25,text:'25% shorter dash cooldowns'},
 {id:'emberblood',name:'Emberblood',stat:'hpRegen',amount:2,flat:true,text:'+2 health regeneration per second'},
 {id:'spellflame',name:'Spellflame',stat:'cd',amount:-.18,text:'18% shorter skill cooldowns'},
];
const amounts={quickfire:[.10,.13,.16,.12,.18],bloodtempo:[.15,.20,.25,.18,.22],warbrand:[.18,.22,.26,.14,.20],giantheart:[.25,.30,.35,.20,.28],redwind:[.22,.26,.30,.24,.18],ironhide:[14,18,22,12,16],everburn:[.30,.35,.40,.25,.32],ghoststep:[-.25,-.30,-.35,-.22,-.28],emberblood:[2,2.5,3,1.5,2.2],spellflame:[-.18,-.22,-.25,-.15,-.20]};
const epithets=['Wanderer','Underdog','Survivor','Champion','Runner'];
export const ELITE_MODIFIERS=powers.flatMap(power=>targets.map((target,i)=>{
 const amount=amounts[power.id][i],text=power.text.replace(/[-+]?\d+(?:\.\d+)?%?/,power.flat?'+'+amount:(amount<0?'':'+')+Math.round(Math.abs(amount)*100)+'%');
 return Object.freeze({...power,amount,text,name:`${power.name} ${epithets[i]}`,id:`${power.id}-${target.id}`,target:target.id,targetName:target.name,description:`${text} to ${target.name}.`});
}));
export const ELITE_MODIFIER_BY_ID=Object.fromEntries(ELITE_MODIFIERS.map(m=>[m.id,m]));
export const eliteModifierForSeed=seed=>ELITE_MODIFIERS[hash(`elite:${seed}`)%ELITE_MODIFIERS.length];
export const eliteModifier=c=>ELITE_MODIFIER_BY_ID[c?.eliteModifier]||null;
export function assignEliteModifier(foes,seed,species){
 if(!foes.length)return null;
 // Reloading an old encounter adds its mutation once; a saved one never rerolls.
 const saved=foes.find(c=>eliteModifier(c));if(saved)return {modifier:eliteModifier(saved),creature:saved,index:foes.indexOf(saved)};
 const modifier=eliteModifierForSeed(seed),score=c=>modifier.target==='lowest-level'?-(c.level||1):modifier.target==='lowest-health'?-(species[c.id]?.hp||0):modifier.target==='highest-attack'?(species[c.id]?.atk||0):modifier.target==='fastest'?(species[c.id]?.speed||0):0;
 const best=Math.max(...foes.map(score)),candidates=foes.map((c,index)=>({c,index})).filter(({c})=>score(c)===best);
 const chosen=candidates[hash(`elite-target:${seed}`)%candidates.length];chosen.c.eliteModifier=modifier.id;
 return {modifier,creature:chosen.c,index:chosen.index};
}
export function applyEliteStats(st,c){
 const m=eliteModifier(c);if(!m)return st;
 st[m.stat]=m.flat?st[m.stat]+m.amount:st[m.stat]*(1+m.amount);
 if(m.stat==='cd')st.cdFactor*=1+m.amount;
 return st;
}
export function rememberEliteCapture(profile,result){
 const c=result?.creature,m=eliteModifier(c),source=result?.uid||c?.captureSourceUid;
 if(!result?.success||!m||!source)return null;
 profile.eliteCaptures??=[];
 let record=profile.eliteCaptures.find(r=>r.sourceUid===source);
 if(!record){record={sourceUid:source,id:c.id,eliteModifier:m.id,capturedLevel:c.level||1,nature:c.nature,genes:c.genes?{...c.genes}:undefined};profile.eliteCaptures.push(record);}
 return record;
}
export function inheritEliteStarter(c,profile,sourceUid){
 const record=profile.eliteCaptures?.find(r=>r.sourceUid===sourceUid&&r.id===c.id&&eliteModifier(r));
 if(!record)return false;
 c.eliteModifier=record.eliteModifier;c.eliteOriginUid=record.sourceUid;
 if(record.genes)c.genes={...record.genes};if(record.nature)c.nature=record.nature;
 return true;
}
export function idleRhythm(c){
 const key=c.uid||`${c.side||0}:${c.id}:${c.seat||0}`,n=hash(key);
 return {offset:(n%997)/997,rate:.28+(hash('cadence:'+key)%997)/997*.16};
}
