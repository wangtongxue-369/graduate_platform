import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { practiceApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const targetLabels = {
  kaoyan: '考研',
  kaogong: '考公考编',
  job: '就业',
  liuxue: '留学',
  general: '通用',
}

const modeOptions = [
  { value: 'chapter', label: '章节练习' },
  { value: 'random', label: '随机练习' },
  { value: 'mock', label: '模拟练习' },
]

const granularityOptions = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
]

function PracticePage() {
  const { token, isAuthed } = useAuth()
  const canUsePractice = Boolean(isAuthed && token && token !== 'dev-token')
  const [filters, setFilters] = useState({
    target: '',
    subject: '',
    chapter: '',
    questionType: '',
    difficulty: '',
    year: '',
  })
  const [mode, setMode] = useState('chapter')
  const [options, setOptions] = useState({})
  const [banks, setBanks] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [granularity, setGranularity] = useState('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadOptions() {
      try {
        const data = await practiceApi.options()
        if (active) setOptions(data || {})
      } catch {
        if (active) setOptions({})
      }
    }
    loadOptions()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadBanks() {
      setLoading(true)
      setError('')
      try {
        const data = await practiceApi.banks(filters)
        if (active) setBanks(data || [])
      } catch (err) {
        if (active) setError(err.message || '加载题库失败')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadBanks()
    return () => {
      active = false
    }
  }, [filters])

  useEffect(() => {
    if (!canUsePractice) {
      setStatistics(null)
      setWrongQuestions([])
      return undefined
    }
    let active = true
    async function loadUserPracticeData() {
      try {
        const [stats, wrongs] = await Promise.all([
          practiceApi.statistics(granularity, token),
          practiceApi.wrongQuestions({
            target: filters.target,
            subject: filters.subject,
            chapter: filters.chapter,
          }, token),
        ])
        if (active) {
          setStatistics(stats)
          setWrongQuestions(wrongs || [])
        }
      } catch {
        if (active) {
          setStatistics(null)
          setWrongQuestions([])
        }
      }
    }
    loadUserPracticeData()
    return () => {
      active = false
    }
  }, [canUsePractice, filters.chapter, filters.subject, filters.target, granularity, token])

  const totalQuestionCount = useMemo(
    () => banks.reduce((sum, bank) => sum + (bank.questionCount || 0), 0),
    [banks],
  )

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function practiceLink(bankId) {
    const params = new URLSearchParams({ mode })
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    return `/practice/${bankId}?${params.toString()}`
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">题目练习</p>
            <h2>题库分类管理 + 多模式练习 + 结果统计反馈</h2>
            <p className="muted">按方向、科目、章节、题型、难度和年份筛选题库，进入章节、随机或模拟练习。</p>
            <div className="nav-links">
              <Link className="btn ghost small" to="/practice/history">练习历史</Link>
              <Link className="btn ghost small" to="/practice/wrong-questions">错题本</Link>
              <Link className="btn ghost small" to="/practice/statistics">统计分析</Link>
            </div>
          </div>

          <div className="grid-two">
            <div className="feature-card">
              <div className="card-title">练习筛选</div>
              <div className="filter-grid">
                <SelectField label="方向" value={filters.target} onChange={(value) => updateFilter('target', value)} options={options.targets || []} labels={targetLabels} />
                <SelectField label="科目" value={filters.subject} onChange={(value) => updateFilter('subject', value)} options={options.subjects || []} />
                <SelectField label="章节" value={filters.chapter} onChange={(value) => updateFilter('chapter', value)} options={options.chapters || []} />
                <SelectField label="题型" value={filters.questionType} onChange={(value) => updateFilter('questionType', value)} options={options.questionTypes || []} labels={{ single: '单选题', multiple: '多选题', judge: '判断题', subjective: '主观题' }} />
                <SelectField label="难度" value={filters.difficulty} onChange={(value) => updateFilter('difficulty', value)} options={options.difficulties || []} labels={{ easy: '基础', middle: '进阶', hard: '冲刺' }} />
                <SelectField label="年份" value={filters.year} onChange={(value) => updateFilter('year', value)} options={(options.years || []).map(String)} />
                <label className="field">
                  <span>练习模式</span>
                  <select value={mode} onChange={(event) => setMode(event.target.value)}>
                    {modeOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="feature-card metrics">
              <div className="card-title">练习概览</div>
              <div className="mini-grid">
                <Metric value={banks.length} label="可练题库" />
                <Metric value={totalQuestionCount} label="匹配题目" />
                <Metric value={statistics?.practiceCount ?? 0} label="已交卷次数" />
              </div>
              {!canUsePractice ? (
                <p className="muted">登录真实测试账号后可保存练习、生成错题本并查看统计。开发栏模拟用户不携带后端有效令牌。</p>
              ) : (
                <p className="muted">当前统计包含练习次数、平均正确率、累计时长和常错知识点。</p>
              )}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">题库列表</p>
            <h2>可用题库</h2>
            {error ? <div className="error-text">{error}</div> : null}
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : banks.length === 0 ? (
            <div className="feature-card">
              <div className="card-title">暂无匹配题库</div>
              <p className="muted">请调整筛选条件，或稍后补充题库数据。</p>
            </div>
          ) : (
            <div className="track-grid">
              {banks.map((bank) => (
                <article className="track-card" key={bank.id}>
                  <div className="track-head">
                    <h3>{bank.name}</h3>
                    <span className="tag subtle">{targetLabels[bank.target] || bank.target}</span>
                  </div>
                  <p className="muted">{bank.description || '支持章节、随机与模拟练习。'}</p>
                  <div className="metric-row">
                    <span>科目 {bank.subject || '-'}</span>
                    <span>题量 {bank.questionCount || 0}</span>
                    <span>章节 {bank.chapterCount || 0}</span>
                  </div>
                  <div className="tag-row">
                    <span className="tag subtle">难度 {bank.difficulty || 'middle'}</span>
                    {(bank.supportedModes || modeOptions.map((item) => item.value)).map((item) => (
                      <span className="tag subtle" key={`${bank.id}-${item}`}>{item}</span>
                    ))}
                  </div>
                  {canUsePractice ? (
                    <Link className="btn outline small" to={practiceLink(bank.id)}>开始练习</Link>
                  ) : (
                    <Link className="btn outline small" to="/login">登录后练习</Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="grid-two">
            <div className="feature-card">
              <div className="track-head">
                <div className="card-title">统计分析</div>
                <div className="track-actions">
                  <select value={granularity} onChange={(event) => setGranularity(event.target.value)}>
                    {granularityOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  <Link className="btn ghost small" to="/practice/statistics">查看详情</Link>
                </div>
              </div>
              <div className="mini-grid">
                <Metric value={`${statistics?.averageAccuracy ?? 0}%`} label="平均正确率" />
                <Metric value={formatDuration(statistics?.totalDurationSeconds || 0)} label="累计时长" />
                <Metric value={statistics?.frequentWrongKnowledgePoints?.length || 0} label="常错知识点" />
              </div>
              <div className="wrong-list">
                {(statistics?.frequentWrongKnowledgePoints || []).slice(0, 5).map((item) => (
                  <div className="wrong-item" key={item.knowledgePoint}>
                    <div className="wrong-title">{item.knowledgePoint}</div>
                    <div className="muted">累计错误 {item.wrongCount} 次</div>
                  </div>
                ))}
                {canUsePractice && !statistics?.frequentWrongKnowledgePoints?.length ? (
                  <p className="muted">暂无统计数据，完成一次练习后会自动生成。</p>
                ) : null}
              </div>
            </div>

            <div className="feature-card">
              <div className="track-head">
                <div className="card-title">错题本</div>
                <Link className="btn ghost small" to="/practice/wrong-questions">查看详情</Link>
              </div>
              <div className="wrong-list">
                {wrongQuestions.slice(0, 6).map((item) => (
                  <div className="wrong-item" key={item.id}>
                    <div className="wrong-title">{item.stem}</div>
                    <div className="muted">{item.subject} / {item.chapter} / 错误 {item.wrongCount} 次</div>
                  </div>
                ))}
                {canUsePractice && wrongQuestions.length === 0 ? (
                  <p className="muted">暂无错题。交卷后系统会自动收集客观题错题。</p>
                ) : null}
                {!canUsePractice ? <p className="muted">登录后查看个人错题本。</p> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function SelectField({ label, value, onChange, options, labels = {} }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option} value={option}>{labels[option] || option}</option>
        ))}
      </select>
    </label>
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

export default PracticePage
