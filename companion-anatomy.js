import {ARM_WRISTS,ARM_SHOULDER_Y} from './companion-arm-bindings.js';
// Registration is in the original 64px directional cells (E, SE, S, SW, W,
// NW, N, NE). Each form owns its hands and body proportions. These values
// never depend on an animated shoulder, gait phase, or palette recoloring.
const form=(neck,pelvis,torso,upper,lower,hands)=>({neck,pelvis,torso,upper,lower,hands});
export const ARM_ANATOMY={
 knight:[
  form(30,40,6,2.8,2.3,[[27,38,41,36],[26,38,41,37],[24,38,42,38],[24,36,40,38],[25,36,37,38],[26,38,42,36],[23,38,42,38],[23,36,39,38]]),
  form(22,39,7,3.2,2.5,[[27,35,42,33],[25,35,43,34],[21,35,44,35],[22,33,42,35],[23,33,38,35],[26,35,43,33],[21,35,43,35],[21,33,38,35]]),
  form(20,39,9,4.2,2.8,[[25,35,44,33],[23,35,45,34],[20,35,46,35],[20,33,43,35],[21,33,39,35],[24,35,44,33],[20,35,44,35],[20,33,40,35]])],
 orc:[
  form(28,39,6,2.8,2.6,[[25,36,42,35],[24,36,43,35],[22,36,43,36],[22,35,42,36],[23,35,40,36],[24,36,43,35],[22,36,43,36],[21,35,40,36]]),
  form(21,39,9,4.4,3.6,[[23,34,44,32],[21,34,46,33],[17,34,48,34],[18,32,45,34],[20,32,40,34],[22,34,45,32],[17,34,47,34],[19,32,42,34]]),
  form(21,39,10,4.6,3.8,[[23,34,44,32],[21,34,46,33],[17,34,48,34],[18,32,45,34],[20,32,40,34],[22,34,45,32],[17,34,47,34],[19,32,42,34]])],
 dwarf:[
  form(23,35,5,2.8,2.4,[[27,32,39,28],[25,32,40,30],[21,30,42,30],[24,29,40,32],[26,29,37,33],[25,32,40,28],[24,30,42,30],[23,28,39,32]]),
  form(19,37,8,3.7,3.2,[[24,33,40,29],[22,34,43,32],[16,33,48,33],[19,30,46,34],[23,30,39,34],[23,34,42,30],[16,32,48,32],[21,30,45,34]]),
  form(19,38,8.5,4,3.4,[[27,34,41,30],[24,34,44,32],[18,34,47,34],[21,31,43,34],[24,31,37,34],[25,34,43,31],[20,32,45,32],[21,31,39,34]])],
 troll:[
  form(29,39,7,3,3,[[23,36,43,35],[22,36,44,35],[20,36,44,36],[20,35,42,36],[22,35,40,36],[23,36,43,35],[21,36,44,36],[21,35,40,36]]),
  form(20,38,10,5.2,4.6,[[23,34,46,31],[21,34,47,32],[15,34,49,34],[17,31,43,34],[19,31,40,34],[21,34,45,31],[17,34,47,34],[19,31,43,34]]),
  form(20,38,10,5.3,4.7,[[23,34,46,31],[21,34,47,32],[15,34,49,34],[17,31,43,34],[19,31,40,34],[21,34,45,31],[17,34,47,34],[19,31,43,34]])],
 elf:[
  form(28,39,5.5,2.2,1.9,[[27,35,42,34],[26,35,43,34],[23,35,43,35],[22,34,41,35],[23,34,38,35],[25,35,41,34],[23,35,42,35],[23,34,39,35]]),
  form(22,39,6,2.5,2,[[27,32,41,30],[25,32,42,31],[22,32,42,32],[22,30,40,32],[23,30,37,32],[25,32,42,30],[22,32,42,32],[22,30,39,32]]),
  form(22,39,6.5,2.8,2.2,[[26,33,42,31],[24,33,43,32],[21,33,43,33],[21,31,41,33],[22,31,38,33],[24,33,42,31],[21,33,43,33],[22,31,40,33]])],
 caster:[
  form(28,40,5.5,2.3,1.9,[[28,35,43,34],[27,35,44,34],[23,35,44,35],[21,34,40,35],[21,34,37,35],[24,35,42,34],[23,35,43,35],[22,34,40,35]]),
  form(23,40,6,2.8,2,[[27,31,42,29],[25,31,43,30],[22,31,43,31],[21,29,41,31],[22,29,38,31],[25,31,42,29],[22,31,42,31],[22,29,39,31]]),
  form(23,40,6.5,3,2.2,[[26,32,43,30],[24,32,44,31],[21,32,44,32],[20,30,42,32],[21,30,38,32],[24,32,43,30],[21,32,43,32],[21,30,40,32]])],
 fox:[
  form(28,39,5.5,2.3,2,[[27,34,43,33],[26,34,44,33],[23,34,43,34],[22,33,41,34],[23,33,39,34],[25,34,42,33],[22,34,43,34],[22,33,40,34]]),
  form(22,40,6,2.7,2.1,[[27,32,42,30],[25,32,43,31],[22,32,43,32],[21,30,41,32],[22,30,38,32],[25,32,42,30],[22,32,43,32],[22,30,39,32]]),
  form(22,40,6,2.7,2.1,[[27,32,42,30],[25,32,43,31],[22,32,43,32],[21,30,41,32],[22,30,38,32],[25,32,42,30],[22,32,43,32],[22,30,39,32]])],
 goblin:[
  form(27,38,5.5,2.3,2.1,[[25,34,42,33],[24,34,43,33],[22,34,43,34],[22,33,41,34],[23,33,39,34],[25,34,43,33],[22,34,43,34],[21,33,39,34]]),
  form(23,39,7,3.1,2.8,[[24,33,43,31],[22,33,44,32],[19,33,45,33],[19,31,42,33],[21,31,39,33],[23,33,44,31],[19,33,45,33],[20,31,41,33]]),
  form(23,39,7,3.1,2.8,[[24,33,43,31],[22,33,44,32],[19,33,45,33],[19,31,42,33],[21,31,39,33],[23,33,44,31],[19,33,45,33],[20,31,41,33]])],
 minotaur:[
  form(28,40,7,3.2,2.7,[[25,35,42,34],[23,35,43,34],[21,35,44,35],[21,34,41,35],[23,34,39,35],[24,35,43,34],[21,35,44,35],[21,34,40,35]]),
  form(21,39,10,4.6,3.7,[[22,34,45,31],[20,34,46,32],[16,34,48,34],[17,31,44,34],[19,31,41,34],[21,34,45,31],[16,34,47,34],[18,31,42,34]]),
  form(19,39,11,5,4.1,[[22,34,45,31],[20,34,46,32],[16,34,48,34],[17,31,44,34],[19,31,41,34],[21,34,45,31],[16,34,47,34],[18,31,42,34]])],
 skeleton:[
  form(27,39,5,1.8,1.5,[[28,34,44,32],[26,34,45,33],[23,34,44,34],[21,32,41,34],[21,32,38,34],[25,34,43,32],[23,34,43,34],[22,32,39,34]]),
  form(21,37,6,2.1,1.6,[[27,31,43,29],[25,31,44,30],[21,31,44,31],[20,29,41,31],[21,29,38,31],[24,31,43,29],[21,31,44,31],[21,29,40,31]]),
  form(20,37,6.5,2.3,1.7,[[27,31,43,29],[25,31,44,30],[21,31,44,31],[20,29,41,31],[21,29,38,31],[24,31,43,29],[21,31,44,31],[21,29,40,31]])],
 rogue:[
  form(28,39,5.5,2.5,2,[[27,34,42,33],[25,34,43,33],[23,34,43,34],[22,33,41,34],[23,33,38,34],[25,34,42,33],[23,34,43,34],[22,33,39,34]]),
  form(23,39,6.5,2.8,2.2,[[26,33,42,31],[24,33,43,32],[21,33,44,33],[20,31,41,33],[21,31,38,33],[24,33,43,31],[21,33,44,33],[21,31,40,33]]),
  form(23,39,6.5,2.8,2.2,[[26,33,42,31],[24,33,43,32],[21,33,44,33],[20,31,41,33],[21,31,38,33],[24,33,43,31],[21,33,44,33],[21,31,40,33]])],
 frostelf:[
  form(28,40,5.5,2.3,1.9,[[27,34,43,33],[25,34,44,33],[23,34,44,34],[21,33,41,34],[22,33,38,34],[25,34,43,33],[23,34,43,34],[21,33,39,34]]),
  form(23,40,6,2.7,2,[[27,30,42,29],[25,30,43,29],[22,30,43,30],[21,29,41,30],[22,29,38,30],[25,30,42,29],[22,30,43,30],[22,29,39,30]]),
  form(23,40,6.5,2.9,2.1,[[26,31,43,30],[24,31,44,30],[21,31,44,31],[20,30,42,31],[21,30,38,31],[24,31,43,30],[21,31,43,31],[21,30,40,31]])],
};
export function armRegistration(identity,stage,dir){
 const profile=ARM_ANATOMY[identity]?.[stage];if(!profile)return null;
 const h=ARM_WRISTS[identity][stage][dir],hands={[-1]:{x:h[0],y:h[1]},[1]:{x:h[2],y:h[3]}};
 // Root positions follow the registered shoulder line and trunk width for
 // this form. Fore/aft hand heights retain the source's directional depth.
 const roots={};for(const side of [-1,1])roots[side]={x:identity==='skeleton'?32+side*profile.torso:hands[side].x+(32-hands[side].x)*.25,y:Math.min(hands[side].y-2,ARM_SHOULDER_Y[identity][stage])};
 return {...profile,hands,roots};
}

