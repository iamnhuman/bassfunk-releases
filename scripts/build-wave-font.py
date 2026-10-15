"""Convert OFL fonts to compact vector outlines for the WAVE title.

Usage: python3 scripts/build-wave-font.py /path/to/Exo2[wght].ttf [fallback.ttf ...]
Requires fonttools; the generated JSON is used directly, without a font parser.
Source: https://github.com/google/fonts/tree/main/ofl/exo2
"""
import argparse
import json
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


class OutlinePen(BasePen):
    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.commands = []

    def command(self, kind, *points):
        self.commands.append([kind, *[round(v, 2) for p in points for v in p]])

    def _moveTo(self, p):
        self.command("m", p)

    def _lineTo(self, p):
        self.command("l", p)

    def _qCurveToOne(self, p1, p2):
        self.command("q", p1, p2)

    def _curveToOne(self, p1, p2, p3):
        self.command("b", p1, p2, p3)

    def _closePath(self):
        self.command("z")

    def _endPath(self):
        self.command("z")


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("font")
parser.add_argument("fallbacks", nargs="*")
parser.add_argument("--weight", type=int, default=800)
parser.add_argument("--family", default="Exo 2")
parser.add_argument("--output", default="exo2-heavy.json")
parser.add_argument("--fallback-json")
args = parser.parse_args()
font = TTFont(args.font)
if "fvar" in font:
    font = instantiateVariableFont(font, {"wght": args.weight}, inplace=True)
glyph_set = font.getGlyphSet()
glyphs = {}
for code, name in font.getBestCmap().items():
    pen = OutlinePen(glyph_set)
    glyph_set[name].draw(pen)
    glyphs[chr(code)] = {"advance": glyph_set[name].width, "path": pen.commands}
output = Path(__file__).parent / "vendor/fonts" / args.output
catalog = json.loads((Path(__file__).parent.parent / "data/releases.json").read_text())
required = set("".join(item.get("releaseTitle", "") for item in catalog["items"]))
for filename in args.fallbacks:
    fallback = TTFont(filename)
    codes = {ord(c) for c in required - glyphs.keys()} & fallback.getBestCmap().keys()
    if not codes:
        continue
    selected = subset.Subsetter()
    selected.populate(unicodes=codes)
    selected.subset(fallback)
    if "fvar" in fallback:
        fallback = instantiateVariableFont(fallback, {"wght": args.weight}, inplace=True)
    fallback_set = fallback.getGlyphSet()
    scale = font["head"].unitsPerEm / fallback["head"].unitsPerEm
    for code, name in fallback.getBestCmap().items():
        pen = OutlinePen(fallback_set)
        fallback_set[name].draw(pen)
        commands = [[command[0], *[round(v * scale, 2) for v in command[1:]]] for command in pen.commands]
        glyphs[chr(code)] = {"advance": round(fallback_set[name].width * scale, 2), "path": commands}
if args.fallback_json:
    fallback = json.loads(Path(args.fallback_json).read_text())
    scale = font["head"].unitsPerEm / fallback["units"]
    for character in required - glyphs.keys():
        if character in fallback["glyphs"]:
            data = fallback["glyphs"][character]
            glyphs[character] = {"advance": round(data["advance"] * scale, 2),
                "path": [[command[0], *[round(v * scale, 2) for v in command[1:]]]
                         for command in data["path"]]}
missing = required - glyphs.keys()
if missing:
    raise ValueError(f"Missing title characters: {sorted(missing)}")
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({"family": args.family, "units": font["head"].unitsPerEm,
                              "glyphs": glyphs}, ensure_ascii=False, separators=(",", ":")))
print(f"{len(glyphs)} glyphs, {output.stat().st_size} bytes -> {output}")
