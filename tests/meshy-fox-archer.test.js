import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {BOW,CLIPS,GAIT,RELEASE,STANCE,nockOffset,settlesToIdle} from '../public/meshy-fox-preview/fox-motion.mjs';
import {FoxPreviewController} from '../public/meshy-fox-preview/fox-preview-controller.mjs';
import {FoxActor,KITE} from '../public/meshy-fox-preview/fox-actor.mjs';
import {createCombat,DURATION,HITS_TO_FELL} from '../public/meshy-fox-preview/fox-combat-sim.mjs';

globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-animated.glb');
const load=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
const asset=await load(),model=asset.scene,mixer=new T.AnimationMixer(model),node=n=>model.getObjectByName(n);
const W=n=>node(n).getWorldPosition(new T.Vector3()),Q=n=>node(n).getWorldQuaternion(new T.Quaternion());
const yawOf=q=>{const z=new T.Vector3(0,0,1).applyQuaternion(q);return Math.atan2(z.x,z.z);},deg=r=>r*180/Math.PI;
function pose(name,t){mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name);mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1).play();model.rotation.y=0;model.position.set(0,0,0);mixer.setTime(Math.min(t,clip.duration-1e-6));model.updateMatrixWorld(true);node('FoxMesh').skeleton.update();return clip;}
const interior=s=>{const a=W('UpperArm_'+s),b=W('Forearm_'+s),c=W('Hand_'+s);return 180-deg(b.clone().sub(a).angleTo(c.clone().sub(b)));};
const footYaw=s=>{const x=new T.Vector3(0,0,1).applyQuaternion(Q('Foot_'+s));return deg(Math.atan2(x.x,x.z));};

test('full draw: the trunk winds up over square hips while the head stays on the target',()=>{
 pose('Bow_Attack',1.1);
 const pelvis=deg(yawOf(Q('Pelvis'))),chest=deg(yawOf(Q('Chest'))),head=deg(yawOf(Q('Head')));
 // The split stance keeps the hips square; the spine and chest carry the turn.
 assert.ok(chest>40&&chest<55,`chest ${chest}`);assert.ok(Math.abs(pelvis)<3,`square hips ${pelvis}`);
 assert.ok(Math.abs(head)<2,`face on target ${head}`);
 // The neck shares the counter-rotation, so the collar is not wrung by one joint.
 const neck=deg(yawOf(Q('Neck')));assert.ok(neck>head+8&&neck<chest-8,`neck between chest and head ${neck}`);
});

test('full draw: bow arm locked toward the target, draw elbow folded back at shoulder height',()=>{
 pose('Bow_Attack',1.1);
 assert.ok(interior('R')>155,`bow arm ${interior('R')}`);assert.ok(interior('L')<115,`draw elbow ${interior('L')}`);
 const nock=node('Bow_Right_Hand').localToWorld(new T.Vector3(nockOffset(1),BOW.nockY,0)),elbow=W('Forearm_L'),shoulder=W('UpperArm_L');
 assert.ok(nock.z-elbow.z>.15,`elbow behind the nock ${nock.z-elbow.z}`);assert.ok(Math.abs(elbow.y-shoulder.y)<.06,'elbow level with the shoulder');
 // The arrow line runs under the left eye (x=.169), so the fox sights along it.
 assert.ok(Math.abs(nock.x-.2)<.04);
 const forward=new T.Vector3(-1,0,0).applyQuaternion(Q('Bow_Right_Hand'));assert.ok(forward.z>.9999);
});

test('open stance: front paw steps toward the target, rear paw steps back and turns out',()=>{
 const F=STANCE.front,R=F==='L'?'R':'L',out=s=>s==='L'?1:-1;
 // v2: the shot loop is already in stance; the paws step from Idle's stance.
 pose('Idle',0);const restF=W('Foot_'+F),restR=W('Foot_'+R);
 pose('Bow_Attack',1.1);const front=W('Foot_'+F),rear=W('Foot_'+R);
 assert.ok(front.z-rear.z>.18,`stance depth ${front.z-rear.z}`);assert.ok(front.z>restF.z+.08&&rear.z<restR.z-.08);
 assert.ok(Math.abs(footYaw(F))<15,`front paw points at target ${footYaw(F)}`);assert.ok(out(R)*footYaw(R)>75,`rear paw turned out ${footYaw(R)}`);
 for(const s of ['R','L']){const n=new T.Vector3(0,1,0).applyQuaternion(Q('Foot_'+s));assert.ok(n.y>.9999,'flat sole');assert.ok(Math.abs(W('Foot_'+s).y-.125)<1e-4,'planted');}
 // Each paw is one lifted step in (Bow_Attack_Enter) and one out
 // (Bow_Attack_Exit), and leaving the stance fully recovers Idle's.
 for(const [clip,s,t]of [['Bow_Attack_Enter',F,.12],['Bow_Attack_Enter',R,.26],['Bow_Attack_Exit',R,.15],['Bow_Attack_Exit',F,.34]]){pose(clip,t);assert.ok(W('Foot_'+s).y>.15,`${clip} ${s} lifted at ${t}`);}
 pose('Bow_Attack_Exit',CLIPS.attackExit.duration);assert.ok(W('Foot_'+F).distanceTo(restF)<1e-3&&W('Foot_'+R).distanceTo(restR)<1e-3);
});

