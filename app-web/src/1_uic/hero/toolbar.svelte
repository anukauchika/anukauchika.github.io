<script>
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let {
    datasets, datasetId, user,
    showAvatar, avatarUrl, userInitials,
    onDatasetChange, onShowAuthDropdown, onAvatarError,
    onToggleTheme,
  } = $props()
</script>

<div class="anuka-row">
  <select class="anuka-input anuka-grow" value={datasetId} onchange={(e) => onDatasetChange(e.target.value)}>
    {#each datasets as dataset}
      <option value={dataset.id}>{dataset.name}</option>
    {/each}
  </select>

  <BtnIcon onclick={onToggleTheme} label="Toggle theme" icon="moon" />

  {#if user}
    <BtnIcon onclick={onShowAuthDropdown} label="Account">
      {#if showAvatar}
        <img class="anuka-avatar" src={avatarUrl} alt="Avatar" onerror={onAvatarError} />
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
