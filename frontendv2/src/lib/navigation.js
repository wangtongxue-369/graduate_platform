export const TARGET_LABEL_MAP = {
  kaoyan: '考研',
  kaogong: '考公',
  job: '就业',
  liuxue: '留学',
}

const studentRouteTargetMap = [
  ['/station/kaoyan', 'kaoyan'],
  ['/station/kaogong', 'kaogong'],
  ['/station/job', 'job'],
  ['/station/studyabroad', 'liuxue'],
]

const directionNavMap = {
  kaoyan: [
    { label: '考研总览', to: '/station/kaoyan' },
    { label: '择校账本', to: '/station/kaoyan/schools' },
    { label: '计划轨道', to: '/station/kaoyan/plans' },
    { label: '资料中枢', to: '/station/kaoyan/materials' },
    { label: '1v1 咨询', to: '/station/kaoyan/support/mentors' },
    { label: '同频自习室', to: '/station/kaoyan/support/rooms' },
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
    { label: '简历中枢', to: '/station/job/resume' },
    { label: '岗位推荐', to: '/station/job/recommendations' },
    { label: '投递跟踪', to: '/station/job/applications' },
    { label: '招聘会目录', to: '/station/job/fairs' },
  ],
  liuxue: [
    { label: '留学总览', to: '/station/studyabroad' },
    { label: '院校项目库', to: '/station/studyabroad/programs' },
    { label: '录取案例库', to: '/station/studyabroad/cases' },
    { label: '申请项目管理', to: '/station/studyabroad/applications' },
    { label: '申请时间线', to: '/station/studyabroad/timeline' },
    { label: '材料清单', to: '/station/studyabroad/materials' },
    { label: '留学经验库', to: '/station/studyabroad/experiences' },
  ],
}

const adminNav = [
  { label: '社区治理', to: '/admin/community' },
  { label: '题库治理', to: '/admin/question-banks' },
  { label: '考研治理', to: '/admin/kaoyan' },
  { label: '考公治理', to: '/admin/kaogong' },
  { label: '就业运营', to: '/admin/employment' },
  { label: '留学管理', to: '/admin/studyabroad' },
]

const settingsNav = [
  { label: '个人信息', to: '/settings/profile' },
  { label: '我的发帖', to: '/settings/posts' },
  { label: '我的评论', to: '/settings/comments' },
  { label: '练习摘要', to: '/settings/practice' },
  { label: '安全中心', to: '/settings/security' },
]

export function getDirectionNav(target) {
  return directionNavMap[target] || directionNavMap.job
}

export function resolveStudentTarget(user, pathname = '') {
  if (user?.role === 'admin') return null

  const matchedTarget = studentRouteTargetMap.find(([prefix]) => pathname.startsWith(prefix))?.[1]
  return matchedTarget || user?.target || 'job'
}

export function getAppNavigation(user, pathname = '') {
  if (user?.role === 'admin') {
    return [
      {
        title: '管理模块',
        items: adminNav,
      },
    ]
  }

  if (!user) {
    return [
      {
        title: '公共功能',
        items: [
          { label: '社区', to: '/community' },
          { label: '题库', to: '/practice' },
        ],
      },
    ]
  }

  const currentTarget = resolveStudentTarget(user, pathname)

  return [
    {
      title: '公共功能',
      items: [
        { label: '社区', to: '/community' },
        { label: '题库', to: '/practice' },
      ],
    },
    {
      title: `${TARGET_LABEL_MAP[currentTarget] || '方向'}模块`,
      items: getDirectionNav(currentTarget),
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

export function getShellTitle(user, mode = 'app', pathname = '') {
  if (mode === 'settings') return '个人设置'
  if (user?.role === 'admin') return '管理员主站'
  const currentTarget = resolveStudentTarget(user, pathname)
  return `${TARGET_LABEL_MAP[currentTarget] || '方向'}主站`
}

export function getShellDescription(user, mode = 'app') {
  if (mode === 'settings') {
    return '围绕个人资料、社区痕迹、练习摘要与账户安全逐层管理。'
  }
  if (user?.role === 'admin') {
    return '以治理队列为入口，再进入各管理模块处理真实后端业务。'
  }
  return '左侧选择功能页面，右侧完成查询、记录和管理。'
}
