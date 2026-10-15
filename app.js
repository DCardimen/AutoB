import {arenaCamera,arenaPoint} from './arena-camera.js';
import {relicBarHTML,installRelicPreviews,refreshRelicPreviews} from './relic-ui.js';
import {decorateAmbientBackgrounds,tickAmbientBackgrounds} from './ambient-ui.js';
import {UI_ART,artImage,gearArt,relicArt,lootArt,skillArt,decorateUploadedArt} from './ui-art.js';
import {rewardsShell,rewardDropHTML,animateRewardCollection,animateRewardReveal} from './rewards-ui.js';
import {growthHTML} from './battle-summary.js';
import {SettingsMovementPreview} from './settings-movement-preview.js';
import {showLogoIntro} from './intro.js';
import {starterReactionProfile,starterReactionPose,starterReactionPixels} from './starter-reactions.js';
import {assignEliteModifier,eliteModifier,rememberEliteCapture,inheritEliteStarter,idleRhythm} from './elite-modifiers.js';
import {enrageAt} from './battle-enrage.js';
import {migrateStarterGear} from './starter-equipment.js';
import {updateLiveRoster} from './live-roster.js';
import {fieldIcon,fieldJourney,decorateFieldUI,worldArt} from './field-ui.js';
import {interpolatedNativeUnit} from './native-motion.js';
import {WEARER_RELICS,WEARER_BY_ID,initializeCompanion} from './wearer-relics.js';
import {BIOMES,planetOrb,biomeScenery,worldJourneyHTML} from './planet-ui.js';
import {equipmentDropChance} from './equipment-loot.js';
import {TUNING_OPTIONS,DEFAULT_TUNING,normalizeTuning,setTuning} from './tuning.js';
import {battleSummaryHTML} from './battle-summary.js';
import {applyLoadoutDrop} from './loadout-interactions.js';
import {activeAilments,STATUS_AILMENTS,annotateAilments} from './status-ailments.js';
import {combatEffectDescription} from './item-effects.js';
import {chooseLegendaryPact,assignEnemyRelics,recruitPrice,refundCapture,progressive,capacity,CAPTURERS,buyCapturer,consumeCapturer,addCapturer,routeVisible,claimLoot,makeLoot,lootName,buyPermit,permitCost,buyRecruit} from './expedition-rules.js';
import {RUN_RELIC_BY_ID,EXPEDITION_RELICS,routeModifiers} from './run-relics.js';
import {DeploymentPhysics} from './deployment-physics.js';
import {nativeSpawn,nativeBodyHeight} from './native-combat.js';
import {nativePortrait,getCharacterHeight,drawNativeUnit} from './native-art.js';
import {CREATURE_GEAR,GEAR_BY_ID,equipmentSlots,equipmentDescription,enemyEquipment,armorReduction,claimEvolutionGear,equipGear,removeGear,buyGear} from './creature-equipment.js';
import {evolutionSkillIds} from './evolution-skills.js';
import {creatureTypeFactor,creatureWorldScale,MAX_CREATURE_TYPE_FACTOR} from './native-size.js';
import {setCharacterHeight,nativePreviewFrame} from './native-art.js';
import {NATIVE_POSES} from './native-poses.js';
import {exportNativeAtlas} from './native-export.js';
import {practiceBattle,practiceResult,PRACTICE_SCENARIOS} from './practice.js';
import {ORDERS,CONDITIONS,RESPONSES,OPENING_BOONS,chooseOpeningBoon} from './native-tactics.js';
import {finishNativeVisuals} from './native-combat.js';
import {NATIVE_STARTERS,NATIVE_EVOLUTIONS,NATIVE_SPECIES,PIXEL_SPECIES,pixelSpec,NATIVE_POOLS,lineageLimit,lineageProgress} from './native-content.js';
import {
  ELEMENTS,
  SPECIES,
  BY_ID,
  STARTERS,
  RARITY,
  PLANETS,
  RELICS,
  rng,
  shuffled,
  pick,
  creature,
  xpNeeded,
  gainXP,
  synergies,
  stats,
  makeRun,
  generateRoute,
  canVisit,
  enterNode,
  nextNode,
  encounter,
  captureChance,
  rollCapture,
  buyRelic,
  buyCreature,
  rewardBattle,
  EVENTS,
  eventForRun,
  applyEvent,
  Battle,
  personalRelic,
  equipRelic,
  unequipRelic,
  linkedSupport,
  creatureName,
  evolutionStage,
  relicSlots,
  evolutionOffer,
  evolveCreature,
  EVOLUTION_PATHS,
  encounterInfo,
  defaultDeployment,
  setDeployment,
  effectiveSkill,
  skillDefinition,
  settleCaptureRecruitment,
  buyLegendaryLure,
  eventAvailable,
  generateShop,
  CASUALTY_RISK,
  casualtyRisk,
  hospitalOffer,
  upgradeHospital,
  trainSurvival,
  settleDefeat,
  deployReserve,
} from "./game.js";
import { SKILLS, loadoutFor } from "./skills.js";
import { creatureImage, renderBattle } from "./art.js";
import {
  POLICIES,
  traitFor,
  evolutionMechanic,
  DIFFICULTIES,
  CHAOS_TIERS,
  chaosLevel,
  shopPrice,
  unlockChaos,
  starterPoints,
  starterSlots,
  starterBudget,
  recordBond,
} from "./tactics.js";
import { Soundscape } from "./sound.js";
const soundscape = new Soundscape();
const deployment=new DeploymentPhysics();let defeatFilm=null,victoryFilm=null;
const PERSONAL_RELICS=WEARER_RELICS,PERSONAL_BY_ID=WEARER_BY_ID;
const $ = (s) => document.querySelector(s);
const STORE = "starfall-menagerie-v1";
const ICONS = {
  battle: "⚔",
  elite: "♜",
  shop: "⚖",
  event: "✧",
  capture: "◈",
  rest: "❋",
  boss: "♛",
};
const LABELS = {
  battle: "Wild battle",
  elite: "Elite battle",
  shop: "Outpost",
  event: "Unknown signal",
  capture: "Wild sanctuary",
  rest: "Quiet grove",
  boss: "Planet boss",
};
const ROLES = { Guardian: "◒", Striker: "⌁", Ranger: "→", Support: "✚" };
let saved;
try {
  saved = JSON.parse(localStorage.getItem(STORE));
} catch {}
if([1,2,3,4,5,6].includes(saved?.version)){try{const backup=STORE+".backup-v"+saved.version;if(!localStorage.getItem(backup))localStorage.setItem(backup,JSON.stringify(saved));}catch{}}
let profile = {
  owned: [...STARTERS],
  runs: 1,
  best: 0,
  victories: 0,
  tutorial: false,
  sound: false,
  characterHeight:100,
  formDiscoveries: {},
  formBranches: {},
  chaosUnlocked: 0,
  chaosCleared: 0,
  starlight: 0,
  bonds: {},
  eliteCaptures: [],
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ...saved?.profile,
};
profile.tuning=setTuning(profile.tuning||DEFAULT_TUNING);
let settingsPreview=null;
let lootCollecting=false;
let intelTab='briefing';
let rewardShownKey=null;
let settingsPrevious=null,recapMetric="damage",recapSide=0;
profile.characterHeight=Math.max(85,Math.min(110,Number(profile.characterHeight)||100));
setCharacterHeight(profile.characterHeight/100);
let rosterFamily="brom",rosterState="run",rosterForm=0,rosterPath="wild";
if (profile.victories > 0)
  profile.chaosUnlocked = Math.max(1, profile.chaosUnlocked || 0);
profile.owned = [
  ...new Set([...STARTERS, ...NATIVE_STARTERS, ...profile.owned.filter((id) => BY_ID[id])]),
];
let starterEliteSelection={};
let starterTypeFilter='all',starterCostFilter='all',starterSort='featured';
let run,
  phase,
  node,
  foes,
  battle = null,
  viewName = "arena",
  committed = false,
  reward = null,
  captureTarget = null,
  captureAttempted = false,
  upgradeChosen = null,
  shopStock = null,
  eventIndex = 0,
  filter = "all",
  starterSelection = NATIVE_STARTERS.slice(0,2),
  speed = 1,
  paused = false,
  canvas = null,
  ctx = null,
  last = performance.now(),
  toastTimer,
  modalKind = null,
  selectedCreature = 0,
  detailTab = "overview",
  recordedEnd = !!saved?.recordedEnd,
  lastReport = saved?.lastReport || null,
  selectedDifficulty = "standard",
  selectedChaos = 1,
  formationSelection = 0;
