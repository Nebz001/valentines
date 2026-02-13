// ====== Stages based on NO clicks (matches the video’s “Wait...” progression) ======
const STAGES = [
  {
    title: "Hey Cutie!",
    subtitle: "Will you be my Valentine?",
    gifKey: "start",
  },
  {
    title: "Wait...",
    subtitle: "Are you sure?",
    gifKey: "wait1",
  },
  {
    title: "Wait...",
    subtitle: "Reaallyy sure?",
    gifKey: "wait2",
  },
  {
    title: "Wait...",
    subtitle: "Don’t do this to me :(",
    gifKey: "wait3",
  },
  {
    title: "Wait...",
    subtitle: "You’re breaking my heart...",
    gifKey: "wait4",
  },
  {
    title: "Please?",
    subtitle: "You have no choice now! ❤️",
    gifKey: "please",
  },
  {
    title: "Yay! Happy Valentine’s Day!",
    subtitle: "I knew u would say yes 😛",
    gifKey: "final",
  },
];

// ====== Tunables to match behavior ======
// NOTE: Set to 5 so wait1..wait4 appear once (clicks 1..4), then the next click locks into "no choice".
const NO_CLICK_LIMIT = 5; // after this, we lock into the "Please?" stage
const YES_GROWTH_PER_NO = 0.3; // scale increment each NO click
const NO_SHRINK_PER_NO = 0.08; // NO shrinks each click (until it becomes trapped)

const bgHearts = document.querySelector(".bg-hearts");
const confetti = document.getElementById("confetti");

const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const gifContainerEl = document.getElementById("gifContainer");
const gifItems = Array.from(gifContainerEl.querySelectorAll(".gifItem"));

const yesBtn = document.getElementById("yesBtn");
const replayBtn = document.getElementById("replayBtn");
const card = document.querySelector(".card");
const actionsContainer = document.querySelector(".actions");

let noClicks = 0;
let yesScale = 1;
let noScale = 1;
let inFinal = false;

// ====== Page fade in/out (slow + smooth) ======
const PAGE_FADE_MS = 1800;

function pageFadeIn() {
  if (!document.body.classList.contains("page")) return;
  requestAnimationFrame(() => document.body.classList.add("page-ready"));
}

function navigateWithFade(url) {
  if (!url) return;
  if (!document.body.classList.contains("page")) {
    window.location.href = url;
    return;
  }

  document.body.classList.add("page-leave");
  window.setTimeout(() => {
    window.location.href = url;
  }, PAGE_FADE_MS);
}

// ====== Init ======
setStage(0);
spawnBackgroundHearts(38);
bindNoButton(document.getElementById("noBtn"));
pageFadeIn();

// Handles bfcache restores (back/forward)
window.addEventListener("pageshow", pageFadeIn);

// ====== Events ======
function bindNoButton(btn) {
  if (!btn) return;
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => handleNoClick(btn));
}

function handleNoClick(btn) {
  if (inFinal) return;

  noClicks++;

  // Add some extra bottom room once the YES starts growing
  card.classList.add("growing");

  // 1) YES grows gradually
  yesScale = 1 + noClicks * YES_GROWTH_PER_NO;
  yesBtn.style.transform = `scale(${yesScale})`;

  // 2) NO shrinks + shifts (harder to click)
  noScale = Math.max(0.45, 1 - noClicks * NO_SHRINK_PER_NO);
  btn.style.transform = `scale(${noScale})`;

  // add a little horizontal push like in the clip
  const pushX = Math.min(120, noClicks * 18);
  const pushY = Math.min(28, noClicks * 4);
  btn.style.translate = `${pushX}px ${pushY}px`;

  // 3) Stage text/gif changes
  // Show wait1..wait4 on clicks 1..4 only.
  // Keep the "no choice" (stage 5) ONLY when NO is removed.
  if (noClicks <= 4) {
    setStage(noClicks);
  }

  // 4) After limit: lock into "Please?" stage and completely remove NO button; YES becomes huge and centered.
  if (noClicks >= NO_CLICK_LIMIT) {
    setStage(5);

    yesBtn.classList.add("huge");
    card.classList.add("roomy");

    // Completely remove NO button from DOM
    btn.remove();

    // Center YES button
    actionsContainer.style.justifyContent = "center";
  }

  pulseCard();
}

