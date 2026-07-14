from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "glass-source.jpg"
W, H = 2400, 1500
SCALE = 2
random.seed(14072026)


def cover_crop(image: Image.Image, size: tuple[int, int], fx: float = .5, fy: float = .5) -> Image.Image:
    tw, th = size
    scale = max(tw / image.width, th / image.height)
    nw, nh = round(image.width * scale), round(image.height * scale)
    image = image.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, min(nw - tw, round((nw - tw) * fx)))
    top = max(0, min(nh - th, round((nh - th) * fy)))
    return image.crop((left, top, left + tw, top + th))


def cubic(p0, p1, p2, p3, steps=110):
    result = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        result.append((
            u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
            u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1],
        ))
    return result


def curve(p0, p3, bend=.024):
    dx, dy = p3[0]-p0[0], p3[1]-p0[1]
    length = max(1, math.hypot(dx, dy))
    nx, ny = -dy/length, dx/length
    p1 = (p0[0]+dx*.33+nx*random.uniform(-bend,bend)*length, p0[1]+dy*.33+ny*random.uniform(-bend,bend)*length)
    p2 = (p0[0]+dx*.67+nx*random.uniform(-bend,bend)*length, p0[1]+dy*.67+ny*random.uniform(-bend,bend)*length)
    return cubic(p0,p1,p2,p3)


def scratch(layers, p0, p3, width=.8, alpha=110, broken=False):
    shadow, core, light = layers
    pts = curve(p0,p3)
    segments=[]
    if broken:
        cursor=0
        while cursor < len(pts)-3:
            n=random.randint(10,24)
            segments.append(pts[cursor:min(len(pts),cursor+n)])
            cursor += n + random.randint(4,10)
    else:
        segments=[pts]
    sw=max(1,round(width*SCALE))
    for seg in segments:
        if len(seg)<2: continue
        shadow.line([(x+1.1*SCALE,y+1.0*SCALE) for x,y in seg],fill=(2,6,9,min(145,alpha)),width=sw+2,joint='curve')
        core.line(seg,fill=(116,151,158,min(120,alpha)),width=sw,joint='curve')
        light.line([(x-.55*SCALE,y-.5*SCALE) for x,y in seg],fill=(250,254,255,min(220,alpha+45)),width=max(1,sw-1),joint='curve')


ASSETS.mkdir(parents=True, exist_ok=True)
source=Image.open(SOURCE).convert('RGB')
clean=cover_crop(source,(W,H),.50,.50)
clean=ImageEnhance.Contrast(clean).enhance(1.045)
clean=ImageEnhance.Color(clean).enhance(.92)
clean=ImageEnhance.Sharpness(clean).enhance(1.18)
clean=ImageEnhance.Brightness(clean).enhance(.995)

grade=Image.new('RGBA',(W,H),(0,0,0,0))
gd=ImageDraw.Draw(grade,'RGBA')
gd.rectangle((0,0,W,H),fill=(8,15,18,9))
gd.polygon([(0,0),(W*.42,0),(W*.61,H),(W*.19,H)],fill=(201,229,234,9))
clean=Image.alpha_composite(clean.convert('RGBA'),grade).convert('RGB')
clean.save(ASSETS/'glass-after.webp','WEBP',quality=95,method=6)

base=clean.resize((W*SCALE,H*SCALE),Image.Resampling.LANCZOS).convert('RGBA')
shadow_img=Image.new('RGBA',base.size,(0,0,0,0))
core_img=Image.new('RGBA',base.size,(0,0,0,0))
light_img=Image.new('RGBA',base.size,(0,0,0,0))
layers=(ImageDraw.Draw(shadow_img,'RGBA'),ImageDraw.Draw(core_img,'RGBA'),ImageDraw.Draw(light_img,'RGBA'))

