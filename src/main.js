import "./style.css";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  document.querySelector("#app").innerHTML =
    `<main class="shell center"><section class="panel"><span class="eyebrow">SETUP</span><h1>Supabase not connected.</h1></section></main>`;
  throw new Error("Missing Supabase");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ROUND_SECONDS = 90;
const GRID = 3;
const SYMBOLS = ["●", "▲", "★"];
const DIRS = ["↑", "→", "↓", "←"];
const STORAGE_KEY = "tbop_progress_v1";
const MAP_DIR_LABEL = { n: "NORTH", e: "EAST", s: "SOUTH", w: "WEST" };
const MAP_DIR_ARROW = { n: "↑", e: "→", s: "↓", w: "←" };

const CHAPTERS = [
  {
    id: "perspective",
    title: "CHAPTER I",
    subtitle: "PERSPECTIVE",
    levels: [
      {
        id: "mirror",
        title: "THE MIRROR",
        number: "01",
        type: "mirror",
        tagline: "Two views. One room.",
        completeLine: "Two perspectives. One solution.",
        roles: { a: "OBSERVER", b: "OPERATOR" },
        roleHint: {
          OBSERVER: "You see the target. You cannot move. Guide your partner.",
          OPERATOR: "You move objects. You do not see the target. Your left may not be theirs."
        },
        unlocked: true
      },
      {
        id: "rotation",
        title: "THE ROTATION",
        number: "02",
        type: "rotation",
        tagline: "Not where. Which way.",
        completeLine: "Orientation is information.",
        roles: { a: "OBSERVER", b: "OPERATOR" },
        roleHint: {
          OBSERVER: "You see the correct facing for each piece. You cannot rotate.",
          OPERATOR: "You can rotate pieces. You do not see the target facings."
        },
        unlocked: true
      },
      {
        id: "shadow",
        title: "THE SHADOW",
        number: "03",
        type: "shadow",
        tagline: "Color is light. Form is shadow.",
        completeLine: "You saw what they could not.",
        roles: { a: "SEEKER", b: "CASTER" },
        roleHint: {
          SEEKER: "You see the true colored pattern. You cannot move pieces.",
          CASTER: "You only see black silhouettes. Swap them into place."
        },
        unlocked: true
      }
    ]
  },
  {
    id: "information",
    title: "CHAPTER II",
    subtitle: "INFORMATION",
    levels: [
      {
        id: "map",
        title: "THE MAP",
        number: "05",
        type: "map",
        tagline: "One has the plan. One has the place.",
        completeLine: "You found the way together.",
        roles: { a: "GUIDE", b: "WALKER" },
        roleHint: {
          GUIDE: "You see the full map. You cannot walk. Guide them to the GOAL. Avoid the TRAP.",
          WALKER: "You only see the room you are in. Choose exits. You cannot see the map."
        },
        unlocked: true
      },
      {
        id: "blackbox",
        title: "THE BLACK BOX",
        number: "06",
        type: "blackbox",
        tagline: "One loads. One watches. Neither knows the law.",
        completeLine: "You reverse-engineered it together.",
        roles: { a: "LOADER", b: "WATCHER" },
        roleHint: {
          LOADER: "You place tokens and RUN the machine. You never see the output.",
          WATCHER: "You only see what comes out. Predict the next output to prove you understand."
        },
        unlocked: true
      },
      {
        id: "collision",
        title: "THE COLLISION",
        number: "07",
        type: "collision",
        tagline: "You see empty space. They see the walls.",
        completeLine: "You walked a path neither could see alone.",
        roles: { a: "SEER", b: "WALKER" },
        roleHint: {
          SEER: "You see the invisible walls and the goal. You cannot move. Guide them.",
          WALKER: "You see a clean room. Move carefully. Ask before you walk."
        },
        unlocked: true
      }
    ]
  },
  {
    id: "memory",
    title: "CHAPTER III",
    subtitle: "MEMORY",
    levels: [
      {
        id: "flash",
        title: "THE FLASH",
        number: "04",
        type: "flash",
        tagline: "Seen once. Built from memory.",
        completeLine: "You remembered together.",
        roles: { a: "WITNESS", b: "HANDS" },
        roleHint: {
          WITNESS: "You see the pattern for a few seconds. Then it is gone. Guide from memory. One replay.",
          HANDS: "You never see the flash. Place pieces from what they tell you."
        },
        unlocked: true
      },
      {
        id: "onebody",
        title: "THE ONE BODY",
        number: "08",
        type: "onebody",
        tagline: "Two minds. One body.",
        completeLine: "You moved as one.",
        roles: { a: "LEGS", b: "ARMS" },
        roleHint: {
          LEGS: "You move the body. You cannot press buttons.",
          ARMS: "You press buttons when the body stands on them. You cannot move."
        },
        unlocked: true
      }
    ]
  },
  {
    id: "systems",
    title: "CHAPTER IV",
    subtitle: "SYSTEMS",
    levels: [
      {
        id: "switch",
        title: "THE SWITCH",
        number: "09",
        type: "switch",
        tagline: "You flip. They see what breaks.",
        completeLine: "You mapped the machine together.",
        roles: { a: "HANDS", b: "PANEL" },
        roleHint: {
          HANDS: "Four switches. No labels. Flip them. You cannot see the effects.",
          PANEL: "You see the status lights. You cannot touch the switches. Guide them."
        },
        unlocked: true
      },
      {
        id: "liar",
        title: "THE LIAR",
        number: "10",
        type: "liar",
        tagline: "One of you is being lied to.",
        completeLine: "You found the truth together.",
        roles: { a: "GUIDE", b: "BUILDER" },
        roleHint: {
          GUIDE: "You see a target. It might be real. Or it might be a lie.",
          BUILDER: "You place pieces. Your target sheet might be real. Or a lie."
        },
        unlocked: true
      }
    ]
  },
  {
    id: "time",
    title: "CHAPTER V",
    subtitle: "TIME",
    levels: [
      {
        id: "future",
        title: "FUTURE SIGHT",
        number: "11",
        type: "future",
        tagline: "One sees what is coming. One lives now.",
        completeLine: "You outran the future together.",
        roles: { a: "ORACLE", b: "RUNNER" },
        roleHint: {
          ORACLE: "You see which cells will spike next. Guide them. You cannot move.",
          RUNNER: "You move now. You cannot see the spikes until they hit."
        },
        unlocked: true
      },
      {
        id: "decay",
        title: "INFORMATION DECAY",
        number: "12",
        type: "decay",
        tagline: "The truth has a half-life.",
        completeLine: "You spoke before it faded.",
        roles: { a: "HOLDER", b: "KEYPAD" },
        roleHint: {
          HOLDER: "You see the code. It decays. Say it before it dies.",
          KEYPAD: "You never see the code. Enter what they tell you."
        },
        unlocked: true
      },
      {
        id: "sequence",
        title: "THE SEQUENCE",
        number: "13",
        type: "sequence",
        tagline: "Heard once. Played back.",
        completeLine: "The order was yours together.",
        roles: { a: "CALLER", b: "PLAYER" },
        roleHint: {
          CALLER: "You see the pad order once. Guide them. One replay.",
          PLAYER: "You press pads. You never see the sequence."
        },
        unlocked: true
      }
    ]
  },
  {
    id: "creation",
    title: "CHAPTER VI",
    subtitle: "CREATION",
    levels: [
      {
        id: "blueprint",
        title: "THE BLUEPRINT",
        number: "14",
        type: "blueprint",
        tagline: "One holds the plan. One holds the pieces.",
        completeLine: "The structure stood.",
        roles: { a: "ARCHITECT", b: "BUILDER" },
        roleHint: {
          ARCHITECT: "You see the blueprint forever. You cannot place pieces.",
          BUILDER: "You place pieces. You never see the blueprint."
        },
        unlocked: true
      },
      {
        id: "gravity",
        title: "THE GRAVITY",
        number: "15",
        type: "gravity",
        tagline: "One pulls the world. One walks it.",
        completeLine: "You bent the fall together.",
        roles: { a: "PULLER", b: "FALLER" },
        roleHint: {
          PULLER: "You set gravity direction. You cannot move the body.",
          FALLER: "You move with gravity. You cannot change it."
        },
        unlocked: true
      },
      {
        id: "watches",
        title: "THE GAME WATCHES",
        number: "16",
        type: "watches",
        tagline: "Repeat a mistake and the system adapts.",
        completeLine: "You learned it was watching.",
        roles: { a: "HANDS", b: "PANEL" },
        roleHint: {
          HANDS: "Four switches. Patterns that fail twice will shift.",
          PANEL: "You see status. If the system adapts, warn them."
        },
        unlocked: true
      }
    ]
  }
];

function allLevels() {
  return CHAPTERS.flatMap((c) => c.levels.map((l) => ({ ...l, chapterId: c.id })));
}
function getLevel(id) {
  return allLevels().find((l) => l.id === id);
}
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
function isUnlocked(level) {
  if (level.unlocked) return true;
  const prog = loadProgress();
  return !!(prog[level.id]?.unlocked || prog[level.id]?.completed);
}
function markComplete(levelId) {
  const prog = loadProgress();
  prog[levelId] = { completed: true, at: Date.now() };
  const list = allLevels();
  const idx = list.findIndex((l) => l.id === levelId);
  if (idx >= 0 && idx < list.length - 1) {
    prog[list[idx + 1].id] = prog[list[idx + 1].id] || { unlocked: true };
  }
  saveProgress(prog);
}

const app = document.querySelector("#app");
const state = {
  screen: "home", roomCode: "", roomRole: "", playerId: crypto.randomUUID(), playerName: "",
  channel: null, players: [], connected: false, error: "", ready: false, isHost: false,
  selectedLevelId: "mirror", puzzleRole: null, puzzle: null, remaining: ROUND_SECONDS,
  startedAt: 0, timerId: null, result: "", selectedId: null, elapsed: 0, countdown: 0,
  introLevel: null, flashPhase: "", flashReplayUsed: false, trayId: null,
  mapAnimating: false, mapMsg: "", bbSelectedToken: null, bbPredictMode: false, bbPrediction: [], colMsg: "", bodyMsg: "", switchMsg: "", futureTick: 0, decayLeft: 0, seqPhase: "", seqReplay: false, gravDir: 0, watchFails: []
};

function escapeHtml(v = "") {
  return String(v).replace(/&/g, "&" + "amp;").replace(/</g, "&" + "lt;").replace(/>/g, "&" + "gt;").replace(/"/g, "&" + "quot;").replace(/'/g, "&#039;");
}
function partner() { return state.players.find((p) => p.playerId !== state.playerId); }
function bothReady() {
  const p = partner();
  return state.players.length >= 2 && state.ready && p?.ready === true;
}
function render() {
  const s = state.screen;
  if (s === "home") renderHome();
  else if (s === "room") renderRoom();
  else if (s === "levels") renderLevels();
  else if (s === "roles") renderRoles();
  else if (s === "intro") renderIntro();
  else if (s === "countdown") renderCountdown();
  else if (s === "game") renderGame();
  else if (s === "result") renderResult();
}

function renderHome() {
  app.innerHTML = `<main class="shell home-shell">
    <header class="topbar">
      <div class="brand">TWO BRAINS</div>
      <div class="live"><span class="live-dot"></span>ONLINE</div>
    </header>
    <section class="hero">
      <span class="eyebrow">COOPERATIVE PUZZLE</span>
      <h1>TWO BRAINS,<br>ONE PUZZLE.</h1>
      <p class="premise">You don't have the answer.<br>They don't have the answer.<br><em>Together, you do.</em></p>
    </section>
    <div class="motif" aria-hidden="true">
      <span class="motif-orb left"></span>
      <span class="motif-line"></span>
      <span class="motif-orb right"></span>
      <span class="motif-label">TWO MINDS · ONE PROBLEM</span>
    </div>
    <section class="home-actions">
      <button class="btn primary btn-create" id="createBtn"><span class="btn-label">CREATE ROOM</span></button>
      <div class="divider"><span>OR</span></div>
      <div class="join-row">
        <input id="roomInput" class="input" maxlength="6" placeholder="ROOM CODE" autocomplete="off" />
        <button class="btn" id="joinBtn">JOIN</button>
      </div>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <p class="microcopy">Stay on WhatsApp.<br>Play here.</p>
    </section>
  </main>`;
  const createBtn = document.getElementById("createBtn");
  createBtn.onclick = async () => {
    createBtn.classList.add("creating");
    createBtn.querySelector(".btn-label").textContent = "CREATING ROOM ···";
    createBtn.disabled = true;
    await createRoom();
  };
  document.getElementById("joinBtn").onclick = joinRoom;
  document.getElementById("roomInput").onkeydown = (e) => { if (e.key === "Enter") joinRoom(); };
}

function renderRoom() {
  const p = partner();
  const both = state.players.length >= 2;
  const justJoined = both && state._partnerFlash;
  if (justJoined) {
    setTimeout(() => { state._partnerFlash = false; if (state.screen === "room") render(); }, 1200);
  }
  app.innerHTML = `<main class="shell room-shell">
    <header class="topbar">
      <button class="ghost" id="leaveBtn">LEAVE</button>
      <div class="live"><span class="live-dot ${state.connected ? "" : "offline"}"></span>${state.connected ? "LIVE" : "…"}</div>
    </header>
    <section class="room-hero compact">
      <span class="eyebrow">ROOM</span>
      <h1 class="code-lg code-artifact" id="copyBtn" title="Tap to copy">${escapeHtml(state.roomCode)}</h1>
      <button class="ghost tight copy-hint" id="copyHint">TAP TO COPY</button>
    </section>
    <div class="motif motif-sm" aria-hidden="true">
      <span class="motif-orb left ${both ? "meet" : ""}"></span>
      <span class="motif-line ${both ? "meet" : ""}"></span>
      <span class="motif-orb right ${both ? "meet" : ""}"></span>
    </div>
    <section class="name-block">
      <label class="eyebrow">YOUR NAME</label>
      <input id="nameInput" class="input" maxlength="12" placeholder="NAME" value="${escapeHtml(state.playerName)}" />
    </section>
    <section class="players">
      <span class="eyebrow players-label">PLAYERS</span>
      <div class="player">
        <div class="avatar">${escapeHtml((state.playerName || "YOU").slice(0, 2).toUpperCase())}</div>
        <div class="player-meta">
          <span>${state.isHost ? "HOST" : "GUEST"}</span>
          <strong>${escapeHtml(state.playerName || "YOU")}</strong>
        </div>
        <i class="online"></i>
      </div>
      <div class="player ${p ? "" : "empty"} ${justJoined ? "just-joined" : ""}">
        <div class="avatar">${p ? escapeHtml((p.name || "P2").slice(0, 2).toUpperCase()) : "?"}</div>
        <div class="player-meta">
          <span>PARTNER</span>
          <strong>${p ? escapeHtml(p.name || "PLAYER 2") : "WAITING"}</strong>
        </div>
        <i class="${p ? "online" : ""}"></i>
      </div>
    </section>
    ${justJoined ? `<p class="partner-flash">PARTNER CONNECTED</p>` : ""}
    <section class="status-panel">
      <div class="status-line">
        <div class="status-dot ${bothReady() ? "ready" : ""}"></div>
        <div>
          <strong>${!both ? "Waiting for partner" : bothReady() ? "Both ready" : state.ready ? "Waiting for partner" : "Ready up"}</strong>
          <p>${!both ? "Share the room code." : bothReady() ? "Host can open levels." : "Names on. Then ready."}</p>
        </div>
      </div>
    </section>
    ${both && !state.ready ? `<button class="btn primary ready-btn" id="readyBtn">READY</button>` : ""}
    ${bothReady() && state.isHost ? `<button class="btn primary ready-btn" id="levelsBtn">LEVEL SELECT</button>` : ""}
    ${bothReady() && !state.isHost ? `<p class="microcopy">Waiting for host to choose a level…</p>` : ""}
  </main>`;
  document.getElementById("leaveBtn").onclick = leaveRoom;
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(state.roomCode); } catch {}
    const hint = document.getElementById("copyHint");
    if (hint) { hint.textContent = "COPIED"; setTimeout(() => { if (hint) hint.textContent = "TAP TO COPY"; }, 1200); }
  };
  document.getElementById("copyBtn").onclick = doCopy;
  document.getElementById("copyHint").onclick = doCopy;
  const nameInput = document.getElementById("nameInput");
  nameInput.oninput = () => { state.playerName = nameInput.value.slice(0, 12); };
  nameInput.onchange = () => trackPresence();
  const readyBtn = document.getElementById("readyBtn"); if (readyBtn) readyBtn.onclick = setReady;
  const levelsBtn = document.getElementById("levelsBtn"); if (levelsBtn) levelsBtn.onclick = () => openLevels(true);
}

