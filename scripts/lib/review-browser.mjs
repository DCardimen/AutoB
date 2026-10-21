import {chromium} from 'playwright';

// Browser for the fox reviews. CHROMIUM_PATH wins; Windows uses installed
// Chrome. Elsewhere, Playwright's full Chromium renders WebGL through Mesa's
// llvmpipe, about three times faster than the headless shell's SwiftShader on a
// machine without a GPU, with the same image (45.7 dB PSNR on a combat frame).
export function launchReviewBrowser(){
 if(process.env.CHROMIUM_PATH)return chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true});
 if(process.platform==='win32')return chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 return chromium.launch({channel:'chromium',headless:true,args:['--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--enable-gpu'],env:{...process.env,GALLIUM_DRIVER:'llvmpipe',EGL_PLATFORM:'surfaceless'}});
}
