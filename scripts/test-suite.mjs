import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn,execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'playtest-artifacts','unit-suite');fs.mkdirSync(out,{recursive:true});
const requested=process.argv.slice(2),files=requested.length?requested:fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.js')).sort().map(f=>'tests/'+f);
const workers=Math.max(1,Math.min(4,Number(process.env.TEST_WORKERS)||os.cpus().length-1)),timeoutMs=Math.max(1000,Number(process.env.TEST_TIMEOUT_MS)||300000),results=[],started=Date.now();let cursor=0;
async function worker(){while(cursor<files.length){
 const file=files[cursor++],begin=Date.now(),log=path.join(out,path.basename(file)+'.txt');
 const result=await new Promise(resolve=>{
  const stream=fs.createWriteStream(log),child=spawn(process.execPath,['--test',file],{cwd:root,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});let timedOut=false,error;
  child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
  const timer=setTimeout(()=>{
   timedOut=true;
   // Node's test driver can own another process. Stop the complete test tree,
   // otherwise a timed-out pixel audit keeps consuming CPU behind the report.
   if(process.platform==='win32')execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});
   else try{process.kill(-child.pid,'SIGTERM');}catch{child.kill();}
  },timeoutMs);
  child.on('error',e=>{error=e.message;});child.on('close',(code,signal)=>{clearTimeout(timer);stream.end(()=>resolve({file,code,signal,timedOut,error,seconds:+((Date.now()-begin)/1000).toFixed(2),log:path.relative(root,log).replaceAll('\\','/')}));});
 });
 results.push(result);console.log(`${result.code===0&&!result.timedOut?'PASS':'FAIL'} ${file} (${result.seconds}s)${result.timedOut?' - exceeded '+timeoutMs/1000+'s':''}`);
}}
await Promise.all(Array.from({length:workers},worker));results.sort((a,b)=>a.file.localeCompare(b.file));
const failed=results.filter(r=>r.code!==0||r.timedOut),report={workers,timeoutMs,seconds:+((Date.now()-started)/1000).toFixed(2),passed:results.length-failed.length,failed:failed.length,results};
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
console.log(`\n${report.passed}/${results.length} files passed in ${report.seconds}s. Logs: playtest-artifacts/unit-suite/`);
for(const result of failed){console.log(`\n${result.file}:\n`+fs.readFileSync(path.join(root,result.log),'utf8').split('\n').filter((line,i,lines)=>line.startsWith('not ok')||lines.slice(Math.max(0,i-8),i).some(s=>s.startsWith('not ok'))).join('\n'));}
process.exitCode=failed.length?1:0;