function openLevels(broadcast) {
  state.screen = "levels"; render();
  if (broadcast && state.isHost) sendGame({ type: "screen", from: state.playerId, screen: "levels" });
}

function renderLevels() {
  const prog = loadProgress();
  let html = `<main class="shell"><header class="topbar"><button class="ghost" id="backBtn">BACK</button><div class="brand">LEVELS</div></header>`;
  CHAPTERS.forEach((ch) => {
    html += `<section class="chapter"><div class="chapter-head"><span class="eyebrow">${escapeHtml(ch.title)}</span><h2>${escapeHtml(ch.subtitle)}</h2></div><div class="level-list">`;
    ch.levels.forEach((lv) => {
      const unlocked = isUnlocked(lv) || !!prog[lv.id]?.unlocked || !!prog[lv.id]?.completed;
      const done = !!prog[lv.id]?.completed;
      const playable = unlocked && !!lv.type;
      html += `<button class="level-row ${done ? "done" : ""} ${!unlocked ? "locked" : ""}" data-id="${lv.id}" ${playable ? "" : "disabled"}><span class="lvl-num">${escapeHtml(lv.number || "")}</span><span class="lvl-title">${escapeHtml(lv.title)}${done ? " ✓" : ""}</span><span class="lvl-lock">${unlocked ? (playable ? "PLAY" : "SOON") : "LOCKED"}</span></button>`;
    });
    html += `</div></section>`;
  });
  html += `</main>`;
  app.innerHTML = html;
  document.getElementById("backBtn").onclick = () => { state.screen = "room"; render(); };
  document.querySelectorAll(".level-row:not([disabled])").forEach((btn) => {
    btn.onclick = () => {
      if (!state.isHost) return;
      state.selectedLevelId = btn.dataset.id;
      state.screen = "roles"; render();
      sendGame({ type: "screen", from: state.playerId, screen: "roles", levelId: state.selectedLevelId });
    };
  });
}

function renderRoles() {
  const lv = getLevel(state.selectedLevelId);
  if (!lv) return;
  const canPick = state.isHost;
  app.innerHTML = `<main class="shell"><header class="topbar"><button class="ghost" id="backBtn">BACK</button><div class="brand">${escapeHtml(lv.number)} · ${escapeHtml(lv.title)}</div></header><section class="hero tight"><span class="eyebrow">ROLES</span><h1 class="h-mid">${escapeHtml(lv.roles?.a || "A")} / ${escapeHtml(lv.roles?.b || "B")}</h1><p>${escapeHtml(lv.tagline || "")}</p></section><div class="role-cards"><div class="role-card"><span class="eyebrow">${escapeHtml(lv.roles?.a || "ROLE A")}</span><p>${escapeHtml(lv.roleHint?.[lv.roles?.a] || "")}</p></div><div class="role-card"><span class="eyebrow">${escapeHtml(lv.roles?.b || "ROLE B")}</span><p>${escapeHtml(lv.roleHint?.[lv.roles?.b] || "")}</p></div></div>${canPick ? `<div class="role-actions"><button class="btn" data-mode="random">RANDOM ROLES</button><button class="btn" data-mode="host_a">I'M ${escapeHtml(lv.roles?.a || "A")}</button><button class="btn" data-mode="host_b">I'M ${escapeHtml(lv.roles?.b || "B")}</button></div>` : `<p class="microcopy">Host is assigning roles…</p>`}</main>`;
  document.getElementById("backBtn").onclick = () => { state.screen = "levels"; render(); };
  if (canPick) document.querySelectorAll("[data-mode]").forEach((btn) => { btn.onclick = () => startLevelRound(btn.dataset.mode); });
}

function assignRoles(mode, level) {
  const a = level.roles?.a || "OBSERVER";
  const b = level.roles?.b || "OPERATOR";
  let hostRole = a;
  if (mode === "host_b") hostRole = b;
  else if (mode === "swap") hostRole = state.puzzleRole === a ? b : a;
  else if (mode === "random") hostRole = Math.random() < 0.5 ? a : b;
  return { hostRole, partnerRole: hostRole === a ? b : a };
}

function seedRand(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function generateMirror(seed) {
  const rand = seedRand(seed);
  const cells = [];
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) cells.push([r, c]);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const starts = shuffle(cells).slice(0, SYMBOLS.length);
  const targets = shuffle(cells).slice(0, SYMBOLS.length);
  return {
    type: "mirror",
    objects: SYMBOLS.map((sym, i) => ({ id: "o" + i, symbol: sym, r: starts[i][0], c: starts[i][1] })),
    target: SYMBOLS.map((sym, i) => ({ id: "o" + i, symbol: sym, r: targets[i][0], c: targets[i][1] }))
  };
}

function generateRotation(seed) {
  const rand = seedRand(seed);
  const defs = [
    { label: "▲", name: "SPIRE", tone: "amber" },
    { label: "◆", name: "CORE", tone: "cyan" },
    { label: "●", name: "ORB", tone: "magenta" },
    { label: "■", name: "BLOCK", tone: "lime" }
  ];
  const pieces = defs.map((d, i) => {
    const targetFacing = Math.floor(rand() * 4);
    let facing = Math.floor(rand() * 4);
    if (i === 0 && facing === targetFacing) facing = (facing + 1) % 4;
    return { id: "r" + i, label: d.label, name: d.name, tone: d.tone, facing, targetFacing };
  });
  return { type: "rotation", pieces };
}

function generateShadow(seed) {
  const rand = seedRand(seed);
  const defs = [
    { label: "▲", name: "SPIRE", tone: "gold" },
    { label: "◆", name: "CORE", tone: "violet" },
    { label: "●", name: "ORB", tone: "rose" },
    { label: "■", name: "BLOCK", tone: "mint" }
  ];
  const positions = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const startPos = shuffle(positions);
  let targetPos = shuffle(positions);
  if (targetPos.every((p, i) => p[0] === startPos[i][0] && p[1] === startPos[i][1])) {
    targetPos = [targetPos[1], targetPos[0], targetPos[3], targetPos[2]];
  }
  const pieces = defs.map((d, i) => ({
    id: "s" + i, label: d.label, name: d.name, tone: d.tone,
    r: startPos[i][0], c: startPos[i][1], tr: targetPos[i][0], tc: targetPos[i][1]
  }));
  return { type: "shadow", pieces };
}

function generateFlash(seed) {
  const rand = seedRand(seed);
  const defs = [
    { label: "▲", name: "SPIRE", tone: "gold" },
    { label: "◆", name: "CORE", tone: "violet" },
    { label: "●", name: "ORB", tone: "rose" },
    { label: "■", name: "BLOCK", tone: "mint" }
  ];
  const positions = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const targetPos = shuffle(positions);
  const pieces = defs.map((d, i) => ({
    id: "f" + i, label: d.label, name: d.name, tone: d.tone,
    tr: targetPos[i][0], tc: targetPos[i][1], r: null, c: null
  }));
  return { type: "flash", pieces };
}

function generateMap() {
  const rooms = {
    start: { id: "start", label: "START", tone: "cyan", exits: { s: "a" } },
    a: { id: "a", label: "HALL A", tone: "blue", exits: { n: "start", e: "b", s: "c" } },
    b: { id: "b", label: "HALL B", tone: "violet", exits: { w: "a", s: "d" } },
    c: { id: "c", label: "HALL C", tone: "amber", exits: { n: "a", e: "d", s: "trap" } },
    d: { id: "d", label: "HALL D", tone: "mint", exits: { n: "b", w: "c", e: "goal" } },
    goal: { id: "goal", label: "GOAL", tone: "gold", exits: { w: "d" } },
    trap: { id: "trap", label: "TRAP", tone: "red", exits: { n: "c" } }
  };
  return { type: "map", rooms, current: "start", path: ["start"] };
}


const BB_TOKENS = [
  { id: "t1", shape: "◆", color: "amber", temp: "warm", label: "SPIRE" },
  { id: "t2", shape: "●", color: "cyan", temp: "cold", label: "CORE" },
  { id: "t3", shape: "▲", color: "magenta", temp: "warm", label: "FLARE" },
  { id: "t4", shape: "■", color: "lime", temp: "cold", label: "BLOCK" }
];
const BB_RULES = ["warm_first", "reverse", "between_cold"];

function generateBlackBox(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const ruleId = BB_RULES[h % BB_RULES.length];
  const tokens = BB_TOKENS.map((t) => ({ ...t }));
  return {
    type: "blackbox",
    ruleId,
    tokens,
    slots: [null, null, null],
    lastOutput: [],
    history: [],
    trialsLeft: 6,
    pendingPredict: null,
    status: "loading"
  };
}

function applyBlackBoxRule(ruleId, loaded) {
  if (!loaded.length) return [];
  if (ruleId === "warm_first") {
    const first = loaded.find((t) => t.temp === "warm");
    return first ? [first] : [];
  }
  if (ruleId === "reverse") {
    return loaded.slice().reverse();
  }
  if (ruleId === "between_cold") {
    const idxs = [];
    loaded.forEach((t, i) => { if (t.temp === "cold") idxs.push(i); });
    if (idxs.length < 2) return [];
    const a = idxs[0], b = idxs[idxs.length - 1];
    if (b - a <= 1) return [];
    return loaded.slice(a + 1, b);
  }
  return [];
}

function tokensEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((t, i) => t && b[i] && t.id === b[i].id);
}

function renderTokenChip(t, extra = "") {
  if (!t) return `<span class="bb-empty">—</span>`;
  return `<span class="bb-token tone-${t.color} ${extra}" data-id="${t.id}"><span class="bb-shape">${escapeHtml(t.shape)}</span><span class="bb-meta">${escapeHtml(t.label)} · ${t.temp === "warm" ? "WARM" : "COLD"}</span></span>`;
}


function generateCollision(seed) {
  const rand = seedRand(seed);
  const size = 5;
  // Build walls: random cells except start and goal
  const walls = new Set();
  const start = { r: size - 1, c: 0 };
  const goal = { r: 0, c: size - 1 };
  const sk = (r, c) => r + "," + c;
  // Place ~8-10 wall cells ensuring a path exists via simple maze-ish placement
  let attempts = 0;
  while (walls.size < 9 && attempts < 80) {
    attempts++;
    const r = Math.floor(rand() * size);
    const c = Math.floor(rand() * size);
    if ((r === start.r && c === start.c) || (r === goal.r && c === goal.c)) continue;
    walls.add(sk(r, c));
  }
  // Ensure path with BFS; if blocked, clear some walls
  function hasPath() {
    const q = [[start.r, start.c]];
    const seen = new Set([sk(start.r, start.c)]);
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (q.length) {
      const [r, c] = q.shift();
      if (r === goal.r && c === goal.c) return true;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        const k = sk(nr, nc);
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (walls.has(k) || seen.has(k)) continue;
        seen.add(k); q.push([nr, nc]);
      }
    }
    return false;
  }
  if (!hasPath()) {
    // remove walls until path exists
    for (const w of [...walls]) {
      walls.delete(w);
      if (hasPath()) break;
    }
  }
  return {
    type: "collision",
    size,
    walls: [...walls],
    start: { ...start },
    goal: { ...goal },
    pos: { ...start },
    bumped: null
  };
}

function colKey(r, c) { return r + "," + c; }
function colIsWall(puzzle, r, c) {
  return (puzzle.walls || []).includes(colKey(r, c));
}


function generateOneBody(seed) {
  const rand = seedRand(seed);
  const size = 5;
  // Layout: start bottom-left, exit top-right
  // Gates block cells; buttons open gates
  // gateId -> button cell must be stood on and pressed
  const start = { r: 4, c: 0 };
  const exit = { r: 0, c: 4 };
  // Two gates and two buttons
  // Gate A blocks (2,2) and (2,3) - horizontal barrier
  // Button A at (4,2)
  // Gate B blocks (1,3) - Button B at (3,4)
  const buttons = [
    { id: "b1", r: 4, c: 2, gateId: "g1", on: false },
    { id: "b2", r: 2, c: 0, gateId: "g2", on: false }
  ];
  const gates = [
    { id: "g1", cells: ["2,1", "2,2", "2,3"], open: false },
    { id: "g2", cells: ["1,2", "1,3", "0,3"], open: false }
  ];
  // Shuffle button positions a bit with seed for variety
  if (rand() > 0.5) {
    buttons[0] = { id: "b1", r: 4, c: 3, gateId: "g1", on: false };
  }
  if (rand() > 0.5) {
    buttons[1] = { id: "b2", r: 3, c: 0, gateId: "g2", on: false };
  }
  return {
    type: "onebody",
    size,
    pos: { ...start },
    start: { ...start },
    exit: { ...exit },
    buttons,
    gates,
    lastPress: null
  };
}

