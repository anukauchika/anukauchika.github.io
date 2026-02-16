<script lang="ts">
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Input from '@std/ui/input.svelte'
  import Btn from '@std/ui/btn.svelte'
  import Autocomplete from '@std/ui/autocomplete.svelte'

  let demoTags = $state<string[]>(['beginner'])
  const allDemoTags = ['beginner', 'intermediate', 'advanced', 'hsk1', 'hsk2', 'greetings', 'food', 'travel', 'numbers', 'colors']
  const demoTagItems = allDemoTags.map(t => ({ id: t, label: '#' + t }))
</script>

<Island>
  <IslandTitle level={3}>Input</IslandTitle>
  <p>Text field with focus ring. Composes with buttons in rows via <code>anuka-grow</code>.</p>
  <div class="anuka-stack">
    <Input placeholder="Search words, pinyin, tags..." />
    <div class="anuka-row">
      <Input type="email" placeholder="Email" class="anuka-grow" />
      <Btn main>Send</Btn>
    </div>
  </div>

  <IslandTitle level={3}>Autocomplete</IslandTitle>
  <p>Chip input with dropdown. Type to filter, arrow keys to navigate, enter to select, backspace to remove.</p>
  <Autocomplete
    items={demoTagItems}
    selected={demoTags}
    formatSelected={(id) => '#' + id}
    placeholder="Add tags..."
    onadd={(id) => { if (!demoTags.includes(id)) demoTags = [...demoTags, id] }}
    onremove={(id) => demoTags = demoTags.filter(t => t !== id)}
    onclear={() => demoTags = []}
  />
</Island>
