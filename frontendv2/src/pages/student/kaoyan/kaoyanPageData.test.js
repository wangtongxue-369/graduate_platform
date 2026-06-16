import { describe, expect, it } from 'vitest'
import {
  buildPlanCalendarDays,
  buildPlanDetailMetrics,
  buildSchoolLedgerRows,
  createKaoyanSchoolLedgerFilters,
  getPlanDayStatus,
  groupCheckInsByDate,
  normalizeFavoriteRows,
  normalizePlanDetail,
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

  it('normalizes optional plan summary fields needed by the old detail flow', () => {
    expect(
      normalizePlanDetail({
        id: 41,
        name: '7月冲刺计划',
        description: '英语 + 专业课',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        totalDurationHours: 90,
        plannedDurationHours: 120,
        completionRate: 42,
        streak: 3,
        checkedDays: 8,
      }),
    ).toMatchObject({
      id: 41,
      plannedDurationHours: 120,
      totalDurationHours: 90,
      completionRate: 42,
      streak: 3,
      checkedDays: 8,
    })
  })

  it('builds grouped check-ins and old-frontend summary metrics', () => {
    const checkIns = [
      { id: 1, checkInDate: '2026-06-10', durationHours: 1, remark: '单词' },
      { id: 2, checkInDate: '2026-06-13', durationHours: 3, remark: '阅读' },
      { id: 3, checkInDate: '2026-06-14', durationHours: 2.5, remark: '专业课' },
    ]

    expect(groupCheckInsByDate(checkIns)).toEqual({
      '2026-06-10': [checkIns[0]],
      '2026-06-13': [checkIns[1]],
      '2026-06-14': [checkIns[2]],
    })

    expect(
      buildPlanDetailMetrics(
        { plannedDurationHours: 120, totalDurationHours: 90, completionRate: 42 },
        checkIns,
        new Date('2026-06-14T12:00:00'),
      ),
    ).toMatchObject({
      streak: 2,
      checkedDays: 3,
      totalCheckedHours: 6.5,
      plannedHours: 120,
      completionRate: 42,
    })
  })

  it('classifies checked, today, missed, future, and out-of-range dates', () => {
    const base = {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      checkedDates: new Set(['2026-06-13']),
      todayKey: '2026-06-14',
    }

    expect(getPlanDayStatus('2026-05-31', base)).toBe('out')
    expect(getPlanDayStatus('2026-06-13', base)).toBe('checked')
    expect(getPlanDayStatus('2026-06-14', base)).toBe('today')
    expect(getPlanDayStatus('2026-06-12', base)).toBe('missed')
    expect(getPlanDayStatus('2026-06-20', base)).toBe('future')
  })

  it('builds calendar cells for the month of the selected date', () => {
    const cells = buildPlanCalendarDays('2026-06-14')

    expect(cells[0]).toBeNull()
    expect(cells[1]).toMatchObject({ key: '2026-06-01', day: 1 })
    expect(cells.at(-1)).toMatchObject({ key: '2026-06-30', day: 30 })
  })
})
