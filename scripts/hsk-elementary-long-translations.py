"""Find HSK Elementary translations exceeding a character threshold."""
import json
import sys

threshold = int(sys.argv[1]) if len(sys.argv) > 1 else 20

with open('app-web/data/chinese/hskv3elementary.json') as f:
    d = json.load(f)

long = [(g['group'], i['word'], i['english'], len(i['english']))
        for g in d['groups'] for i in g['items']
        if len(i['english']) > threshold]
long.sort(key=lambda x: -x[3])

print(f"Translations > {threshold} chars: {len(long)}")
for g, w, e, n in long:
    print(f"  G{g:02d} {w}: \"{e}\" ({n})")
