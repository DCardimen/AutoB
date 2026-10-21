import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readGLB} from '../scripts/lib/glb.mjs';
import {ATTACKS,BOW_ANGLES,CLIPS,DASH,DODGE,NOCK,QUIVER,RELEASE,STANCE,TAIL_REST} from '../public/meshy-fox-preview/fox-motion.mjs';
import {FoxPreviewController} from '../public/meshy-fox-preview/fox-preview-controller.mjs';
import {FoxActor} from '../public/meshy-fox-preview/fox-actor.mjs';
import {EYE} from '../scripts/lib/fox-face.mjs';

// Archer v2: held stance, quiver draw, bow drop, angry face, eyelids, a
// straight tail that leaves the tunic alone, sharper turns, faster dodges and
// the run stop and turn.
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-animated.glb'),glb=readGLB('public/meshy-fox-preview/fox-animated.glb'),g=glb.json;
const load=()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
const asset=await load(),model=asset.scene,mixer=new T.AnimationMixer(model),node=n=>model.getObjectByName(n);
const W=n=>node(n).getWorldPosition(new T.Vector3()),Q=n=>node(n).getWorldQuaternion(new T.Quaternion());
const yawOf=q=>{const z=new T.Vector3(0,0,1).applyQuaternion(q);return Math.atan2(z.x,z.z);};
function pose(name,t){mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name);mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1).play();model.rotation.y=0;model.position.set(0,0,0);mixer.setTime(Math.min(t,clip.duration-1e-6));model.updateMatrixWorld(true);node('FoxMesh').skeleton.update();return clip;}
const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o.name);});
const snap=()=>Object.fromEntries(bones.map(b=>[b,{p:W(b),q:Q(b)}]));
const same=(a,b,label,p=1e-5,q=1e-3)=>{for(const n of bones)assert.ok(a[n].p.distanceTo(b[n].p)<p&&a[n].q.angleTo(b[n].q)<q,`${label}: ${n}`);};

test('standing shots hold the stance: paws planted and unmoved through every shot of every bow angle',()=>{
 const reference={};pose('Bow_Attack',0);for(const s of ['R','L'])reference[s]={p:W('Foot_'+s),q:Q('Foot_'+s)};
 for(const name of ATTACKS.map(m=>CLIPS[m].name)){const clip=pose(name,0);
  for(let f=0;f<=Math.round(clip.duration*60);f++){pose(name,f/60);for(const s of ['R','L']){assert.ok(W('Foot_'+s).distanceTo(reference[s].p)<1e-5,`${name} ${s} paw moved at ${f/60}`);assert.ok(Q('Foot_'+s).angleTo(reference[s].q)<1e-4,`${name} ${s} paw turned at ${f/60}`);}
   assert.ok(Math.abs(yawOf(Q('Pelvis')))<.02,`${name} hips stay square`);}
 }
 // The loop seals on its ready pose, so a second shot (or another bow angle)
 // continues from exactly where the first ended.
 const first=pose('Bow_Attack',0)&&snap();for(const name of ['Bow_Attack','Bow_Attack_Upright','Bow_Attack_Tilted']){pose(name,0);same(first,snap(),`${name} shares the ready pose`);pose(name,CLIPS.attack.duration);same(first,snap(),`${name} ends on the ready pose`);}
});

test('the stance is entered from Idle and left back to Idle through its own clips',()=>{
 pose('Idle',0);const idle=snap();pose('Bow_Attack',0);const ready=snap();
 pose('Bow_Attack_Enter',0);same(idle,snap(),'enter starts on Idle');pose('Bow_Attack_Enter',CLIPS.attackEnter.duration);same(ready,snap(),'enter ends on the shot loop');
 pose('Bow_Attack_Exit',0);same(ready,snap(),'exit starts on the shot loop');pose('Bow_Attack_Exit',CLIPS.attackExit.duration);same(idle,snap(),'exit ends on Idle');
});