function bodyGateBlocks(puzzle, r, c) {
  const k = r + "," + c;
  return (puzzle.gates || []).some((g) => !g.open && (g.cells || []).includes(k));
}

function bodyButtonAt(puzzle, r, c) {
  return (puzzle.buttons || []).find((b) => b.r === r && b.c === c);
}


function generateSwitch(seed) {
  const rand = seedRand(seed);
  // 4 switches: door, alarm, lock, power — shuffled assignment
  const effects = ["door", "alarm", "lock", "power"];
  for (let i = effects.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [effects[i], effects[j]] = [effects[j], effects[i]];
  }
  const switches = effects.map((effect, i) => ({
    id: "s" + i,
    label: String(i + 1),
    effect,
    on: false
  }));
  return {
    type: "switch",
    switches,
    // win: door on, lock on (unlocked), power on, alarm OFF
  };
}

function switchStatus(puzzle) {
  const st = { door: false, alarm: false, lock: false, power: false };
  (puzzle.switches || []).forEach((s) => {
    if (s.on) st[s.effect] = true;
  });
  return st;
}

function switchSolved(puzzle) {
  const st = switchStatus(puzzle);
  return st.door && st.lock && st.power && !st.alarm;
}

function generateLiar(seed) {
  const rand = seedRand(seed);
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([r, c]);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const truePos = shuffle(cells).slice(0, 3);
  let falsePos = shuffle(cells).slice(0, 3);
  // ensure false differs
  while (falsePos.every((p, i) => p[0] === truePos[i][0] && p[1] === truePos[i][1])) {
    falsePos = shuffle(cells).slice(0, 3);
  }
  const symbols = ["●", "▲", "★"];
  const trueTarget = symbols.map((sym, i) => ({ id: "o" + i, symbol: sym, r: truePos[i][0], c: truePos[i][1] }));
  const falseTarget = symbols.map((sym, i) => ({ id: "o" + i, symbol: sym, r: falsePos[i][0], c: falsePos[i][1] }));
  // place objects at random starts
  const starts = shuffle(cells).slice(0, 3);
  const objects = symbols.map((sym, i) => ({ id: "o" + i, symbol: sym, r: starts[i][0], c: starts[i][1] }));
  const liarIsGuide = rand() < 0.5;
  return {
    type: "liar",
    objects,
    trueTarget,
    falseTarget,
    liarIsGuide,
    selectedId: null
  };
}

function liarSolved(puzzle) {
  const byId = {};
  puzzle.objects.forEach((o) => { byId[o.id] = o; });
  return puzzle.trueTarget.every((t) => {
    const cur = byId[t.id];
    return cur && cur.r === t.r && cur.c === t.c;
  });
}


function generateFuture(seed) {
  const rand = seedRand(seed);
  const size = 4;
  const start = { r: size - 1, c: 0 };
  const goal = { r: 0, c: size - 1 };
  // sequence of spike cells (length 12 cycling)
  const spikes = [];
  for (let i = 0; i < 12; i++) {
    let r = Math.floor(rand() * size), c = Math.floor(rand() * size);
    if ((r === start.r && c === start.c) || (r === goal.r && c === goal.c)) {
      r = (r + 1) % size;
    }
    spikes.push({ r, c });
  }
  return { type: "future", size, pos: { ...start }, start, goal, spikes, spikeIndex: 0, activeSpike: null };
}

function generateDecay(seed) {
  const rand = seedRand(seed);
  const code = String(Math.floor(rand() * 9000) + 1000);
  return { type: "decay", code, entry: "", decayMax: 12, revealed: true };
}

function generateSequence(seed) {
  const rand = seedRand(seed);
  const pads = ["A", "B", "C", "D"];
  const seq = [];
  for (let i = 0; i < 4; i++) seq.push(pads[Math.floor(rand() * 4)]);
  return { type: "sequence", seq, input: [], showSeq: true };
}

function generateBlueprint(seed) {
  const rand = seedRand(seed);
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([r, c]);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const symbols = ["●", "▲", "★", "■"];
  const tpos = shuffle(cells).slice(0, 4);
  const spos = shuffle(cells).slice(0, 4);
  return {
    type: "blueprint",
    objects: symbols.map((sym, i) => ({ id: "o" + i, symbol: sym, r: spos[i][0], c: spos[i][1] })),
    target: symbols.map((sym, i) => ({ id: "o" + i, symbol: sym, r: tpos[i][0], c: tpos[i][1] }))
  };
}

function blueprintSolved(p) {
  const byId = {};
  p.objects.forEach((o) => { byId[o.id] = o; });
  return p.target.every((t) => { const c = byId[t.id]; return c && c.r === t.r && c.c === t.c; });
}

function generateGravity(seed) {
  const rand = seedRand(seed);
  const size = 5;
  const start = { r: 2, c: 2 };
  const goal = { r: 0, c: 4 };
  const walls = new Set();
  for (let i = 0; i < 6; i++) {
    const r = Math.floor(rand() * size), c = Math.floor(rand() * size);
    if ((r === start.r && c === start.c) || (r === goal.r && c === goal.c)) continue;
    walls.add(r + "," + c);
  }
  return { type: "gravity", size, pos: { ...start }, goal, walls: [...walls], gravDir: 0 }; // 0N 1E 2S 3W
}

function generateWatches(seed) {
  const rand = seedRand(seed);
  const effects = ["door", "alarm", "lock", "power"];
  for (let i = effects.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [effects[i], effects[j]] = [effects[j], effects[i]];
  }
  return {
    type: "watches",
    switches: effects.map((effect, i) => ({ id: "s" + i, label: String(i + 1), effect, on: false })),
    failPatterns: [],
    adapted: false,
    adaptMsg: ""
  };
}

function watchesStatus(p) {
  const st = { door: false, alarm: false, lock: false, power: false };
  (p.switches || []).forEach((s) => { if (s.on) st[s.effect] = true; });
  return st;
}
function watchesSolved(p) {
  const st = watchesStatus(p);
  return st.door && st.lock && st.power && !st.alarm;
}

function startLevelRound(mode) {
  const level = getLevel(state.selectedLevelId);
  if (!level || !level.type) return;
  const { hostRole, partnerRole } = assignRoles(mode, level);
  const seed = state.roomCode + level.id + String(Date.now()).slice(-5);
  let board;
  if (level.type === "rotation") board = generateRotation(seed);
  else if (level.type === "shadow") board = generateShadow(seed);
  else if (level.type === "flash") board = generateFlash(seed);
  else if (level.type === "map") board = generateMap();
  else if (level.type === "blackbox") board = generateBlackBox(seed);
  else if (level.type === "collision") board = generateCollision(seed);
  else if (level.type === "onebody") board = generateOneBody(seed);
  else if (level.type === "switch") board = generateSwitch(seed);
  else if (level.type === "liar") board = generateLiar(seed);
  else if (level.type === "future") board = generateFuture(seed);
  else if (level.type === "decay") board = generateDecay(seed);
  else if (level.type === "sequence") board = generateSequence(seed);
  else if (level.type === "blueprint") board = generateBlueprint(seed);
  else if (level.type === "gravity") board = generateGravity(seed);
  else if (level.type === "watches") board = generateWatches(seed);
  else board = generateMirror(seed);
  const payload = {
    type: "start", from: state.playerId, levelId: level.id, puzzleType: level.type,
    hostRole, partnerRole, startedAt: Date.now(), board
  };
  applyStart(payload);
  sendGame(payload);
}

function applyStart(payload) {
  const level = getLevel(payload.levelId) || getLevel("mirror");
  state.selectedLevelId = level.id;
  state.puzzleRole = state.isHost ? payload.hostRole : payload.partnerRole;
  state.puzzle = { id: level.id, title: level.title, type: payload.puzzleType || level.type, ...payload.board };
  state.startedAt = payload.startedAt || Date.now();
  state.remaining = ROUND_SECONDS;
  state.result = "";
  state.selectedId = null;
  state.introLevel = level;
  state.flashPhase = "";
  state.flashReplayUsed = false;
  state.trayId = null;
  state.mapAnimating = false;
  state.mapMsg = "";
  state.bbSelectedToken = null;
  state.bbPredictMode = false;
  state.bbPrediction = [];
  state.colMsg = "";
  state.bodyMsg = "";
  state.switchMsg = "";
  state.futureTick = 0;
  state.decayLeft = 0;
  state.seqPhase = "";
  state.seqReplay = false;
  state.screen = "intro";
  render();
  setTimeout(() => {
    if (state.screen !== "intro") return;
    state.screen = "countdown";
    state.countdown = 3;
    render();
    const tick = () => {
      if (state.screen !== "countdown") return;
      state.countdown -= 1;
      if (state.countdown <= 0) {
        beginGameTimer();
        if (state.puzzle && state.puzzle.type === "flash") {
          state.flashPhase = "flashing";
          state.screen = "game";
          render();
          setTimeout(() => {
            if (state.screen !== "game" || !state.puzzle || state.puzzle.type !== "flash") return;
            if (state.flashPhase === "flashing") {
              state.flashPhase = "rebuild";
              render();
            }
          }, 4000);
        } else if (state.puzzle && state.puzzle.type === "sequence") {
          state.seqPhase = "show";
          state.screen = "game";
          render();
          setTimeout(() => {
            if (state.screen !== "game" || state.puzzle?.type !== "sequence") return;
            if (state.seqPhase === "show") { state.seqPhase = "play"; render(); }
          }, 3500);
        } else if (state.puzzle && state.puzzle.type === "decay") {
          state.decayLeft = state.puzzle.decayMax || 12;
          state.screen = "game";
          render();
          const decayTick = () => {
            if (state.screen !== "game" || state.puzzle?.type !== "decay") return;
            state.decayLeft -= 1;
            if (state.decayLeft <= 0) {
              state.puzzle.revealed = false;
              // new code
              state.puzzle.code = String(1000 + Math.floor(Math.random() * 9000));
              state.decayLeft = state.puzzle.decayMax || 12;
              state.puzzle.revealed = true;
              sendGame({ type: "decay_new", from: state.playerId, code: state.puzzle.code, decayLeft: state.decayLeft });
            }
            if (state.screen === "game") render();
            if (state.screen === "game" && state.puzzle?.type === "decay") setTimeout(decayTick, 1000);
          };
          setTimeout(decayTick, 1000);
        } else if (state.puzzle && state.puzzle.type === "future") {
          state.screen = "game";
          render();
          const futTick = () => {
            if (state.screen !== "game" || state.puzzle?.type !== "future") return;
            const sp = state.puzzle.spikes[state.puzzle.spikeIndex % state.puzzle.spikes.length];
            state.puzzle.activeSpike = sp;
            state.puzzle.spikeIndex += 1;
            if (state.puzzle.pos && sp && state.puzzle.pos.r === sp.r && state.puzzle.pos.c === sp.c) {
              endRound("timeout");
              return;
            }
            sendGame({ type: "future_tick", from: state.playerId, spikeIndex: state.puzzle.spikeIndex, activeSpike: sp, pos: state.puzzle.pos });
            render();
            if (state.screen === "game") setTimeout(futTick, 2000);
          };
          setTimeout(futTick, 1500);
        } else {
          state.screen = "game";
          render();
        }
      } else {
        render();
        setTimeout(tick, 700);
      }
    };
    setTimeout(tick, 700);
  }, 1600);
}

function beginGameTimer() {
  clearInterval(state.timerId);
  state.startedAt = Date.now();
  state.remaining = ROUND_SECONDS;
  state.timerId = setInterval(() => {
    state.remaining = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - state.startedAt) / 1000));
    state.elapsed = ROUND_SECONDS - state.remaining;
    if (state.screen === "game") {
      const el = document.querySelector(".timer");
      if (el) {
        el.textContent = String(Math.floor(state.remaining / 60)).padStart(2, "0") + ":" + String(state.remaining % 60).padStart(2, "0");
        el.classList.toggle("urgent", state.remaining <= 15);
      }
    }
    if (state.remaining <= 0) endRound("timeout");
  }, 250);
}

function renderIntro() {
  const lv = state.introLevel || getLevel(state.selectedLevelId);
  app.innerHTML = `<main class="shell center intro"><span class="eyebrow">${escapeHtml(lv?.number || "")}</span><h1>${escapeHtml(lv?.title || "")}</h1><p class="tagline">${escapeHtml(lv?.tagline || "")}</p><div class="role-badge">${escapeHtml(state.puzzleRole || "")}</div><p class="role-hint">${escapeHtml(lv?.roleHint?.[state.puzzleRole] || "")}</p></main>`;
}
function renderCountdown() {
  app.innerHTML = `<main class="shell center countdown"><div class="count-num">${state.countdown}</div></main>`;
}

function cellKey(r, c) { return r + "," + c; }
function posMap(objects) {
  const m = {}; objects.forEach((o) => { m[cellKey(o.r, o.c)] = o; }); return m;
}
function mirrorSolved(puzzle) {
  const byId = {}; puzzle.objects.forEach((o) => { byId[o.id] = o; });
  return puzzle.target.every((t) => { const cur = byId[t.id]; return cur && cur.r === t.r && cur.c === t.c; });
}
function toDisplay(r, c, asOp) { return asOp ? { r, c: GRID - 1 - c } : { r, c }; }
function fromDisplay(r, c, asOp) { return asOp ? { r, c: GRID - 1 - c } : { r, c }; }
function renderMirrorBoard(objects, opts = {}) {
  const { asOperator = false, interactive = false } = opts;
  const map = posMap(objects);
  let html = `<div class="grid">`;
  for (let dr = 0; dr < GRID; dr++) {
    for (let dc = 0; dc < GRID; dc++) {
      const { r: lr, c: lc } = fromDisplay(dr, dc, asOperator);
      const obj = map[cellKey(lr, lc)];
      const selected = obj && state.selectedId === obj.id;
      html += `<button type="button" class="cell ${selected ? "selected" : ""} ${obj ? "filled" : ""}" data-id="${obj ? obj.id : ""}" ${interactive && obj ? "" : "disabled"}><span>${obj ? escapeHtml(obj.symbol) : ""}</span></button>`;
    }
  }
  return html + `</div>`;
}
function renderTargetMini(target) {
  const map = {}; target.forEach((t) => { map[cellKey(t.r, t.c)] = t.symbol; });
  let html = `<div class="grid mini">`;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) html += `<div class="cell mini-cell"><span>${escapeHtml(map[cellKey(r, c)] || "")}</span></div>`;
  return html + `</div>`;
}

