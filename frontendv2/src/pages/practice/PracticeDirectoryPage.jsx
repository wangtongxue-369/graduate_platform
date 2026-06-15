import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeFilterSidebar from '@/components/practice/PracticeFilterSidebar.jsx'
import PracticeBankCard from '@/components/practice/PracticeBankCard.jsx'

const targetLabelMap = {
  kaoyan: '考研',
  kaogong: '考公',
  job: '就业',
  liuxue: '留学',
}

const difficultyLabelMap = {
  easy: '基础',
  middle: '进阶',
  hard: '冲刺',
}

const defaultFilters = {
  target: '',
  subject: '',
  chapter: '',
  questionType: '',
  difficulty: '',
  year: '',
}

const defaultOptions = {
  targets: [],
  subjects: [],
  chapters: [],
  questionTypes: [],
  difficulties: [],
  years: [],
}

const emptySummary = {
  historyCount: 0,
  wrongCount: 0,
  practiceCount: 0,
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

export default function PracticeDirectoryPage() {
  const { isAuthed, token } = useAuth()
  const [filters, setFilters] = useState(defaultFilters)
  const [options, setOptions] = useState(defaultOptions)
  const [banks, setBanks] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadOptions() {
      try {
        const data = await practiceApi.options()
        if (!active) return
        setOptions(data || defaultOptions)
      } catch {
        if (!active) return
        setOptions(defaultOptions)
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
      try {
        const data = await practiceApi.banks(filters)
        if (!active) return
        setBanks(Array.isArray(data) ? data : [])
        setMessage('')
      } catch (error) {
        if (!active) return
        setBanks([])
        setMessage(error.message || '题库目录暂时不可用。')
      }
    }

    loadBanks()
    return () => {
      active = false
    }
  }, [filters])

  useEffect(() => {
    if (!isAuthed || !token || token === 'dev-token') {
      setSummary(emptySummary)
      return undefined
    }

    let active = true

    async function loadSummary() {
      try {
        const [history, wrongs, stats] = await Promise.all([
          practiceApi.history({ page: 1, size: 3 }, token),
          practiceApi.wrongQuestions({ page: 0, size: 3 }, token),
          practiceApi.statistics('day', token),
        ])

        if (!active) return
        setSummary({
          historyCount: history?.total ?? history?.totalElements ?? history?.items?.length ?? 0,
          wrongCount: wrongs?.total ?? wrongs?.totalElements ?? wrongs?.items?.length ?? 0,
          practiceCount: stats?.practiceCount ?? 0,
        })
      } catch {
        if (!active) return
        setSummary(emptySummary)
      }
    }

    loadSummary()
    return () => {
      active = false
    }
  }, [isAuthed, token])

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function resetFilters() {
    setFilters(defaultFilters)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="Atlas Loop"
          title="先选题库，再进入独立练习回路。"
          lead="目录页只做发现和分流，把练习会话、历史、统计、错题拆成独立页面，减少首页噪音。"
          actions={(
            <div className="v2-inline-actions">
              <Link className="v2-secondary-link" to="/practice/history">练习历史</Link>
              <Link className="v2-secondary-link" to="/practice/wrong-questions">错题回练</Link>
              <Link className="v2-secondary-link" to="/practice/statistics">练习统计</Link>
            </div>
          )}
        />

        <section className="v2-summary-strip" aria-label="题库概览">
          <article className="v2-summary-card">
            <span>匹配题库</span>
            <strong>{banks.length}</strong>
            <p>按方向、科目和章节分流到具体题库。</p>
          </article>
          <article className="v2-summary-card">
            <span>今日练习</span>
            <strong>{summary.practiceCount}</strong>
            <p>登录后会同步显示你当天的训练场次。</p>
          </article>
          <article className="v2-summary-card">
            <span>待回练错题</span>
            <strong>{summary.wrongCount}</strong>
            <p>错题会单独沉淀到回练页，不挤在目录里。</p>
          </article>
        </section>

        {message ? <div className="v2-status-note">{message}</div> : null}

        <section className="v2-article-card v2-practice-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">题库分发</p>
              <h3>用卡片而不是长表格做题库入口</h3>
            </div>
          </div>

          {banks.length ? (
            <div className="v2-practice-bank-grid">
              {banks.map((bank) => (
                <PracticeBankCard key={bank.id} bank={bank} />
              ))}
            </div>
          ) : (
            <div className="v2-empty-card">当前筛选条件下暂无题库。</div>
          )}
        </section>

        <section className="v2-article-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">后续路径</p>
              <h3>从题库跳进模式页，再进入练习会话</h3>
            </div>
          </div>
          <div className="v2-check-list">
            <article className="v2-check-row">
              <strong>目录页</strong>
              <span>公开浏览题库，游客可见。</span>
            </article>
            <article className="v2-check-row">
              <strong>题库详情</strong>
              <span>预览题目、挑选模式、配置筛选条件。</span>
            </article>
            <article className="v2-check-row">
              <strong>会话页</strong>
              <span>登录后进入答题、保存、交卷和讲评闭环。</span>
            </article>
            <article className="v2-check-row">
              <strong>分析页</strong>
              <span>历史、统计、错题各自独立，不再塞进首页。</span>
            </article>
          </div>
        </section>
      </div>

      <PracticeFilterSidebar
        title="筛选题库"
        fields={(
          <>
            <SelectField
              label="方向"
              value={filters.target}
              onChange={(value) => updateFilter('target', value)}
              options={options.targets}
              labels={targetLabelMap}
            />
            <SelectField
              label="科目"
              value={filters.subject}
              onChange={(value) => updateFilter('subject', value)}
              options={options.subjects}
            />
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
              options={options.years.map(String)}
            />
          </>
        )}
        note="游客可以浏览目录和题库详情；开始练习、查看历史与错题需要登录。"
        actions={(
          <>
            <button className="v2-primary-link" type="button" onClick={resetFilters}>重置筛选</button>
            {!isAuthed ? <Link className="v2-secondary-link" to="/login">登录后继续</Link> : null}
          </>
        )}
      />
    </>
  )
}
