/**
 * Hidden keyboard easter eggs — core hub.
 * psst… check the HTML comments too.
 *
 * Combos (ignored while typing in inputs):
 *   Ctrl+Shift+D   — dark mode (persists)
 *   Ctrl+Shift+H   — fake hack terminal
 *   Alt+Shift+R    — rainbow hue spin
 *   Alt+Shift+V    — vaporwave
 *   Alt+Shift+G    — matrix green
 *   Alt+Shift+S    — comic sans
 *   Alt+Shift+F    — deep fry
 *   Alt+Shift+W    — wobble
 *   Alt+Shift+X    — X-Fight mini-game
 *   Alt+Shift+C    — glitch burst
 *   Alt+Shift+B    — fake BSOD
 *   Alt+Shift+T    — cursor trail toggle
 *   Alt+Shift+E    — emoji rain
 *   Alt+Shift+Y    — title scramble
 *   Alt+Shift+0    — clear fun modes (keeps dark)
 *   ↑↑↓↓←→←→BA     — party mode
 *
 * Word sequences (no modifiers): hack · fight · glitch · trail · rain · scramble
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

  var FUN_BY_CODE = {
    KeyR: 'rainbow',
    KeyV: 'vapor',
    KeyG: 'matrix',
    KeyS: 'comic',
    KeyF: 'fry',
    KeyW: 'wobble'
  };

  var WORD_SEQS = {
    hack: 'hack',
    fight: 'fight',
    glitch: 'glitch',
    trail: 'trail',
    rain: 'rain',
    scramble: 'scramble'
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
  var wordBuf = '';
  var wordTimer = null;
  var cursorTrailOn = false;
  var cursorTrailEl = null;
  var cursorTrailMove = null;
  var overlayLock = false;
  var triggers = {};

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

  function ensureMatrixRain() {
    if (!document.getElementById('egg-matrix-rain')) {
      var el = document.createElement('div');
      el.id = 'egg-matrix-rain';
      el.setAttribute('aria-hidden', 'true');
      document.documentElement.appendChild(el);
    }
  }

  function ensureVaporSun() {
    if (!document.getElementById('egg-vapor-sun')) {
      var el = document.createElement('div');
      el.id = 'egg-vapor-sun';
      el.setAttribute('aria-hidden', 'true');
      document.documentElement.appendChild(el);
    }
  }

  function ensureFryNoise() {
    if (!document.getElementById('egg-fry-noise')) {
      var el = document.createElement('div');
      el.id = 'egg-fry-noise';
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
    root.classList.toggle('egg-party-juice', state.rainbow && state.vapor && state.fry && state.wobble);

    var hasFx = state.matrix || state.fry || (state.rainbow && reduceMotion);
    var hasRainbowAnim = state.rainbow && !reduceMotion;
    root.classList.toggle('egg-fx', hasFx || hasRainbowAnim);

    var base = buildFilterBase();
    root.style.setProperty('--egg-filter-base', base ? base + ' ' : '');
    if (hasRainbowAnim) {
      root.style.setProperty('--egg-filter', (base ? base + ' ' : '') + 'hue-rotate(0deg)');
    } else {
      root.style.setProperty('--egg-filter', buildFilter());
    }

    if (state.vapor) {
      ensureScanlines();
      ensureVaporSun();
    }
    if (state.matrix) ensureMatrixRain();
    if (state.fry) ensureFryNoise();
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
    state.matrix = false;
    save();
    apply();
    screenShake(reduceMotion ? 4 : 10, 280);
    if (!reduceMotion) glitchBurst(0.35);
  }

  function typingTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function isMobile() {
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  }

  function screenShake(intensity, duration) {
    if (reduceMotion) intensity = Math.min(intensity, 3);
    var root = document.documentElement;
    root.classList.remove('egg-shake');
    void root.offsetWidth;
    root.style.setProperty('--egg-shake-int', intensity + 'px');
    root.classList.add('egg-shake');
    setTimeout(function () { root.classList.remove('egg-shake'); }, duration || 300);
  }

  function glitchBurst(duration) {
    var root = document.documentElement;
    root.classList.add('egg-glitch-active');
    setTimeout(function () { root.classList.remove('egg-glitch-active'); }, (duration || 0.6) * 1000);
  }

  function showBsod() {
    if (document.getElementById('egg-bsod')) return;
    var el = document.createElement('div');
    el.id = 'egg-bsod';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Fake error screen');
    el.innerHTML =
      '<div class="egg-bsod-inner">' +
        '<p class="egg-bsod-emoji">:(</p>' +
        '<p class="egg-bsod-title">Your PC ran into a problem and needs to restart.</p>' +
        '<p class="egg-bsod-sub">We\'re just collecting some error info, then we\'ll restart for you.</p>' +
        '<p class="egg-bsod-pct" id="egg-bsod-pct">0% complete</p>' +
        '<p class="egg-bsod-code">Stop code: EGG_OVERLOAD_EXCEPTION</p>' +
        '<p class="egg-bsod-hint">click anywhere to dismiss · (it\'s fake)</p>' +
      '</div>';
    document.body.appendChild(el);
    var pct = 0;
    var iv = setInterval(function () {
      pct = Math.min(100, pct + Math.floor(Math.random() * 17) + 3);
      var node = document.getElementById('egg-bsod-pct');
      if (node) node.textContent = pct + '% complete';
      if (pct >= 100) clearInterval(iv);
    }, 400);
    function dismiss() {
      clearInterval(iv);
      el.remove();
      el.removeEventListener('click', dismiss);
    }
    el.addEventListener('click', dismiss);
  }

  function toggleCursorTrail() {
    cursorTrailOn = !cursorTrailOn;
    if (!cursorTrailOn) {
      if (cursorTrailMove) document.removeEventListener('mousemove', cursorTrailMove);
      if (cursorTrailEl) cursorTrailEl.remove();
      cursorTrailEl = null;
      return;
    }
    cursorTrailEl = document.createElement('div');
    cursorTrailEl.id = 'egg-cursor-trail';
    cursorTrailEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorTrailEl);
    var last = 0;
    cursorTrailMove = function (e) {
      var now = Date.now();
      if (now - last < (reduceMotion ? 80 : 35)) return;
      last = now;
      var dot = document.createElement('span');
      dot.className = 'egg-trail-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      dot.style.setProperty('--egg-trail-hue', Math.floor(Math.random() * 360));
      cursorTrailEl.appendChild(dot);
      setTimeout(function () { dot.remove(); }, reduceMotion ? 400 : 700);
      while (cursorTrailEl.children.length > (reduceMotion ? 12 : 28)) {
        cursorTrailEl.firstChild.remove();
      }
    };
    document.addEventListener('mousemove', cursorTrailMove);
  }

  function emojiRain() {
    var emojis = ['🐼', '🔥', '💀', '✨', '⚡', '🎯', '💥', '🌧️'];
    var container = document.createElement('div');
    container.className = 'egg-emoji-rain';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
    var count = reduceMotion ? 18 : 42;
    for (var i = 0; i < count; i++) {
      (function (idx) {
        var span = document.createElement('span');
        span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.left = Math.random() * 100 + '%';
        span.style.animationDuration = (reduceMotion ? 4 : 2.2) + Math.random() * 2 + 's';
        span.style.animationDelay = Math.random() * 1.5 + 's';
        span.style.fontSize = (16 + Math.random() * 20) + 'px';
        container.appendChild(span);
      })(i);
    }
    setTimeout(function () { container.remove(); }, reduceMotion ? 6000 : 5000);
  }

  function titleScramble() {
    var targets = document.querySelectorAll('h1, .hero-h1, .hero-name, .section-title, .sec-h2, title');
    if (!targets.length) return;
    targets.forEach(function (el) {
      if (el.tagName === 'TITLE') {
        scrambleText(el, el.textContent, true);
        return;
      }
      if (el.offsetParent === null && el.tagName !== 'TITLE') return;
      scrambleText(el, el.textContent, false);
    });
  }

  function scrambleText(el, original, isTitle) {
    var chars = '!@#$%^&*?<>[]{}01█▓░╳';
    var steps = reduceMotion ? 8 : 18;
    var step = 0;
    var iv = setInterval(function () {
      step++;
      var progress = step / steps;
      var out = '';
      for (var i = 0; i < original.length; i++) {
        if (original[i] === ' ') { out += ' '; continue; }
        out += progress > i / original.length ? original[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      if (isTitle) document.title = out;
      else el.textContent = out;
      if (step >= steps) {
        clearInterval(iv);
        if (isTitle) document.title = original;
        else el.textContent = original;
      }
    }, reduceMotion ? 60 : 45);
  }

  function registerTrigger(name, fn) {
    triggers[name] = fn;
  }

  function fireTrigger(name) {
    if (overlayLock && (name === 'hack' || name === 'fight')) return;
    if (triggers[name]) triggers[name]();
    else if (name === 'glitch') glitchBurst();
    else if (name === 'bsod') showBsod();
    else if (name === 'trail') toggleCursorTrail();
    else if (name === 'rain') emojiRain();
    else if (name === 'scramble') titleScramble();
  }

  function setOverlayLock(locked) {
    overlayLock = !!locked;
  }

  function pushWord(ch) {
    wordBuf = (wordBuf + ch).slice(-12);
    clearTimeout(wordTimer);
    wordTimer = setTimeout(function () { wordBuf = ''; }, 2200);
    Object.keys(WORD_SEQS).forEach(function (key) {
      if (wordBuf.endsWith(WORD_SEQS[key])) {
        wordBuf = '';
        fireTrigger(key);
      }
    });
  }

  function onKeyDown(e) {
    if (typingTarget(e.target)) return;

    if (e.key === 'Escape') {
      if (triggers._escape) { triggers._escape(); return; }
    }

    var ctrl = e.ctrlKey || e.metaKey;
    var alt = e.altKey;
    var shift = e.shiftKey;
    var code = e.code;

    if (ctrl && shift && !alt && code === 'KeyD') {
      e.preventDefault();
      toggle('dark');
      return;
    }

    if (ctrl && shift && !alt && code === 'KeyH') {
      e.preventDefault();
      fireTrigger('hack');
      return;
    }

    if (alt && shift && !ctrl) {
      if (code === 'Digit0' || code === 'Numpad0') {
        e.preventDefault();
        clearFun();
        return;
      }
      if (code === 'KeyX') { e.preventDefault(); fireTrigger('fight'); return; }
      if (code === 'KeyC') { e.preventDefault(); fireTrigger('glitch'); return; }
      if (code === 'KeyB') { e.preventDefault(); fireTrigger('bsod'); return; }
      if (code === 'KeyT') { e.preventDefault(); fireTrigger('trail'); return; }
      if (code === 'KeyE') { e.preventDefault(); fireTrigger('rain'); return; }
      if (code === 'KeyY') { e.preventDefault(); fireTrigger('scramble'); return; }
      var mode = FUN_BY_CODE[code];
      if (mode) {
        e.preventDefault();
        toggle(mode);
        return;
      }
    }

    if (ctrl || alt || shift) return;

    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key.length === 1 && /[a-z]/.test(key)) pushWord(key);

    if (key === konami[konamiIdx]) {
      konamiIdx++;
      clearTimeout(konamiTimer);
      konamiTimer = setTimeout(function () { konamiIdx = 0; }, 1800);
      if (konamiIdx === konami.length) {
        konamiIdx = 0;
        e.preventDefault();
        party();
      }
    } else {
      konamiIdx = key === konami[0] ? 1 : 0;
    }
  }

  load();
  apply();
  window.addEventListener('keydown', onKeyDown, true);

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (mq) {
    reduceMotion = mq.matches;
    apply();
  });

  window.PbEggs = {
    typingTarget: typingTarget,
    reduceMotion: function () { return reduceMotion; },
    isMobile: isMobile,
    screenShake: screenShake,
    glitchBurst: glitchBurst,
    party: party,
    toggle: toggle,
    state: state,
    registerTrigger: registerTrigger,
    setOverlayLock: setOverlayLock,
    showBsod: showBsod,
    emojiRain: emojiRain
  };

  if (typeof console !== 'undefined' && console.log) {
    console.log('%cpsst… check the source', 'color:#2e7d32;font-family:monospace;font-size:12px;');
    console.log('%c  H with friends · X marks the spot · words unlock doors', 'color:#4a7c59;font-family:monospace;font-size:10px;opacity:0.7;');
  }
})();
