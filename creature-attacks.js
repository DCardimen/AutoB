import {solveLimb} from './prototype-rig.js';
import {mouthRegistration} from './companion-anatomy.js';
// Natural attacks share the combat windup/contact/recovery clock. Species
// retain their own anatomy instead of inheriting their proxy rig's weapon.
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const p=(x,y,z)=>({x,y,z}),add=(a,b)=>p(a.x+b.x,a.y+b.y,a.z+b.z);
const profiles={
 wolf:['canine-bite',14,6],feralfox:['fox-snap',12,5],cat:['feline-rake',11,3],lion:['lion-pounce',15,5],bear:['bear-maul',10,4],
 rabbit:['rabbit-kick',9,2],rodent:['rodent-nip',10,3],rhino:['horn-gore',17,0],stag:['antler-ram',14,0],turtle:['turtle-snap',9,3],drake:['dragon-chomp',18,7],
 mantis:['mantis-scythes',16,0],crab:['crab-pinch',12,0],beetle:['beetle-pry',13,0],spider:['spider-fangs',12,4],centipede:['centipede-mandibles',14,4],mech:['cannon-recoil',7,0],
 serpent:['serpent-strike',18,6],fish:['fish-chomp',12,4],owl:['beak-peck',13,2],phoenix:['phoenix-swoop',17,3],harpy:['talon-rake',12,0],bat:['bat-bite',13,4],
 squid:['tentacle-lash',15,0],clam:['shell-snap',8,5],jelly:['gel-pulse',9,0],mushroom:['spore-burst',7,0],moth:['wing-gust',9,0],
};
export const CREATURE_ATTACK_CATEGORIES=Object.fromEntries(Object.entries(profiles).map(([id,[category]])=>[id,category]));
export const CREATURE_ATTACK_EFFECTS={wolf:'bite',feralfox:'bite',cat:'claw',lion:'claw',bear:'claw',mantis:'scythe',crab:'pinch',rhino:'ram',stag:'ram',beetle:'ram',spider:'bite',centipede:'bite',serpent:'bite',drake:'bite',bat:'bite',turtle:'bite',rodent:'bite',fish:'bite',rabbit:'claw'};
export function creatureMouthSource(rig){
 const design=rig.creatureAttack?.design,dir=rig.dir,sign=dir<2?1:dir>2&&dir<5?-1:0;
 const registered=mouthRegistration(design,rig.artStage??rig.form??0,dir);if(registered)return registered;
 const low=design==='spider'?10:design==='centipede'?5:design==='turtle'?3:0;
 return {x:32+sign*(dir===0||dir===4?13:9),y:(design==='clam'?37:27)+low};
}
export function applyCreatureAnatomy(rig,spec){
 const design=spec.nativeDesign||spec.nativeRig,profile=profiles[design];if(!profile)return rig;
 const [category,reach,jawMax]=profile,attacking=['attack','slash','charge','cast'].includes(rig.state),casting=rig.state==='cast';
 const phase=clamp(rig.phase||0),recovery=rig.stage==='recovery';
 const prepare=attacking?(recovery?1-ease(phase/.55):ease(phase/.72)):0;
 const strike=attacking?(recovery?1-ease(phase/.38):ease((phase-.72)/.28)):0;
 const open=attacking?(recovery?(1-ease(phase/.22))*.18:ease(phase/.5)*(1-ease((phase-.70)/.23))):0;
 const drive=strike*reach-prepare*3,head=rig.head,body=rig.body;
 const jaw=jawMax*open;
 rig.creatureAttack={category,design,active:attacking,prepare,strike,jaw,contact:null};
 rig.creatureAppendages=[];
 if(design==='mantis'){
  // Four walking legs and two raptorial arms, not six legs plus extra arms.
  rig.legs=rig.legs.filter(l=>!l.front);
 }
 if(attacking){
  head.x+=drive;head.z+=prepare*(['rhino','stag'].includes(design)?-6:2)-strike*(design==='owl'?7:2);
  body.x+=strike*3-prepare;body.z-=prepare*(['bear','cat','lion'].includes(design)?3:1);
  if(['rhino','stag','beetle'].includes(design))head.z-=strike*3;
  if(design==='serpent'){head.z+=prepare*7;head.y+=Math.sin(phase*Math.PI)*prepare*3;}
  if(design==='mech'){head.x-=strike*10;body.x-=strike*3;}
  if(design==='rabbit'){
   for(const leg of rig.legs.filter(l=>l.front))Object.assign(leg,solveLimb(leg.root,add(leg.root,p(5+strike*22,Math.sign(leg.side)*4,-12+prepare*13)),leg.upper,leg.lower,p(0,Math.sign(leg.side),1)),{hock:null});
  }
  if(['jelly','mushroom','clam'].includes(design))rig.squash=(rig.squash||1)*(1+prepare*.18-strike*.22);
  if(rig.wings&&['owl','harpy','phoenix','bat','moth'].includes(design))rig.wings=rig.wings.map(wing=>wing.map((q,i)=>({...q,z:q.z+(prepare*7-strike*10)*i/3,x:q.x-strike*i*2})));
 }
 const limb=(side,kind,root,joint,end,tip)=>{rig.creatureAppendages.push({side,kind,root,joint,end,tip});return tip;};
 let contact=add(head,p(design==='centipede'?9:14,0,-2));
 if(design==='mantis')for(const side of [-1,1]){
  const offset=side===1?1:.72,s=strike*offset;
  const root=add(body,p(5,side*12,4)),goal=add(root,p(9-prepare*14+s*34,side*(8-s*16),2+prepare*17-s*17));
  const {joint,end}=solveLimb(root,goal,22,20,p(-1,side*.6,1));
  const axis=p(.35+s*.7,-side*.25,-.9+s*.5),length=Math.hypot(axis.x,axis.y,axis.z),tip=add(end,p(axis.x/length*18,axis.y/length*18,axis.z/length*18));
  contact=limb(side,'scythe',root,joint,end,tip);
 }
 if(design==='crab')for(const side of [-1,1]){
  const root=add(body,p(6,side*19,5)),joint=add(root,p(3-prepare*4,side*8,prepare*4)),end=add(joint,p(7+strike*13,-side*strike*7,2)),tip=add(end,p(7,0,0));
  contact=limb(side,'pincer',root,joint,end,tip);
 }
 if(['cat','lion','bear'].includes(design)){
  const side=design==='bear'?-1:1,leg=rig.legs.find(l=>l.front&&Math.sign(l.side)===side);
  if(leg&&attacking){Object.assign(leg,solveLimb(leg.root,add(leg.root,p(8-prepare*8+strike*24,side*(6-strike*12),4+prepare*10-strike*8)),leg.upper,leg.lower,p(0,side,1)),{hock:null});contact=add(leg.end,p(5,0,0));}
 }
 if(['spider','centipede'].includes(design))for(const side of [-1,1]){
  const root=add(head,p(2,side*4,-2)),joint=add(root,p(5,side*(4+open*4),-1)),end=add(joint,p(4,-side*(3+strike*3),-3));
  limb(side,'fang',root,joint,end,add(end,p(3,0,-2)));
 }
 if(design==='squid')for(const side of [-1,1]){
  const root=add(body,p(0,side*6,-3)),joint=add(root,p(prepare*-5+strike*12,side*7,-5)),end=add(joint,p(6+strike*12,-side*strike*6,-2));
  contact=limb(side,'tentacle',root,joint,end,add(end,p(5,0,0)));
 }
 if(['harpy','phoenix','owl'].includes(design)&&attacking)for(const side of [-1,1]){
  const root=add(body,p(0,side*5,-4)),joint=add(root,p(prepare*-4+strike*9,side*3,-5)),end=add(joint,p(4+strike*9,0,-3));
  const tip=limb(side,'talon',root,joint,end,add(end,p(6,side*2,-2)));
  if(design==='harpy')contact=tip;
 }
 if(['rhino','stag','beetle','owl','phoenix'].includes(design))contact=add(head,p(reach,0,design==='stag'?5:0));
 if(design==='rabbit')contact=add(rig.legs.find(l=>l.front)?.end||head,p(4,0,0));
 if(design==='mech')contact=rig.weapon?.tip||contact;
 // Cooldown magic keeps its cast pose; natural attacks use these physical
 // tips for damage contacts, trails, and the visible attacking appendage.
 rig.creatureAttack.contact=contact;
 if(!casting&&design!=='mech')rig.weapon=null;
 return rig;
}