if (
  Array.isArray(saved?.run?.team) &&
  saved.run.team.length <= 6 &&
  saved.run.team.every((c) => c && BY_ID[c.id]) &&
  saved.run.planet >= 0 &&
  saved.run.planet <= 3
) {
  run = {
    ...saved.run,
    random: rng(saved.run.seed + saved.run.wins * 771 + saved.run.depth * 33),
  };
  phase = saved.phase === "battle" ? "prep" : saved.phase || "prep";
  node = saved.node;
  foes = saved.foes;
  committed = !!saved.committed;
  reward = saved.reward;
  captureTarget = saved.captureTarget;
  captureAttempted = !!saved.captureAttempted;
  upgradeChosen = saved.upgradeChosen;
  shopStock = saved.shopStock;
  eventIndex = saved.eventIndex || 0;
  if (phase === "map") viewName = "map";
} else freshRun(NATIVE_STARTERS, false);
if((run.rulesVersion||0)<12)run.team.forEach(c=>c.starter??=true);
run.chaosCleared=Math.max(run.chaosCleared||0,profile.chaosCleared||0);
run.rulesVersion=17;run.teamCapacity=Math.min(6,Math.max(run.teamCapacity||2,run.team.length+(run.legendaryPact?1:0),starterSlots(profile),run.difficulty==='chaos'&&run.chaos>=3?3:2));run.captureTools??={scout:run.orbs||0,runic:0,astral:0,mythic:0};run.team.forEach((c,i)=>c.seat??=i);
run.rosterMode ??= run.native?"authored":"collection";
run.native=true;
run.gearInventory ??= [];
for(const c of [...run.team,...run.bench||[]])if(c.equipmentQuality&&c.equipmentQuality!==1){c.equipmentRolls=(c.equipment||[]).map((id,i)=>({...c.equipmentRolls?.[i],id,quality:(c.equipmentRolls?.[i]?.quality??1)*c.equipmentQuality}));c.equipmentQuality=1;}
run.inventory ??= [];
migrateStarterGear(run);
run.fieldHospital ??= 0;
run.fallen ??= [];
run.defeatLedger ??= {};
run.battleSerial ??= 0;
for (const c of [...run.team, ...run.bench]){c.relics??=[];initializeCompanion(run,c);}
for(const [i,c]of (foes||[]).entries()){c.terrain=[];if((c.balanceVersion||0)<15){assignEnemyRelics(run,c,node?.type||'battle',node?.seed||run.seed);enemyEquipment(c,(node?.seed||run.seed)+i*431,run.planet*8+run.depth,chaosLevel(run));}}
if(node?.type==="elite"&&foes?.length)assignEliteModifier(foes,node.seed,BY_ID);
if(shopStock?.recruits)shopStock.recruits.forEach(c=>initializeCompanion(run,c));
run.inventory.forEach(r=>delete r.link);
if(shopStock)shopStock.relics=shopStock.relics.slice(0,2);
// Repair an already-completed capture from an older save, once. Mid-fight
// reloads must finish their encounter before the battle copy joins the roster.
if(phase==='reward'){
  const result=reward?.tacticalCapture||run.captureReservation?.result;
  if(result?.success)result.creature.bond??=Math.min(5,profile.bonds[result.creature.id]||0);
  rememberEliteCapture(profile,result);
  if(settleCaptureRecruitment(run,result))save();
}
function freshRun(ids, increment = true, options = {}) {
  if (increment) profile.runs++;
  run = makeRun(Date.now() % 2147483647, ids, {...options,native:true,starterBudget:starterBudget(profile),chaosCleared:profile.chaosCleared,starterBonds:profile.bonds});
  run.team.forEach((c) => {c.bond = Math.min(5, profile.bonds[c.id] || 0);inheritEliteStarter(c,profile,starterEliteSelection[c.id]);});
  run.route = generateRoute(run);
  phase = "prep";
  node = run.route[0][0];
  run.encounterType = node.type;
  foes = encounter(run, node.type, node.seed);
  committed = false;
  battle = null;
  reward = null;
  captureTarget = null;
  captureAttempted = false;
  upgradeChosen = null;
  shopStock = null;
  recordedEnd = false;
  lastReport = null;
  viewName = "arena";
  speed = 1;
  paused = false;
}
function save() {
  try {
    const { random, ...data } = run;
    localStorage.setItem(
      STORE,
      JSON.stringify({
        version: 7,
        profile,
        run: data,
        phase,
        node,
        foes,
        committed,
        reward,
        captureTarget,
        captureAttempted,
        upgradeChosen,
        shopStock,
        eventIndex,
        recordedEnd,
        lastReport,
      }),
    );
    $(".local-label").innerHTML = "<i></i> LOCAL SAVE";
  } catch {
    $(".local-label").textContent = "SAVE UNAVAILABLE";
  }
}
function unlock(id) {
  if (!profile.owned.includes(id)) {
    profile.owned.push(id);
    toast(`${BY_ID[id].name} discovered. Available in future expeditions.`);
  }
  save();
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
}
function tag(text, color = "") {
  return `<span class="tag ${color}">${text}</span>`;
}
function button(text, action, extra = "", disabled = false) {
  return `<button class="button ${extra}" data-action="${action}" ${disabled ? "disabled" : ""}>${text}</button>`;
}
window.addEventListener("art-ready", () => {
  render();
});
function image(unit, cls = "") {
  return `<img class="${cls}" src="${creatureImage(unit)}" alt="${creatureName(unit)}" draggable="false">`;
}
function activeSynergies() {
  return Object.values(synergies(run.team)).filter((n) => n >= 2).length;
}
var liveRosterSide=0,liveSelectedUid=null;
function render() {
  const pageScroll={left:scrollX,top:scrollY};
  updateHeader();refreshRelicPreviews();installRelicPreviews();
  document.body.dataset.planet = Math.min(run.planet,2);
  document.body.dataset.phase = phase;
  document.body.classList.toggle("gentle-ui",!!profile.reducedMotion);
  document.body.dataset.screen = viewName;
  document.body.style.setProperty('--current-world-art','url('+worldArt(Math.min(run.planet,2))+')');
  document
    .querySelectorAll("[data-view]")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.view === viewName),
    );
  $("#view").innerHTML = relicBarHTML(run.relics.map(id=>RELICS.find(r=>r.id===id)||RUN_RELIC_BY_ID[id]).filter(Boolean),relicDescription,{inventory:run.inventory.length,pact:legendaryPactBanner()}) + (
    viewName === "arena"
      ? arenaHTML()
      : viewName === "map"
        ? mapHTML()
        : collectionHTML());
  if(viewName==='arena'&&phase==='battle')refreshLiveRoster();
  decorateFieldUI();decorateUploadedArt();decorateAmbientBackgrounds();
  canvas = $("#battle-canvas");
  ctx = canvas?.getContext("2d");
  if (canvas) {
    resizeCanvas();
  }
  if (viewName === "arena") {bindDrag();bindArenaDeployment();}
  if(ctx&&canvas)renderBattle(ctx,canvas.width,canvas.height,battle,Math.min(run.planet,2),performance.now()/1000,run.team,foes||[]);
  if(canvas){drawEnemyOverheads();drawAllyOrders();}window.scrollTo({...pageScroll,behavior:"instant"});decorateAilments($("#view"));prepareLoadoutDragging();updateCaptureFeedback();
}
function updateHeader() {
  document.body.classList.toggle("native-expedition",!!run.native);
  const version=document.querySelector(".local-label");if(version)version.innerHTML="<i></i> "+"SAVED ON THIS DEVICE";
  const p = PLANETS[Math.min(run.planet, 2)];
  $("#run-number").textContent = String(profile.runs).padStart(3, "0");
  $("#collection-count").textContent = profile.owned.length;
  $("#gold").textContent = run.gold;
  $("#orbs").textContent = run.orbs;
  $("#lives").innerHTML = `${run.integrity} <em>/ 3</em>`;
  $("#planet-kicker").textContent = run.complete
    ? "EXPEDITION COMPLETE · THREE WORLDS EXPLORED"
    : viewName === "collection"
      ? "THE PERMANENT COLLECTION"
      : `PLANET ${String(run.planet + 1).padStart(2, "0")} / 03 · ${viewName === "map" ? "CHOOSE YOUR OWN WAY" : "THE OUTER WILDS"}`;
  $("#page-title").innerHTML =
    viewName === "collection"
      ? "Your menagerie<span>.</span>"
      : viewName === "map"
        ? "Follow the stars<span>.</span>"
        : p.name + "<span>.</span>";
  $("#page-subtitle").textContent =
    viewName === "collection"
      ? "The friends you find stay with you. Every capture opens a new beginning."
      : viewName === "map"
        ? "Every path has a price. Choose the one your team can afford."
        : "Strange worlds. Unlikely companions. One extraordinary expedition.";
}
function arenaHTML() {
  const live = phase === "battle",
    mapWaiting = phase === "map",
    ended = phase === "ended" || run.complete;
  const type = node?.type || "battle",
    p = PLANETS[Math.min(run.planet, 2)];
  const mainAction = ended
    ? button('Begin again <span class="arrow">→</span>', "new-run")
    : mapWaiting
      ? button('Choose your path <span class="arrow">→</span>', "view-map")
      : live
        ? button("Battle report →", "report", "secondary")
        : phase === "reward"
          ? button("Claim your rewards →", "reward")
          : button(
              'Enter battle <span class="arrow">→</span>',
              "battle",
              "",
              !["battle", "elite", "boss", "capture"].includes(type),
            );
  return `${fieldJourney(run,phase,PLANETS)}${!profile.tutorial ? `<div class="tutorial-callout"><span>Scout the enemy and equip your companions. Your team fights automatically.</span>${button("Equip your starter gear", "tutorial-gear", "secondary small")}<button data-action="dismiss-tutorial" aria-label="Dismiss welcome">×</button></div>` : ""}<div class="arena-grid"><div class="arena-main"><section class="panel arena-panel"><div class="panel-top"><span class="panel-title">${p.name.toUpperCase()} · FIELD <span style="color:#687d5d;margin-left:9px">/ ${String(run.depth + 1).padStart(2, "0")}</span></span><span class="status-dot ${live ? "live" : ""}"><i></i> ${live ? "BATTLE IN PROGRESS" : phase === "reward" ? "ENCOUNTER COMPLETE" : mapWaiting ? "AWAITING YOUR PATH" : ended ? "EXPEDITION ENDED" : "PREPARING FOR BATTLE"}</span></div>${enrageHTML()}<div class="arena-frame"><div class="arena-viewport"><canvas id="battle-canvas" aria-label="Real-time creature arena. Your expedition is on the left, wild creatures on the right."></canvas><div class="arena-label"><span class="location-icon">${ICONS[type]}</span><div><strong>${type === "boss" ? p.bossName : "The Forgotten Colosseum"}</strong><small>${p.name.toUpperCase()} · ${LABELS[type].toUpperCase()}</small></div></div><svg id="target-preview" class="target-preview" viewBox="0 0 1002 654" aria-hidden="true"></svg><div id="capture-feedback" class="capture-feedback" role="status" aria-live="polite"></div><div class="arena-timer" id="arena-timer">${live ? "00:00" : "READY"}</div>${type === "boss" ? `<div class="boss-banner"><div><span>${p.bossName}</span><small id="boss-phase">PHASE I</small></div><div class="boss-health-track"><i id="boss-health" style="width:100%"></i></div></div>` : ""}<div class="arena-field-tools"><button data-action="formation">${artImage('icon-formation')}Formation: ${run.formation||'balanced'}</button><button data-action="formation">${artImage('icon-battle')}Deploy</button><button data-action="capture-kit">${artImage('icon-target')}Target lock</button></div><div class="arena-bottom-labels"><span id="ally-count">YOUR EXPEDITION · ${run.team.length}</span><span class="versus">vs.</span><span id="foe-count">THE WILDS · ${foes?.length || 4}</span></div></div>${arenaDeckHTML()}</div><div class="arena-control"><div class="control-left"><button class="pause-btn" data-action="pause" title="Pause battle (Space)" aria-label="Pause battle" ${!live ? "disabled" : ""}>${paused ? "▶" : "II"}</button><div class="speed-switch" aria-label="Battle speed">${[1, 2, 3].map((v) => `<button data-speed="${v}" class="${speed === v ? "active" : ""}">${v}×</button>`).join("")}</div><span class="control-note"><kbd>SPACE</kbd> to pause</span></div>${phase==='prep'?'':mainAction}<nav class="arena-dock" aria-label="Expedition tools">${dockHTML()}</nav></div>${live&&run.captureOrder?retryControlsHTML():''}<details class="field-enemy-brief" ${matchMedia("(min-width:900px)").matches?"open":""}><summary>Enemy build <span>Inspect relics & equipment</span></summary>${enemyRelicBannerHTML()}</details></section><div class="battle-feed"><time id="feed-time">✧</time><span id="feed-text">${live ? battle?.log[0]?.text || "The gates open." : "Your formation is set. Let your companions do the fighting."}</span><button class="text-button" data-action="report" style="margin-left:auto;white-space:nowrap">Battle log →</button></div></div><aside class="side-column">${briefingHTML()}${synergyHTML()}</aside></div>`;
}
function creatureCard(u, i) {
  const s = BY_ID[u.id],
    e = ELEMENTS[s.element];
  const ready=evolutionOffer(run,u).ready;
  return `<button class="creature-card ${s.rarity==='Legendary'?'legendary-creature':''} role-${s.role.toLowerCase()} ${ready?'evolution-ready':''}" data-loadout-drop="${i}" data-creature="${i}" draggable="${phase !== "battle"}" style="--element:${e.color}" title="${s.name} · ${s.role} · ${s.skill}"><div class="card-top"><span>${String(i + 1).padStart(2, "0")} <span style="margin-left:4px">${s.role.toUpperCase()}</span></span><span class="role-icon">${ROLES[s.role]}</span></div>${ready?'<span class="evolution-beacon" title="Ready to evolve · inspect this companion">✦</span>':''}${s.rarity==='Legendary'?'<span class="legendary-crown" title="Legendary creature">✦ LEGENDARY</span>':''}<span class="idle-portrait">${image(u, "creature-art")}<canvas width="128" height="128" data-idle-index="${i}" aria-hidden="true"></canvas></span><strong>${creatureName(u)}${u.level >= 5 ? ' <span class="awakened">✧</span>' : ""}</strong><div class="card-meta"><span class="element-name" style="color:${e.color}">${e.icon} ${e.name}</span><b>Lv. ${u.level}</b></div><div class="mini-skills">${[loadoutFor(s, u.level, u).auto, ...loadoutFor(s, u.level, u).active].map((id) => `<span class="mini-ability ${SKILLS[id].auto ? "auto" : ""}" data-unit-skill="${i}:${id}" title="${SKILLS[id].name}: ${SKILLS[id].desc}">${SKILLS[id].auto ? "⌁" : SKILLS[id].icon}<i></i></span>`).join("")}</div><div class="card-vitals"><small data-vital-hp>HEALTH</small><div class="card-health-track"><i data-live-health style="width:100%"></i></div><small data-vital-stamina>STAMINA 100</small><div class="stamina-track"><i data-live-stamina style="width:100%"></i></div></div><small class="card-intent" data-intent="${u.uid}">${run.native?(ORDERS[u.order||"advance"]?.name||"Advance"):""}</small><div class="xp-track" title="${u.xp} / ${xpNeeded(u.level)} EXP"><i style="width:${(u.xp / xpNeeded(u.level)) * 100}%"></i></div><div class="card-slots" title="${(u.relics || []).length} of ${relicSlots(u)} personal relic slots filled">${Array.from({ length: relicSlots(u) }, (_, j) => `<span class="${u.relics?.[j] ? "filled" : ""}" style="color:${u.relics?.[j] ? PERSONAL_BY_ID[u.relics[j].id].color : ""}">${u.relics?.[j] ? "◆" : "◇"}</span>`).join("")}<small>${(u.relics || []).length} / ${relicSlots(u)}</small></div><i class="card-health" style="width:0%"></i></button>`;
}
function briefingHTML() {
  const type = node?.type || "battle",
    elite = ["elite", "boss"].includes(type),
    p = PLANETS[Math.min(run.planet, 2)];
  const titles = {
    battle: "The wilds fight back.",
    elite: "Fortune favors the bold.",
    capture: "A new friend awaits.",
    boss: "A world holds its breath.",
    shop: "A moment to prepare.",
    event: "Listen to the unknown.",
    rest: "Even heroes need rest.",
  };
  const descriptions = {
    battle:
      "A restless group has claimed these ancient grounds. Defeat them, grow stronger, and see who wants to come along.",
    elite:
      "Stronger creatures. Greater rewards. Prepare your team before you risk an expedition life.",
    capture:
      "A rare creature gathers here. A rare hunt offers a capture bonus before health and capturer calculations. Preselect your target and protect your team.",
    boss: `${p.bossName} stands between you and the next world. Every synergy and relic counts.`,
    shop: "Trade your hard-earned gold for a team-defining relic, a new companion, or capture supplies.",
    event:
      "Something unusual waits here. Your choices can change this expedition — and the next.",
    rest: "Recover an expedition life or help your entire team grow. Choose what you need most.",
  };
  return `<section class="panel briefing"><span class="section-kicker">ENCOUNTER BRIEFING</span><h2>${phase === "map" ? "The path is yours." : titles[type]}</h2><p>${phase === "map" ? "Open the star chart to choose your next encounter. Inspect your team before you commit." : descriptions[type]}</p><div class="encounter-tags">${tag(LABELS[type], elite ? "gold" : "")}${tag(`Lv. ${foes?.[0]?.level || 1} – ${Math.max(...(foes || []).map((u) => u.level), 1)}`)}</div><span class="section-kicker">${type === "boss" ? "GUARDIAN & RETINUE" : "SCOUTED CREATURES"}</span><div class="opponent-row">${(
    foes || []
  )
    .slice(0, 6)
    .map(
      (u) =>
        `<button class="opponent-thumb" data-foe="${u.id}" title="${creatureName(u)} · ${BY_ID[u.id].rarity}">${image(u)}<span><strong>${creatureName(u)}</strong><small>${BY_ID[u.id].role} \u00b7 Lv. ${u.level}</small><b>${stats(u,foes,u.enemyRelics||[]).hp} HP</b></span>${roleBadge(BY_ID[u.id])}</button>`,
    )
    .join(
      "",
    )}</div>${scoutingComparisonHTML()}<div class="thin-rule"></div><span class="section-kicker">VICTORY REWARDS</span><div class="reward-preview"><span>◉ ${Math.round((type === "boss" ? 145 : type === "elite" ? 85 : 48 + run.depth * 4)*(run.relics.includes("coin")?1+.35*itemStrength(run):1)*(run.relics.includes("salvage")&&type!=="elite"&&type!=="boss"?.9:1)*(chaosLevel(run)>=17?.88:1)*.65)} base gold</span><span>✧ ${Math.round((type === "boss" ? 72 : type === "elite" ? 46 : 32 + run.depth * 3) * (1 + run.planet * 0.35))} EXP</span><span>◇ Preselect to capture</span></div><div class="scout-panel"><strong>${encounterInfo(run, node).arch.name}</strong><p>${type === "boss" ? encounterInfo(run, node).boss.desc : encounterInfo(run, node).arch.desc}</p><b>COUNTERPLAN</b><p>${type === "boss" ? encounterInfo(run, node).boss.counter : encounterInfo(run, node).arch.counter}</p><span>${encounterInfo(run, node).weather.name} · ${encounterInfo(run, node).weather.desc}</span><small>${DIFFICULTIES[run.difficulty || "standard"].name}${chaosLevel(run) ? " " + chaosLevel(run) + " / 20" : ""}${run.legendaryLure ? " · CELESTIAL BEACON READY" : ""}</small></div>${eliteEncounterHTML(foes)}<div class="briefing-actions">${captureSummaryHTML()}${phase==='prep'?button(artImage('icon-battle')+'Enter battle \u2192','battle','briefing-battle'):phase==='reward'?button('Gather rewards \u2192','show-spoils'):button('Encounter intel \u2192','intel','secondary')}</div><div class="tactical-tip"><strong>AN EXPLORER’S INSTINCT</strong>${type === "boss" ? "Boss creatures have reinforced health. Protect your healers and invest in cooldowns." : "Scout the enemy tactic, equip a counter relic, then adjust deployment."}</div></section>`;
}
function synergyHTML() {
  const syn = synergies(run.team);
  return `<section class="panel synergy-panel"><div class="side-section-heading"><span class="panel-title">TEAM SYNERGIES</span><span class="tag">${activeSynergies()} ACTIVE</span></div><div class="synergy-rows">${Object.entries(
    syn,
  )
    .sort((a, b) => b[1] - a[1])
    .map(([el, n]) => {
      const e = ELEMENTS[el];
      return `<div class="synergy-row" style="--element:${e.color}" title="${e.description}"><span class="element-badge">${artImage("element-"+el)}</span><div><strong style="color:${n >= 2 ? e.color : "#8ca07d"}">${e.name} ${n >= 2 ? "bond" : ""}</strong><small>${n >= 2 ? { ember: "Basic attacks apply burn", grove: "Regenerate 1% HP per second", tide: "+18% team health", storm: "18% faster skill cooldowns", void: "12% team lifesteal" }[el] : "Add one more to activate"}</small><div class="pips">${[0, 1, 2, 3].map((i) => `<i class="${i < n ? "filled" : ""}"></i>`).join("")}</div></div><span class="count">${n}<em> / 4</em></span></div>`;
    })
    .join("")}</div></section>`;
}
let fieldPreviewId=null;
function mapHTML() {
 if(!run.route)run.route=generateRoute(run);
 const world=Math.min(run.planet,2),p=PLANETS[world],biome=BIOMES[world],syn=synergies(run.team);
 const canChoose=!run.complete&&!['battle','reward','ended'].includes(phase);
 const positions=[];
 run.route.forEach((row,d)=>row.forEach((n,i)=>positions.push({...n,x:row.length===1?54:12+i*76/(row.length-1),y:92-d*74/(run.route.length-1)})));
 const choices=positions.filter(n=>routeVisible(run,n)&&canVisit(run,n)&&canChoose);
 const selected=choices.find(n=>n.id===fieldPreviewId)||choices.find(n=>n.id===node?.id)||choices[0]||positions.find(n=>n.id===node?.id)||positions.find(n=>n.depth===run.depth)||positions[0];
 const current=selected?.id;
 const connections=[];
 for(const a of positions)for(const b of positions){
  if(b.depth!==a.depth+1||!(a.children?a.children.includes(b.id):b.type==='boss'||Math.abs(a.lane-b.lane)<=1))continue;
  if(!routeVisible(run,a)||!routeVisible(run,b))continue;
  if((a.depth<run.depth&&!run.path.includes(a.id))||(b.depth<run.depth&&!run.path.includes(b.id)))continue;
  const chosen=run.path.includes(a.id)&&run.path.includes(b.id);
  const next=b.id===current&&run.path.includes(a.id);
  connections.push('<path class="'+(chosen?'walked':next?'next-path':'charted')+'" d="M'+a.x+' '+a.y+' Q'+((a.x+b.x)/2)+' '+((a.y+b.y)/2)+' '+b.x+' '+b.y+'"/>');
 }
 const names={battle:'The Wild Crossing',elite:'The Ancient Watch',capture:'Quiet Grove',shop:'Wayfarer’s Outpost',event:'The Whispering Signal',rest:'Moonlit Clearing',boss:p.bossName};
 const descriptions={battle:'Ancient grounds stir with wild companions. Scout their strengths before the gates open.',elite:'A powerful gathering guards the old paths. Greater danger holds greater rewards.',capture:'A tranquil grove of colossal trees. Seek a new companion where luminous rivers meet.',shop:'A sheltered outpost along the path. Trade, recruit and prepare for the journey ahead.',event:'A strange light calls from beyond the ruins. Your next choice may change the expedition.',rest:'A quiet clearing beneath the stars. Recover, train or replenish your capture supplies.',boss:'The guardian of this world awaits. Prepare your companions for the final encounter.'};
 const type=selected?.type||'battle';
 const elements=Object.entries(syn).sort((a,b)=>b[1]-a[1]),bond=elements[0],element=bond?ELEMENTS[bond[0]]:null;
 const rewards={capture:['capture','team','star'],shop:['gear','gold','team'],rest:['heart','star','capture'],event:['star','gold','help']}[type]||['gold','star','gear'];
 const rewardLabels={gold:'Gold',star:'Experience',gear:'Equipment',capture:'Capture',team:'Companions',heart:'Recovery',help:'Unknown outcomes'};
 let next;
 if(run.complete||phase==='ended')next=button('New expedition '+fieldIcon('arrow'),'new-run');
 else if(phase==='battle')next='<button class="button" data-view="arena">Return to battle '+fieldIcon('arrow')+'</button>';
 else if(phase==='reward')next=button('Gather rewards '+fieldIcon('arrow'),'reward');
 else next='<button class="button field-continue" data-field-enter="'+current+'" '+(!selected?'disabled':'')+'>Continue '+fieldIcon('arrow')+'</button>';
 const steps=run.route.map((row,i)=>'<li class="'+(i<run.depth?'complete':i===run.depth?'current':'future')+'" aria-label="Encounter '+(i+1)+(i<run.depth?' completed':i===run.depth?' current':' ahead')+'"><span>'+fieldIcon(i===run.route.length-1?'boss':i<run.depth?(row.find(n=>run.path.includes(n.id))||row[0]).type:'star')+'</span></li>').join('');
 const worldCopy=['Living canopies, luminous rivers and ancient growth. A world of wonder — and danger.','Molten rivers and obsidian peaks. Follow the embers into a world forged by fire.','A silent world beneath violet stars. Find your path through ruins at the edge of the sky.'][world];
 return '<div class="reference-map" style="--route-art:url('+worldArt(world)+');--biome:'+biome.water+'" data-field-phase="'+phase+'">'+fieldJourney(run,phase,PLANETS)+'<div class="reference-field"><section class="reference-scene" aria-label="'+p.name+' route"><div class="route biome-route"><div class="map-world-copy"><span>'+p.name.toUpperCase()+'</span><h1>'+p.name+'</h1><p>'+worldCopy+'</p></div><div class="map-encounters">'+fieldIcon('star')+'<span><small>ENCOUNTERS</small><strong>'+Math.min(run.depth+1,run.route.length)+' / '+run.route.length+'</strong></span></div><svg class="route-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+connections.join('')+'</svg>'+positions.filter(n=>n.depth>=run.depth||run.path.includes(n.id)).map(n=>{
 const visible=routeVisible(run,n),known=visible||n.type==='boss',available=choices.some(c=>c.id===n.id),visited=run.path.includes(n.id);
 return '<button class="route-node '+(available?'available ':'')+(visited?'visited ':'')+(n.id===current?'selected ':'')+(n.type==='boss'?'boss ':'')+(known?'':'fogged ')+'" data-node="'+n.id+'" data-field-node="'+n.id+'" style="left:'+n.x+'%;top:'+n.y+'%" '+(!available?'disabled':'')+' aria-pressed="'+(n.id===current)+'" aria-label="'+(known?LABELS[n.type]:'Uncharted')+', encounter '+(n.depth+1)+'" title="'+(visible?LABELS[n.type]+(n.type==='elite'?' - '+encounterInfo(run,n).eliteModifier.description:''):'Beyond scouting range')+'">'+fieldIcon(known?n.type:'star')+'<small>'+(known?LABELS[n.type].toUpperCase():'UNCHARTED')+'</small>'+(visible&&n.type==='elite'?'<em class="route-elite-modifier">'+encounterInfo(run,n).eliteModifier.text+'</em>':'')+'</button>';
 }).join('')+'</div></section><section class="encounter-sheet field-surface" aria-label="Selected encounter"><div class="sheet-grip" aria-hidden="true"></div><div class="encounter-sheet-head"><div class="encounter-art" style="background-image:url('+worldArt(world)+')"></div><div class="encounter-copy"><span class="section-kicker">ENCOUNTER '+((selected?.depth||0)+1)+'</span><h2>'+names[type]+'</h2><p>'+descriptions[type]+'</p>'+eliteStageHTML(selected)+'</div><button class="field-scout" data-field-scout="'+current+'" aria-label="Scout selected encounter" title="Scout encounter">'+fieldIcon('arrow')+'</button><span class="encounter-kind">'+fieldIcon(type)+' '+LABELS[type]+'</span></div><div class="sheet-build"><div class="sheet-rewards"><span class="section-kicker">'+(type==='shop'?'OUTPOST SUPPLIES':'POTENTIAL REWARDS')+'</span><div>'+rewards.map((r,i)=>'<span class="reward-glyph reward-glyph-'+i+'" title="'+rewardLabels[r]+'">'+fieldIcon(r)+'<span class="sr-only">'+rewardLabels[r]+'</span></span>').join('')+'<button data-action="pack" class="reward-glyph more" aria-label="Open relic pack">···</button></div></div><button class="sheet-synergy" data-action="formation" aria-label="Inspect team synergy and deployment"><span class="section-kicker">TEAM SYNERGIES</span><div><span class="synergy-glyph" style="color:'+(element?.color||'#acd5c2')+'">'+(element?.icon||'✧')+'</span><span><strong>'+(element?.name||'Your team')+'</strong><small>'+(bond&&bond[1]>=2?'Your companions share an active bond.':'Match elements to awaken a bond.')+'</small><i style="--bond-width:'+Math.min(100,(bond?.[1]||0)*25)+'%"></i></span><b>'+(bond?.[1]||0)+' / 4</b></div></button></div><div class="sheet-bottom"><div class="sheet-journey"><span class="section-kicker">YOUR JOURNEY</span><ol class="field-steps">'+steps+'</ol><small>'+Math.min(run.depth+1,run.route.length)+' / '+run.route.length+' encounters</small></div>'+next+'</div></section></div><div class="map-accessibility-note">Select a glowing encounter, then Continue. Your route is committed when you continue.</div></div>';
}
function collectionHTML() {
  const shown = SPECIES.filter(
    (s) =>
      filter === "all" ||
      (filter === "owned" && profile.owned.includes(s.id)) ||
      s.element === filter,
  );
  return `<div class="collection-banner"><div><h2>Every ending is a new beginning.</h2><p>Captured creatures become permanent starters. Repeat captures grow bonds: +2% starter health per bond. At bond 5, starter cost drops; Legendary families cost 6 points, or 4 at bond 5. Choose up to ${starterSlots(profile)} within ${starterBudget(profile)} points. Start with three points and gain one per cleared Chaos tier. Chaos 3 unlocks a third starting place.</p></div>${button('Build an expedition <span class="arrow">→</span>', "new-run", "secondary")}</div>${eliteCollectionHTML()}<div class="collection-toolbar">${button("Roster & forms", "roster", "secondary small")}${button(`✦ Celestial adoption · ${profile.starlight || 0} starlight`, "legendary-adopt", "secondary small", (profile.starlight || 0) < 3)}<div class="filters">${[{ id: "all", name: "All creatures" }, { id: "owned", name: "Discovered" }, ...Object.entries(ELEMENTS).map(([id, e]) => ({ id, name: e.name }))].map((f) => `<button data-filter="${f.id}" class="${filter === f.id ? "active" : ""}">${f.name}</button>`).join("")}</div><p><strong style="color:#c2d5b0">${profile.owned.length}</strong> / ${SPECIES.length} discovered · ${profile.victories} completed expeditions</p></div><div class="codex-grid">${shown
    .map((s) => {
      const owned = profile.owned.includes(s.id);
      const discoveredForm = {
        id: s.id,
        evolution: profile.formDiscoveries[s.id] || 0,
        evolutionPath: profile.formBranches[s.id]||"wild",
      };
      return `<button class="creature-card codex-card ${owned ? "" : "locked"}" data-codex="${s.id}" style="--element:${ELEMENTS[s.element].color}"><div class="card-top"><span style="color:${owned ? RARITY[s.rarity].color : "#6b7d62"}">${s.rarity.toUpperCase()}</span><span class="role-icon">${owned ? ROLES[s.role] : "◇"}</span></div>${image(discoveredForm, "creature-art")}<strong>${owned ? s.name : "Undiscovered"}</strong><div class="card-meta"><span style="color:${owned ? ELEMENTS[s.element].color : ""}">${ELEMENTS[s.element].icon} ${ELEMENTS[s.element].name}</span><span>${s.role}</span></div><div class="thin-rule" style="margin:13px 0 8px"></div><span style="font-size:8px;color:#8fa280">${owned ? (evolutionStage(discoveredForm) ? "EVOLVED FORM DISCOVERED · BASE STARTER" : `AVAILABLE AS A STARTER · BOND ${profile.bonds[s.id] || 0}/5`) : "ENCOUNTER & CAPTURE TO UNLOCK"}</span></button>`;
    })
    .join("")}</div>`;
}
function placeArenaAction(){
 const action=$(".briefing-battle"),dock=$(".arena-control .arena-dock");if(!action||!dock)return;
 if(matchMedia("(max-width:900px)").matches)dock.before(action);else $(".briefing-actions")?.append(action);
}
function resizeCanvas() {
  placeArenaAction();
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const camera=arenaCamera(rect.width,rect.height);$("#target-preview")?.setAttribute("viewBox",`${camera.x} ${camera.y} ${camera.width} ${camera.height}`);
}
window.addEventListener("resize", resizeCanvas);
let dragIndex = null;
function bindDrag() {
  document.querySelectorAll("[data-creature]").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      if (phase === "battle") {
        e.preventDefault();
        return;
      }
      dragIndex = Number(el.dataset.creature);
      e.dataTransfer.setData("text/plain", String(dragIndex));
    });
    el.addEventListener("dragover", (e) => e.preventDefault());
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      if (phase === "battle" || loadoutDrag || dragIndex === null) return;
      const i = Number(el.dataset.creature);
      [run.team[i], run.team[dragIndex]] = [run.team[dragIndex], run.team[i]];
      dragIndex = null;
      save();
      render();
      toast(
        "Formation updated. Roles determine frontline and backline placement.",
      );
    });
  });
}
function modal(html, kind = "generic", closable = true) {
  const previousKind=modalKind,previousScroll=$(".modal")?.scrollTop||0,backdropScroll=$(".modal-backdrop")?.scrollTop||0,pageScroll={top:scrollY,left:scrollX};
  const starterScroll=kind==='starters'&&previousKind===kind?['.companion-scroll','.challenge-scroll','.chaos-rules ol'].map(selector=>[selector,$(selector)?.scrollTop||0]):[];
  const starterFocus=kind==='starters'&&previousKind===kind?document.activeElement:null;
  const focusSelector=starterFocus?.dataset.starter?`[data-starter="${starterFocus.dataset.starter}"]`:starterFocus?.dataset.difficulty?`[data-difficulty="${starterFocus.dataset.difficulty}"]`:starterFocus?.dataset.eliteStarter?`[data-elite-starter="${starterFocus.dataset.eliteStarter}"]`:starterFocus?.id==='chaos-tier'||starterFocus?.dataset.starterFilter||starterFocus?.dataset.starterSort?'#'+starterFocus.id:null;
  const notesOpen=!!$('.team-field-notes')?.open;
  closable=true;modalKind = kind;
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop ${kind==='starters'?'team-select-backdrop':''}" data-dismissible="${closable}"><section class="modal ${kind==='starters'?'team-select':''}" role="dialog" aria-modal="true" aria-label="${kind==='starters'?'Choose your expedition team':kind}">${closable ? '<button class="modal-close" data-action="close" aria-label="Close dialog">×</button>' : ""}${html}</section></div>`;
  $(".modal").dataset.kind=kind;
  $(".modal-backdrop").dataset.kind=kind;
  $(".modal").classList.toggle("reward-screen",kind==="reward");
  decorateFieldUI($("#modal-root"));decorateUploadedArt($("#modal-root"));decorateAmbientBackgrounds($("#modal-root"));
  decorateAilments($("#modal-root"));prepareLoadoutDragging();prepareDetailTabs();
  const first = (focusSelector&&$(focusSelector))||$("#modal-root button:not(:disabled)");
  if(previousKind===kind){$(".modal").scrollTop=previousScroll;$(".modal-backdrop").scrollTop=backdropScroll;}
  for(const [selector,top]of starterScroll)if($(selector))$(selector).scrollTop=top;
  if(kind==='starters'&&notesOpen)$('.team-field-notes').open=true;
  window.scrollTo({...pageScroll,behavior:"instant"});setTimeout(() => first?.isConnected&&first.focus({preventScroll:true}), 30);
}
function closeModal() {
  if(modalKind==='settings'&&settingsPrevious){const previous=settingsPrevious;settingsPrevious=null;paused=previous.paused;modalKind=previous.kind;$('#modal-root').innerHTML=previous.html;if($('.modal'))$('.modal').scrollTop=previous.scroll;if($('.modal-backdrop'))$('.modal-backdrop').scrollTop=previous.backdropScroll;prepareLoadoutDragging();prepareDetailTabs();return;}
  practice=null;
  modalKind = null;
  $("#modal-root").innerHTML = "";
}
function openCreature(i) {
  if(selectedCreature!==i)detailTab="overview";
  selectedCreature = i;
  const u = run.team[i];
  if (!u) {
    openReserves();
    return;
  }
  openDetail(phase==='battle'?battle?.units.find(c=>c.uid===u.uid)||u:u, i);
}
function discoverForm(c) {
  profile.formBranches??={};if(evolutionStage(c)>=(profile.formDiscoveries?.[c.id]||0)&&c.evolutionPath)profile.formBranches[c.id]=c.evolutionPath;
  profile.formDiscoveries ||= {};
  profile.formDiscoveries[c.id] = Math.max(
    profile.formDiscoveries[c.id] || 0,
    evolutionStage(c),
  );
}
function evolutionHTML(u,index){
 const stage=evolutionStage(u),limit=lineageLimit(u),offer=evolutionOffer(run,u),goal=lineageProgress(u);
 const forms=Array.from({length:limit+1},(_,level)=>{const form={...u,evolution:level,evolutionPath:u.evolutionPath||"wild"};return `<div class="evolution-form ${stage===level?'current':''}">${image(form)}<strong>${creatureName(form)}</strong><small>${level===0?'BASE FORM':level===1?'EVOLVED':'ASCENDANT'}</small></div>`;}).join('<span class="evolution-arrow">→</span>');
 const progress=goal&&stage<limit?`<p class="lineage-progress">Combat route: ${goal.value} / ${goal.target} ${goal.label} · minimum level ${goal.minimumLevel}. Alternatively reach level ${stage?8:5}. Both routes cost ${stage?100:50} gold.</p>`:'';
 const controls=stage>=limit?`<p class="evolution-status">${limit===0?'Born in its final form · no evolution':'Final form reached · personal relics preserved'}</p>`:index===null?'<p>Deploy this family to gain EXP or complete its combat accomplishment. Every transformation adds a cooldown skill, equipment slot, and support socket.</p>':`<div class="evolution-choices">${(stage?[u.evolutionPath]:['wild','warden']).map(path=>`<button class="evolution-choice ${path}" data-evolve="${path}" data-index="${index}" ${!offer.ready||phase==='battle'?'disabled':''}><span>${path==='wild'?'⌁':'◈'}</span><strong>${stage?'Ascend ':''}${NATIVE_EVOLUTIONS[u.id]?.[path]?.name||EVOLUTION_PATHS[path].name}</strong><small>${evolutionMechanic(u,BY_ID[u.id].role,path)}<br>+1 cooldown skill · +1 equipment slot · +1 support socket · ${offer.cost} gold</small></button>`).join('')}</div><p>${phase==='battle'?'Transform between battles.':offer.ready?'Choose your family transformation. Your gems remain linked.':offer.reason+'.'}</p>`;
 return `<section class="evolution-panel"><div class="section-heading"><h3>FAMILY LINEAGE</h3><span>${limit+1} TOTAL FORM${limit?'S':''}</span></div><div class="evolution-line">${forms}</div>${progress}${controls}</section>`;
}
function transformCreature(index, path) {
  if (phase === "battle" || !run.team[index]) return;
  const before = { ...run.team[index] },
    result = evolveCreature(run, index, path);
  if (!result.success) {
    toast(result.reason);
    return;
  }
  const u = run.team[index];
  selectedCreature = index;
  discoverForm(u);
  save();
  render();
  sound("capture");
  const sparks = Array.from(
    { length: 12 },
    (_, i) =>
      '<i class="evolution-spark" style="--angle:' +
      i * 30 +
      "deg;--delay:" +
      i * 0.04 +
      's"></i>',
  ).join("");
  modal(
    '<div class="evolution-reveal ' +
      path +
      '"><span class="section-kicker">' +
      (result.stage === 2 ? "ASCENSION" : "EVOLUTION") +
      " · " +
      EVOLUTION_PATHS[path].name.toUpperCase() +
      ' PATH</span><div class="evolution-cinematic"><div class="evolution-orbit"></div>' +
      image(before, "evolution-before") +
      image(u, "evolution-after") +
      sparks +
      "</div><h2>" +
      creatureName(u) +
      '<span>.</span></h2><p>A new silhouette, an exclusive cooldown skill, and a new equipment slot. Choose your evolution gear in the companion panel.</p><div class="tags">' +
      tag(EVOLUTION_PATHS[path].name + " path") +
      tag(relicSlots(u) + " relic sockets") +
      tag(SKILLS[evolutionSkillIds(u).at(-1)].name) + tag(equipmentSlots(u)+" equipment slots") +
      '</div><div class="modal-actions">' +
      button("Inspect evolved companion →", "evolution-back") +
      "</div></div>",
    "evolution",
  );
}
function openDetail(u, index = null, codex = false) {
  const s = BY_ID[u.id],
    e = ELEMENTS[s.element],
    st = stats(
      u,
      index === null ? [u] : run.team,
      index === null ? [] : run.relics,
    ),
    locked = codex && !profile.owned.includes(u.id);
  modal(
    `<div class="detail-top">${image(u)}<div><span class="section-kicker" style="color:${RARITY[s.rarity].color}">${s.rarity.toUpperCase()} CREATURE</span><h2>${creatureName(u)}</h2><p style="margin:0">${s.role} · ${e.name} · Level ${u.level}</p><div class="tags">${tag(`${ROLES[s.role]} ${s.role}`)}${tag(`${e.icon} ${e.name}`)}</div></div></div>${detailTabsHTML(index)}<div class="detail-pane" data-detail-pane="overview"><div class="stat-grid"><div class="stat"><small>HEALTH</small><strong>${st.hp}</strong></div><div class="stat"><small>ATTACK</small><strong>${st.atk}</strong></div><div class="stat"><small>BASIC ATTACK SPEED</small><strong>${st.attackSpeed.toFixed(2)}/s</strong></div><div class="stat"><small>ACTION SPEED</small><strong>${st.actionSpeed.toFixed(2)}×</strong></div><div class="stat"><small>HP REGEN</small><strong>${st.hpRegen.toFixed(1)}/s</strong></div><div class="stat"><small>STAMINA RECHARGE</small><strong>${st.staminaRecharge.toFixed(1)}/s</strong></div><div class="stat"><small>DODGE / DASH</small><strong>${st.dodgeStyle} · ${Math.round(st.dashCooldown*100)}% CD</strong></div><div class="stat"><small>MOVEMENT</small><strong>${Math.round(st.speed)}</strong></div><div class="stat"><small>SKILL COOLDOWN</small><strong>${st.cd.toFixed(1)}s</strong></div></div>${armorHTML(st,s)}${eliteBadgeHTML(u)}${ailmentMenuHTML(u)}${individualHTML(u)}${enemyCuriosHTML(u)}<div class="trait-panel"><strong>${traitFor(u).name}</strong><p>${traitFor(u).desc}</p></div>${familyInfo(u)}${evolutionHTML(u, index)}</div><div class="detail-pane" data-detail-pane="equipment">${equipmentHTML(u,index)}${loadoutHTML(u, index)}</div><div class="detail-pane" data-detail-pane="skills">${skillsHTML(u, index)}<p>Drag cooldown skills into a different order to change which ready skill the AI considers first.</p></div><div class="detail-pane" data-detail-pane="ai">${index !== null ? policyHTML(u, index) + survivalHTML(u, index) : ""}${index !== null ? `<div class="focus-control"><span class="section-kicker">TRAINING FOCUS · CHOOSE BEFORE BATTLE</span><div class="segmented">${["balanced", "aggressive", "defensive", "swift"].map((f) => `<button data-focus="${f}" data-index="${index}" class="${u.focus === f ? "active" : ""}" ${phase === "battle" ? "disabled" : ""}>${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join("")}</div><p style="font-size:10px;margin:9px 0 0">${{ balanced: "Natural strengths. No stat tradeoffs.", aggressive: "+15% attack · −8% health.", defensive: "+15% health · −8% attack.", swift: "15% faster skills · −6% attack." }[u.focus || "balanced"]}</p></div><div class="thin-rule"></div><span class="section-kicker">SWAP WITH A COMPANION ON YOUR BENCH</span><div class="bench-list">${run.bench.length ? run.bench.map((b, j) => `<button class="bench-button" data-swap="${j}" data-index="${index}" ${phase === "battle" ? "disabled" : ""}>${image(b)}${creatureName(b)}<br><span class="muted">Lv. ${b.level}</span></button>`).join("") : '<div class="empty-bench">Capture a creature or recruit one at an outpost to fill your bench.</div>'}</div><p class="starter-note">${u.level >= 5 && !evolutionStage(u) && lineageLimit(u)>0 ? "EVOLUTION AVAILABLE · INSPECT YOUR EVOLUTION PATH ABOVE · " : ""}${u.level >= 5 ? "AWAKENED · THIRD SKILL UNLOCKED · " : ""}${u.bond ? `BOND ${u.bond} · +${u.bond * 2}% BASE HEALTH · ` : ""}${u.xp} / ${xpNeeded(u.level)} EXP toward the next level · ${u.training || 0} training upgrades</p>` : locked ? '<p class="disabled-note">Find this creature in the wild and capture it to unlock it as a future starter.</p>' : `<p style="font-size:11px">${e.description}. Rare companions have stronger base stats and specialized skills.</p>`}</div>${button("Back to expedition", "close", "secondary")}`,
    "creature",
  );
}
function startBattle() {
  if (!run.team.length) {
    toast("Deploy a reserve companion before entering battle.");
    openReserves();
    return;
  }
  if (
    phase !== "prep" ||
    !["battle", "elite", "boss", "capture"].includes(node.type)
  )
    return;
  if(deployment.held)deployment.release();
  if (!committed) {
    enterNode(run, node);
    committed = true;
  }
  if (run.captureOrder) {
    const target = foes.find((f) => f.uid === run.captureOrder.uid && !f.boss);
    if (
      !target ||
      (!run.captureReservation && run.orbs < 1)
    ) {
      toast("Capture requires a wild target and an available capturer.");
      return;
    }
    if (!run.captureReservation) {
      if(!consumeCapturer(run,run.captureOrder.tool||"scout")){toast("Buy or select an available capturer.");return;}
      run.captureReservation = {
        tool:run.captureOrder.tool||"scout",
        uid: target.uid,
        seed: node.seed,
        result: null,
      };
    }
  }
  if (node.type === "capture" && run.legendaryLure) run.legendaryLure = false;
  if (!run.defeatReservation) {
    run.battleSerial++;
    run.defeatReservation = {
      key: `${node.id}:${run.battleSerial}`,
      seed: node.seed + run.battleSerial * 9973,
    };
  }
  battle = new Battle(run, foes, node.seed);
  battle.reducedMotion = profile.reducedMotion;
  soundscape.begin(run.planet, profile.sound);
  save();
  phase = "battle";
  liveRosterSide=0;liveSelectedUid=null;
  paused = false;
  reward = null;
  captureTarget = null;
  captureAttempted = false;
  upgradeChosen = null;
  save();
  render();
  if(matchMedia('(min-width:901px)').matches)window.scrollTo({top:0,behavior:'instant'});else $('.expedition-relic-bar')?.scrollIntoView({block:'start',behavior:'instant'});
  sound("start");
}
function finishBattle() {
  const won = battle.winner === 0;
  recapMetric="damage";recapSide=0;
  lastReport = {
    time: battle.time,
    done: battle.done,
    winner: battle.winner,
    metrics: { ...battle.metrics },
    log: [...battle.log],
    killLedger: [...battle.killLedger],
    advice: battle.reportAdvice(),
    units: battle.units.map((u) => ({
      id: u.id,
      uid: u.uid,
      level: u.level,
      evolution: u.evolution,
      evolutionPath: u.evolutionPath,
      side: u.side,
      damage: u.damage,
      healed: u.healed,
      kills: u.kills,
      damageTaken: u.damageTaken,
      shieldAbsorbed: u.shieldAbsorbed,
      damageMitigated: u.damageMitigated||0,
      maxHp:u.maxHp,atk:u.atk,armor:u.armor,speed:u.speed,cdFactor:u.cdFactor,
    })),
  };
  reward = {
    ...rewardBattle(run, node.type, won, battle),
    won,
    damage: Math.round(
      battle.units
        .filter((u) => u.side === 0)
        .reduce((sum, u) => sum + u.damage, 0),
    ),
    time: battle.time,
    personalRelic: pick(PERSONAL_RELICS, rng(node.seed + 888)).id,
  };
  lastReport.growth=reward.growth||[];
  captureTarget=null;
  settleTacticalCapture();
  if (run.captureReservation) {
    captureAttempted = !!run.captureReservation.result;
    captureTarget =
      foes.find((f) => f.uid === run.captureReservation.uid) || captureTarget;
    reward.captureSuccess = !!run.captureReservation.result?.success;
    reward.tacticalCapture = run.captureReservation.result;
  }
  reward.captureOptions = [];
  if(won)reward.loot=makeLoot(run,node.type,battle.units.filter(u=>u.side===1),node.seed);
  if (!won)
    reward.casualty = settleDefeat(
      run,
      run.defeatReservation.key,
      run.defeatReservation.seed,
    );

  settleCaptureRecruitment(run,reward.tacticalCapture);

  if (run.relics.includes("salvage") && node.type === "elite" && won)
    run.inventory.push(personalRelic(reward.personalRelic));
  run.contracts = [];
  phase = "reward";
  profile.best = Math.max(profile.best, run.wins);
  save();
  render();
  sound(won ? "win" : "loss");
  if(!won&&reward.casualty?.lost){defeatFilm={elapsed:0,outcome:reward.casualty};}else victoryFilm={elapsed:0};
}
function casualtyHTML(outcome) {
  if (!outcome?.id) return "";
  if(progressive(run))return `<section class="casualty-result lost"><span class="section-kicker">PERMANENT RUN LOSS · SAVED</span><div>${image(outcome.id)}<div><strong>✕ ${outcome.name} has fallen.</strong><p>Removed for the rest of this run. Worn equipment is destroyed. Expedition relics are kept; bound curios and socketed gems return to your pack. The family stays permanently unlocked.</p></div></div>${run.bench.length?button("Deploy a reserve →","reserves","secondary"):""}</section>`;
  return `<section class="casualty-result ${outcome.lost ? "lost" : "rescued"}"><span class="section-kicker">RETREAT CASUALTY · RESULT SAVED</span><div>${image(outcome.id)}<div><strong>${outcome.lost ? outcome.name + " has fallen." : outcome.name + " was rescued."}</strong><p>${outcome.rarity} · ${Math.round(outcome.risk * 1000) / 10}% death chance if selected. ${outcome.lost ? "Lost permanently from this expedition. Socketed gems were recovered into your pack. The family remains unlocked for future runs." : "Field care and survival drills lower this risk. Your companion remains on the team."}</p></div></div>${outcome.lost && run.bench.length ? button("Deploy a reserve companion →", "reserves", "secondary") : ""}</section>`;
}
function survivalHTML(c, index) {
  if(progressive(run))return `<section class="survival-panel"><strong>Defeat is permanent.</strong><p>A deployed starter is selected at random; when no starter remains, another deployed companion is selected. Its worn equipment disappears. Expedition relics are kept, and personal relics return to your pack. Rarity improves its combat tools, not this death roll.</p></section>`;
  const level = c.survivalTraining || 0,
    cost = shopPrice(run, 30 + level * 30);
  return `<section class="survival-panel"><span class="section-kicker">SURVIVAL · ${BY_ID[c.id].rarity.toUpperCase()}</span><strong>${Math.round(casualtyRisk(run, c) * 1000) / 10}% death chance if selected on defeat</strong><p>One random active ally faces a rescue roll after a lost battle. Rarer creatures are safer. Evolution lowers the risk 15%. Field hospital ${run.fieldHospital || 0} / 3 · drills ${level} / 2.</p>${button(level >= 2 ? "✓ Survival drills mastered" : `Survival drill · ◉ ${cost}`, `survival-${index}`, "secondary small", phase === "battle" || level >= 2 || run.gold < cost)}<small>Each drill lowers this companion’s remaining risk by 25% for the run.</small></section>`;
}
function openFieldCare() {
  if(progressive(run)){modal(`<h2>Protect the expedition.</h2><p>Defeat always kills one deployed companion and destroys its worn equipment. Expedition and personal relics are kept. Recruit reserves, improve your build, and scout dangerous rooms. Capture families remain permanently unlocked.</p>${button("Return","close","secondary")}`,"care");return;}
  const offer = hospitalOffer(run);
  modal(
    `<span class="section-kicker">FIELD HOSPITAL · ${offer.level} / 3</span><h2>Bring them home.</h2><p>After defeat, one random deployed ally faces a rescue roll. A failed roll permanently removes that individual from this expedition. Its family remains in your menagerie and its gems return to your pack. Rarer companions have better survival odds.</p><div class="casualty-rarities">${Object.entries(
      CASUALTY_RISK,
    )
      .map(
        ([rarity, risk]) =>
          `<span style="color:${RARITY[rarity].color}">${rarity}<b>${Math.round(risk * 100)}%</b></span>`,
      )
      .join(
        "",
      )}</div><p>These are base death chances <strong>when selected</strong>. Each hospital tier reduces everyone’s remaining risk by 30%; each personal drill reduces its wearer’s by 25%. Evolution reduces it another 15%. These protections stack.</p>${button(offer.level >= 3 ? "✓ Field hospital complete" : `Upgrade field hospital · ◉ ${offer.cost}`, "hospital-upgrade", "", phase === "battle" || !offer.ready)}<div class="care-roster">${run.team.map((c, i) => `<div>${image(c)}<strong>${creatureName(c)}</strong><span>${Math.round(casualtyRisk(run, c) * 1000) / 10}% risk</span>${button("Inspect & train", `care-creature-${i}`, "secondary small")}</div>`).join("")}</div>${run.fallen?.length ? `<span class="section-kicker">FALLEN THIS EXPEDITION · ${run.fallen.length}</span><p>${run.fallen.map((c) => c.name + " · Lv. " + c.level).join(" / ")}</p>` : ""}<div class="modal-actions">${button("Return to expedition", "close", "secondary")}</div>`,
    "care",
  );
}
function openReserves() {
  modal(
    `<span class="section-kicker">RESERVE COMPANIONS · ${run.team.length} / ${capacity(run)} DEPLOYED</span><h2>Fill the empty places.</h2><p>Casualties leave real vacancies. A reserve keeps its level, evolution, training, and relics when deployed.</p><div class="starter-grid">${run.bench.map((c, i) => `<button class="starter-card" data-deploy-reserve="${i}" ${phase === "battle" || run.team.length >= capacity(run) ? "disabled" : ""}>${image(c)}<strong>${creatureName(c)}</strong><small>Lv. ${c.level} · ${BY_ID[c.id].rarity}<br>Deploy into an empty place →</small></button>`).join("") || "<p>No reserves yet. Capture a wild creature or recruit at an outpost. Unlocked places can be filled gradually, up to six companions.</p>"}</div><div class="modal-actions">${button("Return to expedition", "close", "secondary")}</div>`,
    "reserves",
  );
}

function rewardOptions(){
 if(reward.relicChoices?.length)return reward.relicChoices.map(id=>{const r=RELICS.find(r=>r.id===id);return {id:'relic:'+id,name:r.name,icon:r.icon,desc:relicDescription(r)};});
 const random=rng(node.seed+run.wins*91);
 if(reward.openingBoons??(run.native&&run.wins===1))return shuffled(OPENING_BOONS,random).slice(0,2).map(id=>{const r=RELICS.find(r=>r.id===id);return {id:'boon:'+id,name:r.name,icon:r.icon,desc:relicDescription(r)};});
 const options=[{id:'training',icon:'✧',name:'Focused practice',desc:'Every deployed companion gains one training rank: +3.5% base growth.'},{id:'gear',icon:'◈',name:reward.equipmentReward?GEAR_BY_ID[reward.equipmentReward].name:PERSONAL_BY_ID[reward.personalRelic||'quick-shard'].name,desc:reward.equipmentReward?equipmentDescription(GEAR_BY_ID[reward.equipmentReward]):'One personal relic for this creature’s whole build.'},{id:'orbs',icon:'◇',name:'Another chance',desc:'Gain one Scout Prism. Lower health improves capture odds, with real knockout risk.'},{id:'gold',icon:'◉',name:'Save for a build',desc:'Gain 25 gold toward a costly relic or recruitment.'}];
 return shuffled(options,random).slice(0,2);
}
function captureOutcomeHTML(){const result=reward?.tacticalCapture||run.captureReservation?.result;return result?`<div class="capture-outcome ${result.success?'success':'failed'}" role="status">${artImage(result.success?'treasure-11':'treasure-10','capture-result-icon')}<strong>${result.success?'✧ CAPTURE SUCCESSFUL':'✕ CAPTURE FAILED'}</strong><p>${result.success?`${BY_ID[result.creature.id].name} fought for you this round and ${result.recruitment?.destination==='team'?'joined an open team slot':'joined your reserves'}. Its family is also unlocked as a future starter.${eliteModifier(result.creature)?" This individual and its elite mutation are saved for future expeditions.":""}`:result.reason||'The lattice broke. The selected capturer was spent.'}</p></div>`:'';}
function openRewards(){
 if(!reward)return;
 const won=reward.won,options=rewardOptions();
 const revealKey=`${run.seed}:${run.battleSerial}:${node.seed}`,reveal=rewardShownKey!==revealKey;rewardShownKey=revealKey;
 const upgrades=`<div class="upgrade-grid">${options.map(u=>`<button class="upgrade-card ${upgradeChosen===u.id?'selected':''}" data-upgrade="${u.id}" aria-pressed="${upgradeChosen===u.id}" ${upgradeChosen?'disabled':''}>${artImage(u.id==='gear'?gearArt(reward.equipmentReward):u.id==='orbs'?'capture-scout-idle':u.id==='gold'?'treasure-01':u.id.startsWith('relic:')||u.id.startsWith('boon:')?relicArt(u.id.split(':')[1]):'rich-03','upgrade-symbol')}<span><strong>${upgradeChosen===u.id?'\u2713 ':''}${u.name}</strong><p>${u.desc}</p></span></button>`).join('')}</div>`;
 const growth=growthHTML(lastReport||{growth:reward.growth},{image:c=>image(c),name:creatureName})||`<div class="rewards-team">${run.team.map(c=>`<div>${image(c)}<span><strong>${creatureName(c)}</strong><small>Lv. ${c.level} \u00b7 ${c.xp} / ${xpNeeded(c.level)} EXP</small></span></div>`).join('')}</div>`;
 const next=button(won?'Continue the journey \u2192':run.integrity<=0?'End expedition \u2192':node.type==='boss'?'Challenge the guardian again \u2192':'Choose the next path \u2192','continue','',won&&(!upgradeChosen||reward.loot&&!reward.loot.claimed));
 modal(rewardsShell({won,reveal,gold:reward.gold,xp:reward.xp,time:reward.time,claimed:!!reward.loot?.claimed,loot:lootHTML(),upgrades,growth,capture:captureOutcomeHTML()||`<div class="capture-outcome neutral">${artImage('icon-capture')}<div><strong>No capture planned</strong><p>Select a wild target before your next battle.</p></div></div>`,casualty:casualtyHTML(reward.casualty),report:lastReport,continueButton:next,collectionButton:won&&reward.loot?button(reward.loot.claimed?'Spoils collected':artImage('rich-11')+'Collect all spoils','claim-loot','',reward.loot.claimed):'',slots:reward.slotsAdded?`<p class="result-levels">NEW TEAM PLACE \u00b7 ${capacity(run)} available. Deploy a companion from Reserves.</p>`:''}),'reward');
 animateRewardReveal(document.querySelector('.rewards-layout'),{gold:reward.gold,reducedMotion:profile.reducedMotion});
}

function chooseUpgrade(id) {
  if (upgradeChosen || phase !== "reward" || !reward.won) return;
  if(!rewardOptions().some(option=>option.id===id))return;
  if(id.startsWith('relic:')){const relic=id.slice(6);if(!reward.relicChoices?.includes(relic)||run.relics.includes(relic))return;run.relics.push(relic);upgradeChosen=id;save();render();openRewards();return;}
  if(id.startsWith("boon:")){if(!(reward.openingBoons??(run.native&&run.wins===1))||!chooseOpeningBoon(run,id.slice(5)))return;}
  else if(reward.openingBoons??(run.native&&run.wins===1))return;
  if (id === "training")
    run.team.forEach((c) => (c.training = (c.training || 0) + 1));
  if (id === "gear"){
    if(reward.equipmentReward)run.gearInventory.push({uid:`reward:${run.seed}:${node.seed}:${run.wins}`,id:reward.equipmentReward});
    else run.inventory.push(personalRelic(reward.personalRelic || "quick-shard"));
  }
  if (id === "orbs") addCapturer(run,"scout",1);
  if (id === "gold") run.gold += 25;
  upgradeChosen = id;
  save();
  updateHeader();
  openRewards();
}
function continueRun() {
  if(reward?.loot&&!reward.loot.claimed){toast("Claim your victory cache first.");return;}
  if (phase !== "reward" || (reward.won && (!upgradeChosen||reward.loot&&!reward.loot.claimed))) return;
  closeModal();
  run.defeatReservation = null;
  if (run.integrity <= 0 || (!run.team.length && !run.bench.length)) {
    endRun(false);
    return;
  }
  if (!reward.won && node.type === "boss") {
    run.captureOrder = null;
    run.captureReservation = null;
    phase = "prep";
    battle = null;
    reward = null;
    captureTarget = null;
    viewName = "arena";
    save();
    render();
    toast(
      "The guardian still stands. Adjust your team and challenge it again.",
    );
    return;
  }
  run.captureOrder = null;
  run.captureReservation = null;
  const oldPlanet = run.planet;
  nextNode(run);
  if (run.complete) {
    endRun(true);
    return;
  }
  run.route = run.route || generateRoute(run);
  phase = "map";
  committed = false;
  node = null;
  foes = [];
  battle = null;
  reward = null;
  captureTarget = null;
  shopStock = null;
  viewName = "map";
  save();
  render();
  if (oldPlanet !== run.planet)
    toast(
      `Welcome to ${PLANETS[run.planet].name}. The journey grows more dangerous.`,
    );
}
let stageTransitionBusy=false;
async function chooseNode(id) {
  if(stageTransitionBusy)return;
  if (
    phase === "battle" ||
    phase === "reward" ||
    phase === "ended" ||
    run.complete
  )
    return;
  const n = run.route.flat().find((n) => n.id === id);
  if (!n || !canVisit(run, n)) return;
  if (committed && node?.id !== id) {
    toast("Finish your current encounter before choosing another path.");
    return;
  }
  if(['battle','elite','boss','capture'].includes(n.type)&&!profile.reducedMotion){
    stageTransitionBusy=true;
    await stageZoom(n.id);stageTransitionBusy=false;
  }
  node = n;
  run.captureOrder = null;
  run.captureReservation = null;
  run.encounterType = n.type;
  committed = false;
  if (["battle", "elite", "boss", "capture"].includes(n.type)) {
    phase = "prep";
    foes = encounter(run, n.type, n.seed);
    viewName = 'arena';save();render();
    if(!profile.reducedMotion)$('.arena-viewport')?.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:440,easing:'ease-out'});
  } else {
    enterNode(run, n);
    committed = true;
    foes = [];
    viewName = "map";
    phase = n.type;
    save();
    render();
    if (n.type === "shop") openShop();
    if (n.type === "event") {
      eventIndex = n.event ?? Math.floor(rng(n.seed)() * EVENTS.length);
      save();
      openEvent();
    }
    if (n.type === "rest") openRest();
  }
}
async function stageZoom(id){
  const el=document.querySelector(`[data-node="${id}"]`),scene=el?.closest('.field-journey')||el?.parentElement;
  if(!scene)return;
  const r=el.getBoundingClientRect(),s=scene.getBoundingClientRect();
  const animation=scene.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.9)',opacity:0}],{duration:520,easing:'cubic-bezier(.4,0,.2,1)'});
  scene.style.transformOrigin=`${r.left-s.left+r.width/2}px ${r.top-s.top+r.height/2}px`;
  await animation.finished.catch(()=>{});scene.style.transformOrigin='';
}
function leaveNode() {
  closeModal();
  nextNode(run);
  phase = "map";
  node = null;
  committed = false;
  shopStock = null;
  save();
  render();
}
function stockShop() {
  return generateShop(run, node.seed);
}
function openShop() {
  shopStock = shopStock || stockShop();
  save();
  const stock = shopStock;
  stock.recruits??=generateShop(run,node.seed).recruits;
  stock.gear ??= ["sunsteel-edge","mooncloth-mantle"];
  stock.personal ??= ["ward-stone", "moonstone", "echo-prism"];
  stock.legendary ??= pick(
    SPECIES.filter((s) => s.rarity === "Legendary"),
    rng(node.seed + 321),
  ).id;
  modal(
    `<div class="modal-head-row"><span class="section-kicker">THE WAYFARER’S OUTPOST</span><span class="modal-currency">◉ ${run.gold}</span></div><h2>A little edge goes a long way.</h2><p>Relics reshape your whole team. Companions reshape your possibilities.</p><div class="shop-grid">${stock.relics.slice(0,2)
      .map((id) => {
        const r = RELICS.find((r) => r.id === id),
          sold = run.relics.includes(id);
        return `<div class="shop-card ${sold ? "sold" : ""}"><span class="shop-icon" style="color:${r.color}">${r.icon}</span><h3>${r.name}</h3><p>${relicDescription(r)}</p>${button(sold ? "✓ Equipped" : `◉ ${shopPrice(run, r.cost)}`, `buy-${id}`, "secondary small", sold || run.gold < shopPrice(run, r.cost))}</div>`;
      })
      .join(
        "",
      )}</div><div class="thin-rule"></div><span class="section-kicker">PERSONAL RELICS · WHOLE-CREATURE BUILDS</span><div class="shop-personal-grid">${stock.personal
      .map((id) => {
        const r = PERSONAL_BY_ID[id],
          sold = stock.sold.includes(id);
        return `<div class="shop-personal"><span style="color:${r.color}">${r.icon}</span><strong>${r.name}</strong><p>${relicDescription(r)}</p>${button(sold ? "✓ In your pack" : `◉ ${shopPrice(run, r.cost)}`, `buy-personal-${id}`, "secondary small", sold || run.gold < shopPrice(run, r.cost))}</div>`;
      })
      .join(
        "",
      )}</div>${gearShopHTML(stock)}${newShopHTML(stock)}<div class="shop-supplies"><span>◈ <strong>Capture supplies</strong><br><span class="muted" style="font-size:9px">One orb. One more possibility.</span></span>${button(`◉ ${shopPrice(run, 35)} · +1 orb`, "buy-orb", "secondary small", run.gold < shopPrice(run, 35))}</div><div class="shop-supplies"><div class="shop-companion" style="display:flex;align-items:center;gap:10px">${image(stock.creature)}<span><strong>${BY_ID[stock.creature].name}</strong><br><span style="font-size:9px;color:${RARITY[BY_ID[stock.creature].rarity].color}">${BY_ID[stock.creature].rarity} · ${BY_ID[stock.creature].role}</span></span></div>${button(stock.sold.includes("creature") ? "✓ Recruited" : `◉ ${shopPrice(run, RARITY[BY_ID[stock.creature].rarity].cost)} · Recruit`, "buy-creature", "secondary small", stock.sold.includes("creature") || run.gold < shopPrice(run, RARITY[BY_ID[stock.creature].rarity].cost) || run.bench.length >= 12)}</div><div class="field-care-shop"><strong>Keep your companions alive.</strong><p>Defeat permanently kills a deployed companion and destroys its worn equipment; relics are retained. Keep a reserve and choose threats carefully.</p>${button(`Defeat rules`, "field-care", "secondary")}</div><div class="legendary-outpost"><span class="section-kicker">CELESTIAL CONTRACTS</span><div class="shop-supplies">${image(stock.legendary)}<span><strong>${BY_ID[stock.legendary].name}</strong><small>Legendary · recruit and permanently unlock</small></span>${button(stock.sold.includes("legendary") ? "✓ Recruited" : `◉ ${shopPrice(run, 290)} · Recruit`, "buy-legendary", "secondary small", stock.sold.includes("legendary") || run.gold < shopPrice(run, 290) || run.bench.length >= 12)}</div><p>Signal a Legendary at your next sanctuary. Prepare a tactical capture to improve its odds.</p>${button(run.legendaryLure ? "✓ Beacon ready" : `◉ ${shopPrice(run, 90)} · Celestial beacon`, "buy-beacon", "secondary", run.legendaryLure || run.gold < shopPrice(run, 90))}</div><div class="modal-actions">${button(`Refresh relics · ◉ ${shopPrice(run, 20 + stock.rerolls * 15)}`, "reroll", "ghost", run.gold < shopPrice(run, 20 + stock.rerolls * 15))}${button("Leave outpost →", "leave-node")}</div>`,
    "shop",
    false,
  );
}
function purchase(action) {
  if (phase !== "shop") return;
  let success = false;
  if(action.startsWith("buy-capturer-")){success=buyCapturer(run,action.slice(13),shopPrice(run,CAPTURERS[action.slice(13)]?.cost));}
  else if(action==="buy-permit")success=buyPermit(run);
  else if(action.startsWith("buy-recruit-")){const c=shopStock.recruits?.[+action.slice(12)];success=buyRecruit(run,c);if(success)unlock(c.id);}
  else if(action.startsWith("buy-gear-")){const id=action.slice(9);if(shopStock.gear?.includes(id)&&!shopStock.sold.includes("gear:"+id)){success=buyGear(run,id,node.seed,shopPrice(run,GEAR_BY_ID[id].cost));if(success)shopStock.sold.push("gear:"+id);}}
  else if (action.startsWith("buy-personal-")) {
    const id = action.slice(13),
      r = PERSONAL_BY_ID[id];
    if (
      r &&
      shopStock.personal.includes(id) &&
      !shopStock.sold.includes(id) &&
      run.gold >= shopPrice(run, r.cost)
    ) {
      run.gold -= shopPrice(run, r.cost);
      run.inventory.push(personalRelic(id));
      shopStock.sold.push(id);
      success = true;
    }
  } else if (action === "buy-beacon") {
    success = buyLegendaryLure(run);
  } else if (
    action === "buy-legendary" &&
    !shopStock.sold.includes("legendary")
  ) {
    success = buyCreature(run, shopStock.legendary);
    if (success) {
      shopStock.sold.push("legendary");
      unlock(shopStock.legendary);
    }
  } else if (action === "buy-orb" && run.gold >= shopPrice(run, 35)) {
    run.gold -= shopPrice(run, 35);
    addCapturer(run,"scout");
    success = true;
  } else if (
    action === "buy-creature" &&
    !shopStock.sold.includes("creature")
  ) {
    success = buyCreature(run, shopStock.creature);
    if (success) {
      shopStock.sold.push("creature");
      unlock(shopStock.creature);
    }
  } else {
    const id = action.slice(4);
    if (shopStock.relics.includes(id)) success = buyRelic(run, id);
  }
  if (success) {
    save();
    updateHeader();
    openShop();
    sound("buy");
  } else toast("You need more gold or space on your bench.");
}
function rerollShop() {
  if (phase !== "shop") return;
  const price = shopPrice(run, 20 + shopStock.rerolls * 15);
  if (run.gold < price) return;
  run.gold -= price;
  const r = rng(node.seed + shopStock.rerolls * 999 + 11);
  let pool = RELICS.filter(
    (r) => !run.relics.includes(r.id) && !shopStock.relics.includes(r.id),
  );
  if (pool.length < 3) pool = RELICS.filter((r) => !run.relics.includes(r.id));
  const picks = [];
  while (pool.length && picks.length < 3) {
    const i = Math.floor(r() * pool.length);
    picks.push(pool.splice(i, 1)[0].id);
  }
  shopStock.relics = picks;
  shopStock.rerolls++;
  save();
  updateHeader();
  openShop();
}
function eventDisabled(c) {
  return !eventAvailable(run, c);
}
function openEvent() {
  const e = eventForRun(run,eventIndex);
  modal(
    `<span class="section-kicker">AN UNKNOWN SIGNAL · ${PLANETS[run.planet].name.toUpperCase()}</span><h2>${e.title}.</h2><div class="event-art">${["❋", "✧", "⌛"][eventIndex % 3]}</div><p>${e.story}</p><div class="choice-list">${e.choices.map((c, i) => `<button class="event-choice" data-event="${i}" ${eventDisabled(c) ? "disabled" : ""}><strong>${c.title} <span style="float:right;color:#c1dba5">→</span></strong><p>${c.gem?relicDescription(PERSONAL_BY_ID[c.gem]):c.desc}</p></button>`).join("")}</div><div class="modal-actions">${button("Leave without a bargain →", "leave-event", "ghost")}</div>`,
    "event",
    false,
  );
}
function eventChoose(i) {
  if (phase !== "event") return;
  const result = applyEvent(run, eventForRun(run,eventIndex), i);
  if (!result.ok) return;
  if (result.captured) unlock(result.captured);
  toast(result.message);
  leaveNode();
}
function openRest() {
  modal(
    `<span class="section-kicker">A QUIET GROVE</span><h2>Let the world wait.</h2><div class="event-art">❋</div><p>Your companions gather beneath the glowing canopy. There is time for one thing before the journey continues.</p><div class="choice-list"><button class="event-choice" data-action="rest-life" ${run.integrity >= 3 ? "disabled" : ""}><strong>Mend the expedition <span style="float:right">♡</span></strong><p>Recover one expedition life. Currently ${run.integrity} / 3.</p></button><button class="event-choice" data-action="rest-xp"><strong>Practice together <span style="float:right">✧</span></strong><p>Every active creature gains ${(chaosLevel(run)>=12?30:40)+(routeModifiers(run).restXP||0)} EXP. Stronger bonds, stronger companions.</p></button><button class="event-choice" data-action="rest-orbs"><strong>Search the undergrowth <span style="float:right">◈</span></strong><p>Find 2 Scout Prisms. The next companion might be just around the bend.</p></button><button class="event-choice" data-action="rest-kit"><strong>Restore the capture kit</strong><p>Find one Runic Cage, a stronger capturer than a Scout Prism.</p></button></div>`,
    "rest",
    false,
  );
}
function starterCost(id) {
  return starterPoints(BY_ID[id].rarity, profile.bonds[id] || 0);
}
const starterPortraitCells=new Map();
const starterReactions=new Map(),starterReactionCells=new Map();
function reactionFrame(id,progress){
  const out=document.createElement('canvas');out.width=out.height=64;
  out.getContext('2d').putImageData(new ImageData(starterReactionPixels(pixelSpec(id),progress,getCharacterHeight()),64,64),0,0);
  return out;
}
function starterReactionCell(id){
  if(!starterReactionCells.has(id)){
    const idle=starterPortraitCell(id);let left=idle.x,top=idle.y,right=left+idle.w,bottom=top+idle.h;
    for(let i=0;i<=16;i++){const pixels=reactionFrame(id,i/16).getContext('2d').getImageData(0,0,64,64).data;
      for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]){left=Math.min(left,x-2);top=Math.min(top,y-2);right=Math.max(right,x+3);bottom=Math.max(bottom,y+3);}
    }
    left=Math.max(0,left);top=Math.max(0,top);right=Math.min(64,right);bottom=Math.min(64,bottom);
    starterReactionCells.set(id,{x:left,y:top,w:right-left,h:bottom-top});
  }
  return starterReactionCells.get(id);
}
function playStarterReaction(id){
  if(profile.reducedMotion)return;
  starterReactions.set(id,{start:performance.now(),...starterReactionProfile(pixelSpec(id))});
  idlePortraitTick=-Infinity;drawIdlePortraits(performance.now());
}
function starterPortraitCell(id){
  if(!starterPortraitCells.has(id)){
    let left=64,top=64,right=0,bottom=0;
    // Union the full idle cycle, trimming only transparent padding. Horns,
    // crowns, weapons and feet stay inside the portrait throughout the cycle.
    for(let i=0;i<16;i++){
      const frame=nativePreviewFrame({id},'idle',i/16,2),pixels=frame.getContext('2d').getImageData(0,0,64,64).data;
      for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    }
    left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(64,right+2);bottom=Math.min(64,bottom+2);
    starterPortraitCells.set(id,{x:left,y:top,w:right-left,h:bottom-top});
  }
  return starterPortraitCells.get(id);
}
function starterPortraitHTML(id){
  const cell=starterPortraitCell(id),out=document.createElement('canvas');out.width=cell.w;out.height=cell.h;
  out.getContext('2d').drawImage(nativePreviewFrame({id},'idle',.25,2),cell.x,cell.y,cell.w,cell.h,0,0,cell.w,cell.h);
  return `<span class="starter-portrait"><img src="${out.toDataURL()}" alt="${BY_ID[id].name}, front-facing idle" draggable="false"><canvas width="${cell.w}" height="${cell.h}" data-starter-idle="${id}" aria-hidden="true"></canvas><span class="starter-reaction-particle" aria-hidden="true"></span></span>`;
}
function starterCardHTML(id,counts){
  const s=BY_ID[id],e=ELEMENTS[s.element],selected=starterSelection.includes(id),n=counts[s.element]||0;
  return `<article class="starter-choice ${selected?'chosen':''}" data-element="${s.element}" style="--element:${e.color}"><button class="starter-card ${selected?'selected':''}" data-starter="${id}" aria-pressed="${selected}" aria-label="${selected?'Remove':'Choose'} ${s.name}, ${s.role}, ${e.name}, ${starterCost(id)} points"><span class="starter-check" aria-hidden="true">${selected?'✓':''}</span>${starterPortraitHTML(id)}${roleBadge(s)}<strong>${s.name}</strong><span class="starter-cost">${starterCost(id)} PT</span><span class="starter-category">${e.icon} ${e.name} <small>${{ember:'Fire',grove:'Grass',tide:'Water',storm:'Lightning',void:'Shadow'}[s.element]} · ${n} chosen</small></span><small class="starter-category-bonus">${e.description}</small><small class="starter-bond">${s.rarity} · Bond ${profile.bonds[id]||0} / 5${profile.bonds[id]?` · +${Math.min(5,profile.bonds[id])*2}% HP`:''}</small></button>${eliteStarterHTML(id)}</article>`;
}
function starterToolsHTML(count){
  return `<div class="team-companion-tools" aria-label="Filter and sort companions"><label>POINT COST<select id="starter-cost-filter" data-starter-filter="cost"><option value="all">Any cost</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${starterCostFilter===String(n)?'selected':''}>${n} ${n===1?'point':'points'}</option>`).join('')}</select></label><label>ELEMENTAL TYPE<select id="starter-type-filter" data-starter-filter="type"><option value="all">All types</option>${Object.entries(ELEMENTS).map(([id,e])=>`<option value="${id}" ${starterTypeFilter===id?'selected':''}>${e.name} · ${{ember:'Fire',grove:'Grass',tide:'Water',storm:'Lightning',void:'Shadow'}[id]}</option>`).join('')}</select></label><label>SORT BY<select id="starter-sort" data-starter-sort="true">${Object.entries({featured:'Featured',cost:'Cost: low to high','cost-desc':'Cost: high to low',type:'Elemental type',name:'Name: A–Z'}).map(([id,name])=>`<option value="${id}" ${starterSort===id?'selected':''}>${name}</option>`).join('')}</select></label><small role="status">${count} / ${profile.owned.length} companions${starterTypeFilter!=='all'||starterCostFilter!=='all'?'<button data-action="starter-reset-filters">Clear filters</button>':''}</small></div>`;
}
function openStarters(reset = true) {
  if (phase === "battle") {
    toast("Finish this battle before starting a new expedition.");
    return;
  }
  if (reset) {
    starterSelection = NATIVE_STARTERS.slice(0,2);
    starterEliteSelection={};
    starterTypeFilter='all';starterCostFilter='all';starterSort='featured';
    selectedDifficulty = run.difficulty || "standard";
    selectedChaos = Math.max(
      1,
      Math.min(profile.chaosUnlocked || 1, run.chaos || 1),
    );
  }
  const cost = starterSelection.reduce((s, id) => s + starterCost(id), 0);
  const slots=starterSlots(profile),budget=starterBudget(profile),counts=synergies(starterSelection.map(id=>({id})));
  const starterChoices=profile.owned.filter(id=>(starterTypeFilter==='all'||BY_ID[id].element===starterTypeFilter)&&(starterCostFilter==='all'||starterCost(id)===Number(starterCostFilter)));
  const byName=(a,b)=>BY_ID[a].name.localeCompare(BY_ID[b].name);
  if(starterSort==='cost')starterChoices.sort((a,b)=>starterCost(a)-starterCost(b)||byName(a,b));
  if(starterSort==='cost-desc')starterChoices.sort((a,b)=>starterCost(b)-starterCost(a)||byName(a,b));
  if(starterSort==='type')starterChoices.sort((a,b)=>ELEMENTS[BY_ID[a].element].name.localeCompare(ELEMENTS[BY_ID[b].element].name)||byName(a,b));
  if(starterSort==='name')starterChoices.sort(byName);
  modal(
    `<header class="team-select-heading"><span class="section-kicker">❧ A NEW EXPEDITION <i></i></span><h2>Choose your unlikely heroes.</h2><p>Build your party. Choose your challenge. Begin your journey.</p></header>
    <div class="team-select-layout"><aside class="team-challenge team-art-panel"><div class="challenge-scroll">${difficultyHTML()}
    <details class="team-field-notes"><summary>Before you set off <span>Points · captures · Chaos</span></summary><div><h3>A small party. A bigger future.</h3><p>Choose 1–${slots} companions within ${budget} starter points. Common / Uncommon / Rare / Epic / Legendary cost 1 / 2 / 3 / 4 / 6 points. Repeat captures grow bonds: +2% starter health per bond. Bond 5 reduces cost by 1 point, or 2 for a Legendary.</p><h3>Bring an elite home.</h3><p>In an elite encounter, one opponent carries a mutation. Preselect that individual and a capturer before combat; lower health improves your odds. Capture it before it falls. A successful capture saves its bonus, nature and genes for future runs. Choose that individual beside its companion card; it starts at level 1 with fresh equipment.</p><h3>Why brave the Chaos?</h3><p>Win any expedition to unlock Chaos. Its 20 tiers stack their rules: tier 4 includes rules 1–4. Clear your highest unlocked tier to open the next. Your permanent budget is 3 + your highest cleared tier; clearing Chaos 3 also unlocks a third starting place. Each expedition victory grants 3 starlight for Legendary adoption.</p><h3>Find your elemental rhythm.</h3><p>Two companions of the same category activate its first bonus; four activate its second. Card bonuses and the party preview update as you choose. You can recruit more companions during the expedition.</p></div></details>
    <p class="team-permanent-note">${profile.chaosCleared||0} Chaos tiers cleared · ${budget} permanent points<br>${slots===3?'Third starting place unlocked.':'Clear Chaos 3 to open your third starting place.'}</p></div></aside>
    <section class="team-companions team-art-panel"><div class="team-section-heading"><h3>❧ YOUR COMPANIONS</h3><span>Choose up to ${slots} companions.</span></div>${starterToolsHTML(starterChoices.length)}<div class="companion-scroll" tabindex="0" aria-label="Available companions"><div class="starter-grid">${starterChoices.map(id=>starterCardHTML(id,counts)).join('')||'<div class="starter-no-results"><strong>No companions match these filters.</strong><p>Try another cost or elemental type.</p><button class="button secondary small" data-action="starter-reset-filters">Clear filters</button></div>'}</div></div><div class="team-synergy-preview" aria-live="polite"><b>TEAM SYNERGIES</b>${Object.entries(counts).map(([id,n])=>`<span style="--element:${ELEMENTS[id].color}">${ELEMENTS[id].icon} ${ELEMENTS[id].name} ${n} / ${n>=2?4:2} · ${n>=2?'ACTIVE':`${2-n} more to activate`}</span>`).join('')||'<span>Choose companions to discover a combination.</span>'}</div></section></div>
    <footer class="team-party team-art-panel"><div class="team-party-roster"><h3>YOUR PARTY (${slots} SLOTS)</h3><div>${Array.from({length:slots},(_,i)=>{const id=starterSelection[i];return id?`<button class="party-companion" data-party-remove="${id}" aria-label="Remove ${BY_ID[id].name} from party">${starterPortraitHTML(id)}<span><strong>${BY_ID[id].name}</strong><small style="color:${ELEMENTS[BY_ID[id].element].color}">${ELEMENTS[BY_ID[id].element].icon} ${ELEMENTS[BY_ID[id].element].name} · ${BY_ID[id].role}</small>${starterEliteSelection[id]?'<small class="party-elite">✦ Elite bonus equipped</small>':''}</span><b>${starterCost(id)} PT</b></button>`:'<div class="party-companion open-slot"><b>＋</b><span>Open slot<small>Choose a companion</small></span></div>';}).join('')}</div></div><div class="starter-budget" aria-live="polite"><span><strong>${starterSelection.length} / ${slots}</strong> companions</span><span><strong>${cost} / ${budget}</strong> starter points<i class="starter-point-dots" aria-hidden="true">${Array.from({length:budget},(_,i)=>`<i class="${i<cost?'spent':''}"></i>`).join('')}</i></span></div>${button('Begin expedition <span>→</span>', 'confirm-run','team-begin',!starterSelection.length||starterSelection.length>slots||cost>budget)}</footer><p class="team-replace-note">${saved?.run?'Beginning replaces your current expedition. Your permanent menagerie remains.':'Your discoveries stay with you, wherever this journey leads.'}</p><div class="team-foliage" aria-hidden="true"></div>`,
    "starters",
  );
}
function selectStarter(id) {
  if (starterSelection.includes(id))
    starterSelection = starterSelection.filter((x) => x !== id);
  else if (starterSelection.length < starterSlots(profile) && starterSelection.reduce((n,c)=>n+starterCost(c),0)+starterCost(id)<=starterBudget(profile)) starterSelection.push(id);
  else {
    playStarterReaction(id);
    toast(`Deselect a companion first. Choose up to ${starterSlots(profile)} companions within ${starterBudget(profile)} points.`);
    return;
  }
  openStarters(false);
  playStarterReaction(id);
}
function endRun(won) {
  phase = "ended";
  run.complete = won;
  if (!recordedEnd) {
    if (won) {
      profile.victories++;
      profile.starlight = (profile.starlight || 0) + 3;
      unlockChaos(profile, run);
    }
    recordedEnd = true;
  }
  profile.best = Math.max(profile.best, run.wins);
  save();
  render();
  openEnd(won);
}
function openEnd(won = run.complete) {
  modal(
    `<div class="result-hero"><span class="result-sigil">${won ? "✧" : "♡"}</span><span class="section-kicker" style="display:block">${won ? "THREE WORLDS. ONE EXTRAORDINARY TEAM." : "SOME STORIES ARE ONLY THE BEGINNING"}</span><h2>${won ? "You brought the stars home." : "The journey stays with you."}</h2><p>${won ? "Your companions have conquered the Silent Expanse. There are more teams to discover, more paths to try." : "Your expedition ends here. Every creature you discovered is waiting for your next attempt."}</p></div><div class="end-stats"><div><strong>${run.wins}</strong><small>BATTLES WON</small></div><div><strong>${profile.owned.length}</strong><small>PERMANENT CREATURES</small></div><div><strong>${run.relics.length}</strong><small>RELICS FOUND</small></div></div>${won ? `<div class="chaos-victory"><strong>CHAOS ${profile.chaosUnlocked} / 20 UNLOCKED</strong><p>Victory grants 3 starlight: adopt a Legendary family from the menagerie. ${chaosLevel(run) ? `Chaos ${chaosLevel(run)} cleared. ` : ""}${((profile.chaosCleared||0)>=1)?`Permanent starter budget: ${starterBudget(profile)} points. Gain one point per Chaos tier cleared. Chaos 3 unlocks the third starting place.`:"Start with three points. Clear each Chaos tier for +1 point; Chaos 3 unlocks a third starting place."} New expeditions can select the next unlocked tier.</p></div>` : ""}<p class="starter-note" style="text-align:center">Captured creatures are saved on this device. Use them as starters to discover new team combinations.</p><div class="modal-actions">${button("View menagerie", "end-collection", "secondary")}${button("Build a new expedition →", "new-run")}</div>`,
    "end",
    false,
  );
}
function openReport() {
 const report=battle||lastReport;
 if(!report){modal(`<h2>The story is still unwritten.</h2><p>Enter a battle to see each companion’s contribution.</p>${button('Back to expedition','close','secondary')}`,'report');return;}
 modal(`<span class="section-kicker">BATTLE REPORT · ${report.time.toFixed(1)} SECONDS</span><h2>${report.done?(report.winner===0?'A hard-earned victory.':'Lessons from the arena.'):'Every companion contributes.'}</h2>${recapHTML(report)}<details class="report-advice"><summary>Why this result?</summary>${(battle?battle.reportAdvice():lastReport.advice||[]).map(note=>`<p>${note}</p>`).join('')}</details><div class="modal-actions">${button('Back to rewards','return-rewards','secondary',phase!=='reward')}${button('Return to arena','close','secondary')}</div>`,'report');
}
function openHelp() {
  modal(
    `<span class="section-kicker">FIELD NOTES FOR A NEW EXPLORER</span><h2>A little strategy. A lot of heart.</h2><p>Collect creatures. Build bonds. Let your companions fight. Bring their stories home.</p><div class="help-grid"><div><h3>01 · Two beginnings, six ambitions</h3><p>Inspect creatures to choose training focuses or swap bench companions. Guardians hold the front; supports and rangers keep their distance. Drag companions on the arena before battle; grabbing a head, hand or foot changes how they hang. Team places unlock at 2, 5, 8 and 11 combat wins, with hiring permits available after win 3. Deployment also offers a tactical grid. Inspect a creature to choose its AI policy.</p></div><div><h3>02 · Smart, automatic combat</h3><p>Creatures commit to aimed swings and straight-flying shots. Stamina pays for attacks and physical dodge rolls; roots prevent rolls. Guardians screen shots, strikers flank, and healers save defensive skills for danger. Heavy melee causes bleed and breaks poise; stagger interrupts windups. Hunt prioritizes wounded enemies; Guard holds the frontline. After 30 combat seconds, both teams enrage: 3× damage and healing, 1.5× attacks and cooldown recharge. Healing effectiveness drops by 20 percentage points every five seconds, reaching zero at 55s. Space pauses; 1, 2, 3 change playback speed. Use Settings to tune combat feel and sprite sizes.</p></div><div><h3>03 · Your route matters</h3><p>Each planet has eight encounters linked by one to four explicit connections. See four rooms ahead; scouting relics reveal more. Choose battles, shops, captures, recovery, or difficult bargains. Losing costs a life and a permanent casualty. Defeat each planet’s boss to advance.</p></div><div><h3>04 · Build with intent</h3><p>Two creatures of an element activate a team bonus. Four unlock another. Expedition relics affect every ally. Personal relics fill individual slots: Common 1, Uncommon 2, Rare 3, Epic 4, Legendary 5. Levels and training improve base stats. Skills show their effective cooldown in the creature panel.</p></div><div><h3>05 · Catch your next beginning</h3><p>Use a wild creature’s overhead diamond before battle to choose a target, 5–75% HP threshold, and a capturer tier. Scout Prisms at 25% HP start at 90% Common, 85% Uncommon, 25% Rare, 22% Epic and 8% Legendary. Runic, Astral and Mythic tools improve them. Your team deals less damage while preparing an automatic throw; weakening and statuses improve odds. A lethal hit or damage over time can knock out the target before the throw. There are no post-match captures; select your target before combat. Rare creatures have stronger skills and lower capture chances. Successful captures fight for you immediately. At round end they join an unlocked empty team slot, or your reserves if the team is full, and unlock permanent starters.</p></div><div><h3>06 · Evolve your companions</h3><p>At level 5, spend 50 gold in a creature panel to choose Wild damage or Warden resilience. At level 8, ascend for 100 gold. Each stage transforms the silhouette, unlocks an exclusive cooldown skill and equipment slot, and adds a personal relic slot. Choose a free evolution gear cache in the companion panel; outposts sell further gear. Worn relics remain equipped. Common companions also awaken at level 5. New expeditions start in base forms at level 1 with no run relics. Your permanent creatures stay. Choose one or two within a two-point rarity budget. Chaos clears earn additional starting points. Legendary starters cost 6 points, or 4 after five captures strengthen their bond. Victories earn Starlight for permanent Legendary adoption.</p></div></div><p class="starter-note">Surviving allies fully recover between encounters. A defeat permanently kills one random deployed starter, or another companion when none remain; its family remains unlocked. Its worn gear and personal relics disappear, and another owned relic is destroyed. Recruit reserves before taking large risks. Expedition lives measure your ability to retreat. Browser storage keeps your collection and run; sound is optional.</p><div class="modal-actions">${button("I’m ready to explore →", "help-done")}</div>`,
    "help",
  );
}
function openRelic(id) {
  const r = RELICS.find((r) => r.id === id);
  modal(
    `<span class="section-kicker">RUN RELIC · TEAM-WIDE EFFECT</span><div class="event-art" style="color:${r.color}">${r.icon}</div><h2>${r.name}.</h2><p>${relicDescription(r)}</p><p class="starter-note">This relic stays with your current expedition. A new run starts with a fresh inventory.</p>${button("Back to expedition", "close", "secondary")}`,
    "relic",
  );
}
function sound(kind) {
  if (profile.sound) soundscape.action(kind);
}
function setView(v) {
  viewName = v;
  render();
}
document.addEventListener("click", async (e) => {
  if(e.target.classList.contains('modal-backdrop')&&e.target.dataset.dismissible==='true'){closeModal();return;}
  const el = e.target.closest("button");
  if(el?.disabled)return;
  if(el?.dataset.action==='begin-encounter'){startBattle();return;}
  if(el?.dataset.action==='show-spoils'){openRewards();return;}
  if(el?.dataset.action==='help'){openHelp();return;}
  if(el?.dataset.action==='inspect-selected'){openCreature(selectedCreature);return;}
  if(el?.dataset.action==='companions'){openCompanions();return;}
  if(el?.dataset.partySelect!==undefined){selectedCreature=Number(el.dataset.partySelect);openCompanions();return;}
  if(el?.dataset.action==='capture-kit'){openCaptureKit();return;}
  if(el?.dataset.action==='intel'){openIntel();return;}
  if(el?.dataset.intelTab){intelTab=el.dataset.intelTab;openIntel();return;}
  if(el?.dataset.lootInspect!==undefined){const d=reward?.loot?.drops[Number(el.dataset.lootInspect)];if(d)modal(`<span class="section-kicker">VICTORY SPOILS \u00b7 ${lootVisual(d).tier}</span><div class="loot-detail">${artImage(lootArt(d))}<h2>${lootName(d)}</h2><p>${lootDescription(d)}</p>${d.sourceName?`<p>From ${d.sourceName} \u00b7 Lv. ${d.sourceLevel} \u00b7 ${Math.round(d.quality*100)}% quality</p>`:''}</div>${button('Back to rewards','return-rewards')}`,'loot-detail');return;}
  if(el?.dataset.action==='starter-reset-filters'){starterTypeFilter='all';starterCostFilter='all';starterSort='featured';openStarters(false);return;}
  if(el?.dataset.partyRemove){selectStarter(el.dataset.partyRemove);return;}
  if(el?.dataset.rosterSide!==undefined){liveRosterSide=Number(el.dataset.rosterSide);refreshLiveRoster();return;}
  if(el?.dataset.liveInspect){const u=battle?.units.find(u=>u.uid===el.dataset.liveInspect);if(u){liveSelectedUid=u.uid;refreshLiveRoster();const index=run.team.findIndex(c=>c.uid===u.uid);if(index>=0){selectedCreature=index;openCreature(index);}else openDetail(u);}return;}
  if(el?.dataset.enemyFocus&&phase==='battle'){battle?.focusEnemy(el.dataset.enemyFocus);return;}
  if(el?.dataset.action==='legendary-pact'){openLegendaryPact();return;}
  if(el?.dataset.pactCreature&&phase!=='battle'){
    const chosen=chooseLegendaryPact(run,el.dataset.pactCreature);
    if(chosen){save();closeModal();render();toast(creatureName(chosen)+' awaits in Reserves. One active place sacrificed.');}
    return;
  }
  if(el?.dataset.recapMetric||el?.dataset.recapSide!==undefined){if(el.dataset.recapMetric)recapMetric=el.dataset.recapMetric;if(el.dataset.recapSide!==undefined)recapSide=Number(el.dataset.recapSide);const report=modalKind==='reward'?lastReport:battle||lastReport;$('#battle-recap').outerHTML=recapHTML(report);return;}
  if(el?.dataset.action==='return-rewards'){openRewards();return;}
  if(el?.dataset.action==='reset-tuning'){applyTuning(DEFAULT_TUNING);for(const input of document.querySelectorAll('[data-tuning]'))input.value=profile.tuning[input.dataset.tuning];return;}
  if(el?.dataset.action==='inspect-quick-gear'){detailTab='equipment';openCreature(Number(el.dataset.index));return;}
  if(el?.dataset.detailTab){detailTab=el.dataset.detailTab;prepareDetailTabs();return;}
  if(el?.dataset.switchCreature!==undefined){openCreature(Number(el.dataset.switchCreature));return;}
  if(el?.dataset.captureMethod){if(el.disabled)return;if(phase==='battle'){run.selectedCapturer=el.dataset.captureMethod;save();updateRetryControls();return;}if(run.captureOrder)setCaptureTarget(run.captureOrder.uid,el.dataset.captureMethod);else{run.selectedCapturer=el.dataset.captureMethod;save();render();}if(modalKind==='capture-kit')openCaptureKit();return;}
  if(el?.dataset.planetPreview!==undefined){const i=Number(el.dataset.planetPreview),b=BIOMES[i];modal(`<div class="world-preview" style="--world:${b.water}">${planetOrb(i,180)}<span class="section-kicker">WORLD ${i+1} · ${i>run.planet?'UNCHARTED':i<run.planet?'EXPLORED':'CURRENT'}</span><h2>${PLANETS[i].name}</h2><p>${b.tag}</p><div class="biome-preview">${biomeScenery(i)}</div><p>${b.features.join(' · ')}<br>Guardian: ${PLANETS[i].bossName}</p>${button('Back to star chart','close','secondary')}</div>`,'planet');return;}
  if(el?.dataset.enemyRelic){openRelic(el.dataset.enemyRelic);return;}
  if(el?.dataset.enemyInspect){openDetail(battle?.units.find(c=>c.uid===el.dataset.enemyInspect)||foes.find(c=>c.uid===el.dataset.enemyInspect));return;}
  if(el?.dataset.enemyCapture){if(phase==='battle')retryCaptureUI(el.dataset.enemyCapture);else setCaptureTarget(el.dataset.enemyCapture);return;}
  if(el?.dataset.action==="claim-loot"&&phase==="reward"){
    if(lootCollecting||reward.loot?.claimed)return;
    // Commit before presentation: reloads or navigation cannot interrupt a grant.
    const cache=reward.loot;
    if(!claimLoot(run,cache))return;
    save();lootCollecting=true;el.disabled=true;
    try{await flyLootToTotals();}finally{lootCollecting=false;updateHeader();if(modalKind==='reward')openRewards();render();sound('buy');}
    return;
  }
  if (!el || el.disabled) return;
  if (el.dataset.view) {
    setView(el.dataset.view);
    return;
  }
  if(el.dataset.practice&&modalKind==="practice"){practice=practiceBattle(run,practiceScenario,el.dataset.practice==="baseline");return;}
  if (el.dataset.speed) {
    speed = Number(el.dataset.speed);
    document
      .querySelectorAll("[data-speed]")
      .forEach((b) =>
        b.classList.toggle("active", Number(b.dataset.speed) === speed),
      );
    return;
  }
  if (el.dataset.stance) {
    if (phase === "battle") return;
    run.stance = el.dataset.stance;
    save();
    render();if(modalKind==='formation')openFormation();
    toast(
      {
        balanced: "Balanced: roles use their natural targeting.",
        weakest: "Weakest first: the team prioritizes the lowest-health enemy.",
        hunt: "Hunt: the team focuses wounded targets. Your backline may advance.",
        guard:
          "Guard: strikers stay near the frontline. Safer, but less burst pressure.",
      }[run.stance],
    );
    return;
  }
  if (el.dataset.formationUnit !== undefined) {
    formationSelection = Number(el.dataset.formationUnit);
    openFormation();
    return;
  }
  if (el.dataset.deploy !== undefined && phase !== "battle") {
    const [row, col] = el.dataset.deploy.split(":").map(Number);
    setDeployment(run, formationSelection, row, col);
    save();
    render();
    openFormation();
    return;
  }
  if (el.dataset.difficulty) {
    if (el.dataset.difficulty === "chaos" && !profile.chaosUnlocked) return;
    selectedDifficulty = el.dataset.difficulty;
    openStarters(false);
    return;
  }
  if (el.dataset.adopt) {
    if (
      (profile.starlight || 0) < 3 ||
      profile.owned.includes(el.dataset.adopt)
    )
      return;
    profile.starlight -= 3;
    recordBond(profile, el.dataset.adopt);
    unlock(el.dataset.adopt);
    save();
    closeModal();
    setView("collection");
    toast(
      "Legendary family adopted. Available within your next starter budget.",
    );
    return;
  }
  if(el.dataset.gearClaim || el.dataset.gearEquip || el.dataset.gearRemove!==undefined){
    if(phase==="battle")return;const index=Number(el.dataset.index);
    const ok=el.dataset.gearClaim?claimEvolutionGear(run,index,el.dataset.gearClaim):el.dataset.gearEquip?equipGear(run,index,el.dataset.gearEquip):removeGear(run,index,Number(el.dataset.gearRemove));
    if(ok){const party=modalKind==='companions';save();render();party?openCompanions():openCreature(index);sound("buy");}return;
  }
  if (el.dataset.evolve) {
    transformCreature(Number(el.dataset.index), el.dataset.evolve);
    return;
  }
  if (el.dataset.creature !== undefined) {
    openCreature(Number(el.dataset.creature));
    return;
  }
  if (el.dataset.foe) {
    openDetail(
      foes.find((f) => f.id === el.dataset.foe) || creature(el.dataset.foe),
    );
    return;
  }
  if (el.dataset.codex) {
    openDetail(
      {
        ...creature(el.dataset.codex),
        evolution: profile.formDiscoveries[el.dataset.codex] || 0,
        evolutionPath: profile.formBranches[el.dataset.codex]||"wild",
      },
      null,
      true,
    );
    return;
  }
  if (el.dataset.filter) {
    filter = el.dataset.filter;
    render();
    return;
  }
  if (el.dataset.node && !el.dataset.fieldNode) {
    chooseNode(el.dataset.node);
    return;
  }
  if (el.dataset.focus) {
    if (phase === "battle") return;
    const index = Number(el.dataset.index);
    run.team[index].focus = el.dataset.focus;
    save();
    render();
    openCreature(index);
    return;
  }
  if (el.dataset.equip) {
    if (phase === "battle") return;
    const i = Number(el.dataset.index);
    if (equipRelic(run, i, el.dataset.equip)) {
      save();
      render();
      openCreature(i);
      toast("Personal relic equipped. Its effects apply to the whole creature.");
    }
    return;
  }
  if (el.dataset.unequip !== undefined) {
    if (phase === "battle") return;
    const i = Number(el.dataset.index);
    if (unequipRelic(run, i, Number(el.dataset.unequip))) {
      save();
      render();
      openCreature(i);
    }
    return;
  }
  if (el.dataset.packRelic) {
    openEquipTarget(el.dataset.packRelic);
    return;
  }
  if (el.dataset.packTarget !== undefined) {
    if (phase === "battle") return;
    const i = Number(el.dataset.packTarget);
    if (equipRelic(run, i, el.dataset.item)) {
      save();
      render();
      openCreature(i);
      toast("Personal relic equipped on this companion.");
    }
    return;
  }
  if (el.dataset.swap !== undefined) {
    if (phase === "battle") return;
    const i = Number(el.dataset.index),
      j = Number(el.dataset.swap);
    if (!deployReserve(run, j, i)) return;
    save();
    render();
    openCreature(i);
    return;
  }
  if (el.dataset.upgrade) {
    chooseUpgrade(el.dataset.upgrade);
    return;
  }
  if (el.dataset.event !== undefined) {
    eventChoose(Number(el.dataset.event));
    return;
  }
  if (el.dataset.starter) {
    selectStarter(el.dataset.starter);
    return;
  }
  if (el.dataset.relic) {
    openRelic(el.dataset.relic);
    return;
  }
  const action = el.dataset.action;

  if (el.dataset.deployReserve !== undefined) {
    if (
      phase !== "battle" &&
      deployReserve(run, Number(el.dataset.deployReserve))
    ) {
      save();
      render();
      openReserves();
    }
    return;
  }
  if (action === "reserves") {
    openReserves();
    return;
  }
  if (action === "field-care") {
    openFieldCare();
    return;
  }
  if (action === "hospital-upgrade") {
    if (phase !== "battle" && upgradeHospital(run)) {
      save();
      render();
      openFieldCare();
    }
    return;
  }
  if (action?.startsWith("care-creature-")) {
    openCreature(Number(action.slice(14)));
    return;
  }
  if (action?.startsWith("survival-")) {
    const index = Number(action.slice(9));
    if (phase !== "battle" && trainSurvival(run, index)) {
      save();
      render();
      openCreature(index);
    }
    return;
  }
  if(action==="rest-kit"&&phase==="rest"){addCapturer(run,"runic");toast("Runic Cage added to your kit.");leaveNode();return;}
  if (
    action === "rest-care" &&
    phase === "rest" &&
    (run.fieldHospital || 0) < 3
  ) {
    run.fieldHospital = (run.fieldHospital || 0) + 1;
    toast("Field hospital improved. Every ally is safer on retreat.");
    leaveNode();
    return;
  }
  if(action==="roster"){openRoster();return;}
  if(action==="practice"&&run.native&&phase!=="battle"){openPractice();return;}
  if (action === "formation") {
    openFormation();
    return;
  }
  if (action === "legendary-adopt") {
    openAdoption();
    return;
  }
  if (action === "motion") {
    profile.reducedMotion = !profile.reducedMotion;
    if (battle) battle.reducedMotion = profile.reducedMotion;
    save();
    render();
    return;
  }
  if (action === "tutorial-gear") {
    $(".equipment-tray")?.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  if (action === "evolution-back") {
    openCreature(selectedCreature);
    return;
  }
  if (action?.startsWith("buy-")) {
    purchase(action);
    return;
  }
  if (action === "battle") startBattle();
  if (action === "pause" && phase === "battle") {
    paused = !paused;
    el.textContent = paused ? "▶" : "II";
    el.setAttribute("aria-label", paused ? "Resume battle" : "Pause battle");
  }
  if (action === "close") closeModal();
  if (action === "view-map") setView("map");
  if (action === "new-run") openStarters();
  if (action === "confirm-run") {
    if((!starterSelection.length||starterSelection.length>starterSlots(profile))||starterSelection.reduce((n,id)=>n+starterCost(id),0)>starterBudget(profile)){toast("Choose companions within your unlocked places and point budget.");return;}
    freshRun(starterSelection, true, {
      difficulty: selectedDifficulty,
      chaos:
        selectedDifficulty === "chaos"
          ? Math.min(selectedChaos, profile.chaosUnlocked || 1)
          : 1,
    });
    closeModal();
    save();
    render();
    toast("A fresh expedition. New worlds, new possibilities.");
  }
  if (action === "reward") openRewards();
  if (action === "continue") continueRun();
  if (action === "leave-node" && phase === "shop") leaveNode();
  if (action === "leave-event" && phase === "event") leaveNode();
  if (action === "reroll") rerollShop();
  if (action === "rest-life" && phase === "rest" && run.integrity < 3) {
    run.integrity++;
    toast("One expedition life restored.");
    leaveNode();
  }
  if (action === "rest-xp" && phase === "rest") {
    run.team.forEach((u) => gainXP(u, (chaosLevel(run)>=12?30:40)+(routeModifiers(run).restXP||0)));
    toast(`Every companion gains ${chaosLevel(run) >= 12 ? 30 : 40} EXP.`);
    leaveNode();
  }
  if (action === "rest-orbs" && phase === "rest") {
    addCapturer(run,"scout",2);
    toast("Two Scout Prisms found.");
    leaveNode();
  }
  if (action === "dismiss-tutorial" || action === "help-done") {
    profile.tutorial = true;
    save();
    if (action === "help-done") closeModal();
    render();
  }
  if (action === "report") openReport();
  if (action === "pack") openPack();
  if (action === "end-collection") {
    closeModal();
    setView("collection");
  }
});
$("#new-run").addEventListener("click", () => openStarters());
$("#help").addEventListener("click", openHelp);
$("#settings").addEventListener("click",openSettings);
$(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  setView("arena");
});
$("#sound").addEventListener("click", () => {
  profile.sound = !profile.sound;
  soundscape.setEnabled(profile.sound);
  $("#sound").innerHTML = fieldIcon("sound");
  $("#sound").setAttribute("aria-pressed",String(profile.sound));
  $("#sound").setAttribute(
    "aria-label",
    profile.sound ? "Mute sound" : "Enable sound",
  );
  save();
  sound("buy");
  toast(profile.sound ? "Sound enabled." : "Sound muted.");
});
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    modalKind
  )
    closeModal();
  if (e.key === "Tab" && modalKind) {
    const buttons = [
      ...document.querySelectorAll(
        "#modal-root button:not(:disabled), #modal-root select:not(:disabled), #modal-root input:not(:disabled)",
      ),
    ];
    if (!buttons.length) return;
    const first = buttons[0],
      last = buttons.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  if (
    e.code === "Space" &&
    phase === "battle" &&
    !modalKind &&
    e.target.tagName !== "BUTTON"
  ) {
    e.preventDefault();
    paused = !paused;
    const b = $(".pause-btn");
    if (b) b.textContent = paused ? "▶" : "II";
  }
  if (["1", "2", "3"].includes(e.key) && phase === "battle" && !modalKind) {
    speed = Number(e.key);
    document
      .querySelectorAll("[data-speed]")
      .forEach((b) =>
        b.classList.toggle("active", Number(b.dataset.speed) === speed),
      );
  }
});
let practice=null,practiceScenario="shielded",practiceComparisons={};
let uiTick = 0;
function frame(now) {
  tickAmbientBackgrounds(now,{reducedMotion:profile.reducedMotion});
  const dt = Math.min((now - last) / 1000, 0.08);
  last = now;
  if(practice&&modalKind==="practice"){if(!practice.done)practice.step(dt);else finishNativeVisuals(practice,dt);const pc=$("#practice-canvas");if(pc)renderBattle(pc.getContext("2d"),pc.width,pc.height,practice,Math.min(run.planet,2),practice.time,practice.run.team,[],);const status=$("#practice-status");if(status)status.textContent=practice.done?"Comparison finished. Change a relic or run the other comparison.":"Practice · "+practice.time.toFixed(1)+"s";if(practice.done&&!practice.recorded){practice.recorded=true;practiceComparisons[practiceScenario]??={};practiceComparisons[practiceScenario][practice.baseline?"baseline":"linked"]=practiceResult(practice);showPracticeResults();}}
  deployment.update(dt);
  if(modalKind==="settings")drawTuningPreview(now/1000);
  if(victoryFilm){victoryFilm.elapsed+=dt;if(victoryFilm.elapsed>=1.25){victoryFilm=null;openRewards();}}
  if(defeatFilm){defeatFilm.elapsed+=dt;if(defeatFilm.elapsed>=2){defeatFilm=null;openRewards();}}
  if (phase === "battle" && battle && !paused) {
    let remaining = dt * (battle.captureScene?1:speed);
    while (remaining > 0 && (!battle.done||battle.captureScene)) {
      const step = Math.min(0.04, remaining);
      battle.step(step);
      settleTacticalCapture();
      remaining -= step;
    }
    if (battle.done&&!battle.captureScene) finishBattle();
    if (profile.sound) {
      soundscape.update(battle.time, run.planet);
      const events = battle.audioEvents.splice(0);
      for (const event of events) soundscape.event(event);
    } else battle.audioEvents = [];
  }
  if (battle?.done && !paused) {
    finishNativeVisuals(battle,dt);
    battle.finishedVisualTime = Math.min(
      2,
      (battle.finishedVisualTime || 0) + dt,
    );
  }
  if(battle?.native)battle.selectedUid=liveSelectedUid||run.team[selectedCreature]?.uid;
  if (ctx && canvas)
    renderBattle(
      ctx,
      canvas.width,
      canvas.height,
      battle,
      Math.min(run.planet, 2),
      now / 1000,
      phase==="prep"?run.team.map(c=>deployment.preview(c)):run.team,
      foes || [],
    );
  drawEnemyOverheads();drawAllyOrders();updateLiveStatus();drawGroundLoot(now/1000);drawDefeatFilm();
  if (battle && viewName === "arena" && now - uiTick > 150) {
    uiTick = now;
    const boss = battle.units.find((u) => u.boss);
    if (boss && $("#boss-health")) {
      $("#boss-health").style.width = `${(boss.hp / boss.maxHp) * 100}%`;
      $("#boss-phase").textContent =
        boss.hp <= 0
          ? "DEFEATED"
          : ["PHASE I", "PHASE II", "PHASE III"][(boss.phase || 1) - 1];
    }
    refreshLiveRoster();
    updateEnrage();
    const timer = $("#arena-timer");
    if (timer)
      timer.textContent = `${paused ? "II " : ""}${String(Math.floor(battle.time / 60)).padStart(2, "0")}:${String(Math.floor(battle.time % 60)).padStart(2, "0")}`;
    if ($("#ally-count"))
      $("#ally-count").textContent =
        `YOUR EXPEDITION · ${battle.living(0).length} / ${capacity(run)}`;
    if ($("#foe-count"))
      $("#foe-count").textContent =
        `THE WILDS · ${battle.living(1).length} / ${foes.length}`;
    if ($("#feed-text")) {
      $("#feed-text").textContent = battle.log[0]?.text || "";
      $("#feed-time").textContent = `${battle.log[0]?.time || 0}s`;
    }
    document.querySelectorAll("[data-creature]").forEach((el, i) => {
      const u = battle.units.find((u) => u.uid === run.team[i].uid);
      if (u) {
        for (const a of el.querySelectorAll("[data-unit-skill]")) {
          const id = a.dataset.unitSkill.split(":")[1];
          const cd = u.cooldowns[id];
          a.classList.toggle("ready", !cd || cd.remaining <= 0);
          if (cd)
            a.querySelector("i").style.height =
              `${(Math.max(0, cd.remaining) / cd.total) * 100}%`;
        }
        const intent=el.querySelector("[data-intent]");if(intent&&battle.native)intent.textContent=u.hp<=0?"Fallen":u.intention||"Ready";
        el.classList.toggle("fallen", u.hp <= 0);
        el.querySelector(".card-health").style.width =
          `${(u.hp / u.maxHp) * 100}%`;
      }
    });
  }
  if(modalKind==="roster")drawRoster(now/1000);
  drawIdlePortraits(now);
  requestAnimationFrame(frame);
}
document.addEventListener("input",e=>{if(e.target.matches("[data-tuning]")){applyTuning({...profile.tuning,[e.target.dataset.tuning]:Number(e.target.value)});return;}if(e.target.matches("[data-character-height]")){profile.tuning=setTuning(profile.tuning||DEFAULT_TUNING);
profile.characterHeight=Math.max(85,Math.min(110,Number(e.target.value)||100));setCharacterHeight(profile.characterHeight/100);document.querySelectorAll("[data-character-height]").forEach(el=>el.value=profile.characterHeight);document.querySelectorAll("[data-height-value]").forEach(el=>el.textContent=profile.characterHeight+"%");save();updateHeader();}});
document.addEventListener("change", (e) => {
  const el = e.target;
  if(el.dataset.starterFilter||el.dataset.starterSort){
    if(el.dataset.starterFilter==='type')starterTypeFilter=el.value;
    if(el.dataset.starterFilter==='cost')starterCostFilter=el.value;
    if(el.dataset.starterSort)starterSort=el.value;
    if($('.companion-scroll'))$('.companion-scroll').scrollTop=0;
    openStarters(false);return;
  }
  if(el.dataset.roster!==undefined){const key=el.dataset.roster;if(key==="family"){rosterFamily=el.value;rosterForm=0;}if(key==="state")rosterState=el.value;if(key==="form")rosterForm=Number(el.value);if(key==="path")rosterPath=el.value;openRoster();return;}
  if(el.id==="practice-scenario"&&PRACTICE_SCENARIOS[el.value]){practiceScenario=el.value;openPractice();return;}
  if (el.id === "chaos-tier") {
    selectedChaos = Math.max(
      1,
      Math.min(profile.chaosUnlocked || 1, Number(el.value)),
    );
    openStarters(false);
    return;
  }
  if (
    el.id === "capture-target" &&
    phase === "prep" &&
    !run.captureReservation
  ) {
    run.captureOrder = el.value
      ? { uid: el.value, mode: run.captureOrder?.mode || "mercy",threshold:run.captureOrder?.threshold||.35,tool:run.captureOrder?.tool||"scout" }
      : null;
    save();
    render();
    return;
  }
  if(el.id==="reward-capture-tool"&&phase==="reward"&&!captureAttempted){run.selectedCapturer=el.value;save();openRewards();return;}
  if(["capture-threshold","capture-tool"].includes(el.id)&&phase==="prep"&&!run.captureReservation){if(el.id==="capture-tool"){run.selectedCapturer=el.value;if(run.captureOrder)run.captureOrder.tool=el.value;}else if(run.captureOrder)run.captureOrder.threshold=Number(el.value)/100;save();render();return;}
  if (
    el.id === "capture-mode" &&
    phase === "prep" &&
    run.captureOrder &&
    !run.captureReservation
  ) {
    run.captureOrder.mode = el.value;run.captureOrder.threshold=el.value==="mercy"?.35:.55;
    save();
    render();
    return;
  }
  if (
    el.id === "reward-capture-target" &&
    phase === "reward" &&
    !captureAttempted
  ) {
    captureTarget = foes.find((f) => f.uid === el.value && !f.boss);
    save();
    openRewards();
    return;
  }
  if(el.matches('[data-native-order],[data-rule-when],[data-rule-do]')&&phase!=='battle'){
    const formation=modalKind==='formation';
    if(el.dataset.nativeOrder!==undefined){const i=Number(el.dataset.nativeOrder);if(ORDERS[el.value])run.team[i].order=el.value;}
    else{const [i,slot]=String(el.dataset.ruleWhen||el.dataset.ruleDo).split(':').map(Number),u=run.team[i];u.rules??=[{when:'none',do:'retreat'},{when:'none',do:'protect'}];u.rules[slot]??={when:'none',do:'retreat'};if(el.dataset.ruleWhen&&CONDITIONS[el.value])u.rules[slot].when=el.value;if(el.dataset.ruleDo&&RESPONSES[el.value])u.rules[slot].do=el.value;selectedCreature=i;}
    save();render();formation?openFormation():openCreature(selectedCreature);return;
  }
  if (el.matches("[data-policy]") && phase !== "battle") {
    const i = Number(el.dataset.policy);
    if (POLICIES[el.value]) {
      const formation = modalKind === "formation";
      run.team[i].policy = el.value;
      save();
      render();
      if(!el.dataset.quickAi)formation ? openFormation() : openCreature(i);
    }
    return;
  }

});
render();
save();
requestAnimationFrame(frame);
if (phase === "reward") openRewards();
if (phase === "shop") openShop();
if (phase === "event") openEvent();
if (phase === "rest") openRest();
if (phase === "ended") openEnd();
if (!saved?.run) openStarters();
showLogoIntro({reducedMotion:profile.reducedMotion});
// Read-only inspection for deterministic playtesting and debugging. No gameplay shortcuts.
function legendaryPactBanner(){
  if(!run.relics.includes('sovereigns-seat'))return '';
  return `<div class="legendary-pact-banner"><strong>✦ SOVEREIGN’S SEAT</strong><p>${run.legendaryPact?'One active place exchanged for '+BY_ID[run.legendaryPact].name+'.':'Trade one active place for your choice of any Legendary. Existing companions move to Reserves when needed.'}</p>${!run.legendaryPact?button('Choose your Legendary','legendary-pact','secondary',phase==='battle'):''}</div>`;
}
function openLegendaryPact(){
  if(phase==='battle'||run.legendaryPact||!run.relics.includes('sovereigns-seat'))return;
  modal(`<span class="section-kicker">SOVEREIGN’S SEAT</span><h2>One throne. One extraordinary ally.</h2><p>Choosing below permanently reduces your active capacity from ${capacity(run)} to ${capacity(run)-1} for this expedition. Your Legendary waits in Reserves. Move it into your team before the next battle.</p><div class="gear-grid legendary-choice">${SPECIES.filter(s=>s.rarity==='Legendary').map(s=>`<button data-pact-creature="${s.id}" ${run.bench.length+Math.max(0,run.team.length-capacity(run)+1)+1>12?'disabled':''}>${image(creature(s.id))}<strong>${s.name}</strong><small>${s.role} · ${ELEMENTS[s.element].name}</small></button>`).join('')}</div>`,'legendary-pact');
}
async function flyLootToTotals(){await animateRewardCollection(profile.reducedMotion);}

