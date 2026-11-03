/* =========================================================================
   Mohammed Bagdid — portfolio
   Four small engines: theme+glitch, text scramble, ticker, terminal typing.
   Everything else is CSS.
   ========================================================================= */

/* ------------------------------------------------------------ content */
const PROJECTS = [
  {
    name: "ollama_project",
    desc: "Local LLM playground — offline models, prompt tests and notes. Early stub, building in public.",
    tags: ["Ollama", "Local AI"],
    state: "wip",
    demo: null,
    repo: "https://github.com/bagdidmohammed534-coder/ollama_project",
  },
  {
    name: "portfolio",
    desc: "This page. Hand-written HTML/CSS/JS — dual CRT and print themes, text scramble, glitch theme switch, zero frameworks.",
    tags: ["HTML", "CSS", "JS"],
    state: "source",
    demo: "https://bagdidmohammed534-coder.github.io",
    repo: "https://github.com/bagdidmohammed534-coder/bagdidmohammed534-coder.github.io",
  },
];

const CERTS = [
  { name: "AWS Academy Graduate – Cloud Foundations", issuer: "Amazon Web Services", status: "passed" },
  { name: "React Basics",                                issuer: "Meta",                             status: "passed" },
  { name: "React Native Developer",                    issuer: "Meta",                             status: "passed" },
  { name: "The Unix Workbench",                        issuer: "Johns Hopkins University",        status: "passed" },
  { name: "Interactivity with JavaScript",            issuer: "University of Michigan",          status: "passed" },
  { name: "Foundations of Cybersecurity",            issuer: "—",                                status: "passed" },
  { name: "Cyber Security: Applied Cryptography",    issuer: "—",                                status: "passed" },
];

/* ------------------------------------------------------------ helpers */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

/* =========================================================================
   1. THEME  +  glitch transition
   ========================================================================= */
const THEME_KEY = "theme";
let glitching = false;
let audioCtx = null;

function setTheme(mode, { animate = false } = {}) {
  const root = document.documentElement;
  const apply = () => {
    root.classList.toggle("dark", mode === "dark");
    try { localStorage.setItem(THEME_KEY, mode); } catch (_) {}
  };
  if (animate && !reduceMotion.matches) glitchTransition(apply);
  else apply();
}

function glitchTransition(swap) {
  if (glitching) return;
  glitching = true;

  const root = document.documentElement;
  const overlay = $("#glitch-overlay");

  overlay.innerHTML = "";
  overlay.appendChild(el("div", "chroma"));

  for (let i = 0; i < 7; i++) {
    const bar = el("div", "bar");
    const top = Math.random() * 94;
    const h = 1 + Math.random() * 8;
    const dx = (Math.random() - 0.5) * 40;
    const delay = Math.random() * 180;
    const out = 90 + Math.random() * 140;

    bar.style.top = top + "%";
    bar.style.height = h + "%";
    bar.style.transform = `translateX(${dx}px)`;
    bar.style.animation =
      `bar-in 80ms ${delay}ms ease-out forwards, ` +
      `bar-out 110ms ${delay + out}ms ease-in forwards`;
    overlay.appendChild(bar);
  }

  overlay.appendChild(el("div", "flash"));
  overlay.classList.add("on");
  root.classList.add("glitching");

  noiseBurst();
  setTimeout(swap, 230);
  setTimeout(() => {
    overlay.classList.remove("on");
    root.classList.remove("glitching");
    overlay.innerHTML = "";
    glitching = false;
  }, 650);
}

/* 120ms of filtered white noise — the "click" that sells the crash */
function noiseBurst() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const dur = 0.12;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buf;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.06;

    const hp = audioCtx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;

    src.connect(hp).connect(gain).connect(audioCtx.destination);
    src.start();
  } catch (_) { /* audio is a bonus, never a blocker */ }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode = saved || (prefersDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", mode === "dark");

  $("#theme-btn").addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    setTheme(next, { animate: true });
  });
}

/* =========================================================================
   2. TEXT SCRAMBLE  (one delegated listener, restores innerHTML on exit)
   ========================================================================= */
const GLYPHS = "!<>-_\\/[]{}—=+*^?#0123456789ABCDEF▒░█";
const ALNUM = /[a-zA-Z0-9]/;

