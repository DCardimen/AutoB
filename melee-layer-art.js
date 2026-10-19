import {MELEE_LAYER_DATA} from './melee-layer-data.js';
import {decodeIndexedGrid,INDEXED_LAYER_NAMES} from './indexed-layer-codec.js';
const key=(x,y)=>y*64+x;
export const MELEE_LAYER_ORDER=['cape-back','body','left-leg','right-leg','armor','head','cape-front'];
function pixels(grid,asset,name,underlay=false){return [...grid].sort((a,b)=>a[0]-b[0]).map(([n,index])=>({x:n%64,y:Math.floor(n/64),index,color:asset.colors[index],rgb:asset.colors[index].slice(1).match(/../g).map(v=>parseInt(v,16)),layer:name,bodyUnderlay:underlay}));}
export function meleeLayerParts(asset,identity,stage,dir){
 const master=MELEE_LAYER_DATA[identity]?.[stage]?.[dir];if(!master)return null;
 const ownership=new Map([...decodeIndexedGrid(master.ownership)].map(([n,id])=>[n,INDEXED_LAYER_NAMES[id-1]])),grids=Object.fromEntries(INDEXED_LAYER_NAMES.map(n=>[n,new Map()]));
 for(const p of asset.pixels){const n=key(p.x,p.y),name=ownership.get(n);if(!name)throw Error('Unregistered source pixel');grids[name].set(n,p.index);}
 for(const [name,encoded]of Object.entries(master.layers))for(const [n,index]of decodeIndexedGrid(encoded))grids[name].set(n,index);
 const layers=Object.fromEntries(Object.entries(grids).map(([n,g])=>[n,pixels(g,asset,n)])),bodyRows=new Map(),reconstruction=decodeIndexedGrid(master.reconstructed);
 // A back-cape pixel visible in the source proves no torso lies in front of
 // it. Reconstructed fill painted there replaced original artwork at rest.
 const backing=pixels(decodeIndexedGrid(master.backing),asset,'body',true).filter(p=>ownership.get(key(p.x,p.y))!=='cape-back'),reconstructed=new Set([...reconstruction].filter(([,id])=>id&1).map(([n])=>n));
 for(const p of backing){const row=bodyRows.get(p.y);if(row){row.left=Math.min(row.left,p.x);row.right=Math.max(row.right,p.x);}else bodyRows.set(p.y,{left:p.x,right:p.x});}
 for(const p of layers.body)if(reconstructed.has(key(p.x,p.y)))p.bodyUnderlay=true;
 const reconstructedCape=new Set([...reconstruction].filter(([,id])=>id&2).map(([n])=>n));
 for(const name of ['cape-back','cape-front'])for(const p of layers[name])if(reconstructedCape.has(key(p.x,p.y)))p.bodyUnderlay=true;
 const body=MELEE_LAYER_ORDER.flatMap(n=>layers[n]),profiles=new Map(master.arms.map(a=>{const ps=layers[a.side<0?'left-arm':'right-arm'];return [a.side,{...a,pixels:ps,grid:new Map(ps.map(p=>[key(p.x,p.y),p]))}];}));
 const mask=new Set([...ownership].filter(([,n])=>n==='left-arm'||n==='right-arm').map(([k])=>k)),hands=Object.fromEntries([...profiles].map(([side,p])=>[side,{...p.grid.get(key(p.end.x,p.end.y))}]));
 const cape=[...layers['cape-back'],...layers['cape-front']],capeMask=new Set(cape.map(p=>key(p.x,p.y)));
 const repairs=layers.body.filter(p=>p.bodyUnderlay),clothing={pixels:cape.filter(p=>ownership.get(key(p.x,p.y))===p.layer),repairs:cape.filter(p=>reconstructedCape.has(key(p.x,p.y))).map(p=>({...p,clothingUnderlay:true})),materials:new Set(cape.map(p=>p.index))};
 return {authoredLayers:true,registration:master.registration,bodyCenter:master.bodyCenter,hands,arms:{profiles,mask},body,head:layers.head,torso:[...layers.body,...layers.armor],legs:[...layers['left-leg'],...layers['right-leg']],cape,capeMask,clothing,repairs,bodyRows,underbody:backing,layers,ownership,legRegistration:master.legs};
}
// Each saved surface owns its transform and rasterization. A cape and the
// torso behind it may occupy the SAME bind coordinate with different motion.
// They must never share the inverse estimate of a flattened combined image.
// The backing is the torso surface BEHIND the arms, so it also lies beneath
// the far arm. `brush.data.backingMask` records which final pixels are still
// that hidden fill, letting the compositor put them under the far limb.
// Painting it together with the visible body erased far arms that overlap
// the chest in quarter and profile views.
export function paintMeleeLayers(brush,parts,colors,project){
 const grids=[],mask=new Uint8Array(64*64),hidden=new Set(parts.underbody);
 const dot=(x,y,color,fill)=>{brush.dot(x,y,color);x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<64&&y<64)mask[y*64+x]=fill;};
 brush.data.backingMask=mask;
 for(const name of MELEE_LAYER_ORDER){
  const ps=name==='body'?[...parts.underbody,...parts.layers.body]:parts.layers[name],mapped=new Map();
  for(const p of ps){
   const fill=hidden.has(p)?1:0;
   const q=project(name,p.x,p.y),corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([dx,dy])=>project(name,p.x+dx,p.y+dy)),xs=corners.map(v=>v.x),ys=corners.map(v=>v.y),color=colors[p.index];
   const left=Math.ceil(Math.min(...xs)-1e-8),right=Math.floor(Math.max(...xs)+1e-8),top=Math.ceil(Math.min(...ys)-1e-8),bottom=Math.floor(Math.max(...ys)+1e-8);
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    let positive=false,negative=false;for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],c=(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);if(c>1e-8)positive=true;if(c< -1e-8)negative=true;}
    if(!(positive&&negative))dot(x,y,color,fill);
   }
   dot(q.x,q.y,color,fill);mapped.set(key(p.x,p.y),q);
  }grids.push({name,mapped});
 }return grids;
}
