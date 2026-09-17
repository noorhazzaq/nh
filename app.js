/* ============================================================
   COSMIC CHAT — app.js
   Bahagian 1 daripada 2 (ciri 1–72)
   ============================================================ */

/* ---------- FIREBASE ---------- */
const firebaseConfig = {
  databaseURL: "https://zack360-2b303-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const CFG = {
  MAXIMG: 6 * 1024 * 1024,
  MAXDIM: 1000,
  Q: 0.72,
  MAXTXT: 2000,
  RATE: 2000,
  LIMIT: 200,
  TTL: 60000,
  TYPT: 4000,
  EDIT: 5 * 60 * 1000
};

let db, msgRef, presRef, typRef, rxRef, pinRef, metaRef, todoRef, notesRef, pollRef, roomRef, dmRef;
let myUid = null, myName = "", myAvatar = null, myBio = "", myStatus = "online", myPresRef = null;
let myRoom = "utama";

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  msgRef = db.ref("cosmic-chat/messages");
  presRef = db.ref("cosmic-chat/presence");
  typRef = db.ref("cosmic-chat/typing");
  rxRef = db.ref("cosmic-chat/reactions");
  pinRef = db.ref("cosmic-chat/pins");
  metaRef = db.ref("cosmic-chat/meta");
  todoRef = db.ref("cosmic-chat/todos");
  notesRef = db.ref("cosmic-chat/notes");
  pollRef = db.ref("cosmic-chat/polls");
  roomRef = db.ref("cosmic-chat/rooms");
  dmRef = db.ref("cosmic-chat/dms");
} catch (e) {
  setTimeout(() => alert("Firebase gagal: " + e.message), 0);
}

/* ---------- UTIL ---------- */
const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);

function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function colorOf(n) {
  const h = hash(n || "?") % 360, h2 = (h + 60) % 360;
  return `linear-gradient(135deg,hsl(${h},75%,60%),hsl(${h2},75%,55%))`;
}
function initOf(n) {
  const p = String(n || "?").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}
function fmtT(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function fmtFull(ts) {
  const d = new Date(ts);
  return d.toLocaleString("ms-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function sanN(r) {
  return String(r).replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
}
function genId() {
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- PREFS ---------- */
const prefs = {
  theme: localStorage.getItem("c-theme") || "dark",
  density: localStorage.getItem("c-density") || "comfortable",
  contrast: localStorage.getItem("c-contrast") || "normal",
  fontSize: parseInt(localStorage.getItem("c-fs") || "15", 10),
  sound: localStorage.getItem("c-sound") !== "off",
  dnd: localStorage.getItem("c-dnd") === "on",
  timestamps: localStorage.getItem("c-ts") !== "off",
  vibrate: localStorage.getItem("c-vibrate") === "on",
  censor: localStorage.getItem("c-censor") === "on",
  tts: localStorage.getItem("c-tts") === "on",
  autoAway: localStorage.getItem("c-autoaway") === "on",
  lang: localStorage.getItem("c-lang") || "ms"
};

function savePrefs() {
  const m = {
    theme: prefs.theme, density: prefs.density, contrast: prefs.contrast,
    fs: prefs.fontSize, sound: prefs.sound ? "on" : "off",
    dnd: prefs.dnd ? "on" : "off", ts: prefs.timestamps ? "on" : "off",
    vibrate: prefs.vibrate ? "on" : "off", censor: prefs.censor ? "on" : "off",
    tts: prefs.tts ? "on" : "off", autoaway: prefs.autoAway ? "on" : "off",
    lang: prefs.lang
  };
  for (const [k, v] of Object.entries(m)) localStorage.setItem("c-" + k, v);
}

function applyPrefs() {
  document.documentElement.dataset.theme = prefs.theme;
  document.documentElement.dataset.density = prefs.density;
  document.documentElement.dataset.contrast = prefs.contrast;
  document.documentElement.style.setProperty("--fs", prefs.fontSize + "px");
  if ($("fontSizeRange")) { $("fontSizeRange").value = prefs.fontSize; $("fontSizeVal").textContent = prefs.fontSize; }
  if ($("soundToggle")) $("soundToggle").textContent = prefs.sound ? "🔔 Bunyi: On" : "🔔 Bunyi: Off";
  if ($("dndToggle")) $("dndToggle").textContent = prefs.dnd ? "🌙 DND: On" : "🌙 DND: Off";
  if ($("tsToggle")) $("tsToggle").textContent = prefs.timestamps ? "🕐 Masa: On" : "🕐 Masa: Off";
  if ($("vibrateToggle")) $("vibrateToggle").textContent = prefs.vibrate ? "📳 Getar: On" : "📳 Getar: Off";
  if ($("censorToggle")) $("censorToggle").textContent = prefs.censor ? "🚫 Tapis: On" : "🚫 Tapis: Off";
  if ($("ttsToggle")) $("ttsToggle").textContent = prefs.tts ? "🔊 Baca: On" : "🔊 Baca: Off";
  if ($("autoAwayToggle")) $("autoAwayToggle").textContent = prefs.autoAway ? "😴 Auto-away: On" : "😴 Auto-away: Off";
  if ($("langSelect")) $("langSelect").value = prefs.lang;
}

/* ---------- TOAST / BANNER ---------- */
let toastT = null;
function toast(msg, ok) {
  const e = $("toast");
  if (!e) return;
  e.textContent = msg;
  e.classList.toggle("ok", !!ok);
  e.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => e.classList.remove("show"), 2800);
}

let bannerT = null;
function showBanner(name, msg) {
  $("bannerName").textContent = name;
  $("bannerMsg").textContent = msg;
  const av = $("bannerAv");
  av.textContent = initOf(name);
  av.style.background = colorOf(name);
  $("banner").classList.add("show");
  clearTimeout(bannerT);
  bannerT = setTimeout(() => $("banner").classList.remove("show"), 4000);
}

/* ---------- SOUND / VIBRATE / NOTIF ---------- */
let actx = null;
function ding() {
  if (!prefs.sound || prefs.dnd) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, actx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, actx.currentTime + 0.08);
    g.gain.setValueAtTime(0.0001, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, actx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.25);
    o.start(); o.stop(actx.currentTime + 0.3);
  } catch (e) {}
}
function vibrate(p) {
  if (!prefs.vibrate) return;
  if (navigator.vibrate) try { navigator.vibrate(p); } catch (e) {}
}
async function reqNotif() {
  if (!("Notification" in window)) { toast("Tidak disokong"); return; }
  const p = await Notification.requestPermission();
  toast(p === "granted" ? "Notifikasi dihidupkan" : "Tidak dibenarkan", p === "granted");
}
function notif(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (prefs.dnd || document.hasFocus()) return;
  try { new Notification(title, { body }); } catch (e) {}
}

/* ---------- LOCAL DATA ---------- */
let starred = JSON.parse(localStorage.getItem("c-starred") || "{}");
let blocked = JSON.parse(localStorage.getItem("c-blocked") || "{}");
let muted = JSON.parse(localStorage.getItem("c-muted") || "{}");
let recent = JSON.parse(localStorage.getItem("c-recent") || "[]");
let drafts = JSON.parse(localStorage.getItem("c-drafts") || "{}");
let recentEmojis = JSON.parse(localStorage.getItem("c-recent-emoji") || "[]");
let archived = JSON.parse(localStorage.getItem("c-archived") || "[]");
let tagsMap = JSON.parse(localStorage.getItem("c-tags") || "{}");
let customBg = localStorage.getItem("c-bg") || "";
function saveL(k, v) { localStorage.setItem("c-" + k, JSON.stringify(v)); }

/* ---------- STATE ---------- */
const state = {
  replyTo: null, editId: null, pending: [],
  typingT: null, lastTyp: 0,
  recChunks: [], mr: null, recording: false,
  rendered: new Map(), userCache: {},
  searchRes: [], searchIdx: 0, unread: 0,
  pinnedId: null, lastMsgId: null, lastOwnId: null,
  multiSelect: false, selected: new Set(),
  scheduleAt: null,
  editingImageIndex: -1, currentFilter: "none",
  pomodoroInterval: null, pomodoroSeconds: 0, pomodoroMode: "work",
  countdownInterval: null, countdownSeconds: 0,
  tttBoard: Array(9).fill(null), tttTurn: "X",
  dmTarget: null, callStream: null
};

/* ---------- PROFANITY ---------- */
const BAD_WORDS = ["anjing","babi","bodoh","sial","pukimak","kimak","lancau","pantat","bangsat","kontol","memek","jembut"];
function censor(text) {
  if (!prefs.censor) return text;
  let out = text;
  BAD_WORDS.forEach(w => {
    const r = new RegExp("\\b" + w + "\\b", "gi");
    out = out.replace(r, m => "*".repeat(m.length));
  });
  return out;
}

/* ---------- EMOJI MAP ---------- */
const EMOJI_MAP = {
  smile:"😄",laugh:"😂",heart:"❤️",fire:"🔥",thumbsup:"👍",thumbsdown:"👎",
  cry:"😢",angry:"😠",wink:"😉",kiss:"😘",cool:"😎",think:"🤔",
  party:"🎉",star:"⭐",check:"✅",x:"❌",warn:"⚠️",rocket:"🚀",
  eye:"👀",pray:"🙏",clap:"👏",wave:"👋",ok:"👌",muscle:"💪",
  skull:"💀",ghost:"👻",alien:"👽",robot:"🤖",cat:"🐱",dog:"🐶",
  pizza:"🍕",coffee:"☕",beer:"🍺",cake:"🎂",gift:"🎁",money:"💰",
  100:"💯",sun:"☀️",moon:"🌙",rain:"🌧️",snow:"❄️",heartbreak:"💔",
  sparkles:"✨",zap:"⚡",crown:"👑",gem:"💎",lock:"🔒",key:"🔑",
  bell:"🔔",flag:"🚩"
};
const KAOMOJI = ["¯\\_(ツ)_/¯","(╯°□°）╯︵ ┻━┻","┬─┬ノ( º _ ºノ)","( ͡° ͜ʖ ͡°)","(づ｡◕‿‿◕｡)づ","ಠ_ಠ","(◕‿◕)","ʕ•ᴥ•ʔ","(¬_¬)","(￣▽￣)","(≧◡≦)","(T_T)","(>_<)","(*^_^*)","(¬‿¬)","(°ロ°)","(☞ﾟヮﾟ)☞"];

