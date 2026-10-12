import {PIXEL_PALETTES} from './prototype-pixel-art.js';
const rgb=(a,b,c)=>[a,b,c];
// Stable anatomy and equipment profiles used by both art and weapon contacts.
export const NATIVE_DESIGNS={
 dwarf:{height:.8,width:1.08,stride:54,gear:'hammer',skin:rgb('#755344','#c58a5d','#e6b879'),cloth:rgb('#2e4943','#54856d','#a9ba78'),hair:rgb('#522f22','#96502d','#d88b49')},
 goblin:{height:.78,width:.82,stride:54,gear:'knife',skin:rgb('#476340','#7da256','#b5ce76'),cloth:rgb('#433646','#75566e','#c49a7d'),hair:rgb('#272731','#484047','#797463')},
 skeleton:{height:.92,width:.9,stride:70,gear:'bonebow',skin:rgb('#716d66','#b9b7a1','#e7dfb9'),cloth:rgb('#343646','#646072','#a193ae'),hair:rgb('#665f58','#aaa18c','#e1d3ac')},
 troll:{height:1.04,width:1.16,stride:86,gear:'club',skin:rgb('#465b50','#708e73','#a5bc8c'),cloth:rgb('#3a3b2e','#656d3e','#a1a15e'),hair:rgb('#3c4f2d','#658140','#abbd66')},
 minotaur:{height:1.04,width:1.08,stride:86,gear:'axe',skin:rgb('#694235','#a96d45','#d39b61'),cloth:rgb('#492b32','#9b4640','#d27f59'),hair:rgb('#39282b','#674137','#a46643')},
 serpent:{height:1,width:1,stride:76,gear:'fangs',skin:rgb('#244f53','#498981','#a2c7a0'),cloth:rgb('#33476b','#6989a4','#abd1d0'),hair:rgb('#274d6f','#5294b0','#b0dfd5')},
 harpy:{height:1,width:1,stride:90,gear:'feathers',skin:rgb('#68554b','#b89a75','#e2c49b'),cloth:rgb('#304c61','#5f92aa','#b3d9ce'),hair:rgb('#52527c','#9497bd','#d1d6dc')},
 faerie:{height:.78,width:.75,stride:62,gear:'orb',skin:rgb('#885965','#d69da0','#f0ccb4'),cloth:rgb('#325340','#609a6a','#b4d4a0'),hair:rgb('#9b722e','#d4b25e','#f0de9a')},
 bat:{height:.9,width:1,stride:95,gear:'sonar',skin:rgb('#453b5c','#817092','#baa9bd'),cloth:rgb('#392d51','#6c548c','#b594ca'),hair:rgb('#343145','#666079','#a3a0b7')},
 rogue:{height:.91,width:.86,stride:74,gear:'rapier',skin:rgb('#805d51','#c59679','#efd0a7'),cloth:rgb('#28394a','#4b657b','#91a9b1'),hair:rgb('#292c35','#464654','#848096')},
 frostelf:{height:.98,width:.93,stride:68,gear:'ice-staff',skin:rgb('#8b7884','#c6b3b2','#efdbca'),cloth:rgb('#314960','#6b9aad','#c0dfe1'),hair:rgb('#68798e','#a8bcca','#e2edf0')},
 phoenix:{height:1,width:1,stride:94,gear:'feathers',skin:rgb('#8b362e','#d86a32','#f6be55'),cloth:rgb('#8c372d','#da7140','#ffd47a'),hair:rgb('#a93e2d','#f18b3b','#ffe2a0')},
};
export function formProfile(spec,c={}){
 const base=NATIVE_DESIGNS[spec.nativeDesign]||{},stage=Math.min(2,c.evolution||0),wild=c.evolutionPath==='wild';
 return {...base,stage,path:c.evolutionPath,width:(base.width||1)*(stage?(wild?1.04:1.08):1),height:(base.height||1)*(stage?1+stage*.025:1),stride:(base.stride||0)*(stage?(wild?1.1:.94):1)};
}
export function nativeFormRig(spec,c,source,height=1){
 const design=formProfile(spec,c),rig=structuredClone(source),palette=PIXEL_PALETTES[spec.nativeRig]||PIXEL_PALETTES.mech;
 const point=p=>p?{...p,x:p.x*design.width,y:p.y*design.width,z:Math.max(0,3+(p.z-3)*design.height*height)}:p;
 for(const key of ['pelvis','body','head','tail'])rig[key]=point(rig[key]);
 rig.legs=rig.legs.map(l=>({...l,root:point(l.root),joint:point(l.joint),hock:point(l.hock),end:point(l.end)}));
 rig.arms=rig.arms.map(a=>({...a,root:point(a.root),joint:point(a.joint),end:point(a.end)}));
 if(rig.weapon){
  rig.weapon={...rig.weapon,grip:point(rig.weapon.grip),tip:point(rig.weapon.tip),design:design.gear};
  const length=({knife:25,rapier:40,hammer:38,club:43})[design.gear];
  if(length){const g=rig.weapon.grip,t=rig.weapon.tip,scale=length/(Math.hypot(t.x-g.x,t.y-g.y,t.z-g.z)||1);rig.weapon.tip={x:g.x+(t.x-g.x)*scale,y:g.y+(t.y-g.y)*scale,z:g.z+(t.z-g.z)*scale};rig.weapon.length=length;}
 }
 if(rig.shield)rig.shield={...rig.shield,grip:point(rig.shield.grip)};
 if(["knife","rapier"].includes(design.gear)&&(!design.stage||c.evolutionPath==="wild"))rig.shield=null;
 if(rig.wings)rig.wings=rig.wings.map(w=>w.map(point));
 if(rig.segments)rig.segments=rig.segments.map(point);
 rig.palette={...palette,...Object.fromEntries(['skin','cloth','hair'].filter(k=>design[k]).map(k=>[k,design[k]]))};
 if(design.stage)rig.palette.cloth=c.evolutionPath==='wild'?['#653945','#a96550','#e8b46e']:['#294e57','#5a9298','#b5d6c0'];
 rig.design=spec.nativeDesign;rig.form=design.stage;rig.formPath=c.evolutionPath;rig.gear=design.gear;rig.flyerDesign=spec.nativeDesign;
 return rig;
}
