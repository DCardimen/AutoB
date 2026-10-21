import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {FoxPreviewController,travelVelocity} from './fox-preview-controller.mjs';
import {fadeLength} from './fox-actor.mjs';
import {CLIPS,ATTACKS,BOW_LOOPS,attackAt,isAttackLoop,isShooting,isTurn,settlesToIdle,smooth} from './fox-motion.mjs';
const canvas=document.querySelector('#animation'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#202d32');const camera=new T.PerspectiveCamera(34,1,.01,50);camera.position.set(0,.87,3.6);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,.79,0);controls.update();
scene.add(new T.HemisphereLight(0xe7f4ff,0x71816b,1.7));const key=new T.DirectionalLight(0xffe8ca,2.6);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.bias=-.0004;scene.add(key);const rim=new T.DirectionalLight(0x99c9e7,1.5);rim.position.set(3,3,-4);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.ShadowMaterial({color:0x000000,opacity:.24}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(5,25,0x526964,0x33433e);grid.position.y=-.008;scene.add(grid);
const asset=await new GLTFLoader().loadAsync('./fox-animated.glb'),model=asset.scene;scene.add(model);const meshes=[],bones=[];model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;meshes.push(o)}if(o.isBone)bones.push(o)});
const guides=new T.SkeletonHelper(model);guides.visible=false;guides.material.depthTest=false;guides.renderOrder=20;scene.add(guides);
const mixer=new T.AnimationMixer(model),actions=new Map(asset.animations.map(c=>[c.name,mixer.clipAction(c)]));const combat=new FoxPreviewController(model);let ambientTime=0,enemyWorld=null,queue=[],fade=null;let mode='idle',clock=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now();
const $=id=>document.querySelector('#'+id);
// The action list follows the clip table; the three standing shots share one
// entry and the Bow angle setting picks between them.
const LABELS={idle:'Idle',walk:'Walk',run:'Run',attack:'Bow attack (stance held)',attackEnter:'Bow attack: enter stance',attackExit:'Bow attack: leave stance',dodgeLeft:'Dodge left',dodgeRight:'Dodge right',dash:'Dash forward',dashBack:'Dash back',shootForward:'Shoot / forward',shootBackward:'Shoot / backward',shootLeft:'Shoot / strafe left',shootRight:'Shoot / strafe right',shootForwardLeft:'Shoot / forward-left',shootForwardRight:'Shoot / forward-right',shootBackwardLeft:'Shoot / back-left',shootBackwardRight:'Shoot / back-right',hit:'Hit reaction',death:'Fall / death',turnLeft45:'Turn left 45°',turnRight45:'Turn right 45°',turnLeft90:'Turn left 90°',turnRight90:'Turn right 90°',quickTurnLeft:'Quick turn left 180°',quickTurnRight:'Quick turn right 180°',runStop:'Run stop',runStopTurnLeft:'Run stop + turn left 180°',runStopTurnRight:'Run stop + turn right 180°',runStopTurnLeft90:'Run stop + turn left 90°',runStopTurnRight90:'Run stop + turn right 90°',attackCrouched:'Crouched shot (stance held)',attackDouble:'Double shot (stance held)',duck:'Duck'};
$('action').innerHTML=Object.entries(LABELS).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
const shotMode=()=>({upright:'attackUpright',canted:'attack',tilted:'attackTilted'})[$('bow').value];
const menuValue=name=>BOW_LOOPS.includes(name)&&name!=='attackDouble'?'attack':name;
function frameCamera(){if(mode==='death'){controls.target.set(-.75*Math.sin(model.rotation.y),.55,-.75*Math.cos(model.rotation.y));camera.position.copy(controls.target).add(new T.Vector3(0,.30,4.8));}else if(mode==='dash'||mode==='dashBack'||$('travel').checked){const z=mode==='dashBack'?-.22:.25;camera.position.set(0,1.02,4.55+z);controls.target.set(0,.79,z);}else{camera.position.set(0,.87,3.6);controls.target.set(0,.79,0);}controls.update();}
// Undo the look-at before switching clips: stopping actions resets bones and
// Three then skips channels it believes unchanged, so a later restore would
// leave the previous clip's turned spine behind. With `blend`, the outgoing
// clip is held at its current moment and cross-faded out.
function action(name,{blend=false}={}){
 const from=mode,fromTime=clock,outgoing=actions.get(CLIPS[from].name);combat.restore();mode=name;clock=0;fade=null;mixer.stopAllAction();
 for(const m of meshes)if(m.morphTargetInfluences)m.morphTargetInfluences.fill(0);
 const current=actions.get(CLIPS[mode].name);current.reset().play();
 if(blend&&from!==name){outgoing.reset().play();fade={action:outgoing,time:Math.min(fromTime,CLIPS[from].duration-1e-6),length:fadeLength(from,name)};}
 $('action').value=menuValue(mode);$('time').max=CLIPS[mode].duration;$('repeat').checked=CLIPS[mode].loop&&!queue.length;frameCamera();seek(0,false);
}
function seek(t,hold=true){if(hold)ambientTime=t;clock=Math.min(CLIPS[mode].duration,Math.max(0,t));combat.restore();mixer.setTime(Math.min(clock,CLIPS[mode].duration-.000001));if(fade){const w=smooth(0,fade.length,clock),current=actions.get(CLIPS[mode].name);fade.action.time=fade.time;fade.action.setEffectiveWeight(1-w);current.setEffectiveWeight(w);mixer.update(0);if(w>=1){fade.action.stop();current.setEffectiveWeight(1);fade=null;}}model.position.copy($('travel').checked?travelVelocity(mode).multiplyScalar(clock).applyAxisAngle(new T.Vector3(0,1,0),model.rotation.y):new T.Vector3());model.updateMatrixWorld(true);const angle=Number($('enemy').value),target=model.localToWorld(new T.Vector3(Math.sin(angle)*3,1.03,Math.cos(angle)*3));combat.apply({mode,clipTime:clock,ambientTime,target:$('tracking').checked?(enemyWorld||target):null});for(const m of meshes)if(m.isSkinnedMesh)m.skeleton.update();if(hold){paused=true;$('play').textContent='Play'}$('time').value=clock;$('stage').textContent=isShooting(mode)?attackAt(clock).stage:CLIPS[mode].name.replaceAll('_',' ');}
function yaw(a){model.rotation.y=a;model.updateMatrixWorld(true);$('direction').value=String((Math.round(a/(Math.PI/4))%8+8)%8);if(mode==='death')frameCamera();seek(clock,false);}
// Choosing an action while playing runs the archer's sequence: the stance is
// entered once and held through any number of shots, and leaving it to stand
// steps back out; moving off (run, walk, kiting, dash, dodge) blends directly.
const STANDING=new Set(['idle','hit','death',...Object.keys(CLIPS).filter(m=>isTurn(m)||m==='runStop')]);
function choose(name){
 if(name==='attack')name=shotMode();
 queue=[];const inStance=isAttackLoop(mode)||mode==='attackEnter';
 if(isAttackLoop(name)&&!inStance){queue=[name];action('attackEnter',{blend:true});}
 else if(inStance&&STANDING.has(name)){queue=name==='idle'?[]:[name];action('attackExit',{blend:true});}
 else action(name,{blend:true});
 play();
}
// A turn, stop or stance change hands over to the next queued clip (or Idle)
// at its end; a turn commits its rotation into the model's facing.
function advance(){const turned=isTurn(mode)?model.rotation.y+CLIPS[mode].turn:null,next=queue.shift()||'idle';action(next);if(turned!==null)yaw(turned);}
$('action').onchange=e=>choose(e.target.value);$('bow').onchange=()=>{if(isAttackLoop(mode))choose('attack');};$('direction').onchange=e=>turnTo(Number(e.target.value));$('skeleton').onchange=e=>guides.visible=e.target.checked;
$('play').onclick=e=>{paused=!paused;e.target.textContent=paused?'Play':'Pause';};$('time').oninput=e=>seek(Number(e.target.value));$('blink').onclick=()=>{action('idle');ambientTime=1.38;seek(1.38,false);play();};
for(const [id,time]of [['ears',1.10],['sniff',2.0]])$(id).onclick=()=>{action('idle');ambientTime=time;seek(time,false);play();};
$('tracking').onchange=()=>seek(clock,false);$('enemy').oninput=()=>{enemyWorld=null;seek(clock,false)};$('travel').onchange=()=>{frameCamera();seek(clock,false);};
// A facing change while idle plays the turn clips (90 then 45 degree steps)
// from the current idle moment; other actions keep the instant re-facing.
function facingIndex(){return (Math.round(model.rotation.y/(Math.PI/4))%8+8)%8;}
function turnTo(facing){
 if(mode!=='idle'&&!isTurn(mode)){yaw(facing*Math.PI/4);return;}
 const settled=(facingIndex()+(isTurn(mode)?Math.round(CLIPS[mode].turn/(Math.PI/4)):0)+8)%8;let delta=((facing-settled)%8+8)%8;if(delta>4)delta-=8;
 const steps=[];for(let left=Math.abs(delta);left>0;left-=left>=2?2:1)steps.push((delta>0?'turnLeft':'turnRight')+(left>=2?'90':'45'));
 if(!steps.length)return;if(isTurn(mode)){queue=steps;return;}queue=steps.slice(1);action(steps[0],{blend:true});play();
}
function play(){paused=false;$('play').textContent='Pause';}
function resize(){const h=canvas.getBoundingClientRect().height;renderer.setSize(innerWidth,h,false);camera.aspect=innerWidth/h;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
window.foxAnimation={ready:true,action,choose,seek,yaw,turnTo,get facing(){return facingIndex()},get queue(){return [...queue]},ambient(t){ambientTime=t;seek(clock,false)},target(position){enemyWorld=position?new T.Vector3(...position):null;$('tracking').checked=!!position;seek(clock,false)},track(angle,enabled=true){enemyWorld=null;$('enemy').value=angle;$('tracking').checked=enabled;seek(clock,false)},travel(enabled){$('travel').checked=enabled;frameCamera();seek(clock,false)},model,meshes,bones,renderer,scene,camera,asset,mixer,attacks:ATTACKS,get mode(){return mode},get time(){return clock},play,pause(){paused=true;$('play').textContent='Play'}};
action('idle');$('play').textContent=paused?'Play':'Pause';
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused){ambientTime+=dt;let next=clock+dt*Number($('speed').value);const end=CLIPS[mode].duration;
 if(next>end&&!$('repeat').checked&&(settlesToIdle(mode)||mode==='attackEnter'||queue.length)){advance();next=0;}
 else if(next>end){if($('repeat').checked)next%=end;else{next=end;paused=true;$('play').textContent='Play'}}
 seek(next,false);}renderer.render(scene,camera);requestAnimationFrame(frame)}requestAnimationFrame(frame);
