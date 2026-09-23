import "./style.css";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  document.querySelector("#app").innerHTML = `<main class="shell center"><section class="panel error-panel"><span class="eyebrow">SETUP REQUIRED</span><h1>Supabase isn't connected.</h1></section></main>`;
  throw new Error("Missing Supabase");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROUND_SECONDS = 90;
const GRID = 3;
const SYMBOLS = ["●", "▲", "★"];

const app = document.querySelector("#app");
const state = {
  screen: "home",
  roomCode: "",
  role: "",
  playerId: crypto.randomUUID(),
  channel: null,
  players: [],
  connected: false,
  error: "",
  ready: false,
  isHost: false,
  puzzle: null,
  remaining: ROUND_SECONDS,
  startedAt: 0,
  timerId: null,
  result: "",
  selectedId: null
};

function escapeHtml(v = "") {
  return String(v)
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;")
    .replace(/'/g, "&#039;");
}

function render() {
  if (state.screen === "home") renderHome();
  else if (state.screen === "room") renderRoom();
  else if (state.screen === "game") renderGame();
  else if (state.screen === "result") renderResult();
}

function renderHome() {
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand">TWO BRAINS</div>
        <div class="live"><span class="live-dot"></span>ONLINE</div>
      </header>
      <section class="hero">
        <span class="eyebrow">ASYMMETRIC MULTIPLAYER</span>
        <h1>TWO BRAINS,<br>ONE PUZZLE.</h1>
        <p>You don't have the answer.<br>They don't have the answer.<br>Together, you do.</p>
        <p class="microcopy" style="margin:12px 0 0;text-align:left;color:#666">Stay on WhatsApp call. Play here.</p>
      </section>
      <section class="home-actions">
        <button class="btn primary" id="createBtn">CREATE ROOM</button>
        <div class="divider"><span>OR</span></div>
        <div class="join-row">
          <input id="roomInput" class="input" maxlength="6" placeholder="ROOM CODE" autocomplete="off" />
          <button class="btn" id="joinBtn">JOIN</button>
        </div>
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      </section>
    </main>`;
  document.getElementById("createBtn").onclick = createRoom;
  document.getElementById("joinBtn").onclick = joinRoom;
  document.getElementById("roomInput").onkeydown = (e) => { if (e.key === "Enter") joinRoom(); };
}

function renderRoom() {
  const partner = state.players.find((p) => p.playerId !== state.playerId);
  const bothOnline = state.players.length >= 2;
  const bothReady = state.ready && partner?.ready === true;

  let statusTitle = "Waiting for partner";
  let statusSub = "Send the room code and wait.";
  let statusReady = false;

  if (bothOnline && !bothReady) {
    statusTitle = state.ready ? "Waiting for partner to ready" : "Both online — ready up";
    statusSub = state.ready
      ? "You are ready. Waiting for them."
      : "Stay on WhatsApp. Tap READY when both of you are set.";
  } else if (bothReady) {
    statusTitle = "Both ready";
    statusSub = "Talk on WhatsApp. Enter THE MIRROR when ready.";
    statusReady = true;
  }

  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <button class="ghost" id="leaveBtn">LEAVE</button>
        <div class="live"><span class="live-dot ${state.connected ? "" : "offline"}"></span>${state.connected ? "CONNECTED" : "CONNECTING"}</div>
      </header>
      <section class="room-hero">
        <span class="eyebrow">ROOM</span>
        <h1>${escapeHtml(state.roomCode)}</h1>
        <p>${state.role === "host" ? "Share this code." : "You joined as partner."}</p>
        <button class="code-card" id="copyBtn"><span>${escapeHtml(state.roomCode)}</span><small>TAP TO COPY</small></button>
      </section>
      <section class="players">
        <div class="player"><div class="avatar">YOU</div><div><span>${state.role === "host" ? "HOST" : "PARTNER"}</span><strong>${state.ready ? "READY" : "ONLINE"}</strong></div><i class="online"></i></div>
        <div class="player ${partner ? "" : "empty"}"><div class="avatar">${partner ? "P2" : "?"}</div><div><span>PARTNER</span><strong>${partner ? (partner.ready ? "READY" : "ONLINE") : "WAITING"}</strong></div><i class="${partner ? "online" : ""}"></i></div>
      </section>
      <section class="status-panel">
        <div class="status-line">
          <div class="status-dot ${statusReady ? "ready" : ""}"></div>
          <div>
            <strong>${escapeHtml(statusTitle)}</strong>
            <p>${escapeHtml(statusSub)}</p>
          </div>
        </div>
      </section>
      ${bothOnline && !state.ready ? `<button class="btn primary ready-btn" id="readyBtn">READY</button>` : ""}
      ${bothReady ? `<button class="btn primary ready-btn" id="startBtn">ENTER THE MIRROR</button>` : ""}
      <p class="microcopy">Voice = WhatsApp. This app is the puzzle only.</p>
    </main>`;

  document.getElementById("leaveBtn").onclick = leaveRoom;
  document.getElementById("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(state.roomCode); } catch {}
  };
  const readyBtn = document.getElementById("readyBtn");
  if (readyBtn) readyBtn.onclick = setReady;
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.onclick = startMirror;
}

function cellKey(r, c) { return r + "," + c; }

function generateMirrorPuzzle(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const cells = [];
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) cells.push([r, c]);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const starts = shuffle(cells).slice(0, SYMBOLS.length);
  const targets = shuffle(cells).slice(0, SYMBOLS.length);
  const objects = SYMBOLS.map((sym, i) => ({
    id: "o" + i, symbol: sym, r: starts[i][0], c: starts[i][1]
  }));
  const target = SYMBOLS.map((sym, i) => ({
    id: "o" + i, symbol: sym, r: targets[i][0], c: targets[i][1]
  }));
  return { id: "mirror", title: "THE MIRROR", objects, target, mirroredForOperator: true };
}

