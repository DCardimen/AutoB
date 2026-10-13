import {FACE_MAPS,HAIR_MAPS,HELMET_MAPS,TORSO_MAPS,WING_MAP,stampPixels} from './authored-pixel-maps.js';
const O='#222632',leather=['#49352f','#87603d','#c29b59'],ivory='#fff1c6';
const humanoids=new Set(['knight','orc','elf','caster','fox']);
const familyHumans=new Set(['goblin','dwarf','rogue','frostelf','troll','minotaur','skeleton','faerie','harpy']);
export function authoredPalette(p,iris='#73594d'){
 return {O,'0':p.skin[0],'1':p.skin[1],'2':p.skin[2],'3':ivory,c:p.cloth[0],d:p.cloth[1],e:p.cloth[2],m:p.metal[0],n:p.metal[1],r:p.metal[2],h:p.metal[3],l:p.hair[0],a:p.hair[1],b:p.hair[2],W:ivory,E:'#252330',I:iris,B:'#dc9b85',H:'#e8f4d7'};
}
function view(dir){return {back:dir>=5,profile:dir===0||dir===4,quarter:dir===1||dir===3,rearQuarter:dir===5||dir===7,flip:dir===3||dir===4||dir===5,sign:dir<2||dir===7?1:dir===2||dir===6?0:-1};}
function eye(b,x,y,p,iris,{narrow=false,hurt=false,dead=false}={}){
 if(hurt||dead){b.line({x:x-1,y},{x:x+1,y:y+(hurt?1:0)},O);return;}
 b.rect(x-1,y-2,narrow?2:3,4,O);b.rect(x-1,y-1,narrow?1:2,2,p.metal[3]);b.rect(x,y-1,1,2,iris);b.dot(x-1,y-2,ivory);b.dot(x,y+1,O);
}
function expressions(b,x,y,v,p,rig,iris,monster=false){
 if(v.back)return;const hurt=['hit','stagger','knockdown'].includes(rig.state),dead=rig.death>0;
 const eyes=v.profile?[v.sign*5]:v.quarter?[v.sign*0,v.sign*5]:[-4,4];
 for(let i=0;i<eyes.length;i++)eye(b,x+eyes[i],y,p,iris,{narrow:v.quarter&&i===0,hurt,dead});
 const mx=x+v.sign*(v.profile?5:v.quarter?2:0);
 b.dot(mx+(v.profile?v.sign:0),y+2,p.skin[0]);b.dot(mx-v.sign,y+1,p.skin[2]);
 b.rect(mx-1,y+4,3,1,monster?O:'#955f56');b.dot(mx,y+5,p.skin[2]);
 if(!monster&&!v.profile){b.line({x:x-6,y:y+2},{x:x-5,y:y+2},'#db9882');if(!v.quarter)b.dot(x+6,y+2,'#c88577');}
 if(monster){for(const dx of v.profile?[v.sign*5]:[-3,4]){b.dot(x+dx,y+3,ivory);b.dot(x+dx,y+4,p.metal[2]);}}
}
function headAccessories(b,x,y,v,p,rig,kind){
 const ids=kind==='elf'||kind==='frostelf'||kind==='faerie'?v.profile?[-v.sign]:[-1,1]:[];
 for(const side of ids){b.outlined([{x:x+side*7,y:y-1},{x:x+side*12,y:y-3},{x:x+side*9,y:y+3},{x:x+side*7,y:y+2}],p.skin[0]);b.line({x:x+side*8,y:y},{x:x+side*10,y:y-2},p.skin[2]);}
 if(kind==='goblin'||kind==='orc')for(const side of v.profile?[-v.sign]:[-1,1]){
  b.outlined([{x:x+side*7,y:y-2},{x:x+side*13,y:y-4},{x:x+side*11,y:y+2},{x:x+side*7,y:y+3}],p.skin[0]);
  b.poly([{x:x+side*8,y:y-1},{x:x+side*12,y:y-3},{x:x+side*10,y:y+1}],p.skin[1]);b.dot(x+side*9,y-1,p.skin[2]);
 }
 if(kind==='minotaur')for(const side of [-1,1]){b.line({x:x+side*6,y:y-5},{x:x+side*11,y:y-9},O,1);b.line({x:x+side*6,y:y-5},{x:x+side*11,y:y-9},p.metal[2]);}
}
export function paintAuthoredFace(b,id,h,dir,p,rig){
 const kind=familyHumans.has(rig.design)?rig.design:id;if(!humanoids.has(kind)&&!familyHumans.has(kind))return false;
 // Grand beast heads retain their animal anatomy even when their physical rig changes.
 if(['lich','nightdragon','stormwyrm','leviathan'].includes(rig.grand?.motif))return false;
 const v=view(dir),x=Math.round(h.x),y=Math.round(h.y),which=v.back?'back':v.profile?'profile':v.quarter?'quarter':'front',pal=authoredPalette(p),flip=v.flip;
 headAccessories(b,x,y,v,p,rig,kind);
 if(kind==='knight'){
  if(!v.back){stampPixels(b,FACE_MAPS[v.profile?'profile':v.quarter?'quarter':'front'],x,y,pal,{flip,anchorX:9,anchorY:7});expressions(b,x,y+1,v,p,rig,p.metal[3]);}
  stampPixels(b,HELMET_MAPS[which],x,y,pal,{flip,anchorX:10,anchorY:8});
  if(!v.back){for(const dx of v.profile?[v.sign*5]:v.quarter?[v.sign,v.sign*5]:[-4,4])b.dot(x+dx,y+1,p.metal[3]);b.dot(x+v.sign*2,y+4,p.skin[1]);}
  const wave=Math.round(Math.sin(rig.phase*6.28)*(['run','sprint','turn','stop'].includes(rig.state)?2:.4));
  b.outlined([{x:x-2,y:y-7},{x:x-2,y:y-10},{x:x+1+wave,y:y-12},{x:x+5+wave,y:y-13},{x:x+6+wave,y:y-10},{x:x+3,y:y-9},{x:x+1,y:y-7}],p.hair[0]);
  b.line({x:x-1,y:y-8},{x:x+2+wave,y:y-11},p.hair[1],1);b.line({x:x+1,y:y-9},{x:x+4+wave,y:y-11},p.hair[2]);
  b.dot(x-7,y-2,p.metal[3]);b.dot(x-7,y+3,p.metal[2]);return true;
 }
 if(kind==='fox'){
  const foxSkin={...pal,'0':p.skin[0],'1':p.skin[1],'2':p.skin[2]};stampPixels(b,FACE_MAPS[v.profile?'profile':v.quarter?'quarter':'front'],x,y,foxSkin,{flip,anchorX:9,anchorY:7});
  for(const side of v.profile?[-v.sign]:[-1,1]){
   b.outlined([{x:x+side*5,y:y-5},{x:x+side*8,y:y-14},{x:x+side*10,y:y-5}],p.skin[0]);
   b.line({x:x+side*7,y:y-7},{x:x+side*8,y:y-11},p.skin[2],1);b.dot(x+side*8,y-12,O);
  }
  if(v.back){b.line({x:x-4,y:y+3},{x:x+4,y:y+3},p.skin[0]);b.line({x:x-5,y:y-5},{x:x-1,y:y-6},p.skin[2]);return true;}
  const mx=x+v.sign*(v.profile?6:3);b.outlined([{x:mx-5,y:y+1},{x:mx-2,y:y},{x:mx+3,y:y},{x:mx+5,y:y+3},{x:mx+2,y:y+6},{x:mx-3,y:y+6},{x:mx-5,y:y+3}],p.metal[2]);
  b.poly([{x:mx-4,y:y+2},{x:mx+3,y:y+1},{x:mx+3,y:y+4},{x:mx-2,y:y+5}],ivory);b.rect(mx,y+1,2,2,O);b.line({x:mx-1,y:y+4},{x:mx+2,y:y+4},p.skin[0]);
  for(const dx of v.profile?[v.sign*5]:v.quarter?[0,v.sign*5]:[-4,4])eye(b,x+dx,y-1,p,'#e6bf61',{narrow:v.quarter&&dx===0,hurt:rig.state==='hit',dead:rig.death>0});return true;
 }
 const skinMap=FACE_MAPS[v.profile?'profile':v.quarter?'quarter':'front'];stampPixels(b,skinMap,x,y,pal,{flip,anchorX:9,anchorY:7});
 if(kind==='goblin'){
  // A crimson kerchief is the base goblin's silhouette, not a generic human haircut.
  b.outlined([{x:x-9,y:y-3},{x:x-8,y:y-7},{x:x-3,y:y-10},{x:x+4,y:y-10},{x:x+8,y:y-7},{x:x+9,y:y-3}], '#63343c');
  b.poly([{x:x-8,y:y-4},{x:x-7,y:y-7},{x:x-3,y:y-9},{x:x+3,y:y-9},{x:x+7,y:y-6},{x:x+8,y:y-4}], '#a94743');
  b.line({x:x-6,y:y-6},{x:x,y:y-8},'#dc7962');b.line({x:x-8,y:y-3},{x:x+8,y:y-3},'#6d383b');
  const side=v.flip?-1:1;b.outlined([{x:x-side*7,y:y-5},{x:x-side*12,y:y-5},{x:x-side*14,y:y-1},{x:x-side*9,y:y-2}], '#a94743');
  if(v.back){b.line({x:x-4,y:y+4},{x:x+3,y:y+5},p.skin[0]);return true;}
  expressions(b,x,y,v,p,rig,'#f1d77e',true);for(const dx of v.profile?[v.sign*5]:v.quarter?[0,v.sign*5]:[-4,4])b.line({x:x+dx-1,y:y-3},{x:x+dx+1,y:y-2},p.skin[0]);return true;
 }
 if(kind==='orc'||kind==='troll'||kind==='minotaur'){
  b.rect(x-2,y-11,4,4,p.hair[0]);b.rect(x-1,y-10,2,2,p.hair[1]);b.dot(x-1,y-11,p.hair[2]);
  if(v.back){b.line({x:x-4,y:y+4},{x:x+4,y:y+4},p.skin[0]);return true;}
  expressions(b,x,y,v,p,rig,'#dcca77',true);for(const dx of v.profile?[v.sign*5]:v.quarter?[0,v.sign*5]:[-4,4])b.line({x:x+dx-1,y:y-3},{x:x+dx+2,y:y-2},p.skin[0]);
  for(const dx of v.profile?[v.sign*5]:[-5,5]){b.rect(x+dx,y+2,2,4,p.metal[2]);b.dot(x+dx,y+1,ivory);}return true;
 }
 if(kind==='skeleton'){
  if(v.back){b.line({x:x-3,y:y+1},{x:x+2,y:y-1},p.skin[0]);return true;}
  for(const dx of v.profile?[v.sign*5]:v.quarter?[0,v.sign*5]:[-4,4]){b.rect(x+dx-1,y-2,3,4,O);b.dot(x+dx,y-1,'#caa5f0');}b.dot(x+v.sign*2,y+2,O);b.rect(x-3+v.sign*2,y+4,6,1,O);for(const dx of [-2,0,2])b.dot(x+dx+v.sign*2,y+5,p.skin[0]);return true;
 }
 if(kind==='rogue'){
  stampPixels(b,HAIR_MAPS[which],x,y,{...pal,l:p.cloth[0],a:p.cloth[1],b:p.cloth[2]},{flip,anchorX:10,anchorY:8});
  if(!v.back){b.line({x:x-5,y:y+3},{x:x+5,y:y+3},p.cloth[0],1);expressions(b,x,y,v,p,rig,'#caa484');}return true;
 }
 stampPixels(b,HAIR_MAPS[which],x,y,pal,{flip,anchorX:10,anchorY:8});
 if(!v.back)expressions(b,x,y,v,p,rig,kind==='caster'?'#9276ad':kind==='frostelf'?'#80d1dc':'#547c45');
 if(kind==='elf'||kind==='faerie'){
  for(const side of v.profile?[-v.sign]:[-1,1]){for(let i=0;i<3;i++){const bx=x+side*(7-(i>0?1:0));b.rect(bx,y+4+i*2,2,2,p.hair[i%2?0:1]);b.dot(bx,y+4+i*2,p.hair[2]);}b.dot(x+side*6,y+10,p.cloth[2]);}
 }
 if(kind==='caster'||kind==='frostelf'){
  if(!v.back){b.line({x:x-5,y:y-3},{x:x+5,y:y-3},p.metal[0]);b.line({x:x-4,y:y-3},{x:x+4,y:y-3},p.metal[2]);b.dot(x+v.sign*2,y-3,'#4b99b7');b.dot(x+v.sign*2,y-4,'#b6e5e0');}
 }
 if(kind==='faerie'){
  for(const dx of [-6,-2,2,6]){b.dot(x+dx,y-6,p.cloth[0]);b.dot(x+dx,y-7,p.cloth[2]);}b.rect(x-2,y-7,3,2,'#f0d5b6');b.dot(x-1,y-8,'#fff1c6');
 }
 if(kind==='dwarf'){if(!v.back){b.outlined([{x:x-6,y:y+2},{x:x-2,y:y+4},{x:x+3,y:y+3},{x:x+6,y:y+2},{x:x+5,y:y+8},{x:x,y:y+12},{x:x-5,y:y+8}],p.hair[0]);for(const dx of [-3,0,3]){b.line({x:x+dx,y:y+5},{x:x+dx,y:y+9},p.hair[1]);b.dot(x+dx,y+5,p.hair[2]);}}b.line({x:x-6,y:y-4},{x:x+6,y:y-4},p.metal[2],1);}
 return true;
}

