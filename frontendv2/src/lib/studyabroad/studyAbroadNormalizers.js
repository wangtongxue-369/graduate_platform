import { studyAbroadWorkspace } from '@/lib/workspacePreview.js'
import {
  ensureArray,
  ensurePage,
  formatDateLabel,
  normalizeTagList,
} from '@/lib/stationData.js'
import { studyAbroadBoardColumns } from './studyAbroadLabels.js'

function withDefault(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value
}

export function createFallbackPrograms() {
  return studyAbroadWorkspace.programs.map((item, index) => ({
    id: `program-${index + 1}`,
    country: index === 1 ? 'Singapore' : 'UK',
    schoolName: item.school,
    programName: item.track,
    degree: 'Master',
    subjectArea: index === 2 ? 'Education' : 'Computer Science',
    qsRank: index === 0 ? 'QS Top 100' : 'QS 待补充',
    theRank: '',
    usNewsRank: '',
    tuitionRange: index === 1 ? 'SGD 58k' : 'GBP 32k',
    durationText: '1 year',
    deadlineText: item.round,
    applicationRequirements: item.note,
    visaPolicy: '按学校录取流程申请学生签证。',
    employmentPolicy: '建议尽早准备实习与作品集材料。',
    partnerProgram: index === 0,
    partnerNote: index === 0 ? '本校交换合作项目' : '',
    riskTags: index === 2 ? ['文书竞争'] : ['申请节奏'],
    riskSummary: item.note,
    sourceNote: '预览数据',
    policyUpdatedAt: '2026-06-16',
  }))
}

export function createFallbackCases() {
  return studyAbroadWorkspace.cases.map((item, index) => ({
    id: `case-${index + 1}`,
    country: 'UK',
    school: item.title,
    program: item.accent,
    studentMajor: '计算机相关专业',
    gpa: '3.7/4.0',
    rankPercent: '前 15%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: '',
    softBackground: '科研 + 实习',
    degree: 'Master',
    admissionResult: index === 0 ? 'admit' : index === 1 ? 'waitlist' : 'rejected',
    scholarship: '',
    applicationMode: 'DIY',
    tags: ['案例预览'],
    summary: item.summary,
    contact: index === 0 ? '可在答辩演示时填写邮箱或微信' : '',
    applicationYear: '2026',
    authorId: 9,
  }))
}

export function createFallbackApplications() {
  return studyAbroadWorkspace.applications.map((item, index) => ({
    id: index + 1,
    country: 'UK',
    school: item.school,
    program: index === 1 ? 'Data Analysis' : 'Marketing',
    degree: 'Master',
    intake: '2027 Fall',
    applicationRound: 'Round 1',
    deadline: `2026-0${index + 7}-2${index}`,
    status: index === 0 ? 'submitted' : index === 1 ? 'preparing' : 'planning',
    priority: index === 0 ? 'dream' : 'match',
    note: item.nextStep,
  }))
}

export function createFallbackTimeline() {
  return studyAbroadWorkspace.timeline.map((item, index) => ({
    id: index + 1,
    applicationId: index < 2 ? 1 : 2,
    title: item.stage,
    country: 'UK',
    school: index < 2 ? 'Leeds' : 'Warwick',
    phase: index === 0 ? 'School selection' : index === 1 ? 'Documents' : index === 2 ? 'Submission' : 'Visa',
    dueDate: `2026-0${index + 6}-1${index}`,
    status: index === 0 ? 'doing' : 'todo',
    note: item.note,
    applicationSchool: index < 2 ? 'Leeds' : 'Warwick',
    applicationProgram: index < 2 ? 'Marketing' : 'Education',
  }))
}

export function createFallbackMaterials() {
  return studyAbroadWorkspace.materials.map((item, index) => ({
    id: index + 1,
    applicationId: index < 2 ? 1 : 2,
    title: item.title,
    country: 'UK',
    stage: index === 0 ? 'Academic' : index === 1 ? 'Documents' : 'Language test',
    category: '申请材料',
    deadline: `2026-0${index + 6}-2${index}`,
    completed: item.state.includes('已'),
    note: item.note,
    attachments: index === 0 ? [{ id: 301, originalName: 'transcript.pdf', fileSize: 20480 }] : [],
    applicationSchool: index < 2 ? 'Leeds' : 'Warwick',
    applicationProgram: index < 2 ? 'Marketing' : 'Education',
  }))
}

