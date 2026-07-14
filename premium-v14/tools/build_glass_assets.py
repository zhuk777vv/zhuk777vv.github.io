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


def scratch_points(p0, p3, bend: float = 0.018):
    dx, dy = p3[0] - p0[0], p3[1] - p0[1]
    length = max(1.0, math.hypot(dx, dy))
    nx, ny = -dy / length, dx / length
    k1 = random.uniform(-bend, bend) * length
    k2 = random.uniform(-bend, bend) * length
    p1 = (p0[0] + dx * 0.31 + nx * k1, p0[1] + dy * 0.31 + ny * k1)
    p2 = (p0[0] + dx * 0.69 + nx * k2, p0[1] + dy * 0.69 + ny * k2)
    return cubic(p0, p1, p2, p3)


def draw_scratch(highlight, shadow, core, p0, p3, final_width: float, strength: int, broken: bool = False):
    pts = scratch_points(p0, p3)
    if broken:
        segments, cursor = [], 0
        while cursor < len(pts) - 3:
            run = random.randint(8, 19)
            segments.append(pts[cursor:min(len(pts), cursor + run)])
            cursor += run + random.randint(4, 10)
    else:
        segments = [pts]

    width = max(1, round(final_width * SCALE))
    for segment in segments:
        if len(segment) < 2:
            continue
        shadow.line([(x + 1.15 * SCALE, y + .95 * SCALE) for x, y in segment],
                    fill=(3, 7, 10, min(132, strength)), width=width + 2, joint="curve")
        core.line(segment, fill=(111, 143, 150, min(105, strength)), width=width, joint="curve")
        highlight.line([(x - .55 * SCALE, y - .48 * SCALE) for x, y in segment],
                       fill=(252, 255, 255, min(230, strength + 50)), width=max(1, width - 1), joint="curve")


source = Image.open(SRC).convert("RGB")
# The source is a real reflective storefront; keep the glass plane centered.
clean = cover_crop(source, (W, H), 0.50, 0.48)
clean = ImageEnhance.Contrast(clean).enhance(1.055)
clean = ImageEnhance.Color(clean).enhance(0.91)
clean = ImageEnhance.Sharpness(clean).enhance(1.19)
clean = ImageEnhance.Brightness(clean).enhance(0.995)

grade = Image.new("RGBA", clean.size, (0, 0, 0, 0))
gd = ImageDraw.Draw(grade, "RGBA")
gd.rectangle((0, 0, W, H), fill=(8, 15, 19, 9))
gd.polygon([(0, 0), (W * .42, 0), (W * .59, H), (W * .15, H)], fill=(205, 231, 235, 12))
clean = Image.alpha_composite(clean.convert("RGBA"), grade).convert("RGB")
clean.save(ASSETS / "glass-after.webp", "WEBP", quality=95, method=6)

base = clean.resize((W * SCALE, H * SCALE), Image.Resampling.LANCZOS).convert("RGBA")
size = base.size
highlight = Image.new("RGBA", size, (0, 0, 0, 0))
shadow = Image.new("RGBA", size, (0, 0, 0, 0))
core = Image.new("RGBA", size, (0, 0, 0, 0))
hd = ImageDraw.Draw(highlight, "RGBA")
sd = ImageDraw.Draw(shadow, "RGBA")
cd = ImageDraw.Draw(core, "RGBA")

for _ in range(58):
    x = random.uniform(.12, .53) * W * SCALE
    y = random.uniform(.17, .78) * H * SCALE
    length = random.uniform(.018, .065) * W * SCALE
    angle = random.uniform(-1.05, .92)
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    draw_scratch(hd, sd, cd, (x, y), p3, random.choice([.48, .62, .78]), random.randint(68, 116), broken=random.random() < .42)

for _ in range(15):
    x = random.uniform(.12, .50) * W * SCALE
    y = random.uniform(.18, .76) * H * SCALE
    length = random.uniform(.065, .14) * W * SCALE
    angle = random.uniform(-.82, .58)
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    draw_scratch(hd, sd, cd, (x, y), p3, random.choice([.9, 1.05, 1.22]), random.randint(116, 165), broken=random.random() < .24)

