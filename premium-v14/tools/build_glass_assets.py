from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SRC = ASSETS / "glass-source.webp"
ASSETS.mkdir(parents=True, exist_ok=True)

W, H = 2400, 1500
SCALE = 2
random.seed(14072026)


def cover_crop(img: Image.Image, size: tuple[int, int], focus_x: float = 0.50, focus_y: float = 0.50) -> Image.Image:
    tw, th = size
    ratio = max(tw / img.width, th / img.height)
    nw, nh = round(img.width * ratio), round(img.height * ratio)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, min(nw - tw, round((nw - tw) * focus_x)))
    top = max(0, min(nh - th, round((nh - th) * focus_y)))
    return img.crop((left, top, left + tw, top + th))


def cubic(p0, p1, p2, p3, steps: int = 120):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        pts.append((
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        ))
    return pts


def scratch_points(p0, p3, bend: float = 0.025):
    dx, dy = p3[0] - p0[0], p3[1] - p0[1]
    length = max(1.0, math.hypot(dx, dy))
    nx, ny = -dy / length, dx / length
    k1 = random.uniform(-bend, bend) * length
    k2 = random.uniform(-bend, bend) * length
    p1 = (p0[0] + dx * 0.32 + nx * k1, p0[1] + dy * 0.32 + ny * k1)
    p2 = (p0[0] + dx * 0.68 + nx * k2, p0[1] + dy * 0.68 + ny * k2)
    return cubic(p0, p1, p2, p3)


def draw_scratch(highlight, shadow, core, p0, p3, final_width: float, strength: int, broken: bool = False):
    pts = scratch_points(p0, p3)
    if broken:
        segments = []
        cursor = 0
        while cursor < len(pts) - 3:
            length = random.randint(10, 24)
            segments.append(pts[cursor:min(len(pts), cursor + length)])
            cursor += length + random.randint(4, 11)
    else:
        segments = [pts]

    width = max(1, round(final_width * SCALE))
    for segment in segments:
        if len(segment) < 2:
            continue
        shadow.line([(x + 1.25 * SCALE, y + 1.05 * SCALE) for x, y in segment],
                    fill=(3, 7, 10, min(145, strength)), width=width + 2, joint="curve")
        core.line(segment, fill=(150, 177, 183, min(115, strength)), width=width, joint="curve")
        highlight.line([(x - 0.65 * SCALE, y - 0.55 * SCALE) for x, y in segment],
                       fill=(250, 254, 255, min(225, strength + 45)), width=max(1, width - 1), joint="curve")


source = Image.open(SRC).convert("RGB")
clean = cover_crop(source, (W, H), 0.50, 0.48)
clean = ImageEnhance.Contrast(clean).enhance(1.045)
clean = ImageEnhance.Color(clean).enhance(0.93)
clean = ImageEnhance.Sharpness(clean).enhance(1.16)
clean = ImageEnhance.Brightness(clean).enhance(0.995)

# A restrained architectural grade. The exact same grade is used for both images.
grade = Image.new("RGBA", clean.size, (0, 0, 0, 0))
gd = ImageDraw.Draw(grade, "RGBA")
gd.rectangle((0, 0, W, H), fill=(10, 17, 20, 10))
gd.polygon([(0, 0), (W * .40, 0), (W * .61, H), (W * .20, H)], fill=(203, 231, 235, 10))
clean_rgba = Image.alpha_composite(clean.convert("RGBA"), grade)
clean = clean_rgba.convert("RGB")
clean.save(ASSETS / "glass-after.webp", "WEBP", quality=95, method=6)

base = clean.resize((W * SCALE, H * SCALE), Image.Resampling.LANCZOS).convert("RGBA")
size = base.size
highlight = Image.new("RGBA", size, (0, 0, 0, 0))
shadow = Image.new("RGBA", size, (0, 0, 0, 0))
core = Image.new("RGBA", size, (0, 0, 0, 0))
hd = ImageDraw.Draw(highlight, "RGBA")
sd = ImageDraw.Draw(shadow, "RGBA")
cd = ImageDraw.Draw(core, "RGBA")

# Realistic scraper damage: many short micro-scratches, several medium scratches,
# and only three deeper lines. All damage is concentrated on one glass panel.
for _ in range(34):
    x = random.uniform(.12, .59) * W * SCALE
    y = random.uniform(.12, .83) * H * SCALE
    length = random.uniform(.035, .105) * W * SCALE
    angle = random.gauss(-0.12, 0.22)
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    draw_scratch(hd, sd, cd, (x, y), p3, random.choice([0.55, 0.7, 0.85]), random.randint(65, 118), broken=random.random() < .32)

