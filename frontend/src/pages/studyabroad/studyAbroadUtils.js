export const countryOptions = [
  { value: 'General', label: '通用' },
  { value: 'UK', label: '英国' },
  { value: 'US', label: '美国' },
  { value: 'Australia', label: '澳大利亚' },
  { value: 'Canada', label: '加拿大' },
  { value: 'Hong Kong', label: '中国香港' },
  { value: 'Singapore', label: '新加坡' },
  { value: 'Japan', label: '日本' },
  { value: 'Germany', label: '德国' },
  { value: 'Netherlands', label: '荷兰' },
  { value: 'New Zealand', label: '新西兰' },
  { value: 'France', label: '法国' },
]

export const countryLabelMap = Object.fromEntries(countryOptions.map((item) => [item.value, item.label]))

export function addMonthsDate(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

export function daysLeft(dateText) {
  if (!dateText) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target - today) / 86400000)
}

export function deadlineText(left) {
  if (left == null) return '未设置日期'
  if (left < 0) return `已逾期 ${Math.abs(left)} 天`
  if (left === 0) return '今天截止'
  if (left <= 7) return `${left} 天内截止`
  return `${left} 天后截止`
}

export function urgencyClass(left) {
  if (left == null) return 'subtle'
  if (left < 0) return 'danger'
  if (left <= 7) return 'warning'
  return 'subtle'
}

export function applicationStatusClass(status) {
  if (status === 'offer') return 'done'
  if (status === 'rejected') return 'danger'
  if (status === 'planning') return 'todo'
  return 'doing'
}

export function createLocalId(prefix) {
  return `${prefix}-${Date.now()}`
}

export function appLabel(app) {
  return `${app.school} / ${app.program}`
}

export function findApplication(applications, id) {
  return applications.find((item) => String(item.id) === String(id))
}

export function normalizeApplicationId(value, canUseRemote) {
  if (!value) return null
  return canUseRemote ? Number(value) : value
}