test('the runtime holds the stance across shots, cycles bow angles at the ready pose and steps out only to stand',async()=>{
 const actor=new FoxActor(await load());actor.bowAngles=['attack','attackUpright','attackTilted'];
 const feet=[];actor.play('attack');for(let i=0;i<60*8;i++){actor.step(1/60);if(ATTACKS.includes(actor.mode)&&!actor.previous)feet.push(['R','L'].map(s=>actor.model.getObjectByName('Foot_'+s).getWorldPosition(new T.Vector3())));}
 const modes=actor.history.map(h=>h.mode);assert.deepEqual(modes.slice(0,5),['idle','attackEnter','attack','attackUpright','attackTilted']);
 for(const f of feet)for(let k=0;k<2;k++)assert.ok(f[k].distanceTo(feet[0][k])<1e-4,'paws never move between shots');
 actor.turnTo(Math.PI/2);for(let i=0;i<30;i++)actor.step(1/60);assert.equal(actor.history.at(-1).mode==='attackExit'||actor.history.at(-2).mode==='attackExit',true,'a standing turn first steps out of the stance');
 const runner=new FoxActor(await load());runner.play('attack');for(let i=0;i<90;i++)runner.step(1/60);runner.play('run');assert.equal(runner.mode,'run','running leaves the stance directly');
});

test('every arrow is drawn from the back quiver over the left shoulder, then carried to the string',()=>{
 const axis=new T.Vector3(...QUIVER.axis).normalize(),skeleton=node('FoxMesh').skeleton,chestRest=new T.Vector3().setFromMatrixPosition(skeleton.boneInverses[skeleton.bones.findIndex(b=>b.name==='Chest')].clone().invert());
 for(const name of ['Bow_Attack','Bow_Attack_Upright','Bow_Attack_Tilted','Shoot_Forward','Shoot_Strafe_Left']){
  pose(name,.20);assert.equal(node('Arrow_Nock_and_Flight').scale.x,0,'no arrow before the grab');
  // Exact on every baked frame of the carry; between frames the paw's
  // interpolated rotations and the arrow's interpolated translation stay
  // within three millimetres (shot clips are sampled at 120 Hz).
  for(let f=18;f<49;f++){const t=f/60;pose(name,t);const paw=node('Hand_L').localToWorld(new T.Vector3(.13,0,0));assert.ok(node('Arrow_Nock_and_Flight').scale.x>.999,`${name} arrow in paw at ${t}`);assert.ok(node('Arrow_Nock_and_Flight').position.distanceTo(paw)<1e-5,`${name} nock in the paw at ${t}`);}
  for(let i=0;i<=100;i++){const t=.29+i*.0052;pose(name,t);const paw=node('Hand_L').localToWorld(new T.Vector3(.13,0,0));assert.ok(node('Arrow_Nock_and_Flight').position.distanceTo(paw)<.003,`${name} interpolated nock at ${t}`);}
  // The paw closes on a nock at the quiver's mouth, behind the left shoulder.
  pose(name,.30);const chest=node('Chest'),grab=chest.localToWorld(new T.Vector3(...QUIVER.mouth).addScaledVector(axis,QUIVER.stickOut).sub(chestRest)),paw=node('Hand_L').localToWorld(new T.Vector3(.13,0,0));
  assert.ok(paw.distanceTo(grab)<.012,`${name} grip at the quiver ${paw.distanceTo(grab)}`);
  const local=chest.worldToLocal(paw.clone()),shoulder=chest.worldToLocal(W('UpperArm_L'));assert.ok(local.x>.1&&local.z<shoulder.z-.15,'paw is at the left back');
  // While drawn out it is aligned with the quiver, nock end first.
  const shaft=new T.Vector3(-1,0,0).applyQuaternion(Q('Arrow_Nock_and_Flight')),down=axis.clone().negate().applyQuaternion(Q('Chest'));assert.ok(shaft.dot(down)>.999,'arrow head points into the quiver');
  pose(name,.45);const out=node('Arrow_Nock_and_Flight').position.clone();pose(name,.33);assert.ok(out.distanceTo(node('Arrow_Nock_and_Flight').position)>.12,'drawn up out of the quiver');
  // On the string from the nock to the loose.
  pose(name,.9);const nock=node('Bow_Right_Hand').localToWorld(new T.Vector3(.10+(.23-.10)*node('BowStringDraw').morphTargetInfluences[0],.025,0));assert.ok(node('Arrow_Nock_and_Flight').position.distanceTo(nock)<1e-5);
 }
});