for _ in range(10):
    x = random.uniform(.10, .52) * W * SCALE
    y = random.uniform(.16, .80) * H * SCALE
    length = random.uniform(.12, .22) * W * SCALE
    angle = random.gauss(-0.10, 0.18)
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    draw_scratch(hd, sd, cd, (x, y), p3, random.choice([1.0, 1.15, 1.35]), random.randint(118, 165), broken=random.random() < .18)

for _ in range(3):
    x = random.uniform(.13, .40) * W * SCALE
    y = random.uniform(.20, .70) * H * SCALE
    length = random.uniform(.23, .34) * W * SCALE
    angle = random.uniform(-0.24, 0.08)
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    draw_scratch(hd, sd, cd, (x, y), p3, random.choice([1.45, 1.65]), random.randint(165, 205))

# Two faint curved scraper traces.
for _ in range(2):
    cx = random.uniform(.24, .45) * W * SCALE
    cy = random.uniform(.35, .69) * H * SCALE
    rx = random.uniform(.075, .125) * W * SCALE
    ry = random.uniform(.035, .065) * H * SCALE
    start = random.randint(195, 235)
    end = start + random.randint(70, 105)
    box = (cx - rx, cy - ry, cx + rx, cy + ry)
    sd.arc((box[0] + 2 * SCALE, box[1] + 2 * SCALE, box[2] + 2 * SCALE, box[3] + 2 * SCALE), start, end,
           fill=(3, 8, 11, 82), width=3 * SCALE)
    hd.arc(box, start, end, fill=(247, 253, 254, 132), width=2 * SCALE)

shadow = shadow.filter(ImageFilter.GaussianBlur(.75 * SCALE))
highlight = highlight.filter(ImageFilter.GaussianBlur(.18 * SCALE))
core = core.filter(ImageFilter.GaussianBlur(.28 * SCALE))

# Local matte haze with irregular, photographic texture.
noise = Image.effect_noise((W // 3, H // 3), 31).resize(size, Image.Resampling.BICUBIC)
noise = ImageOps.autocontrast(noise).filter(ImageFilter.GaussianBlur(8 * SCALE))
mask = Image.new("L", size, 0)
md = ImageDraw.Draw(mask)
md.ellipse((W * .10 * SCALE, H * .18 * SCALE, W * .61 * SCALE, H * .84 * SCALE), fill=54)
mask = mask.filter(ImageFilter.GaussianBlur(66 * SCALE))
noise = ImageChops.multiply(noise, mask).point(lambda p: round(p * .32))
haze = Image.new("RGBA", size, (224, 234, 233, 0))
haze.putalpha(noise)

# Small dried paint and construction residue near the lower edge.
residue = Image.new("RGBA", size, (0, 0, 0, 0))
rd = ImageDraw.Draw(residue, "RGBA")
for _ in range(28):
    x = random.uniform(.075, .39) * W * SCALE
    y = random.uniform(.80, .94) * H * SCALE
    r = random.choice([1.3, 1.8, 2.4, 3.2, 4.6]) * SCALE
    rd.ellipse((x - r, y - r, x + r, y + r), fill=(236, 234, 221, random.randint(105, 184)))
for _ in range(5):
    x = random.uniform(.09, .36) * W * SCALE
    y = random.uniform(.83, .93) * H * SCALE
    rd.line((x, y, x + random.uniform(28, 86) * SCALE, y + random.uniform(-5, 7) * SCALE),
            fill=(231, 230, 217, 122), width=random.randint(2, 4) * SCALE)
residue = residue.filter(ImageFilter.GaussianBlur(.25 * SCALE))

before = Image.alpha_composite(base, haze)
before = Image.alpha_composite(before, shadow)
before = Image.alpha_composite(before, core)
before = Image.alpha_composite(before, highlight)
before = Image.alpha_composite(before, residue)
before = before.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")
before = ImageEnhance.Sharpness(before).enhance(1.05)
before.save(ASSETS / "glass-before.webp", "WEBP", quality=95, method=6)

# Dedicated high-resolution crops for the macro proof cards.
box = (round(W * .10), round(H * .14), round(W * .62), round(H * .87))
for name in ("before", "after"):
    image = Image.open(ASSETS / f"glass-{name}.webp").convert("RGB")
    detail = image.crop(box)
    detail = cover_crop(detail, (1200, 900), .50, .49)
    detail = ImageEnhance.Sharpness(detail).enhance(1.12)
    detail.save(ASSETS / f"glass-{name}-detail.webp", "WEBP", quality=95, method=6)

print("generated", *(p.name for p in sorted(ASSETS.glob("glass-*.webp"))))
