/**
 * Fake hack terminal — cosmetic only, changes nothing real.
 */
(function () {
  'use strict';

  var panel = null;
  var input = null;
  var output = null;
  var booted = false;
  var history = [];
  var histIdx = -1;
  var typingIv = null;

  function core() { return window.PbEggs; }

  function randHex(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }

  function progressBar(label, cb) {
    var width = 24;
    var step = 0;
    var line = document.createElement('div');
    line.className = 'egg-hack-line';
    output.appendChild(line);
    var iv = setInterval(function () {
      step += Math.floor(Math.random() * 4) + 1;
      if (step > width) step = width;
      var filled = '';
      for (var i = 0; i < width; i++) filled += i < step ? '█' : '░';
      line.textContent = label + ' [' + filled + '] ' + Math.round((step / width) * 100) + '%';
      scrollBottom();
      if (step >= width) {
        clearInterval(iv);
        if (cb) cb();
      }
    }, reduceMotion() ? 90 : 45);
  }

  function reduceMotion() {
    return core() && core().reduceMotion();
  }

  function scrollBottom() {
    if (output) output.scrollTop = output.scrollHeight;
  }

  function print(text, cls) {
    var line = document.createElement('div');
    line.className = 'egg-hack-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    output.appendChild(line);
    scrollBottom();
  }

  function printHtml(html, cls) {
    var line = document.createElement('div');
    line.className = 'egg-hack-line' + (cls ? ' ' + cls : '');
    line.innerHTML = html;
    output.appendChild(line);
    scrollBottom();
  }

  function scrambleLine(el, final, done) {
    var chars = '01█▓░@#$%&*';
    var n = 0;
    var max = reduceMotion() ? 6 : 14;
    var iv = setInterval(function () {
      n++;
      var t = '';
      for (var i = 0; i < final.length; i++) {
        t += n > i + 4 ? final[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = t;
      if (n >= max) { clearInterval(iv); el.textContent = final; if (done) done(); }
    }, 40);
  }

  function bootSequence() {
    if (booted) return;
    booted = true;
    var lines = [
      'PB-SECURE SHELL v0xDEAD [build 2016.04.20]',
      'establishing encrypted tunnel to portfolio://localhost…',
      'handshake OK · session token ' + randHex(8) + '-' + randHex(4),
      'WARNING: unauthorized access is extremely encouraged',
      'type help for commands · exit to close'
    ];
    var i = 0;
    function next() {
      if (i >= lines.length) {
        print('root@pb-portfolio:~$ ', 'egg-hack-prompt');
        return;
      }
      var line = document.createElement('div');
      line.className = 'egg-hack-line egg-hack-dim';
      output.appendChild(line);
      scrambleLine(line, lines[i], function () {
        i++;
        setTimeout(next, reduceMotion() ? 80 : 160);
      });
      scrollBottom();
    }
    next();
  }

  function fakePaths() {
    return [
      '/portfolio/index.html',
      '/portfolio/css/easter-eggs.css',
      '/portfolio/js/easter-eggs-hack.js',
      '/sys/kernel/dark_mode.ko',
      '/home/parker/.ssh/id_rsa',
      '/var/log/access.log',
      '/etc/gpa_override.conf'
    ];
  }

  function runCommand(raw) {
    var cmd = raw.trim();
    var parts = cmd.split(/\s+/);
    var name = (parts[0] || '').toLowerCase();
    var arg = parts.slice(1).join(' ');

    print('> ' + cmd, 'egg-hack-echo');

    if (!name) return;

    switch (name) {
      case 'help':
        printHtml(
          'help · scan · inject · override · matrix · party · status · clear · exit<br>' +
          'whoami · sudo · ls · cat · rm · gpa · lol · hack · credits',
          'egg-hack-info'
        );
        break;

      case 'clear':
        output.innerHTML = '';
        print('root@pb-portfolio:~$ ', 'egg-hack-prompt');
        break;

      case 'exit':
      case 'quit':
        closePanel();
        break;

      case 'status':
        print('HOST: parkerbranham.com · STATUS: pwned (jk)', 'egg-hack-ok');
        print('FIREWALL: disabled by vibes · AV: comic sans detector: ACTIVE', 'egg-hack-dim');
        print('FUN_MODES: rainbow=' + (core().state.rainbow ? 'ON' : 'off') + ' dark=' + (core().state.dark ? 'ON' : 'off'), 'egg-hack-dim');
        break;

      case 'whoami':
        print('guest@pb-portfolio (elevation: imaginary)', 'egg-hack-ok');
        print('groups: hackers, robotics, print_goblin', 'egg-hack-dim');
        break;

      case 'scan':
        print('initiating port scan on 127.0.0.1…', 'egg-hack-warn');
        progressBar('SCAN', function () {
          print('OPEN: 22/ssh 80/http 443/https 9000/gpa-service', 'egg-hack-ok');
          print('VULN: excessive talent detected [CVSS 9.9]', 'egg-hack-bad');
          core().screenShake(6, 200);
        });
        break;

      case 'inject':
        print('payload: aesthetic.dll', 'egg-hack-warn');
        progressBar('INJECT', function () {
          print('INJECTION SUCCESSFUL · zero bytes modified', 'egg-hack-ok');
          document.documentElement.classList.add('egg-hack-flash');
          setTimeout(function () { document.documentElement.classList.remove('egg-hack-flash'); }, 400);
          core().glitchBurst(0.25);
        });
        break;

      case 'override':
        print('target: ' + (arg || 'system.css'), 'egg-hack-warn');
        progressBar('OVERRIDE', function () {
          print('ACCESS GRANTED ████████████████████ 100%', 'egg-hack-granted');
          print('overriding… nothing. portfolio integrity: 100%', 'egg-hack-ok');
          core().screenShake(8, 350);
        });
        break;

      case 'matrix':
        print('jack in?', 'egg-hack-dim');
        progressBar('MATRIX', function () {
          print('there is no spoon · there is only CSS', 'egg-hack-ok');
          core().toggle('matrix');
          core().glitchBurst(0.5);
        });
        break;

      case 'party':
        print('deploying konami payload…', 'egg-hack-warn');
        progressBar('PARTY', function () {
          print('PARTY MODE ENGAGED · absolutely zero databases harmed', 'egg-hack-granted');
          core().party();
        });
        break;

      case 'gpa':
        print('locating academic records…', 'egg-hack-warn');
        progressBar('GPA', function () {
          print('modifying GPA → 9000.00…', 'egg-hack-bad');
          setTimeout(function () {
            print('ROLLBACK: colleges use math, unfortunately', 'egg-hack-dim');
            print('display unchanged · nice try', 'egg-hack-ok');
          }, 800);
        });
        break;

      case 'sudo':
        print('password: ********', 'egg-hack-dim');
        setTimeout(function () {
          print('sudo: PB is not in the sudoers file. this incident will be reported.', 'egg-hack-bad');
          print('(report filed under /dev/null)', 'egg-hack-dim');
        }, 500);
        break;

      case 'ls':
        fakePaths().forEach(function (p) { print(p, 'egg-hack-dim'); });
        break;

      case 'cat':
        var f = arg || 'index.html';
        print('─── ' + f + ' ───', 'egg-hack-dim');
        print('<!DOCTYPE html> <!-- you found the terminal -->', 'egg-hack-info');
        print('… binary chaos …', 'egg-hack-dim');
        break;

      case 'rm':
        print('rm: refusing to delete ' + (arg || '/portfolio') + ' — protected by good taste', 'egg-hack-bad');
        core().screenShake(4, 150);
        break;

      case 'hack':
        print('you are already hacking. inception level: 3', 'egg-hack-ok');
        core().glitchBurst(0.3);
        break;

      case 'lol':
        print('1337 h4x0r detected · deploying respect…', 'egg-hack-ok');
        print('░░░░░░░░░░ RESPECT +9999 ░░░░░░░░░░', 'egg-hack-granted');
        break;

      case 'credits':
        print('PB-SECURE SHELL — cosmetic theatre only', 'egg-hack-dim');
        print('no data was harmed · esc or exit to leave', 'egg-hack-dim');
        break;

      default:
        print('command not found: ' + name + ' · try help', 'egg-hack-bad');
    }
  }

  function onInputKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var val = input.value;
      if (val) {
        history.unshift(val);
        histIdx = -1;
        runCommand(val);
      }
      input.value = '';
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length) {
        histIdx = Math.min(histIdx + 1, history.length - 1);
        input.value = history[histIdx];
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx = Math.max(histIdx - 1, -1);
      input.value = histIdx < 0 ? '' : history[histIdx];
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
    }
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'egg-hack-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Fake terminal');
    panel.innerHTML =
      '<div class="egg-hack-scanlines" aria-hidden="true"></div>' +
      '<div class="egg-hack-header">' +
        '<span class="egg-hack-title">PB-SECURE SHELL</span>' +
        '<span class="egg-hack-blink">█ REC</span>' +
      '</div>' +
      '<div class="egg-hack-output" id="egg-hack-output"></div>' +
      '<div class="egg-hack-input-row">' +
        '<span class="egg-hack-prompt-char">$</span>' +
        '<input type="text" class="egg-hack-input" id="egg-hack-input" autocomplete="off" spellcheck="false" aria-label="Terminal input">' +
      '</div>' +
      '<div class="egg-hack-footer">cosmetic only · nothing is real · esc to exit</div>';
    document.body.appendChild(panel);
    output = document.getElementById('egg-hack-output');
    input = document.getElementById('egg-hack-input');
    input.addEventListener('keydown', onInputKey);
    panel.addEventListener('click', function () { input.focus(); });
  }

  function openPanel() {
    if (panel) return;
    if (core()) core().setOverlayLock(true);
    buildPanel();
    bootSequence();
    setTimeout(function () { if (input) input.focus(); }, 100);
    if (core()) {
      core().registerTrigger('_escape', closePanel);
      core().glitchBurst(0.2);
    }
  }

  function closePanel() {
    if (!panel) return;
    if (typingIv) clearInterval(typingIv);
    input.removeEventListener('keydown', onInputKey);
    panel.remove();
    panel = null;
    input = null;
    output = null;
    booted = false;
    history = [];
    histIdx = -1;
    if (core()) {
      core().setOverlayLock(false);
      core().registerTrigger('_escape', null);
    }
  }

  function init() {
    if (!window.PbEggs) return;
    window.PbEggs.registerTrigger('hack', openPanel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
