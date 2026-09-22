import "./style.css";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  document.querySelector("#app").innerHTML = `<main class="shell center"><section class="panel error-panel"><span class="eyebrow">SETUP REQUIRED</span><h1>Supabase isn't connected.</h1></section></main>`;
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
];

const PUZZLES = [
  { id: "lock-4325", title: "THE LOCK", prompt: "Enter the 4-digit lock code.", answer: "4325",
    host: ["Digit 1 is the number of sides on a square.", "Digit 3 is how many players this game needs."],
    partner: ["Digit 2 is the number of letters in the word TWO.", "Digit 4 is 9 minus digit 1."] },
  { id: "word-echo", title: "THE WORD", prompt: "Enter the 4-letter word.", answer: "ECHO",
    host: ["Your letters are E and H.", "They belong in positions 1 and 3."],
    partner: ["Your letters are C and O.", "They belong in positions 2 and 4.", "The word is what a voice does in an empty room."] },
  { id: "code-brain", title: "THE KEY", prompt: "Enter the 5-letter key.", answer: "BRAIN",
    host: ["The word starts with BR.", "It ends with N."],
    partner: ["The middle letters are AI.", "It is what each of you is using right now."] }
];

const ROUND_SECONDS = 90;
const app = document.querySelector("#app");
const state = {
  screen: "home", roomCode: "", role: "", playerId: crypto.randomUUID(), channel: null, players: [],
  connected: false, error: "", ready: false, voiceStatus: "idle", localStream: null, remoteStream: null,
  pc: null, isHost: false, makingOffer: false, polite: false, puzzle: null, startedAt: 0,
  remaining: ROUND_SECONDS, result: "", answerDraft: "", timerId: null
};

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&" + "amp;").replace(/</g, "&" + "lt;").replace(/>/g, "&" + "gt;").replace(/"/g, "&" + "quot;").replace(/'/g, "&#039;");
}
function pickPuzzle(seed) { let n = 0; for (const ch of seed) n += ch.charCodeAt(0); return PUZZLES[n % PUZZLES.length]; }
function render() {
  if (state.screen === "home") renderHome();
  else if (state.screen === "room") renderRoom();
  else if (state.screen === "game") renderGame();
  else if (state.screen === "result") renderResult();
}

function renderHome() {
  app.innerHTML = `<main class="shell"><header class="topbar"><div class="brand">TWO BRAINS</div><div class="live"><span class="live-dot"></span>ONLINE</div></header><section class="hero"><span class="eyebrow">ASYMMETRIC MULTIPLAYER</span><h1>TWO BRAINS,<br>ONE PUZZLE.</h1><p>You don't have the answer.<br>They don't have the answer.<br>Together, you do.</p></section><section class="home-actions"><button class="btn primary" id="createBtn">CREATE ROOM</button><div class="divider"><span>OR</span></div><div class="join-row"><input id="roomInput" class="input" maxlength="6" placeholder="ROOM CODE" autocomplete="off" /><button class="btn" id="joinBtn">JOIN</button></div>${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}</section></main>`;
  document.getElementById("createBtn").onclick = createRoom;
  document.getElementById("joinBtn").onclick = joinRoom;
  document.getElementById("roomInput").onkeydown = (e) => { if (e.key === "Enter") joinRoom(); };
}