function rotationSolved(puzzle) {
  return puzzle.pieces.every((p) => p.facing === p.targetFacing);
}
function renderRotationOperator() {
  const pieces = state.puzzle.pieces;
  return `<div class="rot-stage"><div class="rot-list">${pieces.map((p) => `<button type="button" class="rot-piece tone-${p.tone || "amber"} ${state.selectedId === p.id ? "selected" : ""}" data-id="${p.id}"><span class="rot-ring"></span><span class="rot-glyph" style="transform:rotate(${p.facing * 90}deg)">${escapeHtml(p.label)}</span><span class="rot-name">${escapeHtml(p.name || "")}</span><span class="rot-dir">${DIRS[p.facing]}</span></button>`).join("")}</div></div><div class="rot-controls"><button class="btn rot-btn" id="ccwBtn"><span>↺</span> 90°</button><button class="btn primary rot-btn" id="cwBtn"><span>↻</span> 90°</button></div>`;
}
function renderRotationObserver() {
  const pieces = state.puzzle.pieces;
  return `<span class="eyebrow rot-label">TARGET</span><div class="rot-list target">${pieces.map((p) => `<div class="rot-piece locked tone-${p.tone || "amber"}"><span class="rot-ring"></span><span class="rot-glyph" style="transform:rotate(${p.targetFacing * 90}deg)">${escapeHtml(p.label)}</span><span class="rot-name">${escapeHtml(p.name || "")}</span><span class="rot-dir">${DIRS[p.targetFacing]}</span></div>`).join("")}</div><span class="eyebrow rot-label" style="margin-top:18px">LIVE</span><div class="rot-list">${pieces.map((p) => `<div class="rot-piece locked tone-${p.tone || "amber"} ${p.facing === p.targetFacing ? "matched" : ""}"><span class="rot-ring"></span><span class="rot-glyph" style="transform:rotate(${p.facing * 90}deg)">${escapeHtml(p.label)}</span><span class="rot-name">${escapeHtml(p.name || "")}</span><span class="rot-dir">${DIRS[p.facing]}</span></div>`).join("")}</div>`;
}

function shadowSolved(puzzle) {
  return puzzle.pieces.every((p) => p.r === p.tr && p.c === p.tc);
}
function renderShadowBoard(pieces, opts = {}) {
  const { mode = "sil", interactive = false } = opts;
  const map = {};
  pieces.forEach((p) => { map[p.r + "," + p.c] = p; });
  let html = `<div class="shadow-grid">`;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const p = map[r + "," + c];
      if (!p) { html += `<div class="shadow-cell empty"></div>`; continue; }
      const sel = state.selectedId === p.id;
      const matched = p.r === p.tr && p.c === p.tc;
      if (mode === "color") {
        html += `<div class="shadow-cell tone-${p.tone} ${matched ? "matched" : ""}"><span class="sh-glyph">${escapeHtml(p.label)}</span><span class="sh-name">${escapeHtml(p.name)}</span></div>`;
      } else {
        html += `<button type="button" class="shadow-cell sil ${sel ? "selected" : ""} ${matched ? "matched" : ""}" data-id="${p.id}" ${interactive ? "" : "disabled"}><span class="sh-glyph sil-glyph">${escapeHtml(p.label)}</span><span class="sh-name sil-name">${escapeHtml(p.name)}</span></button>`;
      }
    }
  }
  return html + `</div>`;
}
function renderShadowCaster() {
  return `<div class="shadow-stage"><div class="shadow-lamp"></div>${renderShadowBoard(state.puzzle.pieces, { mode: "sil", interactive: true })}</div><p class="microcopy">Tap two silhouettes to swap them.</p>`;
}
function renderShadowSeeker() {
  return `<span class="eyebrow sh-label">TRUE LIGHT</span>${renderShadowBoard(state.puzzle.pieces.map((p) => ({ ...p, r: p.tr, c: p.tc })), { mode: "color", interactive: false })}<span class="eyebrow sh-label" style="margin-top:16px">THEIR SHADOWS</span>${renderShadowBoard(state.puzzle.pieces, { mode: "sil", interactive: false })}<p class="microcopy">Guide by color and name. They only see black forms.</p>`;
}
function tryShadowSwap(id) {
  if (!state.puzzle || state.puzzle.type !== "shadow" || state.puzzleRole !== "CASTER") return;
  if (!state.selectedId) { state.selectedId = id; render(); return; }
  if (state.selectedId === id) { state.selectedId = null; render(); return; }
  const a = state.puzzle.pieces.find((p) => p.id === state.selectedId);
  const b = state.puzzle.pieces.find((p) => p.id === id);
  if (!a || !b) return;
  const ar = a.r, ac = a.c;
  a.r = b.r; a.c = b.c; b.r = ar; b.c = ac;
  state.selectedId = null;
  sendGame({ type: "shadow_swap", from: state.playerId, a: { id: a.id, r: a.r, c: a.c }, b: { id: b.id, r: b.r, c: b.c } });
  if (shadowSolved(state.puzzle)) endRound("win"); else render();
}
function applyShadowSwap(payload) {
  if (!state.puzzle || state.puzzle.type !== "shadow") return;
  const a = state.puzzle.pieces.find((p) => p.id === payload.a.id);
  const b = state.puzzle.pieces.find((p) => p.id === payload.b.id);
  if (!a || !b) return;
  a.r = payload.a.r; a.c = payload.a.c; b.r = payload.b.r; b.c = payload.b.c;
  if (shadowSolved(state.puzzle)) endRound("win"); else render();
}

function flashSolved(puzzle) {
  return puzzle.pieces.every((p) => p.r === p.tr && p.c === p.tc);
}
function renderFlashTarget(pieces) {
  const map = {};
  pieces.forEach((p) => { map[p.tr + "," + p.tc] = p; });
  let html = `<div class="flash-grid lit">`;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const p = map[r + "," + c];
      if (!p) { html += `<div class="flash-cell empty"></div>`; continue; }
      html += `<div class="flash-cell tone-${p.tone}"><span class="fl-glyph">${escapeHtml(p.label)}</span><span class="fl-name">${escapeHtml(p.name)}</span></div>`;
    }
  }
  return html + `</div>`;
}
function renderFlashBoard(pieces, interactive) {
  const map = {};
  pieces.forEach((p) => { if (p.r != null && p.c != null) map[p.r + "," + p.c] = p; });
  let html = `<div class="flash-grid">`;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const p = map[r + "," + c];
      if (!p) {
        html += `<button type="button" class="flash-cell empty slot" data-r="${r}" data-c="${c}" ${interactive ? "" : "disabled"}></button>`;
        continue;
      }
      html += `<button type="button" class="flash-cell tone-${p.tone} placed" data-id="${p.id}" data-r="${r}" data-c="${c}" ${interactive ? "" : "disabled"}><span class="fl-glyph">${escapeHtml(p.label)}</span><span class="fl-name">${escapeHtml(p.name)}</span></button>`;
    }
  }
  return html + `</div>`;
}
function renderFlashTray(pieces, interactive) {
  const free = pieces.filter((p) => p.r == null);
  if (!free.length) return "";
  return `<div class="flash-tray">${free.map((p) => `<button type="button" class="flash-tray-item tone-${p.tone} ${state.trayId === p.id ? "selected" : ""}" data-id="${p.id}" ${interactive ? "" : "disabled"}><span>${escapeHtml(p.label)}</span><span class="fl-name">${escapeHtml(p.name)}</span></button>`).join("")}</div>`;
}
function tryFlashPlace(r, c) {
  if (!state.puzzle || state.puzzle.type !== "flash" || state.puzzleRole !== "HANDS") return;
  if (state.flashPhase !== "rebuild") return;
  const occupied = state.puzzle.pieces.find((p) => p.r === r && p.c === c);
  if (occupied) {
    occupied.r = null; occupied.c = null;
    state.trayId = occupied.id;
    sendGame({ type: "flash_place", from: state.playerId, pieces: state.puzzle.pieces.map((p) => ({ id: p.id, r: p.r, c: p.c })) });
    render();
    return;
  }
  if (!state.trayId) return;
  const piece = state.puzzle.pieces.find((p) => p.id === state.trayId);
  if (!piece) return;
  piece.r = r; piece.c = c;
  state.trayId = null;
  sendGame({ type: "flash_place", from: state.playerId, pieces: state.puzzle.pieces.map((p) => ({ id: p.id, r: p.r, c: p.c })) });
  if (flashSolved(state.puzzle)) endRound("win"); else render();
}
function applyFlashPlace(pieces) {
  if (!state.puzzle || state.puzzle.type !== "flash") return;
  pieces.forEach((u) => {
    const p = state.puzzle.pieces.find((x) => x.id === u.id);
    if (p) { p.r = u.r; p.c = u.c; }
  });
  if (flashSolved(state.puzzle)) endRound("win"); else render();
}
function requestFlashReplay() {
  if (state.puzzleRole !== "WITNESS" || state.flashReplayUsed || state.flashPhase !== "rebuild") return;
  state.flashReplayUsed = true;
  state.startedAt -= 10000;
  state.flashPhase = "flashing";
  sendGame({ type: "flash_replay", from: state.playerId });
  render();
  setTimeout(() => {
    if (state.screen !== "game" || state.puzzle?.type !== "flash") return;
    state.flashPhase = "rebuild";
    render();
  }, 2500);
}
function applyFlashReplay() {
  if (!state.puzzle || state.puzzle.type !== "flash") return;
  state.flashReplayUsed = true;
  state.startedAt -= 10000;
  render();
}

function tryMapExit(dir) {
  if (!state.puzzle || state.puzzle.type !== "map" || state.puzzleRole !== "WALKER") return;
  if (state.mapAnimating) return;
  const room = state.puzzle.rooms[state.puzzle.current];
  if (!room || !room.exits[dir]) return;
  const nextId = room.exits[dir];
  state.mapAnimating = true;
  state.mapMsg = "";
  render();
  setTimeout(() => {
    if (!state.puzzle || state.puzzle.type !== "map") return;
    state.puzzle.current = nextId;
    state.puzzle.path = (state.puzzle.path || []).concat([nextId]);
    state.mapAnimating = false;
    sendGame({ type: "map_move", from: state.playerId, current: nextId, path: state.puzzle.path });
    if (nextId === "goal") { endRound("win"); return; }
    if (nextId === "trap") {
      state.mapMsg = "TRAP — back to START";
      state.puzzle.current = "start";
      state.puzzle.path = (state.puzzle.path || []).concat(["start"]);
      sendGame({ type: "map_move", from: state.playerId, current: "start", path: state.puzzle.path, trap: true });
    }
    render();
  }, 700);
}
function applyMapMove(payload) {
  if (!state.puzzle || state.puzzle.type !== "map") return;
  state.puzzle.current = payload.current;
  if (payload.path) state.puzzle.path = payload.path;
  state.mapAnimating = false;
  state.mapMsg = payload.trap ? "TRAP — they reset to START" : "";
  if (payload.current === "goal") endRound("win");
  else render();
}
function renderMapGuide(p) {
  const nodes = [
    { id: "start", x: 1, y: 0 }, { id: "a", x: 1, y: 1 }, { id: "b", x: 2, y: 1 },
    { id: "c", x: 1, y: 2 }, { id: "d", x: 2, y: 2 }, { id: "goal", x: 3, y: 2 }, { id: "trap", x: 1, y: 3 }
  ];
  let html = `<div class="map-board">`;
  nodes.forEach((n) => {
    const room = p.rooms[n.id];
    const here = p.current === n.id;
    html += `<div class="map-node tone-${room.tone} ${here ? "here" : ""} ${n.id === "goal" ? "goal" : ""} ${n.id === "trap" ? "trap" : ""}" style="left:${n.x * 72}px;top:${n.y * 64}px"><span class="map-node-label">${escapeHtml(room.label)}</span>${here ? `<span class="map-walker"></span>` : ""}</div>`;
  });
  return html + `</div>`;
}
function renderMapWalker(p) {
  const room = p.rooms[p.current];
  if (!room) return "";
  const exits = Object.keys(room.exits || {});
  const anim = state.mapAnimating ? "walking" : "";
  return `<div class="walker-stage tone-${room.tone}"><div class="walker-room ${anim}"><div class="walker-floor"></div><div class="walker-char"></div>${exits.map((d) => `<button type="button" class="walker-exit dir-${d}" data-dir="${d}" ${state.mapAnimating ? "disabled" : ""}><span class="exit-arrow">${MAP_DIR_ARROW[d]}</span><span class="exit-label">${MAP_DIR_LABEL[d]}</span></button>`).join("")}</div><p class="walker-room-name">You are in a room</p><p class="microcopy">No labels. Ask the Guide which way.</p></div>`;
}

