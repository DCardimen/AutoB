import * as T from 'three';

// Runtime life for the biped fox, layered after the clips and the look/aim:
// - feet: planted until they need to step; steps follow the actual ground
//   motion at any speed and turn the body on the spot; the pelvis settles so
//   the legs always reach; a dodge is a pounce (crouch, tucked leap, squash);
// - weight: the body leans into acceleration and settles with overshoot;
// - hits: flinches scaled by damage and turned away from the blow; a hurt
//   stance below a third of health;
// - tail and ears: spring chains with inertia; the tail whips on dodges and
//   wags in victory, the ears perk to aim, swivel to the enemy, flatten when
//   hit and twitch at rest;
// - idle: glances, ear flicks, tail swishes and weight shifts;
// - bow: the string thrums after release; spare arrows leave the quiver.
// Everything is a pure function of the steps taken, so replays repeat.
// body() runs before the aim/look controller, so its tail clearance covers
// the spring tail too; face() runs after the head has turned.
export const LIFE={
 foot:{ground:.058,standStep:.055,turnStep:.45,minGap:.07,maxDrop:.05},
 // Gait: above walk (m/s) the feet cycle at cadence[0]+cadence[1]*speed steps/s
 // (clamped to cadence[2..3]); each stance covers span[0]-span[1]*speed m
 // (at least span[2]); duty is the share of a cycle a foot is down.
 // A stance foot further than reach (m) from its home steps at once; faster
 // than skid (m/s), or staggered, the body is being thrown and the feet drag.
 gait:{walk:.25,cadence:[2.4,1.0,2.6,6.4],span:[.30,.04,.17],duty:[.2,.65],reach:.22,skid:6},
 tail:{stiffness:5.5,drag:.38,maxBend:.55},ear:{stiffness:14,drag:.45,maxBend:.5},
};
const UP=new T.Vector3(0,1,0),smooth=(a,b,t)=>{const x=Math.min(1,Math.max(0,(t-a)/(b-a)));return x*x*(3-2*x);},wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

class SpringChain{
 constructor(bones,{stiffness,drag,maxBend}){this.bones=bones;this.k=stiffness;this.drag=drag;this.max=maxBend;this.tails=null;}
 reset(){this.tails=null;}
 step(dt,force=new T.Vector3()){
  const pos=o=>o.getWorldPosition(new T.Vector3());
  if(!this.tails)this.tails=this.bones.slice(0,-1).map((b,i)=>{const p=pos(this.bones[i+1]);return {p,prev:p.clone()};});
  for(let i=0;i<this.bones.length-1;i++){
   const b=this.bones[i],c=this.bones[i+1],head=pos(b),rest=pos(c).sub(head),len=rest.length();if(len<1e-6)continue;rest.normalize();const s=this.tails[i];
   const next=s.p.clone().addScaledVector(s.p.clone().sub(s.prev),1-this.drag).addScaledVector(rest,this.k*len*dt).addScaledVector(force,dt*dt);
   let dir=next.sub(head).normalize();const bend=dir.angleTo(rest);if(bend>this.max)dir=rest.clone().lerp(dir,this.max/bend).normalize();
   s.prev.copy(s.p);s.p.copy(head).addScaledVector(dir,len);
   const turn=new T.Quaternion().setFromUnitVectors(rest,dir),pq=b.parent.getWorldQuaternion(new T.Quaternion());b.quaternion.premultiply(pq.clone().invert().multiply(turn).multiply(pq));b.updateMatrixWorld(true);
  }
 }
}

