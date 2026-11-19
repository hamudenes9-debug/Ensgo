# TEL ÖRGÜ MAHALLE — Mahalle Kuşatması

Tek HTML dosyasıyla çalışan, tarayıcıda oynanan 3B birinci şahıs nişancı (FPS) oyunu.
Harici dosya/CDN yok: **Three.js r149 kütüphanesi, tüm modeller, dokular ve sesler dosyanın içine gömülü.**

## Oynat

Sadece `index.html` dosyasını Chrome / Edge / Firefox'ta aç. Kurulum gerekmez.

## Özellikler

**Açılış sinematiği — gece yatakta uyanış** (v1.4)
1. Oyun **gece** başlar; ekran kararır, **alarm çalar**, kalp atışı duyulur
2. Kamera yatakta yatan **kendi karakterinin** üzerinde: 3. şahıs, nefes alan göğüs, gözlerini açma anı
3. Karakter yataktan doğrulur, **merdivenden aşağı koşar**, koridordan geçip kapıdan avluya çıkar
4. Bitişte kamera omuza geçer (1. şahıs), elinde bıçak, tel örgü hattı ve **4 kule** karşında
5. Sinematik herhangi bir tuşa/tıklamaya basınca atlanır; oyun durumu bozulmaz


**Harita — tel örgüyle çevrili büyük mahalle (v1.3)**
- **124 × 124 m** alan (tel örgü hattı 116 × 116 m), dikenli telli tel örgü çit ve çelik direkler
- Yeni bölgeler: batıda **karakol** + iki **devlet kontrol noktası**, doğuda **okul** ve **depo**, kuzeyde **cami** ve meydan, güneyde büyük **pazar**
- Artı şeklinde iki cadde, kaldırımlar, yaya geçidi, rögar, su birikintisi
- 15+ bina: sıvalı/tuğla cephe, pencereler, balkonlar, çamaşır ipleri, klimalar, çatı su depoları
- Dönük binalar/tezgahlar/araçlar için **OBB çarpışma** (döndürülmüş kutu) — köşelerden geçilmiyor
- Prosedürel tabelalar: KASAP, BAKKAL, FIRIN, BERBER, KIRAATHANE, MANAV, ECZANE
- Pazar tezgahları, çeşme, park halinde arabalar, ağaçlar, sokak lambaları, elektrik direkleri + teller
- Kasa, varil, çöp konteyneri, grafiti duvarları, mahalle giriş takı

**Silahlar**
| Silah | Şarjör | Hasar | Not |
|---|---|---|---|
| Bıçak | ∞ | 62 (sırttan 124) | Her zaman cebinde; eldivenli elle tutulur, savurma animasyonlu |
| Tabanca | 12 | 27 | Başlangıç silahı |
| M4A4 | 30 | 34 | İsabetli, düşük tepme — mağazada ₺1.850 |
| AK-47 | 30 | 43 | Sert tepme, yüksek hasar — mağazada ₺2.750 |

Kafadan vuruş 2.6× hasar. Mesafeyle hasar düşer. 1/2/3 tuşları veya fare tekerleği ile silah değiştir.

**Mağaza** (dalga aralarında `B`)
- Silahlar: Tabanca, M4A4, AK-47 (sahip olduğuna tıklayınca kuşanır)
- Cephane paketleri (silah başına veya toplu)
- Ekipman: çelik yelek, sağlık seti, hafif ayakkabı (+%12 hız), matkap namlu (+%14 hasar), zırhlı palto (+25 maks. can)

**Kule nöbetçileri — 4 köşede 4 asker** (v1.4)
- Tel örgü hattının **dört köşesinde birer kule** (çelik direk, platform, tırabzan, projektör) yükselir
- **Her kulede 1 devlet askeri** nöbet tutar: kamuflaj, miğfer, çelik yelek, M4A4 · 400 HP · 14 hasar · 0,34 sn atış aralığı
- Kuleler yerden **6,4 m** yüksekte; nöbetçi yerinden ayrılmaz, ölürse 7 sn sonra kulesinde geri döner
- Yüksekten geniş bakış: 95 m'ye kadar hedef arar, 85 m'ye kadar ateş eder; hedef seçiminde oyuncuya yaklaşan zombiler öncelikli
- Kule gövdesi kendi görüş hattını kesmesin diye bakış hedefe doğru 3 m kaydırılarak sınanır
- HUD'da **🪖 4/4 kule** sayacı; radarda mavi/beyaz kule işaretleri
- **Yanında gezen dost bot yoktur** — destek yalnızca kulelerden gelir