function renderGame() {
  const p = state.puzzle;
  if (!p) return;
  const isOp = state.puzzleRole === "OPERATOR";
  const mm = String(Math.floor(state.remaining / 60)).padStart(2, "0");
  const ss = String(state.remaining % 60).padStart(2, "0");
  const title = p.title || "PUZZLE";

  if (p.type === "switch") {
    const isHands = state.puzzleRole === "HANDS";
    const st = switchStatus(p);
    if (isHands) {
      const swHtml = (p.switches || []).map((s) =>
        `<button type="button" class="sw-toggle ${s.on ? "on" : ""}" data-id="${s.id}"><span class="sw-num">${escapeHtml(s.label)}</span><span class="sw-state">${s.on ? "ON" : "OFF"}</span></button>`
      ).join("");
      app.innerHTML = `<main class="shell game sw-theme"><header class="topbar"><div class="brand">SWITCH · HANDS</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">No labels. Flip switches. Panel sees what happens.</p>
        <div class="sw-row">${swHtml}</div>
        <p class="microcopy">Talk. Find the safe combination.</p>
      </main>`;
      document.querySelectorAll(".sw-toggle").forEach((btn) => {
        btn.onclick = () => switchFlip(btn.dataset.id);
      });
    } else {
      app.innerHTML = `<main class="shell game sw-theme"><header class="topbar"><div class="brand">SWITCH · PANEL</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Status only. Guide Hands to: door open, lock open, power on, alarm off.</p>
        <div class="sw-panel">
          <div class="sw-light ${st.door ? "ok" : ""}"><span>DOOR</span><strong>${st.door ? "OPEN" : "SHUT"}</strong></div>
          <div class="sw-light ${st.lock ? "ok" : ""}"><span>LOCK</span><strong>${st.lock ? "OPEN" : "LOCKED"}</strong></div>
          <div class="sw-light ${st.power ? "ok" : ""}"><span>POWER</span><strong>${st.power ? "ON" : "OFF"}</strong></div>
          <div class="sw-light ${st.alarm ? "bad" : "ok"}"><span>ALARM</span><strong>${st.alarm ? "ARMED" : "CLEAR"}</strong></div>
        </div>
        <p class="microcopy">Target: DOOR OPEN · LOCK OPEN · POWER ON · ALARM CLEAR</p>
      </main>`;
    }
    return;
  }

  if (p.type === "liar") {
    const isGuide = state.puzzleRole === "GUIDE";
    const isLiar = (isGuide && p.liarIsGuide) || (!isGuide && !p.liarIsGuide);
    const myTarget = isLiar ? p.falseTarget : p.trueTarget;
    if (isGuide) {
      app.innerHTML = `<main class="shell game liar-theme"><header class="topbar"><div class="brand">LIAR · GUIDE</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Your target may be true — or a lie. Compare with them.</p>
        <span class="eyebrow">YOUR SHEET</span>
        ${renderTargetMini(myTarget)}
        <span class="eyebrow" style="margin-top:14px">BOARD</span>
        ${renderMirrorBoard(p.objects, { asOperator: false, interactive: false })}
        <p class="microcopy">If your sheet disagrees with theirs, one of you is the lie.</p>
      </main>`;
    } else {
      app.innerHTML = `<main class="shell game liar-theme"><header class="topbar"><div class="brand">LIAR · BUILDER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Place pieces. Your sheet may be false. Trust nothing blindly.</p>
        <span class="eyebrow">YOUR SHEET</span>
        ${renderTargetMini(myTarget)}
        <span class="eyebrow" style="margin-top:14px">BOARD</span>
        ${renderMirrorBoard(p.objects, { asOperator: false, interactive: true })}
        <div class="pad"><button class="pad-btn" data-dir="up">↑</button><div class="pad-mid"><button class="pad-btn" data-dir="left">←</button><button class="pad-btn" data-dir="right">→</button></div><button class="pad-btn" data-dir="down">↓</button></div>
        <p class="microcopy">Win only if the board matches the real target.</p>
      </main>`;
      document.querySelectorAll(".cell:not([disabled])").forEach((btn) => {
        btn.onclick = () => { state.selectedId = btn.dataset.id || null; render(); };
      });
      document.querySelectorAll(".pad-btn").forEach((btn) => {
        btn.onclick = () => liarMove(btn.dataset.dir);
      });
    }
    return;
  }

    if (p.type === "future") {
    const isOracle = state.puzzleRole === "ORACLE";
    const size = p.size || 4;
    const upcoming = [];
    for (let i = 0; i < 3; i++) {
      const sp = p.spikes[(p.spikeIndex + i) % p.spikes.length];
      upcoming.push(sp);
    }
    let grid = `<div class="fu-grid" style="grid-template-columns:repeat(${size},1fr)">`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isPos = p.pos && p.pos.r === r && p.pos.c === c;
        const isGoal = p.goal && p.goal.r === r && p.goal.c === c;
        const isActive = p.activeSpike && p.activeSpike.r === r && p.activeSpike.c === c;
        const futIdx = isOracle ? upcoming.findIndex((u) => u.r === r && u.c === c) : -1;
        let cls = "fu-cell";
        if (isPos) cls += " here";
        if (isGoal) cls += " goal";
        if (isActive) cls += " spike";
        if (futIdx >= 0) cls += " next next-" + futIdx;
        let inner = isPos ? "●" : isGoal ? "★" : isActive ? "⚡" : futIdx >= 0 ? String(futIdx + 1) : "";
        grid += `<div class="${cls}">${inner}</div>`;
      }
    }
    grid += `</div>`;
    if (isOracle) {
      app.innerHTML = `<main class="shell game fu-theme"><header class="topbar"><div class="brand">FUTURE · ORACLE</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Numbers = spikes coming. ⚡ is live. Guide Runner to ★.</p>${grid}
        <p class="microcopy">1 = next spike · 2 · 3</p></main>`;
    } else {
      app.innerHTML = `<main class="shell game fu-theme"><header class="topbar"><div class="brand">FUTURE · RUNNER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Move. Spikes hit hard. Oracle sees them coming.</p>${grid}
        <div class="col-pad"><button class="btn col-dir" data-dir="n">↑</button><div class="col-pad-mid"><button class="btn col-dir" data-dir="w">←</button><button class="btn col-dir" data-dir="e">→</button></div><button class="btn col-dir" data-dir="s">↓</button></div></main>`;
      document.querySelectorAll(".col-dir").forEach((b) => { b.onclick = () => futureMove(b.dataset.dir); });
    }
    return;
  }

  if (p.type === "decay") {
    const isHolder = state.puzzleRole === "HOLDER";
    if (isHolder) {
      app.innerHTML = `<main class="shell game dy-theme"><header class="topbar"><div class="brand">DECAY · HOLDER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Tell them the code before it dies.</p>
        <div class="dy-code">${p.revealed ? escapeHtml(p.code) : "····"}</div>
        <div class="dy-bar"><div class="dy-fill" style="width:${Math.max(0, (state.decayLeft / (p.decayMax || 12)) * 100)}%"></div></div>
        <p class="microcopy">Decays in ${state.decayLeft}s — then a new code.</p></main>`;
    } else {
      app.innerHTML = `<main class="shell game dy-theme"><header class="topbar"><div class="brand">DECAY · KEYPAD</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Enter the code they give you.</p>
        <div class="dy-entry">${escapeHtml(p.entry || "————")}</div>
        <div class="dy-keys">${[1,2,3,4,5,6,7,8,9,"C",0,"OK"].map((k) => `<button class="btn dy-key" data-k="${k}">${k}</button>`).join("")}</div></main>`;
      document.querySelectorAll(".dy-key").forEach((b) => { b.onclick = () => decayKey(b.dataset.k); });
    }
    return;
  }

  if (p.type === "sequence") {
    const isCaller = state.puzzleRole === "CALLER";
    const phase = state.seqPhase || "play";
    if (phase === "show" && isCaller) {
      app.innerHTML = `<main class="shell game sq-theme"><header class="topbar"><div class="brand">SEQUENCE · CALLER</div><div class="timer">${mm}:${ss}</div></header>
        <p class="role-hint flash-warn">MEMORIZE ORDER</p>
        <div class="sq-show">${(p.seq || []).map((x) => `<span class="sq-pad lit">${escapeHtml(x)}</span>`).join("")}</div></main>`;
      return;
    }
    if (phase === "show" && !isCaller) {
      app.innerHTML = `<main class="shell game sq-theme"><header class="topbar"><div class="brand">SEQUENCE · PLAYER</div><div class="timer">${mm}:${ss}</div></header><p class="role-hint">Sequence loading…</p></main>`;
      return;
    }
    if (isCaller) {
      app.innerHTML = `<main class="shell game sq-theme"><header class="topbar"><div class="brand">SEQUENCE · CALLER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Guide them. Order is hidden from them.</p>
        <div class="sq-show dim">${(p.seq || []).map((x) => `<span class="sq-pad">${escapeHtml(x)}</span>`).join("")}</div>
        ${!state.seqReplay ? `<button class="btn" id="seqReplay">REPLAY (−8s)</button>` : `<p class="microcopy">Replay used.</p>`}
        <p class="microcopy">They have pressed: ${(p.input || []).join(" ") || "—"}</p></main>`;
      const rb = document.getElementById("seqReplay");
      if (rb) rb.onclick = () => seqReplay();
    } else {
      app.innerHTML = `<main class="shell game sq-theme"><header class="topbar"><div class="brand">SEQUENCE · PLAYER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Press pads in the order they say.</p>
        <div class="sq-row">${["A","B","C","D"].map((x) => `<button class="btn sq-pad" data-p="${x}">${x}</button>`).join("")}</div>
        <p class="microcopy">Input: ${(p.input || []).join(" ") || "—"}</p></main>`;
      document.querySelectorAll(".sq-pad").forEach((b) => { b.onclick = () => seqPress(b.dataset.p); });
    }
    return;
  }

  if (p.type === "blueprint") {
    const isArch = state.puzzleRole === "ARCHITECT";
    if (isArch) {
      app.innerHTML = `<main class="shell game bp-theme"><header class="topbar"><div class="brand">BLUEPRINT · ARCHITECT</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">This is the plan. Guide the builder. You cannot place.</p>
        <span class="eyebrow">BLUEPRINT</span>${renderTargetMini(p.target)}
        <span class="eyebrow" style="margin-top:14px">LIVE</span>${renderMirrorBoard(p.objects, { interactive: false })}
      </main>`;
    } else {
      app.innerHTML = `<main class="shell game bp-theme"><header class="topbar"><div class="brand">BLUEPRINT · BUILDER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Place pieces. You never see the blueprint.</p>
        ${renderMirrorBoard(p.objects, { interactive: true })}
        <div class="pad"><button class="pad-btn" data-dir="up">↑</button><div class="pad-mid"><button class="pad-btn" data-dir="left">←</button><button class="pad-btn" data-dir="right">→</button></div><button class="pad-btn" data-dir="down">↓</button></div>
      </main>`;
      document.querySelectorAll(".cell:not([disabled])").forEach((btn) => {
        btn.onclick = () => { state.selectedId = btn.dataset.id || null; render(); };
      });
      document.querySelectorAll(".pad-btn").forEach((btn) => {
        btn.onclick = () => bpMove(btn.dataset.dir);
      });
    }
    return;
  }

  if (p.type === "gravity") {
    const isPuller = state.puzzleRole === "PULLER";
    const size = p.size || 5;
    const walls = new Set(p.walls || []);
    const gdir = p.gravDir || 0;
    const arrows = ["↑", "→", "↓", "←"];
    let grid = `<div class="gv-grid" style="grid-template-columns:repeat(${size},1fr)">`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isPos = p.pos && p.pos.r === r && p.pos.c === c;
        const isGoal = p.goal && p.goal.r === r && p.goal.c === c;
        const isWall = walls.has(r + "," + c);
        let cls = "gv-cell";
        if (isWall) cls += " wall";
        if (isPos) cls += " here";
        if (isGoal) cls += " goal";
        let inner = isPos ? "●" : isGoal ? "★" : isWall ? "■" : "";
        grid += `<div class="${cls}">${inner}</div>`;
      }
    }
    grid += `</div>`;
    if (isPuller) {
      app.innerHTML = `<main class="shell game gv-theme"><header class="topbar"><div class="brand">GRAVITY · PULLER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Set gravity. Faller can only step with the pull or sideways.</p>
        <p class="gv-dir">GRAVITY ${arrows[gdir]}</p>${grid}
        <div class="gv-dirs">${[0,1,2,3].map((d) => `<button class="btn gv-d ${gdir===d?"primary":""}" data-d="${d}">${arrows[d]}</button>`).join("")}</div>
      </main>`;
      document.querySelectorAll(".gv-d").forEach((b) => { b.onclick = () => gravSet(+b.dataset.d); });
    } else {
      app.innerHTML = `<main class="shell game gv-theme"><header class="topbar"><div class="brand">GRAVITY · FALLER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Move with gravity ${arrows[gdir]} or sideways. Reach ★.</p>
        <p class="gv-dir">PULL ${arrows[gdir]}</p>${grid}
        <div class="col-pad"><button class="btn col-dir" data-dir="n">↑</button><div class="col-pad-mid"><button class="btn col-dir" data-dir="w">←</button><button class="btn col-dir" data-dir="e">→</button></div><button class="btn col-dir" data-dir="s">↓</button></div>
      </main>`;
      document.querySelectorAll(".col-dir").forEach((b) => { b.onclick = () => gravMove(b.dataset.dir); });
    }
    return;
  }

  if (p.type === "watches") {
    const isHands = state.puzzleRole === "HANDS";
    const st = watchesStatus(p);
    if (isHands) {
      const swHtml = (p.switches || []).map((s) =>
        `<button type="button" class="sw-toggle ${s.on ? "on" : ""}" data-id="${s.id}"><span class="sw-num">${escapeHtml(s.label)}</span><span class="sw-state">${s.on ? "ON" : "OFF"}</span></button>`
      ).join("");
      app.innerHTML = `<main class="shell game wt-theme"><header class="topbar"><div class="brand">WATCHES · HANDS</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Fail the same pattern twice and the machine remaps.</p>
        ${p.adaptMsg ? `<p class="wt-adapt">${escapeHtml(p.adaptMsg)}</p>` : ""}
        <div class="sw-row">${swHtml}</div></main>`;
      document.querySelectorAll(".sw-toggle").forEach((btn) => { btn.onclick = () => watchesFlip(btn.dataset.id); });
    } else {
      app.innerHTML = `<main class="shell game wt-theme"><header class="topbar"><div class="brand">WATCHES · PANEL</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Status board. If SYSTEM ADAPTS, the mapping changed.</p>
        ${p.adaptMsg ? `<p class="wt-adapt">${escapeHtml(p.adaptMsg)}</p>` : ""}
        <div class="sw-panel">
          <div class="sw-light ${st.door ? "ok" : ""}"><span>DOOR</span><strong>${st.door ? "OPEN" : "SHUT"}</strong></div>
          <div class="sw-light ${st.lock ? "ok" : ""}"><span>LOCK</span><strong>${st.lock ? "OPEN" : "LOCKED"}</strong></div>
          <div class="sw-light ${st.power ? "ok" : ""}"><span>POWER</span><strong>${st.power ? "ON" : "OFF"}</strong></div>
          <div class="sw-light ${st.alarm ? "bad" : "ok"}"><span>ALARM</span><strong>${st.alarm ? "ARMED" : "CLEAR"}</strong></div>
        </div>
        <p class="microcopy">Target: DOOR+LOCK+POWER on, ALARM clear</p></main>`;
    }
    return;
  }

    if (p.type === "onebody") {
    const isLegs = state.puzzleRole === "LEGS";
    const size = p.size || 5;
    const gateSet = new Set();
    (p.gates || []).forEach((g) => {
      if (!g.open) (g.cells || []).forEach((k) => gateSet.add(k));
    });
    let grid = `<div class="body-grid" style="grid-template-columns:repeat(${size},1fr)">`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const k = r + "," + c;
        const isPos = p.pos && p.pos.r === r && p.pos.c === c;
        const isExit = p.exit && p.exit.r === r && p.exit.c === c;
        const btn = bodyButtonAt(p, r, c);
        const isGate = gateSet.has(k);
        let cls = "body-cell";
        if (isGate) cls += " gate";
        if (btn) cls += btn.on ? " btn-on" : " btn-off";
        if (isPos) cls += " here";
        if (isExit) cls += " exit";
        let inner = "";
        if (isPos) inner = `<span class="body-char">◉</span>`;
        else if (isExit) inner = `<span class="body-exit">▣</span>`;
        else if (btn) inner = `<span class="body-btn">${btn.on ? "●" : "○"}</span>`;
        else if (isGate) inner = `<span class="body-gate">═</span>`;
        grid += `<div class="${cls}">${inner}</div>`;
      }
    }
    grid += `</div>`;
    const onBtn = bodyButtonAt(p, p.pos.r, p.pos.c);
    if (isLegs) {
      app.innerHTML = `<main class="shell game body-theme"><header class="topbar"><div class="brand">ONE BODY · LEGS</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">You move. You cannot press. Stand on ○ so Arms can open gates.</p>
        ${state.bodyMsg ? `<p class="body-alert">${escapeHtml(state.bodyMsg)}</p>` : ""}
        ${grid}
        <div class="body-pad">
          <button class="btn body-dir" data-dir="n">↑</button>
          <div class="body-pad-mid">
            <button class="btn body-dir" data-dir="w">←</button>
            <button class="btn body-dir" data-dir="e">→</button>
          </div>
          <button class="btn body-dir" data-dir="s">↓</button>
        </div>
        <p class="microcopy">═ closed gate · ○ button · ▣ exit</p>
      </main>`;
      document.querySelectorAll(".body-dir").forEach((btn) => {
        btn.onclick = () => bodyMove(btn.dataset.dir);
      });
    } else {
      app.innerHTML = `<main class="shell game body-theme"><header class="topbar"><div class="brand">ONE BODY · ARMS</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">You press. You cannot walk. When the body is on ○, press.</p>
        ${state.bodyMsg ? `<p class="body-alert">${escapeHtml(state.bodyMsg)}</p>` : ""}
        ${grid}
        <button class="btn primary body-press" id="bodyPressBtn" ${onBtn && !onBtn.on ? "" : "disabled"}>
          ${onBtn && !onBtn.on ? "PRESS BUTTON" : onBtn && onBtn.on ? "ALREADY ON" : "NOT ON A BUTTON"}
        </button>
        <p class="microcopy">Tell Legs where to stand. Then press.</p>
      </main>`;
      const pb = document.getElementById("bodyPressBtn");
      if (pb && !pb.disabled) pb.onclick = () => bodyPress();
    }
    return;
  }

    if (p.type === "collision") {
    const isSeer = state.puzzleRole === "SEER";
    const size = p.size || 5;
    const walls = new Set(p.walls || []);
    let grid = `<div class="col-grid" style="grid-template-columns:repeat(${size},1fr)">`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const k = colKey(r, c);
        const isWall = walls.has(k);
        const isPos = p.pos && p.pos.r === r && p.pos.c === c;
        const isGoal = p.goal && p.goal.r === r && p.goal.c === c;
        const isStart = p.start && p.start.r === r && p.start.c === c;
        let cls = "col-cell";
        if (isSeer && isWall) cls += " wall";
        if (isPos) cls += " here";
        if (isGoal) cls += " goal";
        if (isStart && !isPos) cls += " start";
        if (p.bumped && p.bumped.r === r && p.bumped.c === c) cls += " bump";
        let inner = "";
        if (isPos) inner = `<span class="col-walker">●</span>`;
        else if (isSeer && isWall) inner = `<span class="col-wall">■</span>`;
        else if (isGoal) inner = `<span class="col-goal">★</span>`;
        grid += `<div class="${cls}">${inner}</div>`;
      }
    }
    grid += `</div>`;
    if (isSeer) {
      app.innerHTML = `<main class="shell game col-theme"><header class="topbar"><div class="brand">COLLISION · SEER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Walls are real. They cannot see them. Guide the walker to ★.</p>
        ${grid}
        <p class="microcopy">Dark blocks = walls. ★ = goal. ● = them.</p>
      </main>`;
    } else {
      app.innerHTML = `<main class="shell game col-theme"><header class="topbar"><div class="brand">COLLISION · WALKER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">The room looks empty. Ask before you move.</p>
        ${state.colMsg ? `<p class="col-alert">${escapeHtml(state.colMsg)}</p>` : ""}
        ${grid}
        <div class="col-pad">
          <button class="btn col-dir" data-dir="n">↑</button>
          <div class="col-pad-mid">
            <button class="btn col-dir" data-dir="w">←</button>
            <button class="btn col-dir" data-dir="e">→</button>
          </div>
          <button class="btn col-dir" data-dir="s">↓</button>
        </div>
        <p class="microcopy">★ is the goal. Walls will stop you.</p>
      </main>`;
      document.querySelectorAll(".col-dir").forEach((btn) => {
        btn.onclick = () => colMove(btn.dataset.dir);
      });
    }
    return;
  }

    if (p.type === "blackbox") {
    const isLoader = state.puzzleRole === "LOADER";
    const trials = p.trialsLeft ?? 0;
    if (isLoader) {
      const slotsHtml = (p.slots || [null, null, null]).map((s, i) =>
        `<button type="button" class="bb-slot ${s ? "filled" : ""}" data-slot="${i}">${s ? renderTokenChip(s) : `<span class="bb-slot-num">${i + 1}</span>`}</button>`
      ).join("");
      const trayHtml = (p.tokens || []).map((t) => {
        const used = (p.slots || []).some((s) => s && s.id === t.id);
        return `<button type="button" class="bb-tray-item ${used ? "used" : ""} ${state.bbSelectedToken === t.id ? "selected" : ""}" data-tid="${t.id}" ${used ? "disabled" : ""}>${renderTokenChip(t)}</button>`;
      }).join("");
      app.innerHTML = `<main class="shell game bb-theme bb-loader"><header class="topbar"><div class="brand">BLACK BOX · LOADER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
        <p class="role-hint">Place tokens in order. RUN the machine. You never see the output.</p>
        <div class="bb-trials">TRIALS LEFT · <strong>${trials}</strong></div>
        <span class="eyebrow">INPUT SLOTS</span>
        <div class="bb-slots">${slotsHtml}</div>
        <span class="eyebrow">TOKENS</span>
        <div class="bb-tray">${trayHtml}</div>
        <button class="btn primary bb-run" id="bbRunBtn" ${trials <= 0 ? "disabled" : ""}>RUN</button>
        <p class="microcopy">Watcher sees the output. Talk. Experiment.</p>
      </main>`;
      document.querySelectorAll(".bb-tray-item:not([disabled])").forEach((btn) => {
        btn.onclick = () => { state.bbSelectedToken = btn.dataset.tid; render(); };
      });
      document.querySelectorAll(".bb-slot").forEach((btn) => {
        btn.onclick = () => {
          const i = Number(btn.dataset.slot);
          if (state.bbSelectedToken) {
            const tok = p.tokens.find((t) => t.id === state.bbSelectedToken);
            if (!tok) return;
            if ((p.slots || []).some((s) => s && s.id === tok.id)) return;
            p.slots[i] = { ...tok };
            state.bbSelectedToken = null;
            render();
          } else if (p.slots[i]) {
            p.slots[i] = null;
            render();
          }
        };
      });
      const runBtn = document.getElementById("bbRunBtn");
      if (runBtn) runBtn.onclick = () => bbRun();
      return;
    }
    // WATCHER
    const out = p.lastOutput || [];
    const hist = p.history || [];
    const pred = state.bbPrediction || [];
    const outHtml = out.length ? out.map((t) => renderTokenChip(t)).join("") : `<span class="bb-empty-out">EMPTY</span>`;
    const histHtml = hist.length
      ? hist.map((h, i) => `<div class="bb-hist-row"><span class="bb-hist-n">#${hist.length - i}</span>${(h.length ? h.map((t) => renderTokenChip(t, "mini")).join("") : `<span class="bb-empty">∅</span>`)}</div>`).join("")
      : `<p class="microcopy">No runs yet.</p>`;
    const predTray = (p.tokens || []).map((t) => {
      const used = pred.some((x) => x && x.id === t.id);
      return `<button type="button" class="bb-tray-item ${used ? "used" : ""}" data-tid="${t.id}" ${used ? "disabled" : ""}>${renderTokenChip(t)}</button>`;
    }).join("");
    const predSlots = [0, 1, 2].map((i) => {
      const s = pred[i] || null;
      return `<button type="button" class="bb-slot ${s ? "filled" : ""}" data-pi="${i}">${s ? renderTokenChip(s) : `<span class="bb-slot-num">${i + 1}</span>`}</button>`;
    }).join("");
    app.innerHTML = `<main class="shell game bb-theme bb-watcher"><header class="topbar"><div class="brand">BLACK BOX · WATCHER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header>
      <p class="role-hint">You only see outputs. Form a hypothesis. Lock a prediction to prove it.</p>
      <div class="bb-trials">TRIALS LEFT · <strong>${trials}</strong></div>
      <span class="eyebrow">LAST OUTPUT</span>
      <div class="bb-output">${outHtml}</div>
      <span class="eyebrow">HISTORY</span>
      <div class="bb-history">${histHtml}</div>
      <span class="eyebrow">YOUR PREDICTION</span>
      <div class="bb-slots">${predSlots}</div>
      <div class="bb-tray">${predTray}</div>
      <div class="bb-pred-actions">
        <button class="btn" id="bbClearPred">CLEAR</button>
        <button class="btn primary" id="bbLockPred">${p.pendingPredict ? "PREDICTION LOCKED" : "LOCK PREDICTION"}</button>
      </div>
      <p class="microcopy">${p.pendingPredict ? "Waiting for Loader to RUN…" : "Predict next output, then tell Loader to RUN."}</p>
    </main>`;
    document.querySelectorAll(".bb-tray-item:not([disabled])").forEach((btn) => {
      btn.onclick = () => {
        if (p.pendingPredict) return;
        const tok = p.tokens.find((t) => t.id === btn.dataset.tid);
        if (!tok) return;
        const next = (state.bbPrediction || []).slice();
        if (next.length >= 3) return;
        next.push({ ...tok });
        state.bbPrediction = next;
        render();
      };
    });
    document.querySelectorAll(".bb-slot[data-pi]").forEach((btn) => {
      btn.onclick = () => {
        if (p.pendingPredict) return;
        const i = Number(btn.dataset.pi);
        const next = (state.bbPrediction || []).slice();
        next.splice(i, 1);
        state.bbPrediction = next;
        render();
      };
    });
    document.getElementById("bbClearPred").onclick = () => {
      if (p.pendingPredict) return;
      state.bbPrediction = [];
      render();
    };
    document.getElementById("bbLockPred").onclick = () => bbLockPredict();
    return;
  }

    if (p.type === "map") {
    const isGuide = state.puzzleRole === "GUIDE";
    const room = p.rooms[p.current];
    app.innerHTML = `<main class="shell game map-theme"><header class="topbar"><div class="brand">THE MAP · ${isGuide ? "GUIDE" : "WALKER"}</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">${isGuide ? "Full map. Live position marked. Talk them to GOAL. Avoid TRAP." : "Only this room. Tap an exit to walk. You cannot see the map."}</p>${state.mapMsg ? `<p class="map-alert">${escapeHtml(state.mapMsg)}</p>` : ""}${isGuide ? renderMapGuide(p) : renderMapWalker(p)}${isGuide ? `<p class="microcopy">Walker is in: <strong>${escapeHtml(room?.label || "?")}</strong></p>` : ""}</main>`;
    if (!isGuide) {
      document.querySelectorAll(".walker-exit").forEach((btn) => {
        btn.onclick = () => tryMapExit(btn.dataset.dir);
      });
    }
    return;
  }

  if (p.type === "flash") {
    const isWitness = state.puzzleRole === "WITNESS";
    const phase = state.flashPhase || "rebuild";
    if (phase === "flashing") {
      if (isWitness) {
        app.innerHTML = `<main class="shell game flash-theme flashing"><div class="flash-burst"></div><header class="topbar"><div class="brand">THE FLASH · WITNESS</div><div class="timer">${mm}:${ss}</div></header><p class="role-hint flash-warn">MEMORIZE</p>${renderFlashTarget(p.pieces)}</main>`;
      } else {
        app.innerHTML = `<main class="shell game flash-theme"><header class="topbar"><div class="brand">THE FLASH · HANDS</div><div class="timer">${mm}:${ss}</div></header><p class="role-hint">Flash in progress. Wait…</p><div class="flash-wait">● ● ●</div></main>`;
      }
      return;
    }
    if (isWitness) {
      app.innerHTML = `<main class="shell game flash-theme"><header class="topbar"><div class="brand">THE FLASH · WITNESS</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">Pattern is gone. Guide them from memory.</p><div class="flash-dark"><p class="microcopy">You cannot see the board.</p>${!state.flashReplayUsed ? `<button class="btn primary" id="replayFlashBtn">REPLAY FLASH (−10s)</button>` : `<p class="microcopy">Replay used.</p>`}</div><p class="microcopy">Say colors and positions. SPIRE top-left…</p></main>`;
      const rb = document.getElementById("replayFlashBtn");
      if (rb) rb.onclick = requestFlashReplay;
    } else {
      app.innerHTML = `<main class="shell game flash-theme"><header class="topbar"><div class="brand">THE FLASH · HANDS</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">Place pieces from what they remember. You never saw the flash.</p>${renderFlashBoard(p.pieces, true)}${renderFlashTray(p.pieces, true)}<p class="microcopy">Tap a piece, then a cell. Tap a placed piece to pick it up.</p></main>`;
      document.querySelectorAll(".flash-tray-item").forEach((el) => {
        el.onclick = () => { state.trayId = el.dataset.id; render(); };
      });
      document.querySelectorAll(".flash-cell.slot, .flash-cell.placed").forEach((el) => {
        el.onclick = () => tryFlashPlace(parseInt(el.dataset.r, 10), parseInt(el.dataset.c, 10));
      });
    }
    return;
  }

  if (p.type === "shadow") {
    const isCaster = state.puzzleRole === "CASTER";
    app.innerHTML = `<main class="shell game shadow-theme"><div class="sh-ambient"></div><header class="topbar"><div class="brand">${escapeHtml(title)} · ${isCaster ? "CASTER" : "SEEKER"}</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">${isCaster ? "Only silhouettes. Tap two to swap. You cannot see colors." : "You see the true colored pattern. Guide them. You cannot move."}</p>${isCaster ? renderShadowCaster() : renderShadowSeeker()}</main>`;
    if (isCaster) {
      document.querySelectorAll(".shadow-cell[data-id]").forEach((el) => {
        el.onclick = () => tryShadowSwap(el.dataset.id);
      });
    }
    return;
  }

  if (p.type === "rotation") {
    app.innerHTML = `<main class="shell game rotation-theme"><div class="rot-ambient"></div><header class="topbar"><div class="brand">${escapeHtml(title)} · ${isOp ? "OPERATOR" : "OBSERVER"}</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">${isOp ? "Tap a dial, then rotate. You do not see the targets." : "You see correct facings. Guide them. You cannot rotate."}</p>${isOp ? renderRotationOperator() : renderRotationObserver()}<p class="microcopy">${isOp ? "Name the piece (SPIRE, CORE…). Say the direction." : "Tell them which dial and which way."}</p></main>`;
    if (isOp) {
      document.querySelectorAll(".rot-piece[data-id]").forEach((el) => {
        el.onclick = () => { state.selectedId = el.dataset.id; render(); };
      });
      document.getElementById("cwBtn").onclick = () => rotateSelected(1);
      document.getElementById("ccwBtn").onclick = () => rotateSelected(-1);
    }
    return;
  }

  if (isOp) {
    app.innerHTML = `<main class="shell game"><header class="topbar"><div class="brand">${escapeHtml(title)} · OPERATOR</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">Move objects. No target. Talk outside the app.</p>${renderMirrorBoard(p.objects, { asOperator: true, interactive: true })}<div class="pad"><button class="pad-btn" data-dir="up">↑</button><div class="pad-mid"><button class="pad-btn" data-dir="left">←</button><button class="pad-btn" data-dir="right">→</button></div><button class="pad-btn" data-dir="down">↓</button></div><p class="microcopy">Tap object, then direction.</p></main>`;
    document.querySelectorAll(".cell.filled").forEach((el) => { el.onclick = () => { state.selectedId = el.dataset.id; render(); }; });
    document.querySelectorAll(".pad-btn").forEach((btn) => { btn.onclick = () => tryMirrorMove(btn.dataset.dir); });
  } else {
    app.innerHTML = `<main class="shell game"><header class="topbar"><div class="brand">${escapeHtml(title)} · OBSERVER</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><p class="role-hint">You see the target. Guide them. You cannot move.</p><span class="eyebrow">TARGET</span>${renderTargetMini(p.target)}<span class="eyebrow" style="margin-top:14px">ROOM</span>${renderMirrorBoard(p.objects, { asOperator: false, interactive: false })}<p class="microcopy">Their left may not be your left.</p></main>`;
  }
}

