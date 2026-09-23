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
      { id: "missing-rule", title: "THE MISSING RULE", number: "05", type: null, unlocked: false },
      { id: "wrong-piece", title: "THE WRONG PIECE", number: "06", type: null, unlocked: false },
      { id: "map", title: "THE MAP", number: "07", type: null, unlocked: false }
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
      { id: "last-move", title: "THE LAST MOVE", number: "08", type: null, unlocked: false }
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
  introLevel: null, flashPhase: "", flashReplayUsed: false, trayId: null
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
  app.innerHTML = `<main class="shell"><header class="topbar"><div class="brand">TWO BRAINS</div><div class="live"><span class="live-dot"></span>ONLINE</div></header><section class="hero"><span class="eyebrow">COOPERATIVE PUZZLE</span><h1>TWO BRAINS,<br>ONE PUZZLE.</h1><p>You don't have the answer.<br>They don't have the answer.<br>Together, you do.</p></section><section class="home-actions"><button class="btn primary" id="createBtn">CREATE ROOM</button><div class="divider"><span>OR</span></div><div class="join-row"><input id="roomInput" class="input" maxlength="6" placeholder="ROOM CODE" autocomplete="off" /><button class="btn" id="joinBtn">JOIN</button></div>${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}<p class="microcopy">Stay on WhatsApp. Play here.</p></section></main>`;
  document.getElementById("createBtn").onclick = createRoom;
  document.getElementById("joinBtn").onclick = joinRoom;
  document.getElementById("roomInput").onkeydown = (e) => { if (e.key === "Enter") joinRoom(); };
}

function renderRoom() {
  const p = partner();
  const both = state.players.length >= 2;
  app.innerHTML = `<main class="shell"><header class="topbar"><button class="ghost" id="leaveBtn">LEAVE</button><div class="live"><span class="live-dot ${state.connected ? "" : "offline"}"></span>${state.connected ? "LIVE" : "…"}</div></header><section class="room-hero compact"><span class="eyebrow">ROOM</span><h1 class="code-lg">${escapeHtml(state.roomCode)}</h1><button class="ghost tight" id="copyBtn">COPY CODE</button></section><section class="name-block"><label class="eyebrow">YOUR NAME</label><input id="nameInput" class="input" maxlength="12" placeholder="NAME" value="${escapeHtml(state.playerName)}" /></section><section class="players"><div class="player"><div class="avatar">${escapeHtml((state.playerName || "YOU").slice(0, 2).toUpperCase())}</div><div><span>${state.isHost ? "HOST" : "GUEST"}</span><strong>${escapeHtml(state.playerName || "YOU")}</strong></div><i class="online"></i></div><div class="player ${p ? "" : "empty"}"><div class="avatar">${p ? escapeHtml((p.name || "P2").slice(0, 2).toUpperCase()) : "?"}</div><div><span>PARTNER</span><strong>${p ? escapeHtml(p.name || "PLAYER 2") : "WAITING"}</strong></div><i class="${p ? "online" : ""}"></i></div></section><section class="status-panel"><div class="status-line"><div class="status-dot ${bothReady() ? "ready" : ""}"></div><div><strong>${!both ? "Waiting for partner" : bothReady() ? "Both ready" : state.ready ? "Waiting for partner" : "Ready up"}</strong><p>${!both ? "Share the room code." : bothReady() ? "Host can open levels." : "Names on. Then ready."}</p></div></div></section>${both && !state.ready ? `<button class="btn primary ready-btn" id="readyBtn">READY</button>` : ""}${bothReady() && state.isHost ? `<button class="btn primary ready-btn" id="levelsBtn">LEVEL SELECT</button>` : ""}${bothReady() && !state.isHost ? `<p class="microcopy">Waiting for host to choose a level…</p>` : ""}</main>`;
  document.getElementById("leaveBtn").onclick = leaveRoom;
  document.getElementById("copyBtn").onclick = async () => { try { await navigator.clipboard.writeText(state.roomCode); } catch {} };
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

function startLevelRound(mode) {
  const level = getLevel(state.selectedLevelId);
  if (!level || !level.type) return;
  const { hostRole, partnerRole } = assignRoles(mode, level);
  const seed = state.roomCode + level.id + String(Date.now()).slice(-5);
  let board;
  if (level.type === "rotation") board = generateRotation(seed);
  else if (level.type === "shadow") board = generateShadow(seed);
  else if (level.type === "flash") board = generateFlash(seed);
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

function renderGame() {
  const p = state.puzzle;
  if (!p) return;
  const isOp = state.puzzleRole === "OPERATOR";
  const mm = String(Math.floor(state.remaining / 60)).padStart(2, "0");
  const ss = String(state.remaining % 60).padStart(2, "0");
  const title = p.title || "PUZZLE";

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
    introLevel: null, flashPhase: "", flashReplayUsed: false, trayId: null
  });
  render();
}
render();
