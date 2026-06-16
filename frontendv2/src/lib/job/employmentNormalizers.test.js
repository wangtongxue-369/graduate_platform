import { describe, expect, it } from 'vitest'
import {
  buildApplicationGroups,
  normalizeAdminListPage,
  normalizeApplications,
  normalizeFairPage,
  normalizeNotifications,
  normalizePostingDetail,
  normalizeResume,
} from './employmentNormalizers.js'

describe('employment normalizers', () => {
  it('normalizes resume payloads with safe file defaults', () => {
    expect(normalizeResume({ targetRole: '后端工程师' })).toMatchObject({
      targetRole: '后端工程师',
      resumeFile: {
        hasFile: false,
        fileName: '',
      },
    })
  })

  it('normalizes notification payloads from array and object forms', () => {
    expect(normalizeNotifications([{ id: 1, readFlag: false }]).unreadCount).toBe(1)
    expect(normalizeNotifications({ items: [{ id: 2, readFlag: true }], unreadCount: 0 }).items).toHaveLength(1)
  })

  it('normalizes fair pages from backend pagination payloads', () => {
    expect(
      normalizeFairPage({
        items: [{ id: 5, title: '春招双选会', city: '上海' }],
        totalItems: 1,
        totalPages: 1,
        page: 1,
      }).items[0],
    ).toMatchObject({
      id: 5,
      title: '春招双选会',
      city: '上海',
    })
  })

  it('normalizes posting details with stable display defaults', () => {
    expect(normalizePostingDetail({ id: 6, title: '平台后端', companyName: '星河科技' })).toMatchObject({
      id: 6,
      title: '平台后端',
      companyName: '星河科技',
      city: '城市待补充',
    })
  })

  it('groups application records by workflow lane', () => {
    const groups = buildApplicationGroups([
      { id: 1, status: 'TODO' },
      { id: 2, status: 'FIRST_INTERVIEW' },
      { id: 3, status: 'OFFER' },
    ])

    expect(groups.find((group) => group.key === 'todo').items).toHaveLength(1)
    expect(groups.find((group) => group.key === 'interview').items).toHaveLength(1)
    expect(groups.find((group) => group.key === 'result').items).toHaveLength(1)
  })

  it('normalizes raw application lists with readable fallbacks', () => {
    expect(normalizeApplications([{ id: 9 }])[0]).toMatchObject({
      id: 9,
      companyName: '企业待补充',
      jobTitle: '岗位待补充',
      status: 'TODO',
    })
  })

  it('normalizes admin list pages from array fallback and paged payloads', () => {
    expect(normalizeAdminListPage([{ id: 1 }]).items).toHaveLength(1)
    expect(normalizeAdminListPage({ content: [{ id: 2 }], totalPages: 3, page: 0 }).totalPages).toBe(3)
  })
})
