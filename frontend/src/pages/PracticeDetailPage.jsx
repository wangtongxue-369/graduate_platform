import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { practiceApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const modeLabels = {
  chapter: '章节练习',
  random: '随机练习',
  mock: '模拟练习',
}

function safeParseOptions(rawOptions) {
  if (Array.isArray(rawOptions)) return rawOptions
  if (!rawOptions) return []
  try {
    const options = JSON.parse(rawOptions)
    return Array.isArray(options) ? options : []
  } catch {
    return []
  }
}

function normalizeQuestion(question) {
  return {
    ...question,
    options: safeParseOptions(question.options || question.optionsJson),
    chapter: question.chapter || '未分章节',
    difficulty: question.difficulty || 'middle',
    questionType: question.questionType || 'single',
  }
}

function PracticeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token, isAuthed } = useAuth()
  const canUsePractice = Boolean(isAuthed && token && token !== 'dev-token')
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [markedMap, setMarkedMap] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingQuestionId, setSavingQuestionId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!canUsePractice) {
      setLoading(false)
      setError('请先登录真实账号后再进入练习。')
      return undefined
    }

    let active = true
    async function startOrLoadSession() {
      setLoading(true)
      setError('')
      setMessage('')
      try {
        const sessionId = searchParams.get('sessionId')
        const data = sessionId
          ? await practiceApi.session(sessionId, token)
          : await practiceApi.createSession({
              bankId: Number(id),
              mode: searchParams.get('mode') || 'chapter',
              chapter: searchParams.get('chapter') || undefined,
              questionType: searchParams.get('questionType') || undefined,
              difficulty: searchParams.get('difficulty') || undefined,
              year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
            }, token)

        if (!active) return
        applySession(data)
        if (!sessionId && data?.id) {
          navigate(`/practice/${id}?sessionId=${data.id}`, { replace: true })
        }
      } catch (err) {
        if (active) setError(err.message || '进入练习失败')
      } finally {
        if (active) setLoading(false)
      }
    }

    startOrLoadSession()
    return () => {
      active = false
    }
  }, [canUsePractice, id, navigate, searchParams, token])

  const current = questions[currentIndex]
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  )

  function applySession(data) {
    const normalized = (data?.questions || []).map(normalizeQuestion)
    const restoredAnswers = {}
    normalized.forEach((question) => {
      if (question.userAnswer) restoredAnswers[question.id] = question.userAnswer
    })
    setSession(data)
    setQuestions(normalized)
    setAnswers(restoredAnswers)
    setResult(data?.result || null)
    setCurrentIndex(0)
  }

  async function handleAnswer(question, value) {
    if (!session || session.status === 'submitted') return
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
    setSavingQuestionId(question.id)
    setMessage('')
    try {
      await practiceApi.saveAnswer(session.id, question.id, value, token)
    } catch (err) {
      setMessage(err.message || '答案暂存失败，请稍后重试')
    } finally {
      setSavingQuestionId(null)
    }
  }

  // 多选题：点击切换选项，答案为已选字母排序后的拼接（如 "AC"），与后端判分一致
  function handleToggleOption(question, optionKey) {
    if (!session || session.status === 'submitted') return
    const selected = new Set((answers[question.id] || '').split('').filter(Boolean))
    if (selected.has(optionKey)) selected.delete(optionKey)
    else selected.add(optionKey)
    const next = Array.from(selected).sort().join('')
    handleAnswer(question, next)
  }

  async function handleSubmitPaper() {
    if (!session || submitting) return
    setSubmitting(true)
    setMessage('')
    try {
      const submitResult = await practiceApi.submitSession(session.id, token)
      setResult(submitResult)
      const refreshed = await practiceApi.session(session.id, token)
      applySession(refreshed)
      setMessage('交卷完成，系统已生成成绩和错题清单。')
    } catch (err) {
      setMessage(err.message || '交卷失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">练习作答</p>
            <h2>题号导航 + 答案暂存 + 自动判分</h2>
            <p className="muted">客观题交卷后自动判分，主观题仅保存作答内容。</p>
            {error ? <div className="error-text">{error}</div> : null}
          </div>

          {!canUsePractice ? (
            <div className="feature-card">
              <div className="card-title">需要登录</div>
              <p className="muted">练习会话、答案暂存、交卷结果和错题本都需要后端认证。</p>
              <Link className="btn primary small" to="/login">去登录</Link>
            </div>
          ) : loading ? (
            <div className="feature-card">加载中...</div>
          ) : !current ? (
            <div className="feature-card">当前条件下暂无可练习题目。</div>
          ) : (
            <>
              <div className="grid-two">
                <div className="feature-card">
                  <div className="card-title">练习配置</div>
                  <div className="mini-grid">
                    <Metric value={modeLabels[session?.mode] || session?.mode} label="模式" />
                    <Metric value={`${answeredCount}/${questions.length}`} label="进度" />
                    <Metric value={session?.status === 'submitted' ? '已交卷' : '作答中'} label="状态" />
                  </div>
                  <div className="progress-block">
                    <div className="progress-bar">
                      <span style={{ width: `${questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%` }}></span>
                    </div>
                  </div>
                  <div className="question-nav">
                    {questions.map((question, index) => {
                      const active = index === currentIndex
                      const answered = Boolean(answers[question.id])
                      const marked = Boolean(markedMap[question.id])
                      return (
                        <button
                          key={question.id}
                          type="button"
                          className={`question-nav-btn ${active ? 'active' : ''} ${answered ? 'answered' : ''} ${marked ? 'marked' : ''}`}
                          onClick={() => setCurrentIndex(index)}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                  {session?.status !== 'submitted' ? (
                    <button className="btn primary" type="button" onClick={handleSubmitPaper} disabled={submitting}>
                      {submitting ? '交卷中...' : '交卷并查看结果'}
                    </button>
                  ) : null}
                  {message ? <div className="muted">{message}</div> : null}
                </div>

                <div className="feature-card metrics">
                  <div className="card-title">本次结果</div>
                  {!result ? (
                    <p className="muted">交卷后展示总题数、正确数、错误数、用时、得分、正确率和错题清单。</p>
                  ) : (
                    <div className="result-stack">
                      <div className="mini-grid">
                        <Metric value={result.totalCount ?? 0} label="总题数" />
                        <Metric value={result.correctCount ?? 0} label="正确数" />
                        <Metric value={result.wrongCount ?? 0} label="错误数" />
                      </div>
                      <div className="metric-row">
                        <span>得分 {result.score ?? '-'}</span>
                        <span>正确率 {result.accuracy ?? 0}%</span>
                        <span>用时 {formatDuration(result.durationSeconds || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <section className="section">
                <div className="grid-two">
                  <div className="feature-card soft">
                    <div className="track-head">
                      <h3>第 {currentIndex + 1} 题</h3>
                      <span className="tag subtle">{current.chapter}</span>
                    </div>
                    <div className="metric-row">
                      <span>{current.questionType}</span>
                      <span>{current.difficulty}</span>
                      <span>{current.knowledgePoint || '未标注知识点'}</span>
                    </div>
                    <div className="question-stem">{current.stem}</div>
                    {current.questionType === 'subjective' ? (
                      <textarea
                        className="text-area"
                        rows={8}
                        value={answers[current.id] || ''}
                        disabled={session?.status === 'submitted'}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [current.id]: event.target.value }))}
                        onBlur={(event) => handleAnswer(current, event.target.value)}
                        placeholder="请输入作答内容"
                      />
                    ) : (
                      <div className="question-options">
                        {current.options.map((option, index) => {
                          const optionKey = String.fromCharCode(65 + index)
                          const isMultiple = current.questionType === 'multiple'
                          const selected = isMultiple
                            ? (answers[current.id] || '').includes(optionKey)
                            : answers[current.id] === optionKey
                          return (
                            <button
                              className={`option-btn ${selected ? 'active' : ''}`}
                              key={optionKey}
                              onClick={() => (isMultiple
                                ? handleToggleOption(current, optionKey)
                                : handleAnswer(current, optionKey))}
                              disabled={session?.status === 'submitted'}
                              type="button"
                            >
                              <span className="option-key">{optionKey}</span>
                              <span>{option}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {savingQuestionId === current.id ? <div className="muted">答案暂存中...</div> : null}
                    <div className="question-actions">
                      <button className="btn ghost" type="button" onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}>上一题</button>
                      <button
                        className="btn outline"
                        type="button"
                        onClick={() => setMarkedMap((prev) => ({ ...prev, [current.id]: !prev[current.id] }))}
                      >
                        {markedMap[current.id] ? '取消标记' : '标记复查'}
                      </button>
                      <button className="btn ghost" type="button" onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}>下一题</button>
                    </div>
                    {session?.status === 'submitted' ? (
                      <div className="analysis">
                        <div>正确答案：{current.answer || '主观题待评阅'}</div>
                        <div className="muted">{current.analysis || '暂无解析'}</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="feature-card">
                    <div className="card-title">错题清单</div>
                    <div className="wrong-list">
                      {(result?.wrongQuestions || []).map((item) => (
                        <div className="wrong-item" key={item.id}>
                          <div className="wrong-title">{item.stem}</div>
                          <div className="muted">你的答案：{item.selected || '未作答'} / 正确答案：{item.answer}</div>
                        </div>
                      ))}
                      {result && !result.wrongQuestions?.length ? <div className="muted">本次客观题无错题。</div> : null}
                      {!result ? <p className="muted">交卷后错题会自动加入错题本。</p> : null}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <Link className="btn ghost" to="/practice">返回题库</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="mini-card">
      <div className="mini-value">{value}</div>
      <div className="mini-label">{label}</div>
    </div>
  )
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default PracticeDetailPage
