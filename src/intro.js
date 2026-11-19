  /* ==================================================================
     BAŞLANGIÇ SİNEMATİĞİ — gece yatakta uyanma, alarm, merdiven, avlu
     Oyuncunun kendi karakteri (beden + animasyon) üçüncü şahıstan görünür.
  ================================================================== */
  var INTRO = { active: false, t: 0, dur: 9.4, phase: 'idle', nextBeat: 0, done: false };

  function buildPlayerBody() {
    var app = {
      skin: 0xd9ab86, shirt: 0x2f3a4a, pants: 0x232a33, shoes: 0x14161a,
      hair: 0x2a2018, scale: 1.0, build: 'normal', vest: false, hoodie: false,
      beard: false, mustache: false, shades: false, mask: false,
      hat: null, hatColor: 0x1c1f24, weapon: null
    };
    var av = buildAvatar(app);
    var root = new T.Group();
    root.add(av.root);
    root.visible = false;
    scene.add(root);
    av.root.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    playerBody = root;
    playerBody.userData = av;
    return root;
  }
  buildPlayerBody();

  function smoothEase(t, a, b) {
    var k = clamp((t - a) / (b - a), 0, 1);
    return k * k * (3 - 2 * k);
  }

  function introStart() {
    INTRO.active = true; INTRO.done = false; INTRO.t = 0; INTRO.nextBeat = 0;
    INTRO.phase = 'sleep';
    var h = HOME;
    player.pos.set(h.stair.x, 0, h.stair.z);
    player.yaw = -Math.PI / 2; player.pitch = 0;
    player.vel.set(0, 0, 0);
    player.hp = player.maxHp; player.dead = false;
    G.state = 'intro'; G.introActive = true;
    camera.position.set(h.bedHead.x, h.bedHead.y + 0.16, h.bedHead.z);
    camera.rotation.set(0.2, -1.15, 0.06);
    if (HUD.black) HUD.black.style.opacity = '1';
    if (playerBody) {
      var av = playerBody.userData;
      playerBody.visible = true; playerBodyVis = true;
      playerBody.position.set(h.bed.x, h.deckY + 0.42, h.bed.z);
      playerBody.rotation.set(0, 0, 0);
      av.root.rotation.x = -Math.PI / 2;
      av.legL.rotation.x = 0; av.legR.rotation.x = 0;
      av.armL.rotation.x = 0.12; av.armR.rotation.x = -0.12;
      av.armL.rotation.z = 0.08; av.armR.rotation.z = -0.08;
    }
    setTimeOfDay(3, true);
    banner('03:47', 'ALARM ÇALIYOR — MAHALLE UYAN', 2.6);
    hint('UYAN. Aşağı in. Tel örgüye koş.', 3.4);
    Audio2.alarm();
  }

  function introUpdate(dt) {
    if (!INTRO.active) return;
    INTRO.t += dt;
    var t = INTRO.t, h = HOME;
    var av = playerBody ? playerBody.userData : null;

    if (t > 1.1 && INTRO.nextBeat === 0) { INTRO.nextBeat = 1; Audio2.alarm(); Audio2.heartbeat(); }
    if (t > 4.3 && INTRO.nextBeat === 1) { INTRO.nextBeat = 2; Audio2.siren(); }
    if (t > 7.4 && INTRO.nextBeat === 2) { INTRO.nextBeat = 3; Audio2.wave(); }

    // ---- 1) yatakta uyanma
    if (t < 2.3) {
      INTRO.phase = 'sleep';
      var k1 = smoothEase(t, 0.1, 2.1);
      camera.position.set(h.bedHead.x + 0.02 * k1, h.bedHead.y + 0.16 + 0.05 * k1, h.bedHead.z);
      camera.rotation.set(0.2 - 0.09 * k1, -1.15 + 0.1 * k1, 0.07 - 0.05 * k1);
      if (HUD.black) HUD.black.style.opacity = String(Math.max(0, 1 - k1 * 1.25));
      if (av) {
        av.armL.rotation.x = 0.12 + Math.sin(t * 1.6) * 0.03;
        av.armR.rotation.x = -0.12 - Math.sin(t * 1.6) * 0.03;
      }
      return;
    }

    // ---- 2) yataktan doğrulma
    if (t < 4.4) {
      INTRO.phase = 'rise';
      var k2 = smoothEase(t, 2.3, 4.2);
      if (HUD.black) HUD.black.style.opacity = '0';
      if (av && playerBody) {
        playerBody.position.set(h.bed.x + 0.12 * k2, h.deckY + lerp(0.42, 0.02, k2), h.bed.z);
        av.root.rotation.x = lerp(-Math.PI / 2, 0, k2);
        av.legL.rotation.x = lerp(0, -0.55, k2);
        av.legR.rotation.x = lerp(0, 0.35, k2);
        av.armL.rotation.x = lerp(0.12, -0.35, k2);
        av.armR.rotation.x = lerp(-0.12, -0.5, k2);
        av.armL.rotation.z = 0.08 * (1 - k2); av.armR.rotation.z = -0.08 * (1 - k2);
        playerBody.rotation.y = Math.PI * 0.5 * k2;
      }
      camera.position.set(h.bed.x + 0.5 + 0.9 * k2,
        lerp(h.bedHead.y + 0.16, h.deckY + 1.55, k2), h.bed.z + 0.2 * k2);
      camera.rotation.set(lerp(0.11, -0.02, k2), lerp(-1.15, -1.6, k2), lerp(0.02, 0, k2));
      return;
    }

    // ---- 3) merdivenden koşu
    if (t < 7.0) {
      INTRO.phase = 'stairs';
      var t3 = clamp((t - 4.4) / 2.6, 0, 1);
      var sx = lerp(h.bed.x + 1.2, h.stair.x, t3);
      var sz = lerp(h.bed.z - 0.9, h.stair.z + 2.4, t3);
      var sy = lerp(h.deckY, 0, t3);
      var bodyYaw = Math.atan2(h.stair.x - (h.bed.x + 1.2), 2.4);
      if (av && playerBody) {
        var cad = Math.sin(t * 13);
        playerBody.position.set(sx, sy + Math.abs(Math.sin(t * 12)) * 0.07, sz);
        playerBody.rotation.y = bodyYaw;
        av.root.rotation.x = 0;
        av.legL.rotation.x = cad * 0.95;
        av.legR.rotation.x = -cad * 0.95;
        av.armL.rotation.x = -cad * 0.8;
        av.armR.rotation.x = cad * 0.8;
        av.armL.rotation.z = 0; av.armR.rotation.z = 0;
      }
      camera.position.set(sx - Math.sin(bodyYaw) * 2.6, sy + 1.78, sz - Math.cos(bodyYaw) * 2.6);
      camera.rotation.set(-0.06, bodyYaw, 0);
      return;
    }

    // ---- 4) avlu: tel örgüye bakış
    INTRO.phase = 'yard';
    var k4 = smoothEase(t, 7.0, 9.2);
    var yx = lerp(h.stair.x, h.door.x - 1.2, k4);
    var yz = lerp(h.stair.z + 2.4, h.door.z + 3.6, k4);
    if (av && playerBody) {
      playerBody.position.set(yx, 0, yz);
      playerBody.rotation.y = Math.PI;
      var cad2 = Math.sin(t * 10) * (1 - k4);
      av.legL.rotation.x = cad2 * 0.8;
      av.legR.rotation.x = -cad2 * 0.8;
      av.armL.rotation.x = -0.3 - 0.5 * k4;
      av.armR.rotation.x = -0.4 - 0.7 * k4;
    }
    camera.position.set(yx + 0.35 - 1.6 * k4, 1.68, yz + 0.1 + 0.9 * k4);
    camera.rotation.set(-0.03 + 0.05 * k4, Math.PI + 0.32 * k4, 0);

    if (t >= INTRO.dur) introEnd();
  }

  function introEnd() {
    INTRO.active = false; INTRO.done = true;
    G.introActive = false;
    if (HUD.black) HUD.black.style.opacity = '0';
    if (playerBody) { playerBody.visible = false; playerBodyVis = false; }
    player.pos.set(HOME.door.x - 1.2, 0, HOME.door.z + 3.6);
    player.yaw = Math.PI; player.pitch = -0.04;
    player.eyeCur = EYE;
    G.state = 'playing';
    startWave(1);
  }

  function introSkip() {
    if (!INTRO.active) return;
    introEnd();
  }
