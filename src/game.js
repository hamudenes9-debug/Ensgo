/* =====================================================================
   TEL ÖRGÜ MAHALLE — Mahalle Kuşatması
   Tek dosya FPS. Three.js (MIT) gömülü, tüm görseller/sesler prosedürel.
   ===================================================================== */
(function () {
  'use strict';
  var T = THREE;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rand = function (a, b) { return b + Math.random() * (a - b); };
  var randInt = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  var pick = function (a) { return a[(Math.random() * a.length) | 0]; };
  var nowS = function () { return performance.now() / 1000; };
  var V3 = function (x, y, z) { return new T.Vector3(x, y, z); };

  /* ------------------------------------------------------------------
     SABİTLER
  ------------------------------------------------------------------ */
  var HALF = 55;              // oyun alanı yarı genişliği (büyük map)
  var FENCE = 54;             // tel örgü çizgisi
  var EYE = 1.72;             // göz yüksekliği (geniş haritada daha ferah görüş)
  var GRAV = 22;
  var STEP = 0.1;

  var WEAPONS = {
    knife: {
      id: 'knife', name: 'BIÇAK', slot: 0, melee: true, price: 0,
      dmg: 62, rate: 0.62, range: 3.0, mag: 0, reserve: 0, spread: 0,
      recoil: 0, auto: false, zoom: 1.15, sound: 'knife'
    },
    pistol: {
      id: 'pistol', name: 'TABANCA', slot: 1, price: 300, dmg: 27, rate: 0.155,
      mag: 12, reserve: 72, spread: 0.014, recoil: 1.05, auto: false,
      reload: 1.15, zoom: 1.55, sound: 'pistol', tracer: 0xffd27a
    },
    m4a4: {
      id: 'm4a4', name: 'M4A4', slot: 2, price: 1850, dmg: 34, rate: 0.098,
      mag: 30, reserve: 150, spread: 0.0095, recoil: 0.62, auto: true,
      reload: 2.15, zoom: 1.7, sound: 'm4', tracer: 0xfff0b0
    },
    ak47: {
      id: 'ak47', name: 'AK-47', slot: 2, price: 2750, dmg: 43, rate: 0.104,
      mag: 30, reserve: 150, spread: 0.016, recoil: 1.3, auto: true,
      reload: 2.4, zoom: 1.55, sound: 'ak', tracer: 0xffc46a
    }
  };

  // bdmg = botun oyuncuya verdiği hasar (oyuncu silahlarından bağımsız dengelenmiş)
  // Devlet kontrol noktası askerleri (ilk dalgalar) + zombiler (sonraki dalgalar)
  // Bizim tarafımızdaki devlet devriyesi (düşman değil, dost asker)
  var ALLY_TYPES = {
    devriye: { key: 'devriye', name: 'DEVRİYE', hp: 190, speed: 4.4, weapon: 'm4a4', dmg: 16, rate: 0.26,
      color: 0x4a5a3a, alive: true }
  };

  var ENEMY_TYPES = {
    soldier: { key: 'soldier', name: 'DEVLET ASKERİ', hp: 150, speed: 3.1, weapon: 'm4a4', money: 120,
      acc: 0.115, react: 0.42, bdmg: 13, brate: 0.5, soldier: true },
    sergeant: { key: 'sergeant', name: 'ÇAVUŞ', hp: 260, speed: 2.7, weapon: 'ak47', money: 210,
      acc: 0.14, react: 0.5, bdmg: 18, brate: 0.62, soldier: true },
    walker: { key: 'walker', name: 'ZOMBİ', hp: 110, speed: 2.95, weapon: 'claw', money: 90,
      acc: 0.02, react: 0.3, bdmg: 12, brate: 1.4, zombie: true },
    runner: { key: 'runner', name: 'KOŞAN ZOMBİ', hp: 80, speed: 5.1, weapon: 'claw', money: 110,
      acc: 0.02, react: 0.2, bdmg: 10, brate: 1.2, zombie: true },
    brute: { key: 'brute', name: 'DEV ZOMBİ', hp: 480, speed: 2.5, weapon: 'claw', money: 300,
      acc: 0.02, react: 0.4, bdmg: 26, brate: 1.7, zombie: true, scale: 1.25 }
  };

  var BOT_TYPES = {
    thug: { key: 'thug', name: 'SERSERİ', hp: 100, speed: 3.15, weapon: 'pistol', money: 70, acc: 0.155, react: 0.55, bdmg: 9, brate: 0.62 },
    rifleman: { key: 'rifleman', name: 'TETİKÇİ', hp: 125, speed: 3.0, weapon: 'm4a4', money: 105, acc: 0.125, react: 0.46, bdmg: 12, brate: 0.52 },
    akman: { key: 'akman', name: 'AKÇI', hp: 140, speed: 2.85, weapon: 'ak47', money: 130, acc: 0.13, react: 0.5, bdmg: 15, brate: 0.6 },
    heavy: { key: 'heavy', name: 'KASLI', hp: 235, speed: 2.3, weapon: 'ak47', money: 190, acc: 0.15, react: 0.62, bdmg: 20, brate: 0.86 },
    knifer: { key: 'knifer', name: 'BIÇAKÇI', hp: 95, speed: 4.3, weapon: 'knife', money: 85, acc: 0.02, react: 0.3, bdmg: 15, brate: 1.1 }
  };

  var ZOMBIE_NAMES = ['Hasta Sıfır', 'Çürük', 'Kanlı Kemal', 'Sürünen', 'Isıran', 'Kemik', 'Yaşayan Ölü',
    'Tırnak', 'Gözsüz', 'Sarı Surat', 'Paslı', 'Kurtlu', 'Sessiz', 'Kefen', 'Mezar Kaçkını'];
  var SOLDIER_NAMES = ['Onbaşı Erdem', 'Çavuş Tolga', 'Nöbetçi', 'Komando', 'Sınır Bekçisi',
    'Devriye', 'Zabıta', 'Kıdemli Er', 'Kalkan', 'Kontrol Noktası'];

  var BOT_NAMES = ['Kel Ali', 'Delikanlı', 'Sarı Selim', 'Karaoğlan', 'Çengel', 'Tırnakçı', 'Bıçkın',
    'Maço', 'Kabadayı', 'Sokak Çocuğu', 'Fırlama', 'Zeybek', 'Kör Şükrü', 'Şamar', 'Kanca',
    'Çakal', 'Yumruk', 'Kasap', 'Fitil', 'Fırtına', 'Serseri Kemal', 'Ters Adam', 'Kılıç'];

  /* ------------------------------------------------------------------
     DURUM
  ------------------------------------------------------------------ */
  var G = {
    state: 'menu', t: 0, dt: 0, ui: 0,
    money: 0, wave: 0, kills: 0, headshots: 0, best: 0, waveKills: 0,
    waveActive: false, shopTimer: 0, spawnQueue: [], spawnTimer: 0,
    enemiesLeft: 0, quality: 1, sens: 1, vol: 0.7, muted: false,
    pointerLocked: false, dragLook: false, started: false, dead: false,
    hitFlash: 0, shake: 0, slowmo: 0, waveMsgT: 0
  };
  window.__MAHALLE__ = G;   // hata ayıklama / test kancası

  /* ------------------------------------------------------------------
     RENDERER / SAHNE
  ------------------------------------------------------------------ */
  var canvas = $('game');
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
  } catch (e) { renderer = null; }
  var HAS_GL = !!renderer;
  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
  }

  var scene = new T.Scene();
  scene.background = new T.Color(0x9fb6cc);
  scene.fog = new T.Fog(0x9fb6cc, 46, 118);

  var camera = new T.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.04, 260);
  camera.rotation.order = 'YXZ';
  camera.position.set(0, EYE, 16);
  scene.add(camera);

  var hemi = new T.HemisphereLight(0xbdd7f2, 0x5b4a3a, 0.85);
  scene.add(hemi);
  var sun = new T.DirectionalLight(0xffd3a1, 1.75);
  sun.position.set(-42, 54, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -58; sun.shadow.camera.right = 58;
  sun.shadow.camera.top = 58; sun.shadow.camera.bottom = -58;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 190;
  sun.shadow.bias = -0.0009;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);
  var fill = new T.DirectionalLight(0x8fb4ff, 0.35);
  fill.position.set(30, 26, -40);
  scene.add(fill);
  var ambient = new T.AmbientLight(0x8fa7bd, 0.35);
  scene.add(ambient);

  /* ------------------------------------------------------------------
     DOKULAR (prosedürel canvas)
  ------------------------------------------------------------------ */
  function cvs(w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    return { c: c, x: c.getContext('2d') };
  }
  function toTex(o, rx, ry) {
    var t = new T.CanvasTexture(o.c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    if (T.sRGBEncoding) t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }
  function noise(g, w, h, n, a, dark) {
    for (var i = 0; i < n; i++) {
      var s = rand(2.4, 0.4);
      g.fillStyle = 'rgba(' + (dark ? '0,0,0,' : '255,255,255,') + rand(a, a * 0.15) + ')';
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
  }

  // Asfalt
  function asphaltTex() {
    var o = cvs(256, 256), g = o.x;
    g.fillStyle = '#3b3f45'; g.fillRect(0, 0, 256, 256);
    noise(g, 256, 256, 5000, 0.30);
    for (var i = 0; i < 16; i++) {
      g.strokeStyle = 'rgba(20,22,25,.4)'; g.lineWidth = rand(2, 0.6);
      g.beginPath(); var x = rand(256, 0), y = rand(256, 0);
      g.moveTo(x, y); g.lineTo(x + rand(60, -60), y + rand(60, -60)); g.stroke();
    }
    return o;
  }
  // Kaldırım taşı
  function paveTex() {
    var o = cvs(256, 256), g = o.x;
    g.fillStyle = '#8d8a83'; g.fillRect(0, 0, 256, 256);
    noise(g, 256, 256, 2600, 0.22);
    g.strokeStyle = 'rgba(50,48,44,.55)'; g.lineWidth = 2;
    for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) {
      g.strokeRect(x * 64 + 2, y * 64 + 2, 60, 60);
    }
    return o;
  }
  // Beton/sıvalı cephe + pencereler
  function facadeTex(base, floors, cols, style) {
    var W = 256, H = 256, o = cvs(W, H), g = o.x;
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    noise(g, W, H, 4200, 0.16);
    noise(g, W, H, 1400, 0.14, true);
    // sıva lekeleri
    for (var s = 0; s < 14; s++) {
      var gr = g.createLinearGradient(rand(W, 0), 0, rand(W, 0), H);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,.07)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    var cw = W / cols, ch = H / floors;
    for (var r = 0; r < floors; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * cw + cw * 0.24, y = r * ch + ch * 0.18;
        var w = cw * 0.52, h = ch * 0.52;
        // çerçeve
        g.fillStyle = style === 'brick' ? '#d9d2c4' : '#cfcabf';
        g.fillRect(x - 3, y - 3, w + 6, h + 6);
        // cam
        var lit = Math.random() < 0.28;
        var gg = g.createLinearGradient(x, y, x + w, y + h);
        if (lit) { gg.addColorStop(0, '#ffd68a'); gg.addColorStop(1, '#f0a94d'); }
        else { gg.addColorStop(0, '#4a6274'); gg.addColorStop(0.55, '#2b3f4e'); gg.addColorStop(1, '#1b2b36'); }
        g.fillStyle = gg; g.fillRect(x, y, w, h);
        // cam bölmesi
        g.strokeStyle = 'rgba(230,235,240,.75)'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h);
        g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
        // parlaklık
        g.fillStyle = 'rgba(255,255,255,.10)';
        g.beginPath(); g.moveTo(x, y + h * 0.75); g.lineTo(x + w * 0.7, y); g.lineTo(x + w, y);
        g.lineTo(x, y + h); g.closePath(); g.fill();
        // denizlik
        g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(x - 4, y + h + 3, w + 8, 3);
      }
      // kat silmesi
      g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, r * ch + ch - 4, W, 2);
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, r * ch + ch - 1, W, 2);
    }
    // zemin kat (dükkan) bandı
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, H - ch * 0.55, W, ch * 0.55);
    noise(g, W, H, 700, 0.1, true);
    return o;
  }
  // Tuğla
  function brickTex() {
    var o = cvs(256, 256), g = o.x;
    g.fillStyle = '#8e5a44'; g.fillRect(0, 0, 256, 256);
    var bh = 16, bw = 40;
    for (var r = 0; r < 16; r++) {
      for (var c = -1; c < 7; c++) {
        var off = (r % 2) * bw * 0.5;
        var col = 150 + randInt(-26, 24);
        g.fillStyle = 'rgb(' + col + ',' + (col * 0.62 | 0) + ',' + (col * 0.48 | 0) + ')';
        g.fillRect(c * bw + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    }
    noise(g, 256, 256, 2400, 0.13, true);
    return o;
  }
  // Tel örgü (şeffaf)
  function fenceTex() {
    var o = cvs(128, 128), g = o.x;
    g.clearRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(196,201,208,.92)'; g.lineWidth = 2.1;
    for (var i = -128; i < 256; i += 16) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
      g.beginPath(); g.moveTo(i, 128); g.lineTo(i + 128, 0); g.stroke();
    }
    return o;
  }
  // Beton
  function concreteTex() {
    var o = cvs(128, 128), g = o.x;
    g.fillStyle = '#9a9992'; g.fillRect(0, 0, 128, 128);
    noise(g, 128, 128, 2200, 0.2);
    noise(g, 128, 128, 900, 0.16, true);
    return o;
  }
  // Duvar grafiti
  function graffitiTex() {
    var o = cvs(256, 128), g = o.x;
    g.clearRect(0, 0, 256, 128);
    var cols = ['#ff3b6b', '#3bd7ff', '#ffe23b', '#a45bff', '#3bff9c'];
    for (var i = 0; i < 5; i++) {
      g.strokeStyle = pick(cols); g.lineWidth = rand(14, 5); g.lineCap = 'round';
      g.beginPath();
      var x = rand(220, 20), y = rand(90, 30);
      g.moveTo(x, y);
      g.bezierCurveTo(x + rand(60, -60), y + rand(50, -50), x + rand(110, -40), y + rand(60, -60), x + rand(120, 20), y + rand(50, -50));
      g.stroke();
    }
    return o;
  }

  // Tabela dokusu
  function signTex(text, bg, fg, sub) {
    var o = cvs(512, 128), g = o.x;
    g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
    // kenar ışığı
    var gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,255,255,.22)');
    gr.addColorStop(0.5, 'rgba(255,255,255,0)');
    gr.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6; g.strokeRect(3, 3, 506, 122);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = fg;
    g.font = 'bold ' + (sub ? 54 : 66) + 'px "Trebuchet MS", Arial, sans-serif';
    g.fillText(text, 256, sub ? 54 : 66);
    if (sub) {
      g.font = 'bold 26px "Trebuchet MS", Arial, sans-serif';
      g.fillStyle = 'rgba(255,255,255,.72)';
      g.fillText(sub, 256, 98);
    }
    noise(g, 512, 128, 420, 0.05, true);
    var t = new T.CanvasTexture(o.c);
    if (T.sRGBEncoding) t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  var TEX = {
    asphalt: toTex(asphaltTex(), 10, 10),
    pave: toTex(paveTex(), 2, 2),
    brick: toTex(brickTex(), 1, 1),
    concrete: toTex(concreteTex(), 1, 1),
    fence: toTex(fenceTex(), 1, 1),
    graffiti: toTex(graffitiTex(), 1, 1)
  };
  TEX.fence.wrapS = TEX.fence.wrapT = T.RepeatWrapping;

  var LAMP_MATS = [];
  var LAMP_HALOS = [];
  var LAMP_SPOTS = [];
  var MAT = {
    asphalt: new T.MeshStandardMaterial({ map: TEX.asphalt, roughness: 0.94, metalness: 0.02, color: 0xb9bcc0 }),
    pave: new T.MeshStandardMaterial({ map: TEX.pave, roughness: 0.9, color: 0xd8d4cc }),
    curb: new T.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.85 }),
    concrete: new T.MeshStandardMaterial({ map: TEX.concrete, roughness: 0.9, color: 0xcfcdc6 }),
    metal: new T.MeshStandardMaterial({ color: 0x8d949c, roughness: 0.45, metalness: 0.75 }),
    darkMetal: new T.MeshStandardMaterial({ color: 0x3c434b, roughness: 0.55, metalness: 0.6 }),
    fence: new T.MeshStandardMaterial({ map: TEX.fence, transparent: true, alphaTest: 0.42, roughness: 0.4, metalness: 0.85, side: T.DoubleSide, color: 0xd9dee4 }),
    wood: new T.MeshStandardMaterial({ color: 0x8a5f3c, roughness: 0.85 }),
    woodDark: new T.MeshStandardMaterial({ color: 0x5d3f28, roughness: 0.9 }),
    trunk: new T.MeshStandardMaterial({ color: 0x5b4632, roughness: 0.95 }),
    leaf: new T.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.92, flatShading: true }),
    leaf2: new T.MeshStandardMaterial({ color: 0x4f8f40, roughness: 0.92, flatShading: true }),
    glass: new T.MeshStandardMaterial({ color: 0x1c2a34, roughness: 0.18, metalness: 0.85 }),
    lampWarm: new T.MeshStandardMaterial({ color: 0xffe2ab, emissive: 0xffbb55, emissiveIntensity: 1.5, roughness: 0.4 }),
    red: new T.MeshStandardMaterial({ color: 0xa3302c, roughness: 0.7 }),
    white: new T.MeshStandardMaterial({ color: 0xe9e7e1, roughness: 0.75 }),
    black: new T.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.7 }),
    water: new T.MeshStandardMaterial({ color: 0x3b6f7d, roughness: 0.15, metalness: 0.5 }),
    gravel: new T.MeshStandardMaterial({ color: 0x6f6a60, roughness: 1 }),
    tarp: new T.MeshStandardMaterial({ color: 0x2f6f57, roughness: 0.9, side: T.DoubleSide })
  };

  /* ------------------------------------------------------------------
     DÜNYA
  ------------------------------------------------------------------ */
  var COL = [];       // 2B çarpışma kutuları {minX,maxX,minZ,maxZ}
  var SOLIDS = [];    // nişan/işaret ışını için meshler
  var world = new T.Group();
  scene.add(world);

  function addCol(x, z, w, d, rot) {
    var hw = w / 2, hd = d / 2;
    if (rot) { var a = Math.abs(Math.cos(rot)), b = Math.abs(Math.sin(rot)); var W = w * a + d * b, D = w * b + d * a; hw = W / 2; hd = D / 2; }
    COL.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  }
  function solid(mesh, castShadow, receive) {
    mesh.castShadow = castShadow !== false;
    mesh.receiveShadow = receive !== false;
    world.add(mesh);
    SOLIDS.push(mesh);
    return mesh;
  }
  function boxMesh(w, h, d, mat) {
    return new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  }
  function boxAt(x, y, z, w, h, d, mat, rot, noSolid) {
    var m = boxMesh(w, h, d, mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.y = rot;
    world.add(m);
    m.castShadow = true; m.receiveShadow = true;
    if (!noSolid) SOLIDS.push(m);
    return m;
  }

  // --- Zemin ---
  function buildGround() {
    var g = new T.Mesh(new T.PlaneGeometry(HALF * 2, HALF * 2), MAT.asphalt);
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; world.add(g);

    // dış zemin (ufuk için)
    var outer = new T.Mesh(new T.PlaneGeometry(260, 260),
      new T.MeshStandardMaterial({ color: 0x4a4d50, roughness: 1 }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.06; world.add(outer);

    // Meydan (taş döşeme) — çeşmenin etrafı
    var plaza = boxMesh(19, 0.06, 17, MAT.pave);
    plaza.position.set(0, 0.03, 3.5); plaza.receiveShadow = true; world.add(plaza);

    // Kaldırımlar: ana caddenin iki yakası + çapraz sokağın iki yakası
    function sidewalk(x, z, w, d) {
      var m = boxMesh(w, 0.18, d, MAT.pave);
      m.position.set(x, 0.09, z); m.receiveShadow = true;
      world.add(m);
      var c = boxMesh(w, 0.20, 0.24, MAT.curb);
      c.position.set(x, 0.10, z + d / 2); world.add(c);
      var c2 = boxMesh(w, 0.20, 0.24, MAT.curb);
      c2.position.set(x, 0.10, z - d / 2); world.add(c2);
    }
    function sidewalkV(x, z, w, d) {
      var m = boxMesh(w, 0.18, d, MAT.pave);
      m.position.set(x, 0.09, z); m.receiveShadow = true;
      world.add(m);
      var c = boxMesh(0.24, 0.20, d, MAT.curb);
      c.position.set(x + w / 2, 0.10, z); world.add(c);
      var c2 = boxMesh(0.24, 0.20, d, MAT.curb);
      c2.position.set(x - w / 2, 0.10, z); world.add(c2);
    }
    sidewalk(0, -6.6, 106, 3.4);     // ana cadde kuzey yakası
    sidewalk(0, 14.8, 106, 3.4);     // ana cadde güney yakası
    sidewalkV(-14.6, 3.5, 3.4, 18);  // çapraz sokak batı yakası
    sidewalkV(8.6, 3.5, 3.4, 18);    // çapraz sokak doğu yakası

    // Yol çizgileri (ana cadde z=4, çapraz sokak x=-3)
    var lineMat = new T.MeshStandardMaterial({ color: 0xe8e2c8, roughness: 0.9 });
    for (var i = -50; i < 52; i += 7) {
      var dash = new T.Mesh(new T.PlaneGeometry(3.4, 0.26), lineMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(i, 0.075, 4);
      world.add(dash);
    }
    for (var j = -52; j < 52; j += 7) {
      if (j > -6 && j < 14) continue;
      var dash2 = new T.Mesh(new T.PlaneGeometry(0.26, 3.4), lineMat);
      dash2.rotation.x = -Math.PI / 2; dash2.position.set(-3, 0.075, j);
      world.add(dash2);
    }
    // yaya geçidi
    for (var k = 0; k < 6; k++) {
      var zb = new T.Mesh(new T.PlaneGeometry(0.55, 2.4), lineMat);
      zb.rotation.x = -Math.PI / 2; zb.position.set(-9.2 + k * 1.05, 0.075, -2.6);
      world.add(zb);
    }
    // rögar + su birikintisi
    var man = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.05, 16), MAT.darkMetal);
    man.position.set(-6.5, 0.078, 10.2); world.add(man);
    var pad = new T.Mesh(new T.CircleGeometry(2.2, 20),
      new T.MeshStandardMaterial({ color: 0x2c3438, roughness: 0.12, metalness: 0.65 }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(12.5, 0.077, -1.2); world.add(pad);
    // sokak ortası ada (trafik adası)
    var island = new T.Mesh(new T.CircleGeometry(1.6, 18), MAT.curb);
    island.rotation.x = -Math.PI / 2; island.position.set(-3, 0.08, -12.5); world.add(island);
  }

  // --- Bina ---
  function buildBuilding(cx, cz, w, d, floors, opts) {
    opts = opts || {};
    var h = floors * 3.1 + 0.9;
    var style = opts.style || 'plaster';
    var baseCol = opts.color || '#c9bda7';
    var colsW = Math.max(2, Math.round(w / 3.3));
    var colsD = Math.max(2, Math.round(d / 3.3));
    var ftW = toTex(facadeTex(baseCol, floors, colsW, style), 1, 1);
    var ftD = toTex(facadeTex(baseCol, floors, colsD, style), 1, 1);
    var wallW = new T.MeshStandardMaterial({ map: ftW, roughness: 0.88, metalness: 0.02 });
    var wallD = new T.MeshStandardMaterial({ map: ftD, roughness: 0.88, metalness: 0.02 });
    var roofMat = new T.MeshStandardMaterial({ color: 0x6d675e, roughness: 0.95 });

    var body = boxMesh(w, h, d, [wallD, wallD, MAT.concrete, MAT.concrete, wallW, wallW]);
    body.position.set(cx, h / 2, cz);
    solid(body);
    addCol(cx, cz, w, d, 0);

    // çatı parapeti
    var pf = boxMesh(w + 0.5, 0.55, d + 0.5, MAT.concrete);
    pf.position.set(cx, h + 0.2, cz); solid(pf);
    // çatı
    var roof = boxMesh(w - 0.6, 0.2, d - 0.6, roofMat);
    roof.position.set(cx, h + 0.02, cz); world.add(roof);

    // çatı detayları
    if (Math.random() < 0.8) {
      var tank = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 1.3, 10), MAT.metal);
      tank.position.set(cx + rand(w / 3, -w / 3), h + 0.85, cz + rand(d / 3, -d / 3));
      tank.castShadow = true; world.add(tank);
    }
    if (Math.random() < 0.6) {
      var ant = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.4, 5), MAT.darkMetal);
      ant.position.set(cx + rand(w / 3, -w / 3), h + 1.4, cz + rand(d / 3, -d / 3));
      world.add(ant);
    }

    // zemin kat: kepenk / dükkan
    if (opts.shop) {
      var signW = Math.min(w * 0.78, 9.5);
      var sTex = signTex(opts.sign || 'BAKKAL', opts.signBg || '#8f2f2a', '#fff6e0', opts.signSub);
      var st = new T.MeshStandardMaterial({ map: sTex, roughness: 0.55, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 0.32 });
      var signM = new T.Mesh(new T.PlaneGeometry(signW, signW * 0.25), st);
      signM.position.set(cx, 3.15, cz + d / 2 + 0.14);
      world.add(signM);
      var sBack = boxMesh(signW + 0.2, signW * 0.25 + 0.2, 0.12, new T.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.7 }));
      sBack.position.set(cx, 3.15, cz + d / 2 + 0.07);
      solid(sBack);

      var shutter = boxMesh(w * 0.66, 2.5, 0.12, new T.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.55, metalness: 0.55 }));
      shutter.position.set(cx, 1.35, cz + d / 2 + 0.10); solid(shutter);
      // tente
      var aw = boxMesh(w * 0.7, 0.1, 1.5, new T.MeshStandardMaterial({ color: pick([0x2f7f6a, 0xb5433a, 0x2f5f9e]), roughness: 0.8 }));
      aw.position.set(cx, 2.62, cz + d / 2 + 0.8); solid(aw);
    }
    // balkonlar
    var nb = Math.min(2, Math.max(1, Math.round(w / 7)));
    for (var b = 0; b < nb; b++) {
      if (Math.random() < 0.65) {
        var bx = cx - w / 2 + (w / (nb + 1)) * (b + 1);
        var by = 3.0 + Math.floor(rand(floors - 1, 1)) * 3.1;
        var slab = boxMesh(3.0, 0.16, 1.1, MAT.concrete);
        slab.position.set(bx, by, cz + d / 2 + 0.5); solid(slab);
        var rail = boxMesh(3.0, 0.85, 0.06, MAT.darkMetal);
        rail.position.set(bx, by + 0.5, cz + d / 2 + 1.02); world.add(rail);
        // çamaşır ipi
        if (Math.random() < 0.4) {
          var lw = boxMesh(1.9, 0.02, 0.02, MAT.darkMetal);
          lw.position.set(bx, by + 1.55, cz + d / 2 + 0.85); world.add(lw);
          for (var q = 0; q < 3; q++) {
            var cloth = boxMesh(0.42, 0.6, 0.02, new T.MeshStandardMaterial({ color: pick([0xffffff, 0xd84545, 0x4a7fc1, 0xe9c46a, 0x6fbf73]), roughness: 0.95, side: T.DoubleSide }));
            cloth.position.set(bx - 0.62 + q * 0.62, by + 1.22, cz + d / 2 + 0.85);
            world.add(cloth);
          }
        }
      }
    }
    // klima
    if (Math.random() < 0.7) {
      var ac = boxMesh(0.8, 0.5, 0.42, MAT.white);
      ac.position.set(cx + rand(w / 3, -w / 3), rand(4.6, 2.4), cz + d / 2 + 0.24);
      ac.castShadow = true; world.add(ac);
    }
    // uydu anteni
    if (Math.random() < 0.55) {
      var dish = new T.Mesh(new T.SphereGeometry(0.42, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.42), MAT.white);
      dish.rotation.x = 1.1; dish.rotation.y = rand(Math.PI, -Math.PI);
      dish.position.set(cx + rand(w / 3, -w / 3), rand(4.4, 3.2), cz + d / 2 + 0.34);
      dish.castShadow = true; world.add(dish);
    }
    return h;
  }

  // --- Tel örgü ---
  function buildFence() {
    var postGeo = new T.CylinderGeometry(0.075, 0.075, 3.2, 6);
    var step = 4.0;
    function side(ax, az, bx, bz) {
      var len = Math.hypot(bx - ax, bz - az);
      var ang = Math.atan2(bz - az, bx - ax);
      var fmat = MAT.fence.clone();
      fmat.map = MAT.fence.map.clone();
      fmat.map.wrapS = fmat.map.wrapT = T.RepeatWrapping;
      fmat.map.repeat.set(len / 2.0, 1.5);
      fmat.map.needsUpdate = true;
      var mesh = new T.Mesh(new T.PlaneGeometry(len, 3.0), fmat);
      mesh.position.set((ax + bx) / 2, 1.5 + 0.15, (az + bz) / 2);
      mesh.rotation.y = -ang;
      mesh.castShadow = false; mesh.receiveShadow = false;
      world.add(mesh);
      // üst ray
      var rail = boxMesh(len, 0.09, 0.09, MAT.metal);
      rail.position.set((ax + bx) / 2, 3.2, (az + bz) / 2);
      rail.rotation.y = -ang; world.add(rail);
      var rail2 = boxMesh(len, 0.07, 0.07, MAT.metal);
      rail2.position.set((ax + bx) / 2, 0.18, (az + bz) / 2);
      rail2.rotation.y = -ang; world.add(rail2);
      // direkler
      var n = Math.round(len / step);
      for (var i = 0; i <= n; i++) {
        var t = i / n;
        var px = lerp(ax, bx, t), pz = lerp(az, bz, t);
        var p = new T.Mesh(postGeo, MAT.metal);
        p.position.set(px, 1.6, pz); p.castShadow = true; world.add(p);
      }
      // dikenli tel
      var pts = [];
      for (var k = 0; k <= 20; k++) {
        var tt = k / 20;
        pts.push(V3(lerp(ax, bx, tt), 3.35 + Math.sin(tt * 9) * 0.06, lerp(az, bz, tt)));
      }
      var wire = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x9aa2aa }));
      world.add(wire);
      // sınır çarpışması (ince duvar)
      var hw = Math.abs(bx - ax) / 2, hd = Math.abs(bz - az) / 2;
      COL.push({ minX: Math.min(ax, bx) - 0.25, maxX: Math.max(ax, bx) + 0.25, minZ: Math.min(az, bz) - 0.25, maxZ: Math.max(az, bz) + 0.25, fence: true });
    }
    side(-FENCE, -FENCE, FENCE, -FENCE);
    side(FENCE, -FENCE, FENCE, FENCE);
    side(FENCE, FENCE, -FENCE, FENCE);
    side(-FENCE, FENCE, -FENCE, -FENCE);
  }

  // --- Araç ---
  function buildCar(x, z, rot, col) {
    var g = new T.Group();
    var paint = new T.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.6 });
    var body = boxMesh(1.95, 0.62, 4.2, paint); body.position.y = 0.72; g.add(body);
    var cabin = boxMesh(1.76, 0.62, 2.05, paint); cabin.position.set(0, 1.32, -0.12); g.add(cabin);
    var glassF = boxMesh(1.6, 0.46, 0.09, MAT.glass); glassF.position.set(0, 1.34, 0.93); g.add(glassF);
    var glassB = boxMesh(1.6, 0.46, 0.09, MAT.glass); glassB.position.set(0, 1.34, -1.18); g.add(glassB);
    var glassL = boxMesh(0.07, 0.42, 1.7, MAT.glass); glassL.position.set(0.89, 1.34, -0.12); g.add(glassL);
    var glassR = glassL.clone(); glassR.position.x = -0.89; g.add(glassR);
    // far / stop
    var hl = new T.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe9b0, emissiveIntensity: 0.6, roughness: 0.3 });
    var tlm = new T.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xcc1111, emissiveIntensity: 0.55, roughness: 0.4 });
    [0.62, -0.62].forEach(function (ox) {
      var a = boxMesh(0.42, 0.2, 0.08, hl); a.position.set(ox, 0.82, 2.1); g.add(a);
      var b = boxMesh(0.42, 0.18, 0.08, tlm); b.position.set(ox, 0.86, -2.1); g.add(b);
    });
    var wheelGeo = new T.CylinderGeometry(0.34, 0.34, 0.24, 12);
    [[0.96, 1.32], [-0.96, 1.32], [0.96, -1.38], [-0.96, -1.38]].forEach(function (p) {
      var wm = new T.Mesh(wheelGeo, MAT.black);
      wm.rotation.z = Math.PI / 2; wm.position.set(p[0], 0.34, p[1]); g.add(wm);
    });
    g.position.set(x, 0, z); g.rotation.y = rot;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; SOLIDS.push(o); } });
    world.add(g);
    addColOBB(x, z, 2.1, 4.4, rot);
    return g;
  }

  // Dönük kutular için OBB çarpışma kaydı
  function addColOBB(x, z, w, d, rot) {
    var hw = w / 2, hd = d / 2;
    var c = Math.abs(Math.cos(rot)), s2 = Math.abs(Math.sin(rot));
    COL.push({
      minX: x - (w * c + d * s2) / 2, maxX: x + (w * c + d * s2) / 2,
      minZ: z - (w * s2 + d * c) / 2, maxZ: z + (w * s2 + d * c) / 2,
      cx: x, cz: z, hw: hw, hd: hd, rot: rot
    });
  }

  // --- Ağaç ---
  function buildTree(x, z, s) {
    s = s || 1;
    var g = new T.Group();
    var tr = new T.Mesh(new T.CylinderGeometry(0.16 * s, 0.26 * s, 2.2 * s, 7), MAT.trunk);
    tr.position.y = 1.1 * s; tr.castShadow = true; g.add(tr);
    for (var i = 0; i < 4; i++) {
      var f = new T.Mesh(new T.IcosahedronGeometry(rand(1.35, 0.9) * s, 0), i % 2 ? MAT.leaf : MAT.leaf2);
      f.position.set(rand(0.7, -0.7) * s, (2.0 + rand(1.2, 0)) * s, rand(0.7, -0.7) * s);
      f.castShadow = true; f.receiveShadow = true; g.add(f);
    }
    g.position.set(x, 0, z); world.add(g);
    addCol(x, z, 0.7 * s, 0.7 * s);
    return g;
  }

  // --- Sokak lambası ---
  function buildLamp(x, z, flip) {
    var g = new T.Group();
    var pole = new T.Mesh(new T.CylinderGeometry(0.09, 0.13, 6.2, 7), MAT.darkMetal);
    pole.position.y = 3.1; pole.castShadow = true; g.add(pole);
    var arm = boxMesh(1.5, 0.1, 0.1, MAT.darkMetal);
    arm.position.set(flip ? -0.7 : 0.7, 6.15, 0); g.add(arm);
    var head = boxMesh(0.7, 0.18, 0.34, MAT.darkMetal);
    head.position.set(flip ? -1.4 : 1.4, 6.06, 0); g.add(head);
    var bmat = MAT.lampWarm.clone();
    LAMP_MATS.push(bmat);
    var bulb = boxMesh(0.62, 0.07, 0.3, bmat);
    bulb.position.set(flip ? -1.4 : 1.4, 5.95, 0); g.add(bulb);
    // hafif ışık halesi
    var halo = new T.Mesh(new T.SphereGeometry(0.34, 10, 8),
      new T.MeshBasicMaterial({ color: 0xffc277, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false }));
    halo.position.set(flip ? -1.4 : 1.4, 5.94, 0);
    g.add(halo);
    LAMP_HALOS.push(halo);
    g.position.set(x, 0, z); world.add(g);
    addCol(x, z, 0.4, 0.4);
    // gece için nokta ışığı (düşük maliyet: sadece 4 lamba)
    if (LAMP_SPOTS.length < 4) LAMP_SPOTS.push({ x: x + (flip ? -1.4 : 1.4), z: z });
    return g;
  }

  // --- Elektrik direği + teller ---
  function buildPole(x, z) {
    var g = new T.Group();
    var pole = new T.Mesh(new T.CylinderGeometry(0.14, 0.2, 8.2, 7), new T.MeshStandardMaterial({ color: 0x8b8272, roughness: 0.95 }));
    pole.position.y = 4.1; pole.castShadow = true; g.add(pole);
    var cross = boxMesh(1.8, 0.12, 0.12, MAT.woodDark); cross.position.y = 7.5; g.add(cross);
    var cross2 = boxMesh(1.4, 0.1, 0.1, MAT.woodDark); cross2.position.y = 6.9; g.add(cross2);
    g.position.set(x, 0, z); world.add(g);
    addCol(x, z, 0.5, 0.5);
    return g;
  }
  function wireBetween(a, b, sag) {
    var pts = [];
    for (var i = 0; i <= 12; i++) {
      var t = i / 12;
      pts.push(V3(lerp(a.x, b.x, t), lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * (sag || 0.7), lerp(a.z, b.z, t)));
    }
    var l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x2b2b2b }));
    world.add(l);
  }

  // --- Kasa / varil / çöp ---
  function buildCrate(x, z, s, rot) {
    s = s || 1;
    var m = boxMesh(1.1 * s, 1.1 * s, 1.1 * s, MAT.wood);
    m.position.set(x, 0.55 * s, z); m.rotation.y = rot || 0;
    m.castShadow = true; m.receiveShadow = true; world.add(m); SOLIDS.push(m);
    var frame = new T.Mesh(new T.BoxGeometry(1.16 * s, 0.1 * s, 1.16 * s), MAT.woodDark);
    frame.position.set(x, 0.55 * s, z); frame.rotation.y = rot || 0; world.add(frame);
    addCol(x, z, 1.2 * s, 1.2 * s);
    return m;
  }
  function buildBarrel(x, z, col) {
    var m = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 1.15, 12),
      new T.MeshStandardMaterial({ color: col || 0x3f6f4f, roughness: 0.72, metalness: 0.35 }));
    m.position.set(x, 0.58, z); m.castShadow = true; m.receiveShadow = true; world.add(m); SOLIDS.push(m);
    addCol(x, z, 0.9, 0.9);
    return m;
  }
  function buildDumpster(x, z, rot) {
    var col = pick([0x2d6b53, 0x2f5d8a, 0x8a5a2f]);
    var b = boxMesh(2.0, 1.2, 1.25, new T.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.35 }));
    b.position.set(x, 0.66, z); b.rotation.y = rot || 0; b.castShadow = true; b.receiveShadow = true;
    world.add(b); SOLIDS.push(b);
    var lid = boxMesh(2.05, 0.1, 1.3, MAT.darkMetal);
    lid.position.set(x, 1.3, z); lid.rotation.y = rot || 0; world.add(lid);
    addCol(x, z, 2.1, 1.35, rot || 0);
    return b;
  }

  // --- Pazar tezgahı ---
  function buildStall(x, z, rot, c1, c2) {
    var g = new T.Group();
    var table = boxMesh(2.4, 0.1, 1.2, MAT.wood); table.position.y = 0.9; g.add(table);
    [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].forEach(function (p) {
      var lg = boxMesh(0.09, 0.9, 0.09, MAT.woodDark); lg.position.set(p[0], 0.45, p[1]); g.add(lg);
    });
    // tente
    var can = new T.Mesh(new T.PlaneGeometry(2.8, 2.0), new T.MeshStandardMaterial({ color: c1, roughness: 0.85, side: T.DoubleSide }));
    can.rotation.x = -Math.PI / 2 + 0.18; can.position.set(0, 2.25, 0.15); g.add(can);
    for (var i = 0; i < 4; i++) {
      var st = new T.Mesh(new T.PlaneGeometry(0.34, 2.0), new T.MeshStandardMaterial({ color: c2, roughness: 0.85, side: T.DoubleSide }));
      st.rotation.x = -Math.PI / 2 + 0.18; st.position.set(-1.22 + i * 0.82, 2.255, 0.15); g.add(st);
    }
    [[-1.32, -0.9], [1.32, -0.9], [-1.32, 0.9], [1.32, 0.9]].forEach(function (p) {
      var pl = boxMesh(0.07, 2.3, 0.07, MAT.darkMetal); pl.position.set(p[0], 1.15, p[1]); g.add(pl);
    });
    // meyve kasaları
    for (var k = 0; k < 3; k++) {
      var cb = boxMesh(0.5, 0.2, 0.4, MAT.woodDark);
      cb.position.set(-0.7 + k * 0.7, 1.0, 0); g.add(cb);
      var fr = boxMesh(0.42, 0.14, 0.32, new T.MeshStandardMaterial({ color: pick([0xd8452f, 0xe0a62f, 0x5aa63b, 0x8a3bbf]), roughness: 0.7 }));
      fr.position.set(-0.7 + k * 0.7, 1.05, 0); g.add(fr);
    }
    g.position.set(x, 0, z); g.rotation.y = rot || 0;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.geometry.type === 'BoxGeometry' && o.position.y < 1.1) SOLIDS.push(o); } });
    world.add(g);
    addColOBB(x, z, 2.9, 2.1, rot || 0);
    return g;
  }

  // --- Çeşme ---
  function buildFountain(x, z) {
    var g = new T.Group();
    var base = new T.Mesh(new T.CylinderGeometry(2.0, 2.2, 0.55, 8), MAT.concrete);
    base.position.y = 0.28; g.add(base);
    var water = new T.Mesh(new T.CylinderGeometry(1.85, 1.85, 0.1, 16), MAT.water);
    water.position.y = 0.53; g.add(water);
    var col = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, 1.7, 8), MAT.concrete);
    col.position.y = 1.35; g.add(col);
    for (var i = 0; i < 4; i++) {
      var sp = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.4, 6), MAT.metal);
      sp.rotation.z = Math.PI / 2; sp.rotation.y = i * Math.PI / 2;
      sp.position.set(Math.cos(i * Math.PI / 2) * 0.34, 1.5, Math.sin(i * Math.PI / 2) * 0.34);
      g.add(sp);
    }
    g.position.set(x, 0, z);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; SOLIDS.push(o); } });
    world.add(g);
    addCol(x, z, 4.0, 4.0);
    return g;
  }

  // --- Özel yapılar (büyük map için) ---
  function buildBlock(cx, cz, w, d, floors, opts) {
    opts = opts || {};
    var h = buildBuilding(cx, cz, w, d, floors, opts);
    // çatıya tabela/mimari detay
    if (opts.rooftop) {
      var m = boxMesh(w * 0.5, 0.5, d * 0.5, MAT.concrete);
      m.position.set(cx, h + 0.6, cz); m.castShadow = true; world.add(m);
    }
    return h;
  }

  function buildSchool(cx, cz) {
    // okul: uzun bina + avlu + basketbol sahası
    var h = buildBuilding(cx, cz, 20, 12, 3, { style: 'plaster', color: '#c9c0a8' });
    var signTex2 = signTex('İLKOKUL', '#20406b', '#ffffff', 'MAHALLE MEKTEBİ');
    var sm = new T.Mesh(new T.PlaneGeometry(9, 2.2), new T.MeshStandardMaterial({ map: signTex2, roughness: 0.6, emissive: 0xffffff, emissiveMap: signTex2, emissiveIntensity: 0.25 }));
    sm.position.set(cx, 5.4, cz + 6.1); world.add(sm);
    // avlu zemini
    var court = boxMesh(14, 0.06, 10, new T.MeshStandardMaterial({ color: 0x3f5a4a, roughness: 0.92 }));
    court.position.set(cx, 0.04, cz + 13); court.receiveShadow = true; world.add(court);
    // potalar
    [-5.5, 5.5].forEach(function (dx) {
      var pole = boxMesh(0.16, 3.2, 0.16, MAT.darkMetal); pole.position.set(cx + dx, 1.6, cz + 13); pole.castShadow = true; world.add(pole);
      var board = boxMesh(1.7, 1.1, 0.09, MAT.white); board.position.set(cx + dx, 3.1, cz + 13); board.castShadow = true; world.add(board);
      var hoop = new T.Mesh(new T.TorusGeometry(0.32, 0.045, 6, 14), new T.MeshStandardMaterial({ color: 0xd9532f, roughness: 0.5 }));
      hoop.rotation.x = Math.PI / 2; hoop.position.set(cx + dx, 2.78, cz + 13.5); world.add(hoop);
      addCol(cx + dx, cz + 13, 0.3, 0.3);
    });
    // okul bahçesi çiti (alçak)
    for (var i = -3; i <= 3; i++) {
      var post = boxMesh(0.08, 1.2, 0.08, MAT.metal);
      post.position.set(cx + i * 2, 0.6, cz + 18.2); world.add(post);
    }
    var rail = boxMesh(13, 0.06, 0.06, MAT.metal);
    rail.position.set(cx, 1.15, cz + 18.2); world.add(rail);
    return h;
  }

  function buildPolice(cx, cz) {
    // karakol: mavi-beyaz bina + bariyer + bayrak
    var h = buildBuilding(cx, cz, 14, 10, 2, { style: 'plaster', color: '#dfe3e8' });
    var tx = signTex('KARAKOL', '#173a63', '#ffffff', 'DEVLET KONTROL NOKTASI');
    var sm = new T.Mesh(new T.PlaneGeometry(7.4, 1.9), new T.MeshStandardMaterial({ map: tx, roughness: 0.55, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.3 }));
    sm.position.set(cx, 4.4, cz + 5.1); world.add(sm);
    // flaşör (mavi kırmızı)
    var fl1 = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0x3b7bff }));
    fl1.position.set(cx - 2.2, 5.2, cz + 5.05); world.add(fl1);
    var fl2 = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0xff3b3b }));
    fl2.position.set(cx + 2.2, 5.2, cz + 5.05); world.add(fl2);
    G.policeLights = [fl1, fl2];
    // bariyer: kırmızı-beyaz çubuk
    for (var i = 0; i < 5; i++) {
      var bar = boxMesh(2.2, 0.16, 0.16, new T.MeshStandardMaterial({ color: i % 2 ? 0xd8d8d8 : 0xc0392b, roughness: 0.7 }));
      bar.position.set(cx - 4.4 + i * 2.2, 1.0, cz + 8.4); world.add(bar);
    }
    [-4.4, 4.4].forEach(function (dx) {
      var leg = boxMesh(0.14, 1.1, 0.14, MAT.darkMetal);
      leg.position.set(cx + dx, 0.55, cz + 8.4); world.add(leg);
    });
    // bayrak direği
    var fpole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 7, 6), MAT.metal);
    fpole.position.set(cx + 8, 3.5, cz + 6); world.add(fpole);
    var flag = boxMesh(2.2, 1.3, 0.04, new T.MeshStandardMaterial({ color: 0xc42222, roughness: 0.85, side: T.DoubleSide }));
    flag.position.set(cx + 9.1, 6.2, cz + 6); world.add(flag);
    addCol(cx + 8, cz + 6, 0.4, 0.4);
    return h;
  }

  function buildWarehouse(cx, cz, w, d) {
    var h = buildBuilding(cx, cz, w, d, 1, { style: 'brick', color: '#8f8378' });
    // sundurma
    var roof = boxMesh(w + 1.2, 0.16, d * 0.55, new T.MeshStandardMaterial({ color: 0x6b3f2a, roughness: 0.9 }));
    roof.position.set(cx, 3.4, cz + d / 2 + 1.6); roof.rotation.x = 0.08; roof.castShadow = true; world.add(roof);
    for (var i = -1; i <= 1; i++) {
      var leg = boxMesh(0.14, 3.4, 0.14, MAT.darkMetal);
      leg.position.set(cx + i * (w / 3), 1.7, cz + d / 2 + 3.0); world.add(leg);
    }
    return h;
  }

  function buildMosque(cx, cz) {
    var h = buildBuilding(cx, cz, 12, 12, 2, { style: 'plaster', color: '#d8d2c2' });
    // kubbe
    var dome = new T.Mesh(new T.SphereGeometry(4.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshStandardMaterial({ color: 0x4a6b6b, roughness: 0.5, metalness: 0.3 }));
    dome.position.set(cx, h + 0.1, cz); dome.castShadow = true; world.add(dome);
    var finial = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 6), MAT.lampWarm);
    finial.position.set(cx, h + 4.5, cz); world.add(finial);
    // minare
    var min = new T.Mesh(new T.CylinderGeometry(0.55, 0.7, 15, 10), new T.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 0.85 }));
    min.position.set(cx + 8.2, 7.5, cz); min.castShadow = true; world.add(min);
    var balc = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.3, 12), MAT.concrete);
    balc.position.set(cx + 8.2, 11.4, cz); world.add(balc);
    var minTop = new T.Mesh(new T.ConeGeometry(0.75, 2.4, 8), new T.MeshStandardMaterial({ color: 0x4a6b6b, roughness: 0.5, metalness: 0.3 }));
    minTop.position.set(cx + 8.2, 16.1, cz); minTop.castShadow = true; world.add(minTop);
    addCol(cx + 8.2, cz, 1.6, 1.6);
    return h;
  }

  // --- Askeri kontrol noktası (dalgası: devlet kontrolü) ---
  function buildCheckpoint(x, z, rot) {
    var g = new T.Group();
    var rotY = rot || 0;
    // beton bariyerler
    for (var i = -2; i <= 2; i++) {
      if (i === 0) continue;
      var block = boxMesh(2.0, 1.1, 0.7, new T.MeshStandardMaterial({ color: 0xa8a49a, roughness: 0.95 }));
      block.position.set(i * 2.3, 0.55, 0); block.castShadow = true; block.receiveShadow = true;
      g.add(block);
    }
    // kırmızı-beyaz bariyer çubuğu
    for (var j = -3; j <= 3; j++) {
      if (j === 0) continue;
      var bar = boxMesh(0.9, 0.14, 0.14, new T.MeshStandardMaterial({ color: j % 2 ? 0xdedede : 0xc0392b, roughness: 0.7 }));
      bar.position.set(j * 0.9, 1.05, 0); g.add(bar);
    }
    // nöbet kulübesi
    var hut = boxMesh(2.2, 2.6, 2.2, new T.MeshStandardMaterial({ color: 0x9aa4ad, roughness: 0.8 }));
    hut.position.set(-5.2, 1.3, 1.4); hut.castShadow = true; g.add(hut);
    var hutRoof = boxMesh(2.6, 0.16, 2.6, MAT.darkMetal);
    hutRoof.position.set(-5.2, 2.7, 1.4); g.add(hutRoof);
    var win = boxMesh(0.06, 0.6, 1.2, MAT.glass);
    win.position.set(-4.06, 1.75, 1.4); g.add(win);
    // projektör direği
    var pole = new T.Mesh(new T.CylinderGeometry(0.09, 0.12, 5.4, 7), MAT.darkMetal);
    pole.position.set(5.0, 2.7, 1.2); g.add(pole);
    var lampHead = boxMesh(0.7, 0.22, 0.4, MAT.darkMetal);
    lampHead.position.set(5.0, 5.4, 1.2); g.add(lampHead);
    var lampBulb = boxMesh(0.55, 0.08, 0.3, new T.MeshBasicMaterial({ color: 0xfff0c0 }));
    lampBulb.position.set(5.0, 5.27, 1.2); g.add(lampBulb);
    // kum torbaları
    for (var k = 0; k < 5; k++) {
      var bag = new T.Mesh(new T.BoxGeometry(0.7, 0.32, 0.46), new T.MeshStandardMaterial({ color: 0x7d7a5c, roughness: 1 }));
      bag.position.set(-2.4 + (k % 3) * 0.75, 0.16 + Math.floor(k / 3) * 0.33, -1.3);
      bag.rotation.y = rand(0.25, -0.25); bag.castShadow = true; g.add(bag);
    }
    // uyarı tabelası
    var sign = new T.Mesh(new T.PlaneGeometry(2.4, 1.1), new T.MeshStandardMaterial({
      map: signTex('DUR', '#b3261e', '#ffffff', 'KİMLİK KONTROLÜ'), roughness: 0.6,
      emissive: 0xffffff, emissiveMap: signTex('DUR', '#b3261e', '#ffffff', 'KİMLİK KONTROLÜ'), emissiveIntensity: 0.35
    }));
    sign.position.set(-5.2, 3.2, 2.55); g.add(sign);
    g.position.set(x, 0, z); g.rotation.y = rotY;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; SOLIDS.push(o); } });
    world.add(g);
    addColOBB(x, z, 11.0, 1.4, rotY);
    addColOBB(x - 5.2 * Math.cos(rotY) + 1.4 * Math.sin(rotY), z + 5.2 * Math.sin(rotY) + 1.4 * Math.cos(rotY), 2.4, 2.4, rotY);
    return g;
  }

  // --- Mahalle kurulumu ---
  var SPAWNS = [];
  function buildWorld() {
    buildGround();
    buildFence();

    // MERKEZ: çeşme + pazar
    buildFountain(0, 3.0);
    buildStall(-9.0, 10.0, 0.02, 0xd94f3d, 0xf2e9d8);
    buildStall(8.0, 10.2, Math.PI, 0x2f7f6a, 0xf2e9d8);
    buildStall(8.2, -3.4, Math.PI / 2 + 0.05, 0x2f5f9e, 0xf2e9d8);

    // 4 MAHALLE BLOĞU (artı şeklindeki caddelerin köşelerinde)

    // --- Kuzeybatı ---
    buildBuilding(-24, -21, 13, 12, 4, { style: 'plaster', color: '#c9b89f', shop: true, sign: 'KASAP', signBg: '#8f2f2a', signSub: 'ET · TAVUK' });
    buildBuilding(-18.5, -9.6, 7, 8, 3, { style: 'brick', color: '#a06a52', shop: true, sign: 'BAKKAL', signBg: '#23604a', signSub: '24 SAAT AÇIK' });
    buildBuilding(-29.5, -9.6, 6.5, 8, 4, { style: 'plaster', color: '#b8c2c9' });
    buildBuilding(-30, 2, 7, 7, 3, { style: 'brick', color: '#96664f' });

    // --- Kuzeydoğu ---
    buildBuilding(20, -21, 15, 12, 5, { style: 'plaster', color: '#bfb6a4', shop: true, sign: 'FIRIN', signBg: '#2a4f86', signSub: 'SICAK EKMEK' });
    buildBuilding(14, -9.6, 7, 8, 3, { style: 'brick', color: '#9d6a50', shop: true, sign: 'BERBER', signBg: '#8f2f52', signSub: 'USTURA · SAKAL' });
    buildBuilding(27, -9.6, 8, 8, 4, { style: 'plaster', color: '#c3b79f' });
    buildBuilding(30, 2, 6, 7, 3, { style: 'plaster', color: '#cfc0a8' });

    // --- Güneybatı ---
    buildBuilding(-24, 23, 13, 12, 4, { style: 'plaster', color: '#c2b49b', shop: true, sign: 'KIRAATHANE', signBg: '#7a4a22', signSub: 'ÇAY · OKEY' });
    buildBuilding(-18.5, 31, 7, 7, 3, { style: 'brick', color: '#9a6b53' });
    buildBuilding(-30, 22, 7, 9, 3, { style: 'plaster', color: '#b5bcc0' });

    // --- Güneydoğu ---
    buildBuilding(20, 22.5, 15, 12, 3, { style: 'brick', color: '#96664f', shop: true, sign: 'MANAV', signBg: '#245f4f', signSub: 'MEYVE · SEBZE' });
    buildBuilding(14, 31, 8, 7, 4, { style: 'plaster', color: '#c9bda7' });
    buildBuilding(28, 30, 7, 8, 3, { style: 'plaster', color: '#b8b0a0', shop: true, sign: 'ECZANE', signBg: '#8a2d33', signSub: 'NÖBETÇİ' });

    // ARAÇLAR — cadde kenarlarında park
    buildCar(-16.5, 12.2, 0.02, 0xa8342f);
    buildCar(16.5, 12.2, Math.PI, 0x2f5f9e);
    buildCar(11.2, 1.4, Math.PI / 2, 0xd8cfae);
    buildCar(-9.6, -13.0, Math.PI / 2 + 0.04, 0x3b6b4a);
    buildCar(10.5, -16.5, 0.03, 0x6f7078);
    buildCar(-4.5, 22.5, Math.PI, 0x8a4a2f);

    // AĞAÇLAR — kaldırım üstü
    buildTree(-9.0, -6.0, 1.05); buildTree(6.5, -6.2, 0.95);
    buildTree(-10.2, 14.6, 1.1); buildTree(3.5, 14.6, 0.9);
    buildTree(-27, -3.0, 1.0); buildTree(24.5, -3.2, 0.95);
    buildTree(-27.5, 13.5, 1.05); buildTree(25.5, 13.0, 1.0);
    buildTree(-12.5, 30.5, 0.9); buildTree(22.5, -30.5, 0.85);

    // LAMBALAR
    buildLamp(-11.5, -7.2, false); buildLamp(6.0, -7.2, true);
    buildLamp(-11.5, 15.4, false); buildLamp(6.0, 15.4, true);
    buildLamp(-15.4, 8.0, false); buildLamp(9.4, -3.0, true);
    buildLamp(-15.4, -14.0, true); buildLamp(9.4, 19.0, false);

    // ELEKTRİK DİREKLERİ + TELLER
    buildPole(-15.6, 15.6); buildPole(9.6, 15.6); buildPole(-15.6, -7.6); buildPole(9.6, -7.6);
    wireBetween(V3(-15.6, 7.6, 15.6), V3(9.6, 7.6, 15.6), 0.8);
    wireBetween(V3(9.6, 7.6, 15.6), V3(9.6, 7.6, -7.6), 0.7);
    wireBetween(V3(-15.6, 7.6, -7.6), V3(9.6, 7.6, -7.6), 0.8);
    wireBetween(V3(-15.6, 7.6, -7.6), V3(-15.6, 7.6, 15.6), 0.7);

    // KASALAR / VARİLLER / ÇÖP KONTEYNERLERİ (sokak araları)
    buildCrate(-13.0, -14.5, 1, 0.2); buildCrate(-14.2, -15.2, 0.8, -0.3);
    buildCrate(-13.4, -16.0, 0.7, 0.5);
    buildCrate(10.8, 16.5, 1, 0.1); buildCrate(11.9, 16.9, 0.9, -0.4);
    buildCrate(-11.5, 19.5, 0.9, 0.35); buildCrate(11.0, -12.5, 1, 0.2);
    buildBarrel(-13.5, -12.0); buildBarrel(-14.3, -11.2, 0x8a4a2f);
    buildBarrel(11.5, 3.0, 0x2f5d8a); buildBarrel(-11.8, -18.5, 0x6b6b2f);
    buildDumpster(-13.8, 33.2, 0.0); buildDumpster(12.0, -28.0, 1.57);
    buildDumpster(-32.2, -18.0, 1.57);

    // DUVAR GRAFİTİSİ
    var gra1 = new T.Mesh(new T.PlaneGeometry(6, 3), new T.MeshStandardMaterial({ map: TEX.graffiti, transparent: true, roughness: 0.9 }));
    gra1.position.set(-17.45, 1.8, -15.05); gra1.rotation.y = Math.PI / 2; world.add(gra1);
    var gra2 = new T.Mesh(new T.PlaneGeometry(5, 2.5), new T.MeshStandardMaterial({ map: TEX.graffiti, transparent: true, roughness: 0.9 }));
    gra2.position.set(12.45, 1.6, -15.05); gra2.rotation.y = Math.PI / 2; world.add(gra2);

    // ============ BÜYÜK MAP: GENİŞLETİLMİŞ BÖLGELER ============
    // --- BATI BÖLGESİ (karakol + kontrol noktası) ---
    buildPolice(-44, -8);
    buildCheckpoint(-32, 4, 0);
    buildCheckpoint(-32, -26, 0);
    buildBuilding(-44, -30, 14, 12, 3, { style: 'plaster', color: '#b7bcc2' });
    buildBuilding(-46, 14, 12, 10, 4, { style: 'brick', color: '#9c6b54', shop: true, sign: 'KAHVE', signBg: '#4a3524', signSub: 'OCAK BAŞI' });
    buildBuilding(-44, 30, 13, 12, 3, { style: 'plaster', color: '#c6bba4' });

    // --- DOĞU BÖLGESİ (okul + depo) ---
    buildSchool(41, -26);
    buildWarehouse(44, 4, 16, 12);
    buildBuilding(46, 24, 12, 14, 4, { style: 'plaster', color: '#bfc7c9', shop: true, sign: 'TERZİ', signBg: '#3a3a5a', signSub: 'DİKİŞ · TAMİR' });
    buildBuilding(40, -44, 12, 9, 3, { style: 'brick', color: '#a0725a' });

    // --- KUZEY BÖLGESİ (geniş meydan + cami) ---
    buildMosque(-6, -46);
    buildBuilding(-26, -44, 15, 11, 4, { style: 'plaster', color: '#c8bda6', shop: true, sign: 'FIRIN', signBg: '#2a4f86', signSub: 'TAŞ FIRIN' });
    buildBuilding(18, -46, 14, 10, 3, { style: 'brick', color: '#96684f' });
    buildBuilding(-46, -46, 11, 11, 3, { style: 'plaster', color: '#b3b8bd' });
    buildBuilding(30, -34, 10, 8, 3, { style: 'plaster', color: '#cdc3ae', shop: true, sign: 'SIMİT', signBg: '#8a4a22', signSub: 'ÇAY OCAĞI' });

    // --- GÜNEY BÖLGESİ (pazar alanı + otopark) ---
    buildBuilding(-44, 44, 14, 12, 4, { style: 'brick', color: '#9f6c53' });
    buildBuilding(-22, 46, 16, 10, 3, { style: 'plaster', color: '#c2c8ca', shop: true, sign: 'HALI', signBg: '#5a2a6a', signSub: 'YIKAMA' });
    buildBuilding(4, 46, 12, 10, 4, { style: 'plaster', color: '#cbbfa8' });
    buildBuilding(26, 44, 14, 12, 3, { style: 'brick', color: '#a3745b' });
    buildBuilding(46, 42, 12, 12, 3, { style: 'plaster', color: '#b9bfc4', shop: true, sign: 'OTO', signBg: '#2a3a4a', signSub: 'YIKAMA · SERVİS' });

    // --- Ana caddede ek dükkanlar ---
    buildBuilding(-6, -20, 9, 8, 2, { style: 'plaster', color: '#cfc4ad', shop: true, sign: 'BÜFE', signBg: '#7a2a2a', signSub: 'GAZETE · ŞANS' });
    buildBuilding(26, 20, 9, 9, 3, { style: 'brick', color: '#9b6f56', shop: true, sign: 'KUAFÖR', signBg: '#8f2f72', signSub: 'BAYAN · ERKEK' });
    buildBuilding(-34, 20, 10, 9, 3, { style: 'plaster', color: '#c4bba6' });

    // --- Yeni araçlar (geniş bölgeler) ---
    buildCar(-30.5, 13.5, 0.03, 0x2f5f9e);
    buildCar(30.5, 12.6, Math.PI, 0xb23a30);
    buildCar(-30.5, -7.2, 0.02, 0x3b6b4a);
    buildCar(32.5, -18.0, Math.PI / 2, 0xd8cfae);
    buildCar(-32.0, 32.0, Math.PI / 2 + 0.03, 0x6f7078);
    buildCar(6.0, -36.0, 0.03, 0xa8342f);
    buildCar(-8.0, 36.5, Math.PI, 0x2f7f6a);
    // askeri kamyon (kontrol noktası yanı)
    buildCar(-40.0, 22.0, 0.02, 0x4a5a3a);
    buildCar(38.0, 33.0, Math.PI / 2, 0x4a5a3a);

    // --- Ağaçlar / lambalar / direkler (yeni bölgeler) ---
    buildTree(-33.0, 18.0, 1.05); buildTree(33.0, 18.0, 1.0);
    buildTree(-33.5, -18.0, 0.95); buildTree(34.0, -14.0, 1.05);
    buildTree(-20.0, 30.0, 0.9); buildTree(20.0, 30.5, 1.0);
    buildTree(-18.0, -33.0, 0.95); buildTree(14.0, -33.5, 1.05);
    buildTree(-46.0, 0.0, 0.9); buildTree(48.0, -2.0, 0.95);
    buildTree(-12.0, 46.0, 0.85); buildTree(16.0, 47.0, 0.9);
    buildTree(44.0, 16.0, 1.0); buildTree(-44.0, -20.0, 0.9);

    buildLamp(-32.0, -7.0, false); buildLamp(32.0, -7.0, true);
    buildLamp(-32.0, 15.6, false); buildLamp(32.0, 15.6, true);
    buildLamp(-16.0, 24.0, false); buildLamp(16.0, 24.0, true);
    buildLamp(-16.0, -24.0, false); buildLamp(16.0, -24.0, true);
    buildLamp(-42.0, 8.0, false); buildLamp(42.0, 8.0, true);
    buildLamp(-4.0, 36.0, false); buildLamp(4.0, -36.0, true);

    buildPole(-33.5, 24.0); buildPole(33.5, 24.0); buildPole(-33.5, -24.0); buildPole(33.5, -24.0);
    wireBetween(V3(-33.5, 7.6, 24.0), V3(33.5, 7.6, 24.0), 1.6);
    wireBetween(V3(-33.5, 7.6, -24.0), V3(33.5, 7.6, -24.0), 1.6);
    wireBetween(V3(-33.5, 7.6, 24.0), V3(-33.5, 7.6, -24.0), 1.2);
    wireBetween(V3(33.5, 7.6, 24.0), V3(33.5, 7.6, -24.0), 1.2);

    // --- Yeni kasalar / variller / konteynerler ---
    buildCrate(-36.0, -3.0, 1, 0.2); buildCrate(-37.2, -3.8, 0.85, -0.3);
    buildCrate(36.0, 12.0, 1, 0.4); buildCrate(-8.0, 40.0, 0.9, 0.2);
    buildCrate(22.0, -38.0, 1, 0.1); buildCrate(-24.0, 36.0, 0.8, 0.5);
    buildBarrel(-35.0, 16.0); buildBarrel(35.0, -2.0, 0x8a4a2f);
    buildBarrel(-30.0, -30.0, 0x2f5d8a); buildBarrel(28.0, 34.0, 0x6b6b2f);
    buildDumpster(-40.0, 36.0, 0.2); buildDumpster(40.0, -30.0, 1.57);
    buildDumpster(-48.0, -12.0, 1.57); buildDumpster(8.0, 40.0, 0.0);

    // --- Yeni pazar tezgahları (güney meydan) ---
    buildStall(-4.0, 34.0, 0.1, 0xd94f3d, 0xf2e9d8);
    buildStall(6.0, 34.2, Math.PI, 0x2f7f6a, 0xf2e9d8);
    buildStall(-40.0, 4.0, Math.PI / 2, 0x2f5f9e, 0xf2e9d8);

    // --- Yol kapanı bariyerleri (kontrol noktası havası) ---
    buildCheckpoint(28, 4, 0);
    buildCheckpoint(-10, -38, Math.PI);

    // MAHALLE GİRİŞ TAKI
    var arch = new T.Group();
    var p1 = boxMesh(0.3, 4.2, 0.3, MAT.concrete); p1.position.set(-3.6, 2.1, 32.4); arch.add(p1);
    var p2 = boxMesh(0.3, 4.2, 0.3, MAT.concrete); p2.position.set(3.6, 2.1, 32.4); arch.add(p2);
    var top = boxMesh(8.0, 1.0, 0.4, new T.MeshStandardMaterial({ color: 0x27303a, roughness: 0.7 }));
    top.position.set(0, 4.5, 32.4); arch.add(top);
    var aTex = signTex('TEL ÖRGÜ MAHALLE', '#1b2027', '#ffb066', 'HOŞ GELDİN');
    var aMat = new T.MeshStandardMaterial({ map: aTex, roughness: 0.5, emissive: 0xffffff, emissiveMap: aTex, emissiveIntensity: 0.45 });
    var txt = new T.Mesh(new T.PlaneGeometry(7.2, 0.95), aMat);
    txt.position.set(0, 4.5, 32.62); arch.add(txt);
    arch.traverse(function (o) { if (o.isMesh) { o.castShadow = true; SOLIDS.push(o); } });
    world.add(arch);
    addCol(-3.6, 32.4, 0.6, 0.6);
    addCol(3.6, 32.4, 0.6, 0.6);
  }
  buildWorld();