/* ---------- RICH TEXT ---------- */
function richText(txt) {
  let s = esc(txt);
  s = s.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre>${lang ? `<span class="code-lang" style="font-size:9.5px;color:var(--ac2);text-transform:uppercase;font-weight:700">${esc(lang)}</span>` : ""}<button class="copy-code" onclick="navigator.clipboard.writeText(this.nextSibling.textContent||'');this.textContent='✓'">Salin</button><span>${esc(code.trim())}</span></pre>`);
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  s = s.replace(/\|\|([^|\n]+)\|\|/g, '<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
  s = s.replace(/(^|\s)@([a-zA-Z0-9_]{2,20})/g, (_, p, n) => `${p}<span class="mention">@${esc(n)}</span>`);
  s = s.replace(/(^|\s)#([a-zA-Z0-9_]{2,30})/g, (_, p, tag) => `${p}<span class="hashtag">#${esc(tag)}</span>`);
  s = s.replace(/(https?:\/\/[^\s<]+)/g, u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`);
  s = s.replace(/:([a-z0-9_]+):/g, (m, k) => EMOJI_MAP[k] ? EMOJI_MAP[k] : m);
  return censor(s);
}

/* ---------- COMPRESS ---------- */
async function compress(f, dim = CFG.MAXDIM, q = CFG.Q) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error("Gagal baca"));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error("Imej tidak sah"));
      img.onload = () => {
        const s = Math.min(1, dim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * s));
        const h = Math.max(1, Math.round(img.height * s));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", q));
      };
      img.src = r.result;
    };
    r.readAsDataURL(f);
  });
}

/* ---------- NAME ---------- */
function openName() {
  $("nameModal").classList.remove("hidden");
  $("nameInput").value = myName;
  setTimeout(() => $("nameInput").focus(), 100);
}
function submitName() {
  const n = sanN($("nameInput").value);
  if (n.length < 2) { $("nameErr").classList.add("show"); return; }
  myName = n;
  localStorage.setItem("c-name", n);
  $("nameModal").classList.add("hidden");
  $("app").style.display = "flex";
  applyId(); startPres(); writeProfile();
}
$("nameBtn").onclick = submitName;
$("nameInput").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); submitName(); } };

function applyId() {
  $("myName").textContent = myName;
  const a = $("myAvatar");
  if (myAvatar) { a.textContent = ""; a.style.backgroundImage = `url(${myAvatar})`; }
  else { a.textContent = initOf(myName); a.style.backgroundImage = ""; a.style.background = colorOf(myName); }
}
function writeProfile() {
  if (!myUid) return;
  metaRef.child("profiles").child(myUid).set({
    name: myName, avatar: myAvatar || null, bio: myBio, status: myStatus, ts: Date.now()
  }).catch(() => {});
}

/* ---------- PROFILE ---------- */
$("userChip").onclick = () => {
  $("profileModal").classList.remove("hidden");
  $("profileName").value = myName;
  $("profileBio").value = myBio;
  $("profileStatus").value = myStatus;
  const e = $("profileAvatar");
  if (myAvatar) { e.textContent = ""; e.style.backgroundImage = `url(${myAvatar})`; }
  else { e.textContent = initOf(myName || "?"); e.style.backgroundImage = ""; e.style.background = colorOf(myName || "?"); }
};
$("avatarBtn").onclick = () => $("avatarInput").click();
$("avatarInput").onchange = async () => {
  const f = $("avatarInput").files[0];
  $("avatarInput").value = "";
  if (!f || !f.type.startsWith("image/")) { toast("Fail imej sahaja"); return; }
  try {
    myAvatar = await compress(f, 200, 0.8);
    localStorage.setItem("c-avatar", myAvatar);
    const e = $("profileAvatar");
    e.textContent = ""; e.style.backgroundImage = `url(${myAvatar})`;
    toast("Avatar dikemas kini", true);
  } catch (e) { toast("Gagal: " + e.message); }
};
$("profileCancel").onclick = () => $("profileModal").classList.add("hidden");
$("profileSave").onclick = () => {
  const n = sanN($("profileName").value);
  if (n.length < 2) { toast("Nama tidak sah"); return; }
  myName = n;
  myBio = $("profileBio").value.trim().slice(0, 80);
  myStatus = $("profileStatus").value;
  localStorage.setItem("c-name", n);
  localStorage.setItem("c-bio", myBio);
  applyId(); writeProfile(); startPres();
  $("profileModal").classList.add("hidden");
  toast("Disimpan", true);
};

function openUserProfile(uid, name) {
  const p = state.userCache[uid] || { name };
  $("upName").textContent = p.name || name;
  $("upBio").textContent = p.bio || "—";
  const a = $("upAvatar");
  if (p.avatar) { a.textContent = ""; a.style.backgroundImage = `url(${p.avatar})`; }
  else { a.textContent = initOf(p.name || name); a.style.backgroundImage = ""; a.style.background = colorOf(p.name || name); }
  $("upBlock").textContent = blocked[uid] ? "🔓 Buka" : "🚫 Blok";
  $("upMute").textContent = muted[uid] ? "🔊 Buka" : "🔇 Mute";
  $("upBlock").onclick = () => {
    if (blocked[uid]) { delete blocked[uid]; toast("Sekatan dibuang", true); }
    else { blocked[uid] = true; toast("Disekat"); }
    saveL("blocked", blocked);
    $("userProfileModal").classList.add("hidden");
    renderAll();
  };
  $("upMute").onclick = () => {
    if (muted[uid]) { delete muted[uid]; toast("Mute dibuang", true); }
    else { muted[uid] = true; toast("Mute"); }
    saveL("muted", muted);
    $("userProfileModal").classList.add("hidden");
  };
  $("upDM").onclick = () => { openDM(uid, name); $("userProfileModal").classList.add("hidden"); };
  $("upCall").onclick = () => { startCall(uid); $("userProfileModal").classList.add("hidden"); };
  $("userProfileModal").classList.remove("hidden");
}
$("upClose").onclick = () => $("userProfileModal").classList.add("hidden");

/* ---------- PRESENCE ---------- */
let presHB = null;
let awayTimer = null;

function startPres() {
  if (!myUid || !myName) return;
  if (myPresRef) { myPresRef.off(); myPresRef.onDisconnect().cancel().catch(() => {}); }
  myPresRef = presRef.child(myUid);
  myPresRef.onDisconnect().remove();
  const write = () => {
    myPresRef.set({
      name: myName, avatar: myAvatar || null, status: myStatus,
      room: myRoom, ts: Date.now()
    }).catch(() => {});
  };
  write();
  if (presHB) clearInterval(presHB);
  presHB = setInterval(write, CFG.TTL / 2);

  // Auto-away
  if (prefs.autoAway) {
    const setIdle = () => {
      clearTimeout(awayTimer);
      if (myStatus !== "away") { myStatus = "away"; write(); }
      awayTimer = setTimeout(() => {
        myStatus = "online"; write();
      }, 60000);
    };
    ["mousemove", "keydown", "click"].forEach(ev => document.addEventListener(ev, setIdle, { passive: true }));
  }

  presRef.on("value", snap => {
    const val = snap.val() || {};
    const now = Date.now();
    const users = [];
    Object.entries(val).forEach(([uid, p]) => {
      if (p && p.name && now - p.ts < CFG.TTL) users.push({ uid, ...p });
    });
    $("onlineText").textContent = users.length + " dalam talian";
    $("statusDot").classList.remove("off");
    const list = $("userList");
    list.innerHTML = "";
    if (!users.length) {
      list.innerHTML = `<p style="font-size:11.5px;color:var(--txd);text-align:center;padding:10px">Tiada pengguna</p>`;
    } else {
      users.sort((a, b) => a.name.localeCompare(b.name));
      users.forEach(u => {
        const row = document.createElement("div");
        row.className = "ui" + (blocked[u.uid] ? " blk" : "");
        const av = document.createElement("div");
        av.className = "uav";
        if (u.avatar) av.style.backgroundImage = `url(${u.avatar})`;
        else { av.textContent = initOf(u.name); av.style.background = colorOf(u.name); }
        const dot = document.createElement("div");
        dot.className = "dot" + ((u.status === "away" || u.status === "busy") ? " away" : "");
        av.appendChild(dot);
        const nm = document.createElement("div");
        nm.className = "unm";
        nm.innerHTML = `${esc(u.name)}<span class="ust">${u.bio ? esc(u.bio) : "@" + esc(u.name)}</span>`;
        row.appendChild(av); row.appendChild(nm);
        row.onclick = e => { e.stopPropagation(); openUserProfile(u.uid, u.name); };
        row.oncontextmenu = e => { e.preventDefault(); filterByUser(u.uid, u.name); };
        list.appendChild(row);
      });
    }
    $("userCount").textContent = users.length;
  }, () => {
    $("statusDot").classList.add("off");
    $("onlineText").textContent = "Luar talian";
  });

  metaRef.child("profiles").on("value", snap => {
    state.userCache = snap.val() || {};
    document.querySelectorAll(".ma[data-uid]").forEach(el => {
      const uid = el.dataset.uid;
      const p = state.userCache[uid];
      if (p && p.avatar) { el.textContent = ""; el.style.backgroundImage = `url(${p.avatar})`; }
    });
  });
}

/* ---------- REPLY / EDIT / SCHEDULE ---------- */
function showReply(m) {
  state.replyTo = m;
  $("replyPreview").classList.add("show");
  $("replyName").textContent = "Membalas " + m.name;
  $("replyText").textContent = m.text ? m.text.slice(0, 80) : "🖼️";
  $("textInput").focus();
}
function clearReply() { state.replyTo = null; $("replyPreview").classList.remove("show"); }
$("replyClose").onclick = clearReply;

function showEdit(m) {
  state.editId = m.id;
  $("editPreview").classList.add("show");
  $("editText").textContent = m.text ? m.text.slice(0, 80) : "🖼️";
  $("textInput").value = m.text || "";
  $("textInput").focus();
}
function clearEdit() { state.editId = null; $("editPreview").classList.remove("show"); $("textInput").value = ""; }
$("editClose").onclick = clearEdit;

function clearSchedule() { state.scheduleAt = null; $("schedulePreview").classList.remove("show"); }
$("scheduleClose").onclick = clearSchedule;
function setSchedule(ts) {
  state.scheduleAt = ts;
  $("schedulePreview").classList.add("show");
  $("scheduleText").textContent = fmtFull(ts);
}

/* ---------- TYPING ---------- */
function sendTyp() {
  if (!myUid || !myName) return;
  const now = Date.now();
  if (now - state.lastTyp < 1500) return;
  state.lastTyp = now;
  typRef.child(myUid).set({ name: myName, ts: now });
  clearTimeout(state.typingT);
  state.typingT = setTimeout(() => { typRef.child(myUid).remove().catch(() => {}); }, CFG.TYPT);
}
function stopTyp() {
  if (!myUid) return;
  typRef.child(myUid).remove().catch(() => {});
  clearTimeout(state.typingT);
}
typRef.on("value", snap => {
  const val = snap.val() || {};
  const now = Date.now();
  const names = [];
  Object.entries(val).forEach(([uid, d]) => {
    if (uid !== myUid && d && d.name && now - d.ts < CFG.TYPT) names.push(d.name);
  });
  const el = $("typingIndicator");
  if (!names.length) el.classList.remove("show");
  else {
    el.classList.add("show");
    const label = names.length === 1
      ? `${names[0]} sedang menaip`
      : `${names.slice(0, 2).join(", ")}${names.length > 2 ? " +" + (names.length - 2) : ""} sedang menaip`;
    $("typingText").textContent = label;
  }
});

/* ---------- COMPOSER ---------- */
const msgsEl = $("messages"), textInput = $("textInput"), sendBtn = $("sendBtn"),
      fileInput = $("fileInput"), imgPrev = $("imagePreview"), prevImg = $("previewImg"),
      prevName = $("previewName"), prevSize = $("previewSize"), composerRow = $("composerRow"),
      cbEl = $("cooldownBar"), cbFill = $("cooldownFill"),
      scrollBtn = $("scrollBottom"), scrollBdg = $("scrollBadge"),
      autocomplete = $("autocomplete");

let lastSent = 0, sending = false;

function updateSend() {
  sendBtn.disabled = sending || !(textInput.value.trim() || state.pending.length);
}

const saveDraft = debounce(() => {
  if (textInput.value) { drafts[myUid] = textInput.value; saveL("drafts", drafts); }
  else { delete drafts[myUid]; saveL("drafts", drafts); }
}, 500);

/* ---------- AUTOCOMPLETE ---------- */
function showAC(items, onPick) {
  autocomplete.innerHTML = "";
  if (!items.length) { autocomplete.classList.remove("show"); return; }
  items.forEach((it, i) => {
    const d = document.createElement("div");
    d.className = "ac-item" + (i === 0 ? " active" : "");
    d.innerHTML = `<span class="ac-emoji">${it.icon || ""}</span><span class="ac-name">${esc(it.name)}</span><span class="ac-desc">${esc(it.desc || "")}</span>`;
    d.onmousedown = e => { e.preventDefault(); onPick(it); };
    autocomplete.appendChild(d);
  });
  autocomplete.classList.add("show");
}
function hideAC() { autocomplete.classList.remove("show"); }

textInput.oninput = () => {
  if (textInput.value.length > CFG.MAXTXT) textInput.value = textInput.value.slice(0, CFG.MAXTXT);
  textInput.style.height = "auto";
  textInput.style.height = Math.min(textInput.scrollHeight, 140) + "px";
  updateSend(); saveDraft();
  if (textInput.value.trim()) sendTyp(); else stopTyp();

  const v = textInput.value, cursor = textInput.selectionStart;
  const before = v.slice(0, cursor);

  const emMatch = before.match(/:([a-z0-9_]{2,})$/);
  if (emMatch) {
    const q = emMatch[1].toLowerCase();
    const matches = Object.entries(EMOJI_MAP).filter(([k]) => k.startsWith(q)).slice(0, 8).map(([k, e]) => ({ name: k, icon: e }));
    if (matches.length) { showAC(matches, it => { textInput.value = v.slice(0, cursor - emMatch[0].length) + it.icon + v.slice(cursor); textInput.focus(); updateSend(); }); return; }
  }
  const atMatch = before.match(/@([a-zA-Z0-9_]{0,20})$/);
  if (atMatch) {
    const q = atMatch[1].toLowerCase();
    const users = Object.values(state.userCache).map(p => p.name).filter(n => n && n.toLowerCase().startsWith(q)).slice(0, 8);
    if (users.length) { showAC(users.map(n => ({ name: "@" + n, icon: "👤" })), it => { textInput.value = v.slice(0, cursor - atMatch[0].length) + it.name + " " + v.slice(cursor); textInput.focus(); updateSend(); }); return; }
  }
  if (before.startsWith("/") && !before.includes(" ")) {
    const cmdList = Object.keys(SLASH).filter(k => k.startsWith(before)).slice(0, 8);
    if (cmdList.length) { showAC(cmdList.map(k => ({ name: k, icon: "/" })), it => { textInput.value = it.name + " " + v.slice(cursor); textInput.focus(); updateSend(); }); return; }
  }
  hideAC();
};

textInput.onkeydown = e => {
  if (autocomplete.classList.contains("show")) {
    if (["ArrowDown", "ArrowUp", "Tab", "Enter"].includes(e.key)) {
      e.preventDefault();
      const items = autocomplete.querySelectorAll(".ac-item");
      if (!items.length) return;
      let idx = Array.from(items).findIndex(x => x.classList.contains("active"));
      if (e.key === "Enter" || e.key === "Tab") { items[idx < 0 ? 0 : idx].dispatchEvent(new MouseEvent("mousedown")); return; }
      idx = e.key === "ArrowDown" ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
      items.forEach(x => x.classList.remove("active"));
      items[idx].classList.add("active");
      return;
    }
    if (e.key === "Escape") { hideAC(); return; }
  }
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMsg(); }
};

sendBtn.onclick = sendMsg;
$("imageBtn").onclick = () => fileInput.click();
fileInput.onchange = async () => {
  const files = Array.from(fileInput.files || []);
  fileInput.value = "";
  await handleFiles(files);
};

/* ---------- IMAGE HANDLING ---------- */
async function handleFiles(files) {
  if (!files.length) return;
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    if (f.size > CFG.MAXIMG) { toast("Fail terlalu besar: " + f.name); continue; }
    try {
      const d = await compress(f);
      if (d.length > 400000) { toast("Terlalu besar selepas mampat"); continue; }
      state.pending.push({ dataUrl: d, name: f.name });
    } catch (e) { toast("Gagal: " + f.name); }
  }
  renderPrev(); updateSend();
}
function renderPrev() {
  if (!state.pending.length) { imgPrev.classList.remove("show"); return; }
  const f = state.pending[0];
  prevImg.src = f.dataUrl;
  prevName.textContent = f.name + (state.pending.length > 1 ? ` (+${state.pending.length - 1})` : "");
  prevSize.textContent = Math.round(f.dataUrl.length * 0.75 / 1024) + " KB";
  imgPrev.classList.add("show");
  if (state.pending.length === 1) openImageEditor(0);
}
$("previewRemove").onclick = () => { state.pending = []; renderPrev(); updateSend(); };

/* ---------- IMAGE EDITOR ---------- */
function openImageEditor(idx) {
  state.editingImageIndex = idx;
  state.currentFilter = "none";
  $("imgEditPreview").src = state.pending[idx].dataUrl;
  $("imgEditPreview").style.filter = "none";
  $$("#imgFilters button").forEach(b => b.classList.toggle("active", b.dataset.f === "none"));
  $("imgEdit").classList.add("show");
}
$("imgFilters").onclick = e => {
  const b = e.target.closest("button");
  if (!b) return;
  state.currentFilter = b.dataset.f;
  $$("#imgFilters button").forEach(x => x.classList.toggle("active", x === b));
  const filters = { none: "none", grayscale: "grayscale(1)", sepia: "sepia(1)", blur: "blur(3px)", brightness: "brightness(1.3)", contrast: "contrast(1.5)", invert: "invert(1)" };
  $("imgEditPreview").style.filter = filters[state.currentFilter] || "none";
};
$("imgEditCancel").onclick = () => $("imgEdit").classList.remove("show");
$("imgEditOk").onclick = () => {
  const filters = { none: "none", grayscale: "grayscale(1)", sepia: "sepia(1)", blur: "blur(3px)", brightness: "brightness(1.3)", contrast: "contrast(1.5)", invert: "invert(1)" };
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.filter = filters[state.currentFilter] || "none";
    ctx.drawImage(img, 0, 0);
    state.pending[state.editingImageIndex].dataUrl = c.toDataURL("image/jpeg", 0.8);
    renderPrevSkipEditor();
    $("imgEdit").classList.remove("show");
  };
  img.src = state.pending[state.editingImageIndex].dataUrl;
};
function renderPrevSkipEditor() {
  if (!state.pending.length) { imgPrev.classList.remove("show"); return; }
  const f = state.pending[0];
  prevImg.src = f.dataUrl;
  prevName.textContent = f.name + (state.pending.length > 1 ? ` (+${state.pending.length - 1})` : "");
  prevSize.textContent = Math.round(f.dataUrl.length * 0.75 / 1024) + " KB";
  imgPrev.classList.add("show");
}

/* ---------- DRAG / DROP / PASTE ---------- */
["dragenter", "dragover"].forEach(ev => composerRow.addEventListener(ev, e => { e.preventDefault(); composerRow.classList.add("drag"); }));
["dragleave", "drop"].forEach(ev => composerRow.addEventListener(ev, e => { e.preventDefault(); composerRow.classList.remove("drag"); }));
composerRow.addEventListener("drop", e => {
  const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
  if (files.length) handleFiles(files);
});
document.addEventListener("paste", e => {
  if (document.activeElement !== textInput) return;
  const items = Array.from(e.clipboardData?.items || []);
  const files = items.map(i => i.getAsFile()).filter(f => f && f.type.startsWith("image/"));
  if (files.length) { e.preventDefault(); handleFiles(files); }
});

/* ---------- COOLDOWN ---------- */
function updateCooldown() {
  const now = Date.now();
  const rem = Math.max(0, CFG.RATE - (now - lastSent));
  if (rem === 0) { cbEl.classList.remove("show"); cbFill.style.width = "0%"; return; }
  cbEl.classList.add("show");
  cbFill.style.width = ((1 - rem / CFG.RATE) * 100) + "%";
  requestAnimationFrame(updateCooldown);
}

/* ---------- SLASH ---------- */
const SLASH = {
  "/help": { fn: () => toast("/help /clear /nick /me /shrug /tableflip /star /pin /search /poll /todo /notes /timer /pomodoro /dice /coin /random /ttt /stats /tts /time /calc /translate /room /dm /weather /qr") },
  "/clear": { fn: () => { textInput.value = ""; updateSend(); } },
  "/nick": { fn: a => { const n = sanN(a); if (n.length >= 2) { myName = n; localStorage.setItem("c-name", n); applyId(); writeProfile(); startPres(); toast("Nama ditukar", true); } else toast("Guna: /nick [nama]"); } },
  "/me": { fn: a => sendSpecial(`*${myName} ${a}*`) },
  "/shrug": { fn: () => { textInput.value = "¯\\_(ツ)_/¯"; updateSend(); } },
  "/tableflip": { fn: () => { textInput.value = "(╯°□°）╯︵ ┻━┻"; updateSend(); } },
  "/star": { fn: () => { if (state.lastOwnId) toggleStar(state.lastOwnId); } },
  "/pin": { fn: () => { if (state.lastOwnId) togglePin(state.lastOwnId); } },
  "/search": { fn: a => { $("searchBar").classList.add("show"); $("searchInput").value = a; doSearch(); } },
  "/poll": { fn: () => $("pollModal").classList.remove("hidden") },
  "/todo": { fn: () => openTodo() },
  "/notes": { fn: () => openNotes() },
  "/timer": { fn: a => { const min = parseInt(a) || 5; $("timerModal").classList.remove("hidden"); $("timerMin").value = min; startCountdown(min * 60); } },
  "/pomodoro": { fn: () => { startPomodoro(); } },
  "/dice": { fn: () => sendSpecial(`🎲 Dadu: ${Math.floor(Math.random() * 6) + 1}`) },
  "/coin": { fn: () => sendSpecial(`🪙 Duit: ${Math.random() < 0.5 ? "Kepala" : "Ekor"}`) },
  "/random": { fn: a => { const ops = a.split(",").map(s => s.trim()).filter(Boolean); if (!ops.length) { toast("Guna: /random a, b, c"); return; } sendSpecial(`🎯 Pilihan: ${ops[Math.floor(Math.random() * ops.length)]}`); } },
  "/ttt": { fn: () => $("tttModal").classList.remove("hidden") },
  "/stats": { fn: () => showStats() },
  "/tts": { fn: () => { prefs.tts = !prefs.tts; savePrefs(); applyPrefs(); toast("TTS " + (prefs.tts ? "on" : "off")); } },
  "/time": { fn: () => sendSpecial(`🕐 ${new Date().toLocaleString("ms-MY")}`) },
  "/calc": { fn: a => { try { const r = Function('"use strict";return(' + a + ')')(); sendSpecial(`🧮 ${a} = ${r}`); } catch (e) { toast("Ralat: " + e.message); } } },
  "/room": { fn: a => { if (a) joinRoom(a.trim().toLowerCase()); else $("roomsModal").classList.remove("hidden"); } },
  "/dm": { fn: a => { const t = a.trim(); if (!t) { toast("Guna: /dm nama"); return; } const u = Object.entries(state.userCache).find(([, p]) => p.name && p.name.toLowerCase() === t.toLowerCase()); if (u) openDM(u[0], u[1].name); else toast("Pengguna tidak dijumpai"); } },
  "/weather": { fn: () => quickTool("weather") },
  "/qr": { fn: a => { if (a) generateQR(a); else toast("Guna: /qr teks"); } }
};

async function handleSlash(cmd, args) {
  const c = SLASH[cmd];
  if (!c) { toast("Arahan tidak dikenali: " + cmd); return; }
  c.fn(args);
}
async function sendSpecial(text) {
  if (!myUid) return;
  const p = { uid: myUid, name: myName, text, room: myRoom, ts: Date.now() };
  try { await msgRef.push(p); } catch (e) { toast("Gagal: " + e.message); }
  textInput.value = ""; updateSend();
}

/* ---------- SEND ---------- */
async function sendMsg() {
  if (sending) return;
  if (!myUid) { toast("Belum bersedia"); return; }
  if (!myName) { openName(); return; }
  let text = textInput.value.trim().slice(0, CFG.MAXTXT);
  if (text.startsWith("/")) {
    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = text.slice(cmd.length).trim();
    textInput.value = ""; updateSend();
    await handleSlash(cmd, args);
    return;
  }
  if (state.editId) { await commitEdit(text); return; }
  const now = Date.now();
  if (now - lastSent < CFG.RATE) { toast("Sila tunggu sebentar"); return; }
  if (!text && !state.pending.length) return;

  const p = {
    uid: myUid, name: myName, text,
    room: myRoom,
    images: state.pending.map(i => i.dataUrl),
    replyTo: state.replyTo ? { id: state.replyTo.id, name: state.replyTo.name, text: state.replyTo.text || "🖼️" } : null,
    scheduledAt: state.scheduleAt || null,
    ts: now
  };
  const sTxt = textInput.value, sImgs = state.pending.slice(),
        sReply = state.replyTo, sSched = state.scheduleAt;
  textInput.value = ""; textInput.style.height = "auto";
  state.pending = []; state.scheduleAt = null;
  renderPrev(); clearReply(); clearSchedule(); updateSend();
  delete drafts[myUid]; saveL("drafts", drafts);
  lastSent = now; sending = true; stopTyp(); updateCooldown();

  try { await msgRef.push(p); }
  catch (err) {
    toast("Gagal hantar: " + err.message);
    textInput.value = sTxt; state.pending = sImgs; state.replyTo = sReply;
    if (sReply) showReply(sReply);
    if (sSched) setSchedule(sSched);
    renderPrev(); updateSend();
    lastSent = 0; updateCooldown();
  } finally { sending = false; updateSend(); }
}
async function commitEdit(text) {
  if (!state.editId) return;
  const id = state.editId;
  const nt = (text || "").slice(0, CFG.MAXTXT);
  if (!nt) { toast("Teks kosong"); return; }
  try {
    await msgRef.child(id).update({ text: nt, edited: true, editedTs: Date.now() });
    clearEdit(); toast("Dikemas kini", true);
  } catch (e) { toast("Gagal edit: " + e.message); }
}

/* ---------- MESSAGE RENDERING ---------- */
const renderedIds = new Set(), renderOrder = [];
function markR(id) {
  renderedIds.add(id); renderOrder.push(id);
  if (renderOrder.length > CFG.LIMIT * 2) {
    const drop = renderOrder.splice(0, renderOrder.length - CFG.LIMIT);
    drop.forEach(k => renderedIds.delete(k));
  }
}
function isVisible(m) {
  if (!m.scheduledAt) return true;
  if (m.uid === myUid) return true;
  return Date.now() >= m.scheduledAt;
}

msgRef.limitToLast(CFG.LIMIT).on("child_added", snap => {
  const key = snap.key;
  if (renderedIds.has(key)) return;
  markR(key);
  const m = snap.val();
  if (!m || typeof m !== "object") return;
  if (typeof m.name !== "string" || typeof m.ts !== "number") return;
  if (m.room && m.room !== myRoom) return;
  if (m.uid && blocked[m.uid]) return;
  if (!isVisible(m)) {
    const delay = Math.max(1000, m.scheduledAt - Date.now());
    setTimeout(() => {
      renderedIds.delete(key);
      snap.ref.once("value", s => {
        if (s.exists()) {
          markR(key);
          const mv = s.val();
          const el = createMsgEl({ id: key, ...mv });
          msgsEl.appendChild(el);
          state.rendered.set(key, { id: key, ...mv });
          scrollBottom(true);
        }
      });
    }, delay);
    return;
  }
  const el = createMsgEl({ id: key, ...m });
  msgsEl.appendChild(el);
  state.rendered.set(key, { id: key, ...m });
  const nearB = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 220;
  const isMe = m.uid === myUid;
  if (isMe || nearB) scrollBottom(true);
  else { state.unread++; updateBadge(); }
  if (m.uid && m.uid !== myUid && !muted[m.uid]) {
    ding(); vibrate(80); notif(m.name, m.text || "🖼️");
    if (!document.hasFocus()) showBanner(m.name, m.text || "🖼️");
  }
  if (isMe) state.lastOwnId = key;
  state.lastMsgId = key;
  if (prefs.tts && m.uid && m.uid !== myUid && m.text) speak(m.text);
});

msgRef.limitToLast(CFG.LIMIT).on("child_changed", snap => {
  const key = snap.key;
  const m = snap.val();
  if (!m) return;
  if (m.room && m.room !== myRoom) return;
  state.rendered.set(key, { id: key, ...m });
  const el = document.querySelector(`[data-mid="${key}"]`);
  if (el) el.replaceWith(createMsgEl({ id: key, ...m }));
});

msgRef.limitToLast(CFG.LIMIT).on("child_removed", snap => {
  const key = snap.key;
  state.rendered.delete(key);
  const el = document.querySelector(`[data-mid="${key}"]`);
  if (el) el.remove();
});

/* ---------- CREATE MESSAGE ELEMENT ---------- */
function createMsgEl(m) {
  const isMe = m.uid === myUid || m.name === myName;
  const wrap = document.createElement("div");
  wrap.className = "msg" + (isMe ? " me" : "");
  wrap.dataset.mid = m.id;
  wrap.dataset.uid = m.uid || "";
  if (state.selected.has(m.id)) wrap.classList.add("selected");

  // Avatar
  const av = document.createElement("div");
  av.className = "ma";
  av.dataset.uid = m.uid || "";
  const p = state.userCache[m.uid];
  if (p && p.avatar) { av.textContent = ""; av.style.backgroundImage = `url(${p.avatar})`; }
  else { av.textContent = initOf(m.name); av.style.backgroundImage = ""; av.style.background = colorOf(m.name); }
  av.onclick = () => { if (m.uid && m.uid !== myUid) openUserProfile(m.uid, m.name); };

  // Body
  const body = document.createElement("div");
  body.className = "mbody";

  // Meta
  const mm = document.createElement("div");
  mm.className = "mm";
  const nm = document.createElement("span");
  nm.className = "mn";
  nm.textContent = m.name;
  nm.onclick = () => { if (m.uid && m.uid !== myUid) openUserProfile(m.uid, m.name); };
  mm.appendChild(nm);

  if (prefs.timestamps) {
    const ts = document.createElement("span");
    ts.textContent = fmtT(m.ts);
    ts.title = fmtFull(m.ts);
    mm.appendChild(ts);
  }
  if (m.edited) {
    const e = document.createElement("span");
    e.className = "ed"; e.textContent = "(diedit)";
    e.style.fontStyle = "italic"; e.style.opacity = "0.7";
    mm.appendChild(e);
  }
  if (m.scheduledAt && m.uid === myUid) {
    const s = document.createElement("span");
    s.className = "sched"; s.textContent = "⏰ " + fmtFull(m.scheduledAt);
    s.style.color = "var(--wn)"; s.style.fontWeight = "700";
    mm.appendChild(s);
  }
  if (m.forwarded) {
    const f = document.createElement("span");
    f.className = "fwd"; f.textContent = "↪️ dipindah";
    f.style.color = "var(--ac2)"; f.style.fontStyle = "italic";
    mm.appendChild(f);
  }

  // Read receipt
  if (isMe) {
    const rr = document.createElement("span");
    rr.className = "rcpt";
    rr.textContent = "✓✓";
    rr.style.color = "var(--txd)";
    mm.appendChild(rr);
  }

  // Tags
  const tags = tagsMap[m.id];
  if (tags && tags.length) {
    tags.forEach(t => {
      const el = document.createElement("span");
      el.className = "tag";
      el.textContent = t.name;
      el.style.background = t.color + "44";
      el.style.color = t.color;
      mm.appendChild(el);
    });
  }

  // Star
  const stEl = document.createElement("span");
  stEl.className = "star" + (starred[m.id] ? " on" : "");
  stEl.textContent = starred[m.id] ? "★" : "☆";
  stEl.style.color = "var(--wn)";
  stEl.style.cursor = "pointer";
  stEl.onclick = () => toggleStar(m.id);
  mm.appendChild(stEl);

  body.appendChild(mm);

  // Bubble
  const bub = document.createElement("div");
  bub.className = "mb";
  bub.onclick = e => {
    if (state.multiSelect) {
      e.preventDefault();
      toggleSelect(m.id, wrap);
    }
  };

  if (m.replyTo) {
    const q = document.createElement("div");
    q.className = "mr";
    q.innerHTML = `<strong>${esc(m.replyTo.name || "?")}</strong> ${esc((m.replyTo.text || "").slice(0, 80))}`;
    q.onclick = () => jumpTo(m.replyTo.id);
    bub.appendChild(q);
  }

  const imgs = m.images || (m.image ? [m.image] : []);
  imgs.forEach(src => {
    const im = document.createElement("img");
    im.src = src; im.loading = "lazy"; im.alt = "imej";
    im.onclick = () => openViewer(src);
    bub.appendChild(im);
  });

  if (m.audio) {
    const au = document.createElement("audio");
    au.src = m.audio; au.controls = true;
    au.style.cssText = "max-width:260px;margin-bottom:6px";
    bub.appendChild(au);
  }

  if (m.sticker) {
    const st = document.createElement("span");
    st.className = "sticker";
    st.textContent = m.sticker;
    bub.appendChild(st);
  }

  if (m.poll) {
    bub.appendChild(renderPoll(m));
  }

  if (m.text && !m.poll) {
    const cap = document.createElement("div");
    cap.className = "cap";
    cap.innerHTML = richText(m.text);
    bub.appendChild(cap);
  }

  body.appendChild(bub);

  // Reactions
  const rxEl = document.createElement("div");
  rxEl.className = "rxs";
  rxEl.dataset.mid = m.id;
  body.appendChild(rxEl);
  renderRx(m.id, rxEl);

  // Actions
  const act = document.createElement("div");
  act.className = "mact";

  const rBtn = document.createElement("button");
  rBtn.title = "Balas"; rBtn.textContent = "↩";
  rBtn.onclick = () => showReply({ id: m.id, name: m.name, text: m.text });
  act.appendChild(rBtn);

  const rxBtn = document.createElement("button");
  rxBtn.title = "Reaksi"; rxBtn.textContent = "☺";
  rxBtn.onclick = e => { e.stopPropagation(); quickRx(m.id, rxBtn); };
  act.appendChild(rxBtn);

  const cpBtn = document.createElement("button");
  cpBtn.title = "Salin"; cpBtn.textContent = "⧉";
  cpBtn.onclick = () => { navigator.clipboard.writeText(m.text || "[imej]").then(() => toast("Disalin!", true)); };
  act.appendChild(cpBtn);

  const pinBtn = document.createElement("button");
  pinBtn.title = "Pin"; pinBtn.textContent = "📌";
  pinBtn.onclick = () => togglePin(m.id);
  act.appendChild(pinBtn);

  const tagBtn = document.createElement("button");
  tagBtn.title = "Tanda"; tagBtn.textContent = "🏷️";
  tagBtn.onclick = () => openTagModal(m.id);
  act.appendChild(tagBtn);

  const transBtn = document.createElement("button");
  transBtn.title = "Terjemah"; transBtn.textContent = "🌐";
  transBtn.onclick = () => openTranslate(m.text || "");
  act.appendChild(transBtn);

  const fwdBtn = document.createElement("button");
  fwdBtn.title = "Pindah"; fwdBtn.textContent = "↪";
  fwdBtn.onclick = () => forwardMsg(m);
  act.appendChild(fwdBtn);

  const archBtn = document.createElement("button");
  archBtn.title = "Arkib"; archBtn.textContent = "📦";
  archBtn.onclick = () => toggleArchive(m.id);
  act.appendChild(archBtn);

  if (isMe) {
    const edBtn = document.createElement("button");
    edBtn.title = "Edit"; edBtn.textContent = "✎";
    edBtn.onclick = () => {
      if (Date.now() - m.ts > CFG.EDIT) { toast("Tempoh edit tamat (5 min)"); return; }
      showEdit({ id: m.id, name: m.name, text: m.text });
    };
    act.appendChild(edBtn);

    const dlBtn = document.createElement("button");
    dlBtn.title = "Padam"; dlBtn.textContent = "🗑";
    dlBtn.onclick = async () => {
      if (!confirm("Padam?")) return;
      try {
        await msgRef.child(m.id).remove();
        await rxRef.child(m.id).remove().catch(() => {});
        toast("Dipadam", true);
      } catch (e) { toast("Gagal: " + e.message); }
    };
    act.appendChild(dlBtn);
  }

  body.appendChild(act);
  wrap.appendChild(av);
  wrap.appendChild(body);
  return wrap;
}

/* ---------- POLL RENDER ---------- */
function renderPoll(m) {
  const poll = m.poll;
  const el = document.createElement("div");
  el.className = "poll";
  const h = document.createElement("h4");
  h.textContent = poll.q;
  el.appendChild(h);
  const votes = poll.votes || {};
  const myVote = votes[myUid];
  const total = Object.keys(votes).length;
  poll.options.forEach((op, i) => {
    const btn = document.createElement("button");
    btn.className = "poll-op" + (myVote === i ? " voted" : "");
    const pct = total ? Math.round((Object.values(votes).filter(v => v === i).length / total) * 100) : 0;
    btn.innerHTML = `<div class="pbar" style="width:${pct}%"></div><div class="ptxt"><span>${esc(op)}</span><span>${pct}%</span></div>`;
    btn.onclick = async () => {
      if (!myUid) return;
      try { await pollRef.child(m.id).child("votes").child(myUid).set(i); }
      catch (e) { toast("Gagal undi: " + e.message); }
    };
    el.appendChild(btn);
  });
  const cnt = document.createElement("div");
  cnt.style.cssText = "font-size:11px;color:var(--txd);margin-top:4px";
  cnt.textContent = total + " undian";
  el.appendChild(cnt);
  return el;
}

/* ---------- REACTIONS ---------- */
function quickRx(mid, anchor) {
  const EM = ["👍","❤️","😂","😮","😢","🔥","🎉","👀","🙏","💯"];
  const ex = document.querySelector(".rxpop");
  if (ex) ex.remove();
  const pop = document.createElement("div");
  pop.className = "rxpop";
  pop.style.cssText = "position:fixed;background:var(--glass2);border:1px solid var(--bd);border-radius:12px;padding:4px;display:flex;gap:2px;backdrop-filter:blur(14px);box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:80";
  EM.forEach(e => {
    const b = document.createElement("button");
    b.textContent = e;
    b.style.cssText = "background:transparent;border:none;font-size:18px;cursor:pointer;padding:4px 6px;border-radius:8px";
    b.onmouseenter = () => b.style.background = "rgba(255,255,255,.12)";
    b.onmouseleave = () => b.style.background = "transparent";
    b.onclick = ev => { ev.stopPropagation(); toggleRx(mid, e); pop.remove(); };
    pop.appendChild(b);
  });
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.min(r.left, window.innerWidth - 340) + "px";
  pop.style.top = Math.max(10, r.top - 50) + "px";
  setTimeout(() => {
    const close = e => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener("click", close); } };
    document.addEventListener("click", close);
  }, 0);
}

async function toggleRx(mid, emoji) {
  if (!myUid) return;
  const ref = rxRef.child(mid).child(emoji).child(myUid);
  const snap = await ref.once("value");
  if (snap.exists()) await ref.remove();
  else await ref.set(Date.now());
}

rxRef.on("value", snap => {
  const all = snap.val() || {};
  Object.entries(all).forEach(([mid, rx]) => {
    if (mid === "read") return;
    const el = document.querySelector(`.rxs[data-mid="${mid}"]`);
    if (el) drawRx(mid, rx, el);
  });
  document.querySelectorAll(".rxs").forEach(el => {
    if (!all[el.dataset.mid]) el.innerHTML = "";
  });
});

function renderRx(mid, el) {
  rxRef.child(mid).once("value").then(s => drawRx(mid, s.val() || {}, el));
}
function drawRx(mid, data, el) {
  el.innerHTML = "";
  Object.entries(data).forEach(([emoji, users]) => {
    if (emoji === "read") return;
    const cnt = Object.keys(users || {}).length;
    if (!cnt) return;
    const mine = users[myUid] ? " mine" : "";
    const pill = document.createElement("span");
    pill.className = "rx" + mine;
    pill.innerHTML = `${emoji} <span class="cnt">${cnt}</span>`;
    pill.onclick = () => toggleRx(mid, emoji);
    el.appendChild(pill);
  });
}

/* ---------- STAR ---------- */
function toggleStar(mid) {
  if (starred[mid]) { delete starred[mid]; toast("Buang bintang"); }
  else { starred[mid] = true; toast("Berbintang", true); }
  saveL("starred", starred);
  const el = document.querySelector(`[data-mid="${mid}"] .mm .star`);
  if (el) { el.classList.toggle("on", !!starred[mid]); el.textContent = starred[mid] ? "★" : "☆"; }
}
$("starredToggle").onclick = () => {
  const ids = Object.keys(starred);
  if (!ids.length) { toast("Tiada mesej berbintang"); return; }
  state.searchRes = ids.map(id => document.querySelector(`[data-mid="${id}"]`)).filter(Boolean);
  if (!state.searchRes.length) { toast("Tiada"); return; }
  state.searchIdx = 0;
  highlightSearch();
};

/* ---------- PIN ---------- */
async function togglePin(mid) {
  const cur = await pinRef.once("value");
  const val = cur.val() || {};
  const e = Object.entries(val).find(([, v]) => v && v.mid === mid);
  if (e) { await pinRef.child(e[0]).remove(); toast("Pin dibuang"); }
  else {
    const m = state.rendered.get(mid);
    if (!m) return;
    await pinRef.push({ mid, name: m.name, text: (m.text || "🖼️").slice(0, 120), ts: Date.now() });
    toast("Dipin", true);
  }
}
pinRef.on("value", snap => {
  const val = snap.val() || {};
  const entries = Object.values(val);
  if (!entries.length) { $("pinnedBar").classList.remove("show"); state.pinnedId = null; return; }
  entries.sort((a, b) => b.ts - a.ts);
  const p = entries[0];
  state.pinnedId = p.mid;
  $("pinnedBar").classList.add("show");
  $("pinnedName").textContent = "📌 " + p.name;
  $("pinnedText").textContent = p.text;
});
$("pinnedJump").onclick = () => { if (state.pinnedId) jumpTo(state.pinnedId); };
$("pinnedClose").onclick = async () => {
  const cur = await pinRef.once("value");
  const val = cur.val() || {};
  const e = Object.entries(val).find(([, v]) => v && v.mid === state.pinnedId);
  if (e) await pinRef.child(e[0]).remove();
};

/* ---------- JUMP ---------- */
function jumpTo(mid) {
  if (!mid) return;
  const el = document.querySelector(`[data-mid="${mid}"]`);
  if (!el) { toast("Tidak dijumpai"); return; }
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("hl");
  void el.offsetWidth;
  el.classList.add("hl");
  setTimeout(() => el.classList.remove("hl"), 1600);
}

/* ---------- SEARCH ---------- */
let searchFilterUid = null;
function filterByUser(uid, name) {
  searchFilterUid = uid;
  state.searchRes = Array.from(document.querySelectorAll(`.msg[data-uid="${uid}"]`));
  $("searchBar").classList.add("show");
  $("searchInput").value = "";
  $("searchInput").placeholder = "Tapis: " + name;
  $("searchCount").textContent = state.searchRes.length + " mesej";
  state.searchIdx = 0;
  if (state.searchRes.length) highlightSearch();
}
function doSearch() {
  const q = $("searchInput").value.trim().toLowerCase();
  const field = $("searchField").value;
  const dateRange = $("searchDate").value;
  const now = Date.now();
  let minTs = 0;
  if (dateRange === "1h") minTs = now - 3600000;
  else if (dateRange === "24h") minTs = now - 86400000;
  else if (dateRange === "7d") minTs = now - 604800000;

  if (!q && !searchFilterUid && !minTs) { toast("Tiada hasil"); return; }
  state.searchRes = Array.from(document.querySelectorAll(".msg")).filter(el => {
    const m = state.rendered.get(el.dataset.mid);
    if (!m) return false;
    if (searchFilterUid && m.uid !== searchFilterUid) return false;
    if (minTs && m.ts < minTs) return false;
    if (!q) return true;
    if (field === "name") return (m.name || "").toLowerCase().includes(q);
    if (field === "text") return (m.text || "").toLowerCase().includes(q);
    return (m.text || "").toLowerCase().includes(q) || (m.name || "").toLowerCase().includes(q);
  });
  $("searchCount").textContent = state.searchRes.length ? `1/${state.searchRes.length}` : "0/0";
  state.searchIdx = 0;
  if (!state.searchRes.length) { toast("Tiada hasil"); return; }
  highlightSearch();
}
function highlightSearch() {
  const el = state.searchRes[state.searchIdx];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("hl");
  void el.offsetWidth;
  el.classList.add("hl");
  setTimeout(() => el.classList.remove("hl"), 1400);
  $("searchCount").textContent = `${state.searchIdx + 1}/${state.searchRes.length}`;
}
$("searchToggle").onclick = () => {
  $("searchBar").classList.toggle("show");
  if ($("searchBar").classList.contains("show")) $("searchInput").focus();
};
$("searchClose").onclick = () => {
  $("searchBar").classList.remove("show");
  searchFilterUid = null; state.searchRes = [];
  $("searchCount").textContent = "0/0";
  $("searchInput").placeholder = "Cari mesej…";
};
$("searchNext").onclick = () => {
  if (!state.searchRes.length) return;
  state.searchIdx = (state.searchIdx + 1) % state.searchRes.length;
  highlightSearch();
};
$("searchPrev").onclick = () => {
  if (!state.searchRes.length) return;
  state.searchIdx = (state.searchIdx - 1 + state.searchRes.length) % state.searchRes.length;
  highlightSearch();
};
$("searchInput").oninput = () => { searchFilterUid = null; doSearch(); };
$("searchInput").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); $("searchNext").click(); } };
$("searchField").onchange = doSearch;
$("searchDate").onchange = doSearch;

/* ---------- SCROLL ---------- */
msgsEl.onscroll = () => {
  const nearB = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 220;
  scrollBtn.classList.toggle("show", !nearB);
  if (nearB) { state.unread = 0; updateBadge(); }
};
scrollBtn.onclick = () => scrollBottom(true);
function scrollBottom(force) {
  const el = msgsEl;
  const nearB = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
  if (force || nearB) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}
function updateBadge() {
  if (state.unread > 0) {
    scrollBdg.classList.remove("hidden");
    scrollBdg.textContent = state.unread > 99 ? "99+" : state.unread;
  } else scrollBdg.classList.add("hidden");
}

/* ---------- VIEWER ---------- */
const viewer = $("viewer"), viewerImg = $("viewerImg");
let zoom = 1, panning = false, panS = { x: 0, y: 0 }, panO = { x: 0, y: 0 };
function openViewer(src) {
  viewerImg.src = src; zoom = 1; panO = { x: 0, y: 0 }; applyZoom();
  viewer.classList.add("show");
}
$("viewerClose").onclick = () => viewer.classList.remove("show");
viewer.onclick = e => { if (e.target === viewer) viewer.classList.remove("show"); };
$("zoomIn").onclick = () => { zoom = Math.min(5, zoom + 0.25); applyZoom(); };
$("zoomOut").onclick = () => { zoom = Math.max(0.25, zoom - 0.25); applyZoom(); };
$("zoomReset").onclick = () => { zoom = 1; panO = { x: 0, y: 0 }; applyZoom(); };
function applyZoom() {
  viewerImg.style.transform = `translate(${panO.x}px,${panO.y}px) scale(${zoom})`;
  $("zoomVal").textContent = Math.round(zoom * 100) + "%";
}
viewerImg.onmousedown = e => { if (zoom <= 1) return; panning = true; panS = { x: e.clientX - panO.x, y: e.clientY - panO.y }; };
window.addEventListener("mousemove", e => { if (!panning) return; panO = { x: e.clientX - panS.x, y: e.clientY - panS.y }; applyZoom(); });
window.addEventListener("mouseup", () => { panning = false; });

/* ---------- EMOJI PICKER ---------- */
const EMOJI = {
  "😀": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔"],
  "👋": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","👊","✊","🤛","🤜","👏","🙌","👐","🤲","🙏","💪"],
  "❤️": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💯","🔥","✨","⭐","🌟","💫","⚡","☄️","🌈","🎉"],
  "🍕": ["🍕","🍔","🍟","🌭","🥪","🌮","🌯","🥙","🧆","🍜","🍝","🍣","🍱","🍛","🍚","🍙","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🍰","🎂","🧁","🍫","🍬"],
  "🐶": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋"],
  "⚽": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🥅","⛳","🏹","🎣","🥊","🥋","🎽","🛹","🛼","🛷","⛸","🥌","🎿"]
};

(function buildEmoji() {
  const tabs = $("emojiTabs"), grid = $("emojiGrid"), recentGrid = $("emojiRecent");
  let curKey = Object.keys(EMOJI)[0];
  Object.keys(EMOJI).forEach((key, i) => {
    const b = document.createElement("button");
    b.textContent = key;
    if (i === 0) b.classList.add("active");
    b.onclick = () => {
      curKey = key;
      tabs.querySelectorAll("button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      drawGrid(key);
    };
    tabs.appendChild(b);
  });
  function drawGrid(key) {
    grid.innerHTML = "";
    EMOJI[key].forEach(e => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = e;
      b.onclick = () => pickEmoji(e);
      grid.appendChild(b);
    });
  }
  drawGrid(curKey);
  function drawRecent() {
    recentGrid.innerHTML = "";
    if (!recentEmojis.length) {
      recentGrid.innerHTML = `<span style="font-size:11px;color:var(--txd);padding:4px">Belum ada</span>`;
      return;
    }
    recentEmojis.slice(0, 16).forEach(e => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = e;
      b.onclick = () => pickEmoji(e);
      recentGrid.appendChild(b);
    });
  }
  drawRecent();
  window.pickEmoji = e => {
    textInput.value += e;
    textInput.focus();
    updateSend(); sendTyp();
    recentEmojis = [e, ...recentEmojis.filter(x => x !== e)].slice(0, 32);
    saveL("recent-emoji", recentEmojis);
    drawRecent();
  };
})();

$("emojiBtn").onclick = e => { e.stopPropagation(); $("emojiPicker").classList.toggle("show"); };
document.addEventListener("click", e => {
  if (!$("emojiPicker").contains(e.target) && e.target !== $("emojiBtn"))
    $("emojiPicker").classList.remove("show");
});

/* ---------- VOICE ---------- */
$("voiceBtn").onclick = toggleRec;
async function toggleRec() {
  if (state.recording) { state.mr.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia) { toast("Rakaman tidak disokong"); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    state.recChunks = []; state.mr = mr; state.recording = true;
    $("voiceBtn").classList.add("rec");
    $("voiceBtn").textContent = "⏹";
    toast("Rakam… tekan ⏹ untuk hantar");
    mr.ondataavailable = e => { if (e.data.size) state.recChunks.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      state.recording = false;
      $("voiceBtn").classList.remove("rec");
      $("voiceBtn").textContent = "🎤";
      if (!state.recChunks.length) return;
      const blob = new Blob(state.recChunks, { type: "audio/webm" });
      if (blob.size > 500000) { toast("Rakaman terlalu besar"); return; }
      const r = new FileReader();
      r.onload = async () => {
        try {
          await msgRef.push({
            uid: myUid, name: myName, ts: Date.now(),
            text: "🎤 Mesej suara", audio: r.result, room: myRoom,
            replyTo: state.replyTo ? { id: state.replyTo.id, name: state.replyTo.name, text: state.replyTo.text || "" } : null
          });
          clearReply();
        } catch (e) { toast("Gagal: " + e.message); }
      };
      r.readAsDataURL(blob);
    };
    mr.start();
  } catch (e) { toast("Gagal: " + e.message); }
}

/* ---------- TTS ---------- */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text.slice(0, 200));
    u.lang = "ms-MY";
    u.rate = 1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ============================================================
   AKHIR BAHAGIAN 1
   ============================================================ */
/* ============================================================
   COSMIC CHAT — app.js
   Bahagian 2 daripada 2 (ciri 73–144)
   Sambungan terus dari Bahagian 1
   ============================================================ */

/* ---------- POLL CREATION ---------- */
$("pollToggle").onclick = () => $("pollModal").classList.remove("hidden");
$("pollCancel").onclick = () => $("pollModal").classList.add("hidden");
$("pollCreate").onclick = async () => {
  const q = $("pollQ").value.trim();
  const ops = $("pollOps").value.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 10);
  if (!q || ops.length < 2) { toast("Perlu soalan dan sekurang-kurangnya 2 pilihan"); return; }
  try {
    await msgRef.push({
      uid: myUid, name: myName, ts: Date.now(), room: myRoom,
      text: "", poll: { q, options: ops, votes: {} }
    });
    $("pollQ").value = ""; $("pollOps").value = "";
    $("pollModal").classList.add("hidden");
    toast("Undian dihantar", true);
  } catch (e) { toast("Gagal: " + e.message); }
};

pollRef.on("child_changed", snap => {
  const mid = snap.key;
  const poll = snap.val();
  const el = document.querySelector(`[data-mid="${mid}"] .poll`);
  if (el && poll) {
    const newEl = renderPoll({ poll });
    el.replaceWith(newEl);
  }
});

/* ---------- TIMER / POMODORO ---------- */
$("timerToggle").onclick = () => $("timerModal").classList.remove("hidden");
$("timerClose").onclick = () => {
  $("timerModal").classList.add("hidden");
  clearInterval(state.countdownInterval);
  clearInterval(state.pomodoroInterval);
};
$("timerStart").onclick = () => {
  const mode = $("timerMode").value;
  if (mode === "pomodoro") startPomodoro();
  else startCountdown(parseInt($("timerMin").value || "5", 10) * 60);
};
$("timerReset").onclick = () => {
  clearInterval(state.countdownInterval);
  clearInterval(state.pomodoroInterval);
  state.countdownSeconds = 0;
  state.pomodoroSeconds = 0;
  updateTimerDisplay(0);
};
$("timerMode").onchange = () => {
  const mode = $("timerMode").value;
  $("timerTitle").textContent = mode === "pomodoro" ? "🍅 Pomodoro" : "⏱️ Pemasa";
};

function updateTimerDisplay(s) {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  $("timerDisplay").textContent = String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}
function startCountdown(seconds) {
  clearInterval(state.countdownInterval);
  clearInterval(state.pomodoroInterval);
  state.countdownSeconds = seconds;
  updateTimerDisplay(seconds);
  state.countdownInterval = setInterval(() => {
    state.countdownSeconds--;
    if (state.countdownSeconds < 0) {
      clearInterval(state.countdownInterval);
      ding(); vibrate([200, 100, 200]);
      toast("⏰ Pemasa tamat!", true);
      return;
    }
    updateTimerDisplay(state.countdownSeconds);
  }, 1000);
}
function startPomodoro() {
  clearInterval(state.countdownInterval);
  clearInterval(state.pomodoroInterval);
  state.pomodoroMode = "work";
  state.pomodoroSeconds = 25 * 60;
  updateTimerDisplay(state.pomodoroSeconds);
  toast("🍅 Pomodoro 25 minit bermula", true);
  state.pomodoroInterval = setInterval(() => {
    state.pomodoroSeconds--;
    if (state.pomodoroSeconds <= 0) {
      if (state.pomodoroMode === "work") {
        state.pomodoroMode = "break";
        state.pomodoroSeconds = 5 * 60;
        toast("☕ Rehat 5 minit", true);
      } else {
        state.pomodoroMode = "work";
        state.pomodoroSeconds = 25 * 60;
        toast("🍅 Kerja 25 minit", true);
      }
      ding(); vibrate([300, 100, 300]);
    }
    updateTimerDisplay(state.pomodoroSeconds);
  }, 1000);
}

/* ---------- TODO KONGSI ---------- */
function openTodo() { $("todoModal").classList.remove("hidden"); renderTodo(); }
$("todoToggle").onclick = openTodo;
$("todoClose").onclick = () => $("todoModal").classList.add("hidden");
$("todoAdd").onclick = async () => {
  const txt = $("todoInput").value.trim();
  if (!txt) return;
  $("todoInput").value = "";
  try { await todoRef.push({ text: txt, by: myName, done: false, ts: Date.now() }); }
  catch (e) { toast("Gagal: " + e.message); }
};
$("todoInput").onkeydown = e => { if (e.key === "Enter") $("todoAdd").click(); };

function renderTodo() {
  todoRef.once("value").then(snap => {
    const val = snap.val() || {};
    const list = $("todoList");
    list.innerHTML = "";
    const entries = Object.entries(val).sort((a, b) => a[1].ts - b[1].ts);
    if (!entries.length) {
      list.innerHTML = `<p style="font-size:12px;color:var(--txd);text-align:center;padding:10px">Tiada tugasan</p>`;
      return;
    }
    entries.forEach(([id, t]) => {
      const div = document.createElement("div");
      div.className = "todo-item" + (t.done ? " done" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = !!t.done;
      cb.onchange = () => todoRef.child(id).update({ done: cb.checked });
      const sp = document.createElement("span");
      sp.style.flex = "1";
      sp.textContent = t.text;
      const del = document.createElement("button");
      del.textContent = "✕";
      del.style.cssText = "background:transparent;border:none;color:var(--dg);cursor:pointer;font-size:14px";
      del.onclick = () => todoRef.child(id).remove();
      div.appendChild(cb); div.appendChild(sp); div.appendChild(del);
      list.appendChild(div);
    });
  });
}
todoRef.on("value", () => { if (!$("todoModal").classList.contains("hidden")) renderTodo(); });

/* ---------- NOTES KONGSI ---------- */
function openNotes() {
  $("notesModal").classList.remove("hidden");
  notesRef.once("value").then(s => { $("notesText").value = s.val() || ""; });
}
$("notesToggle").onclick = openNotes;
$("notesClose").onclick = () => $("notesModal").classList.add("hidden");
$("notesSave").onclick = async () => {
  try { await notesRef.set($("notesText").value); toast("Nota disimpan", true); }
  catch (e) { toast("Gagal: " + e.message); }
};

/* ---------- BILIK (ROOMS) ---------- */
$("roomsToggle").onclick = () => { $("roomsModal").classList.remove("hidden"); renderRooms(); };
$("roomClose").onclick = () => $("roomsModal").classList.add("hidden");
$("roomJoin").onclick = () => {
  const r = $("roomInput").value.trim().toLowerCase();
  if (!r) return;
  $("roomInput").value = "";
  joinRoom(r);
  $("roomsModal").classList.add("hidden");
};
$("roomInput").onkeydown = e => { if (e.key === "Enter") $("roomJoin").click(); };

function joinRoom(name) {
  myRoom = name || "utama";
  $("roomLabel").textContent = myRoom;
  localStorage.setItem("c-room", myRoom);
  msgsEl.innerHTML = "";
  state.rendered.clear();
  renderedIds.clear();
  renderOrder.length = 0;
  msgRef.limitToLast(CFG.LIMIT).once("value", snap => {
    const val = snap.val() || {};
    const arr = Object.entries(val).filter(([, m]) => (m.room || "utama") === myRoom).sort((a, b) => a[1].ts - b[1].ts);
    arr.forEach(([id, m]) => {
      markR(id);
      const el = createMsgEl({ id, ...m });
      msgsEl.appendChild(el);
      state.rendered.set(id, { id, ...m });
    });
    scrollBottom(true);
  });
  if (myPresRef) myPresRef.update({ room: myRoom }).catch(() => {});
  toast("Bilik: " + myRoom, true);
}

function renderRooms() {
  roomRef.once("value").then(snap => {
    const val = snap.val() || {};
    const list = $("roomList");
    list.innerHTML = "";
    const names = new Set(["utama", ...Object.keys(val)]);
    names.forEach(n => {
      const d = document.createElement("div");
      d.className = "ui";
      d.innerHTML = `<span style="font-size:18px">🚪</span><span class="unm">${esc(n)}</span>`;
      d.onclick = () => { joinRoom(n); $("roomsModal").classList.add("hidden"); };
      list.appendChild(d);
    });
  });
}

/* ---------- DM (PRIVATE MESSAGE) ---------- */
function openDM(uid, name) {
  state.dmTarget = { uid, name };
  $("dmTarget").textContent = "Kepada: " + name;
  $("dmText").value = "";
  $("dmModal").classList.remove("hidden");
}
$("upDM") && ($("upDM").onclick = () => {});
$("dmClose").onclick = () => $("dmModal").classList.add("hidden");
$("dmSend").onclick = async () => {
  const t = $("dmText").value.trim();
  if (!t || !state.dmTarget) return;
  try {
    await dmRef.child(state.dmTarget.uid).push({
      from: myUid, fromName: myName,
      text: t, ts: Date.now()
    });
    $("dmText").value = "";
    toast("Dihantar ke " + state.dmTarget.name, true);
  } catch (e) { toast("Gagal: " + e.message); }
};

dmRef.child(myUid || "anon").on("child_added", snap => {
  const m = snap.val();
  if (!m) return;
  if (Date.now() - m.ts < 5000) {
    ding(); vibrate(100);
    toast("💬 " + m.fromName + ": " + m.text.slice(0, 40), true);
  }
});

/* ---------- PANGGILAN (VIDEO) ---------- */
async function startCall(uid) {
  $("callModal").classList.remove("hidden");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    state.callStream = stream;
    $("callVideo").srcObject = stream;
    const p = state.userCache[uid];
    toast("📞 Memanggil " + (p ? p.name : "pengguna") + "…");
  } catch (e) {
    toast("Kamera tidak dibenarkan: " + e.message);
    $("callModal").classList.add("hidden");
  }
}
$("callEnd").onclick = () => {
  if (state.callStream) {
    state.callStream.getTracks().forEach(t => t.stop());
    state.callStream = null;
  }
  $("callVideo").srcObject = null;
  $("callModal").classList.add("hidden");
};

/* ---------- TIC-TAC-TOE ---------- */
$("gameToggle").onclick = () => $("tttModal").classList.remove("hidden");
$("tttClose").onclick = () => $("tttModal").classList.add("hidden");
$("tttBoard").onclick = e => {
  const b = e.target.closest("button");
  if (!b || state.tttBoard[b.dataset.i]) return;
  if (state.tttTurn !== "X") return;
  state.tttBoard[b.dataset.i] = "X";
  b.textContent = "X";
  state.tttTurn = "O";
  $("tttStatus").textContent = "Giliran O";
  if (checkTTT("X")) return;
  if (state.tttBoard.every(x => x)) { $("tttStatus").textContent = "Seri!"; return; }
  setTimeout(() => aiTTT(), 400);
};
function aiTTT() {
  const empty = state.tttBoard.map((v, i) => v ? null : i).filter(x => x !== null);
  if (!empty.length) return;
  const choice = empty[Math.floor(Math.random() * empty.length)];
  state.tttBoard[choice] = "O";
  const b = document.querySelector(`#tttBoard button[data-i="${choice}"]`);
  if (b) b.textContent = "O";
  state.tttTurn = "X";
  $("tttStatus").textContent = "Giliran anda (X)";
  if (checkTTT("O")) return;
  if (state.tttBoard.every(x => x)) $("tttStatus").textContent = "Seri!";
}
function checkTTT(p) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, b, c] of wins) {
    if (state.tttBoard[a] === p && state.tttBoard[b] === p && state.tttBoard[c] === p) {
      $("tttStatus").textContent = p + " menang!";
      setTimeout(() => $("tttReset").click(), 1200);
      return true;
    }
  }
  return false;
}
$("tttReset").onclick = () => {
  state.tttBoard = Array(9).fill(null);
  state.tttTurn = "X";
  $$("#tttBoard button").forEach(b => b.textContent = "");
  $("tttStatus").textContent = "Giliran anda (X)";
};

