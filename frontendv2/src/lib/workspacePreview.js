export const jobWorkspace = {
  summary: {
    badge: 'JOB',
    kicker: 'career station',
    title: '就业主站',
    description: '把简历、推荐、投递、招聘会和提醒收进一套求职工作台，而不是散成几个平行入口。',
    metrics: [
      { label: '简历完成', value: '86%' },
      { label: '推荐岗位', value: '12' },
      { label: '待跟进', value: '3' },
    ],
  },
  nav: [
    { label: '总览', to: '/station/job', summary: '看今天的求职推进和待办' },
    { label: '简历中心', to: '/station/job/resume', summary: '对应 /api/job/resume 与附件上传' },
    { label: '岗位推荐', to: '/station/job/recommendations', summary: '对应 /api/job/recommendations' },
    { label: '投递跟踪', to: '/station/job/applications', summary: '对应 /api/job/applications' },
    { label: '招聘会目录', to: '/station/job/fairs', summary: '对应 /api/job/fairs 与详情' },
  ],
  focusBoard: [
    { label: '本周目标', value: '3 次跟进' },
    { label: '最热行业', value: '互联网产品' },
    { label: '下一节点', value: '周五 14:00 面试' },
  ],
  resume: {
    blocks: [
      { title: '基础信息', state: '完整', note: '姓名、邮箱、求职城市已保存' },
      { title: '项目经历', state: '待润色', note: '还缺一条量化结果描述' },
      { title: '技能标签', state: '完整', note: 'React / TypeScript / Node.js' },
      { title: '附件简历', state: '已上传', note: 'resume-v4.pdf，可继续替换' },
    ],
    checklist: [
      '项目经历先写结果，再写动作。',
      '岗位关键词与技能标签保持同一套词表。',
      '文件版简历和在线简历要同步更新。',
    ],
  },
  recommendations: [
    { company: '星河数据', role: '前端工程师', city: '杭州', score: '92', reason: '技能标签高度匹配，接受校招生' },
    { company: '九曜科技', role: '产品研发培训生', city: '上海', score: '88', reason: '项目经历覆盖数据看板与用户增长' },
    { company: '知野教育', role: 'Web 开发', city: '南京', score: '84', reason: '和教育行业经历贴近，面试节奏平稳' },
  ],
  applications: [
    { company: '星河数据', role: '前端工程师', status: '面试中', nextStep: '周五 14:00 二面', note: '补充项目指标页' },
    { company: '九曜科技', role: '培训生', status: '待沟通', nextStep: '周四前发送作品集', note: '作品集首页需压缩篇幅' },
    { company: '知野教育', role: 'Web 开发', status: '已投递', nextStep: '等待筛选结果', note: '暂无补充动作' },
  ],
  fairs: [
    { name: '华东数字岗位专场', city: '杭州', date: '06-18', industry: '互联网', note: '可现场改简历，适合先投再聊' },
    { name: '教育科技双选会', city: '南京', date: '06-22', industry: '教育', note: '带作品页展示屏更有优势' },
    { name: '运营与产品联合招聘会', city: '上海', date: '06-28', industry: '综合', note: '适合横向比较岗位描述' },
  ],
  notifications: [
    '新的 React 岗位与技能标签更接近。',
    '1 条投递记录将在本周四进入下一步。',
    '招聘会门票已同步到你的日程提醒。',
  ],
}

export const kaoyanWorkspace = {
  summary: {
    badge: 'KY',
    kicker: 'study planning',
    title: '考研主站',
    description: '把院校比较、分数线、计划、资料、1v1咨询和同频自习室放进同一条复习推进链路。',
    metrics: [
      { label: '计划天数', value: '42' },
      { label: '关注分数线', value: '3' },
      { label: '资料归档', value: '18' },
    ],
  },
  nav: [
    { label: '总览', to: '/station/kaoyan', summary: '看今天的复习节奏与重点' },
    { label: '院校比较', to: '/station/kaoyan/schools', summary: '对应 schools 与 score-lines' },
    { label: '学习计划', to: '/station/kaoyan/plans', summary: '对应 plans 与 checkins' },
    { label: '资料架', to: '/station/kaoyan/materials', summary: '对应 materials 审核前后的展示' },
    { label: '1v1咨询', to: '/station/kaoyan/support/mentors', summary: '对应 mentors 与 messages' },
    { label: '同频自习室', to: '/station/kaoyan/support/rooms', summary: '对应 study-rooms 与房间详情' },
  ],
  compareBoard: [
    { school: '华东师范大学', major: '教育学原理', line: '372', trend: '+8', note: '复试窗口关闭较早' },
    { school: '暨南大学', major: '新闻传播', line: '381', trend: '+3', note: '专业课资料已补齐目录' },
    { school: '南京师范大学', major: '学科英语', line: '365', trend: '-2', note: '复试名单发布时间偏早' },
  ],
  plans: [
    { slot: '06:40', title: '英语阅读两篇', state: '已排入今日', note: '30 分钟限时 + 10 分钟回看' },
    { slot: '10:10', title: '政治主观题拆句', state: '待推进', note: '用错题本补逻辑' },
    { slot: '15:00', title: '专业课框架回顾', state: '待推进', note: '先口述再默写' },
    { slot: '20:30', title: '错题回炉与打卡', state: '夜间收口', note: '只处理最高频错误' },
  ],
  shelves: [
    { label: '政治冲刺架', count: 6, note: '近三年真题和批注分开摆放' },
    { label: '英语阅读架', count: 7, note: '按题源拆成精读与限时两列' },
    { label: '专业课资料架', count: 5, note: '每份资料都标注来源和适用阶段' },
  ],
  support: {
    mentors: [
      { name: '林学姐', field: '教育学', status: '可约咨询', note: '擅长复试结构化问答' },
      { name: '周学长', field: '新闻传播', status: '消息未读 2', note: '正在回复院校选择问题' },
    ],
    rooms: [
      { room: '晨间背诵室', online: 23, topic: '英语单词 + 政治背诵', rank: '你本周第 6 名' },
      { room: '晚间专业课房', online: 17, topic: '333 教育综合', rank: '你本周第 3 名' },
    ],
  },
}

