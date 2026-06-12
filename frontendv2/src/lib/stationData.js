export function canUseRemoteToken(token) {
  return Boolean(token && token !== 'dev-token')
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

export function ensurePage(data, fallback = []) {
  if (!data || typeof data !== 'object') {
    return {
      content: fallback,
      totalElements: fallback.length,
      totalPages: 1,
      page: 0,
      size: fallback.length,
    }
  }

  const content = ensureArray(data.content || data.items || fallback)

  return {
    content,
    totalElements: Number(data.totalElements ?? data.totalItems ?? content.length),
    totalPages: Number(data.totalPages ?? 1),
    page: Number(data.page ?? 0),
    size: Number(data.size ?? content.length),
  }
}

export function firstNonEmpty(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

export function formatDateLabel(value) {
  if (!value) return '待确认'
  return String(value).replace('T', ' ').slice(0, 10)
}

export function formatDateTimeLabel(value) {
  if (!value) return '待确认'
  return String(value).replace('T', ' ').slice(0, 16)
}

export function formatBytes(value) {
  const bytes = Number(value || 0)
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatRatioText(value) {
  if (value === undefined || value === null || value === '') return '待补充'
  const text = String(value)
  return text.includes(':') ? text : `${text}:1`
}

export function formatCountText(value, suffix = '项') {
  const count = Number(value || 0)
  return `${count} ${suffix}`
}

export function normalizeTagList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function previewDataNotice(label) {
  return `${label}：预览数据`
}

export function remoteDataNotice(label) {
  return `${label}：已连接后端`
}

export function fallbackDataNotice(label, error) {
  if (error?.message) return error.message
  return `${label}读取失败，已切回预览数据。`
}
