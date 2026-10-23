import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
const caches=new WeakMap();
const queryCaches=new WeakMap();
function quiverGeometry(quiver){
 let c=queryCaches.get(quiver);if(!c){const meshes=quiver.getObjectByName('Quiver_Body').children.slice(0,4),index=[];let count=0;for(const mesh of meshes){for(const id of mesh.geometry.index.array)index.push(count+id);count+=mesh.geometry.attributes.position.count;}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));geometry.setIndex(index);c={meshes,geometry};queryCaches.set(quiver,c);}
 const point=new T.Vector3(),attr=c.geometry.attributes.position;let i=0;for(const mesh of c.meshes)for(let v=0;v<mesh.geometry.attributes.position.count;v++){point.fromBufferAttribute(mesh.geometry.attributes.position,v).applyMatrix4(mesh.matrixWorld);attr.setXYZ(i++,point.x,point.y,point.z);}c.geometry.computeBoundingBox();if(c.geometry.boundsTree)c.geometry.boundsTree.refit();else c.geometry.boundsTree=new MeshBVH(c.geometry);return c.geometry;
}
function clothingSurface(body,skin){
 let cache=caches.get(body);if(!cache){
  const p=body.geometry.attributes.position.array,j=body.geometry.attributes.skinIndex.array,w=body.geometry.attributes.skinWeight.array,names=body.skeleton.bones.map(b=>b.name),all=body.geometry.index?.array||Array.from({length:p.length/3},(_,i)=>i),ids=[],inside=i=>{let tail=0;for(let k=0;k<4;k++)if(/^Bone_01[5-9]$/.test(names[j[i*4+k]]))tail+=w[i*4+k];return tail<.05&&Math.abs(p[i*3])<.12&&p[i*3+1]>-.16&&p[i*3+2]>.405&&p[i*3+2]<.615;};
  for(let i=0;i<all.length;i+=3){const tri=[all[i],all[i+1],all[i+2]];if(tri.every(inside))ids.push(...tri);}
  const unique=[...new Set(ids)],map=new Map(unique.map((v,i)=>[v,i])),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(unique.length*3),3));geometry.setIndex(ids.map(v=>map.get(v)));cache={unique,geometry};caches.set(body,cache);
 }
 const point=new T.Vector3(),a=cache.geometry.attributes.position;for(const [i,v]of cache.unique.entries()){skin.vertex(v,point);a.setXYZ(i,point.x,point.y,point.z);}if(cache.bvh)cache.bvh.refit();else cache.bvh=new MeshBVH(cache.geometry);return cache;
}
export function fitBipedQuiver(quiver,body,audit){
 const clothing=clothingSurface(body,audit.skin);
 const centre=quiver.getWorldPosition(new T.Vector3()),front=new T.Vector3(0,0,1).applyQuaternion(quiver.parent.getWorldQuaternion(new T.Quaternion())),axis=new T.Vector3(0,1,0).applyQuaternion(quiver.getWorldQuaternion(new T.Quaternion())),radius=(.04*1.02+.0045)*.65*Math.sqrt(1-front.dot(axis)**2),inverse=body.matrixWorld.clone().invert();let gap=Infinity,hits=0;
 for(let i=0;i<9;i++){
  const point=centre.clone().addScaledVector(axis,(i/8-.5)*.205*.65),ray=new T.Ray(point.clone().addScaledVector(front,-.2),front.clone()).applyMatrix4(inverse),hit=clothing.bvh.raycastFirst(ray,T.DoubleSide);if(!hit)continue;
  const surface=hit.point.applyMatrix4(body.matrixWorld),distance=surface.sub(point).dot(front)-radius;gap=Math.min(gap,distance);hits++;
 }
 if(!hits)throw Error('Quiver has no clothing surface behind its mount');
 const shift=gap-.001;quiver.position.copy(quiver.parent.worldToLocal(centre.clone().addScaledVector(front,shift)));quiver.updateMatrixWorld(true);
 let total=shift;
 const overlaps=()=>audit.parts[1].bvh.intersectsGeometry(quiverGeometry(quiver),inverse);
 const move=amount=>{quiver.position.copy(quiver.parent.worldToLocal(quiver.getWorldPosition(new T.Vector3()).addScaledVector(front,amount)));quiver.updateMatrixWorld(true);total+=amount;};
 // Exact tube/cap/rim/band surfaces refine the ray estimate. This includes the
 // source's raised leather rosette, which a centre-line ray alone can miss.
 if(overlaps()){
  const start=quiver.getWorldPosition(new T.Vector3());let low=0,high=0;
  const at=distance=>{quiver.position.copy(quiver.parent.worldToLocal(start.clone().addScaledVector(front,-distance)));quiver.updateMatrixWorld(true);};
  for(const distance of [.002,.004,.008,.016,.032,.064,.10,.15]){at(distance);if(!overlaps()){high=distance;break;}low=distance;}
  if(!high)throw Error('Quiver cannot clear the authored clothing surface');
  for(let i=0;i<8;i++){const mid=(low+high)/2;at(mid);if(overlaps())low=mid;else high=mid;}at(high+.001);total-=high+.001;
 }
 function contact(){const closest={};audit.parts[1].bvh.closestPointToGeometry(quiverGeometry(quiver),inverse,closest,{},.0015,.01);if(closest.distance===undefined)audit.parts[1].bvh.closestPointToGeometry(quiverGeometry(quiver),inverse,closest,{},.0015,.2);return closest;}
 let closest=contact();
 for(let i=0;i<3;i++){
  if(closest.distance<=.0015)break;
  const amount=closest.distance-.001;move(amount);if(overlaps()){move(-amount);break;}
  closest=contact();
 }
 // Every returned pose has already passed the complete intersection query.
 // A witnessed surface pair within 1.5 mm proves contact without spending a
 // frame finding a more precise global minimum among thousands of facets.
 closest=contact();return {shift:total,gap:closest.distance,hits};
}
