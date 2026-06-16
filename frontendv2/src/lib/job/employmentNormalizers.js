import {
  ensureArray,
  ensurePage,
  firstNonEmpty,
  formatBytes,
  formatDateLabel,
  formatDateTimeLabel,
} from '@/lib/stationData.js'

export const resumeFileDefaults = {
  hasFile: false,
  fileName: '',
  fileSize: 0,
  fileType: '',
  uploadedAt: '',
}

const applicationGroupMap = {
  TODO: 'todo',
  APPLIED: 'active',
  SCREENING: 'active',
  WRITTEN_TEST: 'active',
  FIRST_INTERVIEW: 'interview',
  SECOND_INTERVIEW: 'interview',
  HR_INTERVIEW: 'interview',
  FINAL_INTERVIEW: 'interview',
  OFFER: 'result',
  ACCEPTED: 'result',
  DECLINED: 'result',
  REJECTED: 'result',
  WITHDRAWN: 'result',
  CLOSED: 'result',
}

function fallbackText(value, fallback) {
  return firstNonEmpty(value, fallback)
}

export function normalizeResume(data) {
  return {
    targetRole: data?.targetRole || '',
    expectedCities: data?.expectedCities || '',
    expectedIndustries: data?.expectedIndustries || '',
    expectedSalary: data?.expectedSalary || '',
    highestEducation: data?.highestEducation || data?.educationLevel || '',
    major: data?.major || '',
    phone: data?.phone || '',
    email: data?.email || '',
    skillTags: data?.skillTags || '',
    projectKeywords: data?.projectKeywords || '',
    internshipKeywords: data?.internshipKeywords || '',
    certificates: data?.certificates || '',
    portfolioUrl: data?.portfolioUrl || '',
    baseInfo: data?.baseInfo || '',
    educationExperience: data?.educationExperience || data?.education || '',
    projectExperience: data?.projectExperience || data?.projects || '',
    internshipExperience: data?.internshipExperience || data?.internships || '',
    skillsDescription: data?.skillsDescription || data?.skills || '',
    selfEvaluation: data?.selfEvaluation || '',
    resumeFile: {
      ...resumeFileDefaults,
      ...(data?.resumeFile || {}),
    },
  }
}

export function normalizeRecommendations(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    title: fallbackText(item.title || item.jobTitle, '未命名岗位'),
    companyName: fallbackText(item.companyName, '企业待补充'),
    city: fallbackText(item.city, '城市待补充'),
    industry: fallbackText(item.industry, '行业待补充'),
    companyType: fallbackText(item.companyType, '企业类型待补充'),
    roleType: fallbackText(item.roleType || item.jobType, '岗位类型待补充'),
    salaryRange: fallbackText(item.salaryRange, '薪资待补充'),
    educationRequirement: fallbackText(item.educationRequirement, '学历要求待补充'),
    majorKeywords: item.majorKeywords || '',
    skillTags: item.skillTags || '',
    matchScore: Number(item.matchScore || 0),
    matchReasons: ensureArray(item.matchReasons),
    description: fallbackText(item.description, '后端暂未补充岗位说明'),
    applyUrl: item.applyUrl || '',
    canApplyDirectly: Boolean(item.applyUrl),
  }))
}

export function normalizeRecommendationPage(data) {
  const rawItems = Array.isArray(data) ? data : (data?.items || data?.content || [])
  return {
    items: normalizeRecommendations(rawItems),
    totalPages: Array.isArray(data) ? 1 : Number(data?.totalPages ?? 1),
    page: Array.isArray(data) ? 1 : Number(data?.page ?? 1),
    totalItems: Array.isArray(data) ? rawItems.length : Number(data?.totalItems ?? data?.totalElements ?? rawItems.length),
    size: Array.isArray(data) ? rawItems.length : Number(data?.size ?? rawItems.length),
  }
}

export function normalizeApplications(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    jobPostingId: item.jobPostingId || '',
    companyName: fallbackText(item.companyName, '企业待补充'),
    jobTitle: fallbackText(item.jobTitle, '岗位待补充'),
    city: item.city || '',
    industry: item.industry || '',
    companyType: item.companyType || '',
    roleType: item.roleType || '',
    salaryRange: item.salaryRange || '',
    educationRequirement: item.educationRequirement || '',
    majorKeywords: item.majorKeywords || '',
    skillTags: item.skillTags || '',
    applyUrl: item.applyUrl || '',
    channel: item.channel || '',
    status: item.status || 'TODO',
    interviewRound: item.interviewRound || '',
    interviewMode: item.interviewMode || '',
    appliedAt: item.appliedAt || '',
    nextStepAt: item.nextStepAt || '',
    notes: item.notes || '',
  }))
}

export function normalizeNotifications(data) {
  const items = Array.isArray(data) ? data : ensureArray(data?.items)
  const unreadCount = Array.isArray(data)
    ? items.filter((item) => !item.readFlag).length
    : Number(data?.unreadCount ?? items.filter((item) => !item.readFlag).length)

  return { items, unreadCount }
}

