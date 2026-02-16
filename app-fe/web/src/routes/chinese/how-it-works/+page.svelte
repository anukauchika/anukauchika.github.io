<script>
  import { goto } from '$app/navigation'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
</script>

<svelte:head>
  <title>How it works - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <button class="anuka-quick" type="button" onclick={() => goto('/chinese/')} title="Close">
      <span class="anuka-icon anuka-icon-close"></span>
    </button>
    <IslandTitle level={3}>How it works?</IslandTitle>
  </Island>
  <div class="anuka-stack">
    <Island>
      <IslandTitle level={4}>What is this</IslandTitle>
      <p class="anuka-mute">
        A vocabulary learning app with interactive practice sessions and printable
        workbooks. Browse words, practice writing, and track your progress over
        time.
      </p>
    </Island>
    <Island>
      <IslandTitle level={4}>Chinese</IslandTitle>
      <p class="anuka-mute">
        Vocabulary for all HSK levels (1-9). Two practice modes: stroke writing
        (trace characters stroke by stroke) and pinyin (type the pronunciation).
      </p>
    </Island>
    <Island>
      <IslandTitle level={4}>Groups</IslandTitle>
      <p class="anuka-mute">
        Vocabulary is divided into groups, each sized for one study session.
        Groups do not change so your progress is always tied to the same set of
        words.
      </p>
    </Island>
    <Island>
      <IslandTitle level={4}>Practice</IslandTitle>
      <p class="anuka-mute">
        Words are ordered by how much you've practiced them - least practiced come
        first. The Practice button automatically picks the best next group to
        study.
      </p>
    </Island>
    <Island>
      <IslandTitle level={4}>Workbook</IslandTitle>
      <p class="anuka-mute">
        Print a workbook, fold it accordion-style so only the reference column and
        blank columns are visible. Practice by filling in the blanks by hand, then
        unfold to self-check your answers.
      </p>
    </Island>
    <Island>
      <IslandTitle level={4}>Progress</IslandTitle>
      <p class="anuka-mute">
        Log in to track per-word and per-character stats, session history,
        progress bars, and an activity calendar. Your progress syncs across
        devices.
      </p>
    </Island>
  </div>
</main>