window.starfall = {
  get state() {
    return { run, phase, node, foes, battle, profile, view: viewName, practice, deployment };
  },
};
function loadoutHTML(u,index){const slots=relicSlots(u),items=u.relics||[];return `<section class="personal-loadout" data-loadout-drop="${index}"><div class="section-heading"><h3>PERSONAL RELICS</h3><span>${items.length} / ${slots} SLOTS</span></div><p>Relics change this companion’s entire build. No skill links. Remove or move freely before battle.</p><div class="relic-slots">${Array.from({length:slots},(_,slot)=>{const g=items[slot],r=g&&PERSONAL_BY_ID[g.id];return `<div class="relic-slot ${r?'equipped':''}" style="--relic:${r?.color||'#728666'}"><span>${r?.icon||'＋'}</span><strong>${r?.name||'Empty relic slot'}</strong><small>${r?relicDescription(r):'Drop a personal relic onto this creature'}</small>${r&&index!==null?`<button data-unequip="${slot}" data-index="${index}" ${phase==='battle'?'disabled':''}>Remove</button>`:''}</div>`;}).join('')}</div>${index!==null?`<div class="personal-inventory" data-pack-drop="true">${run.inventory.map(g=>{const r=PERSONAL_BY_ID[g.id];return `<button data-equip="${g.uid}" data-index="${index}" ${phase==='battle'||items.length>=slots||items.some(x=>x.id===g.id)?'disabled':''}><span style="color:${r.color}">${r.icon}</span><strong>${r.name}</strong><small>${relicDescription(r)}</small></button>`;}).join('')||'<p>Find personal relics in rewards or buy them at an outpost.</p>'}</div>`:''}</section>`;}
function policyHTML(u, index) {
  const policy = POLICIES[u.policy || "adaptive"] || POLICIES.adaptive;
  return nativeOrdersHTML(u,index)+`<label class="policy-control"><span class="section-kicker">CREATURE AI POLICY</span><select data-policy="${index}" ${phase === "battle" ? "disabled" : ""}>${Object.entries(
    POLICIES,
  )
    .map(
      ([id, p]) =>
        `<option value="${id}" ${(u.policy || "adaptive") === id ? "selected" : ""}>${p.name}</option>`,
    )
    .join("")}</select><small>${policy.desc}</small></label>`;
}
function nativeOrdersHTML(u,index){
 if(!run.native)return '';
 const order=u.order||'advance';
 return `<div class="native-orders"><label class="policy-control">FORMATION ORDER<select data-native-order="${index}" ${phase==='battle'?'disabled':''}>${Object.entries(ORDERS).map(([id,o])=>`<option value="${id}" ${order===id?'selected':''}>${o.name}</option>`).join('')}</select><small>${ORDERS[order]?.desc||ORDERS.advance.desc}</small></label><span class="section-kicker">TWO CONDITIONAL ORDERS · TOP RULE FIRST</span>${[0,1].map(slot=>{const rule=u.rules?.[slot]||{};return `<div class="native-rule"><label>When<select data-rule-when="${index}:${slot}" ${phase==='battle'?'disabled':''}>${Object.entries(CONDITIONS).map(([id,name])=>`<option value="${id}" ${rule.when===id?'selected':''}>${name}</option>`).join('')}</select></label><label>Respond<select data-rule-do="${index}:${slot}" ${phase==='battle'?'disabled':''}>${Object.entries(RESPONSES).map(([id,name])=>`<option value="${id}" ${rule.do===id?'selected':''}>${name}</option>`).join('')}</select></label></div>`;}).join('')}<small>Matching rules override the base AI policy; otherwise the formation order and policy apply. Charged enemies cannot be interrupted.</small></div>`;
}
function tacticalHTML() {
  const editable = phase === "prep",
    targets = (foes || []).filter((f) => !f.boss),
    plan = run.captureOrder;
  return `<section class="tactical-toolbar"><div class="tactical-toolbar-head"><span class="section-kicker">PLAN BEFORE THE GATES OPEN</span>${button("▦ Deployment & AI", "formation", "secondary small", phase === "battle")}${run.native?button("Build practice", "practice", "secondary small", phase === "battle"||!run.team.length)+button("Roster & forms","roster","secondary small")+heightControl():""}${button(`Defeat rules`, "field-care", "secondary small", phase === "battle")}${run.team.length < capacity(run) ? button(`Reserves · ${run.team.length}/${capacity(run)}`, "reserves", "secondary small", phase === "battle") : ""}${button(profile.reducedMotion ? "Motion: gentle" : "Motion: full", "motion", "ghost small")}</div><p class="arena-legend">Gold bars below health: stamina · orange bars: poise. Click an enemy to focus it for 8s; taunts and nearby threats still matter. Enemy windups show red arcs or lines. Roots stop dodge rolls; stagger interrupts attacks; bleed worsens while moving. Native charged strikes resist interruption. Armor reduces direct hits with diminishing returns; Guardians use it better. Hover over an ailment to learn its effect.</p>${targets.length && editable ? `<div class="capture-planner"><label>TACTICAL CAPTURE<select id="capture-target" ${run.orbs < 1 || run.captureReservation ? "disabled" : ""}><option value="">No capture order</option>${targets.map((f) => `<option value="${f.uid}" ${plan?.uid === f.uid ? "selected" : ""}>${creatureName(f)} · ${BY_ID[f.id].rarity}</option>`).join("")}</select></label><label>APPROACH<select id="capture-mode" ${!plan || run.captureReservation ? "disabled" : ""}><option value="mercy" ${plan?.mode !== "swift" ? "selected" : ""}>Mercy · hold back 14% damage</option><option value="swift" ${plan?.mode === "swift" ? "selected" : ""}>Swift · hold back 6% damage</option></select></label>${captureControlsHTML()}<p>${plan ? `Reserves 1 capturer when battle starts. ${plan.mode === "swift" ? "6%" : "14%"} less team damage until the throw. Weakening and statuses raise odds. Lower HP sharply improves the chance. There is no protection from lethal damage.` : "Select a wild target to automate a capture during combat. Captures only happen when preselected. Lower HP improves odds but a lethal hit can knock the target out first."}</p></div>` : ""}${run.captureReservation ? `<p class="reservation-note">Capturer committed. Reloading preserves the reservation and any resolved result.</p>` : ""}${run.contracts?.length ? `<p class="reservation-note">Contract active: next enemy team gains ${Math.round(run.contracts.reduce((n, c) => n + (c.attack || 0), 0) * 100)}% attack and ${Math.round(run.contracts.reduce((n, c) => n + (c.health || 0), 0) * 100)}% health.</p>` : ""}</section>`;
}
function openFormation() {
  if (!run.team.length) {
    openReserves();
    return;
  }
  formationSelection = Math.max(
    0,
    Math.min(formationSelection, run.team.length - 1),
  );
  const selected = run.team[formationSelection];
  modal(
    `<span class="section-kicker">DEPLOYMENT · ENEMIES APPROACH FROM THE RIGHT</span><h2>Give everyone a place.</h2><p>Choose a companion, then a cell. Occupied cells swap companions. Protectors cover nearby allies; spread rows against artillery.</p><div class="formation-team-stance" aria-label="Team AI priority">${["balanced","hunt","guard","weakest"].map(id=>`<button data-stance="${id}" class="${run.stance===id?'active':''}" ${phase==='battle'?'disabled':''}>${{balanced:'Balanced',hunt:'Hunt',guard:'Guard',weakest:'Weakest first'}[id]}</button>`).join('')}</div><div class="formation-picker">${run.team.map((c, i) => `<button data-formation-unit="${i}" class="${i === formationSelection ? "selected" : ""}">${image(c)}<span>${creatureName(c)}</span></button>`).join("")}</div><div class="formation-columns"><span>BACKLINE</span><span>MIDFIELD</span><span>FRONTLINE →</span></div><div class="deployment-grid">${Array.from(
      { length: 9 },
      (_, cell) => {
        const row = Math.floor(cell / 3),
          column = cell % 3;
        const occupants = run.team.filter((c, i) => {
          const d = c.deployment || defaultDeployment(c, i);
          return d.row === row && d.column === column;
        });
        return `<button data-deploy="${row}:${column}" ${phase === "battle" ? "disabled" : ""} class="${occupants.includes(selected) ? "selected" : ""}" aria-label="Deploy ${creatureName(selected)} in row ${row + 1}, column ${column + 1}">${occupants.length ? occupants.map((c) => image(c)).join("") : "<span>+</span>"}<small>ROW ${row + 1}</small></button>`;
      },
    ).join(
      "",
    )}</div>${policyHTML(selected, formationSelection)}${tacticalHTML()}<div class="modal-actions">${button("Formation ready →", "close")}</div>`,
    "formation",
  );
}

