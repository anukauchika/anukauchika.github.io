<script>
  import { page } from '$app/stores'
  import { ChineseDrillType } from '@dom/kind/chinese/dataset'
  import { normalizeDrillSource, svcDrill } from '@svc/kind/chinese/drill'
  import { svcAuth } from '@svc/auth'
  import { sttAuth } from '@stt/auth.svelte.js'
  import DrillPinyin from '@uic/kind/chinese/drill/drill-pinyin.svelte'
  import AuthModal from '@uic/auth-modal.svelte'

  const datasetId = $derived($page.url.searchParams.get('dataset') || '')
  const groupId = $derived(Number($page.url.searchParams.get('group')) || 1)
  const from = $derived($page.url.searchParams.get('from'))
  const source = $derived(normalizeDrillSource($page.url.searchParams.get('source')))
  const backUrl = $derived(from ? `/chinese/${from}/?dataset=${datasetId}` : `/chinese/?dataset=${datasetId}`)

  let drill = $state(null)
  let showAuth = $state(false)

  $effect(() => {
    if (datasetId && groupId) {
      drill = null
      svcDrill.initDrill(datasetId, groupId, ChineseDrillType.Pinyin, source).then((d) => (drill = d))
    }
  })
</script>

<svelte:head>
  <title>Pinyin Drill - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  {#if drill}
    <DrillPinyin
      group={drill.group}
      items={drill.items}
      wordProgress={drill.wordProgress}
      groupProgressStroke={drill.groupProgressStroke}
      groupProgressPinyin={drill.groupProgressPinyin}
      authenticated={drill.authenticated}
      {backUrl}
      onSignIn={() => (showAuth = true)}
      onWordDone={(a, c) => drill.recordAttempt(a, c)}
      onDrillDone={(r) => drill.endSession(r)}
    />
  {/if}

  {#if showAuth}
    <AuthModal
      user={sttAuth.user}
      onclose={() => (showAuth = false)}
      onSignInWithGoogle={() =>
        svcAuth.signInWithGoogle({
          source,
          drill_type: ChineseDrillType.Pinyin,
          dataset_id: datasetId,
          group_id: groupId,
        })}
      onSignInWithEmail={(email) =>
        svcAuth.signInWithEmail(email, {
          source,
          drill_type: ChineseDrillType.Pinyin,
          dataset_id: datasetId,
          group_id: groupId,
        })}
      onSignOut={svcAuth.signOut}
    />
  {/if}
</main>
