// Leg V2: silhouette, foot construction and gait limits belong to anatomy,
// rather than to whichever proxy skeleton or palette happened to be reused.
export const LEG_ANATOMY = Object.freeze({
 knight:{radius:2.4,calf:.87,foot:'boot'},orc:{radius:3.15,calf:.88,foot:'boot'},elf:{radius:1.95,calf:.77,foot:'boot'},caster:{radius:2.05,calf:.8,foot:'boot'},fox:{radius:2.1,calf:.8,foot:'boot'},
 dwarf:{radius:2.85,calf:.9,foot:'boot'},goblin:{radius:2.25,calf:.83,foot:'boot'},troll:{radius:3.35,calf:.9,foot:'boot'},minotaur:{radius:3.2,calf:.88,foot:'boot'},skeleton:{radius:1.6,calf:.73,foot:'boot'},rogue:{radius:2,calf:.8,foot:'boot'},frostelf:{radius:2.05,calf:.8,foot:'boot'},
 wolf:{radius:6,calf:.72,foot:'paw',height:9,stride:54},feralfox:{radius:5.1,calf:.7,foot:'paw',height:8,stride:50},cat:{radius:5.4,calf:.72,foot:'paw',height:8,stride:48},
 lion:{radius:7.2,calf:.8,foot:'paw',height:10,stride:52},bear:{radius:9.2,calf:.88,foot:'paw',height:10,stride:43},rhino:{radius:9.6,calf:.9,foot:'hoof',height:8,stride:40},
 stag:{radius:4.8,calf:.64,foot:'hoof',height:10,stride:54},rabbit:{radius:5.8,calf:.8,foot:'paw',height:7,stride:43},rodent:{radius:4.8,calf:.77,foot:'paw',height:6,stride:39},
 turtle:{radius:7.1,calf:.9,foot:'paw',height:6,stride:30},drake:{radius:7.4,calf:.83,foot:'paw',height:10,stride:48},
 mech:{radius:7.2,calf:.86,foot:'plate-foot',height:9,stride:32,plated:true},beetle:{radius:6.4,calf:.72,foot:'plate-foot',height:10,stride:32,plated:true},
 crab:{radius:5.8,calf:.73,foot:'plate-foot',height:10,stride:30,plated:true},spider:{radius:4.1,calf:.62,foot:'tip',height:14,stride:33},
 mantis:{radius:3.8,calf:.65,foot:'tip',height:12,stride:31},centipede:{radius:4.2,calf:.72,foot:'tip',height:10,stride:25},
});
export function legAnatomy(design){return LEG_ANATOMY[design]||LEG_ANATOMY.knight;}
export function anatomyStride(stride,id,design=id){
 const limit=legAnatomy(design).stride||({orc:46,caster:48,elf:52,fox:52,wolf:54,mech:32,spider:33,crab:30,centipede:25})[id]||52;
 return Math.min(stride,limit);
}
const tone=color=>{
 const [r,g,b]=color.slice(1).match(/../g).map(v=>parseInt(v,16)/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;
 return {h:d?(hi===r?(g-b)/d+(g<b?6:0):hi===g?(b-r)/d+2:(r-g)/d+4)*60:0,s:d?d/(1-Math.abs(2*l-1)):0,l};
};
const hueDistance=(a,b)=>Math.abs(((a-b+540)%360)-180);
// Select one coherent material, anchored at its attachment. Dark outlines,
// nearby crystals and isolated highlight pixels cannot dye the entire leg.
// Return original palette indices so every collection recolor stays exact.
export function sampleLegMaterial(asset,samples,reference=samples){
 const groups=new Map(),tones=new Map();
 const get=p=>{if(!tones.has(p.index))tones.set(p.index,tone(asset.colors?.[p.index]||p.color));return tones.get(p.index);};
 for(const p of reference){const t=get(p);if(t.l<.16)continue;const key=t.s<.23?'neutral':Math.floor((t.h+15)%360/30);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 const group=[...groups.values()].sort((a,b)=>b.length-a.length)[0]||samples;
 if(!group.length)return [1,1,1,1];
 const counts=new Map();for(const p of group)counts.set(p.index,(counts.get(p.index)||0)+1);
 const middle=group.reduce((best,p)=>counts.get(p.index)>counts.get(best.index)?p:best,group[0]),base=get(middle);
 const darkest=Math.max(.13,Math.min(...group.map(p=>get(p).l))-.08);
 let candidates=[...samples,...group].filter(p=>{const t=get(p);return t.l>=darkest&&(base.s<.23?t.s<.3:t.s>=.18&&hueDistance(t.h,base.h)<32);});
 if(!candidates.length)candidates=group;
 const shades=[...new Map(candidates.map(p=>[p.index,p])).values()].sort((a,b)=>get(a).l-get(b).l);
 return [.08,.38,.7,.92].map(t=>shades[Math.round((shades.length-1)*t)].index);
}
