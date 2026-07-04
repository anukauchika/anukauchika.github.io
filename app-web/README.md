# Anuka Uchika

A vocabulary learning application with two modes:
1. **Browser** - Interactive vocabulary explorer with search, filtering, and learning aids
2. **Workbook** - Printable practice sheets with fill-in-the-blank exercises

## Learning Methodology

**Groups** - Vocabulary is divided into groups, each tailored for one continuous study session. Groups are **immutable** with **stable identifiers** - this enables progress tracking (knowing which groups you've mastered) and provides cognitive structure (your brain anchors memories to stable group IDs).

**Spaced Repetition** - Groups are revisited over time for effective memorization.

**Printable Worksheets** - Workbooks are designed for paper practice:
1. Print a focused word group
2. Write Chinese words, pinyin, and meanings by hand
3. Check your work after writing from memory

**Practice modes:**
- Show pinyin → write Chinese characters
- Show English → write pinyin
- Show characters → write English

Each sheet supports tactile practice away from the screen.

## Stroke Practice Algorithm (Chinese)

**Session flow**: Practice all words in a group, one character at a time. Each character uses HanziWriter quiz mode.

**Word ordering**: Words sorted by success count (ascending) — least practiced first.

**Hint logic**:
- Auto-enabled for words with 0 successful practices (shows gray outline)
- Auto-disabled for practiced words
- Toggleable via button, resets on each character

**Error handling**: Shows hint outline after 2nd mistake on a stroke.

**Delays**: 1500ms pause between characters within a word.

**Group ordering** (in browser): Groups sorted by last *full* session (no skips). Partial sessions don't affect order — only completing all words moves a group down the list.

**Stats tracked**: Per-word success count, per-group session count (total/full), timestamps.

## Project Structure

```
/data/                  # Vocabulary datasets
  registry.json         # Dataset metadata and paths
  /chinese/             # Chinese vocabulary files
  /english/             # English vocabulary files
```

## Key Concepts

### Dataset Format

**One-line JSON per word** - Each word is formatted as a single-line JSON object. This keeps git diffs clean when adding/deleting/modifying words.

**Stable word IDs within groups** - Each word has a stable identifier within its group, enabling tracking of which specific words have been learned.

**Fields diverge by `kind`** - Different learning methodologies use different field names:
- **Chinese datasets**: `word` (character), `pinyin`, `english` (translation)
- **English datasets**: `word`, `phonetics` (IPA), `russian` (translation)

**Translation direction** - Each dataset declares `from` and `to` fields to specify the source and target languages.

**Search fields** - Each dataset declares which fields are searchable via the `search` array:
```json
{
  "kind": "chinese",
  "from": "chinese",
  "to": "english",
  "search": ["word", "pinyin", "english"],
  "groups": [...]
}
```
This allows different datasets to define their own searchable fields without code changes. Tags are always included in search automatically.

**Unified vs Kind-Specific Structure:**
- **Dataset header** (unified): `kind`, `from`, `to`, `groups` array
- **Group structure** (unified): `group`, `name`, `tags`, `items` array
- **Item objects** (kind-specific): Only `id` and `tags` are unified. All other fields (`word`, `pinyin`, `phonetics`, etc.) are kind-specific.

### Dataset `kind` = Learning Methodology

The `kind` field in each dataset represents **the learning methodology**, not just the language. Each kind determines which features are available in the UI.

**Current kinds:**
- `"chinese"` - Character-focused learning with stroke-by-stroke animation (HanziWriter), pinyin, character writing
- `"english"` - Translation-focused learning with IPA pronunciation, vocabulary practice

**Why methodology-based, not language-based?**
- Different languages need different learning approaches
- Same language might use different methodologies (e.g., character-based vs conversational Chinese)
- Avoids premature architecture - features are added per methodology as needed
- Future languages may share methodologies OR diverge to more effective strategies

### Adding a New Dataset

1. Add JSON file to `/data/{kind}/filename.json`
2. Register it in `/data/registry.json` with:
   ```json
   {
     "id": "unique-id",
     "name": "Display Name",
     "path": "data/{kind}/filename.json",
     "description": "Brief description",
     "tags": ["tag1", "tag2"],
     "kind": "chinese" | "english" | ...
   }
   ```
3. No code changes needed - datasets are loaded dynamically

#### Publishing printable worksheet pages (SEO)

A `chinese` dataset can opt in to a public printable-worksheet landing section
(`/chinese/{slug}/` + one page per group) by adding a `seo` block to its registry
entry:

```json
"seo": {
  "worksheets": true,
  "slug": "printable-my-dataset-worksheets",
  "label": "My Dataset",
  "related": ["other-dataset-id"]
}
```

- `worksheets` — opt-in flag; omit or set `false` to keep a dataset private (this is
  the default — e.g. test/draft datasets should not set this)
- `slug` — the public URL segment; pick a keyword-rich, stable slug (changing it
  later changes the page's URL)
- `label` — display name used in the worksheet page's copy/title, if it should
  differ from the dataset's app-facing `name` (e.g. shorter/punchier for SEO)
- `related` — ids of other printable worksheet datasets to cross-promote from this
  worksheet page (only datasets with `seo.worksheets: true` and a `slug` are linked)

Pages are generated automatically by SvelteKit's static prerendering — no route
code changes needed. See `src/routes/(blog)/chinese/worksheet-datasets.ts`.

> ⚠️ **After adding or editing a dataset with `seo.worksheets: true` (or its data
> file), run `npm run gen:seo` and commit the regenerated `static/sitemap.xml`,
> `static/robots.txt`, and `static/llms.txt`.** This is a manual step — it is NOT
> part of `npm run build` — so it's easy to forget, but skipping it means the new
> pages won't be in the sitemap search engines crawl.

### Adding a New `kind` (Learning Methodology)

When a new learning approach is needed:
1. Add dataset with new `kind` value
2. Implement kind-specific features in components (conditionally rendered based on `$currentDataset.kind`)
3. Add feature set as needed - **avoid premature abstractions**

## Architecture Principles

- **Feature sets per `kind`** - Each methodology gets features that make sense for it