test('push-pull draw, back tension at anchor and a real follow-through',()=>{
 const reach=t=>{pose('Bow_Attack',t);return W('UpperArm_R').distanceTo(W('Hand_R'));},string=t=>{pose('Bow_Attack',t);return node('BowStringDraw').morphTargetInfluences[0];};
 assert.ok(reach(.55)<reach(1.0)-.008,'bow arm pushes out while drawing');assert.ok(string(.55)<.1&&string(1.15)>.999,'string drawn to anchor');
 pose('Bow_Attack',1.03);const early=node('Clavicle_L').position.z;pose('Bow_Attack',RELEASE-.01);assert.ok(node('Clavicle_L').position.z<early-.004,'draw shoulder creeps back at anchor');
 pose('Bow_Attack',RELEASE-.01);const anchor=node('Hand_L').localToWorld(new T.Vector3(.13,0,0)),tipBefore=node('Bow_Right_Hand').localToWorld(new T.Vector3(BOW.brace,.29,0));
 pose('Bow_Attack',RELEASE+.16);const after=node('Hand_L').localToWorld(new T.Vector3(.13,0,0)),tipAfter=node('Bow_Right_Hand').localToWorld(new T.Vector3(BOW.brace,.29,0));
 assert.ok(after.z<anchor.z-.04&&after.x>anchor.x+.08,'released paw slides back and out');assert.ok(tipAfter.z>tipBefore.z+.03,'bow tips forward in the relaxed paw');
 assert.ok(new T.Vector3(-1,0,0).applyQuaternion(Q('Arrow_Nock_and_Flight')).z>.9999,'loosed arrow keeps the aim line');
});

test('turns start and end exactly on Idle, led by the head, with stepping paws',()=>{
 const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o.name);});
 const snap=()=>Object.fromEntries(bones.map(b=>[b,{p:W(b),q:Q(b)}]));
 pose('Idle',0);const idle=snap();
 for(const mode of ['turnLeft45','turnRight45','turnLeft90','turnRight90','quickTurnLeft','quickTurnRight']){
  const {name,turn,duration}=CLIPS[mode];pose(name,0);const first=snap();pose(name,duration);const last=snap(),r=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),turn);
  for(const b of bones){assert.ok(last[b].p.distanceTo(idle[b].p.clone().applyQuaternion(r))<1e-5&&last[b].q.angleTo(r.clone().multiply(idle[b].q))<1e-3,`${name} end ${b}`);assert.ok(first[b].p.distanceTo(idle[b].p)<1e-5&&first[b].q.angleTo(idle[b].q)<1e-3,`${name} start ${b}`);}
  pose(name,duration*.4);const h=yawOf(Q('Head'))/turn,c=yawOf(Q('Chest'))/turn,p=yawOf(Q('Pelvis'))/turn;assert.ok(h>c&&c>p,`${name} head ${h} chest ${c} hips ${p}`);
  for(const s of ['R','L']){let lifted=0;for(let i=0;i<=40;i++){pose(name,i/40*duration);if(W('Foot_'+s).y>.14)lifted++;}assert.ok(lifted>2,`${name} ${s} steps`);}
 }
});

test('gait: arms swing against the opposite paw and the gaze stays level',()=>{
 const corr=(a,b)=>{const m=x=>x.reduce((s,v)=>s+v,0)/x.length,ma=m(a),mb=m(b);let s=0,sa=0,sb=0;for(let i=0;i<a.length;i++){s+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2;}return s/Math.sqrt(sa*sb);};
 for(const [name,minimum]of [['Run',.9],['Walk',.85]]){
  const clip=pose(name,0),hR=[],fL=[],hL=[],fR=[],chest=[],head=[];
  for(let f=0;f<120;f++){pose(name,f/120*clip.duration);hR.push(W('Hand_R').z);hL.push(W('Hand_L').z);fR.push(W('Foot_R').z);fL.push(W('Foot_L').z);chest.push(yawOf(Q('Chest')));head.push(yawOf(Q('Head')));}
  assert.ok(corr(hR,fL)>minimum&&corr(hL,fR)>minimum,`${name} contralateral swing`);
  const range=a=>Math.max(...a)-Math.min(...a);assert.ok(range(head)<.25*range(chest),`${name} head stabilised ${range(head)} vs ${range(chest)}`);
 }
});

