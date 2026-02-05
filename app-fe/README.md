# Memris

A vocabulary learning application with two modes:
1. **Browser** - Interactive vocabulary explorer with search, filtering, and learning aids
2. **Workbook** - Printable practice sheets with fill-in-the-blank exercises

## Learning Methodology

**Groups** - Vocabulary is divided into groups, each tailored for one continuous study session. Groups are **immutable** with **stable identifiers** - this enables progress tracking (knowing which groups you've mastered) and provides cognitive structure (your brain anchors memories to stable group IDs).

**Spaced Repetition** - Groups are revisited over time for effective memorization.

**Accordion Folding Technique** - Workbooks are designed to be printed and folded accordion-style:
1. Print the workbook grid (given columns + empty practice columns)
2. Fold accordion-style to reveal only the reference column + empty columns
3. Practice by filling in the blanks manually
4. Unfold to self-check your answers

**Practice modes via folding:**
- Show pinyin → write Chinese characters
- Show English → write pinyin
- Show characters → write English

Each fold transforms one sheet into a different practice pass, enabling tactile, self-checking spaced repetition.

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

/web/                   # Svelte web application
  /src/
    App.svelte          # Main vocabulary browser
    Print.svelte        # Workbook generator
    /state/
      registry.js       # Dataset loading and management
    /utils/
      format.js         # Formatting utilities
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

### Adding a New `kind` (Learning Methodology)

When a new learning approach is needed:
1. Add dataset with new `kind` value
2. Implement kind-specific features in components (conditionally rendered based on `$currentDataset.kind`)
3. Add feature set as needed - **avoid premature abstractions**

## Tech Stack

- **Framework**: Svelte 5 (with runes)
- **Build**: Vite 7
- **Styling**: Plain CSS with shared design tokens
- **State**: Svelte stores (writable/derived)
- **Chinese Features**: hanzi-writer (stroke animations)

## Development

```bash
cd web
npm install
npm run dev              # Development server
npm run build            # Production build
npm run build:inline     # Build + inline assets for standalone HTML
```

## Architecture Principles

- **No premature design** - Add abstractions only when patterns emerge
- **Feature sets per `kind`** - Each methodology gets features that make sense for it
- **Dynamic data loading** - Datasets auto-discovered via glob patterns
- **Shared design tokens** - Centralized CSS variables for consistency
