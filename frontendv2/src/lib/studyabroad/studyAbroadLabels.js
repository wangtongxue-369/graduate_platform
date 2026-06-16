export const studyAbroadCountryOptions = [
  { value: 'UK', label: '英国' },
  { value: 'US', label: '美国' },
  { value: 'Hong Kong', label: '中国香港' },
  { value: 'Singapore', label: '新加坡' },
  { value: 'Australia', label: '澳大利亚' },
  { value: 'Canada', label: '加拿大' },
]

export const studyAbroadSubjectOptions = [
  'Computer Science',
  'Business',
  'Engineering',
  'Education',
  'Design',
  'Data Science',
]

export const studyAbroadTopicOptions = [
  { value: 'School Selection', label: '选校定位' },
  { value: 'Application', label: '申请流程' },
  { value: 'Language Test', label: '语言考试' },
  { value: 'Writing', label: '文书材料' },
  { value: 'Visa', label: '签证' },
  { value: 'Life Abroad', label: '海外生活' },
]

export const studyAbroadResultOptions = [
  { value: 'admit', label: '录取' },
  { value: 'waitlist', label: '候补' },
  { value: 'rejected', label: '未录取' },
]

export const studyAbroadApplicationStatusOptions = [
  { value: 'planning', label: '规划中' },
  { value: 'preparing', label: '准备中' },
  { value: 'submitted', label: '已提交' },
  { value: 'offer', label: '已拿 Offer' },
  { value: 'rejected', label: '未录取' },
]

export const studyAbroadApplicationPriorityOptions = [
  { value: 'dream', label: '冲刺' },
  { value: 'match', label: '匹配' },
  { value: 'safe', label: '保底' },
]

export const studyAbroadTimelinePhaseOptions = [
  { value: 'Language test', label: '语言考试' },
  { value: 'School selection', label: '选校定位' },
  { value: 'Documents', label: '文书材料' },
  { value: 'Submission', label: '网申提交' },
  { value: 'Visa', label: '签证' },
]

export const studyAbroadTimelineStatusOptions = [
  { value: 'todo', label: '待开始' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
]

export const studyAbroadMaterialStageOptions = [
  { value: 'Identity', label: '身份材料' },
  { value: 'Academic', label: '学术材料' },
  { value: 'Language test', label: '语言考试' },
  { value: 'Documents', label: '文书材料' },
  { value: 'Visa', label: '签证' },
]

export const studyAbroadMaterialCompletionOptions = [
  { value: 'all', label: '全部' },
  { value: 'done', label: '已完成' },
  { value: 'todo', label: '待完成' },
]

export const studyAbroadBoardColumns = [
  { key: 'planning', label: '规划中' },
  { key: 'preparing', label: '准备中' },
  { key: 'submitted', label: '已提交' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: '结果归档' },
]

function getLabelFromOptions(value, options, fallback = '待补充') {
  return options.find((item) => item.value === value)?.label || value || fallback
}

export function getCountryLabel(value) {
  return getLabelFromOptions(value, studyAbroadCountryOptions, '地区待补充')
}

export function getAdmissionResultLabel(value) {
  return getLabelFromOptions(value, studyAbroadResultOptions, '结果待补充')
}

export function getApplicationStatusLabel(value) {
  return getLabelFromOptions(value, studyAbroadApplicationStatusOptions, '状态待补充')
}

export function getApplicationPriorityLabel(value) {
  return getLabelFromOptions(value, studyAbroadApplicationPriorityOptions, '优先级待补充')
}

export function getTimelinePhaseLabel(value) {
  return getLabelFromOptions(value, studyAbroadTimelinePhaseOptions, '阶段待补充')
}

export function getTimelineStatusLabel(value) {
  return getLabelFromOptions(value, studyAbroadTimelineStatusOptions, '状态待补充')
}

export function getMaterialStageLabel(value) {
  return getLabelFromOptions(value, studyAbroadMaterialStageOptions, '阶段待补充')
}

export function getTopicLabel(value) {
  return getLabelFromOptions(value, studyAbroadTopicOptions, '主题待补充')
}

export function getPriorityChip(value) {
  const chipMap = {
    dream: '冲',
    match: '稳',
    safe: '保',
  }
  return chipMap[value] || '申'
}
