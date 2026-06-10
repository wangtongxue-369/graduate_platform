const previewResume = {
  id: 3001,
  templateType: 'default',
  targetRole: '前端开发工程师',
  expectedCities: '上海, 杭州',
  expectedIndustries: '互联网, 企业服务',
  expectedSalary: '12k-18k',
  educationLevel: '本科',
  major: '软件工程',
  skillTags: 'React, TypeScript, Vite, 数据可视化',
  projectKeywords: '中后台, 权限管理, 组件抽象',
  internshipKeywords: '前端开发, 页面重构, 需求拆解',
  certificates: 'CET-6, 软考中级',
  portfolioUrl: 'https://portfolio.example.com',
  baseInfo: '2026 届，偏中后台方向，正在补齐校招简历。',
  education: '华东理工大学 软件工程 本科 2022-2026',
  projects: '毕业去向平台前端改版，负责角色分流、招聘链路和题库入口重构。',
  internships: '教育科技公司前端实习，参与运营后台与数据看板搭建。',
  skills: 'React、TypeScript、Vite、Node.js、REST API、Figma 协作',
  selfEvaluation: '擅长把复杂流程拆成清晰步骤，重视页面反馈、路径感和表单可用性。',
  resumeFile: {
    hasFile: true,
    fileName: 'frontend-resume-preview.pdf',
    fileSize: 428512,
    fileType: 'application/pdf',
    uploadedAt: '2026-06-09T14:30:00',
  },
  updatedAt: '2026-06-09T14:30:00',
}

const previewRecommendations = [
  {
    id: 101,
    title: '前端开发工程师',
    companyName: '青木科技',
    city: '上海',
    industry: '企业服务',
    companyType: '民营企业',
    roleType: '校招',
    salaryRange: '13k-18k',
    educationRequirement: '本科及以上',
    majorKeywords: '计算机, 软件工程',
    skillTags: 'React, TypeScript, 工程化',
    description: '负责招聘运营后台和学生端主站的页面开发，强调复杂流程拆解与组件抽象能力。',
    applyUrl: 'https://example.com/jobs/101',
    active: true,
    createdAt: '2026-06-09T09:00:00',
    matchScore: 93,
    matchReasons: ['目标岗位匹配', '简历技能匹配', '项目经历匹配', '城市偏好匹配'],
  },
  {
    id: 102,
    title: '校园产品运营培训生',
    companyName: '北岸教育',
    city: '杭州',
    industry: '教育科技',
    companyType: '上市公司',
    roleType: '校招',
    salaryRange: '10k-14k',
    educationRequirement: '本科',
    majorKeywords: '专业不限',
    skillTags: '数据分析, 沟通协同, 活动执行',
    description: '参与校招转化项目，配合社区与就业内容运营，适合同时关注产品和增长链路的同学。',
    applyUrl: 'https://example.com/jobs/102',
    active: true,
    createdAt: '2026-06-08T16:20:00',
    matchScore: 81,
    matchReasons: ['城市偏好匹配', '行业偏好匹配', '项目经历可迁移'],
  },
  {
    id: 103,
    title: '数据分析助理',
    companyName: '观象咨询',
    city: '上海',
    industry: '咨询',
    companyType: '民营企业',
    roleType: '实习',
    salaryRange: '180/天',
    educationRequirement: '本科及以上',
    majorKeywords: '统计学, 计算机, 数学',
    skillTags: 'SQL, Excel, 可视化',
    description: '支持招聘数据复盘和岗位投放分析，适合想补齐数据分析视角的同学。',
    applyUrl: 'https://example.com/jobs/103',
    active: true,
    createdAt: '2026-06-07T11:10:00',
    matchScore: 74,
    matchReasons: ['城市偏好匹配', '技能可补位', '适合补强分析能力'],
  },
]

const previewNotificationItems = [
  {
    id: 501,
    title: '新岗位与你的简历关键词更接近',
    content: '青木科技新增了 React + TypeScript 方向岗位，建议先看详情再决定是否加入跟踪。',
    relatedType: 'JOB',
    relatedId: 101,
    readFlag: false,
    targetUrl: '/job/postings/101',
    createdAt: '2026-06-10T09:20:00',
    readAt: null,
  },
  {
    id: 502,
    title: '你有一条待推进的面试提醒',
    content: '上一次投递的下一步事项安排在本周四，建议回到投递跟踪页补充备注。',
    relatedType: 'APPLICATION',
    relatedId: 9001,
    readFlag: true,
    targetUrl: '/job/applications',
    createdAt: '2026-06-09T18:40:00',
    readAt: '2026-06-09T19:05:00',
  },
]

const previewApplications = [
  {
    id: 9001,
    companyName: '青木科技',
    jobTitle: '前端开发工程师',
    jobPostingId: 101,
    status: 'INTERVIEW',
    appliedAt: '2026-06-08T10:30:00',
    nextStepAt: '2026-06-12T14:00:00',
    notes: '一面已约，准备组件抽象、接口容错和项目取舍题。',
    createdAt: '2026-06-08T10:30:00',
    updatedAt: '2026-06-09T20:10:00',
  },
  {
    id: 9002,
    companyName: '北岸教育',
    jobTitle: '校园产品运营培训生',
    jobPostingId: 102,
    status: 'TODO',
    appliedAt: null,
    nextStepAt: '2026-06-11T19:30:00',
    notes: '还没决定是否投递，先补一版更偏运营的数据表达。',
    createdAt: '2026-06-09T09:10:00',
    updatedAt: '2026-06-09T09:10:00',
  },
]

function cloneResumeFile(file) {
  return { ...file }
}

function cloneRecommendation(item) {
  return {
    ...item,
    matchReasons: Array.isArray(item.matchReasons) ? [...item.matchReasons] : [],
  }
}

function includesText(source, query) {
  if (!query) return true
  return String(source || '').toLowerCase().includes(String(query).trim().toLowerCase())
}

function matchesKeyword(item, keyword) {
  if (!keyword) return true
  return [
    item.title,
    item.companyName,
    item.city,
    item.industry,
    item.companyType,
    item.roleType,
    item.description,
    item.skillTags,
    item.majorKeywords,
  ].some((field) => includesText(field, keyword))
}

export function createPreviewResume() {
  return {
    ...previewResume,
    resumeFile: cloneResumeFile(previewResume.resumeFile),
  }
}

export function createPreviewRecommendations() {
  return previewRecommendations.map(cloneRecommendation)
}

export function createPreviewNotificationState() {
  const items = previewNotificationItems.map((item) => ({ ...item }))
  return {
    items,
    unreadCount: items.filter((item) => !item.readFlag).length,
    totalItems: items.length,
  }
}

export function createPreviewApplications() {
  return previewApplications.map((item) => ({ ...item }))
}

export function findPreviewJobById(id) {
  const match = previewRecommendations.find((item) => String(item.id) === String(id))
  return match ? cloneRecommendation(match) : null
}

export function filterPreviewRecommendations(filters = {}) {
  return createPreviewRecommendations().filter((item) => (
    matchesKeyword(item, filters.keyword)
    && includesText(item.city, filters.city)
    && includesText(item.industry, filters.industry)
    && includesText(item.roleType, filters.roleType)
    && includesText(item.companyType, filters.companyType)
    && includesText(item.educationRequirement, filters.education)
    && includesText(item.majorKeywords, filters.major)
    && includesText(item.skillTags, filters.skills)
    && includesText(item.salaryRange, filters.salaryRange)
    && (!filters.onlyApplyable || Boolean(item.applyUrl))
  ))
}