export const kaogongWorkspace = {
  summary: {
    badge: 'KG',
    kicker: 'exam pipeline',
    title: '考公主站',
    description: '岗位匹配、分数线、日历提醒和模拟面试要连成流程，不能各自成块。',
    metrics: [
      { label: '匹配岗位', value: '12' },
      { label: '关注分数线', value: '6' },
      { label: '考试节点', value: '4' },
    ],
  },
  nav: [
    { label: '总览', to: '/station/kaogong', summary: '先看本周考试推进' },
    { label: '岗位匹配', to: '/station/kaogong/jobs', summary: '对应 jobs 与 match-history' },
    { label: '分数线账本', to: '/station/kaogong/score-lines', summary: '对应 score-lines 与收藏' },
    { label: '考试日历', to: '/station/kaogong/calendar', summary: '对应 calendar 与订阅' },
    { label: '模拟面试', to: '/station/kaogong/interviews', summary: '对应 interviews / messages / feedback' },
  ],
  hotZones: [
    { region: '杭州', title: '市直综合岗', openings: 18, fit: '专业限制宽松，进面比更稳' },
    { region: '苏州', title: '区县选调岗', openings: 9, fit: '竞争高，但与你训练节奏贴近' },
    { region: '宁波', title: '基层治理岗', openings: 12, fit: '申论题型与最近练习更接近' },
  ],
  scoreLedger: [
    { year: '2025', title: '杭州综合岗', score: '128.5', delta: '+2.0' },
    { year: '2024', title: '宁波治理岗', score: '126.0', delta: '-1.5' },
    { year: '2023', title: '苏州选调岗', score: '131.2', delta: '+4.8' },
  ],
  calendar: [
    { date: '06-18', title: '公告核对', note: '先剔除条件不匹配岗位' },
    { date: '06-22', title: '报名截止', note: '报名材料当天上午锁定' },
    { date: '07-03', title: '模考回看', note: '只复盘错误率最高的两类' },
    { date: '07-15', title: '面试房间', note: '题本与自我介绍一起过' },
  ],
  interviews: {
    rooms: [
      { name: '结构化一组', people: 6, status: '进行中', note: '今晚 20:00 轮到你答题' },
      { name: '无领导训练组', people: 9, status: '已报名', note: '周六下午统一反馈' },
    ],
    feedback: [
      { from: '教练 A', topic: '自我介绍', note: '铺垫太长，结尾没有回扣岗位' },
      { from: '同伴 B', topic: '应变题', note: '观点清晰，但案例略旧' },
    ],
  },
}