**Gün saati — her dalgada zaman değişir**
Her dalgada atmosfer baştan kurulur (2,4 sn yumuşak geçiş):
| Dalga | Zaman | Atmosfer |
|---|---|---|
| 1, 5, 9… | 🌅 **ŞAFAK** | mor-pembe gökyüzü, altın sis, yanan lambalar |
| 2, 6, 10… | ☀️ **ÖĞLE** | berrak mavi, sert güneş, keskin gölgeler |
| 3, 7, 11… | 🌇 **GÜN BATIMI** | turuncu gökyüzü, uzun gölgeler |
| 4, 8, 12… | 🌙 **GECE** | yıldızlar, sokak lambaları, koyu mavi sis |

Gökyüzü gradyanı, sis rengi/mesafesi, güneş rengi-şiddeti, ortam ışığı, pozlama ve sokak lambaları birlikte değişir; HUD'da saat göstergesi görünür.

**Düşman sadece zombiler — askerler bizim tarafımızda** (v1.3.1)

Devlet güçleri artık düşman değil: **kontrol noktalarından çıkan devriyeler senin yanında savaşıyor.**
Düşman olarak yalnızca zombiler gelir.

| Dalga | Gelen düşman | Not |
|---|---|---|
| 1–2 | 🧟 yürüyen ağırlıklı zombiler + az sayıda koşan | |
| 3–5 | yürüyen / koşan / ilk dev zombiler | |
| 5 · 10 · 15… | **🔥 BÜYÜK DALGA** | %45 daha kalabalık, siren + kırmızı banner, %60 fazla bonus |
| 6+ | tam karışık sürü | dev zombi oranı artar |
| sonsuz | dalga sayısı **sınırsız** | sayı `4 + round(dalga × 2,1)` (en az 6), canlı zombi limiti 9 → 20 |

Zombi tipleri: **Zombi** (110 HP, 2,95 m/s), **Koşan Zombi** (80 HP, 5,1 m/s), **Dev Zombi** (480 HP, 26 hasar, 1,25× boy).
Zombiler tüfek kullanmaz — kolları ileri uzanmış hâlde koşar, duvar arkasında bile kokudan takip eder, 2 m içinde tırmalar. Kule nöbetçilerini de tırmalayıp düşürebilirler.

**Kamera açısı (v1.3)**
- Görüş açısı 74° → **80°** (dar ekran/portre 88°), nişanda 47°'ye daralır — büyük haritada çevre kontrolü kolay
- Göz yüksekliği 1,66 → **1,72 m**, kamera 0,12 m öne kaymış ve +0,035 m yukarıda: silah/eller kadrajda dengeli, ufuk göz hizasında
- Bakış sınırı yukarı 1,4 rad, aşağı 1,5 rad; koşarken hafif FOV genişlemesi

**Düşman botları — rastgele avatarlı ve zeki** (artık zombiler)
- Her botta rastgele: ten rengi, saç, gömlek/pantolon/ayakkabı, sakal, bıyık, güneş gözlüğü, maske, şapka/bandana/kask, vücut yapısı (iri/ince) ve isim (Kel Ali, Karaoğlan, Çakal…)
- Tipler: **zombi / koşan zombi / dev zombi** (eski insan bot tipleri altyapıda duruyor)
- Zeka: A* yol bulma, görüş hattı kontrolü (duvar arkasını görmez), yan kayma (strafe), mesafe koruma, siper alma, sıkışınca yol yenileme, sürü hâlinde ayrışma, dalga ilerledikçe artan isabet/hız/can
- Düşmanlar mahallenin karşı tarafındaki açık noktalardan doğar (asla bina içinde, oyuncuya en az 12 m uzakta) ve mahalleye girer

**Eller ve silah görünümü**
- Tüm silahlarda görünür **eldivenli eller**: avuç, bükülü parmaklar, başparmak, bilek manşeti, saat ve kol
- Bıçakta iki el (kavrayan + destek), çift taraflı kama, testere sırtı, metal parlaklığı
- Nişan modunda eller/silah merkeze gelir, yürürken sallanır, ateş ederken geri tepme animasyonu

