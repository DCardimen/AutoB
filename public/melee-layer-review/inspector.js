import {authoredSourceFrame} from '/authored-sprite-renderer.js';
import {authoredParts} from '/authored-parts.js';
import {MELEE_LAYER_ORDER,paintMeleeLayers} from '/melee-layer-art.js';
import {nativePoseRig} from '/native-poses.js';
import {PIXEL_SPECIES} from '/native-content.js';
import {paintCharacterPixels,PixelBrush} from '/prototype-pixel-art.js';
const $=id=>document.getElementById(id),names=['cape-back','body','left-leg','right-leg','armor','head','cape-front','left-arm','right-arm','weapon'];
for(const name of names){const label=document.createElement('label');label.innerHTML=`<input type="checkbox" value="${name}" checked>${name}`;$('layers').append(label);}
let playing=true,time=.375,previous=performance.now(),selection='',master;
$('pause').onclick=()=>{playing=!playing;$('pause').textContent=playing?'Pause':'Play';};$('phase').oninput=()=>{time=Number($('phase').value);playing=false;$('pause').textContent='Play';};
function draw(id,rgba){const c=$(id),x=c.getContext('2d'),small=document.createElement('canvas');small.width=small.height=64;small.getContext('2d').putImageData(new ImageData(rgba,64,64),0,0);x.clearRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;x.drawImage(small,0,0,192,192);x.drawImage(small,192,128,64,64);}
async function frame(now){try{
 const identity=$('family').value,stage=Number($('form').value),dir=Number($('direction').value),state=$('state').value,key=identity+'-'+stage;
 if(key!==selection){selection=key;master=await fetch(`masters/${key}.json`).then(r=>{if(!r.ok)throw Error(r.status);return r.json();});$('sheet').href=`sheets/${key}.png`;$('json').href=`masters/${key}.json`;$('raw').href='/'+master.source.file;$('original').src=`originals/${key}.png`;}
 if(playing)time=(time+(now-previous)/1000/1.25)%1;previous=now;$('phase').value=time;$('position').textContent=time.toFixed(3);
 const a=authoredSourceFrame(identity,dir,stage),p=authoredParts(a,identity,stage,dir),bind=new Uint8ClampedArray(16384);for(const v of a.pixels)bind.set([...v.rgb,255],(v.y*64+v.x)*4);draw('bind',bind);
 const shown=new Set([...document.querySelectorAll('#layers input:checked')].map(i=>i.value)),isolated=new Uint8ClampedArray(16384);
 for(const name of MELEE_LAYER_ORDER){if(!shown.has(name))continue;for(const v of name==='body'?[...p.underbody,...p.layers.body]:p.layers[name])isolated.set([...v.rgb,255],(v.y*64+v.x)*4);}
 for(const name of ['left-arm','right-arm'])if(shown.has(name))for(const v of p.layers[name])isolated.set([...v.rgb,255],(v.y*64+v.x)*4);draw('parts',isolated);
 const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted),rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},state,time);rig.artStage=stage;
 const full=paintCharacterPixels(rig.id,rig,dir*Math.PI/4);
 if(shown.size===names.length)draw('animated',full);else{
  const brush=new PixelBrush(),filtered={...p,layers:Object.fromEntries(Object.entries(p.layers).map(([n,v])=>[n,shown.has(n)?v:[]])),underbody:shown.has('body')?p.underbody:[]};paintMeleeLayers(brush,filtered,rig.artArmSkin.colors,(name,x,y)=>rig.artLayerProject(name,x,y));
  for(const arm of rig.arms){const screen=rig.artArmScreens[arm.side],name=screen<0?'left-arm':'right-arm';if(!shown.has(name))continue;for(const v of rig.artArmPixels.get(arm.side)?.values()||[])brush.dot(v.q.x,v.q.y,v.color);}draw('animated',brush.data);
 }
 $('meaning').textContent=`${identity} · exact art ${stage} · facing ${dir}. Body center ${p.bodyCenter}; ${p.underbody.length} independent backing pixels. Unused mature art remains selectable even when a companion's gameplay evolution maps to apex art.`;
}catch(e){$('meaning').textContent='Review error: '+e.message;throw e;}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
