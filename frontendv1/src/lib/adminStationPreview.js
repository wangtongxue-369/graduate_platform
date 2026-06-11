export const adminDeskQueues = [
  { key: 'pending-posts', label: '帖子待审', count: 19, to: '/admin/review', tone: 'alert' },
  { key: 'reports', label: '举报处理', count: 7, to: '/admin/reports', tone: 'risk' },
  { key: 'materials', label: '资料待审', count: 12, to: '/admin/materials', tone: 'queue' },
  { key: 'users', label: '异常用户', count: 14, to: '/admin/users', tone: 'watch' },
]

export const adminDomains = [
  { key: 'community', label: '社区治理', to: '/admin/community', summary: '帖子审核、举报、分类与用户状态' },
  { key: 'questionbank', label: '题库治理', to: '/admin/question-banks', summary: '题库、题目、导入与快照' },
  { key: 'kaoyan', label: '考研治理', to: '/admin/kaoyan', summary: '院校、分数线与资料审核' },
  { key: 'kaogong', label: '考公治理', to: '/admin/kaogong', summary: '岗位、分数线与日历事件' },
  { key: 'employment', label: '就业运营', to: '/admin/employment', summary: '招聘会、岗位、简历与通知触发' },
]

export const adminRecentActions = [
  '已下线 1 条举报成立帖子',
  '已跳过 2 条重复站内通知',
  '已完成 1 次题目批量导入复核',
]
