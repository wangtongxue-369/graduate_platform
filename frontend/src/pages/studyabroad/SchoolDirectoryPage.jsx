import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import { countryLabelMap, countryOptions } from './studyAbroadUtils.js'
import '../../App.css'

const countries = ['all', ...countryOptions.filter((item) => item.value !== 'General').map((item) => item.value)]

const subjectOptions = [
  { value: 'all', label: '全部方向' },
  { value: '计算机与数据', label: '计算机与数据' },
  { value: '商科与管理', label: '商科与管理' },
  { value: '工程技术', label: '工程技术' },
  { value: '传媒与设计', label: '传媒与设计' },
  { value: '教育与社科', label: '教育与社科' },
  { value: '信息管理', label: '信息管理' },
]

const demoPrograms = [
  {
    id: 'demo-ucl-cs',
    country: 'UK',
    schoolName: 'University College London',
    programName: 'Computer Science MSc',
    degree: 'Master',
    subjectArea: '计算机与数据',
    qsRank: 'QS 2026: Top 10',
    theRank: 'THE: Top 30',
    usNewsRank: 'USNews: Top 20',
    tuitionRange: '约 GBP 35k-45k/年',
    durationText: '1 年',
    deadlineText: '常见为 10 月至次年 4 月滚动/分轮',
    applicationRequirements: '本科相关专业，成绩单、语言成绩、PS、推荐信，部分项目看重编程和数学背景。',
    visaPolicy: '英国学生签证通常需要 CAS、资金证明、语言证明和肺结核检测等材料。',
    employmentPolicy: '毕业生签证路径通常允许毕业后在英停留求职，具体以官方政策为准。',
    partnerProgram: true,
    partnerNote: '与本校计算机学院有交换/暑研合作记录',
    riskTags: ['竞争激烈', '学费高', '住宿紧张'],
    riskSummary: '热门项目申请量大，建议准备保底项目。',
    sourceNote: '演示数据，正式使用时应由管理员按院校官网更新。',
    policyUpdatedAt: '2026-06-01',
  },
  {
    id: 'demo-hku-cs',
    country: 'Hong Kong',
    schoolName: 'The University of Hong Kong',
    programName: 'MSc Computer Science',
    degree: 'Master',
    subjectArea: '计算机与数据',
    qsRank: 'QS 2026: Top 20',
    theRank: 'THE: Top 40',
    usNewsRank: 'USNews: Top 50',
    tuitionRange: '约 HKD 220k-320k/项目',
    durationText: '1 年',
    deadlineText: '常见为 12 月至次年 4 月分轮',
    applicationRequirements: '本科相关专业、语言成绩、成绩单、推荐信，热门方向重视项目和实习。',
    visaPolicy: '香港学生签注通常由学校协助办理，需录取文件、身份材料和资金证明。',
    employmentPolicy: '毕业生通常可关注 IANG 等留港就业安排，具体以入境处政策为准。',
    partnerProgram: true,
    partnerNote: '与本校有联合讲座和校友推荐资源',
    riskTags: ['轮次紧', '热门方向竞争大'],
    riskSummary: '适合希望离内地近、求职节奏快的学生。',
    sourceNote: '演示数据，正式使用时应由管理员按院校官网更新。',
    policyUpdatedAt: '2026-06-01',
  },
  {
    id: 'demo-nus-ai',
    country: 'Singapore',
    schoolName: 'National University of Singapore',
    programName: 'MSc Artificial Intelligence',
    degree: 'Master',
    subjectArea: '计算机与数据',
    qsRank: 'QS 2026: Top 10',
    theRank: 'THE: Top 20',
    usNewsRank: 'USNews: Top 30',
    tuitionRange: '约 SGD 55k-75k/项目',
    durationText: '1 年',
    deadlineText: '常见为 1 月至 3 月',
    applicationRequirements: '要求较强数学、编程和 AI/数据项目背景，语言成绩和推荐信重要。',
    visaPolicy: '新加坡学生准证通常在录取后按学校指引办理。',
    employmentPolicy: '新加坡科技岗位集中，但竞争强，需提前准备实习和项目展示。',
    partnerProgram: false,
    partnerNote: '暂无本校合作标记',
    riskTags: ['门槛高', '项目密集', '就业竞争'],
    riskSummary: '适合背景扎实、目标明确的学生。',
    sourceNote: '演示数据，正式使用时应由管理员按院校官网更新。',
    policyUpdatedAt: '2026-06-01',
  },
]

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags
  if (!tags) return []
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}

