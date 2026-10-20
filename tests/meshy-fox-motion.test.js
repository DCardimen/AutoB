import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshBVH} from 'three-mesh-bvh';
import validator from 'gltf-validator';
import {readGLB} from '../scripts/lib/glb.mjs';
import {tailSwish,footCycle} from '../public/meshy-fox-preview/fox-motion.mjs';
import {FoxPreviewController,travelVelocity} from '../public/meshy-fox-preview/fox-preview-controller.mjs';

globalThis.self=globalThis;
// CPU geometry tests do not render textures; browser review decodes them.
globalThis.createImageBitmap=async()=>({width:4096,height:4096,close(){}});
const bytes=fs.readFileSync('public/meshy-fox-preview/fox-animated.glb'),glb=readGLB('public/meshy-fox-preview/fox-animated.glb'),g=glb.json;
const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),''),model=asset.scene,mixer=new T.AnimationMixer(model),node=n=>model.getObjectByName(n);
model.updateMatrixWorld(true);
const defaultDirections=['R','L'].map(s=>new T.Vector3(s==='R'?-1:1,0,0).applyQuaternion(node('Hand_'+s).getWorldQuaternion(new T.Quaternion()))),defaultArrowScale=node('Arrow_Nock_and_Flight').scale.clone();
function action(name){mixer.stopAllAction();const clip=asset.animations.find(c=>c.name===name);mixer.clipAction(clip).reset().setLoop(T.LoopOnce,1).play();model.rotation.y=0;return clip;}
function seek(t){mixer.setTime(t);model.updateMatrixWorld(true);node('FoxMesh').skeleton.update();}

test('default asset opens with hands down and the loose projectile hidden',()=>{
 assert.ok(defaultDirections.every(d=>d.y<-.8));assert.equal(defaultArrowScale.lengthSq(),0);
});

test('portable export has complete normalized clips and closed loop endpoints',async()=>{
 const result=await validator.validateBytes(new Uint8Array(bytes),{maxIssues:10});assert.equal(result.issues.numErrors,0);
 assert.deepEqual(asset.animations.map(c=>c.name),['Idle','Walk','Run','Bow_Attack','Dodge_Left','Dodge_Right','Dash_Forward','Shoot_Forward','Shoot_Backward','Shoot_Strafe_Left','Shoot_Strafe_Right','Hit_Reaction','Fall_and_Death']);
 for(const clip of g.animations)for(const channel of clip.channels){const sampler=clip.samplers[channel.sampler],values=glb.read(sampler.output),width=channel.target.path==='rotation'?4:channel.target.path==='weights'?(g.meshes[g.nodes[channel.target.node].mesh].weights?.length||1):3;assert.ok([...values].every(Number.isFinite));if(width===4)for(let i=0;i<values.length;i+=4)assert.ok(Math.abs(Math.hypot(...values.subarray(i,i+4))-1)<1e-6);if(clip.extras.loop)for(let k=0;k<width;k++)assert.ok(Math.abs(values[k]-values[values.length-width+k])<1e-6);}
});

test('right bow grip and left string nock remain attached after export in eight views',()=>{
 let max=0;
 for(const clip of asset.animations){action(clip.name);for(let i=0;i<80;i++){seek(i/80*clip.duration);for(let view=0;view<8;view++){model.rotation.y=view*Math.PI/4;model.updateMatrixWorld(true);const grip=node('Hand_R').localToWorld(new T.Vector3(-.095,-.025,-.025)),bow=node('Bow_Right_Hand').getWorldPosition(new T.Vector3());assert.ok(grip.distanceTo(bow)<1e-7);if(/^(Bow_Attack|Shoot_)/.test(clip.name)&&i/80*clip.duration>=.48&&i/80*clip.duration<1.18){const draw=node('BowStringDraw').morphTargetInfluences[0],nock=node('Bow_Right_Hand').localToWorld(new T.Vector3(.10+.04*draw,.025,0)),left=node('Hand_L').localToWorld(new T.Vector3(.130,0,0));max=Math.max(max,nock.distanceTo(left));}}model.rotation.y=0;}}
 assert.ok(max<.0006,`interpolated nock separation ${max}`);
});

