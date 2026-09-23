(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

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

  const searchable = [
    ["Infrastructure & cloud", "Azure Windows Linux VMware networking storage", "index.html#expertise"],
    ["Identity & security", "Active Directory Entra Intune MFA Conditional Access", "index.html#expertise"],
    ["Automation", "PowerShell Python Bash SQL Git CI", "index.html#expertise"],
    ["Experience", "infrastructure systems field engineering consulting leadership", "index.html#experience"],
    ["Defeat the Evil Wizard", "Godot GDScript action RPG platformer game development 15 champions multidirectional combat exploration puzzles bosses portals", "play-evil-wizard.html"],
    ["Recovery Readiness Auditor", "backup disaster recovery RPO RTO Python", "project-recovery.html"],
    ["Infrastructure Dependency Analyzer", "dependencies graph business impact Python", "project-dependency.html"],
    ["Employee Lifecycle Toolkit", "PowerShell onboarding offboarding identity", "project-lifecycle.html"],
    ["One qubit. Two outcomes.", "quantum qubit probability measurement", "qubit-preview-20260921/"]
  ];

  const theme = $("#theme");
  const savedTheme = localStorage.getItem("portfolio-theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  theme?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("portfolio-theme", next);
  });

  const nav = $("#primary-nav") || $("header nav");
  const menu = $("#menu");
  if (menu && nav) {
    const closeMenu = () => {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation");
    };
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  $$(".layer-controls button").forEach((button) => {
    button.addEventListener("click", () => {
      const i = Number(button.dataset.layer);
      $$(".layer-controls button").forEach((b, n) => {
        b.classList.toggle("active", n === i);
        b.setAttribute("aria-pressed", String(n === i));
      });
      $("#layer-title").textContent = layers[i][0];
      $("#layer-copy").textContent = layers[i][1];
      $("#layer-count").textContent = `${String(i + 1).padStart(2, "0")} / 05`;
    });
  });

  const tabs = $$('[role="tab"]');
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

  const searchDialog = $("#search-dialog");
  const searchInput = $("#search-input");
  const searchResults = $("#search-results");
  function showSearch() {
    if (!searchDialog) return;
    searchDialog.showModal();
    setTimeout(() => searchInput?.focus(), 0);
  }
  $("#search-open")?.addEventListener("click", showSearch);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName || "")) {
      event.preventDefault();
      showSearch();
    }
  });
  $$("[data-close]").forEach(b => b.addEventListener("click", () => b.closest("dialog")?.close()));
  searchInput?.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const matches = q ? searchable.filter(x => `${x[0]} ${x[1]}`.toLowerCase().includes(q)) : searchable.slice(0, 5);
    searchResults.innerHTML = matches.map(x => `<a href="${x[2]}"><strong>${x[0]}</strong><br><small>${x[1]}</small></a>`).join("");
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

  let animationPaused = false;
  $("#motion")?.addEventListener("click", (event) => {
    animationPaused = !animationPaused;
    event.currentTarget.setAttribute("aria-pressed", String(animationPaused));
    event.currentTarget.textContent = animationPaused ? "Resume animation" : "Pause animation";
  });

  const canvas = $("#network");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const nodes = Array.from({length: 15}, (_, i) => ({
      x: (i * 73 % 101) / 100,
      y: (i * 47 % 89) / 100,
      dx: ((i % 3) - 1) * .00022,
      dy: (((i + 1) % 3) - 1) * .00018
    }));
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    canvas.style.cursor = 'pointer';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', 'Explore connected systems: select a node, or press Enter for the next layer');
    let activeLayer = 0;
    canvas.addEventListener('pointerdown', event => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      const closest = nodes.map((n,i) => ({i,d:Math.hypot(n.x*rect.width-x,n.y*rect.height-y)})).sort((a,b)=>a.d-b.d)[0];
      activeLayer = closest.i % 5;
      document.querySelectorAll('.layer-controls button')[activeLayer]?.click();
    });
    canvas.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); activeLayer = (activeLayer+1)%5;
        document.querySelectorAll('.layer-controls button')[activeLayer]?.click();
      }
    });
    addEventListener("resize", resize);
    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const css = getComputedStyle(document.documentElement);
      const line = css.getPropertyValue("--line").trim();
      const accent = css.getPropertyValue("--accent").trim();
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
        if (!animationPaused && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          n.x += n.dx; n.y += n.dy;
          if (n.x < .02 || n.x > .98) n.dx *= -1;
          if (n.y < .02 || n.y > .98) n.dy *= -1;
        }
      });
      requestAnimationFrame(draw);
    }
    draw();
  }
})();
