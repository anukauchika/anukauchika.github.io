<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => { goto('/chinese/', { replaceState: true }) })
</script>