test('shots travel forward and remain aligned while the upper body tracks an enemy',()=>{
 const controller=new FoxPreviewController(model);
 for(const name of ['Bow_Attack','Shoot_Forward','Shoot_Backward','Shoot_Strafe_Left','Shoot_Strafe_Right']){
  action(name);seek(1.1);
  assert.ok(new T.Vector3(-1,0,0).applyQuaternion(node('Bow_Right_Hand').getWorldQuaternion(new T.Quaternion())).z>.9999);
  seek(1.22);const first=node('Arrow_Nock_and_Flight').position.clone();seek(1.30);const delta=node('Arrow_Nock_and_Flight').position.clone().sub(first);
  assert.ok(delta.z>.29&&Math.abs(delta.x)<1e-7);
  for(const yaw of [-.35,0,.35]){
   controller.restore();seek(1.1);const target=new T.Vector3(Math.sin(yaw)*3,1.03,Math.cos(yaw)*3);controller.apply({mode:'attack',clipTime:1.1,ambientTime:4,target});model.updateMatrixWorld(true);
   const nock=node('Bow_Right_Hand').localToWorld(new T.Vector3(.14,.025,0)),left=node('Hand_L').localToWorld(new T.Vector3(.130,0,0));assert.ok(nock.distanceTo(left)<1e-6);
   const forward=new T.Vector3(-1,0,0).applyQuaternion(node('Bow_Right_Hand').getWorldQuaternion(new T.Quaternion()));assert.ok(Math.abs(Math.atan2(forward.x,forward.z)-Math.atan2(target.x-node('Chest').getWorldPosition(new T.Vector3()).x,target.z-node('Chest').getWorldPosition(new T.Vector3()).z))<1e-6);
   const headForward=new T.Vector3(0,0,1).applyQuaternion(node('Head').getWorldQuaternion(new T.Quaternion())),toward=target.clone().sub(node('Head').getWorldPosition(new T.Vector3())).normalize();assert.ok(headForward.dot(toward)>.9999);
  }
  controller.restore();
 }
});

test('compact shooting gaits move along the chosen axis and dash lands with raised death feet',()=>{
 for(const [name,axis,sign]of [['shootForward','z',1],['shootBackward','z',-1],['shootLeft','x',-1],['shootRight','x',1]])assert.ok(travelVelocity(name)[axis]*sign>.30);
 action('Dash_Forward');seek(.84);assert.ok(Math.abs(node('Root').position.z-.65)<1e-6);
 action('Fall_and_Death');seek(2.3);const pelvis=node('Pelvis').getWorldPosition(new T.Vector3());for(const side of ['R','L'])assert.ok(node('Foot_'+side).getWorldPosition(new T.Vector3()).y>pelvis.y+.10);
 const stance=[];action('Run');for(let f=0;f<60;f++){seek(f/60*.72);stance.push(node('Foot_R').getWorldPosition(new T.Vector3()).z);}assert.ok(Math.max(...stance)-Math.min(...stance)<.131);
});

test('shooting travel cancels planted foot motion in every facing',()=>{
 for(const [mode,name]of [['shootForward','Shoot_Forward'],['shootBackward','Shoot_Backward'],['shootLeft','Shoot_Strafe_Left'],['shootRight','Shoot_Strafe_Right']]){
  action(name);
  for(let facing=0;facing<8;facing++)for(const [side,start]of [['R',.10],['L',.45]]){
   const yaw=facing*Math.PI/4,points=[];model.rotation.y=yaw;
   for(const t of [start,start+.05,start+.10]){model.position.copy(travelVelocity(mode).multiplyScalar(t).applyAxisAngle(new T.Vector3(0,1,0),yaw));seek(t);points.push(node('Foot_'+side).getWorldPosition(new T.Vector3()));}
   for(const p of points)assert.ok(p.distanceTo(points[0])<.001,`${mode} ${side} view ${facing}: planted foot drift ${p.distanceTo(points[0])}`);
  }
 }
 model.position.set(0,0,0);model.rotation.y=0;
});