test('looking around turns the spine, chest and neck with the head, and restores cleanly',()=>{
 const controller=new FoxPreviewController(model);
 for(const angle of [-.6,.6]){
  pose('Idle',.5);const rest=['Spine','Chest','Neck'].map(n=>node(n).quaternion.clone());
  const target=new T.Vector3(Math.sin(angle)*3,1.0,Math.cos(angle)*3);controller.apply({mode:'idle',clipTime:.5,ambientTime:4,target});
  const shares=['Spine','Chest','Neck'].map((n,i)=>2*Math.asin(Math.min(1,Math.abs(new T.Quaternion().copy(rest[i]).invert().multiply(node(n).quaternion).y)))*Math.sign(angle));
  assert.ok(shares.every(s=>Math.sign(s)===Math.sign(angle)&&Math.abs(s)>.03),`trunk follows ${shares}`);assert.ok(Math.abs(shares[0])<Math.abs(shares[2]),'share grows toward the head');
  const forward=new T.Vector3(0,0,1).applyQuaternion(Q('Head')),toward=target.clone().sub(W('Head')).normalize();assert.ok(forward.dot(toward)>.9999);
  controller.restore();
 }
});

// Largest per-frame acceleration of any body bone, in metres per frame².
function roughness(frames){let worst=0;for(let f=1;f<frames.length-1;f++)for(let k=0;k<frames[f].length;k++)worst=Math.max(worst,frames[f+1][k].clone().sub(frames[f][k].clone().multiplyScalar(2)).add(frames[f-1][k]).length());return worst;}
const bodyBones=root=>{const list=[];root.traverse(o=>{if(o.isBone&&!/^(Cape|Tail)/.test(o.name))list.push(o);});return list;};
let baked=null;
function bakedRoughness(){if(baked!==null)return baked;const m=new T.AnimationMixer(model),values=[];for(const clip of asset.animations){m.stopAllAction();m.clipAction(clip).play();const f=[];for(let i=0;i<=Math.round(clip.duration*60);i++){m.setTime(Math.min(i/60,clip.duration-1e-6));model.updateMatrixWorld(true);f.push(bodyBones(model).map(o=>o.getWorldPosition(new T.Vector3())));}values.push(roughness(f));}m.stopAllAction();return baked=Math.max(...values);}

test('actor cross-fades clips and commits root motion without pops',async()=>{
 const actor=new FoxActor(await load()),bones=bodyBones(actor.model),frames=[];
 const frame=()=>{actor.step(1/60);frames.push(bones.map(o=>o.getWorldPosition(new T.Vector3())));};
 for(let i=0;i<60;i++)frame();actor.turnTo(Math.PI,['dashBack','dash','idle']);for(let i=0;i<300;i++)frame();
 actor.play('run');for(let i=0;i<60;i++)frame();actor.turnTo(0,['run'],{quick:true});for(let i=0;i<90;i++)frame();actor.stop();for(let i=0;i<70;i++)frame();
 assert.deepEqual(actor.history.map(h=>h.mode),['idle','turnLeft90','turnLeft90','dashBack','dash','idle','run','quickTurnRight','run','runStop','idle']);
 assert.ok(Math.abs(actor.model.rotation.y)<1e-6);
 // Clip changes add no acceleration beyond what the clips themselves contain.
 assert.ok(roughness(frames)<1.15*bakedRoughness(),`sequence ${roughness(frames)} vs baked ${bakedRoughness()}`);
});