function heightControl(){return `<label class="height-control">Character height <input type="range" min="85" max="110" step="1" value="${profile.characterHeight}" data-character-height aria-label="Character height"><output data-height-value>${profile.characterHeight}%</output></label>`;}
function familyInfo(u){const s=BY_ID[u.id];if(!s.nativeRig)return '';const worlds=NATIVE_POOLS.map((ids,i)=>ids.includes(s.id)?PLANETS[i].name:null).filter(Boolean);return `<div class="family-info"><strong>${s.powerBand} raw power · ${lineageLimit(u)+1} total forms</strong><p>Habitat: ${worlds.join(', ')}. ${s.recruit==='elite'?'Elite encounters or capture sites; also outpost recruitment.':'Wild encounters and outpost recruitment.'} Capture to retain this family for future runs.</p></div>`;}
function openRoster(){
 const s=BY_ID[rosterFamily],limit=lineageLimit({id:rosterFamily});rosterForm=Math.min(rosterForm,limit);
 modal(`<span class="section-kicker">ROSTER ATELIER · ${PIXEL_SPECIES.length} PIXEL FAMILIES</span><h2>Meet their many forms.</h2><div class="roster-controls"><label>Family<select data-roster="family">${PIXEL_SPECIES.map(s=>`<option value="${s.id}" ${s.id===rosterFamily?'selected':''}>${s.name} · ${s.rarity}</option>`).join('')}</select></label><label>Motion<select data-roster="state">${NATIVE_POSES.map(state=>`<option value="${state}" ${state===rosterState?'selected':''}>${state}</option>`).join('')}</select></label><label>Form<select data-roster="form">${Array.from({length:limit+1},(_,i)=>`<option value="${i}" ${i===rosterForm?'selected':''}>${i===0?'Base':i===1?'Evolved':'Ascendant'}</option>`).join('')}</select></label>${limit?`<label>Branch<select data-roster="path"><option value="wild" ${rosterPath==='wild'?'selected':''}>Wild</option><option value="warden" ${rosterPath==='warden'?'selected':''}>Warden</option></select></label>`:''}</div>${heightControl()}<canvas id="roster-canvas" width="768" height="360" aria-label="Eight directional views of the selected creature animation"></canvas>${familyInfo({id:rosterFamily})}<p>${s.skillDesc||"Retained collection family, rebuilt with the pixel animation rig."}</p><p class="muted">All forms use 64 × 64 cells and eight directions. Arena size: ${Math.round(creatureTypeFactor(pixelSpec(s.id),{evolution:rosterForm})*100)}% of the default, capped at ${MAX_CREATURE_TYPE_FACTOR*100}%. The atelier shows each form at equal cell size for a fair visual comparison. Previewing a form does not unlock or evolve it in your expedition.</p>${button('Return to expedition','close','secondary')}`,'roster');drawRoster(performance.now()/1000);
}
function drawRoster(time){
 const canvas=$('#roster-canvas');if(!canvas)return;const ctx=canvas.getContext('2d'),phase=(Math.floor(time*12)%16)/16;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#172c25';ctx.fillRect(0,0,768,360);
 for(let dir=0;dir<8;dir++){const x=96+(dir%4)*192,y=145+Math.floor(dir/4)*176;ctx.fillStyle='#0c1e1b';ctx.beginPath();ctx.ellipse(x,y,32,8,0,0,Math.PI*2);ctx.fill();ctx.drawImage(nativePreviewFrame({id:rosterFamily,evolution:rosterForm,evolutionPath:rosterPath},rosterState,phase,dir),x-96,y-132,192,192);ctx.fillStyle='#c0d2b5';ctx.textAlign='center';ctx.font='12px sans-serif';ctx.fillText(['E','SE','S','SW','W','NW','N','NE'][dir],x,y+30);}
}
window.nativeRosterLab={exportAtlas:exportNativeAtlas,get state(){return {family:rosterFamily,form:rosterForm,path:rosterPath,motion:rosterState,height:profile.characterHeight};}};

