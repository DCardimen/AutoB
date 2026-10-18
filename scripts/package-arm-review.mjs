import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {authoredIdentities} from '../authored-sprite-renderer.js';
import {ARM_ANATOMY} from '../companion-anatomy.js';
import {runtimeFiles,fingerprint,validateVideoManifest,hashFile} from './animation-contract.mjs';

const out='public/arm-animation-review';fs.mkdirSync(out,{recursive:true});
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const readText=file=>{const bytes=fs.readFileSync(file);return bytes[0]===255&&bytes[1]===254?bytes.subarray(2).toString('utf16le'):bytes.toString('utf8');};
const copy=(source,destination)=>{const target=path.join(out,destination);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);};
const writeLog=(file,log)=>{fs.mkdirSync(path.join(out,'checks'),{recursive:true});fs.writeFileSync(path.join(out,'checks',file.replace(/\.log$/,'.txt')),log.replace(/[ \t]+$/gm,''));};
for(const file of ['arm-torso-final-tests.log','arm-recoil-deformation.log','arm-recoil-gaits.log','arm-final-contract-palette.log']){const log=readText('playtest-artifacts/'+file);assert.match(log,/\bfail\s+0(?:\r?\n|$)/,file+' must finish successfully');writeLog(file,log);}
for(const file of ['baseline-combat.log','arm-current-base-failures.log'])writeLog(file,readText('playtest-artifacts/'+file));
copy('playtest-artifacts/unit-suite/results.json','checks/full-unit-suite.json');
const audit=read('playtest-artifacts/all-character-animation-audit.json');assert.equal(audit.status,'passed');assert.equal(audit.failureCount,0);assert.equal(audit.species.length,89);assert.deepEqual(audit.inputs,fingerprint(runtimeFiles()));
copy('playtest-artifacts/all-character-animation-audit.json','roster-audit.json');
const parts=read('playtest-artifacts/arm-parts-final/validation.json');assert.equal(parts.status,'passed');copy('playtest-artifacts/arm-parts-final/validation.json','part-validation.json');
const roster=read('playtest-artifacts/arm-roster-live/report.json');assert.equal(roster.length,32);assert.ok(roster.every(r=>!r.errors.length&&!r.requests.length));
assert.deepEqual(read('playtest-artifacts/arm-roster-live/inputs.json'),fingerprint([...runtimeFiles(),'Starfall-Menagerie.html','Starfall-Training-Glade.html','public/prototype-bundle.js']));
for(const offline of [false,true])assert.equal(new Set(roster.filter(r=>r.offline===offline).flatMap(r=>r.species)).size,89);
copy('playtest-artifacts/arm-roster-live/report.json','live-roster.json');
const movies={};
for(const evolutionPath of ['wild','warden']){
 const folder=`playtest-artifacts/arm-video-${evolutionPath}`,manifest=validateVideoManifest(read(folder+'/video-manifest.json')),decoded=read(folder+'/decoded-video.json');
 assert.equal(manifest.evolutionPath,evolutionPath);assert.equal(manifest.videoHash,hashFile(folder+'/all-companions.mp4'));assert.equal(decoded.status,'passed');assert.equal(decoded.playbackRate,1);assert.equal(decoded.captures.length,136);assert.deepEqual(manifest.armFailures,[]);assert.ok(manifest.armChecks>280000);
 for(const [file,hash]of Object.entries(audit.inputs))assert.equal(manifest.inputs[file],hash,evolutionPath+': reviewed runtime matches the roster audit');
 for(const file of ['review.html','all-companions.mp4','video-manifest.json','decoded-video.json','decoded-critical-slash.png'])copy(folder+'/'+file,evolutionPath+'/'+file);
 // Include decoded action, recoil, rear-view and fall samples with the movie.
 for(const dir of [0,2,4,6])for(const state of ['idle','run','attack','cast','stagger','death'])copy(folder+`/decoded-${dir}-${state}.png`,evolutionPath+`/decoded-${dir}-${state}.png`);
 movies[evolutionPath]={frames:manifest.frames,seconds:manifest.duration,renderedPoses:manifest.renderedPoses,armChecks:manifest.armChecks,clipped:manifest.clipped.length,armFailures:manifest.armFailures.length,decodedSegments:decoded.captures.length,videoHash:manifest.videoHash};
}
for(const identity of authoredIdentities){const name=identity==='fairy'?'faerie':identity;copy(`playtest-artifacts/gaits-carry-final-${name}.png`,`source/${name}.png`);}
for(const identity of Object.keys(ARM_ANATOMY))for(let stage=0;stage<3;stage++)copy(`playtest-artifacts/arm-animation-final/${identity}-${stage}.png`,`arms/${identity}-${stage}.png`);
for(const file of ['source-0.png','source-12.png','offline-0.png','offline-12.png'])copy('playtest-artifacts/arm-roster-live/'+file,'combat/'+file);
for(const file of ['source-1900.png','source-390.png','offline-1900.png','offline-390.png','source-1900.webm','offline-390.webm','browser.json'])copy('playtest-artifacts/arm-default-combat/'+file,'combat/default-'+file);
const liveLegs=read('playtest-artifacts/legs-v2-browser.json'),livePrototype=read('playtest-artifacts/prototype-browser-report.json');assert.deepEqual(liveLegs.errors,[]);assert.deepEqual(livePrototype.errors,[]);assert.equal(livePrototype.offlineExternalRequests,0);assert.equal(read('playtest-artifacts/arm-default-combat/browser.json').length,6);
copy('playtest-artifacts/legs-v2-browser.json','checks/live-legs.json');copy('playtest-artifacts/prototype-browser-report.json','checks/live-prototype.json');
const verification={
 status:'animation-checks-passed-with-disclosed-base-test-failures',baseRevision:'45b6859232a34826e4a30146a597929da3903fa8',runtimeInputs:audit.inputs,
 scope:{roster:89,sourceFamilies:41,sourceForms:3,directions:8,sourceCells:984,articulatedFamilies:Object.keys(ARM_ANATOMY),articulatedBindCells:288,states:audit.states,evolutionPaths:audit.paths},
 rosterAudit:{...audit.counts,failures:audit.failureCount},parts,movies,live:{encounters:roster.length,sourceRoster:89,offlineRoster:89,errors:0,offlineExternalRequests:0},
 checks:{armRaster:'Full-state shoulder-to-hand connectivity, isolated source-adjacency raster, final bone lengths, exclusive indexed ownership and grip identity',naturalRecoil:'35,496 poses / 26,205,840 positive-area source quads; minimum normalized area 0.0649875694638062',gaits:'15 relevant gait/carry and leg tests passed; source/offline stride and training-glade checks passed'},
 fullSuite:{initialPassed:60,initialFailed:3,totalFiles:63,resolved:'Expanded 17-state coverage found a natural recoil fold; corrected and the full natural positive-area test and relevant gaits passed on rerun.',remainingBaseFailures:[{file:'tests/combat-spacing.test.js',detail:'48 coalcrab/mireclaw contact cases; identical on isolated base 45b6859'},{file:'tests/overhaul.test.js',detail:'Shield-counter encounter baseline winner; identical on isolated base 45b6859'}]},
 visualEvidence:{originalCurrentSheets:41,armOwnershipTorsoSwingSheets:36,normalSpeedPaths:2,decodedNativeEnlargedSegments:272,defaultCombat:'Source/offline desktop and phone recordings at default tuning. Metadata is not an artistic quality score.'},
};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(verification,null,2)+'\n');
const links=authoredIdentities.map(identity=>{const name=identity==='fairy'?'faerie':identity;return `<li><a href="source/${name}.png">${identity}: original/current, all forms and facings</a>${ARM_ANATOMY[identity]?' — arms '+[0,1,2].map(s=>`<a href="arms/${identity}-${s}.png">form ${s}</a>`).join(' / '):''}</li>`;}).join('');
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Arm animation review</title><style>body{max-width:1100px;margin:40px auto;padding:0 20px;background:#10262d;color:#e7dfc2;font:16px/1.6 system-ui}a{color:#9de0db}video{width:100%;image-rendering:pixelated}li{margin:8px 0}img{max-width:100%;image-rendering:pixelated}</style><h1>Painted arms and held weapons</h1><p>89 roster entries · 41 families · 3 forms · 8 facings · 17 states · both evolution paths.</p><p><a href="verification.json">Verification and disclosed base test failures</a> · <a href="roster-audit.json">Every-character audit and source hashes</a> · <a href="live-roster.json">Source/offline combat roster</a> · <a href="part-validation.json">Decoded indexed-part validation</a></p><h2>Normal-speed movies</h2><p>Every family at native 64px, with an enlarged family selector. Full-cycle arm lengths and cell boundaries are checked for every encoded frame. Each path has 136 decoded state/facing segments.</p><p><a href="wild/review.html">Wild: native and enlarged player</a> · <a href="warden/review.html">Warden: native and enlarged player</a></p><video controls muted preload="metadata" src="wild/all-companions.mp4"></video><h2>Original/current and moving-part sheets</h2><p>Arm sheets show the original, indexed ownership, isolated complete torso, idle and four swing phases at native and enlarged size.</p><ul>${links}</ul><h2>Delivered combat at default tuning</h2><p><a href="combat/default-source-1900.webm">Source desktop recording</a> · <a href="combat/default-offline-390.webm">Offline phone recording</a> · <a href="combat/default-browser.json">Actual painted-size and input checks</a></p><img src="combat/default-source-1900.png" alt="Source live combat at default settings"><img src="combat/default-offline-390.png" alt="Offline phone combat at default settings">`);
fs.appendFileSync(path.join(out,'index.html'),'<h2>Decoded pixels</h2><p>'+['wild','warden'].map(p=>`<a href="${p}/decoded-critical-slash.png">${p}: intermediate Brakk recovery</a> / <a href="${p}/decoded-video.json">decoder record</a>`).join(' &middot; ')+'</p><p>'+['wild','warden'].flatMap(p=>[0,2,4,6].map(d=>`<a href="${p}/decoded-${d}-attack.png">${p}: attack, facing ${d}</a>`)).join(' &middot; ')+'</p>');
console.log(JSON.stringify({out,rosterPoses:audit.counts.poses,movies,files:fs.readdirSync(out).length}));
