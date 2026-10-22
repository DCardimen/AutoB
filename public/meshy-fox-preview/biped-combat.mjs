import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createGameReplay} from './game-replay.mjs';

// Page for the recorded game fight: Rowan against Brakk, every decision from
// the game's Battle engine (game-skirmish.json), shown on the 3D biped.
export const STEP=1/60;
const canvas=document.querySelector('#combat'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#202d32');const camera=new T.PerspectiveCamera(38,1,.01,80);
scene.add(new T.HemisphereLight(0xe7f4ff,0x71816b,1.7));
const key=new T.DirectionalLight(0xffe8ca,2.6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7});key.shadow.bias=-.0004;scene.add(key,key.target);
const rim=new T.DirectionalLight(0x99c9e7,1.4);rim.position.set(4,3,-5);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({color:0,opacity:.24}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);
// The arena grid is a texture, not line primitives (software renderers draw
// lines behind the camera as slabs). One tile is a unit of four 0.25 cells.
const tile=document.createElement('canvas');tile.width=tile.height=256;{const g=tile.getContext('2d');g.strokeStyle='#33433e';g.lineWidth=3;for(let i=0;i<4;i++){g.beginPath();g.moveTo(i*64+1.5,0);g.lineTo(i*64+1.5,256);g.moveTo(0,i*64+1.5);g.lineTo(256,i*64+1.5);g.stroke();}}
const gridTexture=new T.CanvasTexture(tile);gridTexture.wrapS=gridTexture.wrapT=T.RepeatWrapping;gridTexture.repeat.set(24,24);gridTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();gridTexture.colorSpace=T.SRGBColorSpace;
const grid=new T.Mesh(new T.PlaneGeometry(24,24),new T.MeshBasicMaterial({map:gridTexture,transparent:true,depthWrite:false}));grid.rotation.x=-Math.PI/2;grid.position.y=-.008;scene.add(grid);
const [asset,recording]=await Promise.all([new GLTFLoader().loadAsync('./fox-biped.glb?revision=biped-fluid-combat-v1'),fetch('./game-skirmish.json').then(r=>r.json())]);
const replay=createGameReplay(asset,scene,recording,camera);
function render(){key.position.copy(replay.focus).add(new T.Vector3(-4,7,5));key.target.position.copy(replay.focus);renderer.render(scene,camera);}
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
const label=document.querySelector('#task'),score=document.querySelector('#score'),play=document.querySelector('#play');
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now(),carry=0;
const hp=side=>{const f=recording.frames[Math.min(recording.frames.length-1,Math.floor(replay.state.time/recording.step))].u[side].hp;return `${Math.round(f)} / ${Math.round(recording.units[side].maxHp)}`;};
function hud(){label.textContent=replay.state.label;score.textContent=`Rowan ${hp(0)} · Brakk ${hp(1)} · ${Math.min(replay.state.time,recording.duration).toFixed(1)}s`;play.textContent=playing?'Pause':'Play';}
play.onclick=()=>{playing=!playing;last=performance.now();hud();};
document.querySelector('#restart').onclick=()=>{replay.reset();carry=0;playing=true;last=performance.now();hud();};
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing&&!replay.finished){carry+=dt;while(carry>=STEP&&!replay.finished){replay.step(STEP);carry-=STEP;}}hud();render();requestAnimationFrame(frame);}
replay.reset();hud();requestAnimationFrame(frame);
window.foxCombat={ready:true,replay,render,recording,STEP,renderer,scene,camera,pause(){playing=false;hud();},play(){playing=true;last=performance.now();carry=0;hud();}};
