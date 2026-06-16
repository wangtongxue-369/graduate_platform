import { ensureArray, ensurePage, formatCountText } from '@/lib/stationData.js'
import { kaogongWorkspace } from '@/lib/workspacePreview.js'

export const defaultJobCriteria = {
  education: '本科',
  degree: '学士',
  major: '计算机科学与技术',
  region: '浙江',
  household: '',
  politicalStatus: '',
  jobCategory: '',
  unitType: '',
}

export const interviewStatusOptions = [
  { value: '', label: '全部' },
  { value: 'OPEN', label: '开放中' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已结束' },
]

export const acceptedInterviewAttachmentTypes = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.mp3',
  '.wav',
  '.m4a',
  '.mp4',
  '.zip',
  '.rar',
].join(',')

export function getInterviewStatusLabel(value) {
  return interviewStatusOptions.find((item) => item.value === value)?.label || value || '待补充'
}

export function emptyPage(size = 8) {
  return {
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 1,
  }
}

function tomorrowEvening() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(20, 0, 0, 0)
  return date.toISOString().slice(0, 16)
}

export function createInterviewFilters() {
  return {
    title: '',
    jobDirection: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  }
}

export function createInterviewRoomForm() {
  return {
    title: '',
    jobDirection: '',
    scheduledAt: tomorrowEvening(),
    description: '',
    inviteNote: '',
  }
}

export function createEmptyFeedbackForm() {
  return {
    score: 85,
    expressionScore: 85,
    logicScore: 85,
    etiquetteScore: 85,
    strengths: '',
    problems: '',
    suggestions: '',
    attachmentNote: '',
  }
}

export function createKaogongJobPreviewRows() {
  return kaogongWorkspace.hotZones.map((item, index) => ({
    id: `preview-job-${index}`,
    jobName: item.title,
    recruitingUnit: `${item.region} 招录单位`,
    region: item.region,
    examType: '公务员考试',
    recruitCount: item.openings,
    educationRequirement: '本科',
    majorRequirement: '方向相关专业',
    matchScore: 80 + index * 4,
    matchReasons: [item.fit],
    registrationStart: '2026-02-03',
    registrationEnd: '2026-02-08',
    sourceUrl: '',
    favorite: false,
  }))
}

export function createKaogongScorePreviewRows() {
  return kaogongWorkspace.scoreLedger.map((item, index) => ({
    id: `preview-score-${index}`,
    jobName: item.title,
    recruitingUnit: '方向预览',
    region: '待补充',
    year: item.year,
    examType: '公务员考试',
    scoreLine: item.score,
    interviewRatio: item.delta,
    recruitCount: 0,
    interviewCount: 0,
    dataNote: '当前为前端预览样本。',
    source: '预览数据',
    favorite: false,
  }))
}

export function createKaogongCalendarPreviewRows() {
  return kaogongWorkspace.calendar.map((item, index) => ({
    key: `preview-calendar-${index}`,
    region: '浙江',
    examType: '浙江省公务员考试',
    year: '2026',
    events: [
      {
        id: `${index}-1`,
        nodeType: item.title,
        title: item.note,
        eventDate: `2026-06-${String(index + 10).padStart(2, '0')}`,
      },
    ],
  }))
}

export function createKaogongInterviewPreview() {
  return {
    rooms: kaogongWorkspace.interviews.rooms.map((item, index) => ({
      id: `preview-room-${index}`,
      title: item.name,
      jobDirection: item.note,
      scheduledAt: '2026-06-20T19:00:00',
      ownerName: '方向预览',
      ownerId: null,
      participantCount: item.people,
      status: item.status.includes('进行') ? 'IN_PROGRESS' : 'OPEN',
      description: item.note,
      inviteNote: item.note,
    })),
    feedback: kaogongWorkspace.interviews.feedback.map((item, index) => ({
      id: `preview-feedback-${index}`,
      reviewerName: item.from,
      score: 85 + index,
      suggestions: item.note,
      strengths: item.topic,
      createdAt: '2026-06-12T09:00:00',
    })),
  }
}

