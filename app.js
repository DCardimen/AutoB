import {
  ELEMENTS,
  SPECIES,
  BY_ID,
  STARTERS,
  RARITY,
  PLANETS,
  RELICS,
  rng,
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
  applyEvent,
  Battle,
  PERSONAL_RELICS,
  PERSONAL_BY_ID,
  personalRelic,
  equipRelic,
  unequipRelic,
  linkedSupport,
  linkRelic,
  creatureName,
  evolutionStage,
  relicSlots,
  evolutionOffer,
  evolveCreature,
  EVOLUTION_PATHS,
} from "./game.js";
import { SKILLS, loadoutFor } from "./skills.js";
import { creatureImage, renderBattle } from "./art.js";
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
let profile = {
  owned: [...STARTERS],
  runs: 1,
  best: 0,
  victories: 0,
  tutorial: false,
  sound: false,
  formDiscoveries: {},
  ...saved?.profile,
};
profile.owned = [
  ...new Set([...STARTERS, ...profile.owned.filter((id) => BY_ID[id])]),
];
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
  starterSelection = [...STARTERS],
  speed = 1,
  paused = false,
  canvas = null,
  ctx = null,
  last = performance.now(),
  toastTimer,
  modalKind = null,
  selectedCreature = 0,
  recordedEnd = false;
