"""Package verified V14 artifacts; no external dependencies."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ART = ROOT / 'playtest-artifacts'

assert 'pass 182' in (ART / 'v14-final-tests.log').read_text(encoding='utf-8')
assert 'fail 0' in (ART / 'v14-final-tests.log').read_text(encoding='utf-8')
assert 'Standalone HTML runs combat and pose inspection with zero external requests' in (ART / 'v14-complete-prototype.log').read_text(encoding='utf-8')
assert 'Godot native run passed.' in (ART / 'v14-final-native-godot.log').read_text(encoding='utf-8')
assert 'Godot assets passed.' in (ART / 'v14-final-prototype-godot.log').read_text(encoding='utf-8')

def archive(target, files):
    with zipfile.ZipFile(PUBLIC / target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as out:
        for path, name in files:
            out.write(path, name)
    with zipfile.ZipFile(PUBLIC / target) as out:
        assert out.testzip() is None
    print(target, (PUBLIC / target).stat().st_size, 'bytes; CRC verified')

for src, dst in [('v3-evolution-benchmarks.png', 'sprite-art-v3-evolutions.png'),
                 ('v3-final-directions-heroes.png', 'sprite-art-v3-directions.png'),
                 ('v3-evolution-beasts.png', 'sprite-art-v3-creatures.png')]:
    shutil.copyfile(ART / src, PUBLIC / dst)

report = {
    'release': 'V14 / Art V3', 'applicationVersion': '0.10.0', 'saveSchema': 5,
    'sourceAnatomies': 41, 'developmentalStages': 3, 'directions': 8,
    'collectionFamilies': 89, 'nativeGameplayFamilies': 29,
    'provenance': 'AI-generated bitmap masters; deterministic indexed imports; rig-driven animation and separate equipment',
    'unitTests': {'passed': 182, 'failed': 0, 'log': 'v14-final-tests.log'},
    'nativeExport': {'families': 29, 'variants': 117, 'cells': 127296},
    'trainingExport': {'actors': 9, 'cells': 9792},
    'sourceRetention': {'aurel': [864, 864], 'syl': [1007, 1007], 'nyra': [1053, 1053]},
    'campaigns': {'standard': {'seed': 3, 'worlds': 3, 'fights': 15}, 'chaos1': {'seed': 3, 'worlds': 3, 'fights': 15}},
    'motionPreview': {'seconds': 18, 'fps': 30, 'frames': 540},
    'visualSelfReview': {key: 9 for key in ['chibiProportions', 'facesPersonality', 'clothingEquipment', 'shadingColor', 'creatureIndividuality', 'environmentFit']},
    'reviewCaveat': 'Subjective self-review, not user acceptance or automated art scoring. Related legacy entries share templates and some paired views mirror. Animation uses deformation, not bespoke action sheets.',
    'sourceHashes': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(PUBLIC.glob('authored-*-source.png'))},
}
(ROOT / 'tests/reports/sprite-art-v3.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

logs = ['v14-final-tests.log', 'v14-complete-prototype.log', 'v14-final-art.log',
        'v14-final-standalone.log', 'v14-final-offline.log', 'v14-export-native.log',
        'v14-final-export-prototype.log', 'v14-final-native-godot.log',
        'v14-final-prototype-godot.log', 'v3-standard-campaign.log',
        'v14-chaos-campaign.log', 'v14-equipment.log', 'v3-controls.log',
        'v3-roster.log', 'v14-final-record.log', 'v3-motion-recording.json']
evidence = [(ART / name, name) for name in logs]
evidence += [(p, p.name) for pattern in ['v3-evolution-*.png', 'v3-final-directions-*.png', 'v3-motion-frame-*.png'] for p in sorted(ART.glob(pattern))]
evidence += [(ROOT / 'tests/reports/sprite-art-v3.json', 'sprite-art-v3.json')]
archive('art-v3-release-evidence.zip', evidence)

playable = ['Starfall-Menagerie.html', 'Starfall-Training-Glade.html', 'SPRITE-ART-V3.md']
media = ['sprite-art-v3-preview.webm', 'sprite-art-v3-evolutions.png', 'sprite-art-v3-directions.png', 'sprite-art-v3-creatures.png']
archive('Starfall-V14-Art-V3.zip', [(ROOT / p, p) for p in playable] + [(PUBLIC / p, p) for p in media])
for directory, target in [(ART / 'native-sprites-v14', 'native-roster-godot-v14.zip'), (ROOT / 'godot-sprites', 'training-glade-godot-v9.zip')]:
    files = [(p, p.relative_to(directory).as_posix()) for p in sorted(directory.rglob('*'))
             if p.is_file() and '.godot' not in p.relative_to(directory).parts and p.suffix != '.import']
    if target.startswith('native-'):
        # Keep every checked-in archive below GitHub's per-file limit.
        # Extract all ordinary ZIPs into the same directory before opening.
        chunks, current, size = [], [], 0
        for entry in files:
            if current and size + entry[0].stat().st_size > 70 * 1024 * 1024:
                chunks.append(current)
                current, size = [], 0
            current.append(entry)
            size += entry[0].stat().st_size
        if current:
            chunks.append(current)
        for i, chunk in enumerate(chunks, 1):
            archive(target.replace('.zip', f'-part{i}.zip'), chunk)
    else:
        archive(target, files)