export function paintAuthoredTorso(b,id,body,pelvis,dir,p,rig){
 if(!humanoids.has(id))return false;const v=view(dir),kind=rig.design==='goblin'?'goblin':rig.design==='rogue'?'elf':id;
 const map=TORSO_MAPS[kind]||TORSO_MAPS[id],pal=authoredPalette(p),profile=v.profile,squeeze=profile?.76:v.quarter||v.rearQuarter?.91:1;
 pal.l=leather[0];pal.a=leather[1];pal.b=leather[2];
 // A body map follows the chest-to-hip axis; limbs and weapon anchors stay physical.
 const tilt=Math.max(-.65,Math.min(.65,Math.atan2(pelvis.x-body.x,pelvis.y-body.y||4)));
 stampPixels(b,map,body.x,body.y+1,pal,{squeeze,tilt,anchorY:5});
 if(v.back){b.line({x:body.x-3,y:body.y+1},{x:body.x+2,y:body.y+6},p.cloth[0]);if(id==='elf'||id==='fox'){b.line({x:body.x-3,y:body.y},{x:body.x+2,y:body.y+5},leather[1],1);for(const dx of [-2,0,2]){b.line({x:body.x+dx,y:body.y-1},{x:body.x+dx+2,y:body.y+5},p.metal[2]);b.dot(body.x+dx,body.y-2,p.cloth[2]);}}}
 if(rig.design==='skeleton')for(const dy of [0,2,4]){b.line({x:body.x-4,y:body.y+dy},{x:body.x+4,y:body.y+dy},p.skin[2]);b.dot(body.x,body.y+dy,p.skin[0]);}
 return true;
}