export function createFallbackExperiences() {
  return [
    {
      id: 1,
      title: '跨专业申请的文书节奏拆分',
      country: 'UK',
      topic: 'Writing',
      authorName: '前辈 A',
      readTime: '6 min',
      summary: '先列项目证据，再回收成一条主叙事，避免文书像流水账。',
      content: '把文书拆成经历证据、能力映射、申请动机三层，再反复压缩。',
      tags: ['文书', '跨专业'],
      authorId: 9,
      createdAt: '2026-06-16T10:00:00',
    },
    {
      id: 2,
      title: 'Offer 前后的补件时间线',
      country: 'Singapore',
      topic: 'Application',
      authorName: '前辈 B',
      readTime: '4 min',
      summary: '把补件和语言成绩回收进独立清单，不要混在主申请里。',
      content: '主申请提交后立刻拆一个补件列表，按学校单独跟踪。',
      tags: ['补件', '时间线'],
      authorId: 12,
      createdAt: '2026-06-15T10:00:00',
    },
  ]
}

export function normalizeProgram(item) {
  return {
    id: item.id,
    country: withDefault(item.country, 'UK'),
    schoolName: withDefault(item.schoolName, '院校待补充'),
    programName: withDefault(item.programName, '项目待补充'),
    degree: withDefault(item.degree, 'Master'),
    subjectArea: withDefault(item.subjectArea, '方向待补充'),
    qsRank: withDefault(item.qsRank, '排名待补充'),
    theRank: withDefault(item.theRank, ''),
    usNewsRank: withDefault(item.usNewsRank, ''),
    tuitionRange: withDefault(item.tuitionRange, '学费待补充'),
    durationText: withDefault(item.durationText, '学制待补充'),
    deadlineText: withDefault(item.deadlineText, '截止待补充'),
    applicationRequirements: withDefault(item.applicationRequirements, '申请要求待补充'),
    visaPolicy: withDefault(item.visaPolicy, '签证说明待补充'),
    employmentPolicy: withDefault(item.employmentPolicy, '就业说明待补充'),
    partnerProgram: Boolean(item.partnerProgram),
    partnerNote: withDefault(item.partnerNote, ''),
    riskTags: normalizeTagList(item.riskTags),
    riskSummary: withDefault(item.riskSummary, '暂无风险摘要'),
    sourceNote: withDefault(item.sourceNote, ''),
    policyUpdatedAt: withDefault(item.policyUpdatedAt, ''),
  }
}

export function normalizeCase(item) {
  return {
    id: item.id,
    country: withDefault(item.country, 'UK'),
    school: withDefault(item.school, '院校待补充'),
    program: withDefault(item.program, '项目待补充'),
    studentMajor: withDefault(item.studentMajor, '专业待补充'),
    gpa: withDefault(item.gpa, 'GPA 待补充'),
    rankPercent: withDefault(item.rankPercent, ''),
    languageType: withDefault(item.languageType, 'IELTS'),
    languageScore: withDefault(item.languageScore, '待补充'),
    standardizedScore: withDefault(item.standardizedScore, ''),
    softBackground: withDefault(item.softBackground, ''),
    degree: withDefault(item.degree, 'Master'),
    admissionResult: withDefault(item.admissionResult, 'admit'),
    scholarship: withDefault(item.scholarship, ''),
    applicationMode: withDefault(item.applicationMode, ''),
    tags: normalizeTagList(item.tags),
    summary: withDefault(item.summary, '暂无案例摘要'),
    contact: withDefault(item.contact, ''),
    applicationYear: withDefault(item.applicationYear, '2026'),
    authorId: item.authorId,
    createdAt: withDefault(item.createdAt, ''),
  }
}

export function normalizeApplication(item) {
  return {
    id: item.id,
    country: withDefault(item.country, 'UK'),
    school: withDefault(item.school, '院校待补充'),
    program: withDefault(item.program, '项目待补充'),
    degree: withDefault(item.degree, 'Master'),
    intake: withDefault(item.intake, '入学季待补充'),
    applicationRound: withDefault(item.applicationRound, '轮次待补充'),
    deadline: withDefault(item.deadline, ''),
    status: withDefault(item.status, 'planning'),
    priority: withDefault(item.priority, 'match'),
    note: withDefault(item.note, ''),
  }
}

