const SUBJECTIVE_TYPES = new Set(['subjective', 'essay', 'short_answer'])

export function parseQuestionOptions(rawOptions) {
  if (Array.isArray(rawOptions)) return rawOptions
  if (!rawOptions) return []

  try {
    const parsed = JSON.parse(rawOptions)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
