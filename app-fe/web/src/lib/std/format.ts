export const formatGroup = (value: number | string): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 'G-000'
  return `G-${String(Math.max(0, Math.trunc(num))).padStart(3, '0')}`
}

export const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const timeAgo = (ts: string | number | null | undefined): string => {
  if (!ts) return ''
  const diff = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}mins ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}hrs ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
