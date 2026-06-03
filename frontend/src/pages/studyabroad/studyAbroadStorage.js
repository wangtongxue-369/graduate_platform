const TIMELINE_KEY = 'gp_studyabroad_timeline'
const MATERIALS_KEY = 'gp_studyabroad_materials'
const APPLICATIONS_KEY = 'gp_studyabroad_applications'
const EXPERIENCES_KEY = 'gp_studyabroad_experiences'

function addMonthsDate(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

export const defaultApplicationItems = [
  {
    id: 'ucl-cs',
    country: 'UK',
    school: '伦敦大学学院',
    program: '计算机科学硕士',
    degree: '硕士',
    intake: '2027 秋季',
    applicationRound: '第一轮',
    deadline: addMonthsDate(4),
    status: 'preparing',
    priority: 'dream',
    note: '重点准备 PS、成绩单、推荐信和语言成绩。',
  },
  {
    id: 'manchester-ai',
    country: 'UK',
    school: '曼彻斯特大学',
    program: '高级计算机科学硕士',
    degree: '硕士',
    intake: '2027 秋季',
    applicationRound: '滚动录取',
    deadline: addMonthsDate(5),
    status: 'planning',
    priority: 'match',
    note: '提交前核对课程匹配度和奖学金截止日期。',
  },
  {
    id: 'monash-it',
    country: 'Australia',
    school: '莫纳什大学',
    program: '信息技术硕士',
    degree: '硕士',
    intake: '2027 春季',
    applicationRound: '主申请季',
    deadline: addMonthsDate(3),
    status: 'planning',
    priority: 'safe',
    note: '准备护照扫描件、成绩单、简历和资金证明。',
  },
]

export const defaultTimelineItems = [
  {
    id: 'language-test',
    applicationId: 'ucl-cs',
    applicationSchool: '伦敦大学学院',
    applicationProgram: '计算机科学硕士',
    title: '预约雅思考试',
    country: 'UK',
    school: '伦敦大学学院',
    phase: 'Language test',
    dueDate: addMonthsDate(1),
    status: 'doing',
    note: '确认考试日期，并安排词汇和听力训练计划。',
  },
  {
    id: 'school-shortlist',
    applicationId: 'manchester-ai',
    applicationSchool: '曼彻斯特大学',
    applicationProgram: '高级计算机科学硕士',
    title: '确定选校清单',
    country: 'UK',
    school: '曼彻斯特大学',
    phase: 'School selection',
    dueDate: addMonthsDate(2),
    status: 'todo',
    note: '按冲刺、匹配、保底三个梯度整理目标院校。',
  },
  {
    id: 'documents',
    applicationId: 'ucl-cs',
    applicationSchool: '伦敦大学学院',
    applicationProgram: '计算机科学硕士',
    title: '准备 PS、CV 和推荐信',
    country: 'UK',
    school: '伦敦大学学院',
    phase: 'Documents',
    dueDate: addMonthsDate(3),
    status: 'todo',
    note: '完成个人陈述初稿，并联系两位推荐老师。',
  },
  {
    id: 'application-submit',
    applicationId: 'ucl-cs',
    applicationSchool: '伦敦大学学院',
    applicationProgram: '计算机科学硕士',
    title: '提交网申',
    country: 'UK',
    school: '伦敦大学学院',
    phase: 'Submission',
    dueDate: addMonthsDate(4),
    status: 'todo',
    note: '上传成绩单、语言成绩、PS、CV 和推荐信。',
  },
]

export const defaultMaterialItems = [
  {
    id: 'passport',
    applicationId: null,
    applicationSchool: null,
    applicationProgram: null,
    title: '护照扫描件',
    country: 'General',
    stage: 'Identity',
    category: '基础材料',
    deadline: addMonthsDate(1),
    completed: true,
    note: '确保护照有效期覆盖申请和入学时间。',
  },
  {
    id: 'transcript',
    applicationId: 'ucl-cs',
    applicationSchool: '伦敦大学学院',
    applicationProgram: '计算机科学硕士',
    title: '中英文成绩单',
    country: 'General',
    stage: 'Academic',
    category: '成绩单',
    deadline: addMonthsDate(2),
    completed: false,
    note: '需要学院或教务处盖章。',
  },
  {
    id: 'ps',
    applicationId: 'ucl-cs',
    applicationSchool: '伦敦大学学院',
    applicationProgram: '计算机科学硕士',
    title: '个人陈述初稿',
    country: 'UK',
    stage: 'Documents',
    category: '文书',
    deadline: addMonthsDate(3),
    completed: false,
    note: '突出课程匹配、项目经历和职业规划。',
  },
  {
    id: 'visa-fund',
    applicationId: 'manchester-ai',
    applicationSchool: '曼彻斯特大学',
    applicationProgram: '高级计算机科学硕士',
    title: '签证资金证明',
    country: 'UK',
    stage: 'Visa',
    category: '签证',
    deadline: addMonthsDate(5),
    completed: false,
    note: '收到 CAS 并确认签证要求后更新。',
  },
]

export const defaultExperienceItems = [
  {
    id: 'uk-ps',
    title: '英国授课型硕士 PS 怎么写更聚焦',
    country: 'UK',
    topic: 'Writing',
    authorName: '学长 A',
    readTime: '6 分钟',
    summary: '从课程匹配出发，再连接项目经历和职业规划，避免把 PS 写成简历复述。',
    content: '我先列出目标项目的核心课程，再给每门课匹配一个自己的项目或实习经历。这样文章会更像“为什么我适合这个项目”，而不是简单罗列经历。',
    tags: ['PS', '课程匹配', '文书'],
  },
  {
    id: 'us-shortlist',
    title: '美国 CS 项目如何分冲刺、匹配和保底',
    country: 'US',
    topic: 'School Selection',
    authorName: 'CS 申请人 B',
    readTime: '8 分钟',
    summary: '结合 GPA、语言成绩、科研实习和录取偏好，减少盲目海投。',
    content: '我用表格记录录取难度、课程匹配、学费、地区和就业结果。最终保留了 2 个冲刺、4 个匹配和 2 个保底项目。',
    tags: ['选校', 'CS', '定位'],
  },
  {
    id: 'au-visa',
    title: '澳大利亚学生签证材料清单',
    country: 'Australia',
    topic: 'Visa',
    authorName: '南半球观察员',
    readTime: '5 分钟',
    summary: '提前准备护照、COE、资金证明和体检材料，避免签证节点被动。',
    content: '最有用的是在 offer 前先检查材料有效期。护照和资金证明都需要留出足够缓冲时间。',
    tags: ['签证', 'COE', '资金证明'],
  },
  {
    id: 'sg-language',
    title: '新加坡申请的语言成绩规划',
    country: 'Singapore',
    topic: 'Language Test',
    authorName: 'NUS 申请记录',
    readTime: '4 分钟',
    summary: '从申请截止日期倒推语言考试，并预留重考和送分时间。',
    content: '我把语言成绩当作时间线事项，而不是顺手做的小任务。第一次成绩出来前，我就提前预约了第二次考试位置。',
    tags: ['雅思', '托福', '时间线'],
  },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getTimelineItems() {
  return readJson(TIMELINE_KEY, defaultTimelineItems)
}

export function saveTimelineItems(items) {
  writeJson(TIMELINE_KEY, items)
}

export function getApplicationItems() {
  return readJson(APPLICATIONS_KEY, defaultApplicationItems)
}

export function saveApplicationItems(items) {
  writeJson(APPLICATIONS_KEY, items)
}

export function getMaterialItems() {
  return readJson(MATERIALS_KEY, defaultMaterialItems)
}

export function saveMaterialItems(items) {
  writeJson(MATERIALS_KEY, items)
}

export function getExperienceItems() {
  return readJson(EXPERIENCES_KEY, defaultExperienceItems)
}

export function saveExperienceItems(items) {
  writeJson(EXPERIENCES_KEY, items)
}

export function resetStudyAbroadStorage() {
  localStorage.removeItem(EXPERIENCES_KEY)
  localStorage.removeItem(APPLICATIONS_KEY)
  localStorage.removeItem(TIMELINE_KEY)
  localStorage.removeItem(MATERIALS_KEY)
}
