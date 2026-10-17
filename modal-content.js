// Patch a dialog that is already open. Keeping its actual DOM nodes preserves
// the backdrop fade, decoded images, painted canvases, focus and scroll state.
const identityAttributes=['data-field-node','data-field-enter','data-starter','data-party-remove','data-difficulty','data-starter-idle','data-elite-starter','data-party-select','data-detail-tab','data-intel-tab','data-gear-equip','data-gear-remove','data-gear-claim','data-upgrade','data-kit-control','data-capture-method','data-gear-type','data-action'];
function key(node){
 if(node.nodeType!==1)return null;
 if(node.id)return node.tagName+'#'+node.id;
 if(node.matches('.starter-choice'))return 'starter-choice:'+node.querySelector('[data-starter]')?.dataset.starter;
 if(node.matches('.companion-loadout'))return 'companion-loadout:'+node.querySelector('[data-party-select]')?.dataset.partySelect;
 for(const attr of identityAttributes)if(node.hasAttribute(attr))return `${node.tagName}:${attr}:${node.getAttribute(attr)}:${node.dataset.index||''}`;
 if(node.tagName==='OPTION')return 'option:'+node.value;
 return null;
}
const background=node=>node.nodeType===1&&node.matches('canvas.background-motion,video.background-motion');
const compatible=(a,b)=>a.nodeType===b.nodeType&&(a.nodeType!==1||a.tagName===b.tagName)&&key(a)===key(b);

export function patchModalContent(current,incoming){
 if(!compatible(current,incoming))throw new Error('Dialog roots must have the same identity.');
 patchNode(current,incoming);
}
function patchNode(current,incoming){
 if(current.nodeType!==1){if(current.nodeValue!==incoming.nodeValue)current.nodeValue=incoming.nodeValue;return;}
 const open=current.tagName==='DETAILS'?current.open:null;
 for(const attr of [...current.attributes])if(!incoming.hasAttribute(attr.name)&&!(attr.name==='open'&&open!==null))current.removeAttribute(attr.name);
 for(const attr of incoming.attributes){
  const value=attr.name==='class'&&current.classList.contains('ambient-host')&&!incoming.classList.contains('ambient-host')?attr.value+' ambient-host':attr.value;
  if(current.getAttribute(attr.name)!==value)current.setAttribute(attr.name,value);
 }
 patchChildren(current,incoming);
 if(open!==null)current.open=open;
 if(current.tagName==='INPUT'){
  if(current.value!==incoming.value)current.value=incoming.value;
  if(current.checked!==incoming.checked)current.checked=incoming.checked;
 }else if(current.tagName==='TEXTAREA'||current.tagName==='SELECT'){
  if(current.value!==incoming.value)current.value=incoming.value;
 }
}
function patchChildren(current,incoming){
 const previous=[...current.childNodes].filter(node=>!background(node)),used=new Set(),keyed=new Map();
 // Multiple controls can share an action (close icon and footer Back). Never
 // move and patch the same existing node twice when refreshing after a drop.
 for(const node of previous){const id=key(node);if(id){if(!keyed.has(id))keyed.set(id,[]);keyed.get(id).push(node);}}
 let cursor=[...current.childNodes].find(node=>!background(node))||null;
 for(const desired of incoming.childNodes){
  if(background(desired))continue;
  const id=key(desired);
  let node=id?keyed.get(id)?.find(candidate=>!used.has(candidate)&&compatible(candidate,desired)):previous.find(candidate=>!used.has(candidate)&&!key(candidate)&&compatible(candidate,desired));
  if(node&&!compatible(node,desired))node=null;
  if(node){patchNode(node,desired);used.add(node);}else node=desired.cloneNode(true);
  if(node!==cursor)current.insertBefore(node,cursor);
  cursor=node.nextSibling;
 }
 for(const node of previous)if(!used.has(node))node.remove();
}
