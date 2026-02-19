<script>
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let {
    datasets, datasetId, user,
    showAvatar, avatarUrl, userInitials,
    onDatasetChange, onShowAuthDropdown, onAvatarError,
  } = $props()
</script>

<div class="anuka-row anuka-justify">
  <div class="anuka-row">
    <a href="https://github.com/anukauchika/anukauchika.github.io" target="_blank" rel="noreferrer">
      <span class="anuka-icon anuka-icon-github"></span>
      <span>Want to add vocabulary? Contributions welcome</span>
    </a>
  </div>

  <select class="anuka-input" value={datasetId} onchange={(e) => onDatasetChange(e.target.value)}>
    {#each datasets as dataset}
      <option value={dataset.id}>{dataset.name}</option>
    {/each}
  </select>

  <div>
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
</div>
