/* =====================================================================
 *  💕  CONFIGURATION  —  edit everything here, no other file needed
 * ===================================================================== */
const CONFIG = {
  // The baby's name the visitor has to guess (matching is case-insensitive
  // and ignores accents/spaces). You can list nicknames/spellings too.
  babyName: "Emma",
  acceptedNames: ["Emma"], // add alternative spellings if you like

  // Hints are revealed one-by-one when the visitor clicks "I need a hint".
  hints: [
    "It starts with the letter “E”.",
    "It has 4 letters.",
    "It’s a classic name that means “whole” or “universal”.",
    "A famous Emma wrote in Jane Austen’s world… 😉",
  ],

  // Shown on the reveal page after a correct guess.
  reveal: {
    tagline: "Born to be loved. 👶✨",
    // Drop image files next to index.html and reference them here, e.g.
    //   { src: "photos/emma-1.jpg", caption: "Day one 💕" }
    // If "src" is left empty, a cute placeholder is shown instead.
    photos: [
      { src: "", caption: "First hello 💕" },
      { src: "", caption: "Tiny toes 🦶" },
      { src: "", caption: "Sweet dreams 😴" },
    ],
    // Key/value facts displayed as a list.
    facts: {
      "Born": "June 25, 2026",
      "Weight": "3.4 kg",
      "Length": "50 cm",
      "Time": "08:42 AM",
    },
    // A free-text paragraph.
    story:
      "After a long wait, our little star finally arrived. " +
      "Mum and baby are both doing wonderfully, and our hearts have " +
      "never been so full. Thank you for celebrating this moment with us! 💕",
  },

  // How many entries to show on the scoreboard.
  scoreboardSize: 10,
};

/* =====================================================================
 *  Below this line you normally don't need to change anything.
 * ===================================================================== */

const STORAGE_KEY = "babyScoreboard";

// ---- Helpers ----------------------------------------------------------
const $ = (sel) => document.querySelector(sel);

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z]/g, "")        // strip spaces/punctuation
    .toLowerCase();
}

