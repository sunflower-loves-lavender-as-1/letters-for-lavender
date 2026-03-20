/* ═══════════════════════════════════════════════════════
   PASSWORD
═══════════════════════════════════════════════════════ */
const STORED_HASH = "98b81c2ffe9cda3ef02a4a361153ef585fd17646c5c87dca7f06b7bc555b2842";

async function sha256(msg) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function tryUnlock() {
    const val = document.getElementById("pw-input").value;
    if ((await sha256(val)) === STORED_HASH) {
        document.getElementById("lock-screen").classList.add("unlocking");
        setTimeout(() => {
            document.getElementById("lock-screen").style.display = "none";
            document.getElementById("main").classList.add("visible");
            onUnlock();
        }, 800);
    } else {
        const inp = document.getElementById("pw-input");
        inp.classList.add("error");
        document.getElementById("lock-err").classList.add("show");
        setTimeout(() => { inp.classList.remove("error"); document.getElementById("lock-err").classList.remove("show"); }, 2200);
    }
}
function toggleEye() {
    const i = document.getElementById("pw-input");
    i.type = i.type === "password" ? "text" : "password";
}

/* ═══════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════ */
function onUnlock() {
    initPetals();
    loadLetters();
    loadVlogs();
    loadPlaylist();
    if (window.ytMusicAPIReady) initMusicPlayer();
}

/* ═══════════════════════════════════════════════════════
   PETALS
═══════════════════════════════════════════════════════ */
function initPetals() {
    const c = document.getElementById("petals");
    const cols = ["var(--lav-200)", "var(--lav-300)", "#e8d5f5", "#d4b8f0"];
    for (let i = 0; i < 20; i++) {
        const p = document.createElement("div"); p.className = "petal";
        p.style.cssText = `left:${Math.random() * 100}%;width:${8 + Math.random() * 10}px;height:${12 + Math.random() * 14}px;background:${cols[~~(Math.random() * 4)]};animation-duration:${8 + Math.random() * 12}s;animation-delay:${Math.random() * 12}s`;
        c.appendChild(p);
    }
}

