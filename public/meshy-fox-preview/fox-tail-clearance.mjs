import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';

// Test the skinned surfaces, including the proximal fur, not bone centres.
// Mixed attachment triangles form the continuous seam between the two parts.
// No pixels or triangles are hidden from the renderer.
export class FoxTailClearance {
 constructor(positions,indices,joints,weights,names,vertex){
  this.vertex=vertex;this.positions=positions;const tail=Array.from({length:positions.length/3},(_,i)=>{let w=0;for(let k=0;k<4;k++)if(names[joints[i*4+k]].startsWith('Tail_'))w+=weights[i*4+k];return w;});
  const lists=[[],[]];for(let i=0;i<indices.length;i+=3){const ids=Array.from(indices.slice(i,i+3));if(ids.every(v=>tail[v]>.5))lists[0].push(...ids);else if(ids.every(v=>tail[v]<.5))lists[1].push(...ids);}
  this.parts=lists.map(ids=>{const unique=[...new Set(ids)],map=new Map(unique.map((v,i)=>[v,i])),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(unique.length*3),3));geometry.setIndex(ids.map(v=>map.get(v)));return {unique,geometry,bvh:null};});this.identity=new T.Matrix4();this.point=new T.Vector3();
 }
 update(){for(const part of this.parts){const a=part.geometry.attributes.position;for(let i=0;i<part.unique.length;i++){this.vertex(part.unique[i],this.point);a.setXYZ(i,this.point.x,this.point.y,this.point.z);}if(part.bvh)part.bvh.refit();else part.geometry.boundsTree=part.bvh=new MeshBVH(part.geometry);}}
 intersects(){this.update();return this.parts[0].bvh.intersectsGeometry(this.parts[1].geometry,this.identity);}
 // Deterministic projection from the requested pose. Raise the complete tail
 // at its flexible first joint; never scale the fur or displace its socket.
 solve(bone,update){const base=bone.quaternion.clone(),axis=new T.Vector3(0,0,1);let corrected=false;if(this.intersects()){let low=0,high=0;for(const lift of [.12,.24,.40,.60,.85,1.1]){bone.quaternion.copy(base).premultiply(new T.Quaternion().setFromAxisAngle(axis,lift));update();if(!this.intersects()){high=lift;corrected=true;break;}low=lift;}if(!corrected)throw Error('Fox tail has no clear pose');for(let i=0;i<8;i++){const lift=(low+high)/2;bone.quaternion.copy(base).premultiply(new T.Quaternion().setFromAxisAngle(axis,lift));update();if(this.intersects())low=lift;else high=lift;}bone.quaternion.copy(base).premultiply(new T.Quaternion().setFromAxisAngle(axis,high+.006));update();}return corrected;}
}
