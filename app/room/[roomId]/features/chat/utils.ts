const AV_COLORS = ['av-p', 'av-t', 'av-c']

export function formatTime(iso: string) {
  const d = new Date(iso)
  const hh = d.getHours()
  const mm = d.getMinutes()
  const ampm = hh < 12 ? '오전' : '오후'
  const h = hh % 12 || 12
  return `${ampm} ${h}:${mm < 10 ? '0' : ''}${mm}`
}

export function getAvColor(name: string) {
  const safe = name?.trim() || '익명'
  const idx = safe.charCodeAt(0) % AV_COLORS.length
  return AV_COLORS[idx]
}
