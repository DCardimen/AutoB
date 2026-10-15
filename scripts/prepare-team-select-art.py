"""Slice the supplied team-select UI sheets; never modify creature artwork."""
from pathlib import Path
import sys
from PIL import Image

source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads'
dest = Path(__file__).resolve().parents[1] / 'public' / 'ui'

def crop(sheet, name, box):
    Image.open(source / f'download ({sheet}).png').crop(box).save(dest / f'team-{name}.png')

Image.open(source / 'download (9).png').save(dest / 'team-backdrop.png')
crop(10, 'challenge-panel', (82, 108, 615, 515))
crop(10, 'companions-panel', (722, 110, 1487, 515))
crop(10, 'party-panel', (48, 740, 755, 834))
crop(14, 'ground-ember', (31, 755, 390, 940))
crop(14, 'ground-grove', (407, 745, 762, 940))
crop(14, 'ground-tide', (798, 485, 1132, 676))
crop(14, 'ground-storm', (787, 745, 1135, 940))
crop(14, 'ground-void', (1165, 505, 1518, 676))
crop(13, 'begin', (39, 170, 382, 318))
for name, box in {
    'explorer': (50, 68, 251, 288),
    'expedition': (295, 70, 510, 299),
    'veteran': (548, 72, 738, 290),
    'chaos': (774, 64, 1013, 305),
}.items():
    crop(12, name, box)

# Reuse the exact backdrop foliage as a foreground layer. Narrow, uneven
# feathered edges bring leaves over panel borders without covering controls.
leaves = Image.open(dest / 'team-backdrop.png').convert('RGBA')
w, h = leaves.size
alpha = Image.new('L', (w, h))
values = []
pixels = leaves.load()
for y in range(h):
    for x in range(w):
        xn, yn = x / w, y / h
        edge = min(xn, 1 - xn)
        side = .034 + (.009 if .38 < yn < .68 else 0) + (.012 if yn > .78 else 0)
        strength = max(0, min(1, (side - edge) / .012))
        if yn > .962:
            strength = max(strength, min(1, (yn - .962) / .022))
        r, g, b, _ = pixels[x, y]
        # Keep actual green/gold foliage and warm branches; drop blue sky and
        # forest haze so only leaf silhouettes cross the authored panel edge.
        foliage = (g > r * 1.04 and g > b * 1.04) or (r > b * 1.3 and g > b * .95)
        values.append(round(255 * strength) if foliage else 0)
alpha.putdata(values)
leaves.putalpha(alpha)
leaves.save(dest / 'team-foliage.png')
print('Prepared supplied team-selection art and foreground foliage.')
