import {grandDesign,nativeRigFor,capeSpecification} from './grand-designs.js';
import {previewCape} from './native-cloth.js';
import {PIXEL_PALETTES} from './prototype-pixel-art.js';
import {characterRig} from './prototype-rig.js';
const rgb=(a,b,c)=>[a,b,c];
// Stable anatomy and equipment profiles used by both art and weapon contacts.
export const NATIVE_DESIGNS={
 feralfox:{height:.9,width:.95,stride:90},cat:{height:.86,width:.94,stride:95},rabbit:{height:.78,width:.75,stride:85},rodent:{height:.7,width:.65,stride:75},
 rhino:{height:1.08,width:1.22,stride:60},turtle:{height:.72,width:1.08,stride:45},owl:{height:.9,width:1.08,stride:75,gear:'feathers'},
 fish:{height:.88,width:1.05,stride:74},mushroom:{height:.85,width:1,stride:40},clam:{height:.8,width:1.2,stride:35},squid:{height:1,width:.9,stride:70},mantis:{height:1,width:1,stride:80},
 crab:{height:.9,width:1.1,stride:55,gear:'claws',skin:rgb('#496b63','#7daca0','#c6d9be'),cloth:rgb('#385c69','#5b95aa','#a9d1db'),hair:rgb('#364c58','#638e99','#abd5ce')},
 beetle:{height:1,width:1.05,stride:55,gear:'horn',skin:rgb('#332d42','#65516e','#a69baf'),cloth:rgb('#3d3751','#766386','#b59cbf'),hair:rgb('#344a55','#719eae','#a7dedb')},
 lion:{height:1.04,width:1.05,stride:79,skin:rgb('#77432c','#ba7c38','#ebbd66'),cloth:rgb('#713436','#b35439','#f0ae55'),hair:rgb('#744226','#af7134','#e4b258')},
 bear:{height:1.07,width:1.15,stride:84,skin:rgb('#647985','#a8c1c5','#dce9df'),cloth:rgb('#2f5570','#689aaf','#b4d3d3'),hair:rgb('#536979','#96b5be','#daebdf')},
 stag:{height:1.05,width:.92,stride:84,skin:rgb('#62563a','#a59152','#dac990'),cloth:rgb('#355141','#6b9d61','#bad092'),hair:rgb('#554b31','#a99a62','#decca1')},
 drake:{height:1.04,width:1.1,stride:85,skin:rgb('#3f4b73','#778cc2','#c0c9db'),cloth:rgb('#3c365b','#8073b3','#c8b8dc'),hair:rgb('#38476c','#7babc2','#c8e7e2')},
 centipede:{height:1,width:1.1,stride:58,skin:rgb('#3b454e','#6f8f96','#b7d0c4'),cloth:rgb('#4d4540','#9b8054','#d2ba76'),hair:rgb('#43516d','#87acba','#d0e5d9')},
 moth:{height:.87,width:1.04,stride:76,skin:rgb('#776582','#bca9ba','#edddcf'),cloth:rgb('#403553','#8a729d','#d3afd1'),hair:rgb('#58475f','#a993b5','#e1cdd9')},
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
 const design=formProfile(spec,c),grand=grandDesign(spec,c),rig=structuredClone(source),palette=PIXEL_PALETTES[spec.nativeRig]||PIXEL_PALETTES.mech;
 const point=p=>p?{...p,x:p.x*design.width,y:p.y*design.width,z:Math.max(0,3+(p.z-3)*design.height*height)}:p;
 for(const key of ['pelvis','body','head','tail'])rig[key]=point(rig[key]);
 rig.legs=rig.legs.map(l=>({...l,root:point(l.root),joint:point(l.joint),hock:point(l.hock),end:point(l.end)}));
 rig.arms=rig.arms.map(a=>({...a,root:point(a.root),joint:point(a.joint),end:point(a.end)}));
 if(rig.weapon){
  rig.weapon={...rig.weapon,grip:point(rig.weapon.grip),tip:point(rig.weapon.tip),design:design.gear};
  const length=({knife:25,rapier:40,hammer:38,club:43,'great-axe':56,sunblade:55,moonblade:50,'royal-hammer':48,'branch-club':50,gauntlet:18,cannon:48})[grand.gear||design.gear];
  if(length){const g=rig.weapon.grip,t=rig.weapon.tip,scale=length/(Math.hypot(t.x-g.x,t.y-g.y,t.z-g.z)||1);rig.weapon.tip={x:g.x+(t.x-g.x)*scale,y:g.y+(t.y-g.y)*scale,z:g.z+(t.z-g.z)*scale};rig.weapon.length=length;const safeZ=120-.58*Math.hypot(rig.weapon.tip.x,rig.weapon.tip.y);if(rig.weapon.tip.z>safeZ){const ratio=(safeZ-g.z)/(rig.weapon.tip.z-g.z);rig.weapon.tip={x:g.x+(rig.weapon.tip.x-g.x)*ratio,y:g.y+(rig.weapon.tip.y-g.y)*ratio,z:safeZ};rig.weapon.length*=ratio;}}
  const grip=rig.weapon.grip,tip=rig.weapon.tip,ceiling=112-.58*Math.hypot(tip.x,tip.y);
  if(tip.z>ceiling&&tip.z>grip.z){const ratio=Math.max(.1,(ceiling-grip.z)/(tip.z-grip.z));rig.weapon.tip={x:grip.x+(tip.x-grip.x)*ratio,y:grip.y+(tip.y-grip.y)*ratio,z:grip.z+(tip.z-grip.z)*ratio};}
 }
 if(rig.shield)rig.shield={...rig.shield,grip:point(rig.shield.grip)};
 if(["knife","rapier"].includes(design.gear)&&(!design.stage||c.evolutionPath==="wild"))rig.shield=null;
 if(rig.wings)rig.wings=rig.wings.map(w=>w.map(point));
 if(rig.segments)rig.segments=rig.segments.map(point);
 rig.palette={...palette,...spec.pixelPalette,...Object.fromEntries(['skin','cloth','hair'].filter(k=>design[k]).map(k=>[k,design[k]]))};
 if(spec.pixelConverted)rig.palette={...rig.palette,...spec.pixelPalette};
 if(design.stage){rig.palette.metal=c.evolutionPath==='wild'?['#453c3c','#9a7d58','#dab775','#fff0b1']:['#314b58','#699299','#bad5d0','#f0f2d5'];rig.palette.cloth=c.evolutionPath==='wild'?['#562e3f','#a75550','#eab66d']:['#293e68','#6178a1','#b1d5de'];}
 rig.design=spec.nativeDesign;rig.artSpecies=spec.nativeDesign||spec.nativeRig;rig.form=design.stage;rig.artStage=design.stage?(spec.evolutionLimit===1?2:design.stage):0;rig.formPath=c.evolutionPath;rig.gear=grand.gear||design.gear;rig.flyerDesign=spec.nativeDesign;
 if(design.stage){const colors={ember:['#582b33','#aa4d3e','#ebac62'],grove:['#2b4939','#5e8a52','#bfd087'],tide:['#283e62','#5b8caa','#bbdce0'],storm:['#45365f','#8a70b3','#ddc4e9'],void:['#322841','#725189','#cda4ce']};rig.palette.cloth=colors[spec.element]||rig.palette.cloth;}
 rig.id=nativeRigFor(spec,c);rig.grand=c.evolution?grand:null;if(grand.gear==='gauntlet')rig.shield=null;rig.pixelMark=spec.pixelMark;rig.equipment=c.equipment||[];
 rig.artVariant=spec.pixelConverted?spec.id:null;rig.artVariantPalette=spec.pixelConverted?spec.pixelPalette:null;
 const bind=characterRig(rig.id,'idle',.25);rig.artBind={head:point(bind.head),body:point(bind.body),pelvis:point(bind.pelvis),legs:bind.legs.map(l=>({...l,root:point(l.root),joint:point(l.joint),hock:point(l.hock),end:point(l.end)})),arms:bind.arms.map(a=>({...a,root:point(a.root),joint:point(a.joint),end:point(a.end)})),weapon:bind.weapon?{grip:point(bind.weapon.grip),tip:point(bind.weapon.tip)}:null};rig.artScale={width:design.width,height:design.height*height};
 if(rig.grand&&rig.wings)rig.wings=rig.wings.map(wing=>wing.map(p=>({...p,y:p.y*1.12,x:p.x*.95})));
 if(rig.equipment.includes('sunsteel-edge'))rig.palette.metal=['#6a5140','#b69053','#eacb7e','#fff0bc'];
 if(grand.rig==='orc'&&['runetitan','scarabking'].includes(grand.motif))rig.palette.skin=rig.palette.metal.slice(0,3);
 const cloth=capeSpecification(spec,c);if(cloth){rig.capeMesh=(source.capeMesh||previewCape(source,cloth)).map(col=>col.map(point));rig.artCapeBind=previewCape(bind,cloth).map(col=>col.map(point));}else rig.capeMesh=null;
 if(c.equipment?.includes('mooncloth-mantle'))rig.palette.cloth=['#38284d','#7d5596','#c7a5d3'];
 if(spec.nativeDesign==='drake'&&!c.evolution)rig.grand={motif:'drake',wings:true};
 return rig;
}
