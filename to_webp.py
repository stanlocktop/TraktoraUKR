import os
from PIL import Image, ImageOps

MAX_EDGE = 1920
QUALITY = 80
root = os.getcwd()

FOLDERS = ["ДМТЗ_1104", "ДМТЗ_1304", "ДМТЗ_244х", "ДМТЗ_254В", "ДМТЗ_255XL", "ДМТЗ_255х",
           "ДМТЗ_3254", "ДМТЗ_3254Р", "ДМТЗ_3254РХ", "ДМТЗ_404ХС", "ДМТЗ_544Х", "ДМТЗ_904",
           "EAROFENG_554DXL", "EAROFENG_554LUX"]

for name in FOLDERS:
    src = os.path.join(root, 'img', 'src', name)
    if not os.path.isdir(src):
        continue
    dst = os.path.join(src, 'webp')
    os.makedirs(dst, exist_ok=True)
    n = 0
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
            continue
        path = os.path.join(src, f)
        if not os.path.isfile(path):
            continue
        out = os.path.join(dst, os.path.splitext(f)[0] + '.webp')
        try:
            im = Image.open(path)
            im = ImageOps.exif_transpose(im)
            if im.mode not in ('RGB', 'L'):
                im = im.convert('RGB')
            w, h = im.size
            if max(w, h) > MAX_EDGE:
                r = MAX_EDGE / max(w, h)
                im = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
            im.save(out, 'WEBP', quality=QUALITY, method=4)
            n += 1
        except Exception as e:
            print(f'ERR {f}: {e}')
    print(f'{name}: {n} ok')
