export const formatGroup = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 'G-000'
  return `G-${String(Math.max(0, Math.trunc(num))).padStart(3, '0')}`
}