function openPractice(){
  practice=null;
  modal(`<span class="section-kicker">BUILD PRACTICE · NO EXPEDITION REWARDS</span><h2>See what your build does.</h2><p>Use your current levels, training, evolution and orders against practice targets that attack gently. Baseline removes personal and expedition relics. Your run, gold, captures and EXP stay intact.</p><label class="policy-control">TARGETS<select id="practice-scenario">${Object.entries(PRACTICE_SCENARIOS).map(([id,name])=>`<option value="${id}" ${practiceScenario===id?'selected':''}>${name}</option>`).join('')}</select></label><div class="practice-actions"><button class="button secondary" data-practice="baseline">Run baseline</button><button class="button" data-practice="linked">Run current build</button></div><canvas id="practice-canvas" width="1002" height="654" aria-label="Current team fighting practice targets"></canvas><p id="practice-status">Choose a comparison to start.</p><div id="practice-results"></div>${button('Return to expedition','close','secondary')}`,'practice');
  showPracticeResults();
}
function showPracticeResults(){
 const el=$('#practice-results');if(!el)return;
 const values=practiceComparisons[practiceScenario]||{};
 el.innerHTML=['baseline','linked'].filter(key=>values[key]).map(key=>{const r=values[key];return `<p><strong>${key==='baseline'?'Baseline':'Current build'}</strong> · ${r.seconds.toFixed(1)}s · ${r.damage} damage · ${r.healing} healing · ${r.shieldDamage} shield damage · ${r.whiffs} misses · ${r.skills} skills</p>`;}).join('');
}
function difficultyHTML() {
  const tier = selectedDifficulty === "chaos" ? selectedChaos : 0;
  return `<section class="difficulty-panel"><span class="section-kicker">CHOOSE YOUR CHALLENGE</span><div class="difficulty-options">${Object.entries(
    DIFFICULTIES,
  )
    .map(
      ([id, d]) =>
        `<button data-difficulty="${id}" class="${selectedDifficulty === id ? "selected" : ""}" aria-pressed="${selectedDifficulty===id}" ${id === "chaos" && !profile.chaosUnlocked ? "disabled" : ""}><i class="challenge-emblem ${id}" aria-hidden="true"></i><span><strong>${d.name}</strong><small>${id === "chaos" && !profile.chaosUnlocked ? "Win an expedition to unlock twenty cumulative challenge tiers." : id === "story" ? "Learn combinations. Enemies have 20% less health and damage." : d.desc}</small></span></button>`,
    )
    .join("")}</div>${
    selectedDifficulty === "chaos"
      ? `<label class="chaos-picker">CHAOS TIER<select id="chaos-tier">${Array.from({ length: profile.chaosUnlocked || 1 }, (_, i) => `<option value="${i + 1}" ${i + 1 === tier ? "selected" : ""}>Chaos ${i + 1} / 20${i + 1 <= (profile.chaosCleared || 0) ? " · CLEARED" : ""}</option>`).join("")}</select></label><details class="chaos-rules" open><summary>${tier} cumulative challenge rules</summary><ol>${CHAOS_TIERS.slice(
          0,
          tier,
        )
          .map((rule, i) => `<li><b>${i + 1}.</b> ${rule}</li>`)
          .join("")}</ol></details>`
      : ""
  }<div class="team-chaos-benefit"><strong>Greater challenges. More possibilities.</strong><p>Clear each new Chaos tier for +1 permanent starter point. Clear tier 3 for a third starting place.</p></div></section>`;
}
function openAdoption() {
  modal(
    `<span class="section-kicker">CELESTIAL ADOPTION · ${profile.starlight || 0} STARLIGHT</span><h2>A victory written in the stars.</h2><p>Each completed expedition grants three starlight. Spend three to permanently unlock one Legendary family. Your current starter budget is ${starterBudget(profile)} points.</p><div class="adoption-grid">${SPECIES.filter(
      (s) => s.rarity === "Legendary",
    )
      .map(
        (s) =>
          `<button data-adopt="${s.id}" ${profile.owned.includes(s.id) || (profile.starlight || 0) < 3 ? "disabled" : ""}>${image(s.id)}<strong>${s.name}</strong><small>${profile.owned.includes(s.id) ? "Already discovered" : "3 starlight · Permanent starter"}</small></button>`,
      )
      .join("")}</div>${button("Back to menagerie", "close", "secondary")}`,
    "adoption",
  );
}
function settleTacticalCapture() {
  if (
    !battle?.captureResult ||
    !run.captureReservation ||
    (run.captureReservation.result&&run.captureReservation.result.attempt===battle.captureResult.attempt)
  )
    return;
  const result = battle.captureResult;
  run.captureReservation.attempts=battle.captureAttempts;run.captureReservation.history=JSON.parse(JSON.stringify(battle.captureHistory));
  run.captureReservation.result = JSON.parse(JSON.stringify(result));
  run.captureReservation.result.refunded=refundCapture(run,result,`tactical:${run.planet}:${run.depth}:${result.uid}:${result.attempt}`,node.seed+(result.attempt||1)*313);
  if (result.success) {
    const caught = result.creature;
    caught.bond = recordBond(profile, caught.id);
    rememberEliteCapture(profile,result);
    run.captureReservation.result.creature.bond = caught.bond;
    discoverForm(caught);
    unlock(caught.id);
  }
  announceCapture(result);save();
}
function skillSummary(u, id) {
  const def = skillDefinition(u,id),
    m = linkedSupport(u, id),
    parts = [];
  if (def.power)
    parts.push(
      `${Math.round(def.power * m.damage * 100)}% ATK${m.execute ? ` · +${Math.round(m.execute * 100)}% below 30% HP` : ""}`,
    );
  if (def.heal) parts.push(`${Math.round(def.heal * m.healing)} base healing`);
  if (def.radius) parts.push(`${Math.round(def.radius * m.area)} radius`);
  if (m.targets) parts.push(`+${m.targets} targets`);
  if (m.echo) parts.push(`echo ${Math.round(m.echo * 100)}%`);
  if (m.fork) parts.push(`${m.fork} bounces`);
  if (m.pierce) parts.push(`${Math.round(m.pierce * 100)}% shield bypass`);
  if (m.wither) parts.push("55% less enemy healing");
  if (m.chill) parts.push(`${m.chill}s slow`);
  if (m.overheal)
    parts.push(`${Math.round(m.overheal * 100)}% excess heal → shield`);
  if (def.auto && !["bolt", "chain", "beam"].includes(def.kind))
    parts.push("Aimed swing · windup + recovery · may miss");
  if (
    ["bolt", "salvo"].includes(def.kind) ||
    (def.auto && def.kind === "chain")
  )
    parts.push("Straight-flying shots · bodies can screen targets");
  if (def.kind === "beam") parts.push("Committed beam · telegraphed line");
  if (["dash", "blink", "charge"].includes(def.kind))
    parts.push("Physical dash · committed direction · may miss");
  if (def.evade)
    parts.push(
      "Evasion shortens roll cooldown; it does not cancel connected hits",
    );
  if (
    def.kind === "cleave" ||
    (def.auto &&
      BY_ID[u.id].role === "Guardian" &&
      !["bolt", "chain", "beam"].includes(def.kind))
  )
    parts.push("Heavy melee causes 3s bleed; movement worsens bleed");
  return parts.join(" · ") + " · before team bonuses and target defenses";
}
function skillsHTML(u, index) {
  const s = BY_ID[u.id],
    loadout = loadoutFor(s, u.level, u),
    st = stats(
      u,
      index === null ? [u] : run.team,
      index === null ? [] : run.relics,
    );
  if(u.skillOrder)loadout.active.sort((a,b)=>(u.skillOrder.includes(a)?u.skillOrder.indexOf(a):99)-(u.skillOrder.includes(b)?u.skillOrder.indexOf(b):99));
  return `<div class="ability-heading"><span class="section-kicker">SIGNATURE AUTO-ATTACK + ${loadout.active.length} COOLDOWN SKILLS</span><span class="muted">AI CASTS AUTOMATICALLY</span></div><div class="ability-list">${[
    loadout.auto,
    ...loadout.active,
  ]
    .map((id) => {
      const def = skillDefinition(u,id),
        m = linkedSupport(u, id);
      return `<div class="skill-detail" data-skill-drop="${id}" data-index="${index}" style="--element:${def.color || ELEMENTS[s.element].color}"><span class="skill-icon">${artImage(skillArt({...def,id}))}</span><div><h3>${def.name}<small>${def.auto ? "AUTO-ATTACK" : (def.cd * st.cdFactor * m.cooldown).toFixed(1) + " SEC"}</small></h3><p>${def.desc}</p><p class="effective-skill">${skillSummary(u, id)}</p></div></div>`;
    })
    .join("")}</div>`;
}

