<script>
  let { onClose } = $props();
</script>

<div class="page-header">
  <h3>How it works?</h3>
  <button type="button" class="page-close-btn" onclick={onClose} title="Close">
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg
    >
  </button>
</div>
<section class="practiced-page">
  <div class="how-section">
    <h4>What is this</h4>
    <p>
      A vocabulary learning app with interactive practice sessions and printable
      workbooks. Browse words, practice writing, and track your progress over
      time.
    </p>
  </div>
  <div class="how-section">
    <h4>Chinese</h4>
    <p>
      Vocabulary for all HSK levels (1–9). Two practice modes: stroke writing
      (trace characters stroke by stroke) and pinyin (type the pronunciation).
    </p>
  </div>
  <div class="how-section">
    <h4>Groups</h4>
    <p>
      Vocabulary is divided into groups, each sized for one study session.
      Groups do not change so your progress is always tied to the same set of
      words.
    </p>
  </div>
  <div class="how-section">
    <h4>Practice</h4>
    <p>
      Words are ordered by how much you've practiced them — least practiced come
      first. The Practice button automatically picks the best next group to
      study.
    </p>
  </div>
  <div class="how-section">
    <h4>Workbook</h4>
    <p>
      Print a workbook, fold it accordion-style so only the reference column and
      blank columns are visible. Practice by filling in the blanks by hand, then
      unfold to self-check your answers.
    </p>
  </div>
  <div class="how-section">
    <h4>Progress</h4>
    <p>
      Log in to track per-word and per-character stats, session history,
      progress bars, and an activity calendar. Your progress syncs across
      devices.
    </p>
  </div>
</section>
