"""Extract the October UI uploads without repainting or modifying the originals.

Run from any directory. Crops, source hashes and output sizes are recorded so
every production asset can be traced back to the supplied sheet.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'ui' / 'uploaded'
DEST.mkdir(parents=True, exist_ok=True)
manifest = {}


def extract(source, name, box=None, size=256, trim=True, exclude=None):
    im = Image.open(ROOT / source).convert('RGBA')
    box = box or (0, 0, *im.size)
    im = im.crop(box)
    if exclude is not None:
        # Exclude only silhouettes assigned to another item. This keeps the
        # chosen item's detached sparks and glow, but removes a neighboring
        # boot or blade that crosses into the crop. Originals stay untouched.
        a = np.array(im.getchannel('A'))
        a[ndimage.binary_dilation(exclude, iterations=2)] = 0
        im.putalpha(Image.fromarray(a))
    if trim:
        bounds = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        if bounds:
            # Retain a small transparent safety margin around authored glows.
            bounds = (max(0, bounds[0]-3), max(0, bounds[1]-3), min(im.width, bounds[2]+3), min(im.height, bounds[3]+3))
            im = im.crop(bounds)
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    im.save(DEST / (name + '.png'), optimize=True)
    manifest[name] = {'source': source, 'crop': list(box), 'size': list(im.size), 'sha256': hashlib.sha256((ROOT / source).read_bytes()).hexdigest()}


def grid(source, prefix, columns, rows, names=None, size=256, trim=True, isolate=False):
    w, h = Image.open(ROOT / source).size
    # Item sheets are not perfectly aligned to equal cells. Find each authored
    # silhouette in the complete sheet before slicing, retaining sword tips
    # that cross a nominal cell and excluding fragments of adjacent items.
    if isolate:
        original = Image.open(ROOT / source).convert('RGBA')
        alpha = np.array(original.getchannel('A'))
        labels, count = ndimage.label(alpha > 80)
        boxes = ndimage.find_objects(labels)
        areas = np.bincount(labels.ravel())
        # A relic may deliberately comprise disconnected shards. Assign every
        # component to its sheet position and union the entire group, instead
        # of assuming the largest connected component is the complete item.
        owners = np.full(count+1, -1, dtype=int)
        regions = [[] for _ in range(columns*rows)]
        for n, region in enumerate(boxes):
            if not region or areas[n+1] < 4:
                continue
            ys, xs = region
            col = min(columns-1, int((xs.start+xs.stop)/2/w*columns))
            row = min(rows-1, int((ys.start+ys.stop)/2/h*rows))
            owner = row*columns+col
            owners[n+1] = owner
            regions[owner].append(region)
    for i in range(columns * rows):
        x, y = i % columns, i // columns
        if isolate:
            group = regions[i]
            if not group:
                raise ValueError(f'Empty authored item: {source} cell {i}')
            pad = 9
            box = (max(0,min(r[1].start for r in group)-pad),max(0,min(r[0].start for r in group)-pad),min(w,max(r[1].stop for r in group)+pad),min(h,max(r[0].stop for r in group)+pad))
            region_labels = labels[box[1]:box[3],box[0]:box[2]]
            exclude = (owners[region_labels] >= 0) & (owners[region_labels] != i)
            extract(source, names[i] if names else f'{prefix}-{i:02}', box, size, trim, exclude)
            continue
        extract(source, names[i] if names else f'{prefix}-{i:02}', (round(x*w/columns), round(y*h/rows), round((x+1)*w/columns), round((y+1)*h/rows)), size, trim)


# All items from both weapon, both armor and all four relic sheets are retained.
for source, prefix in [('wep 1.png', 'weapon'), ('wep arm 2.png', 'focus'), ('arm 1.png', 'armor'), ('arm 2.png', 'accessory')]:
    grid(source, prefix, 5, 5, isolate=True)
grid('fang and animal items.png', 'animal', 5, 5, isolate=True)
for n in range(1, 5):
    grid(f'rel {n}.png', f'relic-{n}', 5, 5, isolate=True)

icon_names = 'battle formation team capture log scout arrow chevron gold sprout heart star grove target stop info sound help settings pause play close check menu attack shield healing storm sparkle lock plus circle victory elite magic diamond focus guard swords bow'.split()
# These sheets use inset evenly spaced centres rather than full-cell centres.
for i, name in enumerate(icon_names):
    cx, cy = 120 + (i % 8)*187, 151 + (i // 8)*181
    extract('aren 1.png', 'icon-'+name, (cx-83, cy-83, cx+83, cy+83), 64)
grid('aren 7.png', 'rich', 4, 3, size=96)
grid('aren 9.png', 'skill', 4, 3, size=96)

for col, tier in enumerate(['scout', 'runic', 'astral', 'mythic']):
    for row, state in enumerate(['idle', 'ready', 'active', 'spent']):
        boundaries=[0,309,583,837,1086]
        extract('captures art 1.png', f'capture-{tier}-{state}', (col*362, boundaries[row], (col+1)*362, boundaries[row+1]), 160)

# Animation cells keep identical dimensions and a fixed ground plane. Trimming
# each frame independently would make the chest visibly jump between frames.
for source, prefix in [('chest opening.png', 'chest'), ('chest.png', 'cache'), ('napsack 1.png', 'pack')]:
    grid(source, prefix, 4, 3, size=300, trim=False)
grid('post match 3.png', 'treasure', 4, 3, size=160)
grid('post match 4.png', 'effect', 5, 4, size=128, trim=False)

for source, name in [('bAK 1.png','world-0'), ('bak 2.png','world-1'), ('bak 3.png','world-2'), ('background post match.png','rewards-backdrop')]:
    extract(source, name, size=1600, trim=False)

crops = [
 ('aren 2.png','brand-crest',(1350,755,1536,940),128),
 ('aren 2.png','bar-track',(48,172,268,208),240),
 ('aren 2.png','bar-health',(303,171,518,206),240),
 ('aren 2.png','bar-enemy',(553,171,768,206),240),
 ('aren 2.png','bar-stamina',(805,171,1052,206),260),
 ('aren 2.png','bar-poise',(1086,171,1312,206),240),
 ('aren 3.png','arena-frame',(24,85,442,403),600),
 ('aren 3.png','side-panel',(503,85,682,405),360),
 ('aren 3.png','gold-action',(456,758,930,869),480),
 ('aren 3.png','dark-action',(948,758,1338,868),420),
 ('aren 3.png','panel',(728,130,1131,354),500),
 ('aren 5.png','leaf-panel',(49,31,970,520),800),
 ('aren 5.png','toolbar',(49,551,1286,744),800),
 ('aren 6.png','tab',(48,88,482,229),440),
 ('aren 6.png','tab-hover',(510,88,942,229),440),
 ('aren 6.png','tab-selected',(965,88,1399,229),440),
 ('aren 6.png','tab-disabled',(1424,88,1858,229),440),
 ('aren 10.png','gear-slot',(51,124,438,322),440),
 ('aren 10.png','gear-slot-active',(836,120,1232,331),440),
 ('aren 10.png','empty-slot',(60,354,430,585),400),
 ('aren 10.png','empty-slot-active',(454,354,829,585),400),
 ('aren 8.png','element-tide',(189,384,407,611),128),
 ('aren 8.png','element-ember',(548,384,764,611),128),
 ('aren 8.png','element-storm',(906,384,1128,611),128),
 ('cards and post match 1.png','reward-card',(85,20,333,344),360),
 ('cards and post match 1.png','reward-card-hover',(449,20,705,344),360),
 ('cards and post match 1.png','reward-card-selected',(825,20,1080,344),360),
 ('cards and post match 1.png','reward-card-grove',(85,348,333,667),360),
 ('cards and post match 1.png','collect-button',(32,680,390,803),440),
 ('cards and post match 1.png','collect-hover',(402,680,762,803),440),
 ('post match 2.png','result-panel',(30,68,615,410),700),
 ('post match 2.png','capture-failed',(720,515,1105,688),400),
 ('post match 2.png','capture-success',(1125,515,1512,688),400),
 ('post match 2.png','capture-neutral',(34,777,438,951),400),
 ('post match 5.png','reward-plinth',(0,100,786,490),800),
 ('post match 5.png','small-plinth',(780,213,1155,480),400),
 ('post match 5.png','reward-leaves',(1156,47,1536,478),400),
 ('post match 5.png','reward-rays',(0,495,578,1024),600),
 ('post match 5.png','reward-sparkles',(630,525,965,1015),400),
 ('post match 5.png','xp-trails',(982,513,1536,1024),600),
]
for source, name, box, size in crops:
    extract(source, name, box, size)

# Preserve all button states and the bar/ornament sheet for the shared UI skin.
grid('aren 4.png', 'button', 4, 5, size=240)
extract('aren 2.png','bars',size=768,trim=False)
extract('download (11).png','companion-card',(52,49,407,578),400)
extract('download (12).png','element-grove',(40,46,265,305),128)
extract('aren 9.png','element-void',(1145,319,1515,664),128)

(DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf8')
paths = {name: '/public/ui/uploaded/'+name+'.png' for name in manifest}
(ROOT / 'ui-art-assets.js').write_text('// Generated by scripts/prepare-uploaded-ui-art.py.\nexport const UI_ART = Object.fromEntries(Object.entries('+json.dumps(paths,indent=2)+').map(([key, src]) => [key, embeddedArtURL(src)]));\n\nfunction embeddedArtURL(src) {\n if (!src.startsWith("data:")) return src;\n const raw = atob(src.slice(src.indexOf(",")+1));\n return URL.createObjectURL(new Blob([Uint8Array.from(raw, c => c.charCodeAt(0))], {type: "image/png"}));\n}\n', encoding='utf8')
print(f'Prepared {len(manifest)} supplied art assets with source provenance.')