function openPack() {
  modal(
    `<span class="section-kicker">PERSONAL RELICS · EXPEDITION INVENTORY</span><h2>A little something special.</h2><p>Drag a relic onto a companion. Its entire build changes. Rarer creatures have more relic slots; every item keeps its identity when moved.</p><div class="personal-inventory">${
      run.inventory.length
        ? run.inventory
            .map((item) => {
              const r = PERSONAL_BY_ID[item.id];
              return `<button class="inventory-item" data-pack-relic="${item.uid}" ${phase === "battle" ? "disabled" : ""}><span style="color:${r.color}">${r.icon}</span><div><strong>${r.name}</strong><small>${relicDescription(r)}</small></div><b>→</b></button>`;
            })
            .join("")
        : "<p>Your pack is empty. Buy personal relics or choose one as a battle reward.</p>"
    }</div><div class="modal-actions">${button("Back to expedition", "close", "secondary")}</div>`,
    "pack",
  );
}
function openEquipTarget(uid) {
  const item = run.inventory.find((i) => i.uid === uid);
  if (!item) return;
  const r = PERSONAL_BY_ID[item.id];
  modal(
    `<span class="section-kicker">EQUIP A PERSONAL RELIC</span><h2>${r.name}.</h2><p>${relicDescription(r)} Choose the creature that will benefit most.</p><div class="starter-grid">${run.team.map((c, i) => `<button class="starter-card" data-pack-target="${i}" data-item="${uid}" ${(c.relics || []).length >= relicSlots(c) || c.relics?.some((r) => r.id === item.id) || phase === "battle" ? "disabled" : ""}>${image(c)}<strong>${BY_ID[c.id].name}</strong><small>${c.relics?.length || 0} / ${relicSlots(c)} slots filled</small></button>`).join("")}</div><div class="modal-actions">${button("Back to expedition", "close", "secondary")}</div>`,
    "equip",
  );
}

function equipmentHTML(u,index,includePack=true){
 const slots=equipmentSlots(u),editable=index!==null&&phase!=='battle',equipped=u.equipment||[],pending=Math.max(0,(u.evolution||0)-(u.gearClaimed||0));
 const cache=editable&&pending>0?`<p>Evolution gear cache · ${pending} unclaimed. Choose one.</p><div class="gear-grid">${['sunsteel-edge','reliquary-plate','mooncloth-mantle'].map(id=>`<button data-gear-claim="${id}" data-index="${index}"><strong>${GEAR_BY_ID[id].name}</strong><small>${equipmentDescription(GEAR_BY_ID[id],u)}</small></button>`).join('')}</div>`:'';
 return `<section class="equipment-panel" data-loadout-drop="${index}">${editable?`<div class="loadout-recipients">${run.team.map((c,i)=>`<button data-loadout-drop="${i}" data-switch-creature="${i}" class="${i===index?'selected':''}">${image(c)}<span>${creatureName(c)}</span></button>`).join('')}</div>`:''}<div class="section-heading"><h3>CHARACTER EQUIPMENT</h3><span>${equipped.length} / ${slots} SLOTS</span></div><p>Three starting equipment slots. Each evolution opens another. Passives affect the character’s attacks, skills, movement and defenses.${u.equipmentQuality?` Equipment quality: ${Math.round(u.equipmentQuality*100)}%.`:''}</p>${cache}<div class="gear-grid">${equipped.map((id,i)=>{const g=GEAR_BY_ID[id];return `<button data-gear-remove="${i}" data-gear-slot="${i}" data-loadout-drop="${index}" data-index="${index}" ${editable?'':'disabled'}><strong>${g.name}</strong><small>${equipmentDescription(g,u)}${editable?'<br>Drag to an ally or return to pack':''}</small></button>`;}).join('')}${editable?Array.from({length:Math.max(0,slots-equipped.length)},(_,i)=>`<div class="gear-slot-empty" data-loadout-drop="${index}" data-gear-slot="${equipped.length+i}"><span>＋</span><small>Drop equipment here</small></div>`).join(''):''}</div>${editable&&includePack?`<div class="pack-drop" data-pack-drop="true">Drop equipped gear or personal relics here to return them to the pack.</div><div class="gear-grid">${(run.gearInventory||[]).map(g=>`<button data-gear-equip="${g.uid}" data-index="${index}" ${(equipped.includes(g.id)||equipped.length>=slots)?'disabled':''}><strong>${GEAR_BY_ID[g.id].name}</strong><small>${equipmentDescription(GEAR_BY_ID[g.id],u)}<br>Drag onto a creature or click to equip →</small></button>`).join('')||'<small>Find equipment in difficult encounters or buy it at an outpost.</small>'}</div>`:''}</section>`;
}
function gearShopHTML(stock){return `<div class="thin-rule"></div><span class="section-kicker">CHARACTER EQUIPMENT</span><p>Equipment affects the whole companion. Build around triggers and tradeoffs.</p><div class="gear-grid">${stock.gear.map(id=>{const g=GEAR_BY_ID[id],sold=stock.sold.includes('gear:'+id);return `<div><strong>${g.name}</strong><p>${equipmentDescription(g)}</p>${button(sold?'✓ In your pack':`◉ ${shopPrice(run,g.cost)}`,'buy-gear-'+id,'secondary small',sold||run.gold<shopPrice(run,g.cost))}</div>`;}).join('')}</div>`;}

function teamSeatHTML(seat){const index=run.team.findIndex(c=>c.seat===seat),c=run.team[index];if(c)return `<div class="companion-loadout">${creatureCard(c,index)}${quickEquipmentHTML(c,index)}</div>`;if(seat>=capacity(run))return `<div class="creature-card locked-seat"><span>⌑</span><strong>${run.legendaryPact&&seat===5?'Sacrificed place':'Locked place'}</strong><small>${run.legendaryPact&&seat===5?'Sovereign’s Seat':'Unlock at '+([2,5,8,11][seat-2+(run.legendaryPact?1:0)]||11)+' wins'}</small></div>`;const fallen=run.fallen.filter(c=>c.seat===seat).at(-1);return `<button data-seat-drop="${seat}" class="creature-card empty-slot ${fallen?'fallen-seat':''}" data-action="reserves" ${phase==='battle'?'disabled':''}>${fallen?image(fallen):'<span>+</span>'}${fallen?'<b class="death-cross">✕</b>':''}<strong>${fallen?'Fallen · '+fallen.name:'Open place'}</strong><small>Deploy a reserve · ${run.team.length}/${capacity(run)}</small></button>`;}
function individualHTML(c){return c.genes?`<section class="individual-rolls"><strong>${c.nature} individual</strong><p>HP ${Math.round(c.genes.hp*100)}% · Attack ${Math.round(c.genes.atk*100)}% · Speed ${Math.round(c.genes.speed*100)}% · cooldown time ${Math.round(c.genes.cd*100)}%. Capturing borrows this individual for the current round and unlocks its family for future starts.</p></section>`:'';}
function enemyCuriosHTML(c){const ids=c.enemyRelics||c.boundRelics||[],loot=c.enemyRelics||c.side===1?`<section class="enemy-loot-preview"><strong>Equipment drop · ${Math.round(equipmentDropChance(c,BY_ID[c.id],node?.type)*100)}%</strong><p>${BY_ID[c.id].rarity} opponent · loot is drawn from its worn gear. Higher rarity means better item-quality rolls.</p></section>`:'';return loot+(ids.length?`<section class="individual-rolls enemy-curios"><strong>${c.enemyRelics?'Enemy':'Bound'} curios</strong>${ids.map(id=>{const r=RUN_RELIC_BY_ID[id];return `<p style="color:${r.color}">${r.icon} <b>${r.name}</b> · ${relicDescription(r)}</p>`;}).join('')}</section>`:'');}
function captureControlsHTML(){const plan=run.captureOrder,target=foes.find(c=>c.uid===plan?.uid),tool=plan?.tool||run.selectedCapturer||'scout',threshold=plan?.threshold||.25,estimated=target?captureChance(run,{...target,capturePreparation:{healthFraction:threshold,mode:plan.mode,tool}}):0;return `<label>CAPTURER<select id="capture-tool" ${run.captureReservation?'disabled':''}>${Object.entries(CAPTURERS).map(([id,t])=>`<option value="${id}" ${id===tool?'selected':''} ${!(run.captureTools?.[id]>0)?'disabled':''}>${t.name} · ${run.captureTools?.[id]||0} owned</option>`).join('')}</select></label><div class="capture-quick">${Object.entries(CAPTURERS).map(([id,t])=>`<button data-capture-method="${id}" class="${id===tool?'selected':''}" ${run.captureReservation||!(run.captureTools?.[id]>0)?'disabled':''} title="${t.name} · ${t.mult}× base odds · ${run.captureTools?.[id]||0} available">${t.icon}<small>${t.name.split(' ')[0]} · ${run.captureTools?.[id]||0}</small></button>`).join('')}</div><label>AUTO-TRY AT HP<select id="capture-threshold" ${!plan||run.captureReservation?'disabled':''}>${[5,10,15,25,35,45,55,65,75].map(p=>`<option value="${p}" ${p===Math.round(threshold*100)?'selected':''}>${p}% HP</option>`).join('')}</select></label><strong>${target?Math.round(estimated*100)+'% estimated at '+Math.round(threshold*100)+'% HP':'Choose a wild target'}</strong><small>Low health increases odds. A lethal hit or damage over time can knock it out before capture.</small><label class="auto-capture-toggle"><input type="checkbox" data-auto-capture ${run.autoCaptureRetry?'checked':''}> Auto retry 3 seconds after a lattice breaks · up to 3 throws</label>`;}
function setCaptureTarget(uid,tool=null){ensureCapturer();if(phase!=='prep'||run.captureReservation)return;const c=foes.find(c=>c.uid===uid&&!c.boss);if(!c)return;const method=tool||run.selectedCapturer||Object.keys(CAPTURERS).find(t=>run.captureTools?.[t]>0)||'scout';if(!(run.captureTools?.[method]>0)){toast('This capturer is unavailable.');return;}run.selectedCapturer=method;run.captureOrder={uid,mode:run.captureOrder?.mode||'mercy',tool:method,threshold:run.captureOrder?.threshold||.25};save();render();}
function drawEnemyOverheads(){
 const layer=$("#enemy-overheads");if(!layer||phase!=='prep')return;
 const html=(foes||[]).map(c=>{
  const st=stats(c,foes,c.enemyRelics||[]),tool=run.captureOrder?.tool||run.selectedCapturer||'scout',threshold=run.captureOrder?.threshold||.25,chance=c.boss?0:captureChance(run,{...c,capturePreparation:{healthFraction:threshold,mode:run.captureOrder?.mode||'mercy',tool}});
  return `<article class="enemy-head-ui" data-head-uid="${c.uid}"><div class="roster-commands"><button data-enemy-inspect="${c.uid}" aria-label="Inspect ${creatureName(c)}">ⓘ About</button>${!c.boss?`<button data-enemy-capture="${c.uid}" class="${run.captureOrder?.uid===c.uid?'planned':''}" aria-label="Plan capture of ${creatureName(c)}" title="${Math.round(chance*100)}% at ${Math.round(threshold*100)}% HP">◇ ${Math.round(chance*100)}%</button>`:'<small>Guardian</small>'}</div><button class="prep-roster-portrait" data-enemy-inspect="${c.uid}" aria-label="Inspect ${creatureName(c)}">${image(c)}<span><strong>${creatureName(c)}</strong><small>${BY_ID[c.id].role} · Lv. ${c.level}</small></span></button>${eliteBadgeHTML(c)}<div class="prep-roster-vitals"><span>${Math.round(st.hp)} HP</span><i style="width:100%"></i></div><small class="capture-estimate">${c.boss?'Cannot capture':Math.round(chance*100)+'% at '+Math.round(threshold*100)+'% HP'}</small></article>`;
 }).join('');
 if(layer.innerHTML!==html)layer.innerHTML=html;
}

function newShopHTML(stock){return `<section class="new-shop"><h3>CAPTURE TOOLS</h3><p>At 25% HP, Scout odds are 90% Common, 85% Uncommon, 25% Rare, 22% Epic and 8% Legendary. Stronger tools improve these odds; each attempt consumes one.</p><div class="gear-grid">${Object.entries(CAPTURERS).map(([id,t])=>`<div><strong style="color:${t.color}">${t.icon} ${t.name}</strong><p>${t.mult}× basic chance · ${run.captureTools?.[id]||0} owned</p>${button('◉ '+shopPrice(run,t.cost),'buy-capturer-'+id,'secondary small',run.gold<shopPrice(run,t.cost))}</div>`).join('')}</div><h3>GROW THE ROSTER · ${capacity(run)} / ${run.legendaryPact?5:6} PLACES</h3>${button('Hiring permit · ◉ '+permitCost(run),'buy-permit','secondary',run.wins<3||(run.teamCapacity||2)>=6||run.gold<permitCost(run))}<p>The first extra place is earned after two wins. Permits accelerate later growth. New recruits wait on the bench until deployed.</p><div class="gear-grid">${(stock.recruits||[]).map((c,i)=>{const st=stats(c,[c]);c.marketCost=recruitPrice(run,c);return `<div>${image(c)}<strong>${creatureName(c)} · ${c.nature}</strong><p>HP ${st.hp} · ATK ${st.atk} · SPD ${Math.round(st.speed)} · CD ${st.cd.toFixed(1)}s</p>${button(c.recruited?'✓ Recruited':'◉ '+c.marketCost,'buy-recruit-'+i,'secondary small',c.recruited||run.gold<c.marketCost||run.bench.length>=12)}</div>`;}).join('')}</div></section>`;}
function lootVisual(d){const color=d.kind==='capturer'?CAPTURERS[d.tier].color:d.kind==='relic'?RUN_RELIC_BY_ID[d.relic]?.color:d.kind==='gear'?(RARITY[d.rarity]?.color||GEAR_BY_ID[d.gear]?.color):'#efcf77',tier=d.kind==='capturer'?CAPTURERS[d.tier].name.split(' ')[0]:d.kind==='relic'?'Expedition relic':d.kind==='gear'?(d.rarity||'Standard')+' equipment':'Gold';return {color:color||'#b9cf9d',tier};}
function lootIcon(d){return artImage(lootArt(d));}
function lootHTML(){
 const cache=reward?.loot;if(!cache)return '';
 return `<section class="loot-cache loot-v2 ${cache.claimed?'collected':''}" aria-label="Victory spoils"><div class="loot-drops">${cache.drops.map((d,i)=>{const {color,tier}=lootVisual(d);return rewardDropHTML(d,i,{name:lootName(d),color,tier,claimed:cache.claimed,description:lootDescription(d)});}).join('')}</div><div class="loot-collection"><span role="status">${cache.claimed?'\u2713 Safely in your pack.':cache.drops.length+' drops ready to claim'}</span></div></section>`;
}
function lootDescription(d){return d.kind==='gear'?equipmentDescription(GEAR_BY_ID[d.gear],{balanceVersion:15,equipment:[d.gear],equipmentRolls:[d]}):d.kind==='relic'?relicDescription(RUN_RELIC_BY_ID[d.relic]):d.kind==='capturer'?`${CAPTURERS[d.tier].mult}\u00d7 Scout odds \u00b7 one attempt`:'Spend at an outpost to shape your next build.';}

