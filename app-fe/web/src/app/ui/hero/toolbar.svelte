<script>
  import AppTitle from '@std/ui/app-title.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let {
    datasets,
    datasetId,
    appTitle,
    user,
    onDatasetChange,
    onShowAuthDropdown,
  } = $props()

  let avatarError = $state(false)

  const avatarUrl = $derived(user?.user_metadata?.avatar_url)
  const userInitials = $derived.by(() => {
    const meta = user?.user_metadata
    const fullName = meta?.full_name || meta?.name
    if (fullName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0][0].toUpperCase()
    }
    const email = user?.email
    return email ? email[0].toUpperCase() : '?'
  })

  $effect(() => {
    user
    avatarError = false
  })
</script>

<div class="anuka-row anuka-justify">
  <div class="anuka-row">
    <a href="https://github.com/anukauchika/anukauchika.github.io" target="_blank" rel="noreferrer">
      <span class="anuka-icon anuka-icon-github"></span>
      <span>Want to add vocabulary? Contributions welcome</span>
    </a>
  </div>
  <AppTitle parts={appTitle ? ['Anuka Uchika', appTitle] : ['Anuka Uchika']} />

  <select class="anuka-input" value={datasetId} onchange={(e) => onDatasetChange(e.target.value)}>
    {#each datasets as dataset}
      <option value={dataset.id}>{dataset.name}</option>
    {/each}
  </select>

  <div>
    {#if user}
      <BtnIcon onclick={onShowAuthDropdown} label="Account">
        {#if avatarUrl && !avatarError}
          <img class="anuka-avatar" src={avatarUrl} alt="Avatar" onerror={() => avatarError = true} />
        {:else}
          <span>{userInitials}</span>
        {/if}
      </BtnIcon>
    {:else}
      <BtnIcon onclick={onShowAuthDropdown} label="Sign in">
        <span class="anuka-icon anuka-icon-user"></span>
      </BtnIcon>
    {/if}
  </div>
</div>