test('ambient tail swishes are occasional and separated by six to ten seconds',()=>{
 const starts=[];let active=false;for(let i=0;i<12000;i++){const t=i/60,on=Math.abs(tailSwish(t))>1e-7;if(on&&!active)starts.push(t);active=on;}
 // Each event makes one complete outward-and-return sweep.
 const events=starts.filter((t,i)=>i===0||t-starts[i-1]>3);assert.ok(events.length>15);
 for(let i=1;i<events.length;i++)assert.ok(events[i]-events[i-1]>=6-1/60&&events[i]-events[i-1]<=10+1/60);
 action('Idle');const positions=[];for(let f=0;f<480;f++){seek(f/60);positions.push(node('Tail_05').getWorldPosition(new T.Vector3()).x);}assert.ok(Math.min(...positions)<-.1&&Math.max(...positions)>.5,'tail sweeps to both anatomical sides');seek(5);const rest=node('Tail_00').quaternion.clone();seek(6.2);assert.ok(rest.angleTo(node('Tail_00').quaternion)>.05);
});

test('simple fur paws replace added gloves with closed continuous surfaces',()=>{
 assert.ok(!g.nodes.some(n=>/Glove/.test(n.name)));assert.ok(!g.materials.some(m=>/glove/i.test(m.name)));
 for(const side of ['R','L']){const mesh=node('Simple_Paw_'+side),p=mesh.geometry.attributes.position,edges=new Map(),keys=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(','));
  assert.equal(mesh.parent.name,'Hand_'+side);
  for(let i=0;i<mesh.geometry.index.count;i+=3){const tri=[0,1,2].map(k=>mesh.geometry.index.getX(i+k));const a=new T.Vector3().fromBufferAttribute(p,tri[0]),b=new T.Vector3().fromBufferAttribute(p,tri[1]),c=new T.Vector3().fromBufferAttribute(p,tri[2]);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-22);for(const [a,b]of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]]){const key=[keys[a],keys[b]].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}}
  assert.ok([...edges.values()].every(n=>n===2),'paw must be watertight after welding shared positions');
 }
});

test('bow and string use actual open grip channels throughout all animation frames',()=>{
 const gloves=Object.fromEntries(['R','L'].map(s=>{const mesh=node('Simple_Paw_'+s),geo=mesh.geometry.clone();return [s,{mesh,bvh:new MeshBVH(geo)}];}));
 const failures=[];
 for(const clip of asset.animations){action(clip.name);for(let f=0;f<Math.ceil(clip.duration*60);f++){const t=f/60;seek(t);for(const [side,gear]of [['R','Longbow'],['R','Bow_String'],['L','Bow_String']])node(gear).traverse(mesh=>{if(!mesh.isMesh)return;const geo=mesh.geometry.clone(),p=geo.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){mesh.getVertexPosition(i,v);p.setXYZ(i,v.x,v.y,v.z);}geo.boundsTree=new MeshBVH(geo);const matrix=gloves[side].mesh.matrixWorld.clone().invert().multiply(mesh.matrixWorld);if(gloves[side].bvh.intersectsGeometry(geo,matrix))failures.push(`${clip.name} ${t.toFixed(3)} ${side} ${gear}`);geo.dispose();});}}
 assert.deepEqual(failures,[]);
});

test('carried bow curves upward while its grip remains in the right paw',()=>{
 const wood=node('Longbow').children.find(o=>o.isMesh&&o.geometry.attributes.position.count>300);
 function centre(start){const v=new T.Vector3();for(let k=0;k<7;k++)v.add(wood.getVertexPosition(start+k,new T.Vector3()));return v.multiplyScalar(1/7).applyMatrix4(wood.matrixWorld);}
 for(const name of ['Idle','Walk','Run']){const clip=action(name);for(let i=0;i<80;i++){seek(i/80*clip.duration);const tips=centre(0).add(centre(40*8)).multiplyScalar(.5),grip=node('Bow_Right_Hand').getWorldPosition(new T.Vector3());assert.ok(tips.y>grip.y+.02,`${name} carry curvature must point up`);}}
});

