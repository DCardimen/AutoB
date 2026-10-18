import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {runtimeFiles,fingerprint,hashFile,validateVideoManifest} from './animation-contract.mjs';
const input='playtest-artifacts/torso-fill',out='public/torso-fill-review';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const readText=file=>{const b=fs.readFileSync(file);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8');};
const copy=(source,destination)=>{const file=path.join(out,destination);fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(source,file);};
const inputs=fingerprint(runtimeFiles()),checks={};
for(const name of ['unit','regressions','anatomy-bounds']){
 const text=readText(`${input}/${name}.log`);assert.match(text,/\bfail\s+0(?:\r?\n|$)/,name);const passed=Number(text.match(/\bpass\s+(\d+)/)?.[1]);assert.ok(passed>0);checks[name]={passed};
 fs.mkdirSync(out+'/checks',{recursive:true});fs.writeFileSync(`${out}/checks/${name}.txt`,text.replace(/[ \t]+$/gm,''));
}
assert.equal(Object.values(checks).reduce((n,c)=>n+c.passed,0),85);
const body=JSON.parse(readText(input+'/unit.log').split(/\r?\n/).find(line=>line.startsWith('{"bodyOnlyPoses"')));assert.equal(body.bodyOnlyPoses,39168);assert.equal(body.opaqueTorsoProbes,35612144);
const sheets=read(out+'/sheets/manifest.json');assert.deepEqual(sheets.inputs,inputs);assert.equal(sheets.sheets.length,36);for(const file of sheets.sheets)assert.ok(fs.existsSync(out+'/sheets/'+file));
const baseline=read(input+'/baseline-holes.json');assert.equal(baseline.checked,172);assert.equal(baseline.missingOnBaseline,172);copy(input+'/baseline-holes.json','checks/baseline-holes.json');
const parts=read(input+'/parts/validation.json');assert.equal(parts.status,'passed');assert.equal(parts.frames,984);copy(input+'/parts/validation.json','checks/indexed-parts.json');
const live=read(input+'/live/report.json');assert.equal(live.length,20);assert.ok(live.every(r=>!r.errors.length&&!r.requests.length&&r.units.every(u=>u.finite)));
for(const offline of [false,true])assert.equal(new Set(live.filter(r=>r.offline===offline).flatMap(r=>r.species)).size,17);
assert.deepEqual(read(input+'/live/inputs.json'),fingerprint([...runtimeFiles(),'Starfall-Menagerie.html','Starfall-Training-Glade.html','public/prototype-bundle.js']));copy(input+'/live/report.json','checks/live-roster.json');
for(const file of ['source-0.png','offline-0.png','source-6.png','offline-6.png'])copy(input+'/live/'+file,'combat/'+file);
const defaultCombat=read(input+'/default-combat/browser.json');assert.equal(defaultCombat.length,6);assert.ok(defaultCombat.every(r=>!r.errors.length));
for(const file of ['source-1900.png','offline-390.png','source-1900.webm','offline-390.webm','browser.json'])copy(input+'/default-combat/'+file,'combat/default-'+file);
for(const [source,name]of [['playtest-artifacts/legs-v2-browser.json','live-legs'],['playtest-artifacts/prototype-browser-report.json','live-prototype']]){const report=read(source);assert.deepEqual(report.errors,[]);copy(source,'checks/'+name+'.json');}
assert.match(readText(input+'/prototype.log'),/"offlineExternalRequests": 0/);
assert.match(readText(input+'/gait-review.log'),/1472 animated poses; 0 clipped/);
assert.match(readText(input+'/build.log'),/Built Fang & Feather standalone/);assert.match(readText(input+'/build.log'),/Built Fang & Feather Training Glade/);
const contact=readText(input+'/contact-baseline.log'),oldContact=readText('public/arm-animation-review/checks/baseline-combat.txt');
const contacts=text=>JSON.parse(text.match(/body footprints must leave every authored attack physically reachable: (\[[^\]]*\])/)?.[1]||'[]').sort();
assert.equal(contacts(contact).length,48);assert.deepEqual(contacts(contact),contacts(oldContact));assert.match(contact,/\bfail\s+2(?:\r?\n|$)/);
fs.writeFileSync(out+'/checks/existing-contact-balance.txt',contact.replace(/[ \t]+$/gm,''));
const movies={};
for(const evolutionPath of ['wild','warden']){
 const folder=input+'/'+evolutionPath,m=validateVideoManifest(read(folder+'/video-manifest.json')),decoded=read(folder+'/decoded-video.json');
 assert.equal(m.families,12);assert.equal(m.evolutionPath,evolutionPath);assert.deepEqual(m.armFailures,[]);assert.equal(m.armChecks,283392);assert.equal(hashFile(folder+'/all-companions.mp4'),m.videoHash);for(const [file,hash]of Object.entries(inputs))assert.equal(m.inputs[file],hash);
 assert.equal(decoded.status,'passed');assert.equal(decoded.videoHash,m.videoHash);assert.equal(decoded.playbackRate,1);assert.equal(decoded.enlargedFamilies.length,12);assert.equal(decoded.captures.length,136);
 for(const file of ['all-companions.mp4','review.html','video-manifest.json','decoded-video.json'])copy(folder+'/'+file,evolutionPath+'/'+file);
 for(const dir of [0,2,4,6])for(const state of ['idle','run','attack','stagger','getup'])copy(folder+`/decoded-${dir}-${state}.png`,evolutionPath+`/decoded-${dir}-${state}.png`);
 movies[evolutionPath]={frames:m.frames,renderedPoses:m.renderedPoses,boneChecks:m.armChecks,clipped:0,stretchedArms:0,seconds:m.duration,decodedSegments:decoded.captures.length,videoHash:m.videoHash};
}
const report={status:'body-fill-checks-passed',baselineRevision:sheets.baseline,inputs,scope:{families:Object.keys(ARM_ANATOMY),forms:3,directions:8,sourceCells:288,states:17,evolutionPaths:['wild','warden'],affectedRoster:17},body:{...body,recordedHoles:172,baselineMissing:172},checks,indexedParts:parts,live:{encounters:20,sourceRoster:17,offlineRoster:17,errors:0,externalOfflineRequests:0,defaultCombatViewports:6},movies,anatomyException:'Original empty skeleton rib spaces remain transparent.',remainingBaseFailures:['48 coalcrab/mireclaw melee contact cases, identical to base 45b6859','Shield-counter balance assertion, identical to base 45b6859']};
fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2)+'\n');
const rows=Object.keys(ARM_ANATOMY).map(id=>`<li>${id}: ${[0,1,2].map(stage=>`<a href="sheets/${id}-${stage}.png">form ${stage}</a>`).join(' / ')}</li>`).join('');
fs.writeFileSync(out+'/index.html',`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Body fill beneath moving arms</title><style>body{max-width:1100px;margin:36px auto;padding:0 20px;background:#10262d;color:#e7dfc2;font:16px/1.6 system-ui}a{color:#9de0db}img,video{max-width:100%;image-rendering:pixelated}li{margin:8px 0}</style><h1>Body fill beneath moving arms</h1><p>The previous pass left shoulder-shaped holes in the body. The complete shirt, armor or chest now remains beneath the moving arm.</p><img src="before-after.png" alt="Before and after: exposed body cutout and raised arm"><p><a href="verification.json">Results and source hashes</a> &middot; <a href="checks/unit.txt">Body-only regression checks</a> &middot; <a href="checks/baseline-holes.json">172 holes present on the previous pass</a></p><h2>Direct comparisons</h2><p>Every sheet shows original art, BEFORE body, FILLED body, BEFORE swing, FILLED swing, recovery and the actual body alone at mid-swing. All eight facings appear at native and enlarged sizes.</p><ul>${rows}</ul><h2>Full normal-speed cycles</h2><p>12 affected families, all forms, 8 facings, 17 states, both paths. Each player includes a native view and enlarged family selector.</p><p><a href="wild/review.html">Wild player</a> &middot; <a href="warden/review.html">Warden player</a> &middot; <a href="wild/decoded-2-attack.png">Decoded front attack</a> &middot; <a href="warden/decoded-4-attack.png">Decoded side attack</a> &middot; <a href="wild/decoded-6-getup.png">Decoded rear get-up</a></p><video controls muted preload="metadata" src="wild/all-companions.mp4"></video><h2>Delivered combat</h2><p><a href="combat/default-source-1900.webm">Source desktop recording</a> &middot; <a href="combat/default-offline-390.webm">Offline phone recording</a> &middot; <a href="checks/live-roster.json">All 17 affected characters in source/offline combat</a></p><img src="combat/default-source-1900.png" alt="Source combat"><img src="combat/default-offline-390.png" alt="Offline phone combat"><p>The original gaps between skeleton ribs are retained. The verification report also discloses the two unchanged base-branch contact/balance failures.</p>`);
console.log(JSON.stringify({out,body,tests:85,movies,live:20}));
