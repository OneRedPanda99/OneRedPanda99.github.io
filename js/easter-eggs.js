/**
 * Hidden keyboard easter eggs.
 * psst… check the HTML comments too.
 *
 * Combos (ignored while typing in inputs):
 *   Ctrl+Shift+D  — dark mode (persists)
 *   Ctrl+Alt+R    — rainbow hue spin
 *   Ctrl+Alt+V    — vaporwave
 *   Ctrl+Alt+G    — matrix green
 *   Ctrl+Alt+S    — comic sans
 *   Ctrl+Alt+F    — deep fry
 *   Ctrl+Alt+W    — wobble
 *   Ctrl+Alt+0    — clear fun modes (keeps dark)
 *   ↑↑↓↓←→←→BA    — party mode (stack most fun modes)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pb-eggs';
  var FUN_KEYS = ['rainbow', 'vapor', 'matrix', 'comic', 'fry', 'wobble'];
  var CLASS_MAP = {
    rainbow: 'egg-rainbow',
    vapor: 'egg-vapor',
    matrix: 'egg-matrix',
    comic: 'egg-comic',
    fry: 'egg-fry',
    wobble: 'egg-wobble'
  };

  var state = {
    dark: false,
    rainbow: false,
    vapor: false,
    matrix: false,
    comic: false,
    fry: false,
    wobble: false
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiIdx = 0;
  var konamiTimer = null;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (typeof saved.dark === 'boolean') state.dark = saved.dark;
      FUN_KEYS.forEach(function (k) {
        if (typeof saved[k] === 'boolean') state[k] = saved[k];
      });
    } catch (e) { /* ignore */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function buildFilter() {
    var parts = [];
    if (state.matrix) parts.push('invert(1)', 'hue-rotate(90deg)', 'saturate(1.4)', 'brightness(0.95)');
    if (state.fry) parts.push('contrast(1.55)', 'saturate(2.4)', 'brightness(1.08)', 'blur(0.35px)');
    if (state.rainbow && reduceMotion) parts.push('hue-rotate(40deg)', 'saturate(1.25)');
    return parts.length ? parts.join(' ') : 'none';
  }

  function buildFilterBase() {
    /* base filter without hue anim — rainbow animation appends hue-rotate */
    var parts = [];
    if (state.matrix) parts.push('invert(1)', 'hue-rotate(90deg)', 'saturate(1.4)', 'brightness(0.95)');
    if (state.fry) parts.push('contrast(1.55)', 'saturate(2.4)', 'brightness(1.08)', 'blur(0.35px)');
    return parts.length ? parts.join(' ') : '';
  }

  function ensureScanlines() {
    if (!document.getElementById('egg-scanlines')) {
      var el = document.createElement('div');
      el.id = 'egg-scanlines';
      el.setAttribute('aria-hidden', 'true');
      document.documentElement.appendChild(el);
    }
  }

  function apply() {
    var root = document.documentElement;
    if (state.dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    FUN_KEYS.forEach(function (k) {
      root.classList.toggle(CLASS_MAP[k], !!state[k]);
    });

    root.classList.toggle('egg-reduce', reduceMotion);

    var hasFx = state.matrix || state.fry || (state.rainbow && reduceMotion);
    var hasRainbowAnim = state.rainbow && !reduceMotion;
    root.classList.toggle('egg-fx', hasFx || hasRainbowAnim);

    var base = buildFilterBase();
    /* trailing space when base exists so hue-rotate concatenates cleanly */
    root.style.setProperty('--egg-filter-base', base ? base + ' ' : '');
    if (hasRainbowAnim) {
      root.style.setProperty('--egg-filter', (base ? base + ' ' : '') + 'hue-rotate(0deg)');
    } else {
      root.style.setProperty('--egg-filter', buildFilter());
    }

    if (state.vapor) ensureScanlines();
  }

  function toggle(key) {
    state[key] = !state[key];
    save();
    apply();
  }

  function clearFun() {
    FUN_KEYS.forEach(function (k) { state[k] = false; });
    save();
    apply();
  }

  function party() {
    state.rainbow = true;
    state.vapor = true;
    state.comic = true;
    state.fry = true;
    state.wobble = true;
    /* matrix + fry + rainbow is a lot; skip matrix for party */
    state.matrix = false;
    save();
    apply();
  }

  function typingTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function onKeyDown(e) {
    if (typingTarget(e.target)) return;

    /* Konami */
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konami[konamiIdx]) {
      konamiIdx++;
      clearTimeout(konamiTimer);
      konamiTimer = setTimeout(function () { konamiIdx = 0; }, 1800);
      if (konamiIdx === konami.length) {
        konamiIdx = 0;
        e.preventDefault();
        party();
        return;
      }
    } else if (!(konamiIdx === 8 && key === 'b') && !(konamiIdx === 9 && key === 'a')) {
      konamiIdx = key === konami[0] ? 1 : 0;
    }

    var ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.shiftKey && !e.altKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      toggle('dark');
      return;
    }

    if (ctrl && e.altKey && !e.shiftKey) {
      var k = e.key.toLowerCase();
      if (k === 'r') { e.preventDefault(); toggle('rainbow'); return; }
      if (k === 'v') { e.preventDefault(); toggle('vapor'); return; }
      if (k === 'g') { e.preventDefault(); toggle('matrix'); return; }
      if (k === 's') { e.preventDefault(); toggle('comic'); return; }
      if (k === 'f') { e.preventDefault(); toggle('fry'); return; }
      if (k === 'w') { e.preventDefault(); toggle('wobble'); return; }
      if (k === '0' || e.code === 'Digit0') { e.preventDefault(); clearFun(); return; }
    }
  }

  load();
  apply();
  document.addEventListener('keydown', onKeyDown, true);

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (mq) {
    reduceMotion = mq.matches;
    apply();
  });

  if (typeof console !== 'undefined' && console.log) {
    console.log('%cpsst… check the source', 'color:#2e7d32;font-family:monospace;font-size:12px;');
  }
})();
