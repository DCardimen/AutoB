import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PIXEL_SPECIES} from '../native-content.js';
import {MELEE_ARM_FAMILIES} from '../authored-parts.js';
import {fingerprint,runtimeFiles,hashFile,validateVideoManifest} from './animation-contract.mjs';
const out='public/melee-arm-review',input='playtest-artifacts/melee-arms';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),readText=p=>{const b=fs.readFileSync(p);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8');};
const inputs=fingerprint(runtimeFiles()),delivered=fingerprint([...runtimeFiles(),'Starfall-Menagerie.html','Starfall-Training-Glade.html','public/prototype-bundle.js']);
const specs=PIXEL_SPECIES.filter(s=>MELEE_ARM_FAMILIES.has(s.nativeDesign));
const reports=fs.readdirSync(out+'/combat').filter(n=>/^report(?:-.*)?\.json$/.test(n)).map(n=>read(out+'/combat/'+n)).filter(r=>r.cases.every(c=>c.captureVersion===2)&&JSON.stringify(r.inputs)===JSON.stringify(delivered));
const all=(reports.find(r=>r.cases.length===104)?[reports.find(r=>r.cases.length===104)]:reports).flatMap(r=>r.cases);
assert.equal(all.length,104);assert.equal(new Set(all.map(c=>c.name)).size,104);
for(const spec of specs)for(const offline of [false,true]){
 const cases=all.filter(c=>c.id===spec.id&&c.offline===offline);assert.equal(cases.length,1+spec.evolutionLimit*2);
 for(const c of cases){assert.equal(c.frames,72);assert.equal(c.duration,6);assert.equal(c.fps,12);assert.deepEqual(c.errors,[]);assert.deepEqual(c.requests,[]);assert.deepEqual(c.missingImages,[]);assert.ok(c.states.includes('windup')&&c.states.includes('contact')&&c.states.includes('recovery'));assert.equal(hashFile(out+'/combat/'+c.name+'.mp4'),c.videoHash);}
}
const decoded=read(out+'/checks/individual-decoded.json');assert.equal(decoded.status,'passed');assert.equal(decoded.cases.length,104);assert.deepEqual(decoded.inputs,delivered);
const visual=read(input+'/visual-review.json');assert.equal(visual.reviewed,true);assert.deepEqual(visual.characters.map(c=>c.id).sort(),specs.map(s=>s.id).sort());
for(const c of visual.characters){assert.equal(c.factors.length,5);assert.ok(c.factors.every(f=>f.result==='pass'&&f.observation.length>10));}
const sheets=read(out+'/sheets/manifest.json');assert.deepEqual(sheets.inputs,inputs);assert.equal(sheets.sourceCells,168);assert.equal(sheets.sheets.length,21);
for(const [file,count]of [['regressions.txt',70],['anatomy-bounds.txt',15]]){const s=readText(input+'/'+file);assert.match(s,new RegExp('\\bpass\\s+'+count+'(?:\\r?\\n|$)'));assert.match(s,/\bfail\s+0(?:\r?\n|$)/);}
const body=JSON.parse(readText(input+'/regressions.txt').match(/\{"bodyOnlyPoses":\d+,"opaqueTorsoProbes":\d+\}/)[0]);assert.equal(body.bodyOnlyPoses,39168);assert.ok(body.opaqueTorsoProbes>25000000);
const parts=read(input+'/parts/validation.json');assert.equal(parts.status,'passed');assert.equal(parts.frames,984);assert.equal(parts.palette,'Original indexed materials only');
assert.match(readText(input+'/build.txt'),/Built Fang & Feather standalone/);assert.match(readText(input+'/build.txt'),/Built Fang & Feather Training Glade/);
assert.match(readText(input+'/gait-review.txt'),/1472 animated poses; 0 clipped/);assert.match(readText(input+'/live-prototype.txt'),/"offlineExternalRequests": 0/);
for(const report of ['playtest-artifacts/legs-v2-browser.json','playtest-artifacts/prototype-browser-report.json'])assert.deepEqual(read(report).errors,[]);
const contact=readText(input+'/contact-baseline.txt'),priorContact=readText('public/arm-animation-review/checks/baseline-combat.txt');
const contacts=s=>JSON.parse(s.match(/body footprints must leave every authored attack physically reachable: (\[[^\]]*\])/)?.[1]||'[]').sort();
assert.equal(contacts(contact).length,48);assert.deepEqual(contacts(contact),contacts(priorContact));assert.match(contact,/\bfail\s+2(?:\r?\n|$)/);
fs.mkdirSync(out+'/checks',{recursive:true});fs.mkdirSync(out+'/companions',{recursive:true});
fs.mkdirSync(out+'/decoded-individual',{recursive:true});
const copy=(from,to)=>{const p=path.join(out,to);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(from,p);};
for(const n of ['regressions.txt','anatomy-bounds.txt','build.txt','gait-review.txt','live-legs.txt','live-prototype.txt','contact-baseline.txt'])fs.writeFileSync(out+'/checks/'+n,readText(input+'/'+n).replace(/[\t ]+$/gm,''));
copy(input+'/parts/validation.json','checks/parts.json');copy('playtest-artifacts/legs-v2-browser.json','checks/live-legs.json');copy('playtest-artifacts/prototype-browser-report.json','checks/live-prototype.json');
const movies={};
for(const p of ['wild','warden']){
 const folder=input+'/'+p,m=validateVideoManifest(read(folder+'/video-manifest.json')),d=read(folder+'/decoded-video.json');assert.equal(m.families,7);assert.equal(m.evolutionPath,p);assert.equal(m.armChecks,165312);assert.deepEqual(m.armFailures,[]);assert.equal(hashFile(folder+'/all-companions.mp4'),m.videoHash);
 for(const [f,h]of Object.entries(inputs))assert.equal(m.inputs[f],h);
 assert.equal(d.status,'passed');assert.equal(d.playbackRate,1);assert.equal(d.videoHash,m.videoHash);assert.equal(d.enlargedFamilies.length,7);assert.equal(d.captures.length,136);
 for(const n of ['all-companions.mp4','review.html','video-manifest.json','decoded-video.json'])copy(folder+'/'+n,p+'/'+n);
 for(const dir of [0,2,4,6])for(const state of ['idle','run','attack','stagger','getup'])copy(folder+`/decoded-${dir}-${state}.png`,p+`/decoded-${dir}-${state}.png`);
 movies[p]={poses:m.renderedPoses,frames:m.frames,boneChecks:m.armChecks,duration:m.duration,clipped:0,stretchedArms:0,decodedSegments:d.captures.length,videoHash:m.videoHash};
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
try{
 const page=await browser.newPage();await page.goto((process.env.REVIEW_URL||'http://127.0.0.1:3050')+'/sheets/manifest.json');
 const decodedSamples=decoded.cases.map(c=>({name:c.name,images:[1,3,5].map(t=>fs.readFileSync(`${input}/decoded-individual/${c.name}-${t}.png`).toString('base64'))}));
 const images=await page.evaluate(async({specs,all,decodedSamples})=>{
  const images=[];for(const spec of specs)for(const offline of [false,true]){
   const cases=all.filter(c=>c.id===spec.id&&c.offline===offline),canvas=document.createElement('canvas');canvas.width=648;canvas.height=cases.length*168;const x=canvas.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#183139';x.fillRect(0,0,canvas.width,canvas.height);
   for(const [row,c]of cases.entries())for(const [col,phase]of ['windup','contact','recovery'].entries()){
    const i=new Image();i.src='/combat/'+c.name+'-'+phase+'-sprite.png';await i.decode();x.drawImage(i,col*216,row*168+24,144,144);x.drawImage(i,col*216+148,row*168+100,64,64);x.fillStyle='#e7dfc2';x.font='11px monospace';x.fillText(`${spec.name} ${c.evolution}/${c.evolutionPath}`,col*216,row*168+11);x.fillText(`${offline?'offline':'source'} / ${phase}`,col*216,row*168+23);
   }images.push({name:`${spec.id}-${offline?'offline':'source'}`,png:canvas.toDataURL().split(',')[1]});
  }
  for(let start=0;start<decodedSamples.length;start+=8){
   const cases=decodedSamples.slice(start,start+8),canvas=document.createElement('canvas');canvas.width=648;canvas.height=cases.length*168;const x=canvas.getContext('2d');x.imageSmoothingEnabled=false;
   for(const [row,c]of cases.entries())for(const [col,bytes]of c.images.entries()){
    const i=new Image();i.src='data:image/png;base64,'+bytes;await i.decode();if(i.width!==216||i.height!==168)throw new Error('Unexpected decoded panel size: '+c.name);x.drawImage(i,col*216,row*168);
   }images.push({name:'decoded-'+start/8,folder:'decoded-individual',png:canvas.toDataURL().split(',')[1]});
  }return images;
 },{specs,all,decodedSamples});
 for(const i of images)fs.writeFileSync(out+'/'+(i.folder||'companions')+'/'+i.name+'.png',Buffer.from(i.png,'base64'));
}finally{await browser.close();}
const css='<style>body{max-width:1100px;margin:32px auto;padding:0 20px;background:#10262d;color:#e7dfc2;font:16px/1.6 system-ui}a{color:#9de0db}img,video{max-width:100%;image-rendering:pixelated}td,th{padding:8px;border:1px solid #456067;text-align:left}table{border-collapse:collapse}select{font:inherit;padding:8px;background:#183139;color:#e7dfc2}li{margin:8px 0}</style>';
for(const spec of specs){
 const cases=all.filter(c=>c.id===spec.id),review=visual.characters.find(c=>c.id===spec.id),first=cases[0];
 const options=cases.map(c=>`<option value="${c.name}">${c.offline?'Offline':'Source'} · ${c.evolution?'Evolution '+c.evolution+' / '+c.evolutionPath:'Base'}</option>`).join('');
 fs.writeFileSync(out+'/companions/'+spec.id+'.html',`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${spec.name} individual melee review</title>${css}<a href="../index.html">All companions</a><h1>${spec.name}: individual combat</h1><p>${cases.length} separate source/offline fights, covering every available form and path. The right panels show the actual cached sprite drawn in battle, before the hit-flash overlay, at native size and enlarged. The arena panel retains combat effects.</p><select id="case">${options}</select><p><video id="movie" controls muted preload="metadata" src="../combat/${first.name}.mp4"></video></p><p><a id="game" href="../combat/${first.name}-game.png">Full delivered-game screenshot</a> · <a id="contact" href="../combat/${first.name}-contact.png">Contact inspection</a></p><h2>Five-factor visual review</h2><table><tr><th>Factor</th><th>Result</th><th>Observed</th></tr>${review.factors.map(f=>`<tr><td>${f.factor}</td><td>${f.result}</td><td>${f.observation}</td></tr>`).join('')}</table><h2>Windup, contact, recovery · every variant</h2><a href="${spec.id}-source.png"><img src="${spec.id}-source.png" alt="${spec.name} source combat, every variant"></a><a href="${spec.id}-offline.png"><img src="${spec.id}-offline.png" alt="${spec.name} offline combat, every variant"></a><p>Original/current anatomy in all eight facings: ${[0,1,2].map(s=>`<a href="../sheets/${spec.nativeDesign}-${s}.png">authored form ${s}</a>`).join(' · ')}</p><script>document.querySelector('#case').onchange=e=>{const n=e.target.value,v=document.querySelector('#movie');v.src='../combat/'+n+'.mp4';v.load();document.querySelector('#game').href='../combat/'+n+'-game.png';document.querySelector('#contact').href='../combat/'+n+'-contact.png';};</script>`);
}
const verification={status:'passed',baseline:sheets.baseline,inputs:delivered,scope:{companions:specs.map(s=>s.id),families:[...MELEE_ARM_FAMILIES],authoredForms:3,facings:8,sourceCells:168,availableFormPathVariants:52,individualCombats:104,states:17,paths:['wild','warden']},tests:{passed:85,body,...parts},visualReview:visual,individualDecode:{cases:104,rate:1,captures:312},movies,remainingBaseFailures:['48 coalcrab/mireclaw contact cases, identical to base 45b6859','Shield-counter balance assertion, identical to base 45b6859']};
fs.writeFileSync(out+'/checks/individual-combat.json',JSON.stringify({inputs:delivered,cases:all},null,2)+'\n');fs.writeFileSync(out+'/verification.json',JSON.stringify(verification,null,2)+'\n');
fs.writeFileSync(out+'/index.html',`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Melee arm and torso review</title>${css}<h1>Melee arms: one moving pair, complete torso</h1><p>12 melee companions reviewed individually across 52 available form/path variants in 104 source/offline fights. Every companion has a five-factor visual review, actual battle recordings and native/enlarged windup, contact and recovery frames.</p><p><a href="verification.json">Verification and source hashes</a> · <a href="checks/individual-combat.json">All individual combat cases</a> · <a href="checks/individual-decoded.json">104 clips decoded at normal speed</a> · <a href="checks/regressions.txt">70 regression checks</a> · <a href="checks/anatomy-bounds.txt">15 anatomy/cell checks</a></p><ul>${specs.map(s=>`<li><a href="companions/${s.id}.html">${s.name}</a> · <a href="companions/${s.id}-source.png">source inspection</a> · <a href="companions/${s.id}-offline.png">offline inspection</a></li>`).join('')}</ul><h2>Original / previous / corrected anatomy</h2><p>21 sheets cover all 168 melee source cells. Each includes original art, PR65 body, corrected body, source arm ownership, before/after attack and the actual body with arms hidden. Both native and enlarged pixels are present. Authored forms unused by a current evolution route are included.</p><ul>${[...MELEE_ARM_FAMILIES].map(id=>`<li>${id}: ${[0,1,2].map(s=>`<a href="sheets/${id}-${s}.png">form ${s}</a>`).join(' · ')}</li>`).join('')}</ul><h2>Complete normal-speed motion cycles</h2><p>All seven melee families, three forms, eight facings and 17 states, separately for both paths. <a href="wild/review.html">Wild player</a> · <a href="warden/review.html">Warden player</a></p><p>The rogue's rear cloak conceals its hands. Its intact cloak stays on the body; the same form's original front arm skin supplies concealed limbs beneath the cloak, using the original indexed palette and depth.</p><p>The two unrelated base-branch contact/balance test failures are disclosed in <a href="checks/contact-baseline.txt">the comparison log</a>.</p>`);
fs.appendFileSync(out+'/index.html',`<h2>Decoded individual combat at normal speed</h2><p>All 104 individual movies were played at 1x. These 13 sheets show the actual decoded sprite at 1, 3 and 5 seconds in every movie, both native and enlarged.</p><ul>${Array.from({length:13},(_,i)=>`<li><a href="decoded-individual/decoded-${i}.png">Individual decoded combat sheet ${i+1}</a></li>`).join('')}</ul>`);
console.log(JSON.stringify({passed:85,body,individualCombats:104,companions:12,movies}));
