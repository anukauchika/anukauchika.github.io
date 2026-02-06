// Diacritic → (base vowel, tone number)
const DIACRITIC_MAP = {
  'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
  'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
  'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
  'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
  'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
  'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4], 'ü': ['v', 5],
}

/**
 * Convert a single diacritic pinyin syllable to tone-number form.
 * "hǎo" → "hao3", "nǚ" → "nv3", "ba" → "ba5", "nǎr" → "nar3"
 */
export function diacriticToToneNumber(syllable) {
  let tone = 5 // default neutral
  let result = ''
  for (const ch of syllable) {
    const entry = DIACRITIC_MAP[ch]
    if (entry) {
      result += entry[0]
      tone = entry[1]
    } else {
      result += ch
    }
  }
  return result + tone
}

const isCJK = (ch) => /[\u4e00-\u9fff]/.test(ch)

/**
 * Map space-separated pinyin syllables to CJK characters.
 * Returns array parallel to cjkChars: { pinyin, autoComplete }
 *
 * When syllables < chars (erhua: 儿 absorbed), marks extra 儿 as autoComplete.
 * Heuristic: scan from the end — unmatched 儿 gets autoComplete.
 */
export function splitPinyin(pinyinStr, cjkChars) {
  const syllables = pinyinStr.trim().split(/\s+/)
  const chars = [...cjkChars].filter(isCJK)

  if (syllables.length === chars.length) {
    return chars.map((_, i) => ({ pinyin: syllables[i], autoComplete: false }))
  }

  if (syllables.length < chars.length) {
    // Build result from end to start
    const result = new Array(chars.length)
    let si = syllables.length - 1
    for (let ci = chars.length - 1; ci >= 0; ci--) {
      if (si < 0) {
        // More chars than syllables — remaining must be auto-complete
        result[ci] = { pinyin: null, autoComplete: true }
      } else if (chars[ci] === '儿' && si < ci) {
        // This 儿 has no syllable — auto-complete
        result[ci] = { pinyin: null, autoComplete: true }
      } else {
        result[ci] = { pinyin: syllables[si], autoComplete: false }
        si--
      }
    }
    return result
  }

  // More syllables than chars — shouldn't happen, but fall back to 1:1 truncated
  return chars.map((_, i) => ({ pinyin: syllables[i] || null, autoComplete: !syllables[i] }))
}
