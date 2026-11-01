#!/usr/bin/env python3
"""
فرز صور الزوار على الوجهات السياحية تلقائيًا.

الاستخدام (من داخل مجلد المشروع):
    pip install pillow
    python3 tools/sort_photos.py مجلد_الصور                  # يحدد الوجهة من إحداثيات GPS داخل كل صورة
    python3 tools/sort_photos.py مجلد_الصور --dest nizwa     # يضع كل صور المجلد في وجهة محددة
    python3 tools/sort_photos.py مجلد_الصور --km 15          # نصف قطر المطابقة (الافتراضي 25 كم)

ماذا يفعل:
  1) يقرأ GPS من EXIF لكل صورة ويطابقه مع أقرب وجهة في js/data.js.
  2) يصغّر الصورة (حتى 1600px) ويحفظها في images/gallery/<id>/ .
  3) يحدّث js/gallery-data.js فتظهر الصور تلقائيًا في صفحة الوجهة.
  4) الصور التي بلا GPS أو بعيدة عن كل وجهة تُنسخ إلى tools/unsorted/ مع طباعة السبب،
     لتحدد وجهتها بنفسك بـ --dest.
ملاحظة: صور واتساب تُحذف منها بيانات GPS غالبًا؛ استلمها كـ «مستند» أو من الكاميرا مباشرة.
"""
import argparse, json, math, re, shutil, sys
from pathlib import Path
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parent.parent
EXT = {'.jpg', '.jpeg', '.png', '.webp'}

def dests():
    s = (ROOT / 'js/data.js').read_text(encoding='utf-8')
    out = []
    for m in re.finditer(r"id: '([a-z\-]+)', name: '([^']+)', gov: '[^']+', cat: '[^']+',\s*lat: ([\d.\-]+), lng: ([\d.\-]+)", s):
        out.append((m[1], m[2], float(m[3]), float(m[4])))
    return out

def km(a, b, c, d):
    r = math.radians; h = math.sin(r(c - a) / 2) ** 2 + math.cos(r(a)) * math.cos(r(c)) * math.sin(r(d - b) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))

def gps(img):
    try:
        ex = img.getexif().get_ifd(0x8825)
        if not ex or 2 not in ex or 4 not in ex: return None
        f = lambda t: float(t[0]) + float(t[1]) / 60 + float(t[2]) / 3600
        la, lo = f(ex[2]), f(ex[4])
        return (-la if ex.get(1) == 'S' else la, -lo if ex.get(3) == 'W' else lo)
    except Exception:
        return None

def load_gallery():
    p = ROOT / 'js/gallery-data.js'
    m = re.search(r'const GALLERY = (\{.*\});', p.read_text(encoding='utf-8'), re.S)
    return json.loads(re.sub(r',\s*([}\]])', r'\1', m[1])) if m and m[1].strip() != '{\n}' else {}

def save_gallery(g):
    head = open(ROOT / 'js/gallery-data.js', encoding='utf-8').read().split('const GALLERY')[0]
    (ROOT / 'js/gallery-data.js').write_text(head + 'const GALLERY = ' + json.dumps(g, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('folder'); ap.add_argument('--dest'); ap.add_argument('--km', type=float, default=25)
    a = ap.parse_args()
    D = dests(); ids = {d[0]: d for d in D}
    if a.dest and a.dest not in ids: sys.exit('وجهة غير معروفة: ' + a.dest)
    G = load_gallery(); done = un = 0
    for f in sorted(Path(a.folder).rglob('*')):
        if f.suffix.lower() not in EXT: continue
        img = ImageOps.exif_transpose(Image.open(f)); target = None; why = ''
        if a.dest: target = ids[a.dest]
        else:
            p = gps(Image.open(f))
            if not p: why = 'لا توجد إحداثيات GPS'
            else:
                best = min(D, key=lambda d: km(p[0], p[1], d[2], d[3])); dist = km(p[0], p[1], best[2], best[3])
                if dist <= a.km: target = best
                else: why = f'أقرب وجهة ({best[1]}) تبعد {dist:.0f} كم'
        if not target:
            u = ROOT / 'tools/unsorted'; u.mkdir(exist_ok=True); shutil.copy(f, u / f.name); print('✗', f.name, '-', why); un += 1; continue
        out = ROOT / 'images/gallery' / target[0]; out.mkdir(parents=True, exist_ok=True)
        n = len(G.get(target[0], [])) + 1
        while (out / f'{n}.jpg').exists(): n += 1
        img = img.convert('RGB'); img.thumbnail((1600, 1600)); img.save(out / f'{n}.jpg', quality=85, optimize=True)
        G.setdefault(target[0], []).append({'src': f'images/gallery/{target[0]}/{n}.jpg', 'cap': ''})
        print('✓', f.name, '→', target[1]); done += 1
    save_gallery(G); print(f'تم فرز {done} صورة، وبقي {un} للفرز اليدوي (tools/unsorted).')
main()
