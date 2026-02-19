#!/usr/bin/env python3
"""
Generate HSK 3.0 elementary (L1–L3) vocab JSON from the official PDF and CEDICT.
"""

from __future__ import annotations

import gzip
import json
import re
import unicodedata
from pathlib import Path


PDF_TXT = Path("/tmp/hskv3_raw.txt")
CEDICT_GZ = Path("cedict_1_0_ts_utf-8_mdbg.txt.gz")
DEFAULT_OUT_JSON = Path("data/chinese/hskv3elementary.json")


def apply_tone(base: str, tone: int) -> str:
    if tone <= 0 or tone == 5:
        return base
    s = base.replace("u:", "ü").replace("v", "ü")
    lower = s.lower()
    mark_index = None
    for v in ["a", "e", "o"]:
        if v in lower:
            mark_index = lower.index(v)
            break
    if mark_index is None:
        if "iu" in lower:
            mark_index = lower.index("u")
        elif "ui" in lower:
            mark_index = lower.index("i")
        else:
            for i in range(len(lower) - 1, -1, -1):
                if lower[i] in ["a", "e", "i", "o", "u", "ü"]:
                    mark_index = i
                    break
    if mark_index is None:
        return s
    ch = s[mark_index]
    base_v = ch.lower()
    vowel_tone = {
        "a": ["ā", "á", "ǎ", "à"],
        "e": ["ē", "é", "ě", "è"],
        "i": ["ī", "í", "ǐ", "ì"],
        "o": ["ō", "ó", "ǒ", "ò"],
        "u": ["ū", "ú", "ǔ", "ù"],
        "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
    }
    if base_v not in vowel_tone:
        return s
    toned = vowel_tone[base_v][tone - 1]
    if ch.isupper():
        toned = toned.upper()
    return s[:mark_index] + toned + s[mark_index + 1 :]


_NUM_RE = re.compile(r"^(.*?)([1-5])$")


def pinyin_num_to_tone(pinyin_num: str) -> str:
    parts = pinyin_num.split()
    add_r = False
    if len(parts) >= 2 and parts[-1] in {"r5", "r"}:
        add_r = True
        parts = parts[:-1]
    out = []
    for i, p in enumerate(parts):
        m = _NUM_RE.match(p)
        if not m:
            syl = p.replace("u:", "ü").replace("v", "ü")
        else:
            base, tone_s = m.groups()
            syl = apply_tone(base, int(tone_s))
        if add_r and i == len(parts) - 1:
            syl += "r"
        out.append(syl)
    return " ".join(out)


