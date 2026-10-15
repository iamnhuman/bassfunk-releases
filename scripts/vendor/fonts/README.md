# WAVE title fonts

The title uses Troika Three Text and `wave-title-complete.woff`: Exo 2 at weight
650, with Noto glyphs for Japanese and symbolic release names. The combined
font covers every release title in `data/releases.json` and is served locally.
Troika handles shaping, kerning and antialiasing; a custom SDF shader adds the
chrome reflection and rounded relief. No external font service is needed for
the current catalog.

Rebuild the runtime font with fonttools and the source fonts listed below:

```sh
python3 scripts/build-wave-title-fonts.py Exo2.ttf NotoSansJP.ttf \
  NotoSansSymbols2.ttf NotoSansCanadianAboriginal.ttf \
  NotoSansSymbols.ttf NotoSansMath.ttf
npm run build:wave-title
```

The following JSON outline assets are retained for the earlier geometry renderer.

`unbounded-display.json` contains vector outlines of Unbounded at weight 600.
Japanese and symbolic release names use the subset of Noto and Exo 2 outlines
in `exo2-heavy.json`, normalized to the display font's coordinate system.
They can be used to extrude actual 3D meshes.

All source fonts use SIL OFL 1.1. See `Unbounded-OFL.txt`, `Exo2-OFL.txt`, `Noto-OFL.txt`, and
`NOTICE.txt` for licenses and copyright notices.

Sources in the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl):

- `exo2/Exo2[wght].ttf`
- `unbounded/Unbounded[wght].ttf`
- `notosansjp/NotoSansJP[wght].ttf`
- `notosanssymbols2/NotoSansSymbols2-Regular.ttf`
- `notosanscanadianaboriginal/NotoSansCanadianAboriginal[wght].ttf`
- `notosanssymbols/NotoSansSymbols[wght].ttf`
- `notosansmath/NotoSansMath-Regular.ttf`

To rebuild, install `fonttools`, download those fonts, and run:

```sh
python3 scripts/build-wave-font.py Exo2.ttf NotoSansJP.ttf NotoSansSymbols2.ttf \
  NotoSansCanadianAboriginal.ttf NotoSansSymbols.ttf NotoSansMath.ttf
python3 scripts/build-wave-font.py Unbounded.ttf --weight 600 --family Unbounded \
  --output unbounded-display.json --fallback-json scripts/vendor/fonts/exo2-heavy.json
```

The converter checks coverage against `data/releases.json` and normalizes all
fallback outlines to Exo 2's coordinate system.
