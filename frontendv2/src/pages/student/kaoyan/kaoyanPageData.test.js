import { describe, expect, it } from 'vitest'
import {
  buildSchoolLedgerRows,
  createKaoyanSchoolLedgerFilters,
  normalizeFavoriteRows,
  paginateSchoolLedgerRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'

describe('kaoyan school ledger helpers', () => {
  it('creates full old-frontend-aligned filter defaults', () => {
    expect(createKaoyanSchoolLedgerFilters()).toEqual({
      schoolName: '',
      region: '',
      majorCategory: '',
      majorName: '',
      year: '',
      is985: '',
      is211: '',
      isDoubleFirstClass: '',
    })
  })

  it('merges school and score-line results and drops school-only placeholder rows', () => {
    const result = buildSchoolLedgerRows(
      {
        content: [
          {
            id: 1,
            name: '浙江大学',
            region: '华东',
            province: '浙江',
            is985: true,
            is211: true,
            isDoubleFirstClass: true,
          },
        ],
      },
      {
        content: [
          {
            id: 11,
            schoolId: 1,
            schoolName: '浙江大学',
            majorName: '计算机科学与技术',
            majorCategory: '工学',
            year: 2025,
            totalScoreLine: 390,
            politicsLine: 60,
            foreignLangLine: 62,
            subject1Line: 105,
            subject2Line: 123,
            plannedEnrollment: 28,
            actualApplicants: 174,
            admissionRatio: 6.2,
            isNationalLine: false,
            note: '复试线稳定',
            source: '研招网',
          },
        ],
      },
      {
        region: '华东',
        is985: 'true',
        is211: '',
        isDoubleFirstClass: '',
      },
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      id: 11,
      schoolName: '浙江大学',
      majorName: '计算机科学与技术',
      province: '浙江',
      politicsLine: 60,
      actualApplicants: 174,
      source: '研招网',
    })
  })

  it('returns no ledger rows when school-side filters eliminate all matched schools', () => {
    const result = buildSchoolLedgerRows(
      {
        content: [],
        totalElements: 0,
      },
      {
        content: [
          {
            id: 11,
            schoolId: 1,
            schoolName: '浙江大学',
            majorName: '计算机科学与技术',
            majorCategory: '工学',
            year: 2025,
            totalScoreLine: 390,
          },
        ],
        totalElements: 1,
      },
      {
        region: '西南',
        is985: '',
        is211: '',
        isDoubleFirstClass: '',
      },
    )

    expect(result.schoolCount).toBe(0)
    expect(result.rows).toEqual([])
  })

  it('paginates merged rows on the frontend using score-line rows only', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      schoolName: `学校-${index + 1}`,
    }))
    const page = paginateSchoolLedgerRows(rows, { page: 1, pageSize: 10 })
    expect(page.pageRows.map((item) => item.id)).toEqual([11, 12])
    expect(page.totalPages).toBe(2)
    expect(page.totalElements).toBe(12)
  })

  it('normalizes favorites with ratio and enrollment fields for the new table', () => {
    expect(
      normalizeFavoriteRows([
        {
          id: 11,
          schoolName: '浙江大学',
          majorName: '计算机科学与技术',
          year: 2025,
          totalScoreLine: 390,
          admissionRatio: 6.2,
          plannedEnrollment: 28,
        },
      ])[0],
    ).toMatchObject({
      schoolName: '浙江大学',
      admissionRatio: 6.2,
      plannedEnrollment: 28,
      favorite: true,
    })
  })
})
