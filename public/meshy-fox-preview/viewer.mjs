import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const canvas=document.querySelector('#view'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,690,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#202d32');
const camera=new T.PerspectiveCamera(34,innerWidth/690,.01,100);camera.position.set(0,.95,3.7);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,.85,0);controls.update();
scene.add(new T.HemisphereLight(0xe7f4ff,0x71816b,2));const key=new T.DirectionalLight(0xffe8ca,3);key.position.set(-3,5,4);scene.add(key);const rim=new T.DirectionalLight(0x99c9e7,1.7);rim.position.set(3,3,-4);scene.add(rim);
const grid=new T.GridHelper(5,20,0x526964,0x33433e);grid.position.y=-.015;scene.add(grid);
const gltf=await new GLTFLoader().loadAsync(new URLSearchParams(location.search).get('model')||'./fox-repaired.glb');
const model=gltf.scene;scene.add(model);model.updateMatrixWorld(true);
const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o)});const rests=new Map(bones.map(b=>[b,b.quaternion.clone()]));
const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o)});
const materials=new Map(meshes.map(m=>[m,m.material])),weightMaterial=new T.MeshBasicMaterial({vertexColors:true});
for(const m of meshes){const a=m.geometry.attributes,colors=new Float32Array(a.position.count*3);for(let i=0;i<a.position.count;i++){let w=0;for(let k=0;k<4;k++)if(m.skeleton?.bones[a.skinIndex.array[i*4+k]]?.name.startsWith('Tail_'))w+=a.skinWeight.array[i*4+k];colors.set([.15+.85*w,.25+.5*w,.35*(1-w)],i*3);}m.geometry.setAttribute('color',new T.BufferAttribute(colors,3));}
const helper=new T.SkeletonHelper(model);helper.material.depthTest=false;helper.material.transparent=true;helper.material.opacity=.9;helper.visible=false;helper.renderOrder=10;scene.add(helper);
let time=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=performance.now(),activeMode=null;
document.querySelector('#pause').textContent=paused?'Play':'Pause';
const mixer=new T.AnimationMixer(model),clips={tail:gltf.animations.find(a=>a.name==='Relaxed_Tail_Sway_Preview'),joints:gltf.animations.find(a=>a.name==='Joint_Check_Preview')};
function pose(t){const mode=document.querySelector('#motion').value;
  if(activeMode!==mode){mixer.stopAllAction();for(const b of bones)b.quaternion.copy(rests.get(b));if(clips[mode])mixer.clipAction(clips[mode]).reset().play();activeMode=mode;}
  if(clips[mode])mixer.setTime(t%4);
  model.updateMatrixWorld(true);for(const m of meshes)if(m.isSkinnedMesh)m.skeleton.update();
}
function yaw(angle){model.rotation.y=angle;model.updateMatrixWorld(true);}
function inspect(){const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,vertices:o.geometry.attributes.position.count,triangles:o.geometry.index?.count/3,skin:!!o.isSkinnedMesh});});return {meshes,animations:gltf.animations.map(a=>a.name),bones:bones.map(b=>({name:b.name,parent:b.parent?.name,position:b.getWorldPosition(new T.Vector3()).toArray()}))};}
document.querySelector('#bones').onchange=e=>helper.visible=e.target.checked;
document.querySelector('#weights').onchange=e=>{for(const m of meshes)m.material=e.target.checked?weightMaterial:materials.get(m)};
document.querySelector('#facing').onchange=e=>yaw(Number(e.target.value)*Math.PI/4);
document.querySelector('#pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Play':'Pause'};
document.querySelector('#status').textContent=`${bones.length} bones · ${gltf.animations.length} embedded test clips · Orbit to inspect · Preview only`;
window.fox3d={ready:true,yaw,seek:t=>{time=t;paused=true;document.querySelector('#pause').textContent='Play';pose(t)},inspect,model,bones,renderer,scene,camera};
function draw(now){if(!paused)time+=Math.min(.05,(now-last)/1000);last=now;pose(time);renderer.render(scene,camera);requestAnimationFrame(draw)}requestAnimationFrame(draw);
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,690,false);camera.aspect=innerWidth/690;camera.updateProjectionMatrix()});