# Damage is concentrated in a believable working zone, not spread like a graphic pattern.
for _ in range(38):
    x=random.uniform(.12,.58)*W*SCALE; y=random.uniform(.13,.82)*H*SCALE
    length=random.uniform(.035,.095)*W*SCALE; angle=random.gauss(-.08,.20)
    scratch(layers,(x,y),(x+math.cos(angle)*length,y+math.sin(angle)*length),random.choice([.55,.7,.85]),random.randint(62,112),random.random()<.30)
for _ in range(11):
    x=random.uniform(.11,.52)*W*SCALE; y=random.uniform(.18,.79)*H*SCALE
    length=random.uniform(.11,.21)*W*SCALE; angle=random.gauss(-.09,.17)
    scratch(layers,(x,y),(x+math.cos(angle)*length,y+math.sin(angle)*length),random.choice([1.0,1.2,1.35]),random.randint(118,164),random.random()<.15)
for _ in range(3):
    x=random.uniform(.14,.39)*W*SCALE; y=random.uniform(.22,.67)*H*SCALE
    length=random.uniform(.23,.31)*W*SCALE; angle=random.uniform(-.21,.06)
    scratch(layers,(x,y),(x+math.cos(angle)*length,y+math.sin(angle)*length),random.choice([1.45,1.65]),random.randint(165,198))

shadow_img=shadow_img.filter(ImageFilter.GaussianBlur(.72*SCALE))
core_img=core_img.filter(ImageFilter.GaussianBlur(.25*SCALE))
light_img=light_img.filter(ImageFilter.GaussianBlur(.16*SCALE))

noise=Image.effect_noise((W//3,H//3),29).resize(base.size,Image.Resampling.BICUBIC)
noise=ImageOps.autocontrast(noise).filter(ImageFilter.GaussianBlur(9*SCALE))
mask=Image.new('L',base.size,0)
md=ImageDraw.Draw(mask)
md.ellipse((W*.11*SCALE,H*.20*SCALE,W*.60*SCALE,H*.84*SCALE),fill=50)
mask=mask.filter(ImageFilter.GaussianBlur(68*SCALE))
noise=ImageChops.multiply(noise,mask).point(lambda p:round(p*.28))
haze=Image.new('RGBA',base.size,(225,234,233,0)); haze.putalpha(noise)

residue=Image.new('RGBA',base.size,(0,0,0,0)); rd=ImageDraw.Draw(residue,'RGBA')
for _ in range(24):
    x=random.uniform(.08,.38)*W*SCALE; y=random.uniform(.82,.94)*H*SCALE
    r=random.choice([1.4,1.9,2.5,3.4,4.5])*SCALE
    rd.ellipse((x-r,y-r,x+r,y+r),fill=(237,235,222,random.randint(95,172)))
residue=residue.filter(ImageFilter.GaussianBlur(.22*SCALE))

before=Image.alpha_composite(base,haze)
before=Image.alpha_composite(before,shadow_img)
before=Image.alpha_composite(before,core_img)
before=Image.alpha_composite(before,light_img)
before=Image.alpha_composite(before,residue)
before=before.resize((W,H),Image.Resampling.LANCZOS).convert('RGB')
before=ImageEnhance.Sharpness(before).enhance(1.05)
before.save(ASSETS/'glass-before.webp','WEBP',quality=95,method=6)

box=(round(W*.10),round(H*.15),round(W*.62),round(H*.87))
for name in ('before','after'):
    image=Image.open(ASSETS/f'glass-{name}.webp').convert('RGB').crop(box)
    detail=cover_crop(image,(1200,900),.50,.50)
    detail=ImageEnhance.Sharpness(detail).enhance(1.12)
    detail.save(ASSETS/f'glass-{name}-detail.webp','WEBP',quality=95,method=6)

diff=sum(ImageStat.Stat(ImageChops.difference(before,clean)).mean)/3
assert 1.4 < diff < 18, diff
print('generated',before.size,'mean-diff',round(diff,3))
