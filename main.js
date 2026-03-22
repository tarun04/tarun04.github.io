/* ═══════════════════════════════════════════════════════
   v4 — THE LIVING PORTFOLIO ENGINE
   Time · Themes · Command Palette · Sky · Interactions
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // OS Detection
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ||
                (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');
  const modKey = isMac ? '⌘' : 'Ctrl';

  // Update keyboard shortcuts to match OS
  function updateShortcutLabels() {
    $$('.kbd-shortcut').forEach(el => el.textContent = `${modKey} K`);
  }

  // ═══════════ 1. THEME ENGINE ═══════════
  const THEMES = {
    night: { label: 'Night Mode', greeting: 'Good evening —', range: [20, 5] },
    dawn:  { label: 'Dawn Mode',  greeting: 'Good morning —', range: [5, 8] },
    day:   { label: 'Day Mode',   greeting: 'Good afternoon —', range: [8, 17] },
    dusk:  { label: 'Dusk Mode',  greeting: 'Good evening —', range: [17, 20] },
  };

  let currentTheme = 'night';
  let manualOverride = false;

  function getAutoTheme() {
    const h = new Date().getHours();
    if (h >= 5 && h < 8) return 'dawn';
    if (h >= 8 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'dusk';
    return 'night';
  }

  function setTheme(theme, animate = true) {
    currentTheme = theme;
    const html = document.documentElement;

    if (animate) {
      document.body.classList.add('theme-transitioning');
      setTimeout(() => document.body.classList.remove('theme-transitioning'), 800);
    }

    html.setAttribute('data-theme', theme);

    const greetingEl = $('#greeting');
    if (greetingEl) {
      const h = new Date().getHours();
      if (theme === 'day' && h < 12) {
        greetingEl.textContent = 'Good morning —';
      } else if (theme === 'day') {
        greetingEl.textContent = 'Good afternoon —';
      } else {
        greetingEl.textContent = THEMES[theme].greeting;
      }
    }

    const label = $('#theme-label');
    if (label) label.textContent = THEMES[theme].label;

    // Restart sky rendering with new palette
    if (skyCtx) initSkyColors();
  }

  function cycleTheme() {
    manualOverride = true;
    const order = ['night', 'dawn', 'day', 'dusk'];
    const idx = order.indexOf(currentTheme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }

  // ═══════════ 2. BOOT SEQUENCE ═══════════
  const bootLines = [
    { text: 'LIVING PORTFOLIO v4.0', cls: 'boot__line--accent', delay: 70 },
    { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: 'boot__line--dim', delay: 30 },
    { text: `Detecting time of day... ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}`, cls: '', delay: 110 },
    { text: `[OK] Theme: ${THEMES[getAutoTheme()].label}`, cls: 'boot__line--ok', delay: 90 },
    { text: '[OK] Ambient sky renderer loaded', cls: 'boot__line--ok', delay: 70 },
    { text: '[OK] Command palette ready (⌘K)', cls: 'boot__line--ok', delay: 60 },
    { text: '[OK] 3D transforms calibrated', cls: 'boot__line--ok', delay: 50 },
    { text: '', cls: 'boot__line--dim', delay: 30 },
    { text: 'All systems nominal.', cls: 'boot__line--accent', delay: 120 },
  ];

  async function runBoot() {
    const bootOverlay = $('#boot');
    const linesEl = $('#boot-lines');
    const typingEl = $('#boot-typing');
    const main = $('#main-content');

    // Set initial theme color in boot
    const style = document.createElement('style');
    const auto = getAutoTheme();
    const bootAccent = getComputedStyle(document.documentElement).getPropertyValue('--boot-color').trim() || '#6c8cff';

    for (const line of bootLines) {
      const el = document.createElement('div');
      el.className = `boot__line ${line.cls}`;
      el.textContent = line.text;
      linesEl.appendChild(el);
      await sleep(line.delay);
    }

    await sleep(180);

    const cmd = 'launch portfolio --theme=auto';
    for (let i = 0; i < cmd.length; i++) {
      typingEl.textContent += cmd[i];
      await sleep(22 + Math.random() * 25);
    }

    await sleep(350);

    // Apply auto theme
    setTheme(auto, false);

    // Dissolve boot
    bootOverlay.classList.add('done');
    main.classList.add('visible');

    setTimeout(() => {
      updateShortcutLabels();
      initSky();
      initAnimations();
      initScrollReveals();
    }, 150);

    setTimeout(() => bootOverlay.remove(), 1000);
  }

  // ═══════════ 3. AMBIENT SKY CANVAS ═══════════
  let skyCtx = null;
  let skyW = 0, skyH = 0;
  let skyObjects = [];

  const SKY_PALETTES = {
    night: { bgTop: [5,5,16], bgBottom: [13,13,26], particles: [[108,140,255],[150,176,255],[200,200,240]], count: 100, glow: true },
    dawn:  { bgTop: [252,228,214], bgBottom: [253,240,232], particles: [[224,120,80],[255,180,140],[255,160,100]], count: 40, glow: false },
    day:   { bgTop: [220,232,255], bgBottom: [240,244,255], particles: [[37,99,235],[100,150,255],[180,200,255]], count: 30, glow: false },
    dusk:  { bgTop: [26,15,36], bgBottom: [42,20,34], particles: [[232,128,74],[240,160,106],[200,100,80]], count: 60, glow: true },
  };

  let skyPalette = SKY_PALETTES.night;

  function initSkyColors() {
    skyPalette = SKY_PALETTES[currentTheme] || SKY_PALETTES.night;
  }

  function initSky() {
    const canvas = $('#sky-canvas');
    if (!canvas) return;
    skyCtx = canvas.getContext('2d');

    function resize() {
      skyW = canvas.width = window.innerWidth;
      skyH = canvas.height = window.innerHeight;
    }

    function createObjects() {
      skyObjects = [];
      const count = skyPalette.count;
      for (let i = 0; i < count; i++) {
        skyObjects.push({
          x: Math.random() * skyW,
          y: Math.random() * skyH,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    }

    initSkyColors();
    resize();
    createObjects();

    let mouse = { x: -999, y: -999 };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('resize', () => { resize(); createObjects(); });

    function draw() {
      // Gradient background
      const grad = skyCtx.createLinearGradient(0, 0, 0, skyH);
      const t = skyPalette.bgTop;
      const b = skyPalette.bgBottom;
      grad.addColorStop(0, `rgb(${t[0]},${t[1]},${t[2]})`);
      grad.addColorStop(1, `rgb(${b[0]},${b[1]},${b[2]})`);
      skyCtx.fillStyle = grad;
      skyCtx.fillRect(0, 0, skyW, skyH);

      const pal = skyPalette.particles;

      for (const obj of skyObjects) {
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.pulse += obj.pulseSpeed;

        // Wrap
        if (obj.x < -10) obj.x = skyW + 10;
        if (obj.x > skyW + 10) obj.x = -10;
        if (obj.y < -10) obj.y = skyH + 10;
        if (obj.y > skyH + 10) obj.y = -10;

        // Mouse interaction
        const dx = obj.x - mouse.x;
        const dy = obj.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = 180;
        if (dist < mouseRadius) {
          const force = (mouseRadius - dist) / mouseRadius;
          obj.x += dx * force * 0.015;
          obj.y += dy * force * 0.015;
        }

        const pulseAlpha = obj.alpha + Math.sin(obj.pulse) * 0.15;
        const c = pal[Math.floor(Math.random() * 1000) % pal.length];

        // Glow (night/dusk)
        if (skyPalette.glow && obj.r > 1.2) {
          skyCtx.beginPath();
          skyCtx.arc(obj.x, obj.y, obj.r * 4, 0, Math.PI * 2);
          skyCtx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${pulseAlpha * 0.08})`;
          skyCtx.fill();
        }

        // Dot
        skyCtx.beginPath();
        skyCtx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
        skyCtx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${pulseAlpha})`;
        skyCtx.fill();

        // Connections (only for nearby in night/dusk)
        if (skyPalette.glow) {
          for (const other of skyObjects) {
            if (other === obj) continue;
            const ddx = obj.x - other.x;
            const ddy = obj.y - other.y;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            if (d < 120) {
              skyCtx.beginPath();
              skyCtx.moveTo(obj.x, obj.y);
              skyCtx.lineTo(other.x, other.y);
              skyCtx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(1 - d / 120) * 0.06})`;
              skyCtx.lineWidth = 0.4;
              skyCtx.stroke();
            }
          }
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }

  // ═══════════ 4. COMMAND PALETTE ═══════════
  const cmdCommands = [
    { icon: '🏠', label: 'Go Home',          action: () => scrollTo('#home'),     shortcut: '' },
    { icon: '💼', label: 'View Experience',   action: () => scrollTo('#experience'), shortcut: '' },
    { icon: '🛠', label: 'View Projects',     action: () => scrollTo('#projects'),   shortcut: '' },
    { icon: '✉️', label: 'Contact Me',        action: () => scrollTo('#contact'),    shortcut: '' },
    { icon: '🌙', label: 'Night Theme',       action: () => { manualOverride = true; setTheme('night'); }, shortcut: '' },
    { icon: '🌅', label: 'Dawn Theme',        action: () => { manualOverride = true; setTheme('dawn'); },  shortcut: '' },
    { icon: '☀️', label: 'Day Theme',         action: () => { manualOverride = true; setTheme('day'); },   shortcut: '' },
    { icon: '🌇', label: 'Dusk Theme',        action: () => { manualOverride = true; setTheme('dusk'); },  shortcut: '' },
    { icon: '🔄', label: 'Auto Theme (time)', action: () => { manualOverride = false; setTheme(getAutoTheme()); }, shortcut: '' },
    { icon: '🔗', label: 'GitHub',            action: () => window.open('https://github.com/tarun04', '_blank'), shortcut: '' },
    { icon: '🔗', label: 'LinkedIn',          action: () => window.open('https://www.linkedin.com/in/tarunn04', '_blank'), shortcut: '' },
    { icon: '📧', label: 'Send Email',        action: () => window.location.href = 'mailto:tarunreddy.04@gmail.com', shortcut: '' },
  ];

  function initCommandPalette() {
    const overlay = $('#cmd-overlay');
    const input = $('#cmd-input');
    const results = $('#cmd-results');
    const trigger = $('#cmd-trigger');

    function renderResults(query = '') {
      const q = query.toLowerCase().trim();
      const filtered = q ? cmdCommands.filter(c => c.label.toLowerCase().includes(q)) : cmdCommands;
      results.innerHTML = filtered.map((c, i) =>
        `<div class="cmd-item${i === 0 ? ' selected' : ''}" data-idx="${cmdCommands.indexOf(c)}">
          <span class="cmd-item__icon">${c.icon}</span>
          <span class="cmd-item__label">${c.label}</span>
          ${c.shortcut ? `<span class="cmd-item__shortcut">${c.shortcut}</span>` : ''}
        </div>`
      ).join('');
    }

    function openPalette() {
      overlay.classList.add('open');
      input.value = '';
      renderResults();
      setTimeout(() => input.focus(), 100);
    }

    function closePalette() {
      overlay.classList.remove('open');
      input.blur();
    }

    function executeSelected() {
      const sel = results.querySelector('.cmd-item.selected');
      if (sel) {
        const idx = parseInt(sel.dataset.idx, 10);
        cmdCommands[idx].action();
        closePalette();
      }
    }

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        overlay.classList.contains('open') ? closePalette() : openPalette();
      }
      if (e.key === 'Escape') closePalette();
    });

    // Button trigger
    if (trigger) trigger.addEventListener('click', openPalette);

    // Close on overlay click
    overlay.addEventListener('click', e => { if (e.target === overlay) closePalette(); });

    // Filter
    input.addEventListener('input', () => renderResults(input.value));

    // Arrow keys & Enter
    input.addEventListener('keydown', e => {
      const items = $$('.cmd-item', results);
      const current = results.querySelector('.cmd-item.selected');
      const idx = items.indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items.forEach(i => i.classList.remove('selected'));
        items[(idx + 1) % items.length]?.classList.add('selected');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items.forEach(i => i.classList.remove('selected'));
        items[(idx - 1 + items.length) % items.length]?.classList.add('selected');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected();
      }
    });

    // Click on item
    results.addEventListener('click', e => {
      const item = e.target.closest('.cmd-item');
      if (item) {
        const idx = parseInt(item.dataset.idx, 10);
        cmdCommands[idx].action();
        closePalette();
      }
    });
  }

  function scrollTo(sel) {
    const el = $(sel);
    if (el) window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' });
  }

  // ═══════════ 5. CUSTOM CURSOR ═══════════
  const cursorDot = $('#cursor-dot');
  const cursorRing = $('#cursor-ring');

  if (cursorDot && cursorRing) {
    let cx = 0, cy = 0, tx = 0, ty = 0;

    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      cursorDot.style.left = tx + 'px';
      cursorDot.style.top = ty + 'px';
    });

    function ringLoop() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursorRing.style.left = cx + 'px';
      cursorRing.style.top = cy + 'px';
      requestAnimationFrame(ringLoop);
    }
    ringLoop();

    const interactives = 'a, button, .btn, .tag, .nav__link, .magnetic, input, textarea, .cmd-item';
    document.addEventListener('mouseover', e => { if (e.target.closest(interactives)) { cursorDot.classList.add('hovering'); cursorRing.classList.add('hovering'); } });
    document.addEventListener('mouseout', e => { if (e.target.closest(interactives)) { cursorDot.classList.remove('hovering'); cursorRing.classList.remove('hovering'); } });
    document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursorRing.classList.remove('clicking'));
  }

  // ═══════════ 6. MAGNETIC EFFECT ═══════════
  $$('.magnetic').forEach(el => {
    const str = parseInt(el.dataset.strength || 10, 10);
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) / str}px, ${(e.clientY - r.top - r.height / 2) / str}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => el.style.transition = '', 400);
    });
  });

  // ═══════════ 7. 3D CARD TILT ═══════════
  $$('.tilt-card').forEach(card => {
    const glow = card.querySelector('.card-glow');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = ((y - r.height / 2) / (r.height / 2)) * -5;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 5;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.015,1.015,1.015)`;
      if (glow) { glow.style.setProperty('--gx', x + 'px'); glow.style.setProperty('--gy', y + 'px'); }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => card.style.transition = '', 500);
    });
    card.addEventListener('mouseenter', () => { card.style.transition = ''; });
  });

  // ═══════════ 8. TEXT SCRAMBLE ═══════════
  class TextScramble {
    constructor(el) { this.el = el; this.chars = '!<>-_\\/[]{}—=+*^?#________'; this.og = el.textContent; }
    scramble() {
      const text = this.og; let i = 0;
      const iv = setInterval(() => {
        this.el.textContent = text.split('').map((c, j) => j < i / 3 ? text[j] : this.chars[Math.floor(Math.random() * this.chars.length)]).join('');
        if (++i >= text.length * 3) { clearInterval(iv); this.el.textContent = text; }
      }, 30);
    }
  }

  // ═══════════ 9. ANIMATED COUNTERS ═══════════
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target), suffix = el.dataset.suffix || '', start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / 1500, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  // ═══════════ 10. SCROLL PROGRESS ═══════════
  function initScrollProgress() {
    const bar = $('#scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (window.scrollY / h * 100) + '%';
    }, { passive: true });
  }

  // ═══════════ 11. SCROLL REVEALS ═══════════
  function initScrollReveals() {
    const fadeObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), parseInt(e.target.dataset.delay || 0, 10)); fadeObs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    $$('.anim-fade').forEach(el => fadeObs.observe(el));

    // Title lines
    const lineObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('revealed'), parseInt(e.target.dataset.delay || 0, 10)); lineObs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    $$('.anim-reveal').forEach(el => lineObs.observe(el));

    // Scramble
    const scrambleEls = $$('.scramble-text');
    const scrambleInst = scrambleEls.map(el => new TextScramble(el));
    const scrambleObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { const i = scrambleEls.indexOf(e.target); if (i !== -1) scrambleInst[i].scramble(); scrambleObs.unobserve(e.target); } });
    }, { threshold: 0.3 });
    scrambleEls.forEach(el => scrambleObs.observe(el));

    // Counters
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$('.counter').forEach(el => counterObs.observe(el));

    // Cards
    const cards = $$('.xp-panel, .proj-tile, .section__head, .footer__layout, .footer__top, .hero__info-block');
    cards.forEach(el => { el.classList.add('anim-fade'); fadeObs.observe(el); });
  }

  // ═══════════ 12. NAVIGATION — FLOATING ISLAND ═══════════
  function initAnimations() {
    const nav = $('#navbar');
    const navLinks = $$('.nav-island__link');
    const slider = $('#nav-slider');
    const sections = $$('section[id], footer[id]');
    const brand = $('#nav-brand');

    // ─── Sliding indicator ───
    function moveSlider(activeLink) {
      if (!slider || !activeLink) return;
      const container = activeLink.parentElement;
      const containerRect = container.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      slider.style.left = (linkRect.left - containerRect.left) + 'px';
      slider.style.width = linkRect.width + 'px';
    }

    // Initial slider position
    function initSlider() {
      const active = $('.nav-island__link.active');
      if (active && slider) {
        slider.classList.add('glowing');
        // Need a small delay so DOM measurements are correct
        requestAnimationFrame(() => moveSlider(active));
      }
    }

    // Re-measure on resize
    window.addEventListener('resize', initSlider);

    // ─── Scroll-based active link + nav state ───
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      const y = window.scrollY + window.innerHeight * 0.35;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (y >= sections[i].offsetTop) {
          const href = '#' + sections[i].id;
          const link = $(`.nav-island__link[href="${href}"]`);
          if (link && !link.classList.contains('active')) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            moveSlider(link);
          }
          break;
        }
      }
    }, { passive: true });

    // ─── Click handlers ───
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        moveSlider(link);
        scrollTo(link.getAttribute('href'));
        // Close mobile menu
        $('#nav-menu').classList.remove('mobile-open');
        const toggle = $('#nav-toggle');
        if (toggle) toggle.classList.remove('open');
      });

      // Hover preview
      link.addEventListener('mouseenter', () => moveSlider(link));
      link.addEventListener('mouseleave', () => {
        const active = $('.nav-island__link.active');
        if (active) moveSlider(active);
      });
    });

    // Brand click
    if (brand) {
      brand.addEventListener('click', e => {
        e.preventDefault();
        scrollTo('#home');
      });
    }

    // Mobile burger
    const toggle = $('#nav-toggle');
    if (toggle) toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      $('#nav-menu').classList.toggle('mobile-open');
    });

    // Theme toggle
    const themeBtn = $('#theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

    // Year
    const yr = $('#currentYear');
    if (yr) yr.textContent = new Date().getFullYear();

    // Init slider after a frame so layout is computed
    requestAnimationFrame(() => setTimeout(initSlider, 50));

    initScrollProgress();
    initCommandPalette();
  }

  // ═══════════ KICKOFF ═══════════
  document.addEventListener('DOMContentLoaded', runBoot);
})();
