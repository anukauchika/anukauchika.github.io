<script lang="ts">
  interface Props {
    type?: string
    placeholder?: string
    class?: string
  }

  let { type = 'text', placeholder, class: className }: Props = $props()
</script>

<input class="anuka-input {className ?? ''}" {type} {placeholder} />