function posMap(objects) {
  const m = {};
  objects.forEach((o) => { m[cellKey(o.r, o.c)] = o; });
  return m;
}

function isSolved(puzzle) {
  const byId = {};
  puzzle.objects.forEach((o) => { byId[o.id] = o; });
  return puzzle.target.every((t) => {
    const cur = byId[t.id];
    return cur && cur.r === t.r && cur.c === t.c;
  });
}

function displayRC(r, c, asOperator) {
  if (!asOperator) return { r, c };
  return { r, c: GRID - 1 - c };
}

function logicalFromDisplay(r, c, asOperator) {
  if (!asOperator) return { r, c };
  return { r, c: GRID - 1 - c };
}

function renderBoard(objects, opts = {}) {
  const { asOperator = false, interactive = false } = opts;
  const map = posMap(objects);
  let html = `<div class="grid">`;
  for (let r = 0; r < GRID; r++) {
    for (let dc = 0; dc < GRID; dc++) {
      const { r: lr, c: lc } = logicalFromDisplay(r, dc, asOperator);
      const obj = map[cellKey(lr, lc)];
      const selected = obj && state.selectedId === obj.id;
      html += `<button type="button" class="cell ${selected ? "selected" : ""} ${obj ? "filled" : ""}" data-id="${obj ? obj.id : ""}" ${interactive && obj ? "" : "disabled"}>
        <span>${obj ? escapeHtml(obj.symbol) : ""}</span>
      </button>`;
    }
  }
  html += `</div>`;
  return html;
}

function renderTargetMini(target) {
  const map = {};
  target.forEach((t) => { map[cellKey(t.r, t.c)] = t.symbol; });
  let html = `<div class="grid mini">`;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const sym = map[cellKey(r, c)] || "";
      html += `<div class="cell mini-cell"><span>${escapeHtml(sym)}</span></div>`;
    }
  }
  html += `</div>`;
  return html;
}

