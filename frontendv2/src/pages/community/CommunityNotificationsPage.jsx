import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import SubnavTabs from '@/components/SubnavTabs.jsx'
import {
  createCommunityPreviewPosts,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import {
  communityNotificationFilters,
  createPreviewNotificationItems,
  extractPagePayload,
  formatDateTime,
  normalizeCommunityNotification,
} from '@/lib/communityUi.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const communityTabs = [
  { label: '社区目录', to: '/community', note: '浏览与筛选' },
  { label: '发布帖子', to: '/community/new', note: '提交正文与附件' },
  { label: '消息通知', to: '/community/notifications', end: true, note: '查看互动提醒' },
]

export default function CommunityNotificationsPage() {
  const { isAuthed, token } = useAuth()
  const [pageState, setPageState] = useState(() => extractPagePayload([]))
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const isForcedPreview = shouldForceCommunityPreview(token)
  const returnTo = '/community/notifications'

  useEffect(() => {
    let active = true

    async function load() {
      if (!isAuthed) return

      setLoading(true)
      setError('')
      setMessage('')

      try {
        let notifications

        if (isForcedPreview) {
          const previewPosts = createCommunityPreviewPosts({ sort: 'latest' })
          notifications = createPreviewNotificationItems(previewPosts)
          if (active) {
            setMessage('当前使用演示通知数据，适合观察通知列表与已读状态。')
          }
        } else {
          notifications = await withRequestTimeout(
            communityApi.notifications(0, 20, token),
            8000,
            '社区通知请求超时，请检查后端服务是否正常启动。',
          )
        }

        if (!active) return
        const payload = extractPagePayload(notifications)
        setPageState({
          ...payload,
          content: payload.content.map((item) => normalizeCommunityNotification(item)),
        })
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '通知加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [isAuthed, isForcedPreview, token])

  const notifications = useMemo(() => {
    const items = pageState.content
    if (filter === 'unread') {
      return items.filter((item) => !item.read)
    }
    return items
  }, [filter, pageState.content])

  const unreadCount = pageState.content.filter((item) => !item.read).length

  async function handleMarkRead(notificationId) {
    if (isForcedPreview) {
      setPageState((current) => ({
        ...current,
        content: current.content.map((item) => (
          item.id === notificationId ? { ...item, read: true } : item
        )),
      }))
      return
    }

    try {
      await communityApi.markNotificationRead(notificationId, token)
      setPageState((current) => ({
        ...current,
        content: current.content.map((item) => (
          item.id === notificationId ? { ...item, read: true } : item
        )),
      }))
    } catch (requestError) {
      setError(requestError.message || '通知状态更新失败，请稍后再试。')
    }
  }

  if (!isAuthed) {
    return (
      <div className="v2-main-column">
        <PageIntro
          kicker="社区通知"
          title="通知页只对已登录用户开放。"
          lead="游客可以浏览社区目录和帖子内容，但通知、评论和发帖都需要登录。"
          pathItems={[
            { label: '社区目录', to: '/community' },
            { label: '消息通知' },
          ]}
          actions={<Link className="v2-secondary-link" to="/community">返回社区目录</Link>}
        />
        <SubnavTabs items={communityTabs} />
        <section className="v2-article-card">
          <p>请先登录或注册，再进入互动通知页。</p>
        </section>
      </div>
    )
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="社区通知"
          title="通知页只处理互动提醒，不和目录、发帖混放。"
          lead="看到提醒后，再决定是否回到具体帖子继续处理。"
          pathItems={[
            { label: '社区目录', to: '/community' },
            { label: '消息通知' },
          ]}
          actions={<Link className="v2-secondary-link" to="/community">返回社区目录</Link>}
        />

        <SubnavTabs items={communityTabs} />

        {message ? <div className="v2-status-note">{message}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        <section className="v2-summary-strip">
          <article className="v2-summary-card">
            <span>全部通知</span>
            <strong>{pageState.content.length}</strong>
            <p>来自帖子评论、互动或系统提醒。</p>
          </article>
          <article className="v2-summary-card">
            <span>未读</span>
            <strong>{unreadCount}</strong>
            <p>建议先处理还没看过的互动。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前筛选</span>
            <strong>{filter === 'unread' ? '未读' : '全部'}</strong>
            <p>通知筛选只影响列表，不影响帖子正文。</p>
          </article>
        </section>

        {loading ? (
          <div className="v2-article-card">正在整理通知列表...</div>
        ) : notifications.length ? (
          <section className="v2-feed-list" aria-label="社区通知列表">
            {notifications.map((item) => (
              <div className={`v2-feed-item v2-feed-item--notification ${item.read ? '' : 'is-unread'}`} key={item.id}>
                <div className="v2-feed-body">
                  <div className="v2-article-meta">
                    <span>{item.type || 'community'}</span>
                    <span>{item.read ? '已读' : '未读'}</span>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.content || '点击查看具体互动内容。'}</p>
                </div>
                <div className="v2-feed-side">
                  {item.link ? (
                    <Link className="v2-secondary-link" to={item.link} state={{ returnTo }}>
                      打开原帖
                    </Link>
                  ) : null}
                  {!item.read ? (
                    <button
                      className="v2-primary-link"
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                    >
                      标记已读
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className="v2-article-card">当前筛选条件下没有通知。</div>
        )}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选通知</p>
          <div className="v2-segment-group" role="group" aria-label="通知筛选">
            {communityNotificationFilters.map((item) => (
              <button
                key={item.value}
                className={`v2-segment-button ${filter === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">处理顺序</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>先看提醒</strong>
              <span>先确认是哪篇帖子触发了互动。</span>
            </div>
            <div className="v2-check-row">
              <strong>再回原帖</strong>
              <span>真正的评论、举报和附件处理都在帖子详情页完成。</span>
            </div>
            <div className="v2-check-row">
              <strong>最后归档</strong>
              <span>已处理通知可标记为已读，保持列表清爽。</span>
            </div>
          </div>
        </section>
      </aside>
    </>
  )
}
