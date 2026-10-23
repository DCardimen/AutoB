import * as T from 'three';
import {BipedController} from './biped-controller.mjs';
import {NOCK} from './fox-motion.mjs';
import {createBrute} from './training-brute.mjs';
import {FoxLife} from './fox-life.mjs';

// Replays a fight recorded from the game's own Battle engine
// (scripts/record-game-skirmish.mjs). Every decision is the game's:
// positions, facing, each arrow and when it leaves the bow, the Fan, Brakk's
// strikes, Sundering Rush and dodge rolls, Rowan's sidesteps, knockback,
// staggers, damage and the knockout. The 3D scene only visualizes them.
// Units map by the game's own size rule: a creature is 120 x its world scale
// tall, so Rowan's 45.6 units span the 3D fox's 1.10 m.
// The archery set runs on the game's own timing: each draw is the 0.26 s
// windup ending on the shot, then release, reload and a ready hold. The
// legs are not clips: the life layer plants the feet and steps them along
// the game's actual motion at its real speed, and plays sidesteps as
// pounces. Tail, ears, eyelids, weight, hits, bow and quiver come from it.
export const FOX_HEIGHT=1.102,ARCHERY={draw:.26,release:.24,reload:.55,nock:.30,enter:.70,exit:.70,victory:1.6,grab:{enter:.24,reload:.15},shot:{windup:.26,recovery:.24},skill:{windup:.40,recovery:.34}};
const LOWER=/^(Biped_Motion_Root|smartrigHips|smartrigSpine|smartrig(Left|Right)(UpLeg|Leg|Foot|ToeBase|Toe_End)|Bone_01[5-9]|Jump_Ground_Dust_\d)$/;
const DODGE_TIME=.34;
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
 // Archery from the game's shots, on the game's own timing (game.js, rules
 // v17): an auto shot leaves 0.26 s after its windup starts and recovers for
 // 0.24 s; a skill shot (the Moontrail Fan) winds up 0.40 s and recovers
 // 0.34 s. Each draw ends on the shot and the release fills the recovery.
 // Between shots the paw fetches the next arrow in the time left before the
 // next draw: a full reload from the quiver, or with less room, a spare arrow
 // it holds nocked straight from the anchor, as in rapid fire; when even that
 // leaves no room, the nock and the draw share the gap. The fox readies at the
 // start and, after the knockout, puts the arrow away and celebrates.
 const A=ARCHERY,shots=ev.filter(e=>e.type==='shot'&&e.source===0),defeated=ev.find(e=>e.type==='defeated'),segments=[{clip:'Bow_Ready_Enter',t0:0,t1:A.enter,rate:1,grab:A.grab.enter}];
 const timing=s=>String(s.skill).startsWith('auto')?A.shot:A.skill,draw=(s,t0)=>segments.push({clip:'Bow_Draw',t0,t1:s.t,rate:A.draw/(s.t-t0),shot:s});
 // A knockout right after the last shot leaves nothing to reload.
 const closing=defeated&&shots.length&&defeated.t-shots.at(-1).t<timing(shots.at(-1)).recovery+A.reload+.3;
 if(shots.length)draw(shots[0],shots[0].t-A.draw);
 shots.forEach((s,k)=>{const e=s.t+timing(s).recovery,next=shots[k+1],last=k===shots.length-1&&closing,room=next?next.t-e:Infinity;
  segments.push({clip:'Bow_Release',t0:s.t,t1:e,rate:A.release/(e-s.t),shot:s});if(last)return;
  if(room>=A.draw+.45){const fetch=Math.min(A.reload,room-A.draw),rate=A.reload/fetch;segments.push({clip:'Bow_Reload',t0:e,t1:e+fetch,rate,grab:e+A.grab.reload/rate,shot:s});if(next)draw(next,next.t-A.draw);}
  else if(room>=A.draw+.14){const fetch=Math.min(A.nock,room-A.draw);segments.push({clip:'Bow_Nock',t0:e,t1:e+fetch,rate:A.nock/fetch,shot:s});draw(next,next.t-A.draw);}
  else{const fetch=.4*room;segments.push({clip:'Bow_Nock',t0:e,t1:e+fetch,rate:A.nock/fetch,shot:s});draw(next,e+fetch);}});
 // Then an arrow still on the string goes back to the quiver before the fox
 // celebrates.
 const lastEnd=shots.length?shots.at(-1).t+timing(shots.at(-1)).recovery:0,exitAt=defeated?Math.max(defeated.t+.15,lastEnd):Infinity,victoryAt=closing?Math.max(lastEnd,defeated.t):exitAt+A.exit;
 if(defeated){if(!closing)segments.push({clip:'Bow_Ready_Exit',t0:exitAt,t1:victoryAt,rate:1});segments.push({clip:'Victory',t0:victoryAt,t1:victoryAt+A.victory,rate:1,fade:.35});}
 const segmentAt=t=>{let best=null;for(const g of segments)if(t>=g.t0&&t<g.t1&&(!best||g.t0>=best.t0))best=g;return best;};
 // A sidestep's side is decided once, from the facing when it starts (the
 // game turns toward the roll while it runs).
 const dodges=ev.filter(e=>e.type==='dodge'&&e.unit===0).map(d=>{const f=frames[Math.min(frames.length-1,Math.round(d.t/recording.step))].u[0].f,local=new T.Vector3(d.dx,0,d.dy).applyAxisAngle(new T.Vector3(0,1,0),-Math.atan2(Math.cos(f),Math.sin(f)));return {...d,side:local.x<0?-1:1};}),bruteRolls=ev.filter(e=>e.type==='dodge'&&e.unit===1),strikes=ev.filter(e=>e.type==='strike'&&e.source===1);
 const foxHits=ev.filter(e=>e.type==='damage'&&e.target===0&&e.amount>=8);
 const state={time:0,arrows:[],spawned:new Set(),aim:0,track:0,label:'',lastHits:new Set(),nock:null,idle:0,prevT:-1,wasStaggered:false};
 const life=new FoxLife(fox);
 const bars=[0,1].map(()=>{const g=new T.Group(),back=new T.Mesh(new T.PlaneGeometry(.5,.055),new T.MeshBasicMaterial({color:'#1b2226',transparent:true,opacity:.78,depthWrite:false})),fill=new T.Mesh(new T.PlaneGeometry(.47,.032),new T.MeshBasicMaterial({color:'#e2603d',depthWrite:false}));fill.position.z=.001;g.add(back,fill);scene.add(g);return {g,fill};});
 bars[0].fill.material.color.set('#7cd36b');
 const pow=new T.Mesh(new T.OctahedronGeometry(.14,0),new T.MeshBasicMaterial({color:'#ffe08a',transparent:true,opacity:0,depthWrite:false}));scene.add(pow);let powAge=9;
 function labelAt(t){const g=segmentAt(t),dodge=dodges.find(d=>t>=d.t&&t<d.t+DODGE_TIME),strike=strikes.find(s=>t>=s.t&&t<s.t+s.windup+s.recovery),roll=bruteRolls.find(r=>t>=r.t&&t<r.t+.32);
  if(g?.clip==='Victory')return 'Victory';if(defeated&&t>=defeated.t)return 'Brakk is knocked out';if(dodge)return 'Rowan pounces clear of the telegraphed strike';if(strike)return strike.skill==='brakk'?'Brakk: Sundering Rush':strike.charged?'Brakk: charged strike':'Brakk: Ironjaw Cleave';if(roll)return 'Brakk rolls away from the arrow';
  if(g?.clip==='Bow_Draw')return g.shot.skill==='rowan'?"Rowan draws the Moontrail Fan (the game's 0.40 s windup)":"Rowan draws (the game's 0.26 s windup)";if(g?.clip==='Bow_Release')return g.shot.skill==='rowan'?'Rowan: Moontrail Fan':'Rowan: Moontrail Arrow';if(g?.clip==='Bow_Reload')return 'Rowan reloads from the quiver';if(g?.clip==='Bow_Nock')return 'Rowan nocks a held arrow (rapid fire)';if(g?.clip==='Bow_Ready_Enter')return 'Rowan readies an arrow';return 'Rowan holds ready';}
 function animate(t,dt){
  const r=unit(0,t),g=segmentAt(t),dodge=dodges.find(d=>t>=d.t&&t<d.t+DODGE_TIME),staggered=r.stg>0||r.kd>0,b2=unit(1,t),afterVictory=defeated&&t>=victoryAt+A.victory;
  fox.position.copy(world(r.x,r.y));fox.rotation.y=yawOf(r.f);
  if(g)upper.play(g.clip+'@'+g.t0.toFixed(3),{time:(g.time0||0)+(t-g.t0)*g.rate,rate:g.rate,fade:g.fade??(/Draw|Release/.test(g.clip)?.05:.12),loop:false,mix:[[g.clip,1]]});
  else if(afterVictory)upper.play('Idle',{time:t%8,rate:1,fade:.3});else upper.play('Bow_Ready',{time:t%2,rate:1,fade:.12});
  lower.play('Idle',{time:t%8,rate:1,fade:.2});
  lower.step(dt);upper.step(dt);controller.restore();life.restore();lower.apply();upper.apply();mixer.update(0);
  // The game owns ground position: drop the clips' own travel, keep height.
  root.position.x=0;root.position.z=0;fox.updateMatrixWorld(true);
  // The nocked arrow's pose at the end of the draw is where the shot leaves.
  if(g?.clip==='Bow_Draw'){const c=clipArrows[0];state.nock={p:c.getWorldPosition(new T.Vector3()),q:c.getWorldQuaternion(new T.Quaternion())};}
  const released=g?.clip==='Bow_Release'&&!state.spawned.has(g.shot.t);if(released)spawnArrows(g.shot);
  const aiming=!!g&&/Draw|Release/.test(g.clip);state.aim+=((aiming?1:0)-state.aim)*Math.min(1,dt*10);state.track+=((staggered?.3:1)-state.track)*Math.min(1,dt*6);
  const lead=brute.chest().add(new T.Vector3(b2.vx/U,0,b2.vy/U).multiplyScalar(Math.min(.22,Math.hypot(b2.x-r.x,b2.y-r.y)/410)));
  // Aim and gaze ease toward their points, so a target that jumps (a dodge
  // roll) is crossed in a quick turn rather than one frame.
  const ease=1-Math.exp(-dt*12),want=state.aim>.5?lead:brute.headPoint();state.aimPoint=state.aimPoint?state.aimPoint.lerp(want,ease):want.clone();state.lookPoint=state.lookPoint?state.lookPoint.lerp(brute.headPoint(),ease):brute.headPoint();
  const nocked=clipArrows[0].scale.x>.1;
  // Life: the body (feet, weight, hits, tail spring) before the aim and the
  // tail clearance, the face and props (ears, eyelids, bow, quiver) after.
  const away=()=>fox.position.clone().sub(brute.root.position).setY(0).normalize(),hits=[];
  for(const h of ev)if(h.type==='damage'&&h.target===0&&h.t>state.prevT&&h.t<=t&&h.amount>=2)hits.push({amount:h.amount/rowanInfo.maxHp,dir:away()});
  if(staggered&&!state.wasStaggered)hits.push({amount:.3,dir:away()});state.wasStaggered=staggered;
  state.idle=afterVictory&&r.speed<.15?state.idle+dt:0;
  const soon=dodges.find(d=>d.t>t&&d.t-t<.1),lifeCtx={dt,skid:staggered,pounce:soon?1-(soon.t-t)/.1:0,velocity:new T.Vector3(r.vx/U,0,r.vy/U),dodge:dodge?{p:(t-dodge.t)/DODGE_TIME,dir:new T.Vector3(dodge.dx,0,dodge.dy).normalize(),side:dodge.side}:null,hits,hpFrac:r.hp/rowanInfo.maxHp,aim:state.aim,released,grab:g?.grab!==undefined&&state.prevT<g.grab&&t>=g.grab,idle:state.idle,victory:defeated&&t>=victoryAt?t-victoryAt:-1,targetDir:defeated?null:brute.root.position.clone().sub(fox.position).setY(0).normalize()};
  life.body(lifeCtx);
  controller.apply({mode:aiming?'attack':'idle',clipTime:nocked&&aiming?NOCK+.01:0,ambientTime:t,target:defeated&&t>defeated.t+.8?null:state.aimPoint.clone(),look:state.lookPoint.clone(),weights:{track:state.track,aim:state.aim,turn:0},resolve:true});
  life.face(lifeCtx);
  fox.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
  for(const h of foxHits)if(t>=h.t&&!state.lastHits.has(h.t)){state.lastHits.add(h.t);powAge=0;pow.position.copy(root.getWorldPosition(new T.Vector3())).setY(.6);}
  state.prevT=t;
 }
 function spawnArrows(shot){
  state.spawned.add(shot.t);const end=ev.find(e=>e.type==='shotEnd'&&e.key===shot.key),hit=ev.find(e=>e.type==='damage'&&e.target===1&&e.source===0&&Math.abs(e.t-(end?.t??shot.t))<.05),c=clipArrows[0];
  const mesh=c.clone(true);mesh.position.copy(state.nock?.p??c.getWorldPosition(new T.Vector3()));mesh.quaternion.copy(state.nock?.q??new T.Quaternion());mesh.scale.setScalar(.65);mesh.visible=true;flight.add(mesh);
  state.arrows.push({mesh,from:mesh.position.clone(),speed:shot.speed/U,start:shot.t,end,hit:!!hit,stuck:false});
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
 function reset(){for(const a of state.arrows)a.mesh.removeFromParent();Object.assign(state,{time:0,arrows:[],spawned:new Set(),aim:0,track:0,lastHits:new Set(),aimPoint:null,lookPoint:null,nock:null,idle:0,prevT:-1,wasStaggered:false});life.reset();brute.reset();lower.cur=upper.cur=null;lower.out=[];upper.out=[];cameraReady=false;powAge=9;step(0);state.time=0;}
 const end=defeated?victoryAt+A.victory+.8:recording.duration+1;
 return {fox,brute,life,controller,state,segments,recording,U,reset,step,camera,get layers(){return {lower:lower.cur&&{key:lower.cur.key,time:+lower.cur.time.toFixed(3),rate:+lower.cur.rate.toFixed(2)},upper:upper.cur&&{key:upper.cur.key,time:+upper.cur.time.toFixed(3),rate:+upper.cur.rate.toFixed(2)},upperOut:upper.out.map(o=>o.key+':'+o.from.toFixed(2))};},get focus(){return look;},get finished(){return state.time>=end;},end,
  summary:()=>({source:recording.source,rulesVersion:recording.rulesVersion,winner:recording.winner,duration:recording.duration,unitsPerMeter:U,units:recording.units,shots:shots.length,segments:segments.map(g=>({clip:g.clip,t0:+g.t0.toFixed(3),t1:+g.t1.toFixed(3),rate:+g.rate.toFixed(3)})),dodges:dodges.length,strikes:strikes.map(s=>({t:s.t,skill:s.skill,windup:s.windup,charged:s.charged})),arrowsStuck:state.arrows.filter(a=>a.stuck).length,hitsOnBrakk:ev.filter(e=>e.type==='damage'&&e.target===1&&e.source===0).length})};
}
