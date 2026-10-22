import * as T from 'three';
import {BipedController} from './biped-controller.mjs';
import {NOCK,RELEASE} from './fox-motion.mjs';
import {createBrute} from './training-brute.mjs';

// Replays a fight recorded from the game's own Battle engine
// (scripts/record-game-skirmish.mjs). Every decision is the game's:
// positions, facing, each arrow and when it leaves the bow, the Fan, Brakk's
// strikes, Sundering Rush and dodge rolls, Rowan's sidesteps, knockback,
// staggers, damage and the knockout. The 3D scene only visualizes them.
// Units map by the game's own size rule: a creature is 120 x its world scale
// tall, so Rowan's 45.6 units span the 3D fox's 1.10 m.
// Game movement is fast for these clips, so they play faster (user choice):
// legs run at the game's measured speed, sidesteps become airborne flips, and
// shot clips are timed so the string releases on the game's shot.
export const FOX_HEIGHT=1.102,SHOT={standing:['Bow_Attack','Bow_Attack_Upright','Bow_Attack_Tilted'],skill:'Bow_Attack_Crouched',duration:2.2};
const LOWER=/^(Biped_Motion_Root|smartrigHips|smartrigSpine|smartrig(Left|Right)(UpLeg|Leg|Foot|ToeBase|Toe_End)|Bone_01[5-9]|Jump_Ground_Dust_\d)$/;
const KITE=[['Shoot_Forward',0],['Shoot_Forward_Right',-Math.PI/4],['Shoot_Strafe_Right',-Math.PI/2],['Shoot_Backward_Right',-3*Math.PI/4],['Shoot_Backward',Math.PI],['Shoot_Backward_Left',3*Math.PI/4],['Shoot_Strafe_Left',Math.PI/2],['Shoot_Forward_Left',Math.PI/4]];
const KITE_SPEED=.16,RUN_SPEED=.71,FLIP=.95,DODGE_TIME=.34;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),smooth=(a,b,t)=>{const x=Math.min(1,Math.max(0,(t-a)/(b-a)));return x*x*(3-2*x);};

// One animation layer over a masked set of tracks: the current clip fades in
// over the whole outgoing mixture. A new clip started mid-fade keeps what is
// on screen (every entry at its displayed weight) as the outgoing blend, so
// an interrupted cross-fade never jumps.
class Layer{
 constructor(mixer,clips){this.mixer=mixer;this.clips=clips;this.pool=new Map();this.cur=null;this.out=[];}
 play(name,{time=0,rate=1,fade=.15,loop=true,mix=null}={}){
  const key=mix?mix.map(m=>m[0]).join('+'):name;
  if(this.cur&&this.cur.key===key){this.cur.rate=rate;if(mix)this.cur.mix=mix;return;}
  if(this.cur){const w=this.weight();for(const o of this.out)o.from*=1-w;this.out.push({...this.cur,from:w});this.out=this.out.filter(o=>o.from>.01);}
  this.cur={key,name,mix:mix||[[name,1]],time,rate,loop,fade,age:this.cur?0:fade};
 }
 weight(){return this.cur?smooth(0,this.cur.fade,this.cur.age):1;}
 step(dt){for(const s of [this.cur,...this.out])if(s){const d=this.clips.get(s.mix[0][0]).duration;s.time+=dt*s.rate;s.time=s.loop?((s.time%d)+d)%d:Math.min(s.time,d-1e-4);}if(this.cur){this.cur.age+=dt;if(this.cur.age>=this.cur.fade)this.out=[];}}
 apply(){const used=new Map();for(const list of this.pool.values())for(const a of list)a.enabled=false;
  const take=n=>{const list=this.pool.get(n)??[];this.pool.set(n,list);const i=used.get(n)||0;used.set(n,i+1);if(!list[i])list[i]=this.mixer.clipAction(i?this.clips.get(n).clone():this.clips.get(n));return list[i];};
  const drive=(s,scale)=>{if(scale<1e-4)return;for(const [n,weight]of s.mix){const a=take(n);a.enabled=true;a.play();a.time=Math.min(s.time,this.clips.get(n).duration-1e-4);a.setEffectiveWeight(weight*scale);}};
  const w=this.weight();if(this.cur)drive(this.cur,w);for(const o of this.out)drive(o,o.from*(1-w));}
}

