const SUBJECTIVE_TYPES = new Set(['subjective', 'essay', 'short_answer'])

// 历史/外部导入的题目可能把选项存成 [{key:"A", value:"xxx"}, ...] 等对象形态，
// 这里统一展平成 React 可直接渲染的字符串，避免选项作为子节点触发
// "Objects are not valid as a React child"。
function flattenOptionItem(item) {
  if (item == null) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'number' || typeof item === 'boolean') return String(item)
  if (typeof item === 'object') {
    const key = item.key ?? item.label ?? item.optionKey ?? item.code
    const value = item.value ?? item.text ?? item.content ?? item.optionValue ?? item.label
    if (key != null && value != null && key !== value) return `${key}.${value}`
    if (value != null) return String(value)
    if (key != null) return String(key)
  }
  return ''
}

export function parseQuestionOptions(rawOptions) {
  let list
  if (Array.isArray(rawOptions)) {
    list = rawOptions
  } else if (!rawOptions) {
    return []
  } else {
    try {
      const parsed = JSON.parse(rawOptions)
      list = Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return list.map(flattenOptionItem).filter((item) => item !== '')
}

export function isSubjectiveQuestionType(type) {
  return SUBJECTIVE_TYPES.has(type)
}

export function normalizePracticeQuestion(question = {}) {
  return {
    ...question,
    options: parseQuestionOptions(question.options || question.optionsJson),
    chapter: question.chapter || '未分章节',
    questionType: question.questionType || 'single',
    difficulty: question.difficulty || 'middle',
  }
}

export function normalizePagedResult(payload = {}) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 0,
      size: payload.length || 20,
      totalPages: payload.length ? 1 : 0,
    }
  }

  if (Array.isArray(payload.items)) {
    return {
      items: payload.items,
      total: payload.total ?? payload.items.length,
      page: payload.page ?? 0,
      size: payload.size ?? payload.items.length,
      totalPages: payload.totalPages ?? 1,
    }
  }

  if (Array.isArray(payload.content)) {
    return {
      items: payload.content,
      total: payload.totalElements ?? payload.content.length,
      page: payload.number ?? payload.page ?? 0,
      size: payload.size ?? payload.content.length,
      totalPages: payload.totalPages ?? 1,
    }
  }

  return {
    items: [],
    total: 0,
    page: 0,
    size: 20,
    totalPages: 0,
  }
}