export function normalizeTimeline(item) {
  return {
    id: item.id,
    applicationId: item.applicationId,
    title: withDefault(item.title, '未命名节点'),
    country: withDefault(item.country, 'UK'),
    school: withDefault(item.school, ''),
    phase: withDefault(item.phase, 'Documents'),
    dueDate: withDefault(item.dueDate, ''),
    status: withDefault(item.status, 'todo'),
    note: withDefault(item.note, ''),
    applicationSchool: withDefault(item.applicationSchool, item.school || ''),
    applicationProgram: withDefault(item.applicationProgram, ''),
  }
}

export function normalizeMaterial(item) {
  return {
    id: item.id,
    applicationId: item.applicationId,
    title: withDefault(item.title, '未命名材料'),
    country: withDefault(item.country, 'UK'),
    stage: withDefault(item.stage, 'Documents'),
    category: withDefault(item.category, '申请材料'),
    deadline: withDefault(item.deadline, ''),
    completed: Boolean(item.completed),
    note: withDefault(item.note, ''),
    attachments: ensureArray(item.attachments),
    applicationSchool: withDefault(item.applicationSchool, ''),
    applicationProgram: withDefault(item.applicationProgram, ''),
  }
}

export function normalizeExperience(item) {
  return {
    id: item.id,
    title: withDefault(item.title, '未命名经验'),
    country: withDefault(item.country, 'UK'),
    topic: withDefault(item.topic, 'Application'),
    authorName: withDefault(item.authorName, '匿名作者'),
    summary: withDefault(item.summary, '暂无摘要'),
    content: withDefault(item.content, ''),
    tags: normalizeTagList(item.tags),
    authorId: item.authorId,
    createdAt: withDefault(item.createdAt, ''),
  }
}

export function normalizeProgramsPage(data) {
  const page = ensurePage(data, createFallbackPrograms())
  return { ...page, content: page.content.map(normalizeProgram) }
}

export function normalizeCasesPage(data) {
  const page = ensurePage(data, createFallbackCases())
  return { ...page, content: page.content.map(normalizeCase) }
}

export function normalizeExperiencesPage(data) {
  const page = ensurePage(data, createFallbackExperiences())
  return { ...page, content: page.content.map(normalizeExperience) }
}

export function normalizeApplications(data) {
  return ensureArray(data).map(normalizeApplication)
}

export function normalizeTimelineItems(data) {
  return ensureArray(data).map(normalizeTimeline)
}

export function normalizeMaterialItems(data) {
  return ensureArray(data).map(normalizeMaterial)
}

export function buildApplicationLanes(applications) {
  return studyAbroadBoardColumns.map((column) => ({
    ...column,
    items: applications.filter((item) => item.status === column.key),
  }))
}

export function buildOverviewState({
  programs = [],
  cases = [],
  applications = [],
  timeline = [],
  materials = [],
  experiences = [],
}) {
  const overdueCount = [
    ...applications.map((item) => item.deadline),
    ...timeline.filter((item) => item.status !== 'done').map((item) => item.dueDate),
    ...materials.filter((item) => !item.completed).map((item) => item.deadline),
  ].filter((value) => value && new Date(value) < new Date()).length

  const summaryItems = [
    { label: '项目目录', value: String(programs.length), note: '可用于选校判断的项目样本数' },
    { label: '在申项目', value: String(applications.length), note: '已经进入个人推进链路的项目数' },
    { label: '风险提醒', value: String(overdueCount), note: '逾期或已经落后的申请节点' },
    { label: '经验沉淀', value: String(experiences.length), note: '可复用的公开经验与复盘样本' },
  ]

  const riskItems = [
    ...timeline
      .filter((item) => item.status !== 'done')
      .slice(0, 3)
      .map((item) => ({
        id: `timeline-${item.id}`,
        title: item.title,
        meta: formatDateLabel(item.dueDate),
        note: item.note || '请尽快推进当前节点',
      })),
    ...materials
      .filter((item) => !item.completed)
      .slice(0, 2)
      .map((item) => ({
        id: `material-${item.id}`,
        title: item.title,
        meta: formatDateLabel(item.deadline),
        note: item.note || '当前材料仍未完成',
      })),
  ]

  return {
    summaryItems,
    lanes: buildApplicationLanes(applications),
    programPreview: programs.slice(0, 4),
    casePreview: cases.slice(0, 4),
    riskItems,
  }
}
