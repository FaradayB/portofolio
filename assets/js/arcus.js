/* ============================================================================
   ARCUS // Orbal Portfolio — shared interaction engine
   ============================================================================ */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Boot flash: fade out the overlay on load ------------------------- */
  const boot = document.querySelector('.boot');
  function bootOut() {
    if (!boot) return;
    boot.classList.remove('show');
  }

  /* ---- Page transition: flash overlay before navigating ----------------- */
  function go(href) {
    if (reduce || !boot) { window.location.href = href; return; }
    boot.classList.add('show', 'flash');
    setTimeout(() => { window.location.href = href; }, 520);
  }

  document.querySelectorAll('a[data-nav]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      // skip if it's the current page or an external/anchor link
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
      if (a.classList.contains('active')) { e.preventDefault(); return; }
      e.preventDefault();
      go(href);
    });
  });

  /* ---- Mobile nav toggle ------------------------------------------------ */
  const toggle = document.querySelector('.nav-toggle');
  const tabs = document.querySelector('.nav-tabs');
  if (toggle && tabs) {
    toggle.addEventListener('click', () => {
      tabs.classList.toggle('open');
      toggle.textContent = tabs.classList.contains('open') ? '✕ CLOSE' : '☰ MENU';
    });
  }

  /* ---- Active tab from body[data-page] ---------------------------------- */
  const page = document.body.getAttribute('data-page');
  if (page) {
    const active = document.querySelector(`.nav-tab[data-page="${page}"]`);
    if (active) active.classList.add('active');
  }

  /* ---- Scroll reveal ---------------------------------------------------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduce) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ---- Animated stat bars ----------------------------------------------- */
  function fillStats() {
    document.querySelectorAll('.stat-fill[data-pct]').forEach((el, i) => {
      const pct = el.getAttribute('data-pct');
      if (reduce) { el.style.width = pct + '%'; return; }
      setTimeout(() => { el.style.width = pct + '%'; }, 350 + i * 140);
    });
  }

  /* ---- Typewriter for STATUS name --------------------------------------- */
  function typewriter() {
    const el = document.querySelector('[data-typewriter]');
    if (!el) return;
    const full = el.getAttribute('data-typewriter');
    const cursor = '<span class="cursor">_</span>';
    if (reduce) { el.innerHTML = full + cursor; return; }
    let i = 0;
    el.innerHTML = cursor;
    const tick = () => {
      i++;
      el.innerHTML = full.slice(0, i) + cursor;
      if (i < full.length) setTimeout(tick, 75);
    };
    setTimeout(tick, 450);
  }

  /* ---- Init ------------------------------------------------------------- */
  window.addEventListener('load', () => {
    requestAnimationFrame(() => setTimeout(bootOut, 60));
  });
  // also hide boot on pageshow (covers back/forward cache)
  window.addEventListener('pageshow', bootOut);

  document.addEventListener('DOMContentLoaded', () => {
    typewriter();
    fillStats();
  });
})();