function tryMirrorMove(dir) {
  if (!state.puzzle || state.puzzleRole !== "OPERATOR" || state.puzzle.type !== "mirror") return;
  if (!state.selectedId) return;
  const obj = state.puzzle.objects.find((o) => o.id === state.selectedId);
  if (!obj) return;
  const disp = toDisplay(obj.r, obj.c, true);
  let nr = disp.r, nc = disp.c;
  if (dir === "up") nr -= 1; if (dir === "down") nr += 1; if (dir === "left") nc -= 1; if (dir === "right") nc += 1;
  if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) return;
  const logical = fromDisplay(nr, nc, true);
  if (state.puzzle.objects.some((o) => o.id !== obj.id && o.r === logical.r && o.c === logical.c)) return;
  applyMirrorMove(obj.id, logical.r, logical.c, true);
}
function applyMirrorMove(id, r, c, broadcast) {
  const obj = state.puzzle.objects.find((o) => o.id === id);
  if (!obj) return;
  obj.r = r; obj.c = c;
  if (broadcast) sendGame({ type: "move", from: state.playerId, id, r, c });
  if (mirrorSolved(state.puzzle)) endRound("win"); else render();
}
function rotateSelected(delta) {
  if (!state.puzzle || state.puzzle.type !== "rotation" || state.puzzleRole !== "OPERATOR") return;
  if (!state.selectedId) return;
  const piece = state.puzzle.pieces.find((p) => p.id === state.selectedId);
  if (!piece) return;
  piece.facing = (piece.facing + delta + 4) % 4;
  sendGame({ type: "rotate", from: state.playerId, id: piece.id, facing: piece.facing });
  if (rotationSolved(state.puzzle)) endRound("win"); else render();
}
function applyRotate(id, facing) {
  if (!state.puzzle || state.puzzle.type !== "rotation") return;
  const piece = state.puzzle.pieces.find((p) => p.id === id);
  if (!piece) return;
  piece.facing = facing;
  if (rotationSolved(state.puzzle)) endRound("win"); else render();
}


