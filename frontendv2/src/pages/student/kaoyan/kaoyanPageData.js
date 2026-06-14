import { kaoyanWorkspace } from '@/lib/workspacePreview.js'
import {
  ensureArray,
  ensurePage,
  firstNonEmpty,
} from '@/lib/stationData.js'

export const materialStatusOptions = ['PENDING', 'APPROVED', 'REJECTED']

export function createKaoyanSchoolLedgerFilters() {
  return {
    schoolName: '',
    region: '',
    majorCategory: '',
    majorName: '',
    year: '',
    is985: '',
    is211: '',
    isDoubleFirstClass: '',
  }
}

export function createEmptyPlanForm() {
  return {
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalDurationHours: '',
  }
}

export function createEmptyCheckInForm() {
  return {
    id: '',
    checkInDate: '',
    durationHours: '',
    remark: '',
  }
}

export function createEmptyUploadForm() {
  return {
    title: '',
    description: '',
    school: '',
    major: '',
    subject: '',
    year: '',
    materialType: '',
  }
}

export function createKaoyanPreviewOverview() {
  return {
    metrics: [
      { label: '择校样本', value: String(kaoyanWorkspace.compareBoard.length) },
      { label: '计划节点', value: String(kaoyanWorkspace.plans.length) },
      { label: '资料分区', value: String(kaoyanWorkspace.shelves.length) },
    ],
    schools: createKaoyanSchoolPreviewRows().slice(0, 3),
    plans: createKaoyanPlanPreviewRows().slice(0, 4),
    materials: createKaoyanMaterialPreviewRows().slice(0, 3),
    seniors: createKaoyanSupportPreview().seniors.slice(0, 2),
    rooms: createKaoyanSupportPreview().rooms.slice(0, 2),
  }
}

export function createKaoyanSchoolPreviewRows() {
  return kaoyanWorkspace.compareBoard.map((item, index) => ({
    id: `preview-school-${index}`,
    schoolId: index + 1,
    schoolName: item.school,
    majorName: item.major,
    majorCategory: '考研方向',
    region: '华东',
    province: ['浙江', '上海', '江苏'][index] || '华东',
    schoolType: '综合类',
    totalScoreLine: String(item.line).replace(/[^\d]/g, ''),
    year: '2025',
    politicsLine: 58 + index,
    foreignLangLine: 60 + index,
    subject1Line: 102 + index * 3,
    subject2Line: 118 + index * 4,
    admissionRatio: Number.parseFloat(String(item.trend).replace(/[^\d.]/g, '')) || '',
    plannedEnrollment: 24 + index,
    actualApplicants: 120 + index * 18,
    note: item.note,
    source: '预览数据',
    isNationalLine: false,
    is985: index !== 2,
    is211: true,
    isDoubleFirstClass: true,
    favorite: index === 0,
  }))
}

export function createKaoyanFavoritePreviewRows() {
  return createKaoyanSchoolPreviewRows().filter((item) => item.favorite)
}

export function createKaoyanPlanPreviewRows() {
  return kaoyanWorkspace.plans.map((item, index) => ({
    id: index + 1,
    name: item.title,
    description: item.note,
    startDate: `2026-06-${String(index + 10).padStart(2, '0')}`,
    endDate: `2026-06-${String(index + 11).padStart(2, '0')}`,
    totalDurationHours: 6 + index * 2,
    completionRate: 25 + index * 12,
    status: item.state,
  }))
}

export function createKaoyanPlanDetailPreview(planId = '1') {
  const plan = createKaoyanPlanPreviewRows().find((item) => String(item.id) === String(planId))
    || createKaoyanPlanPreviewRows()[0]

  return {
    ...plan,
    checkIns: [
      {
        id: `${plan.id}-checkin-1`,
        checkInDate: plan.startDate,
        durationHours: 2,
        remark: '完成英语阅读两篇',
      },
      {
        id: `${plan.id}-checkin-2`,
        checkInDate: plan.endDate,
        durationHours: 3,
        remark: '专业课框架回顾',
      },
    ],
  }
}

