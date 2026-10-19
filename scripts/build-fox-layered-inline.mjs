import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('public/fox-layered-preview'),manifest=JSON.parse(fs.readFileSync(path.join(root,'kits.json'),'utf8'));
for(const form of manifest.forms)form.image='data:image/png;base64,'+fs.readFileSync(path.join(root,form.image)).toString('base64');
const strip=source=>source.replace(/^import[^\n]*\n/gm,'').replace(/\bexport\s+(?=(?:const|function|let)\b)/g,'');
const model=strip(fs.readFileSync(path.join(root,'model.mjs'),'utf8')),renderer=strip(fs.readFileSync(path.join(root,'renderer.mjs'),'utf8'));
let preview=strip(fs.readFileSync(path.join(root,'preview.mjs'),'utf8'));
preview=preview.replace("const $=id=>document.getElementById(id)","const root=document.getElementById('fox-layered-inline');const $=id=>root.querySelector('[data-control=\"'+id+'\"]')");
preview=preview.replace(/^const manifest=await fetch[^\n]*$/m,'const manifest='+JSON.stringify(manifest)+';');
preview=preview.replaceAll('document.documentElement.dataset.','root.dataset.');
if(preview.includes('await fetch'))throw Error('Inline preview must not use network calls');
const controls=`<div class="viz-controls">
 <label class="form-label">Motion<select class="form-select" data-control="action"><option value="idle">Idle &amp; blink</option><option value="run">Run</option><option value="attack">Bow attack</option></select></label>
 <label class="form-label">Speed<select class="form-select" data-control="speed"><option value="1">Normal</option><option value="0.5">Half</option><option value="0.25">Quarter</option></select></label>
 <button class="btn" data-control="pause" type="button">Pause</button>
 <label class="form-check"><input class="form-check-input" data-control="guides" type="checkbox"><span class="form-check-label">Rig guides</span></label>
 <label class="form-check"><input class="form-check-input" data-control="native" type="checkbox"><span class="form-check-label">Native size</span></label>
 <label class="form-label">Stride<input class="form-range" data-control="stride" type="range" min="0.5" max="1.5" value="1" step="0.1"></label>
 <label class="form-label">Wind<input class="form-range" data-control="wind" type="range" min="0" max="2" value="1" step="0.1"></label>
</div>`;
const fragment=`<div id="fox-layered-inline">
<style>
#fox-layered-inline .specimens{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0}
#fox-layered-inline .specimen{text-align:center;min-width:0}
#fox-layered-inline .specimen canvas{width:100%;max-width:320px;height:auto;image-rendering:pixelated}
#fox-layered-inline .native canvas{max-width:80px}
#fox-layered-inline .label{margin:8px 0}
#fox-layered-inline .parts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:12px}
#fox-layered-inline .part{text-align:center}
#fox-layered-inline .part canvas{display:block;width:100%;max-width:96px;image-rendering:pixelated;margin:auto}
#fox-layered-inline details{margin-top:14px}
@media(max-width:560px){#fox-layered-inline .specimens{grid-template-columns:1fr}#fox-layered-inline .parts{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
${controls}
<div class="specimens" data-control="specimens"></div>
<div data-control="status" aria-live="off"></div>
<details><summary>Inspect painted parts</summary><label class="form-label">Form<select class="form-select" data-control="parts-form"><option value="rowan">Rowan</option><option value="mature">Mature art</option><option value="moontrail">Moontrail Ranger</option></select></label><div class="parts" data-control="parts"></div></details>
<script>
(async()=>{
${model}
${renderer}
${preview}
function applyWidgetState(state){
 const m=state?.modelContent,p=state?.privateContent;
 if(['idle','run','attack'].includes(m?.action))$('action').value=m.action;
 if(Number.isFinite(m?.stride))$('stride').value=String(Math.max(.5,Math.min(1.5,m.stride)));
 if(Number.isFinite(m?.wind))$('wind').value=String(Math.max(0,Math.min(2,m.wind)));
 if(['rowan','mature','moontrail'].includes(m?.inspectedForm)){$('parts-form').value=m.inspectedForm;inspect();}
 if([1,.5,.25].includes(p?.speed))$('speed').value=String(p.speed);
 if(typeof p?.paused==='boolean')paused=p.paused;
 if(typeof p?.guides==='boolean')$('guides').checked=p.guides;
 if(typeof p?.native==='boolean')$('native').checked=p.native;
 $('pause').textContent=paused?'Play':'Pause';$('specimens').classList.toggle('native',$('native').checked);
}
function saveWidgetState(){
 if(window.openai?.setWidgetState)window.openai.setWidgetState({modelContent:{preview:'fox layered rig pilot',action:$('action').value,stride:Number($('stride').value),wind:Number($('wind').value),inspectedForm:$('parts-form').value},privateContent:{paused,speed:Number($('speed').value),guides:$('guides').checked,native:$('native').checked}}).catch(()=>{});
}
applyWidgetState(window.openai?.widgetState);
window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState)applyWidgetState(e.detail.globals.widgetState);});
root.addEventListener('change',saveWidgetState);$('pause').addEventListener('click',saveWidgetState);
})();
</script>
</div>
`;
if(Buffer.byteLength(fragment)>1_000_000)throw Error('Inline preview exceeds 1MB');
fs.writeFileSync(path.join(root,'inline.html'),fragment);console.log('Wrote layered inline preview: '+Buffer.byteLength(fragment)+' bytes');