function scramble(node, duration = 380) {
  if (!node || node._scrambling || !hasFinePointer.matches) return;
  if (reduceMotion.matches) return;

  const original = node.textContent;
  if (!original) return;

  const originalHTML = node.innerHTML;
  const frames = Math.max(6, Math.round(duration / 34));
  let frame = 0;

  node._scrambling = true;
  node._restore = originalHTML;
  node.setAttribute("data-scrambling", "");

  const step = () => {
    if (!node._scrambling) {
      node.innerHTML = node._restore;
      node.removeAttribute("data-scrambling");
      return;
    }
    const progress = frame / frames;
    const revealed = Math.floor(progress * original.length);

    let out = "";
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      out += (i < revealed || !ALNUM.test(ch))
        ? ch
        : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    node.textContent = out;
    frame++;

    if (frame > frames) {
      node.innerHTML = originalHTML;
      node._scrambling = false;
      node.removeAttribute("data-scrambling");
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function cancelScramble(node) {
  if (node && node._scrambling) {
    node._scrambling = false;
    if (node._restore != null) node.innerHTML = node._restore;
    node.removeAttribute("data-scrambling");
  }
}

function wireScramble() {
  if (reduceMotion.matches) return;

  document.addEventListener("mouseover", (e) => {
    const hit = e.target.closest("[data-scramble], .card, .reach__row");
    if (!hit || hit.contains(e.relatedTarget)) return;

    const targets = hit.matches("[data-scramble]")
      ? [hit]
      : $$("[data-scramble], .card__name", hit);

    targets.forEach((t, i) => setTimeout(() => scramble(t, 340 + i * 60), i * 40));
  });

  document.addEventListener("mouseout", (e) => {
    const hit = e.target.closest("[data-scramble], .card, .reach__row");
    if (!hit || hit.contains(e.relatedTarget)) return;
    $$("[data-scramble], .card__name", hit).forEach(cancelScramble);
  });
}

/* =========================================================================
   3. TICKER
   ========================================================================= */
function buildTicker() {
  const track = $("#ticker-track");
  const viewport = $(".ticker__viewport");
  if (!track || !viewport) return;

  const items = [
    "learning in public",
    "open to collab",
    "blue team",
    "linux · debian",
    "networking · tcp/ip",
    "local ai · ollama",
    "no trackers",
  ];

  const set = items.map((t) => `<span class="ticker__item">${t}</span>`).join("");

  // 1. repeat until ONE copy is at least as wide as the viewport
  track.innerHTML = set;
  let guard = 0;
  while (track.scrollWidth < viewport.clientWidth && guard++ < 12) {
    track.innerHTML += set;
  }

  // 2. duplicate the whole copy exactly once — -50% now loops seamlessly
  const one = track.innerHTML;
  track.innerHTML = one + one;
}

/* =========================================================================
   4. TERMINAL TYPING
   ========================================================================= */
const TERM_LINES = [
  { cmd: "whoami", out: "mohammed bagdid — cybersecurity", cls: "term__out" },
  { cmd: "cat ./focus", out: "blue team · linux · self-hosted ai", cls: "term__ok" },
  { cmd: "ls ./repos", out: "ollama_project/", cls: "term__ok" },
];

function runTerminal() {
  const body = $("#term-body");
  if (!body) return;

  const renderAll = () => {
    body.innerHTML = "";
    TERM_LINES.forEach((l) => {
      body.appendChild(el("div", "term__line",
        `<span class="term__p">$</span> <span class="term__cmd">${esc(l.cmd)}</span>`));
      body.appendChild(el("div", "term__line",
        `<span class="term__dim">›</span> <span class="${l.cls}">${esc(l.out)}</span>` +
        (l.tail ? `<span class="term__dim">${l.tail}</span>` : "")));
    });
    body.appendChild(el("div", "term__line", '<span class="term__p">$</span> <span class="caret"></span>'));
  };

  if (reduceMotion.matches) { renderAll(); return; }

  body.innerHTML = "";
  let i = 0;

  const nextLine = () => {
    if (i >= TERM_LINES.length) {
      body.appendChild(el("div", "term__line", '<span class="term__p">$</span> <span class="caret"></span>'));
      return;
    }
    const line = TERM_LINES[i];
    const row = el("div", "term__line",
      '<span class="term__p">$</span> <span class="term__cmd"></span><span class="caret"></span>');
    const cmdSpan = $(".term__cmd", row);
    body.appendChild(row);

    let c = 0;
    const type = () => {
      if (c <= line.cmd.length) {
        cmdSpan.textContent = line.cmd.slice(0, c);
        c++;
        setTimeout(type, 28 + Math.random() * 40);
      } else {
        const caret = $(".caret", row);
        if (caret) caret.remove();
        setTimeout(() => {
          body.appendChild(el("div", "term__line",
            `<span class="term__dim">›</span> <span class="${line.cls}">${esc(line.out)}</span>` +
            (line.tail ? `<span class="term__dim">${line.tail}</span>` : "")));
          i++;
          setTimeout(nextLine, 260);
        }, 180);
      }
    };
    setTimeout(type, 220);
  };

  nextLine();
}

/* =========================================================================
   5. RENDER
   ========================================================================= */
function renderProjects() {
  const list = $("#project-list");
  if (!list) return;

  list.innerHTML = PROJECTS.map((p, i) => {
    const demo = p.demo
      ? `<a class="card__link" href="${esc(p.demo)}" target="_blank" rel="noopener">
           live demo <span class="arrow" aria-hidden="true">↗</span>
         </a>`
      : `<span class="card__link card__link--static">in progress</span>`;

    return `
    <article class="card reveal">
      <div class="card__top">
        <span class="card__idx">${String(i + 1).padStart(2, "0")}</span>
        <span class="card__state">${esc(p.state)}</span>
      </div>
      <h3 class="card__name" data-scramble>${esc(p.name)}</h3>
      <p class="card__desc">${esc(p.desc)}</p>
      <div class="card__tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="card__foot">
        ${demo}
        <a class="card__repo" href="${esc(p.repo)}" target="_blank" rel="noopener">repo →</a>
      </div>
    </article>
  `;
  }).join("");
}

function renderCerts() {
  const list = $("#cert-list");
  if (!list) return;

  const toneClass = { planned: "cert__bar--plan", studying: "cert__bar--study", passed: "cert__bar--ok" };

  list.innerHTML = CERTS.map((c) => `
    <li class="cert reveal">
      <span class="cert__bar ${toneClass[c.status] || ""}" aria-hidden="true"></span>
      <span class="cert__name">${esc(c.name)}</span>
      <span class="cert__issuer">${esc(c.issuer)}</span>
      <span class="cert__status cert__status--${esc(c.status)}">${esc(c.status)}</span>
      ${c.verify
        ? `<a class="cert__verify" href="${esc(c.verify)}" target="_blank" rel="noopener">verify</a>`
        : `<span class="cert__verify cert__verify--pending" aria-hidden="true">—</span>`}
    </li>
  `).join("");
}

/* =========================================================================
   6. OBSERVERS  (reveal + active nav)
   ========================================================================= */
function wireReveal() {
  const nodes = $$(".reveal");
  if (!nodes.length) return;

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("in"));
    return;
  }

  // anything already on screen at load is revealed in the same frame — no flash
  const vh = window.innerHeight;
  const pending = [];
  nodes.forEach((n) => {
    if (n.getBoundingClientRect().top < vh * 0.92) n.classList.add("in");
    else pending.push(n);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  pending.forEach((n) => io.observe(n));
}

function wireActiveNav() {
  const links = $$(".nav__link");
  const sections = links
    .map((l) => (l.getAttribute("href").startsWith("#") ? document.querySelector(l.getAttribute("href")) : null))
    .filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) =>
        l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id)
      );
    });
  }, { rootMargin: "-15% 0px -70% 0px" });

  sections.forEach((s) => io.observe(s));
}

/* =========================================================================
   7. MISC
   ========================================================================= */
function wireCopy() {
  const btn = $("#copy-mail");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      toast("copied · " + value);
    } catch (_) {
      window.location.href = "mailto:" + value;
    }
  });
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function wireUptime() {
  const node = $("#uptime");
  if (!node) return;
  const start = Date.now();
  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const s = Math.floor((Date.now() - start) / 1000);
    node.textContent =
      `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ============================================================ bootstrap */
function init() {
  initTheme();
  buildTicker();
  renderProjects();
  renderCerts();

  wireScramble();
  wireCopy();
  wireUptime();

  // after the DOM above exists
  wireReveal();
  wireActiveNav();
  runTerminal();

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
