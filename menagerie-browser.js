const ranks={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function browseMenagerie(species,profile,{filter='all',query='',sort='discovered',elements={}}={}){
 const owned=new Set(profile.owned),terms=normalize(query).split(/\s+/).filter(Boolean);
 return species.filter(s=>{
  if(filter==='owned'?!owned.has(s.id):filter!=='all'&&s.element!==filter)return false;
  const text=normalize([owned.has(s.id)?s.name:'Undiscovered',s.role,s.element,elements[s.element]?.name,s.rarity].join(' '));
  return terms.every(term=>text.includes(term));
 }).sort((a,b)=>{
  const order=sort==='rarity'?(ranks[b.rarity]-ranks[a.rarity]):sort==='bond'?((profile.bonds?.[b.id]||0)-(profile.bonds?.[a.id]||0)):sort==='element'?a.element.localeCompare(b.element):sort==='discovered'?Number(owned.has(b.id))-Number(owned.has(a.id)):0;
  return order||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
 });
}
