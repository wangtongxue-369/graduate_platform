import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const emptyFilters = {
  keyword: '',
  city: '',
  industry: '',
  roleType: '',
  companyType: '',
  education: '',
  major: '',
  skills: '',
  salaryRange: '',
  onlyApplyable: false,
}

export default function JobRecommendPage() {
  const { token, isAuthed, loading: authLoading } = useAuth()
  const canUseRemote = Boolean(isAuthed && token && token !== 'dev-token')
  const [filters, setFilters] = useState(emptyFilters)
  const [recommendations, setRecommendations] = useState([])
  const [notifications, setNotifications] = useState({ items: [], unreadCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const notificationItems = Array.isArray(notifications) ? notifications : (notifications.items || [])
  const unreadCount = Array.isArray(notifications)
    ? notificationItems.filter((item) => !item.readFlag).length
    : (notifications.unreadCount || 0)

  const refresh = useCallback(async (nextFilters = emptyFilters) => {
    if (!canUseRemote) {
      setRecommendations([])
      setLoading(false)
      setError('请使用真实账号登录后查看岗位推荐。')
      return
    }
    setLoading(true)
    setError('')
    try {
      setRecommendations(await employmentApi.recommendations(nextFilters, token))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [canUseRemote, token])

  useEffect(() => {
    if (!canUseRemote) {
      setNotifications({ items: [], unreadCount: 0 })
      setLoading(false)
      return
    }
    refresh()
    employmentApi.notifications(token).then(setNotifications).catch(e => setError(e.message))
  }, [canUseRemote, token, refresh])

  if (!authLoading && !isAuthed) return <Navigate to="/login" replace />

  async function markRead(id) {
    if (!canUseRemote) {
      setError('请使用真实账号登录后再操作提醒。')
      return
    }
    try {
      const updated = await employmentApi.markNotificationRead(id, token)
      setNotifications((prev) => {
        const items = (Array.isArray(prev) ? prev : (prev.items || [])).map((item) => (item.id === id ? updated : item))
        if (Array.isArray(prev)) return items
        return { ...prev, items, unreadCount: items.filter((item) => !item.readFlag).length, totalItems: items.length }
      })
    } catch (e) {
      setError(e.message)
    }
  }

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  function resetFilters() {
    setFilters(emptyFilters)
    refresh(emptyFilters)
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">就业方向 - 规则推荐</p>
            <h2>匹配岗位列表</h2>
            <p className="muted">默认展示全部启用岗位，并按筛选条件、保存偏好、专业和简历技能生成匹配分。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div className="grid-two">
            <div className="feature-card">
              <div className="card-title">筛选条件</div>
              <p className="muted">填写筛选项后会先过滤硬性条件，再按命中维度排序。</p>
              <div className="form-grid">
                <label className="field">
                  <span>关键词</span>
                  <input value={filters.keyword} onChange={e => updateFilter('keyword', e.target.value)} placeholder="岗位、企业、描述" />
                </label>
                <label className="field">
                  <span>城市</span>
                  <input value={filters.city} onChange={e => updateFilter('city', e.target.value)} placeholder="上海" />
                </label>
                <label className="field">
                  <span>行业</span>
                  <input value={filters.industry} onChange={e => updateFilter('industry', e.target.value)} placeholder="互联网" />
                </label>
                <label className="field">
                  <span>岗位类型</span>
                  <input value={filters.roleType} onChange={e => updateFilter('roleType', e.target.value)} placeholder="后端" />
                </label>
                <label className="field">
                  <span>企业类型</span>
                  <input value={filters.companyType} onChange={e => updateFilter('companyType', e.target.value)} placeholder="国企 / 民企 / 外企" />
                </label>
                <label className="field">
                  <span>学历要求</span>
                  <input value={filters.education} onChange={e => updateFilter('education', e.target.value)} placeholder="本科" />
                </label>
                <label className="field">
                  <span>专业关键词</span>
                  <input value={filters.major} onChange={e => updateFilter('major', e.target.value)} placeholder="计算机科学" />
                </label>
                <label className="field">
                  <span>技能标签</span>
                  <input value={filters.skills} onChange={e => updateFilter('skills', e.target.value)} placeholder="Java, SQL" />
                </label>
                <label className="field">
                  <span>薪资范围</span>
                  <input value={filters.salaryRange} onChange={e => updateFilter('salaryRange', e.target.value)} placeholder="18k-25k" />
                </label>
                <label className="field checkbox-field">
                  <span>投递入口</span>
                  <div className="inline-check">
                    <input
                      type="checkbox"
                      checked={filters.onlyApplyable}
                      onChange={e => updateFilter('onlyApplyable', e.target.checked)}
                    />
                    <span>只看可直接投递</span>
                  </div>
                </label>
              </div>
              <div className="tag-row">
                <button className="btn primary" type="button" onClick={() => refresh(filters)}>刷新推荐</button>
                <button className="btn outline" type="button" onClick={resetFilters}>清空筛选</button>
              </div>
            </div>

            <div className="feature-card metrics">
              <div className="card-title">站内提醒 <span className="tag subtle">{unreadCount} 条未读</span></div>
              {notificationItems.length === 0 && <p className="muted">暂无就业提醒。</p>}
              {notificationItems.slice(0, 4).map(item => (
                <div className="room-row" key={item.id}>
                  <div>
                    <div className="room-title">{item.title}</div>
                    <div className="room-sub">{item.content}</div>
                  </div>
                  <div className="tag-row">
                    {item.targetUrl && <Link className="btn ghost small" to={item.targetUrl}>查看</Link>}
                    {item.readFlag
                      ? <span className="tag subtle">已读</span>
                      : <button className="btn outline small" type="button" onClick={() => markRead(item.id)}>标记已读</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="track-grid">
            {loading && <div className="track-card"><p className="muted">正在计算匹配结果...</p></div>}
            {!loading && recommendations.length === 0 && (
              <div className="track-card"><p className="muted">当前筛选条件下没有岗位，请放宽筛选条件。</p></div>
            )}
            {recommendations.map(job => (
              <div className="track-card" key={job.id}>
                <div className="track-head">
                  <h3>{job.title}</h3>
                  <span className="tag subtle">匹配分 {job.matchScore}</span>
                </div>
                <p className="muted">
                  {job.companyName} - {job.city || '待定'} - {job.industry || '待定'} - {job.companyType || '企业类型待定'} - {job.salaryRange || '面议'}
                </p>
                <p>{job.description || '暂无描述。'}</p>
                <div className="tag-row">{(job.matchReasons || []).map(reason => <span className="tag subtle" key={reason}>{reason}</span>)}</div>
                <div className="tag-row">
                  <Link className="btn primary small" to={`/job/postings/${job.id}`}>查看详情</Link>
                  <Link className="btn outline small" to={`/job/applications?jobPostingId=${job.id}&companyName=${encodeURIComponent(job.companyName || '')}&jobTitle=${encodeURIComponent(job.title || '')}`}>加入投递跟踪</Link>
                  {job.applyUrl && <a className="btn ghost small" href={job.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a>}
                </div>
              </div>
            ))}
          </div>
          <Link className="btn ghost" to="/job">返回就业面板</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
