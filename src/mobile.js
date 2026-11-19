  /* ==================================================================
     MOBİL / DOKUNMATİK KONTROLLER
     - sol altta sanal joystick (hareket)
     - sağ yarıda parmakla bakış
     - ATEŞ / NİŞAN / ZIPLA / ŞARJÖR / SİLAH / MAĞAZA butonları
     - dokunmatikte hafif nişan yardımı + daha geniş isabet alanı
  ================================================================== */
  var IS_TOUCH = (function () {
    var mtp = navigator.maxTouchPoints || 0;
    var coarse = false;
    try { coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) {}
    var hasTouchEvents = ('ontouchstart' in window) || (navigator.msMaxTouchPoints || 0) > 0;
    // gerçek dokunmatik donanım şart (küçük masaüstü penceresi mobil sayılmasın)
    return mtp > 0 || (hasTouchEvents && coarse);
  })();
  G.touch = IS_TOUCH;

  var MOBILE = {
    enabled: IS_TOUCH,
    move: { x: 0, y: 0 },     // x: sağ, y: ileri
    mag: 0,
    ads: false,
    firing: false,
    lookId: null,
    lookX: 0, lookY: 0,
    joyId: null,
    root: $('mobile')
  };

  function initMobileUI() {
    if (!IS_TOUCH) return;
    document.body.classList.add('touch');

    // döndürme önerisi: ilk dokunuşta gizle, dikey moda dönünce yeniden göster
    var rh = $('rotateHint');
    if (rh) {
      window.addEventListener('touchstart', function hideHint() {
        rh.style.display = 'none';
      }, { once: true, passive: true });
      window.addEventListener('orientationchange', function () {
        rh.style.display = '';
      });
    }
    var root = MOBILE.root;
    if (!root) return;
    root.classList.remove('hidden');

    /* ---------- sanal joystick ---------- */
    var stick = $('stick'), knob = $('stickKnob');
    var R = 46;
    function joyStart(e) {
      MOBILE.joyId = e.pointerId;
      stick.classList.add('active');
      try { stick.setPointerCapture(e.pointerId); } catch (err) {}
      joyMove(e);
      e.preventDefault();
    }
    function joyMove(e) {
      if (MOBILE.joyId !== e.pointerId) return;
      var r = stick.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = e.clientX - cx, dy = e.clientY - cy;
      var len = Math.hypot(dx, dy) || 1;
      var cl = Math.min(len, R);
      var nx = (dx / len) * (cl / R), ny = (dy / len) * (cl / R);
      MOBILE.move.x = nx;
      MOBILE.move.y = -ny;              // yukarı = ileri
      MOBILE.mag = cl / R;
      if (knob) knob.style.transform = 'translate(' + (nx * R) + 'px,' + (ny * R) + 'px)';
      e.preventDefault();
    }
    function joyEnd(e) {
      if (MOBILE.joyId !== e.pointerId) return;
      MOBILE.joyId = null;
      MOBILE.move.x = MOBILE.move.y = 0;
      MOBILE.mag = 0;
      if (knob) knob.style.transform = 'translate(0,0)';
      stick.classList.remove('active');
    }
    if (stick) {
      stick.addEventListener('pointerdown', joyStart);
      stick.addEventListener('pointermove', joyMove);
      stick.addEventListener('pointerup', joyEnd);
      stick.addEventListener('pointercancel', joyEnd);
      stick.addEventListener('lostpointercapture', joyEnd);
    }

    /* ---------- bakış (sağ yarı / boş ekran) ---------- */
    function lookStart(e) {
      if (G.state !== 'playing') return;
      if (MOBILE.lookId !== null) return;
      MOBILE.lookId = e.pointerId;
      MOBILE.lookX = e.clientX;
      MOBILE.lookY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function lookMove(e) {
      if (MOBILE.lookId !== e.pointerId) return;
      var dx = e.clientX - MOBILE.lookX, dy = e.clientY - MOBILE.lookY;
      MOBILE.lookX = e.clientX; MOBILE.lookY = e.clientY;
      var k = 0.0042 * G.sens;
      player.yaw -= dx * k;
      player.pitch = clamp(player.pitch - dy * k, -1.45, 1.42);
      e.preventDefault();
    }
    function lookEnd(e) {
      if (MOBILE.lookId !== e.pointerId) return;
      MOBILE.lookId = null;
    }
    canvas.addEventListener('pointerdown', lookStart);
    canvas.addEventListener('pointermove', lookMove);
    canvas.addEventListener('pointerup', lookEnd);
    canvas.addEventListener('pointercancel', lookEnd);

    /* ---------- butonlar ---------- */
    function holdBtn(id, onDown, onUp) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        el.classList.add('down');
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        onDown && onDown();
      });
      var up = function (e) {
        el.classList.remove('down');
        onUp && onUp();
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
    }
    holdBtn('mFire', function () {
      if (G.state !== 'playing') return;
      Audio2.init(); Audio2.resume();
      MOBILE.firing = true; mouse.down = true; player.wantFire = true;
      if (MOBILE.enabled && MOBILE.buzz) MOBILE.buzz(22);
    }, function () { MOBILE.firing = false; mouse.down = false; });

    holdBtn('mAds', function () {
      MOBILE.ads = !MOBILE.ads;
      mouse.rdown = MOBILE.ads;
      var el = $('mAds');
      if (el) el.classList.toggle('on', MOBILE.ads);
    });
    holdBtn('mJump', function () { player.wantJump = true; });
    holdBtn('mReload', function () { tryReload(); });
    holdBtn('mSwitch', function () { switchWeapon(null, 1); });
    holdBtn('mShop', function () { toggleShop(); });
    holdBtn('mPause', function () {
      if (G.state === 'playing') pauseGame();
      else if (G.state === 'paused') resumeGame();
    });

    // tam ekran (başlangıç ekranı)
    var fs = $('mFullscreen');
    if (fs) {
      fs.classList.remove('hidden');
      fs.addEventListener('click', function (e) {
        e.preventDefault();
        var el = document.documentElement;
        var req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el).catch(function () {});
        if (screen.orientation && screen.orientation.lock) {
          try { screen.orientation.lock('landscape').catch(function () {}); } catch (err) {}
        }
        Audio2.init(); Audio2.resume();
      });
    }
  }

  // dokunmatik geri bildirim (destekleyen cihazlarda)
  function buzz(ms) {
    if (!IS_TOUCH || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (e) {}
  }
  MOBILE.buzz = buzz;

  // mobil HUD'u oyun durumuna göre göster/gizle
  var mobileSyncT = 0;
  function mobileSync() {
    if (!IS_TOUCH) return;
    var root = MOBILE.root;
    if (!root) return;
    var playing = (G.state === 'playing');
    root.classList.toggle('playing', playing);
    // nışan butonu durumu
    var ad = $('mAds');
    if (ad) ad.classList.toggle('on', MOBILE.ads && playing);
    if (!playing) { MOBILE.move.x = MOBILE.move.y = 0; MOBILE.firing = false; mouse.down = false; }
    // şarjördeki mermiyi butonda göster
    mobileSyncT -= 1;
    if (mobileSyncT <= 0) {
      mobileSyncT = 10;
      var sw = $('mSwitchLabel');
      if (sw) sw.textContent = wdef().name.split(' ')[0];
      var rl = $('mReloadLabel');
      if (rl) {
        var w = wdef();
        rl.textContent = w.melee ? '∞' : String(player.mags[player.cur] || 0);
        rl.parentNode.classList.toggle('empty', !w.melee && (player.mags[player.cur] || 0) === 0);
      }
    }
  }