function renderRoom() {
  const partner = state.players.find(p => p.playerId !== state.playerId);
  const bothOnline = state.players.length >= 2;
  const bothReady = state.ready && partner?.ready === true;
  const showMicLive = state.voiceStatus === "connected";
  let statusTitle = "Waiting for partner";
  let statusSub = "Send the room code and wait for them to join.";
  let statusReady = false;
  if (bothOnline && !bothReady) {
    statusTitle = state.ready ? "Waiting for partner to ready" : "Both online — ready up";
    statusSub = state.ready ? "You are ready. Waiting for your partner." : "Tap READY when you both have mics free.";
  } else if (bothReady) {
    if (state.voiceStatus === "connected") { statusTitle = "Voice connected"; statusSub = "Talk first. Then start the puzzle."; statusReady = true; }
    else if (state.voiceStatus === "connecting" || state.voiceStatus === "requesting") { statusTitle = "Connecting voice…"; statusSub = "Allow microphone access if prompted."; }
    else if (state.voiceStatus === "failed") { statusTitle = "Voice failed"; statusSub = state.error || "Tap RETRY VOICE to try again."; }
    else { statusTitle = "Both ready"; statusSub = "Starting voice link…"; }
  }
  app.innerHTML = `<main class="shell"><header class="topbar"><button class="ghost" id="leaveBtn">LEAVE</button><div class="live"><span class="live-dot ${state.connected ? "" : "offline"}"></span>${state.connected ? "CONNECTED" : "CONNECTING"}</div></header><section class="room-hero"><span class="eyebrow">ROOM</span><h1>${escapeHtml(state.roomCode)}</h1><p>${state.role === "host" ? "Share this code with your partner." : "You joined as partner."}</p><button class="code-card" id="copyBtn"><span>${escapeHtml(state.roomCode)}</span><small>TAP TO COPY</small></button></section><section class="players"><div class="player"><div class="avatar">YOU</div><div><span>${state.role === "host" ? "HOST" : "PARTNER"}</span><strong>${state.ready ? "READY" : "ONLINE"}</strong></div><i class="online"></i></div><div class="player ${partner ? "" : "empty"}"><div class="avatar">${partner ? "P2" : "?"}</div><div><span>PARTNER</span><strong>${partner ? (partner.ready ? "READY" : "ONLINE") : "WAITING"}</strong></div><i class="${partner ? "online" : ""}"></i></div></section><section class="status-panel"><div class="status-line"><div class="status-dot ${statusReady ? "ready" : ""}"></div><div><strong>${escapeHtml(statusTitle)}</strong><p>${escapeHtml(statusSub)}</p></div></div></section>${bothOnline && !state.ready ? `<button class="btn primary ready-btn" id="readyBtn">READY</button>` : ""}${bothReady && state.voiceStatus === "failed" ? `<button class="btn primary ready-btn" id="retryBtn">RETRY VOICE</button>` : ""}${showMicLive ? `<button class="btn primary ready-btn" id="startBtn">START PUZZLE</button>` : ""}${showMicLive ? `<div class="voice-bar"><span class="voice-dot"></span><span>MIC LIVE</span></div>` : ""}<p class="microcopy">${showMicLive ? "You can hear each other. Start the 90-second puzzle." : "Ready up together → voice connects automatically."}</p></main>`;
  document.getElementById("leaveBtn").onclick = leaveRoom;
  document.getElementById("copyBtn").onclick = async () => { try { await navigator.clipboard.writeText(state.roomCode); } catch {} };
  const readyBtn = document.getElementById("readyBtn"); if (readyBtn) readyBtn.onclick = setReady;
  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) retryBtn.onclick = () => { cleanupPeer(); state.voiceStatus = "idle"; state.error = ""; render(); maybeStartVoice(); };
  const startBtn = document.getElementById("startBtn"); if (startBtn) startBtn.onclick = startPuzzle;
}

function renderGame() {
  const clues = state.role === "host" ? state.puzzle.host : state.puzzle.partner;
  const mm = String(Math.floor(state.remaining / 60)).padStart(2, "0");
  const ss = String(state.remaining % 60).padStart(2, "0");
  app.innerHTML = `<main class="shell game"><header class="topbar"><div class="brand">${escapeHtml(state.puzzle.title)}</div><div class="timer ${state.remaining <= 15 ? "urgent" : ""}">${mm}:${ss}</div></header><div class="voice-bar compact"><span class="voice-dot"></span><span>MIC LIVE — TALK</span></div><section class="clue-card"><span class="eyebrow">YOUR CLUES ONLY</span><h2>Do not show this screen.</h2><ul>${clues.map(c => `<li>${escapeHtml(c)}</li>`).join("")}</ul></section><p class="prompt">${escapeHtml(state.puzzle.prompt)}</p><div class="join-row"><input id="answerInput" class="input" maxlength="8" placeholder="ANSWER" autocomplete="off" value="${escapeHtml(state.answerDraft)}" /><button class="btn primary" id="submitBtn">SEND</button></div>${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}<p class="microcopy">Either of you can submit. One shared answer.</p></main>`;
  const input = document.getElementById("answerInput");
  input.focus();
  input.oninput = () => { state.answerDraft = input.value.toUpperCase(); };
  input.onkeydown = (e) => { if (e.key === "Enter") submitAnswer(); };
  document.getElementById("submitBtn").onclick = submitAnswer;
}

