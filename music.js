(() => {
  const MUSIC_SRC = "beabadoobee_Clairo_-_Glue_Song_feat._Clairo_(mp3.pm).mp3";
  const VOLUME = 0.2;
  const INDEX_DELAY_MS = 3000;

  const STORAGE = {
    shouldPlay: "valentines.music.shouldPlay",
    time: "valentines.music.time",
  };

  // Use sessionStorage so the song resets on each new open/tab.
  // It will still continue across pages within the same visit.
  const store = sessionStorage;

  const isIndexPage = (() => {
    const path = (location.pathname || "").toLowerCase();
    return (
      path.endsWith("/index.html") ||
      path.endsWith("/index.htm") ||
      path.endsWith("/") ||
      path.endsWith("\\")
    );
  })();

  const getSavedTime = () => {
    const raw = store.getItem(STORAGE.time);
    const parsed = raw ? Number.parseFloat(raw) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const setSavedTime = (time) => {
    if (!Number.isFinite(time) || time < 0) return;
    store.setItem(STORAGE.time, String(time));
  };

  const ensureAudio = () => {
    let audio = document.getElementById("bgMusic");
    if (audio && audio.tagName === "AUDIO") return audio;

    audio = document.createElement("audio");
    audio.id = "bgMusic";
    audio.preload = "auto";
    audio.src = MUSIC_SRC;

    // Keep it out of layout
    audio.style.position = "fixed";
    audio.style.left = "-9999px";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.setAttribute("aria-hidden", "true");

    document.body.appendChild(audio);
    return audio;
  };

  const audio = ensureAudio();
  audio.volume = VOLUME;

  // Reset for each fresh open of the site (new tab / direct open of index).
  // - Direct open: no referrer
  // - Reload: user refreshed the page
  const navEntry = performance.getEntriesByType("navigation")[0];
  const navType = navEntry && "type" in navEntry ? navEntry.type : "navigate";
  const isFreshOpen =
    isIndexPage && (!document.referrer || navType === "reload");
  if (isFreshOpen) {
    store.removeItem(STORAGE.shouldPlay);
    store.removeItem(STORAGE.time);
  }

  let shouldPlay = store.getItem(STORAGE.shouldPlay) === "1";

  const setTimeSafe = (time) => {
    try {
      audio.currentTime = time;
    } catch {
      audio.addEventListener(
        "loadedmetadata",
        () => {
          try {
            audio.currentTime = time;
          } catch {
            // ignored
          }
        },
        { once: true },
      );
    }
  };

  const playAtSavedTime = async () => {
    if (!shouldPlay) return;

    const desired = getSavedTime();

    // Avoid snapping time if already close.
    if (audio.paused || Math.abs((audio.currentTime || 0) - desired) > 1.0) {
      setTimeSafe(desired);
    }

    audio.volume = VOLUME;

    try {
      await audio.play();
    } catch {
      // Autoplay is often blocked; we'll retry on first interaction.
    }
  };

  const startFromBeginning = async () => {
    shouldPlay = true;
    store.setItem(STORAGE.shouldPlay, "1");
    setSavedTime(0);
    setTimeSafe(0);
    await playAtSavedTime();
  };

  // First-ever start: only index waits 3 seconds.
  if (!shouldPlay && isIndexPage) {
    window.setTimeout(() => {
      startFromBeginning();
    }, INDEX_DELAY_MS);
  } else if (shouldPlay) {
    playAtSavedTime();
  }

  const persistTime = () => {
    if (!shouldPlay) return;
    if (audio.paused) return;
    setSavedTime(audio.currentTime || 0);
  };

  // Save time frequently so navigation resumes close to seamless.
  window.setInterval(persistTime, 500);
  window.addEventListener("pagehide", persistTime);

  // If blocked, start on the first user interaction.
  const unlock = () => {
    playAtSavedTime();
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });

  // If the user comes back to the tab, try again.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      playAtSavedTime();
    }
  });
})();
