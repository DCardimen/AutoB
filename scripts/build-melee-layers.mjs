import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {png} from './animation-artifacts.mjs';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {decodeLayerData,decodeIndexedGrid,INDEXED_LAYER_NAMES} from '../indexed-layer-codec.js';
const root='art/melee-layers',hash=b=>createHash('sha256').update(b).digest('hex');
const provenance=JSON.parse(fs.readFileSync(root+'/sources.json','utf8'));
for(const s of provenance.sources)assert.equal(hash(fs.readFileSync(s.file)),s.sha256,'Immutable source changed: '+s.file);
export function unpack(layer){const grid=new Map(),[ox,oy]=layer.origin;layer.rows.forEach((row,y)=>{assert.equal(row.length%2,0);for(let x=0;x<row.length/2;x++){const index=parseInt(row.slice(x*2,x*2+2),16);assert.ok(Number.isInteger(index));if(index){assert.ok(ox+x>=0&&ox+x<64&&oy+y>=0&&oy+y<64);grid.set((oy+y)*64+ox+x,index);}}});return grid;}
const output={},report={schema:1,sourceFiles:provenance.sources.length,frames:0,reconstructed:0,masters:{}};
const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
function indexed(g,full=false){
 const keys=[...g.keys()],left=full||!keys.length?0:Math.min(...keys.map(n=>n%64)),right=full?63:!keys.length?-1:Math.max(...keys.map(n=>n%64)),top=full||!keys.length?0:Math.min(...keys.map(n=>Math.floor(n/64))),bottom=full?63:!keys.length?-1:Math.max(...keys.map(n=>Math.floor(n/64))),width=right-left+1,height=bottom-top+1,values=[];
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)values.push(g.get(y*64+x)||0);
 let rle='';for(let i=0;i<values.length;){let count=1;while(count<64&&i+count<values.length&&values[i+count]===values[i])count++;rle+=alphabet[count-1]+alphabet[values[i]];i+=count;}
 const packed={origin:[left,top],width,height,rle};assert.deepEqual([...decodeIndexedGrid(packed)],[...g].sort((a,b)=>a[0]-b[0]));return packed;
}
function compress(text){
 let dictionary=new Map(Array.from({length:256},(_,i)=>[String.fromCharCode(i),i])),next=257,word='';const codes=[];
 for(const c of text){assert.ok(c.charCodeAt(0)<256);const joined=word+c;if(dictionary.has(joined)){word=joined;continue;}codes.push(dictionary.get(word));dictionary.set(joined,next++);word=c;if(next===65535){codes.push(256);dictionary=new Map(Array.from({length:256},(_,i)=>[String.fromCharCode(i),i]));next=257;}}
 if(word)codes.push(dictionary.get(word));const bytes=Buffer.alloc(codes.length*2);codes.forEach((n,i)=>bytes.writeUInt16LE(n,i*2));return bytes.toString('base64');
}
const review=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'public/melee-layer-review',exportDir=review+'/layers';fs.mkdirSync(exportDir,{recursive:true});
for(const file of fs.readdirSync(root+'/masters').filter(f=>f.endsWith('.json')).sort()){
 const m=JSON.parse(fs.readFileSync(root+'/masters/'+file,'utf8'));assert.equal(m.facings.length,8);assert.equal(m.cell,64);
 const rgba=Object.fromEntries(['bind','backing',...Object.keys(m.facings[0].layers)].map(n=>[n,new Uint8ClampedArray(512*64*4)]));
 const put=(name,g,dir)=>{for(const [n,index]of g){assert.ok(index>0&&index<m.palette.length,`${file}/${name}: original material index`);const rgb=m.palette[index].match(/../g).map(v=>parseInt(v,16));rgba[name].set([...rgb,255],(Math.floor(n/64)*512+dir*64+n%64)*4);}};
 output[m.identity]??=[];output[m.identity][m.stage]=m.facings.map((f,dir)=>{
  assert.equal(f.dir,dir);assert.equal(hash(f.original),f.sourceHash);assert.equal(f.original.length,8192);
  const bind=authoredSourceFrame(m.identity,dir,m.stage),bindGrid=new Map(bind.pixels.map(p=>[p.y*64+p.x,p.index]));
  assert.deepEqual(bind.colors.map(c=>c.slice(1)),m.palette,'Converted bind palette changed; an explicit master migration is required');
  assert.equal(Array.from({length:4096},(_,n)=>(bindGrid.get(n)||0).toString(16).padStart(2,'0')).join(''),f.original,'Converted bind changed; do not silently replace the reference');
  const original=new Map();for(let n=0;n<4096;n++){const index=parseInt(f.original.slice(n*2,n*2+2),16);if(index)original.set(n,index);}put('bind',original,dir);
  const layers=Object.fromEntries(Object.entries(f.layers).map(([name,l])=>[name,unpack(l)])),owners=new Map(f.ownership);assert.equal(owners.size,original.size,'Every original visible pixel has exactly one owner');
  for(const [n,index]of original){const name=owners.get(n);assert.equal(layers[name]?.get(n),index,`${file}/${dir}/${n}: preserve original visible texture`);}
  const backing=unpack(f.backing);put('backing',backing,dir);for(const [name,g]of Object.entries(layers))put(name,g,dir);
  for(const arm of f.arms){const n=Math.round(arm.root.y)*64+Math.round(arm.root.x);assert.ok(backing.has(n)||['head','armor','body','cape-back','cape-front'].some(name=>layers[name].has(n)),`${file}/${dir}/${arm.side}: independent backing at the shoulder socket`);}
  for(const arm of f.arms){const g=layers[arm.side<0?'left-arm':'right-arm'];assert.ok(g.size>3,'Authored arm skin exists');assert.ok(g.has(arm.end.y*64+arm.end.x),'Fixed hand socket is painted');}
  for(const [y,left,right]of f.bodyRows)for(let x=left;x<=right;x++)assert.ok(backing.has(y*64+x),'Complete independent torso/hip plate');
  report.frames++;report.reconstructed+=f.reconstructed.length;
  // Store explicit ownership plus only the independently painted extra
  // pixels. Original pixels already exist in the frozen indexed atlas.
  // Reading a fixed owner is not classifying anatomy from color/position.
  const extra=Object.fromEntries(Object.entries(layers).map(([name,g])=>[name,indexed(new Map([...g].filter(([n,index])=>owners.get(n)!==name||original.get(n)!==index)))]));
  const reconstruction=new Map();for(const [x,y,,name]of f.reconstructed){const n=y*64+x;reconstruction.set(n,(reconstruction.get(n)||0)|(name==='body'?1:2));}
  const ownerGrid=indexed(new Map([...owners].map(([n,name])=>[n,INDEXED_LAYER_NAMES.indexOf(name)+1])),true),reconstructed=indexed(reconstruction);
  for(const [name,g]of Object.entries(layers)){const rebuilt=new Map([...original].filter(([n])=>owners.get(n)===name));for(const [n,index]of decodeIndexedGrid(extra[name]))rebuilt.set(n,index);assert.deepEqual([...rebuilt].sort((a,b)=>a[0]-b[0]),[...g].sort((a,b)=>a[0]-b[0]),'Lossless layer delta');}
  const rows=new Map();for(const [n]of backing){const x=n%64,y=Math.floor(n/64),row=rows.get(y);if(row){row[0]=Math.min(row[0],x);row[1]=Math.max(row[1],x);}else rows.set(y,[x,x]);}assert.deepEqual([...rows].sort((a,b)=>a[0]-b[0]).map(([y,[l,r]])=>[y,l,r]),f.bodyRows,'Explicit backing contains the exact authored contour');
  return {registration:f.registration,bodyCenter:f.bodyCenter??32,backing:indexed(backing),layers:extra,ownership:ownerGrid,arms:f.arms,legs:f.legs,reconstructed};
 });
 for(const [name,data]of Object.entries(rgba))fs.writeFileSync(`${exportDir}/${m.identity}-${m.stage}-${name}.png`,png(512,64,data));
 report.masters[file]=hash(fs.readFileSync(root+'/masters/'+file));
}
assert.equal(report.frames,168);const json=JSON.stringify(output),packed=compress(json);assert.deepEqual(decodeLayerData(packed),output,'Lossless dictionary packing');report.packing={decodedBytes:Buffer.byteLength(json),encodedBytes:packed.length};fs.writeFileSync('melee-layer-data.js','// Losslessly compiled from art/melee-layers/masters; npm run animation:layers.\nimport {decodeLayerData} from \'./indexed-layer-codec.js\';\nexport const MELEE_LAYER_DATA=decodeLayerData('+JSON.stringify(packed)+');\n');
fs.mkdirSync(review+'/checks',{recursive:true});fs.writeFileSync(review+'/checks/layer-build.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
