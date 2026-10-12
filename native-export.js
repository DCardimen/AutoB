import {PIXEL_SPECIES,lineageLimit} from './native-content.js';
import {NATIVE_POSES,nativePosePixels} from './native-poses.js';
import {DIRECTIONS,FRAME_COUNTS,LOOP_STATES,FPS} from './prototype-export.js';
export function exportNativeAtlas(id,path='wild',stage=0){
 const spec=PIXEL_SPECIES.find(s=>s.id===id);if(!spec)throw new Error('Unknown released native family');
 if(!['wild','warden'].includes(path)||!Number.isInteger(stage)||stage<0||stage>lineageLimit({id}))throw new Error('Invalid family form');
 const canvas=document.createElement('canvas'),columns=16;canvas.width=columns*64;canvas.height=Math.ceil(NATIVE_POSES.length*8*FRAME_COUNTS/columns)*64;
 const ctx=canvas.getContext('2d'),animations=[],issues=[];let index=0;
 for(const state of NATIVE_POSES)for(let dir=0;dir<8;dir++){
  const frames=[];
  for(let f=0;f<FRAME_COUNTS;f++){
   const phase=f/(LOOP_STATES.includes(state)?FRAME_COUNTS:FRAME_COUNTS-1),pixels=nativePosePixels(spec,{id,evolution:stage,evolutionPath:path},state,phase,dir),x=index%columns*64,y=Math.floor(index/columns)*64;
   if(pixels.clipped)issues.push({state,dir,frame:f,clipped:pixels.clipped});
   ctx.putImageData(new ImageData(pixels,64,64),x,y);frames.push({x,y,width:64,height:64});index++;
  }
  animations.push({name:state+'_'+DIRECTIONS[dir],state,direction:DIRECTIONS[dir],fps:FPS[state],loop:LOOP_STATES.includes(state),frames});
 }
 return {id,path,stage,cell:[64,64],pivot:[32,44],sampling:'nearest',width:canvas.width,height:canvas.height,animations,issues,image:canvas.toDataURL('image/png')};
}
