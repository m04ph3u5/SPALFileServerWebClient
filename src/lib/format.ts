export function formatBytes(bytes: number) {
  if (bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unit
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date(date).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(new Date(date))
}
