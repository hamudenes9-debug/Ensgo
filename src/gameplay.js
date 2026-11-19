  /* ==================================================================
     HUD YARDIMCILARI
  ================================================================== */
  var HUD = {
    hud: $('hud'), hpBar: $('hpBar'), armorBar: $('armorBar'), money: $('money'),
    ammo: $('ammo'), ammoNow: $('ammoNow'), ammoRes: $('ammoRes'), weaponName: $('weaponName'),
    waveNo: $('waveNo'), waveInfo: $('waveInfo'), killfeed: $('killfeed'),
    cross: $('crosshair'), hit: $('hitmarker'), hurt: $('hurt'), banner: $('banner'),
    hint: $('hint'), hitdir: $('hitdir'), dmgLayer: $('dmgLayer'), zoneWarn: $('zoneWarn'),
    radar: $('radar'), allyBox: $('allyBox'), timeIcon: $('timeIcon'),
    timeName: $('timeName'), timeSub: $('timeSub')
  };
  var radarCtx = HUD.radar ? HUD.radar.getContext('2d') : null;

  var hintT = 0;
  function hint(txt, dur) {
    if (!HUD.hint) return;
    HUD.hint.innerHTML = txt;
    HUD.hint.classList.add('on');
    hintT = dur || 2;
  }
  function banner(big, sub, dur) {
    if (!HUD.banner) return;
    HUD.banner.querySelector('.big').textContent = big;
    HUD.banner.querySelector('.sub').textContent = sub || '';
    HUD.banner.classList.add('on');
    G.bannerT = dur || 2.2;
  }
  var feedItems = [];
  function killFeed(killer, victim, type) {
    var d = document.createElement('div');
    d.className = 'kf';
    d.innerHTML = '<span class="k">' + killer + '</span> ⚔ <span class="v">' + victim + '</span><span class="mt">' + type + '</span>';
    HUD.killfeed.appendChild(d);
    feedItems.push({ el: d, t: 4.2 });
    while (feedItems.length > 5) { var f = feedItems.shift(); f.el.remove(); }
  }
  function addMoney(n) {
    G.money = Math.max(0, G.money + n);
    if (n > 0) G.totalEarned = (G.totalEarned || 0) + n;
    if (n > 0) {
      var gain = HUD.money.querySelector('.gain');
      if (gain) { gain.textContent = '+' + n; gain.classList.add('on'); setTimeout(function () { gain.classList.remove('on'); }, 500); }
    }
    updateMoneyHud();
  }
  function updateMoneyHud() {
    var t = Math.floor(G.money);
    HUD.money.childNodes[0].nodeValue = t.toLocaleString('tr-TR');
    var sm = $('shopMoney'); if (sm) sm.textContent = '₺' + t.toLocaleString('tr-TR');
  }
  function updateAmmoHud() {
    var w = wdef();
    var mag = player.mags[player.cur] || 0, res = player.res[player.cur] || 0;
    HUD.weaponName.textContent = w.name;
    if (w.melee) {
      HUD.ammoNow.textContent = '∞';
      HUD.ammoRes.textContent = 'BIÇAK';
      HUD.ammo.classList.remove('low');
    } else {
      HUD.ammoNow.textContent = mag;
      HUD.ammoRes.textContent = '/ ' + res;
      HUD.ammo.classList.toggle('low', mag <= Math.ceil(w.mag * 0.25));
    }
  }
  var hitTimer = 0;
  function showHitmarker(kill, head) {
    if (MOBILE.enabled && MOBILE.buzz) MOBILE.buzz(kill ? 45 : 18);
    HUD.hit.classList.add('on');
    HUD.hit.classList.toggle('kill', !!kill);
    hitTimer = kill ? 0.22 : 0.1;
    Audio2.hit();
  }
  var hitDirTimer = 0;
  function showHitDir(fromPos) {
    if (!HUD.hitdir) return;
    var ang = Math.atan2(fromPos.x - player.pos.x, fromPos.z - player.pos.z) - player.yaw;
    var el = HUD.hitdir.querySelector('.a');
    if (!el) { el = document.createElement('div'); el.className = 'a'; HUD.hitdir.appendChild(el); }
    el.style.transform = 'rotate(' + (-ang + Math.PI) + 'rad) translateY(-110px)';
    el.style.opacity = '0.95';
    hitDirTimer = 0.55;
  }
  function damageNumber(amount, head) {
    if (!HUD.dmgLayer) return;
    var v = V3(player.pos.x, 1.25, player.pos.z);
    v.project(camera);
    var x = (v.x * 0.5 + 0.5) * window.innerWidth + rand(16, -16);
    var y = (-v.y * 0.5 + 0.5) * window.innerHeight + rand(24, -10);
    var d = document.createElement('div');
    d.className = 'dnum' + (head ? ' head' : '');
    d.textContent = Math.round(amount);
    d.style.left = x + 'px'; d.style.top = y + 'px';
    HUD.dmgLayer.appendChild(d);
    setTimeout(function () { d.remove(); }, 820);
  }

  /* ==================================================================
     ATEŞ / HASAR
  ================================================================== */
  var RAY = new T.Raycaster();
  var _fwd = V3(0, 0, 0);

  function raySphere(ro, rd, c, r) {
    var ox = ro.x - c.x, oy = ro.y - c.y, oz = ro.z - c.z;
    var b = ox * rd.x + oy * rd.y + oz * rd.z;
    var cc = ox * ox + oy * oy + oz * oz - r * r;
    var disc = b * b - cc;
    if (disc < 0) return -1;
    var t = -b - Math.sqrt(disc);
    if (t < 0.05) t = -b + Math.sqrt(disc);
    return t > 0.05 ? t : -1;
  }

  // Dokunmatikte hafif nişan yardımı: görüş konisi içindeki en yakın düşmana yön çekme
  function aimAssist(dir, org) {
    if (!MOBILE.enabled) return false;
    var best = null, bestDot = 0.90;   // ~25 derecelik koni
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b.dead || b.spawnT < 0.5) continue;
      var d = Math.hypot(b.pos.x - org.x, b.pos.z - org.z);
      if (d > 45) continue;
      if (losBlocked(org.x, org.z, b.pos.x, b.pos.z)) continue;
      var tgt = V3(b.pos.x, 1.15 * b.app.scale, b.pos.z).sub(org);
      var l = tgt.length();
      if (l < 0.5) continue;
      tgt.divideScalar(l);
      var dot = tgt.dot(dir);
      if (dot > bestDot) { bestDot = dot; best = tgt; }
    }
    if (!best) return false;
    var strength = 0.55 + clamp((bestDot - 0.90) / 0.10, 0, 1) * 0.4;
    dir.lerp(best, strength).normalize();
    return true;
  }

  function shootHitscan(spread, dmg, headMul) {
    var dir = V3(0, 0, -1).applyQuaternion(camera.quaternion);
    dir.x += rand(spread, -spread);
    dir.y += rand(spread, -spread);
    dir.z += rand(spread, -spread) * 0.3;
    dir.normalize();
    var org = camera.position.clone();
    aimAssist(dir, org);
    var best = null, bestT = 999, bestHead = false;

    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b.dead || b.spawnT < 0.5) continue;
      // duvar arkasında mı
      if (losBlocked(org.x, org.z, b.pos.x, b.pos.z)) continue;
      var s = b.app.scale;
      var hb = MOBILE.enabled ? 1.35 : 1;   // dokunmatikte daha cömert isabet alanı
      var th = raySphere(org, dir, V3(b.pos.x, 1.62 * s, b.pos.z), 0.27 * s * hb);
      var tc = raySphere(org, dir, V3(b.pos.x, 1.12 * s, b.pos.z), 0.4 * s * hb);
      var tl = raySphere(org, dir, V3(b.pos.x, 0.6 * s, b.pos.z), 0.37 * s * hb);
      var bt = 999, head = false;
      if (th > 0 && th < bt) { bt = th; head = true; }
      if (tc > 0 && tc < bt) { bt = tc; head = false; }
      if (tl > 0 && tl < bt) { bt = tl; head = false; }
      if (bt < bestT) { bestT = bt; best = b; bestHead = head; }
    }

    var end;
    if (best) {
      end = org.clone().addScaledVector(dir, bestT);
      var dist = bestT;
      var falloff = clamp(1 - Math.max(0, dist - 16) / 60, 0.62, 1);
      var dealt = (bestHead ? dmg * headMul : dmg) * falloff * (G.dmgMul || 1);
      var killed = best.damage(dealt, bestHead, true);
      damageNumber(dealt, bestHead);
      showHitmarker(killed, bestHead);
      Effects.sparks(end, bestHead ? 6 : 3, 0xb01a1a);
      if (bestHead) { HUD.cross.classList.add('head'); setTimeout(function () { HUD.cross.classList.remove('head'); }, 220); }
    } else {
      end = org.clone().addScaledVector(dir, 120);
    }
    return { end: end, hit: !!best, kill: best ? best.dead : false };
  }

  function meleeAttack() {
    var w = WEAPONS.knife;
    player.fireCd = w.rate;
    player.meleeT = 0.34;
    Audio2.knife();
    var dir = V3(0, 0, -1).applyQuaternion(camera.quaternion);
    var org = camera.position.clone();
    var hitAny = false;
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b.dead || b.spawnT < 0.5) continue;
      var c = V3(b.pos.x, 1.1, b.pos.z);
      var to = c.clone().sub(org);
      var dist = to.length();
      if (dist > w.range + 0.6) continue;
      to.normalize();
      if (to.dot(dir) < 0.55) continue;
      if (losBlocked(org.x, org.z, b.pos.x, b.pos.z)) continue;
      hitAny = true;
      var back = to.dot(V3(Math.sin(b.yaw), 0, Math.cos(b.yaw))) < -0.35;
      var dmg = w.dmg * (back ? 2.0 : 1) * (G.dmgMul || 1);
      var killed = b.damage(dmg, false, true);
      damageNumber(dmg, false);
      showHitmarker(killed, false);
      Effects.blood(b.chestPos(), 10);
      if (back) hint('SIRTINDAN HANÇER!', 1);
    }
    if (!hitAny) Effects.slash(player.pos, player.yaw);
    return hitAny;
  }

  function fireWeapon() {
    var w = wdef();
    if (player.switchT > 0 || player.reloadT > 0) return;
    if (w.melee) { meleeAttack(); return; }
    var mag = player.mags[player.cur] || 0;
    if (mag <= 0) {
      Audio2.empty();
      player.fireCd = 0.3;
      if ((player.res[player.cur] || 0) > 0) tryReload();
      else hint('CEPHANE YOK — MAĞAZA: <kbd>B</kbd>', 1.4);
      return;
    }
    player.mags[player.cur] = mag - 1;
    player.fireCd = w.rate;
    var ads = ADS();
    var spread = w.spread * (ads ? 0.42 : 1) * (player.crouch ? 0.75 : 1) * (1 + player.bloom * 0.5);
    spread += Math.hypot(player.vel.x, player.vel.z) * 0.0016;
    var res = shootHitscan(spread, w.dmg, 2.6);
    // tepme
    player.recoil += w.recoil * (ads ? 0.7 : 1) * 0.016;
    player.recoilYaw += rand(0.006, -0.006) * w.recoil;
    player.bloom = Math.min(1.4, player.bloom + 0.32);
    Audio2.gun(w.sound);
    flashView(player.cur);
    // iz
    var mz = camera.position.clone();
    var right = V3(1, 0, 0).applyQuaternion(camera.quaternion);
    var up = V3(0, 1, 0).applyQuaternion(camera.quaternion);
    mz.addScaledVector(right, 0.16).addScaledVector(up, -0.12).addScaledVector(V3(0, 0, -1).applyQuaternion(camera.quaternion), 0.7);
    Effects.tracer(mz, res.end, w.tracer, 0.9);
    if (!res.hit) Effects.sparks(res.end, 4, 0xffcc88);
    updateAmmoHud();
    G.shotT = 0.12;
  }

  function ADS() {
    var on = mouse.rdown || (MOBILE.enabled && MOBILE.ads);
    return on && !wdef().melee && G.state === 'playing';
  }

  /* ==================================================================
     OYUNCU GÜNCELLEME
  ================================================================== */
  function updatePlayer(dt) {
    var p = player;
    var w = wdef();

    // ---- hareket girdisi
    var f = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
    var s = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
    // mobil joystick
    var joyMag = 0;
    if (MOBILE.enabled) {
      var mx = MOBILE.move.x, my = MOBILE.move.y;
      if (Math.abs(mx) > 0.08 || Math.abs(my) > 0.08) {
        f = clamp(my, -1, 1); s = clamp(mx, -1, 1);
        joyMag = Math.min(1, Math.hypot(mx, my));
      }
    }
    var len = Math.hypot(f, s);
    if (len > 1) { f /= len; s /= len; }
    p.crouch = !!keys['control'] && p.onGround;
    var wantSprint = !!(keys['shift'] || joyMag > 0.93) && f > 0.35 && !ADS() && !p.crouch && p.fireCd <= 0;
    if (wantSprint) p.sprintT = Math.min(1, p.sprintT + dt * 4); else p.sprintT = Math.max(0, p.sprintT - dt * 6);
    p.sprint = p.sprintT > 0.4;

    var baseSpeed = 5.3;
    if (p.cur === 'knife') baseSpeed = 5.9;
    if (p.crouch) baseSpeed = 2.5;
    if (ADS()) baseSpeed = 2.9;
    baseSpeed = lerp(baseSpeed, 7.4, p.sprintT) * (G.speedMul || 1);

    var sinY = Math.sin(p.yaw), cosY = Math.cos(p.yaw);
    var wx = (sinY * -f + cosY * s);
    var wz = (cosY * -f - sinY * s);
    var target = V3(wx * baseSpeed, 0, wz * baseSpeed);
    var accel = p.onGround ? 14 : 4;
    p.vel.x = lerp(p.vel.x, target.x, Math.min(1, dt * accel));
    p.vel.z = lerp(p.vel.z, target.z, Math.min(1, dt * accel));

    p.pos.x += p.vel.x * dt;
    p.pos.z += p.vel.z * dt;
    collideCircle(p.pos, p.radius);

    // zıplama (görsel)
    if (p.wantJump && p.onGround) { p.vy = 7.0; p.onGround = false; p.wantJump = false; }
    p.wantJump = false;
    p.jumpY = p.jumpY === undefined ? 0 : p.jumpY;
    if (!p.onGround) {
      p.vy -= GRAV * dt;
      p.jumpY += p.vy * dt;
      if (p.jumpY <= 0) { p.jumpY = 0; p.vy = 0; p.onGround = true; Audio2.step(); }
    }

    // ---- göz yüksekliği yumuşat
    var targetEye = p.crouch ? 1.12 : EYE;
    p.eyeCur = lerp(p.eyeCur, targetEye, Math.min(1, dt * 12));

    // ---- yürüme salınımı
    var spd = Math.hypot(p.vel.x, p.vel.z);
    p.bob += spd * dt * 2.2;
    var bobAmp = clamp(spd / 7, 0, 1) * (p.crouch ? 0.4 : 1);
    p.bobY = Math.sin(p.bob * 5.2) * 0.028 * bobAmp;
    p.bobX = Math.cos(p.bob * 2.6) * 0.02 * bobAmp;

    // adım sesi
    if (p.onGround && spd > 1.2) {
      p.stepT -= dt * spd;
      if (p.stepT <= 0) { p.stepT = 2.6; Audio2.step(); }
    }

    // ---- can yenilenmesi (7 sn hasar almazsan)
    if (p.lastHitT === undefined) p.lastHitT = -99;
    if (G.t - p.lastHitT > 7 && p.hp > 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + dt * 5.5);
    }

    // ---- ateş
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.switchT = Math.max(0, p.switchT - dt);
    p.bloom = Math.max(0, p.bloom - dt * 2.6);
    if ((mouse.down || (MOBILE.enabled && MOBILE.firing)) && (w.auto || p.wantFire || (MOBILE.enabled && MOBILE.firing))) {
      if (p.fireCd <= 0) fireWeapon();
    }
    p.wantFire = false;

    // ---- şarjör
    if (p.reloadT > 0) {
      p.reloadT -= dt;
      if (p.reloadT <= 0) { p.reloadT = 0; finishReload(); }
    }

    // ---- tepme geri dönüşü
    p.recoil = Math.max(0, p.recoil - dt * 2.4);
    p.recoilYaw *= Math.pow(0.0015, dt);

    // ---- melee animasyon zamanı
    if (p.meleeT > 0) p.meleeT = Math.max(0, p.meleeT - dt);

    // ---- kamera
    var adsT = ADS() ? 1 : 0;
    p.adsAmt = lerp(p.adsAmt === undefined ? 0 : p.adsAmt, adsT, Math.min(1, dt * 12));
    // KAMERA AÇISI: göz hizası + hafif öne kayma → silah/eller kadrajda daha dengeli,
    // zemin daha az yer kaplar, nişan çizgisi ufka daha yakın
    var camFwd = 0.12 + p.adsAmt * 0.06;
    camera.position.set(
      p.pos.x + p.bobX + Math.sin(p.yaw) * -camFwd,
      p.eyeCur + p.jumpY + p.bobY + 0.035,
      p.pos.z + Math.cos(p.yaw) * -camFwd
    );
    camera.rotation.set(
      p.pitch + p.recoil * 0.35 + 0.018,
      p.yaw + p.recoilYaw,
      Math.sin(p.bob * 2.6) * 0.005 * bobAmp
    );
    // KAMERA: geniş görüş açısı (büyük haritada çevre kontrolü) + nişanda daralma
    var baseFov = camera.aspect < 0.85 ? 88 : 80;
    var targetFov = baseFov - p.adsAmt * (baseFov - baseFov / w.zoom) - p.sprintT * 4;
    camera.fov = lerp(camera.fov, targetFov, Math.min(1, dt * 10));
    camera.updateProjectionMatrix();
    viewCam.fov = 58 - p.adsAmt * 6;
    viewCam.updateProjectionMatrix();

    // ---- viewmodel animasyonu
    var vm = vmList[p.cur];
    for (var k in vmList) vmList[k].visible = (k === p.cur);
    if (vm) {
      var bx = vm.userData.bx !== undefined ? vm.userData.bx : (vm.userData.bx = vm.position.x);
      var by = vm.userData.by !== undefined ? vm.userData.by : (vm.userData.by = vm.position.y);
      var bz = vm.userData.bz !== undefined ? vm.userData.bz : (vm.userData.bz = vm.position.z);
      var adsK = p.adsAmt;
      // mobilde geniş görüş açısı nedeniyle silahı biraz büyüt
      vHold.scale.setScalar(MOBILE.enabled ? 1.18 : 1);
      var aimX = lerp(bx, 0.0, adsK), aimY = lerp(by, -0.10, adsK), aimZ = lerp(bz, bz + 0.06, adsK);
      // sallanma
      aimX += Math.sin(p.bob * 2.6) * 0.014 * bobAmp * (1 - adsK * 0.6);
      aimY += Math.sin(p.bob * 5.2) * 0.012 * bobAmp * (1 - adsK * 0.6);
      // tepme
      aimZ += p.recoil * 0.5;
      aimY += p.recoil * 0.12;
      // silah değiştirme
      if (p.switchT > 0) aimY -= p.switchT * 0.6;
      // koşma
      aimY -= p.sprintT * 0.06;
      aimX += p.sprintT * 0.04;
      // bıçak savurma
      if (p.meleeT > 0) {
        var mt = 1 - p.meleeT / 0.34;
        aimZ -= Math.sin(mt * Math.PI) * 0.22;
        aimX -= Math.sin(mt * Math.PI) * 0.16;
      }
      vm.position.x = lerp(vm.position.x, aimX, Math.min(1, dt * 18));
      vm.position.y = lerp(vm.position.y, aimY, Math.min(1, dt * 18));
      vm.position.z = lerp(vm.position.z, aimZ, Math.min(1, dt * 18));
      vm.rotation.z = lerp(vm.rotation.z, p.sprintT * 0.16 + p.switchT * 0.5, Math.min(1, dt * 10));
      // namlu ateşi
      var fl = vm.userData.flash;
      if (fl) {
        fl.material.opacity = Math.max(0, fl.material.opacity - dt * 18);
        if (fl.material.opacity > 0) fl.scale.multiplyScalar(1 + dt * 0.2);
      }
    }

    // ---- hızlanınca crosshair aç
    var spreadPx = 7 + (1 - (p.adsAmt || 0)) * 6 + Math.hypot(p.vel.x, p.vel.z) * 1.4 + p.bloom * 9;
    if (MOBILE.enabled) spreadPx *= 0.75;
    HUD.cross.style.setProperty('--sp', spreadPx.toFixed(1) + 'px');
  }
  function adsAmtOr(p) { return p.adsAmt === undefined ? 0 : p.adsAmt; }

  function hurtPlayer(dmg, fromPos) {
    if (G.state !== 'playing' || player.dead) return;
    var d = dmg;
    if (player.armor > 0) {
      var absorbed = Math.min(player.armor, d * 0.55);
      player.armor -= absorbed;
      d -= absorbed * 0.75;
    }
    player.hp -= d;
    player.lastHitT = G.t;
    G.hitFlash = 0.5;
    if (MOBILE.enabled && MOBILE.buzz) MOBILE.buzz(70);
    G.shake = Math.min(0.5, G.shake + 0.18);
    Audio2.hurt();
    if (fromPos) showHitDir(fromPos);
    updateHealthHud();
    if (player.hp <= 0) { player.hp = 0; playerDie(); }
  }
  function updateHealthHud() {
    var hp = clamp(player.hp, 0, player.maxHp);
    HUD.hpBar.querySelector('b').style.transform = 'scaleX(' + (hp / player.maxHp) + ')';
    HUD.hpBar.querySelector('span').textContent = Math.ceil(hp);
    HUD.hpBar.classList.toggle('low', hp <= 30);
    var ar = clamp(player.armor, 0, 100);
    HUD.armorBar.querySelector('b').style.transform = 'scaleX(' + (ar / 100) + ')';
    HUD.armorBar.querySelector('span').textContent = Math.ceil(ar);
  }

  function playerDie() {
    player.dead = true; G.dead = true;
    G.state = 'over';
    Audio2.death();
    exitLock();
    HUD.hud.classList.remove('on');
    $('over').classList.remove('hidden');
    var best = Math.max(G.best, G.wave);
    G.best = best;
    try { localStorage.setItem('mahalle_best', String(best)); } catch (e) {}
    $('deadTitle').textContent = 'MAHALLE DÜŞTÜ';
    $('overSub').textContent = 'Dalga ' + G.wave + '\'de düştün. Botlar sokağı ele geçirdi — intikam soğuk yenir.';
    var st = [
      ['DALGA', G.wave], ['ÖLDÜRME', G.kills], ['HEADSHOT', G.headshots],
      ['KAZANILAN', '₺' + Math.floor(G.totalEarned || 0)]
    ];
    $('overStats').innerHTML = st.map(function (s) {
      return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>';
    }).join('');
  }

  /* ==================================================================
     DALGA YÖNETİMİ
  ================================================================== */
  function spawnBot(type, wave) {
    // oyuncudan uzak, kenardaki açık bir noktadan doğ
    var pool = (typeof OPEN_SPOTS !== 'undefined' && OPEN_SPOTS.length) ? OPEN_SPOTS : SPAWNS;
    var best = null, bestScore = -1;
    var scored = [];
    for (var i = 0; i < Math.min(26, pool.length); i++) {
      var s = pool[(Math.random() * pool.length) | 0];
      if (!s) continue;
      var d = Math.hypot(s.x - player.pos.x, s.z - player.pos.z);
      if (d < 12) continue;
      scored.push({ s: s, d: d + rand(10, 0) });
    }
    scored.sort(function (a, b) { return b.d - a.d; });
    if (scored.length) best = scored[Math.random() < 0.6 ? 0 : Math.min(scored.length - 1, 1 + (Math.random() * 2 | 0))].s;
    if (!best) {
      for (var k = 0; k < pool.length; k++) {
        var cand = pool[k];
        if (!cand) continue;
        var dd = Math.hypot(cand.x - player.pos.x, cand.z - player.pos.z);
        if (!best || dd > bestScore) { bestScore = dd; best = cand; }
      }
    }
    if (!best) best = { x: 0, z: -30 };
    var bx = best.x, bz = best.z;
    var bot = new Bot(type, bx, bz, wave);
    bots.push(bot);
    Effects.sparks(V3(bx, 0.4, bz), 6, 0xff8844);
    return bot;
  }

  function waveCount(w) {
    return Math.min(30, 4 + Math.round(w * 2.1));
  }

  function startWave(n) {
    if (G.state !== 'playing' && G.state !== 'shop') return;
    if (G.dead) return;
    G.state = 'playing';
    closeShop();
    G.wave = n;
    G.waveKills = 0;
    G.waveActive = true;
    G.spawnTimer = 0.6;
    G.spawnQueue = [];
        var total = waveCount(n);
    // ---- DÜŞMAN KOMPOZİSYONU
    // 1-2. dalga: devlet kontrol noktası askerleri · 3-5: karışık (asker+zombi)
    // 6+: zombi sürüsü · her 5. dalga BÜYÜK DALGA (bonus + daha çok düşman)
    G.bigWave = (n % 5 === 0);
    if (G.bigWave) total = Math.round(total * 1.45) + 4;
    var isSoldierWave = n <= 2;
    var mixedWave = n === 3 || n === 4 || n === 5;
    for (var i = 0; i < total; i++) {
      var roll = Math.random();
      var type;
      if (isSoldierWave) {
        type = (n >= 2 && roll > 0.72) ? 'sergeant' : 'soldier';
      } else if (mixedWave) {
        // askerler dağılmaya başlar, zombiler sokaklara iner
        var zShare = n === 3 ? 0.55 : (n === 4 ? 0.72 : 0.85);
        if (roll < zShare) {
          if (roll < 0.16) type = 'runner';
          else if (n >= 5 && roll > 0.42 && roll < 0.54) type = 'brute';
          else type = 'walker';
        } else {
          type = roll > (zShare + (1 - zShare) * 0.65) ? 'sergeant' : 'soldier';
        }
      } else {
        // zombi sürüsü
        if (roll < 0.5) type = 'walker';
        else if (roll < 0.78) type = 'runner';
        else if (roll < 0.9) type = 'brute';
        else type = (n % 3 === 0 && roll > 0.96) ? 'sergeant' : 'soldier';
      }
      G.spawnQueue.push(type);
    }
    G.enemiesLeft = G.spawnQueue.length;
    HUD.waveNo.textContent = 'DALGA ' + n;
    // her dalgada zaman değişir: şafak → öğle → gün batımı → gece
    setTimeOfDay(n - 1, false);
    updateWaveHud();
    if (G.bigWave) {
      banner('BÜYÜK DALGA ' + n, '🔥 ' + G.spawnQueue.length + ' DÜŞMAN · BİRLİKTE VURUN', 3.2);
      Audio2.siren();
      hint('BÜYÜK DALGA — MEVZİYİ TUT, DOSTLAR YANINDA!', 3.6);
    } else {
      banner('DALGA ' + n, (TIMES[(n - 1) % TIMES.length].icon + ' ' + TIMES[(n - 1) % TIMES.length].name + ' · ' + TIMES[(n - 1) % TIMES.length].sub), 2.4);
      Audio2.wave();
      var tag = isSoldierWave ? 'Devlet kontrol noktası askerleri geliyor' :
        (mixedWave ? 'Askerler ve zombiler karışık geliyor' : 'Zombi sürüsü mahalleye giriyor');
      hint(tag + ' — tel örgü hattını tut!', 3.2);
    }
    G.state = 'playing';
    requestLock();
  }

  function queueSpawnLogic(dt) {
    if (!G.waveActive) return;
    if (G.spawnQueue.length) {
      G.spawnTimer -= dt;
      if (G.spawnTimer <= 0) {
        var alive = bots.filter(function (b) { return !b.dead; }).length;
        if (alive < 9) {
          var t = G.spawnQueue.shift();
          spawnBot(t, G.wave);
          G.spawnTimer = rand(1.5, 0.7);
        } else G.spawnTimer = 0.6;
        updateWaveHud();
      }
    } else {
      var any = false;
      for (var i = 0; i < bots.length; i++) if (!bots[i].dead) { any = true; break; }
      if (!any) waveComplete();
    }
  }
  function updateWaveHud() {
    var alive = 0;
    for (var i = 0; i < bots.length; i++) if (!bots[i].dead) alive++;
    var left = alive + G.spawnQueue.length;
    G.enemiesLeft = left;
    HUD.waveInfo.innerHTML = 'Kalan düşman: <b>' + left + '</b>';
  }

  function waveComplete() {
    G.waveActive = false;
    var bonus = 220 + G.wave * 85;
    bonus += (G.wave >= 3 ? 120 : 0);   // zombi dalgaları daha cömert
    if (G.bigWave) bonus = Math.round(bonus * 1.6);
    G.bigWave = false;
    addMoney(bonus);
    Audio2.clear();
    banner('DALGA TEMİZ', 'BONUS ₺' + bonus, 2.4);
    G.shopDelay = 1.1;   // oyun zamanıyla mağazaya geçiş
    hint('DALGA TEMİZ — MAĞAZA AÇILIYOR', 2.2);
  }

  /* ==================================================================
     MAĞAZA
  ================================================================== */
  var shopTab = 'weapons';
  var SHOP_ITEMS = {
    weapons: [
      { id: 'pistol', name: 'TABANCA', price: 300, desc: '12 mermi · hızlı · hafif tepme. Cebinde güven.', kind: 'weapon' },
      { id: 'm4a4', name: 'M4A4', price: 1850, desc: '30 mermi · isabetli · düşük tepme. Kontrollü oyuncuya.', kind: 'weapon' },
      { id: 'ak47', name: 'AK-47', price: 2750, desc: '30 mermi · yüksek hasar · sert tepme. Tek kurşun kafaya.', kind: 'weapon' }
    ],
    ammo: [
      { id: 'ammo_pistol', name: 'TABANCA CEPHANESİ', price: 120, desc: '+48 mermi (tabanca)', kind: 'ammo', weapon: 'pistol', amount: 48 },
      { id: 'ammo_m4a4', name: 'M4A4 CEPHANESİ', price: 320, desc: '+90 mermi (M4A4)', kind: 'ammo', weapon: 'm4a4', amount: 90 },
      { id: 'ammo_ak47', name: 'AK-47 CEPHANESİ', price: 380, desc: '+90 mermi (AK-47)', kind: 'ammo', weapon: 'ak47', amount: 90 },
      { id: 'ammo_all', name: 'TOPLU CEPHANE', price: 700, desc: 'Tüm silahlara +120 mermi', kind: 'ammo_all' }
    ],
    gear: [
      { id: 'armor', name: 'ÇELİK YELEK', price: 650, desc: '+100 zırh (hasarın %55\'ini emer)', kind: 'armor' },
      { id: 'medkit', name: 'SAĞLIK SETİ', price: 280, desc: '+50 sağlık', kind: 'health' },
      { id: 'speed', name: 'HAFİF AYAKKABI', price: 800, desc: 'Kalıcı +%12 hareket hızı', kind: 'speed' },
      { id: 'dmg', name: 'MATKAP NAMLU', price: 1100, desc: 'Kalıcı +%14 silah hasarı', kind: 'damage' },
      { id: 'maxhp', name: 'ZIRHLI PALTO', price: 950, desc: 'Kalıcı +25 maksimum sağlık', kind: 'maxhp' }
    ]
  };

  function buyItem(item) {
    if (item.kind === 'weapon') {
      if (player.owned[item.id]) {
        // zaten sahipsen tıklayınca kuşan
        if (player.cur !== item.id) {
          player.cur = item.id; player.switchT = 0.3; player.reloadT = 0;
          updateAmmoHud(); Audio2.reload(0.2); hint(item.name + ' KUŞANILDI', 1.2);
        }
        renderShop();
        return;
      }
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price);
      player.owned[item.id] = true;
      player.mags[item.id] = WEAPONS[item.id].mag;
      player.res[item.id] = WEAPONS[item.id].reserve;
      Audio2.buy();
      hint(item.name + ' SATIN ALINDI', 1.6);
      // satın alınan silahı hemen kuşan (bıçakla geziyorsan da)
      player.cur = item.id;
      player.switchT = 0; player.reloadT = 0;
      updateAmmoHud();
    } else if (item.kind === 'ammo') {
      if (!player.owned[item.weapon]) { hint('ÖNCE ' + WEAPONS[item.weapon].name + ' AL', 1.5); Audio2.deny(); return; }
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price);
      player.res[item.weapon] = (player.res[item.weapon] || 0) + item.amount;
      Audio2.buy();
      hint('CEPHANE EKLENDİ', 1.3);
      if (player.cur === item.weapon) updateAmmoHud();
    } else if (item.kind === 'ammo_all') {
      var any = false;
      ['pistol', 'm4a4', 'ak47'].forEach(function (k) { if (player.owned[k]) any = true; });
      if (!any) { hint('HİÇ SİLAHIN YOK', 1.4); Audio2.deny(); return; }
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price);
      ['pistol', 'm4a4', 'ak47'].forEach(function (k) { if (player.owned[k]) player.res[k] = (player.res[k] || 0) + 120; });
      Audio2.buy();
      hint('TÜM SİLAHLARA CEPHANE', 1.4);
    } else if (item.kind === 'armor') {
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price);
      player.armor = 100; Audio2.buy(); hint('ZIRH 100', 1.3);
    } else if (item.kind === 'health') {
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price);
      player.hp = Math.min(player.maxHp, player.hp + 50);
      Audio2.buy(); hint('+50 SAĞLIK', 1.3);
    } else if (item.kind === 'speed') {
      if (G.boughtSpeed) { hint('ZATEN ALINDI', 1.2); return; }
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price); G.boughtSpeed = true; G.speedMul = 1.12;
      Audio2.buy(); hint('%12 DAHA HIZLI', 1.5);
    } else if (item.kind === 'damage') {
      if (G.boughtDmg) { hint('ZATEN ALINDI', 1.2); return; }
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price); G.boughtDmg = true; G.dmgMul = 1.14;
      Audio2.buy(); hint('%14 DAHA FAZLA HASAR', 1.5);
    } else if (item.kind === 'maxhp') {
      if (G.boughtHp) { hint('ZATEN ALINDI', 1.2); return; }
      if (G.money < item.price) { denyBuy(); return; }
      addMoney(-item.price); G.boughtHp = true;
      player.maxHp = 125; player.hp = Math.min(player.maxHp, player.hp + 25);
      Audio2.buy(); hint('MAKS SAĞLIK 125', 1.5);
    }
    updateHealthHud(); updateAmmoHud(); renderShop();
  }
  function denyBuy() { Audio2.deny(); hint('PARA YETMİYOR', 1.2); }

  function buyState(item) {
    if (item.kind === 'weapon') return player.owned[item.id] ? 'owned' : '';
    if (item.kind === 'speed') return G.boughtSpeed ? 'owned' : '';
    if (item.kind === 'damage') return G.boughtDmg ? 'owned' : '';
    if (item.kind === 'maxhp') return G.boughtHp ? 'owned' : '';
    if (item.kind === 'ammo' && !player.owned[item.weapon]) return 'locked';
    return '';
  }

  function item_is_equippable(it) {
    return it.kind === 'weapon' && player.cur !== it.id;
  }

  function renderShop() {
    var list = SHOP_ITEMS[shopTab];
    var html = '';
    list.forEach(function (it, i) {
      var st = buyState(it);
      var canEquip = st === 'owned' && item_is_equippable(it);
      var label = canEquip ? 'KUŞAN' : st === 'owned' ? 'ALINDI' : st === 'locked' ? 'KİLİTLİ' : 'SATIN AL';
      var dis = (st === 'owned' && !canEquip) || st === 'locked' || (st !== 'owned' && G.money < it.price);
      html += '<div class="item">' +
        '<div class="nm">' + it.name + '</div>' +
        '<div class="ds">' + it.desc + '</div>' +
        '<div class="row"><div class="pr">₺' + it.price + '</div>' +
        '<button class="buy ' + st + '" data-i="' + i + '" ' + (dis ? 'disabled' : '') + '>' + label + '</button></div>' +
        '</div>';
    });
    $('shopItems').innerHTML = html;
    $('shopMoney').textContent = '₺' + Math.floor(G.money).toLocaleString('tr-TR');
    $('shopWave').textContent = G.wave;
  }

  function openShop() {
    if (G.waveActive || G.state !== 'playing' || G.dead) return;
    G.state = 'shop';
    G.shopTimer = 26;
    exitLock();
    $('shop').classList.remove('hidden');
    HUD.zoneWarn.style.opacity = 1;
    renderShop();
    updateMoneyHud();
    Audio2.wave();
  }
  function closeShop() {
    $('shop').classList.add('hidden');
    HUD.zoneWarn.style.opacity = 0;
    G.shopTimer = 0;
    if (G.state === 'shop') G.state = 'playing';
  }
  function toggleShop() {
    if (G.state === 'shop') { closeShop(); requestLock(); }
    else if (G.state === 'playing' && !G.waveActive) openShop();
    else if (G.state === 'playing' && G.waveActive) hint('MAĞAZA DALGA ARALARINDA AÇILIR', 1.6);
  }

  /* ==================================================================
     OYUN AKIŞI
  ================================================================== */
  function requestLock() {
    if (G.state !== 'playing' || IS_TOUCH) return;
    try {
      var pr = canvas.requestPointerLock && canvas.requestPointerLock();
      if (pr && pr.catch) pr.catch(function () {});
    } catch (e) {}
  }
  function exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
    G.pointerLocked = false;
    G.dragLook = false;
    mouse.down = false; mouse.rdown = false;
  }

  function resetPlayer() {
    player.pos.set(0, 0, 16);
    player.vel.set(0, 0, 0);
    player.yaw = 0.0; player.pitch = -0.03;
    player.hp = 100; player.maxHp = 100; player.armor = 0;
    player.cur = 'pistol';
    player.owned = { knife: true, pistol: true, m4a4: false, ak47: false };
    player.mags = { knife: 0, pistol: WEAPONS.pistol.mag, m4a4: 0, ak47: 0 };
    player.res = { knife: 0, pistol: 36, m4a4: 0, ak47: 0 };
    player.reloadT = 0; player.fireCd = 0; player.switchT = 0;
    player.recoil = 0; player.recoilYaw = 0; player.bloom = 0; player.jumpY = 0; player.vy = 0;
    player.onGround = true; player.dead = false; player.adsAmt = 0; player.sprintT = 0;
    player.lastHitT = -99;
    player.meleeT = 0; player.eyeCur = EYE; player.bob = 0; player.bobX = 0; player.bobY = 0;
    G.money = 500; G.wave = 0; G.kills = 0; G.headshots = 0; G.waveActive = false;
    G.spawnQueue = []; G.enemiesLeft = 0; G.totalEarned = 0;
    G.bannerT = 0; G.shotT = 0; G.shopDelay = 0;
    G.boughtSpeed = false; G.boughtDmg = false; G.boughtHp = false;
    G.allKills = 0; G.timeIdx = 0; G.timeName = 'ŞAFAK';
    G.speedMul = 1; G.dmgMul = 1; G.dead = false; G.shake = 0; G.hitFlash = 0;
    updateHealthHud(); updateAmmoHud(); updateMoneyHud();
  }

  function clearBots() {
    for (var i = 0; i < bots.length; i++) {
      scene.remove(bots[i].root);
    }
    bots.length = 0;
  }
  function removeDeadBots() {
    for (var i = bots.length - 1; i >= 0; i--) {
      if (bots[i].remove) { scene.remove(bots[i].root); bots.splice(i, 1); }
    }
  }

  function startGame() {
    Audio2.init(); Audio2.resume();
    clearBots(); clearPickups();
    resetPlayer();
    G.state = 'playing';
    G.started = true;
    G.suppressPause = true;
    $('start').classList.add('hidden');
    $('over').classList.add('hidden');
    $('shop').classList.add('hidden');
    $('pause').classList.add('hidden');
    HUD.hud.classList.add('on');
    spawnAllies();
    // başlangıç: bıçak + tabanca, 500 TL
    requestLock();
    setTimeout(function () { G.suppressPause = false; }, 300);
    startWave(1);
    updateMoneyHud();
  }

  function pauseGame() {
    if (G.state !== 'playing' && G.state !== 'shop') return;
    G.prevState = G.state;
    G.state = 'paused';
    exitLock();
    $('pause').classList.remove('hidden');
  }
  function resumeGame() {
    $('pause').classList.add('hidden');
    $('shop').classList.toggle('hidden', G.prevState !== 'shop');
    G.state = G.prevState || 'playing';
    requestLock();
  }
  function toMenu() {
    exitLock();
    clearBots(); clearPickups(); clearAllies();
    G.state = 'menu';
    HUD.hud.classList.remove('on');
    $('pause').classList.add('hidden');
    $('shop').classList.add('hidden');
    $('over').classList.add('hidden');
    $('start').classList.remove('hidden');
    updateBest();
    camera.position.set(0, EYE, 16);
    camera.rotation.set(0, 0, 0);
  }
  function updateBest() {
    try {
      var b = localStorage.getItem('mahalle_best');
      if (b) { G.best = parseInt(b, 10) || 0; $('bestLine').innerHTML = 'En iyi: <b>Dalga ' + G.best + '</b>'; }
    } catch (e) {}
  }

  /* ==================================================================
     ANA DÖNGÜ
  ================================================================== */
  var lastT = performance.now() / 1000;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(performance.now()); }, 16); };

  function simulate(dt) {
    if (G.state === 'playing' || G.state === 'paused') {
      if (G.state === 'playing') updatePlayer(dt);
      var bdt = G.state === 'playing' ? dt : 0;
      for (var i = 0; i < bots.length; i++) {
        if (bots[i].dead) bots[i].update(dt);
        else if (bdt > 0) bots[i].update(bdt);
      }
      removeDeadBots();
      if (G.state === 'playing') {
        queueSpawnLogic(dt);
        updatePickups(dt);
        updateAllies(dt);
        InteractionTick(dt);
      }
    }
    Effects.update(dt);
    updateTimeOfDay(dt);
    updateStars(dt);
    updateHudTimers(dt);
  }

  function renderAll() {
    if (!HAS_GL || !renderer) return;
    if (G.state === 'menu') {
      var a = G.t * 0.06;
      camera.position.set(Math.sin(a) * 20, 9 + Math.sin(a * 2) * 1.2, Math.cos(a) * 20 + 4);
      camera.lookAt(0, 3, 0);
      renderer.render(scene, camera);
      return;
    }
    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(viewScene, viewCam);
    renderer.autoClear = true;
  }

  function loop() {
    raf(loop);
    var t = performance.now() / 1000;
    var dt = Math.min(0.05, t - lastT);
    lastT = t;
    G.t += dt;
    if (G.state !== 'menu') simulate(dt);
    else Effects.update(dt);
    mobileSync();
    updateAllyHud(dt);
    updateTimeHud();
    drawRadar();
    renderAll();
  }

  function InteractionTick(dt) {
    // dalga sonrası mağazaya geçiş
    if (G.shopDelay > 0) {
      G.shopDelay -= dt;
      if (G.shopDelay <= 0 && G.state === 'playing' && !G.waveActive && !G.dead) openShop();
    }
    // mağaza sayacı
    if (G.state === 'playing' && !G.waveActive && G.shopTimer > 0) {
      G.shopTimer -= dt;
      var st = $('shopTime');
      if (st) st.textContent = Math.max(0, Math.ceil(G.shopTimer));
    }
    // crosshair hit rengi
    // (hitmarker zamanlayıcıları updateHudTimers içinde)
  }

  function updateHudTimers(dt) {
    if (hitTimer > 0) { hitTimer -= dt; if (hitTimer <= 0) HUD.hit.classList.remove('on'); }
    if (hintT > 0) { hintT -= dt; if (hintT <= 0) HUD.hint.classList.remove('on'); }
    if (G.bannerT > 0) { G.bannerT -= dt; if (G.bannerT <= 0) HUD.banner.classList.remove('on'); }
    if (hitDirTimer > 0) {
      hitDirTimer -= dt;
      var el = HUD.hitdir.querySelector('.a');
      if (el) el.style.opacity = Math.max(0, hitDirTimer / 0.55 * 0.95);
    }
    if (G.hitFlash > 0) {
      G.hitFlash -= dt;
      HUD.hurt.style.opacity = Math.min(0.85, Math.max(0, G.hitFlash * 1.6));
    } else if (HUD.hurt.style.opacity !== '0') HUD.hurt.style.opacity = 0;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 1.6);
    for (var i = feedItems.length - 1; i >= 0; i--) {
      feedItems[i].t -= dt;
      if (feedItems[i].t <= 0) { feedItems[i].el.remove(); feedItems.splice(i, 1); }
    }
    // mağaza sayacı otomatik başlat
    if (G.state === 'shop' && G.shopTimer > 0) {
      G.shopTimer -= dt;
      var st = $('shopTime');
      if (st) st.textContent = Math.max(0, Math.ceil(G.shopTimer));
      if (G.shopTimer <= 0 && !G.waveActive) { startWave(G.wave + 1); }
    }
    // sağlık göstergesi
    if (G.state === 'playing') {
      var hp = clamp(player.hp, 0, player.maxHp);
      HUD.hpBar.querySelector('b').style.transform = 'scaleX(' + (hp / player.maxHp) + ')';
      HUD.hpBar.querySelector('span').textContent = Math.ceil(hp);
      HUD.hpBar.classList.toggle('low', hp <= 30);
      var ar = clamp(player.armor, 0, 100);
      HUD.armorBar.querySelector('b').style.transform = 'scaleX(' + (ar / 100) + ')';
      HUD.armorBar.querySelector('span').textContent = Math.ceil(ar);
    }
  }

  /* ==================================================================
     DOST BOT HUD'U
  ================================================================== */
  var allyHudT = 0;
  function updateAllyHud(dt) {
    if (!HUD.allyBox) return;
    allyHudT -= dt;
    if (allyHudT > 0) return;
    allyHudT = 0.18;
    var html = '';
    for (var i = 0; i < allies.length; i++) {
      var a = allies[i];
      var ratio = a.dead ? 0 : clamp(a.hp / a.maxHp, 0, 1);
      var rev = a.dead ? Math.max(0, Math.ceil(8 - a.deadT)) + 'sn' : Math.ceil(a.hp);
      html += '<div class="ally' + (a.dead ? ' dead' : '') + '">' +
        '<i class="dot"></i>' +
        '<span class="nm">' + a.name + '</span>' +
        '<span class="bar2"><b style="transform:scaleX(' + ratio + ')"></b></span>' +
        '<span class="rev">' + rev + '</span>' +
        '</div>';
    }
    HUD.allyBox.innerHTML = html;
  }
  function updateTimeHud() {
    if (G.lastTimeShown === G.timeIdx) return;
    G.lastTimeShown = G.timeIdx;
    var t = TIMES[G.timeIdx % TIMES.length];
    if (HUD.timeIcon) HUD.timeIcon.textContent = t.icon;
    if (HUD.timeName) HUD.timeName.textContent = t.name;
    if (HUD.timeSub) HUD.timeSub.textContent = t.sub;
  }

  /* ==================================================================
     RADAR
  ================================================================== */
  function drawRadar() {
    if (!radarCtx) return;
    var c = radarCtx, W = HUD.radar.width, H = HUD.radar.height;
    var cx = W / 2, cy = H / 2, R = W / 2 - 4;
    c.clearRect(0, 0, W, H);
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
    // arka plan
    var grd = c.createRadialGradient(cx, cy, 4, cx, cy, R);
    grd.addColorStop(0, 'rgba(20,40,50,.9)'); grd.addColorStop(1, 'rgba(8,14,18,.95)');
    c.fillStyle = grd; c.fillRect(0, 0, W, H);
    // halkalar
    c.strokeStyle = 'rgba(110,242,176,.12)'; c.lineWidth = 1;
    for (var ri = 1; ri <= 3; ri++) { c.beginPath(); c.arc(cx, cy, R * ri / 3, 0, 6.2832); c.stroke(); }
    c.beginPath(); c.moveTo(cx, 4); c.lineTo(cx, H - 4); c.stroke();
    c.beginPath(); c.moveTo(4, cy); c.lineTo(W - 4, cy); c.stroke();

    var scale = R / 38;      // 38 metre yarıçap
    var yaw = player.yaw;
    var cs = Math.cos(-yaw), sn = Math.sin(-yaw);
    function toRadar(wx, wz) {
      var dx = wx - player.pos.x, dz = wz - player.pos.z;
      // radar yukarısı = ileri (yaw yönü)
      var rx = dx * Math.cos(-yaw) - dz * Math.sin(-yaw);
      var rz = dx * Math.sin(-yaw) + dz * Math.cos(-yaw);
      return { x: cx + rx * scale, y: cy + rz * scale };
    }
    // tel örgü sınırı
    var e = toRadar(FENCE, 0);
    c.strokeStyle = 'rgba(255,138,61,.35)'; c.setLineDash([4, 4]);
    c.beginPath();
    var pts = [[-FENCE, -FENCE], [FENCE, -FENCE], [FENCE, FENCE], [-FENCE, FENCE], [-FENCE, -FENCE]];
    pts.forEach(function (p, i) {
      var q = toRadar(p[0], p[1]);
      if (i === 0) c.moveTo(q.x, q.y); else c.lineTo(q.x, q.y);
    });
    c.stroke(); c.setLineDash([]);
    // eşyalar
    for (var i = 0; i < pickups.length; i++) {
      var q = toRadar(pickups[i].pos.x, pickups[i].pos.z);
      if (Math.hypot(q.x - cx, q.y - cy) > R) continue;
      c.fillStyle = pickups[i].kind === 'health' ? '#6ef2b0' : '#ffd166';
      c.fillRect(q.x - 2, q.y - 2, 4, 4);
    }
    // botlar
    for (var bi = 0; bi < bots.length; bi++) {
      var b = bots[bi];
      if (b.dead) continue;
      var p = toRadar(b.pos.x, b.pos.z);
      var d = Math.hypot(p.x - cx, p.y - cy);
      var inRange = d < R;
      if (!inRange) continue;
      var seen = b.seenT > 0;
      if (b.isZombie) c.fillStyle = seen ? '#a6ff4d' : 'rgba(140,190,80,.55)';
      else c.fillStyle = seen ? '#ff4d5e' : 'rgba(255,120,80,.62)';
      var s = b.type === 'brute' ? 4.6 : (b.type === 'heavy' ? 4.2 : 3.2);
      c.beginPath(); c.arc(p.x, p.y, s, 0, 6.2832); c.fill();
      if (seen) {
        c.strokeStyle = 'rgba(255,77,94,.5)'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(p.x, p.y, s + 2.5, 0, 6.2832); c.stroke();
      }
    }
    // dost botlar (yeşil elmas)
    for (var ai = 0; ai < allies.length; ai++) {
      var al = allies[ai];
      var ap = toRadar(al.pos.x, al.pos.z);
      if (Math.hypot(ap.x - cx, ap.y - cy) > R) continue;
      c.save();
      c.translate(ap.x, ap.y); c.rotate(Math.PI / 4);
      c.fillStyle = al.dead ? 'rgba(255,77,94,.55)' : '#6ef2b0';
      c.fillRect(-2.6, -2.6, 5.2, 5.2);
      c.restore();
    }
    // oyuncu
    c.save();
    c.translate(cx, cy);
    c.fillStyle = '#6ef2b0';
    c.beginPath(); c.moveTo(0, -6); c.lineTo(4.6, 5); c.lineTo(0, 2.6); c.lineTo(-4.6, 5); c.closePath(); c.fill();
    // görüş konisi
    var fovg = c.createRadialGradient(0, 0, 2, 0, 0, 26);
    fovg.addColorStop(0, 'rgba(110,242,176,.20)'); fovg.addColorStop(1, 'rgba(110,242,176,0)');
    c.fillStyle = fovg;
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 26, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); c.closePath(); c.fill();
    c.restore();
    c.restore();
    // tarama çizgisi
    var sw = G.t * 1.6 % 6.2832;
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
    var lg = c.createLinearGradient(cx, cy, cx + Math.cos(sw) * R, cy + Math.sin(sw) * R);
    lg.addColorStop(0, 'rgba(110,242,176,0)'); lg.addColorStop(1, 'rgba(110,242,176,.22)');
    c.strokeStyle = lg; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); c.stroke();
    c.restore();
  }

  /* ==================================================================
     UI BAĞLANTILARI
  ================================================================== */
  function bindUI() {
    $('playBtn').addEventListener('click', function () { startGame(); });
    $('againBtn').addEventListener('click', function () { startGame(); });
    $('menuBtn').addEventListener('click', function () { toMenu(); });
    $('quitBtn').addEventListener('click', function () { toMenu(); });
    $('resumeBtn').addEventListener('click', function () { resumeGame(); });
    $('howBtn').addEventListener('click', function () {
      hint('WASD hareket · SOL TIK ateş · SAĞ TIK nişan · B mağaza · 1/2/3 silah', 5);
    });
    $('nextWaveBtn').addEventListener('click', function () {
      if (G.state === 'shop') startWave(G.wave + 1);
    });
    $('shopItems').addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.buy') : null;
      if (!btn || btn.disabled) return;
      var i = parseInt(btn.getAttribute('data-i'), 10);
      var it = SHOP_ITEMS[shopTab][i];
      if (it) buyItem(it);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) { t.classList.remove('on'); });
        tab.classList.add('on');
        shopTab = tab.getAttribute('data-tab');
        renderShop();
      });
    });
    function bindRange(id, fn) {
      var el = $(id); if (!el) return;
      el.addEventListener('input', function () { fn(parseFloat(el.value)); });
      fn(parseFloat(el.value));
    }
    bindRange('sens', function (v) { G.sens = v; $('sens2').value = v; });
    bindRange('sens2', function (v) { G.sens = v; $('sens').value = v; });
    bindRange('vol', function (v) { G.vol = v; Audio2.vol(v); $('vol2').value = v; });
    bindRange('vol2', function (v) { G.vol = v; Audio2.vol(v); $('vol').value = v; });
    bindRange('qual', function (v) {
      G.quality = v;
      if (!renderer) return;
      if (v === 0) { renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; }
      else if (v === 1) { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.shadowMap.enabled = true; }
      else { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; }
      renderer.shadowMap.needsUpdate = true;
    });
    window.addEventListener('resize', function () {
      if (!renderer) return;
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      viewCam.aspect = window.innerWidth / window.innerHeight;
      viewCam.updateProjectionMatrix();
    });
    // Mağaza overlay arka planına tıklamayı yut
    $('shop').addEventListener('click', function (e) { if (e.target === $('shop')) { /* kapatma */ } });
    $('start').addEventListener('click', function (e) {
      if (e.target === $('start')) { /* hiçbir şey */ }
    });
  }

  /* ==================================================================
     BAŞLAT
  ================================================================== */
  function resizeView() {
    if (!renderer) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    viewCam.aspect = window.innerWidth / window.innerHeight;
    viewCam.updateProjectionMatrix();
  }
  resizeView();
  bindUI();
  initMobileUI();
  initDayNight();
  setTimeOfDay(0, true);
  updateBest();
  updateAmmoHud();
  updateHealthHud();
  updateMoneyHud();
  HUD.cross.style.setProperty('--sp', '7px');

  if (!HAS_GL) {
    var ld = $('loading');
    if (ld) ld.innerHTML = '<div class="l"><div class="t" style="color:#ff8a3d">WEBGL BAŞLATILAMADI</div>' +
      '<div style="color:#9aa8b8;font-size:13px;margin-top:10px;max-width:420px;line-height:1.6">' +
      'Tarayıcın WebGL desteklemiyor veya kapalı. Chrome/Firefox güncel sürüm dene ya da donanım hızlandırmayı aç.</div></div>';
  } else {
    setTimeout(function () {
      var ld = $('loading');
      if (ld) { ld.style.opacity = 0; setTimeout(function () { ld.style.display = 'none'; }, 420); }
    }, 420);
  }

  // ---- hata ayıklama kancaları (konsoldan test/inceleme için)
  window.__TEST__ = {
    G: G, player: player, bots: bots, camera: camera, scene: scene, T: T,
    fire: fireWeapon, melee: meleeAttack, startWave: startWave, buy: buyItem,
    viewCam: viewCam, viewScene: viewScene, vmList: vmList, vmHold: vHold,
    mobile: MOBILE, isTouch: IS_TOUCH, ads: ADS, reload: tryReload, switchW: switchWeapon,
    toggleShop: toggleShop, pause: pauseGame, resume: resumeGame,
    allies: allies, spawnAllies: spawnAllies, setTime: setTimeOfDay, times: TIMES,
    sun: sun, hemi: hemi, ambient: ambient, skyDome: function () { return skyDome; },
    items: SHOP_ITEMS, weapons: WEAPONS, hurt: hurtPlayer, spawn: spawnBot,
    openShop: openShop, los: losBlocked, findPath: findPath, grid: grid, GN: GN, CELL: CELL,
    HALF: HALF, COL: COL, pickups: pickups, syncCam: function () {
      camera.position.set(player.pos.x, player.eyeCur + player.jumpY, player.pos.z);
      camera.rotation.set(player.pitch, player.yaw, 0);
      camera.updateMatrixWorld(true);
    },
    tick: function (dt, render) {
      G.t += dt;
      simulate(dt);
      mobileSync();
      drawRadar();
      if (render) renderAll();
    },
    update: function (n, dt) {
      for (var i = 0; i < n; i++) { updatePlayer(dt); for (var b = 0; b < bots.length; b++) bots[b].update(dt); }
    }
  };

  loop();
})();
