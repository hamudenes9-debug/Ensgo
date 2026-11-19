  /* ==================================================================
     SES — tamamen prosedürel (WebAudio, dosya yok)
  ================================================================== */
  var Audio2 = (function () {
    var ctx = null, master = null, noiseBuf = null, ready = false;
    function init() {
      if (ctx) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ctx = new AC(); } catch (e) { return; }
      master = ctx.createGain();
      master.gain.value = G.vol;
      master.connect(ctx.destination);
      // beyaz gürültü tamponu
      var n = ctx.sampleRate * 2.0;
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      ready = true;
    }
    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    function vol(v) { if (master) master.gain.value = v; }
    function noise(dur, filterType, freq, q, gain, decay, pitchEnd) {
      if (!ready) return;
      var t0 = ctx.currentTime;
      var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      s.playbackRate.value = 1;
      var f = ctx.createBiquadFilter(); f.type = filterType || 'lowpass';
      f.frequency.setValueAtTime(freq, t0);
      if (pitchEnd) f.frequency.exponentialRampToValueAtTime(Math.max(60, pitchEnd), t0 + dur);
      f.Q.value = q || 1;
      var g = ctx.createGain();
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + (decay || dur));
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t0); s.stop(t0 + dur + 0.05);
    }
    function tone(freq, dur, type, gain, slideTo) {
      if (!ready) return;
      var t0 = ctx.currentTime;
      var o = ctx.createOscillator(); o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    return {
      init: init, resume: resume, vol: vol,
      gun: function (kind) {
        if (!ready) return;
        var pitch = kind === 'ak' ? 2400 : kind === 'm4' ? 3200 : kind === 'pistol' ? 2600 : 2000;
        var len = kind === 'pistol' ? 0.1 : 0.16;
        noise(len * 1.6, 'lowpass', pitch, 1.2, kind === 'pistol' ? 0.5 : 0.66, 0.13, 260);
        noise(len, 'bandpass', 900, 1.6, 0.32, 0.07, 400);
        tone(kind === 'ak' ? 120 : 160, 0.13, 'sawtooth', 0.18, 45);
      },
      enemyGun: function (kind, dist) {
        if (!ready) return;
        var g = clamp(1 - dist / 55, 0.08, 1);
        noise(0.13, 'lowpass', kind === 'pistol' ? 1800 : 1400, 1.2, 0.3 * g, 0.12, 220);
        tone(110, 0.1, 'sawtooth', 0.1 * g, 40);
      },
      empty: function () { tone(1400, 0.03, 'square', 0.08); },
      reload: function (t) {
        tone(240, 0.05, 'square', 0.07);
        setTimeout(function () { tone(180, 0.06, 'square', 0.08); }, (t || 1) * 500);
        setTimeout(function () { tone(320, 0.05, 'square', 0.09); }, (t || 1) * 900);
      },
      knife: function () { noise(0.22, 'bandpass', 2200, 2.2, 0.22, 0.2, 900); },
      hit: function () { noise(0.05, 'bandpass', 1500, 3, 0.18, 0.05); },
      head: function () { tone(1900, 0.07, 'triangle', 0.16, 2600); tone(2600, 0.05, 'sine', 0.09); },
      kill: function () { tone(520, 0.09, 'triangle', 0.1, 780); },
      hurt: function () { noise(0.2, 'lowpass', 420, 1, 0.4, 0.22, 90); tone(70, 0.2, 'sine', 0.2, 40); },
      buy: function () { tone(880, 0.07, 'triangle', 0.12); setTimeout(function () { tone(1320, 0.09, 'triangle', 0.12); }, 70); },
      deny: function () { tone(180, 0.16, 'square', 0.1); },
      step: function () { noise(0.07, 'lowpass', rand(600, 340), 1.2, 0.055, 0.08, 160); },
      zombie: function () { tone(72, 0.55, 'sawtooth', 0.085, 46); noise(0.3, 'lowpass', 420, 1.2, 0.07, 0.2, 160); },
      siren: function () {
        tone(520, 0.7, 'square', 0.075, 880);
        setTimeout(function () { tone(880, 0.7, 'square', 0.075, 520); }, 620);
        setTimeout(function () { tone(520, 0.8, 'square', 0.07, 780); }, 1240);
      },
      wave: function () { tone(150, 0.5, 'sawtooth', 0.1, 300); setTimeout(function () { tone(300, 0.6, 'sawtooth', 0.09, 420); }, 260); },
      clear: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.22, 'triangle', 0.13); }, i * 110); }); },
      death: function () { tone(220, 0.9, 'sawtooth', 0.18, 60); noise(0.7, 'lowpass', 500, 1, 0.25, 0.8, 80); }
    };
  })();

  /* ==================================================================
     GİRDİ
  ================================================================== */
  var keys = {};
  var mouse = { dx: 0, dy: 0, down: false, rdown: false };
  var INPUT = {
    blocked: function () { return G.state !== 'playing'; }
  };

  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', ' ', 'r', 'b', '1', '2', '3', '4', 'shift', 'control', 'escape', 'enter', 'tab', 'q', 'e'].indexOf(k) >= 0) e.preventDefault();
    if (keys[k]) return;
    keys[k] = true;
    if (k === ' ' && G.state === 'playing') player.wantJump = true;
    if (k === 'r' && G.state === 'playing') tryReload();
    if (k === '1') switchWeapon('knife');
    if (k === '2') switchWeapon('pistol');
    if (k === '3') switchWeapon('rifle');
    if (k === 'q') switchWeapon(null, -1);
    if (k === 'b') toggleShop();
    if (k === 'escape') {
      if (G.state === 'playing' || G.state === 'shop') pauseGame();
      else if (G.state === 'paused') resumeGame();
    }
    if (k === 'enter' && G.state === 'shop') startWave(G.wave + 1);
    if (k === 'm') { G.muted = !G.muted; Audio2.vol(G.muted ? 0 : G.vol); }
  });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { keys = {}; mouse.down = false; mouse.rdown = false; });

  function onMouseMove(e) {
    if (G.state !== 'playing') return;
    if (G.pointerLocked || G.dragLook) {
      var mx = e.movementX || 0, my = e.movementY || 0;
      if (!G.pointerLocked) { mx = e.clientX - mouse.lastX; my = e.clientY - mouse.lastY; mouse.lastX = e.clientX; mouse.lastY = e.clientY; }
      player.yaw -= mx * 0.0021 * G.sens;
      player.pitch = clamp(player.pitch - my * 0.0021 * G.sens, -1.45, 1.42);
      mouse.dx += mx; mouse.dy += my;
    }
  }
  window.addEventListener('mousemove', onMouseMove);

  canvas.addEventListener('mousedown', function (e) {
    if (G.state !== 'playing') return;
    Audio2.init(); Audio2.resume();
    if (!G.pointerLocked) {
      canvas.requestPointerLock && canvas.requestPointerLock();
      if (!document.pointerLockElement) { G.dragLook = true; mouse.lastX = e.clientX; mouse.lastY = e.clientY; }
    }
    if (e.button === 0) { mouse.down = true; player.wantFire = true; }
    if (e.button === 2) mouse.rdown = true;
  });
  window.addEventListener('mouseup', function (e) {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rdown = false;
    G.dragLook = false;
  });
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('pointerlockchange', function () {
    G.pointerLocked = document.pointerLockElement === canvas;
    if (!G.pointerLocked && G.state === 'playing' && G.started && !G.suppressPause) pauseGame();
  });
  window.addEventListener('wheel', function (e) {
    if (G.state !== 'playing') return;
    e.preventDefault();
    switchWeapon(null, e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  /* ==================================================================
     OYUNCU + SİLAH DURUMU
  ================================================================== */
  var player = {
    pos: V3(0, 0, 16), vel: V3(0, 0, 0),
    yaw: 0, pitch: 0, hp: 100, armor: 0, maxHp: 100,
    onGround: true, crouch: false, sprint: false, sprintT: 0,
    radius: 0.4, eye: EYE, eyeCur: EYE,
    cur: 'knife', prev: 'knife',
    owned: { knife: true, pistol: false, m4a4: false, ak47: false },
    mags: {}, res: {}, reloadT: 0, fireCd: 0, switchT: 0,
    recoil: 0, recoilYaw: 0, bloom: 0, bob: 0, bobPhase: 0,
    flashT: 0, dead: false, stepT: 0, killsSinceReload: 0
  };
  player.mags.knife = 0; player.res.knife = 0;

  function wdef() { return WEAPONS[player.cur]; }
  function ownedWeapons() {
    return ['knife', 'pistol', 'm4a4', 'ak47'].filter(function (k) { return player.owned[k]; });
  }
  function switchWeapon(which, dir) {
    if (G.state !== 'playing') return;
    var list = ownedWeapons();
    var cur = player.cur, next = cur;
    if (which === 'rifle') {
      if (player.owned.ak47) next = 'ak47';
      else if (player.owned.m4a4) next = 'm4a4';
      else return;
    } else if (which) { next = which; }
    else {
      var i = list.indexOf(cur);
      next = list[(i + dir + list.length) % list.length];
    }
    if (!player.owned[next] || next === cur) return;
    player.cur = next; player.switchT = 0.32; player.reloadT = 0;
    updateAmmoHud();
    Audio2.reload(0.2);
  }

  function tryReload() {
    var w = wdef();
    if (w.melee || w.reload <= 0) return;
    if (player.reloadT > 0) return;
    var mag = player.mags[player.cur] || 0, res = player.res[player.cur] || 0;
    if (mag >= w.mag || res <= 0) return;
    player.reloadT = w.reload;
    Audio2.reload(w.reload);
  }
  function finishReload() {
    var w = wdef();
    var mag = player.mags[player.cur] || 0, res = player.res[player.cur] || 0;
    var need = w.mag - mag;
    var take = Math.min(need, res);
    player.mags[player.cur] = mag + take;
    player.res[player.cur] = res - take;
    updateAmmoHud();
  }

  /* ==================================================================
     ÇARPIŞMA
  ================================================================== */
  function pushOutAABB(pos, radius, c) {
    var nx = clamp(pos.x, c.minX, c.maxX);
    var nz = clamp(pos.z, c.minZ, c.maxZ);
    var dx = pos.x - nx, dz = pos.z - nz;
    var d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) return;
    var d = Math.sqrt(d2);
    if (d < 0.0001) {
      var l = Math.abs(pos.x - c.minX), r = Math.abs(c.maxX - pos.x);
      var t = Math.abs(pos.z - c.minZ), b = Math.abs(c.maxZ - pos.z);
      var m = Math.min(l, r, t, b);
      if (m === l) pos.x = c.minX - radius;
      else if (m === r) pos.x = c.maxX + radius;
      else if (m === t) pos.z = c.minZ - radius;
      else pos.z = c.maxZ + radius;
    } else {
      var push = (radius - d) / d;
      pos.x += dx * push; pos.z += dz * push;
    }
  }
  function pushOutOBB(pos, radius, c) {
    var cs = Math.cos(-c.rot), sn = Math.sin(-c.rot);
    var dx = pos.x - c.cx, dz = pos.z - c.cz;
    // yerel koordinat
    var lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
    var nx = clamp(lx, -c.hw, c.hw), nz = clamp(lz, -c.hd, c.hd);
    var ox = lx - nx, oz = lz - nz;
    var d2 = ox * ox + oz * oz;
    if (d2 >= radius * radius) return;
    var d = Math.sqrt(d2);
    var px, pz;
    if (d < 0.0001) {
      // içeride: en yakın yüze it
      var toX = c.hw - Math.abs(lx), toZ = c.hd - Math.abs(lz);
      if (toX < toZ) { px = (lx < 0 ? -1 : 1) * (c.hw + radius); pz = lz; }
      else { px = lx; pz = (lz < 0 ? -1 : 1) * (c.hd + radius); }
    } else {
      var push = (radius - d) / d;
      px = lx + ox * push; pz = lz + oz * push;
    }
    // dünya koordinatına geri
    var cs2 = Math.cos(c.rot), sn2 = Math.sin(c.rot);
    pos.x = c.cx + px * cs2 - pz * sn2;
    pos.z = c.cz + px * sn2 + pz * cs2;
  }
  function collideCircle(pos, radius) {
    for (var i = 0; i < COL.length; i++) {
      var c = COL[i];
      if (c.rot !== undefined) pushOutOBB(pos, radius, c);
      else pushOutAABB(pos, radius, c);
    }
    pos.x = clamp(pos.x, -HALF + 0.7, HALF - 0.7);
    pos.z = clamp(pos.z, -HALF + 0.7, HALF - 0.7);
  }

  /* ==================================================================
     GÖRÜNÜM: 1. ŞAHIS SİLAH MODELLERİ
  ================================================================== */
  var viewScene = new T.Scene();
  var viewCam = new T.PerspectiveCamera(58, 1, 0.01, 12);
  viewScene.add(viewCam);
  var vHemi = new T.HemisphereLight(0xcfe0f5, 0x4a4038, 1.05);
  viewScene.add(vHemi);
  var vSun = new T.DirectionalLight(0xfff0d8, 1.5);
  vSun.position.set(-2, 3, 2);
  viewScene.add(vSun);
  var vHold = new T.Group();
  viewCam.add(vHold);

  var gunMat = {
    metal: new T.MeshStandardMaterial({ color: 0x2e3338, roughness: 0.42, metalness: 0.85 }),
    metalLight: new T.MeshStandardMaterial({ color: 0x545c64, roughness: 0.35, metalness: 0.9 }),
    polymer: new T.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.72, metalness: 0.15 }),
    wood: new T.MeshStandardMaterial({ color: 0x7a4a26, roughness: 0.68, metalness: 0.05 }),
    woodDark: new T.MeshStandardMaterial({ color: 0x5d3618, roughness: 0.72 }),
    steel: new T.MeshStandardMaterial({ color: 0xb9c2cb, roughness: 0.22, metalness: 0.95 }),
    skin: new T.MeshStandardMaterial({ color: 0xc98d63, roughness: 0.85 }),
    glove: new T.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.82, metalness: 0.05 }),
    glovePalm: new T.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.9 }),
    glovePad: new T.MeshStandardMaterial({ color: 0x15181c, roughness: 0.75 }),
    sleeve: new T.MeshStandardMaterial({ color: 0x3c4a3a, roughness: 0.92 }),
    sleeve2: new T.MeshStandardMaterial({ color: 0x40465a, roughness: 0.92 }),
    sleeve3: new T.MeshStandardMaterial({ color: 0x4a3b2a, roughness: 0.92 }),
    watch: new T.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.35, metalness: 0.7 })
  };

  // eldivenli el: avuç + 4 parmak + başparmak + bileklik + saat
  function glovedHand(side) {
    var h = new T.Group();
    var sg = side === -1 ? -1 : 1;
    var palm = gbox(0.115, 0.15, 0.15, gunMat.glove, 0, 0, 0);
    h.add(palm);
    // parmaklar (kavrama pozisyonunda bükülü)
    for (var i = 0; i < 4; i++) {
      var f = gbox(0.026, 0.085, 0.05, gunMat.glovePalm, -0.042 + i * 0.028, 0.055, -0.062);
      f.rotation.x = -0.75;
      h.add(f);
      var k2 = gbox(0.024, 0.055, 0.045, gunMat.glovePad, -0.042 + i * 0.028, 0.03, -0.1);
      k2.rotation.x = -1.15;
      h.add(k2);
    }
    // başparmak
    var th = gbox(0.035, 0.11, 0.05, gunMat.glovePalm, sg * -0.06, 0.03, 0.01);
    th.rotation.z = sg * 0.5; th.rotation.x = -0.35;
    h.add(th);
    // bilek manşeti + saat
    var cuff = gbox(0.125, 0.07, 0.14, gunMat.glovePad, 0, -0.1, 0.02);
    h.add(cuff);
    var strap = gbox(0.135, 0.035, 0.148, gunMat.watch, 0, -0.135, 0.02);
    h.add(strap);
    var face = gbox(0.05, 0.012, 0.05, new T.MeshStandardMaterial({ color: 0x9fe8c4, emissive: 0x2f8f66, emissiveIntensity: 0.6, roughness: 0.4 }), sg * 0.055, -0.116, 0.02);
    h.add(face);
    return h;
  }
  function forearm(sleeveMat, len, rotX) {
    var m = gbox(0.15, 0.15, len, sleeveMat, 0, -0.02, len / 2);
    if (rotX) m.rotation.x = rotX;
    return m;
  }
  function gbox(w, h, d, mat, x, y, z, rx, ry, rz) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz;
    return m;
  }
  function gcyl(r1, r2, h, mat, x, y, z, rx, rz, seg) {
    var m = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg || 10), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx; if (rz) m.rotation.z = rz;
    return m;
  }

  var VM = {};   // viewmodel groups

  function buildKnifeVM() {
    var g = new T.Group();
    // --- bıçak (kama + testere sırtı + kabza)
    var blade = gbox(0.028, 0.135, 0.56, gunMat.steel, 0, 0.055, -0.34);
    var tip = gbox(0.028, 0.075, 0.14, gunMat.steel, 0, 0.115, -0.66);
    var spine = gbox(0.03, 0.028, 0.54, gunMat.metalLight, 0, 0.125, -0.35);
    var edge = gbox(0.006, 0.028, 0.54, new T.MeshStandardMaterial({ color: 0xe8eef5, roughness: 0.08, metalness: 1 }), 0, -0.018, -0.35);
    var guard = gbox(0.085, 0.03, 0.06, gunMat.metalLight, 0, -0.01, -0.03);
    var handle = gbox(0.05, 0.1, 0.24, gunMat.glovePad, 0, -0.005, 0.14);
    var pommel = gbox(0.058, 0.085, 0.045, gunMat.metalLight, 0, -0.005, 0.28);
    g.add(blade, tip, spine, edge, guard, handle, pommel);
    // --- eldivenli el (kabzayı kavrar)
    var hand = glovedHand(1);
    hand.position.set(0, 0, 0.12);
    hand.rotation.set(0.05, 0, 0.06);
    g.add(hand);
    // --- kol (bilekten kameraya doğru)
    var arm = forearm(gunMat.sleeve, 0.42);
    arm.position.set(-0.01, -0.12, 0.22);
    arm.rotation.x = 0.16;
    g.add(arm);
    // --- ikinci el (destek) — hafif altta
    var hand2 = glovedHand(-1);
    hand2.position.set(0.02, -0.13, 0.2);
    hand2.rotation.set(0.5, 0, -0.2);
    hand2.scale.setScalar(0.85);
    g.add(hand2);
    var arm2 = forearm(gunMat.sleeve, 0.36);
    arm2.position.set(0.03, -0.3, 0.3);
    arm2.rotation.x = 0.5;
    arm2.scale.set(0.9, 0.9, 1);
    g.add(arm2);
    // asıl görünür konum: sağ-alt, bıçak yukarı bakar
    g.position.set(0.3, -0.33, -0.62);
    g.rotation.set(0.22, 0.45, 0.12);
    g.scale.setScalar(1.05);
    return g;
  }

  function buildPistolVM() {
    var g = new T.Group();
    var slide = gbox(0.075, 0.11, 0.44, gunMat.metal, 0, 0.03, -0.14);
    var barrel = gcyl(0.028, 0.028, 0.1, gunMat.metalLight, 0, 0.03, -0.36, Math.PI / 2);
    var frame = gbox(0.07, 0.07, 0.36, gunMat.polymer, 0, -0.045, -0.12);
    var grip = gbox(0.072, 0.22, 0.13, gunMat.polymer, 0, -0.14, 0.05, 0.28);
    var mag = gbox(0.06, 0.05, 0.1, gunMat.metal, 0, -0.25, 0.09, 0.28);
    var trigger = gbox(0.05, 0.06, 0.03, gunMat.metalLight, 0, -0.06, -0.03);
    var guard = gbox(0.055, 0.02, 0.11, gunMat.polymer, 0, -0.1, -0.04);
    var rear = gbox(0.03, 0.03, 0.03, gunMat.metalLight, 0, 0.1, -0.02);
    var front = gbox(0.012, 0.028, 0.02, gunMat.metalLight, 0, 0.1, -0.33);
    g.add(slide, barrel, frame, grip, mag, trigger, guard, rear, front);
    // --- eldivenli eller (iki el kavrar)
    var h1 = glovedHand(1);
    h1.position.set(0.005, -0.13, 0.055);
    h1.rotation.set(0.3, 0, 0.05);
    h1.scale.setScalar(0.95);
    var a1 = forearm(gunMat.sleeve2, 0.34);
    a1.position.set(0.02, -0.3, 0.14);
    a1.rotation.x = 0.28;
    var h2 = glovedHand(-1);
    h2.position.set(-0.055, -0.15, 0.06);
    h2.rotation.set(0.34, 0, 0.25);
    h2.scale.setScalar(0.9);
    var a2 = forearm(gunMat.sleeve2, 0.3);
    a2.position.set(-0.07, -0.32, 0.15);
    a2.rotation.x = 0.3;
    g.add(h1, a1, h2, a2);
    g.position.set(0.165, -0.225, -0.68);
    g.rotation.set(0.02, 0.1, 0);
    return g;
  }

  function buildM4VM() {
    var g = new T.Group();
    g.add(gbox(0.07, 0.11, 0.34, gunMat.metal, 0, 0.02, -0.06));            // gövde
    g.add(gbox(0.075, 0.09, 0.36, gunMat.polymer, 0, 0.02, -0.36));          // el kundağı
    g.add(gbox(0.03, 0.03, 0.3, gunMat.metalLight, 0, -0.03, -0.34));        // alt ray
    var barrel = gcyl(0.017, 0.017, 0.34, gunMat.metal, 0, 0.03, -0.66, Math.PI / 2);
    g.add(barrel);
    g.add(gcyl(0.03, 0.03, 0.09, gunMat.metal, 0, 0.03, -0.82, Math.PI / 2));
    var carry = gbox(0.05, 0.05, 0.42, gunMat.metal, 0, 0.1, -0.1);
    g.add(carry);
    var rear = gbox(0.05, 0.06, 0.08, gunMat.metal, 0, 0.11, 0.06);
    g.add(rear);
    var fs = gbox(0.02, 0.09, 0.03, gunMat.metal, 0, 0.1, -0.6);
    g.add(fs);
    var mag = gbox(0.06, 0.22, 0.1, gunMat.metal, 0, -0.15, -0.08, -0.1);
    g.add(mag);
    var grip = gbox(0.07, 0.17, 0.1, gunMat.polymer, 0, -0.13, 0.16, 0.36);
    g.add(grip);
    var stock = gbox(0.06, 0.11, 0.3, gunMat.polymer, 0, 0.0, 0.34);
    g.add(stock);
    var stockPipe = gcyl(0.026, 0.026, 0.16, gunMat.metal, 0, 0.03, 0.24, Math.PI / 2);
    g.add(stockPipe);
    // --- eldivenli eller: tetik eli + ön kundak eli
    var h1 = glovedHand(1);
    h1.position.set(0.005, -0.135, 0.17);
    h1.rotation.set(0.38, 0, 0.04);
    h1.scale.setScalar(0.95);
    var a1 = forearm(gunMat.sleeve, 0.32);
    a1.position.set(0.02, -0.3, 0.28);
    a1.rotation.x = 0.34;
    var h2 = glovedHand(-1);
    h2.position.set(-0.005, -0.09, -0.4);
    h2.rotation.set(0.15, 0, -0.55);
    h2.scale.setScalar(0.92);
    var a2 = forearm(gunMat.sleeve, 0.34);
    a2.position.set(-0.07, -0.2, -0.55);
    a2.rotation.set(0.12, 0.2, 0.12);
    g.add(h1, a1, h2, a2);
    g.position.set(0.17, -0.215, -0.8);
    g.rotation.set(0.01, 0.06, 0);
    return g;
  }

  function buildAKVM() {
    var g = new T.Group();
    g.add(gbox(0.07, 0.115, 0.4, gunMat.metal, 0, 0.02, -0.06));            // gövde
    g.add(gbox(0.078, 0.08, 0.3, gunMat.wood, 0, 0.02, -0.38));              // ahşap kundak
    var barrel = gcyl(0.017, 0.017, 0.36, gunMat.metal, 0, 0.035, -0.68, Math.PI / 2);
    g.add(barrel);
    g.add(gbox(0.04, 0.05, 0.2, gunMat.metalLight, 0, 0.09, -0.34));         // gaz borusu
    var mag = gbox(0.062, 0.26, 0.11, gunMat.metal, 0, -0.16, -0.1, -0.42);
    g.add(mag);
    var magBase = gbox(0.062, 0.06, 0.12, gunMat.metal, 0, -0.28, -0.16, -0.42);
    g.add(magBase);
    var grip = gbox(0.07, 0.18, 0.1, gunMat.wood, 0, -0.14, 0.16, 0.38);
    g.add(grip);
    var stock = gbox(0.055, 0.13, 0.34, gunMat.wood, 0, 0.0, 0.36);
    g.add(stock);
    var stockEnd = gbox(0.06, 0.17, 0.05, gunMat.woodDark, 0, 0.0, 0.52);
    g.add(stockEnd);
    var fs = gbox(0.022, 0.1, 0.025, gunMat.metal, 0, 0.1, -0.6);
    g.add(fs);
    var rear = gbox(0.05, 0.05, 0.06, gunMat.metal, 0, 0.11, 0.02);
    g.add(rear);
    // --- eldivenli eller
    var h1 = glovedHand(1);
    h1.position.set(0.005, -0.14, 0.17);
    h1.rotation.set(0.4, 0, 0.04);
    h1.scale.setScalar(0.95);
    var a1 = forearm(gunMat.sleeve3, 0.32);
    a1.position.set(0.02, -0.31, 0.28);
    a1.rotation.x = 0.36;
    var h2 = glovedHand(-1);
    h2.position.set(-0.005, -0.075, -0.4);
    h2.rotation.set(0.12, 0, -0.6);
    h2.scale.setScalar(0.92);
    var a2 = forearm(gunMat.sleeve3, 0.34);
    a2.position.set(-0.07, -0.19, -0.55);
    a2.rotation.set(0.1, 0.22, 0.12);
    g.add(h1, a1, h2, a2);
    g.position.set(0.17, -0.215, -0.8);
    g.rotation.set(0.01, 0.05, 0);
    return g;
  }

  function buildMuzzleFlash(parent, z) {
    var geo = new T.PlaneGeometry(0.3, 0.3);
    var mat = new T.MeshBasicMaterial({
      color: 0xffd27a, transparent: true, opacity: 0, blending: T.AdditiveBlending,
      depthWrite: false, side: T.DoubleSide
    });
    var m = new T.Mesh(geo, mat);
    m.position.set(0, 0.03, z);
    parent.add(m);
    return m;
  }

  var vmList = {};
  function initViewModels() {
    vmList.knife = buildKnifeVM();
    vmList.pistol = buildPistolVM();
    vmList.m4a4 = buildM4VM();
    vmList.ak47 = buildAKVM();
    ['pistol', 'm4a4', 'ak47'].forEach(function (k) {
      vmList[k].userData.flash = buildMuzzleFlash(vmList[k], k === 'pistol' ? -0.42 : -0.9);
    });
    for (var k in vmList) { vmList[k].visible = false; vHold.add(vmList[k]); }
    vmList.knife.visible = true;
    vHold.userData.baseY = 0;
  }
  initViewModels();

  function flashView(kind) {
    var g = vmList[kind];
    if (!g || !g.userData.flash) return;
    g.userData.flash.material.opacity = 1;
    g.userData.flash.rotation.z = Math.random() * 6.28;
    g.userData.flash.scale.setScalar(rand(1.3, 0.75));
  }
