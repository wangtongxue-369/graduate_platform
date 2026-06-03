import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

function trackingUrl(job) {
  const params = new URLSearchParams()
  params.set('jobPostingId', job.id)
  params.set('companyName', job.companyName || '')
  params.set('jobTitle', job.title || '')
  return `/job/applications?${params.toString()}`
}

export default function JobPostingDetailPage() {
  const { id } = useParams()
  const { isAuthed, loading: authLoading } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(async () => {
      if (cancelled) return
      setLoading(true)
      setError('')
      try {
        const data = await employmentApi.postingDetail(id)
        if (!cancelled) setJob(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [id])

  if (!authLoading && !isAuthed) return <Navigate to="/login" replace />

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">就业方向 - 岗位详情</p>
            <h2>{job?.title || '岗位详情'}</h2>
            <p className="muted">查看岗位要求，并加入个人投递跟踪。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          {loading ? (
            <div className="feature-card"><p className="muted">正在加载岗位详情...</p></div>
          ) : job ? (
            <article className="track-card">
              <div className="track-head">
                <h3>{job.companyName}</h3>
                <span className="tag subtle">{job.city || '城市待定'}</span>
              </div>
              <div className="tag-row">
                <span className="tag subtle">{job.industry || '行业待定'}</span>
                <span className="tag subtle">{job.companyType || '企业类型待定'}</span>
                <span className="tag subtle">{job.roleType || '岗位类型待定'}</span>
                <span className="tag subtle">{job.salaryRange || '薪资面议'}</span>
              </div>
              <p className="room-sub">学历要求：{job.educationRequirement || '未设置'}</p>
              <p className="room-sub">专业关键词：{job.majorKeywords || '未设置'}</p>
              <p className="room-sub">技能标签：{job.skillTags || '未设置'}</p>
              <p>{job.description || '暂无岗位描述。'}</p>
              <div className="tag-row">
                <Link className="btn primary small" to={trackingUrl(job)}>加入投递跟踪</Link>
                {job.applyUrl ? <a className="btn outline small" href={job.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a> : null}
                <Link className="btn ghost small" to="/job/recommend">返回岗位推荐</Link>
              </div>
            </article>
          ) : (
            <div className="feature-card"><p className="muted">未找到岗位。</p></div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
