"""Regenerate the web-sized photo tiers for photography.html.

Drop new full-size photos into images/photography/, then run:

    python tools/build-photos.py

It writes two tiers next to them and prints the PHOTOS lines to paste into
photography.html:

    images/photography/thumb/   500px  q76   grid + homepage marquee
    images/photography/large/  1600px  q82   lightbox

Your originals are read only, never modified. Re-running is safe and
idempotent -- it just overwrites the generated tiers.

Requires Pillow:  pip install Pillow
"""
import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed.  Run:  pip install Pillow")

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "images", "photography")
TIERS = {"thumb": (500, 76), "large": (1600, 82)}
EXTS = (".jpg", ".jpeg", ".png", ".webp")

if not os.path.isdir(SRC):
    sys.exit(f"Not found: {SRC}")

for tier in TIERS:
    os.makedirs(os.path.join(SRC, tier), exist_ok=True)

# Only top-level image files -- never recurse into the generated tiers.
names = sorted(
    n for n in os.listdir(SRC)
    if os.path.isfile(os.path.join(SRC, n)) and n.lower().endswith(EXTS)
)
if not names:
    sys.exit(f"No images found in {SRC}")

rows = []
totals = {t: 0 for t in TIERS}

for name in names:
    base = Image.open(os.path.join(SRC, name))
    base = ImageOps.exif_transpose(base)   # bake in rotation, then drop metadata
    if base.mode != "RGB":
        base = base.convert("RGB")

    dims = {}
    for tier, (edge, q) in TIERS.items():
        im = base.copy()
        im.thumbnail((edge, edge), Image.LANCZOS)
        out = os.path.join(SRC, tier, name)
        im.save(out, "JPEG", quality=q, optimize=True, progressive=True)
        totals[tier] += os.path.getsize(out)
        dims[tier] = im.size

    w, h = dims["large"]
    rows.append((name, w, h))
    print(f"{name:30s} thumb {dims['thumb'][0]:4d}x{dims['thumb'][1]:<4d}  "
          f"large {w:4d}x{h:<4d}")

mb = lambda b: b / 1024 / 1024
print(f"\n{len(names)} photos   "
      f"thumb {mb(totals['thumb']):.2f} MB   large {mb(totals['large']):.2f} MB")

print("\n--- paste into the PHOTOS array in photography.html ---")
for name, w, h in rows:
    q = f"'{name}',"
    print(f"  {{file:{q:34s} alt:'TODO', w:{w}, h:{h}}},")
print("--- replace each alt:'TODO' with a real description ---")