function bbRun() {
  if (!state.puzzle || state.puzzle.type !== "blackbox" || state.puzzleRole !== "LOADER") return;
  if ((state.puzzle.trialsLeft || 0) <= 0) return;
  const loaded = (state.puzzle.slots || []).filter(Boolean);
  if (!loaded.length) return;
  const slotsSnap = state.puzzle.slots.map((s) => (s ? { ...s } : null));
  sendGame({ type: "bb_run", from: state.playerId, slots: slotsSnap });
  applyBbRun(slotsSnap);
}
function applyBbRun(slots) {
  if (!state.puzzle || state.puzzle.type !== "blackbox") return;
  const loaded = (slots || []).filter(Boolean);
  const output = applyBlackBoxRule(state.puzzle.ruleId, loaded);
  state.puzzle.lastOutput = output.map((t) => ({ ...t }));
  state.puzzle.history = [output.map((t) => ({ ...t })), ...(state.puzzle.history || [])].slice(0, 3);
  state.puzzle.trialsLeft = Math.max(0, (state.puzzle.trialsLeft || 0) - 1);
  state.puzzle.slots = [null, null, null];
  state.bbSelectedToken = null;
  // Check prediction
  if (state.puzzle.pendingPredict) {
    const pred = state.puzzle.pendingPredict;
    if (tokensEqual(pred, output)) {
      state.puzzle.pendingPredict = null;
      endRound("win");
      return;
    }
    state.puzzle.pendingPredict = null;
  }
  if (state.puzzle.trialsLeft <= 0) {
    endRound("timeout");
    return;
  }
  render();
}
function bbLockPredict() {
  if (!state.puzzle || state.puzzle.type !== "blackbox" || state.puzzleRole !== "WATCHER") return;
  if (state.puzzle.pendingPredict) return;
  const pred = (state.bbPrediction || []).map((t) => ({ ...t }));
  // empty prediction is allowed (predict EMPTY)
  state.puzzle.pendingPredict = pred;
  sendGame({ type: "bb_predict", from: state.playerId, prediction: pred });
  render();
}
function applyBbPredict(prediction) {
  if (!state.puzzle || state.puzzle.type !== "blackbox") return;
  state.puzzle.pendingPredict = (prediction || []).map((t) => ({ ...t }));
  render();
}


function colMove(dir) {
  if (!state.puzzle || state.puzzle.type !== "collision" || state.puzzleRole !== "WALKER") return;
  const d = { n: [-1, 0], s: [1, 0], w: [0, -1], e: [0, 1] }[dir];
  if (!d) return;
  const size = state.puzzle.size || 5;
  const nr = state.puzzle.pos.r + d[0];
  const nc = state.puzzle.pos.c + d[1];
  if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
    state.colMsg = "EDGE — can't go that way";
    state.puzzle.bumped = null;
    render();
    return;
  }
  if (colIsWall(state.puzzle, nr, nc)) {
    state.colMsg = "WALL — something stopped you";
    state.puzzle.bumped = { r: nr, c: nc };
    sendGame({ type: "col_bump", from: state.playerId, pos: state.puzzle.pos, bumped: state.puzzle.bumped, msg: state.colMsg });
    render();
    return;
  }
  state.puzzle.pos = { r: nr, c: nc };
  state.puzzle.bumped = null;
  state.colMsg = "";
  sendGame({ type: "col_move", from: state.playerId, pos: state.puzzle.pos });
  if (state.puzzle.goal && nr === state.puzzle.goal.r && nc === state.puzzle.goal.c) {
    endRound("win");
    return;
  }
  render();
}
function applyColMove(payload) {
  if (!state.puzzle || state.puzzle.type !== "collision") return;
  if (payload.pos) state.puzzle.pos = payload.pos;
  state.puzzle.bumped = null;
  state.colMsg = "";
  if (state.puzzle.goal && state.puzzle.pos.r === state.puzzle.goal.r && state.puzzle.pos.c === state.puzzle.goal.c) {
    endRound("win");
    return;
  }
  render();
}
function applyColBump(payload) {
  if (!state.puzzle || state.puzzle.type !== "collision") return;
  if (payload.pos) state.puzzle.pos = payload.pos;
  state.puzzle.bumped = payload.bumped || null;
  state.colMsg = payload.msg || "WALL";
  render();
}


function bodyMove(dir) {
  if (!state.puzzle || state.puzzle.type !== "onebody" || state.puzzleRole !== "LEGS") return;
  const d = { n: [-1, 0], s: [1, 0], w: [0, -1], e: [0, 1] }[dir];
  if (!d) return;
  const size = state.puzzle.size || 5;
  const nr = state.puzzle.pos.r + d[0];
  const nc = state.puzzle.pos.c + d[1];
  if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
    state.bodyMsg = "EDGE";
    render();
    return;
  }
  if (bodyGateBlocks(state.puzzle, nr, nc)) {
    state.bodyMsg = "GATE — still closed";
    sendGame({ type: "body_sync", from: state.playerId, pos: state.puzzle.pos, buttons: state.puzzle.buttons, gates: state.puzzle.gates, msg: state.bodyMsg });
    render();
    return;
  }
  state.puzzle.pos = { r: nr, c: nc };
  state.bodyMsg = "";
  sendGame({ type: "body_sync", from: state.playerId, pos: state.puzzle.pos, buttons: state.puzzle.buttons, gates: state.puzzle.gates, msg: "" });
  if (state.puzzle.exit && nr === state.puzzle.exit.r && nc === state.puzzle.exit.c) {
    // need all gates open? or just reach exit
    const allOpen = (state.puzzle.gates || []).every((g) => g.open);
    if (allOpen) {
      endRound("win");
      return;
    }
    state.bodyMsg = "EXIT LOCKED — open all gates";
  }
  render();
}
function bodyPress() {
  if (!state.puzzle || state.puzzle.type !== "onebody" || state.puzzleRole !== "ARMS") return;
  const btn = bodyButtonAt(state.puzzle, state.puzzle.pos.r, state.puzzle.pos.c);
  if (!btn || btn.on) return;
  btn.on = true;
  const gate = (state.puzzle.gates || []).find((g) => g.id === btn.gateId);
  if (gate) gate.open = true;
  state.bodyMsg = "GATE OPEN";
  state.puzzle.lastPress = btn.id;
  sendGame({ type: "body_sync", from: state.playerId, pos: state.puzzle.pos, buttons: state.puzzle.buttons, gates: state.puzzle.gates, msg: state.bodyMsg });
  // Check win if already on exit
  if (state.puzzle.exit && state.puzzle.pos.r === state.puzzle.exit.r && state.puzzle.pos.c === state.puzzle.exit.c) {
    if ((state.puzzle.gates || []).every((g) => g.open)) {
      endRound("win");
      return;
    }
  }
  render();
}
function applyBodySync(payload) {
  if (!state.puzzle || state.puzzle.type !== "onebody") return;
  if (payload.pos) state.puzzle.pos = payload.pos;
  if (payload.buttons) state.puzzle.buttons = payload.buttons;
  if (payload.gates) state.puzzle.gates = payload.gates;
  state.bodyMsg = payload.msg || "";
  if (state.puzzle.exit && state.puzzle.pos.r === state.puzzle.exit.r && state.puzzle.pos.c === state.puzzle.exit.c) {
    if ((state.puzzle.gates || []).every((g) => g.open)) {
      endRound("win");
      return;
    }
  }
  render();
}


function switchFlip(id) {
  if (!state.puzzle || state.puzzle.type !== "switch" || state.puzzleRole !== "HANDS") return;
  const s = state.puzzle.switches.find((x) => x.id === id);
  if (!s) return;
  s.on = !s.on;
  sendGame({ type: "switch_flip", from: state.playerId, switches: state.puzzle.switches });
  if (switchSolved(state.puzzle)) endRound("win");
  else render();
}
function applySwitchFlip(switches) {
  if (!state.puzzle || state.puzzle.type !== "switch") return;
  state.puzzle.switches = switches;
  if (switchSolved(state.puzzle)) endRound("win");
  else render();
}

function liarMove(dir) {
  if (!state.puzzle || state.puzzle.type !== "liar" || state.puzzleRole !== "BUILDER") return;
  if (!state.selectedId) return;
  const obj = state.puzzle.objects.find((o) => o.id === state.selectedId);
  if (!obj) return;
  let nr = obj.r, nc = obj.c;
  if (dir === "up") nr -= 1;
  if (dir === "down") nr += 1;
  if (dir === "left") nc -= 1;
  if (dir === "right") nc += 1;
  if (nr < 0 || nr >= 3 || nc < 0 || nc >= 3) return;
  if (state.puzzle.objects.some((o) => o.id !== obj.id && o.r === nr && o.c === nc)) return;
  obj.r = nr; obj.c = nc;
  sendGame({ type: "liar_move", from: state.playerId, objects: state.puzzle.objects.map((o) => ({ id: o.id, r: o.r, c: o.c })) });
  if (liarSolved(state.puzzle)) endRound("win");
  else render();
}
function applyLiarMove(objects) {
  if (!state.puzzle || state.puzzle.type !== "liar") return;
  objects.forEach((u) => {
    const o = state.puzzle.objects.find((x) => x.id === u.id);
    if (o) { o.r = u.r; o.c = u.c; }
  });
  if (liarSolved(state.puzzle)) endRound("win");
  else render();
}


function futureMove(dir) {
  if (!state.puzzle || state.puzzle.type !== "future" || state.puzzleRole !== "RUNNER") return;
  const d = { n: [-1,0], s: [1,0], w: [0,-1], e: [0,1] }[dir];
  if (!d) return;
  const size = state.puzzle.size || 4;
  const nr = state.puzzle.pos.r + d[0], nc = state.puzzle.pos.c + d[1];
  if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
  state.puzzle.pos = { r: nr, c: nc };
  if (state.puzzle.activeSpike && state.puzzle.activeSpike.r === nr && state.puzzle.activeSpike.c === nc) {
    sendGame({ type: "future_move", from: state.playerId, pos: state.puzzle.pos });
    endRound("timeout");
    return;
  }
  sendGame({ type: "future_move", from: state.playerId, pos: state.puzzle.pos });
  if (state.puzzle.goal && nr === state.puzzle.goal.r && nc === state.puzzle.goal.c) endRound("win");
  else render();
}
function applyFutureMove(payload) {
  if (!state.puzzle || state.puzzle.type !== "future") return;
  if (payload.pos) state.puzzle.pos = payload.pos;
  if (state.puzzle.goal && state.puzzle.pos.r === state.puzzle.goal.r && state.puzzle.pos.c === state.puzzle.goal.c) endRound("win");
  else render();
}
function applyFutureTick(payload) {
  if (!state.puzzle || state.puzzle.type !== "future") return;
  if (payload.spikeIndex != null) state.puzzle.spikeIndex = payload.spikeIndex;
  if (payload.activeSpike) state.puzzle.activeSpike = payload.activeSpike;
  if (payload.pos) state.puzzle.pos = payload.pos;
  if (state.puzzle.activeSpike && state.puzzle.pos &&
      state.puzzle.activeSpike.r === state.puzzle.pos.r && state.puzzle.activeSpike.c === state.puzzle.pos.c) {
    endRound("timeout");
    return;
  }
  render();
}

