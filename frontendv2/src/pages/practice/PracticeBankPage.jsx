import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeFilterSidebar from '@/components/practice/PracticeFilterSidebar.jsx'
import PracticeModePanel from '@/components/practice/PracticeModePanel.jsx'
import PracticeQuestionPreviewList from '@/components/practice/PracticeQuestionPreviewList.jsx'
import { normalizePracticeQuestion } from '@/lib/practice/normalizers.js'

const difficultyLabelMap = {
  easy: '基础',
  middle: '进阶',
  hard: '冲刺',
}

const modeOptions = [
  { value: 'chapter', label: '章节练习' },
  { value: 'random', label: '随机练习' },
  { value: 'mock', label: '模拟练习' },
  { value: 'wrong_retry', label: '错题回练' },
]

const defaultFilters = {
  chapter: '',
  questionType: '',
  difficulty: '',
  year: '',
}

function SelectField({ label, value, onChange, options = [], labels = {} }) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>
    </label>
  )
}

function getSupportedModes(bank) {
  if (bank?.supportedModes?.length) {
    return modeOptions.filter((item) => bank.supportedModes.includes(item.value))
  }
  return modeOptions.slice(0, 3)
}

export default function PracticeBankPage() {
  const { bankId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { token, isAuthed } = useAuth()
  const [bank, setBank] = useState(null)
  const [questions, setQuestions] = useState([])
  const [options, setOptions] = useState({
    chapters: [],
    questionTypes: [],
    difficulties: [],
    years: [],
  })
  const [mode, setMode] = useState('chapter')
  const [filters, setFilters] = useState(defaultFilters)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  function showSuccess(msg) { setMessage(msg); setMessageType('success') }
  function showError(msg) { setMessage(msg); setMessageType('error') }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [banks, questionList, practiceOptions] = await Promise.all([
          practiceApi.banks({}),
          practiceApi.questions(bankId),
          practiceApi.options(),
        ])

        if (!active) return
        setBank((banks || []).find((item) => String(item.id) === String(bankId)) || null)
        setQuestions((questionList || []).map(normalizePracticeQuestion))
        setOptions({
          chapters: practiceOptions?.chapters || [],
          questionTypes: practiceOptions?.questionTypes || [],
          difficulties: practiceOptions?.difficulties || [],
          years: (practiceOptions?.years || []).map(String),
        })
        setMessage('')
      } catch (error) {
        if (!active) return
        setBank(null)
        setQuestions([])
        showError(error.message || '题库详情暂时不可用。')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [bankId])

  const previewQuestions = useMemo(() => (
    questions.filter((question) => (
      (!filters.chapter || question.chapter === filters.chapter)
      && (!filters.questionType || question.questionType === filters.questionType)
      && (!filters.difficulty || question.difficulty === filters.difficulty)
      && (!filters.year || String(question.year || '') === filters.year)
    ))
  ), [filters, questions])

  const availableModes = useMemo(() => getSupportedModes(bank), [bank])

  useEffect(() => {
    if (!availableModes.some((item) => item.value === mode)) {
      setMode(availableModes[0]?.value || 'chapter')
    }
  }, [availableModes, mode])

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  async function handleStart() {
    if (!isAuthed || !token || token === 'dev-token') {
      navigate('/login', { state: { backgroundLocation: location.pathname } })
      return
    }

    try {
      const session = await practiceApi.createSession({
        bankId: Number(bankId),
        mode,
        chapter: filters.chapter || undefined,
        questionType: filters.questionType || undefined,
        difficulty: filters.difficulty || undefined,
        year: filters.year ? Number(filters.year) : undefined,
      }, token)

      navigate(`/practice/sessions/${session.id}`)
    } catch (error) {
      showError(error.message || '创建练习会话失败，请稍后重试。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="题库详情"
          pathItems={[
            { label: '题库目录', to: '/practice' },
            { label: bank?.name || `题库 ${bankId}` },
          ]}
          title={bank?.name || '题库详情'}
          lead={bank?.description || '公开预览题目后，再决定进入哪种练习模式。'}
          actions={(
            <div className="v2-inline-actions">
              <Link className="v2-secondary-link" to="/practice">返回目录</Link>
              <button className="v2-primary-link" type="button" onClick={handleStart}>
                开始练习
              </button>
            </div>
          )}
        />

        {message ? <div className={messageType === 'error' ? 'v2-status-error' : 'v2-status-note'}>{message}</div> : null}

        {bank ? (
          <section className="v2-summary-strip" aria-label="题库摘要">
            <article className="v2-summary-card">
              <span>题目规模</span>
              <strong>{bank.questionCount || questions.length}</strong>
              <p>公开预览页先让你确认题库体量和方向。</p>
            </article>
            <article className="v2-summary-card">
              <span>章节数量</span>
              <strong>{bank.chapterCount || 0}</strong>
              <p>章节练习会使用你右侧选择的筛选条件。</p>
            </article>
            <article className="v2-summary-card">
              <span>默认难度</span>
              <strong>{difficultyLabelMap[bank.difficulty] || bank.difficulty || '进阶'}</strong>
              <p>支持的模式会根据题库配置动态切换。</p>
            </article>
          </section>
        ) : null}

        <PracticeModePanel
          modes={availableModes}
          value={mode}
          onChange={setMode}
          lead="游客可查看题目预览；真正创建练习会话时会校验登录状态。"
          summaryItems={[
            { label: '公开预览', value: previewQuestions.length, note: '当前筛选下的题目数' },
            { label: '会话模式', value: availableModes.length, note: '本题库可用的练习路径' },
            { label: '错题入口', value: '独立页', note: '错题重练从独立页面回流' },
          ]}
        />

        <PracticeQuestionPreviewList questions={previewQuestions} />
      </div>

      <PracticeFilterSidebar
        title="会话参数"
        fields={(
          <>
            <SelectField
              label="章节"
              value={filters.chapter}
              onChange={(value) => updateFilter('chapter', value)}
              options={options.chapters}
            />
            <SelectField
              label="题型"
              value={filters.questionType}
              onChange={(value) => updateFilter('questionType', value)}
              options={options.questionTypes}
              labels={{ single: '单选题', multiple: '多选题', judge: '判断题', subjective: '主观题' }}
            />
            <SelectField
              label="难度"
              value={filters.difficulty}
              onChange={(value) => updateFilter('difficulty', value)}
              options={options.difficulties}
              labels={difficultyLabelMap}
            />
            <SelectField
              label="年份"
              value={filters.year}
              onChange={(value) => updateFilter('year', value)}
              options={options.years}
            />
          </>
        )}
        note="章节、题型、难度和年份会一起带入创建会话接口。"
        actions={(
          <>
            <button className="v2-primary-link" type="button" onClick={handleStart}>开始练习</button>
            <Link className="v2-secondary-link" to="/practice/statistics">查看统计</Link>
          </>
        )}
      />
    </>
  )
}
