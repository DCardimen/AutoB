export const STATUS_AILMENTS={
 burn:{name:'Burn',icon:'♨',color:'#ff9855',desc:'Deals 7 damage per second (40% more in cinder weather). It can knock out a planned capture target.'},
 poison:{name:'Poison',icon:'☣',color:'#a9d765',desc:'Deals 5 damage per second. Damage over time can kill a capture target before the throw.'},
 bleed:{name:'Bleed',icon:'⌁',color:'#f08083',desc:'Deals 6 damage per second; moving raises it to 9.6. Holding ground reduces the damage.'},
 root:{name:'Root',icon:'⌗',color:'#b5c98a',desc:'Stops movement, dashes and dodge rolls. Charged attacks resist root while committed.'},
 slow:{name:'Slow',icon:'❄',color:'#98d9ee',desc:'Halves movement speed. Dodges are still possible unless also rooted.'},
 stagger:{name:'Stagger',icon:'✷',color:'#ffd087',desc:'Stops actions and interrupts ordinary attack windups. Charged attacks remain committed.'},
 exposed:{name:'Exposed',icon:'◎',color:'#edbbec',desc:'Incoming connected hits deal 18% more damage.'},
 weakened:{name:'Weakened',icon:'▽',color:'#b5a4d1',desc:'Outgoing hits deal 25% less damage.'},
 wither:{name:'Wither',icon:'✝',color:'#bfa287',desc:'Healing received is reduced by 55%.'},
 taunt:{name:'Taunt',icon:'⚑',color:'#f2c677',desc:'Enemies prioritize the taunting creature, creating space for its allies.'},
 haste:{name:'Haste',icon:'»',color:'#ffe392',desc:'Basic attack timers recover faster. Temporary gear and spell buffs expire during combat.'},
 evade:{name:'Evasion',icon:'➶',color:'#b5e7d8',desc:'Improves reactive dodging. Dodges still require stamina and room to move.'},
 fortify:{name:'Fortify',icon:'⬡',color:'#b6cbde',desc:'Reduces incoming hit damage by 12%, in addition to armor.'},
 ward:{name:'Status ward',icon:'✧',color:'#dde8ff',desc:'Cleanses and prevents damaging or movement-blocking ailments while active.'},
};
export function activeAilments(c){return Object.entries(STATUS_AILMENTS).filter(([id])=>(id==='ward'?c.statusWard:c[id])>0).map(([id,status])=>({id,...status,remaining:id==='ward'?c.statusWard:c[id]}));}
export function annotateAilments(text=''){return String(text).replace(/\b(burn(?:ing)?|poison(?:ed)?|bleed(?:ing)?|root(?:ed)?|slow(?:ed)?|stagger|exposed|weakened|wither|taunt|haste|evasion|fortify)\b/gi,word=>{const key=word.toLowerCase().replace(/(?:ing|ed)$/,''),id=key==='evasion'?'evade':key==='expos'?'exposed':key==='weaken'?'weakened':key,ailment=STATUS_AILMENTS[id];return ailment?`<span class="ailment-term" tabindex="0" title="${ailment.desc}" data-ailment="${id}">${word}</span>`:word;});}
