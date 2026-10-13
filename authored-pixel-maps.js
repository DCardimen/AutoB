// Pixel-authored material clusters. Each character is a cell, not a polygon vertex.
// Transparent dots deliberately preserve holes and the outer silhouette.
export const ART_SPEC={revision:3,cell:64,directions:8,lighting:'upper-left',sampling:'nearest',outline:'#222632',benchmarks:['aurel','grit','luma']};
export const FACE_MAPS={
 front:[
  '......OOOOOO.......','....OO222211OO.....','...O2222222111O....','..O222222221111O...','..O222222211111O...',
  '.O22222221111110O..','.O22222111111110O..','.O22211111111110O..','.O22111111111110O..',
  '.O22111111111110O..','..O111111111110O...','..O111111111100O...','...O1111111100O....','....O1111100OO.....','.....OOOOOOO.......'],
 quarter:[
  '......OOOOOO.......','....OO222211OO.....','...O2222222111O....','..O222222221111O...',
  '..O222222211111O...','.O22222221111110O..','.O222221111111110O.','.O222111111111110O.',
  '.O221111111111111O.','.O221111111111100O.','..O1111111111110O..','..O111111111110O...',
  '...O11111111100O...','....O11111100OO....','.....OOOOOOOO......'],
 profile:[
  '......OOOOOO.......','....OO222211OO.....','...O2222222111O....','..O222222221111O...',
  '..O222222211111O...','..O222222211111O...','..O222221111111O...','..O2221111111111OO.',
  '..O221111111111111O','..O2211111111111OO.','...O111111111110O..','...O111111111110O..',
  '....O1111111110O...','.....O1111100OO....','......OOOOOOO......'],
};
export const HAIR_MAPS={
 front:[
  '.......llllll.......','.....llbbbbball......','....lbbbbbbbaaal.....','...lbbbbbaaaaaaal....','..lbbbaaaaaaaaaaal...',
  '..lbbaaaabaaaaaaal...','.lbaaaaalbaaaaalal...','.laaallllaaaalllaal..','.laall..laall..laal..',
  '.lal.....ll.....lal..','.lal............lal..','.lal............lal..','.lal............lal..',
  '..lal..........lal...','..lal..........lal...','...ll..........ll....'],
 quarter:[
  '.......llllll.......','.....llbbbbball......','....lbbbbbbbaaal.....','...lbbbbbaaaaaaal....','..lbbbaaaaaaaaaaal...',
  '..lbbaaaabaaaaaaal...','.lbaaaaalbaaaaalal...','.laaallllaaaalllaal..','.laall...aall..laal..',
  '.lal......ll....lal..','.lal............lal..','.lal............lal..','.lal............lal..',
  '..lal...........lal..','..lal............ll..','...ll................'],
 profile:[
  '.......llllll.......','.....llbbbbball......','....lbbbbbbbaaal.....','...lbbbbbaaaaaaal....','..lbbbaaaaaaaaaaal...',
  '..lbbaaaabaaaaaaal...','..lbaaaaalbaaaaalal..','..laaallllaaaalllal..','..laallllllallll.ll..',
  '..lalbaaaal..........','..lalbaaall..........','..lalbaaall..........','..lalbaaall..........',
  '...lalaaal...........','...lalall............','....lll..............'],
 back:[
  '.......llllll.......','.....llbbbbball......','....lbbbbbbbaaal.....','...lbbbbbaaaaaaal....','..lbbbaaaaaaaaaaal...',
  '..lbbaaaabaaaaaaal...','.lbaaaaalaaaaallal...','.lbaaaaalbaaaalaal...','.lbaaaaalbaaaalaal...',
  '.laaaaaalbaaaalaal...','.laaaaaalaaaaalaal...','.laaaaallaaaallaal...',
  '..laaaallaaallaal....','..llaaallaaallaal....','...llaaallaallll.....','.....llllllll.......'],
};
export const HELMET_MAPS={
 front:[
  '.......OOOOOO.......','.....OOrhhrrnOO.....','....OrhhhrrrnnnO....','...OrhhhrrrrnnnnO...',
  '..OrhhrrrrrnnnnnmO..','..OhrrrrrrrnnnnnmO..','.OrrrrrrrrnnnnnnmmO.','.OrnnnnnnnnnnnnnmmO.',
  '.OnnnOOOOOOOOOnnmmO.','.OnnO.........OnmmO.','.OnnO.........OnmmO.',
  '.OnrnO.......OnnmmO.','.OnrnO.......OnnmmO.','..OnrnOOOOOOOnnmmO..',
  '..OnrnnnnmnnnnnmmO..','...OnrnnnmmnnnmmO...','....OOnnnmmnnOO.....','......OOOOOOO.......'],
 quarter:[
  '.......OOOOOO.......','.....OOrhhrrnOO.....','....OrhhhrrrnnnO....','...OrhhhrrrrnnnnO...',
  '..OrhhrrrrrnnnnnmO..','..OhrrrrrrrnnnnnmO..','.OrrrrrrrrnnnnnnmmO.','.OrnnnnnnnnnnnnnmmO.',
  '.OnnnOOOOOOOOnnnmmO.','.OnnO........OrnmmO.','.OnnO........OrnmmO.',
  '.OnrnO.......OrnmmO.','.OnrnO.......OrnmmO.','..OnrnOOOOOOOnnnmmO..',
  '..OnrnnnnnnnnnnmmO..','...OnrnnnnnnnnmmO...','....OOnnnnnnnOO.....','......OOOOOOO.......'],
 profile:[
  '.......OOOOOO.......','.....OOrhhrrnOO.....','....OrhhhrrrnnnO....','...OrhhhrrrrnnnnO...',
  '..OrhhrrrrrnnnnnmO..','..OhrrrrrrrnnnnnmO..','..OrrrrrrrnnnnnnmO..','..OrnnnnnnnnnnnnmO..',
  '..OnnnnnnnnOOOOOmO..','..OnnnnnnnO....OmO..','..OnnnnnnnO....OmO..',
  '..OnrnnnnnO....OmO..','..OnrnnnnnnO...OmO..','...OnrnnnnnnOOOmO...',
  '...OnrnnnnnnnnmmO...','....OnrnnnnnnmmO....','.....OOnnnnnOO......','.......OOOOO........'],
 back:[
  '.......OOOOOO.......','.....OOrhhrrnOO.....','....OrhhhrrrnnnO....','...OrhhhrrrrnnnnO...',
  '..OrhhrrrrrnnnnnmO..','..OhrrrrrrrnnnnnmO..','.OrrrrrrrrnnnnnnmmO.','.OrnnnnnnmnnnnnnmmO.',
  '.OnnnnnnnmnnnnnnmmO.','.OnnnnnnnmnnnnnnmmO.','.OnnnnnnnmnnnnnnmmO.',
  '.OnrnnnnnmnnnnnnmmO.','.OnrnnnnnmnnnnnnmmO.','..OnrnnnnmnnnnnmmO..',
  '..OnrnnnnmnnnnnmmO..','...OnrnmmmmnnnmmO...','....OOnnnnnnnOO.....','......OOOOOOO.......'],
};
export const TORSO_MAPS={
 knight:[
  '.....OOnnnOO.....','...OOrhrrrnnOO...','..OrhhrrrnnnnmO..','.OrhrrrnnnnnnmmO.',
  '.OnrrnOccOnnnmmO.','..OnrnOcdeOnnmmO.','..OnnnOcdeOnnmmO.','...OnnOcdeOnmmO..',
  '...OmmOlhlOmmO...','...OcccOhOcccO...','...OcddeOdcmmO...','...OcddeOdcmmO...',
  '....OcddOddmO....','.....OOOOOOO.....'],
 orc:[
  '.....OO111OO.....','...OO2222111OO...','..O22221111110O..','.O2222111111110O.',
  '.O2211000011110O.','.O2111O11111110O.','..O111O1111110O..','..O11cO111110O...',
  '...Ocddd1110O....','...OcddeOdcOO....','...OcdlhlldcO....','...OcddeOdcmmO...',
  '....OcddOddmO....','.....OOOOOOO.....'],
 elf:[
  '.....OOdddOO.....','....OdeeddeOO....','...OdeeedddddO...','..OdeeeddddddccO.',
  '..OdedcdeddddccO.','..OddcdedddddccO.','...OdcdeddddccO..','...OddcddddccO...',
  '...OdddlhldccO...','...OcccOhOcccO...','...OdeddddcccO...','...OdeddOdcccO...',
  '....OddOOddcO....','.....OO..OOO.....'],
 caster:[
  '.....OOdddOO.....','....OrheddhrO....','...OrheedddhrO...','..OrheedddddhrO..',
  '..OrededddddhrO..','..OrededddddhrO..','...OredeedddrO...','...OrededdddrO...',
  '...OrrrlhlrrrO...','..OreddeOdddcrO..','..OreddeOdddcrO..','..OreddeOdddcrO..',
  '.OreeddeOddddcrO.','.OreeddcOddddcrO.','..OrrrrrrrrrrrO..','...OOOOOOOOOOO...'],
 fox:[
  '.....OOdddOO.....','....OdeeddeOO....','...OdeeedddddO...','..OdeeeddddddccO.',
  '..OdedcdeddddccO.','..OddcdedddddccO.','...OdcdeddddccO..','...OddcddddccO...',
  '...OdddlhldccO...','...OcccOhOcccO...','...OdeddddcccO...','...OdeddOdcccO...',
  '....OddOOddcO....','.....OO..OOO.....'],
 goblin:[
  '.....OOdddOO.....','....OdeedddcO....','...OddeedddccO...','..OddeeddddcccO..',
  '..OdedlcddddccO..','..OddlcddddcccO..','...OlcldddlccO...','...OcllllllccO...',
  '...OlllhhllllO...','...OcccOhOcccO...','...OdddO0ddccO...','...OdddOOddccO...',
  '....OddOOddcO....','.....OO..OOO.....'],
 fairy:[
  '.....OOdddOO.....','....O1deedd1O....','....O1deddd1O....','.....OdeddcO.....',
  '.....OldhldO.....','....OeeedddcO....','...OeeeddeddcO...','..OeedededddccO..',
  '..OededededcccO..','...OdeedddcccO...','....OOdddOOO.....','......OOO........'],
};
export const WING_MAP=[
 '.....HH..........','....HhbH.........','...HhbbabH.......','..HhbaaaaabH.....',
 '.HhbaaaaaaaabH...','HhbaaaaalaaaabH..','HhbaaalalaaaaabH.','HhbaaalaaalaaaabH',
 '.HbaalaaaalaaaabH','..HbalalaaalaabH.','...HbalalaaaabH..','....HballaaabH...',
 '.....HblaaabH....','......HbaabH.....','.....HbaaabH.....','....HbaaaaabH....',
 '...HbaalaaaabH...','..HbaalaaalaabH..','..HbaalaaaaabH...','...HbalaaaabH....','....HbaaaabH.....','.....HHHHH.......'];

const cache=new WeakMap();
export function mapPixels(map){
 if(!cache.has(map)){const width=Math.max(...map.map(r=>r.length)),pixels=[];for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)if(map[y][x]!=='.'&&map[y][x]!==' ')pixels.push([x,y,map[y][x]]);cache.set(map,{width,height:map.length,pixels});}return cache.get(map);
}
export function stampPixels(b,map,x,y,palette,{flip=false,squeeze=1,tilt=0,anchorX,anchorY}={}){
 const m=mapPixels(map),ax=anchorX??m.width/2,ay=anchorY??m.height/2,cos=Math.cos(tilt),sin=Math.sin(tilt);
 for(const [xx,yy,key]of m.pixels){const color=palette[key];if(!color)continue;const dx=((flip?m.width-1-xx:xx)-ax)*squeeze,dy=yy-ay;
  b.dot(Math.round(x+dx*cos-dy*sin),Math.round(y+dx*sin+dy*cos),color);
 }
}
