"""HSK Elementary dataset statistics: word counts, char counts, POS distribution, word lengths."""
import json

with open('app-web/data/chinese/hskv3elementary.json') as f:
    d = json.load(f)

from collections import Counter

total_words = sum(len(g['items']) for g in d['groups'])
total_groups = len(d['groups'])

# Per-level unique words
levels = {}
for g in d['groups']:
    for item in g['items']:
        for tag in item['tags']:
            if tag.startswith('L'):
                levels.setdefault(tag, set()).add(item['word'])

# Unique characters
all_chars = set()
for g in d['groups']:
    for item in g['items']:
        for ch in item['word']:
            if '\u4e00' <= ch <= '\u9fff':
                all_chars.add(ch)

# Word length distribution
word_lengths = Counter()
for g in d['groups']:
    for item in g['items']:
        char_count = sum(1 for ch in item['word'] if '\u4e00' <= ch <= '\u9fff')
        word_lengths[char_count] += 1

# POS/category tags
pos_tags = Counter()
for g in d['groups']:
    for item in g['items']:
        for tag in item['tags']:
            if not tag.startswith('L'):
                pos_tags[tag] += 1

# Groups per level
level_groups = {}
for g in d['groups']:
    level_tags = set()
    for item in g['items']:
        for tag in item['tags']:
            if tag.startswith('L'):
                level_tags.add(tag)
    for lt in level_tags:
        level_groups.setdefault(lt, []).append(g['group'])

# Print
print(f"Total groups: {total_groups}")
print(f"Total words: {total_words}")
print(f"Unique Chinese characters: {len(all_chars)}")

print("\nWords per level:")
for l in sorted(levels):
    print(f"  {l}: {len(levels[l])} unique words")

print("\nWord lengths (chars):")
for k in sorted(word_lengths):
    print(f"  {k} char(s): {word_lengths[k]} words")

print("\nPOS/Category tags:")
for tag, count in pos_tags.most_common(20):
    print(f"  {tag}: {count}")

print("\nGroups per level:")
for l in sorted(level_groups):
    gs = level_groups[l]
    print(f"  {l}: groups {min(gs)}-{max(gs)} ({len(gs)} groups)")