test('smooth foot lifts preserve velocity at contact and running arms alternate visibly',()=>{
 const duration=.72,h=1e-5;
 for(const contact of [.48*duration,duration]){
  const position=t=>{const c=footCycle('run',t,'R');return new T.Vector3(0,c.y,c.z);};
  const left=position(contact).sub(position(contact-h)).multiplyScalar(1/h),right=position(contact+h).sub(position(contact)).multiplyScalar(1/h);
  assert.ok(left.distanceTo(right)<.001,`foot velocity jumps at ${contact}`);
 }
 action('Run');const hands={R:[],L:[]};for(let f=0;f<120;f++){seek(f/120*duration);for(const s of ['R','L'])hands[s].push(node('Hand_'+s).getWorldPosition(new T.Vector3()).z);}
 for(const s of ['R','L'])assert.ok(Math.max(...hands[s])-Math.min(...hands[s])>.12,'visible running arm swing');
 const mean=s=>hands[s].reduce((a,b)=>a+b,0)/hands[s].length;assert.ok(hands.R.reduce((sum,v,i)=>sum+(v-mean('R'))*(hands.L[i]-mean('L')),0)<0,'opposite arm phases');
});

test('registered ear and nose gestures move source anatomy while eye vertices stay fixed',()=>{
 const source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),p=source.read(source.json.meshes[0].primitives[0].attributes.POSITION),head=node('Head_Open'),tips={};
 for(const [s,sign]of [['R',-1],['L',1]]){let best=-1;for(let v=0;v<p.length/3;v++)if(p[v*3]*sign>.15&&(best<0||p[v*3+1]>p[best*3+1]))best=v;tips[s]=best;}
 action('Idle');seek(0);const rest=Object.fromEntries(['R','L'].map(s=>[s,head.getVertexPosition(tips[s],new T.Vector3())]));
 seek(1.34);assert.ok(head.getVertexPosition(tips.R,new T.Vector3()).distanceTo(rest.R)>.03);assert.ok(head.getVertexPosition(tips.L,new T.Vector3()).distanceTo(rest.L)<1e-7);
 seek(4.14);assert.ok(head.getVertexPosition(tips.L,new T.Vector3()).distanceTo(rest.L)>.025);
 seek(0);const nose=head.getVertexPosition(1954,new T.Vector3());const eyeIndex=Array.from({length:p.length/3},(_,i)=>i).find(i=>p[i*3]>.15&&p[i*3]<.18&&p[i*3+1]>1.12&&p[i*3+1]<1.16&&p[i*3+2]>.15),eye=head.getVertexPosition(eyeIndex,new T.Vector3());
 seek(2.17);const travel=head.getVertexPosition(1954,new T.Vector3()).distanceTo(nose);assert.ok(travel>.0015&&travel<.0041,'small nose sniff');assert.ok(head.getVertexPosition(eyeIndex,new T.Vector3()).distanceTo(eye)<1e-7);
});

test('ambient expressions stay independent of gait playback and restore cleanly',()=>{
 const controller=new FoxPreviewController(model);action('Run');seek(.1);controller.apply({mode:'run',clipTime:.1,ambientTime:1.34});assert.ok(node('Head_Open').morphTargetInfluences[0]>.9);controller.restore();seek(.1);assert.deepEqual(node('Head_Open').morphTargetInfluences,[0,0,0]);
 controller.apply({mode:'run',clipTime:.1,ambientTime:2.17});assert.ok(node('Head_Open').morphTargetInfluences[2]>.8);controller.restore();
});

test('both bowstring endpoints stay on the flexing wooden tips',()=>{
 const wood=node('Longbow').children.find(o=>o.isMesh&&o.geometry.attributes.position.count>300),strings=node('Bow_String').children.filter(o=>o.isMesh);
 assert.ok(wood&&strings.length===2);
 function centre(mesh,start,count){const result=new T.Vector3();for(let i=0;i<count;i++)result.add(mesh.getVertexPosition(start+i,new T.Vector3()));return result.multiplyScalar(1/count).applyMatrix4(mesh.matrixWorld);}
 for(const clip of asset.animations){action(clip.name);for(let f=0;f<60;f++){seek(f/60*clip.duration);assert.ok(centre(strings[0],0,5).distanceTo(centre(wood,40*8,7))<1e-6,'top string endpoint');assert.ok(centre(strings[1],0,5).distanceTo(centre(wood,0,7))<1e-6,'bottom string endpoint');}}
});

