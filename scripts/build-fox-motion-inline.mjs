import fs from 'node:fs';
import {chromium} from 'playwright';

const directory='docs/evidence/meshy-fox-full-motion',video=fs.readFileSync(`${directory}/motion-preview.webm`).toString('base64');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
let poster;
try{
 const page=await browser.newPage();poster=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=c.height=480;c.getContext('2d').drawImage(image,0,0,480,480);return c.toDataURL('image/jpeg',.70);},'data:image/png;base64,'+fs.readFileSync(`${directory}/decoded-0.6.png`).toString('base64'));
}finally{await browser.close();}
const template=fs.readFileSync('scripts/fox-motion-inline.template.html','utf8'),html=template.replace('@@VIDEO@@',video).replace('@@POSTER@@',poster),file=`${directory}/rowan-motion-preview.html`;
if(Buffer.byteLength(html)>1_000_000)throw Error('Inline preview exceeds size limit');fs.writeFileSync(file,html);console.log(`${file}: ${Buffer.byteLength(html)} bytes`);