/* ---------- STATISTIK ---------- */
function showStats() {
  const msgs = Array.from(state.rendered.values());
  const total = msgs.length;
  const mine = msgs.filter(m => m.uid === myUid).length;
  const images = msgs.filter(m => (m.images || m.image) && (m.images || [m.image]).length).length;
  const audio = msgs.filter(m => m.audio).length;
  const polls = msgs.filter(m => m.poll).length;
  const dayMs = 24 * 60 * 60 * 1000;
  const today = msgs.filter(m => Date.now() - m.ts < dayMs).length;
  const week = msgs.filter(m => Date.now() - m.ts < 7 * dayMs).length;

  // Per user
  const perUser = {};
  msgs.forEach(m => { perUser[m.name] = (perUser[m.name] || 0) + 1; });
  const topUsers = Object.entries(perUser).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Per hour heatmap
  const hourly = Array(24).fill(0);
  msgs.forEach(m => { hourly[new Date(m.ts).getHours()]++; });
  const maxHourly = Math.max(1, ...hourly);

  // Word cloud
  const wordCount = {};
  msgs.forEach(m => {
    if (!m.text) return;
    m.text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).forEach(w => {
      if (w.length < 3) return;
      wordCount[w] = (wordCount[w] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 20);
  const maxWord = topWords.length ? topWords[0][1] : 1;

  const html = `
    <div class="stat-row"><span>Jumlah mesej</span><strong>${total}</strong></div>
    <div class="stat-row"><span>Mesej saya</span><strong>${mine}</strong></div>
    <div class="stat-row"><span>Hari ini</span><strong>${today}</strong></div>
    <div class="stat-row"><span>Minggu ini</span><strong>${week}</strong></div>
    <div class="stat-row"><span>Imej</span><strong>${images}</strong></div>
    <div class="stat-row"><span>Audio</span><strong>${audio}</strong></div>
    <div class="stat-row"><span>Undian</span><strong>${polls}</strong></div>
    <h3 style="margin-top:14px;font-size:12px">Pengguna Teratas</h3>
    ${topUsers.map(([n, c]) => `<div class="stat-row"><span>${esc(n)}</span><strong>${c}</strong></div>`).join("")}
    <h3 style="margin-top:14px;font-size:12px">Aktiviti Per Jam</h3>
    <div class="hm">${hourly.map((c, i) => `<div title="${i}:00 — ${c} mesej" style="background:rgba(124,92,255,${c / maxHourly * 0.9 + 0.05})"></div>`).join("")}</div>
    <h3 style="margin-top:14px;font-size:12px">Word Cloud</h3>
    <div class="wc">${topWords.map(([w, c]) => `<span style="font-size:${11 + (c / maxWord) * 8}px">${esc(w)}</span>`).join("")}</div>
  `;
  $("statsBody").innerHTML = html;
  $("statsModal").classList.remove("hidden");
}
$("statsBtn").onclick = showStats;
$("statsClose").onclick = () => $("statsModal").classList.add("hidden");

/* ---------- MULTI-SELECT ---------- */
function toggleSelect(mid, wrapEl) {
  if (state.selected.has(mid)) {
    state.selected.delete(mid);
    wrapEl.classList.remove("selected");
  } else {
    state.selected.add(mid);
    wrapEl.classList.add("selected");
  }
  updateMselBar();
}
function updateMselBar() {
  const n = state.selected.size;
  $("mselCount").textContent = n + " dipilih";
  $("mselBar").classList.toggle("show", state.multiSelect);
  if (!state.multiSelect) return;
}
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "a" && document.activeElement !== textInput) {
    e.preventDefault();
    state.multiSelect = true;
    state.selected.clear();
    document.querySelectorAll(".msg").forEach(el => {
      state.selected.add(el.dataset.mid);
      el.classList.add("selected");
    });
    updateMselBar();
  }
});
$("mselCancel").onclick = () => {
  state.multiSelect = false;
  state.selected.clear();
  document.querySelectorAll(".msg.selected").forEach(el => el.classList.remove("selected"));
  updateMselBar();
};
$("mselCopy").onclick = () => {
  const texts = Array.from(state.selected).map(id => {
    const m = state.rendered.get(id);
    return m ? `${m.name}: ${m.text || "[imej]"}` : "";
  }).filter(Boolean).join("\n");
  navigator.clipboard.writeText(texts).then(() => { toast("Disalin " + state.selected.size + " mesej", true); $("mselCancel").click(); });
};
$("mselDelete").onclick = async () => {
  const ids = Array.from(state.selected).filter(id => {
    const m = state.rendered.get(id);
    return m && m.uid === myUid;
  });
  if (!ids.length) { toast("Tiada mesej sendiri dipilih"); return; }
  if (!confirm("Padam " + ids.length + " mesej?")) return;
  for (const id of ids) {
    try { await msgRef.child(id).remove(); } catch (e) {}
  }
  $("mselCancel").click();
  toast("Dipadam", true);
};
$("mselForward").onclick = async () => {
  const ids = Array.from(state.selected);
  if (!ids.length) return;
  if (!confirm("Pindah " + ids.length + " mesej ke bilik semasa?")) return;
  for (const id of ids) {
    const m = state.rendered.get(id);
    if (!m) continue;
    try {
      await msgRef.push({
        uid: myUid, name: myName, text: m.text || "",
        images: m.images || (m.image ? [m.image] : []),
        audio: m.audio || null, room: myRoom, forwarded: true,
        forwardedFrom: m.name, ts: Date.now()
      });
    } catch (e) {}
  }
  $("mselCancel").click();
  toast("Dipindah", true);
};
$("mselArchive").onclick = () => {
  const ids = Array.from(state.selected);
  archived = [...new Set([...archived, ...ids])];
  saveL("archived", archived);
  $("mselCancel").click();
  renderAll();
  toast("Diarkibkan", true);
};

