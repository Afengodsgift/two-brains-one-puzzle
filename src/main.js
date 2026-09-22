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
        <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to your environment, then redeploy.</p>
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
  error: "",
  ready: false,
  voiceStatus: "idle",
  localStream: null,
  remoteStream: null,
  pc: null,
  isHost: false
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
  const bothOnline = state.players.length >= 2;
  const partnerReady = partner?.ready === true;
  const bothReady = state.ready && partnerReady;

  let statusTitle = "Waiting for partner";
  let statusSub = "Send the room code and wait for them to join.";
  let statusReady = false;

  if (bothOnline && !bothReady) {
    statusTitle = state.ready ? "Waiting for partner to ready" : "Both online — ready up";
    statusSub = state.ready
      ? "You are ready. Waiting for your partner."
      : "Tap READY when you both have mics free.";
  } else if (bothReady) {
    if (state.voiceStatus === "connected") {
      statusTitle = "Voice connected";
      statusSub = "You can hear each other. Puzzle comes next.";
      statusReady = true;
    } else if (state.voiceStatus === "connecting" || state.voiceStatus === "requesting") {
      statusTitle = "Connecting voice…";
      statusSub = "Allow microphone access if prompted.";
    } else if (state.voiceStatus === "failed") {
      statusTitle = "Voice failed";
      statusSub = state.error || "Check mic permissions and try again.";
    } else {
      statusTitle = "Both ready";
      statusSub = "Starting voice link…";
      statusReady = true;
    }
  }

  const showReadyBtn = bothOnline && !state.ready;
  const showVoiceNote = bothReady || state.voiceStatus === "connected";

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
            <strong>${state.ready ? "READY" : "ONLINE"}</strong>
          </div>
          <i class="online"></i>
        </div>
        <div class="player ${partner ? "" : "empty"}">
          <div class="avatar">${partner ? "P2" : "?"}</div>
          <div>
            <span>PARTNER</span>
            <strong>${partner ? (partner.ready ? "READY" : "ONLINE") : "WAITING"}</strong>
          </div>
          <i class="${partner ? "online" : ""}"></i>
        </div>
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

      ${showReadyBtn ? `<button class="btn primary ready-btn" id="readyBtn">READY</button>` : ""}

      ${state.voiceStatus === "connected" ? `
        <div class="voice-bar">
          <span class="voice-dot"></span>
          <span>MIC LIVE</span>
        </div>
      ` : ""}

      <p class="microcopy">
        ${showVoiceNote
          ? "Voice is live. Asymmetric puzzle is next."
          : "Ready up together → voice connects automatically."}
      </p>
    </main>
  `;

  document.getElementById("leaveBtn").onclick = leaveRoom;
  document.getElementById("copyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(state.roomCode); } catch {}
  };

  const readyBtn = document.getElementById("readyBtn");
  if (readyBtn) readyBtn.onclick = setReady;
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
    config: {
      presence: { key: state.playerId },
      broadcast: { self: false }
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
      maybeStartVoice();
    })
    .on("presence", { event: "join" }, () => {
      state.connected = true;
      render();
    })
    .on("presence", { event: "leave" }, () => {
      render();
    })
    .on("broadcast", { event: "signal" }, ({ payload }) => {
      handleSignal(payload);
    });

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      state.connected = true;
      await channel.track({
        playerId: state.playerId,
        role: state.role,
        ready: state.ready,
        joinedAt: Date.now()
      });
      render();
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
  maybeStartVoice();
}

function maybeStartVoice() {
  const partner = state.players.find(p => p.playerId !== state.playerId);
  if (!partner || !state.ready || !partner.ready) return;
  if (state.voiceStatus !== "idle" && state.voiceStatus !== "failed") return;
  startVoice();
}

async function startVoice() {
  state.voiceStatus = "requesting";
  state.error = "";
  render();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    state.localStream = stream;
    state.voiceStatus = "connecting";
    render();

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    state.pc = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      state.remoteStream = event.streams[0];
      let audio = document.getElementById("remoteAudio");
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "remoteAudio";
        audio.autoplay = true;
        audio.playsInline = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = state.remoteStream;
      state.voiceStatus = "connected";
      render();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && state.channel) {
        state.channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "ice", from: state.playerId, candidate: event.candidate }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        state.voiceStatus = "connected";
        render();
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        state.voiceStatus = "failed";
        state.error = "Voice connection dropped.";
        render();
      }
    };

    if (state.isHost) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      state.channel.send({
        type: "broadcast",
        event: "signal",
        payload: { type: "offer", from: state.playerId, sdp: offer }
      });
    }
  } catch (err) {
    console.error(err);
    state.voiceStatus = "failed";
    state.error = err.name === "NotAllowedError"
      ? "Microphone permission denied. Allow mic and try again."
      : "Could not access microphone.";
    render();
  }
}

async function handleSignal(payload) {
  if (!payload || payload.from === state.playerId) return;

  if (payload.type === "offer" && !state.pc) {
    if (!state.localStream) {
      try {
        state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err) {
        state.voiceStatus = "failed";
        state.error = "Microphone permission denied.";
        render();
        return;
      }
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    state.pc = pc;
    state.localStream.getTracks().forEach(track => pc.addTrack(track, state.localStream));

    pc.ontrack = (event) => {
      state.remoteStream = event.streams[0];
      let audio = document.getElementById("remoteAudio");
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "remoteAudio";
        audio.autoplay = true;
        audio.playsInline = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = state.remoteStream;
      state.voiceStatus = "connected";
      render();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && state.channel) {
        state.channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "ice", from: state.playerId, candidate: event.candidate }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        state.voiceStatus = "connected";
        render();
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        state.voiceStatus = "failed";
        state.error = "Voice connection dropped.";
        render();
      }
    };
  }

  if (!state.pc) return;

  try {
    if (payload.type === "offer") {
      await state.pc.setRemoteDescription(payload.sdp);
      const answer = await state.pc.createAnswer();
      await state.pc.setLocalDescription(answer);
      state.channel.send({
        type: "broadcast",
        event: "signal",
        payload: { type: "answer", from: state.playerId, sdp: answer }
      });
      state.voiceStatus = "connecting";
      render();
    } else if (payload.type === "answer") {
      await state.pc.setRemoteDescription(payload.sdp);
      state.voiceStatus = "connecting";
      render();
    } else if (payload.type === "ice" && payload.candidate) {
      await state.pc.addIceCandidate(payload.candidate);
    }
  } catch (err) {
    console.error("Signal error", err);
  }
}

async function leaveRoom() {
  if (state.pc) {
    state.pc.close();
    state.pc = null;
  }
  if (state.localStream) {
    state.localStream.getTracks().forEach(t => t.stop());
    state.localStream = null;
  }
  const audio = document.getElementById("remoteAudio");
  if (audio) audio.remove();

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
  state.ready = false;
  state.voiceStatus = "idle";
  state.isHost = false;
  state.remoteStream = null;
  render();
}

render();