test('a satisfying bow drop after the loose: fast, with a bounce, then back to ready',()=>{
 const y=t=>{pose('Bow_Attack',t);return W('Hand_R').y;},atRelease=y(RELEASE);
 const samples=Array.from({length:40},(_,i)=>RELEASE+i/60).map(t=>[t,y(t)]),low=samples.reduce((m,v)=>v[1]<m[1]?v:m);
 assert.ok(atRelease-low[1]>.15,`bow arm drops ${atRelease-low[1]}`);assert.ok(low[0]-RELEASE<.25,'the drop lands within a quarter second');
 assert.ok(y(RELEASE+.45)>low[1]+.02,'sprung: it bounces back up from the low point');
 assert.ok(Math.abs(y(CLIPS.attack.duration)-y(0))<1e-5,'recovered to ready for the next arrow');
});

test('three bow angles at full draw: upright, canted and tilted',()=>{
 for(const [name,variant]of [['Bow_Attack_Upright','upright'],['Bow_Attack','canted'],['Bow_Attack_Tilted','tilted']]){pose(name,1.15);const string=new T.Vector3(0,1,0).applyQuaternion(Q('Bow_Right_Hand')),tilt=Math.acos(string.y);assert.ok(Math.abs(tilt-BOW_ANGLES[variant])<.03,`${name} cant ${tilt}`);}
 assert.ok(BOW_ANGLES.upright<.1&&BOW_ANGLES.tilted-BOW_ANGLES.upright>.5);
});

test('the face turns angry while shooting and calm otherwise; eyes never move under the brows',()=>{
 const controller=new FoxPreviewController(model),head=node('Fox_Head'),lids=node('Eyelids'),h=head.morphTargetDictionary,l=lids.morphTargetDictionary;
 for(const [mode,name,t,angry]of [['attack','Bow_Attack',.5,1],['shootLeft','Shoot_Strafe_Left',1.0,1],['attackUpright','Bow_Attack_Upright',1.6,1],['idle','Idle',2,0],['run','Run',.2,0]]){
  pose(name,t);controller.apply({mode,clipTime:t,ambientTime:.5});
  assert.equal(head.morphTargetInfluences[h.Brow_Angry],angry,mode);assert.equal(lids.morphTargetInfluences[l.Lid_Angry],angry,mode);assert.ok(Math.abs(head.morphTargetInfluences[h.Ears_Back]-.9*angry)<1e-9);controller.restore();
 }
 // The brow target lowers the brow marks and leaves every eye vertex alone.
 const source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),p=source.read(source.json.meshes[0].primitives[0].attributes.POSITION),brow=head.geometry.morphAttributes.position[h.Brow_Angry];
 let lowered=0;for(let i=0;i<p.length/3;i++){const [x,y,z]=[p[i*3],p[i*3+1],p[i*3+2]];if(z>.15&&Math.hypot((Math.abs(x)-.176)/.060,(y-1.135)/.072)<1)assert.ok(Math.hypot(brow.getX(i),brow.getY(i),brow.getZ(i))<1e-9,'eye vertex moved');if(brow.getY(i)<-.006){lowered++;assert.ok(y>1.205&&Math.abs(x)>.06&&Math.abs(x)<.22,`only the brows move (${x},${y})`);}}
 assert.ok(lowered>=8,`brows pressed down (${lowered} vertices by over 6 mm)`);
});

