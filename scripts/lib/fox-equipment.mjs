import * as T from 'three';
import {BOW} from '../../public/meshy-fox-preview/fox-motion.mjs';
export function addEquipment(glb,bones,world){
 const {json:g,append}=glb;
 function material(name,color,metallic=0,roughness=.65){return g.materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...new T.Color(color).toArray(),1],metallicFactor:metallic,roughnessFactor:roughness},doubleSided:true})-1;}
 const wood=material('Bow walnut','#704425'),gold=material('Bow brass','#c49641',.55,.35),cord=material('Bow string','#e6d8af'),steel=material('Arrow steel','#b7cad0',.65,.25),feather=material('Arrow feathers','#ded8ba'),flash=material('Release glint','#ffe8a1',.1,.25);
 g.materials[flash].emissiveFactor=[1,.65,.12];
 function primitive(geometry,mat){const a=geometry.attributes,attr={};for(const [key,name,type]of [['position','POSITION','VEC3'],['normal','NORMAL','VEC3'],['uv','TEXCOORD_0','VEC2']])if(a[key])attr[name]=append(a[key].array,type,5126,34962);const p={attributes:attr,material:mat};if(geometry.index)p.indices=append(Uint16Array.from(geometry.index.array),'SCALAR',5123,34963);return p;}
 function meshNode(name,geometries,parent,translation=[0,0,0]){const mesh=g.meshes.push({name,primitives:geometries.map(([geo,mat])=>primitive(geo,mat))})-1,node=g.nodes.push({name,mesh,translation})-1;if(parent!==null){g.nodes[parent].children??=[];g.nodes[parent].children.push(node);}else g.scenes[0].nodes.push(node);return node;}
 // A shallow longbow: one continuous arc, with a straight central grip.
 const curve=new T.CatmullRomCurve3([[.10,-.29,0],[.050,-.22,0],[.010,-.13,0],[0,-.08,0],[0,.08,0],[.010,.13,0],[.050,.22,0],[.10,.29,0]].map(p=>new T.Vector3(...p)),false,'catmullrom',0);

 const bowRoot=g.nodes.push({name:'Bow_Right_Hand',translation:[-.095,-.025,-.025],children:[]})-1;g.nodes[bones.get('Hand_R')].children??=[];g.nodes[bones.get('Hand_R')].children.push(bowRoot);
 const handle=new T.CylinderGeometry(.013,.013,.18,10),bowTube=new T.TubeGeometry(curve,40,.008,7,false);const bow=meshNode('Longbow',[[bowTube,wood],[handle,gold]],bowRoot);
 const bowMesh=g.meshes[g.nodes[bow].mesh];bowMesh.weights=[0];bowMesh.extras={targetNames:['Flex']};for(let i=0;i<bowMesh.primitives.length;i++){const geo=i?handle:bowTube,delta=new Float32Array(geo.attributes.position.array.length);if(!i)for(let n=0;n<delta.length;n+=3)delta[n]=BOW.flex*Math.pow(Math.min(1,Math.abs(curve.getPointAt(Math.floor(n/3/8)/40).y)/.29),1.7);bowMesh.primitives[i].targets=[{POSITION:append(delta,'VEC3',5126,34962)}];}
 // Two tubular string segments with a draw morph. Endpoints remain fixed.
 const top=new T.Vector3(BOW.brace,.29,0),bottom=new T.Vector3(BOW.brace,-.29,0),rest=new T.Vector3(BOW.brace,BOW.nockY,0),draw=new T.Vector3(BOW.fullDraw,BOW.nockY,0);
 const stringGeos=[top,bottom].map(endpoint=>new T.TubeGeometry(new T.LineCurve3(endpoint,rest),12,.0019,5,false));
 const stringPrims=stringGeos.map((geo,n)=>{const endpoint=(n?bottom:top).clone();endpoint.x+=BOW.flex;const target=new T.TubeGeometry(new T.LineCurve3(endpoint,draw),12,.0019,5,false),delta=Float32Array.from(geo.attributes.position.array,(v,i)=>target.attributes.position.array[i]-v),p=primitive(geo,cord);p.targets=[{POSITION:append(delta,'VEC3',5126,34962)}];return p;});
 const sm=g.meshes.push({name:'BowStringDraw',primitives:stringPrims,weights:[0],extras:{targetNames:['Draw']}})-1,string=g.nodes.push({name:'Bow_String',mesh:sm,weights:[0]})-1;g.nodes[bowRoot].children.push(string);
 // At full draw the head sits a short way past the bow rather than far beyond it.
 const shaft=new T.CylinderGeometry(.003,.003,.40,6);shaft.rotateZ(Math.PI/2);shaft.translate(-.20,0,0);
 const tip=new T.ConeGeometry(.012,.055,4);tip.rotateZ(Math.PI/2);tip.translate(-.426,0,0);
 const fins=[];for(let i=0;i<3;i++){const geo=new T.BoxGeometry(.055,.026,.002);geo.translate(-.06,.011,0);geo.rotateX(i*Math.PI*2/3);fins.push([geo,feather]);}
 const arrow=meshNode('Arrow_Nock_and_Flight',[[shaft,wood],[tip,steel],...fins],null);
 const flareGeo=new T.TorusGeometry(.035,.002,5,20);flareGeo.rotateY(Math.PI/2);
 const flare=meshNode('Release_Flair',[[flareGeo,flash]],null);g.nodes[flare].scale=[0,0,0];
 const sparks=[];for(let i=0;i<5;i++){const geo=new T.OctahedronGeometry(.009,0);const id=meshNode(`Release_Spark_${i}`,[[geo,flash]],null);g.nodes[id].scale=[0,0,0];sparks.push(id);}
 return {bowRoot,bow,string,arrow,flare,sparks,materials:{wood,gold,cord,steel}};
}
