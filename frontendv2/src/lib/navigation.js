export const TARGET_LABEL_MAP = {
  kaoyan: '考研',
  kaogong: '考公',
  job: '就业',
  liuxue: '留学',
}

const directionNavMap = {
  kaoyan: [
    { label: '考研总览', to: '/station/kaoyan' },
    { label: '院校比较', to: '/station/kaoyan/schools' },
    { label: '学习计划', to: '/station/kaoyan/plans' },
    { label: '资料架', to: '/station/kaoyan/materials' },
    { label: '陪跑协同', to: '/station/kaoyan/support' },
  ],
  kaogong: [
    { label: '考公总览', to: '/station/kaogong' },
    { label: '岗位匹配', to: '/station/kaogong/jobs' },
    { label: '分数线账本', to: '/station/kaogong/score-lines' },
    { label: '考试日历', to: '/station/kaogong/calendar' },
    { label: '模拟面试', to: '/station/kaogong/interviews' },
  ],
  job: [
    { label: '就业总览', to: '/station/job' },
    { label: '简历中心', to: '/station/job/resume' },
    { label: '岗位推荐', to: '/station/job/recommendations' },
    { label: '投递跟踪', to: '/station/job/applications' },
    { label: '招聘会目录', to: '/station/job/fairs' },
  ],
  liuxue: [
    { label: '留学总览', to: '/station/studyabroad' },
    { label: '项目目录', to: '/station/studyabroad/programs' },
    { label: '案例档案', to: '/station/studyabroad/cases' },
    { label: '申请跟踪', to: '/station/studyabroad/applications' },
    { label: '时间线', to: '/station/studyabroad/timeline' },
    { label: '材料清单', to: '/station/studyabroad/materials' },
  ],
}

const adminNav = [
  { label: '社区治理', to: '/admin/community' },
  { label: '题库治理', to: '/admin/question-banks' },
  { label: '考研治理', to: '/admin/kaoyan' },
  { label: '考公治理', to: '/admin/kaogong' },
  { label: '就业运营', to: '/admin/employment' },
]

const settingsNav = [
  { label: '个人信息', to: '/settings/profile' },
  { label: '我的发帖', to: '/settings/posts' },
  { label: '我的评论', to: '/settings/comments' },
  { label: '练习记录', to: '/settings/practice' },
  { label: '安全中心', to: '/settings/security' },
]

export function getDirectionNav(target) {
  return directionNavMap[target] || directionNavMap.job
}

export function getAppNavigation(user) {
  if (user?.role === 'admin') {
    return [
      {
        title: '管理模块',
        items: adminNav,
      },
    ]
  }

  return [
    {
      title: '公共功能',
      items: [
        { label: '社区', to: '/community' },
        { label: '题库', to: '/practice' },
      ],
    },
    {
      title: `${TARGET_LABEL_MAP[user?.target] || '方向'}模块`,
      items: getDirectionNav(user?.target),
    },
  ]
}

export function getSettingsNavigation() {
  return [
    {
      title: '个人管理',
      items: settingsNav,
    },
  ]
}

export function getShellTitle(user, mode = 'app') {
  if (mode === 'settings') return '个人设置'
  if (user?.role === 'admin') return '管理员主站'
  return `${TARGET_LABEL_MAP[user?.target] || '方向'}主站`
}

export function getShellDescription(user, mode = 'app') {
  if (mode === 'settings') {
    return '围绕个人资料、社区痕迹、练习记录与账户安全逐层管理。'
  }
  if (user?.role === 'admin') {
    return '以治理队列为入口，再进入各管理模块处理真实后端业务。'
  }
  return '公共功能与方向功能在同一套左栏中汇流，进入具体页面再逐层深入。'
}
