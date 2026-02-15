<script>
  import { datasets, datasetId, currentDataset } from '../../../state/registry.js'
  import { user, isAuthenticated } from '../../../state/auth.js'
  import AppTitle from '../../core/AppTitle.svelte'
  import BtnIcon from '../../core/BtnIcon.svelte'

  let { onShowAuthDropdown } = $props()

  let avatarError = $state(false)

  const avatarUrl = $derived($user?.user_metadata?.avatar_url)
  const userInitials = $derived.by(() => {
    const meta = $user?.user_metadata
    const fullName = meta?.full_name || meta?.name
    if (fullName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0][0].toUpperCase()
    }
    const email = $user?.email
    return email ? email[0].toUpperCase() : '?'
  })

  $effect(() => {
    $user
    avatarError = false
  })
</script>

<div class="anuka-row anuka-justify" style="flex-wrap: wrap; margin-bottom: 1rem">
  <div class="anuka-row">
    <a href="https://github.com/anukauchika/anukauchika.github.io" target="_blank" rel="noreferrer">
      <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
      <span>Want to add vocabulary? Contributions welcome</span>
    </a>
  </div>
  <AppTitle parts={$currentDataset?.appTitle ? ['Anuka Uchika', $currentDataset.appTitle] : ['Anuka Uchika']} />

  <select class="anuka-input" bind:value={$datasetId} style="min-width: 280px; cursor: pointer">
    {#each datasets as dataset}
      <option value={dataset.id}>{dataset.name}</option>
    {/each}
  </select>

  <div>
    {#if $user}
      <BtnIcon onclick={onShowAuthDropdown} label="Account">
        {#if avatarUrl && !avatarError}
          <img src={avatarUrl} alt="Avatar" width="28" height="28" style="border-radius: 50%" onerror={() => avatarError = true} />
        {:else}
          <span>{userInitials}</span>
        {/if}
      </BtnIcon>
    {:else}
      <BtnIcon onclick={onShowAuthDropdown} label="Sign in">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
      </BtnIcon>
    {/if}
  </div>
</div>