**Sistemler**
- Dalga sistemi (her dalgada daha çok ve daha güçlü bot), dalga sonu para bonusu
- Radar (dönen tarama, düşman/görüş konisi), isabet göstergesi, hasar sayıları, yönlü hasar göstergesi
- Kafadan vuruş, tepme/bloom, nişan modu (sağ tık), koşma, çömelme, zıplama, şarjör değiştirme
- Can yenilenmesi (7 sn hasar almazsan), düşen sağlık/cephane paketleri
- Prosedürel WebAudio sesleri (silah, sekme, bıçak, adım, hasar, dalga)
- Grafik kalitesi / hassasiyet / ses ayarları, en iyi dalga kaydı (localStorage)
- Duraklatma, oyun sonu istatistikleri

## 📱 Mobil (dokunmatik) destek

Telefon/tablet algılanınca arayüz otomatik olarak dokunmatik moda geçer:

| Kontrol | İşlev |
|---|---|
| **Sanal joystick** (sol alt) | Hareket — sonuna kadar itince otomatik koşu |
| **Ekranı sürükle** (sağ yarı) | Bakış / nişan |
| **⊕ ATEŞ** | Basılı tut = seri ateş |
| **◉ NİŞAN** | Yakınlaştırma aç/kapa |
| **↑ ZIPLA** | Zıpla |
| **ŞARJÖR** (mermi sayısı yazar) | Şarjör değiştir; boşalınca kırmızı yanıp titrer |
| **SİLAH** (silah adı yazar) | Silah değiştir |
| **₺ MAĞAZA** | Mağazayı aç/kapat |
| **II** (sağ üst) | Duraklat |
| **⛶ TAM EKRAN + YATAY** (menüde) | Tam ekran + yatay kilidi |

Ek olarak mobilde: ~25° koni içinde hafif **nişan yardımı**, %35 geniş isabet alanı, azaltılmış crosshair açılması, titreşim geri bildirimi (destekleyen cihazlarda), çentik/güvenli alan desteği, dikey modda yeniden düzenlenen HUD ve "telefonu yatır" önerisi.

## Kontroller

| Tuş | İşlev |
|---|---|
| `W A S D` | Hareket |
| Fare | Nişan al |
| Sol tık | Ateş |
| Sağ tık | Nişan modu (yakınlaştır) |
| `Shift` / `Ctrl` | Koş / Çömel |
| `Boşluk` | Zıpla |
| `R` | Şarjör değiştir |
| `1` `2` `3` / tekerlek | Bıçak / Tabanca / Tüfek |
| `B` | Mağaza |
| `Esc` | Duraklat |
| `M` | Sesi kapat/aç |

## Geliştirme

`index.html` üretilen dosyadır. Kaynak kod `src/` altında parçalı durur:

```
src/template.html   # HTML + CSS + arayüz iskeleti
src/game.js         # sahne, harita, dokular, silah modelleri
src/audio.js        # WebAudio ses motoru, girdi, oyuncu durumu
src/bots.js         # avatarlar (insan/asker/zombi), navigasyon/A*, görüş hattı, bot AI, efektler
src/allies.js       # kule nöbetçileri (asker AI) + gün saati/gökyüzü/lambalar
src/intro.js        # gece uyanma sinematiği + oyuncu bedeni animasyonu
src/gameplay.js     # ateş/hasar, dalgalar, mağaza, HUD, radar, ana döngü
vendor/three.min.js # Three.js r149 (MIT)
```

Değişiklikten sonra tek dosyayı yeniden üret:

```bash
python3 tools/build.py
```

## Sürüm geçmişi

- **v1.4.0** — gece yatakta uyanma sinematiği (alarm + merdivenden iniş, animasyonlu karakter), tel örgü hattının 4 köşesinde kule + her kulede 1 asker, yanında gezen dost botlar kaldırıldı, **sonsuz dalga**, harita 124 × 124 m
- **v1.3.1** — askerler bizim tarafa geçti (devlet devriyeleri), düşman yalnızca zombiler, dost botlar gerçekten savaşıyor (mevzi + cephe)
- **v1.3.0** — harita 110×110 m'ye büyütüldü (karakol, kontrol noktaları, okul, depo, cami, pazar), BÜYÜK DALGA, geniş kamera açısı, OBB çarpışma
- **v1.2.0** — 2 dost bot, her dalgada değişen gün saati, eldivenli eller
- **v1.1.0** — mobil/dokunmatik destek, portre düzeni
- **v1.0.0** — ilk sürüm: mahalle haritası, botlar, mağaza, bıçak

## Lisans

Oyun kodu: MIT. Gömülü Three.js: MIT (Copyright © 2010-2023 Three.js Authors).
