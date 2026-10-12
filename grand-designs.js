const styles={
 aurel:{motif:'angel',cape:true,gear:'sunblade',halo:true,wings:true,crest:'crown'},
 brakk:{motif:'demon',cape:true,gear:'great-axe',crest:'horns'},
 syl:{motif:'dryad',cape:true,gear:'royal-bow',wings:true,crest:'antlers'},
 nyra:{motif:'oracle',cape:true,gear:'royal-staff',halo:true,crest:'hat'},
 emberhound:{motif:'cerberus',extraHeads:2,crest:'flame'},rowan:{motif:'kitsune',cape:true,tailFan:5,gear:'royal-bow',crest:'crown'},
 cogwalker:{rig:'orc',motif:'runetitan',cape:true,gear:'cannon',crest:'reactor'},
 runespider:{motif:'spiderqueen',crest:'crown',wings:true},moonjelly:{rig:'flyer',motif:'leviathan',wings:true,halo:true,crest:'pearl'},
 brom:{motif:'forgeking',cape:true,gear:'royal-hammer',crest:'crown'},grit:{rig:'orc',motif:'goblinking',cape:true,gear:'great-axe',crest:'crown'},
 morrow:{rig:'caster',motif:'lich',cape:true,gear:'royal-staff',halo:true,crest:'crown'},grum:{motif:'ent',cape:true,gear:'branch-club',crest:'antlers'},
 tarka:{motif:'bullking',cape:true,gear:'great-axe',crest:'horns'},nix:{motif:'hydra',extraHeads:2,crest:'fins'},
 zephyr:{motif:'stormphoenix',wings:true,crest:'flame'},luma:{motif:'faequeen',wings:true,cape:true,halo:true,crest:'crown'},
 vesper:{rig:'wolf',motif:'nightdragon',wings:true,crest:'horns'},sable:{motif:'revenant',cape:true,wings:true,gear:'moonblade',halo:true,crest:'hood'},
 eira:{motif:'frostregent',cape:true,wings:true,gear:'royal-staff',crest:'crown'},
 mireclaw:{rig:'serpent',motif:'hydra',extraHeads:2,crest:'fins'},onyxscarab:{rig:'orc',motif:'scarabking',cape:true,gear:'royal-hammer',crest:'horns'},
 sunlion:{motif:'solarlion',crest:'flame',halo:true},frostursa:{rig:'knight',motif:'bearking',gear:'gauntlet',cape:true,crest:'crown'},
 crownstag:{rig:'orc',motif:'worldtree',gear:'branch-club',cape:true,crest:'antlers'},stormdrake:{rig:'flyer',motif:'stormwyrm',wings:true,crest:'horns'},nyxwing:{motif:'lunarmoth',wings:true,halo:true,crest:'pearl'},
};
export function grandDesign(spec,c={}){
 if(!c.evolution)return {rig:spec.nativeRig,motif:null,cape:['knight','elf','caster','fox'].includes(spec.nativeRig),gear:null};
 const generic=spec.nativeRig==='wolf'?{motif:'cerberus',extraHeads:2,crest:'horns'}:spec.nativeRig==='jelly'?{rig:'flyer',motif:'leviathan',wings:true,halo:true}:spec.nativeRig==='mech'?{rig:'orc',motif:'runetitan',gear:'cannon',cape:true}:spec.nativeRig==='serpent'?{motif:'hydra',extraHeads:2,crest:'fins'}:spec.nativeRig==='flyer'?{motif:'stormphoenix',wings:true,crest:'flame'}:{motif:'spiderqueen',wings:true,crest:'crown'};
 const d={rig:spec.nativeRig,...(styles[spec.id]||generic),stage:c.evolution,path:c.evolutionPath};
 if(c.evolution===2){const rigs={moonjelly:'serpent',brom:'mech',stormdrake:'serpent',frostursa:'orc',runespider:'centipede',luma:'flyer'};d.rig=rigs[spec.id]||d.rig;d.ascendant=true;d.wings=d.wings||['oracle','lich','forgeking','bearking','worldtree'].includes(d.motif);if(d.extraHeads)d.extraHeads=4;if(['leviathan','stormwyrm'].includes(d.motif))d.extraHeads=2;}
 return d;
}
export function nativeRigFor(spec,c={}){return grandDesign(spec,c).rig;}
export function capeSpecification(spec,c={}){const d=grandDesign(spec,c);if(!d.cape&&!c.equipment?.includes('mooncloth-mantle'))return null;return {columns:5,rows:7,width:c.evolution?38:25,length:(c.evolution?55:37)+(c.equipment?.includes('mooncloth-mantle')?7:0),split:c.evolutionPath==='wild',color:c.equipment?.includes('mooncloth-mantle')?'violet':null};}