export function normalizeFairPage(data) {
  const page = ensurePage({
    content: data?.items || data?.content || [],
    totalElements: data?.totalItems,
    totalPages: data?.totalPages,
    page: data?.page ? Number(data.page) - 1 : data?.number ?? 0,
    size: data?.size,
  })

  return {
    items: page.content.map((item) => ({
      id: item.id,
      title: fallbackText(item.title, '未命名招聘会'),
      companyName: fallbackText(item.companyName || item.title, '企业待补充'),
      city: fallbackText(item.city, '城市待补充'),
      industry: fallbackText(item.industry, '行业待补充'),
      targetRoles: item.targetRoles || '',
      location: fallbackText(item.location, '地点待补充'),
      description: fallbackText(item.description, '后端暂未补充招聘会说明'),
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      applyDeadline: item.applyDeadline || '',
      applyUrl: item.applyUrl || '',
      active: item.active !== false,
      expired: Boolean(item.expired),
      applicationClosed: Boolean(item.applicationClosed),
      statusLabel: item.statusLabel || (item.expired ? '已结束' : '进行中'),
      applyStatusLabel: item.applyStatusLabel || (item.applicationClosed ? '报名已截止' : '可报名'),
      timeText: firstNonEmpty(formatDateTimeLabel(item.startTime), formatDateLabel(item.startTime), '待确认'),
    })),
    totalPages: page.totalPages,
    page: page.page,
    totalItems: page.totalElements,
  }
}

export function normalizePostingDetail(data) {
  return {
    id: data?.id,
    title: fallbackText(data?.title || data?.jobTitle, '未命名岗位'),
    companyName: fallbackText(data?.companyName, '企业待补充'),
    city: fallbackText(data?.city, '城市待补充'),
    industry: fallbackText(data?.industry, '行业待补充'),
    companyType: fallbackText(data?.companyType, '企业类型待补充'),
    roleType: fallbackText(data?.roleType || data?.jobType, '岗位类型待补充'),
    salaryRange: fallbackText(data?.salaryRange, '薪资待补充'),
    educationRequirement: fallbackText(data?.educationRequirement, '学历要求待补充'),
    majorKeywords: data?.majorKeywords || '',
    skillTags: data?.skillTags || '',
    description: fallbackText(data?.description, '后端暂未补充岗位说明'),
    responsibilities: data?.responsibilities || '',
    requirements: data?.requirements || '',
    applyUrl: data?.applyUrl || '',
  }
}

export function normalizeFairDetail(data) {
  return {
    id: data?.id,
    title: fallbackText(data?.title, '未命名招聘会'),
    companyName: fallbackText(data?.companyName || data?.title, '企业待补充'),
    city: fallbackText(data?.city, '城市待补充'),
    industry: fallbackText(data?.industry, '行业待补充'),
    location: fallbackText(data?.location, '地点待补充'),
    targetRoles: data?.targetRoles || '',
    description: fallbackText(data?.description, '后端暂未补充招聘会说明'),
    startTime: data?.startTime || '',
    endTime: data?.endTime || '',
    applyDeadline: data?.applyDeadline || '',
    applyUrl: data?.applyUrl || '',
    active: data?.active !== false,
    expired: Boolean(data?.expired),
    applicationClosed: Boolean(data?.applicationClosed),
  }
}

export function normalizeAdminListPage(data) {
  const page = ensurePage({
    content: Array.isArray(data) ? data : (data?.items || data?.content || []),
    totalElements: Array.isArray(data) ? data.length : (data?.totalItems ?? data?.totalElements),
    totalPages: Array.isArray(data) ? 1 : data?.totalPages,
    page: Array.isArray(data) ? 0 : (data?.page ?? data?.number ?? 0),
    size: Array.isArray(data) ? data.length : data?.size,
  })

  return {
    items: page.content,
    totalItems: page.totalElements,
    totalPages: page.totalPages,
    page: page.page,
    size: page.size,
  }
}

export function buildApplicationGroups(items) {
  const grouped = {
    todo: [],
    active: [],
    interview: [],
    result: [],
  }

  normalizeApplications(items).forEach((item) => {
    const bucket = applicationGroupMap[item.status] || 'todo'
    grouped[bucket].push(item)
  })

  return [
    { key: 'todo', title: '待启动', description: '先补齐材料，再决定是否投递。', items: grouped.todo },
    { key: 'active', title: '推进中', description: '已投递、筛选中和笔试阶段。', items: grouped.active },
    { key: 'interview', title: '面试中', description: '进入面试链路后的记录。', items: grouped.interview },
    { key: 'result', title: '已出结果', description: '录用、拒绝、放弃和关闭记录。', items: grouped.result },
  ]
}

export function formatResumeFileMeta(file) {
  if (!file?.hasFile) return '当前没有附件简历'
  return `${file.fileName || '未命名附件'} / ${formatBytes(file.fileSize)} / ${formatDateTimeLabel(file.uploadedAt)}`
}
