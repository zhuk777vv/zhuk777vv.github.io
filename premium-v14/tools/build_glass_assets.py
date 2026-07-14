from __future__ import annotations

import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SRC = ASSETS / "glass-source.jpg"
ASSETS.mkdir(parents=True, exist_ok=True)

W, H = 2200, 1375
SCALE = 2
random.seed(240714)


def cover_crop(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    ratio = max(tw / img.width, th / img.height)
    nw, nh = round(img.width * ratio), round(img.height * ratio)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, min(nw - tw, round((nw - tw) * 0.58)))
    top = max(0, min(nh - th, round((nh - th) * 0.52)))
    return img.crop((left, top, left + tw, top + th))


def cubic(p0, p1, p2, p3, steps=80):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts


def add_scratch(draw: ImageDraw.ImageDraw, p0, p3, width, alpha, bend=0.10):
    dx, dy = p3[0] - p0[0], p3[1] - p0[1]
    length = max(1, math.hypot(dx, dy))
    nx, ny = -dy / length, dx / length
    k1 = random.uniform(-bend, bend) * length
    k2 = random.uniform(-bend, bend) * length
    p1 = (p0[0] + dx * .33 + nx * k1, p0[1] + dy * .33 + ny * k1)
    p2 = (p0[0] + dx * .67 + nx * k2, p0[1] + dy * .67 + ny * k2)
    pts = cubic(p0, p1, p2, p3)
    shadow = [(x + 1.4*SCALE, y + 1.1*SCALE) for x, y in pts]
    draw.line(shadow, fill=(7, 13, 17, min(120, alpha)), width=max(1, width + 2), joint="curve")
    draw.line(pts, fill=(239, 248, 250, alpha), width=width, joint="curve")
    if width >= 3:
        highlight = [(x - .7*SCALE, y - .6*SCALE) for x, y in pts]
        draw.line(highlight, fill=(255, 255, 255, min(235, alpha + 35)), width=1, joint="curve")


img = Image.open(SRC).convert("RGB")
clean = cover_crop(img, (W, H))
clean = ImageEnhance.Contrast(clean).enhance(1.05)
clean = ImageEnhance.Color(clean).enhance(0.92)
clean = ImageEnhance.Brightness(clean).enhance(0.99)

grade = Image.new("RGBA", clean.size, (10, 18, 23, 0))
gd = ImageDraw.Draw(grade)
gd.rectangle((0, 0, W, H), fill=(8, 15, 20, 18))
gd.rectangle((0, 0, W, H), fill=(189, 225, 229, 8))
clean = Image.alpha_composite(clean.convert("RGBA"), grade).convert("RGB")
clean.save(ASSETS / "glass-after.webp", "WEBP", quality=91, method=6)

base = clean.resize((W*SCALE, H*SCALE), Image.Resampling.LANCZOS).convert("RGBA")
damage = Image.new("RGBA", base.size, (0, 0, 0, 0))
d = ImageDraw.Draw(damage, "RGBA")

for _ in range(30):
    x = random.uniform(.08, .58) * W * SCALE
    y = random.uniform(.08, .84) * H * SCALE
    length = random.uniform(.10, .30) * W * SCALE
    angle = random.uniform(-0.55, 0.45)
    p0 = (x, y)
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    add_scratch(d, p0, p3, width=random.choice([1, 1, 2]), alpha=random.randint(72, 145), bend=.035)

for _ in range(7):
    x = random.uniform(.10, .52) * W * SCALE
    y = random.uniform(.16, .78) * H * SCALE
    length = random.uniform(.16, .36) * W * SCALE
    angle = random.uniform(-0.42, 0.30)
    add_scratch(d, (x, y), (x + math.cos(angle)*length, y + math.sin(angle)*length), width=random.choice([3, 4]), alpha=random.randint(145, 205), bend=.055)

for _ in range(5):
    cx = random.uniform(.17, .50) * W * SCALE
    cy = random.uniform(.23, .74) * H * SCALE
    rx = random.uniform(.06, .13) * W * SCALE
    ry = random.uniform(.03, .08) * H * SCALE
    start = random.randint(190, 250)
    end = start + random.randint(60, 120)
    box = (cx-rx, cy-ry, cx+rx, cy+ry)
    d.arc(box, start=start, end=end, fill=(242, 250, 251, random.randint(80, 135)), width=random.choice([2, 3]))
    d.arc((box[0]+2, box[1]+2, box[2]+2, box[3]+2), start=start, end=end, fill=(4, 8, 11, 70), width=2)

haze = Image.new("L", base.size, 0)
hd = ImageDraw.Draw(haze)
for _ in range(75):
    cx = random.gauss(.34, .09) * W * SCALE
    cy = random.gauss(.50, .13) * H * SCALE
    rx = random.uniform(18, 80) * SCALE
    ry = random.uniform(8, 35) * SCALE
    hd.ellipse((cx-rx, cy-ry, cx+rx, cy+ry), fill=random.randint(10, 28))
haze = haze.filter(ImageFilter.GaussianBlur(24*SCALE))
haze_rgba = Image.new("RGBA", base.size, (232, 239, 238, 0))
haze_rgba.putalpha(haze)
damage = Image.alpha_composite(damage, haze_rgba)

d = ImageDraw.Draw(damage, "RGBA")
for _ in range(38):
    x = random.uniform(.05, .42) * W * SCALE
    y = random.uniform(.76, .94) * H * SCALE
    r = random.choice([2, 3, 4, 6, 8]) * SCALE
    d.ellipse((x-r, y-r, x+r, y+r), fill=(239, 238, 228, random.randint(105, 205)))
for _ in range(9):
    x = random.uniform(.06, .38) * W * SCALE
    y = random.uniform(.79, .93) * H * SCALE
    d.line((x, y, x + random.uniform(18, 70)*SCALE, y + random.uniform(-7, 9)*SCALE), fill=(234, 233, 222, 150), width=random.randint(2, 5)*SCALE)

reflection = Image.new("RGBA", base.size, (0, 0, 0, 0))
rd = ImageDraw.Draw(reflection)
rd.polygon([(0, 0), (W*.48*SCALE, 0), (W*.66*SCALE, H*SCALE), (W*.17*SCALE, H*SCALE)], fill=(208, 237, 242, 18))
reflection = reflection.filter(ImageFilter.GaussianBlur(18*SCALE))

before = Image.alpha_composite(base, reflection)
before = Image.alpha_composite(before, damage)
before = before.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")
before.save(ASSETS / "glass-before.webp", "WEBP", quality=91, method=6)

box = (round(W*.12), round(H*.18), round(W*.59), round(H*.84))
for name in ("before", "after"):
    source = Image.open(ASSETS / f"glass-{name}.webp").convert("RGB")
    detail = source.crop(box)
    detail = cover_crop(detail, (1100, 860))
    detail.save(ASSETS / f"glass-{name}-detail.webp", "WEBP", quality=92, method=6)

print("generated", *(p.name for p in ASSETS.glob("glass-*.webp")))