export function createKaogongOverviewPreview() {
  const jobs = createKaogongJobPreviewRows()
  const scoreLines = createKaogongScorePreviewRows()
  const calendar = createKaogongCalendarPreviewRows()
  const interviews = createKaogongInterviewPreview()
  return {
    metrics: [
      { label: '关注岗位', value: formatCountText(jobs.length, '项') },
      { label: '收藏分数线', value: formatCountText(scoreLines.length, '项') },
      { label: '考试订阅', value: formatCountText(calendar.length, '项') },
      { label: '我的房间', value: formatCountText(interviews.rooms.length, '间') },
    ],
    countdown: {
      examType: '浙江省公务员考试',
      nodeType: '公告核对',
      title: '先剔除条件不匹配岗位',
      eventDate: '2026-06-18',
      region: '浙江',
      daysLeft: 2,
    },
    favoriteJobs: jobs.slice(0, 3),
    favoriteScoreLines: scoreLines.slice(0, 3),
    room: {
      ...interviews.rooms[0],
      latestMessage: {
        senderName: '同伴A',
        content: '今晚 20:00 继续答题',
      },
    },
  }
}

export function createInterviewRoomPreview(roomId) {
  return {
    id: Number(roomId),
    title: '模拟面试房间',
    jobDirection: '岗位方向待补充',
    scheduledAt: '',
    description: '当前为预览房间，登录真实账号后可进入消息、附件和复盘协作。',
    inviteNote: '',
    status: 'OPEN',
    ownerId: null,
    ownerName: '预览用户',
    participantCount: 0,
  }
}

export function createInterviewRoomWorkspacePreview(roomId) {
  return {
    room: createInterviewRoomPreview(roomId),
    messages: [
      {
        id: `preview-message-${roomId}`,
        senderId: null,
        senderName: '系统提示',
        content: '登录后可以进入真实面试房间消息流。',
        createdAt: '2026-06-12T10:00:00',
      },
    ],
    attachments: [
      {
        id: `preview-attachment-${roomId}`,
        originalName: 'preview-outline.pdf',
        sizeBytes: 2048,
        note: '预览附件',
      },
    ],
    feedback: [
      {
        id: `preview-feedback-${roomId}`,
        reviewerName: '示例评审',
        score: 86,
        strengths: '观点较清晰',
        suggestions: '结尾再收紧一点',
        createdAt: '2026-06-12T20:00:00',
      },
    ],
  }
}

export function normalizeFavoriteJobs(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    jobName: item.jobName || item.title || '未命名岗位',
    region: item.region || '地区待补充',
    recruitingUnit: item.recruitingUnit || item.companyName || '招录单位待补充',
  }))
}

export function normalizeFavoriteScoreLines(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    jobName: item.jobName || '未命名岗位',
    region: item.region || '地区待补充',
    year: item.year || '',
    scoreLine: item.scoreLine || item.score || '',
  }))
}

export function normalizeJobRows(rowsData, favoritesData = []) {
  const favoriteIds = new Set(ensureArray(favoritesData).map((item) => item.id))
  return ensureArray(rowsData).map((item) => ({
    id: item.id,
    jobName: item.jobName || item.title || '未命名岗位',
    recruitingUnit: item.recruitingUnit || item.companyName || '招录单位待补充',
    region: item.region || '地区待补充',
    examType: item.examType || '考试类型待补充',
    recruitCount: Number(item.recruitCount || 0),
    educationRequirement: item.educationRequirement || '学历待补充',
    majorRequirement: item.majorRequirement || '专业待补充',
    matchScore: Number(item.matchScore || 0),
    matchReasons: ensureArray(item.matchReasons),
    registrationStart: item.registrationStart,
    registrationEnd: item.registrationEnd,
    sourceUrl: item.sourceUrl || '',
    favorite: favoriteIds.has(item.id),
  }))
}

export function normalizeScoreRows(pageData, favoritesData = []) {
  const favoriteIds = new Set(ensureArray(favoritesData).map((item) => item.id))
  return ensurePage(pageData).content.map((item) => ({
    id: item.id,
    jobName: item.jobName || '未命名岗位',
    recruitingUnit: item.recruitingUnit || '招录单位待补充',
    region: item.region || '地区待补充',
    year: item.year || '',
    examType: item.examType || '考试类型待补充',
    scoreLine: item.scoreLine || item.score || '',
    interviewRatio: item.interviewRatio || '待补充',
    recruitCount: Number(item.recruitCount || 0),
    interviewCount: Number(item.interviewCount || 0),
    dataNote: item.dataNote || '后端暂未补充说明',
    source: item.source || '来源待补充',
    favorite: favoriteIds.has(item.id),
  }))
}

export function buildExamGroupKey(item) {
  return `${item.region || ''}::${item.examType || ''}::${item.year || item.examYear || ''}`
}

export function normalizeCalendarBoard(groupsData, subscriptionsData, notificationsData) {
  return {
    groups: ensurePage(groupsData).content.map((item) => ({
      key: item.key || buildExamGroupKey(item),
      region: item.region || '地区待补充',
      examType: item.examType || '考试类型待补充',
      year: item.year || '',
      events: ensureArray(item.events),
    })),
    subscriptions: ensureArray(subscriptionsData),
    notifications: ensureArray(notificationsData),
  }
}