export class FoxLife{
 constructor(model,{legs=true}={}){
  this.model=model;this.legs=legs;const n=x=>model.getObjectByName(x);this.n=n;model.updateMatrixWorld(true);
  this.root=n('Biped_Motion_Root');this.head=n('smartrigHead');
  this.spine=['smartrigSpine','smartrigSpine1','smartrigSpine2','smartrigNeck','smartrigHead'].map(n);
  this.tail=new SpringChain(['Bone_019','Bone_018','Bone_017','Bone_016','Bone_015'].map(n),LIFE.tail);
  this.ears=[['Bone_035','Bone_034','Bone_033'],['Bone_038','Bone_037','Bone_036']].map(c=>new SpringChain(c.map(n),LIFE.ear));
  this.earBase=[n('Bone_035'),n('Bone_038')];
  const facing=new T.Vector3(0,0,1);this.headFacing=facing.clone().applyQuaternion(this.head.getWorldQuaternion(new T.Quaternion()).invert());
  this.feet=['Right','Left'].map(side=>{const g=s=>n('smartrig'+side+s),thigh=g('UpLeg'),knee=g('Leg'),foot=g('Foot');return {side,sign:side==='Right'?-1:1,thigh,knee,foot,toe:g('ToeBase'),l1:thigh.getWorldPosition(new T.Vector3()).distanceTo(knee.getWorldPosition(new T.Vector3())),l2:knee.getWorldPosition(new T.Vector3()).distanceTo(foot.getWorldPosition(new T.Vector3())),flat:foot.getWorldQuaternion(new T.Quaternion()),pos:null,yaw:0,swing:null};});
  // Bow morphs: the string's Draw and the limbs' Flex.
  this.morphs=[];n('Bow_Right_Hand')?.traverse(o=>{if(o.morphTargetDictionary)for(const [k,i]of Object.entries(o.morphTargetDictionary))this.morphs.push({o,k,i});});
  const body=n('Quiver_Body');this.spares=body?[0,1,2].map(k=>body.children.slice(4+4*k,8+4*k)):[];this.spareBase=this.spares.map(list=>list.map(m=>m.position.clone()));
  // Everything this layer moves, so it can be put back before the clips are
  // sampled (the mixer skips unchanged keys).
  this.touched=[this.root,...this.spine,...this.tail.bones,...this.ears.flatMap(e=>e.bones),...this.feet.flatMap(f=>[f.thigh,f.knee,f.foot])];this.saved=null;
  this.reset();
 }
 restore(){if(this.saved){for(const [o,p,q]of this.saved){o.position.copy(p);o.quaternion.copy(q);}this.saved=null;}if(this.savedMorphs){for(const [mm,v]of this.savedMorphs)mm.o.morphTargetInfluences[mm.i]=v;this.savedMorphs=null;}}
 reset(){Object.assign(this,{time:0,lean:new T.Vector3(),leanRate:new T.Vector3(),flinch:new T.Vector3(),flinchRate:new T.Vector3(),drop:0,squash:0,squashRate:0,lastStep:-9,lastVel:null,vib:-9,grabs:[],hurt:0,wince:0,shots:0,closure:-1,gait:null,flight:0,cur:null});
  for(const f of this.feet){f.pos=null;f.swing=null;}this.tail.reset();for(const e of this.ears)e.reset();}
 rotateWorld(o,q){const pq=o.parent.getWorldQuaternion(new T.Quaternion());o.quaternion.premultiply(pq.clone().invert().multiply(q).multiply(pq));o.updateMatrixWorld(true);}
 // ctx: {dt, velocity, dodge:{p,dir,side}|null, hits:[{amount,dir}], hpFrac,
 //       aim, released, grab, idle, victory, targetDir, skid, pounce}
 apply(ctx){this.body(ctx);this.face(ctx);}
 body(ctx){this.ctx=ctx;
  const dt=ctx.dt??1/60;this.time+=dt;const t=this.time,m=this.model;m.updateMatrixWorld(true);
  this.saved=this.touched.map(o=>[o,o.position.clone(),o.quaternion.clone()]);this.savedMorphs=this.morphs.map(mm=>[mm,mm.o.morphTargetInfluences[mm.i]]);
  const yaw=m.rotation.y,fwd=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw)),side=new T.Vector3(fwd.z,0,-fwd.x),vel=ctx.velocity||new T.Vector3(),speed=vel.length();
  // Acceleration drives a damped lean (body leans into it and settles).
  const acc=this.lastVel?vel.clone().sub(this.lastVel).divideScalar(Math.max(dt,1e-4)):new T.Vector3();this.lastVel=vel.clone();acc.clampLength(0,14);
  const leanTarget=new T.Vector3(acc.dot(fwd)*.012+speed*.035,0,acc.dot(side)*.010);this.leanRate.addScaledVector(leanTarget.clone().sub(this.lean),90*dt).multiplyScalar(Math.exp(-dt*14));this.lean.addScaledVector(this.leanRate,dt);
  // Hits: impulses on a flinch spring, away from the blow, scaled by damage.
  for(const h of ctx.hits||[]){const local=h.dir.clone().setY(0).normalize(),k=Math.min(1.2,.35+h.amount*3.5);this.flinchRate.x+=-local.dot(fwd)*9*k;this.flinchRate.z+=local.dot(side)*7*k;this.flinchRate.y+=(local.dot(side)>0?-1:1)*4*k;this.wince=Math.max(this.wince,Math.min(1,.5+h.amount*4));this.hurt=Math.max(this.hurt,k);}
  const W=17,Z=.38;this.flinchRate.addScaledVector(this.flinch,-W*W*dt).multiplyScalar(Math.exp(-2*Z*W*dt));this.flinch.addScaledVector(this.flinchRate,dt);this.wince=Math.max(0,this.wince-dt*2.2);this.hurt=Math.max(0,this.hurt-dt*1.5);
  const low=1-smooth(.18,.35,ctx.hpFrac??1),idle=ctx.idle??0,victory=ctx.victory??-1,happy=victory>=0?smooth(.2,.6,victory):0;
  // Idle personality: glances, weight shifts and ear flicks after a pause.
  const restless=smooth(2.5,3.5,idle)*(1-(ctx.aim||0)),glance=restless*(.32*Math.sin(t*.9)*Math.sin(t*.37)),shift=restless*.012*Math.sin(t*.7);
  // Spine: lean, flinch, hurt posture, glance.
  const [sp,sp1,sp2,neck,head]=this.spine;
  this.rotateWorld(sp1,new T.Quaternion().setFromAxisAngle(side,this.lean.x+this.flinch.x*.06+.10*low).multiply(new T.Quaternion().setFromAxisAngle(fwd,-this.lean.z+this.flinch.z*.05)));
  this.rotateWorld(neck,new T.Quaternion().setFromAxisAngle(UP,this.flinch.y*.05+glance*.5).multiply(new T.Quaternion().setFromAxisAngle(side,this.flinch.x*.04+.08*low-.05*happy)));
  this.rotateWorld(head,new T.Quaternion().setFromAxisAngle(UP,glance*.5));
  // Feet and pelvis.
  if(this.legs)this.stepFeet(ctx,dt,fwd,side,speed,vel,shift);
  // Tail: inertia plus wag, whip and swish forces.
  const wag=(happy*1.0+restless*.25*Math.max(0,Math.sin(t*.45)))*Math.sin(t*(victory>=0?18:7)),whip=ctx.dodge?-Math.sin(Math.PI*ctx.dodge.p)*ctx.dodge.side*6:0;
  this.tail.step(dt,side.clone().multiplyScalar((wag*3+whip)*1).add(new T.Vector3(0,(this.hurt>.3?2:0)+happy*1.5,0)));
  this.mood={low,happy,restless};m.updateMatrixWorld(true);
 }
 face(ctx){
  const dt=ctx.dt??1/60,t=this.time,m=this.model,{low,happy}=this.mood,victory=ctx.victory??-1;m.updateMatrixWorld(true);
  // Ears: expression on the base, springs on the chain.
  const headQ=this.head.getWorldQuaternion(new T.Quaternion()),hf=this.headFacing.clone().applyQuaternion(headQ),hs=hf.clone().cross(UP).normalize(),aim=ctx.aim||0,flat=Math.min(1,this.wince*.9+low*.5),twitch=Math.max(0,Math.sin(t*1.3+hash(Math.floor(t/3))*6))**30*(1-aim)*.5;
  const toward=ctx.targetDir?Math.atan2(ctx.targetDir.clone().cross(hf).y,ctx.targetDir.dot(hf)):0;
  this.earBase.forEach((ear,i)=>{const s=i?1:-1,perk=.28*aim+.18*happy-.75*flat;this.rotateWorld(ear,new T.Quaternion().setFromAxisAngle(hs,-perk+(i?twitch:0)*.3).multiply(new T.Quaternion().setFromAxisAngle(hf,s*(.35*flat+.12*low))).multiply(new T.Quaternion().setFromAxisAngle(UP,T.MathUtils.clamp(-toward*.35,-.35,.35))));});
  for(const e of this.ears)e.step(dt,new T.Vector3(0,-1.5,0));
  // Bow: the string thrums after a release; arrows leave and rise in the quiver.
  if(ctx.released)this.vib=t;const v=t-this.vib,thrum=v<.6?-.32*Math.exp(-v/.09)*Math.cos(2*Math.PI*17*v):0,flex=v<.6?.12*Math.exp(-v/.12)*Math.sin(2*Math.PI*11*v):0;
  for(const mm of this.morphs){const base=mm.o.morphTargetInfluences[mm.i];mm.o.morphTargetInfluences[mm.i]=mm.k==='Draw'?base+thrum:base+flex;}
  if(ctx.grab){this.grabs.push({t,k:this.shots++%Math.max(1,this.spares.length)});}
  this.spares.forEach((list,k)=>{const g=[...this.grabs].reverse().find(x=>x.k===k),a=g?t-g.t:9,hide=a<.30,rise=smooth(.30,.55,a);list.forEach((mesh,j)=>{mesh.visible=!hide;mesh.position.copy(this.spareBase[k][j]).add(new T.Vector3(0,-.06*(1-rise)*(a<.55?1:0),0));});});
  m.updateMatrixWorld(true);
 }
 stepFeet(ctx,dt,fwd,side,speed,vel,shift){
  const m=this.model,root=this.root,pos=o=>o.getWorldPosition(new T.Vector3()),ground=m.position.y+LIFE.foot.ground,dodge=ctx.dodge,aim=ctx.aim||0;
  // Homes: the clip's own feet, an archer's stagger while aiming, led ahead
  // by the motion so a step lands where the body is going.
  const homes=this.feet.map(f=>{const p=pos(f.foot);p.y=ground;p.addScaledVector(fwd,aim*(f.sign<0?-.06:.055)).addScaledVector(side,aim*f.sign*-.015).addScaledVector(side,-shift);return p;});
  for(const [i,f]of this.feet.entries()){if(!f.pos){f.pos=homes[i].clone();f.yaw=m.rotation.y;}}
  // A pounce crouches before it starts (ctx.pounce rises 0..1 over the last
  // 0.1 s, from the game's known dodge time) and leaves the ground on its
  // first frame, as the game moves the body at once.
  const airborne=dodge&&dodge.p>0&&dodge.p<.82;
  if(dodge&&dodge.p>=.82)for(const [i,f]of this.feet.entries()){if(!f.landed){f.pos.copy(homes[i]);f.yaw=m.rotation.y;f.swing=null;f.landed=true;}}
  if(!dodge)for(const f of this.feet)f.landed=false;
  // Gait. Moving, the feet follow a cycle whose cadence rises with speed;
  // each stance covers a span under the hip the legs can reach, so a walk
  // keeps both feet down part of the time and a run leaves the ground between
  // steps. A swing lands where the hip will be at mid-stance. Standing, a
  // foot steps only to re-home or to follow a turn.
  const G=LIFE.gait,skid=this.skidding=!airborne&&(ctx.skid||speed>G.skid);
  if(skid){this.gait=null;for(const [i,f]of this.feet.entries()){f.swing=null;f.lift=0;f.pos.lerp(homes[i],Math.min(1,dt*25));f.yaw=m.rotation.y;}}
  else if(speed>G.walk){const steps=T.MathUtils.clamp(G.cadence[0]+G.cadence[1]*speed,G.cadence[2],G.cadence[3]),period=2/steps,span=T.MathUtils.clamp(G.span[0]-G.span[1]*speed,G.span[2],G.span[0]),duty=T.MathUtils.clamp(span/(speed*period),G.duty[0],G.duty[1]);
   // Start with the foot further behind.
   if(!this.gait){const behind=this.feet.map((f,i)=>f.pos.clone().sub(homes[i]).dot(vel));const phase=(behind[0]<=behind[1]?duty:duty-.5)-1e-6;this.gait={phase,lifted:[0,1].map(i=>Math.floor(phase+i*.5-duty))};}
   Object.assign(this.gait,{period,duty,prev:this.gait.phase});this.gait.phase+=dt/period;
  }else this.gait=null;
  this.cur={homes,vel,gait:this.gait};
  if(!airborne&&!skid){
   for(const [i,f]of this.feet.entries()){
    if(f.swing){f.swing.p+=dt/f.swing.dur;const k=Math.min(1,f.swing.p),to=f.swing.to();f.pos.copy(f.swing.from).lerp(to,smooth(0,1,k));f.lift=Math.sin(Math.PI*k)*f.swing.h;f.yaw=f.swing.yaw0+wrap(m.rotation.y-f.swing.yaw0)*smooth(0,1,k);if(k>=1){f.pos.copy(to);f.swing=null;f.lift=0;this.squashRate-=.25*Math.min(1,speed);}continue;}
    let dur=0;const g=this.gait;
    // Each foot lifts once per cycle, when its phase passes the end of its
    // stance (robust to the duty shrinking as the fox speeds up).
    if(g){const cycle=Math.floor(g.phase+i*.5-g.duty),behind=f.pos.clone().sub(homes[i]).setY(0).length()>G.reach;if(cycle>g.lifted[i]||behind){g.lifted[i]=Math.max(cycle,g.lifted[i]);dur=(1-g.duty)*g.period*(behind&&cycle<=g.lifted[i]?.6:1);}}
    else{const off=f.pos.distanceTo(homes[i]),turn=Math.abs(wrap(m.rotation.y-f.yaw));if((off>LIFE.foot.standStep||turn>LIFE.foot.turnStep)&&!this.feet[1-i].swing&&this.time-this.lastStep>LIFE.foot.minGap)dur=.16;}
    if(dur){const swing={from:f.pos.clone(),p:0,dur,h:.022+.03*Math.min(1,speed/2.5),yaw0:f.yaw};
     // The landing follows the body: home, plus the travel until touchdown
     // and to mid-stance.
     swing.to=()=>{const c=this.cur,lead=c.gait?(1-Math.min(1,swing.p))*swing.dur+c.gait.duty*c.gait.period/2:0;return c.homes[i].clone().addScaledVector(c.vel,lead);};
     f.swing=swing;this.lastStep=this.time;}
   }
  }
  // Pelvis: a pounce arc, a hop while both feet are off the ground in a run,
  // a landing squash spring, and a little drop (at most 5 cm) to reach.
  const arc=dodge?Math.sin(Math.PI*smooth(0,.82,dodge.p))*.13-.05*(1-smooth(0,.12,dodge.p)):-.05*smooth(0,1,ctx.pounce||0);
  if(dodge&&dodge.p>=.82&&!this.landedSquash){this.squashRate-=1.6;this.landedSquash=true;}if(!dodge)this.landedSquash=false;
  this.squashRate+=(-this.squash*260)*dt;this.squashRate*=Math.exp(-dt*16);this.squash+=this.squashRate*dt;
  const g=this.gait,flightTime=g&&g.duty<.5?(.5-g.duty)*g.period:0;this.flight=flightTime&&this.feet.every(f=>f.swing)?(this.flight||0)+dt:0;
  const hop=flightTime?Math.min(.05,9.81*flightTime*flightTime/8)*Math.sin(Math.PI*Math.min(1,this.flight/flightTime)):0;
  root.position.y+=arc+hop+Math.max(-.06,this.squash*.05)-.012*Math.min(1,speed/2.5);m.updateMatrixWorld(true);
  const targets=this.feet.map((f,i)=>airborne?pos(f.thigh).add(new T.Vector3(0,-.17,0)).addScaledVector(fwd,.04).addScaledVector(dodge.dir,-.03):f.pos.clone().add(new T.Vector3(0,f.lift||0,0)));
  let drop=0;for(const [i,f]of this.feet.entries()){const d=pos(f.thigh).distanceTo(targets[i])-(f.l1+f.l2)*.985;drop=Math.max(drop,d);}
  this.drop+=(Math.min(LIFE.foot.maxDrop,Math.max(0,drop))-this.drop)*Math.min(1,dt*30);root.position.y-=this.drop;m.updateMatrixWorld(true);
  for(const [i,f]of this.feet.entries()){
   const a=pos(f.thigh),target=targets[i],l1=f.l1,l2=f.l2,dir=target.clone().sub(a),dist=Math.max(Math.abs(l1-l2)+1e-4,Math.min(l1+l2-1e-4,dir.length()));dir.normalize();
   const along=(l1*l1-l2*l2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,l1*l1-along*along)),pole=fwd.clone().add(side.clone().multiplyScalar(f.sign*-.15)).addScaledVector(dir,-fwd.dot(dir)).normalize(),knee=a.clone().addScaledVector(dir,along).addScaledVector(pole,h);
   const set=(o,from,to)=>this.rotateWorld(o,new T.Quaternion().setFromUnitVectors(from.normalize(),to.normalize()));
   set(f.thigh,pos(f.knee).sub(a),knee.clone().sub(a));set(f.knee,pos(f.foot).sub(pos(f.knee)),target.clone().sub(pos(f.knee)));
   const pitch=f.swing?-.45*Math.sin(Math.PI*Math.min(1,f.swing.p)):airborne?-.5:0,yawQ=new T.Quaternion().setFromAxisAngle(UP,f.yaw),footQ=yawQ.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-pitch)).multiply(f.flat);
   const pq=f.foot.parent.getWorldQuaternion(new T.Quaternion());f.foot.quaternion.copy(pq.invert().multiply(footQ));f.foot.updateMatrixWorld(true);
  }
 }
}