# Four visible but thin deep scratches, varied in direction and length.
deep_specs = [(.17,.29,.22,-.42),(.24,.55,.18,.34),(.36,.24,.20,.60),(.43,.64,.17,-.69)]
for x0, y0, length_ratio, angle in deep_specs:
    x, y = x0 * W * SCALE, y0 * H * SCALE
    length = length_ratio * W * SCALE
    p3 = (x + math.cos(angle) * length, y + math.sin(angle) * length)
    draw_scratch(hd, sd, cd, (x, y), p3, 1.35, 188)

for cxr,cyr,rxr,ryr,start in [(.28,.42,.075,.045,202),(.40,.57,.095,.052,214),(.21,.66,.055,.034,188)]:
    cx,cy=cxr*W*SCALE,cyr*H*SCALE;rx,ry=rxr*W*SCALE,ryr*H*SCALE
    box=(cx-rx,cy-ry,cx+rx,cy+ry)
    sd.arc((box[0]+2*SCALE,box[1]+2*SCALE,box[2]+2*SCALE,box[3]+2*SCALE),start,start+82,fill=(3,8,11,74),width=3*SCALE)
    hd.arc(box,start,start+82,fill=(249,254,255,126),width=2*SCALE)

shadow = shadow.filter(ImageFilter.GaussianBlur(.72 * SCALE))
highlight = highlight.filter(ImageFilter.GaussianBlur(.16 * SCALE))
core = core.filter(ImageFilter.GaussianBlur(.24 * SCALE))

noise = Image.effect_noise((W // 3, H // 3), 34).resize(size, Image.Resampling.BICUBIC)
noise = ImageOps.autocontrast(noise).filter(ImageFilter.GaussianBlur(6 * SCALE))
mask = Image.new("L", size, 0)
md = ImageDraw.Draw(mask)
md.ellipse((W*.13*SCALE,H*.25*SCALE,W*.57*SCALE,H*.78*SCALE),fill=67)
md.ellipse((W*.20*SCALE,H*.37*SCALE,W*.49*SCALE,H*.67*SCALE),fill=37)
mask = mask.filter(ImageFilter.GaussianBlur(58 * SCALE))
noise = ImageChops.multiply(noise, mask).point(lambda p: round(p * .39))
haze = Image.new("RGBA", size, (226, 235, 234, 0)); haze.putalpha(noise)

residue = Image.new("RGBA", size, (0, 0, 0, 0)); rd = ImageDraw.Draw(residue, "RGBA")
for _ in range(24):
    x = random.uniform(.09, .39) * W * SCALE
    y = random.uniform(.81, .93) * H * SCALE
    r = random.choice([1.2, 1.6, 2.2, 3.0, 4.0]) * SCALE
    rd.ellipse((x-r,y-r,x+r,y+r),fill=(237,234,219,random.randint(92,165)))
for _ in range(4):
    x = random.uniform(.11,.34)*W*SCALE; y = random.uniform(.84,.92)*H*SCALE
    rd.line((x,y,x+random.uniform(22,64)*SCALE,y+random.uniform(-4,6)*SCALE),fill=(231,229,214,112),width=random.randint(2,3)*SCALE)
residue = residue.filter(ImageFilter.GaussianBlur(.22 * SCALE))

before = Image.alpha_composite(base, haze)
before = Image.alpha_composite(before, shadow)
before = Image.alpha_composite(before, core)
before = Image.alpha_composite(before, highlight)
before = Image.alpha_composite(before, residue)
before = before.resize((W, H), Image.Resampling.LANCZOS).convert("RGB")
before = ImageEnhance.Sharpness(before).enhance(1.08)
before.save(ASSETS / "glass-before.webp", "WEBP", quality=95, method=6)

box=(round(W*.09),round(H*.16),round(W*.61),round(H*.86))
for name in ("before","after"):
    image=Image.open(ASSETS/f"glass-{name}.webp").convert("RGB")
    detail=cover_crop(image.crop(box),(1200,900),.48,.50)
    detail=ImageEnhance.Sharpness(detail).enhance(1.14)
    detail.save(ASSETS/f"glass-{name}-detail.webp","WEBP",quality=95,method=6)

print("generated", *(p.name for p in sorted(ASSETS.glob("glass-*.webp"))))
