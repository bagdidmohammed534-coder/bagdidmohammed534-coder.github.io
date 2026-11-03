/* =========================================================================
   Bagdid Mohammed — CV
   Five small engines: boot, reveal, text scramble, particle dust, UI glue.
   Everything else is CSS.
   ========================================================================= */
(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine   = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* =====================================================================
     1. BOOT — fade the title screen, then hand over to the page
     ===================================================================== */
  function initBoot(onDone) {
    const boot = $("#boot");
    if (!boot) { onDone(); return; }

    let called = false;
    const done = () => {
      if (called) return;
      called = true;
      boot.classList.add("done");
      boot.setAttribute("aria-hidden", "true");
      onDone();
      window.setTimeout(() => boot.remove(), 900);
    };

    if (reduce.matches) { done(); return; }

    if (document.readyState === "complete") {
      window.setTimeout(done, 850);
    } else {
      window.addEventListener("load", () => window.setTimeout(done, 850), { once: true });
      // never let a slow third-party request hold the CV hostage
      window.setTimeout(done, 3200);
    }
  }

  /* =====================================================================
     2. REVEAL — sections materialise, children stagger in
     ===================================================================== */
  function initReveal() {
    const sections = $$(".reveal");
    if (!sections.length) return;

    // gate the "hidden until revealed" state on JS actually running
    document.documentElement.classList.add("anim");

    const show = (sec) => {
      if (sec.classList.contains("is-in")) return;
      sec.classList.add("is-in");

      $$(".tl__item, .proj, .skill, .cert, .stat, .chip", sec).forEach((kid, i) => {
        kid.style.setProperty("--d", Math.min(i, 14) * 55 + "ms");
      });

      if (reduce.matches) return;
      $$("[data-scramble]", sec).slice(0, 10).forEach((n, i) => {
        window.setTimeout(() => scramble(n, 460), 130 + i * 65);
      });
    };

    if (!("IntersectionObserver" in window)) {
      sections.forEach(show);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    sections.forEach((sec) => io.observe(sec));
  }

  /* =====================================================================
     3. TEXT SCRAMBLE — glyph noise resolving into the real label
     ===================================================================== */
  const GLYPHS = "!<>-_\\/[]{}—=+*^?#0123456789ABCDEF▒░█";
  const ALNUM = /[a-zA-Z0-9À-ÿ]/;

  function scramble(node, duration = 420) {
    if (!node || node._scrambling) return;
    if (reduce.matches) return;

    const full = node.textContent;
    if (!full || !full.trim()) return;
    if (node.childElementCount > 0) return; // text-only targets

    node._scrambling = true;
    node.classList.add("is-scrambling");
    node._original = full;

    const frames = Math.max(8, Math.round(duration / 32));
    let frame = 0;

    const step = () => {
      if (!node._scrambling) return;

      const progress = frame / frames;
      const revealed = Math.floor(progress * full.length);

      let out = "";
      for (let i = 0; i < full.length; i++) {
        const ch = full[i];
        if (ch === " " || !ALNUM.test(ch)) { out += ch; continue; }
        out += (i < revealed || Math.random() < progress * 0.55)
          ? ch
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }

      node.textContent = out;
      frame++;

      if (frame > frames) {
        node.textContent = full;
        node.classList.remove("is-scrambling");
        node._scrambling = false;
        return;
      }
      node._raf = requestAnimationFrame(step);
    };

    cancelAnimationFrame(node._raf);
    step();
  }

  function stopScramble(node) {
    if (!node || !node._scrambling) return;
    cancelAnimationFrame(node._raf);
    node.textContent = node._original;
    node.classList.remove("is-scrambling");
    node._scrambling = false;
  }

  function initScramble() {
    if (reduce.matches || !fine.matches) return;

    document.addEventListener("mouseover", (event) => {
      const hit = event.target.closest("[data-scramble]");
      if (!hit || hit.contains(event.relatedTarget)) return;
      scramble(hit, 380);
    });

    document.addEventListener("mouseout", (event) => {
      const hit = event.target.closest("[data-scramble]");
      if (!hit || hit.contains(event.relatedTarget)) return;
      stopScramble(hit);
    });
  }

  /* =====================================================================
     4. PARTICLE DUST — slow violet motes drifting upward
     ===================================================================== */
  function initDust() {
    const canvas = $("#dust");
    if (!canvas || reduce.matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let parts = [];
    let raf = 0;

    const count = () => Math.min(96, Math.max(26, Math.round((w * h) / 30000)));

    const spawn = (initial) => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 12,
      r: Math.random() * 1.5 + 0.35,
      vy: -(Math.random() * 0.20 + 0.05),
      vx: (Math.random() - 0.5) * 0.11,
      a: Math.random() * 0.45 + 0.12,
      cool: Math.random() < 0.16,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = count();
      if (parts.length < n) {
        while (parts.length < n) parts.push(spawn(true));
      } else {
        parts.length = n;
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -14 || p.x < -20 || p.x > w + 20) {
          Object.assign(p, spawn(false));
        }

        if (p.r > 1.15) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(139,92,246,${(p.a * 0.10).toFixed(3)})`;
          ctx.arc(p.x, p.y, p.r * 5.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = p.cool
          ? `rgba(103,232,249,${(p.a * 0.55).toFixed(3)})`
          : `rgba(192,132,252,${p.a.toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    start();

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 140);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }

  /* =====================================================================
     5. POINTER GLOW — a soft violet lamp that trails the cursor
     ===================================================================== */
  function initGlow() {
    const glow = $("#pointer-glow");
    if (!glow || !fine.matches || reduce.matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 3;
    let cx = tx, cy = ty;
    let seen = false;

    window.addEventListener("pointermove", (event) => {
      tx = event.clientX;
      ty = event.clientY;
      if (!seen) {
        seen = true;
        cx = tx;
        cy = ty;
        glow.classList.add("on");
      }
    }, { passive: true });

    window.addEventListener("pointerdown", () => glow.classList.add("on"), { passive: true });
    document.addEventListener("mouseleave", () => glow.classList.remove("on"));

    const loop = () => {
      cx += (tx - cx) * 0.13;
      cy += (ty - cy) * 0.13;
      glow.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* =====================================================================
     6. UI GLUE — clock, copy-to-clipboard toast, scroll spy, progress
     ===================================================================== */
  function initScrollProgress() {
    const bar = $("#scroll-progress");
    if (!bar || reduce.matches) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = `scaleX(${p})`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }
  function initClock() {
    const node = $("#clock");
    if (!node) return;

    let fmt = null;
    try {
      fmt = new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Africa/Casablanca",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (_) { /* very old engine: fall back to local time */ }

    const tick = () => {
      const now = new Date();
      node.textContent = fmt ? fmt.format(now) : now.toTimeString().slice(0, 5);
    };

    tick();
    window.setInterval(tick, 20000);
  }

  let toastTimer = 0;
  function toast(message) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("on"), 2200);
  }

  function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:-9999px;opacity:0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    area.remove();
    return ok;
  }

  function initCopy() {
    const button = $("#copy-mail");
    if (!button) return;

    const address = button.getAttribute("data-copy") || "";
    const label = button.textContent;

    button.addEventListener("click", async () => {
      const ok = await writeClipboard(address);
      toast(ok ? "email copié" : "copie impossible — sélectionnez l’adresse");

      if (!ok) return;
      button.textContent = "copié ✓";
      button.disabled = true;
      window.setTimeout(() => {
        button.textContent = label;
        button.disabled = false;
      }, 1900);
    });
  }

  function initScrollSpy() {
    const links = $$(".hud__nav a");
    if (!links.length || !("IntersectionObserver" in window)) return;

    const sections = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    if (!sections.length) return;

    const mark = (id) => {
      links.forEach((a) => {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) mark(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach((sec) => io.observe(sec));
  }

  /* =====================================================================
     boot sequence
     ===================================================================== */
  function start() {
    initDust();
    initGlow();
    initScrollProgress();
    initClock();

    initBoot(() => {
      initReveal();
      initScramble();
      initCopy();
      initScrollSpy();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