export function createKaoyanMaterialPreviewRows() {
  return kaoyanWorkspace.shelves.map((item, index) => ({
    id: index + 101,
    title: item.label,
    subject: item.label,
    materialType: index === 0 ? '笔记' : index === 1 ? '真题' : '课件',
    school: '目标院校样本',
    major: '公共能力',
    year: '2025',
    attachments: Array.from({ length: item.count }, (_, attachmentIndex) => ({
      id: `${index + 1}-${attachmentIndex + 1}`,
      originalName: `${item.label}-${attachmentIndex + 1}.pdf`,
      fileSize: 1024 * 300,
    })),
    description: item.note,
    status: materialStatusOptions[index % materialStatusOptions.length],
    viewCount: item.count * 9,
    downloadCount: item.count * 3,
    uploaderName: '考研资料组',
  }))
}

export function createKaoyanMaterialDetailPreview(materialId = '101') {
  return createKaoyanMaterialPreviewRows().find((item) => String(item.id) === String(materialId))
    || createKaoyanMaterialPreviewRows()[0]
}

export function createKaoyanSupportPreview() {
  return {
    seniors: kaoyanWorkspace.support.mentors.map((item, index) => ({
      id: index + 1,
      nickname: item.name,
      graduateSchool: '经验方向样本',
      major: item.field,
      expertiseSubjects: item.note,
      bio: item.status,
      enrollmentYear: '2024',
    })),
    rooms: kaoyanWorkspace.support.rooms.map((item, index) => ({
      id: index + 1,
      name: item.room,
      schoolName: '经验方向样本',
      major: item.topic,
      memberCount: item.online,
      createdByName: item.rank,
      createdAt: '2026-06-12T09:00:00',
      closed: false,
    })),
    unreadCount: 0,
  }
}

export function buildSchoolRows(schoolsData, scoreLinesData) {
  const schoolPage = ensurePage(schoolsData)
  const scorePage = ensurePage(scoreLinesData)
  const schoolMap = new Map(schoolPage.content.map((item) => [item.id ?? item.name, item]))

  const rows = scorePage.content.map((item, index) => {
    const school = schoolMap.get(item.schoolId)
      || schoolPage.content.find((candidate) => candidate.name === item.schoolName)
      || {}

    return {
      id: item.id ?? `score-line-${index}`,
      schoolId: item.schoolId ?? school.id,
      schoolName: item.schoolName || school.name || '院校待补充',
      majorName: item.majorName || '专业待补充',
      majorCategory: item.majorCategory || '门类待补充',
      region: school.region || school.province || '地区待补充',
      schoolType: school.schoolType || '院校类型待补充',
      totalScoreLine: item.totalScoreLine || '',
      year: item.year || '',
      admissionRatio: item.admissionRatio || '',
      plannedEnrollment: item.plannedEnrollment || '',
      note: firstNonEmpty(item.note, school.note, school.province, school.region, '后端暂未补充说明'),
      is985: Boolean(school.is985),
      is211: Boolean(school.is211),
      favorite: Boolean(item.favorite),
    }
  })

  if (rows.length) {
    return {
      rows,
      schoolCount: schoolPage.totalElements,
      scoreCount: scorePage.totalElements,
    }
  }

  return {
    rows: schoolPage.content.map((item, index) => ({
      id: item.id ?? `school-${index}`,
      schoolId: item.id ?? index + 1,
      schoolName: item.name || '院校待补充',
      majorName: '等待分数线数据',
      majorCategory: '门类待补充',
      region: item.region || item.province || '地区待补充',
      schoolType: item.schoolType || '院校类型待补充',
      totalScoreLine: '',
      year: '',
      admissionRatio: '',
      plannedEnrollment: '',
      note: firstNonEmpty(item.province, item.region, '当前仅返回院校基础档案'),
      is985: Boolean(item.is985),
      is211: Boolean(item.is211),
      favorite: false,
    })),
    schoolCount: schoolPage.totalElements,
    scoreCount: scorePage.totalElements,
  }
}

function matchTriStateFlag(value, expected) {
  if (expected === '' || expected === undefined || expected === null) {
    return true
  }
  return Boolean(value) === (expected === 'true')
}

function matchSchoolSideFilters(school, filters = {}) {
  const schoolName = String(filters.schoolName || '').trim()
  const region = String(filters.region || '').trim()

  if (schoolName && !String(school.name || school.schoolName || '').includes(schoolName)) {
    return false
  }

  if (region) {
    const regionText = `${school.region || ''} ${school.province || ''}`.trim()
    if (!regionText.includes(region)) {
      return false
    }
  }

  if (!matchTriStateFlag(school.is985, filters.is985)) return false
  if (!matchTriStateFlag(school.is211, filters.is211)) return false
  if (!matchTriStateFlag(school.isDoubleFirstClass, filters.isDoubleFirstClass)) return false

  return true
}

