import {CORE_SPECIES} from './core-species.js';
import {EXPANSION_SPECIES} from './roster.js';
const palettes={ember:{skin:['#71392b','#bd7140','#e9b568'],cloth:['#592c38','#ac4e3e','#eea75e'],hair:['#75362b','#c86d33','#f2c776']},tide:{skin:['#305467','#6ba0af','#b9d6d7'],cloth:['#203f58','#527c9c','#9fd4d6'],hair:['#344d6c','#7298ae','#c6dee1']},grove:{skin:['#355740','#7c9e5f','#c0cc8e'],cloth:['#2e4737','#64945a','#bac785'],hair:['#435533','#91a553','#d5d79a']},storm:{skin:['#56506f','#9488b3','#d6cadf'],cloth:['#383654','#776998','#bfb0d6'],hair:['#525772','#9ca5ba','#e5dbda']},void:{skin:['#3d3455','#7c659a','#c4a6cc'],cloth:['#2d293f','#655579','#aa84b5'],hair:['#393245','#796884','#ccadcc']}};
const designs={
 cinderfox:'feralfox',mossguard:'troll',brookfin:'fish',voltwing:'owl',pyrehorn:'rhino',bloomkin:'faerie',glacier:'troll',thornstag:'stag',nightmaw:'cat',sparkhare:'rabbit',
 solwyrm:'drake',lunacrest:'feralfox',astralisk:'drake',tempest:'owl',duskcap:'mushroom',flintback:'turtle',elderoot:'stag',starborn:'cat',abyssal:'troll',coralisk:'drake',
 ashpup:'feralfox',coalcrab:'crab',wickmoth:'moth',glassfang:'drake',pipthorn:'rabbit',barkbeetle:'beetle',cloverimp:'goblin',reedcobra:'serpent',dewotter:'feralfox',brineclam:'clam',
 pearlsquid:'squid',riptalon:'harpy',zipmouse:'rodent',dynamoar:'rhino',lumenjelly:'jelly',arcscarab:'beetle',gloomkit:'cat',onyxarmadillo:'turtle',dreamslug:'mushroom',veilspider:'spider',
 kilnram:'stag',flarefin:'fish',saffrake:'drake',phoenix:'phoenix',mycobear:'bear',orchimantis:'mantis',canopyowl:'owl',worldtortoise:'turtle',floebear:'bear',mirrormanta:'fish',
 trenchfang:'drake',leviacrown:'drake',thunderram:'stag',cloudlynx:'cat',skyray:'fish',thunderroc:'owl',gravitan:'troll',riftmoth:'moth',nullraptor:'drake',eclipsaur:'drake',
};
const rigs={troll:'orc',faerie:'caster',goblin:'knight',fish:'serpent',serpent:'serpent',mushroom:'jelly',clam:'jelly',squid:'jelly',jelly:'jelly',owl:'flyer',harpy:'flyer',moth:'flyer',phoenix:'flyer',spider:'spider',crab:'crab',beetle:'mech',mantis:'mech'};
export const LEGACY_PIXEL_SPECIES=[...CORE_SPECIES,...EXPANSION_SPECIES].map((s,i)=>{
 const design=designs[s.id];if(!design)throw new Error('Missing legacy anatomy: '+s.id);const rig=rigs[design]||'wolf';
 return {...s,nativeRig:rig,nativeDesign:design,pixelConverted:true,bodySize:s.rarity==='Legendary'?2.8:s.shape==='golem'||s.shape==='rhino'?2:s.rarity==='Epic'?1.6:rig==='jelly'?.85:1,evolutionLimit:2,pixelPalette:palettes[s.element],pixelMark:i%6,artSheet:'native'};
});
