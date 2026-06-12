export function createSettingsProfile(user = {}) {
  return {
    id: user.id || 'preview-user',
    username: user.username || 'preview_user',
    name: user.name || '平台成员',
    email: user.email || 'member@example.com',
    phone: user.phone || '13800000000',
    studentId: user.studentId || '20240001',
    target: user.target || 'kaoyan',
    school: user.school || '示例大学',
    major: user.major || '计算机科学与技术',
    grade: user.grade || '2024',
    intentRegion: user.intentRegion || '杭州',
    role: user.role || 'user',
    status: user.status || 'normal',
    security: {
      lastLoginAt: user.lastLoginAt || '2026-06-11T20:30:00',
      lastDevice: 'Chrome / Windows',
      lastLocation: '浙江 杭州',
      lastIp: '127.0.0.1',
    },
  }
}

export function createSettingsDashboard() {
  return {
    postCount: 6,
    commentCount: 18,
    attemptCount: 42,
    checkinCount: 9,
  }
}

export function createSettingsPosts() {
  return [
    { id: 101, title: '复试资料整理方法', status: 'published', category: '考研', createdAt: '2026-06-10T19:40:00' },
    { id: 102, title: '岗位筛选时我会先看什么', status: 'pending', category: '就业', createdAt: '2026-06-09T13:20:00' },
    { id: 103, title: '留学时间线拆分模板', status: 'published', category: '留学', createdAt: '2026-06-08T10:15:00' },
  ]
}

export function createSettingsComments() {
  return [
    { id: 201, content: '这份资料的适用阶段建议再写得更细一点。', postTitle: '考研资料架整理', createdAt: '2026-06-10T21:15:00' },
    { id: 202, content: '这个岗位更适合有项目落地经验的同学。', postTitle: '互联网校招岗位讨论', createdAt: '2026-06-09T17:06:00' },
    { id: 203, content: '案例里最关键的是补件节奏，不是学校名气。', postTitle: '留学案例复盘', createdAt: '2026-06-07T08:50:00' },
  ]
}

export function createSettingsAttempts() {
  return [
    { id: 301, questionStem: '已知递推关系，求通项公式。', correct: true, createdAt: '2026-06-11T09:10:00' },
    { id: 302, questionStem: '阅读理解第 3 题，判断作者态度。', correct: false, createdAt: '2026-06-10T22:16:00' },
    { id: 303, questionStem: '行政职业能力测试数量关系训练。', correct: true, createdAt: '2026-06-09T07:35:00' },
  ]
}