export function paintCreatureAttack(b,rig,layer='near'){
 const a=rig.creatureAttack,at=rig.artCreatureProject;if(!a||!at||!a.active)return; // Resting claws/scythes are already in the authored sprite.
 // Indexed source skin owns the visible anatomy, including its lower jaw.
 // Physical appendages still supply action goals/contact intent; drawing
 // another set of tubes over painted pincers, fangs or wings duplicates them.
 if(rig.authoredEvolution){rig.artJawOpen=rig.artJawDeformation||0;return;}
 const ramp=rig.artNaturalPalette||rig.palette.skin,O='#192328';
 const line=(x,y,r)=>{b.line(x,y,O,r+.5);b.line(x,y,ramp[0],r);b.line({x:x.x-.4,y:x.y-.4},{x:y.x-.4,y:y.y-.4},ramp[1],Math.max(.3,r*.6));};
 for(const limb of rig.creatureAppendages||[]){
  if(a.design==='spider'&&limb.kind==='fang')continue; // the authored face carries its fangs
  const angle=rig.dir*Math.PI/4,depth=q=>q.x*Math.sin(angle)+q.y*Math.cos(angle);
  if((depth(limb.root)>=depth(rig.body)?'near':'far')!==layer)continue;
  const [root,joint,end,tip]=[limb.root,limb.joint,limb.end,limb.tip].map(at);
  line(root,joint,limb.kind==='pincer'?1.8:1.2);line(joint,end,limb.kind==='pincer'?2:1.15);
  b.oval(joint.x,joint.y,1.5,1.3,ramp[1]);
  if(limb.kind==='scythe'){
   b.outlined([end,{x:tip.x+1,y:tip.y},tip,{x:end.x-2,y:end.y+2}],ramp[2]);
   b.line(end,tip,'#e7e2b5');
  }else if(limb.kind==='pincer'){
   const gap=(1-a.strike)*3+1;
   line(end,{x:tip.x,y:tip.y-gap},1.6);line(end,{x:tip.x,y:tip.y+gap},1.6);
   b.dot(tip.x,tip.y-gap,ramp[2]);b.dot(tip.x,tip.y+gap,ramp[2]);
  }else{line(end,tip,limb.kind==='tentacle'?1.1:.7);b.dot(tip.x,tip.y,['fang','talon'].includes(limb.kind)?'#f5e5b8':ramp[2]);}
 }
 if(layer==='far')return;
 if(a.active&&['moth','phoenix'].includes(a.design)){
  const body=at(rig.body),spread=5+a.prepare*5-a.strike*3;
  for(const side of [-1,1]){const end={x:body.x+side*spread,y:body.y-4-a.prepare*5+a.strike*7};line(body,end,1.3);b.dot(end.x,end.y,a.design==='phoenix'?'#ffda87':ramp[2]);}
 }
 if(a.active&&['jelly','mushroom'].includes(a.design)&&a.strike>.1){
  const body=at(rig.body);for(let i=0;i<5;i++){const angle=i*Math.PI*.4,r=5+a.strike*6;b.dot(body.x+Math.cos(angle)*r,body.y+Math.sin(angle)*r*.6,a.design==='jelly'?'#b9f5ed':'#dbc997');}
 }
 const mouth=rig.artCreatureMouth;
 if(!mouth||!a.active||a.jaw<.15||rig.dir>=5)return;
 const open=Math.max(1,a.jaw*(rig.artCreatureFit||1)*.55),sign=rig.dir<2?1:rig.dir>2?-1:0,width=sign?2.7:3.4;
 // A real lower jaw opens, exposes teeth, snaps at contact, then closes.
 b.oval(mouth.x,mouth.y+open*.4,width+1,open+1,O);
 b.oval(mouth.x,mouth.y+open*.4,width,open,'#44212c');
 b.line({x:mouth.x-width,y:mouth.y+open*1.3},{x:mouth.x+width,y:mouth.y+open*1.3},ramp[1],.65);
 for(const dx of sign?[sign*1.5]:[-2,2]){b.dot(mouth.x+dx,mouth.y-open*.2,'#fff1d1');b.dot(mouth.x+dx,mouth.y+open*.8,'#e0cba4');}
 if(open>1.6)b.line({x:mouth.x-1,y:mouth.y+open*.7},{x:mouth.x+1,y:mouth.y+open*.7},'#c67b83');
 rig.artJawOpen=open;
}
