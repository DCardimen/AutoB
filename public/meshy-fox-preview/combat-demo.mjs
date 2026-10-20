import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createCombat,STEP,DURATION} from './fox-combat-sim.mjs';

const canvas=document.querySelector('#combat'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#202d32');const camera=new T.PerspectiveCamera(38,1,.01,80);
scene.add(new T.HemisphereLight(0xe7f4ff,0x71816b,1.7));const key=new T.DirectionalLight(0xffe8ca,2.6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7});key.shadow.bias=-.0004;scene.add(key,key.target);const rim=new T.DirectionalLight(0x99c9e7,1.4);rim.position.set(4,3,-5);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({color:0,opacity:.24}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);
// The arena grid is a texture, not line primitives: the camera stands inside
// it, and lines running behind the camera rasterize as stepped slabs on some
// software renderers (Mesa llvmpipe). One tile is a unit of four 0.25 cells.
const tile=document.createElement('canvas');tile.width=tile.height=256;{const g=tile.getContext('2d');g.strokeStyle='#33433e';g.lineWidth=3;for(let i=0;i<4;i++){g.beginPath();g.moveTo(i*64+1.5,0);g.lineTo(i*64+1.5,256);g.moveTo(0,i*64+1.5);g.lineTo(256,i*64+1.5);g.stroke();}}
const gridTexture=new T.CanvasTexture(tile);gridTexture.wrapS=gridTexture.wrapT=T.RepeatWrapping;gridTexture.repeat.set(24,24);gridTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();gridTexture.colorSpace=T.SRGBColorSpace;
const grid=new T.Mesh(new T.PlaneGeometry(24,24),new T.MeshBasicMaterial({map:gridTexture,transparent:true,depthWrite:false}));grid.rotation.x=-Math.PI/2;grid.position.y=-.008;scene.add(grid);
const asset=await new GLTFLoader().loadAsync('./fox-animated.glb'),combat=createCombat(asset,scene,camera),{state}=combat;
function render(){key.position.copy(combat.focus).add(new T.Vector3(-4,7,5));key.target.position.copy(combat.focus);renderer.render(scene,camera);}
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now(),carry=0;
const label=document.querySelector('#task'),score=document.querySelector('#score'),play=document.querySelector('#play');
function hud(){label.textContent=state.label;score.textContent=`${state.shots.filter(s=>s.hit).length} / ${state.shots.length} hits`;play.textContent=playing?'Pause':'Play';}
play.onclick=()=>{playing=!playing;last=performance.now();hud();};document.querySelector('#restart').onclick=()=>{combat.reset();carry=0;playing=true;last=performance.now();hud();};
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing&&state.time<DURATION){carry+=dt;while(carry>=STEP&&state.time<DURATION){combat.step();carry-=STEP;}}hud();render();requestAnimationFrame(frame);}
combat.reset();hud();requestAnimationFrame(frame);
window.foxCombat={ready:true,...combat,render,pause(){playing=false;hud();},play(){playing=true;last=performance.now();carry=0;hud();},get playing(){return playing;},renderer,scene,camera,DURATION};
