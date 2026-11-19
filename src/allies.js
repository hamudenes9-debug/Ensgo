  /* ==================================================================
     DOST BOTLAR — yanımızda savaşan 2 mahalle koruyucusu
     (düşman AI'ından bağımsız, kendi davranış ağacı)
  ================================================================== */
  var allies = [];
  var ALLY_NAMES = ['Kemal Dayı', 'Şahin', 'Yıldız', 'Deli Murat', 'Zeynel', 'Nazmi', 'Kadir'];
  var ALLY_DEFS = {
    guard: { name: 'MAHALLE BEKÇİSİ', hp: 165, speed: 4.7, weapon: 'm4a4', dmg: 15, rate: 0.24, color: 0x2f4a7a },
    shooter: { name: 'KESKİN NİŞANCI', hp: 145, speed: 4.5, weapon: 'ak47', dmg: 21, rate: 0.36, color: 0x2f6b4a }
  };

  function Ally(kind, idx) {
    this.kind = kind;
    var def = ALLY_DEFS[kind];
    this.def = def;
    this.maxHp = def.hp; this.hp = def.hp;
    this.speed = def.speed;
    this.radius = 0.42;
    this.pos = V3(player.pos.x + (idx === 0 ? -2.2 : 2.2), 0, player.pos.z + 2.5);
    this.vel = V3(0, 0, 0);
    this.yaw = player.yaw;
    this.walkPhase = Math.random() * 6.28;
    this.fireCd = rand(0.5, 0);
    this.target = null;
    this.think = 0;
    this.dead = false;
    this.deadT = 0;
    this.hitFlash = 0;
    this.reviveT = 0;
    this.name = pick(ALLY_NAMES);
    this.slot = idx;
    this.formT = 0.4;

    // görünüm: takım rengi yelek + şapka, rastgele yüz
    var app = {
      skin: pick(SKINS), shirt: def.color, pants: 0x232a33, shoes: 0x14161a,
      hair: pick(HAIRS), scale: rand(1.03, 0.96), build: 'normal',
      vest: true, hoodie: false, beard: Math.random() < 0.4, mustache: Math.random() < 0.3,
      shades: Math.random() < 0.3, mask: false, hat: 'cap', hatColor: 0x1c1f24,
      weapon: def.weapon
    };
    this.app = app;
    var av = buildAvatar(app);
    this.av = av;
    this.root = new T.Group();
    this.root.add(av.root);
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
    this.root.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
    scene.add(this.root);

    // dost işareti: baş üstü yeşil elmas + isim etiketi
    var marker = new T.Mesh(new T.OctahedronGeometry(0.16, 0),
      new T.MeshBasicMaterial({ color: 0x6ef2b0, transparent: true, opacity: 0.95 }));
    marker.position.y = 2.28;
    this.root.add(marker);
    this.marker = marker;
    var ring = new T.Mesh(new T.RingGeometry(0.16, 0.24, 18),
      new T.MeshBasicMaterial({ color: 0x6ef2b0, transparent: true, opacity: 0.35, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.root.add(ring);
    this.ring = ring;
  }

  Ally.prototype.muzzlePos = function () {
    var v = V3(0.28, 1.2, -0.5);
    v.applyAxisAngle(V3(0, 1, 0), this.yaw);
    return v.add(this.pos);
  };

  // dost botun en yakın düşmanı bul (görüş hattı + mesafe)
  Ally.prototype.findTarget = function () {
    var best = null, bestD = 30;
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b.dead || b.spawnT < 0.5) continue;
      var d = Math.hypot(b.pos.x - this.pos.x, b.pos.z - this.pos.z);
      if (d >= bestD) continue;
      if (losBlocked(this.pos.x, this.pos.z, b.pos.x, b.pos.z)) continue;
      if (Math.random() < 0.5 && this.target && this.target !== b) {
        // hedef değiştirmeyi yavaşlat
        var curD = Math.hypot(this.target.pos.x - this.pos.x, this.target.pos.z - this.pos.z);
        if (curD < d * 1.35) continue;
      }
      bestD = d; best = b;
    }
    return best;
  };

  Ally.prototype.update = function (dt) {
    var av = this.av;
    // ---- ölü: 8 sn sonra sağlıkla geri döner
    if (this.dead) {
      this.deadT += dt;
      var t = Math.min(1, this.deadT / 0.5);
      this.root.rotation.z = (this.fallDir || 1) * t * 1.5;
      this.root.position.y = -t * 0.1;
      var fade = Math.max(0, 1 - Math.max(0, this.deadT - 2.4) / 1.2);
      var self = this;
      this.root.traverse(function (o) {
        if (!o.isMesh || o === self.marker || o === self.ring) return;
        if (!o.material) return;
        if (!o.material.transparent) { o.material = o.material.clone(); o.material.transparent = true; }
        o.material.opacity = fade;
      });
      if (this.marker) this.marker.visible = this.deadT > 1.6;
      if (this.deadT > 8) this.respawn();
      return;
    }
    this.deadT = 0;

    // doğma efekti
    if (this.formT > 0) {
      this.formT -= dt;
      var k = 1 - Math.max(0, this.formT) / 0.4;
      this.root.scale.setScalar(0.4 + k * 0.6);
    } else this.root.scale.setScalar(1);

    // vurulma flash
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.hitFlash <= 0) {
        av.root.traverse(function (o) {
          if (o.isMesh && o.material && o.material.emissive) { o.material.emissive.setHex(0x000000); o.material.emissiveIntensity = 0; }
        });
      }
    }

    // ---- hedef seçimi
    this.think -= dt;
    if (this.think <= 0) {
      this.think = rand(0.45, 0.22);
      var t2 = this.findTarget();
      if (t2) this.target = t2;
      else if (this.target && (this.target.dead || Math.hypot(this.target.pos.x - this.pos.x, this.target.pos.z - this.pos.z) > 34)) this.target = null;
    }
    if (this.target && this.target.dead) this.target = null;

    var desired = V3(0, 0, 0);
    var px = player.pos.x, pz = player.pos.z;
    var pdx = px - this.pos.x, pdz = pz - this.pos.z;
    var pdist = Math.hypot(pdx, pdz);

    // ---- savaş / takip
    if (this.target) {
      var tx = this.target.pos.x - this.pos.x, tz = this.target.pos.z - this.pos.z;
      var td = Math.hypot(tx, tz) || 1;
      var range = 13;
      if (td > range) { desired.x += (tx / td) * this.speed; desired.z += (tz / td) * this.speed; }
      else if (td < range * 0.45) { desired.x -= (tx / td) * this.speed * 0.8; desired.z -= (tz / td) * this.speed * 0.8; }
      else { // yan kayma
        var side = this.slot === 0 ? 1 : -1;
        desired.x += (-tz / td) * this.speed * 0.55 * side;
        desired.z += (tx / td) * this.speed * 0.55 * side;
      }
      // düşman çok yaklaşırsa geri çekil
      if (td < 2.5) { desired.x -= (tx / td) * this.speed * 1.2; desired.z -= (tz / td) * this.speed * 1.2; }
    }

    // ---- oyuncudan çok uzaklaşma (takip)
    if (pdist > 12) {
      desired.x += (pdx / (pdist || 1)) * this.speed * 1.25;
      desired.z += (pdz / (pdist || 1)) * this.speed * 1.25;
    } else if (!this.target && pdist > 4.2) {
      desired.x += (pdx / (pdist || 1)) * this.speed * 0.8;
      desired.z += (pdz / (pdist || 1)) * this.speed * 0.8;
    } else if (!this.target && pdist < 2.6) {
      desired.x -= (pdx / (pdist || 1)) * this.speed * 0.5;
      desired.z -= (pdz / (pdist || 1)) * this.speed * 0.5;
    }

    // ---- birbirinden ayrış
    for (var i = 0; i < allies.length; i++) {
      var a = allies[i];
      if (a === this || a.dead) continue;
      var sx = this.pos.x - a.pos.x, sz = this.pos.z - a.pos.z;
      var sd = Math.hypot(sx, sz);
      if (sd < 1.6 && sd > 0.001) {
        desired.x += (sx / sd) * (1.6 - sd) * 3.4;
        desired.z += (sz / sd) * (1.6 - sd) * 3.4;
      }
    }
    // düşmanlarla çarpışma
    for (var j = 0; j < bots.length; j++) {
      var b = bots[j];
      if (b.dead) continue;
      var bx = this.pos.x - b.pos.x, bz = this.pos.z - b.pos.z;
      var bd = Math.hypot(bx, bz);
      if (bd < 1.2 && bd > 0.001) {
        desired.x += (bx / bd) * (1.2 - bd) * 4;
        desired.z += (bz / bd) * (1.2 - bd) * 4;
      }
    }

    this.vel.x = lerp(this.vel.x, desired.x, Math.min(1, dt * 9));
    this.vel.z = lerp(this.vel.z, desired.z, Math.min(1, dt * 9));
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    collideCircle(this.pos, this.radius);

    // ---- dönüş
    var face = this.yaw;
    if (this.target) face = Math.atan2(this.target.pos.x - this.pos.x, this.target.pos.z - this.pos.z);
    else if (Math.hypot(this.vel.x, this.vel.z) > 0.4) face = Math.atan2(this.vel.x, this.vel.z);
    var diff = ((face - this.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    this.yaw += diff * Math.min(1, dt * 8);
    this.root.position.set(this.pos.x, this.pos.y || 0, this.pos.z);
    this.root.rotation.y = this.yaw;

    // ---- animasyon
    var spd = Math.hypot(this.vel.x, this.vel.z);
    var cad = Math.min(spd / 3.4, 1.2);
    this.walkPhase += dt * (3 + cad * 7);
    var sw = Math.sin(this.walkPhase);
    av.legL.rotation.x = sw * 0.7 * cad;
    av.legR.rotation.x = -sw * 0.7 * cad;
    var aiming = !!this.target;
    if (aiming) {
      av.armR.rotation.x = -1.45;
      av.armL.rotation.x = -1.28;
      av.armL.rotation.y = 0.5;
    } else {
      av.armR.rotation.x = -sw * 0.5 * cad;
      av.armL.rotation.x = sw * 0.5 * cad;
      av.armL.rotation.y = 0;
    }
    av.root.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.03 * cad;

    // işaretçi animasyonu
    if (this.marker) {
      this.marker.rotation.y += dt * 2.2;
      this.marker.position.y = 2.24 + Math.sin(G.t * 2.6) * 0.06;
      this.marker.visible = !this.dead;
    }
    if (this.ring) {
      this.ring.rotation.z += dt * 0.8;
      this.ring.material.opacity = 0.22 + Math.sin(G.t * 2) * 0.08;
    }

    // ---- ATEŞ
    this.fireCd -= dt;
    if (this.target && !this.target.dead && G.state === 'playing') {
      var tdist = Math.hypot(this.target.pos.x - this.pos.x, this.target.pos.z - this.pos.z);
      if (this.fireCd <= 0 && this.formT <= 0) {
        this.fireCd = this.def.rate * rand(1.25, 0.85);
        this.shoot(this.target, tdist);
      }
    }
  };

  Ally.prototype.shoot = function (tgt, dist) {
    var mz = this.muzzlePos();
    var aim = V3(tgt.pos.x, 1.1 * tgt.app.scale, tgt.pos.z);
    // isabet şansı: mesafeyle düşer
    var hitChance = clamp(0.86 - dist * 0.022, 0.35, 0.9);
    var hit = Math.random() < hitChance;
    var end = hit ? aim : aim.clone().add(V3(rand(1.8, -1.8), rand(1.2, -1.2), rand(1.8, -1.8)));
    Effects.tracer(mz, end, 0x9ef7c6, 0.07);
    Effects.muzzleSmoke(mz, this.yaw);
    Audio2.enemyGun(WEAPONS[this.def.weapon].id, dist + 12);
    this.av.armR.rotation.x = -1.2;
    if (hit) {
      var dmg = this.def.dmg * rand(1.15, 0.85);
      var killed = tgt.damage(dmg, false, false, this.name);
      Effects.blood(end, 6);
      if (killed) {
        G.allKills++;
        addMoney(45);
        killFeed('<span style="color:#6ef2b0">' + this.name + '</span>', tgt.name, tgt.def.name);
      }
    }
  };

  Ally.prototype.takeDamage = function (dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    this.hitFlash = 0.1;
    this.av.root.traverse(function (o) {
      if (o.isMesh && o.material && o.material.emissive) {
        o.material.emissive = new T.Color(0xff3333);
        o.material.emissiveIntensity = 0.5;
      }
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deadT = 0;
      this.fallDir = Math.random() < 0.5 ? 1 : -1;
      killFeed('<span style="color:#ff8d9a">BOT</span>', this.name, 'DÜŞTÜ');
      hint(this.name + ' düştü — 8 sn sonra dönüyor', 2);
      Audio2.death();
    }
  };

  Ally.prototype.respawn = function () {
    this.dead = false;
    this.hp = this.maxHp;
    this.deadT = 0;
    this.formT = 0.4;
    this.root.rotation.z = 0;
    this.root.position.y = 0;
    this.root.traverse(function (o) {
      if (o.isMesh && o.material) {
        if (o.material.transparent) { o.material.opacity = 1; }
      }
    });
    if (this.marker) { this.marker.visible = true; this.marker.material.opacity = 0.95; }
    this.pos.set(player.pos.x + rand(3, -3), 0, player.pos.z + rand(3.5, 2));
    collideCircle(this.pos, this.radius);
    this.root.position.copy(this.pos);
    hint(this.name + ' geri döndü!', 1.6);
    Audio2.buy();
  };

  function spawnAllies() {
    clearAllies();
    allies.push(new Ally('guard', 0));
    allies.push(new Ally('shooter', 1));
  }
  function clearAllies() {
    for (var i = 0; i < allies.length; i++) scene.remove(allies[i].root);
    allies.length = 0;
  }
  function updateAllies(dt) {
    for (var i = 0; i < allies.length; i++) allies[i].update(dt);
  }
  // Dost botlar düşman ateşinden pay alır (yakındaki düşman nişanı onlara kayabilir)
  function alliesAbsorbFire() {
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b.dead) continue;
      for (var j = 0; j < allies.length; j++) {
        var a = allies[j];
        if (a.dead) continue;
        var d = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z);
        if (d < 16 && Math.random() < 0.22) {
          // düşman dost bota ateş ediyor
          var hit = Math.random() < 0.55;
          Effects.tracer(b.muzzlePos(), V3(a.pos.x + rand(0.6, -0.6), 1.15, a.pos.z + rand(0.6, -0.6)), 0xffc879, 0.05);
          if (hit) a.takeDamage(b.def.bdmg * rand(0.9, 0.5));
        }
      }
    }
  }

  /* ==================================================================
     GÜN SAATİ — her dalgada değişen zaman (şafak → gündüz → gün batımı → gece)
  ================================================================== */
  var TIMES = [
    { // 1 — ŞAFAK
      name: 'ŞAFAK', icon: '🌅', sub: 'SİS ÇÖKÜYOR',
      top: 0x1f2a4a, bot: 0xffb37a, fog: 0xc9a98f, fogNear: 12, fogFar: 62,
      sun: 0xff9a5a, sunI: 1.1, sunPos: [-46, 12, 34], hemiSky: 0xffc4a0, hemiGround: 0x4a3a33, hemiI: 0.55,
      ambient: 0x2a2f45, ambI: 0.35, lamps: 0.9, exposure: 0.95, shadow: 0.6
    },
    { // 2 — ÖĞLE
      name: 'ÖĞLE', icon: '☀️', sub: 'GÜNEŞ TEPEDE',
      top: 0x7fb2df, bot: 0xd8e8f4, fog: 0xbcd2e2, fogNear: 42, fogFar: 130,
      sun: 0xfff3d8, sunI: 2.05, sunPos: [26, 60, 22], hemiSky: 0xcfe4f8, hemiGround: 0x5b4a3a, hemiI: 1.1,
      ambient: 0x8fa7bd, ambI: 0.35, lamps: 0, exposure: 1.06, shadow: 1
    },
    { // 3 — GÜN BATIMI
      name: 'GÜN BATIMI', icon: '🌇', sub: 'ALTIN SAAT',
      top: 0x3a2a5a, bot: 0xff8a4a, fog: 0xe09a6a, fogNear: 16, fogFar: 82,
      sun: 0xff7a2a, sunI: 1.55, sunPos: [-58, 9, 14], hemiSky: 0xffb27a, hemiGround: 0x3a2a2a, hemiI: 0.62,
      ambient: 0x4a3550, ambI: 0.4, lamps: 0.75, exposure: 1.0, shadow: 0.7
    },
    { // 4 — GECE
      name: 'GECE', icon: '🌙', sub: 'LAMBA IŞIKLARI',
      top: 0x060a16, bot: 0x16213a, fog: 0x0c1424, fogNear: 14, fogFar: 74,
      sun: 0xa8c0ff, sunI: 0.42, sunPos: [-30, 44, -18], hemiSky: 0x22324f, hemiGround: 0x10141c, hemiI: 0.4,
      ambient: 0x1b2740, ambI: 0.5, lamps: 1.6, exposure: 1.12, shadow: 0.4
    }
  ];

  var skyDome = null;
  var lampLights = [];
  var lampMats = [];
  var TIME_CUR = null;

  function setTimeOfDay(idx, instant) {
    var t = TIMES[idx % TIMES.length];
    TIME_CUR = t;
    G.timeIdx = idx % TIMES.length;
    G.timeName = t.name;
    var target = {
      top: new T.Color(t.top), bot: new T.Color(t.bot),
      fog: new T.Color(t.fog), sun: new T.Color(t.sun),
      hemiSky: new T.Color(t.hemiSky), hemiGround: new T.Color(t.hemiGround)
    };
    // animasyonlu geçiş
    var from = {
      top: skyDome ? skyDome.material.uniforms.top.value.clone() : target.top.clone(),
      bot: skyDome ? skyDome.material.uniforms.bottom.value.clone() : target.bot.clone(),
      fog: scene.fog.color.clone(), sun: sun.color.clone(),
      hemiSky: hemi.color.clone(), hemiGround: hemi.groundColor.clone()
    };
    var fromVals = {
      sunI: sun.intensity, hemiI: hemi.intensity, fogNear: scene.fog.near, fogFar: scene.fog.far,
      ambient: ambient ? ambient.intensity : 0, lamps: lampLights.length ? lampLights[0].intensity : 0,
      exposure: renderer ? renderer.toneMappingExposure : 1
    };
    var dur = instant ? 0.001 : 2.4;
    G.timeMix = { from: from, fromVals: fromVals, target: target, t: t, k: 0, dur: dur, active: true };
    // ışık yönü
    sun.position.set(t.sunPos[0], t.sunPos[1], t.sunPos[2]);
    sun.castShadow = true;
    sun.shadow.mapSize.set(t.shadow > 0.5 ? 2048 : 1024, t.shadow > 0.5 ? 2048 : 1024);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  }

  function updateTimeOfDay(dt) {
    var m = G.timeMix;
    if (!m || !m.active) { updateLampHalos(clamp((TIME_CUR ? TIME_CUR.lamps : 0) / 1.6, 0, 1)); return; }
    m.k = Math.min(1, m.k + dt / m.dur);
    // yumuşak geçiş eğrisi
    var e = m.k < 0.5 ? 2 * m.k * m.k : 1 - Math.pow(-2 * m.k + 2, 2) / 2;
    var tg = m.target, fr = m.from, fv = m.fromVals, T2 = m.t;
    if (skyDome) {
      skyDome.material.uniforms.top.value.copy(fr.top).lerp(tg.top, e);
      skyDome.material.uniforms.bottom.value.copy(fr.bot).lerp(tg.bot, e);
    }
    scene.fog.color.copy(fr.fog).lerp(tg.fog, e);
    scene.fog.near = lerp(fv.fogNear, T2.fogNear, e);
    scene.fog.far = lerp(fv.fogFar, T2.fogFar, e);
    sun.color.copy(fr.sun).lerp(tg.sun, e);
    sun.intensity = lerp(fv.sunI, T2.sunI, e);
    hemi.color.copy(fr.hemiSky).lerp(tg.hemiSky, e);
    hemi.groundColor.copy(fr.hemiGround).lerp(tg.hemiGround, e);
    hemi.intensity = lerp(fv.hemiI, T2.hemiI, e);
    if (ambient) ambient.intensity = lerp(fv.ambient, T2.ambI, e);
    if (renderer) renderer.toneMappingExposure = lerp(fv.exposure, T2.exposure, e);
    // sokak lambaları
    for (var i = 0; i < lampLights.length; i++) {
      lampLights[i].intensity = lerp(fv.lamps, T2.lamps, e) * 1.6;
    }
    for (var j = 0; j < LAMP_MATS.length; j++) {
      LAMP_MATS[j].emissiveIntensity = lerp(0.3 + fv.lamps, 0.3 + T2.lamps * 1.6, e);
    }
    updateLampHalos(lerp(clamp(fv.lamps / 1.6, 0, 1), clamp(T2.lamps / 1.6, 0, 1), e));
    if (m.k >= 1) m.active = false;
  }

  function initDayNight() {
    buildSky();
    setupLamps();
  }

  function buildSky() {
    var geo = new T.SphereGeometry(150, 24, 16);
    var mat = new T.ShaderMaterial({
      uniforms: {
        top: { value: new T.Color(0x7fb2df) },
        bottom: { value: new T.Color(0xd8e8f4) }
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 top; uniform vec3 bottom; varying vec3 vP;',
        'void main(){',
        '  float h = normalize(vP).y;',
        '  float k = smoothstep(-0.15, 0.65, h);',
        '  gl_FragColor = vec4(mix(bottom, top, k), 1.0);',
        '}'
      ].join('\n'),
      side: T.BackSide,
      depthWrite: false,
      fog: false
    });
    skyDome = new T.Mesh(geo, mat);
    skyDome.frustumCulled = false;
    scene.add(skyDome);
    // yıldızlar (gece için)
    var starGeo = new T.BufferGeometry();
    var N = 420, pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var a = Math.random() * Math.PI * 2;
      var b = Math.acos(Math.random() * 0.95);
      var r = 138;
      pos[i * 3] = Math.sin(b) * Math.cos(a) * r;
      pos[i * 3 + 1] = Math.cos(b) * r;
      pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    }
    starGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
    var starMat = new T.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0, depthWrite: false, fog: false });
    var stars = new T.Points(starGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);
    G.stars = stars;
  }

  function updateStars(dt) {
    if (!G.stars) return;
    var night = (G.timeIdx === 3) ? 1 : (G.timeIdx === 0 ? 0.3 : 0);
    var op = G.stars.material.opacity;
    G.stars.material.opacity = lerp(op, night * 0.9, Math.min(1, dt * 1.4));
    G.stars.rotation.y += dt * 0.004;
  }

  // sokak lambaları: nokta ışıkları (gece yanar) — harita kurulumundan sonra
  function setupLamps() {
    for (var i = 0; i < LAMP_SPOTS.length; i++) {
      var p = LAMP_SPOTS[i];
      var pl = new T.PointLight(0xffb457, 0, 26, 2);
      pl.position.set(p.x, 5.7, p.z);
      scene.add(pl);
      lampLights.push(pl);
    }
  }
  function updateLampHalos(k) {
    for (var i = 0; i < LAMP_HALOS.length; i++) {
      LAMP_HALOS[i].material.opacity = 0.05 + 0.5 * k;
      var sc = 1 + Math.sin(G.t * 3 + i) * 0.04;
      LAMP_HALOS[i].scale.setScalar(sc);
    }
  }
