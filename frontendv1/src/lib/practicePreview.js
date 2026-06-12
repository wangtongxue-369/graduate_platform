const previewBanks = [
  {
    id: 1,
    title: '考研英语阅读训练',
    target: 'kaoyan',
    subject: '英语',
    chapter: '阅读理解',
    questionCount: 42,
    difficulty: '中等',
    description: '用于演示题库目录、练习入口和结果去向。',
  },
  {
    id: 2,
    title: '行测判断推理',
    target: 'kaogong',
    subject: '行测',
    chapter: '判断推理',
    questionCount: 58,
    difficulty: '中等偏上',
    description: '用于演示考公方向题库的目录树和错题重练去向。',
  },
  {
    id: 3,
    title: '求职通识笔试',
    target: 'job',
    subject: '综合能力',
    chapter: '逻辑与数据',
    questionCount: 36,
    difficulty: '基础',
    description: '用于演示就业方向的公共练习目录。',
  },
]

const previewHistory = [
  { id: 2001, bankTitle: '考研英语阅读训练', mode: 'chapter', score: 82, submittedAt: '2026-06-10T20:00:00' },
  { id: 2002, bankTitle: '行测判断推理', mode: 'mock', score: 76, submittedAt: '2026-06-09T21:10:00' },
]

const previewWrongQuestions = [
  { questionId: 5001, title: '类比推理 01', subject: '行测', chapter: '判断推理', wrongCount: 3 },
  { questionId: 5002, title: '阅读细节题 02', subject: '英语', chapter: '阅读理解', wrongCount: 2 },
]

const previewStatistics = {
  granularity: 'day',
  accuracyRate: 0.78,
  streakDays: 6,
  totalSessions: 14,
  lastSessionAt: '2026-06-10T20:00:00',
}

export function createPracticePreview() {
  return {
    banks: previewBanks.map((item) => ({ ...item })),
    history: previewHistory.map((item) => ({ ...item })),
    wrongQuestions: previewWrongQuestions.map((item) => ({ ...item })),
    statistics: { ...previewStatistics },
  }
}

export function findPracticePreviewBank(id) {
  return createPracticePreview().banks.find((item) => String(item.id) === String(id)) || null
}
