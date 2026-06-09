import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import { countryLabelMap, countryOptions, createLocalId } from './studyAbroadUtils.js'
import '../../App.css'

const countries = ['all', ...countryOptions.filter((item) => item.value !== 'General').map((item) => item.value)]

const resultOptions = [
  { value: 'all', label: '全部结果' },
  { value: 'admit', label: '录取' },
  { value: 'reject', label: '拒信' },
  { value: 'waitlist', label: '候补' },
]

const resultLabelMap = Object.fromEntries(resultOptions.map((item) => [item.value, item.label]))

const emptyForm = {
  applicationYear: '2026',
  studentMajor: '',
  gpa: '',
  rankPercent: '',
  languageType: 'IELTS',
  languageScore: '',
  standardizedScore: '',
  softBackground: '',
  country: 'UK',
  school: '',
  program: '',
  degree: 'Master',
  admissionResult: 'admit',
  scholarship: '',
  applicationMode: 'DIY',
  tags: '',
  summary: '',
}

const demoCases = [
  {
    id: 'case-ucl-cs',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '计算机科学',
    gpa: '3.72/4.0',
    rankPercent: '前 20%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: 'GRE 324',
    softBackground: '一段科研项目、两段开发实习、一次数学建模竞赛。',
    country: 'UK',
    school: '伦敦大学学院',
    program: 'Computer Science MSc',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: 'DIY',
    tags: ['低科研', 'DIY', 'CS'],
    summary: '课程匹配和项目经历写得比较具体，PS 没有只重复简历，是这次申请里比较关键的一点。',
  },
  {
    id: 'case-hkust-ds',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '软件工程',
    gpa: '88/100',
    rankPercent: '前 15%',
    languageType: 'TOEFL',
    languageScore: '101',
    standardizedScore: '无',
    softBackground: '校内大创、互联网产品实习、数据库课程项目。',
    country: 'Hong Kong',
    school: '香港科技大学',
    program: 'Data-Driven Modeling MSc',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: '中介申请',
    tags: ['港新', '数据方向', '实习突出'],
    summary: '港校比较看重递交节奏和材料完整度，提前准备成绩单和推荐信能减少后期压力。',
  },
  {
    id: 'case-nus-ai',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '人工智能',
    gpa: '3.48/4.0',
    rankPercent: '前 35%',
    languageType: 'IELTS',
    languageScore: '6.5',
    standardizedScore: '无',
    softBackground: '一段算法实习、两个课程项目，无论文。',
    country: 'Singapore',
    school: '新加坡国立大学',
    program: 'Artificial Intelligence MSc',
    degree: 'Master',
    admissionResult: 'reject',
    scholarship: '无',
    applicationMode: 'DIY',
    tags: ['拒信复盘', '语言偏弱', 'AI'],
    summary: '语言和 GPA 都没有优势时，单靠课程项目比较吃亏，建议补强可量化项目或扩大匹配院校范围。',
  },
]

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags
  if (!tags) return []
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}

function resultClass(result) {
  if (result === 'admit') return 'done'
  if (result === 'reject') return 'danger'
  return 'warning'
}

