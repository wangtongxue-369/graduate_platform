export const stationPreview = {
  job: {
    resumeCompletion: '86%',
    recommendationCount: 12,
    followUpCount: 3,
    notifications: [
      '新的 React 岗位与你的技能标签更接近。',
      '有 1 条投递记录的下一步时间落在本周四。',
    ],
  },
  kaoyan: {
    scoreLines: 3,
    studyPlanDays: 42,
    materials: 18,
    consultations: 2,
    compareBoard: [
      { school: '华东师范大学', major: '教育学原理', line: '去年线 372', trend: '+8', note: '调剂窗口周五晚关闭' },
      { school: '暨南大学', major: '新闻传播', line: '去年线 381', trend: '+3', note: '专业课资料已补齐目录' },
      { school: '南京师范大学', major: '学科英语', line: '去年线 365', trend: '-2', note: '复试名单发布时间较早' },
    ],
    planRail: [
      { slot: '06:40', title: '英语阅读二篇', state: '已排定' },
      { slot: '10:10', title: '政治主观题拆卷', state: '待推进' },
      { slot: '15:00', title: '专业课框架回写', state: '待推进' },
      { slot: '20:30', title: '错题回炉与打卡', state: '晚间收口' },
    ],
    materialShelves: [
      { label: '政治冲刺柜', count: 6, note: '近三年真题与批注已归档。' },
      { label: '英语阅读柜', count: 7, note: '按题源拆成精读与限时两列。' },
      { label: '专业课资料柜', count: 5, note: '资料更新时先写来源说明。' },
    ],
  },
  kaogong: {
    matches: 12,
    savedScores: 6,
    examNodes: 4,
    interviewRooms: 2,
    hotZones: [
      { region: '杭州', title: '市直综合岗', openings: 18, fit: '专业限制宽，进面比稳定。' },
      { region: '苏州', title: '区县选调岗', openings: 9, fit: '笔试竞争高，面试节奏快。' },
      { region: '宁波', title: '基层治理岗', openings: 12, fit: '申论题型与你的练习更接近。' },
      { region: '深圳', title: '执法辅助岗', openings: 6, fit: '流程长，先留作第二梯队。' },
    ],
    scoreLedger: [
      { year: '2025', title: '杭州综合岗', score: '128.5', delta: '+2.0' },
      { year: '2024', title: '宁波治理岗', score: '126.0', delta: '-1.5' },
      { year: '2023', title: '苏州选调岗', score: '131.2', delta: '+4.8' },
    ],
    calendarWall: [
      { date: '06/18', title: '公告核对', note: '先删掉条件不匹配岗位。' },
      { date: '06/22', title: '报名截止', note: '报名材料当天午前锁定。' },
      { date: '07/03', title: '模考回看', note: '只复盘错题率最高两类。' },
      { date: '07/15', title: '面试房间', note: '题本与自我介绍一起过。' },
    ],
  },
  studyabroad: {
    applications: 5,
    timelineItems: 9,
    materials: 14,
    cases: 8,
    programShelf: [
      { school: 'Leeds', track: 'Marketing', round: 'Round 2', note: '文书进入最后润色。' },
      { school: 'Monash', track: 'Data Analysis', round: 'Round 1', note: '雅思补件已标红。' },
      { school: 'Warwick', track: 'Education', round: 'Round 2', note: '案例和项目经历更匹配。' },
    ],
    caseDossiers: [
      { title: '跨专业录取', accent: '案例 01', summary: '看转专业文书怎样解释旧经历与新方向。' },
      { title: '双非高分样本', accent: '案例 02', summary: '对照补件顺序与推荐信节奏。' },
      { title: '延期补件回收', accent: '案例 03', summary: '重点看时间线如何避免材料冲突。' },
    ],
    timelineTrack: [
      { stage: '定校', window: '本周', note: '目录先收口到三所主申。' },
      { stage: '文书', window: '下周', note: '个人陈述和简历版本统一。' },
      { stage: '网申', window: '7 月', note: '按项目批次分开发送。' },
      { stage: '补件', window: '7 月末', note: '雅思与实习证明单独跟踪。' },
    ],
  },
}
