/**
 * X-Fight — polished canvas beat-em-up overlay.
 * Trigger: Alt+Shift+X or typing "fight"
 */
(function () {
  'use strict';

  var W = 1280;
  var H = 720;
  var GROUND = 580;
  var GRAVITY = 0.62;
  var COYOTE_MS = 130;
  var BUFFER_MS = 160;
  var COMBO_WINDOW_MS = 1400;
  var ROUND_TIME = 99;

  var overlay = null;
  var canvas = null;
  var announceEl = null;
  var controlsEl = null;
  var ctx = null;
  var raf = null;
  var running = false;
  var lastTs = 0;
  var hitstopMs = 0;
  var reduced = false;

  var keys = {};
  var justPressed = {};
  var player = null;
  var enemies = [];
  var projectiles = [];
  var particles = [];
  var impactTexts = [];
  var floatingNums = [];

  var combo = 0;
  var comboTimerMs = 0;
  var maxCombo = 0;
  var score = 0;
  var displayScore = 0;
  var wave = 1;
  var roundTimer = ROUND_TIME;
  var gameState = 'intro';
  var announceTimer = 0;
  var stateTimer = 0;

  var shakeMag = 0;
  var shakeTimerMs = 0;
  var flashAlpha = 0;
  var chromaticMs = 0;
  var camZoom = 1;
  var camZoomTarget = 1;
  var camX = 0;
  var camY = 0;
  var lastComboTier = 0;
  var parallax = 0;

  var skyline = [];
  var stars = [];

  var ENEMY_TYPES = {
    bug404: {
      name: 'BUG-404',
      hp: 90,
      speed: 2.2,
      dmg: 9,
      color: '#1a1428',
      accent: '#ff5252',
      glyph: '404',
      scale: 1,
      score: 100
    },
    shadow: {
      name: 'SHADOW.EXE',
      hp: 130,
      speed: 1.6,
      dmg: 14,
      color: '#0d0a18',
      accent: '#b388ff',
      glyph: 'ERR',
      scale: 1.15,
      score: 200
    },
    glitch: {
      name: 'NULL_PTR',
      hp: 70,
      speed: 3.4,
      dmg: 7,
      color: '#121820',
      accent: '#00e676',
      glyph: '0x0',
      scale: 0.9,
      score: 150
    }
  };

  var ATTACKS = {
    punch: { frames: 14, active: 5, range: 62, height: 55, dmg: 11, hitstop: 45, kb: 11, meter: 8 },
    kick: { frames: 20, active: 9, range: 78, height: 45, dmg: 15, hitstop: 55, kb: 20, meter: 12 },
    uppercut: { frames: 22, active: 10, range: 58, height: 75, dmg: 20, hitstop: 70, kb: 16, meter: 15, launch: true },
    special: { dmg: 28, hitstop: 80, kb: 24, meter: 100 }
  };

  function core() { return window.PbEggs; }
  function rm() { return reduced || (core() && core().reduceMotion()); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function initWorldArt() {
    skyline = [];
    var heights = [120, 180, 90, 220, 150, 200, 110, 170, 140, 190, 100, 160];
    for (var i = 0; i < 18; i++) {
      skyline.push({
        x: i * 90 - 40,
        w: 50 + Math.random() * 70,
        h: heights[i % heights.length] + Math.random() * 60,
        windows: Math.floor(Math.random() * 8) + 3,
        layer: i % 3
      });
    }
    stars = [];
    for (var s = 0; s < 80; s++) {
      stars.push({ x: Math.random() * W, y: Math.random() * (GROUND - 80), s: Math.random() * 2 + 0.5, tw: Math.random() * Math.PI * 2 });
    }
  }

  function Player() {
    this.x = 220;
    this.y = GROUND;
    this.vx = 0;
    this.vy = 0;
    this.w = 52;
    this.h = 96;
    this.hp = 100;
    this.maxHp = 100;
    this.facing = 1;
    this.onGround = true;
    this.coyoteMs = 0;
    this.state = 'idle';
    this.frame = 0;
    this.invuln = 0;
    this.hitstun = 0;
    this.attackCd = 0;
    this.attackType = null;
    this.attackBuffered = null;
    this.bufferMs = 0;
    this.specialMeter = 0;
    this.specialMax = 100;
    this.flash = 0;
    this.bob = 0;
    this.walkPhase = 0;
    this.damageChunk = 1;
  }

  function Enemy(typeKey) {
    var t = ENEMY_TYPES[typeKey] || ENEMY_TYPES.bug404;
    this.type = typeKey;
    this.name = t.name;
    this.x = W - 180 - Math.random() * 120;
    this.y = GROUND - (typeKey === 'bug404' ? 24 : 0);
    this.w = 64 * t.scale;
    this.h = 72 * t.scale;
    this.hp = t.hp + wave * 8;
    this.maxHp = this.hp;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.phase = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.hitstun = 0;
    this.state = 'idle';
    this.stateTimer = 0;
    this.attackCd = rand(40, 90);
    this.blocking = false;
    this.telegraph = 0;
    this.heavy = false;
    this.kbX = 0;
    this.glyph = t.glyph;
    this.colors = { body: t.color, accent: t.accent };
    this.speed = t.speed;
    this.dmg = t.dmg;
    this.scale = t.scale;
    this.scoreVal = t.score;
    this.floatY = typeKey === 'bug404';
    this.dead = false;
    this.damageChunk = 1;
  }

  function resetGame() {
    player = new Player();
    enemies = [];
    spawnWave();
    projectiles = [];
    particles = [];
    impactTexts = [];
    floatingNums = [];
    combo = 0;
    comboTimerMs = 0;
    maxCombo = 0;
    score = 0;
    displayScore = 0;
    wave = 1;
    roundTimer = ROUND_TIME;
    gameState = 'announce';
    announceTimer = 1200;
    stateTimer = 0;
    flashAlpha = 0;
    camZoom = 1;
    camZoomTarget = 1;
    camX = 0;
    camY = 0;
    lastComboTier = 0;
    showAnnounce('ROUND 1', '');
    setTimeout(function () { showAnnounce('FIGHT!', ''); }, 500);
  }

  function spawnWave() {
    enemies = [];
    var types = ['bug404'];
    if (wave >= 2) types.push('shadow');
    if (wave >= 3) types.push('glitch');
    var count = Math.min(1 + Math.floor((wave - 1) / 2), 3);
    for (var i = 0; i < count; i++) {
      var tk = types[Math.floor(Math.random() * types.length)];
      var e = new Enemy(tk);
      e.x = W - 200 - i * 140;
      enemies.push(e);
    }
  }

  function nextWave() {
    wave++;
    gameState = 'announce';
    announceTimer = 1400;
    stateTimer = 0;
    player.hp = Math.min(player.maxHp, player.hp + 15);
    player.specialMeter = Math.min(player.specialMax, player.specialMeter + 25);
    showAnnounce('WAVE ' + wave, '');
    setTimeout(function () { showAnnounce('FIGHT!', ''); }, 450);
    spawnWave();
  }

  function showAnnounce(text, cls) {
    if (!announceEl) return;
    announceEl.textContent = text;
    announceEl.className = 'egg-fight-announce show' + (cls ? ' ' + cls : '');
    announceEl.offsetHeight;
    if (!rm()) {
      if (text === 'FIGHT!' || text.indexOf('WAVE') === 0 || text.indexOf('ROUND') === 0) {
        screenShake(6, 180);
      }
      if (text === 'K.O.!' || text === 'PERFECT!') screenShake(12, 400);
    }
  }

  function hitstop(ms) {
    hitstopMs = rm() ? Math.min(ms, 25) : ms;
  }

  function screenShake(mag, dur) {
    shakeMag = rm() ? Math.min(mag, 3) : mag;
    shakeTimerMs = dur;
    if (core()) core().screenShake(mag, dur);
  }

  function comboJuice(tier) {
    if (tier >= 5 && lastComboTier < 5) {
      flashAlpha = rm() ? 0.15 : 0.35;
      screenShake(11, 320);
      chromaticMs = rm() ? 0 : 180;
      if (!rm()) {
        document.documentElement.classList.add('egg-fight-flash');
        setTimeout(function () { document.documentElement.classList.remove('egg-fight-flash'); }, 260);
      }
      if (overlay) overlay.classList.add('egg-fight-chromatic');
      setTimeout(function () { if (overlay) overlay.classList.remove('egg-fight-chromatic'); }, 200);
    } else if (tier >= 3 && lastComboTier < 3) {
      flashAlpha = rm() ? 0.1 : 0.2;
      screenShake(7, 220);
    }
    lastComboTier = tier >= 5 ? 5 : tier >= 3 ? 3 : tier >= 2 ? 2 : 0;
  }

  function registerHit(dmg, crit, heavy) {
    combo++;
    comboTimerMs = COMBO_WINDOW_MS;
    if (combo > maxCombo) maxCombo = combo;
    var mult = 1 + Math.min(combo * 0.05, 0.75);
    var pts = Math.floor(dmg * mult * (crit ? 2 : 1) * (heavy ? 1.3 : 1));
    score += pts;
    player.specialMeter = Math.min(player.specialMax, player.specialMeter + (heavy ? 18 : 10));
    comboJuice(combo >= 5 ? 5 : combo >= 3 ? 3 : combo >= 2 ? 2 : 0);
    if (crit && !rm()) showAnnounce('CRITICAL!', 'critical');
  }

  function spawnParticles(x, y, color, n, kind) {
    n = rm() ? Math.max(2, Math.floor(n / 3)) : n;
    kind = kind || 'spark';
    for (var i = 0; i < n; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = kind === 'dust' ? rand(0.5, 2.5) : rand(2, 9);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - (kind === 'dust' ? 0.5 : 2),
        life: kind === 'dust' ? rand(20, 35) : rand(12, 28),
        maxLife: 30,
        color: color,
        size: kind === 'dust' ? rand(2, 5) : rand(1.5, 4),
        kind: kind,
        gravity: kind === 'dust' ? 0.08 : 0.15
      });
    }
  }

  function spawnDamageNumber(x, y, dmg, crit) {
    floatingNums.push({
      x: x + rand(-10, 10),
      y: y,
      vy: -2.8,
      life: 55,
      maxLife: 55,
      dmg: dmg,
      crit: crit,
      scale: crit ? 1.4 : 1
    });
  }

  function spawnImpactText(x, y, text) {
    impactTexts.push({
      x: x, y: y - 30,
      text: text,
      life: 35,
      maxLife: 35,
      scale: 1.6,
      rot: rand(-0.3, 0.3)
    });
  }

  function nearestEnemy() {
    var best = null;
    var bestD = Infinity;
    enemies.forEach(function (e) {
      if (e.dead || e.hp <= 0) return;
      var d = Math.abs(e.x - player.x);
      if (d < bestD) { bestD = d; best = e; }
    });
    return best;
  }

  function checkAttackHit(atk, hx, hy, range, height) {
    var hit = false;
    enemies.forEach(function (e) {
      if (e.dead || e.hp <= 0 || e.hitstun > 0) return;
      var dx = Math.abs(e.x - hx);
      var dy = Math.abs((e.y - e.h * 0.35) - hy);
      if (dx < range && dy < height) {
        var crit = Math.random() < (combo >= 3 ? 0.22 : 0.12);
        var blocked = e.blocking && !atk.launch;
        var finalDmg = blocked ? Math.floor(atk.dmg * 0.25) : (crit ? Math.floor(atk.dmg * 1.75) : atk.dmg);
        e.hp -= finalDmg;
        e.hitFlash = 14;
        e.hitstun = blocked ? 8 : 14;
        e.kbX = player.facing * (blocked ? atk.kb * 0.3 : atk.kb);
        e.damageChunk = e.hp / e.maxHp;
        if (atk.launch) e.vy = -9;
        spawnParticles(e.x, e.y - 25, crit ? '#ffeb3b' : e.colors.accent, crit ? 18 : 12);
        spawnDamageNumber(e.x, e.y - 55, finalDmg, crit);
        if (!blocked) {
          spawnImpactText(e.x, e.y - 20, crit ? 'CRACK!' : combo >= 4 ? 'POW!' : 'HIT!');
          registerHit(finalDmg, crit, false);
          hitstop(atk.hitstop);
          screenShake(crit ? 9 : 5, crit ? 220 : 140);
        } else {
          spawnImpactText(e.x, e.y - 20, 'BLOCK');
          spawnParticles(e.x, e.y - 20, '#90a4ae', 6);
        }
        if (e.hp <= 0) {
          e.hp = 0;
          e.dead = true;
          koExplosion(e.x, e.y);
          score += e.scoreVal;
        }
        hit = true;
      }
    });
    return hit;
  }

  function koExplosion(x, y) {
    spawnParticles(x, y, '#ffeb3b', rm() ? 12 : 35, 'spark');
    spawnParticles(x, y, '#ff5252', rm() ? 8 : 25, 'spark');
    spawnImpactText(x, y, 'KO!');
    screenShake(14, 450);
    camZoomTarget = 1.06;
    setTimeout(function () { camZoomTarget = 1; }, 400);
  }

  function startAttack(type) {
    if (player.hitstun > 0) return false;
    if (player.state === 'attack') {
      player.attackBuffered = type;
      player.bufferMs = BUFFER_MS;
      return false;
    }
    if (player.state !== 'idle' && player.state !== 'walk') return false;
    if (player.attackCd > 0) {
      player.attackBuffered = type;
      player.bufferMs = BUFFER_MS;
      return false;
    }
    player.state = 'attack';
    player.attackType = type;
    player.frame = 0;
    player.attackCd = type === 'uppercut' ? 26 : type === 'kick' ? 18 : 14;
    return true;
  }

  function fireSpecial() {
    if (player.specialMeter < ATTACKS.special.meter) return;
    if (player.state !== 'idle' && player.state !== 'walk') return;
    player.specialMeter = 0;
    player.state = 'special';
    player.frame = 0;
    camZoomTarget = 1.08;
    setTimeout(function () { camZoomTarget = 1; }, 500);
    projectiles.push({
      x: player.x + player.facing * 45,
      y: player.y - 58,
      vx: player.facing * 14,
      vy: 0,
      r: 18,
      dmg: ATTACKS.special.dmg,
      life: 90,
      trail: []
    });
    spawnParticles(player.x + player.facing * 35, player.y - 50, '#00e5ff', rm() ? 6 : 16);
    screenShake(8, 200);
  }

  function updatePlayer(dt) {
    var dtF = dt / 16.67;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.hitstun > 0) {
      player.hitstun -= dt;
      player.vy += GRAVITY * dtF;
      player.y += player.vy * dtF;
      if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }
      return;
    }
    if (player.attackCd > 0) player.attackCd -= dt;
    if (player.flash > 0) player.flash -= dt;
    if (player.bufferMs > 0) player.bufferMs -= dt;

    if (player.onGround) player.coyoteMs = COYOTE_MS;
    else player.coyoteMs = Math.max(0, player.coyoteMs - dt);

    if (player.state === 'attack') {
      player.frame += dtF;
      var atk = ATTACKS[player.attackType];
      if (Math.floor(player.frame) === atk.active) {
        var hx = player.x + player.facing * 38;
        var hy = player.attackType === 'uppercut' ? player.y - 68 : player.y - 42;
        checkAttackHit(atk, hx, hy, atk.range, atk.height);
      }
      if (player.frame >= atk.frames) {
        player.state = 'idle';
        player.attackType = null;
        player.frame = 0;
        if (player.attackBuffered && player.bufferMs > 0) {
          var buf = player.attackBuffered;
          player.attackBuffered = null;
          startAttack(buf);
        }
      }
      return;
    }

    if (player.state === 'special') {
      player.frame += dtF;
      if (player.frame >= 24) player.state = 'idle';
      return;
    }

    player.vx = 0;
    if (keys.left) { player.vx = -5.5; player.facing = -1; player.state = 'walk'; }
    if (keys.right) { player.vx = 5.5; player.facing = 1; player.state = 'walk'; }
    if (!keys.left && !keys.right && player.onGround) player.state = 'idle';

    if (player.state === 'walk') player.walkPhase += dt * 0.018;
    else player.bob += dt * 0.004;

    if (justPressed.jump && player.coyoteMs > 0) {
      player.vy = -14.5;
      player.onGround = false;
      player.coyoteMs = 0;
      spawnParticles(player.x, player.y, 'rgba(255,255,255,0.4)', 4, 'dust');
    }
    if (justPressed.punch) startAttack(keys.down ? 'uppercut' : 'punch');
    else if (justPressed.kick) startAttack('kick');
    else if (justPressed.special) fireSpecial();

    justPressed.jump = false;
    justPressed.punch = false;
    justPressed.kick = false;
    justPressed.special = false;

    player.vy += GRAVITY * dtF;
    var prevY = player.y;
    player.x += player.vx * dtF;
    player.y += player.vy * dtF;

    if (player.y >= GROUND) {
      if (!player.onGround && prevY < GROUND) spawnParticles(player.x, GROUND, 'rgba(200,200,220,0.35)', rm() ? 3 : 8, 'dust');
      player.y = GROUND;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    player.x = clamp(player.x, 70, W - 70);
  }

  function updateEnemies(dt) {
    var dtF = dt / 16.67;
    var alive = 0;
    enemies.forEach(function (e) {
      if (e.dead) return;
      if (e.hp <= 0) { e.dead = true; return; }
      alive++;
      if (e.hitstun > 0) {
        e.hitstun -= dt;
        e.x += e.kbX * 0.12 * dtF;
        e.kbX *= 0.88;
        e.vy += GRAVITY * 0.5 * dtF;
        e.y += e.vy * dtF;
        if (e.y >= (e.floatY ? GROUND - 24 : GROUND)) {
          e.y = e.floatY ? GROUND - 24 + Math.sin(e.phase) * 14 : GROUND;
          e.vy = 0;
        }
        return;
      }
      if (e.hitFlash > 0) e.hitFlash -= dt;
      e.phase += 0.035 * dtF;
      if (e.floatY) e.y = GROUND - 24 + Math.sin(e.phase) * 16;

      var dx = player.x - e.x;
      e.facing = dx > 0 ? 1 : -1;
      var dist = Math.abs(dx);

      if (e.telegraph > 0) {
        e.telegraph -= dt;
        e.state = 'telegraph';
        if (e.telegraph <= 0) {
          e.state = 'attack';
          e.stateTimer = 16;
          if (dist < 130 && player.invuln <= 0 && gameState === 'playing') {
            var dmg = e.heavy ? e.dmg * 1.6 : e.dmg;
            if (!e.heavy || Math.random() > 0.35) {
              player.hp -= dmg;
              player.invuln = 50;
              player.hitstun = e.heavy ? 22 : 12;
              player.flash = 10;
              player.vx = -e.facing * (e.heavy ? 8 : 4);
              spawnDamageNumber(player.x, player.y - 75, dmg, false);
              spawnParticles(player.x, player.y - 45, '#b388ff', rm() ? 5 : 12);
              spawnImpactText(player.x, player.y - 50, e.heavy ? 'SMASH!' : 'OW!');
              screenShake(e.heavy ? 10 : 6, e.heavy ? 280 : 160);
              combo = 0;
              comboTimerMs = 0;
              lastComboTier = 0;
              player.damageChunk = player.hp / player.maxHp;
              if (player.hp <= 0) { player.hp = 0; gameState = 'lose'; showAnnounce('DEFEAT', ''); }
            } else {
              spawnImpactText(player.x, player.y - 50, 'DODGED!');
            }
          }
        }
        return;
      }

      if (e.state === 'attack') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          e.state = 'idle';
          e.attackCd = rand(50, 110);
        }
        return;
      }

      e.attackCd -= dt;
      if (dist > 200) {
        e.state = 'walk';
        e.x += e.facing * e.speed * dtF;
      } else if (dist > 90) {
        e.state = 'idle';
        if (Math.random() < 0.02) e.x += e.facing * e.speed * 0.5 * dtF;
        if (e.attackCd <= 0 && gameState === 'playing') {
          e.heavy = Math.random() < 0.28;
          e.telegraph = e.heavy ? 55 : 32;
          e.blocking = !e.heavy && Math.random() < 0.35;
          if (e.blocking) e.state = 'block';
        }
      } else {
        if (e.attackCd <= 0 && gameState === 'playing') {
          e.heavy = Math.random() < 0.35;
          e.telegraph = e.heavy ? 60 : 28;
        }
      }
      e.x = clamp(e.x, 100, W - 80);
    });

    if (alive === 0 && gameState === 'playing') {
      if (wave < 5) {
        gameState = 'wave_clear';
        stateTimer = 1800;
        showAnnounce('CLEAR!', '');
      } else {
        gameState = 'win';
        var perfect = player.hp === player.maxHp;
        showAnnounce('K.O.!', 'ko');
        if (perfect) setTimeout(function () { showAnnounce('PERFECT!', 'perfect'); }, 700);
      }
    }
  }

  function updateProjectiles(dt) {
    var dtF = dt / 16.67;
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y, life: 12 });
        if (p.trail.length > (rm() ? 6 : 14)) p.trail.shift();
      }
      p.x += p.vx * dtF;
      p.y += p.vy * dtF;
      p.life -= dt;
      var hit = false;
      enemies.forEach(function (e) {
        if (e.dead || e.hp <= 0 || hit) return;
        var dx = p.x - e.x;
        var dy = p.y - (e.y - 25);
        if (Math.sqrt(dx * dx + dy * dy) < p.r + 32) {
          var crit = Math.random() < 0.25;
          var fd = crit ? Math.floor(p.dmg * 1.6) : p.dmg;
          e.hp -= fd;
          e.hitFlash = 14;
          e.hitstun = 18;
          e.kbX = p.vx > 0 ? 22 : -22;
          spawnParticles(p.x, p.y, '#00e5ff', rm() ? 8 : 20);
          spawnDamageNumber(e.x, e.y - 45, fd, crit);
          registerHit(fd, crit, true);
          hitstop(ATTACKS.special.hitstop);
          screenShake(10, 260);
          if (e.hp <= 0) { e.hp = 0; e.dead = true; koExplosion(e.x, e.y); score += e.scoreVal; }
          hit = true;
        }
      });
      if (hit || p.life <= 0 || p.x < -40 || p.x > W + 40) projectiles.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    var dtF = dt / 16.67;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * dtF;
      p.y += p.vy * dtF;
      p.vy += (p.gravity || 0.12) * dtF;
      p.life -= dt * 0.9;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (var j = floatingNums.length - 1; j >= 0; j--) {
      var n = floatingNums[j];
      n.y += n.vy * dtF;
      n.vy *= 0.98;
      n.life -= dt;
      n.scale = lerp(n.scale, 1, 0.08 * dtF);
      if (n.life <= 0) floatingNums.splice(j, 1);
    }
    for (var k = impactTexts.length - 1; k >= 0; k--) {
      var t = impactTexts[k];
      t.y -= 1.2 * dtF;
      t.life -= dt;
      t.scale = lerp(t.scale, 1, 0.06 * dtF);
      if (t.life <= 0) impactTexts.splice(k, 1);
    }
  }

  function drawParallaxBg() {
    var sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#060a14');
    sky.addColorStop(0.45, '#12102a');
    sky.addColorStop(1, '#1e1838');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    stars.forEach(function (s) {
      var a = 0.35 + Math.sin(s.tw + parallax * 0.001) * 0.25;
      ctx.fillStyle = 'rgba(220,230,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
      ctx.fill();
    });

    skyline.forEach(function (b) {
      var px = (b.x - parallax * (0.15 + b.layer * 0.12)) % (W + 200);
      if (px < -b.w) px += W + 200;
      var alpha = 0.25 + b.layer * 0.15;
      ctx.fillStyle = 'rgba(' + (15 + b.layer * 8) + ',' + (12 + b.layer * 6) + ',' + (28 + b.layer * 10) + ',' + alpha + ')';
      ctx.fillRect(px, GROUND - b.h, b.w, b.h);
      ctx.fillStyle = 'rgba(255,200,80,' + (0.08 + b.layer * 0.04) + ')';
      for (var w = 0; w < b.windows; w++) {
        var wy = GROUND - b.h + 15 + (w % 4) * 22;
        var wx = px + 8 + Math.floor(w / 4) * 14;
        if (Math.sin(w + b.x) > -0.2) ctx.fillRect(wx, wy, 6, 10);
      }
    });

    var floorGrad = ctx.createLinearGradient(0, GROUND, 0, H);
    floorGrad.addColorStop(0, '#2a2248');
    floorGrad.addColorStop(1, '#120e20');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND, W, H - GROUND);

    ctx.strokeStyle = 'rgba(0,229,255,0.12)';
    ctx.lineWidth = 1;
    for (var gx = -80; gx < W + 80; gx += 48) {
      ctx.beginPath();
      ctx.moveTo(gx + (parallax * 0.3) % 48, GROUND);
      ctx.lineTo(gx - 120 + (parallax * 0.3) % 48, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,229,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(W, GROUND);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, GROUND + 2, W, 8);
  }

  function drawShadow(x, y, w) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, GROUND + 4, w * 0.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHero(p) {
    drawShadow(p.x, p.y, 40);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);
    if (p.flash > 0 && Math.floor(p.flash / 3) % 2) ctx.globalAlpha = 0.55;

    var bob = p.state === 'idle' ? Math.sin(p.bob) * 3 : 0;
    var lean = p.state === 'walk' ? Math.sin(p.walkPhase) * 0.06 : 0;
    ctx.rotate(lean);
    ctx.translate(0, bob);

    var bodyGrad = ctx.createLinearGradient(-20, -80, 20, 10);
    bodyGrad.addColorStop(0, '#5eb8ff');
    bodyGrad.addColorStop(0.5, '#2d8fd4');
    bodyGrad.addColorStop(1, '#1a5f9e');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, -62, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c9a8';
    ctx.beginPath();
    ctx.arc(0, -68, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(-11, -72, 22, 5);

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-18, -52);
    ctx.lineTo(18, -52);
    ctx.lineTo(14, -8);
    ctx.lineTo(-14, -8);
    ctx.closePath();
    ctx.fill();

    var armA = 0.35;
    var legA = 0;
    if (p.state === 'attack') {
      if (p.attackType === 'punch') armA = -1.1 + Math.min(p.frame, 6) * 0.15;
      if (p.attackType === 'kick') legA = -0.9;
      if (p.attackType === 'uppercut') armA = -1.6;
    } else if (p.state === 'walk') {
      legA = Math.sin(p.walkPhase) * 0.55;
    }

    ctx.save();
    ctx.translate(16, -42);
    ctx.rotate(armA);
    ctx.fillStyle = '#3d9ee8';
    ctx.fillRect(-3, -4, 26, 10);
    ctx.fillStyle = '#f5c9a8';
    ctx.beginPath();
    ctx.arc(24, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(-16, -42);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#3d9ee8';
    ctx.fillRect(-26, -4, 26, 10);
    ctx.restore();

    var kickExt = 0;
    if (p.state === 'attack' && p.attackType === 'kick') kickExt = 32 + Math.min(p.frame, 10) * 2;
    ctx.save();
    ctx.translate(-7, -6);
    ctx.rotate(legA);
    ctx.fillStyle = '#1e4d7a';
    ctx.fillRect(-5, 0, 12, 32);
    ctx.fillStyle = '#263238';
    ctx.fillRect(-7, 28, 16, 8);
    ctx.restore();

    ctx.save();
    ctx.translate(7, -6);
    ctx.rotate(-legA + (kickExt ? -0.7 : 0));
    ctx.fillStyle = '#1e4d7a';
    ctx.fillRect(-5, 0, 12, 28 + kickExt * 0.3);
    if (kickExt) {
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(-2, 24 + kickExt * 0.3, 28, 10);
    }
    ctx.fillStyle = '#263238';
    ctx.fillRect(-7, 26 + kickExt * 0.3, 16, 8);
    ctx.restore();

    if (p.state === 'special') {
      ctx.globalAlpha = 0.5 + Math.sin(p.frame * 0.5) * 0.3;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -40, 40 + p.frame, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnemy(e) {
    if (e.dead) return;
    var bob = e.floatY ? Math.sin(e.phase) * 6 : 0;
    drawShadow(e.x, e.y, 28 * e.scale);
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    ctx.scale(e.facing * e.scale, e.scale);
    if (e.hitFlash > 0 && Math.floor(e.hitFlash / 2) % 2) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#fff';
    }

    if (e.telegraph > 0) {
      var pulse = 0.4 + Math.sin(e.telegraph * 0.2) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = e.heavy ? '#ff1744' : '#ff9800';
      ctx.beginPath();
      ctx.arc(0, -10, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    var body = ctx.createRadialGradient(0, -10, 4, 0, -10, 36);
    body.addColorStop(0, e.colors.accent + '55');
    body.addColorStop(0.6, e.colors.body);
    body.addColorStop(1, '#000');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, -8, 34, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = e.colors.accent;
    ctx.lineWidth = 2;
    for (var t = 0; t < 4; t++) {
      var ta = e.phase + t * 1.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * 20, -8 + Math.sin(ta) * 12);
      ctx.quadraticCurveTo(Math.cos(ta) * 38, -20 + Math.sin(ta * 2) * 10, Math.cos(ta + 0.5) * 48, -5);
      ctx.stroke();
    }

    ctx.fillStyle = e.state === 'block' ? '#ffd54f' : '#ff1744';
    ctx.shadowColor = e.colors.accent;
    ctx.shadowBlur = e.telegraph > 0 ? 18 : 8;
    ctx.beginPath();
    ctx.ellipse(-12, -14, 7, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(12, -14, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-12, -14, 3, 0, Math.PI * 2);
    ctx.arc(12, -14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 20px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = e.colors.accent;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(e.glyph, 0, 6);
    ctx.fillText(e.glyph, 0, 6);

    if (e.state === 'block') {
      ctx.strokeStyle = 'rgba(255,213,79,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -10, 40, -1, 1);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHealthBar(x, y, w, h, pct, chunkPct, name, color1, color2, align) {
    ctx.save();
    var dmgPct = Math.max(0, chunkPct - pct);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    if (dmgPct > 0.001) {
      ctx.fillStyle = 'rgba(180,40,40,0.75)';
      roundRect(ctx, x + 2, y + 2, (w - 4) * chunkPct, h - 4, 3);
      ctx.fill();
    }
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    roundRect(ctx, x + 2, y + 2, (w - 4) * pct, h - 4, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = align || 'left';
    var tx = align === 'right' ? x + w : x;
    ctx.fillText(name, tx, y - 6);
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawHud() {
    drawHealthBar(48, 36, 280, 22, player.hp / player.maxHp, player.damageChunk, 'X-FIGHTER', '#69f0ae', '#00c853', 'left');

    var foe = nearestEnemy();
    if (foe) {
      drawHealthBar(W - 328, 36, 280, 22, foe.hp / foe.maxHp, foe.damageChunk, foe.name, '#ff5252', '#c62828', 'right');
    }

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, W / 2 - 70, 24, 140, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Consolas, monospace';
    ctx.textAlign = 'center';
    var mins = Math.floor(roundTimer / 60);
    var secs = Math.floor(roundTimer % 60);
    ctx.fillText(mins + ':' + (secs < 10 ? '0' : '') + secs, W / 2, 47);

    displayScore = lerp(displayScore, score, 0.12);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, W / 2 - 90, 62, 180, 28, 5);
    ctx.fill();
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 16px Consolas, monospace';
    ctx.fillText('SCORE ' + Math.floor(displayScore), W / 2, 81);

    if (combo >= 2) {
      var comboScale = 1 + Math.min(combo * 0.04, 0.5);
      var comboColor = combo >= 8 ? '#ff1744' : combo >= 5 ? '#ffeb3b' : combo >= 3 ? '#00e5ff' : '#fff';
      ctx.save();
      ctx.translate(W / 2, 120);
      ctx.scale(comboScale, comboScale);
      ctx.fillStyle = comboColor;
      ctx.font = 'bold ' + (combo >= 5 ? 36 : 26) + 'px Impact, Haettenschweiler, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 12;
      ctx.fillText(combo + ' HIT COMBO!', 0, 0);
      ctx.restore();

      var barW = 160;
      var barX = W / 2 - barW / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, barX, 132, barW, 6, 3);
      ctx.fill();
      ctx.fillStyle = comboColor;
      roundRect(ctx, barX, 132, barW * (comboTimerMs / COMBO_WINDOW_MS), 6, 3);
      ctx.fill();
    }

    var meterW = 200;
    var meterX = 48;
    var meterY = H - 52;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, meterX, meterY, meterW, 14, 4);
    ctx.fill();
    var mGrad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
    mGrad.addColorStop(0, '#00bcd4');
    mGrad.addColorStop(1, '#00e5ff');
    ctx.fillStyle = mGrad;
    roundRect(ctx, meterX + 2, meterY + 2, (meterW - 4) * (player.specialMeter / player.specialMax), 10, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPECIAL [C/L]', meterX, meterY - 4);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('WAVE ' + wave, W - 48, H - 38);
  }

  function drawProjectiles() {
    projectiles.forEach(function (p) {
      if (p.trail) {
        p.trail.forEach(function (tr, idx) {
          ctx.globalAlpha = (tr.life / 12) * (idx / p.trail.length);
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.arc(tr.x, tr.y, p.r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.globalAlpha = 1;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.4, '#00e5ff');
      g.addColorStop(1, 'rgba(0,100,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function drawParticlesLayer() {
    particles.forEach(function (p) {
      ctx.globalAlpha = clamp(p.life / (p.maxLife || 25), 0, 1);
      ctx.fillStyle = p.color;
      if (p.kind === 'spark') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.3);
        ctx.fillRect(-p.size, -p.size * 0.3, p.size * 2, p.size * 0.6);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    floatingNums.forEach(function (n) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.scale, n.scale);
      ctx.globalAlpha = clamp(n.life / n.maxLife, 0, 1);
      ctx.fillStyle = n.crit ? '#ffeb3b' : '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold ' + (n.crit ? 22 : 17) + 'px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(n.dmg, 0, 0);
      ctx.fillText(n.dmg, 0, 0);
      ctx.restore();
    });

    impactTexts.forEach(function (t) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.scale(t.scale, t.scale);
      ctx.globalAlpha = clamp(t.life / t.maxLife, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 4;
      ctx.font = 'bold 24px Impact, Haettenschweiler, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(t.text, 0, 0);
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    });
  }

  function drawVignette() {
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'transparent');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function drawIntro() {
    drawParallaxBg();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 64px Impact, Haettenschweiler, sans-serif';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30;
    ctx.fillText('X-FIGHT', W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Destroy the glitched horde · 5 waves', W / 2, H / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '15px sans-serif';
    ctx.fillText('[ ENTER ] start    [ ESC ] exit', W / 2, H / 2 + 50);
    drawVignette();
  }

  function drawDesktopOnly() {
    drawParallaxBg();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DESKTOP ONLY', W / 2, H / 2 - 24);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('X-Fight needs a keyboard', W / 2, H / 2 + 16);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px sans-serif';
    ctx.fillText('ESC to close', W / 2, H / 2 + 54);
  }

  function drawEndScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    if (gameState === 'win') {
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('FINAL SCORE: ' + score, W / 2, H / 2 + 60);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '18px sans-serif';
      ctx.fillText('MAX COMBO: ' + maxCombo + '  ·  WAVES: ' + wave, W / 2, H / 2 + 95);
    } else {
      ctx.fillStyle = '#ff5252';
      ctx.font = 'bold 48px Impact, sans-serif';
      ctx.fillText('DEFEAT', W / 2, H / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('SCORE: ' + score, W / 2, H / 2 + 30);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '15px sans-serif';
    ctx.fillText('[ ENTER ] rematch    [ ESC ] exit', W / 2, H / 2 + 140);
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min(ts - lastTs, 50);
    lastTs = ts;

    if (hitstopMs > 0) {
      hitstopMs -= dt;
      raf = requestAnimationFrame(loop);
      return;
    }

    if (comboTimerMs > 0) {
      comboTimerMs -= dt;
      if (comboTimerMs <= 0) { combo = 0; lastComboTier = 0; }
    }
    if (shakeTimerMs > 0) shakeTimerMs -= dt;
    if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - dt * 0.003);
    if (chromaticMs > 0) chromaticMs -= dt;
    camZoom = lerp(camZoom, camZoomTarget, 0.08);
    parallax += dt * 0.02;

    if (gameState === 'announce') {
      announceTimer -= dt;
      if (announceTimer <= 0) gameState = 'playing';
    }
    if (gameState === 'wave_clear') {
      stateTimer -= dt;
      if (stateTimer <= 0) nextWave();
    }
    if (gameState === 'playing') {
      roundTimer -= dt / 1000;
      if (roundTimer <= 0) { roundTimer = 0; gameState = 'lose'; showAnnounce('TIME UP', ''); }
      updatePlayer(dt);
      updateEnemies(dt);
      updateProjectiles(dt);
    }
    updateParticles(dt);

    player.damageChunk = lerp(player.damageChunk, player.hp / player.maxHp, 0.06);
    enemies.forEach(function (e) {
      if (!e.dead) e.damageChunk = lerp(e.damageChunk, e.hp / e.maxHp, 0.08);
    });

    ctx.save();
    var zoom = camZoom;
    var cx = W / 2;
    var cy = H / 2;
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx + camX, -cy + camY);

    if (shakeTimerMs > 0 && !rm()) {
      ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
    }

    drawParallaxBg();

    if (core() && core().isMobile()) {
      drawDesktopOnly();
    } else if (gameState === 'intro') {
      drawIntro();
    } else {
      enemies.forEach(drawEnemy);
      drawHero(player);
      drawProjectiles();
      drawParticlesLayer();
      drawHud();
      if (gameState === 'win' || gameState === 'lose') drawEndScreen();
    }

    if (flashAlpha > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
      ctx.fillRect(0, 0, W, H);
    }
    drawVignette();
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
      initWorldArt();
      resetGame();
      return;
    }

    if ((gameState === 'win' || gameState === 'lose') && e.key === 'Enter') {
      e.preventDefault();
      resetGame();
      return;
    }

    if (gameState !== 'playing' && gameState !== 'intro' && gameState !== 'announce') return;

    var code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
    if (code === 'ArrowUp' || code === 'KeyW') { keys.up = true; justPressed.jump = true; }
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = true;
    if (code === 'KeyZ' || code === 'KeyJ') { keys.punch = true; justPressed.punch = true; }
    if (code === 'KeyX' || code === 'KeyK') { keys.kick = true; justPressed.kick = true; }
    if (code === 'KeyC' || code === 'KeyL') { keys.special = true; justPressed.special = true; }

    var fightKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyZ', 'KeyJ', 'KeyX', 'KeyK', 'KeyC', 'KeyL'];
    if (fightKeys.indexOf(code) >= 0) {
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
    reduced = core() && core().reduceMotion();
    if (core()) core().setOverlayLock(true);

    overlay = document.createElement('div');
    overlay.id = 'egg-fight-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'X-Fight mini-game');

    announceEl = document.createElement('div');
    announceEl.className = 'egg-fight-announce';
    overlay.appendChild(announceEl);

    canvas = document.createElement('canvas');
    canvas.id = 'egg-fight-canvas';
    overlay.appendChild(canvas);

    controlsEl = document.createElement('div');
    controlsEl.className = 'egg-fight-controls';
    controlsEl.textContent = '←→/AD move · ↑/W jump · Z/J punch · X/K kick · C/L special · ↓+punch uppercut · ESC exit';
    overlay.appendChild(controlsEl);

    document.body.appendChild(overlay);

    ctx = canvas.getContext('2d');
    initWorldArt();
    player = new Player();
    enemies = [];
    gameState = 'intro';
    running = true;
    lastTs = 0;
    keys = {};
    justPressed = {};

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(loop);

    if (core()) {
      core().registerTrigger('_escape', closeFight);
      core().screenShake(5, 220);
    }
  }

  function closeFight() {
    if (!overlay) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('resize', resize);
    document.documentElement.classList.remove('egg-fight-flash');
    overlay.remove();
    overlay = null;
    canvas = null;
    announceEl = null;
    controlsEl = null;
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