export default function AdmissionCasesPage() {
  const { token, user } = useAuth()
  const isDevMode = token === 'dev-token'
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const [cases, setCases] = useState([])
  const [filters, setFilters] = useState({ country: 'all', result: 'all', major: '', keyword: '' })
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [localCases, setLocalCases] = useState(demoCases)

  const remoteFilters = useMemo(() => ({
    country: filters.country,
    result: filters.result,
    major: filters.major.trim(),
    keyword: filters.keyword.trim(),
  }), [filters.country, filters.keyword, filters.major, filters.result])

  useEffect(() => {
    setPage(0)
  }, [remoteFilters])

  useEffect(() => {
    let active = true

    async function loadCases() {
      setLoading(true)
      try {
        const data = await studyAbroadApi.admissionCasesPage({ ...remoteFilters, page, size: 6 })
        if (!active) return
        setCases(data.content || [])
        setPageInfo({
          page: data.page ?? page,
          size: data.size ?? 6,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || 0,
        })
        setNotice('录取案例库来自后端公开接口，未登录也可以浏览。')
      } catch (error) {
        if (!active) return
        if (isDevMode) {
          setCases(localCases)
          setPageInfo({ page: 0, size: localCases.length, totalPages: 1, totalElements: localCases.length })
          setNotice('后端案例库暂不可用，当前展示本地演示案例。')
        } else {
          setCases([])
          setPageInfo({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
          setNotice(error.message || '录取案例加载失败，请稍后重试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [isDevMode, localCases, page, remoteFilters])

  const visibleCases = useMemo(() => {
    if (!isDevMode) return cases
    const major = filters.major.trim().toLowerCase()
    const keyword = filters.keyword.trim().toLowerCase()
    return cases.filter((item) => {
      const text = `${item.school} ${item.program} ${item.studentMajor} ${normalizeTags(item.tags).join(' ')}`.toLowerCase()
      return (filters.country === 'all' || item.country === filters.country)
        && (filters.result === 'all' || item.admissionResult === filters.result)
        && (!major || String(item.studentMajor || '').toLowerCase().includes(major))
        && (!keyword || text.includes(keyword))
    })
  }, [cases, filters.country, filters.keyword, filters.major, filters.result, isDevMode])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function canDeleteCase(item) {
    return isDevMode || (canUseRemote && user?.id != null && String(item.authorId) === String(user.id))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    )
    const requiredFields = ['applicationYear', 'studentMajor', 'gpa', 'languageType', 'languageScore', 'country', 'school', 'program', 'degree', 'admissionResult', 'summary']
    if (requiredFields.some((key) => !payload[key])) {
      setNotice('请补全申请年份、背景、成绩、录取学校和案例总结。')
      return
    }

    try {
      if (canUseRemote) {
        const saved = await studyAbroadApi.createAdmissionCase(payload, token)
        setCases((current) => [saved, ...current])
        setPageInfo((current) => ({ ...current, totalElements: current.totalElements + 1 }))
        setNotice('录取案例已匿名发布到后端案例库。')
      } else if (isDevMode) {
        const saved = { ...payload, id: createLocalId('case'), authorId: null, tags: normalizeTags(payload.tags) }
        setLocalCases((current) => [saved, ...current])
        setCases((current) => [saved, ...current])
        setPageInfo((current) => ({ ...current, totalElements: current.totalElements + 1 }))
        setNotice('本地演示案例已创建，正式发布需要登录真实账号。')
      } else {
        setNotice('请先登录，再匿名提交自己的录取或拒信案例。')
        return
      }
      setForm(emptyForm)
    } catch (error) {
      setNotice(error.message || '案例保存失败，请稍后重试。')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('确认删除这条录取案例吗？')) return
    try {
      if (canUseRemote) {
        await studyAbroadApi.deleteAdmissionCase(id, token)
      }
      setCases((current) => current.filter((item) => item.id !== id))
      setLocalCases((current) => current.filter((item) => item.id !== id))
      setPageInfo((current) => ({ ...current, totalElements: Math.max(0, current.totalElements - 1) }))
      setNotice('录取案例已删除。')
    } catch (error) {
      setNotice(error.message || '删除失败，只能删除自己提交的案例。')
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section admission-page">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 录取案例库</p>
              <h2>匿名校友录取案例库</h2>
              <p className="muted">按国家、结果、专业背景和关键词筛选真实申请结果，帮助学生做选校定位和风险判断。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="feature-card admission-filters">
            <div className="filter-grid">
              <label className="field">
                <span>国家 / 地区</span>
                <select value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })}>
                  {countries.map((item) => (
                    <option key={item} value={item}>{item === 'all' ? '全部国家' : countryLabelMap[item] || item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>申请结果</span>
                <select value={filters.result} onChange={(event) => setFilters({ ...filters, result: event.target.value })}>
                  {resultOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>本科专业</span>
                <input value={filters.major} placeholder="例如：计算机、软件工程、金融" onChange={(event) => setFilters({ ...filters, major: event.target.value })} />
              </label>
              <label className="field">
                <span>关键词</span>
                <input value={filters.keyword} placeholder="学校、项目、标签" onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
              </label>
            </div>
          </div>

          {notice ? (
            <div className="notice-box">
              <strong>案例库状态</strong>
              <p className="muted">{notice}</p>
            </div>
          ) : null}

          <div className="track-grid admission-grid">
            {visibleCases.map((item) => (
              <article className="track-card admission-card" key={item.id}>
                <div className="track-head">
                  <h3>{item.school}</h3>
                  <span className={`study-status ${resultClass(item.admissionResult)}`}>
                    {resultLabelMap[item.admissionResult] || item.admissionResult}
                  </span>
                </div>
                <p className="muted">{item.program} / {item.degree} / {item.applicationYear}</p>
                <div className="case-profile">
                  <span>{item.studentMajor}</span>
                  <span>GPA {item.gpa}</span>
                  <span>{item.languageType} {item.languageScore}</span>
                  <span>{item.standardizedScore || '无标化'}</span>
                </div>
                <p className="muted">{item.summary}</p>
                <div className="case-soft">
                  <strong>软背景</strong>
                  <span>{item.softBackground || '暂未补充'}</span>
                </div>
                <div className="tag-row">
                  <span className="tag subtle">{countryLabelMap[item.country] || item.country}</span>
                  <span className="tag subtle">{item.applicationMode || '匿名分享'}</span>
                  {normalizeTags(item.tags).map((tag) => (
                    <span className="tag subtle" key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="detail-meta">
                  <span>排名 {item.rankPercent || '未填写'}</span>
                  <span>奖学金 {item.scholarship || '未说明'}</span>
                </div>
                {canDeleteCase(item) ? (
                  <div className="hero-actions experience-card-actions">
                    <button className="btn outline small" type="button" onClick={() => handleDelete(item.id)}>删除案例</button>
                  </div>
                ) : null}
              </article>
            ))}
            {loading ? (
              <div className="notice-box"><p className="muted">正在加载录取案例...</p></div>
            ) : null}
            {!loading && !visibleCases.length ? (
              <div className="feature-card soft">
                <div className="card-title">暂无匹配案例</div>
                <p className="muted">可以放宽筛选条件，或登录后提交第一条本校留学申请案例。</p>
              </div>
            ) : null}
          </div>

          <div className="pagination">
            <span className="pagination-count">共 {pageInfo.totalElements} 条，第 {pageInfo.page + 1} / {pageInfo.totalPages} 页</span>
            <div className="pagination-actions">
              <button className="btn outline small" type="button" disabled={page <= 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
              <button className="btn outline small" type="button" disabled={page + 1 >= pageInfo.totalPages} onClick={() => setPage((current) => current + 1)}>下一页</button>
            </div>
          </div>

          <form className="feature-card admission-form" onSubmit={handleSubmit}>
            <div className="section-head compact">
              <h2>匿名提交录取 / 拒信案例</h2>
              <span className="tag subtle">{canUseRemote ? '后端保存' : isDevMode ? '本地演示' : '登录后提交'}</span>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>申请年份</span>
                <input value={form.applicationYear} onChange={(event) => updateForm('applicationYear', event.target.value)} />
              </label>
              <label className="field">
                <span>本科专业</span>
                <input value={form.studentMajor} onChange={(event) => updateForm('studentMajor', event.target.value)} />
              </label>
              <label className="field">
                <span>GPA / 均分</span>
                <input value={form.gpa} placeholder="例如：3.6/4.0 或 86/100" onChange={(event) => updateForm('gpa', event.target.value)} />
              </label>
              <label className="field">
                <span>排名区间</span>
                <input value={form.rankPercent} placeholder="例如：前 20%" onChange={(event) => updateForm('rankPercent', event.target.value)} />
              </label>
              <label className="field">
                <span>语言类型</span>
                <select value={form.languageType} onChange={(event) => updateForm('languageType', event.target.value)}>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="Duolingo">Duolingo</option>
                  <option value="Other">其他</option>
                </select>
              </label>
              <label className="field">
                <span>语言成绩</span>
                <input value={form.languageScore} placeholder="例如：7.0 / 101" onChange={(event) => updateForm('languageScore', event.target.value)} />
              </label>
              <label className="field">
                <span>GRE / GMAT</span>
                <input value={form.standardizedScore} placeholder="没有可留空" onChange={(event) => updateForm('standardizedScore', event.target.value)} />
              </label>
              <label className="field">
                <span>国家 / 地区</span>
                <select value={form.country} onChange={(event) => updateForm('country', event.target.value)}>
                  {countries.slice(1).map((item) => (
                    <option key={item} value={item}>{countryLabelMap[item] || item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>学校名称</span>
                <input value={form.school} onChange={(event) => updateForm('school', event.target.value)} />
              </label>
              <label className="field">
                <span>项目名称</span>
                <input value={form.program} onChange={(event) => updateForm('program', event.target.value)} />
              </label>
              <label className="field">
                <span>学位</span>
                <select value={form.degree} onChange={(event) => updateForm('degree', event.target.value)}>
                  <option value="Master">硕士</option>
                  <option value="PhD">博士</option>
                  <option value="Bachelor">本科</option>
                  <option value="Exchange">交换</option>
                </select>
              </label>
              <label className="field">
                <span>申请结果</span>
                <select value={form.admissionResult} onChange={(event) => updateForm('admissionResult', event.target.value)}>
                  {resultOptions.slice(1).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>奖学金</span>
                <input value={form.scholarship} placeholder="例如：无 / 半奖 / 全奖" onChange={(event) => updateForm('scholarship', event.target.value)} />
              </label>
              <label className="field">
                <span>申请方式</span>
                <select value={form.applicationMode} onChange={(event) => updateForm('applicationMode', event.target.value)}>
                  <option value="DIY">DIY</option>
                  <option value="中介申请">中介申请</option>
                  <option value="合作项目">合作项目</option>
                </select>
              </label>
              <label className="field">
                <span>标签</span>
                <input value={form.tags} placeholder="低 GPA 逆袭, 跨专业, 全奖" onChange={(event) => updateForm('tags', event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>软背景</span>
              <textarea rows="3" value={form.softBackground} placeholder="科研、实习、竞赛、交换经历等" onChange={(event) => updateForm('softBackground', event.target.value)} />
            </label>
            <label className="field">
              <span>案例总结</span>
              <textarea rows="3" value={form.summary} placeholder="这次申请最关键的优势、遗憾或建议" onChange={(event) => updateForm('summary', event.target.value)} />
            </label>
            <div className="hero-actions">
              <button className="btn primary" type="submit" disabled={!canUseRemote && !isDevMode}>提交案例</button>
              {!canUseRemote && !isDevMode ? <Link className="btn outline" to="/login">去登录</Link> : null}
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}