function isCorrect(guess) {
  const g = normalize(guess);
  return [CONFIG.babyName, ...CONFIG.acceptedNames]
    .map(normalize)
    .includes(g);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("#" + id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatTime(ms) {
  const totalTenths = Math.floor(ms / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}.${tenths}`;
}

// ---- Timer ------------------------------------------------------------
const timer = {
  startTime: null,
  rafId: null,
  elapsed: 0,
  running: false,

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    $("#timer").hidden = false;
    const tick = () => {
      this.elapsed = performance.now() - this.startTime;
      $("#timer-display").textContent = formatTime(this.elapsed);
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
  },

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.elapsed = performance.now() - this.startTime;
    return this.elapsed;
  },
};

// ---- Hints ------------------------------------------------------------
let hintsShown = 0;

function showNextHint() {
  // Starting the timer the first time a hint is requested.
  timer.start();

  if (hintsShown >= CONFIG.hints.length) {
    $("#hint-btn").textContent = "No more hints — you can do it! 💪";
    $("#hint-btn").disabled = true;
    return;
  }
  const li = document.createElement("li");
  li.textContent = CONFIG.hints[hintsShown];
  $("#hint-list").appendChild(li);
  hintsShown++;

  if (hintsShown < CONFIG.hints.length) {
    $("#hint-btn").textContent = `🤔 Another hint (${hintsShown}/${CONFIG.hints.length})`;
  } else {
    $("#hint-btn").textContent = "That's the last hint! 💡";
    $("#hint-btn").disabled = true;
  }
}

// ---- Guess flow -------------------------------------------------------
let finalMs = 0;

function handleGuess(e) {
  e.preventDefault();
  const input = $("#guess-input");
  const feedback = $("#guess-feedback");
  const value = input.value.trim();

  if (!value) return;

  if (isCorrect(value)) {
    finalMs = timer.running ? timer.stop() : 0;
    feedback.textContent = "Correct! 🎉";
    feedback.className = "feedback success";
    setTimeout(goToScore, 700);
  } else {
    feedback.textContent = "Not quite — try a hint and guess again! 💭";
    feedback.className = "feedback error";
    input.select();
  }
}

function goToScore() {
  // If the visitor knew the name without ever asking for a hint, the timer
  // never started — that's a "knew it instantly" score of 0.
  $("#final-time").textContent = finalMs > 0 ? formatTime(finalMs) : "instantly! 🌟";
  renderScoreboard();
  showScreen("screen-score");
  $("#player-input").focus();
}

// ---- Scoreboard (localStorage) ---------------------------------------
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

let lastSavedId = null;

function handleSaveScore(e) {
  e.preventDefault();
  const input = $("#player-input");
  const name = input.value.trim();
  if (!name) return;

  const scores = loadScores();
  lastSavedId = Date.now();
  scores.push({
    id: lastSavedId,
    name,
    ms: finalMs, // 0 means "knew it instantly"
  });

  // Sort: instant-knowers (ms === 0) first, then fastest guessers.
  scores.sort((a, b) => {
    if (a.ms === 0 && b.ms !== 0) return -1;
    if (b.ms === 0 && a.ms !== 0) return 1;
    return a.ms - b.ms;
  });

  saveScores(scores);
  input.disabled = true;
  e.target.querySelector("button").disabled = true;
  e.target.querySelector("button").textContent = "Saved ✓";
  renderScoreboard();
}

function renderScoreboard() {
  const board = $("#scoreboard");
  const scores = loadScores().slice(0, CONFIG.scoreboardSize);
  board.innerHTML = "";

  if (scores.length === 0) {
    const li = document.createElement("li");
    li.className = "scoreboard-empty";
    li.textContent = "Be the first on the board! 🌟";
    board.appendChild(li);
    return;
  }

  for (const entry of scores) {
    const li = document.createElement("li");
    if (entry.id === lastSavedId) li.classList.add("is-you");

    const player = document.createElement("span");
    player.className = "player";
    player.textContent = entry.name;

    const time = document.createElement("span");
    time.className = "score-time";
    time.textContent = entry.ms === 0 ? "instant 🌟" : formatTime(entry.ms);

    li.appendChild(player);
    li.appendChild(time);
    board.appendChild(li);
  }
}

// ---- Reveal page ------------------------------------------------------
function buildReveal() {
  $("#reveal-name").textContent = CONFIG.babyName;
  $("#reveal-tagline").textContent = CONFIG.reveal.tagline;

  // Gallery
  const gallery = $("#gallery");
  gallery.innerHTML = "";
  for (const photo of CONFIG.reveal.photos) {
    const fig = document.createElement("figure");

    if (photo.src) {
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.caption || CONFIG.babyName;
      img.loading = "lazy";
      fig.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "photo-placeholder";
      ph.textContent = "📷";
      ph.title = "Add a photo in script.js → CONFIG.reveal.photos";
      fig.appendChild(ph);
    }

    if (photo.caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = photo.caption;
      fig.appendChild(cap);
    }
    gallery.appendChild(fig);
  }

  // Details: facts + story
  const details = $("#details");
  details.innerHTML = "";
  const facts = CONFIG.reveal.facts || {};
  if (Object.keys(facts).length) {
    const dl = document.createElement("dl");
    for (const [key, val] of Object.entries(facts)) {
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.textContent = val;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    details.appendChild(dl);
  }
  if (CONFIG.reveal.story) {
    const p = document.createElement("p");
    p.className = "story";
    p.textContent = CONFIG.reveal.story;
    details.appendChild(p);
  }
}

// ---- Wire it all up ---------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  $("#guess-form").addEventListener("submit", handleGuess);
  $("#hint-btn").addEventListener("click", showNextHint);
  $("#score-form").addEventListener("submit", handleSaveScore);
  $("#to-reveal-btn").addEventListener("click", () => {
    buildReveal();
    showScreen("screen-reveal");
  });

  renderScoreboard();
});
