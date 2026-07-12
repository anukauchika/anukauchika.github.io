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
</script>

<Modal {onclose}>
  <section class="anuka-island lessons-modal" aria-label="Lessons">
    <div class="anuka-row anuka-justify lessons-header">
      <div>
        <h2>Lessons</h2>
        <p>{datasetName}</p>
      </div>
      <BtnIcon icon="close" label="Close" onclick={onclose} />
    </div>
    {#if loading}
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
        <div class="lesson-row done example">
          <div class="heading">
            <strong>Example lesson <span class="mark done-mark">Done</span></strong><span>100%</span>
          </div>
          <div class="track done-track"><span style="width: 100%"></span></div>
          <small>Writing 10/10 · Pinyin 10/10</small>
        </div>
        {#each sttDataset.groups as group (group.id)}
          {@const p = lessonProgress(group.id)}
          {@const started = p.drilledWords > 0 && (p.writingClean <= 2 || p.pinyinClean <= 2)}
          {@const progressing = p.percent < 100 && p.writingClean > 2 && p.pinyinClean > 2}
          <div
            class="lesson-row"
            class:started
            class:progressing
            class:done={p.percent === 100}
            data-state={p.percent === 100 ? 'done' : progressing ? 'progress' : started ? 'started' : 'unstarted'}
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
          </div>
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
  .example {
    border-style: dashed;
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
</style>
