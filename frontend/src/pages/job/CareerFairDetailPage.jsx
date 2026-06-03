import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import '../../App.css'

export default function CareerFairDetailPage() {
  const { id } = useParams()
  const [fair, setFair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(async () => {
      if (cancelled) return
      setLoading(true)
      setError('')
      try {
        const data = await employmentApi.fairDetail(id)
        if (!cancelled) setFair(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [id])

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">就业方向 - 招聘会详情</p>
            <h2>{fair?.title || '招聘会详情'}</h2>
            <p className="muted">查看宣讲安排、网申截止时间和企业信息。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          {loading ? (
            <div className="feature-card"><p className="muted">正在加载招聘会详情...</p></div>
          ) : fair ? (
            <article className="track-card">
              <div className="track-head">
                <h3>{fair.companyName}</h3>
                <span className="tag subtle">{fair.city || '城市待定'}</span>
              </div>
              <div className="tag-row">
                <span className="tag subtle">{fair.industry || '行业待定'}</span>
                <span className="tag subtle">{fair.targetRoles || '岗位待定'}</span>
                <span className="tag subtle">{fair.location || '地点待定'}</span>
                <span className="tag subtle">{fair.statusLabel || (fair.expired ? '已结束' : '时间待定')}</span>
                <span className="tag subtle">{fair.applyStatusLabel || (fair.applicationClosed ? '网申已截止' : '网申待公布')}</span>
              </div>
              <p className="room-sub">开始时间：{fair.startTime || '待定'}</p>
              <p className="room-sub">结束时间：{fair.endTime || '待定'}</p>
              <p className="room-sub">网申截止：{fair.applyDeadline || '待定'}</p>
              <p>{fair.description || '暂无详细介绍。'}</p>
              <div className="tag-row">
                {fair.applyUrl && !fair.applicationClosed ? <a className="btn primary small" href={fair.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a> : null}
                {fair.applyUrl && fair.applicationClosed ? <span className="tag subtle">申请已截止</span> : null}
                <Link className="btn outline small" to="/job/fairs">返回招聘会列表</Link>
              </div>
            </article>
          ) : (
            <div className="feature-card"><p className="muted">未找到招聘会。</p></div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
