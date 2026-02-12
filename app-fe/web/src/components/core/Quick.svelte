<script lang="ts">
  interface Props {
    label: string
    icon: string
    onclick?: (e: MouseEvent) => void
  }

  let { label, icon, onclick }: Props = $props()
</script>

<button class="anuka-quick" type="button" aria-label={label} {onclick}>
  <span class="anuka-icon anuka-icon-{icon}"></span>
</button>