/* ═══════════════════════════════════════════════════════
   TABS
═══════════════════════════════════════════════════════ */
function switchTab(name, idx) {
    document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    document.getElementById("tab-" + name).classList.add("active");
    document.querySelectorAll(".nav-tab")[idx].classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ═══════════════════════════════════════════════════════
   LETTER SYSTEM  —  template-based rendering
═══════════════════════════════════════════════════════ */
async function loadLetters() {
    const feed = document.getElementById("letters-feed");
    try {
        const res = await fetch("data/letters.json?_=" + Date.now());
        const data = await res.json();
        const letters = data.letters || [];
        if (!letters.length) {
            feed.innerHTML = '<p class="vlog-empty">No letters yet — check back soon 💜</p>';
            return;
        }
        feed.innerHTML = "";
        // Load all templates needed, then render
        const needed = [...new Set(letters.map(l => l.template || "classic"))];
        await Promise.all(needed.map(loadTemplate));
        letters.forEach((letter, i) => renderLetter(letter, i, feed));
    } catch (e) {
        feed.innerHTML = '<p class="vlog-empty">Letters loading… 🌸</p>';
        console.error("loadLetters:", e);
    }
}

function loadTemplate(name) {
    return new Promise((resolve) => {
        if (window.LetterTemplates && window.LetterTemplates[name]) return resolve();
        const s = document.createElement("script");
        s.src = `letters/template-${name}.js?_=` + Date.now();
        s.onload = resolve;
        s.onerror = () => { console.warn("Template not found:", name); resolve(); };
        document.head.appendChild(s);
    });
}

function renderLetter(letter, index, feed) {
    const wrapper = document.createElement("div");
    wrapper.className = "envelope-wrapper";

    const label = document.createElement("p");
    label.className = "envelope-label";
    label.textContent = `🌷 Letter No. ${letter.number || (index + 1)}`;
    wrapper.appendChild(label);

    const slot = document.createElement("div");
    slot.id = `slot-${letter.id}`;
    wrapper.appendChild(slot);

    feed.appendChild(wrapper);

    const tmplName = letter.template || "classic";
    const tmpl = window.LetterTemplates && window.LetterTemplates[tmplName];
    if (tmpl && tmpl.render) {
        tmpl.render(letter, slot);
    } else {
        slot.innerHTML = `<p class="vlog-empty">Template "${tmplName}" not found.</p>`;
    }
}

/* ── Envelope / Letter controls (called by templates) ── */
window.closeLetter = function (letterId) {
    const card = document.getElementById(letterId + "-card");
    const env = document.getElementById(letterId + "-env");
    if (card) card.classList.remove("open");
    if (env) {
        _resetPeel(env);
        setTimeout(() => env.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
};

window.downloadLetter = async function (letterId) {
    const el = document.getElementById(letterId + "-card");
    if (!el) return;
    if (!window.html2canvas) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = () => _doDownload(el, letterId);
        document.head.appendChild(s);
    } else { _doDownload(el, letterId); }
};
async function _doDownload(el, letterId) {
    const btn = el.querySelector(".download-btn");
    const orig = btn?.innerHTML; if (btn) { btn.innerHTML = "⏳ Preparing…"; btn.disabled = true; }
    try {
        const cv = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#fefcf8", logging: false });
        const a = document.createElement("a"); a.download = "letter-for-you.png"; a.href = cv.toDataURL("image/png"); a.click();
    } catch { alert("Could not save — please screenshot instead 🥺"); }
    finally { if (btn) { btn.innerHTML = orig; btn.disabled = false; } }
}

/* ═══════════════════════════════════════════════════════════
   PEEL-STRIP OPEN  — horizontal left-to-right tear
   Strip sits below the letter title. No torn-piece clone.
   Mouse listeners are stored and cleaned up on reset.
═══════════════════════════════════════════════════════════ */
window.setupTear = function (env) {
    const letterId = env.dataset.letter;
    const envW = env.offsetWidth || 320;
    const envH = env.offsetHeight || 120;

    const STRIP_H = 34;
    // Push strip to 62% — well below the title text
    const STRIP_Y = Math.floor(envH * 0.62);

    /* ── 1. cover: masks the area above the strip until peeled ── */
    const cover = document.createElement("div");
    cover.className = "ps-cover";
    cover.style.height = STRIP_Y + "px";
    env.appendChild(cover);

    /* ── 2. The peel strip ── */
    const strip = document.createElement("div");
    strip.className = "ps-strip";
    strip.style.top = STRIP_Y + "px";
    strip.style.height = STRIP_H + "px";
    strip.innerHTML = `
    <div class="ps-perf ps-perf-top"></div>
    <div class="ps-inner">
      <span class="ps-notch"></span>
      <span class="ps-label">pull to open</span>
      <span class="ps-arrows"><span></span><span></span><span></span></span>
    </div>
    <div class="ps-perf ps-perf-bot"></div>
  `;
    env.appendChild(strip);

    /* ── Interaction state ── */
    let startX = 0, startY = 0;
    let progress = 0;
    let active = false;

    // Resistance: first 20% of drag feels slow, then linear
    function easeProgress(raw) {
        const p = Math.min(Math.max(raw, 0), 1);
        return p < 0.2 ? Math.pow(p / 0.2, 1.4) * 0.2 : p;
    }

    function applyProgress(p) {
        const ep = easeProgress(p);
        const clipPct = (ep * 100).toFixed(1) + "%";
        strip.style.clipPath = `inset(0 0 0 ${clipPct})`;
        cover.style.clipPath = `inset(0 0 0 ${clipPct})`;
    }

    function pointerStart(e) {
        if (env.dataset.done === "1") return;
        const pt = e.touches ? e.touches[0] : e;
        const rect = env.getBoundingClientRect();
        const relY = pt.clientY - rect.top;
        // Only engage if finger is on or near the strip zone
        if (relY < STRIP_Y - 8 || relY > STRIP_Y + STRIP_H + 8) return;
        startX = pt.clientX;
        startY = pt.clientY;
        progress = 0;
        active = true;
        env.classList.add("ps-peeling");
    }

    function pointerMove(e) {
        if (!active || env.dataset.done === "1") return;
        const pt = e.touches ? e.touches[0] : e;
        const rawDx = pt.clientX - startX;
        const rawDy = pt.clientY - startY;
        // Require horizontal dominance
        if (Math.abs(rawDx) < Math.abs(rawDy) * 0.8 && Math.abs(rawDx) < 8) return;
        if (e.cancelable) e.preventDefault();
        progress = Math.max(0, rawDx) / envW;
        applyProgress(progress);
        if (progress >= 1) _finishPeel(env, strip, cover, letterId, cleanup);
    }

    function pointerEnd() {
        if (!active || env.dataset.done === "1") return;
        active = false;
        env.classList.remove("ps-peeling");
        if (progress < 0.32) {
            // Snap back
            strip.style.transition = "clip-path .4s cubic-bezier(.34,1.56,.64,1)";
            cover.style.transition = "clip-path .4s cubic-bezier(.34,1.56,.64,1)";
            strip.style.clipPath = "inset(0 0 0 0%)";
            cover.style.clipPath = "inset(0 0 0 0%)";
            setTimeout(() => {
                strip.style.transition = "";
                cover.style.transition = "";
            }, 420);
        } else {
            _finishPeel(env, strip, cover, letterId, cleanup);
        }
    }

    // Store references so they can be removed on cleanup
    const onMM = e => { if (active) pointerMove(e); };
    const onMU = () => { if (active) pointerEnd(); };

    function cleanup() {
        window.removeEventListener("mousemove", onMM);
        window.removeEventListener("mouseup", onMU);
    }

    env.addEventListener("touchstart", pointerStart, { passive: true });
    env.addEventListener("touchmove", pointerMove, { passive: false });
    env.addEventListener("touchend", pointerEnd);
    env.addEventListener("touchcancel", pointerEnd);
    env.addEventListener("mousedown", pointerStart);
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);

    // Store cleanup ref on env so _resetPeel can call it
    env._peelCleanup = cleanup;
};

function _finishPeel(env, strip, cover, letterId, cleanup) {
    if (env.dataset.done === "1") return;
    env.dataset.done = "1";

    // Remove global mouse listeners immediately — prevents re-peel glitch
    if (cleanup) cleanup();
    if (env._peelCleanup) { env._peelCleanup(); env._peelCleanup = null; }

    // Sweep strip fully off then reveal letter
    strip.style.transition = "clip-path .16s linear";
    cover.style.transition = "clip-path .16s linear";
    strip.style.clipPath = "inset(0 0 0 100%)";
    cover.style.clipPath = "inset(0 0 0 100%)";

    setTimeout(() => {
        env.style.display = "none";
        const card = document.getElementById(letterId + "-card");
        if (card) {
            card.classList.add("open");
            setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        }
    }, 300);
}

/* ── Reset peel (called by closeLetter) ── */
function _resetPeel(env) {
    // Remove any lingering global listeners first
    if (env._peelCleanup) { env._peelCleanup(); env._peelCleanup = null; }

    delete env.dataset.done;
    env.style.display = "";
    env.classList.remove("ps-peeling");

    // Remove old strip and cover to ensure fresh state
    const cover = env.querySelector(".ps-cover");
    const strip = env.querySelector(".ps-strip");

    if (cover) cover.remove();
    if (strip) strip.remove();

    env._peelCleanup = null;

    // Re-create fresh strip setup so animation works on next peel
    if (window.setupTear) window.setupTear(env);
}

/* ═══════════════════════════════════════════════════════
   SPARKLE  (exported so templates can call it)
═══════════════════════════════════════════════════════ */
window.sparkle = function (e, emoji) {
    if (e && e.stopPropagation) e.stopPropagation();
    const b = document.createElement("div"); b.className = "sparkle-burst"; b.textContent = emoji || "✨";
    b.style.left = (e ? e.clientX : window.innerWidth / 2) + "px";
    b.style.top = (e ? e.clientY : window.innerHeight / 2) + "px";
    document.body.appendChild(b); setTimeout(() => b.remove(), 900);
};

/* ═══════════════════════════════════════════════════════
   VLOGS  —  reads data/vlogs.json
═══════════════════════════════════════════════════════ */
function extractYtId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

async function loadVlogs() {
    try {
        const r = await fetch("data/vlogs.json?_=" + Date.now());
        const data = await r.json();
        const vlogs = (data.vlogs || []).map(e => ({ ...e, ytId: extractYtId(e.ytUrl), isVideo: true, ts: new Date(String(e.date || "").replace(/^[A-Za-z]+,\s*/, "")).getTime() || 0 })).sort((a, b) => b.ts - a.ts);
        const alogs = (data.alogs || []).map(e => ({ ...e, ytId: extractYtId(e.ytUrl), isVideo: false, ts: new Date(String(e.date || "").replace(/^[A-Za-z]+,\s*/, "")).getTime() || 0 })).sort((a, b) => b.ts - a.ts);
        renderLogFeed("vlogs-feed", vlogs, true);
        renderLogFeed("alogs-feed", alogs, false);
    } catch (e) {
        document.getElementById("vlogs-feed").innerHTML = '<p class="vlog-empty">No video logs yet — check back soon 🌙</p>';
        document.getElementById("alogs-feed").innerHTML = '<p class="vlog-empty">No audio logs yet — one is coming soon 💜</p>';
    }
}

function renderLogFeed(feedId, items, isVideo) {
    const feed = document.getElementById(feedId);
    if (!items.length) { feed.innerHTML = `<p class="vlog-empty">${isVideo ? "No video logs yet — check back soon 🌙" : "No audio logs yet — one is coming soon 💜"}</p>`; return; }
    feed.innerHTML = "";
    items.forEach(item => {
        if (!item.ytId) return;
        const row = document.createElement("div"); row.className = "log-row";
        row.dataset.ytId = item.ytId; row.dataset.isAudio = isVideo ? "0" : "1";
        row.innerHTML = `<div class="log-row-header" onclick="toggleLogRow(this.parentElement)"><span class="log-row-icon">${isVideo ? "🎬" : "🎙"}</span><div class="log-row-meta"><div class="log-row-date">${item.date || ""}</div><div class="log-row-time">${item.time || ""}</div></div><span class="log-row-arrow">▼</span></div><div class="log-row-body"></div>`;
        feed.appendChild(row);
    });
}

function toggleLogRow(row) {
    const isExpanded = row.classList.contains("expanded");
    const body = row.querySelector(".log-row-body");
    const ytId = row.dataset.ytId; const isAudio = row.dataset.isAudio === "1";
    if (isExpanded) { row.classList.remove("expanded"); setTimeout(() => { body.innerHTML = ""; }, 400); return; }
    if (!body.innerHTML.trim()) body.innerHTML = buildLavPlayerHTML(ytId, isAudio, row.querySelector(".log-row-date").textContent);
    row.classList.add("expanded");
    setTimeout(() => { const pid = body.querySelector(".lav-player")?.dataset.pid; if (pid) initLavPlayer(pid); }, 50);
}

/* ═══════════════════════════════════════════════════════
   LAVENDER PLAYER
═══════════════════════════════════════════════════════ */
let lavPlayerCounter = 0;
const lavPlayers = {};

function buildLavPlayerHTML(ytId, isAudio, title) {
    const pid = "lp" + (++lavPlayerCounter);
    return `<div class="lav-player${isAudio ? " audio-only" : ""}" data-pid="${pid}" data-ytid="${ytId}" data-audio="${isAudio ? 1 : 0}">
    <div class="lav-title-bar">${title}</div>
    <div class="lav-audio-vis" id="${pid}-vis"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <div class="lav-player-iframe-wrap"><div id="${pid}-yt"></div><div class="lav-tap-overlay" id="${pid}-tap" onclick="lavTapToggle('${pid}')"></div><div class="lav-buffering" id="${pid}-buf"><div class="spinner"></div></div></div>
    <div class="lav-controls">
      <div class="lav-progress-wrap">
        <span class="lav-time" id="${pid}-cur">0:00</span>
        <div class="lav-progress-track" id="${pid}-track" onmousedown="lavSeekStart(event,'${pid}')" ontouchstart="lavSeekStart(event,'${pid}')">
          <div class="lav-progress-fill" id="${pid}-fill"></div>
          <div class="lav-progress-thumb" id="${pid}-thumb"></div>
        </div>
        <span class="lav-time right" id="${pid}-dur">0:00</span>
      </div>
      <div class="lav-btn-row">
        <button class="lav-btn lav-playpause" id="${pid}-pp" onclick="lavTogglePlay('${pid}')">
          <svg id="${pid}-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg id="${pid}-pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
        <button class="lav-btn" onclick="lavSeek('${pid}',-10)" title="-10s"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg><span style="font-size:.55rem;color:currentColor;margin-top:-2px">-10</span></button>
        <button class="lav-btn" onclick="lavSeek('${pid}',10)" title="+10s"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/></svg><span style="font-size:.55rem;color:currentColor;margin-top:-2px">+10</span></button>
        <div class="lav-spacer"></div>
        <button class="lav-speed-btn" id="${pid}-speed" onclick="lavCycleSpeed('${pid}')">1×</button>
        <button class="lav-btn" onclick="lavToggleMute('${pid}')"><svg id="${pid}-vol-on" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg><svg id="${pid}-vol-off" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg></button>
        ${!isAudio ? `<button class="lav-btn lav-fs" onclick="lavFullscreen('${pid}')"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>` : ""}
      </div>
    </div>
  </div>`;
}

function initLavPlayer(pid) {
    const el = document.querySelector(`[data-pid="${pid}"]`);
    if (!el || lavPlayers[pid]) return;
    const ytId = el.dataset.ytid; const isAudio = el.dataset.audio === "1";
    lavPlayers[pid] = { ytPlayer: null, playing: false, muted: false, speed: 1, seeking: false };
    if (!window.YT || !window.YT.Player) { (window._lavPending = window._lavPending || []).push(pid); return; }
    _mkLavPlayer(pid, ytId, isAudio);
}
function _mkLavPlayer(pid, ytId, isAudio) {
    const st = lavPlayers[pid];
    st.ytPlayer = new YT.Player(`${pid}-yt`, {
        videoId: ytId, playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1, origin: location.origin || "https://localhost" }, events: {
            onReady: () => { _lavTick(pid); try { st.ytPlayer.setPlaybackQuality("auto"); } catch (x) { } },
            onStateChange: e => _lavState(pid, e.data),
            onError: e => { document.getElementById(pid + "-buf")?.classList.remove("show"); }
        }
    });
}
function _lavState(pid, s) {
    const st = lavPlayers[pid]; if (!st) return;
    const buf = document.getElementById(pid + "-buf"); const vis = document.getElementById(pid + "-vis");
    if (s === YT.PlayerState.PLAYING) { st.playing = true; buf?.classList.remove("show"); _lavPlayIcon(pid, true); vis?.classList.add("playing"); try { const d = st.ytPlayer.getDuration() || 0; document.getElementById(pid + "-dur").textContent = _fmt(d); } catch (x) { } }
    else if (s === YT.PlayerState.PAUSED || s === YT.PlayerState.ENDED) { st.playing = false; _lavPlayIcon(pid, false); vis?.classList.remove("playing"); }
    else if (s === YT.PlayerState.BUFFERING) { buf?.classList.add("show"); }
}
function _lavPlayIcon(pid, p) {
    const a = document.getElementById(pid + "-play-icon"); const b = document.getElementById(pid + "-pause-icon");
    if (a) a.style.display = p ? "none" : "block"; if (b) b.style.display = p ? "block" : "none";
}
function _lavTick(pid) {
    const st = lavPlayers[pid]; if (st._t) return;
    st._t = setInterval(() => {
        if (!st.ytPlayer || st.seeking) return;
        try {
            const c = st.ytPlayer.getCurrentTime() || 0; const d = st.ytPlayer.getDuration() || 0;
            if (d > 0) {
                const pct = (c / d) * 100; const f = document.getElementById(pid + "-fill"); const th = document.getElementById(pid + "-thumb"); const ct = document.getElementById(pid + "-cur"); const dt = document.getElementById(pid + "-dur");
                if (f) f.style.width = pct + "%"; if (th) th.style.right = (100 - pct) + "%"; if (ct) ct.textContent = _fmt(c); if (dt) dt.textContent = _fmt(d);
            }
        } catch (x) { }
    }, 500);
}
function _fmt(s) { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; }
function lavTogglePlay(pid) { const st = lavPlayers[pid]; if (!st || !st.ytPlayer) return; st.playing ? st.ytPlayer.pauseVideo() : st.ytPlayer.playVideo(); }
function lavTapToggle(pid) { lavTogglePlay(pid); }
function lavSeek(pid, d) { const st = lavPlayers[pid]; if (!st || !st.ytPlayer) return; try { st.ytPlayer.seekTo((st.ytPlayer.getCurrentTime() || 0) + d, true); } catch (x) { } }
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
function lavCycleSpeed(pid) { const st = lavPlayers[pid]; if (!st || !st.ytPlayer) return; st.speed = SPEEDS[(SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length]; try { st.ytPlayer.setPlaybackRate(st.speed); } catch (x) { } const btn = document.getElementById(pid + "-speed"); if (btn) btn.textContent = st.speed + "×"; }
function lavToggleMute(pid) { const st = lavPlayers[pid]; if (!st || !st.ytPlayer) return; st.muted = !st.muted; try { st.muted ? st.ytPlayer.mute() : st.ytPlayer.unMute(); } catch (x) { } document.getElementById(pid + "-vol-on").style.display = st.muted ? "none" : "block"; document.getElementById(pid + "-vol-off").style.display = st.muted ? "block" : "none"; }
function lavFullscreen(pid) { const st = lavPlayers[pid]; if (!st || !st.ytPlayer) return; const ifr = st.ytPlayer.getIframe(); if (ifr) (ifr.requestFullscreen || ifr.webkitRequestFullscreen || ifr.mozRequestFullScreen || function () { })?.call(ifr); }
function lavSeekStart(e, pid) { const st = lavPlayers[pid]; if (!st) return; st.seeking = true; _lavSeekMove(e, pid); const mm = ev => _lavSeekMove(ev, pid); const mu = () => { st.seeking = false; window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); window.removeEventListener("touchmove", mm); window.removeEventListener("touchend", mu); }; window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu); window.addEventListener("touchmove", mm, { passive: true }); window.addEventListener("touchend", mu); }
function _lavSeekMove(e, pid) { const st = lavPlayers[pid]; const tr = document.getElementById(pid + "-track"); if (!st || !tr || !st.ytPlayer) return; const rect = tr.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const r = Math.min(Math.max((cx - rect.left) / rect.width, 0), 1); try { const d = st.ytPlayer.getDuration() || 0; if (d > 0) { st.ytPlayer.seekTo(r * d, true); const f = document.getElementById(pid + "-fill"); const th = document.getElementById(pid + "-thumb"); const ct = document.getElementById(pid + "-cur"); if (f) f.style.width = (r * 100) + "%"; if (th) th.style.right = ((1 - r) * 100) + "%"; if (ct) ct.textContent = _fmt(r * d); } } catch (x) { } }

