/**
 * X-Fight — DOM/canvas mini-game overlay.
 */
(function () {
  'use strict';

  var overlay = null;
  var canvas = null;
  var ctx = null;
  var raf = null;
  var running = false;
  var pausedHitstop = 0;

  var W = 960;
  var H = 540;
  var GROUND = 460;

  var keys = {};
  var justPressed = {};
  var player = null;
  var enemy = null;
  var projectiles = [];
  var particles = [];
  var combo = 0;
  var comboTimer = 0;
  var score = 0;
  var gameState = 'intro';
  var flashTimer = 0;
  var shakeTimer = 0;
  var shakeMag = 0;
  var lastComboTier = 0;

  function core() { return window.PbEggs; }
  function rm() { return core() && core().reduceMotion(); }

  function Player() {
    this.x = 180;
    this.y = GROUND;
    this.vx = 0;
    this.vy = 0;
    this.w = 48;
    this.h = 88;
    this.hp = 100;
    this.maxHp = 100;
    this.facing = 1;
    this.onGround = true;
    this.state = 'idle';
    this.frame = 0;
    this.hitbox = null;
    this.invuln = 0;
    this.attackCd = 0;
    this.specialCd = 0;
  }

  function Enemy() {
    this.x = 720;
    this.y = GROUND - 20;
    this.w = 64;
    this.h = 64;
    this.hp = 80;
    this.maxHp = 80;
    this.vx = 0;
    this.phase = 0;
    this.hitFlash = 0;
    this.label = '404';
    this.attackTimer = 90;
  }

  function resetGame() {
    player = new Player();
    enemy = new Enemy();
    projectiles = [];
    particles = [];
    combo = 0;
    comboTimer = 0;
    score = 0;
    gameState = 'playing';
    flashTimer = 0;
    lastComboTier = 0;
  }

  function spawnParticles(x, y, color, n) {
    n = rm() ? Math.max(2, Math.floor(n / 3)) : n;
    for (var i = 0; i < n; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 20 + Math.random() * 15,
        color: color,
        size: 2 + Math.random() * 4
      });
    }
  }

  function spawnDamageNumber(x, y, dmg, crit) {
    particles.push({
      x: x, y: y, vy: -2.5, life: 40,
      text: (crit ? 'CRIT ' : '') + dmg,
      color: crit ? '#ffeb3b' : '#fff',
      size: crit ? 18 : 14,
      isText: true
    });
  }

  function hitstop(frames) {
    pausedHitstop = rm() ? Math.min(frames, 2) : frames;
  }

  function screenShake(mag, dur) {
    shakeMag = rm() ? Math.min(mag, 2) : mag;
    shakeTimer = dur;
    if (core()) core().screenShake(mag, dur);
  }

  function comboFlash(tier) {
    flashTimer = tier >= 5 ? 18 : tier >= 3 ? 10 : 0;
    if (tier >= 3 && !rm()) {
      document.documentElement.classList.add('egg-fight-flash');
      setTimeout(function () { document.documentElement.classList.remove('egg-fight-flash'); }, tier >= 5 ? 280 : 150);
    }
  }

  function registerHit(dmg, crit) {
    combo++;
    comboTimer = 800;
    score += dmg * (crit ? 2 : 1);
    if (combo >= 5 && lastComboTier < 5) { comboFlash(5); screenShake(10, 300); }
    else if (combo >= 3 && lastComboTier < 3) { comboFlash(3); screenShake(6, 200); }
    lastComboTier = combo >= 5 ? 5 : combo >= 3 ? 3 : 0;
    hitstop(crit ? 6 : 4);
  }

  function playerAttack(type) {
    if (player.state !== 'idle' && player.state !== 'walk') return;
    if (player.attackCd > 0) return;

    player.state = type;
    player.frame = 0;
    player.attackCd = type === 'uppercut' ? 28 : type === 'kick' ? 20 : 16;

    var range = type === 'kick' ? 70 : type === 'uppercut' ? 55 : 58;
    var dmg = type === 'kick' ? 14 : type === 'uppercut' ? 18 : 10;
    var hx = player.x + player.facing * 30;
    var hy = type === 'uppercut' ? player.y - 60 : player.y - 40;

    setTimeout(function () {
      if (!enemy || gameState !== 'playing') return;
      var dx = Math.abs((enemy.x) - hx);
      var dy = Math.abs((enemy.y - 30) - hy);
      if (dx < range && dy < 70) {
        var crit = Math.random() < 0.15;
        var finalDmg = crit ? Math.floor(dmg * 1.8) : dmg;
        enemy.hp -= finalDmg;
        enemy.hitFlash = 12;
        enemy.x += player.facing * (type === 'kick' ? 18 : 10);
        spawnParticles(enemy.x, enemy.y - 20, crit ? '#ffeb3b' : '#ff5252', crit ? 16 : 10);
        spawnDamageNumber(enemy.x, enemy.y - 50, finalDmg, crit);
        registerHit(finalDmg, crit);
        if (enemy.hp <= 0) { enemy.hp = 0; gameState = 'win'; }
      }
    }, type === 'uppercut' ? 120 : 80);
  }

  function playerSpecial() {
    if (player.specialCd > 0 || player.state !== 'idle' && player.state !== 'walk') return;
    player.specialCd = 90;
    player.state = 'special';
    projectiles.push({
      x: player.x + player.facing * 40,
      y: player.y - 50,
      vx: player.facing * 9,
      vy: 0,
      r: 14,
      dmg: 22,
      life: 80,
      color: '#00e5ff'
    });
    spawnParticles(player.x + player.facing * 30, player.y - 45, '#00e5ff', 8);
  }

  function updatePlayer() {
    if (player.invuln > 0) player.invuln--;
    if (player.attackCd > 0) player.attackCd--;
    if (player.specialCd > 0) player.specialCd--;

    if (player.state === 'idle' || player.state === 'walk') {
      player.vx = 0;
      if (keys.left) { player.vx = -5; player.facing = -1; player.state = 'walk'; }
      if (keys.right) { player.vx = 5; player.facing = 1; player.state = 'walk'; }
      if (!keys.left && !keys.right && player.onGround) player.state = 'idle';

      if (keys.up && player.onGround) {
        player.vy = -13;
        player.onGround = false;
      }
      if (justPressed.punch) playerAttack(keys.down ? 'uppercut' : 'punch');
      else if (justPressed.kick) playerAttack('kick');
      else if (justPressed.special) playerSpecial();
      justPressed.punch = false;
      justPressed.kick = false;
      justPressed.special = false;
    } else {
      player.frame++;
      if (player.frame > 20) { player.state = 'idle'; player.frame = 0; }
    }

    player.vy += 0.55;
    player.x += player.vx;
    player.y += player.vy;

    if (player.y >= GROUND) {
      player.y = GROUND;
      player.vy = 0;
      player.onGround = true;
    }
    player.x = Math.max(60, Math.min(W - 60, player.x));
  }

  function updateEnemy() {
    if (!enemy || enemy.hp <= 0) return;
    if (enemy.hitFlash > 0) enemy.hitFlash--;

    enemy.phase += 0.04;
    enemy.y = GROUND - 20 + Math.sin(enemy.phase) * 18;
    enemy.x += Math.sin(enemy.phase * 0.7) * 1.2;

    enemy.attackTimer--;
    if (enemy.attackTimer <= 0 && gameState === 'playing') {
      enemy.attackTimer = 70 + Math.floor(Math.random() * 50);
      var dx = player.x - enemy.x;
      if (Math.abs(dx) < 120 && Math.abs(player.y - enemy.y) < 60 && player.invuln <= 0) {
        var dmg = 8 + Math.floor(Math.random() * 6);
        player.hp -= dmg;
        player.invuln = 40;
        screenShake(5, 180);
        spawnDamageNumber(player.x, player.y - 70, dmg, false);
        spawnParticles(player.x, player.y - 40, '#b388ff', 8);
        combo = 0;
        comboTimer = 0;
        lastComboTier = 0;
        if (player.hp <= 0) { player.hp = 0; gameState = 'lose'; }
      }
    }
  }

  function updateProjectiles() {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (enemy && enemy.hp > 0) {
        var dx = p.x - enemy.x;
        var dy = p.y - (enemy.y - 20);
        if (Math.sqrt(dx * dx + dy * dy) < p.r + 30) {
          var crit = Math.random() < 0.2;
          var fd = crit ? Math.floor(p.dmg * 1.5) : p.dmg;
          enemy.hp -= fd;
          enemy.hitFlash = 12;
          spawnParticles(p.x, p.y, '#00e5ff', 14);
          spawnDamageNumber(enemy.x, enemy.y - 40, fd, crit);
          registerHit(fd, crit);
          projectiles.splice(i, 1);
          if (enemy.hp <= 0) { enemy.hp = 0; gameState = 'win'; }
          continue;
        }
      }
      if (p.life <= 0 || p.x < 0 || p.x > W) projectiles.splice(i, 1);
    }
  }

  function updateParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawBg() {
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0a0f1a');
    grd.addColorStop(1, '#1a1030');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#2a2040';
    ctx.fillRect(0, GROUND, W, H - GROUND);

    ctx.strokeStyle = 'rgba(0,229,255,0.15)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, GROUND);
      ctx.lineTo(gx - 80, H);
      ctx.stroke();
    }
  }

  function drawFighter(x, y, facing, color, state, frame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    ctx.fillStyle = color;
    ctx.fillRect(-10, -70, 20, 20);
    ctx.fillRect(-22, -50, 44, 50);

    var armAngle = state === 'punch' ? -0.8 : state === 'kick' ? 0.2 : 0.3;
    ctx.save();
    ctx.translate(18, -45);
    ctx.rotate(armAngle);
    ctx.fillRect(0, -6, 28, 12);
    ctx.restore();

    ctx.save();
    ctx.translate(-18, -45);
    ctx.rotate(-0.4);
    ctx.fillRect(-28, -6, 28, 12);
    ctx.restore();

    var legExt = state === 'kick' ? 35 : 0;
    ctx.fillRect(-8, 0, 14, 28 + legExt);
    ctx.fillRect(4, 0, 14, 28);

    if (state === 'kick') {
      ctx.fillStyle = '#ff8a80';
      ctx.fillRect(10, 20 + legExt, 32, 10);
    }

    ctx.restore();
  }

  function drawEnemy() {
    if (!enemy) return;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.hitFlash > 0 && Math.floor(enemy.hitFlash / 2) % 2) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = '#1c1c28';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 3;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(enemy.label, 0, 8);
    ctx.fillStyle = '#ff8a80';
    ctx.fillText(enemy.label, 0, 8);

    ctx.fillStyle = '#333';
    ctx.fillRect(-20, 18, 10, 6);
    ctx.fillRect(10, 18, 10, 6);
    ctx.restore();
  }

  function drawBar(x, y, w, h, pct, color, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, pct), h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 4);
  }

  function drawHud() {
    drawBar(40, 30, 200, 14, player.hp / player.maxHp, '#69f0ae', 'YOU');
    if (enemy) drawBar(W - 240, 30, 200, 14, enemy.hp / enemy.maxHp, '#ff5252', 'BUG-404');

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE ' + score, W / 2, 42);

    if (combo >= 2) {
      ctx.fillStyle = combo >= 5 ? '#ffeb3b' : '#00e5ff';
      ctx.font = 'bold ' + (combo >= 5 ? 28 : 20) + 'px monospace';
      ctx.fillText(combo + ' HIT COMBO!', W / 2, 80);
    }

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('←→/AD move · ↑/W jump · Z/J punch · X/K kick · C/L special · ↓+atk uppercut', 20, H - 16);
  }

  function drawProjectiles() {
    projectiles.forEach(function (p) {
      ctx.beginPath();
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, p.color);
      ctx.fillStyle = g;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.min(1, p.life / 20);
      if (p.isText) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold ' + p.size + 'px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawEndScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
    var win = gameState === 'win';
    ctx.fillStyle = win ? '#69f0ae' : '#ff5252';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(win ? 'K.O.!' : 'DEFEAT', W / 2, H / 2 - 30);
    if (win && player.hp === player.maxHp) {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('PERFECT!', W / 2, H / 2 + 10);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('SCORE: ' + score, W / 2, H / 2 + 50);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('[ ENTER ] rematch   [ ESC ] exit', W / 2, H / 2 + 90);
  }

  function drawIntro() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X-FIGHT', W / 2, H / 2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Destroy the floating 404 bug', W / 2, H / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px monospace';
    ctx.fillText('ENTER to start · ESC to exit', W / 2, H / 2 + 40);
  }

  function drawDesktopOnly() {
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DESKTOP ONLY', W / 2, H / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('X-Fight needs a keyboard', W / 2, H / 2 + 16);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('ESC to close', W / 2, H / 2 + 50);
  }

  function loop() {
    if (!running) return;
    if (pausedHitstop > 0) {
      pausedHitstop--;
      raf = requestAnimationFrame(loop);
      return;
    }

    if (comboTimer > 0) {
      comboTimer -= 16;
      if (comboTimer <= 0) { combo = 0; lastComboTier = 0; }
    }
    if (flashTimer > 0) flashTimer--;
    if (shakeTimer > 0) shakeTimer--;

    ctx.save();
    if (shakeTimer > 0) {
      var sx = (Math.random() - 0.5) * shakeMag;
      var sy = (Math.random() - 0.5) * shakeMag;
      ctx.translate(sx, sy);
    }

    drawBg();

    if (core() && core().isMobile()) {
      drawDesktopOnly();
    } else if (gameState === 'intro') {
      drawIntro();
    } else {
      updatePlayer();
      updateEnemy();
      updateProjectiles();
      updateParticles();

      drawFighter(player.x, player.y, player.facing, '#4fc3f7', player.state, player.frame);
      drawEnemy();
      drawProjectiles();
      drawParticles();
      drawHud();

      if (gameState === 'win' || gameState === 'lose') drawEndScreen();
    }

    if (flashTimer > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (flashTimer / 20) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
    raf = requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    if (!overlay) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeFight();
      return;
    }

    if (core() && core().isMobile()) return;

    if (gameState === 'intro' && e.key === 'Enter') {
      e.preventDefault();
      resetGame();
      return;
    }

    if ((gameState === 'win' || gameState === 'lose') && e.key === 'Enter') {
      e.preventDefault();
      resetGame();
      return;
    }

    if (gameState !== 'playing' && gameState !== 'intro') return;

    var code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW') keys.up = true;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = true;
    if (code === 'KeyZ' || code === 'KeyJ') { keys.punch = true; justPressed.punch = true; }
    if (code === 'KeyX' || code === 'KeyK') { keys.kick = true; justPressed.kick = true; }
    if (code === 'KeyC' || code === 'KeyL') { keys.special = true; justPressed.special = true; }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyZ', 'KeyJ', 'KeyX', 'KeyK', 'KeyC', 'KeyL'].indexOf(code) >= 0) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onKeyUp(e) {
    if (!overlay) return;
    var code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
    if (code === 'ArrowUp' || code === 'KeyW') keys.up = false;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
    if (code === 'KeyZ' || code === 'KeyJ') keys.punch = false;
    if (code === 'KeyX' || code === 'KeyK') keys.kick = false;
    if (code === 'KeyC' || code === 'KeyL') keys.special = false;
  }

  function resize() {
    if (!canvas || !overlay) return;
    var rect = overlay.getBoundingClientRect();
    var scale = Math.min(rect.width / W, rect.height / H);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
  }

  function openFight() {
    if (overlay) return;
    if (core()) core().setOverlayLock(true);

    overlay = document.createElement('div');
    overlay.id = 'egg-fight-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'X-Fight mini-game');
    canvas = document.createElement('canvas');
    canvas.id = 'egg-fight-canvas';
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);

    ctx = canvas.getContext('2d');
    player = new Player();
    enemy = new Enemy();
    gameState = 'intro';
    running = true;
    keys = {};
    justPressed = {};

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', resize);
    resize();
    loop();

    if (core()) {
      core().registerTrigger('_escape', closeFight);
      core().screenShake(4, 200);
    }
  }

  function closeFight() {
    if (!overlay) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('resize', resize);
    overlay.remove();
    overlay = null;
    canvas = null;
    ctx = null;
    if (core()) {
      core().setOverlayLock(false);
      core().registerTrigger('_escape', null);
    }
  }

  function init() {
    if (!window.PbEggs) return;
    window.PbEggs.registerTrigger('fight', openFight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