// Head location, neck seam and visible locomotor anatomy are properties of
// the painted form, including families which share a physics proxy.
// Entries: [side-view head X offset, head center Y, half width, neck Y].
export const NATURAL_ANATOMY={
 wolf:{plan:'quadruped',heads:[[7,21,15,34],[11,18,11,29],[11,18,11,29]]},
 feralfox:{plan:'quadruped',heads:[[6,21,15,34],[12,17,10,29],[11,18,10,29]],legHeights:[7,14,14]},
 cat:{plan:'quadruped',heads:[[7,21,15,34],[11,18,11,30],[10,19,11,31]]},
 lion:{plan:'quadruped',heads:[[7,22,15,34],[9,20,13,34],[8,20,14,35]]},
 bear:{plan:'quadruped',heads:[[8,21,14,33],[10,20,12,33],[10,21,12,34]]},
 rhino:{plan:'quadruped',heads:[[9,24,14,35],[8,23,14,35],[9,25,14,37]]},
 stag:{plan:'quadruped',heads:[[8,23,13,34],[8,23,11,33],[8,23,11,34]]},
 rabbit:{plan:'quadruped',heads:[[6,22,14,34],[10,20,11,32],[10,20,11,32]]},
 rodent:{plan:'quadruped',heads:[[7,22,15,34],[11,20,11,32],[10,21,12,33]]},
 turtle:{plan:'quadruped',heads:[[11,23,12,34],[13,20,9,31],[13,23,9,33]]},
 drake:{plan:'biped',heads:[[8,21,14,33],[12,16,12,27],[12,17,12,28]],lockedTravelHead:true,exception:'Two painted hind legs; folded wings are not forelegs.'},
 crab:{plan:'crustacean',heads:[[0,26,16,35],[0,25,16,35],[0,25,16,35]],lockedHead:true},
 mech:{plan:'walker',heads:[[0,23,15,33],[0,22,15,32],[0,22,15,32]],lockedHead:true},
 beetle:{plan:'insect',heads:[[8,25,12,35],[8,26,12,36],[8,26,12,36]],lockedHead:true},
 spider:{plan:'arachnid',heads:[[9,29,13,40],[10,28,12,39],[10,28,12,39]]},
 centipede:{plan:'segmented',heads:[[12,28,11,38],[12,25,10,35],[12,25,10,35]]},
 serpent:{plan:'serpentine',heads:[[5,22,14,33],[6,17,12,29],[6,17,12,29]]},
 harpy:{plan:'winged-biped',heads:[[6,21,14,32],[5,17,12,28],[5,17,12,28]]},
 owl:{plan:'winged-biped',heads:[[5,22,15,34],[5,21,14,33],[4,20,14,32]]},
 phoenix:{plan:'winged-biped',heads:[[7,21,14,33],[9,17,11,28],[8,17,11,28]]},
 bat:{plan:'winged-biped',heads:[[6,23,14,35],[8,23,12,35],[6,23,13,35]]},
 moth:{plan:'winged',heads:[[9,28,12,39],[10,27,11,38],[8,27,11,38]]},
 fairy:{plan:'winged-biped',heads:[[5,21,14,32],[4,17,12,28],[4,17,12,28]]},
 fish:{plan:'finned',heads:[[9,27,13,39],[11,27,11,39],[10,28,11,40]]},
 jelly:{plan:'floating',heads:[[0,23,16,36],[0,18,14,29],[0,18,14,29]],lockedHead:true},
 squid:{plan:'tentacled',heads:[[0,22,14,34],[0,20,13,33],[0,20,13,33]]},
 mushroom:{plan:'rooted',heads:[[0,24,21,37],[0,22,21,35],[0,22,21,35]],lockedHead:true},
 clam:{plan:'shell',heads:[[0,25,21,38],[0,25,21,38],[0,25,21,38]],lockedHead:true},
 mantis:{plan:'raptorial',heads:[[6,20,12,31],[8,15,9,26],[6,19,10,30]]},
};
export function naturalHeadWeight(identity,stage,dir,x,y){
 const profile=NATURAL_ANATOMY[identity];if(!profile)return 0;
 const [offset,centerY,radius,neck]=profile.heads[stage],sign=dir<2||dir===7?1:dir===2||dir===6?0:-1,centerX=32+sign*offset*(dir===0||dir===4?1:.65);
 // A rigid head interior, with deformation confined to the neck connection.
 const horizontal=clamp((radius+3-Math.abs(x-centerX))/3,0,1),vertical=clamp((neck+3-y)/4,0,1);
 return horizontal*vertical;
}
// The source neck blends over 3 horizontal / 4 vertical pixels. Driving it
// with the full proxy-rig excursion folds that skin inside out. Bound the
// relative travel smoothly, in source-pixel units, while the body carries
// the action's larger lunge. The rigid head interior retains its shape.
export function naturalHeadDelta(identity,body,head,scale={width:1,height:1},action=false){
 const anatomy=NATURAL_ANATOMY[identity];
 if(anatomy?.lockedHead||anatomy?.lockedTravelHead&&!action)return {...body};
 const travel=1;
 const limit=(value,extent)=>extent*Math.tanh(value/extent);
 return {x:body.x+limit(head.x-body.x,travel*scale.width),y:body.y+limit(head.y-body.y,travel*scale.height)};
}
// A proxy neck can spin around its body as ragdoll particles settle. Use a
// coherent directional fall arc for the complete source skin instead. Shells
// settle, quadrupeds roll modestly, and upright/flying bodies tip onto a side.
export function companionFallAngle(identity,dir,progress){
 const plan=NATURAL_ANATOMY[identity]?.plan;
 const turns={quadruped:.18,crustacean:.12,insect:.12,arachnid:.12,segmented:.12,walker:.12,rooted:.08,shell:.08,floating:.2,tentacled:.2,serpentine:.38};
 const t=clamp(progress||0,0,1),arc=(turns[plan]??.42)*Math.PI,towards=Math.sign(-Math.cos(dir*Math.PI/4)-.27*Math.sin(dir*Math.PI/4));
 return towards*arc*t*t*(3-2*t);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

// Source mouth landmarks, measured independently in every painted form.
// Rear faces remain occluded: a contact may exist behind the head, but no
// extra mouth or teeth should be painted onto its back.
const mouths=(...forms)=>forms.map(form=>form.map(([x,y])=>({x,y})));
export const MOUTH_ANATOMY={
 wolf:mouths([[51,29],[44,30],[32,31],[21,30],[14,29],[22,29],[32,29],[41,29]],[[51,25],[44,25],[32,25],[21,25],[12,25],[23,20],[32,23],[40,20]],[[50,26],[44,26],[32,27],[21,26],[13,26],[23,22],[32,23],[40,22]]),
 feralfox:mouths([[47,34],[36,36],[32,35],[28,36],[16,34],[21,30],[32,32],[42,30]],[[51,20],[43,22],[32,25],[20,22],[12,20],[22,21],[32,22],[41,21]],[[51,29],[44,27],[32,29],[19,27],[12,29],[23,31],[32,29],[40,31]]),
 drake:mouths([[48,25],[43,27],[32,28],[21,27],[16,25],[22,25],[32,25],[41,25]],[[52,20],[48,22],[32,22],[16,22],[10,20],[20,18],[32,22],[43,18]],[[53,19],[49,20],[32,23],[15,20],[15,18],[20,18],[32,23],[43,18]]),
 rodent:mouths([[50,30],[45,33],[32,36],[19,33],[13,30],[22,29],[32,30],[41,29]],[[51,26],[47,26],[32,29],[17,26],[12,26],[23,25],[32,26],[40,25]],[[51,30],[48,29],[32,29],[16,29],[12,30],[22,31],[32,28],[41,31]]),
 turtle:mouths([[51,31],[47,31],[32,32],[17,31],[12,31],[18,26],[32,29],[45,26]],[[53,24],[49,21],[32,24],[14,21],[10,24],[23,14],[32,20],[40,14]],[[51,31],[48,29],[32,30],[16,29],[12,31],[21,20],[32,25],[42,20]]),
 serpent:mouths([[46,26],[43,29],[32,31],[23,29],[21,26],[24,26],[32,27],[39,26]],[[43,19],[43,22],[32,25],[22,22],[20,19],[26,19],[32,24],[37,19]],[[45,17],[43,21],[32,23],[22,21],[18,17],[25,18],[32,22],[38,18]]),
 spider:mouths([[44,34],[41,35],[32,35],[22,35],[19,34],[24,33],[32,34],[39,33]],[[46,32],[42,33],[32,33],[22,33],[17,32],[24,32],[32,33],[39,32]],[[46,34],[42,34],[32,34],[22,34],[17,34],[24,33],[32,34],[39,33]]),
 centipede:mouths([[51,33],[47,34],[32,35],[18,34],[13,33],[22,32],[32,34],[41,32]],[[52,32],[48,33],[32,32],[16,33],[12,32],[23,31],[32,32],[40,31]],[[53,30],[47,32],[32,30],[17,32],[11,30],[22,30],[32,30],[41,30]]),
 bat:mouths([[45,30],[42,34],[32,33],[22,34],[18,30],[24,30],[32,31],[39,30]],[[53,31],[46,31],[32,33],[18,31],[10,31],[24,31],[32,31],[39,31]],[[52,35],[47,37],[32,33],[17,37],[11,35],[24,33],[32,33],[39,33]]),
 fish:mouths([[51,33],[48,34],[32,36],[16,34],[12,33],[22,31],[32,33],[41,31]],[[52,33],[49,34],[32,33],[15,34],[11,33],[22,31],[32,33],[41,31]],[[52,37],[49,36],[32,37],[15,36],[11,37],[21,33],[32,35],[42,33]]),
 owl:mouths([[48,26],[42,27],[32,28],[22,27],[16,26],[24,25],[32,27],[39,25]],[[45,21],[41,22],[32,24],[23,22],[18,21],[24,21],[32,23],[39,21]],[[45,23],[41,24],[32,25],[23,24],[18,23],[24,23],[32,24],[39,23]]),
 phoenix:mouths([[49,24],[43,25],[32,26],[21,25],[15,24],[23,23],[32,24],[40,23]],[[49,17],[46,18],[32,22],[18,18],[15,17],[22,19],[32,22],[41,19]],[[49,20],[45,21],[32,24],[19,21],[15,20],[22,21],[32,23],[41,21]]),
 clam:mouths([[39,36],[36,37],[32,37],[28,37],[25,36],[26,36],[32,37],[38,36]],[[37,36],[35,36],[32,36],[29,36],[27,36],[27,37],[32,38],[37,37]],[[37,36],[35,36],[32,36],[29,36],[27,36],[27,37],[32,38],[37,37]]),
};
export function mouthRegistration(identity,stage,dir){
 const p=MOUTH_ANATOMY[identity]?.[Math.min(2,stage)]?.[dir];
 return p?{...p,visible:dir<5,jawRadius:identity==='drake'?3:identity==='spider'||identity==='centipede'?2:2.5}:null;
}

// Cloth ownership is fixed in the source frame. Its shoulder attachment
// does not change when the rig or a held weapon crosses the torso.
export function capePixel(identity,p,registration){
 if(!registration||p.bodyUnderlay||p.y<=registration.neck+2)return false;
 if(Math.abs(p.x-32)<=registration.torso+1)return false;
 const [r,g,b]=p.rgb;
 return ['knight','goblin'].includes(identity)?r>g*1.25&&r>b*1.1:
  ['caster','skeleton'].includes(identity)?b>g*1.12&&b>r*.9:
  ['elf','fox'].includes(identity)?g>r*1.05&&g>b:
  ['rogue','frostelf'].includes(identity)?b>r*1.08:false;
}

// Indexed garment materials reviewed in the original three forms and eight
// directions. Armor, leather gloves and fur are not interchangeable with a
// cape just because their RGB values are close. In particular, the knight's
// orange hem and dark red folds are part of the same red cloth.
const MATERIALS={
 dwarf:[[37,43,46],[11,28,41],[20,21,27,42,44]],
 minotaur:[[19,20,26,27,40],[16,25,29,30,31,33,39,48],[29,30,31,36,43]],
 knight:[
  [11,12,13,14,23,25,26,31,32,37,40,44,47],
  [1,8,9,10,12,13,15,18,22,23,25,27,31,34,35,38,42,43,44,45,46,47],
  [1,8,10,13,14,16,18,23,24,27,34,36,38,43,45,46]],
 orc:[[],[16,23,27,31],[13,21,27,31,41]],
 goblin:[
  [1,2,3,4,7,15,16,20,21,25,29,30,33,34,39,40,41,43],
  [6,8,9,10,13,17,19,20,22,24,25,29,31,32,33,36,42,43,47],
  [1,2,5,6,7,8,9,12,15,16,17,19,20,21,22,23,24,26,30,33,34,37,38,41,43]],
 rogue:[
  [1,2,3,4,5,6,7,8,9,10,11,12,14,16,17,18,22,26,32,36,37],
  [1,2,3,4,5,6,11,12,15,18,19,20,21,22,23,26,31,36,37,41,42,43],
  [1,2,3,4,5,6,7,10,13,14,15,17,19,20,21,23,24,25,28,29,31,32,33,35,37,39,40,42,46]],
};
const clothingKey=(x,y)=>y*64+x;
export function authoredClothing(asset,identity,stage,dir,registration){
 if(asset.clothing)return asset.clothing;
 const materials=new Set(MATERIALS[identity]?.[stage]||[]);
 // A palette index can also shade a cuff edge. Fixed source hand sockets
 // disambiguate that small contact patch; a concealed rear rogue hand has
 // no such foreground patch and must never punch a disk out of its cloak.
 const visibleHands=Object.entries(registration.hands).filter(([side])=>!(identity==='rogue'&&(dir===6||dir===5&&Number(side)===1||dir===7&&Number(side)===-1))).map(([,p])=>p);
 const pixels=asset.pixels.filter(p=>p.y>=registration.neck-2&&materials.has(p.index)&&
  (identity!=='orc'||p.y>=registration.pelvis-4)&&
  (identity!=='minotaur'||Math.abs(p.x-32)<=registration.torso*.8)&&
  !visibleHands.some(h=>Math.hypot(p.x-h.x,p.y-h.y)<=1.5));
 return asset.clothing={pixels,mask:new Set(pixels.map(p=>clothingKey(p.x,p.y))),materials,backdrop:['knight','goblin','rogue'].includes(identity)};
}

// Complete the garment behind the painted foreground arm. The hull is
// bounded by this facing's actual cloth pixels, never by a fist or sleeve.
// Only removed foreground pixels inside that silhouette need underpainting;
// transparent space outside the authored silhouette remains transparent.
export function completeClothing(clothing,armMask){
 const points=clothing.pixels.slice().sort((a,b)=>a.x-b.x||a.y-b.y),hull=[];
 if(!clothing.backdrop||points.length<3)return {...clothing,repairs:[]};
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 for(const p of points){while(hull.length>1&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}
 const lower=hull.length;
 for(let i=points.length-2;i>=0;i--){const p=points[i];while(hull.length>lower&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}hull.pop();
 const repairs=[];
 for(const k of armMask){
  const x=k%64,y=Math.floor(k/64);
  if(!hull.every((a,i)=>cross(a,hull[(i+1)%hull.length],{x,y})>=0))continue;
  const sample=points.reduce((a,b)=>Math.abs(b.y-y)*4+Math.abs(b.x-x)<Math.abs(a.y-y)*4+Math.abs(a.x-x)?b:a);
  repairs.push({...sample,x,y,clothingUnderlay:true});
 }
 return {...clothing,repairs};
}