function renderGame() {
  const p = state.puzzle;
  if (!p) return;
  const isOperator = state.role !== "host";
  const mm = String(Math.floor(state.remaining / 60)).padStart(2, "0");
  const ss = String(state.remaining % 60).padStart(2, "0");

  if (isOperator) {
    app.innerHTML = `
      <main class="shell game">
        <header class="topbar">
          <div class="brand">THE MIRROR · OPERATOR</div>
          <div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div>
        </header>
        <p class="role-hint">You can move objects. You do <strong>not</strong> see the target. Talk on WhatsApp.</p>
        ${renderBoard(p.objects, { asOperator: true, interactive: true })}
        <div class="pad">
          <button class="pad-btn" data-dir="up">↑</button>
          <div class="pad-mid">
            <button class="pad-btn" data-dir="left">←</button>
            <button class="pad-btn" data-dir="right">→</button>
          </div>
          <button class="pad-btn" data-dir="down">↓</button>
        </div>
        <p class="microcopy">Tap an object, then a direction.</p>
      </main>`;
  } else {
    app.innerHTML = `
      <main class="shell game">
        <header class="topbar">
          <div class="brand">THE MIRROR · OBSERVER</div>
          <div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div>
        </header>
        <p class="role-hint">You see the <strong>TARGET</strong>. You cannot move. Guide them on WhatsApp.</p>
        <span class="eyebrow">TARGET</span>
        ${renderTargetMini(p.target)}
        <span class="eyebrow" style="margin-top:14px">THEIR ROOM (as you see it)</span>
        ${renderBoard(p.objects, { asOperator: false, interactive: false })}
        <p class="microcopy">Describe positions. Their left may not be your left.</p>
      </main>`;
  }

  if (isOperator) {
    document.querySelectorAll(".cell.filled").forEach((el) => {
      el.onclick = () => {
        state.selectedId = el.dataset.id;
        render();
      };
    });
    document.querySelectorAll(".pad-btn").forEach((btn) => {
      btn.onclick = () => tryMove(btn.dataset.dir);
    });
  }
}

function tryMove(dir) {
  if (!state.puzzle || state.role === "host") return;
  if (!state.selectedId) return;
  const obj = state.puzzle.objects.find((o) => o.id === state.selectedId);
  if (!obj) return;
  const asOp = true;
  const disp = displayRC(obj.r, obj.c, asOp);
  let nr = disp.r;
  let nc = disp.c;
  if (dir === "up") nr -= 1;
  if (dir === "down") nr += 1;
  if (dir === "left") nc -= 1;
  if (dir === "right") nc += 1;
  if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) return;
  const logical = logicalFromDisplay(nr, nc, asOp);
  if (state.puzzle.objects.some((o) => o.id !== obj.id && o.r === logical.r && o.c === logical.c)) return;
  applyMove(obj.id, logical.r, logical.c, true);
}

function applyMove(id, r, c, broadcast) {
  const obj = state.puzzle.objects.find((o) => o.id === id);
  if (!obj) return;
  obj.r = r;
  obj.c = c;
  if (broadcast) sendGame({ type: "move", from: state.playerId, id, r, c });
  if (isSolved(state.puzzle)) endRound("win");
  else render();
}