function renderResult() {
  const win = state.result === "win";
  app.innerHTML = `<main class="shell center result"><section class="panel ${win ? "win-panel" : "fail-panel"}"><span class="eyebrow">${win ? "CLEARED" : "FAILED"}</span><h1>${win ? "TWO BRAINS." : "TIME'S UP."}</h1><p>${win ? "You solved it together." : "The lock reset."}</p><p class="answer-reveal">Answer: <strong>${escapeHtml(state.puzzle.answer)}</strong></p></section><button class="btn primary ready-btn" id="againBtn">PLAY AGAIN</button><button class="ghost" id="leaveBtn">LEAVE ROOM</button></main>`;
  document.getElementById("againBtn").onclick = startPuzzle;
  document.getElementById("leaveBtn").onclick = leaveRoom;
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}
async function createRoom() {
  state.error = ""; state.roomCode = makeRoomCode(); state.role = "host"; state.isHost = true; state.polite = false; state.screen = "room"; render(); await connectRoom();
}
async function joinRoom() {
  const code = (document.getElementById("roomInput")?.value || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) { state.error = "Enter a valid 6-character room code."; render(); return; }
  state.error = ""; state.roomCode = code; state.role = "partner"; state.isHost = false; state.polite = true; state.screen = "room"; render(); await connectRoom();
}
async function connectRoom() {
  if (state.channel) { await state.channel.unsubscribe(); state.channel = null; }
  const channel = supabase.channel(`room:${state.roomCode}`, { config: { presence: { key: state.playerId }, broadcast: { self: false } } });
  channel
    .on("presence", { event: "sync" }, () => {
      const players = [];
      Object.values(channel.presenceState()).forEach(list => list.forEach(item => players.push(item)));
      state.players = players; state.connected = true; render(); maybeStartVoice();
    })
    .on("presence", { event: "join" }, () => { state.connected = true; render(); })
    .on("presence", { event: "leave" }, () => { render(); })
    .on("broadcast", { event: "signal" }, ({ payload }) => { handleSignal(payload); })
    .on("broadcast", { event: "game" }, ({ payload }) => { handleGame(payload); });
  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      state.connected = true;
      await channel.track({ playerId: state.playerId, role: state.role, ready: state.ready, joinedAt: Date.now() });
      render();
    }
  });
  state.channel = channel;
}
async function setReady() {
  state.ready = true;
  if (state.channel) await state.channel.track({ playerId: state.playerId, role: state.role, ready: true, joinedAt: Date.now() });
  render(); maybeStartVoice();
}
function maybeStartVoice() {
  const partner = state.players.find(p => p.playerId !== state.playerId);
  if (!partner || !state.ready || !partner.ready) return;
  if (state.pc && (state.voiceStatus === "connected" || state.voiceStatus === "connecting")) return;
  if (state.voiceStatus !== "idle" && state.voiceStatus !== "failed") return;
  startVoice();
}
function cleanupPeer() { if (state.pc) { try { state.pc.close(); } catch {} state.pc = null; } state.makingOffer = false; }
async function ensureMic() {
  if (state.localStream) return state.localStream;
  state.localStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
  return state.localStream;
}
function attachRemoteAudio(stream) {
  state.remoteStream = stream;
  let audio = document.getElementById("remoteAudio");
  if (!audio) { audio = document.createElement("audio"); audio.id = "remoteAudio"; audio.autoplay = true; audio.playsInline = true; document.body.appendChild(audio); }
  if (audio.srcObject !== stream) audio.srcObject = stream;
  audio.muted = false; audio.play().catch(() => {});
}
function markVoiceConnected() { if (state.voiceStatus === "connected") return; state.voiceStatus = "connected"; state.error = ""; render(); }
function createPeer() {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceTransportPolicy: "all", bundlePolicy: "max-bundle", iceCandidatePoolSize: 2 });
  state.pc = pc;
  if (state.localStream) state.localStream.getTracks().forEach(track => pc.addTrack(track, state.localStream));
  pc.ontrack = (event) => { attachRemoteAudio(event.streams[0] || new MediaStream([event.track])); markVoiceConnected(); };
  pc.onicecandidate = (event) => {
    if (event.candidate && state.channel) state.channel.send({ type: "broadcast", event: "signal", payload: { type: "ice", from: state.playerId, candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate } });
  };
  pc.oniceconnectionstatechange = () => {
    const s = pc.iceConnectionState;
    if (s === "connected" || s === "completed") { markVoiceConnected(); const a = document.getElementById("remoteAudio"); if (a) a.play().catch(() => {}); }
    else if (s === "disconnected" || s === "failed") { try { pc.restartIce(); } catch {} }
  };
  pc.onconnectionstatechange = () => { if (pc.connectionState === "connected") markVoiceConnected(); };
  return pc;
}
async function startVoice() {
  state.voiceStatus = "requesting"; state.error = ""; render();
  try {
    await ensureMic(); state.voiceStatus = "connecting"; render(); cleanupPeer(); createPeer();
    if (state.isHost) {
      state.makingOffer = true;
      const offer = await state.pc.createOffer({ offerToReceiveAudio: true });
      await state.pc.setLocalDescription(offer); state.makingOffer = false;
      state.channel.send({ type: "broadcast", event: "signal", payload: { type: "offer", from: state.playerId, sdp: state.pc.localDescription } });
    }
  } catch (err) {
    state.voiceStatus = "failed";
    state.error = err.name === "NotAllowedError" ? "Microphone permission denied." : "Could not access microphone.";
    render();
  }
}
async function handleSignal(payload) {
  if (!payload || payload.from === state.playerId) return;
  try {
    if (payload.type === "offer") {
      if (!state.localStream) { try { await ensureMic(); } catch { state.voiceStatus = "failed"; state.error = "Microphone permission denied."; render(); return; } }
      if (!state.pc) createPeer();
      const collision = state.makingOffer || state.pc.signalingState !== "stable";
      if (collision && !state.polite) return;
      await state.pc.setRemoteDescription(payload.sdp);
      const answer = await state.pc.createAnswer();
      await state.pc.setLocalDescription(answer);
      state.channel.send({ type: "broadcast", event: "signal", payload: { type: "answer", from: state.playerId, sdp: state.pc.localDescription } });
      state.voiceStatus = "connecting"; render();
    } else if (payload.type === "answer") {
      if (state.pc && state.pc.signalingState === "have-local-offer") { await state.pc.setRemoteDescription(payload.sdp); state.voiceStatus = "connecting"; render(); }
    } else if (payload.type === "ice" && payload.candidate && state.pc) {
      try { await state.pc.addIceCandidate(payload.candidate); } catch (e) {}
    }
  } catch (err) { console.error(err); }
}
function sendGame(payload) { if (state.channel) state.channel.send({ type: "broadcast", event: "game", payload }); }
function startPuzzle() {
  const puzzle = pickPuzzle(state.roomCode + String(Date.now()).slice(-3));
  const startedAt = Date.now();
  beginRound(puzzle, startedAt);
  sendGame({ type: "start", from: state.playerId, puzzleId: puzzle.id, startedAt });
}
function beginRound(puzzle, startedAt) {
  clearInterval(state.timerId);
  state.puzzle = puzzle; state.startedAt = startedAt; state.remaining = ROUND_SECONDS; state.result = ""; state.answerDraft = ""; state.error = ""; state.screen = "game"; render();
  state.timerId = setInterval(() => {
    state.remaining = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - state.startedAt) / 1000));
    if (state.screen === "game") {
      const el = document.querySelector(".timer");
      if (el) { el.textContent = String(Math.floor(state.remaining / 60)).padStart(2, "0") + ":" + String(state.remaining % 60).padStart(2, "0"); el.classList.toggle("urgent", state.remaining <= 15); }
    }
    if (state.remaining <= 0) endRound("timeout");
  }, 250);
}
function submitAnswer() {
  const guess = (document.getElementById("answerInput")?.value || state.answerDraft || "").trim().toUpperCase();
  if (!guess) return;
  state.answerDraft = guess;
  sendGame({ type: "answer", from: state.playerId, guess });
  resolveGuess(guess);
}
function resolveGuess(guess) {
  if (state.screen !== "game" || !state.puzzle) return;
  if (guess === state.puzzle.answer) endRound("win"); else { state.error = "Wrong. Keep talking."; render(); }
}
function endRound(result) {
  if (state.screen === "result") return;
  clearInterval(state.timerId); state.timerId = null; state.result = result; state.screen = "result";
  if (result === "timeout") sendGame({ type: "timeout", from: state.playerId });
  if (result === "win") sendGame({ type: "win", from: state.playerId });
  render();
}
function handleGame(payload) {
  if (!payload || payload.from === state.playerId) return;
  if (payload.type === "start") beginRound(PUZZLES.find(p => p.id === payload.puzzleId) || pickPuzzle(state.roomCode), payload.startedAt || Date.now());
  else if (payload.type === "answer") resolveGuess((payload.guess || "").trim().toUpperCase());
  else if (payload.type === "win") endRound("win");
  else if (payload.type === "timeout") endRound("timeout");
}
async function leaveRoom() {
  clearInterval(state.timerId); cleanupPeer();
  if (state.localStream) { state.localStream.getTracks().forEach(t => t.stop()); state.localStream = null; }
  const audio = document.getElementById("remoteAudio"); if (audio) audio.remove();
  if (state.channel) { await state.channel.unsubscribe(); state.channel = null; }
  Object.assign(state, { screen: "home", roomCode: "", role: "", players: [], connected: false, error: "", ready: false, voiceStatus: "idle", isHost: false, remoteStream: null, makingOffer: false, puzzle: null, result: "" });
  render();
}
render();
