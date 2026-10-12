import {CORE_SPECIES} from './core-species.js';
import {EXPANSION_SPECIES} from './roster.js';
const palettes={ember:{skin:['#71392b','#bd7140','#e9b568'],cloth:['#592c38','#ac4e3e','#eea75e'],hair:['#75362b','#c86d33','#f2c776']},tide:{skin:['#305467','#6ba0af','#b9d6d7'],cloth:['#203f58','#527c9c','#9fd4d6'],hair:['#344d6c','#7298ae','#c6dee1']},grove:{skin:['#355740','#7c9e5f','#c0cc8e'],cloth:['#2e4737','#64945a','#bac785'],hair:['#435533','#91a553','#d5d79a']},storm:{skin:['#56506f','#9488b3','#d6cadf'],cloth:['#383654','#776998','#bfb0d6'],hair:['#525772','#9ca5ba','#e5dbda']},void:{skin:['#3d3455','#7c659a','#c4a6cc'],cloth:['#2d293f','#655579','#aa84b5'],hair:['#393245','#796884','#ccadcc']}};
export const LEGACY_PIXEL_SPECIES=[...CORE_SPECIES,...EXPANSION_SPECIES].map((s,i)=>{
 let rig=['bird','owl','bat','moth'].includes(s.shape)?'flyer':['spider','mantis'].includes(s.shape)?'spider':['jelly','squid'].includes(s.shape)?'jelly':['snake','cobra','fish'].includes(s.shape)?'serpent':['golem','turtle','rhino','crab','beetle'].includes(s.shape)?'mech':'wolf';
 const design=s.shape==='bear'?'bear':s.shape==='dragon'?'drake':s.shape==='deer'?'stag':s.shape==='moth'?'moth':s.shape==='turtle'?'beetle':s.shape==='bat'?'bat':rig;
 return {...s,nativeRig:rig,nativeDesign:design,pixelConverted:true,bodySize:s.rarity==='Legendary'?2.8:s.shape==='golem'||s.shape==='rhino'?2:s.rarity==='Epic'?1.6:rig==='jelly'?.85:1,evolutionLimit:2,pixelPalette:palettes[s.element],pixelMark:i%6,artSheet:'native'};
});
