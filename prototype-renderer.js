import * as T from 'three';
import { createCharacterModel, cloneCharacterModel, poseCharacterModel, characterModelStats } from './prototype-models.js';

const FRAME=256,ROOT=194,RASTER=1.5,vertical=Math.sqrt(1-0.58**2);
let renderer,scene,camera,batchCamera,active,queue=null,lastCalls=0;
const instances=new Map();
export function initializeCharacterRenderer(){
  if(renderer)return;
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setSize(FRAME*RASTER,FRAME*RASTER,false);renderer.setClearColor(0x000000,0);
  renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,0,1),0)];
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new T.Scene();scene.add(new T.HemisphereLight(0xe2e9d3,0x393d2c,2.1));
  const key=new T.DirectionalLight(0xffdfad,3.3);key.position.set(-100,-180,250);scene.add(key);
  const rim=new T.DirectionalLight(0xa4c9d8,1.7);rim.position.set(100,140,170);scene.add(rim);
  camera=new T.OrthographicCamera(-FRAME/2,FRAME/2,ROOT,ROOT-FRAME,0.1,3000);camera.up.set(0,0,1);
  camera.position.set(0,-vertical*1000,0.58*1000);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  batchCamera=camera.clone();batchCamera.left=0;batchCamera.right=1000;batchCamera.top=650;batchCamera.bottom=0;batchCamera.updateProjectionMatrix();
}
function hideCharacters(){for(const root of scene.children)if(root.userData.id)root.visible=false;}
function size(w,h){if(renderer.domElement.width!==w||renderer.domElement.height!==h)renderer.setSize(w,h,false);}
function pose(model,rig,angle,scale=1){
  poseCharacterModel(model,rig);model.root.position.set(0,0,0);model.root.scale.set(scale,-scale,scale/vertical);
  model.root.rotation.set(0,(rig.death||0)*1.5,-angle,'ZYX');model.root.updateMatrixWorld(true);
  if(rig.death>0){model.skin.computeBoundingBox();const bounds=model.skin.boundingBox.clone().applyMatrix4(model.root.matrixWorld);model.root.position.z-=bounds.min.z;model.root.updateMatrixWorld(true);}
}
export function renderCharacterFrame(id,rig,angle){
  initializeCharacterRenderer();const model=createCharacterModel(id);
  hideCharacters();if(model.root.parent!==scene)scene.add(model.root);model.root.visible=true;active=model;
  // Reflect ground Y so the orthographic camera agrees with groundToScreen:
  // South faces the viewer, and increasing ground Y moves down the canvas.
  pose(model,rig,angle);size(FRAME*RASTER,FRAME*RASTER);
  renderer.render(scene,camera);
  const canvas=document.createElement('canvas');canvas.width=FRAME*RASTER;canvas.height=FRAME*RASTER;canvas.getContext('2d').drawImage(renderer.domElement,0,0);return canvas;
}
export function beginCharacterFrame(){initializeCharacterRenderer();queue=[];}
export function queueCharacter(id,rig,angle,x,y,scale,transform){
  if(queue===null)return false;
  queue.push({id,rig,angle,x:transform.a*x+transform.c*y+transform.e,y:transform.b*x+transform.d*y+transform.f,scale:scale*transform.a});return true;
}
export function flushCharacterFrame(c){
  if(queue===null)return;hideCharacters();
  queue.forEach((item,i)=>{
    const key=item.id+':'+i;let model=instances.get(key);if(!model){model=cloneCharacterModel(item.id);instances.set(key,model);scene.add(model.root);}
    pose(model,item.rig,item.angle,item.scale);model.root.position.x=item.x;model.root.position.y=(650-item.y)/0.58;model.root.visible=true;model.root.updateMatrixWorld(true);
  });
  const raster=Math.min(1.5,window.devicePixelRatio||1);
  size(Math.round(1000*raster),Math.round(650*raster));renderer.render(scene,batchCamera);lastCalls=renderer.info.render.calls;
  c.save();c.resetTransform();c.drawImage(renderer.domElement,0,0,1000,650);c.restore();queue=null;
}
export function characterRendererStats(){return {type:'WebGL2',models:characterModelStats(),continuousFacing:true,paintedViewCropping:false,arenaPasses:1,drawCalls:lastCalls,instances:instances.size};}
