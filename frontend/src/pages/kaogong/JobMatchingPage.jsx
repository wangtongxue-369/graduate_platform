import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { pageItems, totalPages } from '../../components/paginationUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { kaogongApi } from '../../lib/api.js'
import '../../App.css'

const initialForm = {
  education: '本科',
  degree: '学士',
  major: '计算机科学',
  region: '北京',
  household: '',
  politicalStatus: '',
  jobCategory: '',
  unitType: '',
}

const JOB_PAGE_SIZE = 6

export default function JobMatchingPage() {
  const { token, isAuthed } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [jobs, setJobs] = useState([])
  const [favorites, setFavorites] = useState([])
  const [histories, setHistories] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [jobPage, setJobPage] = useState(1)

  useEffect(() => {
    handleMatch()
    if (isAuthed && token && token !== 'dev-token') {
      kaogongApi.favoriteJobs(token).then(setFavorites).catch(() => {})
      kaogongApi.jobMatchHistory(token).then(setHistories).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function getRealToken() {
    return token && token !== 'dev-token' ? token : localStorage.getItem('gp_token')
  }

  async function handleMatch(event) {
    event?.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const realToken = getRealToken()
      const data = await kaogongApi.matchJobs(form, realToken && realToken !== 'dev-token' ? realToken : undefined)
      setJobs(data || [])
      setJobPage(1)
      if (realToken && realToken !== 'dev-token') {
        const historyData = await kaogongApi.jobMatchHistory(realToken).catch(() => [])
        setHistories(historyData || [])
      }
      if (!data?.length) setMessage('暂无匹配岗位，可以放宽地区、专业或政治面貌条件。')
    } catch (err) {
      setMessage(err.message || '岗位匹配失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleFavorite(id) {
    const realToken = getRealToken()
    if (!isAuthed || !realToken || realToken === 'dev-token') {
      setMessage('请先用真实账号登录后收藏岗位。请确认当前访问地址和登录地址一致，例如都使用 http://127.0.0.1:5173。')
      return
    }
    try {
      if (favoriteIds.has(id)) {
        await kaogongApi.unfavoriteJob(id, realToken)
        setMessage('已取消收藏。')
      } else {
        await kaogongApi.favoriteJob(id, realToken)
        setMessage('岗位已收藏。')
      }
      const data = await kaogongApi.favoriteJobs(realToken)
      setFavorites(data || [])
    } catch (err) {
      setMessage(err.message || '操作失败')
    }
  }

  const favoriteIds = new Set(favorites.map((item) => item.id))
  const jobTotalPages = totalPages(jobs, JOB_PAGE_SIZE)
  const visibleJobs = pageItems(jobs, jobPage, JOB_PAGE_SIZE)

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <Link className="page-back" to="/kaogong">‹ 返回</Link>
          <div className="section-head">
            <p className="eyebrow">考公考编 · 岗位匹配</p>
            <h2>智能岗位匹配</h2>
            <p className="muted">根据学历、专业、地区、户籍/生源地、政治面貌等条件筛选可报考岗位，并给出匹配理由。</p>
          </div>

          <div className="grid-two">
            <form className="feature-card" onSubmit={handleMatch}>
              <div className="card-title">匹配条件</div>
              <div className="form-grid">
                <label className="field">
                  <span>学历</span>
                  <select value={form.education} onChange={(event) => updateField('education', event.target.value)}>
                    <option value="">不限</option>
                    <option>大专</option>
                    <option>本科</option>
                    <option>硕士</option>
                    <option>博士</option>
                  </select>
                </label>
                <label className="field">
                  <span>学位</span>
                  <select value={form.degree} onChange={(event) => updateField('degree', event.target.value)}>
                    <option value="">不限</option>
                    <option>学士</option>
                    <option>硕士</option>
                    <option>博士</option>
                  </select>
                </label>
                <label className="field">
                  <span>专业</span>
                  <input value={form.major} onChange={(event) => updateField('major', event.target.value)} placeholder="如：计算机科学" />
                </label>
                <label className="field">
                  <span>地区偏好</span>
                  <input value={form.region} onChange={(event) => updateField('region', event.target.value)} placeholder="如：北京/上海/江苏" />
                </label>
                <label className="field">
                  <span>户籍/生源地</span>
                  <input value={form.household} onChange={(event) => updateField('household', event.target.value)} placeholder="如：上海生源" />
                </label>
                <label className="field">
                  <span>政治面貌</span>
                  <select value={form.politicalStatus} onChange={(event) => updateField('politicalStatus', event.target.value)}>
                    <option value="">不限</option>
                    <option>中共党员</option>
                    <option>共青团员</option>
                    <option>群众</option>
                  </select>
                </label>
                <label className="field">
                  <span>岗位类别</span>
                  <select value={form.jobCategory} onChange={(event) => updateField('jobCategory', event.target.value)}>
                    <option value="">不限</option>
                    <option>综合管理</option>
                    <option>行政执法</option>
                    <option>专业技术</option>
                  </select>
                </label>
                <label className="field">
                  <span>单位类型</span>
                  <select value={form.unitType} onChange={(event) => updateField('unitType', event.target.value)}>
                    <option value="">不限</option>
                    <option>中央机关直属机构</option>
                    <option>地方机关</option>
                    <option>事业单位</option>
                  </select>
                </label>
              </div>
              <button className="btn primary" type="submit" disabled={loading}>{loading ? '匹配中...' : '开始匹配'}</button>
              {message ? <div className="muted">{message}</div> : null}
            </form>

            <div className="feature-card metrics">
              <div className="card-title">匹配概览</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{jobs.length}</div>
                  <div className="mini-label">匹配岗位</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{favorites.length}</div>
                  <div className="mini-label">已收藏</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{jobs[0]?.matchScore || 0}</div>
                  <div className="mini-label">最高匹配度</div>
                </div>
              </div>
              <p className="muted">匹配规则优先过滤硬性条件，再按地区、专业、岗位类别、单位类型等维度生成匹配度。</p>
              <div className="notice-box compact">
                <strong>最近匹配</strong>
                {histories.length === 0 ? (
                  <p className="muted">真实账号匹配后会保存最近 10 次记录。</p>
                ) : (
                  histories.slice(0, 3).map((history) => (
                    <p className="muted" key={history.id}>
                      {formatDateTime(history.createdAt)}，匹配到 {history.resultCount} 个岗位
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">匹配结果</p>
            <h2>可参考岗位</h2>
          </div>
          <div className="track-grid">
            {visibleJobs.map((job) => (
              <article className="track-card" key={job.id}>
                <div className="track-head">
                  <h3>{job.jobName}</h3>
                  <span className="tag subtle">{job.matchScore}%</span>
                </div>
                <p className="muted">{job.recruitingUnit}</p>
                <div className="metric-row">
                  <span>{job.region}</span>
                  <span>{job.examType}</span>
                  <span>招 {job.recruitCount} 人</span>
                </div>
                <div className="metric-row">
                  <span>学历：{job.educationRequirement}</span>
                  <span>专业：{job.majorRequirement}</span>
                </div>
                <div className="tag-row">
                  {(job.matchReasons || []).map((reason) => <span className="tag subtle" key={reason}>{reason}</span>)}
                </div>
                <p className="muted">报名：{job.registrationStart} 至 {job.registrationEnd}</p>
                <div className="question-actions">
                  <button className="btn outline small" type="button" onClick={() => handleToggleFavorite(job.id)}>
                    {favoriteIds.has(job.id) ? '已收藏' : '收藏'}
                  </button>
                  {job.sourceUrl ? <a className="btn ghost small" href={job.sourceUrl} target="_blank" rel="noreferrer">来源</a> : null}
                </div>
              </article>
            ))}
          </div>
          <Pagination
            page={jobPage}
            total={jobTotalPages}
            totalItems={jobs.length}
            onChange={setJobPage}
          />
        </section>
      </main>
      <Footer />
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}