function bindArenaDeployment(){if(!canvas||canvas.dataset.physicsBound)return;canvas.dataset.physicsBound='1';const coords=e=>{const rect=canvas.getBoundingClientRect();return arenaPoint(e.clientX,e.clientY,rect);};canvas.addEventListener('pointerdown',e=>{if(phase==='battle'&&!modalKind&&battle){const p=coords(e),u=battle.living(1).sort((a,b)=>b.y-a.y).find(u=>{const h=nativeBodyHeight(u)*getCharacterHeight(),y=u.y*.58+75-h/2;return Math.pow((p.x-u.x)/Math.max(12,70*u.nativeScale),2)+Math.pow((p.y-y)/Math.max(15,h*.6),2)<=1;});if(u){battle.focusEnemy(u.uid);toast('Focus: '+creatureName(u)+' - 8s');e.preventDefault();}return;}if(phase!=='prep'||modalKind)return;for(let i=run.team.length-1;i>=0;i--)if(deployment.begin(run.team[i],i,coords(e),getCharacterHeight())){canvas.setPointerCapture(e.pointerId);e.preventDefault();break;}});canvas.addEventListener('pointermove',e=>{if(deployment.held){deployment.move(coords(e));e.preventDefault();}});const release=e=>{if(deployment.held){deployment.release();save();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);}
function drawDefeatFilm(){if(!defeatFilm||!ctx||!canvas)return;const c=defeatFilm.outcome,u=battle?.units.find(u=>u.uid===c.uid),camera=arenaCamera(canvas.width,canvas.height),x=((u?.x||500)-camera.x)*camera.scale,y=((u?.y||450)*.58+75-camera.y)*camera.scale,t=defeatFilm.elapsed;ctx.save();ctx.fillStyle='#1c090866';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#ed8879';ctx.lineWidth=5;const r=22*(Math.min(1,t*3));ctx.beginPath();ctx.moveTo(x-r,y-r);ctx.lineTo(x+r,y+r);ctx.moveTo(x+r,y-r);ctx.lineTo(x-r,y+r);ctx.stroke();ctx.fillStyle='#ffd0ba';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText(c.name+' · PERMANENT LOSS',x,y-65);for(let i=0;i<12;i++){const a=i*Math.PI/6,r=t*45;ctx.fillStyle=i%2?'#eec389':'#dc8278';ctx.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,5,5);}ctx.font='13px sans-serif';ctx.fillText('Worn items shattered'+(c.destroyedRelic?' · a relic destroyed':''),x,y+55);ctx.restore();}

function recapHTML(report){return battleSummaryHTML(report,{image:c=>image(c),name:creatureName,skill:id=>SKILLS[id]?.name||id},recapMetric,recapSide);}
function enrageHTML(){return `<div class="enrage-strip" id="enrage-strip"><strong id="enrage-status">Calm - ramp starts at 30s</strong><div class="enrage-live-values"><span id="enrage-damage">1.00× DMG</span><span id="enrage-healing">−0% HEALING</span><span id="enrage-actions">1.00× ACTIONS</span></div><span id="enrage-details">Both teams - gradual pressure after 30 combat seconds</span><div class="enrage-progress"><i id="enrage-progress"></i></div></div>`;}
function updateEnrage(){const e=battle?.enrage||enrageAt(0),strip=$('#enrage-strip');if(!strip)return;strip.classList.toggle('active',e.active);$('.arena-panel')?.classList.toggle('enraged',e.active);$('#enrage-status').textContent=e.active?(e.elapsed>=50?'ENRAGE - DAMAGE CAPPED':'ENRAGE RISING'):`Calm - ramp in ${Math.max(0,Math.ceil(e.nextChange))}s`;$('#enrage-damage').textContent=e.damage.toFixed(2)+'× DMG';$('#enrage-healing').textContent='−'+Math.round(e.healingPenalty*100)+'% HEALING';$('#enrage-actions').textContent=e.actionSpeed.toFixed(2)+'× ACTIONS';$('#enrage-details').textContent=e.active?`Both teams - ${e.elapsed>=50?'3x damage cap':'+4% damage/s'}, -1 point healing/s - ${Math.round(e.healing*100)}% healing remains`:'Both teams - +4% damage and -1 percentage point healing per second after 30s';$('#enrage-progress').style.width=e.progress*100+'%';}
function applyTuning(values){profile.tuning=setTuning(values);battle?.setTuning(profile.tuning);practice?.setTuning(profile.tuning);for(const el of document.querySelectorAll('[data-tuning-value]'))el.textContent=profile.tuning[el.dataset.tuningValue]+'%';save();updateHeader();}
function openSettings(){if(modalKind==='settings')return;settingsPreview=new SettingsMovementPreview({now:performance.now()/1000});settingsPrevious={kind:modalKind,html:$('#modal-root').innerHTML,paused,scroll:$('.modal')?.scrollTop||0,backdropScroll:$('.modal-backdrop')?.scrollTop||0};if(phase==='battle')paused=true;
 modal(`<span class="section-kicker">MAKE THE ARENA FEEL RIGHT</span><h2>Settings & combat feel.</h2><p>Your preferences save on this device. Combat pauses while you tune; closing resumes its previous state. Combat sliders apply equally to both teams.</p><div class="tuning-preview"><canvas id="tuning-preview" width="600" height="210" aria-label="Randomized small, regular and large creatures demonstrating movement"></canvas><div>${['Small','Regular','Large'].map((name,i)=>`<span data-tuning-example="${i}"><small>${name.toUpperCase()}</small><b data-preview-name></b><small data-preview-motion></small></span>`).join('')}</div><p class="tuning-preview-note">New creatures every 5 seconds · Walk, run, sprint, turn and stop</p></div>${['Combat feel','Movement patterns','Presentation'].map(group=>`<section class="tuning-group"><h3>${group}</h3>${TUNING_OPTIONS.filter(o=>o.group===group).map(o=>`<label class="tuning-row" for="tuning-${o.id}"><span><strong>${o.name}</strong><small>${o.description}</small></span><output data-tuning-value="${o.id}" for="tuning-${o.id}">${profile.tuning[o.id]}%</output><input id="tuning-${o.id}" data-tuning="${o.id}" type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${profile.tuning[o.id]}"></label>`).join('')}</section>`).join('')}<p class="tuning-note">100% is the current default. Base sprites remain 30% of the old arena size; natural type sizes range from 70% to 150%. Size, movement, braking, turning and movement patterns apply to both teams. Examples use the same movement rules. Presentation controls change its appearance.</p><div class="modal-actions">${button('Reset all sliders','reset-tuning','secondary')}${button('Done · back to arena','close')}</div>`,'settings');$('.modal').classList.add('settings-modal');drawTuningPreview(performance.now()/1000);}
function drawTuningPreview(time){const canvas=$('#tuning-preview');if(!canvas||!settingsPreview)return;
 const c=canvas.getContext('2d'),examples=settingsPreview.update(time,profile.tuning);c.imageSmoothingEnabled=false;c.fillStyle='#082330';c.fillRect(0,0,600,210);
 const zoom=Math.min(2.6,144/(192*Math.max(...examples.map(e=>creatureWorldScale(e.spec,e.unit)))));
 for(const [i,e]of examples.entries()){const u=e.unit,x=100+i*200+26*Math.tanh((u.x-e.origin.x)/250),y=146+8*Math.tanh((u.y-e.origin.y)/150),size=3*creatureWorldScale(e.spec,u)*zoom;
  c.save();c.beginPath();c.rect(i*200,0,200,210);c.clip();c.fillStyle='#35606c';c.fillRect(i*200+12,164,176,1);drawNativeUnit(c,u,e.spec,x,y,time,size);c.restore();
  const label=document.querySelector(`[data-tuning-example="${i}"]`);label.dataset.previewId=u.id;label.dataset.previewState=e.state;label.querySelector('[data-preview-name]').textContent=creatureName(u);label.querySelector('[data-preview-motion]').textContent=e.state.charAt(0).toUpperCase()+e.state.slice(1);
 }
 canvas.dataset.previewBatch=settingsPreview.batch;
}
function quickEquipmentHTML(c,index){const slots=equipmentSlots(c);return `<div class="quick-equipment" aria-label="${creatureName(c)} equipment" data-loadout-drop="${index}">${Array.from({length:slots},(_,slot)=>{const g=GEAR_BY_ID[c.equipment?.[slot]],roll=c.equipmentRolls?.[slot];return g?`<button data-gear-remove="${slot}" data-index="${index}" data-loadout-drop="${index}" data-gear-slot="${slot}" style="--gear-color:${g.color||'#b9cf9d'}" ${phase==='battle'?'disabled':''} title="${roll?.rarity||'Standard'} ${g.name} · ${Math.round((roll?.quality||1)*100)}% quality: ${equipmentDescription(g,c)}. Drag to another creature; click to return to pack." aria-label="${creatureName(c)}: ${g.name}">${gearSymbol(g)}<small>${g.name}</small><span class="visible-gear-effect">${equipmentDescription(g,c)}</span></button>`:`<button data-action="inspect-quick-gear" data-index="${index}" data-loadout-drop="${index}" data-gear-slot="${slot}" title="Drop equipment here or inspect this companion’s equipment">＋<small>Slot ${slot+1}</small></button>`;}).join('')}</div>`;}
function equipmentTrayHTML(){return `<section class="equipment-tray" data-pack-drop="true"><div class="section-heading"><h3>${artImage('pack-00','inventory-pack')} YOUR EQUIPMENT PACK <span data-equipment-total>${run.gearInventory?.length||0}</span></h3><small>${phase==='battle'?'Equipment locks during combat.':'Drag onto a creature above · drag worn items between companions'}</small></div><div class="pack-recipients" aria-label="Equipment recipients">${run.team.map((c,i)=>`<button data-loadout-drop="${i}" data-switch-creature="${i}" ${phase==='battle'?'disabled':''} title="Drop equipment on ${creatureName(c)}">${image(c)}<span>${creatureName(c)}<small>${c.equipment?.length||0}/${equipmentSlots(c)} equipped</small></span></button>`).join('')}</div><div class="equipment-tray-items">${(run.gearInventory||[]).map(item=>{const g=GEAR_BY_ID[item.id];return `<button data-gear-equip="${item.uid}" data-index="${selectedCreature}" ${phase==='battle'?'disabled':''} style="--gear-color:${g.color||'#b9cf9d'}" title="${equipmentDescription(g,{balanceVersion:15,equipment:[g.id],equipmentRolls:[item]})}${item.sourceName?' · from '+item.sourceName:''} · drag onto a companion"><span>${gearSymbol(g)}</span><strong>${g.name}</strong><small>${item.rarity||'Standard'} · ${Math.round((item.quality||1)*100)}% quality · ${g.slot||'Equipment'}</small><span class="visible-gear-effect">${equipmentDescription(g,{balanceVersion:15,equipment:[g.id],equipmentRolls:[item]})}</span></button>`;}).join('')||'<p>Equipment changes one companion’s stats or behavior. Find it in victory caches, evolution caches or at outposts. Drag worn gear here to return it to the pack.</p>'}</div></section>`;}

function retryCaptureUI(uid){const result=battle.retryCapture(uid,run.selectedCapturer||'scout');if(result.ok){settleTacticalCapture();updateRetryControls();}else toast(result.reason);}
function retryControlsHTML(){return `<div id="capture-retry-controls" class="capture-retry-controls"><div><strong>CAPTURE TOOLS <span id="capture-attempt-count">${battle?.captureAttempts||0} / 3 attempts</span></strong><small id="capture-retry-note">The first throw is automatic. After a failure, click a weakened opponent to retry.</small></div><label class="auto-capture-toggle"><input type="checkbox" data-auto-capture ${run.autoCaptureRetry?'checked':''}> Auto retry · 3s</label><div class="capture-quick">${Object.entries(CAPTURERS).map(([id,t])=>`<button data-capture-method="${id}" class="${id===(run.selectedCapturer||run.captureOrder.tool)?'selected':''}" title="${t.name} · ${t.mult}× baseline chance">${t.icon}<small data-capturer-stock="${id}">${t.name.split(' ')[0]} · ${run.captureTools?.[id]||0}</small></button>`).join('')}</div></div>`;}
function updateRetryControls(){if(phase!=='battle'||!battle)return;const count=$('#capture-attempt-count');if(count)count.textContent=`${battle.captureAttempts} / 3 attempts`;const note=$('#capture-retry-note');if(note)note.textContent=battle.captureResult?.success?'Captured. No more throws this round.':battle.captureAttempts>=3?'All three attempts used.':battle.autoRetryAt!==null?`Auto retry in ${Math.max(0,battle.autoRetryAt-battle.time).toFixed(1)}s · highlighted capturer`:battle.autoRetryBlocked?'Auto retry stopped · '+battle.autoRetryBlocked:battle.captureResult?'Capture failed · click a weakened opponent or enable auto retry.':'Your planned throw will happen automatically at the selected HP.';for(const el of document.querySelectorAll('#capture-retry-controls [data-capture-method]')){const id=el.dataset.captureMethod;el.disabled=!(run.captureTools?.[id]>0)||battle.captureResult?.success||battle.captureAttempts>=3;el.classList.toggle('selected',id===(run.selectedCapturer||run.captureOrder.tool));el.querySelector('small').textContent=CAPTURERS[id].name.split(' ')[0]+' · '+(run.captureTools?.[id]||0);}}
function ensureCapturer(){if(!run.captureTools?.[run.selectedCapturer||"scout"])run.selectedCapturer=Object.keys(CAPTURERS).find(id=>run.captureTools?.[id]>0)||"scout";}

function drawGroundLoot(time){if(phase!=='reward'||!reward?.loot||reward.loot.claimed||!ctx||!canvas)return;ctx.save();const camera=arenaCamera(canvas.width,canvas.height);ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.x,-camera.y);reward.loot.drops.forEach((d,i)=>{const x=d.x||600+i*35,y=(d.y||430)*.58+75,{color}=lootVisual(d),t=profile.reducedMotion?1:Math.max(0,(victoryFilm?.elapsed??1)-i*.08),rise=Math.min(1,t/.65),bounce=profile.reducedMotion?0:Math.round(Math.sin(time*3+i)*3),h=42*rise,beam=ctx.createLinearGradient(x,y-h-55,x,y);beam.addColorStop(0,color+'00');beam.addColorStop(1,color+'55');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x-20,y);ctx.lineTo(x-12,y-h-55);ctx.lineTo(x+12,y-h-55);ctx.lineTo(x+20,y);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,19,7,0,0,Math.PI*2);ctx.stroke();ctx.save();ctx.translate(Math.round(x-17),Math.round(y-h-28+bounce));ctx.fillStyle='#10231e';ctx.fillRect(3,2,28,28);ctx.fillStyle=color;if(d.kind==='gold'){for(let n=0;n<3;n++){ctx.fillRect(n*9+3,24-n*5,8,6+n*5);ctx.fillStyle='#fff0a5';ctx.fillRect(n*9+4,24-n*5,6,2);ctx.fillStyle=color;}}else if(d.kind==='gear'){ctx.fillRect(8,20,18,4);ctx.fillRect(15,5,5,25);ctx.fillStyle='#fff2ce';ctx.fillRect(17,4,2,16);}else if(d.kind==='capturer'){ctx.fillRect(7,7,21,21);ctx.fillStyle='#153a3e';ctx.fillRect(10,10,15,15);ctx.fillStyle=color;ctx.fillRect(15,3,5,29);ctx.fillRect(3,15,29,5);}else{ctx.fillRect(14,2,7,31);ctx.fillRect(2,14,31,7);ctx.fillStyle='#f7efd2';ctx.fillRect(14,14,7,7);}ctx.restore();for(let j=0;j<5;j++){const a=j*Math.PI*.4+time*.7,r=20+Math.sin(time*2+j)*6;ctx.fillStyle=j%2?color:'#fff1c5';ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y-h-10+Math.sin(a)*r*.55),2,2);}ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f3e9c9';ctx.fillText(lootName(d),x,y+23);});ctx.restore();}

function relicDescription(r){
 if(r?.id==='treasure-moth')return 'Victory caches have a 50% chance to include one extra unique relic.';
 if(r?.effect)return combatEffectDescription(r,run);
 const descriptions={fangs:'Basic attacks deal 9% more damage. Strikers gain 4% lifesteal.',clock:'Skill cooldown times are 11% shorter.',seed:'Healing is 17.5% stronger. Grove creatures gain 6% max HP.',prism:'Every ally starts battle with 32.5 shield.',lens:'Adds up to 6 percentage points to capture odds, scaled by missing health (full bonus at 25% HP or lower), before Swift mode and rarity caps.',banner:'Guardians gain 11% max HP and taunt at battle start.',feather:'Improves physical dodge reactions and grants 6% movement speed.',coin:'Battle gold rewards increase by 17.5%.',bond:'Each active elemental synergy grants 2.5% attack.'};
 const classic={
  'blood-pact':'Allies deal 11% more damage, but healing is 25% weaker.',
  mercy:'Once per creature: falling below 30% health restores 10% max health.',
  'storm-relay':'Each allied dodge refreshes nearby allies’ cooldowns by 0.35s; shields are 15% weaker.',
  'thorn-crown':'Shielded Guardians reflect 11% of incoming hit damage; movement is 10% slower.',
  'glass-cannon':'Rangers deal 15% more damage at long range, but have 15% less health.',
  'spore-network':'Damage to poisoned enemies heals your weakest ally for 7.5% of damage; direct healing is 10% weaker.',
  'execution-bell':'An allied kill refreshes every living ally’s cooldowns by 0.35s.',
  sanctuary:'Allies near a Support take 6% less direct-hit damage. Clustering risks enemy areas.',
  overgrowth:'25% of excess allied healing becomes shield, but cooldowns recharge 8% slower.',
  hatchery:'A successful capture grants 17.5 EXP to the active team and refunds 10 gold.',
  salvage:'Elites grant an additional personal relic; normal battle gold is 10% lower.',
  unity:'Five different elements grant 10% attack and 7.5% max health. Duplicate elements lose this bonus.',
  'last-light':'Once per battle, revive the first fallen ally at 15% health with 1s evasion. Team healing is 10% lower.',
  frostfire:'Hits on burning, slowed enemies detonate steam for 25% attack, consuming burn.',
  'echo-chamber':'Every fourth allied cooldown skill repeats at 22.5% power. Cooldowns recharge 12% slower.'
 };
 return descriptions[r?.id]||classic[r?.id]||r?.desc||'';
}
function decorateAilments(root){
 if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement?.closest('.ailment-term,script,style,option'))nodes.push(n);}
 for(const node of nodes){const plain=node.textContent.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),html=annotateAilments(plain);if(html===plain)continue;const span=document.createElement('span');span.innerHTML=html;node.replaceWith(...span.childNodes);}
}
function armorHTML(st,s){const reduction=armorReduction(st.armor,s.role);return `<div class="armor-stat" title="Armor reduces direct hits. Each extra point adds less protection. Guardians get 40% more effective armor; damage over time bypasses it."><strong>⬡ ${Math.round(st.armor||0)} ARMOR</strong><span>${Math.round(reduction*100)}% direct-hit reduction · diminishing returns</span></div>`;}
function ailmentMenuHTML(u){const live=activeAilments(u);return `<details class="ailment-guide" ${live.length?'open':''}><summary class="section-kicker">STATUS GLOSSARY · TAP TO EXPAND</summary><div>${Object.entries(STATUS_AILMENTS).map(([id,a])=>`<span class="ailment-term ${live.some(x=>x.id===id)?'active':''}" data-ailment="${id}" tabindex="0" style="--ailment:${a.color}" title="${a.desc}">${a.icon} ${a.name}${live.find(x=>x.id===id)?' · '+live.find(x=>x.id===id).remaining.toFixed(1)+'s':''}</span>`).join('')}</div></details>`;}
function enemyRelicBannerHTML(){const ids=[...new Set((foes||[]).flatMap(c=>c.enemyRelics||[]))];return ids.length?`<aside class="enemy-build-banner"><strong>ENEMY RELICS · ${(foes||[])[0]?.relicBuild||'Wild counterplan'}</strong><div>${ids.map(id=>{const r=RUN_RELIC_BY_ID[id],count=foes.filter(c=>c.enemyRelics?.includes(id)).length;return `<button data-enemy-relic="${id}" style="color:${r.color}" title="${r.name} · ${relicDescription(r)} · active on ${count} enemies">${r.icon} <span>${r.name}</span></button>`;}).join('')}</div><small>Inspect enemies for full equipment sets and quality.</small></aside>`:'';}
function captureMessage(result){return result?.success?`✧ CAPTURE SUCCESSFUL · ${BY_ID[result.creature.id].name} fights for you now and joins your team or reserves at round end. Family unlocked for future starts.${eliteModifier(result.creature)?" Elite individual saved with its mutation.":""}`:`✕ CAPTURE FAILED · ${result?.reason||'The lattice broke. Your capturer was spent.'}`;}
function updateCaptureFeedback(){const el=$('#capture-feedback'),result=battle?.captureResult||run.captureReservation?.result;if(el&&result){el.className='capture-feedback '+(result.success?'success':'failed');el.textContent=captureMessage(result);}}
function announceCapture(result){updateCaptureFeedback();toast(captureMessage(result));sound(result.success?'capture':'loss');}
function refreshLiveRoster(){if(phase==='battle'&&viewName==='arena'){updateLiveRoster($('#live-roster'),battle,{paired:true,selectedUid:liveSelectedUid||run.team[selectedCreature]?.uid,image,controls:liveCommandsHTML});decorateUploadedArt($('#live-roster'));}}
function updateLiveStatus(){
 if(!battle)return;for(const [i,c]of run.team.entries()){const u=battle.units.find(u=>u.uid===c.uid),card=document.querySelector(`[data-creature="${i}"]`);if(!u||!card)continue;card.querySelector('[data-live-health]').style.width=`${Math.max(0,u.hp/u.maxHp)*100}%`;card.querySelector('[data-live-stamina]').style.width=`${u.stamina}%`;card.querySelector('[data-vital-hp]').textContent=`HEALTH ${Math.ceil(u.hp)}/${Math.round(u.maxHp)}`;card.querySelector('[data-vital-stamina]').textContent=`STAMINA ${Math.round(u.stamina)}/100`;let row=card.querySelector('.card-ailments');if(!row){row=document.createElement('span');row.className='card-ailments';card.append(row);}const html=activeAilments(u).map(a=>`<span class="live-ailment" style="--ailment:${a.color}" title="${a.name}: ${a.desc} · ${a.remaining.toFixed(1)}s">${a.icon}</span>`).join('');if(row.innerHTML!==html)row.innerHTML=html;}
 updateCaptureFeedback();updateRetryControls();
}
function prepareLoadoutDragging(){
 const make=(el,payload)=>{if(!el||phase==='battle')return;el.draggable=true;el.dataset.dragPayload=JSON.stringify(payload);el.classList.add('loadout-draggable');};
 document.querySelectorAll('[data-gear-equip]').forEach(el=>{const g=run.gearInventory.find(g=>g.uid===el.dataset.gearEquip);if(g)make(el,{kind:'gear',uid:g.uid,id:g.id});});
 document.querySelectorAll('[data-gear-remove]').forEach(el=>{const i=Number(el.dataset.index),slot=Number(el.dataset.gearRemove),id=run.team[i]?.equipment?.[slot];if(id)make(el,{kind:'gear',id,fromIndex:i,slot});});
 document.querySelectorAll('[data-equip],[data-pack-relic]').forEach(el=>{const uid=el.dataset.equip||el.dataset.packRelic,g=run.inventory.find(g=>g.uid===uid);if(g)make(el,{kind:'gem',uid:g.uid,id:g.id});});
 document.querySelectorAll('[data-unequip]').forEach(el=>{const i=Number(el.dataset.index),slot=Number(el.dataset.unequip),g=run.team[i]?.relics?.[slot];if(g)make(el.closest('.relic-slot'),{kind:'gem',uid:g.uid,id:g.id,fromIndex:i,slot});});
 document.querySelectorAll('[data-skill-drop]').forEach(el=>{const i=Number(el.dataset.index),id=el.dataset.skillDrop;if(run.team[i]&&!SKILLS[id]?.auto)make(el,{kind:'skill',id,fromIndex:i});});
 document.querySelectorAll('.personal-loadout').forEach(el=>el.dataset.loadoutDrop=selectedCreature);
 document.querySelectorAll('.personal-inventory').forEach(el=>el.dataset.packDrop='true');
}
function dropTarget(el){const marker=el?.closest('[data-seat-drop],[data-skill-drop],[data-loadout-drop],[data-pack-drop]');if(!marker)return null;if(marker.dataset.seatDrop!==undefined)return {seat:Number(marker.dataset.seatDrop)};if(marker.dataset.packDrop!==undefined)return {pack:true};if(marker.dataset.skillDrop)return {index:Number(marker.dataset.index),skill:marker.dataset.skillDrop};const gear=el.closest('[data-gear-slot]');return marker.dataset.loadoutDrop!=='null'?{index:Number(marker.dataset.loadoutDrop),...(gear?{gearSlot:Number(gear.dataset.gearSlot)}:{})}:null;}