function decayKey(k) {
  if (!state.puzzle || state.puzzle.type !== "decay" || state.puzzleRole !== "KEYPAD") return;
  if (k === "C") state.puzzle.entry = "";
  else if (k === "OK") {
    if (state.puzzle.entry === state.puzzle.code) { endRound("win"); return; }
    state.puzzle.entry = "";
  } else if ((state.puzzle.entry || "").length < 4) {
    state.puzzle.entry = (state.puzzle.entry || "") + k;
  }
  sendGame({ type: "decay_entry", from: state.playerId, entry: state.puzzle.entry });
  render();
}
function applyDecayEntry(payload) {
  if (!state.puzzle || state.puzzle.type !== "decay") return;
  state.puzzle.entry = payload.entry || "";
  if (state.puzzle.entry === state.puzzle.code) endRound("win");
  else render();
}
function applyDecayNew(payload) {
  if (!state.puzzle || state.puzzle.type !== "decay") return;
  state.puzzle.code = payload.code;
  state.decayLeft = payload.decayLeft;
  state.puzzle.revealed = true;
  state.puzzle.entry = "";
  render();
}

function seqPress(p) {
  if (!state.puzzle || state.puzzle.type !== "sequence" || state.puzzleRole !== "PLAYER") return;
  if (state.seqPhase === "show") return;
  state.puzzle.input = (state.puzzle.input || []).concat([p]);
  sendGame({ type: "seq_input", from: state.playerId, input: state.puzzle.input });
  const seq = state.puzzle.seq || [];
  const input = state.puzzle.input;
  if (input.length >= seq.length) {
    if (input.join() === seq.join()) endRound("win");
    else { state.puzzle.input = []; sendGame({ type: "seq_input", from: state.playerId, input: [] }); }
  }
  render();
}
function applySeqInput(payload) {
  if (!state.puzzle || state.puzzle.type !== "sequence") return;
  state.puzzle.input = payload.input || [];
  const seq = state.puzzle.seq || [];
  if (state.puzzle.input.length >= seq.length && state.puzzle.input.join() === seq.join()) endRound("win");
  else render();
}
function seqReplay() {
  if (state.puzzleRole !== "CALLER" || state.seqReplay) return;
  state.seqReplay = true;
  state.startedAt -= 8000;
  state.seqPhase = "show";
  sendGame({ type: "seq_replay", from: state.playerId });
  render();
  setTimeout(() => {
    if (state.puzzle?.type === "sequence") { state.seqPhase = "play"; render(); }
  }, 2500);
}
function applySeqReplay() {
  if (!state.puzzle || state.puzzle.type !== "sequence") return;
  state.seqReplay = true;
  state.startedAt -= 8000;
  state.seqPhase = "show";
  render();
  setTimeout(() => {
    if (state.puzzle?.type === "sequence") { state.seqPhase = "play"; render(); }
  }, 2500);
}

function bpMove(dir) {
  if (!state.puzzle || state.puzzle.type !== "blueprint" || state.puzzleRole !== "BUILDER") return;
  if (!state.selectedId) return;
  const obj = state.puzzle.objects.find((o) => o.id === state.selectedId);
  if (!obj) return;
  let nr = obj.r, nc = obj.c;
  if (dir === "up") nr--; if (dir === "down") nr++; if (dir === "left") nc--; if (dir === "right") nc++;
  if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return;
  if (state.puzzle.objects.some((o) => o.id !== obj.id && o.r === nr && o.c === nc)) return;
  obj.r = nr; obj.c = nc;
  sendGame({ type: "bp_move", from: state.playerId, objects: state.puzzle.objects.map((o) => ({ id: o.id, r: o.r, c: o.c })) });
  if (blueprintSolved(state.puzzle)) endRound("win");
  else render();
}
function applyBpMove(objects) {
  if (!state.puzzle || state.puzzle.type !== "blueprint") return;
  objects.forEach((u) => {
    const o = state.puzzle.objects.find((x) => x.id === u.id);
    if (o) { o.r = u.r; o.c = u.c; }
  });
  if (blueprintSolved(state.puzzle)) endRound("win");
  else render();
}

function gravSet(d) {
  if (!state.puzzle || state.puzzle.type !== "gravity" || state.puzzleRole !== "PULLER") return;
  state.puzzle.gravDir = d;
  sendGame({ type: "grav_sync", from: state.playerId, gravDir: d, pos: state.puzzle.pos });
  render();
}
function gravMove(dir) {
  if (!state.puzzle || state.puzzle.type !== "gravity" || state.puzzleRole !== "FALLER") return;
  const map = { n: 0, e: 1, s: 2, w: 3 };
  const want = map[dir];
  const g = state.puzzle.gravDir || 0;
  // allow gravity direction or perpendicular (g+/-1)
  const ok = want === g || want === (g + 1) % 4 || want === (g + 3) % 4;
  if (!ok) return;
  const d = { n: [-1,0], s: [1,0], w: [0,-1], e: [0,1] }[dir];
  const size = state.puzzle.size || 5;
  const nr = state.puzzle.pos.r + d[0], nc = state.puzzle.pos.c + d[1];
  if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
  if ((state.puzzle.walls || []).includes(nr + "," + nc)) return;
  state.puzzle.pos = { r: nr, c: nc };
  sendGame({ type: "grav_sync", from: state.playerId, gravDir: state.puzzle.gravDir, pos: state.puzzle.pos });
  if (state.puzzle.goal && nr === state.puzzle.goal.r && nc === state.puzzle.goal.c) endRound("win");
  else render();
}
function applyGravSync(payload) {
  if (!state.puzzle || state.puzzle.type !== "gravity") return;
  if (payload.gravDir != null) state.puzzle.gravDir = payload.gravDir;
  if (payload.pos) state.puzzle.pos = payload.pos;
  if (state.puzzle.goal && state.puzzle.pos.r === state.puzzle.goal.r && state.puzzle.pos.c === state.puzzle.goal.c) endRound("win");
  else render();
}

function watchesFlip(id) {
  if (!state.puzzle || state.puzzle.type !== "watches" || state.puzzleRole !== "HANDS") return;
  const s = state.puzzle.switches.find((x) => x.id === id);
  if (!s) return;
  s.on = !s.on;
  // pattern of on switches
  const pattern = state.puzzle.switches.map((x) => (x.on ? "1" : "0")).join("");
  if (!watchesSolved(state.puzzle)) {
    const fails = state.puzzle.failPatterns || [];
    const count = fails.filter((f) => f === pattern).length;
    if (count >= 1) {
      // adapt: reshuffle effects
      const effects = state.puzzle.switches.map((x) => x.effect);
      for (let i = effects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [effects[i], effects[j]] = [effects[j], effects[i]];
      }
      state.puzzle.switches.forEach((sw, i) => { sw.effect = effects[i]; sw.on = false; });
      state.puzzle.failPatterns = [];
      state.puzzle.adapted = true;
      state.puzzle.adaptMsg = "SYSTEM ADAPTED — mapping changed";
    } else {
      state.puzzle.failPatterns = fails.concat([pattern]);
      state.puzzle.adaptMsg = "";
    }
  }
  sendGame({ type: "watches_sync", from: state.playerId, switches: state.puzzle.switches, failPatterns: state.puzzle.failPatterns, adaptMsg: state.puzzle.adaptMsg });
  if (watchesSolved(state.puzzle)) endRound("win");
  else render();
}
function applyWatchesSync(payload) {
  if (!state.puzzle || state.puzzle.type !== "watches") return;
  if (payload.switches) state.puzzle.switches = payload.switches;
  if (payload.failPatterns) state.puzzle.failPatterns = payload.failPatterns;
  state.puzzle.adaptMsg = payload.adaptMsg || "";
  if (watchesSolved(state.puzzle)) endRound("win");
  else render();
}

function endRound(result) {
  if (state.screen === "result") return;
  clearInterval(state.timerId); state.timerId = null;
  state.result = result; state.elapsed = ROUND_SECONDS - state.remaining; state.screen = "result";
  if (result === "win") { markComplete(state.selectedLevelId); sendGame({ type: "win", from: state.playerId, levelId: state.selectedLevelId }); }
  if (result === "timeout") sendGame({ type: "timeout", from: state.playerId });
  render();
}
function renderResult() {
  const win = state.result === "win";
  const lv = getLevel(state.selectedLevelId);
  const mm = String(Math.floor(state.elapsed / 60)).padStart(2, "0");
  const ss = String(state.elapsed % 60).padStart(2, "0");
  app.innerHTML = `<main class="shell center result"><section class="panel ${win ? "win-panel" : "fail-panel"}"><span class="eyebrow">${win ? "COMPLETE" : "ROOM RESET"}</span><h1>${escapeHtml(lv?.title || "PUZZLE")}</h1>${win ? `<p class="time-line">${mm}:${ss}</p>` : ""}<p>${win ? escapeHtml(lv?.completeLine || "Solved together.") : "Talk it through. Try again."}</p></section><button class="btn primary ready-btn" id="replayBtn">REPLAY</button><button class="btn ready-btn" id="swapBtn">SWAP ROLES</button>${state.isHost ? `<button class="btn ready-btn" id="levelsBtn">LEVEL SELECT</button>` : ""}<button class="ghost" id="leaveBtn">LEAVE ROOM</button></main>`;
  document.getElementById("replayBtn").onclick = () => { if (state.isHost) startLevelRound("random"); else sendGame({ type: "request_replay", from: state.playerId, mode: "random" }); };
  document.getElementById("swapBtn").onclick = () => { if (state.isHost) startLevelRound("swap"); else sendGame({ type: "request_replay", from: state.playerId, mode: "swap" }); };
  const levelsBtn = document.getElementById("levelsBtn"); if (levelsBtn) levelsBtn.onclick = () => openLevels(true);
  document.getElementById("leaveBtn").onclick = leaveRoom;
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}
async function createRoom() {
  state.error = ""; state.roomCode = makeRoomCode(); state.roomRole = "host"; state.isHost = true; state.screen = "room"; render(); await connectRoom();
}
async function joinRoom() {
  const code = (document.getElementById("roomInput")?.value || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) { state.error = "Enter a valid 6-character room code."; render(); return; }
  state.error = ""; state.roomCode = code; state.roomRole = "partner"; state.isHost = false; state.screen = "room"; render(); await connectRoom();
}
async function trackPresence() {
  if (!state.channel) return;
  await state.channel.track({ playerId: state.playerId, role: state.roomRole, name: state.playerName || "", ready: state.ready, joinedAt: Date.now() });
}
async function connectRoom() {
  if (state.channel) { await state.channel.unsubscribe(); state.channel = null; }
  const channel = supabase.channel(`room:${state.roomCode}`, { config: { presence: { key: state.playerId }, broadcast: { self: false } } });
  channel
    .on("presence", { event: "sync" }, () => {
      const players = []; Object.values(channel.presenceState()).forEach((list) => list.forEach((item) => players.push(item)));
      const nowPartner = players.some((x) => x.playerId !== state.playerId);
      if (nowPartner && !state._hadPartner && state.screen === "room") state._partnerFlash = true;
      state._hadPartner = nowPartner;
      state.players = players; state.connected = true;
      if (["room", "home", "levels"].includes(state.screen)) render();
    })
    .on("presence", { event: "join" }, () => { state.connected = true; if (state.screen === "room") render(); })
    .on("presence", { event: "leave" }, () => { if (state.screen === "room") render(); })
    .on("broadcast", { event: "game" }, ({ payload }) => handleGame(payload));
  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") { state.connected = true; await trackPresence(); if (state.screen === "room") render(); }
  });
  state.channel = channel;
}
async function setReady() { state.ready = true; await trackPresence(); render(); }
function sendGame(payload) { if (state.channel) state.channel.send({ type: "broadcast", event: "game", payload }); }
function handleGame(payload) {
  if (!payload || payload.from === state.playerId) return;
  if (payload.type === "screen") {
    if (payload.screen === "levels") { state.screen = "levels"; render(); }
    else if (payload.screen === "roles") { state.selectedLevelId = payload.levelId || state.selectedLevelId; state.screen = "roles"; render(); }
  } else if (payload.type === "start") applyStart(payload);
  else if (payload.type === "move") applyMirrorMove(payload.id, payload.r, payload.c, false);
  else if (payload.type === "rotate") applyRotate(payload.id, payload.facing);
  else if (payload.type === "shadow_swap") applyShadowSwap(payload);
  else if (payload.type === "flash_place") applyFlashPlace(payload.pieces);
  else if (payload.type === "flash_replay") applyFlashReplay();
  else if (payload.type === "map_move") applyMapMove(payload);
  else if (payload.type === "bb_run") applyBbRun(payload.slots);
  else if (payload.type === "bb_predict") applyBbPredict(payload.prediction);
  else if (payload.type === "col_move") applyColMove(payload);
  else if (payload.type === "col_bump") applyColBump(payload);
  else if (payload.type === "body_sync") applyBodySync(payload);
  else if (payload.type === "switch_flip") applySwitchFlip(payload.switches);
  else if (payload.type === "liar_move") applyLiarMove(payload.objects);
  else if (payload.type === "future_move") applyFutureMove(payload);
  else if (payload.type === "future_tick") applyFutureTick(payload);
  else if (payload.type === "decay_entry") applyDecayEntry(payload);
  else if (payload.type === "decay_new") applyDecayNew(payload);
  else if (payload.type === "seq_input") applySeqInput(payload);
  else if (payload.type === "seq_replay") applySeqReplay();
  else if (payload.type === "bp_move") applyBpMove(payload.objects);
  else if (payload.type === "grav_sync") applyGravSync(payload);
  else if (payload.type === "watches_sync") applyWatchesSync(payload);
  else if (payload.type === "win") { if (payload.levelId) markComplete(payload.levelId); endRound("win"); }
  else if (payload.type === "timeout") endRound("timeout");
  else if (payload.type === "request_replay" && state.isHost) startLevelRound(payload.mode || "random");
}
async function leaveRoom() {
  clearInterval(state.timerId);
  if (state.channel) { await state.channel.unsubscribe(); state.channel = null; }
  Object.assign(state, {
    screen: "home", roomCode: "", roomRole: "", players: [], connected: false, error: "",
    ready: false, isHost: false, puzzle: null, result: "", selectedId: null, puzzleRole: null,
    introLevel: null, flashPhase: "", flashReplayUsed: false, trayId: null, mapAnimating: false, mapMsg: "", bbSelectedToken: null, bbPredictMode: false, bbPrediction: [], colMsg: ""
  });
  render();
}
render();
