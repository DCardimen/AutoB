import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const root='/tmp/autob-godot';for(const p of ['cache/fontconfig','config','data','state'])fs.mkdirSync(root+'/'+p,{recursive:true});
const env={...process.env,XDG_CACHE_HOME:root+'/cache',XDG_CONFIG_HOME:root+'/config',XDG_DATA_HOME:root+'/data',XDG_STATE_HOME:root+'/state'};
for(const [name,args]of [['import',['--headless','--editor','--path','godot-sprites','--import','--quit']],['assets',['--headless','--path','godot-sprites','--script','validate.gd']],['run',['--headless','--path','godot-sprites','--quit-after','6']]]){
 const r=spawnSync(process.env.GODOT_PATH||'godot',args,{env,encoding:'utf8'}),output=(r.stdout||'')+(r.stderr||'');fs.mkdirSync('playtest-artifacts',{recursive:true});fs.writeFileSync(`playtest-artifacts/v6-godot-${name}.log`,output);
 if(r.error||r.status!==0||/ERROR:|SCRIPT ERROR:/.test(output)){process.stderr.write(output);throw r.error||new Error('Godot '+name+' failed');}console.log('Godot '+name+' passed.');
}