function hasActiveSchoolSideFilters(filters = {}) {
  return [
    filters.schoolName,
    filters.region,
    filters.is985,
    filters.is211,
    filters.isDoubleFirstClass,
  ].some((item) => String(item || '').trim() !== '')
}

function toSchoolLedgerRow(item, schoolMap, index) {
  const school = schoolMap.get(item.schoolId)
    || Array.from(schoolMap.values()).find((candidate) => candidate.name === item.schoolName)
    || {}

  return {
    id: item.id ?? `score-line-${index}`,
    schoolId: item.schoolId ?? school.id ?? '',
    schoolName: item.schoolName || school.name || '院校待补充',
    majorName: item.majorName || '专业待补充',
    majorCategory: item.majorCategory || '门类待补充',
    year: item.year || '',
    region: school.region || item.schoolRegion || school.province || '',
    province: school.province || '',
    schoolType: school.schoolType || '',
    totalScoreLine: item.totalScoreLine || '',
    politicsLine: item.politicsLine || '',
    foreignLangLine: item.foreignLangLine || '',
    subject1Line: item.subject1Line || '',
    subject2Line: item.subject2Line || '',
    plannedEnrollment: item.plannedEnrollment || '',
    actualApplicants: item.actualApplicants || '',
    admissionRatio: item.admissionRatio || '',
    note: firstNonEmpty(item.note, school.note, ''),
    source: item.source || '',
    isNationalLine: Boolean(item.isNationalLine),
    is985: Boolean(item.is985 ?? school.is985),
    is211: Boolean(item.is211 ?? school.is211),
    isDoubleFirstClass: Boolean(item.isDoubleFirstClass ?? school.isDoubleFirstClass),
    favorite: Boolean(item.favorite),
  }
}

export function buildSchoolLedgerRows(schoolsData, scoreLinesData, schoolFilters = {}) {
  const schoolPage = ensurePage(schoolsData)
  const scorePage = ensurePage(scoreLinesData)
  const schools = schoolPage.content
  const schoolMap = new Map(schools.map((item) => [item.id ?? item.name, item]))
  const filteredSchools = schools.filter((item) => matchSchoolSideFilters(item, schoolFilters))
  const allowedSchoolIds = new Set(
    filteredSchools
      .map((item) => item.id)
      .filter((item) => item !== '' && item !== null && item !== undefined),
  )
  const allowedSchoolNames = new Set(
    filteredSchools
      .map((item) => item.name || item.schoolName)
      .filter(Boolean),
  )
  const enforceSchoolMatch = hasActiveSchoolSideFilters(schoolFilters)

  const rows = scorePage.content
    .filter((item) => {
      if (!enforceSchoolMatch) {
        return true
      }
      if (!allowedSchoolIds.size && !allowedSchoolNames.size) {
        return false
      }
      return allowedSchoolIds.has(item.schoolId) || allowedSchoolNames.has(item.schoolName)
    })
    .map((item, index) => toSchoolLedgerRow(item, schoolMap, index))

  return {
    rows,
    schoolCount: Number(schoolPage.totalElements ?? schools.length ?? 0),
    scoreCount: Number(scorePage.totalElements ?? rows.length ?? 0),
  }
}

