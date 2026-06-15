import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminQuestionBanksPage from './AdminQuestionBanksPage.jsx'
import AdminQuestionBankWorkspacePage from './AdminQuestionBankWorkspacePage.jsx'

const authState = vi.hoisted(() => ({
  user: { id: 9, name: '管理员', role: 'admin', target: 'job' },
  token: 'admin-token',
  isAuthed: true,
  loading: false,
}))

const adminQuestionBankApiMocks = vi.hoisted(() => ({
  banks: vi.fn(),
  createBank: vi.fn(),
  updateBank: vi.fn(),
  deleteBank: vi.fn(),
  toggleBankStatus: vi.fn(),
  questions: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  toggleQuestionStatus: vi.fn(),
  batchCreateQuestions: vi.fn(),
  importQuestions: vi.fn(),
  snapshots: vi.fn(),
  batchUpdateQuestions: vi.fn(),
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  adminQuestionBankApi: adminQuestionBankApiMocks,
}))

describe('admin question bank pages', () => {
  beforeEach(() => {
    Object.values(adminQuestionBankApiMocks).forEach((mockFn) => mockFn.mockReset())

    adminQuestionBankApiMocks.banks.mockResolvedValue({
      content: [
        {
          id: 12,
          name: '考研政治题库',
          target: 'kaoyan',
          subject: '政治',
          difficulty: 'middle',
          questionCount: 32,
          active: true,
        },
      ],
      totalPages: 1,
    })
    adminQuestionBankApiMocks.questions.mockResolvedValue({
      content: [
        {
          id: 101,
          stem: '管理员题目',
          chapter: '马原',
          questionType: 'single',
          difficulty: 'middle',
          active: true,
        },
      ],
      totalPages: 1,
    })
    adminQuestionBankApiMocks.snapshots.mockResolvedValue([
      { id: 1, versionNo: 2, stem: '管理员题目', answer: 'A', createdAt: '2026-06-15T10:00:00' },
    ])
  })

  it('renders the governance overview cards', async () => {
    render(
      <MemoryRouter>
        <AdminQuestionBanksPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('考研政治题库')).toBeInTheDocument()
  })

  it('renders the question workspace for a single bank', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/question-banks/12']}>
        <Routes>
          <Route path="/admin/question-banks/:bankId" element={<AdminQuestionBankWorkspacePage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('管理员题目')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新建题目' })).toBeInTheDocument()
  })
})
