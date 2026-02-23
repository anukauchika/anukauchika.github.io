"""HSK Elementary: cumulative unique chars as words grow — shows diminishing ratio."""
import json

with open('app-web/data/chinese/hskv3elementary.json') as f:
    d = json.load(f)

# Cumulative unique chars at each group boundary
chars_seen = set()
words_seen = 0

print("Per-group cumulative:")
print(f"  {'Group':>5}  {'Words':>5}  {'Chars':>5}  {'Ratio':>5}")
for g in d['groups']:
    for item in g['items']:
        words_seen += 1
        for ch in item['word']:
            if '\u4e00' <= ch <= '\u9fff':
                chars_seen.add(ch)
    ratio = len(chars_seen) / words_seen
    print(f"  G{g['group']:>3}  {words_seen:5d}  {len(chars_seen):5d}  {ratio:.2f}")

# Per-level new chars ratio
print("\nPer-level new chars:")
chars_all = set()
words_all = 0
level_ranges = {'L1': (0, 20), 'L2': (20, 34), 'L3': (34, 67)}
for level, (start, end) in level_ranges.items():
    level_chars_before = len(chars_all)
    level_words = 0
    for g in d['groups'][start:end]:
        for item in g['items']:
            words_all += 1
            level_words += 1
            for ch in item['word']:
                if '\u4e00' <= ch <= '\u9fff':
                    chars_all.add(ch)
    new_chars = len(chars_all) - level_chars_before
    print(f"  {level}: +{level_words} words, +{new_chars} new chars, {new_chars/level_words:.2f} new chars/word")

# Key milestones
print("\nMilestones:")
chars_seen2 = set()
words2 = 0
milestones = [100, 200, 300, 500, 700, 1000]
mi = 0
for g in d['groups']:
    for item in g['items']:
        words2 += 1
        for ch in item['word']:
            if '\u4e00' <= ch <= '\u9fff':
                chars_seen2.add(ch)
        if mi < len(milestones) and words2 == milestones[mi]:
            print(f"  {words2:4d} words → {len(chars_seen2):4d} chars ({len(chars_seen2)/words2:.0%})")
            mi += 1
