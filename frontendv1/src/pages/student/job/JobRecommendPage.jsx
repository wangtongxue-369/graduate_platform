import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import ReturnBar from '@/components/ReturnBar.jsx'
import {
  createPreviewNotificationState,
  filterPreviewRecommendations,
} from '@/lib/employmentPreview.js'

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

function trackingUrl(item) {
  const params = new URLSearchParams()
  params.set('jobPostingId', item.id)
  params.set('companyName', item.companyName || '')
  params.set('jobTitle', item.title || item.jobTitle || '')
  return `/job/applications?${params.toString()}`
}

export default function JobRecommendPage() {
  const { token, isAuthed, loading: authLoading } = useAuth()
  const canUseRemote = Boolean(isAuthed && token && token !== 'dev-token')
  const isPreviewMode = Boolean(isAuthed && token === 'dev-token')
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
    if (isPreviewMode) {
      setRecommendations(filterPreviewRecommendations(nextFilters))
      setLoading(false)
      setError('')
      return
    }

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
  }, [canUseRemote, isPreviewMode, token])

  useEffect(() => {
    if (isPreviewMode) {
      setNotifications(createPreviewNotificationState())
      refresh()
      return
    }

    if (!canUseRemote) {
      setNotifications({ items: [], unreadCount: 0 })
      setLoading(false)
      return
    }

    refresh()
    employmentApi.notifications(token).then(setNotifications).catch((e) => setError(e.message))
  }, [canUseRemote, isPreviewMode, token, refresh])

  if (!authLoading && !isAuthed) return <Navigate replace to="/login" />

  async function markRead(id) {
    if (isPreviewMode) {
      setNotifications((prev) => {
        const items = (Array.isArray(prev) ? prev : (prev.items || [])).map((item) => (
          item.id === id ? { ...item, readFlag: true, readAt: item.readAt || new Date().toISOString() } : item
        ))
        return {
          ...(Array.isArray(prev) ? {} : prev),
          items,
          unreadCount: items.filter((item) => !item.readFlag).length,
          totalItems: items.length,
        }
      })
      return
    }

    if (!canUseRemote) return

    try {
      const updated = await employmentApi.markNotificationRead(id, token)
      setNotifications((prev) => {
        const items = (Array.isArray(prev) ? prev : (prev.items || [])).map((item) => (item.id === id ? updated : item))
        if (Array.isArray(prev)) return items
        return { ...prev, items, unreadCount: items.filter((item) => !item.readFlag).length }
      })
    } catch (e) {
      setError(e.message)
    }
  }

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const emptyStateText = isPreviewMode ? '当前筛选条件下没有演示岗位。' : '当前筛选条件下没有岗位。'

  return (
    <section className="v1-task-page">
      <ReturnBar to="/station/job" label="返回就业工作站" hint="推荐页先筛选再进详情，岗位详情页再决定是否加入投递跟踪。" />
      <header className="v1-task-head">
        <p className="v1-eyebrow">job / recommendation</p>
        <h1>岗位推荐</h1>
        <p>先筛，再看匹配原因，再进详情。平台内不会自动投递，详情页只允许加入投递跟踪或打开外部链接。</p>
      </header>
      <div className="v1-callout">提示：平台内不会自动投递；打开申请链接会跳转站外。</div>
      {isPreviewMode ? (
        <div className="v1-message">当前为开发预览：岗位、匹配原因和提醒基于后端字段结构提供演示数据。正式排序与提醒需连接后端。</div>
      ) : null}

      <div className="v1-task-split">
        <div className="v1-form-stack">
          <label className="v1-field">
            <span>关键词</span>
            <input value={filters.keyword} onChange={(e) => updateFilter('keyword', e.target.value)} />
          </label>
          <div className="v1-form-grid">
            <label className="v1-field">
              <span>城市</span>
              <input value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} />
            </label>
            <label className="v1-field">
              <span>岗位类型</span>
              <input value={filters.roleType} onChange={(e) => updateFilter('roleType', e.target.value)} />
            </label>
          </div>
          <div className="v1-form-grid">
            <label className="v1-field">
              <span>行业</span>
              <input value={filters.industry} onChange={(e) => updateFilter('industry', e.target.value)} />
            </label>
            <label className="v1-field">
              <span>薪资范围</span>
              <input value={filters.salaryRange} onChange={(e) => updateFilter('salaryRange', e.target.value)} />
            </label>
          </div>
          <div className="v1-action-row">
            <button className="v1-btn v1-btn--primary" type="button" onClick={() => refresh(filters)}>
              刷新推荐
            </button>
            <button className="v1-btn" type="button" onClick={() => { setFilters(emptyFilters); refresh(emptyFilters) }}>
              清空筛选
            </button>
          </div>
        </div>

        <aside className="v1-file-panel">
          <strong>站内提醒</strong>
          <span>{unreadCount} 条未读</span>
          {notificationItems.length === 0 ? <span>暂无就业提醒。</span> : null}
          <div className="v1-card-stack">
            {notificationItems.slice(0, 4).map((item) => (
              <article className="v1-list-card" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.content}</span>
                <div className="v1-action-row">
                  {item.targetUrl ? <Link className="v1-btn" to={item.targetUrl}>查看</Link> : null}
                  {item.readFlag ? <span>已读</span> : <button className="v1-btn" type="button" onClick={() => markRead(item.id)}>标记已读</button>}
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <div className="v1-card-stack">
        {loading ? <div className="v1-list-card">正在计算匹配结果...</div> : null}
        {!loading && recommendations.length === 0 ? <div className="v1-list-card">{emptyStateText}</div> : null}
        {recommendations.map((item) => (
          <article className="v1-list-card" key={item.id}>
            <strong>{item.title || item.jobTitle}</strong>
            <span>{item.companyName}</span>
            <span>匹配原因：{(item.matchReasons || item.reasons || []).join('、') || '待补充'}</span>
            <div className="v1-action-row">
              <Link className="v1-btn v1-btn--primary" to={`/job/postings/${item.id}`}>查看详情</Link>
              <Link className="v1-btn" to={trackingUrl(item)}>加入投递跟踪</Link>
              {item.applyUrl ? <a className="v1-btn" href={item.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a> : null}
            </div>
          </article>
        ))}
      </div>

      {error ? <div className="v1-error">{error}</div> : null}
    </section>
  )
}
