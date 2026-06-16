function addDays(days) {
  const next = new Date()
  next.setHours(12, 0, 0, 0)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

export function createEmptyStudyAbroadApplicationForm() {
  return {
    country: 'UK',
    school: '',
    program: '',
    degree: 'Master',
    intake: '2027 Fall',
    applicationRound: 'Round 1',
    deadline: addDays(30),
    status: 'planning',
    priority: 'match',
    note: '',
  }
}

export function createEmptyStudyAbroadTimelineForm(applications = []) {
  const first = applications[0]
  return {
    applicationId: first?.id ? String(first.id) : '',
    title: '',
    country: first?.country || 'UK',
    school: first?.school || '',
    phase: 'Documents',
    dueDate: addDays(14),
    status: 'todo',
    note: '',
  }
}

export function createEmptyStudyAbroadMaterialForm(applications = []) {
  const first = applications[0]
  return {
    applicationId: first?.id ? String(first.id) : '',
    title: '',
    country: first?.country || 'UK',
    stage: 'Documents',
    category: '申请材料',
    deadline: addDays(21),
    completed: false,
    note: '',
  }
}

export function createEmptyStudyAbroadExperienceForm() {
  return {
    title: '',
    country: 'UK',
    topic: 'Application',
    authorName: '',
    summary: '',
    content: '',
    tags: '',
  }
}

export function createEmptyStudyAbroadCaseForm() {
  return {
    applicationYear: '2026',
    studentMajor: '',
    gpa: '',
    rankPercent: '',
    languageType: 'IELTS',
    languageScore: '',
    standardizedScore: '',
    softBackground: '',
    country: 'UK',
    school: '',
    program: '',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '',
    applicationMode: '',
    tags: '',
    summary: '',
    contact: '',
  }
}

export function createEmptyStudyAbroadSchoolForm() {
  return {
    country: 'UK',
    schoolName: '',
    programName: '',
    degree: 'Master',
    subjectArea: 'Computer Science',
    qsRank: '',
    theRank: '',
    usNewsRank: '',
    tuitionRange: '',
    durationText: '',
    deadlineText: '',
    applicationRequirements: '',
    visaPolicy: '',
    employmentPolicy: '',
    partnerProgram: false,
    partnerNote: '',
    riskTags: '',
    riskSummary: '',
    sourceNote: '',
    policyUpdatedAt: addDays(0),
  }
}

export function buildApplicationPayload(form) {
  return {
    country: form.country,
    school: String(form.school || '').trim(),
    program: String(form.program || '').trim(),
    degree: String(form.degree || '').trim(),
    intake: String(form.intake || '').trim(),
    applicationRound: String(form.applicationRound || '').trim(),
    deadline: form.deadline,
    status: form.status,
    priority: form.priority,
    note: String(form.note || '').trim(),
  }
}

export function buildTimelinePayload(form) {
  return {
    applicationId: toNumberOrNull(form.applicationId),
    title: String(form.title || '').trim(),
    country: form.country,
    school: String(form.school || '').trim(),
    phase: form.phase,
    dueDate: form.dueDate,
    status: form.status,
    note: String(form.note || '').trim(),
  }
}

export function buildMaterialPayload(form) {
  return {
    applicationId: toNumberOrNull(form.applicationId),
    title: String(form.title || '').trim(),
    country: form.country,
    stage: form.stage,
    category: String(form.category || '').trim(),
    deadline: form.deadline,
    completed: Boolean(form.completed),
    note: String(form.note || '').trim(),
  }
}

export function buildExperiencePayload(form) {
  return {
    title: String(form.title || '').trim(),
    country: form.country,
    topic: form.topic,
    authorName: String(form.authorName || '').trim(),
    summary: String(form.summary || '').trim(),
    content: String(form.content || '').trim(),
    tags: normalizeCsv(form.tags),
  }
}

export function buildAdmissionCasePayload(form) {
  return {
    applicationYear: String(form.applicationYear || '').trim(),
    studentMajor: String(form.studentMajor || '').trim(),
    gpa: String(form.gpa || '').trim(),
    rankPercent: String(form.rankPercent || '').trim(),
    languageType: String(form.languageType || '').trim(),
    languageScore: String(form.languageScore || '').trim(),
    standardizedScore: String(form.standardizedScore || '').trim(),
    softBackground: String(form.softBackground || '').trim(),
    country: form.country,
    school: String(form.school || '').trim(),
    program: String(form.program || '').trim(),
    degree: String(form.degree || '').trim(),
    admissionResult: form.admissionResult,
    scholarship: String(form.scholarship || '').trim(),
    applicationMode: String(form.applicationMode || '').trim(),
    tags: normalizeCsv(form.tags),
    summary: String(form.summary || '').trim(),
    contact: String(form.contact || '').trim(),
  }
}

export function buildSchoolPayload(form) {
  return {
    country: form.country,
    schoolName: String(form.schoolName || '').trim(),
    programName: String(form.programName || '').trim(),
    degree: String(form.degree || '').trim(),
    subjectArea: String(form.subjectArea || '').trim(),
    qsRank: String(form.qsRank || '').trim(),
    theRank: String(form.theRank || '').trim(),
    usNewsRank: String(form.usNewsRank || '').trim(),
    tuitionRange: String(form.tuitionRange || '').trim(),
    durationText: String(form.durationText || '').trim(),
    deadlineText: String(form.deadlineText || '').trim(),
    applicationRequirements: String(form.applicationRequirements || '').trim(),
    visaPolicy: String(form.visaPolicy || '').trim(),
    employmentPolicy: String(form.employmentPolicy || '').trim(),
    partnerProgram: Boolean(form.partnerProgram),
    partnerNote: String(form.partnerNote || '').trim(),
    riskTags: normalizeCsv(form.riskTags),
    riskSummary: String(form.riskSummary || '').trim(),
    sourceNote: String(form.sourceNote || '').trim(),
    policyUpdatedAt: form.policyUpdatedAt,
  }
}
