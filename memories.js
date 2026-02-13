(() => {
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

  function maybeRevealUnder() {
    const remaining = document.querySelectorAll(".photo-stack .memory-photo");
    if (remaining.length !== 0) return;

    const under = document.querySelector(".photo-stack .memories-under");
    if (!under) return;
    under.classList.add("show");
    under.setAttribute("aria-hidden", "false");

    const continueLink = under.querySelector("a.replay");
    if (continueLink) continueLink.focus();
  }

  function vanish(el) {
    if (!el || el.classList.contains("vanish")) return;
    el.classList.add("vanish");

    // Remove after the transition so it doesn't block clicks.
    const removeAfterMs = 260;
    window.setTimeout(() => {
      el.remove();
      maybeRevealUnder();
    }, removeAfterMs);
  }

  function bindStack() {
    const photos = Array.from(
      document.querySelectorAll(".photo-stack .memory-photo"),
    );
    if (photos.length === 0) return;

    let suppressClick = false;

    photos.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (suppressClick) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        vanish(btn);
      });
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          vanish(btn);
        }
      });
    });

    // Swipe left/right to dismiss the top photo without changing the layout.
    const stack = document.querySelector(".photo-stack");
    if (stack) {
      let activePointerId = null;
      let startX = 0;
      let startY = 0;
      let moved = false;

      const SWIPE_MIN_PX = 40;
      const MAX_VERTICAL_RATIO = 1.2; // ensure mostly-horizontal swipe

      const getTopPhoto = () => {
        const remaining = stack.querySelectorAll(".memory-photo");
        if (!remaining || remaining.length === 0) return null;
        return remaining[remaining.length - 1];
      };

      stack.addEventListener("pointerdown", (e) => {
        if (activePointerId !== null) return;
        if (e.button !== undefined && e.button !== 0) return;

        activePointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        moved = false;

        try {
          stack.setPointerCapture(activePointerId);
        } catch {
          // ignored
        }
      });

      stack.addEventListener("pointermove", (e) => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
      });

      const endSwipe = (e) => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // Reset pointer tracking first.
        try {
          stack.releasePointerCapture(activePointerId);
        } catch {
          // ignored
        }
        activePointerId = null;

        // Only treat as swipe if it's a mostly-horizontal gesture.
        if (!moved) return;
        if (absX < SWIPE_MIN_PX) return;
        if (absY > absX * MAX_VERTICAL_RATIO) return;

        const top = getTopPhoto();
        if (!top) return;

        // Prevent the synthetic click after swipe.
        suppressClick = true;
        window.setTimeout(() => {
          suppressClick = false;
        }, 0);

        top.style.setProperty("--swipe-x", `${dx > 0 ? 140 : -140}px`);
        vanish(top);
      };

      stack.addEventListener("pointerup", endSwipe);
      stack.addEventListener("pointercancel", (e) => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        try {
          stack.releasePointerCapture(activePointerId);
        } catch {
          // ignored
        }
        activePointerId = null;
      });
    }

    const continueLink = document.querySelector(
      ".photo-stack .memories-under a.replay",
    );
    if (continueLink) {
      continueLink.addEventListener("click", (e) => {
        e.preventDefault();
        navigateWithFade(continueLink.getAttribute("href"));
      });
    }

    pageFadeIn();
    window.addEventListener("pageshow", pageFadeIn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindStack);
  } else {
    bindStack();
  }
})();