function forwardMsg(m) {
  if (!confirm("Pindah mesej ini ke bilik semasa?")) return;
  msgRef.push({
    uid: myUid, name: myName, text: m.text || "",
    images: m.images || (m.image ? [m.image] : []),
    audio: m.audio || null, room: myRoom, forwarded: true,
    forwardedFrom: m.name, ts: Date.now()
  }).then(() => toast("Dipindah", true)).catch(e => toast("Gagal: " + e.message));
}
function toggleArchive(mid) {
  if (archived.includes(mid)) {
    archived = archived.filter(x => x !== mid);
    toast("Buang dari arkib", true);
  } else {
    archived.push(mid);
    toast("Diarkibkan", true);
  }
  saveL("archived", archived);
  renderAll();
}

/* ---------- RENDER ALL ---------- */
function renderAll() {
  msgsEl.innerHTML = "";
  const all = Array.from(state.rendered.values()).sort((a, b) => a.ts - b.ts);
  all.forEach(m => {
    if (m.uid && blocked[m.uid]) return;
    if (archived.includes(m.id)) return;
    if (m.room && m.room !== myRoom) return;
    msgsEl.appendChild(createMsgEl(m));
  });
  scrollBottom(true);
}

/* ---------- TAG MESEJ ---------- */
let tagTarget = null;
const TAG_COLORS = ["#7c5cff", "#22d3ee", "#22c55e", "#f59e0b", "#ff6b6b", "#ec4899", "#a855f7", "#eab308"];
let selectedTagColor = TAG_COLORS[0];