test('blinks are small eyelids inside the eye sockets: a single head mesh, never hidden or scaled',async()=>{
 assert.ok(!g.nodes.some(n=>/Head_Open|Head_Closed|Closed_Eye/.test(n.name)),'no swapped head meshes remain');
 const lids=node('Eyelids'),head=node('Fox_Head'),p=lids.geometry.attributes.position,blink=lids.geometry.morphAttributes.position[lids.morphTargetDictionary.Blink],idx=lids.geometry.index;
 // Open: every lid triangle has zero area. Closed: every lid point lies on the eye.
 const at=(i,w)=>new T.Vector3(p.getX(i)+w*blink.getX(i),p.getY(i)+w*blink.getY(i),p.getZ(i)+w*blink.getZ(i));
 let area=0;for(let k=0;k<idx.count;k+=3){const [a,b,c]=[0,1,2].map(j=>at(idx.getX(k+j),0));area+=b.sub(a).cross(c.sub(a)).length()/2;}assert.ok(area<1e-9,`open lids have area ${area}`);
 // Collapsed, the lids trace each socket's edge; closed, they stay inside that
 // outline, which is no larger than the eye itself.
 const boxes={};for(let i=0;i<p.count;i++){const v=at(i,0),box=boxes[v.x>0?'L':'R']??=new T.Box3();box.expandByPoint(v);}
 const [rx,ry]=EYE.radius;for(const box of Object.values(boxes)){const size=box.getSize(new T.Vector3());assert.ok(size.x<=2*rx+.002&&size.y<=2*ry+.002,`lid outline ${size.x} x ${size.y}`);}
 for(let i=0;i<p.count;i++){const v=at(i,1),box=boxes[v.x>0?'L':'R'];assert.ok(v.x>=box.min.x-1e-6&&v.x<=box.max.x+1e-6&&v.y>=box.min.y-1e-6&&v.y<=box.max.y+1e-6,`closed lid point outside the socket ${v.toArray()}`);}
 const headBox=new T.Box3().setFromBufferAttribute(head.geometry.attributes.position);assert.ok(2*rx<.2*headBox.getSize(new T.Vector3()).x,'each lid spans under a fifth of the head');
 // The head mesh is never scaled or hidden in any clip or cross-fade.
 for(const clip of asset.animations){pose(clip.name,clip.duration/2);for(const n of [head,lids])assert.ok(n.visible&&n.scale.equals(new T.Vector3(1,1,1))&&n.parent.name==='Head',`${clip.name} ${n.name}`);}
 assert.ok(!asset.animations.some(c=>c.tracks.some(t=>/^(Fox_Head|Eyelids)\.scale/.test(t.name))));
 const actor=new FoxActor(await load()),fh=actor.model.getObjectByName('Fox_Head');
 for(const step of [()=>actor.play('walk'),()=>actor.turnTo(Math.PI),()=>actor.play('run'),()=>actor.stopAndTurn(0),()=>actor.play('attack'),()=>actor.play('idle')]){step();for(let i=0;i<50;i++){actor.step(1/60);let shown=true;for(let o=fh;o;o=o.parent)if(!o.visible||Math.abs(o.scale.x*o.scale.y*o.scale.z)<1e-9)shown=false;assert.ok(shown&&fh.scale.x===1,'head stays visible through every cross-fade');}}
});

