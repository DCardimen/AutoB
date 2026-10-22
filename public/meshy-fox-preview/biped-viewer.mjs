import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {FoxAcrobatics} from './fox-acrobatics.mjs';
import {BipedController} from './biped-controller.mjs';
import {BIPED_CLIPS as CLIPS,BIPED_ACROBATICS} from './biped-motion.mjs';
const $=id=>document.getElementById(id),renderer=new T.WebGLRenderer({canvas:$('animation'),antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#202d32');
scene.add(new T.HemisphereLight(0xe7f4ff,0x71816b,2));
for(const [color,intensity,p]of [[0xffe8ca,2.6,[-3,5,4]],[0x99c9e7,1.5,[3,3,-4]]]){const l=new T.DirectionalLight(color,intensity);l.position.set(...p);if(p[0]<0){l.castShadow=true;l.shadow.mapSize.set(2048,2048);Object.assign(l.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:18});l.shadow.bias=-.0002;l.shadow.normalBias=.001;}scene.add(l);}
const floor=new T.Mesh(new T.PlaneGeometry(12,12),new T.ShadowMaterial({color:0x000000,opacity:.22}));floor.rotation.x=-Math.PI/2;floor.position.y=-.003;floor.receiveShadow=true;scene.add(floor);
const grid=new T.GridHelper(5,25,0x526964,0x33433e);grid.position.y=-.004;scene.add(grid);
const camera=new T.PerspectiveCamera(34,1,.01,50);camera.position.set(1.65,.9,2.7);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.55,0);controls.update();
const source=new URLSearchParams(location.search).has('source');
const asset=await new GLTFLoader().loadAsync((source?'./fox-biped-source.glb':'./fox-biped.glb')+'?revision=biped-natural-idle-stance-v1');
const model=asset.scene;scene.add(model);const mixer=new T.AnimationMixer(model),guides=new T.SkeletonHelper(model);guides.visible=false;scene.add(guides);
model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
let active=null,time=0,blendRemaining=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now(),routine=null;
const clips=new Map(asset.animations.map(c=>[c.name,c]));
$('action').innerHTML=[...clips.keys()].map(name=>`<option>${name}</option>`).join('')+'<option>Source bind pose</option>';
function action(name,blend=false){controller?.restore();if(routine){routine.actor.controller.restore();routine.actor.mixer.stopAllAction();model.position.set(0,0,0);model.rotation.set(0,0,0);routine=null;camera.position.set(1.65,.9,2.7);controls.target.set(0,.55,0);controls.update();}const next=clips.get(name),info=Object.values(CLIPS).find(c=>c.name===name);if(active){if(blend&&next){active.fadeOut(.24);}else mixer.stopAllAction();}time=0;blendRemaining=blend ? .24 : 0;$('time').disabled=false;if(next){active=mixer.clipAction(next).reset().setEffectiveWeight(1);active.setLoop(info&&!info.loop?T.LoopOnce:T.LoopRepeat,Infinity);active.clampWhenFinished=true;if(blend)active.fadeIn(.24);else active.stopFading();active.play();$('time').max=next.duration;}else{mixer.stopAllAction();active=null;$('time').max=1;}if(blend){camera.position.set(...(info?.acro?[2.4,1.25,4]:[1.65,.9,2.7]));controls.target.set(0,info?.acro ? .78 : .55,info?.acro ? .25 : 0);controls.update();}model.updateMatrixWorld(true);$('action').value=name;$('stage').textContent=name.replaceAll('_',' ');}
function applyController(resolve=false){model.updateMatrixWorld(true);if(!source){controller??=new BipedController(model);const mode=Object.keys(CLIPS).find(k=>CLIPS[k].name===$('action').value);controller.apply({mode,ambientTime:time,resolve});}model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update()});}
function seek(t){controller?.restore();time=t;if(active){active.stopFading().setEffectiveWeight(1);active.time=t;mixer.update(0);}applyController();$('time').value=t;}
function yaw(a){model.rotation.y=a;model.updateMatrixWorld(true);}
function pause(){paused=true;$('play').textContent='Play';}
function play(){paused=false;$('play').textContent='Pause';}
$('action').onchange=()=>{action($('action').value,true);play()};$('play').onclick=()=>paused?play():pause();$('time').oninput=()=>{pause();seek(Number($('time').value))};$('direction').onchange=()=>yaw(Number($('direction').value)*Math.PI/4);$('skeleton').onchange=()=>guides.visible=$('skeleton').checked;
let controller=null;
function combo(hold=false){if(source)return;mixer.stopAllAction();if(routine){routine.actor.controller.restore();routine.actor.mixer.stopAllAction();}controller??=new BipedController(model);routine=new FoxAcrobatics(asset,{controller,rootName:'Biped_Motion_Root',clips:CLIPS,sequence:BIPED_ACROBATICS});$('time').disabled=true;if(hold)pause();else play();}
function stepCombo(dt){routine.step(dt);const p=model.position;camera.position.set(p.x+2.3,p.y+1.3,p.z+3.8);controls.target.set(p.x,p.y+.75,p.z);controls.update();$('stage').textContent=routine.actor.mode;}
$('acro').onclick=()=>combo();
function resize(){const h=renderer.domElement.getBoundingClientRect().height;renderer.setSize(innerWidth,h,false);camera.aspect=innerWidth/h;camera.updateProjectionMatrix()}resize();addEventListener('resize',resize);
const requested=new URLSearchParams(location.search).get('action');action(source?'Source bind pose':clips.has(requested)?requested:'Idle');
window.foxBiped={ready:true,asset,model,mixer,renderer,scene,camera,controls,action,seek,yaw,pause,play,combo,stepCombo,get routine(){return routine},get active(){return active},get time(){return time}};
$('acro').disabled=source;
$('sniff').disabled=source;$('sniff').onclick=()=>{action('Idle');seek(1.90);camera.position.set(.45,.82,1.15);controls.target.set(0,.78,.08);controls.update();play()};
function frame(now){const dt=Math.min(.05,(now-last)/1000)*Number($('speed').value);last=now;if(!paused){if(routine)stepCombo(dt);else{controller?.restore();mixer.update(dt);time=active?.time||0;applyController(blendRemaining>0);blendRemaining=Math.max(0,blendRemaining-dt);$('time').value=time;}}renderer.render(scene,camera);requestAnimationFrame(frame)}requestAnimationFrame(frame);
