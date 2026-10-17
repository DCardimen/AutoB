// Carry only the authored sprite, never the surrounding inventory/card UI.
export function dragSprite(source,fallbackHTML=''){
 let art=source.querySelector('.item-art,.skill-icon img,.idle-portrait canvas,img,canvas');
 if(!art&&fallbackHTML){const fallback=document.createElement('div');fallback.innerHTML=fallbackHTML;art=fallback.querySelector('img');}
 art||=source.querySelector('.skill-icon,.relic-symbol')||source;
 const ghost=document.createElement('div');ghost.className='loadout-sprite-ghost';ghost.setAttribute('aria-hidden','true');
 let sprite;
 if(art.tagName==='CANVAS'){sprite=document.createElement('canvas');sprite.width=art.width;sprite.height=art.height;sprite.getContext('2d').drawImage(art,0,0);}
 else if(art.tagName==='IMG')sprite=art.cloneNode();
 else{sprite=document.createElement('span');sprite.textContent=art===source?source.querySelector('span')?.textContent?.trim().slice(0,3)||'\u2726':art.textContent.trim();}
 sprite.removeAttribute('id');sprite.removeAttribute('style');sprite.className='dragged-sprite';ghost.append(sprite);document.body.append(ghost);return ghost;
}
export function moveDragSprite(ghost,x,y){ghost.style.left=x+'px';ghost.style.top=y+'px';}
export function settleDragSprite(ghost,destination,{reducedMotion=false,cancelled=false}={}){
 if(!ghost)return;
 if(!destination?.isConnected){ghost.remove();return;}
 const art=destination.matches('.item-art,img,canvas')?destination:destination.querySelector('.item-art,.idle-portrait canvas,img,canvas');
 const box=(art||destination).getBoundingClientRect(),origin=ghost.getBoundingClientRect(),sprite=ghost.firstElementChild?.getBoundingClientRect(),landingScale=art&&sprite?.width?Math.min(2,box.width/sprite.width):1,dx=box.left+box.width/2-(origin.left+origin.width/2),dy=box.top+box.height/2-(origin.top+origin.height/2);
 art?.classList.add('drop-art-pending');
 ghost.classList.add('settling');
 const base='translate(-50%,-65%)',at=(x,y,scale=1)=>`${base} translate(${x}px,${y}px) scale(${scale})`;
 const animation=ghost.animate(reducedMotion?[{opacity:1},{opacity:0}]:[
  {transform:at(0,0),opacity:1,offset:0},
  {transform:at(dx,dy-24,landingScale*1.1),opacity:1,offset:.58},
  {transform:at(dx,dy+3,landingScale*.88),opacity:1,offset:.82},
  {transform:at(dx,dy,landingScale),opacity:1,offset:1}
 ],{duration:reducedMotion?80:cancelled?240:460,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
 const done=()=>{ghost.remove();art?.classList.remove('drop-art-pending');if(!cancelled&&destination.isConnected){destination.classList.remove('sprite-drop-landed');void destination.offsetWidth;destination.classList.add('sprite-drop-landed');destination.addEventListener('animationend',()=>destination.classList.remove('sprite-drop-landed'),{once:true});}};
 animation.finished.then(done,done);
}