yesBtn.addEventListener("click", () => {
  if (inFinal) return;

  // go final
  inFinal = true;
  setStage(6);

  // If NO button still exists, hide it
  const currentNoBtn = document.getElementById("noBtn");
  if (currentNoBtn) {
    currentNoBtn.style.opacity = "0";
    currentNoBtn.style.pointerEvents = "none";
  }

  // normalize YES size so it fits nicely in final screen
  yesBtn.classList.remove("huge");
  yesBtn.style.transform = "scale(1)";
  yesBtn.textContent = "Yes";

  // Final card should have only one button: Continue
  // Hide the YES/NO action row entirely and show the Continue button.
  actionsContainer.classList.add("hidden");

  // confetti hearts
  burstHearts(110);

  // show replay
  replayBtn.classList.remove("hidden");
  pulseCard();
});

replayBtn.addEventListener("click", () => navigateWithFade("memories.html"));

// ====== Functions ======
function setStage(stageIndex) {
  const s = STAGES[stageIndex];

  titleEl.textContent = s.title;
  subtitleEl.textContent = s.subtitle;

  // Toggle pre-rendered Tenor embeds
  gifItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.gif === s.gifKey);
  });

  // If final stage, buttons layout like a message card
  if (stageIndex === 6) {
    // mimic final card in clip (clean center)
    yesBtn.classList.remove("btn-no");
    yesBtn.classList.add("btn-yes");
    yesBtn.style.marginTop = "6px";
  }
}

function pulseCard() {
  card.classList.remove("flash");
  // restart animation
  void card.offsetWidth;
  card.classList.add("flash");
}

function resetAll() {
  inFinal = false;
  noClicks = 0;
  yesScale = 1;
  noScale = 1;

  card.classList.remove("growing", "roomy");

  setStage(0);

  // reset buttons
  yesBtn.textContent = "Yes";
  yesBtn.style.transform = "scale(1)";
  yesBtn.classList.remove("huge");

  // Restore actions row for a new run
  actionsContainer.classList.remove("hidden");

  // Recreate NO button if it was removed
  let currentNoBtn = document.getElementById("noBtn");
  if (!currentNoBtn) {
    currentNoBtn = document.createElement("button");
    currentNoBtn.id = "noBtn";
    currentNoBtn.className = "btn btn-no";
    currentNoBtn.type = "button";
    currentNoBtn.textContent = "No";
    actionsContainer.appendChild(currentNoBtn);
    bindNoButton(currentNoBtn);
  } else {
    currentNoBtn.textContent = "No";
    currentNoBtn.style.opacity = "1";
    currentNoBtn.style.pointerEvents = "auto";
    currentNoBtn.style.transform = "scale(1)";
    currentNoBtn.style.translate = "0px 0px";
    currentNoBtn.classList.remove("trapped");
  }

  // Reset actions container
  actionsContainer.style.justifyContent = "center";

  replayBtn.classList.add("hidden");
  confetti.innerHTML = "";
  pulseCard();
}

// ====== Background hearts (floating) ======
function spawnBackgroundHearts(count) {
  const heartChars = ["❤", "💗", "💖", "💘", "💕"];
  for (let i = 0; i < count; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];

    const left = Math.random() * 100; // vw
    const size = 10 + Math.random() * 14; // px
    const duration = 10 + Math.random() * 14; // sec
    const delay = Math.random() * 10; // sec

    h.style.left = `${left}vw`;
    h.style.fontSize = `${size}px`;
    h.style.animationDuration = `${duration}s`;
    h.style.animationDelay = `${delay}s`;

    // subtle color variety like the clip (pinkish)
    h.style.color = Math.random() > 0.5 ? "#ff4f93" : "#ff7aa8";

    bgHearts.appendChild(h);
  }
}

// ====== Confetti hearts burst (final screen) ======
function burstHearts(count) {
  confetti.innerHTML = "";

  const heartChars = ["❤", "💗", "💖", "💘", "💕"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "piece";
    p.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];

    const left = Math.random() * 100; // vw
    const size = 12 + Math.random() * 18; // px
    const duration = 2.6 + Math.random() * 2.4; // sec
    const delay = Math.random() * 0.4; // sec

    p.style.left = `${left}vw`;
    p.style.fontSize = `${size}px`;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;

    // pink palette
    p.style.color = Math.random() > 0.5 ? "#ff4f93" : "#ff7aa8";

    confetti.appendChild(p);

    // cleanup
    const totalMs = (duration + delay) * 1000;
    setTimeout(() => p.remove(), totalMs + 200);
  }
}
