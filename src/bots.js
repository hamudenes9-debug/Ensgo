  /* ==================================================================
     RASTGELE AVATAR ÜRETİCİ
  ================================================================== */
  var SKINS = [0xf3cba8, 0xe8b48b, 0xd09a6c, 0xb87a4d, 0x8d5a33, 0x6b4126, 0xffd9b8];
  var SHIRTS = [0xc23b3b, 0x2d5f8a, 0x2f7a52, 0x22262b, 0xe0c04c, 0x7a4f9e, 0xd8d8d8,
    0x3d3f45, 0x9a5b2c, 0x1f6f7a, 0xb04a86, 0x4c7a24];
  var PANTS = [0x27303d, 0x3a4450, 0x1e2228, 0x5b5144, 0x2a3a2c, 0x6b6357, 0x40485a];
  var SHOES = [0x14161a, 0x3a2a1e, 0xe8e8e8, 0x24292e, 0x6b2f2f];
  var HAIRS = [0x14100c, 0x3a2614, 0x6b4a24, 0x8a7048, 0xb8b0a4, 0x7a2f1e, 0x1a1a1a];
  var HATS = [0x1c1f24, 0x2f4a7a, 0xa83232, 0x2f6b4a, 0xd8d0c0, 0x1f2430];
  var MASKS = [0x1c1f24, 0x8a2f3a, 0x3a5f7a, 0x2f6b4a];

  function matFor(c, rough) {
    return new T.MeshStandardMaterial({ color: c, roughness: rough === undefined ? 0.82 : rough, metalness: 0.02 });
  }

  /* ==================================================================
     DÜNYA SİLAH MODELLERİ (botlar için, ucuz)
  ================================================================== */
  function worldGun(kind) {
    var g = new T.Group();
    var mDark = new T.MeshStandardMaterial({ color: 0x24282c, roughness: 0.5, metalness: 0.7 });
    var mWood = new T.MeshStandardMaterial({ color: 0x6e4423, roughness: 0.75 });
    if (kind === 'knife') {
      var b = new T.Mesh(new T.BoxGeometry(0.03, 0.11, 0.36), new T.MeshStandardMaterial({ color: 0xcfd8e2, roughness: 0.2, metalness: 0.95 }));
      b.position.z = -0.16; g.add(b);
      var h = new T.Mesh(new T.BoxGeometry(0.045, 0.09, 0.16), mDark);
      h.position.z = 0.06; g.add(h);
      return g;
    }
    var body = new T.Mesh(new T.BoxGeometry(0.06, 0.1, kind === 'pistol' ? 0.26 : 0.5), mDark);
    body.position.z = kind === 'pistol' ? -0.06 : -0.1; g.add(body);
    var barrel = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, kind === 'pistol' ? 0.1 : 0.3, 6), mDark);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, kind === 'pistol' ? -0.22 : -0.44); g.add(barrel);
    if (kind !== 'pistol') {
      var mag = new T.Mesh(new T.BoxGeometry(0.05, 0.18, 0.08), mDark);
      mag.position.set(0, -0.12, 0.02); mag.rotation.x = kind === 'ak47' ? -0.35 : -0.1; g.add(mag);
      var stock = new T.Mesh(new T.BoxGeometry(0.05, 0.09, 0.22), kind === 'ak47' ? mWood : mDark);
      stock.position.z = 0.22; g.add(stock);
      var fore = new T.Mesh(new T.BoxGeometry(0.055, 0.07, 0.18), kind === 'ak47' ? mWood : mDark);
      fore.position.z = -0.3; g.add(fore);
    } else {
      var grip = new T.Mesh(new T.BoxGeometry(0.05, 0.14, 0.07), mDark);
      grip.position.set(0, -0.11, 0.03); grip.rotation.x = 0.25; g.add(grip);
    }
    return g;
  }

  /* ==================================================================
     AVATAR
  ================================================================== */
  function buildAvatar(app) {
    var root = new T.Group();
    var s = app.scale || 1;
    root.scale.setScalar(s);

    var skinM = matFor(app.skin, 0.72);
    var shirtM = matFor(app.shirt, 0.86);
    var pantsM = matFor(app.pants, 0.9);
    var shoeM = matFor(app.shoes, 0.62);
    var hairM = matFor(app.hair, 0.95);

    // bacaklar (pivot kalçada)
    var legL = new T.Group(); legL.position.set(-0.13, 0.86, 0);
    var legR = new T.Group(); legR.position.set(0.13, 0.86, 0);
    [legL, legR].forEach(function (lg) {
      var thigh = new T.Mesh(new T.BoxGeometry(0.19, 0.46, 0.21), pantsM);
      thigh.position.y = -0.22; thigh.castShadow = true; lg.add(thigh);
      var shin = new T.Mesh(new T.BoxGeometry(0.165, 0.44, 0.19), pantsM);
      shin.position.y = -0.66; shin.castShadow = true; lg.add(shin);
      var shoe = new T.Mesh(new T.BoxGeometry(0.19, 0.11, 0.3), shoeM);
      shoe.position.set(0, -0.89, -0.04); shoe.castShadow = true; lg.add(shoe);
    });
    root.add(legL, legR);

    // gövde
    var torso = new T.Mesh(new T.BoxGeometry(0.5, 0.62, 0.28), shirtM);
    torso.position.y = 1.16; torso.castShadow = true; root.add(torso);
    var hips = new T.Mesh(new T.BoxGeometry(0.44, 0.16, 0.26), pantsM);
    hips.position.y = 0.83; root.add(hips);

    // şekil varyasyonları
    if (app.build === 'heavy') { torso.scale.set(1.18, 1.02, 1.2); hips.scale.set(1.15, 1, 1.15); }
    if (app.build === 'slim') { torso.scale.set(0.86, 1.04, 0.86); }

    // yelek / kapüşon
    if (app.vest) {
      var vest = new T.Mesh(new T.BoxGeometry(0.52, 0.44, 0.32),
        new T.MeshStandardMaterial({ color: 0x2b3a2b, roughness: 0.85 }));
      vest.position.y = 1.2; vest.castShadow = true; root.add(vest);
      var pocket = new T.Mesh(new T.BoxGeometry(0.16, 0.13, 0.05), matFor(0x3d4f38, 0.8));
      pocket.position.set(0.13, 1.16, 0.18); root.add(pocket);
    }
    if (app.hoodie) {
      var hood = new T.Mesh(new T.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.65), shirtM);
      hood.position.set(0, 1.42, -0.12); hood.rotation.x = -0.4; root.add(hood);
    }

    // kollar (pivot omuzda)
    var armL = new T.Group(); armL.position.set(-0.32, 1.4, 0);
    var armR = new T.Group(); armR.position.set(0.32, 1.4, 0);
    [armL, armR].forEach(function (ar) {
      var up = new T.Mesh(new T.BoxGeometry(0.145, 0.36, 0.16), shirtM);
      up.position.y = -0.16; up.castShadow = true; ar.add(up);
      var lo = new T.Mesh(new T.BoxGeometry(0.125, 0.34, 0.14), skinM);
      lo.position.y = -0.48; lo.castShadow = true; ar.add(lo);
      var hand = new T.Mesh(new T.BoxGeometry(0.12, 0.13, 0.14), skinM);
      hand.position.y = -0.68; ar.add(hand);
    });
    root.add(armL, armR);

    // silah sağ elde
    var wg = worldGun(app.weapon);
    wg.position.set(0.05, -0.62, -0.12);
    wg.rotation.x = -0.15;
    armR.add(wg);

    // boyun + kafa
    var neck = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 0.1, 8), skinM);
    neck.position.y = 1.5; root.add(neck);
    var headG = new T.Group(); headG.position.y = 1.62;
    var head = new T.Mesh(new T.SphereGeometry(0.195, 12, 10), skinM);
    head.scale.set(1, 1.12, 1.02); head.castShadow = true; headG.add(head);
    // kulaklar
    [-1, 1].forEach(function (sx) {
      var ear = new T.Mesh(new T.SphereGeometry(0.05, 6, 5), skinM);
      ear.position.set(sx * 0.19, 0, 0); headG.add(ear);
    });
    // saç
    var hair = new T.Mesh(new T.SphereGeometry(0.203, 12, 9, 0, Math.PI * 2, 0, Math.PI * 0.62), hairM);
    hair.position.y = 0.02; hair.scale.set(1, 1.05, 1.02); headG.add(hair);
    // gözler
    var eyeM = matFor(0x121212, 0.4);
    [-1, 1].forEach(function (sx) {
      var eye = new T.Mesh(new T.BoxGeometry(0.055, 0.03, 0.02), eyeM);
      eye.position.set(sx * 0.075, 0.03, 0.19); headG.add(eye);
    });
    // kaş
    [-1, 1].forEach(function (sx) {
      var br = new T.Mesh(new T.BoxGeometry(0.07, 0.018, 0.02), hairM);
      br.position.set(sx * 0.075, 0.075, 0.19); br.rotation.z = sx * 0.16; headG.add(br);
    });
    // burun + ağız
    var nose = new T.Mesh(new T.BoxGeometry(0.045, 0.06, 0.05), skinM);
    nose.position.set(0, -0.01, 0.2); headG.add(nose);

    if (app.beard) {
      var beard = new T.Mesh(new T.BoxGeometry(0.24, 0.13, 0.1), hairM);
      beard.position.set(0, -0.12, 0.13); headG.add(beard);
    }
    if (app.mustache) {
      var mus = new T.Mesh(new T.BoxGeometry(0.15, 0.035, 0.04), hairM);
      mus.position.set(0, -0.055, 0.19); headG.add(mus);
    }
    if (app.shades) {
      var sm = matFor(0x0e0e10, 0.25);
      [-1, 1].forEach(function (sx) {
        var l = new T.Mesh(new T.BoxGeometry(0.1, 0.055, 0.02), sm);
        l.position.set(sx * 0.075, 0.035, 0.196); headG.add(l);
      });
      var bridge = new T.Mesh(new T.BoxGeometry(0.06, 0.016, 0.02), sm);
      bridge.position.set(0, 0.04, 0.198); headG.add(bridge);
    }
    if (app.mask) {
      var mask = new T.Mesh(new T.BoxGeometry(0.26, 0.12, 0.08), matFor(app.maskColor, 0.9));
      mask.position.set(0, -0.075, 0.14); headG.add(mask);
    }
    if (app.hat === 'cap') {
      var cap = new T.Mesh(new T.CylinderGeometry(0.205, 0.205, 0.1, 12, 1, false, 0, Math.PI * 2), matFor(app.hatColor, 0.85));
      cap.position.y = 0.13; headG.add(cap);
      var brim = new T.Mesh(new T.BoxGeometry(0.3, 0.028, 0.19), matFor(app.hatColor, 0.85));
      brim.position.set(0, 0.09, 0.2); headG.add(brim);
    } else if (app.hat === 'bandana') {
      var band = new T.Mesh(new T.CylinderGeometry(0.202, 0.202, 0.07, 12), matFor(app.hatColor, 0.85));
      band.position.y = 0.09; headG.add(band);
      var tail = new T.Mesh(new T.BoxGeometry(0.06, 0.16, 0.02), matFor(app.hatColor, 0.85));
      tail.position.set(-0.13, 0.02, -0.16); tail.rotation.z = 0.4; headG.add(tail);
    } else if (app.hat === 'helmet') {
      var helm = new T.Mesh(new T.SphereGeometry(0.225, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new T.MeshStandardMaterial({ color: 0x3b4a35, roughness: 0.6, metalness: 0.3 }));
      helm.position.y = 0.04; headG.add(helm);
      var brim2 = new T.Mesh(new T.CylinderGeometry(0.235, 0.235, 0.025, 12), matFor(0x2f3a2c, 0.7));
      brim2.position.y = 0.035; headG.add(brim2);
    }
    root.add(headG);

    root.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { root: root, legL: legL, legR: legR, armL: armL, armR: armR, head: headG, gun: wg, torso: torso };
  }

  // ---- ZOMBİ AVATARI: çürümüş ten, yırtık giysi, kan lekeleri, parlayan gözler
  function buildZombieAvatar(app) {
    var s0 = app.scale || 1;
    var root = new T.Group();
    root.scale.setScalar(s0);
    var skinM = new T.MeshStandardMaterial({ color: app.skin, roughness: 0.95 });
    var clothM = new T.MeshStandardMaterial({ color: app.shirt, roughness: 1, side: T.DoubleSide });
    var pantsM = new T.MeshStandardMaterial({ color: app.pants, roughness: 1 });
    var bloodM = new T.MeshStandardMaterial({ color: 0x5a0d0d, roughness: 0.8 });
    var eyeM = new T.MeshBasicMaterial({ color: app.eye || 0xff3b2f });

    // bacaklar (topallayan)
    var legL = new T.Group(); legL.position.set(-0.13, 0.84, 0);
    var legR = new T.Group(); legR.position.set(0.13, 0.84, 0);
    [legL, legR].forEach(function (lg) {
      var thigh = new T.Mesh(new T.BoxGeometry(0.18, 0.44, 0.19), pantsM);
      thigh.position.y = -0.22; lg.add(thigh);
      var shin = new T.Mesh(new T.BoxGeometry(0.15, 0.42, 0.17), skinM);
      shin.position.y = -0.64; lg.add(shin);
      var foot = new T.Mesh(new T.BoxGeometry(0.17, 0.1, 0.27), skinM);
      foot.position.set(0, -0.87, -0.04); lg.add(foot);
    });
    root.add(legL, legR);
    // gövde (yırtık)
    var torso = new T.Mesh(new T.BoxGeometry(0.46, 0.58, 0.26), clothM);
    torso.position.y = 1.14; root.add(torso);
    // açık yara / kan
    var wound = new T.Mesh(new T.BoxGeometry(0.2, 0.16, 0.03), bloodM);
    wound.position.set(0.05, 1.16, 0.135); root.add(wound);
    var ribs = new T.Mesh(new T.BoxGeometry(0.26, 0.1, 0.02), skinM);
    ribs.position.set(-0.06, 0.98, 0.135); root.add(ribs);
    // kollar: ileri uzatılmış (klasik zombi duruşu)
    var armL = new T.Group(); armL.position.set(-0.3, 1.38, 0);
    var armR = new T.Group(); armR.position.set(0.3, 1.38, 0);
    [armL, armR].forEach(function (ar, i) {
      var up = new T.Mesh(new T.BoxGeometry(0.13, 0.34, 0.14), clothM);
      up.position.y = -0.15; ar.add(up);
      var lo = new T.Mesh(new T.BoxGeometry(0.11, 0.34, 0.12), skinM);
      lo.position.y = -0.46; ar.add(lo);
      var hand = new T.Mesh(new T.BoxGeometry(0.115, 0.14, 0.13), skinM);
      hand.position.y = -0.66; ar.add(hand);
      // kanlı tırnaklar
      for (var f = 0; f < 3; f++) {
        var nail = new T.Mesh(new T.BoxGeometry(0.02, 0.05, 0.02), bloodM);
        nail.position.set(-0.035 + f * 0.035, -0.74, -0.03); ar.add(nail);
      }
      ar.rotation.x = -1.42 + i * 0.12;
    });
    root.add(armL, armR);
    // boyun + kafa (eğik)
    var neck = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, 0.1, 7), skinM);
    neck.position.y = 1.48; root.add(neck);
    var headG = new T.Group(); headG.position.set(0, 1.6, 0.02);
    headG.rotation.z = rand(0.12, -0.12);
    var head = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), skinM);
    head.scale.set(1, 1.1, 1); headG.add(head);
    // parlayan gözler
    [-1, 1].forEach(function (sx) {
      var eye = new T.Mesh(new T.SphereGeometry(0.035, 6, 5), eyeM);
      eye.position.set(sx * 0.075, 0.03, 0.17); headG.add(eye);
    });
    // açık ağız + dişler
    var mouth = new T.Mesh(new T.BoxGeometry(0.11, 0.06, 0.03), new T.MeshBasicMaterial({ color: 0x1a0505 }));
    mouth.position.set(0, -0.07, 0.18); headG.add(mouth);
    var teeth = new T.Mesh(new T.BoxGeometry(0.09, 0.015, 0.02), new T.MeshStandardMaterial({ color: 0xd8d2b8, roughness: 0.6 }));
    teeth.position.set(0, -0.05, 0.19); headG.add(teeth);
    // yarı kel kafa, saç tutamı
    var hair = new T.Mesh(new T.SphereGeometry(0.195, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.42), new T.MeshStandardMaterial({ color: app.hair, roughness: 1 }));
    hair.position.y = 0.03; headG.add(hair);
    root.add(headG);
    root.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { root: root, legL: legL, legR: legR, armL: armL, armR: armR, head: headG, gun: null, torso: torso };
  }

  // ---- ASKER AVATARI: kamuflaj, miğfer, çelik yelek
  function buildSoldierAvatar(app) {
    var av = buildAvatar(app);
    // miğfer
    var helm = new T.Mesh(new T.SphereGeometry(0.225, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6),
      new T.MeshStandardMaterial({ color: app.helmetColor || 0x3f4a35, roughness: 0.75, metalness: 0.2 }));
    helm.position.y = 0.06;
    av.head.add(helm);
    // kamuflaj yaması
    var patch = new T.Mesh(new T.BoxGeometry(0.13, 0.08, 0.02), new T.MeshStandardMaterial({ color: 0x59634a, roughness: 1 }));
    patch.position.set(-0.1, 1.24, 0.15);
    av.root.add(patch);
    // göğüs plakası
    var plate = new T.Mesh(new T.BoxGeometry(0.36, 0.32, 0.06), new T.MeshStandardMaterial({ color: 0x2f3a2a, roughness: 0.8 }));
    plate.position.set(0, 1.2, 0.16);
    av.root.add(plate);
    return av;
  }

  function randomZombieAppearance(kind) {
    var zSkins = [0x7d8f6a, 0x6b7f5a, 0x8a9578, 0x9aa08a, 0x6f7d63, 0x5c6b52, 0xa8a68c];
    var zShirts = [0x6b5a4a, 0x4a5a6b, 0x7a6a58, 0x554a4a, 0x8a7d6a, 0x3f4a4a];
    return {
      skin: pick(zSkins), shirt: pick(zShirts), pants: pick([0x3a3a30, 0x2f3436, 0x4a4232, 0x353a3f]),
      hair: pick([0x1a1a14, 0x3a3428, 0x2a2418]), eye: pick([0xff3b2f, 0xffa33b, 0xbaff3b, 0xff6b9a]),
      scale: kind === 'brute' ? rand(1.28, 1.12) : rand(1.06, 0.92),
      kind: kind
    };
  }

  function randomSoldierAppearance() {
    return {
      skin: pick(SKINS), shirt: 0x4a5340, pants: 0x39412f, shoes: 0x1a1a14,
      hair: 0x2a2418, scale: rand(1.06, 0.97), build: 'normal',
      vest: true, hoodie: false, beard: Math.random() < 0.2, mustache: Math.random() < 0.15,
      shades: true, mask: false, hat: 'helmet', hatColor: 0x3f4a35,
      weapon: pick(['m4a4', 'ak47']), helmetColor: 0x3f4a35
    };
  }

  function randomAppearance(type) {
    var isHeavy = type === 'heavy';
    var isKnifer = type === 'knifer';
    return {
      skin: pick(SKINS), shirt: pick(SHIRTS), pants: pick(PANTS), shoes: pick(SHOES),
      hair: pick(HAIRS), scale: isHeavy ? rand(1.14, 1.04) : rand(1.04, 0.93),
      build: isHeavy ? 'heavy' : (Math.random() < 0.3 ? 'slim' : 'normal'),
      vest: isHeavy || Math.random() < 0.35,
      hoodie: Math.random() < 0.28,
      beard: Math.random() < 0.32, mustache: Math.random() < 0.22,
      shades: Math.random() < (isKnifer ? 0.15 : 0.28),
      mask: Math.random() < 0.18, maskColor: pick(MASKS),
      hat: Math.random() < 0.45 ? pick(['cap', 'bandana', 'helmet']) : 'none',
      hatColor: pick(HATS), weapon: BOT_TYPES[type].weapon
    };
  }

  /* ==================================================================
     NAVİGASYON IZGARASI + A*
  ================================================================== */
  var CELL = 2;
  var GN = Math.floor((HALF * 2) / CELL);
  var grid = new Uint8Array(GN * GN);
  var OPEN_SPOTS = [];
  var REACH = null;
  function cellOf(x, z) {
    return {
      i: clamp(Math.floor((x + HALF) / CELL), 0, GN - 1),
      j: clamp(Math.floor((z + HALF) / CELL), 0, GN - 1)
    };
  }
  function buildGrid() {
    for (var j = 0; j < GN; j++) {
      for (var i = 0; i < GN; i++) {
        var cx = -HALF + (i + 0.5) * CELL, cz = -HALF + (j + 0.5) * CELL;
        var blocked = 0;
        // tel örgünün dışı yürünebilir değil
        if (Math.abs(cx) > FENCE - 1.4 || Math.abs(cz) > FENCE - 1.4) {
          grid[j * GN + i] = 1; continue;
        }
        for (var k = 0; k < COL.length; k++) {
          var c = COL[k];
          if (c.fence) continue;
          var nx = clamp(cx, c.minX, c.maxX), nz = clamp(cz, c.minZ, c.maxZ);
          if ((cx - nx) * (cx - nx) + (cz - nz) * (cz - nz) < 0.72 * 0.72) { blocked = 1; break; }
        }
        grid[j * GN + i] = blocked;
      }
    }
    // açık hücrelerden doğma noktaları (haritanın dış halkası)
    OPEN_SPOTS.length = 0;
    for (var jj = 0; jj < GN; jj++) {
      for (var ii = 0; ii < GN; ii++) {
        if (grid[jj * GN + ii]) continue;
        var ox = -HALF + (ii + 0.5) * CELL, oz = -HALF + (jj + 0.5) * CELL;
        if (Math.abs(ox) < 21 && Math.abs(oz) < 21) continue;
        var clear = true;
        for (var d8 = 0; d8 < 8; d8++) {
          var ax = ii + [1, -1, 0, 0, 1, 1, -1, -1][d8], az = jj + [0, 0, 1, -1, 1, -1, 1, -1][d8];
          if (ax < 0 || az < 0 || ax >= GN || az >= GN || grid[az * GN + ax]) { clear = false; break; }
        }
        if (clear) OPEN_SPOTS.push({ x: ox + rand(0.6, -0.6), z: oz + rand(0.6, -0.6) });
      }
    }
    // erişilebilirlik: oyuncunun başlangıç bölgesinden BFS ile ulaşılabilen hücreler
    var seen2 = new Uint8Array(GN * GN);
    var q = [];
    var st = cellOf(0, 16);
    var si = st.j * GN + st.i;
    if (!grid[si]) { seen2[si] = 1; q.push(si); }
    while (q.length) {
      var cur2 = q.shift();
      var ci2 = cur2 % GN, cj2 = (cur2 / GN) | 0;
      for (var d9 = 0; d9 < 4; d9++) {
        var ni2 = ci2 + [1, -1, 0, 0][d9], nj2 = cj2 + [0, 0, 1, -1][d9];
        if (ni2 < 0 || nj2 < 0 || ni2 >= GN || nj2 >= GN) continue;
        var id2 = nj2 * GN + ni2;
        if (grid[id2] || seen2[id2]) continue;
        seen2[id2] = 1; q.push(id2);
      }
    }
    REACH = seen2;
    // erişilemeyen hücreleri engelli say
    for (var z2 = 0; z2 < GN * GN; z2++) if (!grid[z2] && !REACH[z2]) grid[z2] = 1;
    OPEN_SPOTS = OPEN_SPOTS.filter(function (o) {
      var cc = cellOf(o.x, o.z);
      return !grid[cc.j * GN + cc.i];
    });
  }
  buildGrid();

  function nearestOpen(i, j) {
    if (i < 0 || j < 0 || i >= GN || j >= GN) return null;
    if (!grid[j * GN + i]) return { i: i, j: j };
    for (var r = 1; r < 5; r++) {
      for (var dj = -r; dj <= r; dj++) for (var di = -r; di <= r; di++) {
        var ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue;
        if (!grid[nj * GN + ni]) return { i: ni, j: nj };
      }
    }
    return null;
  }

  var gScore = new Float32Array(GN * GN);
  var fScore = new Float32Array(GN * GN);
  var cameFrom = new Int32Array(GN * GN);
  var closed = new Uint8Array(GN * GN);
  var openHeap = [];

  function heapPush(node) {
    openHeap.push(node);
    var i = openHeap.length - 1;
    while (i > 0) {
      var p = (i - 1) >> 1;
      if (openHeap[p].f <= openHeap[i].f) break;
      var tmp = openHeap[p]; openHeap[p] = openHeap[i]; openHeap[i] = tmp; i = p;
    }
  }
  function heapPop() {
    var top = openHeap[0], last = openHeap.pop();
    if (openHeap.length) {
      openHeap[0] = last;
      var i = 0;
      for (;;) {
        var l = i * 2 + 1, r = l + 1, m = i;
        if (l < openHeap.length && openHeap[l].f < openHeap[m].f) m = l;
        if (r < openHeap.length && openHeap[r].f < openHeap[m].f) m = r;
        if (m === i) break;
        var t = openHeap[m]; openHeap[m] = openHeap[i]; openHeap[i] = t; i = m;
      }
    }
    return top;
  }

  function findPath(sx, sz, tx, tz) {
    var s = cellOf(sx, sz), t = cellOf(tx, tz);
    var start = nearestOpen(s.i, s.j), goal = nearestOpen(t.i, t.j);
    if (!start || !goal) return null;
    var startId = start.j * GN + start.i, goalId = goal.j * GN + goal.i;
    if (startId === goalId) return [];
    gScore.fill(1e9); fScore.fill(1e9); closed.fill(0); cameFrom.fill(-1);
    openHeap.length = 0;
    gScore[startId] = 0;
    fScore[startId] = 0;
    heapPush({ id: startId, f: 0 });
    var guard = 0, found = false;
    while (openHeap.length && guard++ < 4000) {
      var cur = heapPop();
      if (cur.id === goalId) { found = true; break; }
      if (closed[cur.id]) continue;
      closed[cur.id] = 1;
      var ci = cur.id % GN, cj = (cur.id / GN) | 0;
      for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        var ni = ci + di, nj = cj + dj;
        if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue;
        var nid = nj * GN + ni;
        if (grid[nid] || closed[nid]) continue;
        if (di && dj) { if (grid[cj * GN + ni] || grid[nj * GN + ci]) continue; }
        var step = (di && dj) ? 1.414 : 1;
        var ng = gScore[cur.id] + step;
        if (ng < gScore[nid]) {
          gScore[nid] = ng; cameFrom[nid] = cur.id;
          var h = Math.hypot(goal.i - ni, goal.j - nj);
          var f = ng + h;
          fScore[nid] = f;
          heapPush({ id: nid, f: f });
        }
      }
    }
    if (!found) return null;
    var path = [], id = goalId, guard2 = 0;
    while (id !== -1 && id !== startId && guard2++ < 400) {
      path.push({ x: -HALF + (id % GN + 0.5) * CELL, z: -HALF + (((id / GN) | 0) + 0.5) * CELL });
      id = cameFrom[id];
    }
    path.reverse();
    return path;
  }

  /* ==================================================================
     GÖRÜŞ HATTI (2B segment vs AABB)
  ================================================================== */
  function losBlocked(ax, az, bx, bz) {
    var dx = bx - ax, dz = bz - az;
    for (var i = 0; i < COL.length; i++) {
      var c = COL[i];
      if (c.fence) continue;
      var tmin = 0, tmax = 1;
      // x ekseni
      if (Math.abs(dx) < 1e-6) { if (ax < c.minX || ax > c.maxX) continue; }
      else {
        var t1 = (c.minX - ax) / dx, t2 = (c.maxX - ax) / dx;
        tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      }
      if (Math.abs(dz) < 1e-6) { if (az < c.minZ || az > c.maxZ) continue; }
      else {
        var t3 = (c.minZ - az) / dz, t4 = (c.maxZ - az) / dz;
        tmin = Math.max(tmin, Math.min(t3, t4)); tmax = Math.min(tmax, Math.max(t3, t4));
      }
      if (tmin <= tmax && tmax > 0.02 && tmin < 0.98) return true;
    }
    return false;
  }

  /* ==================================================================
     BOTLAR
  ================================================================== */
  var bots = [];
  var BOT_ID = 0;

  // tüm düşman tanımları tek yerde
  if (typeof ENEMY_TYPES !== 'undefined') {
    for (var _k in ENEMY_TYPES) BOT_TYPES[_k] = ENEMY_TYPES[_k];
  }

  function Bot(type, x, z, wave) {
    var def = BOT_TYPES[type] || BOT_TYPES.thug;
    var isZombie = !!def.zombie;
    var isSoldier = !!def.soldier;
    var app = isZombie ? randomZombieAppearance(type) : (isSoldier ? randomSoldierAppearance() : randomAppearance(type));
    var av;
    if (isZombie) av = buildZombieAvatar(app);
    else if (isSoldier) av = buildSoldierAvatar(app);
    else av = buildAvatar(app);
    this.isZombie = isZombie;
    this.isSoldier = isSoldier;
    this.id = ++BOT_ID;
    this.type = type;
    this.def = def;
    this.app = app;
    this.av = av;
    this.root = new T.Group();
    this.root.add(av.root);
    var names = isZombie ? ZOMBIE_NAMES : (isSoldier ? SOLDIER_NAMES : BOT_NAMES);
    this.name = pick(names);
    wave = Math.max(1, wave || G.wave || 1);
    this.wave = wave;
    var hpScale = 1 + Math.max(0, wave - 1) * 0.075;
    this.maxHp = Math.round(def.hp * hpScale);
    this.hp = this.maxHp;
    this.pos = V3(x, 0, z);
    this.vel = V3(0, 0, 0);
    this.yaw = Math.random() * 6.28;
    this.speed = def.speed * rand(1.04, 0.94) * (1 + clamp((wave - 1) * 0.03, 0, 0.35));
    this.radius = 0.45;
    this.state = 'hunt';
    this.path = null; this.pathT = 0; this.pathIdx = 0;
    this.think = Math.random() * 0.4;
    this.fireCd = rand(0.7, 0.2);
    this.reactT = Math.max(0.12, def.react - (wave - 1) * 0.02) + rand(0.12, -0.08);
    this.aimYaw = 0;
    this.walkPhase = Math.random() * 6.28;
    this.dead = false;
    this.hitFlash = 0;
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeT = rand(1.4, 0.4);
    this.stuckT = 0;
    this.lastPos = V3(x, 0, z);
    this.spawnT = 0;
    this.accuracy = def.acc * (1 - Math.min(0.4, (wave - 1) * 0.035));
    this.burst = 0;
    this.burstCd = 0;
    this.meleeCd = 0;
    this.muzzle = 0;
    this.relT = 0;
    this.ammo = 30;
    this.painT = 0;
    this.seenT = 0;
    this.dodgeT = 0;

    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
    this.root.scale.setScalar(0.01);
    this.baseScale = app.scale;
    this.root.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    scene.add(this.root);
    // oyuncuya doğru bak
    this.aimYaw = Math.atan2(player.pos.x - x, player.pos.z - z);
    this.yaw = this.aimYaw;
    this.root.rotation.y = this.yaw;
  }

  Bot.prototype.muzzlePos = function () {
    var v = V3(0, 1.15, -0.55);
    v.applyAxisAngle(V3(0, 1, 0), this.yaw);
    return v.add(this.pos);
  };

  Bot.prototype.headPos = function () {
    return V3(this.pos.x, 1.62 * this.app.scale, this.pos.z);
  };
  Bot.prototype.chestPos = function () {
    return V3(this.pos.x, 1.1 * this.app.scale, this.pos.z);
  };

  Bot.prototype.damage = function (dmg, head, fromPlayer, byName) {
    if (this.dead) return false;
    this.hp -= dmg;
    this.hitFlash = 0.12;
    this.painT = 0.35;
    this.lastAttacker = byName || (fromPlayer ? 'SEN' : 'BOT');
    this.av.root.traverse(function (o) {
      if (o.isMesh && o.material && o.material.emissive !== undefined) {
        o.material.emissive = new T.Color(0xff2222);
        o.material.emissiveIntensity = 0.55;
      }
    });
    if (this.hp <= 0) { this.die(head, fromPlayer); return true; }
    // vurulunca daha agresif
    if (fromPlayer) { this.state = 'hunt'; this.think = 0; this.seenT = 1; }
    return false;
  };

  Bot.prototype.die = function (head, byPlayer) {
    this.dead = true;
    G.waveKills++;
    var mine = (byPlayer !== false);
    if (mine) { G.kills++; if (head) G.headshots++; }
    var money = this.def.money + (head ? 35 : 0) + G.wave * 4;
    if (mine || Math.random() < 0.6) addMoney(mine ? money : Math.round(money * 0.5));
    if (mine) {
      killFeed('SEN', this.name, this.def.name);
      Audio2.kill();
      if (head) Audio2.head();
    }
    G.shake = Math.max(G.shake, 0.12);
    // düşme animasyonu
    this.deadT = 0;
    this.fallDir = Math.random() < 0.5 ? 1 : -1;
    this.av.root.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      var isMats = Array.isArray(o.material);
      var mats = isMats ? o.material : [o.material];
      var cloned = mats.map(function (m) {
        var c = m.clone();
        c.transparent = true;
        // yalnızca ışık destekleyen malzemelerde emissive var (Basic'te yok)
        if (c.emissive && c.emissive.isColor) {
          c.emissive = new T.Color(0x220000);
          c.emissiveIntensity = 0.14;
        } else if (c.color && c.color.isColor) {
          c.color = c.color.clone().multiplyScalar(0.72);
        }
        return c;
      });
      o.material = isMats ? cloned : cloned[0];
    });
    // olası sağlık paketi
    if (Math.random() < 0.17) spawnPickup('health', this.pos.x + rand(0.6, -0.6), this.pos.z + rand(0.6, -0.6));
    else if (Math.random() < 0.12) spawnPickup('ammo', this.pos.x + rand(0.6, -0.6), this.pos.z + rand(0.6, -0.6));
    // ölüm efekti
    Effects.blood(this.headPos(), 18);
    G.shake = Math.max(G.shake, 0.12);
  };

  Bot.prototype.update = function (dt) {
    var av = this.av;
    if (this.dead) {
      this.deadT += dt;
      var t = Math.min(1, this.deadT / 0.55);
      this.root.rotation.z = this.fallDir * t * 1.55;
      this.root.position.y = -Math.pow(t, 2) * 0.12;
      var fade = Math.max(0, 1 - Math.max(0, this.deadT - 2.2) / 1.1);
      av.root.traverse(function (o) { if (o.isMesh && o.material) o.material.opacity = fade; });
      if (this.deadT > 3.3) this.remove = true;
      return;
    }
    // doğma animasyonu
    if (this.spawnT < 0.5) {
      this.spawnT += dt;
      var sk = Math.min(1, this.spawnT / 0.5);
      this.root.scale.setScalar(0.25 + sk * 0.75);
      this.root.position.copy(this.pos);
      this.root.rotation.y = this.yaw;
      return;
    }
    this.root.scale.setScalar(1);

    // vurulma flash geri alma
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.hitFlash <= 0) {
        av.root.traverse(function (o) {
          if (o.isMesh && o.material && o.material.emissive) {
            o.material.emissive.setHex(0x000000);
            o.material.emissiveIntensity = 0;
          }
        });
      }
    }
    if (this.muzzle > 0) this.muzzle -= dt;
    if (this.meleeCd > 0) this.meleeCd -= dt;
    if (this.painT > 0) this.painT -= dt;

    var px = player.pos.x, pz = player.pos.z;
    var dx = px - this.pos.x, dz = pz - this.pos.z;
    var dist = Math.hypot(dx, dz);
    var dirX = dist > 0.001 ? dx / dist : 0, dirZ = dist > 0.001 ? dz / dist : 0;

    // görüş — zombiler koku/ses ile de takip eder (duvar arkasında da yönelir)
    var canSee = !losBlocked(this.pos.x, this.pos.z, px, pz);
    if (canSee) this.seenT = 2.2;
    else if (isZombieAI) this.seenT = Math.max(1.0, this.seenT - dt * 0.5);
    else this.seenT = Math.max(0, this.seenT - dt);

    this.think -= dt;
    var desired = V3(0, 0, 0);
    var def = this.def;
    var melee = (def.weapon === 'knife' || def.weapon === 'claw');
    var isZombieAI = !!def.zombie;
    var wantRange = melee ? 0.9 : (this.type === 'heavy' ? 11 : 8.5);

    if (this.think <= 0) {
      this.think = rand(0.55, 0.28);
      // taktik: yakın ve görüyorsa yan kayma, uzaksa yaklaş
      if (Math.random() < 0.35) this.strafeDir *= -1;
      if (canSee && dist < (melee ? 3 : 7.5) && !melee && Math.random() < 0.45) this.state = 'strafe';
      else if (canSee && !melee && Math.random() < 0.14) this.state = 'cover';
      else this.state = 'hunt';

      // yol yenile
      if (G.state === 'playing' && (this.state === 'hunt' || this.path === null)) {
        if (this.pathT <= 0) {
          this.path = findPath(this.pos.x, this.pos.z, px, pz);
          this.pathIdx = 0;
          this.pathT = rand(1.3, 0.7);
        }
      }
    }
    this.pathT -= dt;

    // hedef nokta
    var tgt = null;
    if (this.state === 'hunt') {
      if (this.path && this.path.length) {
        while (this.pathIdx < this.path.length) {
          var wp = this.path[this.pathIdx];
          if (Math.hypot(wp.x - this.pos.x, wp.z - this.pos.z) < 1.1) this.pathIdx++;
          else break;
        }
        if (this.pathIdx < this.path.length) tgt = this.path[this.pathIdx];
      }
      if (!tgt && !canSee) tgt = { x: px, z: pz };
    } else if (this.state === 'cover') {
      // yana kaçıp ateş etmeyi sürdür
      tgt = { x: this.pos.x + Math.cos(this.yaw + Math.PI / 2) * this.strafeDir * 3, z: this.pos.z + Math.sin(this.yaw + Math.PI / 2) * this.strafeDir * 3 };
    }

    if (tgt) {
      var tdx = tgt.x - this.pos.x, tdz = tgt.z - this.pos.z;
      var tl = Math.hypot(tdx, tdz) || 1;
      desired.x += (tdx / tl) * this.speed;
      desired.z += (tdz / tl) * this.speed;
    }

    // mesafe koruma: çok yakınsa (menzilli bot) geri çekil, çok uzaksa yaklaş
    if (!melee) {
      if (dist < wantRange * 0.55) {
        desired.x -= dirX * this.speed * 0.85;
        desired.z -= dirZ * this.speed * 0.85;
      } else if (dist > wantRange * 1.5 && canSee && this.state !== 'hunt') {
        desired.x += dirX * this.speed * 0.6;
        desired.z += dirZ * this.speed * 0.6;
      }
      if (this.state === 'strafe' && canSee) {
        desired.x += -dirZ * this.strafeDir * this.speed * 0.8;
        desired.z += dirX * this.strafeDir * this.speed * 0.8;
      }
      // yandan kayma (dodge) — ateş ederken de hareket
      if (canSee && this.state === 'hunt' && dist < 13) {
        desired.x += -dirZ * this.strafeDir * this.speed * 0.35;
        desired.z += dirX * this.strafeDir * this.speed * 0.35;
      }
    }

    // ayrışma
    for (var i = 0; i < bots.length; i++) {
      var b = bots[i];
      if (b === this || b.dead) continue;
      var sx = this.pos.x - b.pos.x, sz = this.pos.z - b.pos.z;
      var sd = Math.hypot(sx, sz);
      if (sd < 1.5 && sd > 0.001) {
        desired.x += (sx / sd) * (1.5 - sd) * 3.2;
        desired.z += (sz / sd) * (1.5 - sd) * 3.2;
      }
    }

    // yumuşat
    this.vel.x = lerp(this.vel.x, desired.x, Math.min(1, dt * 9));
    this.vel.z = lerp(this.vel.z, desired.z, Math.min(1, dt * 9));
    var moveSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    collideCircle(this.pos, this.radius);

    // sıkışma tespiti
    this.stuckT += dt;
    if (this.stuckT > 1.0) {
      var moved = Math.hypot(this.pos.x - this.lastPos.x, this.pos.z - this.lastPos.z);
      if (moved < 0.35) {
        this.path = null; this.pathT = 0;
        this.strafeDir *= -1;
        this.pos.x += rand(0.3, -0.3); this.pos.z += rand(0.3, -0.3);
      }
      this.lastPos.copy(this.pos);
      this.stuckT = 0;
    }

    // dönüş
    var faceYaw;
    if (this.seenT > 0 || dist < 4) faceYaw = Math.atan2(dx, dz);
    else faceYaw = Math.atan2(this.vel.x, this.vel.z);
    if (moveSpeed > 0.2 || this.seenT > 0) {
      var diff = ((faceYaw - this.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.yaw += diff * Math.min(1, dt * 7);
    }
    this.root.position.set(this.pos.x, 0, this.pos.z);
    this.root.rotation.y = this.yaw;

    // animasyon
    var cad = Math.min(moveSpeed / 3.2, 1.3);
    this.walkPhase += dt * (3.2 + cad * 7.5);
    var sw = Math.sin(this.walkPhase);
    av.legL.rotation.x = sw * 0.72 * cad;
    av.legR.rotation.x = -sw * 0.72 * cad;
    var aiming = !melee && (this.seenT > 0 || this.painT > 0);
    if (aiming && !isZombieAI) {
      av.armR.rotation.x = -1.42 + this.painT * 1.2;
      av.armR.rotation.y = 0;
      av.armL.rotation.x = -1.25;
      av.armL.rotation.y = 0.5;
    } else if (melee && !isZombieAI) {
      av.armR.rotation.x = -0.6 + Math.sin(this.walkPhase) * 0.5 * cad;
      av.armR.rotation.y = 0;
      av.armL.rotation.x = sw * 0.7 * cad;
      av.armL.rotation.y = 0;
    } else if (!isZombieAI) {
      av.armR.rotation.x = -sw * 0.55 * cad;
      av.armL.rotation.x = sw * 0.55 * cad;
      av.armR.rotation.y = 0; av.armL.rotation.y = 0;
    }
    av.root.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.035 * cad;
    if (isZombieAI) {
      // zombi: kollar hep ileri, topallayan bacak, sallanan kafa
      av.armL.rotation.x = -1.35 + Math.sin(this.walkPhase * 0.9) * 0.18;
      av.armR.rotation.x = -1.45 + Math.cos(this.walkPhase * 0.9) * 0.18;
      av.armL.rotation.y = 0.1; av.armR.rotation.y = -0.1;
      av.head.rotation.z = Math.sin(this.walkPhase * 0.5) * 0.16;
      av.root.position.y = Math.abs(Math.sin(this.walkPhase)) * 0.05 * cad;
      av.legL.rotation.x = sw * 0.55 * cad;
      av.legR.rotation.x = -sw * 0.45 * cad;
    }

    // ---- ATEŞ ----
    this.fireCd -= dt;
    if (melee) {
      if (dist < 2.0 && this.meleeCd <= 0 && this.seenT > 0 && G.state === 'playing') {
        this.meleeCd = isZombieAI ? 1.35 : 1.0;
        Effects.slash(this.pos, this.yaw);
        if (isZombieAI) Audio2.zombie ? Audio2.zombie() : Audio2.knife();
        else Audio2.knife();
        setTimeout((function (self) {
          return function () {
            if (self.dead || G.state !== 'playing') return;
            var d = Math.hypot(player.pos.x - self.pos.x, player.pos.z - self.pos.z);
            if (d < 2.4) hurtPlayer(self.def.bdmg * rand(1.15, 0.8), self.pos);
          };
        })(this), 160);
      }
    } else if (this.seenT > 0 && dist < 34 && G.state === 'playing') {
      this.reactT -= dt;
      if (this.reactT <= 0 && this.fireCd <= 0) {
        var wd = WEAPONS[def.weapon];
        this.fireCd = def.brate * rand(1.3, 0.8) * clamp(1 - (this.wave - 1) * 0.012, 0.78, 1);
        this.shoot(dist, dirX, dirZ);
      }
    }
  };

  Bot.prototype.shoot = function (dist, dirX, dirZ) {
    var wd = WEAPONS[this.def.weapon];
    var mz = this.muzzlePos();
    // nişan hatası: mesafe + hareket + zorluk
    var moving = Math.hypot(player.vel.x, player.vel.z) > 3.2;
    var acc = this.accuracy * (1 + dist * 0.028) * (moving ? 1.25 : 1) * (player.crouch ? 1.15 : 1);
    acc *= (0.7 + Math.random() * 0.75);
    var hit = Math.random() > acc;
    var target = V3(
      player.pos.x + (hit ? rand(2.2, -2.2) : rand(0.22, -0.22)),
      player.pos.y + (hit ? rand(0.4, -0.8) : rand(1.5, 0.9)),
      player.pos.z + (hit ? rand(2.2, -2.2) : rand(0.22, -0.22))
    );
    Effects.tracer(mz, target, 0xffc879, 0.06);
    Effects.muzzleSmoke(mz, this.yaw);
    this.muzzle = 0.06;
    Audio2.enemyGun(wd.id, dist);
    if (!hit) {
      var dmg = this.def.bdmg * rand(1.1, 0.75) * (1 + Math.min(0.5, G.wave * 0.025));
      hurtPlayer(dmg, this.pos);
    }
    // ateş ederken hep oyuncuya döner
    this.yaw = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
  };

  /* ==================================================================
     EFEKTLER (havuzlu)
  ================================================================== */
  var Effects = (function () {
    var tracerPool = [], sparkPool = [], liveTracers = [], liveSparks = [];
    var tracerGeo = new T.BoxGeometry(0.035, 0.035, 1);
    var sparkGeo = new T.PlaneGeometry(1, 1);
    for (var i = 0; i < 46; i++) {
      var m = new T.Mesh(tracerGeo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false }));
      m.visible = false; scene.add(m); tracerPool.push(m);
    }
    for (var j = 0; j < 90; j++) {
      var sm = new T.Mesh(sparkGeo, new T.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      sm.visible = false; scene.add(sm); sparkPool.push(sm);
    }
    return {
      tracer: function (a, b, color, width) {
        var m = tracerPool.pop();
        if (!m) { m = liveTracers.shift().mesh; }
        var len = a.distanceTo(b);
        m.position.copy(a).lerp(b, 0.5);
        m.lookAt(b);
        m.scale.set(width ? width / 0.035 : 1, width ? width / 0.035 : 0.8, len);
        m.material.color.setHex(color || 0xffffff);
        m.material.opacity = 0.9;
        m.visible = true;
        liveTracers.push({ mesh: m, life: 0.075, max: 0.075 });
      },
      sparks: function (pos, n, color) {
        for (var i = 0; i < n; i++) {
          var m = sparkPool.pop();
          if (!m) { var old = liveSparks.shift(); m = old.mesh; }
          m.position.copy(pos);
          m.material.color.setHex(color || 0xffbb55);
          m.material.opacity = 1;
          m.visible = true;
          m.scale.setScalar(rand(0.16, 0.05));
          liveSparks.push({
            mesh: m, life: rand(0.5, 0.2),
            v: V3(rand(3, -3), rand(4.5, 1), rand(3, -3))
          });
        }
      },
      blood: function (pos, n) {
        this.sparks(pos, n, 0xb01a1a);
      },
      muzzleSmoke: function (pos, yaw) {
        this.sparks(pos, 2, 0xffd08a);
      },
      slash: function (pos, yaw) {
        this.sparks(V3(pos.x, 1.2, pos.z), 6, 0xffffff);
      },
      update: function (dt) {
        for (var i = liveTracers.length - 1; i >= 0; i--) {
          var t = liveTracers[i];
          t.life -= dt;
          t.mesh.material.opacity = Math.max(0, t.life / t.max);
          if (t.life <= 0) { t.mesh.visible = false; tracerPool.push(t.mesh); liveTracers.splice(i, 1); }
        }
        for (var j = liveSparks.length - 1; j >= 0; j--) {
          var s = liveSparks[j];
          s.life -= dt;
          s.v.y -= 13 * dt;
          s.mesh.position.addScaledVector(s.v, dt);
          s.mesh.material.opacity = Math.max(0, s.life * 2.2);
          s.mesh.lookAt(camera.position);
          if (s.life <= 0) { s.mesh.visible = false; sparkPool.push(s.mesh); liveSparks.splice(j, 1); }
        }
      }
    };
  })();

  /* ==================================================================
     YERDEN ALINAN EŞYALAR
  ================================================================== */
  var pickups = [];
  function spawnPickup(kind, x, z) {
    var g = new T.Group();
    if (kind === 'health') {
      var b = new T.Mesh(new T.BoxGeometry(0.46, 0.46, 0.16), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6, emissive: 0x223322, emissiveIntensity: 0.4 }));
      var c1 = new T.Mesh(new T.BoxGeometry(0.3, 0.1, 0.04), new T.MeshStandardMaterial({ color: 0xd83030, emissive: 0x992222, emissiveIntensity: 0.6 }));
      var c2 = new T.Mesh(new T.BoxGeometry(0.1, 0.3, 0.04), new T.MeshStandardMaterial({ color: 0xd83030, emissive: 0x992222, emissiveIntensity: 0.6 }));
      c1.position.z = 0.08; c2.position.z = 0.08;
      g.add(b, c1, c2);
    } else {
      var bm = new T.Mesh(new T.BoxGeometry(0.44, 0.28, 0.28), new T.MeshStandardMaterial({ color: 0x5f6b3d, roughness: 0.7 }));
      var band = new T.Mesh(new T.BoxGeometry(0.46, 0.06, 0.3), new T.MeshStandardMaterial({ color: 0xd8b34a, roughness: 0.5, emissive: 0x554411, emissiveIntensity: 0.4 }));
      g.add(bm, band);
    }
    g.position.set(x, 0.55, z);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    var p = { mesh: g, kind: kind, pos: V3(x, 0.55, z), t: 0 };
    pickups.push(p);
    return p;
  }
  function updatePickups(dt) {
    for (var i = pickups.length - 1; i >= 0; i--) {
      var p = pickups[i];
      p.t += dt;
      p.mesh.rotation.y += dt * 1.9;
      p.mesh.position.y = 0.55 + Math.sin(p.t * 2.2) * 0.12;
      if (G.state !== 'playing') continue;
      var d = Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z);
      if (d < 1.7) {
        if (p.kind === 'health') {
          if (player.hp >= player.maxHp) continue;
          player.hp = Math.min(player.maxHp, player.hp + 25);
          hint('+25 SAĞLIK', 1.2);
        } else {
          var keys2 = Object.keys(player.owned).filter(function (k) { return player.owned[k] && !WEAPONS[k].melee; });
          if (!keys2.length) continue;
          var wk = keys2[keys2.length - 1];
          player.res[wk] = (player.res[wk] || 0) + 24;
          hint('+24 CEPHANE', 1.2);
        }
        Audio2.buy();
        scene.remove(p.mesh);
        pickups.splice(i, 1);
      } else if (p.t > 32) {
        scene.remove(p.mesh); pickups.splice(i, 1);
      }
    }
  }
  function clearPickups() {
    pickups.forEach(function (p) { scene.remove(p.mesh); });
    pickups.length = 0;
  }