function isFutureOrToday(value) {
  if (!value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  return !Number.isNaN(target.getTime()) && target >= today
}

export function calculateDaysLeft(value) {
  if (!value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(value)
  target.setHours(0, 0, 0, 0)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target - today) / 86400000)
}

export function pickNextExamNode(groupsData, subscriptionsData = []) {
  const groups = Array.isArray(groupsData) ? groupsData : ensurePage(groupsData).content
  const activeSubscriptions = ensureArray(subscriptionsData).filter((item) => item.status === 'ACTIVE')
  const activeKeys = new Set(activeSubscriptions.map((item) => buildExamGroupKey(item)))
  const scopedGroups = activeKeys.size
    ? groups.filter((item) => activeKeys.has(buildExamGroupKey(item)))
    : groups

  const normalizedNodes = scopedGroups
    .flatMap((group) => ensureArray(group.events).map((event) => ({
      ...event,
      examType: group.examType,
      region: group.region,
      year: group.year,
      daysLeft: calculateDaysLeft(event.eventDate),
    })))
    .sort((left, right) => String(left.eventDate || '').localeCompare(String(right.eventDate || '')))

  return normalizedNodes.find((item) => isFutureOrToday(item.eventDate)) || normalizedNodes[0] || null
}

export function normalizeInterviewRoomsPage(roomsData) {
  return ensurePage(roomsData).content.map((item) => ({
    id: item.id,
    title: item.title || '未命名房间',
    jobDirection: item.jobDirection || '方向待补充',
    scheduledAt: item.scheduledAt || '',
    ownerId: item.ownerId ?? null,
    ownerName: item.ownerName || '发起人待补充',
    participantCount: Number(item.participantCount || 0),
    status: item.status || 'OPEN',
    description: item.description || item.inviteNote || '后端暂未补充房间说明',
    inviteNote: item.inviteNote || '',
  }))
}

export function normalizeInterviewFeedbackPage(feedbackData) {
  return ensurePage(feedbackData).content.map((item) => ({
    id: item.id,
    reviewerName: item.reviewerName || '匿名评审',
    score: item.score || '待补充',
    strengths: item.strengths || '亮点待补充',
    problems: item.problems || '',
    suggestions: item.suggestions || item.problems || '后端暂未补充反馈建议',
    attachmentNote: item.attachmentNote || '',
    createdAt: item.createdAt || '',
  }))
}

export function normalizeInterviewMessagesPage(messagesData) {
  return ensurePage(messagesData).content.map((item) => ({
    id: item.id,
    roomId: item.roomId,
    senderId: item.senderId ?? null,
    senderName: item.senderName || '匿名用户',
    content: item.content || '',
    createdAt: item.createdAt || '',
  }))
}

export function normalizeInterviewAttachmentsPage(attachmentsData) {
  return ensurePage(attachmentsData).content.map((item) => ({
    id: item.id,
    roomId: item.roomId,
    uploaderId: item.uploaderId ?? null,
    uploaderName: item.uploaderName || '匿名上传者',
    originalName: item.originalName || '未命名附件',
    contentType: item.contentType || '',
    sizeBytes: Number(item.sizeBytes || 0),
    note: item.note || '',
    createdAt: item.createdAt || '',
    downloadUrl: item.downloadUrl || '',
  }))
}

export async function loadInterviewRoomMeta(roomId, token, kaogongApi) {
  const [allRoomsData, myRoomsData] = await Promise.all([
    kaogongApi.interviewRooms().catch(() => []),
    token ? kaogongApi.myInterviewRooms(token).catch(() => []) : Promise.resolve([]),
  ])

  const merged = [...ensureArray(myRoomsData), ...ensureArray(allRoomsData)]
  const deduped = Array.from(new Map(merged.map((item) => [String(item.id), item])).values())
  const hit = deduped.find((item) => String(item.id) === String(roomId))
  return hit
    ? {
        id: hit.id,
        title: hit.title || '未命名房间',
        jobDirection: hit.jobDirection || '方向待补充',
        scheduledAt: hit.scheduledAt || '',
        description: hit.description || hit.inviteNote || '后端暂未补充房间说明',
        inviteNote: hit.inviteNote || '',
        status: hit.status || 'OPEN',
        ownerId: hit.ownerId ?? null,
        ownerName: hit.ownerName || '发起人待补充',
        participantCount: Number(hit.participantCount || 0),
      }
    : null
}
