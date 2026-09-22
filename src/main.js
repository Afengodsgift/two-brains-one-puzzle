import "./style.css";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  document.querySelector("#app").innerHTML = `
    <main class="shell center">
      <section class="panel error-panel">
        <span class="eyebrow">SETUP REQUIRED</span>
        <h1>Supabase isn't connected.</h1>
        <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to your <code>.env</code> file, then restart Vite.</p>
      </section>
    </main>
  `;
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = document.querySelector("#app");
const state = {
  screen: "home",
  roomCode: "",
  role: "",
  playerId: crypto.randomUUID(),
  channel: null,
  players: [],
  connected: false,
  error: ""
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;")
    .replace(/'/g, "&#039;");
}

function render() {
  if (state.screen === "home") renderHome();
  else if (state.screen === "room") renderRoom();
}

function renderHome() {
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand">TWO BRAINS</div>
        <div class="live">
          <span class="live-dot"></span>
          ONLINE
        </div>
      </header>

      <section class="hero">
        <span class="eyebrow">ASYMMETRIC MULTIPLAYER</span>
        <h1>TWO BRAINS,<br>ONE PUZZLE.</h1>
        <p>You don't have the answer.<br>They don't have the answer.<br>Together, you do.</p>
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
    </main>
  `;

  document.getElementById("createBtn").onclick = createRoom;
  document.getElementById("joinBtn").onclick = joinRoom;
  document.getElementById("roomInput").onkeydown = (e) => {
    if (e.key === "Enter") joinRoom();
  };
}

function renderRoom() {
  const partner = state.players.find(p => p.playerId !== state.playerId);
  const ready = state.players.length >= 2;

  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <button class="ghost" id="leaveBtn">LEAVE</button>
        <div class="live">
          <span class="live-dot ${state.connected ? "" : "offline"}"></span>
          ${state.connected ? "CONNECTED" : "CONNECTING"}
        </div>
      </header>

      <section class="room-hero">
        <span class="eyebrow">ROOM</span>
        <h1>${escapeHtml(state.roomCode)}</h1>
        <p>${state.role === "host" ? "Share this code with your partner." : "You joined as partner."}</p>
        <button class="code-card" id="copyBtn">
          <span>${escapeHtml(state.roomCode)}</span>
          <small>TAP TO COPY</small>
        </button>
      </section>

      <section class="players">
        <div class="player">
          <div class="avatar">YOU</div>
          <div>
            <span>${state.role === "host" ? "HOST" : "PARTNER"}</span>
            <strong>ONLINE</strong>
          </div>
          <i class="online"></i>
        </div>
        <div class="player ${partner ? "" : "empty"}">
          <div class="avatar">${partner ? "P2" : "?"}</div>
          <div>
            <span>PARTNER</span>
            <strong>${partner ? "ONLINE" : "WAITING"}</strong>
          </div>
          <i class="${partner ? "online" : ""}"></i>
        </div>
      </section>

      <section class="status-panel">
        <div class="status-line">
          <div class="status-dot ${ready ? "ready" : ""}"></div>
          <div>
            <strong>${ready ? "Two players connected" : "Waiting for partner"}</strong>
            <p>${ready ? "START GAME FOUNDATION" : "Send the room code and wait for them to join."}</p>
          </div>
        </div>
      </section>

      <p class="microcopy">Voice + asymmetric puzzle come next.<br>This build proves the room + presence loop.</p>
    </main>
  `;

  document.getElementById("leaveBtn").onclick = leaveRoom;
  document.getElementById("copyBtn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
    } catch {}
  };
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
  state.screen = "room";
  render();
  await connectRoom();
}

async function joinRoom() {
  const input = document.getElementById("roomInput");
  const code = (input?.value || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    state.error = "Enter a valid 6-character room code.";
    render();
    return;
  }
  state.error = "";
  state.roomCode = code;
  state.role = "partner";
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
    config: {
      presence: { key: state.playerId }
    }
  });

  channel
    .on("presence", { event: "sync" }, () => {
      const stateMap = channel.presenceState();
      const players = [];
      Object.values(stateMap).forEach(list => {
        list.forEach(item => players.push(item));
      });
      state.players = players;
      state.connected = true;
      render();
    })
    .on("presence", { event: "join" }, () => {
      state.connected = true;
      render();
    })
    .on("presence", { event: "leave" }, () => {
      render();
    });

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      state.connected = true;
      await channel.track({
        playerId: state.playerId,
        role: state.role,
        joinedAt: Date.now()
      });
      render();
    }
  });

  state.channel = channel;
}

async function leaveRoom() {
  if (state.channel) {
    await state.channel.unsubscribe();
    state.channel = null;
  }
  state.screen = "home";
  state.roomCode = "";
  state.role = "";
  state.players = [];
  state.connected = false;
  state.error = "";
  render();
}

render();