export function paintFairyWings(b,rig,at,p){
 const body=at(rig.body),dir=rig.dir,v=view(dir),fold=rig.ragdoll?.42:1,flap=Math.sin(rig.phase*6.28),pal={H:'#f2f5c9',h:p.cloth[2],b:'#afd4aa',a:p.cloth[1],l:p.cloth[0]};
 for(const side of [-1,1]){const width=(v.profile?.48:v.quarter||v.rearQuarter?.72:1)*fold*(.9+flap*.08),y=body.y-8+flap*1.5;
  stampPixels(b,WING_MAP,body.x+side*(8*width),y,pal,{flip:side<0,squeeze:width,anchorX:side<0?16:0,anchorY:9,tilt:side*.2});
 }
}
export function paintFairyBody(b,rig,at,p){
 const body=at(rig.body),back=rig.dir>=5,v=view(rig.dir),pal=authoredPalette(p),dead=rig.death>0;
 stampPixels(b,TORSO_MAPS.fairy,body.x,body.y+2,pal,{anchorY:4,squeeze:v.profile?.75:1});
 for(const side of [-1,1]){const sway=Math.sin(rig.phase*6.28+side)*(['walk','run','sprint'].includes(rig.state)?2:1),ankle={x:body.x+side*2+sway*.3,y:body.y+12+Math.max(0,sway)*.7};
  b.line({x:body.x+side*2,y:body.y+7},ankle,O,1);b.line({x:body.x+side*2,y:body.y+7},ankle,p.skin[1]);b.line(ankle,{x:ankle.x+side*2,y:ankle.y+1},p.cloth[1],1);b.dot(ankle.x,ankle.y,p.cloth[2]);
 }
 const hand={x:body.x+(v.sign||1)*7,y:body.y-2-(rig.state==='cast'?Math.sin(rig.phase*Math.PI)*3:0)};
 b.line({x:body.x+(v.sign||1)*3,y:body.y-3},hand,O,1);b.line({x:body.x+(v.sign||1)*3,y:body.y-3},hand,p.skin[1]);b.dot(hand.x,hand.y,p.skin[2]);
 b.line(hand,{x:hand.x+2,y:hand.y-11},leather[0],1);b.line(hand,{x:hand.x+2,y:hand.y-11},leather[2]);
 b.outlined([{x:hand.x+2,y:hand.y-13},{x:hand.x+4,y:hand.y-11},{x:hand.x+2,y:hand.y-9},{x:hand.x,y:hand.y-11}],p.cloth[2]);b.dot(hand.x+1,hand.y-12,ivory);
 if(!dead)for(const side of [-1,1]){const q={x:body.x+side*11,y:body.y+6+Math.round(Math.sin(rig.phase*6.28+side)*2)};b.dot(q.x,q.y,p.cloth[2]);b.dot(q.x,q.y-1,ivory);}
 if(back)b.line({x:body.x,y:body.y+1},{x:body.x,y:body.y+6},p.cloth[0]);
}