function finishLoadoutDrop(payload,target){if(!target||phase==='battle')return false;if(!applyLoadoutDrop(run,payload,target)){toast('That loadout cannot accept this item or skill. Check space and compatibility.');return false;}save();render();if(modalKind==='creature'||modalKind==='detail')openCreature(selectedCreature);else if(modalKind==='pack')openPack();else if(modalKind==='companions')openCompanions();const refreshed=$('.modal');if(refreshed)refreshed.classList.add('loadout-updated');toast(payload.kind==='skill'?'Cooldown priority changed. The first ready skill is considered first.':'Loadout updated.');return true;}
let loadoutDrag=null;
document.addEventListener('dragstart',e=>{const el=e.target.closest('[data-drag-payload]');if(!el||phase==='battle')return;loadoutDrag=JSON.parse(el.dataset.dragPayload);e.dataTransfer.setData('application/x-starfall-loadout',el.dataset.dragPayload);e.dataTransfer.effectAllowed='move';el.classList.add('dragging');});
document.addEventListener('dragover',e=>{if(loadoutDrag&&dropTarget(e.target)){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.loadout-target').forEach(el=>el.classList.remove('loadout-target'));e.target.closest('[data-loadout-drop],[data-pack-drop],[data-seat-drop]')?.classList.add('loadout-target');}});
document.addEventListener('drop',e=>{if(!loadoutDrag)return;e.preventDefault();const payload=loadoutDrag;loadoutDrag=null;finishLoadoutDrop(payload,dropTarget(e.target));});
document.addEventListener('dragend',()=>{loadoutDrag=null;dragIndex=null;document.querySelectorAll('.dragging,.loadout-target').forEach(el=>{el.classList.remove('dragging');el.classList.remove('loadout-target');});});

function detailTabsHTML(index){return `<div class="detail-tabs" role="tablist" aria-label="Creature details">${[['overview','Overview'],['skills','Skills'],['equipment','Loadout'],...(index!==null?[['ai','AI & growth']]:[])].map(([id,name])=>`<button role="tab" data-detail-tab="${id}">${name}</button>`).join('')}</div>`;}
function prepareDetailTabs(){if(modalKind!=='creature')return;const modal=$('.modal');for(const pane of modal.querySelectorAll('[data-detail-pane]')){pane.hidden=pane.dataset.detailPane!==detailTab;pane.id='detail-pane-'+pane.dataset.detailPane;pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby','detail-tab-'+pane.dataset.detailPane);}for(const tab of modal.querySelectorAll('[data-detail-tab]')){const selected=tab.dataset.detailTab===detailTab;tab.classList.toggle('selected',selected);tab.id='detail-tab-'+tab.dataset.detailTab;tab.setAttribute('aria-controls','detail-pane-'+tab.dataset.detailTab);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}}
function showStatusHelp(el){if(!el)return;let tip=$('#ui-tooltip');if(!tip){tip=document.createElement('div');tip.id='ui-tooltip';tip.className='ui-tooltip';tip.setAttribute('role','tooltip');document.body.append(tip);}tip.textContent=el.title;tip.hidden=false;const rect=el.getBoundingClientRect();tip.style.left=Math.max(12,Math.min(innerWidth-322,rect.left))+'px';tip.style.top=Math.max(12,Math.min(innerHeight-125,rect.bottom+8))+'px';el.setAttribute('aria-describedby','ui-tooltip');}
document.addEventListener('pointerover',e=>{const el=e.target.closest('.ailment-term,.live-ailment');if(el)showStatusHelp(el);});
document.addEventListener('focusin',e=>{const el=e.target.closest('.ailment-term,.live-ailment');if(el)showStatusHelp(el);});
document.addEventListener('pointerout',e=>{if(e.target.closest('.ailment-term,.live-ailment')&&!e.relatedTarget?.closest?.('.ailment-term,.live-ailment')){const tip=$('#ui-tooltip');if(tip)tip.hidden=true;}});
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.ailment-term,.live-ailment');if(el)showStatusHelp(el);else{const tip=$('#ui-tooltip');if(tip)tip.hidden=true;}});

document.addEventListener('keydown',e=>{if(!e.target.matches('[data-detail-tab]')||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-detail-tab]')],i=tabs.indexOf(e.target),next=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];detailTab=next.dataset.detailTab;prepareDetailTabs();next.focus();});

let touchLoadout=null,touchDragUntil=0;
document.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-drag-payload]');if(e.pointerType!=='touch'||!el||phase==='battle'||el.disabled)return;touchLoadout={el,payload:JSON.parse(el.dataset.dragPayload),x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};});
document.addEventListener('pointermove',e=>{const d=touchLoadout;if(!d||e.pointerId!==d.id)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>12){d.moved=true;d.el.setPointerCapture(e.pointerId);d.ghost=d.el.cloneNode(true);d.ghost.className='touch-loadout-ghost';document.body.append(d.ghost);}if(d.moved){e.preventDefault();d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';}},{passive:false});
document.addEventListener('pointerup',e=>{const d=touchLoadout;if(!d||d.id!==e.pointerId)return;touchLoadout=null;d.ghost?.remove();if(!d.moved)return;touchDragUntil=performance.now()+400;finishLoadoutDrop(d.payload,dropTarget(document.elementFromPoint(e.clientX,e.clientY)));});
document.addEventListener('pointercancel',()=>{touchLoadout?.ghost?.remove();touchLoadout=null;});
document.addEventListener('click',e=>{if(performance.now()<touchDragUntil){e.preventDefault();e.stopImmediatePropagation();}},true);


function roleBadge(s){return `<span class="role-badge role-${s.role.toLowerCase()}" title="${s.role}: ${{Guardian:'Armored frontline and interception',Striker:'Close combat pressure',Ranger:'Ranged damage and kiting',Support:'Healing and control'}[s.role]}">${ROLES[s.role]} ${s.role}${s.rarity==='Legendary'?' · ✦ Legendary':''}</span>`;}
function reserveTrayHTML(){return `<section class="reserve-tray"><div class="section-heading"><h3>RESERVE ROSTER <span>${run.bench.length} / 12</span></h3><small>Drag onto a team member to swap · their equipment stays with them${run.bench.length>12?' · Extra captured companions are kept safely.':''}</small></div><div class="reserve-tray-list">${run.bench.map((c,j)=>`<button class="reserve-card ${BY_ID[c.id].rarity==='Legendary'?'legendary-creature':''}" data-swap="${j}" data-index="${selectedCreature}" data-drag-payload='${JSON.stringify({kind:'reserve',uid:c.uid})}' draggable="${phase!=='battle'}" ${phase==='battle'?'disabled':''}>${image(c)}<span><strong>${creatureName(c)}</strong>${roleBadge(BY_ID[c.id])}<small>Lv. ${c.level} · ${c.equipment?.length||0}/${equipmentSlots(c)} gear slots</small></span></button>`).join('')||'<p>Capture or recruit a companion to build your reserves.</p>'}</div></section>`;}
var orderPreviewKey,orderPreview;
function drawAllyOrders(){const layer=$('#ally-orders'),lines=$('#target-preview');if(!layer||!lines||!canvas)return;if(phase!=='prep'||!foes?.length){layer.replaceChildren();lines.innerHTML='';return;}
 getOrderPreview();const key=orderPreviewKey;
 if(layer.dataset.key!==key){layer.dataset.key=key;layer.innerHTML=run.team.map((c,i)=>{const st=stats(c,run.team,run.relics),preview=orderPreview.units.find(u=>u.uid===c.uid);return `<article data-ally-order="${c.uid}"><div class="roster-commands"><label><span class="sr-only">Behavior</span><select data-policy="${i}" data-quick-ai="true" aria-label="${creatureName(c)} AI target policy">${Object.entries(POLICIES).map(([id,p])=>`<option value="${id}" ${id===(c.policy||'adaptive')?'selected':''}>${p.name}</option>`).join('')}</select></label><small data-preview-target></small></div><button class="prep-roster-portrait" data-switch-creature="${i}" aria-label="Inspect ${creatureName(c)}">${image(c)}<span><strong>${creatureName(c)}</strong><small>${BY_ID[c.id].role} · Lv. ${c.level}</small></span></button>${eliteBadgeHTML(c)}<div class="prep-roster-vitals"><span>${st.hp} HP</span><i style="width:100%"></i></div><div class="prep-roster-stamina"><i></i><span>100 / 100 STA</span></div><small class="prep-roster-poise">${Math.round(preview?.maxPoise||0)} poise</small></article>`;}).join('');}
 const paths=[];
 for(const u of orderPreview.units.filter(u=>u.side===0)){const t=orderPreview.target(u),el=layer.querySelector(`[data-ally-order="${u.uid}"]`);if(!el)continue;
 el.querySelector('[data-preview-target]').textContent=t?'→ '+creatureName(t):'No target';
 if(t){const tx=t.x,ty=t.y*.58+75;paths.push(`<path d="M${u.x} ${u.y*.58+75} Q${(u.x+tx)/2} ${Math.min(u.y,t.y)*.58+55} ${tx} ${ty}"/><circle cx="${tx}" cy="${ty}" r="9"/>`);}}
 const html=paths.join('');if(lines.innerHTML!==html)lines.innerHTML=html;
}
document.addEventListener('change',e=>{if(e.target.matches('[data-auto-capture]')){run.autoCaptureRetry=e.target.checked;if(battle)battle.setAutoCaptureRetry(run.autoCaptureRetry);save();updateRetryControls();}});

function getOrderPreview(){if(!foes?.length)return null;const key=JSON.stringify([run.team,run.relics,run.stance,run.rulesVersion,run.planet,run.depth,foes]);if(key!==orderPreviewKey){orderPreview=new Battle(JSON.parse(JSON.stringify(run)),structuredClone(foes),node?.seed||run.seed,{visuals:false});orderPreviewKey=key;}return orderPreview;}
function scoutingComparisonHTML(){const preview=getOrderPreview();if(!preview)return '';const total=(side,key)=>preview.units.filter(u=>u.side===side).reduce((n,u)=>n+(u[key]||0),0),average=(side,key)=>total(side,key)/Math.max(1,preview.units.filter(u=>u.side===side).length);return `<div class="scout-comparison"><div><b>YOUR TEAM</b><small>OPENING STATS</small><b>THE WILDS</b></div>${[['HP',total(0,'maxHp'),total(1,'maxHp')],['Attack',total(0,'atk'),total(1,'atk')],['Avg. armor',average(0,'armor'),average(1,'armor')]].map(([label,a,b])=>`<div><strong>${Math.round(a)}</strong><small>${label}</small><strong>${Math.round(b)}</strong></div>`).join('')}<p>Includes worn equipment and opening relic effects. Conditional bonuses change during combat.</p></div>`;}

let idlePortraitTick=0;
function drawIdlePortraits(now){
 if(document.hidden||phase==='battle'||now-idlePortraitTick<(starterReactions.size?1000/24:125))return;
 idlePortraitTick=now;
 for(const [id,reaction]of starterReactions)if(now-reaction.start>=reaction.duration)starterReactions.delete(id);
 for(const portrait of document.querySelectorAll('[data-starter-idle]')){
  const rect=portrait.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)continue;
  const u={id:portrait.dataset.starterIdle},rhythm=idleRhythm(u),c=portrait.getContext('2d');
  const reaction=profile.reducedMotion?null:starterReactions.get(u.id),progress=reaction?(now-reaction.start)/reaction.duration:0;
  const cell=reaction?starterReactionCell(u.id):starterPortraitCell(u.id),idle=starterPortraitCell(u.id),pose=reaction?starterReactionPose(pixelSpec(u.id),progress):null;
  if(portrait.width!==cell.w||portrait.height!==cell.h){portrait.width=cell.w;portrait.height=cell.h;}
  c.imageSmoothingEnabled=false;c.clearRect(0,0,cell.w,cell.h);
  // Keep the menu eyes open, including between greetings.
  const frame=reaction?reactionFrame(u.id,progress):nativePreviewFrame(u,'idle',profile.reducedMotion?.25:Math.min(.875,(now/1000*rhythm.rate+rhythm.offset)%1),2);
  c.drawImage(frame,cell.x,cell.y,cell.w,cell.h,0,0,cell.w,cell.h);
  const baseHeight=parseFloat(getComputedStyle(portrait.previousElementSibling).height),height=Math.min(baseHeight*cell.h/idle.h,portrait.parentElement.clientHeight-10),scale=height/cell.h;
  portrait.style.height=reaction?height+'px':'';
  portrait.style.transform=pose?`translate(${pose.x*scale}px,${pose.y*scale}px) rotate(${pose.roll}rad)`:'';
  const stage=portrait.parentElement,particle=stage.querySelector('.starter-reaction-particle');
  if(reaction){stage.dataset.reaction=reaction.kind;stage.dataset.gesture=reaction.gesture;particle.textContent=reaction.glyph;particle.style.opacity=Math.sin(progress*Math.PI).toFixed(3);particle.style.transform=`translateY(${-progress*18}px)`;}
  else{delete stage.dataset.reaction;delete stage.dataset.gesture;particle.textContent='';particle.style.opacity='0';}
  portrait.parentElement.classList.add('ready');
 }
 for(const portrait of document.querySelectorAll('[data-idle-index]')){
  const rect=portrait.getBoundingClientRect();
  if(rect.bottom<0||rect.top>innerHeight)continue;
  const u=run.team[Number(portrait.dataset.idleIndex)];if(!u)continue;
  const c=portrait.getContext('2d');if(!c)continue;
  c.clearRect(0,0,128,128);c.imageSmoothingEnabled=false;
  const rhythm=idleRhythm(u),pose=nativePreviewFrame(u,'idle',profile.reducedMotion?0:(now/1000*rhythm.rate+rhythm.offset)%1,2);
  c.drawImage(pose,0,0,128,128);portrait.parentElement.classList.add('ready');
 }
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-planet-preview]');if(!el)return;
 const i=Number(el.dataset.planetPreview),p=PLANETS[i],b=BIOMES[i];
 modal('<div class="field-world-preview" style="background-image:linear-gradient(0deg,#071c23,transparent),url('+worldArt(i)+')"></div><span class="section-kicker">'+(i>run.planet?'BEYOND THE HORIZON':'YOUR JOURNEY')+'</span><h2>'+p.name+'</h2><p>'+b.tag+'</p><p>'+b.features.join(' · ')+'</p><p>'+(i>run.planet?'Defeat your current world’s guardian to travel onward.':i<run.planet?'Your expedition has explored this world.':'Choose encounters on the star chart to progress through this world.')+'</p><div class="modal-actions">'+button('Back to your journey','close','secondary')+'</div>','world-preview');
});

document.addEventListener('click',e=>{
 const scout=e.target.closest('[data-field-scout]');
 if(scout){const n=run.route.flat().find(n=>n.id===scout.dataset.fieldScout);if(!n)return;if(['shop','event','rest'].includes(n.type)){const text={shop:'Trade gold for relics, equipment, companions and capture tools. Enter the outpost to inspect its stock and prices.',event:'A signal awaits on this path. Enter the encounter to read its choices before deciding how to respond.',rest:'Choose recovery, training or supplies for your companions. Enter the clearing to see your available options.'}[n.type];modal('<span class="section-kicker">SCOUTED ENCOUNTER</span><h2>'+LABELS[n.type]+'</h2><p>'+text+'</p><div class="modal-actions">'+button('Back to the route','close','secondary')+'</div>','route-scout');return;}const info=encounterInfo(run,n),boss=n.type==='boss';modal('<span class="section-kicker">SCOUTED ENCOUNTER · '+LABELS[n.type].toUpperCase()+'</span><h2>'+(boss?PLANETS[Math.min(run.planet,2)].bossName:info.arch.name)+'</h2><p>'+(boss?info.boss.desc:info.arch.desc)+'</p><div class="scout-panel"><strong>COUNTERPLAN</strong><p>'+(boss?info.boss.counter:info.arch.counter)+'</p><span>'+info.weather.name+' · '+info.weather.desc+'</span></div>'+eliteStageHTML(n)+'<div class="modal-actions">'+button('Back to the route','close','secondary')+'</div>','route-scout');return;}
 const preview=e.target.closest('[data-field-node]');
 if(preview&&!preview.disabled){
  const selected=run.route.flat().find(n=>n.id===preview.dataset.fieldNode);
  if(selected&&['battle','elite','boss','capture'].includes(selected.type)&&!committed){chooseNode(selected.id);fieldPreviewId=null;return;}
  fieldPreviewId=preview.dataset.fieldNode;render();
  document.querySelector('[data-field-node="'+fieldPreviewId+'"]')?.focus({preventScroll:true});
  return;
 }
 const enter=e.target.closest('[data-field-enter]');if(!enter)return;
 if(node?.id===enter.dataset.fieldEnter){
  if(phase==='shop'){openShop();return;}
  if(phase==='event'){openEvent();return;}
  if(phase==='rest'){openRest();return;}
  if(phase==='prep'){setView('arena');window.scrollTo({top:0,behavior:'instant'});return;}
 }
 chooseNode(enter.dataset.fieldEnter);fieldPreviewId=null;window.scrollTo({top:0,behavior:'instant'});
});

function arenaDeckHTML(){
 if(phase==='battle')return '<section id="live-roster" class="live-roster" aria-label="Live character status"></section>';
 if(phase!=='prep')return '';
 return `<div class="arena-roster-deck"><section class="prep-ally-controls" aria-label="Pregame companion orders"><h3><i class="arena-crest ally"></i>YOUR TEAM <span>${run.team.length} / ${capacity(run)}</span><nav class="roster-manage" aria-label="Team management"><button data-action="pack">Relic pack \u00b7 ${run.inventory.length}</button><button data-action="companions">Manage companions \u2192</button></nav></h3><div id="ally-orders" class="ally-orders"></div></section><section class="prep-enemy-controls" aria-label="Pregame opponent controls"><h3><i class="arena-crest enemy"></i>OPPONENTS <span>${foes?.length||0}</span></h3><div id="enemy-overheads" class="enemy-overheads"></div></section></div>`;
}
function eliteBadgeHTML(c){const m=eliteModifier(c);return m?`<span class="elite-badge" title="${m.text} · retained on capture">♨ ${m.name}<small>${m.text}</small></span>`:'';}
function eliteEncounterHTML(creatures){const c=creatures?.find(c=>eliteModifier(c));return c?`<div class="elite-encounter" role="note"><b>♨ ELITE MUTATION · ${eliteModifier(c).name}</b><span>${creatureName(c)} · ${eliteModifier(c).text}</span><small>Capture this individual to keep its mutation for this run and future expeditions.</small></div>`:'';}
function eliteStageHTML(n){if(n?.type!=='elite')return '';const m=encounterInfo(run,n).eliteModifier;return `<div class="elite-stage-preview"><b>♨ ${m.name}</b><span>${m.description}</span><small>One opponent carries this permanent, capturable mutation.</small></div>`;}
function eliteStarterHTML(id){const records=profile.eliteCaptures?.filter(c=>c.id===id&&eliteModifier(c))||[],chosen=records.find(c=>c.sourceUid===starterEliteSelection[id]);if(!records.length)return '<div class="elite-starter-empty">✦ Elite bonus · capture one to unlock</div>';return `<label class="elite-starter-picker">✦ ELITE CAPTURE BONUS<select data-elite-starter="${id}" aria-label="Choose captured ${BY_ID[id].name} individual"><option value="">Standard starter</option>${records.map((c,i)=>`<option value="${c.sourceUid}" ${starterEliteSelection[id]===c.sourceUid?'selected':''}>${eliteModifier(c).name} #${i+1} · ${eliteModifier(c).text}</option>`).join('')}</select><small>${chosen?eliteModifier(chosen).text:'Choose a captured individual to keep its bonus.'}</small></label>`;}
function eliteCollectionHTML(){const records=profile.eliteCaptures?.filter(c=>BY_ID[c.id]&&eliteModifier(c))||[];if(!records.length)return '';return `<section class="elite-collection"><div class="section-heading"><h2>YOUR ELITE CAPTURES <span>${records.length}</span></h2><p>Each individual keeps its mutation, nature and genes. New runs begin at level 1 with fresh equipment.</p></div><div>${records.map((c,i)=>`<button data-hunted-individual="${c.sourceUid}" class="elite-individual">${image(c)}<strong>${BY_ID[c.id].name} #${i+1}</strong>${eliteBadgeHTML(c)}<small>${c.nature||'Wild nature'} · Caught at Lv. ${c.capturedLevel}</small><span>Choose for a new expedition →</span></button>`).join('')}</div></section>`;}
function liveCommandsHTML(c,side){
 if(side===0)return `<small class="live-behavior">${POLICIES[c.policy||'adaptive']?.name||'Adaptive'} · ${c.targetMemory?creatureName(c.targetMemory):'Finding target'}</small>${eliteBadgeHTML(c)}`;
 const tool=run.selectedCapturer||'scout',chance=c.boss?0:captureChance(run,{...c,capturePreparation:{healthFraction:c.hp/c.maxHp,status:['burn','poison','root','slow','bleed'].some(k=>c[k]>0),mode:run.captureOrder?.mode||'mercy',tool}}),retry=!c.boss&&c.hp>0&&battle?.captureResult&&!battle.captureResult.success&&battle.captureAttempts<3;
 return `<button data-enemy-inspect="${c.uid}" aria-label="Inspect ${creatureName(c)}">ⓘ About</button>${retry?`<button data-enemy-capture="${c.uid}" aria-label="Retry capture of ${creatureName(c)}">◇ ${Math.round(chance*100)}%</button>`:!c.boss?`<small>◇ ${Math.round(chance*100)}% now</small>`:''}${eliteBadgeHTML(c)}`;
}
document.addEventListener('change',e=>{if(e.target.matches('[data-elite-starter]')){starterEliteSelection[e.target.dataset.eliteStarter]=e.target.value;openStarters(false);}});
document.addEventListener('click',e=>{const el=e.target.closest('[data-hunted-individual]');if(!el)return;const c=profile.eliteCaptures?.find(c=>c.sourceUid===el.dataset.huntedIndividual);if(!c||phase==='battle')return;openStarters();starterSelection=[c.id];starterEliteSelection[c.id]=c.sourceUid;openStarters(false);});

function gearSymbol(g){return artImage(gearArt(g.id),"item-art");}

function dockHTML(){
 return `<button data-view="arena" class="arena-dock-current" aria-current="page">${artImage('icon-battle')}<span>Arena</span></button>`+[['formation','formation','Deployment & AI'],['companions','team','Companions'],['capture-kit','capture','Capture'],['intel','log','Intel & log']].map(([action,icon,label])=>`<button data-action="${action}">${artImage('icon-'+icon)}<span>${label}</span>${action==='capture-kit'?`<b>${run.orbs}</b>`:''}</button>`).join('');
}
function captureSummaryHTML(){
 const target=foes?.find(c=>c.uid===run.captureOrder?.uid);
 return `<button class="capture-summary" data-action="capture-kit">${artImage('icon-target')}<span><strong>Capture: ${target?creatureName(target):'No target'}</strong><small>${target?'Automatic throw at '+Math.round(run.captureOrder.threshold*100)+'% HP':'Select a wild target before the gates open.'}</small></span><b>Set capture →</b></button>`;
}
function openCompanions(){
 selectedCreature=Math.max(0,Math.min(selectedCreature,run.team.length-1));
 const selected=run.team[selectedCreature];
 modal(`<header class="tool-heading"><h2>Your expedition <small>${run.team.length} / ${capacity(run)}</small></h2><p>Inspect skills & equipment · Deploy on the tactical grid.</p>${button('Roster & forms','roster','secondary small')}</header><div class="companions-layout"><section class="party-overview"><div class="team-grid">${run.team.map((c,i)=>`<div class="companion-loadout ${i===selectedCreature?'selected':''}">${creatureCard(c,i).replace('data-creature=','data-party-select=')}${quickEquipmentHTML(c,i)}</div>`).join('')}</div><section class="reserve-panel">${reserveTrayHTML()}${button('Manage reserves','reserves','secondary',phase==='battle')}</section></section><section class="companion-equipment"><header>${selected?image(selected):''}<div><h3>${selected?creatureName(selected):'An open place'}</h3><p>${selected?BY_ID[selected.id].role+' · Lv. '+selected.level:'Capture or recruit a companion.'}</p></div>${selected?`<button class="button secondary small" data-action="inspect-selected">Inspect skills →</button>`:''}</header>${selected?equipmentHTML(selected,selectedCreature,false):''}${equipmentTrayHTML()}</section><aside>${synergyHTML()}<section class="party-relics"><h3>Expedition relics · ${run.relics.length}</h3><div>${run.relics.map(id=>`<button data-relic="${id}" title="${RELICS.find(r=>r.id===id)?.name||id}">${artImage(relicArt(id))}</button>`).join('')||'<p>No expedition relics yet.</p>'}</div>${button('Relic pack · '+run.inventory.length,'pack','secondary')}</section>${button('Deployment & AI','formation','secondary')}${button('Done →','close')}</aside></div>`,'companions');
}
function openCaptureKit(){
 const targets=(foes||[]).filter(c=>!c.boss),plan=run.captureOrder;
 const editable=phase==='prep'&&!run.captureReservation;
 modal(`<header class="tool-heading"><div>${artImage('icon-capture')}<h2>Capture kit</h2></div><p>Weaken the target. Plan the next encounter.</p></header><div class="capture-tool-cards">${Object.entries(CAPTURERS).map(([id,t])=>`<button data-capture-method="${id}" class="capture-tool-card ${id===(plan?.tool||run.selectedCapturer||'scout')?'selected':''}" ${!editable||!(run.captureTools?.[id]>0)?'disabled':''}>${artImage('capture-'+id+'-'+(!(run.captureTools?.[id]>0)?'spent':id===(plan?.tool||run.selectedCapturer)?'ready':'idle'))}<strong>${t.name}</strong><small>Owned · ${run.captureTools?.[id]||0}</small><span>${t.mult}× basic odds</span></button>`).join('')}</div><div class="capture-kit-layout"><section><h3>Target and timing</h3><label for="kit-capture-target">Choose a wild target</label><select id="kit-capture-target" data-kit-control="target" ${editable?'':'disabled'}><option value="">No capture order</option>${targets.map(c=>`<option value="${c.uid}" ${plan?.uid===c.uid?'selected':''}>${creatureName(c)} · ${BY_ID[c.id].rarity}</option>`).join('')}</select><label for="kit-capture-mode">Approach</label><select id="kit-capture-mode" data-kit-control="mode" ${editable&&plan?'':'disabled'}><option value="mercy" ${plan?.mode!=='swift'?'selected':''}>Mercy · hold back 14% damage</option><option value="swift" ${plan?.mode==='swift'?'selected':''}>Swift · hold back 6% damage</option></select><label for="kit-capture-threshold">Auto-try at HP</label><select id="kit-capture-threshold" data-kit-control="threshold" ${editable&&plan?'':'disabled'}>${[5,10,15,25,35,45,55,65,75].map(p=>`<option value="${p}" ${p===Math.round((plan?.threshold||.25)*100)?'selected':''}>${p}% HP</option>`).join('')}</select>${plan?`<p class="capture-kit-odds">${Math.round(captureChance(run,{...targets.find(c=>c.uid===plan.uid),capturePreparation:{healthFraction:plan.threshold,mode:plan.mode,tool:plan.tool}})*100)}% estimated chance</p>`:'<p>Choose a target to see estimated odds.</p>'}<label class="auto-capture-toggle"><input type="checkbox" data-auto-capture ${run.autoCaptureRetry?'checked':''} ${editable?'':'disabled'}> Auto retry after 3 seconds · up to 3 throws</label></section><section><h3>Attempt details</h3>${artImage('capture-'+(plan?.tool||run.selectedCapturer||'scout')+'-active','capture-kit-preview')}<p>A capturer is reserved when battle starts. Lower health improves your chance; lethal damage can knock the target out first.</p><p>Successful captures fight for you immediately, then join an open place or your reserves. Their family remains unlocked for future expeditions.</p><p class="capture-warning">${phase==='battle'?'The battle plan is committed. Use the arena retry controls after a failed throw.':phase==='reward'?'Capture attempts happen during battle. Plan another attempt before the next encounter.':'Captures only happen when preselected. A failed throw spends the capturer.'}</p></section></div><div class="modal-actions">${button('Save & return to arena →','close')}</div>`,'capture-kit');
}
document.addEventListener('change',e=>{
 const el=e.target;if(!el.dataset.kitControl||phase!=='prep'||run.captureReservation)return;
 if(el.dataset.kitControl==='target'){
  if(el.value)setCaptureTarget(el.value);else run.captureOrder=null;
 }else if(run.captureOrder){
  if(el.dataset.kitControl==='mode'){run.captureOrder.mode=el.value;run.captureOrder.threshold=el.value==='mercy'?.35:.55;}
  if(el.dataset.kitControl==='threshold')run.captureOrder.threshold=Number(el.value)/100;
 }
 save();render();openCaptureKit();
});
function openIntel(){
 const info=node?encounterInfo(run,node):null;
 const tabs=[['briefing','Briefing'],['builds','Enemy builds'],['log','Battle log'],['rules','Combat rules']];
 let content='';
 if(intelTab==='briefing')content=`<div class="intel-columns"><section>${briefingHTML()}</section><section><h3>Opening stats</h3>${scoutingComparisonHTML()}<h3>Enemy build inspection</h3>${(foes||[]).map(c=>`<button class="intel-enemy" data-enemy-inspect="${c.uid}">${image(c)}<span>${creatureName(c)}<small>${BY_ID[c.id].role} · Lv. ${c.level}</small></span>${artImage('icon-arrow')}</button>`).join('')}<p>Includes worn equipment and opening relic effects.</p></section><section><h3>${artImage('rich-00')}${info?.arch.name||'The next encounter'}</h3><p>${info?.arch.desc||'Choose your next path on the star chart.'}</p><div class="thin-rule"></div><span class="section-kicker">COUNTERPLAN</span><p>${info?(node.type==='boss'?info.boss.counter:info.arch.counter):'Scout your opponents before committing.'}</p><div class="intel-weather">${artImage('rich-01')}<span>${info?.weather.name||'Clear skies'}<small>${info?.weather.desc||''}</small></span></div><h3>Rewards</h3>${artImage('cache-07','intel-chest')}<p>Gold, experience, and a chance at equipment and relics.</p>${button('Set capture →','capture-kit','secondary')}</section></div>`;
 if(intelTab==='builds')content=`<div class="intel-builds">${(foes||[]).map(c=>`<section><header>${image(c)}<div><h3>${creatureName(c)}</h3><p>${BY_ID[c.id].role} · Lv. ${c.level}</p></div><button class="button secondary" data-enemy-inspect="${c.uid}">Inspect full build →</button></header>${equipmentHTML(c,null)}${enemyCuriosHTML(c)}</section>`).join('')||'<p>No opponents at this encounter.</p>'}</div>`;
 if(intelTab==='log')content=(battle||lastReport)?`${recapHTML(battle||lastReport)}<div class="intel-log">${[...(battle?.log||lastReport?.log||[])].reverse().map(entry=>`<p><time>${entry.time}s</time> ${entry.text}</p>`).join('')||'<p>See the combat timeline above for this completed encounter.</p>'}</div>`:'<p>Battle events appear here when the gates open.</p>';
 if(intelTab==='rules')content=`<div class="intel-rules">${[['Stamina','Gold bars pay for attacks and physical dodges. Exhaustion delays actions.','icon-heart'],['Poise','Orange bars absorb pressure. Breaking poise staggers ordinary attacks.','icon-shield'],['Focus','Click a wild creature to focus it for eight seconds. Taunts and nearby threats still matter.','icon-target'],['Capture','Preselect a target. Lower health improves odds; lethal damage can knock the target out first.','icon-capture'],['Enrage','After 30 seconds both teams gradually gain damage while healing becomes weaker.','rich-00'],['Retreat','Defeat costs a life and a permanent deployed casualty, destroys worn items, and one other owned relic.','rich-04']].map(([title,copy,icon])=>`<section>${artImage(icon)}<h3>${title}</h3><p>${copy}</p></section>`).join('')}</div>${button('Status effects & combat help','help','secondary')}${button('Defeat rules','field-care','secondary')}`;
 modal(`<header class="tool-heading"><div><h2>Encounter intel</h2><p>${PLANETS[Math.min(run.planet,2)].name} · Field ${run.depth+1}</p></div><nav class="intel-tabs" aria-label="Encounter information">${tabs.map(([id,label])=>`<button data-intel-tab="${id}" aria-pressed="${intelTab===id}" class="${intelTab===id?'selected':''}">${label}</button>`).join('')}</nav></header>${content}<div class="modal-actions">${button('← Back to arena','close')}</div>`,'intel');
}
