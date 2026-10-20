"""Read-only sampling of the supplied GLB texture for mesh vertex colours.

No bitmap is generated or edited. UVs arrive on stdin; RGB samples leave stdout.
"""
import io
import json
import struct
import sys
from PIL import Image

payload = json.load(sys.stdin)
raw = open(payload['file'], 'rb').read()
length = struct.unpack_from('<I', raw, 12)[0]
gltf = json.loads(raw[20:20 + length])
binary = raw[28 + length:]
texture = gltf['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
image = gltf['images'][gltf['textures'][texture]['source']]
view = gltf['bufferViews'][image['bufferView']]
offset = view.get('byteOffset', 0)
bitmap = Image.open(io.BytesIO(binary[offset:offset + view['byteLength']])).convert('RGB')
pixels = bitmap.load()
samples = []
for u, v in payload['uvs']:
    x = min(bitmap.width - 1, max(0, int(u * bitmap.width)))
    y = min(bitmap.height - 1, max(0, int(v * bitmap.height)))
    samples.extend(pixels[x, y])
json.dump(samples, sys.stdout)
