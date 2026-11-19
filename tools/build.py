#!/usr/bin/env python3
"""Tek dosya HTML oluşturucu: three.min.js + oyun kodlarını şablona gömer."""
import pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
lib = root / "vendor" / "three.min.js"
tpl = (root / "src" / "template.html").read_text(encoding="utf-8")

three = lib.read_text(encoding="utf-8")
# güvenlik: script kapanışı gömülü kütüphanede olmamalı
assert "</script" not in three.lower(), "three.min.js içinde </script> var!"

parts = ["game.js", "audio.js", "bots.js", "mobile.js", "gameplay.js"]
game = "\n".join((root / "src" / p).read_text(encoding="utf-8") for p in parts)
assert "</script" not in game.lower(), "oyun kodunda </script> var!"

out = tpl.replace("/*__THREE_LIB__*/", three).replace("/*__GAME_JS__*/", game)
dist = root / "index.html"
dist.write_text(out, encoding="utf-8")
# sürüm/dağıtım kopyası (ASCII ad — indirme bağlantıları için güvenli)
rel = root / "Tel-Orgu-Mahalle.html"
rel.write_text(out, encoding="utf-8")
print(f"index.html + Tel-Orgu-Mahalle.html yazıldı: {len(out)/1024:.0f} KB")