/* ═══════════════════════════════════════════════════════
   YT API GLOBAL CALLBACKS
═══════════════════════════════════════════════════════ */
window.ytMusicAPIReady = false;
window.onYouTubeIframeAPIReady = function () {
    window.ytMusicAPIReady = true;
    if (document.getElementById("main").classList.contains("visible")) initMusicPlayer();
    (window._lavPending || []).forEach(pid => { const el = document.querySelector(`[data-pid="${pid}"]`); if (el) _mkLavPlayer(pid, el.dataset.ytid, el.dataset.audio === "1"); });
    window._lavPending = [];
};

/* ═══════════════════════════════════════════════════════
   PLAYLIST  —  reads data/playlist.json
═══════════════════════════════════════════════════════ */
let PLAYLIST = [];
let musicYT = null, nowPlaying = -1, mpPlaying = false, mpMuted = false, mpRepeat = false, mpShuffle = false, mpSeeking = false, mpTicker = null, musicPanelOpen = false;

async function loadPlaylist() {
    try {
        const r = await fetch("data/playlist.json?_=" + Date.now());
        const data = await r.json();
        PLAYLIST = (data.songs || []);
        buildPlaylistUI();
        if (window.ytMusicAPIReady) initMusicPlayer();
    } catch (e) { PLAYLIST = []; buildPlaylistUI(); }
}