export function createGameReplay(asset,scene,recording,camera=new T.PerspectiveCamera(38,16/9,.01,80)){
 const fox=asset.scene,controller=new BipedController(fox),root=fox.getObjectByName('Biped_Motion_Root'),mixer=new T.AnimationMixer(fox);
 scene.add(fox);fox.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 const [rowanInfo,brakkInfo]=recording.units,U=120*rowanInfo.scale/FOX_HEIGHT,b=recording.bounds,cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
 const world=(x,y,h=0)=>new T.Vector3((x-cx)/U,h,(y-cy)/U),yawOf=f=>Math.atan2(Math.cos(f),Math.sin(f));
 const brute=createBrute(scene,{height:120*brakkInfo.scale/U});
 // Masked clips: the legs layer and the upper-body layer never share a track.
 const split=test=>new Map(asset.animations.map(c=>[c.name,new T.AnimationClip(c.name,c.duration,c.tracks.filter(t=>test(t.name.split('.')[0])))]));
 const lower=new Layer(mixer,split(n=>LOWER.test(n))),upper=new Layer(mixer,split(n=>!LOWER.test(n)));
 const clipArrows=['Arrow_Nock_and_Flight','Arrow_Second','Arrow_Third'].map(n=>fox.getObjectByName(n)),flight=new T.Group();scene.add(flight);
 const frames=recording.frames,ev=recording.events,tick=recording.step;
 // Interpolated game state of a unit at time t.
 function unit(side,t){const i=Math.max(0,Math.min(frames.length-2,Math.floor(t/tick))),k=Math.min(1,Math.max(0,(t-frames[i].t)/tick)),a=frames[i].u[side],c=frames[i+1].u[side];
  return {...a,x:a.x+(c.x-a.x)*k,y:a.y+(c.y-a.y)*k,f:a.f+wrap(c.f-a.f)*k,hp:a.hp+(c.hp-a.hp)*k,speed:Math.hypot(c.x-a.x,c.y-a.y)/tick/U,vx:(c.x-a.x)/tick,vy:(c.y-a.y)/tick};}
 // Upper-body shot track: each arrow releases on the game's shot. Shots
 // close together run as one continuous cycle, one full clip loop between
 // releases, changing bow angle at the shared rest pose; an isolated shot
 // draws at the game's attack cadence and settles to rest.
 const rate=SHOT.duration/rowanInfo.attackInterval,shots=ev.filter(e=>e.type==='shot'&&e.source===0),schedule=[],segments=[],D=SHOT.duration,CHAIN=rowanInfo.attackInterval+.6;
 shots.forEach((s,k)=>{const clip=s.skill==='rowan'?SHOT.skill:SHOT.standing[k%SHOT.standing.length],gapIn=k?s.t-shots[k-1].t:Infinity,next=shots[k+1],gapOut=next?next.t-s.t:Infinity;
  if(gapIn>CHAIN)segments.push({clip,t0:s.t-RELEASE/rate,time0:0,rate,t1:s.t});
  if(gapOut<=CHAIN){const q=D/gapOut,mid=s.t+(D-RELEASE)/q,nextClip=next.skill==='rowan'?SHOT.skill:SHOT.standing[(k+1)%SHOT.standing.length];segments.push({clip,t0:s.t,time0:RELEASE,rate:q,t1:mid},{clip:nextClip,t0:mid,time0:0,rate:q,t1:next.t});}
  else segments.push({clip,t0:s.t,time0:RELEASE,rate,t1:s.t+(D-RELEASE)/rate});
  schedule.push({clip,release:s.t,shot:s,start:segments.find(g=>g.t1>=s.t-1e-9&&g.clip===clip)?.t0??s.t,rate,offset:0});});
 const segmentAt=t=>segments.find(g=>t>=g.t0&&t<g.t1),releaseAt=t=>schedule.find(s=>s.release<=t&&!schedule.some(o=>o.release>s.release&&o.release<=t));
 // A sidestep's side is decided once, from the facing when it starts (the
 // game turns toward the roll while it runs).
 const dodges=ev.filter(e=>e.type==='dodge'&&e.unit===0).map(d=>{const f=frames[Math.min(frames.length-1,Math.round(d.t/recording.step))].u[0].f,local=new T.Vector3(d.dx,0,d.dy).applyAxisAngle(new T.Vector3(0,1,0),-Math.atan2(Math.cos(f),Math.sin(f)));return {...d,side:local.x<0?-1:1};}),bruteRolls=ev.filter(e=>e.type==='dodge'&&e.unit===1),strikes=ev.filter(e=>e.type==='strike'&&e.source===1);
 const defeated=ev.find(e=>e.type==='defeated'),foxHits=ev.filter(e=>e.type==='damage'&&e.target===0&&e.amount>=8);
 const state={time:0,arrows:[],spawned:new Set(),released:[],aim:0,track:0,label:'',hp:[rowanInfo.maxHp,brakkInfo.maxHp],lastHits:new Set()};
 const bars=[0,1].map(()=>{const g=new T.Group(),back=new T.Mesh(new T.PlaneGeometry(.5,.055),new T.MeshBasicMaterial({color:'#1b2226',transparent:true,opacity:.78,depthWrite:false})),fill=new T.Mesh(new T.PlaneGeometry(.47,.032),new T.MeshBasicMaterial({color:'#e2603d',depthWrite:false}));fill.position.z=.001;g.add(back,fill);scene.add(g);return {g,fill};});
 bars[0].fill.material.color.set('#7cd36b');
 const pow=new T.Mesh(new T.OctahedronGeometry(.14,0),new T.MeshBasicMaterial({color:'#ffe08a',transparent:true,opacity:0,depthWrite:false}));scene.add(pow);let powAge=9;
 function labelAt(t){const g=segmentAt(t),cur=g&&schedule.find(s=>Math.abs(s.release-(g.time0===RELEASE?g.t0:g.t1))<1e-6),dodge=dodges.find(d=>t>=d.t&&t<d.t+DODGE_TIME),strike=strikes.find(s=>t>=s.t&&t<s.t+s.windup+s.recovery),roll=bruteRolls.find(r=>t>=r.t&&t<r.t+.32);
  if(defeated&&t>=defeated.t)return 'Brakk is knocked out';if(dodge)return 'Rowan sidesteps the telegraphed strike';if(strike)return strike.skill==='brakk'?'Brakk: Sundering Rush':strike.charged?'Brakk: charged strike':'Brakk: Ironjaw Cleave';if(roll)return 'Brakk rolls away from the arrow';if(cur)return cur.shot.skill==='rowan'?'Rowan: Moontrail Fan':'Rowan: Moontrail Arrow';return 'Rowan keeps range';}
 function animate(t,dt){
  const r=unit(0,t),dodge=dodges.find(d=>t>=d.t&&t<d.t+DODGE_TIME),staggered=r.stg>0||r.kd>0,seg=segmentAt(t),shot=seg?{...seg,time:seg.time0+(t-seg.t0)*seg.rate,key:seg.clip+'@'+seg.t0.toFixed(3)}:null,last=releaseAt(t);
  fox.position.copy(world(r.x,r.y));fox.rotation.y=yawOf(r.f);
  if(dodge){
   // Sidestep: an airborne flip toward the game's roll direction.
   const clip=dodge.side<0?'Side_Flip_Left':'Side_Flip_Right',time=(t-dodge.t)*FLIP/DODGE_TIME;
   for(const l of [lower,upper])l.play(clip,{time,rate:FLIP/DODGE_TIME,fade:.09,loop:false});
  }else if(staggered){for(const l of [lower,upper])l.play('Hit_Reaction',{time:.1,rate:1.6,fade:.08,loop:false});}
  else{
   if(shot)upper.play(shot.key,{time:shot.time,rate:shot.rate,fade:shot.time0===0?.08:.04,loop:false,mix:[[shot.clip,1]]});
   // Legs: standing keeps the clip's own stance; moving follows the game's
   // velocity, the forward run or the eight bow-walk directions, sped up to it.
   const speed=r.speed,local=new T.Vector3(r.vx,0,r.vy).applyAxisAngle(new T.Vector3(0,1,0),-fox.rotation.y),dir=Math.atan2(local.x,local.z);
   if(speed<.18){if(shot)lower.play(shot.key,{time:shot.time,rate:shot.rate,fade:.12,loop:false,mix:[[shot.clip,1]]});else lower.play('Idle',{time:t%8,rate:1,fade:.2});}
   else if(Math.abs(dir)<.9&&speed>.9&&!shot)lower.play('Run',{time:(t*speed/RUN_SPEED)%.64,rate:speed/RUN_SPEED,fade:.15});
   else{const sector=((wrap(-dir)/(Math.PI/4))%8+8)%8,i=Math.floor(sector)%8,f=sector-Math.floor(sector),mix=[[KITE[i][0],1-f]];if(f>1e-3)mix.push([KITE[(i+1)%8][0],f]);lower.play('kite',{time:(t*speed/KITE_SPEED)%2.2,rate:speed/KITE_SPEED,fade:.15,mix});}
   // Not shooting: relaxed arms, the run's own pump when running forward.
   if(!shot){if(lower.cur.key==='Run')upper.play('Run',{time:lower.cur.time,rate:lower.cur.rate,fade:.2});else upper.play('Idle',{time:t%8,rate:1,fade:.25});}
  }
  lower.step(dt);upper.step(dt);controller.restore();lower.apply();upper.apply();mixer.update(0);
  // The game owns ground position: drop the clips' own travel, keep height.
  root.position.x=0;root.position.z=0;
  // A sidestep keeps the flip's airborne arc and tuck, but at the game's
  // speed the full roll would spin ~200 degrees a frame: a lean replaces it.
  if(dodge){const p=(t-dodge.t)/DODGE_TIME;root.quaternion.setFromAxisAngle(new T.Vector3(0,0,1),-dodge.side*.38*Math.sin(Math.PI*Math.min(1,p)));}
  fox.updateMatrixWorld(true);
  // Clip arrows show only until release; loose arrows are the game's shots.
  if(last&&!state.spawned.has(last.release))spawnArrows(last);
  const holding=shot&&shot.time<RELEASE;for(const a of clipArrows)if(!holding)a.scale.setScalar(0);
  const b2=unit(1,t);state.aim+=((shot&&(shot.time<RELEASE+.4)?1:0)-state.aim)*Math.min(1,dt*6);state.track+=((dodge||staggered?0:1)-state.track)*Math.min(1,dt*6);
  const lead=brute.chest().add(new T.Vector3(b2.vx/U,0,b2.vy/U).multiplyScalar(Math.min(.22,Math.hypot(b2.x-r.x,b2.y-r.y)/410)));
  // Aim and gaze ease toward their points, so a target that jumps (a dodge
  // roll) is crossed in a quick turn rather than one frame.
  const ease=1-Math.exp(-dt*12),want=state.aim>.5?lead:brute.headPoint();state.aimPoint=state.aimPoint?state.aimPoint.lerp(want,ease):want.clone();state.lookPoint=state.lookPoint?state.lookPoint.lerp(brute.headPoint(),ease):brute.headPoint();
  controller.apply({mode:shot?'attack':'idle',clipTime:shot?shot.time:0,ambientTime:t,target:defeated&&t>defeated.t+.8?null:state.aimPoint.clone(),look:state.lookPoint.clone(),weights:{track:state.track,aim:state.aim,turn:0},resolve:true});
  fox.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  // Small hits flinch the face only; a stagger plays the hit reaction above.
  for(const h of foxHits)if(t>=h.t&&!state.lastHits.has(h.t)){state.lastHits.add(h.t);powAge=0;pow.position.copy(root.getWorldPosition(new T.Vector3())).setY(.6);}
 }
 function spawnArrows(shot){
  state.spawned.add(shot.release);const end=ev.find(e=>e.type==='shotEnd'&&e.key===shot.shot.key),hit=ev.find(e=>e.type==='damage'&&e.target===1&&e.source===0&&Math.abs(e.t-(end?.t??shot.release))<.05);
  for(const clip of clipArrows.slice(0,1)){const mesh=clip.clone(true);clip.getWorldPosition(mesh.position);clip.getWorldQuaternion(mesh.quaternion);mesh.scale.copy(clip.parent.getWorldScale(new T.Vector3()).multiplyScalar(.65));flight.add(mesh);
   const from=mesh.position.clone(),speed=shot.shot.speed/U;state.arrows.push({mesh,from,speed,start:shot.release,end,hit:!!hit,stuck:false,damage:hit});}
 }
 function arrowsStep(t){
  for(const a of state.arrows){if(a.stuck)continue;
   const target=a.hit?brute.chest():world(a.end?.x??0,a.end?.y??0,.45),d=target.clone().sub(a.from),len=d.length(),travel=(t-a.start)*a.speed,k=Math.min(1,travel/Math.max(len,1e-4));
   a.mesh.position.copy(a.from).addScaledVector(d,k);a.mesh.quaternion.setFromUnitVectors(new T.Vector3(-1,0,0),d.clone().normalize());
   if(k>=1){if(a.hit){a.stuck=true;brute.torso.attach(a.mesh);brute.hit(d.clone().normalize());}else{a.mesh.visible=travel<len+3;}}}
 }
 function bruteStep(t,dt){
  const s=unit(1,t),dead=defeated&&t>=defeated.t?t-defeated.t:-1,strike=strikes.find(x=>t>=x.t&&t<x.t+x.windup+x.recovery+.2),roll=bruteRolls.find(x=>t>=x.t&&t<x.t+.32);
  let action=null;
  if(strike){const p=Math.min(1,(t-strike.t)/strike.windup),rec=t>strike.t+strike.windup?Math.min(1,(t-strike.t-strike.windup)/(strike.recovery+.2)):0;action={kind:'strike',p,recover:rec,style:strike.style||'overhead',charged:strike.charged,sector:{outer:(strike.reach+rowanInfo.radius)/U,arc:strike.arc??.5}};
   if(p>=1&&!state.spawned.has('impact'+strike.key)){state.spawned.add('impact'+strike.key);const yaw=yawOf(s.f);brute.impact(world(s.x,s.y).add(new T.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(strike.reach/U)));}}
  else if(s.a?.cast)action={kind:'cast',p:Math.min(1,s.a.el/s.a.w),recover:s.a.el>s.a.w?(s.a.el-s.a.w)/(s.a.d-s.a.w):0};
  else if(roll){const local=new T.Vector3(roll.dx,0,roll.dy).applyAxisAngle(new T.Vector3(0,1,0),-yawOf(s.f));action={kind:'roll',p:(t-roll.t)/.32,dir:Math.sign(local.x)};}
  brute.drive({position:world(s.x,s.y),yaw:yawOf(s.f),speed:roll||dead>=0?0:s.speed,dt,action,stagger:s.stg>0?1:0,dead});
 }
 const look=new T.Vector3(),eye=new T.Vector3();let cameraReady=false;
 function frameCamera(dt){
  const f=fox.position.clone(),mid=f.clone().lerp(brute.root.position,.45).setY(.66),axis=brute.root.position.clone().sub(f).setY(0),span=Math.max(1.6,axis.length());axis.normalize();
  let side=new T.Vector3(axis.z,0,-axis.x);if(cameraReady?side.dot(eye.clone().sub(look))<0:side.z<0)side.negate();
  const dist=2.6+span*.9,want=mid.clone().addScaledVector(side,dist*.86).addScaledVector(axis,-dist*.16).add(new T.Vector3(0,dist*.42,0));
  if(!cameraReady){look.copy(mid);eye.copy(want);cameraReady=true;}else{look.lerp(mid,1-Math.exp(-dt*5));eye.lerp(want,1-Math.exp(-dt*2.6));}
  camera.position.copy(eye);camera.lookAt(look);
  for(const [side,bar]of bars.entries()){const info=recording.units[side],u=unit(side,state.time),top=side?brute.headPoint().add(new T.Vector3(0,.42,0)):fox.getObjectByName('smartrigHead').getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.62,0)),fr=Math.max(0,u.hp/info.maxHp);
   bar.g.position.copy(top);bar.g.quaternion.copy(camera.quaternion);bar.fill.scale.x=Math.max(.001,fr);bar.fill.position.x=-.235*(1-fr);bar.g.visible=side===0||!defeated||state.time<defeated.t+.6;}
 }
 function step(dt){
  const t=state.time;bruteStep(t,dt);animate(t,dt);arrowsStep(t);
  powAge+=dt;const k=Math.min(1,powAge/.35);pow.material.opacity=.9*(1-k)*(powAge<.35?1:0);pow.scale.setScalar(.6+1.4*k);
  state.label=labelAt(t);state.time+=dt;frameCamera(dt);
 }
 function reset(){for(const a of state.arrows)a.mesh.removeFromParent();Object.assign(state,{time:0,arrows:[],spawned:new Set(),aim:0,track:0,lastHits:new Set(),aimPoint:null,lookPoint:null});brute.reset();lower.cur=upper.cur=null;lower.out=[];upper.out=[];cameraReady=false;powAge=9;step(0);state.time=0;}
 const end=(defeated?.t??recording.duration)+2.2;
 return {fox,brute,state,schedule,recording,U,reset,step,camera,get layers(){return {lower:lower.cur&&{key:lower.cur.key,time:+lower.cur.time.toFixed(3),rate:+lower.cur.rate.toFixed(2)},upper:upper.cur&&{key:upper.cur.key,time:+upper.cur.time.toFixed(3),rate:+upper.cur.rate.toFixed(2)},upperOut:upper.out.map(o=>o.key+':'+o.from.toFixed(2))};},get focus(){return look;},get finished(){return state.time>=end;},end,
  summary:()=>({source:recording.source,rulesVersion:recording.rulesVersion,winner:recording.winner,duration:recording.duration,unitsPerMeter:U,units:recording.units,shots:shots.length,releases:schedule.map(s=>({clip:s.clip,release:s.release})),segments:segments.map(g=>({clip:g.clip,t0:+g.t0.toFixed(3),t1:+g.t1.toFixed(3),time0:g.time0,rate:+g.rate.toFixed(3)})),dodges:dodges.length,strikes:strikes.map(s=>({t:s.t,skill:s.skill,windup:s.windup,charged:s.charged})),arrowsStuck:state.arrows.filter(a=>a.stuck).length,hitsOnBrakk:ev.filter(e=>e.type==='damage'&&e.target===1&&e.source===0).length})};
}
