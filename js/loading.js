/**
 * loading.js — Elite Route Loader
 * ─────────────────────────────────────────────────────────────────
 * Features:
 *  1. Page-entry loading screen with animated logo + progress bar
 *  2. Route/link click interceptor  → brief transition loader
 *  3. Button click interceptor      → ripple + spinner feedback
 *  4. Image lazy-load skeleton      → shimmer while src loads
 *  5. NProgress-style top bar       → always-visible progress strip
 * ─────────────────────────────────────────────────────────────────
 * Usage: Add  <script src="js/loading.js"></script>
 *        anywhere inside <body> of index2.html  (before closing tag).
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     0.  INJECT STYLES
  ═══════════════════════════════════════════════════════ */
  const CSS = `
    /* ── Variables (mirror index2 palette) ── */
    :root {
      --lr-red   : #ff3b30;
      --lr-dark  : #0f0f11;
      --lr-card  : #1c1c1f;
      --lr-muted : #a1a1aa;
    }

    /* ══════════════════════════════════════
       ENTRY LOADER  (full-screen overlay)
    ══════════════════════════════════════ */
    #elr-entry {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: var(--lr-dark);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 36px;
      transition: opacity .55s ease, visibility .55s ease;
    }
    #elr-entry.elr-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    /* ── Animated car silhouette icon ── */
    .elr-icon-wrap {
      position: relative;
      width: 90px;
      height: 90px;
    }
    .elr-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid transparent;
    }
    .elr-ring-outer {
      border-top-color: var(--lr-red);
      border-right-color: rgba(255,59,48,.3);
      animation: elr-spin 1.2s linear infinite;
    }
    .elr-ring-inner {
      inset: 14px;
      border-bottom-color: var(--lr-red);
      border-left-color: rgba(255,59,48,.2);
      animation: elr-spin .8s linear infinite reverse;
    }
    .elr-icon-center {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--lr-red);
      animation: elr-pulse 1.2s ease-in-out infinite;
    }

    /* ── Logo text ── */
    .elr-logo-txt {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: #f4f4f5;
      text-align: center;
      line-height: 1;
    }
    .elr-logo-txt span { color: var(--lr-red); }
    .elr-logo-sub {
      display: block;
      font-size: .45rem;
      letter-spacing: 3px;
      color: var(--lr-red);
      margin-top: 5px;
      font-weight: 600;
    }

    /* ── Progress bar ── */
    .elr-bar-wrap {
      width: 200px;
      height: 2px;
      background: rgba(255,59,48,.15);
      border-radius: 2px;
      overflow: hidden;
    }
    .elr-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #ff3b30, #ff6b63);
      border-radius: 2px;
      transition: width .4s cubic-bezier(.4,0,.2,1);
    }

    /* ── Tagline ── */
    .elr-tagline {
      font-family: 'Montserrat', sans-serif;
      font-size: .6rem;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--lr-muted);
      animation: elr-fade-blink 1.5s ease-in-out infinite;
    }

    /* ══════════════════════════════════════
       TOP PROGRESS STRIP
    ══════════════════════════════════════ */
    #elr-nprogress {
      position: fixed;
      top: 0; left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #ff3b30 0%, #ff6b63 60%, #fff 100%);
      z-index: 99998;
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 10px rgba(255,59,48,.6), 0 0 5px rgba(255,59,48,.4);
      transition: width .3s ease, opacity .4s ease;
      opacity: 0;
    }
    #elr-nprogress.elr-np-active { opacity: 1; }

    /* ══════════════════════════════════════
       TRANSITION VEIL  (link nav overlay)
    ══════════════════════════════════════ */
    #elr-veil {
      position: fixed;
      inset: 0;
      z-index: 99997;
      background: rgba(15,15,17,.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity .3s ease;
    }
    #elr-veil.elr-veil-on {
      opacity: 1;
      pointer-events: all;
    }
    .elr-veil-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255,59,48,.2);
      border-top-color: var(--lr-red);
      border-radius: 50%;
      animation: elr-spin .7s linear infinite;
    }

    /* ══════════════════════════════════════
       IMAGE SKELETON / SHIMMER
    ══════════════════════════════════════ */
    .elr-img-skeleton {
      position: relative;
      overflow: hidden;
      background: var(--lr-card);
    }
    .elr-img-skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255,59,48,.08) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: elr-shimmer 1.4s ease infinite;
    }
    .elr-img-skeleton img {
      opacity: 0;
      transition: opacity .4s ease;
    }
    .elr-img-loaded img { opacity: 1; }
    .elr-img-loaded::after { display: none; }

    /* ══════════════════════════════════════
       BUTTON RIPPLE
    ══════════════════════════════════════ */
    .elr-ripple-host {
      position: relative;
      overflow: hidden;
    }
    .elr-ripple-wave {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,59,48,.35);
      transform: scale(0);
      animation: elr-ripple .55s ease-out forwards;
      pointer-events: none;
    }

    /* ══════════════════════════════════════
       KEYFRAMES
    ══════════════════════════════════════ */
    @keyframes elr-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes elr-pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: .6; transform: scale(.9); }
    }
    @keyframes elr-fade-blink {
      0%,100% { opacity: .4; }
      50%      { opacity: 1; }
    }
    @keyframes elr-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    @keyframes elr-ripple {
      to { transform: scale(4); opacity: 0; }
    }
  `;

  function injectStyles () {
    const s = document.createElement('style');
    s.id = 'elr-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════════════
     1.  ENTRY LOADING SCREEN
  ═══════════════════════════════════════════════════════ */
  function buildEntryLoader () {
    const el = document.createElement('div');
    el.id = 'elr-entry';
    el.innerHTML = `
      <div class="elr-icon-wrap">
        <div class="elr-ring elr-ring-outer"></div>
        <div class="elr-ring elr-ring-inner"></div>
        <div class="elr-icon-center">
          <i class="fa-solid fa-car-side"></i>
        </div>
      </div>
      <div class="elr-logo-txt">
        ELITE <span>ROUTE</span>
        <small class="elr-logo-sub">Automobile Trading For Export</small>
      </div>
      <div class="elr-bar-wrap">
        <div class="elr-bar-fill" id="elr-bar"></div>
      </div>
      <div class="elr-tagline">Loading Experience&hellip;</div>
    `;
    document.body.prepend(el);
    return el;
  }

  function runEntryLoader () {
    const overlay = buildEntryLoader();
    const bar     = document.getElementById('elr-bar');
    let pct = 0;

    // Animate bar in stages
    const steps = [
      { target: 35,  delay: 80  },
      { target: 65,  delay: 320 },
      { target: 85,  delay: 600 },
      { target: 100, delay: 900 }
    ];
    steps.forEach(({ target, delay }) => {
      setTimeout(() => { bar.style.width = target + '%'; }, delay);
    });

    // Minimum display time = 1.4 s, then wait for DOM ready
    const minTime = new Promise(res => setTimeout(res, 1400));
    const domReady = new Promise(res => {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res);
    });

    Promise.all([minTime, domReady]).then(() => {
      overlay.classList.add('elr-hidden');
      setTimeout(() => overlay.remove(), 600);
    });
  }

  /* ═══════════════════════════════════════════════════════
     2.  TOP PROGRESS STRIP  (NProgress-lite)
  ═══════════════════════════════════════════════════════ */
  let npEl, npTimer, npPct = 0;

  function buildNP () {
    npEl = document.createElement('div');
    npEl.id = 'elr-nprogress';
    document.body.appendChild(npEl);
  }

  function npStart () {
    clearTimeout(npTimer);
    npPct = 0;
    npEl.style.width = '0%';
    npEl.classList.add('elr-np-active');
    npEl.style.transition = 'width .3s ease';
    // Trickle
    const trickle = () => {
      if (npPct < 90) {
        npPct += Math.random() * 15 + 5;
        npPct = Math.min(npPct, 90);
        npEl.style.width = npPct + '%';
        npTimer = setTimeout(trickle, 300 + Math.random() * 200);
      }
    };
    setTimeout(trickle, 100);
  }

  function npDone () {
    clearTimeout(npTimer);
    npEl.style.transition = 'width .2s ease, opacity .4s ease';
    npEl.style.width = '100%';
    setTimeout(() => {
      npEl.classList.remove('elr-np-active');
      npEl.style.width = '0%';
    }, 350);
  }

  /* ═══════════════════════════════════════════════════════
     3.  TRANSITION VEIL  (link/anchor clicks)
  ═══════════════════════════════════════════════════════ */
  let veilEl;

  function buildVeil () {
    veilEl = document.createElement('div');
    veilEl.id = 'elr-veil';
    veilEl.innerHTML = '<div class="elr-veil-spinner"></div>';
    document.body.appendChild(veilEl);
  }

  function showVeil ()  { veilEl.classList.add('elr-veil-on');    npStart(); }
  function hideVeil ()  { veilEl.classList.remove('elr-veil-on'); npDone();  }

  function interceptLinks () {
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href   = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');

      // Skip: anchors, void, new-tab, tel/mailto, js-void, modal triggers
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('javascript') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        href.startsWith('whatsapp') ||
        target === '_blank'
      ) return;

      // Same-page hash scroll → skip
      try {
        const url = new URL(href, location.href);
        if (url.origin === location.origin && url.pathname === location.pathname && url.hash) return;
      } catch (_) {}

      // Show loader, then navigate
      e.preventDefault();
      showVeil();
      setTimeout(() => { location.href = href; }, 700);
    }, true);
  }

  // Also hide veil on popstate / bfcache restore
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) hideVeil();
  });

  /* ═══════════════════════════════════════════════════════
     4.  BUTTON RIPPLE + SPINNER FEEDBACK
  ═══════════════════════════════════════════════════════ */
  const BUTTON_SELECTORS = [
    'button',
    'input[type="submit"]',
    'input[type="button"]',
    '.btn',
    '[class*="btn-"]',
    '[class*="-btn"]'
  ].join(',');

  function addRipple (btn, e) {
    btn.classList.add('elr-ripple-host');
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;
    const wave   = document.createElement('span');
    wave.className = 'elr-ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }

  function interceptButtons () {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest(BUTTON_SELECTORS);
      if (!btn) return;

      // Ripple effect
      addRipple(btn, e);

      // Short top-bar flash for form submits / action buttons
      const isAction =
        btn.type === 'submit' ||
        btn.getAttribute('type') === 'submit' ||
        btn.classList.contains('btn-cta') ||
        btn.classList.contains('btn-hero') ||
        btn.id === 'viewMoreBtn';

      if (isAction) {
        npStart();
        setTimeout(npDone, 700);
      }
    }, true);
  }

  /* ═══════════════════════════════════════════════════════
     5.  IMAGE SKELETON / SHIMMER
  ═══════════════════════════════════════════════════════ */
  function wrapImageSkeleton (img) {
    // Skip already-wrapped, icons, tiny images, or SVGs
    if (
      img.closest('.elr-img-skeleton') ||
      img.width < 30 ||
      img.src.startsWith('data:') ||
      img.tagName !== 'IMG'
    ) return;

    const wrap = document.createElement('div');
    wrap.className = 'elr-img-skeleton';
    wrap.style.cssText = `
      display: inline-block;
      width: ${img.offsetWidth  || img.getAttribute('width')  || '100%'};
      height: ${img.offsetHeight || img.getAttribute('height') || 'auto'};
    `;
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);

    function onLoad () {
      wrap.classList.add('elr-img-loaded');
    }
    if (img.complete && img.naturalWidth) {
      onLoad();
    } else {
      img.addEventListener('load',  onLoad,  { once: true });
      img.addEventListener('error', onLoad,  { once: true }); // fail-safe: remove shimmer
    }
  }

  function initImageSkeletons () {
    document.querySelectorAll('img').forEach(wrapImageSkeleton);

    // Watch for dynamically added images (product cards etc.)
    const mo = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG') wrapImageSkeleton(node);
          node.querySelectorAll && node.querySelectorAll('img').forEach(wrapImageSkeleton);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ═══════════════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════════════ */
  function boot () {
    injectStyles();
    buildNP();
    buildVeil();
    runEntryLoader();
    interceptLinks();
    interceptButtons();

    // Images: wait for DOM content
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initImageSkeletons);
    } else {
      initImageSkeletons();
    }
  }

  boot();

})();