def strip_tone_marks(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def load_pdf_entries(levels: set[str], txt_path: Path) -> list[dict]:
    if not txt_path.exists():
        raise SystemExit(f"missing {txt_path}; run pdftotext -raw first")
    text = txt_path.read_text()
    start = text.find("序号 等级 词语 拼音 词性")
    if start == -1:
        raise SystemExit("header not found")
    section = text[start:]
    end = section.find("汉字大纲")
    if end != -1:
        section = section[:end]
    lines = [l.strip() for l in section.splitlines()]

    entries = []
    for l in lines:
        if not re.match(r"^\d+\s+\d", l):
            continue
        tokens = l.split()
        if len(tokens) < 4:
            continue
        idx = int(tokens[0])
        level = tokens[1]
        word = tokens[2]
        pinyin_pdf = tokens[3]
        pos_raw = " ".join(tokens[4:])
        base = level.split("（")[0]
        if base == "7-9":
            if not ({"7", "8", "9", "7-9"} & levels):
                continue
            level_tag = "L7-9"
        else:
            if base not in levels:
                continue
            level_tag = f"L{base}"
        word = re.sub(r"(\D)\d+$", r"\1", word)
        entries.append(
            {
                "idx": idx,
                "level": level_tag,
                "word": word,
                "pinyin_pdf": pinyin_pdf,
                "pos_raw": pos_raw,
            }
        )

    entries.sort(key=lambda x: x["idx"])
    return entries


def load_cedict() -> dict:
    if not CEDICT_GZ.exists():
        raise SystemExit("missing cedict_1_0_ts_utf-8_mdbg.txt.gz")
    cedict = {}
    with gzip.open(CEDICT_GZ, "rt", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$", line)
            if not m:
                continue
            _trad, simp, pinyin_num, glosses = m.groups()
            gloss_list = [g for g in glosses.split("/") if g]
            cedict.setdefault(simp, []).append(
                {"pinyin_num": pinyin_num, "glosses": gloss_list}
            )
    return cedict


POS_MAP = {
    "名": "noun",
    "动": "verb",
    "形": "adjective",
    "副": "adverb",
    "代": "pronoun",
    "数": "number",
    "量": "measure word",
    "连": "conjunction",
    "介": "preposition",
    "助": "particle",
    "叹": "interjection",
    "后缀": "suffix",
    "前缀": "prefix",
}


def map_pos(pos_raw: str, word: str) -> str:
    if not pos_raw:
        return "phrase" if len(word) > 1 else "noun"
    cleaned = pos_raw.replace("（", "").replace("）", "")
    parts = re.split(r"[、，,\s]+", cleaned)
    for p in parts:
        if not p:
            continue
        if p in POS_MAP:
            return POS_MAP[p]
    return "phrase" if len(word) > 1 else "noun"


KEYWORD_TAGS = [
    (
        [
            "father",
            "dad",
            "mother",
            "mom",
            "parents",
            "parent",
            "son",
            "daughter",
            "brother",
            "sister",
            "aunt",
            "uncle",
            "husband",
            "wife",
            "spouse",
            "family",
            "child",
            "baby",
        ],
        "family",
    ),
    (
        [
            "day",
            "time",
            "hour",
            "minute",
            "year",
            "month",
            "week",
            "today",
            "tomorrow",
            "yesterday",
            "morning",
            "evening",
            "night",
            "o'clock",
            "noon",
        ],
        "time",
    ),
    (
        [
            "eat",
            "drink",
            "food",
            "tea",
            "coffee",
            "rice",
            "bread",
            "meat",
            "vegetable",
            "fruit",
            "dish",
            "soup",
            "noodles",
            "bun",
        ],
        "food",
    ),
    (
        [
            "school",
            "student",
            "teacher",
            "class",
            "study",
            "learn",
            "university",
            "college",
            "homework",
        ],
        "education",
    ),
    ("work job office company business manager".split(), "work"),
    (
        [
            "travel",
            "trip",
            "car",
            "bus",
            "train",
            "taxi",
            "airport",
            "ticket",
            "hotel",
            "plane",
            "subway",
        ],
        "travel",
    ),
    (
        [
            "doctor",
            "medicine",
            "health",
            "sick",
            "illness",
            "hospital",
            "pain",
        ],
        "health",
    ),
    (
        [
            "friend",
            "meet",
            "help",
            "thanks",
            "sorry",
            "welcome",
            "please",
            "together",
            "party",
        ],
        "social",
    ),
    (
        [
            "love",
            "like",
            "happy",
            "sad",
            "angry",
            "worry",
            "afraid",
            "fear",
            "emotion",
        ],
        "emotion",
    ),
    (
        [
            "city",
            "country",
            "place",
            "room",
            "house",
            "home",
            "store",
            "shop",
            "market",
            "street",
            "road",
            "station",
        ],
        "location",
    ),
    (
        [
            "weather",
            "rain",
            "snow",
            "wind",
            "sun",
            "cloud",
            "mountain",
            "river",
            "sea",
            "tree",
            "flower",
            "nature",
        ],
        "nature",
    ),
    (
        [
            "phone",
            "computer",
            "book",
            "pen",
            "table",
            "chair",
            "clothes",
            "thing",
            "object",
            "bag",
            "cup",
            "glasses",
            "television",
            "movie",
        ],
        "object",
    ),
]

GRAMMAR_POS = {
    "particle",
    "measure word",
    "prefix",
    "suffix",
    "conjunction",
    "preposition",
}


def topic_tags(word: str, english: str, pos_tag: str) -> list[str]:
    tags = []
    eng = english.lower()
    for keys, tag in KEYWORD_TAGS:
        for k in keys:
            if k in eng:
                tags.append(tag)
                break
        if tags:
            break
    if pos_tag in GRAMMAR_POS and "grammar" not in tags:
        tags.append("grammar")
    return tags[:2]


SKIP_PREFIXES = (
    "CL:",
    "variant of",
    "old variant of",
    "erhua variant of",
    "see ",
)

VARIANT_RE = re.compile(
    r"(?:erhua variant of|variant of|old variant of)\s+([^\[]+)\[",
    re.IGNORECASE,
)


def is_variant_entry(glosses: list[str]) -> bool:
    if not glosses:
        return True
    for g in glosses:
        if not g.startswith(SKIP_PREFIXES):
            return False
    return True


def variant_target(glosses: list[str]) -> str | None:
    for g in glosses:
        m = VARIANT_RE.search(g)
        if not m:
            continue
        target = m.group(1).strip()
        if "|" in target:
            target = target.split("|", 1)[1]
        return target
    return None


def clean_segment(seg: str, pos_tag: str) -> str:
    seg = seg.replace("(", "").replace(")", "").strip()
    seg = re.sub(r"\[.*?\]", "", seg).strip()
    seg = re.sub(r"\babbr\.?\s*for\b.*", "", seg, flags=re.IGNORECASE).strip()
    seg = re.sub(r"\bas in\b.*", "", seg, flags=re.IGNORECASE).strip()
    seg = re.sub(r"\bcoll\.?\b", "", seg, flags=re.IGNORECASE).strip()
    seg = re.sub(r"\bcolloquial\b", "", seg, flags=re.IGNORECASE).strip()
    seg = re.sub(r"\bbound form\b", "", seg, flags=re.IGNORECASE).strip()
    seg = re.sub(r"^\W+\s*", "", seg).strip()
    seg = seg.replace("  ", " ").strip(" ;,-")
    sl = seg.lower()
    if "o'clock" in sl:
        return "o'clock"
    if pos_tag == "prefix" and ("ordinal" in sl or "prefix" in sl):
        return "ordinal prefix"
    if "possessive particle" in sl:
        return "possessive particle"
    if "modal particle" in sl:
        return "modal particle"
    if "particle" in sl and pos_tag == "particle":
        return "particle"
    if "classifier for" in sl or "measure word for" in sl:
        base = seg
        for token in ["classifier for", "measure word for"]:
            if token in sl:
                base = seg[sl.index(token) + len(token) :].strip()
                break
        base = base.split(",")[0].split("etc")[0].strip()
        if base:
            return "measure word for " + base
    if "baozi" in sl or ("bao" in sl and "bun" in sl):
        return "steamed stuffed bun"
    if seg.lower() in {"shop", "store"}:
        return seg.lower()
    return seg


def preferred_segment(segments: list[str], pos_tag: str) -> str | None:
    if pos_tag == "prefix":
        for s in segments:
            if "ordinal" in s.lower() or "prefix" in s.lower():
                return s
    if pos_tag == "measure word":
        for s in segments:
            sl = s.lower()
            if "measure word" in sl or "classifier" in sl or "o'clock" in sl:
                return s
    if pos_tag == "particle":
        for s in segments:
            if "particle" in s.lower():
                return s
    if pos_tag == "noun":
        for s in segments:
            if s.lower() in {"shop", "store"}:
                return s
    return None


def select_english_simple(glosses: list[str], pos_tag: str, pinyin_ascii: str) -> str:
    segments = []
    for g in glosses:
        if g.startswith(SKIP_PREFIXES):
            continue
        for seg in g.split(";"):
            seg = clean_segment(seg, pos_tag)
            if not seg:
                continue
            if seg.lower() == pinyin_ascii:
                continue
            segments.append(seg)
    if not segments:
        return ""
    pref = preferred_segment(segments, pos_tag)
    if pref:
        return pref
    return segments[0]


def score_entry(entry: dict, pinyin_pdf: str, pos_tag: str) -> int:
    glosses = entry["glosses"]
    if is_variant_entry(glosses):
        base_score = -10
    else:
        base_score = 0
    gloss_join = " ".join(glosses).lower()
    penalty_keywords = [
        ("surname", -5),
        ("person name", -4),
        ("place name", -4),
        ("name of", -3),
        ("the great learning", -4),
        ("confucian", -4),
        ("dynasty", -2),
        ("classical", -2),
        ("literary", -2),
        ("old-style", -2),
        ("imperial", -2),
    ]
    for key, pen in penalty_keywords:
        if key in gloss_join:
            base_score += pen
    if pos_tag == "prefix" and ("ordinal" in gloss_join or "prefix" in gloss_join):
        base_score += 3
    if pos_tag == "particle" and "particle" in gloss_join:
        base_score += 2
    if pos_tag == "measure word" and (
        "measure word" in gloss_join
        or "classifier" in gloss_join
        or "o'clock" in gloss_join
    ):
        base_score += 2
    pinyin_toned = pinyin_num_to_tone(entry["pinyin_num"]).replace(" ", "").lower()
    pdf_norm = pinyin_pdf.replace(" ", "").lower()
    if pinyin_toned == pdf_norm:
        base_score += 5
    return base_score


def build_json(entries: list[dict], cedict: dict, stage: str) -> dict:
    items = []
    for e in entries:
        word = e["word"]
        level = e["level"]
        pos_tag = map_pos(e["pos_raw"], word)
        entry_list = cedict.get(word)
        if entry_list:
            scored = sorted(
                entry_list, key=lambda ent: score_entry(ent, e["pinyin_pdf"], pos_tag), reverse=True
            )
            chosen = scored[0]
            if is_variant_entry(chosen["glosses"]):
                target = variant_target(chosen["glosses"])
                if target and target in cedict:
                    chosen = cedict[target][0]
            pinyin = pinyin_num_to_tone(chosen["pinyin_num"])
            pinyin_ascii = strip_tone_marks(pinyin).replace(" ", "").lower()
            english = select_english_simple(chosen["glosses"], pos_tag, pinyin_ascii)
            if not english:
                english = chosen["glosses"][0].split(";", 1)[0].strip() if chosen["glosses"] else ""
        else:
            pinyin = e["pinyin_pdf"]
            english = word
        level_tag = "" if level == "L7-9" else level
        tags = ([level_tag] if level_tag else []) + [pos_tag] + topic_tags(word, english, pos_tag)
        items.append({"level": level, "word": word, "pinyin": pinyin, "english": english, "tags": tags})

    groups = []
    for i in range(0, len(items), 15):
        chunk = items[i : i + 15]
        if not chunk:
            continue
        group_id = len(groups) + 1
        levels = []
        for it in chunk:
            if it["level"] not in levels:
                levels.append(it["level"])
        group_tags = [l for l in levels if l != "L7-9"]
        group_items = []
        for j, it in enumerate(chunk, 1):
            group_items.append(
                {
                    "word": it["word"],
                    "pinyin": it["pinyin"],
                    "english": it["english"],
                    "id": j,
                    "tags": it["tags"],
                }
            )
        groups.append({"group": group_id, "tags": group_tags, "items": group_items})

    return {
        "kind": "chinese",
        "from": "chinese",
        "to": "english",
        "search": ["word", "pinyin", "english"],
        "groups": groups,
    }


def dump_json(obj: dict) -> str:
    lines = []
    lines.append("{")
    lines.append('  "kind": "chinese",')
    lines.append('  "from": "chinese",')
    lines.append('  "to": "english",')
    lines.append('  "search": ["word", "pinyin", "english"],')
    lines.append('  "groups": [')
    for gi, g in enumerate(obj["groups"]):
        lines.append("    {")
        lines.append(f'      "group": {g["group"]},')
        tags = ", ".join(json.dumps(t, ensure_ascii=False) for t in g["tags"])
        lines.append(f'      "tags": [{tags}],')
        lines.append('      "items": [')
        for ii, item in enumerate(g["items"]):
            item_json = json.dumps(item, ensure_ascii=False, separators=(", ", ": "))
            suffix = "," if ii < len(g["items"]) - 1 else ""
            lines.append(f"        {item_json}{suffix}")
        lines.append("      ]")
        lines.append("    }" + ("," if gi < len(obj["groups"]) - 1 else ""))
    lines.append("  ]")
    lines.append("}")
    return "\n".join(lines) + "\n"


def parse_levels(s: str) -> set[str]:
    parts = [p.strip() for p in s.split(",") if p.strip()]
    out: set[str] = set()
    for p in parts:
        if "-" in p:
            out.add(p)
            try:
                start_s, end_s = p.split("-", 1)
                start_i = int(start_s)
                end_i = int(end_s)
            except ValueError:
                continue
            for i in range(min(start_i, end_i), max(start_i, end_i) + 1):
                out.add(str(i))
        else:
            out.add(p)
    return out


def stage_for_levels(levels: set[str]) -> str:
    if levels == {"1", "2", "3"}:
        return "elementary"
    if levels == {"4", "5", "6"}:
        return "intermediate"
    if {"7", "8", "9", "7-9"} & levels:
        return "advanced"
    return "mixed"


def main() -> None:
    import argparse
    import subprocess

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pdf",
        default="",
        help="Optional PDF path to extract text from before parsing",
    )
    parser.add_argument(
        "--txt",
        default=str(PDF_TXT),
        help="Text file path from pdftotext -raw",
    )
    parser.add_argument(
        "--levels",
        default="1,2,3",
        help="Comma-separated list of level numbers, e.g. 1,2,3 or 4,5,6",
    )
    parser.add_argument(
        "--out",
        default=str(DEFAULT_OUT_JSON),
        help="Output JSON path",
    )
    args = parser.parse_args()

    txt_path = Path(args.txt)
    if args.pdf:
        pdf_path = Path(args.pdf)
        if not pdf_path.exists():
            raise SystemExit(f"missing PDF: {pdf_path}")
        txt_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["pdftotext", "-raw", str(pdf_path), str(txt_path)],
            check=True,
        )

    levels = parse_levels(args.levels)
    stage = stage_for_levels(levels)
    entries = load_pdf_entries(levels, txt_path)
    cedict = load_cedict()
    out = build_json(entries, cedict, stage)
    out_path = Path(args.out)
    out_path.write_text(dump_json(out), encoding="utf-8")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
