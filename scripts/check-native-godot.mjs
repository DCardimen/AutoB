import fs from 'node:fs';import {spawn} from 'node:child_process';
const directory=process.argv[2]||'playtest-artifacts/native-sprites-v13',root='/tmp/autob-native-godot';for(const p of ['cache/fontconfig','config','data','state'])fs.mkdirSync(root+'/'+p,{recursive:true});
const env={...process.env,XDG_CACHE_HOME:root+'/cache',XDG_CONFIG_HOME:root+'/config',XDG_DATA_HOME:root+'/data',XDG_STATE_HOME:root+'/state'};
for(const [name,args]of [['import',['--headless','--editor','--path',directory,'--import','--quit']],['run',['--headless','--path',directory,'--quit-after','6']]]){
 const result=await new Promise((resolve,reject)=>{const child=spawn(process.env.GODOT_PATH||'godot',args,{env});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.on('error',reject);child.on('close',code=>resolve({code,output}));});fs.writeFileSync('playtest-artifacts/v13-native-godot-'+name+'.log',result.output);if(result.code!==0||/ERROR:|SCRIPT ERROR:/.test(result.output))throw Error(result.output);console.log('Godot native '+name+' passed.');
}
