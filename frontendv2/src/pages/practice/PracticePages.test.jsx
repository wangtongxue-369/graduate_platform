import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PracticeBankPage from './PracticeBankPage.jsx'
import PracticeDirectoryPage from './PracticeDirectoryPage.jsx'
import PracticeHistoryPage from './PracticeHistoryPage.jsx'
import PracticeSessionPage from './PracticeSessionPage.jsx'
import PracticeStatisticsPage from './PracticeStatisticsPage.jsx'
import PracticeWrongQuestionsPage from './PracticeWrongQuestionsPage.jsx'
import SettingsPracticePage from '../settings/SettingsPracticePage.jsx'

const authState = vi.hoisted(() => ({
  user: null,
  token: '',
  isAuthed: false,
  loading: false,
}))

const practiceApiMocks = vi.hoisted(() => ({
  banks: vi.fn(),
  options: vi.fn(),
  questions: vi.fn(),
  createSession: vi.fn(),
  session: vi.fn(),
  saveAnswer: vi.fn(),
  submitSession: vi.fn(),
  history: vi.fn(),
  wrongQuestions: vi.fn(),
  rebuildWrongSession: vi.fn(),
  statistics: vi.fn(),
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  practiceApi: practiceApiMocks,
}))

describe('practice pages', () => {
  beforeEach(() => {
    authState.user = null
    authState.token = ''
    authState.isAuthed = false
    authState.loading = false

    practiceApiMocks.banks.mockReset()
    practiceApiMocks.options.mockReset()
    practiceApiMocks.questions.mockReset()
    practiceApiMocks.createSession.mockReset()
    practiceApiMocks.session.mockReset()
    practiceApiMocks.saveAnswer.mockReset()
    practiceApiMocks.submitSession.mockReset()
    practiceApiMocks.history.mockReset()
    practiceApiMocks.wrongQuestions.mockReset()
    practiceApiMocks.rebuildWrongSession.mockReset()
    practiceApiMocks.statistics.mockReset()

    practiceApiMocks.banks.mockResolvedValue([
      {
        id: 7,
        name: '考研政治题库',
        target: 'kaoyan',
        subject: '政治',
        difficulty: 'middle',
        description: '政治基础题库',
        questionCount: 32,
        chapterCount: 6,
        supportedModes: ['chapter', 'random', 'mock'],
      },
    ])
    practiceApiMocks.options.mockResolvedValue({
      targets: ['kaoyan'],
      subjects: ['政治'],
      chapters: ['马原'],
      questionTypes: ['single'],
      difficulties: ['middle'],
      years: [2025],
    })
    practiceApiMocks.questions.mockResolvedValue([
      {
        id: 11,
        stem: '题干 1',
        optionsJson: '["A","B"]',
        answer: 'A',
        analysis: '解析',
        chapter: '马原',
        questionType: 'single',
        difficulty: 'middle',
      },
    ])
  })

  it('renders real bank cards on the directory page', async () => {
    render(
      <MemoryRouter>
        <PracticeDirectoryPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: /考研政治题库/ })).toHaveAttribute('href', '/practice/banks/7')
    expect(screen.queryByRole('heading', { name: '从题库跳进模式页，再进入练习会话' })).not.toBeInTheDocument()
  })

  it('renders public question preview and practice mode controls on the bank page', async () => {
    render(
      <MemoryRouter initialEntries={['/practice/banks/7']}>
        <Routes>
          <Route path="/practice/banks/:bankId" element={<PracticeBankPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('题干 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '章节练习' })).toBeInTheDocument()
  })

  it('renders a resumable practice session', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.session.mockResolvedValueOnce({
      id: 81,
      status: 'in_progress',
      mode: 'chapter',
      questions: [
        { id: 1, stem: '单选题', optionsJson: '["A","B"]', questionType: 'single', userAnswer: 'A' },
        { id: 2, stem: '主观题', optionsJson: '[]', questionType: 'essay', userAnswer: '' },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/practice/sessions/81']}>
        <Routes>
          <Route path="/practice/sessions/:sessionId" element={<PracticeSessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('单选题')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
  })

  it('shows the result summary after submit', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.session.mockResolvedValueOnce({
      id: 81,
      status: 'submitted',
      mode: 'chapter',
      questions: [
        {
          id: 1,
          stem: '单选题',
          optionsJson: '["A","B"]',
          questionType: 'single',
          answer: 'A',
          analysis: '解析',
          userAnswer: 'B',
        },
      ],
      result: {
        totalCount: 1,
        correctCount: 0,
        wrongCount: 1,
        score: 0,
        accuracy: 0,
        durationSeconds: 30,
        wrongQuestions: [
          { id: 1, stem: '单选题', answer: 'A', selected: 'B', analysis: '解析' },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={['/practice/sessions/81']}>
        <Routes>
          <Route path="/practice/sessions/:sessionId" element={<PracticeSessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('单选题')).toBeInTheDocument()
    expect(screen.getByText('正确答案：A')).toBeInTheDocument()
  })

  it('renders paged practice history', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.history.mockResolvedValueOnce({
      items: [
        {
          id: 91,
          bankId: 7,
          bankName: '考研政治题库',
          mode: 'chapter',
          accuracy: 80,
          score: 80,
          durationSeconds: 600,
          submittedAt: '2026-06-15T10:00:00',
        },
      ],
      total: 1,
      page: 1,
      size: 20,
      totalPages: 1,
    })

    render(
      <MemoryRouter initialEntries={['/practice/history']}>
        <Routes>
          <Route path="/practice/history" element={<PracticeHistoryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('考研政治题库')).toBeInTheDocument()
  })

  it('renders wrong-question batch actions', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.wrongQuestions.mockResolvedValueOnce({
      items: [{ id: 31, stem: '错题 1', chapter: '马原', subject: '政治', wrongCount: 3 }],
      total: 1,
      page: 0,
      size: 20,
      totalPages: 1,
    })

    render(
      <MemoryRouter initialEntries={['/practice/wrong-questions']}>
        <Routes>
          <Route path="/practice/wrong-questions" element={<PracticeWrongQuestionsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('错题 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重练选中' })).toBeInTheDocument()
  })

  it('shows an explicit selected state for wrong-question items after clicking', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.wrongQuestions.mockResolvedValueOnce({
      items: [{ id: 31, stem: '错题 1', chapter: '马原', subject: '政治', wrongCount: 3 }],
      total: 1,
      page: 0,
      size: 20,
      totalPages: 1,
    })

    render(
      <MemoryRouter initialEntries={['/practice/wrong-questions']}>
        <Routes>
          <Route path="/practice/wrong-questions" element={<PracticeWrongQuestionsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const rowButton = await screen.findByRole('button', { name: /错题 1/ })
    fireEvent.click(rowButton)

    expect(screen.getByText('已选中')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重练选中' })).toBeEnabled()
  })

  it('supports select-all and clear-all for the visible wrong-question items', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.wrongQuestions.mockResolvedValueOnce({
      items: [
        { id: 31, stem: '错题 1', chapter: '马原', subject: '政治', wrongCount: 3 },
        { id: 32, stem: '错题 2', chapter: '史纲', subject: '政治', wrongCount: 2 },
      ],
      total: 2,
      page: 0,
      size: 20,
      totalPages: 1,
    })

    render(
      <MemoryRouter initialEntries={['/practice/wrong-questions']}>
        <Routes>
          <Route path="/practice/wrong-questions" element={<PracticeWrongQuestionsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('错题 1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '全选本页' }))

    expect(screen.getAllByText('已选中')).toHaveLength(2)
    expect(screen.getByText('已选 2 题')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重练选中' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: '取消全选' }))

    expect(screen.queryByText('已选 2 题')).not.toBeInTheDocument()
    expect(screen.queryByText('已选中')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重练选中' })).toBeDisabled()
  })

  it('renders statistics summaries and charts', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.statistics.mockResolvedValueOnce({
      granularity: 'day',
      practiceCount: 4,
      averageAccuracy: 76,
      totalDurationSeconds: 1800,
      trend: [
        { period: '2026-06-15', practiceCount: 1, averageAccuracy: 80, totalDurationSeconds: 400 },
      ],
      frequentWrongKnowledgePoints: [{ knowledgePoint: '马原', wrongCount: 2 }],
    })

    render(
      <MemoryRouter initialEntries={['/practice/statistics']}>
        <Routes>
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '复盘总览' })).toBeInTheDocument()
    expect(screen.getByText('马原')).toBeInTheDocument()
  })

  it('shows a login guide instead of requesting statistics for guests', () => {
    render(
      <MemoryRouter initialEntries={['/practice/statistics']}>
        <Routes>
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '登录后查看训练复盘' })).toBeInTheDocument()
    expect(practiceApiMocks.statistics).not.toHaveBeenCalled()
  })

  it('shows the empty state when the statistics payload has no practice records', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.statistics.mockResolvedValueOnce({
      granularity: 'day',
      practiceCount: 0,
      averageAccuracy: null,
      totalDurationSeconds: 0,
      trend: [],
      frequentWrongKnowledgePoints: [],
    })

    render(
      <MemoryRouter initialEntries={['/practice/statistics']}>
        <Routes>
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '还没有可复盘的练习记录' })).toBeInTheDocument()
  })

  it('shows an error state and retries the request', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.statistics
      .mockRejectedValueOnce(new Error('统计服务异常'))
      .mockResolvedValueOnce({
        granularity: 'day',
        practiceCount: 4,
        averageAccuracy: 76,
        totalDurationSeconds: 1800,
        trend: [
          { period: '2026-06-15', practiceCount: 1, averageAccuracy: 80, totalDurationSeconds: 400 },
        ],
        frequentWrongKnowledgePoints: [{ knowledgePoint: '马原', wrongCount: 2 }],
      })

    render(
      <MemoryRouter initialEntries={['/practice/statistics']}>
        <Routes>
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '练习统计暂时不可用' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新加载' }))

    expect(await screen.findByText('马原')).toBeInTheDocument()
  })

  it('renders dashboard summaries and keeps null accuracy as a dash in details', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.statistics.mockResolvedValueOnce({
      granularity: 'day',
      practiceCount: 4,
      averageAccuracy: 76,
      totalDurationSeconds: 1800,
      trend: [
        { period: '2026-06-15', practiceCount: 1, averageAccuracy: 80, totalDurationSeconds: 400 },
        { period: '2026-06-16', practiceCount: 1, averageAccuracy: null, totalDurationSeconds: 300 },
      ],
      frequentWrongKnowledgePoints: [{ knowledgePoint: '马原', wrongCount: 2 }],
    })

    render(
      <MemoryRouter initialEntries={['/practice/statistics']}>
        <Routes>
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('马原')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看明细' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看明细' }))

    expect(screen.getByText('2026-06-16')).toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('shows a dash when the backend returns null accuracy instead of coercing to 0%', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.statistics.mockResolvedValueOnce({
      granularity: 'week',
      practiceCount: 1,
      averageAccuracy: null,
      totalDurationSeconds: 1800,
      trend: [{ period: '2026-W24', practiceCount: 1, averageAccuracy: null, totalDurationSeconds: 400 }],
      frequentWrongKnowledgePoints: [],
    })

    render(
      <MemoryRouter initialEntries={['/practice/statistics']}>
        <Routes>
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('-')).toBeInTheDocument()
  })

  it('renders a summary-first settings practice page', async () => {
    authState.user = { id: 7, name: '练习用户', role: 'user', target: 'kaoyan' }
    authState.token = 'real-token'
    authState.isAuthed = true

    practiceApiMocks.history.mockResolvedValueOnce({
      items: [{ id: 91, bankName: '考研政治题库', mode: 'chapter', score: 80, submittedAt: '2026-06-15T10:00:00' }],
      total: 1,
      page: 1,
      size: 5,
      totalPages: 1,
    })
    practiceApiMocks.wrongQuestions.mockResolvedValueOnce({
      items: [],
      total: 3,
      page: 0,
      size: 1,
      totalPages: 3,
    })
    practiceApiMocks.statistics.mockResolvedValueOnce({
      practiceCount: 4,
      averageAccuracy: 76,
      totalDurationSeconds: 1800,
    })

    render(
      <MemoryRouter>
        <SettingsPracticePage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('考研政治题库')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入练习历史' })).toHaveAttribute('href', '/practice/history')
  })
})