function initMusicPlayer() {
    if (musicYT || !PLAYLIST.length) return;
    buildPlaylistUI();
    musicYT = new YT.Player("yt-music-iframe", {
        height: "1", width: "1", videoId: PLAYLIST[0]?.ytId || "",
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin || "https://localhost" },
        events: {
            onReady: () => _mpTick(),
            onStateChange: e => {
                const S = YT.PlayerState;
                if (e.data === S.PLAYING) { mpPlaying = true; _mpPlayIcon(true); _mpUpdDur(); }
                else if (e.data === S.PAUSED) { mpPlaying = false; _mpPlayIcon(false); }
                else if (e.data === S.ENDED) {
                    mpPlaying = false;
                    _mpPlayIcon(false);
                    if (mpRepeat) {
                        musicYT.seekTo(0);
                        setTimeout(() => musicYT.playVideo(), 50);
                    } else {
                        nextTrack();
                    }
                }
            },
            onError: e => console.warn("Music error:", e.data)
        }
    });
}
function buildPlaylistUI() {
    const c = document.getElementById("playlist"); if (!c) return; c.innerHTML = "";
    PLAYLIST.forEach((t, i) => { const d = document.createElement("div"); d.className = "pl-item"; d.id = "trk-" + i; d.innerHTML = `<span class="pl-num">${i + 1}</span><span class="pl-name">${t.title}</span><span class="pl-play">▶</span>`; d.onclick = () => playTrack(i); c.appendChild(d); });
}
function playTrack(i) {
    if (i < 0 || i >= PLAYLIST.length || !musicYT) return;
    nowPlaying = i;
    const t = PLAYLIST[i];
    document.getElementById("np-title").textContent = t.title;
    document.getElementById("np-artist").textContent = "";
    document.getElementById("pill-label").textContent = t.title;
    document.querySelectorAll(".pl-item").forEach((el, idx) => el.classList.toggle("active", idx === i));
    try {
        musicYT.loadVideoById(t.ytId);
        mpPlaying = true;
        _mpPlayIcon(true);
        _mpUpdDur();
    } catch (e) { console.warn("Play error:", e); }
}
function togglePlayPause() {
    if (!musicYT) return;
    if (mpPlaying) {
        musicYT.pauseVideo();
        mpPlaying = false;
    } else {
        if (nowPlaying === -1 && PLAYLIST.length) {
            playTrack(0);
        } else {
            musicYT.playVideo();
            mpPlaying = true;
        }
    }
}
function prevTrack() { nowPlaying <= 0 ? playTrack(PLAYLIST.length - 1) : playTrack(nowPlaying - 1); }
function nextTrack() {
    if (mpShuffle) {
        const randomIdx = Math.floor(Math.random() * PLAYLIST.length);
        playTrack(randomIdx);
    } else {
        nowPlaying >= PLAYLIST.length - 1 ? playTrack(0) : playTrack(nowPlaying + 1);
    }
}
function toggleShuffle() { mpShuffle = !mpShuffle; document.getElementById("mp-shuffle")?.classList.toggle("on", mpShuffle); }
function toggleRepeat() {
    mpRepeat = !mpRepeat;
    const btn = document.getElementById("mp-repeat");
    if (btn) {
        btn.classList.toggle("on", mpRepeat);
        btn.classList.toggle("active", mpRepeat);
    }
}
function toggleMute() { if (!musicYT) return; mpMuted = !mpMuted; mpMuted ? musicYT.mute() : musicYT.unMute(); document.getElementById("mp-vol-on").style.display = mpMuted ? "none" : "block"; document.getElementById("mp-vol-off").style.display = mpMuted ? "block" : "none"; }
function _mpPlayIcon(p) { const a = document.getElementById("mp-play-icon"); const b = document.getElementById("mp-pause-icon"); if (a) a.style.display = p ? "none" : "block"; if (b) b.style.display = p ? "block" : "none"; }
function _mpUpdDur() { try { const d = musicYT.getDuration() || 0; document.getElementById("mp-duration").textContent = _fmt(d); } catch (x) { } }
function _mpTick() { if (mpTicker) return; mpTicker = setInterval(() => { if (!musicYT || mpSeeking) return; try { const c = musicYT.getCurrentTime() || 0; const d = musicYT.getDuration() || 0; if (d > 0) { const pct = (c / d) * 100; const f = document.getElementById("mp-progress-fill"); const th = document.getElementById("mp-progress-thumb"); const ce = document.getElementById("mp-current"); const de = document.getElementById("mp-duration"); if (f) f.style.width = pct + "%"; if (th) th.style.right = (100 - pct) + "%"; if (ce) ce.textContent = _fmt(c); if (de) de.textContent = _fmt(d); } } catch (x) { } }, 500); }
function toggleMusic() {
    musicPanelOpen = !musicPanelOpen;
    document.getElementById("music-panel").classList.toggle("open", musicPanelOpen);
    if (musicPanelOpen && nowPlaying === -1 && PLAYLIST.length && musicYT) {
        playTrack(0);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const tr = document.getElementById("mp-progress-track"); if (!tr) return;
    function mpS(e) { if (!musicYT) return; const rect = tr.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const r = Math.min(Math.max((cx - rect.left) / rect.width, 0), 1); try { const d = musicYT.getDuration() || 0; if (d > 0) musicYT.seekTo(r * d, true); } catch (x) { } }
    tr.addEventListener("mousedown", e => { mpSeeking = true; mpS(e); const mm = ev => { if (mpSeeking) mpS(ev); }; const mu = () => { mpSeeking = false; window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); }; window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu); });
    tr.addEventListener("touchstart", e => { mpSeeking = true; mpS(e); }, { passive: true });
    tr.addEventListener("touchmove", e => { if (mpSeeking) mpS(e); }, { passive: true });
    tr.addEventListener("touchend", () => { mpSeeking = false; });
});

window.addEventListener("scroll", () => { document.getElementById("scroll-top").classList.toggle("show", scrollY > 280); });