export default function SchoolDirectoryPage() {
  const [programs, setPrograms] = useState([])
  const [filters, setFilters] = useState({ country: 'all', subjectArea: 'all', partnerOnly: false, keyword: '' })
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const remoteFilters = useMemo(() => ({
    country: filters.country,
    subjectArea: filters.subjectArea,
    partnerOnly: filters.partnerOnly ? true : undefined,
    keyword: filters.keyword.trim(),
  }), [filters.country, filters.keyword, filters.partnerOnly, filters.subjectArea])

  useEffect(() => {
    setPage(0)
  }, [remoteFilters])

  useEffect(() => {
    let active = true

    async function loadPrograms() {
      setLoading(true)
      try {
        const data = await studyAbroadApi.schoolProgramsPage({ ...remoteFilters, page, size: 6 })
        if (!active) return
        const content = data.content || []
        setPrograms(content.length ? content : demoPrograms)
        setPageInfo({
          page: data.page ?? page,
          size: data.size ?? 6,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || content.length || demoPrograms.length,
        })
        setNotice(content.length
          ? '院校项目库来自后端公开接口，未登录也可以浏览。'
          : '后端暂无院校项目数据，当前展示前端演示样例。')
      } catch (error) {
        if (!active) return
        setPrograms(demoPrograms)
        setPageInfo({ page: 0, size: demoPrograms.length, totalPages: 1, totalElements: demoPrograms.length })
        setNotice(error.message || '院校库接口暂不可用，当前展示演示样例。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPrograms()
    return () => {
      active = false
    }
  }, [page, remoteFilters])

  const visiblePrograms = useMemo(() => {
    if (programs !== demoPrograms) return programs
    const keyword = filters.keyword.trim().toLowerCase()
    return programs.filter((item) => {
      const text = `${item.schoolName} ${item.programName} ${item.applicationRequirements} ${normalizeTags(item.riskTags).join(' ')}`.toLowerCase()
      return (filters.country === 'all' || item.country === filters.country)
        && (filters.subjectArea === 'all' || item.subjectArea === filters.subjectArea)
        && (!filters.partnerOnly || item.partnerProgram)
        && (!keyword || text.includes(keyword))
    })
  }, [filters.country, filters.keyword, filters.partnerOnly, filters.subjectArea, programs])

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section school-directory-page">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 院校项目库</p>
              <h2>全球院校项目库</h2>
              <p className="muted">按国家、专业方向和本校合作项目筛选院校，集中查看排名、学费、要求、截止日期、签证就业政策和避雷提示。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="feature-card directory-filters">
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
                <span>专业方向</span>
                <select value={filters.subjectArea} onChange={(event) => setFilters({ ...filters, subjectArea: event.target.value })}>
                  {subjectOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>关键词</span>
                <input
                  value={filters.keyword}
                  placeholder="学校、项目、申请要求、避雷标签"
                  onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
                />
              </label>
              <label className="field check-field">
                <span>本校合作</span>
                <label className="study-check inline">
                  <input
                    type="checkbox"
                    checked={filters.partnerOnly}
                    onChange={(event) => setFilters({ ...filters, partnerOnly: event.target.checked })}
                  />
                  <span>只看合作项目</span>
                </label>
              </label>
            </div>
          </div>

          {notice ? (
            <div className="notice-box">
              <strong>数据说明</strong>
              <p className="muted">{notice}</p>
            </div>
          ) : null}

          <div className="school-program-list">
            {visiblePrograms.map((item) => (
              <article className="feature-card school-program-card" key={item.id}>
                <div className="track-head">
                  <div>
                    <span className="tag subtle">{countryLabelMap[item.country] || item.country}</span>
                    <h3>{item.schoolName}</h3>
                  </div>
                  {item.partnerProgram ? <span className="tag done">本校合作</span> : <span className="tag subtle">公开项目</span>}
                </div>
                <div className="program-title">
                  <strong>{item.programName}</strong>
                  <span>{item.degree} / {item.subjectArea}</span>
                </div>
                <div className="directory-metrics">
                  <span>{item.qsRank || 'QS 未录入'}</span>
                  <span>{item.theRank || 'THE 未录入'}</span>
                  <span>{item.usNewsRank || 'USNews 未录入'}</span>
                  <span>{item.tuitionRange || '学费待更新'}</span>
                  <span>{item.durationText || '学制待更新'}</span>
                  <span>{item.deadlineText || '截止日期待更新'}</span>
                </div>
                <div className="directory-info-grid">
                  <div>
                    <strong>申请要求</strong>
                    <p>{item.applicationRequirements || '暂未录入'}</p>
                  </div>
                  <div>
                    <strong>签证政策</strong>
                    <p>{item.visaPolicy || '暂未录入'}</p>
                  </div>
                  <div>
                    <strong>就业政策</strong>
                    <p>{item.employmentPolicy || '暂未录入'}</p>
                  </div>
                  <div>
                    <strong>本校合作</strong>
                    <p>{item.partnerNote || '暂无合作标记'}</p>
                  </div>
                </div>
                <div className="risk-panel">
                  <div className="tag-row">
                    {normalizeTags(item.riskTags).map((tag) => (
                      <span className="tag warning" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <p className="muted">{item.riskSummary || '暂无避雷信息。'}</p>
                </div>
                <div className="detail-meta">
                  <span>政策更新时间：{item.policyUpdatedAt || '待维护'}</span>
                  <span>{item.sourceNote || '数据来源待维护'}</span>
                </div>
              </article>
            ))}
            {loading ? (
              <div className="notice-box"><p className="muted">正在加载院校项目...</p></div>
            ) : null}
            {!loading && !visiblePrograms.length ? (
              <div className="feature-card soft">
                <div className="card-title">暂无匹配院校项目</div>
                <p className="muted">可以放宽筛选条件，或后续由管理员补充更多院校与项目数据。</p>
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

          <div className="cta study-cta">
            <div>
              <h2>想看同背景录取结果？</h2>
              <p className="muted">院校库适合初筛项目，录取案例库适合进一步判断自己的背景匹配度。</p>
            </div>
            <Link className="btn primary" to="/studyabroad/admission-cases">查看录取案例</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
