import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {readGLB} from './lib/glb.mjs';

// Import the supplied biped as authored. No mesh sculpt, replacement paws,
// limb shortening, tail relocation, generated face or old fox weights.
const directory=path.resolve(process.argv[2]||'C:/Users/David Cardimen/Downloads/Meshy_AI_fox_ranger_riggable_t_biped (1)/Meshy_AI_fox_ranger_riggable_t_biped');
const output='public/meshy-fox-preview/fox-biped-source.glb';
globalThis.window={URL};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.()})}};
const manager=new T.LoadingManager();
manager.addHandler(/.*/,{setPath(p){this.path=p;return this},load(){return new T.Texture()}});
const provenance=[];
function source(suffix){const file=fs.readdirSync(directory).find(n=>n.endsWith(suffix)),bytes=fs.readFileSync(path.join(directory,file));provenance.push({file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});return {bytes,file};}
function fbx(suffix){const {bytes}=source(suffix);return new FBXLoader(manager).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
const model=fbx('_Character_output.fbx'),running=fbx('_Animation_Running_withSkin.fbx');
const wrapper=new T.Group();wrapper.name='Biped_Source';wrapper.scale.setScalar(.01);wrapper.position.z=-.20;wrapper.add(model);
let mesh;
model.traverse(o=>{if(o.isSkinnedMesh){mesh=o;o.name='Biped_Fox';o.normalizeSkinWeights();const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));o.material=new T.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:1});}});
if(!mesh||!mesh.skeleton.bones.some(b=>b.name==='smartrigHips')||!mesh.skeleton.bones.some(b=>b.name==='Bone_019'))throw Error('Expected the newly supplied SmartRig biped.');
// Same bind anatomy, different exporter prefixes. Keep the source local tracks
// and their original 60 Hz key timing, including hands, ears and tail bones.
const clip=running.animations[0].clone();clip.name='Meshy_Running';clip.tracks=clip.tracks.filter(t=>!t.name.startsWith('Icosphere.'));
for(const track of clip.tracks)track.name=track.name.replace(/^mixamorig/,'smartrig').replace(/^target_character\./,'SmartRigArmature.');
clip.tracks=clip.tracks.filter(t=>model.getObjectByName(t.name.split('.')[0]));
wrapper.updateMatrixWorld(true);
const result=await new GLTFExporter().parseAsync(wrapper,{binary:true,animations:[clip],onlyVisible:true});
fs.writeFileSync(output,Buffer.from(result));
const glb=readGLB(output),g=glb.json;
g.images=[];g.textures=[];g.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];
function texture(suffix){const {bytes,file}=source(suffix),accessor=glb.append(new Uint8Array(bytes),'SCALAR',5121);const image=g.images.push({name:file,bufferView:g.accessors[accessor].bufferView,mimeType:'image/png'})-1;return g.textures.push({sampler:0,source:image})-1;}
const color=texture('_texture_0.png'),normal=texture('_texture_0_normal.png');
// Meshy's separate grayscale metallic/roughness maps need G/B packing for
// glTF. Pack losslessly with Pillow; never bake lighting into the color map.
const {execFileSync}=await import('node:child_process');
const rough=source('_texture_0_roughness.png'),metal=source('_texture_0_metallic.png');
const packed=execFileSync('python',['-c',"from PIL import Image; import sys,io; r=Image.open(sys.argv[1]).convert('L'); m=Image.open(sys.argv[2]).convert('L'); b=io.BytesIO(); Image.merge('RGB',(Image.new('L',r.size,255),r,m)).save(b,format='PNG'); sys.stdout.buffer.write(b.getvalue())",path.join(directory,rough.file),path.join(directory,metal.file)],{maxBuffer:32*1024*1024});
const a=glb.append(new Uint8Array(packed),'SCALAR',5121),im=g.images.push({name:'Original roughness G / metallic B',bufferView:g.accessors[a].bufferView,mimeType:'image/png'})-1,mr=g.textures.push({sampler:0,source:im})-1;
g.materials[0]={name:'Meshy authored fox PBR',pbrMetallicRoughness:{baseColorTexture:{index:color},baseColorFactor:[1,1,1,1],metallicRoughnessTexture:{index:mr},metallicFactor:1,roughnessFactor:1},normalTexture:{index:normal}};
g.asset.extras={source:'Meshy_AI_fox_ranger_riggable_t_biped (1)',provenance,scope:'Base fox only. Original SmartRig geometry, finger/ear/tail rig and supplied Running animation.',changes:['centimeters to meters on wrapper','20 cm scene centering on wrapper','four-weight normalization','FBX-to-glTF UV vertical convention','lossless PBR channel packing']};
glb.write(output);
fs.writeFileSync('public/meshy-fox-preview/biped-provenance.json',JSON.stringify(g.asset.extras,null,2)+'\n');
console.log(JSON.stringify({output,vertices:mesh.geometry.attributes.position.count,bones:mesh.skeleton.bones.length,nativeRun:clip.duration,bytes:fs.statSync(output).size},null,2));
