import { describe, expect, it } from 'vitest'
import { getRoleLandingPath, getStudentStationPath } from './roleRouting.js'

describe('roleRouting helpers', () => {
  it('maps student targets to station routes', () => {
    expect(getStudentStationPath('job')).toBe('/station/job')
    expect(getStudentStationPath('kaoyan')).toBe('/station/kaoyan')
    expect(getStudentStationPath('kaogong')).toBe('/station/kaogong')
    expect(getStudentStationPath('liuxue')).toBe('/station/studyabroad')
  })

  it('maps admin and guest users to the correct landing routes', () => {
    expect(getRoleLandingPath(null)).toBe('/')
    expect(getRoleLandingPath({ role: 'admin', target: 'job' })).toBe('/admin')
    expect(getRoleLandingPath({ role: 'user', target: 'job' })).toBe('/station/job')
  })
})
