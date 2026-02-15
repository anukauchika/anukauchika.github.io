<script lang="ts">
  import ActivityHeatmap from '@std/ui/ActivityHeatmap.svelte'

  interface Day {
    date: string
    label: string
    count: number
    sessions: number
    durationMs: number
    isFuture: boolean
  }

  interface Props {
    days: Day[]
    max: number
    selectedDate?: string | null
    onselect?: (date: string | null) => void
  }

  let { days, max, selectedDate = null, onselect }: Props = $props()

  const selectedIndex = $derived.by(() => {
    if (selectedDate == null) return null
    const idx = days.findIndex(d => d.date === selectedDate)
    return idx >= 0 ? idx : null
  })

  function formatDuration(ms: number): string {
    if (!ms) return ''
    const totalMin = Math.round(ms / 60000)
    if (totalMin < 1) return '<1 min'
    if (totalMin < 60) return `${totalMin} min`
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  function dayTitle(day: Day): string {
    if (day.isFuture) return day.label
    const parts: string[] = [day.label]
    if (day.count > 0 || day.sessions > 0) {
      if (day.count > 0) parts.push(`${day.count} word${day.count !== 1 ? 's' : ''}`)
      if (day.sessions > 0) parts.push(`${day.sessions} session${day.sessions !== 1 ? 's' : ''}`)
      if (day.durationMs > 0) parts.push(formatDuration(day.durationMs))
    } else {
      parts.push('No sessions')
    }
    return parts.join(' · ')
  }
</script>

<ActivityHeatmap
  items={days}
  range={[0, max]}
  value={(d) => d.count}
  title={dayTitle}
  muted={(d) => d.isFuture}
  {selectedIndex}
  onselect={(i) => onselect?.(selectedDate === days[i].date ? null : days[i].date)}
/>