function renderResult() {
  const win = state.result === "win";
  app.innerHTML = `
    <main class="shell center result">
      <section class="panel ${win ? "win-panel" : "fail-panel"}">
        <span class="eyebrow">${win ? "MIRROR COMPLETE" : "ROOM RESET"}</span>
        <h1>${win ? "TWO PERSPECTIVES." : "TIME'S UP."}</h1>
        <p>${win ? "One solution." : "Talk it through. Run it back."}</p>
      </section>
      <button class="btn primary ready-btn" id="againBtn">RUN IT BACK</button>
      <button class="ghost" id="leaveBtn">LEAVE ROOM</button>
    </main>`;
  document.getElementById("againBtn").onclick = startMirror;
  document.getElementById("leaveBtn").onclick = leaveRoom;
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

async function createRoom() {
  state.error = "";
  state.roomCode = makeRoomCode();
  state.role = "host";
  state.isHost = true;
  state.screen = "room";
  render();
  await connectRoom();
}

async function joinRoom() {
  const code = (document.getElementById("roomInput")?.value || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    state.error = "Enter a valid 6-character room code.";
    render();
    return;
  }
  state.error = "";
  state.roomCode = code;
  state.role = "partner";
  state.isHost = false;
  state.screen = "room";
  render();
  await connectRoom();
}

async function connectRoom() {
  if (state.channel) {
    await state.channel.unsubscribe();
    state.channel = null;
  }
  const channel = supabase.channel(`room:${state.roomCode}`, {
    config: { presence: { key: state.playerId }, broadcast: { self: false } }
  });
  channel
    .on("presence", { event: "sync" }, () => {
      const players = [];
      Object.values(channel.presenceState()).forEach((list) => list.forEach((item) => players.push(item)));
      state.players = players;
      state.connected = true;
      if (state.screen === "room" || state.screen === "home") render();
    })
    .on("presence", { event: "join" }, () => {
      state.connected = true;
      if (state.screen === "room" || state.screen === "home") render();
    })
    .on("presence", { event: "leave" }, () => {
      if (state.screen === "room" || state.screen === "home") render();
    })
    .on("broadcast", { event: "game" }, ({ payload }) => handleGame(payload));

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      state.connected = true;
      await channel.track({
        playerId: state.playerId,
        role: state.role,
        ready: state.ready,
        joinedAt: Date.now()
      });
      if (state.screen === "room" || state.screen === "home") render();
    }
  });
  state.channel = channel;
}

async function setReady() {
  state.ready = true;
  if (state.channel) {
    await state.channel.track({
      playerId: state.playerId,
      role: state.role,
      ready: true,
      joinedAt: Date.now()
    });
  }
  render();
}

function sendGame(payload) {
  if (state.channel) state.channel.send({ type: "broadcast", event: "game", payload });
}

function startMirror() {
  const seed = state.roomCode + String(Date.now()).slice(-4);
  const puzzle = generateMirrorPuzzle(seed);
  const startedAt = Date.now();
  beginRound(puzzle, startedAt);
  sendGame({
    type: "start",
    from: state.playerId,
    seed,
    startedAt,
    objects: puzzle.objects,
    target: puzzle.target
  });
}

function beginRound(puzzle, startedAt) {
  clearInterval(state.timerId);
  state.puzzle = puzzle;
  state.startedAt = startedAt;
  state.remaining = ROUND_SECONDS;
  state.result = "";
  state.selectedId = null;
  state.error = "";
  state.screen = "game";
  render();
  state.timerId = setInterval(() => {
    state.remaining = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - state.startedAt) / 1000));
    if (state.screen === "game") {
      const el = document.querySelector(".timer");
      if (el) {
        el.textContent =
          String(Math.floor(state.remaining / 60)).padStart(2, "0") +
          ":" +
          String(state.remaining % 60).padStart(2, "0");
        el.classList.toggle("urgent", state.remaining <= 15);
      }
    }
    if (state.remaining <= 0) endRound("timeout");
  }, 250);
}

function endRound(result) {
  if (state.screen === "result") return;
  clearInterval(state.timerId);
  state.timerId = null;
  state.result = result;
  state.screen = "result";
  if (result === "timeout") sendGame({ type: "timeout", from: state.playerId });
  if (result === "win") sendGame({ type: "win", from: state.playerId });
  render();
}

function handleGame(payload) {
  if (!payload || payload.from === state.playerId) return;
  if (payload.type === "start") {
    beginRound({
      id: "mirror",
      title: "THE MIRROR",
      objects: payload.objects,
      target: payload.target,
      mirroredForOperator: true
    }, payload.startedAt || Date.now());
  } else if (payload.type === "move") {
    applyMove(payload.id, payload.r, payload.c, false);
  } else if (payload.type === "win") {
    endRound("win");
  } else if (payload.type === "timeout") {
    endRound("timeout");
  }
}

async function leaveRoom() {
  clearInterval(state.timerId);
  if (state.channel) {
    await state.channel.unsubscribe();
    state.channel = null;
  }
  Object.assign(state, {
    screen: "home",
    roomCode: "",
    role: "",
    players: [],
    connected: false,
    error: "",
    ready: false,
    isHost: false,
    puzzle: null,
    result: "",
    selectedId: null
  });
  render();
}

render();
