import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KaoyanSchoolLedgerTable from '@/components/kaoyan/KaoyanSchoolLedgerTable.jsx'
import KaoyanSchoolCompareModal from '@/components/kaoyan/KaoyanSchoolCompareModal.jsx'

describe('KaoyanSchoolLedgerTable', () => {
  it('renders core columns and expanded details', () => {
    render(
      <KaoyanSchoolLedgerTable
        rows={[
          {
            id: 11,
            schoolName: '浙江大学',
            majorName: '计算机科学与技术',
            year: 2025,
            totalScoreLine: 390,
            politicsLine: 60,
            foreignLangLine: 62,
            subject1Line: 105,
            subject2Line: 123,
            plannedEnrollment: 28,
            actualApplicants: 174,
            admissionRatio: 6.2,
            province: '浙江',
            region: '华东',
            is985: true,
            is211: true,
            isDoubleFirstClass: true,
            note: '复试线稳定',
            source: '研招网',
            isNationalLine: false,
          },
        ]}
        compareIds={[]}
        expandedRowIds={new Set([11])}
        favoriteIds={new Set()}
        page={0}
        totalPages={1}
        totalElements={1}
        onToggleCompare={vi.fn()}
        onToggleExpand={vi.fn()}
        onToggleFavorite={vi.fn()}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('columnheader', { name: '院校' })).toBeInTheDocument()
    expect(screen.getByText('实际报考人数')).toBeInTheDocument()
    expect(screen.getByText('174')).toBeInTheDocument()
  })

  it('renders compare modal with applicant field and close action', () => {
    const onClose = vi.fn()

    render(
      <KaoyanSchoolCompareModal
        rows={[
          {
            id: 11,
            schoolName: '浙江大学',
            majorName: '计算机科学与技术',
            year: 2025,
            totalScoreLine: 390,
            actualApplicants: 174,
            admissionRatio: 6.2,
            isNationalLine: false,
          },
        ]}
        onClose={onClose}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('分数线对比')).toBeInTheDocument()
    expect(screen.getByText('报考人数')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalled()
  })
})