export function paginateSchoolLedgerRows(rows, { page, pageSize }) {
  const safePageSize = Math.max(1, Number(pageSize || 10))
  const totalElements = Array.isArray(rows) ? rows.length : 0
  const totalPages = Math.max(1, Math.ceil(totalElements / safePageSize))
  const safePage = Math.min(Math.max(0, Number(page || 0)), totalPages - 1)
  const startIndex = safePage * safePageSize

  return {
    pageRows: rows.slice(startIndex, startIndex + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalElements,
    totalPages,
  }
}

export function normalizeFavoriteRows(data) {
  return ensureArray(data).map((item, index) => ({
    id: item.id ?? `favorite-${index}`,
    schoolId: item.schoolId ?? index + 1,
    schoolName: item.schoolName || '院校待补充',
    majorName: item.majorName || '专业待补充',
    majorCategory: item.majorCategory || '门类待补充',
    year: item.year || '',
    totalScoreLine: item.totalScoreLine || '',
    politicsLine: item.politicsLine || '',
    foreignLangLine: item.foreignLangLine || '',
    subject1Line: item.subject1Line || '',
    subject2Line: item.subject2Line || '',
    plannedEnrollment: item.plannedEnrollment || '',
    actualApplicants: item.actualApplicants || '',
    admissionRatio: item.admissionRatio || '',
    note: item.note || '收藏记录已同步',
    source: item.source || '',
    favorite: true,
  }))
}

export function normalizePlanRows(data) {
  return ensureArray(data).map((item, index) => ({
    id: item.id ?? `plan-${index}`,
    name: item.name || '未命名计划',
    description: item.description || '后端暂未补充计划说明',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    totalDurationHours: item.totalDurationHours || '',
    completionRate: Number(item.completionRate || 0),
    status: item.status || item.stage || '进行中',
  }))
}

export function normalizePlanDetail(data) {
  if (!data || typeof data !== 'object') {
    return createKaoyanPlanDetailPreview()
  }

  return {
    id: data.id ?? 'preview-plan-detail',
    name: data.name || '未命名计划',
    description: data.description || '后端暂未补充计划说明',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    totalDurationHours: data.totalDurationHours || '',
    completionRate: Number(data.completionRate || 0),
    status: data.status || '进行中',
  }
}

export function normalizeCheckInRows(data) {
  return ensureArray(data).map((item, index) => ({
    id: item.id ?? `checkin-${index}`,
    checkInDate: item.checkInDate || '',
    durationHours: Number(item.durationHours || 0),
    remark: item.remark || '',
  }))
}

export function normalizeMaterialRows(data) {
  return ensurePage(data).content.map((item, index) => ({
    id: item.id ?? `material-${index}`,
    title: item.title || '未命名资料',
    subject: item.subject || '科目待补充',
    materialType: item.materialType || '类型待补充',
    school: item.school || '院校待补充',
    major: item.major || '专业待补充',
    year: item.year || '年份待补充',
    attachments: ensureArray(item.attachments),
    description: item.description || '后端暂未补充资料说明',
    status: item.status || 'APPROVED',
    viewCount: Number(item.viewCount || 0),
    downloadCount: Number(item.downloadCount || 0),
    uploaderName: item.uploaderName || item.createdByName || '匿名上传者',
  }))
}

export function normalizeMaterialDetail(data) {
  if (!data || typeof data !== 'object') {
    return createKaoyanMaterialDetailPreview()
  }

  return {
    id: data.id ?? 'preview-material-detail',
    title: data.title || '未命名资料',
    description: data.description || '后端暂未补充资料说明',
    school: data.school || '院校待补充',
    major: data.major || '专业待补充',
    subject: data.subject || '科目待补充',
    materialType: data.materialType || '类型待补充',
    year: data.year || '年份待补充',
    status: data.status || 'APPROVED',
    viewCount: Number(data.viewCount || 0),
    downloadCount: Number(data.downloadCount || 0),
    uploaderName: data.uploaderName || data.createdByName || '匿名上传者',
    attachments: ensureArray(data.attachments).map((item, index) => ({
      id: item.id ?? `attachment-${index}`,
      originalName: item.originalName || item.fileName || `附件-${index + 1}`,
      fileSize: Number(item.fileSize || 0),
    })),
  }
}

export function countMaterialsByStatus(rows) {
  return materialStatusOptions.reduce((accumulator, status) => {
    accumulator[status] = rows.filter((item) => item.status === status).length
    return accumulator
  }, {})
}

export function createEmptyMentorProfileForm() {
  return {
    nickname: '',
    bio: '',
    graduateSchool: '',
    enrollmentYear: '',
    major: '',
    expertiseSubjects: '',
    examSubjects: '',
  }
}

export function createEmptyRoomForm() {
  return {
    name: '',
    schoolId: '',
    major: '',
  }
}

export function normalizeSupportRows(mentorsData, roomsData, unreadData) {
  const mentorPage = ensurePage(mentorsData)
  const roomPage = ensurePage(roomsData)

  return {
    mentors: mentorPage.content.map((item, index) => ({
      id: item.id ?? `mentor-${index}`,
      nickname: item.nickname || item.name || '未命名学长学姐',
      graduateSchool: item.graduateSchool || '院校待补充',
      major: item.major || '专业待补充',
      expertiseSubjects: item.expertiseSubjects || '擅长科目待补充',
      bio: item.bio || '后端暂未补充个人简介',
      enrollmentYear: item.enrollmentYear || '',
      examSubjects: item.examSubjects || '',
    })),
    rooms: roomPage.content.map((item, index) => ({
      id: item.id ?? `room-${index}`,
      name: item.name || '未命名自习室',
      schoolName: item.schoolName || '院校待补充',
      major: item.major || '专业待补充',
      memberCount: Number(item.memberCount || 0),
      createdByName: item.createdByName || '发起人待补充',
      createdAt: item.createdAt || '',
      closed: Boolean(item.closed),
      status: item.status || (item.closed ? 'CLOSED' : 'OPEN'),
    })),
    unreadCount: Number(unreadData?.count || 0),
  }
}

export function normalizeMentorProfile(data) {
  if (!data || typeof data !== 'object') {
    return createEmptyMentorProfileForm()
  }

  return {
    nickname: data.nickname || '',
    bio: data.bio || '',
    graduateSchool: data.graduateSchool || '',
    enrollmentYear: data.enrollmentYear || '',
    major: data.major || '',
    expertiseSubjects: data.expertiseSubjects || '',
    examSubjects: data.examSubjects || '',
  }
}

export function normalizeCounselingSessions(data) {
  return ensurePage(data).content.map((item, index) => ({
    id: item.id ?? `session-${index}`,
    subject: item.subject || '未命名咨询',
    mentorName: item.mentorName || '',
    studentName: item.studentName || '',
    unreadCount: Number(item.unreadCount || 0),
    createdAt: item.createdAt || '',
  }))
}

export function normalizeCounselingMessages(data) {
  return ensureArray(data).map((item, index) => ({
    id: item.id ?? `message-${index}`,
    senderId: item.senderId ?? '',
    senderName: item.senderName || '未命名用户',
    content: item.content || '',
    createdAt: item.createdAt || '',
  }))
}

export function normalizeRoomDetail(data, roomId = '') {
  if (!data || typeof data !== 'object') {
    const preview = createKaoyanSupportPreview().rooms[0]
    return {
      id: roomId || preview?.id || 'preview-room',
      name: preview?.name || '自习室预览',
      schoolName: preview?.schoolName || '院校待补充',
      major: preview?.major || '专业待补充',
      memberCount: Number(preview?.memberCount || 0),
      members: [],
      isOwner: false,
      closed: false,
      status: 'OPEN',
    }
  }

  return {
    id: data.id ?? roomId,
    name: data.name || '未命名自习室',
    schoolName: data.schoolName || '院校待补充',
    major: data.major || '专业待补充',
    memberCount: Number(data.memberCount || data.members?.length || 0),
    members: ensureArray(data.members).map((item, index) => ({
      id: item.id ?? item.userId ?? `member-${index}`,
      userId: item.userId ?? item.id ?? `member-${index}`,
      userName: item.userName || item.name || '未命名成员',
    })),
    isOwner: Boolean(data.isOwner),
    closed: Boolean(data.closed),
    status: data.status || (data.closed ? 'CLOSED' : 'OPEN'),
  }
}

export function normalizeRoomMessages(data) {
  const rows = Array.isArray(data?.content) ? data.content : ensureArray(data)
  return rows.map((item, index) => ({
    id: item.id ?? `room-message-${index}`,
    senderId: item.senderId ?? '',
    senderName: item.senderName || '未命名用户',
    content: item.content || '',
    createdAt: item.createdAt || '',
  }))
}

export function normalizeLeaderboardRows(data) {
  return ensureArray(data).map((item, index) => ({
    userId: item.userId ?? `leader-${index}`,
    userName: item.userName || '未命名成员',
    durationSeconds: Number(item.durationSeconds ?? item.totalDurationSeconds ?? 0),
    totalDurationSeconds: Number(item.totalDurationSeconds ?? item.durationSeconds ?? 0),
    sessionStartedAt: item.sessionStartedAt || '',
    leftAt: item.leftAt || '',
  }))
}