if (saved?.run?.team?.length === 6 && saved.run.planet <= 3) {
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
} else freshRun(STARTERS, false);
run.inventory ??= [];
for (const c of [...run.team, ...run.bench]) c.relics ??= [];
function freshRun(ids, increment = true) {
  if (increment) profile.runs++;
  run = makeRun(Date.now() % 2147483647, ids);
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
        version: 1,
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
function render() {
  updateHeader();
  document
    .querySelectorAll("[data-view]")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.view === viewName),
    );
  $("#view").innerHTML =
    viewName === "arena"
      ? arenaHTML()
      : viewName === "map"
        ? mapHTML()
        : collectionHTML();
  canvas = $("#battle-canvas");
  ctx = canvas?.getContext("2d");
  if (canvas) {
    resizeCanvas();
  }
  if (viewName === "arena") bindDrag();
}
function updateHeader() {
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
  return `${!profile.tutorial ? `<div class="tutorial-callout"><span>Welcome, explorer. Your six companions are ready. Enter battle to begin — or inspect a creature to shape your strategy.</span><button data-action="dismiss-tutorial" aria-label="Dismiss welcome">×</button></div>` : ""}<div class="arena-grid"><div class="arena-main"><section class="panel arena-panel"><div class="panel-top"><span class="panel-title">THE OVERGROWN ARENA <span style="color:#687d5d;margin-left:9px">/ ${String(run.depth + 1).padStart(2, "0")}</span></span><span class="status-dot ${live ? "live" : ""}"><i></i> ${live ? "BATTLE IN PROGRESS" : phase === "reward" ? "ENCOUNTER COMPLETE" : mapWaiting ? "AWAITING YOUR PATH" : ended ? "EXPEDITION ENDED" : "PREPARING FOR BATTLE"}</span></div><div class="arena-viewport"><canvas id="battle-canvas" aria-label="Real-time creature arena. Your expedition is on the left, wild creatures on the right."></canvas><div class="arena-label"><span class="location-icon">${ICONS[type]}</span><div><strong>${type === "boss" ? p.bossName : "The Forgotten Colosseum"}</strong><small>${p.name.toUpperCase()} · ${LABELS[type].toUpperCase()}</small></div></div><div class="arena-timer" id="arena-timer">${live ? "00:00" : "READY"}</div>${type === "boss" ? `<div class="boss-banner"><div><span>${p.bossName}</span><small id="boss-phase">PHASE I</small></div><div class="boss-health-track"><i id="boss-health" style="width:100%"></i></div></div>` : ""}<div class="arena-bottom-labels"><span id="ally-count">YOUR EXPEDITION · 6</span><span class="versus">vs.</span><span id="foe-count">THE WILDS · ${foes?.length || 4}</span></div></div><div class="arena-control"><div class="control-left"><button class="pause-btn" data-action="pause" title="Pause battle (Space)" aria-label="Pause battle" ${!live ? "disabled" : ""}>${paused ? "▶" : "II"}</button><div class="speed-switch" aria-label="Battle speed">${[1, 2, 3].map((v) => `<button data-speed="${v}" class="${speed === v ? "active" : ""}">${v}×</button>`).join("")}</div><span class="control-note"><kbd>SPACE</kbd> to pause</span></div>${mainAction}</div></section><div class="formation-section"><div class="section-heading"><h2>YOUR EXPEDITION <span>6 / 6</span></h2><p>Drag to reposition · Click to inspect</p><div class="segmented" title="Team AI priority">${["balanced", "hunt", "guard"].map((s) => `<button data-stance="${s}" class="${run.stance === s ? "active" : ""}" ${live ? "disabled" : ""}>${{ balanced: "Balanced", hunt: "Hunt", guard: "Guard" }[s]}</button>`).join("")}</div></div><div class="team-grid">${run.team.map((u, i) => creatureCard(u, i)).join("")}</div></div><div class="relic-section"><span class="relic-heading">✧ EXPEDITION RELICS <span class="muted">${run.relics.length}</span></span><button class="text-button pack-button" data-action="pack">◈ Relic pack · ${run.inventory.length}</button>${
    run.relics.length
      ? `<div class="relic-list">${run.relics
          .map((id) => {
            const r = RELICS.find((r) => r.id === id);
            return `<button class="relic-item" data-relic="${id}" style="--relic:${r.color}" title="${r.name}: ${r.desc}" aria-label="${r.name}">${r.icon}</button>`;
          })
          .join("")}</div>`
      : '<span class="relic-empty">A story yet to be written. Find relics at outposts and along your path.</span>'
  }</div><div class="battle-feed"><time id="feed-time">✧</time><span id="feed-text">${live ? battle?.log[0]?.text || "The gates open." : "Your formation is set. Let your companions do the fighting."}</span><button class="text-button" data-action="report" style="margin-left:auto;white-space:nowrap">Battle log →</button></div></div><aside class="side-column">${briefingHTML()}${synergyHTML()}</aside></div>`;
}
function creatureCard(u, i) {
  const s = BY_ID[u.id],
    e = ELEMENTS[s.element];
  return `<button class="creature-card" data-creature="${i}" draggable="${phase !== "battle"}" style="--element:${e.color}" title="${s.name} · ${s.role} · ${s.skill}"><div class="card-top"><span>${String(i + 1).padStart(2, "0")} <span style="margin-left:4px">${s.role.toUpperCase()}</span></span><span class="role-icon">${ROLES[s.role]}</span></div>${image(u, "creature-art")}<strong>${creatureName(u)}${u.level >= 5 ? ' <span class="awakened">✧</span>' : ""}</strong><div class="card-meta"><span class="element-name" style="color:${e.color}">${e.icon} ${e.name}</span><b>Lv. ${u.level}</b></div><div class="mini-skills">${[loadoutFor(s, u.level).auto, ...loadoutFor(s, u.level).active].map((id) => `<span class="mini-ability ${SKILLS[id].auto ? "auto" : ""}" data-unit-skill="${i}:${id}" title="${SKILLS[id].name}: ${SKILLS[id].desc}">${SKILLS[id].auto ? "⌁" : SKILLS[id].icon}<i></i></span>`).join("")}</div><div class="xp-track" title="${u.xp} / ${xpNeeded(u.level)} EXP"><i style="width:${(u.xp / xpNeeded(u.level)) * 100}%"></i></div><div class="card-slots" title="${(u.relics || []).length} of ${relicSlots(u)} personal relic slots filled">${Array.from({ length: relicSlots(u) }, (_, j) => `<span class="${u.relics?.[j] ? "filled" : ""}" style="color:${u.relics?.[j] ? PERSONAL_BY_ID[u.relics[j].id].color : ""}">${u.relics?.[j] ? "◆" : "◇"}</span>`).join("")}<small>${(u.relics || []).length} / ${relicSlots(u)}</small></div><i class="card-health" style="width:0%"></i></button>`;
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
      "A rare creature gathers here. Defeat a smaller group and capture with a 12% bonus chance.",
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
        `<button class="opponent-thumb" data-foe="${u.id}" title="${creatureName(u)} · ${BY_ID[u.id].rarity}">${image(u)}</button>`,
    )
    .join(
      "",
    )}</div><div class="thin-rule"></div><span class="section-kicker">VICTORY REWARDS</span><div class="reward-preview"><span>◉ ${type === "boss" ? 145 : type === "elite" ? 85 : 48 + run.depth * 4} gold</span><span>✧ ${Math.round((type === "boss" ? 72 : type === "elite" ? 46 : 32 + run.depth * 3) * (1 + run.planet * 0.35))} EXP</span><span>◈ Capture</span></div><div class="tactical-tip"><strong>AN EXPLORER’S INSTINCT</strong>${type === "boss" ? "Boss creatures have reinforced health. Protect your healers and invest in cooldowns." : "Two of a kind is a beginning. Pair elements to awaken synergies — your Ember and Grove bonds are already active."}</div></section>`;
}
function synergyHTML() {
  const syn = synergies(run.team);
  return `<section class="panel synergy-panel"><div class="side-section-heading"><span class="panel-title">TEAM SYNERGIES</span><span class="tag">${activeSynergies()} ACTIVE</span></div><div class="synergy-rows">${Object.entries(
    syn,
  )
    .sort((a, b) => b[1] - a[1])
    .map(([el, n]) => {
      const e = ELEMENTS[el];
      return `<div class="synergy-row" style="--element:${e.color}" title="${e.description}"><span class="element-badge">${e.icon}</span><div><strong style="color:${n >= 2 ? e.color : "#8ca07d"}">${e.name} ${n >= 2 ? "bond" : ""}</strong><small>${n >= 2 ? { ember: "Basic attacks apply burn", grove: "Regenerate 1% HP per second", tide: "+18% team health", storm: "18% faster skill cooldowns", void: "12% team lifesteal" }[el] : "Add one more to activate"}</small><div class="pips">${[0, 1, 2, 3].map((i) => `<i class="${i < n ? "filled" : ""}"></i>`).join("")}</div></div><span class="count">${n}<em> / 4</em></span></div>`;
    })
    .join("")}</div></section>`;
}
function mapHTML() {
  if (!run.route) run.route = generateRoute(run);
  let connections = "";
  const positions = [];
  run.route.forEach((row, d) =>
    row.forEach((n, i) =>
      positions.push({
        ...n,
        x: row.length === 1 ? 50 : 20 + i * 30,
        y: 87 - d * 15,
      }),
    ),
  );
  for (const a of positions)
    for (const b of positions)
      if (
        b.depth === a.depth + 1 &&
        (b.type === "boss" || Math.abs(a.lane - b.lane) <= 1)
      ) {
        const chosen = run.path.includes(a.id) && run.path.includes(b.id);
        connections += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${chosen ? "#9ab17d" : "#485c3b"}" stroke-width="${chosen ? ".35" : ".2"}" ${chosen ? "" : 'stroke-dasharray=".9 1.1"'}/>`;
      }
  return `<div class="map-grid"><section class="panel map-panel"><div class="panel-top"><span class="panel-title">${PLANETS[Math.min(run.planet, 2)].name.toUpperCase()} · ROUTE ${run.planet + 1}</span><span class="status-dot"><i></i> ${run.complete ? "EXPEDITION COMPLETE" : phase === "battle" ? "BATTLE IN PROGRESS" : `ENCOUNTER ${run.depth + 1} / 6`}</span></div><div class="route"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${connections}</svg>${positions
    .map((n) => {
      const available =
        canVisit(run, n) &&
        phase !== "battle" &&
        phase !== "reward" &&
        phase !== "ended";
      return `<button class="route-node ${available ? "available" : ""} ${run.path.includes(n.id) ? "visited" : ""} ${n.type === "boss" ? "boss" : ""} ${node?.id === n.id && phase === "prep" ? "selected" : ""}" data-node="${n.id}" style="left:${n.x}%;top:${n.y}%" ${!available ? "disabled" : ""} aria-label="${LABELS[n.type]}, encounter ${n.depth + 1}" title="${LABELS[n.type]} · ${available ? "Available path" : run.path.includes(n.id) ? "Visited" : "Not yet reachable"}">${run.path.includes(n.id) && n.depth < run.depth ? "✓" : ICONS[n.type]}<small>${LABELS[n.type].toUpperCase()}</small></button>`;
    })
    .join(
      "",
    )}</div><div class="map-description">${phase === "battle" ? "Your companions are fighting. Return to the arena to watch." : phase === "reward" ? "Claim your battle rewards before choosing the next encounter." : "Choose a glowing encounter. Paths connect only to neighboring lanes."}</div><div class="map-legend">${Object.entries(
    LABELS,
  )
    .map(([t, l]) => `<span><b>${ICONS[t]}</b>${l}</span>`)
    .join(
      "",
    )}</div></section><aside class="side-column"><section class="panel planet-list"><span class="panel-title">YOUR JOURNEY</span>${PLANETS.map((p, i) => `<div class="planet-row ${i > run.planet ? "future" : ""}"><span class="planet-orb" style="--planet:${p.color}"></span><div><strong>${p.name}</strong><small>${i < run.planet ? "World explored" : i === run.planet ? p.sub : "Beyond the horizon"}</small></div><span>${i < run.planet ? "✓" : i === run.planet ? "→" : "·"}</span></div>`).join("")}<div class="thin-rule"></div><p class="muted" style="font-size:11px;line-height:1.9;margin:0">Six encounters per world. Victory opens neighboring paths. A retreat costs a life, but you can still move forward.</p></section>${synergyHTML()}<section class="panel briefing"><span class="section-kicker">A LITTLE FORESIGHT</span><p style="margin-top:12px">Shops reward saving. Elites reward strength. Captures reward curiosity. You can’t take every path — choose what your team is missing.</p></section></aside></div>`;
}
function collectionHTML() {
  const shown = SPECIES.filter(
    (s) =>
      filter === "all" ||
      (filter === "owned" && profile.owned.includes(s.id)) ||
      s.element === filter,
  );
  return `<div class="collection-banner"><div><h2>Every ending is a new beginning.</h2><p>Captured creatures become permanent starters. Build a new six-creature team within a 12-point budget.</p></div>${button('Build an expedition <span class="arrow">→</span>', "new-run", "secondary")}</div><div class="collection-toolbar"><div class="filters">${[{ id: "all", name: "All creatures" }, { id: "owned", name: "Discovered" }, ...Object.entries(ELEMENTS).map(([id, e]) => ({ id, name: e.name }))].map((f) => `<button data-filter="${f.id}" class="${filter === f.id ? "active" : ""}">${f.name}</button>`).join("")}</div><p><strong style="color:#c2d5b0">${profile.owned.length}</strong> / ${SPECIES.length} discovered · ${profile.victories} completed expeditions</p></div><div class="codex-grid">${shown
    .map((s) => {
      const owned = profile.owned.includes(s.id);
      const discoveredForm = {
        id: s.id,
        evolution: profile.formDiscoveries[s.id] || 0,
        evolutionPath: "wild",
      };
      return `<button class="creature-card codex-card ${owned ? "" : "locked"}" data-codex="${s.id}" style="--element:${ELEMENTS[s.element].color}"><div class="card-top"><span style="color:${owned ? RARITY[s.rarity].color : "#6b7d62"}">${s.rarity.toUpperCase()}</span><span class="role-icon">${owned ? ROLES[s.role] : "◇"}</span></div>${image(discoveredForm, "creature-art")}<strong>${owned ? s.name : "Undiscovered"}</strong><div class="card-meta"><span style="color:${owned ? ELEMENTS[s.element].color : ""}">${ELEMENTS[s.element].icon} ${ELEMENTS[s.element].name}</span><span>${s.role}</span></div><div class="thin-rule" style="margin:13px 0 8px"></div><span style="font-size:8px;color:#8fa280">${owned ? (evolutionStage(discoveredForm) ? "EVOLVED FORM DISCOVERED · BASE STARTER" : "AVAILABLE AS A STARTER") : "ENCOUNTER & CAPTURE TO UNLOCK"}</span></button>`;
    })
    .join("")}</div>`;
}
function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
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
      if (phase === "battle" || dragIndex === null) return;
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
  modalKind = kind;
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${kind}">${closable ? '<button class="modal-close" data-action="close" aria-label="Close dialog">×</button>' : ""}${html}</section></div>`;
  const first = $("#modal-root button:not(:disabled)");
  setTimeout(() => first?.focus(), 30);
}
function closeModal() {
  modalKind = null;
  $("#modal-root").innerHTML = "";
}
function openCreature(i) {
  selectedCreature = i;
  const u = run.team[i];
  openDetail(u, i);
}
function discoverForm(c) {
  profile.formDiscoveries ||= {};
  profile.formDiscoveries[c.id] = Math.max(
    profile.formDiscoveries[c.id] || 0,
    evolutionStage(c),
  );
}
function evolutionHTML(u, index) {
  const stage = evolutionStage(u),
    offer = evolutionOffer(run, u);
  const forms = [0, 1, 2]
    .map((level) => {
      const form = {
        ...u,
        evolution: level,
        evolutionPath: u.evolutionPath || "wild",
      };
      return (
        '<div class="evolution-form ' +
        (stage === level ? "current" : "") +
        '">' +
        image(form) +
        "<strong>" +
        creatureName(form) +
        "</strong><small>" +
        (level === 0
          ? "BASE FORM"
          : level === 1
            ? "LEVEL 5"
            : "LEVEL 8 · ASCENDANT") +
        "</small></div>"
      );
    })
    .join('<span class="evolution-arrow">→</span>');
  let controls;
  if (index === null)
    controls =
      '<p class="starter-note">Evolve an active companion at level 5 for 50 gold; ascend it at level 8 for 100 gold. Each transformation adds a relic socket. Discovered forms remain in your menagerie; future runs start in the base form.</p>';
  else if (stage === 2)
    controls =
      '<p class="evolution-status">✧ Fully ascended · Two additional relic sockets · Your skill links are preserved</p>';
  else {
    controls =
      '<div class="evolution-choices">' +
      (stage ? [u.evolutionPath] : ["wild", "warden"])
        .map((path) => {
          const effect = stage
            ? path === "wild"
              ? "+25% base ATK · +18% base HP · signature damage +28%"
              : "+35% base HP · +12% base ATK · healing & shields +50%"
            : path === "wild"
              ? "+15% ATK · +10% HP · signature damage +16%"
              : "+20% HP · +6% ATK · healing & shields +25%";
          return (
            '<button class="evolution-choice ' +
            path +
            '" data-evolve="' +
            path +
            '" data-index="' +
            index +
            '" ' +
            (!offer.ready || phase === "battle" ? "disabled" : "") +
            "><span>" +
            (path === "wild" ? "⌁" : "◈") +
            "</span><strong>" +
            (stage
              ? "Ascend " + EVOLUTION_PATHS[path].name + " form"
              : EVOLUTION_PATHS[path].name + " evolution") +
            "</strong><small>" +
            effect +
            "<br>+1 relic socket · " +
            (path === "warden"
              ? (stage ? "13%" : "7%") + " faster cooldowns · "
              : "") +
            offer.cost +
            " gold</small></button>"
          );
        })
        .join("") +
      '</div><p class="starter-note">' +
      (phase === "battle"
        ? "Transform between battles."
        : offer.ready
          ? "Choose a path for this expedition. Ascension strengthens that path; gems stay linked."
          : offer.reason + ".") +
      " You can evolve any rarity.</p>";
  }
  return (
    '<section class="evolution-panel"><div class="section-heading"><h3>EVOLUTION LINEAGE</h3><span class="section-kicker">' +
    (stage
      ? EVOLUTION_PATHS[u.evolutionPath || "wild"].name.toUpperCase() + " PATH"
      : "YOUR NEXT CHAPTER") +
    '</span></div><div class="evolution-line">' +
    forms +
    "</div>" +
    controls +
    "</section>"
  );
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
      '<span>.</span></h2><p>A new form. A stronger bond. One more relic socket.</p><div class="tags">' +
      tag(EVOLUTION_PATHS[path].name + " path") +
      tag(relicSlots(u) + " relic sockets") +
      tag("Skills & gems preserved") +
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
    `<div class="detail-top">${image(u)}<div><span class="section-kicker" style="color:${RARITY[s.rarity].color}">${s.rarity.toUpperCase()} CREATURE</span><h2>${creatureName(u)}</h2><p style="margin:0">${s.role} · ${e.name} · Level ${u.level}</p><div class="tags">${tag(`${ROLES[s.role]} ${s.role}`)}${tag(`${e.icon} ${e.name}`)}</div></div></div><div class="stat-grid"><div class="stat"><small>HEALTH</small><strong>${st.hp}</strong></div><div class="stat"><small>ATTACK</small><strong>${st.atk}</strong></div><div class="stat"><small>MOVEMENT</small><strong>${Math.round(st.speed)}</strong></div><div class="stat"><small>SKILL COOLDOWN</small><strong>${st.cd.toFixed(1)}s</strong></div></div>${evolutionHTML(u, index)}${skillsHTML(u, index)}${loadoutHTML(u, index)}${index !== null ? `<div class="focus-control"><span class="section-kicker">TRAINING FOCUS · CHOOSE BEFORE BATTLE</span><div class="segmented">${["balanced", "aggressive", "defensive", "swift"].map((f) => `<button data-focus="${f}" data-index="${index}" class="${u.focus === f ? "active" : ""}" ${phase === "battle" ? "disabled" : ""}>${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join("")}</div><p style="font-size:10px;margin:9px 0 0">${{ balanced: "Natural strengths. No stat tradeoffs.", aggressive: "+15% attack · −8% health.", defensive: "+15% health · −8% attack.", swift: "15% faster skills · −6% attack." }[u.focus || "balanced"]}</p></div><div class="thin-rule"></div><span class="section-kicker">SWAP WITH A COMPANION ON YOUR BENCH</span><div class="bench-list">${run.bench.length ? run.bench.map((b, j) => `<button class="bench-button" data-swap="${j}" data-index="${index}" ${phase === "battle" ? "disabled" : ""}>${image(b)}${creatureName(b)}<br><span class="muted">Lv. ${b.level}</span></button>`).join("") : '<div class="empty-bench">Capture a creature or recruit one at an outpost to fill your bench.</div>'}</div><p class="starter-note">${u.level >= 5 && !evolutionStage(u) ? "EVOLUTION AVAILABLE · INSPECT YOUR EVOLUTION PATH ABOVE · " : ""}${u.level >= 5 ? "AWAKENED · THIRD SKILL UNLOCKED · " : ""}${u.xp} / ${xpNeeded(u.level)} EXP toward the next level · ${u.training || 0} training upgrades</p>` : locked ? '<p class="disabled-note">Find this creature in the wild and capture it to unlock it as a future starter.</p>' : `<p style="font-size:11px">${e.description}. Rare companions have stronger base stats and specialized skills.</p>`}${button("Back to expedition", "close", "secondary")}`,
    "creature",
  );
}
function startBattle() {
  if (
    phase !== "prep" ||
    !["battle", "elite", "boss", "capture"].includes(node.type)
  )
    return;
  if (!committed) {
    enterNode(run, node);
    committed = true;
  }
  battle = new Battle(run, foes, node.seed);
  phase = "battle";
  paused = false;
  reward = null;
  captureTarget = null;
  captureAttempted = false;
  upgradeChosen = null;
  save();
  render();
  sound("start");
}
function finishBattle() {
  const won = battle.winner === 0;
  reward = {
    ...rewardBattle(run, node.type, won),
    won,
    damage: Math.round(
      battle.units
        .filter((u) => u.side === 0)
        .reduce((sum, u) => sum + u.damage, 0),
    ),
    time: battle.time,
    personalRelic: pick(PERSONAL_RELICS, rng(node.seed + 888)).id,
  };
  if (won) {
    const candidates = foes;
    captureTarget = candidates
      .slice()
      .sort(
        (a, b) =>
          RARITY[BY_ID[b.id].rarity].cost - RARITY[BY_ID[a.id].rarity].cost,
      )[0];
  }
  phase = "reward";
  profile.best = Math.max(profile.best, run.wins);
  save();
  render();
  sound(won ? "win" : "loss");
  openRewards();
}
function openRewards() {
  if (!reward) return;
  const won = reward.won;
  const upgrades = [
    {
      id: "training",
      icon: "→",
      name: "Sharpen the pack",
      desc: "Every companion gains +7% base health and attack for this run.",
    },
    {
      id: "gear",
      icon: PERSONAL_BY_ID[reward.personalRelic || "quick-shard"].icon,
      name: PERSONAL_BY_ID[reward.personalRelic || "quick-shard"].name,
      desc:
        PERSONAL_BY_ID[reward.personalRelic || "quick-shard"].desc +
        " A support gem to socket and link.",
    },
    {
      id: "orbs",
      icon: "◈",
      name: "Stay curious",
      desc: "Gain 2 capture orbs. More chances to meet your next favorite.",
    },
    {
      id: "gold",
      icon: "◉",
      name: "Plan ahead",
      desc: "Gain 45 extra gold. Save for a relic that changes everything.",
    },
  ];
  modal(
    `<div class="result-hero"><span class="result-sigil">${won ? "✧" : "↩"}</span><span class="section-kicker" style="display:block">${won ? "ANOTHER STORY TO TELL" : "LIVE TO FIGHT ANOTHER DAY"}</span><h2>${won ? "The wilds remember you." : "A difficult lesson."}</h2><p>${won ? (node.type === "boss" ? "A world opens its gates. Your next planet awaits." : "Your companions grow stronger. A new path is opening.") : `The team retreats and recovers. ${run.integrity} expedition ${run.integrity === 1 ? "life remains" : "lives remain"}.`}</p><div class="result-summary"><span>◉ +${reward.gold} gold</span><span>✧ +${reward.xp} EXP / creature</span><span>◷ ${Math.floor(reward.time)}s</span></div>${reward.levels?.length ? `<p class="result-levels">LEVEL UP · ${reward.levels.map((id) => BY_ID[id].name).join(" · ")}</p>` : ""}</div>${won ? `<span class="section-kicker">CHOOSE ONE EXPEDITION UPGRADE</span><div class="upgrade-grid">${upgrades.map((u) => `<button class="upgrade-card ${upgradeChosen === u.id ? "selected" : ""}" data-upgrade="${u.id}" ${upgradeChosen ? "disabled" : ""}><span class="upgrade-symbol">${u.icon}</span><strong>${upgradeChosen === u.id ? "✓ " : ""}${u.name}</strong><p>${u.desc}</p></button>`).join("")}</div>${captureTarget ? `<div class="capture-box ${reward.captureSuccess ? "captured" : ""}">${image(captureTarget)}<div><span class="section-kicker" style="color:${RARITY[BY_ID[captureTarget.id].rarity].color}">${BY_ID[captureTarget.id].rarity.toUpperCase()} · POTENTIAL COMPANION</span><strong style="display:block;margin-top:5px">${creatureName(captureTarget)}</strong><p>Lv. ${captureTarget.level} · ${BY_ID[captureTarget.id].role}<br>${captureAttempted ? (reward.captureSuccess ? "Captured! Added to your bench and permanent collection." : "The orb shattered. Another encounter, another chance.") : "Capture it for this run. Keep it for the next."}</p>${!captureAttempted ? `<small>${Math.round(captureChance(run, captureTarget) * 100)}% chance · ${run.orbs} orbs remaining</small>` : ""}</div>${button(captureAttempted ? (reward.captureSuccess ? "✓ Captured" : "Escaped") : "Throw an orb · 1 ◈", "capture", "secondary", captureAttempted || run.orbs <= 0 || run.bench.length >= 12)}</div>` : ""}` : ""}<div class="modal-actions">${button(won ? "Continue the journey →" : run.integrity <= 0 ? "End expedition →" : node.type === "boss" ? "Challenge the guardian again →" : "Choose the next path →", "continue", "", won && !upgradeChosen)}</div>`,
    "reward",
    false,
  );
}
function chooseUpgrade(id) {
  if (upgradeChosen || phase !== "reward" || !reward.won) return;
  if (id === "training")
    run.team.forEach((c) => (c.training = (c.training || 0) + 1));
  if (id === "gear")
    run.inventory.push(personalRelic(reward.personalRelic || "quick-shard"));
  if (id === "orbs") run.orbs += 2;
  if (id === "gold") run.gold += 45;
  upgradeChosen = id;
  save();
  updateHeader();
  openRewards();
}
function tryCapture() {
  if (captureAttempted || !captureTarget || phase !== "reward") return;
  const result = rollCapture(run, captureTarget);
  if (result.reason) {
    toast(result.reason);
    return;
  }
  captureAttempted = true;
  reward.captureSuccess = result.success;
  if (result.success) {
    discoverForm(result.creature);
    unlock(captureTarget.id);
  }
  save();
  updateHeader();
  openRewards();
  sound(result.success ? "capture" : "loss");
}
function continueRun() {
  if (phase !== "reward" || (reward.won && !upgradeChosen)) return;
  closeModal();
  if (run.integrity <= 0) {
    endRun(false);
    return;
  }
  if (!reward.won && node.type === "boss") {
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
function chooseNode(id) {
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
  node = n;
  run.encounterType = n.type;
  committed = false;
  if (["battle", "elite", "boss", "capture"].includes(n.type)) {
    phase = "prep";
    foes = encounter(run, n.type, n.seed);
    viewName = "arena";
    save();
    render();
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
      eventIndex = Math.min(run.planet, 2);
      save();
      openEvent();
    }
    if (n.type === "rest") openRest();
  }
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
  const r = rng(node.seed);
  const available = RELICS.filter((r) => !run.relics.includes(r.id));
  const relics = [];
  while (available.length && relics.length < 3) {
    const i = Math.floor(r() * available.length);
    relics.push(available.splice(i, 1)[0].id);
  }
  const options = SPECIES.filter((s) => s.rarity !== "Legendary");
  const personal = [];
  const gear = [...PERSONAL_RELICS];
  while (personal.length < 3) {
    const i = Math.floor(r() * gear.length);
    personal.push(gear.splice(i, 1)[0].id);
  }
  return {
    relics,
    personal,
    creature: pick(options, r).id,
    sold: [],
    rerolls: 0,
  };
}
function openShop() {
  shopStock = shopStock || stockShop();
  save();
  const stock = shopStock;
  stock.personal ??= ["ward-stone", "moonstone", "echo-prism"];
  modal(
    `<div class="modal-head-row"><span class="section-kicker">THE WAYFARER’S OUTPOST</span><span class="modal-currency">◉ ${run.gold}</span></div><h2>A little edge goes a long way.</h2><p>Relics reshape your whole team. Companions reshape your possibilities.</p><div class="shop-grid">${stock.relics
      .map((id) => {
        const r = RELICS.find((r) => r.id === id),
          sold = run.relics.includes(id);
        return `<div class="shop-card ${sold ? "sold" : ""}"><span class="shop-icon" style="color:${r.color}">${r.icon}</span><h3>${r.name}</h3><p>${r.desc}</p>${button(sold ? "✓ Equipped" : `◉ ${r.cost}`, `buy-${id}`, "secondary small", sold || run.gold < r.cost)}</div>`;
      })
      .join(
        "",
      )}</div><div class="thin-rule"></div><span class="section-kicker">SUPPORT GEMS · LINK TO INDIVIDUAL SKILLS</span><div class="shop-personal-grid">${stock.personal
      .map((id) => {
        const r = PERSONAL_BY_ID[id],
          sold = stock.sold.includes(id);
        return `<div class="shop-personal"><span style="color:${r.color}">${r.icon}</span><strong>${r.name}</strong><p>${r.desc}</p>${button(sold ? "✓ In your pack" : `◉ ${r.cost}`, `buy-personal-${id}`, "secondary small", sold || run.gold < r.cost)}</div>`;
      })
      .join(
        "",
      )}</div><div class="shop-supplies"><span>◈ <strong>Capture supplies</strong><br><span class="muted" style="font-size:9px">One orb. One more possibility.</span></span>${button("◉ 35 · +1 orb", "buy-orb", "secondary small", run.gold < 35)}</div><div class="shop-supplies"><div class="shop-companion" style="display:flex;align-items:center;gap:10px">${image(stock.creature)}<span><strong>${BY_ID[stock.creature].name}</strong><br><span style="font-size:9px;color:${RARITY[BY_ID[stock.creature].rarity].color}">${BY_ID[stock.creature].rarity} · ${BY_ID[stock.creature].role}</span></span></div>${button(stock.sold.includes("creature") ? "✓ Recruited" : `◉ ${RARITY[BY_ID[stock.creature].rarity].cost} · Recruit`, "buy-creature", "secondary small", stock.sold.includes("creature") || run.gold < RARITY[BY_ID[stock.creature].rarity].cost || run.bench.length >= 12)}</div><div class="modal-actions">${button(`Refresh relics · ◉ ${20 + stock.rerolls * 15}`, "reroll", "ghost", run.gold < 20 + stock.rerolls * 15)}${button("Leave outpost →", "leave-node")}</div>`,
    "shop",
    false,
  );
}
function purchase(action) {
  if (phase !== "shop") return;
  let success = false;
  if (action.startsWith("buy-personal-")) {
    const id = action.slice(13),
      r = PERSONAL_BY_ID[id];
    if (
      r &&
      shopStock.personal.includes(id) &&
      !shopStock.sold.includes(id) &&
      run.gold >= r.cost
    ) {
      run.gold -= r.cost;
      run.inventory.push(personalRelic(id));
      shopStock.sold.push(id);
      success = true;
    }
  } else if (action === "buy-orb" && run.gold >= 35) {
    run.gold -= 35;
    run.orbs++;
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
  const price = 20 + shopStock.rerolls * 15;
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
  return (
    (c.kind === "relic" &&
      (run.gold < c.cost || run.relics.includes(c.relic))) ||
    (c.kind === "trade" && (run.orbs < c.cost || run.bench.length >= 12)) ||
    (c.kind === "sacrifice" &&
      (run.integrity <= 1 || run.relics.includes(c.relic))) ||
    (c.kind === "risk" && (run.integrity <= 1 || run.bench.length >= 12))
  );
}
function openEvent() {
  const e = EVENTS[eventIndex];
  modal(
    `<span class="section-kicker">AN UNKNOWN SIGNAL · ${PLANETS[run.planet].name.toUpperCase()}</span><h2>${e.title}.</h2><div class="event-art">${["❋", "✧", "⌛"][eventIndex]}</div><p>${e.story}</p><div class="choice-list">${e.choices.map((c, i) => `<button class="event-choice" data-event="${i}" ${eventDisabled(c) ? "disabled" : ""}><strong>${c.title} <span style="float:right;color:#c1dba5">→</span></strong><p>${c.desc}</p></button>`).join("")}</div>`,
    "event",
    false,
  );
}
function eventChoose(i) {
  if (phase !== "event") return;
  const result = applyEvent(run, EVENTS[eventIndex], i);
  if (!result.ok) return;
  if (result.captured) unlock(result.captured);
  toast(result.message);
  leaveNode();
}
function openRest() {
  modal(
    `<span class="section-kicker">A QUIET GROVE</span><h2>Let the world wait.</h2><div class="event-art">❋</div><p>Your companions gather beneath the glowing canopy. There is time for one thing before the journey continues.</p><div class="choice-list"><button class="event-choice" data-action="rest-life" ${run.integrity >= 3 ? "disabled" : ""}><strong>Mend the expedition <span style="float:right">♡</span></strong><p>Recover one expedition life. Currently ${run.integrity} / 3.</p></button><button class="event-choice" data-action="rest-xp"><strong>Practice together <span style="float:right">✧</span></strong><p>Every active creature gains 40 EXP. Stronger bonds, stronger companions.</p></button><button class="event-choice" data-action="rest-orbs"><strong>Search the undergrowth <span style="float:right">◈</span></strong><p>Find 2 capture orbs. The next companion might be just around the bend.</p></button></div>`,
    "rest",
    false,
  );
}
function starterCost(id) {
  return { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 6 }[
    BY_ID[id].rarity
  ];
}
function openStarters(reset = true) {
  if (phase === "battle") {
    toast("Finish this battle before starting a new expedition.");
    return;
  }
  if (reset) starterSelection = [...STARTERS];
  const cost = starterSelection.reduce((s, id) => s + starterCost(id), 0);
  modal(
    `<span class="section-kicker">A NEW EXPEDITION</span><h2>Choose your unlikely heroes.</h2><p>Six companions. Twelve points. Captures from past expeditions let you start with rarer creatures — if you can afford the team around them.</p><div class="starter-budget"><span>${starterSelection.length} / 6 companions</span><strong style="color:${cost > 12 ? "#f4a391" : ""}">${cost} / 12 starter points</strong></div><div class="starter-grid">${profile.owned
      .map((id) => {
        const s = BY_ID[id],
          selected = starterSelection.includes(id);
        return `<button class="starter-card ${selected ? "selected" : ""}" data-starter="${id}"><span class="starter-check">${selected ? "✓" : starterCost(id) + "pt"}</span>${image(id)}<strong>${s.name}</strong><small style="color:${RARITY[s.rarity].color}">${s.rarity} · ${starterCost(id)} ${starterCost(id) === 1 ? "point" : "points"}</small></button>`;
      })
      .join(
        "",
      )}</div><p class="starter-note">Starting a new expedition replaces your current run. Your permanent menagerie remains.</p><div class="modal-actions">${button("Keep exploring", "close", "ghost")}${button("Set off for the stars →", "confirm-run", "", starterSelection.length !== 6 || cost > 12)}</div>`,
    "starters",
  );
}
function selectStarter(id) {
  if (starterSelection.includes(id))
    starterSelection = starterSelection.filter((x) => x !== id);
  else if (starterSelection.length < 6) starterSelection.push(id);
  else {
    toast("Deselect a companion first. Your team has six places.");
    return;
  }
  openStarters(false);
}
function endRun(won) {
  phase = "ended";
  run.complete = won;
  if (!recordedEnd) {
    if (won) profile.victories++;
    recordedEnd = true;
  }
  profile.best = Math.max(profile.best, run.wins);
  save();
  render();
  openEnd(won);
}
function openEnd(won = run.complete) {
  modal(
    `<div class="result-hero"><span class="result-sigil">${won ? "✧" : "♡"}</span><span class="section-kicker" style="display:block">${won ? "THREE WORLDS. ONE EXTRAORDINARY TEAM." : "SOME STORIES ARE ONLY THE BEGINNING"}</span><h2>${won ? "You brought the stars home." : "The journey stays with you."}</h2><p>${won ? "Your companions have conquered the Silent Expanse. There are more teams to discover, more paths to try." : "Your expedition ends here. Every creature you discovered is waiting for your next attempt."}</p></div><div class="end-stats"><div><strong>${run.wins}</strong><small>BATTLES WON</small></div><div><strong>${profile.owned.length}</strong><small>PERMANENT CREATURES</small></div><div><strong>${run.relics.length}</strong><small>RELICS FOUND</small></div></div><p class="starter-note" style="text-align:center">Captured creatures are saved on this device. Use them as starters to discover new team combinations.</p><div class="modal-actions">${button("View menagerie", "end-collection", "secondary")}${button("Build a new expedition →", "new-run")}</div>`,
    "end",
    false,
  );
}
function openReport() {
  if (!battle) {
    modal(
      `<span class="section-kicker">BATTLE REPORT</span><h2>The story is still unwritten.</h2><p>Enter a battle to see combat events, damage dealt, healing, skills, and dodges.</p>${button("Back to expedition", "close", "secondary")}`,
      "report",
    );
    return;
  }
  modal(
    `<span class="section-kicker">BATTLE REPORT · ${Math.floor(battle.time)} SECONDS</span><h2>${battle.done ? (battle.winner === 0 ? "A hard-earned victory." : "Lessons from the arena.") : "Every companion contributes."}</h2><div class="live-metrics"><span>Skills <b>${battle.metrics.skills}</b></span><span>Dodges <b>${battle.metrics.dodges}</b></span><span>Healing <b>${Math.round(battle.metrics.healing)}</b></span></div><div class="modal-list">${battle.units
      .filter((u) => u.side === 0)
      .sort((a, b) => b.damage - a.damage)
      .map(
        (u) =>
          `<div class="performance-row">${image(u)}<strong>${creatureName(u)}</strong><span>${Math.round(u.damage)} DMG</span><span>${Math.round(u.healed)} HEAL</span><span>${u.kills} K.O.</span></div>`,
      )
      .join(
        "",
      )}</div><div class="thin-rule"></div><span class="section-kicker">RECENT COMBAT EVENTS</span><div class="modal-list">${battle.log
      .slice(0, 12)
      .map(
        (l) =>
          `<div style="display:flex;gap:15px;font-size:10px;color:#a5bb94"><span style="color:#d1dfbb;min-width:25px">${l.time}s</span>${l.text}</div>`,
      )
      .join(
        "",
      )}</div><div class="modal-actions">${button("Return to arena", "close", "secondary")}</div>`,
    "report",
  );
}
function openHelp() {
  modal(
    `<span class="section-kicker">FIELD NOTES FOR A NEW EXPLORER</span><h2>A little strategy. A lot of heart.</h2><p>Collect creatures. Build bonds. Let your companions fight. Bring their stories home.</p><div class="help-grid"><div><h3>01 · Six unlikely heroes</h3><p>Inspect creatures to choose training focuses or swap bench companions. Guardians hold the front; supports and rangers keep their distance. Drag cards to change lanes.</p></div><div><h3>02 · Smart, automatic combat</h3><p>Creatures seek targets, dodge marked danger, use skills on cooldown, and protect their roles. Hunt prioritizes wounded enemies; Guard holds the frontline. Space pauses; 1, 2, 3 change speed.</p></div><div><h3>03 · Your route matters</h3><p>Each planet has six encounters. Choose adjacent paths to battle, shop, capture, recover, or make a difficult choice. Losing costs a life. Defeat each planet’s boss to advance.</p></div><div><h3>04 · Small bonds, big results</h3><p>Two creatures of an element activate a team bonus. Four unlock another. Expedition relics affect every ally. Personal relics fill individual slots: Common 1, Uncommon 2, Rare 3, Epic 4, Legendary 5. Levels and training improve base stats. Skills show their effective cooldown in the creature panel.</p></div><div><h3>05 · Catch your next beginning</h3><p>After a victory, spend an orb for one capture attempt. Rare creatures have stronger skills and lower capture chances. Successful captures join your bench and unlock permanent starters.</p></div><div><h3>06 · Evolve your companions</h3><p>At level 5, spend 50 gold in a creature panel to choose Wild damage or Warden resilience. At level 8, ascend for 100 gold. Each stage adds a relic socket and preserves your linked gems. Common companions also awaken at level 5. New expeditions start in base forms at level 1 with no run relics. Your permanent creatures stay. Choose six within a 12-point rarity budget. Captured Legendary creatures cost 6 points — real power has a price.</p></div></div><p class="starter-note">All allies fully recover between encounters. Expedition lives measure your ability to retreat. Browser storage keeps your collection and run; sound is optional.</p><div class="modal-actions">${button("I’m ready to explore →", "help-done")}</div>`,
    "help",
  );
}
function openRelic(id) {
  const r = RELICS.find((r) => r.id === id);
  modal(
    `<span class="section-kicker">RUN RELIC · TEAM-WIDE EFFECT</span><div class="event-art" style="color:${r.color}">${r.icon}</div><h2>${r.name}.</h2><p>${r.desc}</p><p class="starter-note">This relic stays with your current expedition. A new run starts with a fresh inventory.</p>${button("Back to expedition", "close", "secondary")}`,
    "relic",
  );
}
let audioContext = null;
function sound(kind) {
  if (!profile.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const notes = {
      start: [196, 293, 392],
      win: [392, 493, 587, 784],
      loss: [220, 196],
      capture: [523, 659, 784, 1046],
      buy: [440, 660],
      hit: [110],
    };
    (notes[kind] || [330]).forEach((f, i) => {
      const o = audioContext.createOscillator(),
        g = audioContext.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, audioContext.currentTime + i * 0.11);
      g.gain.linearRampToValueAtTime(
        0.04,
        audioContext.currentTime + i * 0.11 + 0.02,
      );
      g.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + i * 0.11 + 0.3,
      );
      o.connect(g);
      g.connect(audioContext.destination);
      o.start(audioContext.currentTime + i * 0.11);
      o.stop(audioContext.currentTime + i * 0.11 + 0.32);
    });
  } catch {}
}
function setView(v) {
  viewName = v;
  render();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el || el.disabled) return;
  if (el.dataset.view) {
    setView(el.dataset.view);
    return;
  }
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
    render();
    toast(
      {
        balanced: "Balanced: roles use their natural targeting.",
        hunt: "Hunt: the team focuses wounded targets. Your backline may advance.",
        guard:
          "Guard: strikers stay near the frontline. Safer, but less burst pressure.",
      }[run.stance],
    );
    return;
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
        evolutionPath: "wild",
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
  if (el.dataset.node) {
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
      toast("Support gem socketed. Choose which skill it supports.");
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
      toast("Support gem socketed.");
    }
    return;
  }
  if (el.dataset.swap !== undefined) {
    if (phase === "battle") return;
    const i = Number(el.dataset.index),
      j = Number(el.dataset.swap);
    [run.team[i], run.bench[j]] = [run.bench[j], run.team[i]];
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
    freshRun(starterSelection);
    closeModal();
    save();
    render();
    toast("A fresh expedition. New worlds, new possibilities.");
  }
  if (action === "reward") openRewards();
  if (action === "capture") tryCapture();
  if (action === "continue") continueRun();
  if (action === "leave-node" && phase === "shop") leaveNode();
  if (action === "reroll") rerollShop();
  if (action === "rest-life" && phase === "rest" && run.integrity < 3) {
    run.integrity++;
    toast("One expedition life restored.");
    leaveNode();
  }
  if (action === "rest-xp" && phase === "rest") {
    run.team.forEach((u) => gainXP(u, 40));
    toast("Every companion gains 40 EXP.");
    leaveNode();
  }
  if (action === "rest-orbs" && phase === "rest") {
    run.orbs += 2;
    toast("Two capture orbs found.");
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
$(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  setView("arena");
});
$("#sound").addEventListener("click", () => {
  profile.sound = !profile.sound;
  $("#sound").textContent = profile.sound ? "♫" : "♪";
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
    modalKind &&
    !["reward", "shop", "event", "rest", "end"].includes(modalKind)
  )
    closeModal();
  if (e.key === "Tab" && modalKind) {
    const buttons = [
      ...document.querySelectorAll("#modal-root button:not(:disabled)"),
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
let uiTick = 0,
  soundTick = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.08);
  last = now;
  if (phase === "battle" && battle && !paused) {
    let remaining = dt * speed;
    while (remaining > 0 && !battle.done) {
      const step = Math.min(0.04, remaining);
      battle.step(step);
      remaining -= step;
    }
    if (battle.done) finishBattle();
    else if (profile.sound && now - soundTick > 2300) {
      soundTick = now;
      sound("hit");
    }
  }
  if (ctx && canvas)
    renderBattle(
      ctx,
      canvas.width,
      canvas.height,
      battle,
      Math.min(run.planet, 2),
      now / 1000,
      run.team,
      foes || [],
    );
  if (battle && viewName === "arena" && now - uiTick > 150) {
    uiTick = now;
    const boss = battle.units.find((u) => u.boss);
    if (boss && $("#boss-health")) {
      $("#boss-health").style.width = `${(boss.hp / boss.maxHp) * 100}%`;
      $("#boss-phase").textContent =
        boss.hp <= 0 ? "DEFEATED" : boss.enraged ? "PHASE II" : "PHASE I";
    }
    const timer = $("#arena-timer");
    if (timer)
      timer.textContent = `${paused ? "II " : ""}${String(Math.floor(battle.time / 60)).padStart(2, "0")}:${String(Math.floor(battle.time % 60)).padStart(2, "0")}`;
    if ($("#ally-count"))
      $("#ally-count").textContent =
        `YOUR EXPEDITION · ${battle.living(0).length} / 6`;
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
        el.classList.toggle("fallen", u.hp <= 0);
        el.querySelector(".card-health").style.width =
          `${(u.hp / u.maxHp) * 100}%`;
      }
    });
  }
  requestAnimationFrame(frame);
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.matches("[data-link-slot]") && phase !== "battle") {
    const i = Number(el.dataset.linkIndex);
    if (linkRelic(run, i, Number(el.dataset.linkSlot), el.value)) {
      save();
      render();
      openCreature(i);
      toast("Gem link updated. Only that ability is modified.");
    }
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
// Read-only inspection for deterministic playtesting and debugging. No gameplay shortcuts.
window.starfall = {
  get state() {
    return { run, phase, node, foes, battle, profile, view: viewName };
  },
};
function loadoutHTML(u, index) {
  const s = BY_ID[u.id],
    slots = relicSlots(u),
    items = u.relics || [],
    loadout = loadoutFor(s, u.level);
  return `<div class="personal-loadout"><div class="section-heading"><h3>SUPPORT GEM SOCKETS <span class="muted" style="font-size:10px;margin-left:5px">${items.length} / ${slots}</span></h3><span class="section-kicker" style="color:${RARITY[s.rarity].color}">${s.rarity.toUpperCase()} CAPACITY</span></div><div class="relic-slots">${Array.from(
    { length: slots },
    (_, i) => {
      const item = items[i],
        r = item ? PERSONAL_BY_ID[item.id] : null;
      return `<div class="relic-slot ${r ? "equipped" : ""}" style="--relic:${r?.color || "#728666"}"><span>${r ? r.icon : "+"}</span><strong>${r ? r.name : "Empty socket"}</strong>${r ? `<small class="gem-effect">${r.desc}</small>` : ""}${r && index !== null ? `<label class="gem-link-label">SUPPORTS<select class="gem-link" data-link-slot="${i}" data-link-index="${index}" ${phase === "battle" ? "disabled" : ""}>${[loadout.auto, ...loadout.active].map((id) => `<option value="${id}" ${(item.link || u.id) === id ? "selected" : ""}>${SKILLS[id].auto ? "AUTO · " : ""}${SKILLS[id].name}</option>`).join("")}</select></label><button class="gem-remove" data-unequip="${i}" data-index="${index}" ${phase === "battle" ? "disabled" : ""}>Unsocket</button>` : `<small>${r ? SKILLS[item.link || u.id]?.name || "Skill linked" : "Equip from your pack"}</small>`}</div>`;
    },
  ).join("")}</div>${
    index !== null
      ? `<span class="section-kicker" style="display:block;margin-top:17px">YOUR GEM PACK · ${run.inventory.length} AVAILABLE</span><div class="personal-inventory">${
          run.inventory.length
            ? run.inventory
                .map((item) => {
                  const r = PERSONAL_BY_ID[item.id];
                  return `<button class="inventory-item" data-equip="${item.uid}" data-index="${index}" ${items.length >= slots || items.some((i) => i.id === item.id) || phase === "battle" ? "disabled" : ""} title="${r.desc}"><span style="color:${r.color}">${r.icon}</span><div><strong>${r.name}</strong><small>${r.desc}</small></div><b>+</b></button>`;
                })
                .join("")
            : '<p class="starter-note">Find support gems in battle rewards and outpost shops. Rarer creatures have more sockets.</p>'
        }</div><p class="starter-note">Choose a linked skill for each gem. Multiple different gems can support one ability. Unsocket freely between battles.</p>`
      : `<p class="starter-note">${s.rarity} creatures can socket ${slots} support ${slots === 1 ? "gem" : "gems"} to modify their abilities. They have ${loadout.active.length} cooldown skills and a unique auto-attack.</p>`
  }</div>`;
}
function skillsHTML(u, index) {
  const s = BY_ID[u.id],
    loadout = loadoutFor(s, u.level),
    st = stats(
      u,
      index === null ? [u] : run.team,
      index === null ? [] : run.relics,
    );
  return `<div class="ability-heading"><span class="section-kicker">SIGNATURE AUTO-ATTACK + ${loadout.active.length} COOLDOWN SKILLS</span><span class="muted">AI CASTS AUTOMATICALLY</span></div><div class="ability-list">${[
    loadout.auto,
    ...loadout.active,
  ]
    .map((id) => {
      const def = SKILLS[id],
        links = (u.relics || []).filter((item) => (item.link || u.id) === id),
        m = linkedSupport(u, id);
      return `<div class="skill-detail" style="--element:${def.color || ELEMENTS[s.element].color}"><span class="skill-icon">${def.auto ? "⌁" : def.icon}</span><div><h3>${def.name}<small>${def.auto ? "AUTO-ATTACK" : (def.cd * st.cdFactor * m.cooldown).toFixed(1) + " SEC"}</small></h3><p>${def.desc}</p>${links.length ? `<div class="linked-gems">${links.map((item) => `<span style="color:${PERSONAL_BY_ID[item.id].color}">◇ ${PERSONAL_BY_ID[item.id].name}</span>`).join("")}</div>` : ""}</div></div>`;
    })
    .join("")}</div>`;
}

function openPack() {
  modal(
    `<span class="section-kicker">SUPPORT GEMS · EXPEDITION INVENTORY</span><h2>A little something special.</h2><p>Choose a support gem, then choose a companion. Rarer creatures have more sockets. Support gems link to one ability. Change that skill’s behavior without changing its identity.</p><div class="personal-inventory">${
      run.inventory.length
        ? run.inventory
            .map((item) => {
              const r = PERSONAL_BY_ID[item.id];
              return `<button class="inventory-item" data-pack-relic="${item.uid}" ${phase === "battle" ? "disabled" : ""}><span style="color:${r.color}">${r.icon}</span><div><strong>${r.name}</strong><small>${r.desc}</small></div><b>→</b></button>`;
            })
            .join("")
        : "<p>Your pack is empty. Buy support gems or choose one as a battle reward.</p>"
    }</div><div class="modal-actions">${button("Back to expedition", "close", "secondary")}</div>`,
    "pack",
  );
}
function openEquipTarget(uid) {
  const item = run.inventory.find((i) => i.uid === uid);
  if (!item) return;
  const r = PERSONAL_BY_ID[item.id];
  modal(
    `<span class="section-kicker">SOCKET A SUPPORT GEM</span><h2>${r.name}.</h2><p>${r.desc} Choose the creature that will benefit most.</p><div class="starter-grid">${run.team.map((c, i) => `<button class="starter-card" data-pack-target="${i}" data-item="${uid}" ${(c.relics || []).length >= relicSlots(c) || c.relics?.some((r) => r.id === item.id) || phase === "battle" ? "disabled" : ""}>${image(c)}<strong>${BY_ID[c.id].name}</strong><small>${c.relics?.length || 0} / ${relicSlots(c)} slots filled</small></button>`).join("")}</div><div class="modal-actions">${button("Back to expedition", "close", "secondary")}</div>`,
    "equip",
  );
}
