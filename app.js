(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const experiencePath = location.pathname.toLowerCase();
  const protectedExperience = /\/games\//.test(experiencePath) || /geometric-lab/.test(experiencePath) || /project-geometric-ai\.html$/.test(experiencePath) || /project-battle-chess\.html$/.test(experiencePath) || /play-evil-wizard\.html$/.test(experiencePath);
  if (!protectedExperience && !document.body.classList.contains("no-handheld")) {
    if (!document.querySelector('link[href^="handheld-experience.css"]')) {
      const handheldStyle=document.createElement('link');handheldStyle.rel='stylesheet';handheldStyle.href='handheld-experience.css?v=20260924-release';document.head.append(handheldStyle);
    }
    if (!document.querySelector('script[src^="handheld-experience.js"]')) {
      const handheldScript=document.createElement('script');handheldScript.src='handheld-experience.js?v=20260924-release';handheldScript.defer=true;document.body.append(handheldScript);
    }
  }

  const layers = [
    ["Infrastructure", "Compute, storage, networks, and the foundations of dependable operations."],
    ["Identity & security", "Access, policy, endpoint posture, least privilege, and controls that make trust explicit."],
    ["Automation", "PowerShell, Python, scripting, repeatability, testing, and work that becomes easier to operate twice."],
    ["Technical leadership", "Clear decisions, escalation, documentation, mentoring, stakeholder communication, and accountable delivery."],
    ["Advanced computing", "Computer architecture, high-performance computing, quantum systems, and the engineering foundations required to work there."]
  ];

  const expertise = [
    {
      kicker: "INFRASTRUCTURE & CLOUD",
      title: "Build foundations that stay understandable under pressure.",
      copy: "Windows and Linux systems, Azure, virtualization, networking, storage, backup and recovery, endpoint platforms, and the operational discipline that ties them together.",
      tags: ["Windows", "Linux", "Azure", "VMware", "Networking"]
    },
    {
      kicker: "IDENTITY & SECURITY",
      title: "Treat access as architecture, not paperwork.",
      copy: "Active Directory, Entra ID, Microsoft 365, endpoint policy, MFA, Conditional Access, RBAC, BitLocker, hardening, audit evidence, and practical least-privilege controls.",
      tags: ["AD", "Entra ID", "M365", "Intune", "Security"]
    },
    {
      kicker: "AUTOMATION & SOFTWARE",
      title: "Make repeatable work explicit and testable.",
      copy: "PowerShell, Python, Bash, SQL, Git, structured data, deterministic tooling, CI, and automation designed to remain reviewable by the people who operate it.",
      tags: ["PowerShell", "Python", "Bash", "SQL", "Git"]
    },
    {
      kicker: "LEADERSHIP & OPERATIONS",
      title: "Technical depth matters most when it improves decisions.",
      copy: "Tier III escalation, root-cause analysis, incident and change discipline, documentation, vendor coordination, technical mentoring, project delivery, and communication under pressure.",
      tags: ["RCA", "ITSM", "Mentoring", "Vendors", "Delivery"]
    }
  ];

  // site-theme.js owns theme and motion preferences across all pages.

  // Navigation is owned by site-navigation.js so every standard page uses one handler.

  $$(".layer-controls button").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.layer);
      $$(".layer-controls button").forEach((b, n) => {
        b.classList.toggle("active", n === i);
        b.setAttribute("aria-pressed", String(n === i));
      });
      $("#layer-title").textContent = layers[i][0];
      $("#layer-copy").textContent = layers[i][1];
      if ($("#layer-count")) $("#layer-count").textContent = `${String(i + 1).padStart(2, "0")} / 05`;
    });
  });

  const tabs = $$('#expertise [role="tab"]');
  function setTab(i) {
    tabs.forEach((tab, n) => {
      tab.setAttribute("aria-selected", String(n === i));
      tab.tabIndex = n === i ? 0 : -1;
    });
    const item = expertise[i];
    $("#expert-panel")?.setAttribute("aria-labelledby", `tab-${i}`);
    if ($("#expert-kicker")) $("#expert-kicker").textContent = item.kicker;
    if ($("#expert-title")) $("#expert-title").textContent = item.title;
    if ($("#expert-copy")) $("#expert-copy").textContent = item.copy;
    if ($("#expert-tags")) $("#expert-tags").innerHTML = item.tags.map(x => `<span>${x}</span>`).join("");
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => setTab(i));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "ArrowDown" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
      setTab(next);
      tabs[next].focus();
    });
  });

  const filterButtons = $$(".filter-bar [data-filter]");
  const cards = $$(".project-card");
  filterButtons.forEach(button => button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(b => {
      const active = b === button;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    let visible = 0;
    cards.forEach(card => {
      const categories = (card.dataset.category || "").split(/\s+/);
      const show = filter === "all" || categories.includes(filter);
      card.hidden = !show;
      if (show) visible++;
    });
    if ($("#filter-count")) $("#filter-count").textContent = `${visible} project${visible === 1 ? "" : "s"}`;
  }));

  const toast = $("#toast");
  function notify(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1700);
  }
  $("#copy-email")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("randall.joshua@gmail.com");
      notify("Email copied");
    } catch {
      notify("Copy unavailable");
    }
  });

  let animationPaused = window.PortfolioTheme?.isPaused() || false;
  document.addEventListener('portfolio:motion', () => {
    animationPaused = window.PortfolioTheme?.isPaused() || false;
  });

  const canvas = $("#network");
  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (ctx) {
      const nodes = Array.from({length: 15}, (_, i) => ({
        x: (i * 73 % 101) / 100,
        y: (i * 47 % 89) / 100,
        dx: ((i % 3) - 1) * .00022,
        dy: (((i + 1) % 3) - 1) * .00018
      }));
      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const ua = navigator.userAgent || "";
      const inAppBrowser = /FBAN|FBAV|Instagram|Messenger|Line\/|; wv\)/i.test(ua);
      const constrained = Boolean(
        connection?.saveData ||
        /(^|-)2g$/.test(connection?.effectiveType || "") ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        inAppBrowser
      );
      let activeLayer = 0;
      let animationPaused = window.PortfolioTheme?.isPaused() || false;
      let visible = true;
      let raf = 0;
      let lastFrame = 0;
      let width = 0;
      let height = 0;
      let line = "";
      let accent = "";
      const frameInterval = 1000 / ((constrained || innerWidth < 700) ? 24 : 30);

      function syncColors() {
        const css = getComputedStyle(document.documentElement);
        line = css.getPropertyValue("--line").trim();
        accent = css.getPropertyValue("--accent").trim();
      }
      function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
      function schedule() {
        if (!raf && visible && !document.hidden && canvas.isConnected && !animationPaused && !reducedMotion.matches) {
          raf = requestAnimationFrame(draw);
        }
      }
      function resize() {
        const rect = canvas.getBoundingClientRect();
        width = Math.max(1, rect.width || canvas.clientWidth);
        height = Math.max(1, rect.height || canvas.clientHeight);
        const mobile = width < 700;
        const cap = constrained ? (mobile ? 1.2 : 1.4) : (mobile ? 1.4 : 1.75);
        const dpr = Math.min(devicePixelRatio || 1, cap);
        const nextWidth = Math.max(1, Math.floor(width * dpr));
        const nextHeight = Math.max(1, Math.floor(height * dpr));
        if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
          canvas.width = nextWidth;
          canvas.height = nextHeight;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(performance.now(), true);
      }
      function draw(now = performance.now(), force = false) {
        raf = 0;
        if (!canvas.isConnected || document.hidden || !visible) return;
        if (!force && now - lastFrame < frameInterval) {
          schedule();
          return;
        }
        lastFrame = now;
        const w = width || canvas.clientWidth;
        const h = height || canvas.clientHeight;
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => {
          const ax = a.x*w, ay = a.y*h, bx = b.x*w, by = b.y*h;
          const d = Math.hypot(ax-bx, ay-by);
          if (d < 150) {
            ctx.globalAlpha = Math.max(0, 1-d/150) * .55;
            ctx.strokeStyle = line;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          }
        }));
        ctx.globalAlpha = 1;
        nodes.forEach((n, i) => {
          ctx.fillStyle = i % 5 === 0 ? accent : line;
          ctx.beginPath(); ctx.arc(n.x*w, n.y*h, i % 5 === 0 ? 4 : 2.5, 0, Math.PI*2); ctx.fill();
          if (!animationPaused && !reducedMotion.matches) {
            n.x += n.dx; n.y += n.dy;
            if (n.x < .02 || n.x > .98) n.dx *= -1;
            if (n.y < .02 || n.y > .98) n.dy *= -1;
          }
        });
        schedule();
      }

      syncColors();
      canvas.style.cursor = 'pointer';
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'button');
      canvas.setAttribute('aria-label', 'Explore connected systems: select a node, or press Enter for the next layer');
      canvas.addEventListener('pointerdown', event => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left, y = event.clientY - rect.top;
        const closest = nodes.map((n,i) => ({i,d:Math.hypot(n.x*rect.width-x,n.y*rect.height-y)})).sort((a,b)=>a.d-b.d)[0];
        activeLayer = closest.i % 5;
        document.querySelectorAll('.layer-controls button')[activeLayer]?.click();
      });
      canvas.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activeLayer = (activeLayer+1)%5;
          document.querySelectorAll('.layer-controls button')[activeLayer]?.click();
        }
      });
      document.addEventListener('portfolio:motion', () => {
        animationPaused = window.PortfolioTheme?.isPaused() || false;
        if (animationPaused) stop(); else schedule();
      });
      document.addEventListener('portfolio:theme', () => {
        syncColors();
        draw(performance.now(), true);
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else { draw(performance.now(), true); schedule(); }
      });
      reducedMotion.addEventListener?.('change', () => {
        if (reducedMotion.matches) { stop(); draw(performance.now(), true); }
        else schedule();
      });

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          visible = Boolean(entries[0]?.isIntersecting);
          if (visible) { draw(performance.now(), true); schedule(); }
          else stop();
        }, { rootMargin: '160px 0px' });
        observer.observe(canvas);
      }
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
      else addEventListener("resize", resize, { passive: true });
      addEventListener('pagehide', stop, { once: true });
      resize();
      schedule();
    }
  }
})();