test('the tail keeps its authored junction and is carried straight out behind, the hem left alone',()=>{
 for(const clip of asset.animations){for(const t of [0,clip.duration/3,clip.duration*2/3]){pose(clip.name,t);assert.ok(node('Tail_00').quaternion.angleTo(new T.Quaternion())<1e-6,`${clip.name} root bone turned`);}}
 const yaws=[];for(let f=0;f<480;f+=10){pose('Idle',f/60);const d=W('Tail_05').sub(W('Tail_01'));yaws.push(Math.atan2(-d.z,d.x)*180/Math.PI);}
 const mean=yaws.reduce((s,v)=>s+v,0)/yaws.length;assert.ok(mean>75&&mean<110,`tail points behind (${mean} degrees from the side)`);
 assert.ok(TAIL_REST[0].every(v=>v===0));
 // The hem's gold trim beside the root carries no tail weight any more.
 const primitive=g.meshes[0].primitives[0],J=glb.read(primitive.attributes.JOINTS_0),Wt=glb.read(primitive.attributes.WEIGHTS_0),names=g.skins[0].joints.map(id=>g.nodes[id].name),src=readGLB('public/meshy-fox-preview/fox-repaired.glb'),P=src.read(src.json.meshes[0].primitives[0].attributes.POSITION);
 for(let v=0;v<P.length/3;v++)if(Math.abs(P[v*3+1]-.367)<.004&&P[v*3]>.05&&P[v*3]<.09&&P[v*3+2]<-.11){let tail=0;for(let k=0;k<4;k++)if(names[J[v*4+k]].startsWith('Tail_'))tail+=Wt[v*4+k];assert.ok(tail===0||tail>.5,`hem vertex ${v} tail weight ${tail}`);}
 assert.ok(g.extras.foxAnimated.metrics.hemVertices>=10);
});

test('sharper turns: quick, led by the head, and settled exactly on Idle',()=>{
 for(const [mode,limit]of [['turnLeft45',.45],['turnLeft90',.62],['quickTurnLeft',.65]]){const {name,turn,duration}=CLIPS[mode];assert.ok(duration<=limit,`${name} ${duration}`);
  pose(name,.7*duration);assert.ok(yawOf(Q('Pelvis'))/turn>.9||Math.abs(Math.abs(yawOf(Q('Pelvis')))-Math.PI)<.25,`${name} mostly turned by 70%`);
  pose(name,.3*duration);assert.ok(yawOf(Q('Head'))/turn>yawOf(Q('Pelvis'))/turn+.10,`${name} head leads`);}
});

test('dodges and dashes burst: fast, front-loaded and landing where they should',()=>{
 for(const [name,axis,distance,minimum]of [['Dodge_Right','x',DODGE,2.5],['Dodge_Left','x',-DODGE,2.5],['Dash_Forward','z',DASH.dash,4],['Dash_Back','z',DASH.dashBack,3]]){
  const clip=pose(name,0);let previous=W('Pelvis'),peak=0,peakAt=0;for(let f=1;f<=Math.round(clip.duration*60);f++){pose(name,f/60);const p=W('Pelvis'),v=p.distanceTo(previous)*60;if(v>peak){peak=v;peakAt=f/60;}previous=p;}
  assert.ok(peak>minimum,`${name} peak speed ${peak}`);assert.ok(peakAt<.2,`${name} speed comes early (${peakAt})`);
  pose(name,.34);assert.ok(Math.abs(node('Root').position[axis]-distance)<.02*Math.abs(distance)+.005,`${name} covered by a third of a second`);
  pose(name,clip.duration);assert.ok(Math.abs(node('Root').position[axis]-distance)<1e-6);
 }
 assert.ok(CLIPS.dodgeLeft.duration<=.8&&CLIPS.dash.duration<=.7);
});