function openTagModal(mid) {
  tagTarget = mid;
  $("tagModal").classList.remove("hidden");
  const colorsEl = $("tagColors");
  colorsEl.innerHTML = "";
  TAG_COLORS.forEach(c => {
    const d = document.createElement("div");
    d.style.cssText = `width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c === selectedTagColor ? "var(--tx)" : "transparent"}`;
    d.onclick = () => {
      selectedTagColor = c;
      colorsEl.querySelectorAll("div").forEach(x => x.style.borderColor = "transparent");
      d.style.borderColor = "var(--tx)";
    };
    colorsEl.appendChild(d);
  });
  const existing = tagsMap[mid];
  $("tagInput").value = existing && existing.length ? existing[0].name : "";
}
$("tagClose").onclick = () => $("tagModal").classList.add("hidden");
$("tagSave").onclick = () => {
  const name = $("tagInput").value.trim().slice(0, 20);
  if (!name) { toast("Nama kosong"); return; }
  if (!tagsMap[tagTarget]) tagsMap[tagTarget] = [];
  tagsMap[tagTarget] = [{ name, color: selectedTagColor }];
  saveL("tags", tagsMap);
  $("tagModal").classList.add("hidden");
  renderAll();
  toast("Tanda disimpan", true);
};

/* ---------- TERJEMAH ---------- */
let translateText = "";
function openTranslate(text) {
  translateText = text;
  $("translateSrc").textContent = text.slice(0, 200);
  $("translateResult").textContent = "";
  $("translateModal").classList.remove("hidden");
}
$("translateClose").onclick = () => $("translateModal").classList.add("hidden");
$("translateGo").onclick = async () => {
  if (!translateText) return;
  const target = $("translateLang").value;
  $("translateResult").textContent = "Menterjemah…";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateText.slice(0, 500))}&langpair=auto|${target}`;
    const r = await fetch(url);
    const d = await r.json();
    const t = d.responseData?.translatedText || "(tiada hasil)";
    $("translateResult").textContent = t;
  } catch (e) {
    $("translateResult").textContent = "Ralat: " + e.message;
  }
};

/* ---------- QUICK TOOLS ---------- */
$("quickToggle").onclick = () => $("quickBar").classList.toggle("hidden");
document.querySelectorAll("#quickBar button").forEach(b => {
  b.onclick = () => quickTool(b.dataset.tool);
});

async function quickTool(name) {
  switch (name) {
    case "calc": {
      const e = prompt("Kalkulator (contoh: 2+2*3)");
      if (!e) return;
      try { const r = Function('"use strict";return(' + e + ')')(); sendSpecial(`🧮 ${e} = ${r}`); }
      catch (err) { toast("Ralat: " + err.message); }
      break;
    }
    case "weather": {
      const c = prompt("Nama bandar", "Kuala Lumpur");
      if (!c) return;
      try {
        const r = await fetch(`https://wttr.in/${encodeURIComponent(c)}?format=%C+%t+%h+%w`);
        const t = await r.text();
        sendSpecial(`🌤️ Cuaca ${c}: ${t}`);
      } catch (e) { toast("Gagal: " + e.message); }
      break;
    }
    case "worldclock": {
      const cities = [
        { n: "KL", tz: "Asia/Kuala_Lumpur" },
        { n: "London", tz: "Europe/London" },
        { n: "NYC", tz: "America/New_York" },
        { n: "Tokyo", tz: "Asia/Tokyo" },
        { n: "Dubai", tz: "Asia/Dubai" }
      ];
      const lines = cities.map(c => {
        const t = new Date().toLocaleTimeString("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit" });
        return `${c.n}: ${t}`;
      }).join(" | ");
      sendSpecial("🌍 " + lines);
      break;
    }
    case "qr": {
      const t = prompt("Teks untuk QR");
      if (t) generateQR(t);
      break;
    }
    case "meme": {
      const top = prompt("Teks atas");
      if (top === null) return;
      const bot = prompt("Teks bawah");
      if (bot === null) return;
      const text = `https://api.memegen.link/images/buzz/${encodeURIComponent(top)}/${encodeURIComponent(bot)}.png`;
      sendSpecial(`🎨 Meme: ${text}`);
      break;
    }
    case "ocr": {
      const f = prompt("Pilih fail imej dulu. OCR dalam pelayar memerlukan Tesseract.js. Buka https://tesseract.projectnaptha.com untuk OCR.");
      break;
    }
    case "convert": {
      const val = parseFloat(prompt("Nilai untuk tukar", "1"));
      if (isNaN(val)) return;
      const res = [
        `${val} m = ${(val * 3.28084).toFixed(2)} ft`,
        `${val} kg = ${(val * 2.20462).toFixed(2)} lb`,
        `${val} km = ${(val * 0.621371).toFixed(2)} mi`,
        `${val} °C = ${(val * 9 / 5 + 32).toFixed(2)} °F`
      ].join("\n");
      sendSpecial("📐 Tukar Unit:\n" + res);
      break;
    }
    case "currency": {
      const amt = parseFloat(prompt("Jumlah MYR", "1"));
      if (isNaN(amt)) return;
      try {
        const r = await fetch("https://open.er-api.com/v6/latest/MYR");
        const d = await r.json();
        const rates = d.rates || {};
        const lines = [
          `${amt} MYR = ${(amt * (rates.USD || 0)).toFixed(2)} USD`,
          `${amt} MYR = ${(amt * (rates.SGD || 0)).toFixed(2)} SGD`,
          `${amt} MYR = ${(amt * (rates.EUR || 0)).toFixed(2)} EUR`,
          `${amt} MYR = ${(amt * (rates.JPY || 0)).toFixed(0)} JPY`
        ].join("\n");
        sendSpecial("💱 " + lines);
      } catch (e) { toast("Gagal: " + e.message); }
      break;
    }
    case "translate": {
      openTranslate("Hello world");
      break;
    }
    case "whiteboard": {
      openWhiteboard();
      break;
    }
  }
}
$("quickBar").classList.add("hidden");

