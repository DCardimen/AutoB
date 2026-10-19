// Assign stranded outline fragments to the painted arm they belong to.
//
// The first master pass gave every visible bind pixel one owner, but some arm
// outlines and cuff shading were saved as tiny islands of torso, cape or leg
// layers. Such an island touches nothing of its own layer; its only painted
// neighbour is the arm. When the arm swings away it is left floating in the
// air as a loose dot. Ownership follows connectivity here, never color:
// an island moves only when it is not its layer's main component, has at most
// MAX_FRAGMENT pixels, and borders exactly one arm. Re-running is a no-op.
//
//   node scripts/migrate-melee-arm-fragments.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const MAX_FRAGMENT=6,ARMS=['left-arm','right-arm'],FIXED=new Set(['ground','weapon',...ARMS]);
const root='art/melee-layers/masters',check=process.argv.includes('--check');
const NOTE='Stranded outline islands bordering one arm belong to that arm (scripts/migrate-melee-arm-fragments.mjs).';

// Same grid format as build-melee-layers.mjs (which builds on import).
function unpack(layer){const grid=new Map(),[ox,oy]=layer.origin;layer.rows.forEach((row,y)=>{for(let x=0;x<row.length/2;x++){const index=parseInt(row.slice(x*2,x*2+2),16);if(index)grid.set((oy+y)*64+ox+x,index);}});return grid;}
function pack(grid){
 if(!grid.size)return {origin:[0,0],rows:[]};
 const xs=[...grid.keys()].map(n=>n%64),ys=[...grid.keys()].map(n=>Math.floor(n/64)),left=Math.min(...xs),top=Math.min(...ys),right=Math.max(...xs),bottom=Math.max(...ys),rows=[];
 for(let y=top;y<=bottom;y++){let row='';for(let x=left;x<=right;x++)row+=(grid.get(y*64+x)||0).toString(16).padStart(2,'0');rows.push(row);}
 return {origin:[left,top],rows};
}
const neighbours=n=>{const x=n%64,y=Math.floor(n/64),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<64&&y+dy>=0&&y+dy<64)out.push((y+dy)*64+x+dx);return out;};

export function migrateFacing(facing){
 const owners=new Map(facing.ownership),layers=Object.fromEntries(Object.entries(facing.layers).map(([name,l])=>[name,unpack(l)]));
 const original=new Map();for(let n=0;n<4096;n++){const index=parseInt(facing.original.slice(n*2,n*2+2),16);if(index)original.set(n,index);}
 // A shoulder socket is the torso anchor of its arm; it never changes owner.
 const sockets=new Set(facing.arms.map(a=>Math.round(a.root.y)*64+Math.round(a.root.x)));
 // An island over another painted surface (a strap on the torso, a cape
 // fold over backing) does not float when the arm leaves. Only islands with
 // nothing beneath them are stranded.
 const backing=unpack(facing.backing),covered=(n,owner)=>backing.has(n)||Object.entries(layers).some(([name,grid])=>name!==owner&&!ARMS.includes(name)&&grid.has(n));
 const moved=[];
 // Moving one island can expose a neighbouring island to the arm. Repeat
 // until stable so a second run of the script is a true no-op.
 for(let pass=moved.length+1;pass;){const before=moved.length;migratePass(owners,layers,original,sockets,covered,moved);pass=moved.length>before;}
 if(!moved.length)return moved;
 facing.ownership=facing.ownership.map(([n])=>[n,owners.get(n)]);
 for(const name of Object.keys(facing.layers))facing.layers[name]=pack(layers[name]);
 if(!facing.notes.includes(NOTE))facing.notes.push(NOTE);
 return moved;
}
function migratePass(owners,layers,original,sockets,covered,moved){
 const components=new Map(),seen=new Set();
 for(const [n,name]of owners){
  if(FIXED.has(name)||seen.has(n))continue;
  const component=new Set([n]),queue=[n];seen.add(n);
  for(let i=0;i<queue.length;i++)for(const m of neighbours(queue[i]))if(!component.has(m)&&owners.get(m)===name){component.add(m);seen.add(m);queue.push(m);}
  if(!components.has(name))components.set(name,[]);components.get(name).push(component);
 }
 for(const [name,list]of components){
  const main=list.reduce((a,b)=>b.size>a.size?b:a);
  for(const component of list){
   if(component===main||component.size>MAX_FRAGMENT||[...component].some(n=>sockets.has(n)||covered(n,name)))continue;
   const arms=new Set([...component].flatMap(neighbours).map(m=>owners.get(m)).filter(owner=>ARMS.includes(owner)));
   if(arms.size!==1)continue;
   const arm=[...arms][0];
   if([...component].some(n=>layers[arm].has(n)||layers[name].get(n)!==original.get(n)))continue;
   for(const n of component){layers[name].delete(n);layers[arm].set(n,original.get(n));owners.set(n,arm);}
   moved.push({from:name,to:arm,pixels:component.size});
  }
 }
}

// A concealed rear arm (beneath a cloak) is the same form's front arm skin
// translated to the hidden hand socket. Keep that copy exact after the front
// arm gains its outline islands.
export function syncConcealedArms(master,changed){
 let synced=0;
 for(const facing of master.facings)for(const arm of facing.arms){
  if(!arm.occluded||arm.sourceDir===undefined)continue;
  const name=arm.side<0?'left-arm':'right-arm',source=master.facings[arm.sourceDir];
  if(!changed.has(`${arm.sourceDir}:${name}`))continue;
  const front=source.arms.find(a=>a.side===arm.side),dx=arm.end.x-front.end.x,dy=arm.end.y-front.end.y,grid=new Map();
  for(const [n,index]of unpack(source.layers[name]))grid.set((Math.floor(n/64)+dy)*64+n%64+dx,index);
  facing.layers[name]=pack(grid);synced++;
 }
 return synced;
}

if(path.basename(process.argv[1]||'')==='migrate-melee-arm-fragments.mjs'){
 const report={};
 for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.json')).sort()){
  const text=fs.readFileSync(path.join(root,file),'utf8'),eol=text.includes('\r\n')?'\r\n':'\n',master=JSON.parse(text);
  const moved=master.facings.flatMap((facing,dir)=>migrateFacing(facing).map(m=>({dir,...m})));
  syncConcealedArms(master,new Set(moved.map(m=>`${m.dir}:${m.to}`)));
  report[file]={fragments:moved.length,pixels:moved.reduce((n,m)=>n+m.pixels,0)};
  if(moved.length&&!check)fs.writeFileSync(path.join(root,file),(JSON.stringify(master,null,2)+'\n').replace(/\n/g,eol));
 }
 const total=Object.values(report).reduce((n,r)=>n+r.pixels,0);
 console.log(JSON.stringify({check,total,report},null,1));
 if(check)assert.equal(total,0,'Masters contain stranded arm fragments; run scripts/migrate-melee-arm-fragments.mjs');
}