export const studyAbroadWorkspace = {
  summary: {
    badge: 'SA',
    kicker: 'overseas roadmap',
    title: '留学主站',
    description: '项目目录、录取案例、申请进度、时间线和材料清单都围着申请推进来组织。',
    metrics: [
      { label: '在申项目', value: '5' },
      { label: '时间节点', value: '9' },
      { label: '材料条目', value: '14' },
    ],
  },
  nav: [
    { label: '总览', to: '/station/studyabroad', summary: '先看申请路线图' },
    { label: '项目目录', to: '/station/studyabroad/programs', summary: '对应 schools/page' },
    { label: '案例档案', to: '/station/studyabroad/cases', summary: '对应 admission-cases/page' },
    { label: '申请跟踪', to: '/station/studyabroad/applications', summary: '对应 applications' },
    { label: '时间线', to: '/station/studyabroad/timeline', summary: '对应 timeline' },
    { label: '材料清单', to: '/station/studyabroad/materials', summary: '对应 materials 与附件' },
  ],
  programs: [
    { school: 'Leeds', track: 'Marketing', round: 'Round 2', note: '文书进入最后润色' },
    { school: 'Monash', track: 'Data Analysis', round: 'Round 1', note: '雅思补件已标红提醒' },
    { school: 'Warwick', track: 'Education', round: 'Round 2', note: '案例与项目经历更匹配' },
  ],
  cases: [
    { accent: '案例 01', title: '跨专业录取样本', summary: '重点看旧经历如何过渡到新方向' },
    { accent: '案例 02', title: '双非高分样本', summary: '适合对照补件顺序与推荐信节奏' },
    { accent: '案例 03', title: '延迟补件回收', summary: '看时间线如何避免材料冲突' },
  ],
  applications: [
    { school: 'Leeds', status: '已提交', owner: '你', nextStep: '等待学院回信' },
    { school: 'Monash', status: '补件中', owner: '你', nextStep: '补交语言成绩' },
    { school: 'Warwick', status: '文书定稿', owner: '你', nextStep: '周四前完成网申' },
  ],
  timeline: [
    { stage: '定校', window: '本周', note: '名单先收口到三所主申' },
    { stage: '文书', window: '下周', note: '个人陈述和简历版本统一' },
    { stage: '网申', window: '7 月上旬', note: '按项目批次分开发送' },
    { stage: '补件', window: '7 月末', note: '语言和实习证明单独跟踪' },
  ],
  materials: [
    { title: '成绩单', state: '已上传', note: '英文版和盖章扫描件都已存档' },
    { title: '个人陈述', state: '待终稿', note: '只差最后一版措辞' },
    { title: '推荐信', state: '待确认', note: '导师本周内提交' },
    { title: '语言成绩', state: '补件中', note: '等待最新一次雅思出分' },
  ],
}

export const adminWorkspace = {
  summary: {
    badge: 'ADM',
    kicker: 'governance desk',
    title: '管理员总台',
    description: '管理员首页先分诊，再进入各治理域，不把不存在的后端能力硬做成花哨假模块。',
    metrics: [
      { label: '待审帖子', value: '19' },
      { label: '举报队列', value: '7' },
      { label: '异常用户', value: '14' },
    ],
  },
  nav: [
    { label: '总览', to: '/admin', summary: '先看值班队列与处理流向' },
    { label: '社区治理', to: '/admin/community', summary: '帖子审核、举报、分类与用户状态' },
    { label: '题库治理', to: '/admin/question-banks', summary: '题库、题目、导入与快照' },
    { label: '考研治理', to: '/admin/kaoyan', summary: '院校、分数线与资料审核' },
    { label: '考公治理', to: '/admin/kaogong', summary: '岗位、分数线、日历与面试房间' },
    { label: '就业运营', to: '/admin/employment', summary: '招聘会、岗位、通知与简历服务' },
  ],
  queues: [
    { label: '帖子待审', count: 19, summary: '优先处理高举报量内容' },
    { label: '举报处理', count: 7, summary: '按严重程度和重复率排队' },
    { label: '资料待审', count: 12, summary: '优先校验资料来源与版权说明' },
    { label: '异常用户', count: 14, summary: '先看连续投诉与批量操作痕迹' },
  ],
  recentActions: [
    '已下线 1 条举报成立帖子。',
    '已撤回 2 条重复站内通知。',
    '已完成 1 次题目录入复核。',
  ],
  domains: {
    community: {
      heading: '社区治理',
      queues: [
        { name: '待审帖子', count: 19, note: '按举报量与敏感词先后排序' },
        { name: '待核评论', count: 11, note: '优先处理跨帖争议回复' },
        { name: '分类调整', count: 5, note: '错分内容直接移动，不复制' },
      ],
    },
    questionBanks: {
      heading: '题库治理',
      queues: [
        { name: '导入批次', count: 3, note: '先看重复题与选项错位' },
        { name: '快照版本', count: 6, note: '仅保留可回滚关键节点' },
        { name: '错题申诉', count: 9, note: '优先处理高频争议题' },
      ],
    },
    kaoyan: {
      heading: '考研治理',
      queues: [
        { name: '资料审核', count: 12, note: '来源、年份、适用阶段三项先过' },
        { name: '分数线更新', count: 4, note: '对比去年字段结构再入库' },
        { name: '导师入驻', count: 3, note: '先审资历，再开放咨询' },
      ],
    },
    kaogong: {
      heading: '考公治理',
      queues: [
        { name: '岗位更新', count: 8, note: '重点查地区和编制类型字段' },
        { name: '日历订阅异常', count: 2, note: '查看重复推送来源' },
        { name: '面试房间反馈', count: 5, note: '优先处理违规语言记录' },
      ],
    },
    employment: {
      heading: '就业运营',
      queues: [
        { name: '招聘会创建', count: 4, note: '先补齐城市与行业标签' },
        { name: '岗位清洗', count: 10, note: '重点查失效岗位与重复发布' },
        { name: '通知触发', count: 6, note: '只推送真正相关的用户群' },
      ],
    },
  },
}
