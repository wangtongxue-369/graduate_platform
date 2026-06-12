export const TARGET_ROUTE_MAP = {
  kaoyan: '/station/kaoyan',
  kaogong: '/station/kaogong',
  job: '/station/job',
  liuxue: '/station/studyabroad',
}

export function getStudentStationPath(target) {
  return TARGET_ROUTE_MAP[target] || '/station/job'
}

export function getRoleLandingPath(user) {
  if (!user) return '/'
  if (user.role === 'admin') return '/admin'
  return getStudentStationPath(user.target)
}
