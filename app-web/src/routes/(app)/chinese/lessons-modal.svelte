<script>
  import { onMount, tick } from 'svelte'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { svcStats } from '@svc/kind/chinese/stats'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import Modal from '@std/ui/modal.svelte'

  let { onclose } = $props()
  let loading = $state(true)
  let lessonsList = $state()
  let selectedGroup = $state(null)
  const datasetName = $derived(sttDataset.current?.name ?? 'Vocabulary')

  onMount(() => {
    let cancelled = false
    const datasetId = sttDataset.id
    svcStats
      .loadGroupProgressAll(datasetId)
      .catch((err) => console.error('lesson progress load failed:', err))
      .finally(() => {
        if (!cancelled && sttDataset.id === datasetId) {
          loading = false
          tick().then(scrollToCurrentLessons)
        }
      })
    return () => (cancelled = true)
  })

  function scrollToCurrentLessons() {
    if (!lessonsList) return
    const active = lessonsList.querySelectorAll('[data-state="started"], [data-state="progress"]')
    if (active.length === 0) return

    const target = active[Math.max(0, active.length - 2)]
    const container = lessonsList.closest('.lessons-modal')
    if (!container) return

    const targetRect = target.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const headerHeight = container.querySelector('.lessons-header')?.getBoundingClientRect().height ?? 0
    container.scrollTop += targetRect.top - containerRect.top - headerHeight - 16
  }

  function lessonProgress(groupId) {
    const drilledWords = sttStats.lessonDrilledWords.get(groupId) ?? 0
    const writingClean = Math.min(sttStats.groupProgressStroke.get(groupId)?.clean ?? 0, 10)
    const pinyinClean = Math.min(sttStats.groupProgressPinyin.get(groupId)?.clean ?? 0, 10)
    return { drilledWords, writingClean, pinyinClean, percent: Math.round(((writingClean + pinyinClean) / 20) * 100) }
  }

  async function openGroup(group) {
    selectedGroup = group
    await tick()
    document.querySelector('.lessons-modal')?.scrollTo({ top: 0 })
  }

  async function closeGroup() {
    selectedGroup = null
    await tick()
    scrollToCurrentLessons()
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
</script>

<Modal {onclose}>
  <section class="anuka-island lessons-modal" aria-label="Lessons">
    <div class="anuka-row anuka-justify lessons-header">
      <div>
        {#if selectedGroup}
          <button class="anuka-btn-link back-button" type="button" onclick={closeGroup}>← Lessons</button>
          <h2>Lesson {selectedGroup.id}</h2>
        {:else}
          <h2>Lessons</h2>
          <p>{datasetName}</p>
        {/if}
      </div>
      <BtnIcon icon="close" label="Close" onclick={onclose} />
    </div>
    {#if selectedGroup}
      <div class="word-list">
        {#each selectedGroup.items as word (word.id)}
          <article class="word-row">
            <div class="word-copy">
              <strong class="word-hanzi" lang="zh-CN">{word.word}</strong>
              <span class="word-pinyin">{word.pinyin}</span>
              <span class="word-translation">{word.tr}</span>
            </div>
            <BtnIcon icon="speaker" label={`Play ${word.word}`} onclick={() => speak(word.word)} />
          </article>
        {/each}
      </div>
    {:else if loading}
      <div class="lessons-list skeleton-list" aria-busy="true" aria-label="Loading lesson progress">
        {#each Array(10) as _, index}
          <div class="lesson-row skeleton-row" aria-hidden="true">
            <div class="skeleton-heading">
              <span class="skeleton-block skeleton-title"></span>
              <span class="skeleton-block skeleton-percent"></span>
            </div>
            <span class="skeleton-block skeleton-track"></span>
            <span class="skeleton-block skeleton-copy" class:skeleton-copy-short={index % 3 === 2}></span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="lessons-list" bind:this={lessonsList}>
        {#each sttDataset.groups as group (group.id)}
          {@const p = lessonProgress(group.id)}
          {@const started = p.drilledWords > 0 && (p.writingClean <= 2 || p.pinyinClean <= 2)}
          {@const progressing = p.percent < 100 && p.writingClean > 2 && p.pinyinClean > 2}
          <button
            type="button"
            class="lesson-row"
            class:started
            class:progressing
            class:done={p.percent === 100}
            data-state={p.percent === 100 ? 'done' : progressing ? 'progress' : started ? 'started' : 'unstarted'}
            onclick={() => openGroup(group)}
          >
            <div class="heading">
              <strong
                >Lesson {group.id}
                {#if p.percent === 100}<span class="mark done-mark">Done</span>
                {:else if progressing}<span class="mark progress-mark">In progress</span>
                {:else if p.drilledWords > 0}<span class="mark started-mark">Started</span>{/if}
              </strong><span>{p.percent}%</span>
            </div>
            <div
              class="track"
              class:started-track={started}
              class:done-track={p.percent === 100}
              aria-label={`Lesson ${group.id}: ${p.percent}% complete`}
            >
              <span style={`width: ${p.percent}%`}></span>
            </div>
            <small>Writing {p.writingClean}/10 · Pinyin {p.pinyinClean}/10</small>
          </button>
        {/each}
      </div>
    {/if}
  </section>
</Modal>

<style>
  .lessons-modal {
    --accent: #b8430c;
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 2rem));
    overflow: auto;
  }
  :global([data-theme='dark']) .lessons-modal {
    --accent: #e35d0f;
  }
  h2 {
    margin: 0;
    font-size: 1.25rem;
    line-height: 1.2;
  }
  .lessons-header {
    position: sticky;
    z-index: 2;
    top: 0;
    border-bottom: 1px solid var(--anuka-color-border);
    background: var(--anuka-color-surface);
    padding-block: 0.25rem 0.75rem;
    box-shadow: 0 -1rem 0 1rem var(--anuka-color-surface);
  }
  .lessons-modal > div p {
    margin: 0.18rem 0 0;
    color: var(--anuka-color-muted);
    font-size: 0.82rem;
  }
  .back-button {
    display: block;
    margin-bottom: 0.18rem;
    color: var(--accent);
    font-size: 0.76rem;
    font-weight: 800;
  }
  .lessons-list {
    display: grid;
    gap: 0.65rem;
    margin-top: 1rem;
  }
  .skeleton-row {
    pointer-events: none;
  }
  .skeleton-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .skeleton-block {
    display: block;
    border-radius: 999px;
    background: linear-gradient(
      100deg,
      color-mix(in srgb, var(--anuka-color-text) 7%, transparent) 25%,
      color-mix(in srgb, var(--anuka-color-text) 13%, transparent) 45%,
      color-mix(in srgb, var(--anuka-color-text) 7%, transparent) 65%
    );
    background-size: 220% 100%;
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
  }
  .skeleton-title {
    width: 7rem;
    height: 0.8rem;
  }
  .skeleton-percent {
    width: 2.2rem;
    height: 0.7rem;
  }
  .skeleton-track {
    width: 100%;
    height: 0.28rem;
  }
  .skeleton-copy {
    width: 10rem;
    height: 0.62rem;
  }
  .skeleton-copy-short {
    width: 8rem;
  }
  @keyframes skeleton-shimmer {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: -120% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton-block {
      animation: none;
    }
  }
  .lesson-row {
    display: grid;
    gap: 0.42rem;
    border: 1px solid var(--anuka-color-border);
    border-radius: 0.75rem;
    background: var(--anuka-color-surface-raised);
    padding: 0.75rem 0.9rem;
    color: var(--anuka-color-text);
    font: inherit;
    text-align: left;
  }
  button.lesson-row {
    width: 100%;
    cursor: pointer;
  }
  button.lesson-row:hover {
    border-color: color-mix(in srgb, var(--accent) 45%, var(--anuka-color-border));
  }
  button.lesson-row:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .started {
    border-color: color-mix(in srgb, var(--anuka-color-warn) 48%, var(--anuka-color-border));
    background: color-mix(in srgb, var(--anuka-color-warn) 8%, var(--anuka-color-surface-raised));
  }
  .progressing {
    border-color: color-mix(in srgb, var(--accent) 42%, var(--anuka-color-border));
    background: color-mix(in srgb, var(--accent) 7%, var(--anuka-color-surface-raised));
  }
  .done {
    border-color: color-mix(in srgb, var(--anuka-color-success) 55%, var(--anuka-color-border));
    background: color-mix(in srgb, var(--anuka-color-success) 10%, var(--anuka-color-surface-raised));
  }
  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.88rem;
  }
  .heading strong {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .heading > span,
  small {
    color: var(--anuka-color-muted);
    font-size: 0.74rem;
    font-weight: 700;
  }
  .mark {
    border-radius: 999px;
    padding: 0.12rem 0.42rem;
    font-size: 0.62rem;
    font-weight: 850;
    letter-spacing: 0.04em;
    line-height: 1.2;
    text-transform: uppercase;
  }
  .started-mark {
    background: color-mix(in srgb, var(--anuka-color-warn) 16%, transparent);
    color: var(--anuka-color-warn);
  }
  .progress-mark {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
  }
  .done-mark {
    background: color-mix(in srgb, var(--anuka-color-success) 16%, transparent);
    color: var(--anuka-color-success);
  }
  .track {
    height: 0.28rem;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--anuka-color-text) 12%, transparent);
  }
  .track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent);
  }
  .started-track span {
    background: var(--anuka-color-warn);
  }
  .done-track span {
    background: var(--anuka-color-success);
  }
  .word-list {
    display: grid;
    gap: 0.65rem;
    margin-top: 1rem;
  }
  .word-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
    border: 1px solid var(--anuka-color-border);
    border-radius: 0.75rem;
    background: var(--anuka-color-surface-raised);
    padding: 0.8rem 0.9rem;
  }
  .word-copy {
    display: grid;
    min-width: 0;
  }
  .word-hanzi {
    color: var(--anuka-color-text);
    font-family: var(--font-hanzi);
    font-size: clamp(1.65rem, 7vw, 2.5rem);
    font-weight: 850;
    line-height: 1.12;
    white-space: nowrap;
  }
  .word-pinyin {
    margin-top: 0.2rem;
    color: var(--accent);
    font-size: 0.9rem;
    font-weight: 750;
  }
  .word-translation {
    margin-top: 0.1rem;
    color: var(--anuka-color-muted);
    font-size: 0.82rem;
    line-height: 1.35;
  }
</style>
