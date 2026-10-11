import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCharacterModel,cloneCharacterModel,poseCharacterModel} from '../prototype-models.js';
import {characterRig} from '../prototype-rig.js';
import {locomotionPose} from '../prototype-motion.js';
const ids=['knight','orc','elf','caster','wolf'];
test('arena instances have independent skeletons and independently animated bow strings',()=>{
  for(const id of ids){const a=cloneCharacterModel(id),b=cloneCharacterModel(id);poseCharacterModel(a,characterRig(id,'walk',0.1));poseCharacterModel(b,characterRig(id,'sprint',0.7));
    assert.notEqual(a.skin.skeleton,b.skin.skeleton);assert.notEqual(a.nodes.head,b.nodes.head);const before=a.nodes.head.position.clone();poseCharacterModel(b,characterRig(id,'death',1));assert.ok(a.nodes.head.position.equals(before));
    assert.equal(a.skin.geometry,b.skin.geometry);if(id==='elf')assert.notEqual(a.string.geometry,b.string.geometry);
  }
});
function components(g){
  const n=g.attributes.position.count,parent=Array.from({length:n},(_,i)=>i),find=i=>parent[i]===i?i:parent[i]=find(parent[i]);
  for(let i=0;i<g.index.count;i+=3){const a=g.index.array[i],b=g.index.array[i+1],c=g.index.array[i+2];parent[find(a)]=find(b);parent[find(b)]=find(c);}
  return new Set(parent.map((_,i)=>find(i))).size;
}
test('all five characters have one welded skin surface including head, neck and limb roots',()=>{
  for(const id of ids){const m=createCharacterModel(id);assert.equal(m.skin.isSkinnedMesh,true);assert.equal(components(m.skin.geometry),1,id+' must have continuous anatomy');assert.ok(m.skin.geometry.attributes.position.count>4000);}
});
test('every skin vertex has normalized, finite weights on existing bones',()=>{
  for(const id of ids){const m=createCharacterModel(id),g=m.skin.geometry;for(let i=0;i<g.attributes.position.count;i++){let total=0;for(let j=0;j<4;j++){const w=g.attributes.skinWeight.array[i*4+j],b=g.attributes.skinIndex.array[i*4+j];assert.ok(Number.isFinite(w)&&w>=0);assert.ok(b<m.skin.skeleton.bones.length);total+=w;}assert.ok(Math.abs(total-1)<1e-6);}}
});
test('canonical model height is invariant across all eight facing directions',()=>{
  for(const id of ids){const m=createCharacterModel(id);poseCharacterModel(m,characterRig(id,'idle',0.25));m.skin.computeBoundingBox();const box=m.skin.boundingBox.clone(),height=box.max.z-box.min.z;
    for(let i=0;i<8;i++){const b=box.clone().applyMatrix4(new T.Matrix4().makeRotationZ(i*Math.PI/4));assert.ok(Math.abs(b.max.z-b.min.z-height)<1e-8);}
  }
});
test('rendered weapon grips and both axe hands agree with the simulation rig throughout attacks',()=>{
  for(const id of ['knight','orc','elf','caster']){
    const m=createCharacterModel(id);
    for(const stage of ['windup','recovery'])for(let i=0;i<=32;i++){
      const rig=characterRig(id,id==='caster'?'cast':'attack',i/32,stage);poseCharacterModel(m,rig);
      const grip=m.weapon.getWorldPosition(new T.Vector3());assert.ok(grip.distanceTo(new T.Vector3(rig.weapon.grip.x,rig.weapon.grip.y,rig.weapon.grip.z))<1e-7);
      const hand=m.nodes['hand'+(id==='elf'?-1:1)].getWorldPosition(new T.Vector3());assert.ok(hand.distanceTo(grip)<1e-7);
      if(id==='orc'){const other=m.nodes['hand-1'].getWorldPosition(new T.Vector3()),expected=grip.clone().addScaledVector(new T.Vector3(rig.weapon.axis.x,rig.weapon.axis.y,rig.weapon.axis.z),-11);assert.ok(other.distanceTo(expected)<1e-7);}
    }
  }
});
test('planted boot orientation follows its ground anchor rather than rotating with the torso',()=>{
  const m=createCharacterModel('knight'),rig=characterRig('knight','walk',0.2);rig.legs[0].foot.angle=-0.65;rig.legs[0].foot.pitch=0;
  poseCharacterModel(m,rig);const axis=new T.Vector3(1,0,0).applyQuaternion(m.nodes.foot0.quaternion);assert.ok(Math.abs(Math.atan2(axis.y,axis.x)+0.65)<1e-8);
});
test('heel strike lifts the toe and toe-off lifts the heel while modeled soles remain above ground',()=>{
  for(const id of ids){const m=createCharacterModel(id);for(const phase of [0,0.1,0.3,0.6]){
    const rig=characterRig(id,'walk',phase);poseCharacterModel(m,rig);
    for(const leg of rig.legs){const node=m.nodes['foot'+leg.index],axis=new T.Vector3(1,0,0).applyQuaternion(node.quaternion);assert.ok(axis.z*leg.foot.pitch<=1e-8);
      let min=Infinity;node.traverse(child=>{if(!child.isMesh)return;const a=child.geometry.attributes.position;for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(child.matrixWorld);min=Math.min(min,v.z);}});
      assert.ok(min>=-1e-5,id+' sole must not penetrate the ground');if(leg.foot.planted)assert.ok(min<0.35,id+' sole must actually touch the ground');
    }
  }}
});
test('authored gait tracks close continuously and put the pelvis over the supporting side',()=>{
  for(const id of ids)for(const run of [0,0.5,1])for(const sprint of [0,1]){
    const a=locomotionPose(id,0,run,sprint),b=locomotionPose(id,1-1e-7,run,sprint);for(const key of Object.keys(a))assert.ok(Math.abs(a[key]-b[key])<1e-4);
    assert.ok(locomotionPose(id,0.25,run,sprint).sway<0);assert.ok(locomotionPose(id,0.75,run,sprint).sway>0);
  }
});
