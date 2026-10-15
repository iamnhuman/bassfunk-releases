"""Build the local Troika title font from Exo2.ttf and fallback TTFs.
Requires fonttools. All inputs are SIL OFL; licenses live in vendor/fonts.
"""
import json
import sys
import tempfile
from pathlib import Path
from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont
from fontTools.ttLib.scaleUpem import scale_upem
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent.parent
catalog = json.loads((root / 'data/releases.json').read_text())
required = set(''.join(item.get('releaseTitle', '') for item in catalog['items']))
required.update(chr(code) for code in range(32, 127))
covered = set()
with tempfile.TemporaryDirectory() as directory:
    paths = []
    for index, filename in enumerate(sys.argv[1:]):
        font = TTFont(filename)
        chars = (required - covered) & set(map(chr, font.getBestCmap()))
        if not chars:
            continue
        if 'fvar' in font:
            axes = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
            axes['wght'] = 650
            font = instantiateVariableFont(font, axes, inplace=True)
        options = subset.Options()
        options.name_IDs = ['*']
        selected = subset.Subsetter(options=options)
        selected.populate(text=''.join(chars))
        selected.subset(font)
        if font['head'].unitsPerEm != 1000:
            scale_upem(font, 1000)
        for tag in ['MATH', 'vhea', 'vmtx', 'VORG', 'BASE']:
            if tag in font:
                del font[tag]
        path = Path(directory) / f'font-{index}.ttf'
        font.save(path)
        paths.append(str(path))
        covered.update(chars)
    if required - covered:
        raise SystemExit(f'Uncovered release characters: {required - covered}')
    merged = Merger().merge(paths)
    merged.flavor = 'woff'
    merged.save(root / 'scripts/vendor/fonts/wave-title-complete.woff')
print(f'Local font coverage: {len(covered)} characters')