function generateQR(text) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  sendSpecial(`📱 QR: ${text}\n${url}`);
}

/* ---------- WHITEBOARD ---------- */
function openWhiteboard() {
  const w = window.open("", "_blank", "width=800,height=600");
  if (!w) { toast("Popup disekat"); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>Papan Putih</title>
  <style>body{margin:0;background:#111;overflow:hidden}canvas{cursor:crosshair;display:block}
  .bar{position:fixed;top:10px;left:10px;display:flex;gap:6px;background:#222;padding:8px;border-radius:10px}
  .bar button{padding:6px 10px;border-radius:6px;border:1px solid #444;background:#333;color:#fff;cursor:pointer}
  .bar input{width:40px;height:34px;border:none;background:transparent;cursor:pointer}
  </style></head><body>
  <div class="bar">
    <input type="color" id="col" value="#7c5cff">
    <input type="range" id="sz" min="1" max="40" value="4">
    <button id="clr">Kosong</button>
    <button id="save">Simpan PNG</button>
  </div>
  <canvas id="c"></canvas>
  <script>
  const c=document.getElementById('c'),ctx=c.getContext('2d');
  function r(){c.width=innerWidth;c.height=innerHeight}
  r();addEventListener('resize',()=>{r();});
  let drawing=false;
  c.onmousedown=e=>{drawing=true;ctx.beginPath();ctx.moveTo(e.clientX,e.clientY)};
  c.onmousemove=e=>{if(!drawing)return;ctx.strokeStyle=document.getElementById('col').value;ctx.lineWidth=document.getElementById('sz').value;ctx.lineCap='round';ctx.lineTo(e.clientX,e.clientY);ctx.stroke()};
  c.onmouseup=()=>drawing=false;
  document.getElementById('clr').onclick=()=>ctx.clearRect(0,0,c.width,c.height);
  document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.download='papan-putih.png';a.href=c.toDataURL();a.click()};
  <\/script></body></html>`);
  w.document.close();
}

/* ---------- BACKUP / RESTORE / EXPORT ---------- */
$("backupBtn").onclick = () => {
  const data = {
    version: 5,
    exportedAt: Date.now(),
    messages: Array.from(state.rendered.values()),
    starred, blocked, muted, recent, tagsMap, archived,
    profile: { name: myName, bio: myBio, avatar: myAvatar, status: myStatus }
  };
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `cosmic-backup-${Date.now()}.json`);
  toast("Backup dimuat turun", true);
};
$("restoreBtn").onclick = () => $("restoreInput").click();
$("restoreInput").onchange = async () => {
  const f = $("restoreInput").files[0];
  $("restoreInput").value = "";
  if (!f) return;
  try {
    const text = await f.text();
    const data = JSON.parse(text);
    if (data.starred) { starred = data.starred; saveL("starred", starred); }
    if (data.blocked) { blocked = data.blocked; saveL("blocked", blocked); }
    if (data.muted) { muted = data.muted; saveL("muted", muted); }
    if (data.tagsMap) { tagsMap = data.tagsMap; saveL("tags", tagsMap); }
    if (data.archived) { archived = data.archived; saveL("archived", archived); }
    toast("Restore berjaya", true);
    renderAll();
  } catch (e) { toast("Fail tidak sah: " + e.message); }
};

$("exportBtn").onclick = () => {
  const msgs = Array.from(state.rendered.values()).sort((a, b) => a.ts - b.ts);
  const lines = msgs.map(m => {
    const dt = new Date(m.ts).toISOString();
    const img = (m.images || (m.image ? [m.image] : [])).length ? " [imej]" : "";
    const aud = m.audio ? " [audio]" : "";
    const pol = m.poll ? ` [undian: ${m.poll.q}]` : "";
    return `[${dt}] ${m.name}: ${m.text || ""}${img}${aud}${pol}`;
  }).join("\n");
  downloadBlob(new Blob([lines], { type: "text/plain;charset=utf-8" }), `cosmic-chat-${Date.now()}.txt`);
  toast("TXT dieksport", true);
};
$("exportJsonBtn").onclick = () => {
  const msgs = Array.from(state.rendered.values()).sort((a, b) => a.ts - b.ts);
  downloadBlob(new Blob([JSON.stringify(msgs, null, 2)], { type: "application/json" }), `cosmic-chat-${Date.now()}.json`);
  toast("JSON dieksport", true);
};
$("printBtn").onclick = () => {
  const msgs = Array.from(state.rendered.values()).sort((a, b) => a.ts - b.ts);
  const w = window.open("", "_blank");
  if (!w) { toast("Popup disekat"); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>Cosmic Chat</title>
  <style>body{font-family:system-ui;padding:20px;max-width:800px;margin:auto}
  .msg{margin-bottom:12px;page-break-inside:avoid}
  .name{font-weight:700;color:#5b3fd1}
  .time{color:#888;font-size:11px;margin-left:6px}
  .text{margin-top:2px;white-space:pre-wrap}
  img{max-width:100%;border-radius:8px;margin-top:4px}
  </style></head><body>
  <h1>Cosmic Chat — ${esc(myRoom)}</h1>
  <p style="color:#888;font-size:12px">Dicetak: ${new Date().toLocaleString("ms-MY")}</p>
  ${msgs.map(m => `
    <div class="msg">
      <div><span class="name">${esc(m.name)}</span><span class="time">${fmtFull(m.ts)}</span></div>
      <div class="text">${esc(m.text || "")}</div>
      ${(m.images || (m.image ? [m.image] : [])).map(s => `<img src="${s}">`).join("")}
    </div>
  `).join("")}
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
};
$("downloadMediaBtn").onclick = async () => {
  const msgs = Array.from(state.rendered.values());
  let count = 0;
  for (const m of msgs) {
    const imgs = m.images || (m.image ? [m.image] : []);
    for (let i = 0; i < imgs.length; i++) {
      try {
        const a = document.createElement("a");
        a.href = imgs[i];
        a.download = `cosmic-${m.id}-${i}.jpg`;
        document.body.appendChild(a); a.click(); a.remove();
        count++;
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {}
    }
  }
  toast(count + " fail dimuat turun", true);
};

/* ---------- SETTINGS BINDING ---------- */
$("settingsToggle").onclick = () => $("settingsModal").classList.remove("hidden");
$("settingsClose").onclick = () => $("settingsModal").classList.add("hidden");
$$("[data-set]").forEach(btn => {
  btn.onclick = () => {
    const k = btn.dataset.set, v = btn.dataset.val;
    if (k === "theme") prefs.theme = v;
    else if (k === "density") prefs.density = v;
    else if (k === "contrast") prefs.contrast = v;
    savePrefs(); applyPrefs();
  };
});
$("soundToggle").onclick = () => { prefs.sound = !prefs.sound; savePrefs(); applyPrefs(); };
$("dndToggle").onclick = () => { prefs.dnd = !prefs.dnd; savePrefs(); applyPrefs(); };
$("tsToggle").onclick = () => { prefs.timestamps = !prefs.timestamps; savePrefs(); applyPrefs(); renderAll(); };
$("vibrateToggle").onclick = () => { prefs.vibrate = !prefs.vibrate; savePrefs(); applyPrefs(); };
$("censorToggle").onclick = () => { prefs.censor = !prefs.censor; savePrefs(); applyPrefs(); renderAll(); };
$("ttsToggle").onclick = () => { prefs.tts = !prefs.tts; savePrefs(); applyPrefs(); };
$("autoAwayToggle").onclick = () => { prefs.autoAway = !prefs.autoAway; savePrefs(); applyPrefs(); startPres(); };
$("notifBtn").onclick = reqNotif;
$("fontSizeRange").oninput = e => {
  prefs.fontSize = parseInt(e.target.value, 10);
  $("fontSizeVal").textContent = prefs.fontSize;
  document.documentElement.style.setProperty("--fs", prefs.fontSize + "px");
  savePrefs();
};
$("langSelect").onchange = e => { prefs.lang = e.target.value; savePrefs(); applyPrefs(); };
$("shortcutsBtn").onclick = () => $("shortcutsModal").classList.remove("hidden");
$("shortcutsClose").onclick = () => $("shortcutsModal").classList.add("hidden");

/* ---------- KEYBOARD SHORTCUTS ---------- */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    viewer.classList.remove("show");
    $$(".md").forEach(m => m.classList.add("hidden"));
    $("emojiPicker").classList.remove("show");
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); $("searchBar").classList.add("show"); $("searchInput").focus(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); toggleSidebar(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === "j") {
    e.preventDefault();
    const themes = ["dark", "light", "neon", "retro", "pastel", "mono"];
    const i = themes.indexOf(prefs.theme);
    prefs.theme = themes[(i + 1) % themes.length];
    savePrefs(); applyPrefs();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "e") { e.preventDefault(); $("emojiPicker").classList.toggle("show"); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); $("timerModal").classList.remove("hidden"); startPomodoro(); return; }
  if (e.key === "/" && document.activeElement !== textInput) { e.preventDefault(); textInput.focus(); return; }
  if (e.key === "r" && document.activeElement !== textInput) {
    if (state.lastMsgId) {
      const m = state.rendered.get(state.lastMsgId);
      if (m) showReply({ id: m.id, name: m.name, text: m.text });
    }
  }
  if (e.key === "e" && document.activeElement !== textInput) {
    if (state.lastOwnId) {
      const m = state.rendered.get(state.lastOwnId);
      if (m) showEdit({ id: m.id, name: m.name, text: m.text });
    }
  }
});

/* ---------- SIDEBAR ---------- */
function toggleSidebar() {
  const sb = $("sidebar");
  if (window.innerWidth <= 760) {
    sb.classList.toggle("mopen");
    $("sidebarOverlay").classList.toggle("show", sb.classList.contains("mopen"));
  } else sb.classList.toggle("hidden");
}
$("sidebarToggle").onclick = toggleSidebar;
$("sidebarOverlay").onclick = () => {
  $("sidebar").classList.remove("mopen");
  $("sidebarOverlay").classList.remove("show");
};

/* ---------- RECENT ---------- */
function pushRecent(uid, name) {
  recent = recent.filter(r => r.uid !== uid);
  recent.unshift({ uid, name, ts: Date.now() });
  recent = recent.slice(0, 8);
  saveL("recent", recent);
  renderRecent();
}
function renderRecent() {
  const el = $("recentList");
  el.innerHTML = "";
  if (!recent.length) {
    el.innerHTML = `<p style="font-size:11.5px;color:var(--txd);padding:6px">—</p>`;
    return;
  }
  recent.forEach(r => {
    const d = document.createElement("div");
    d.className = "ui";
    const av = document.createElement("div");
    av.className = "uav";
    av.textContent = initOf(r.name);
    av.style.background = colorOf(r.name);
    const nm = document.createElement("div");
    nm.className = "unm";
    nm.textContent = r.name;
    d.appendChild(av); d.appendChild(nm);
    d.onclick = () => openUserProfile(r.uid, r.name);
    el.appendChild(d);
  });
}

/* ---------- BOOT ---------- */
(function boot() {
  applyPrefs();
  renderRecent();

  myUid = localStorage.getItem("c-uid");
  if (!myUid) { myUid = genId(); localStorage.setItem("c-uid", myUid); }

  const sName = localStorage.getItem("c-name");
  const sAv = localStorage.getItem("c-avatar");
  const sBio = localStorage.getItem("c-bio");
  const sRoom = localStorage.getItem("c-room");
  if (sAv) myAvatar = sAv;
  if (sBio) myBio = sBio;
  if (sRoom) { myRoom = sRoom; $("roomLabel").textContent = myRoom; }

  if (sName && sanN(sName).length >= 2) {
    myName = sanN(sName);
    $("app").style.display = "flex";
    applyId();
    startPres();
    writeProfile();
    if (drafts[myUid]) textInput.value = drafts[myUid];

    // Warn on unsaved draft
    window.addEventListener("beforeunload", e => {
      if (textInput.value.trim()) { e.preventDefault(); e.returnValue = ""; }
    });
  } else {
    openName();
  }
})();

window.addEventListener("pagehide", () => {
  if (presHB) clearInterval(presHB);
  if (myPresRef) myPresRef.remove().catch(() => {});
  stopTyp();
  clearInterval(state.pomodoroInterval);
  clearInterval(state.countdownInterval);
});

/* ============================================================
   AKHIR app.js — 144 ciri lengkap
   ============================================================ */