test('the undrawn string is straight and pulls back into a shallow draw',()=>{
 const bow=node('Bow_Right_Hand'),string=node('BowStringDraw');
 function deviation(){const draw=string.morphTargetInfluences[0],tip=.10+.018*draw,top=bow.localToWorld(new T.Vector3(tip,.29,0)),bottom=bow.localToWorld(new T.Vector3(tip,-.29,0)),nock=bow.localToWorld(new T.Vector3(.10+.04*draw,.025,0));return new T.Line3(bottom,top).closestPointToPoint(nock,true,new T.Vector3()).distanceTo(nock);}
 action('Idle');seek(0);assert.ok(deviation()<1e-7);
 action('Bow_Attack');seek(1.1);assert.ok(deviation()>.02&&deviation()<.023);
});

test('walk and run alternate lifted feet while support soles remain level and grounded',()=>{
 const body=node('FoxMesh'),p=body.geometry.attributes.position,j=body.geometry.attributes.skinIndex,w=body.geometry.attributes.skinWeight,bones=body.skeleton.bones;
 const soles={R:[],L:[]};for(let i=0;i<p.count;i++)for(const s of ['R','L'])if(p.getY(i)<.025&&[0,1,2,3].some(k=>bones[j.getComponent(i,k)].name==='Foot_'+s&&w.getComponent(i,k)>.99))soles[s].push(i);
 assert.ok(soles.R.length>20&&soles.L.length>20);
 for(const name of ['Walk','Run']){const clip=action(name);let liftedR=0,liftedL=0;for(let f=0;f<100;f++){seek(f/100*clip.duration);for(const s of ['R','L']){const ankle=node('Foot_'+s).getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,1,0).applyQuaternion(node('Foot_'+s).getWorldQuaternion(new T.Quaternion()));assert.ok(normal.y>.9999);if(ankle.y>.135){if(s==='R')liftedR++;else liftedL++;}else if(Math.abs(ankle.y-.125)<1e-4){const y=Math.min(...soles[s].map(i=>body.getVertexPosition(i,new T.Vector3()).applyMatrix4(body.matrixWorld).y));assert.ok(y>-.001&&y<.003,`${name} ${s} sole ${y}`);}}}assert.ok(liftedR>10&&liftedL>10);}
});

test('blink swaps only the eyes; the open and closed head are never visible together',()=>{
 action('Idle');let open=0,closed=0;for(let i=0;i<240;i++){seek(i/60);const a=node('Head_Open').scale.x,b=node('Head_Closed').scale.x;assert.equal(a+b,1);if(a)open++;else closed++;}assert.ok(open>220&&closed>=5);assert.equal(node('Closed_Eye_Lines').parent.name,'Head_Closed');
});

test('dodges retain their landing displacement and cloth/tail remain animated',()=>{
 for(const [name,sign]of [['Dodge_Left',-1],['Dodge_Right',1]]){const clip=action(name);seek(clip.duration-1e-6);assert.ok(Math.abs(node('Root').position.x-sign*.3)<1e-6);}
 action('Run');seek(.1);const first=node('Tail_05').getWorldPosition(new T.Vector3()),cloth=node('Cape1_1').quaternion.clone();seek(.4);assert.ok(first.distanceTo(node('Tail_05').getWorldPosition(new T.Vector3()))>.01);assert.ok(cloth.angleTo(node('Cape1_1').quaternion)>.001);
});

test('complete front and lower tail fluff belongs to tail bones rather than the thigh',()=>{
 const source=readGLB('public/meshy-fox-preview/fox-repaired.glb'),original=source.read(source.json.meshes[0].primitives[0].attributes.POSITION),primitive=g.meshes[0].primitives[0],p=glb.read(primitive.attributes.POSITION),j=glb.read(primitive.attributes.JOINTS_0),w=glb.read(primitive.attributes.WEIGHTS_0),names=g.skins[0].joints.map(id=>g.nodes[id].name);let count=0;
 for(let i=0;i<original.length;i+=3){const [x,y,z]=original.subarray(i,i+3);if(x>.31&&y>.25&&y<.70&&z<-.06){const v=i/3,total=[0,1,2,3].reduce((sum,k)=>sum+(names[j[v*4+k]].startsWith('Tail_')?w[v*4+k]:0),0);assert.ok(total>.99999);assert.ok(Math.abs(p[i+1]-(y-.096))<1e-7,'tail silhouette keeps the source shape');count++;}}
 assert.equal(count,424,'all 424 vertices in the inspected tail-bulb region are covered');
});