test('run stop and turn: brakes from the run, pivots on the planted paws and settles on Idle turned',()=>{
 pose('Idle',0);const idle=snap();
 for(const mode of ['runStopTurnLeft','runStopTurnRight','runStopTurnLeft90','runStopTurnRight90']){
  const {name,turn,duration}=CLIPS[mode];pose(name,0);assert.ok(W('Pelvis').y<idle.Pelvis.p.y-.03,`${name} starts at the run crouch`);
  pose(name,.20);assert.ok(new T.Vector3(0,1,0).applyQuaternion(Q('Chest')).z<-.05,`${name} leans back to brake`);assert.ok(Math.abs(yawOf(Q('Pelvis')))<.1,'brakes before it turns');
  pose(name,duration);const slide=W('Root').z-idle.Root.p.z,r=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),turn);assert.ok(slide>.06,`${name} slides ${slide}`);
  for(const b of bones){const want=idle[b].p.clone().applyQuaternion(r).add(new T.Vector3(0,0,slide));assert.ok(W(b).distanceTo(want)<1e-5&&Q(b).angleTo(r.clone().multiply(idle[b].q))<1e-3,`${name} ${b} settles`);}
  for(const s of ['R','L']){let lifted=0;for(let i=0;i<=40;i++){pose(name,i/40*duration);if(W('Foot_'+s).y>.14)lifted++;}assert.ok(lifted>2,`${name} ${s} steps`);}
 }
});

test('v2 eases are smoother: quintic transitions start and settle with zero acceleration',async()=>{
 const {smooth}=await import('../public/meshy-fox-preview/fox-motion.mjs'),h=1e-4;
 for(const x of [0,1]){const acc=(smooth(0,1,x+h)-2*smooth(0,1,x)+smooth(0,1,x-h))/(h*h);assert.ok(Math.abs(acc)<1e-3,`acceleration at ${x}: ${acc}`);}
});

test('toward the agile archer: a crouched shot, a double shot and a duck',()=>{
 // Crouched: the hips sink over the same planted paws; the shot still flies true.
 for(const t of [0,.6,1.15,1.8]){pose('Bow_Attack',t);const high=W('Pelvis').y,paws=['R','L'].map(s=>W('Foot_'+s));pose('Bow_Attack_Crouched',t);assert.ok(high-W('Pelvis').y>.06,`crouched at ${t}`);['R','L'].forEach((s,i)=>assert.ok(W('Foot_'+s).distanceTo(paws[i])<1e-5,'paws planted'));}
 pose('Bow_Attack_Crouched',1.15);assert.ok(new T.Vector3(-1,0,0).applyQuaternion(Q('Bow_Right_Hand')).z>.9999,'aimed down the line');
 // Double: two arrows come from the quiver together, sit 3 cm apart on the
 // string, and fly out on slightly diverging lines. Single shots show one.
 pose('Bow_Attack',.9);assert.equal(node('Arrow_Second').scale.x,0);
 for(const t of [.4,.9]){pose('Bow_Attack_Double',t);const a=node('Arrow_Nock_and_Flight'),b=node('Arrow_Second');assert.ok(a.scale.x>.999&&b.scale.x>.999,`two arrows at ${t}`);assert.ok(Math.abs(a.position.distanceTo(b.position)-.032)<1e-4);}
 pose('Bow_Attack_Double',RELEASE+.05);const a0=node('Arrow_Nock_and_Flight').position.clone(),b0=node('Arrow_Second').position.clone();pose('Bow_Attack_Double',RELEASE+.25);const a1=node('Arrow_Nock_and_Flight').position.clone(),b1=node('Arrow_Second').position.clone();
 assert.ok(a1.z-a0.z>.6&&b1.z-b0.z>.6,'both fly forward');assert.ok(a1.distanceTo(b1)>a0.distanceTo(b0)+.02,'their lines diverge');
 // Duck: a quick drop with the paws planted, back exactly to Idle.
 pose('Idle',0);const idle=snap();pose('Duck',.25);assert.ok(idle.Pelvis.p.y-W('Pelvis').y>.08,'ducks low');for(const s of ['R','L'])assert.ok(W('Foot_'+s).distanceTo(idle['Foot_'+s].p)<1e-5);
 pose('Duck',CLIPS.duck.duration);same(idle,snap(),'duck ends on Idle');
});