test('scripted skirmish: smooth transitions, gaze follows, every arrow lands, the archer kites, pivots, runs and stops',async()=>{
 const combat=createCombat(await load(),new T.Scene()),bones=bodyBones(combat.fox),frames=[];combat.reset();
 while(combat.state.time<DURATION-1e-9){combat.step();frames.push(bones.map(o=>o.getWorldPosition(new T.Vector3())));}
 const s=combat.summary();
 assert.equal(s.shots,HITS_TO_FELL);assert.equal(s.hits,HITS_TO_FELL);assert.ok(s.defeated>0);
 // Settled tracking is exact; a new look target is crossed as a turn of the
 // head, never a one-frame snap (the quick pivot is the fastest, by design).
 assert.ok(s.gaze.settledSamples>900&&s.gaze.settledP95Degrees<.05,`gaze ${JSON.stringify(s.gaze)}`);assert.ok(s.gaze.maxSwingDegreesPerFrame<16);
 for(const shot of s.shotsDetail)assert.ok(Math.abs(shot.hit.height-.72)<.05,'arrow meets the dummy at chest height');
 const modes=s.history.map(h=>h.mode);for(const m of ['dashBack','run','dash','attackEnter','attackExit','attack','attackUpright','attackTilted'])assert.ok(modes.includes(m),m);assert.ok(modes.some(m=>/^runStop/.test(m)),'braking stop');
 assert.ok(modes.some(m=>m.startsWith('quickTurn'))&&modes.some(m=>/^turn(Left|Right)/.test(m)));assert.ok(new Set(modes.filter(m=>KITE.includes(m))).size>=3,'kiting blends several directions');
 // No transition is rougher than the baked clips themselves.
 const fight=roughness(frames);assert.ok(fight<1.15*bakedRoughness(),`fight ${fight} vs baked ${bakedRoughness()}`);
});

test('run: flight phase, high knees, pumping bent arms and a full stride',()=>{
 const clip=pose('Run',0);let flight=0,elbow=180;const z=[];
 for(let f=0;f<64;f++){pose('Run',f/64*clip.duration);if(W('Foot_R').y>.128&&W('Foot_L').y>.128)flight++;elbow=Math.min(elbow,interior('L'));z.push(W('Foot_R').z);}
 assert.ok(flight>=4,`both paws off the ground ${flight}/64`);assert.ok(elbow<110,`draw-side elbow pumps bent ${elbow}`);
 assert.ok(Math.max(...z)-Math.min(...z)>2*GAIT.run.stride&&GAIT.run.stride>1.4*GAIT.walk.stride,'running stride well beyond walking');
});

test('tail sways constantly rather than resting between swishes',()=>{
 pose('Idle',0);let previous=W('Tail_05'),still=0,longest=0;
 for(let f=1;f<=480;f++){pose('Idle',f/60);const p=W('Tail_05'),moved=p.distanceTo(previous)*60;previous=p;if(moved<.02){still++;longest=Math.max(longest,still);}else still=0;}
 assert.ok(longest<12,`tail tip rests for ${longest} frames`);
});

test('kiting legs step along all eight travel directions with planted paws',()=>{
 for(const mode of KITE){
  const {name,travel}=CLIPS[mode],v=new T.Vector3(...CLIPS[mode].velocity);assert.ok(Math.abs(Math.atan2(v.x,v.z)-travel)<1e-9||Math.abs(Math.abs(travel)-Math.PI)<1e-9);
  for(const [side,start]of [['R',.10],['L',.65]]){const points=[];for(const t of [start,start+.05,start+.10]){pose(name,t);model.position.copy(v.clone().multiplyScalar(t));model.updateMatrixWorld(true);points.push(W('Foot_'+side));}model.position.set(0,0,0);
   for(const p of points)assert.ok(p.distanceTo(points[0])<.001,`${name} ${side} planted`);}
  // Toes turn toward a lateral travel direction.
  if(Math.abs(Math.sin(travel))>.6){pose(name,1.1);assert.ok(Math.sign(footYaw('R'))===Math.sign(Math.sin(travel)*(Math.cos(travel)<-.1?-1:1)),`${name} toes toward travel`);}
 }
});

test('run stop brakes from the crouch and settles exactly into Idle',()=>{
 const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o.name);});pose('Idle',0);const idle=Object.fromEntries(bones.map(b=>[b,{p:W(b),q:Q(b)}]));
 const {name,duration}=CLIPS.runStop;pose(name,0);const crouch=W('Pelvis').y;pose(name,.25);const lean=new T.Vector3(0,1,0).applyQuaternion(Q('Chest')).z;
 assert.ok(crouch<idle.Pelvis.p.y-.03,'starts at the run crouch');assert.ok(lean<-.05,'trunk leans back against the brake');
 pose(name,duration);const slide=W('Root').z-idle.Root.p.z;assert.ok(slide>.08,`slides ${slide}`);
 for(const b of bones){const want=idle[b].p.clone().add(new T.Vector3(0,0,slide));assert.ok(W(b).distanceTo(want)<1e-5&&Q(b).angleTo(idle[b].q)<1e-3,`${b} settles`);}
});
