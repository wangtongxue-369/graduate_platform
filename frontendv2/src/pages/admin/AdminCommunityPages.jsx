import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminApi } from '@legacy/lib/api.js'
import FrontendV2MarkdownContent from '@/components/markdown/FrontendV2MarkdownContent.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import SubnavTabs from '@/components/SubnavTabs.jsx'
import {
  createCommunityPreviewCategories,
  createCommunityPreviewComments,
  createCommunityPreviewPosts,
} from '@/lib/communityPreview.js'
import {
  adminReportStatusOptions,
  adminReviewStatusOptions,
  adminUserStatusActionOptions,
  adminUserStatusOptions,
  extractPagePayload,
  formatDateTime,
  normalizeAdminCommentReport,
  normalizeAdminPostReport,
  normalizeAdminReviewPost,
  normalizeCommunityCategory,
  normalizeManagedUser,
  reportStatusLabelMap,
  userStatusLabelMap,
} from '@/lib/communityUi.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const adminCommunityTabs = [
  { label: '治理总览', to: '/admin/community', end: true, note: '查看待处理摘要' },
  { label: '帖子审核', to: '/admin/community/reviews', note: '审核发帖内容' },
  { label: '帖子举报', to: '/admin/community/reports/posts', note: '处理帖子举报' },
  { label: '评论举报', to: '/admin/community/reports/comments', note: '处理评论举报' },
  { label: '分类管理', to: '/admin/community/categories', note: '维护社区分类' },
  { label: '用户状态', to: '/admin/community/users', note: '调整用户限制' },
]

const previewReviewPosts = createCommunityPreviewPosts({ sort: 'latest' })
  .slice(0, 4)
  .map((item, index) => normalizeAdminReviewPost({
    ...item,
    status: index === 0 ? 'PENDING' : index === 1 ? 'PUBLISHED' : index === 2 ? 'REJECTED' : 'OFFLINE',
    reviewReason: index === 2 ? '正文信息不足，已退回补充。' : '',
  }))

const previewPostReports = previewReviewPosts.slice(0, 3).map((post, index) => normalizeAdminPostReport({
  id: 600 + index,
  reason: ['广告引流', '资料来源不清晰', '标题党'][index],
  status: index === 0 ? 'PENDING' : index === 1 ? 'RESOLVED' : 'REJECTED',
  reviewNote: index === 1 ? '已核实并下线相关内容。' : '',
  createdAt: post.createdAt,
  reviewedAt: index === 0 ? null : post.updatedAt,
  reporter: { id: 9000 + index, name: `举报人 ${index + 1}` },
  post: {
    id: post.id,
    title: post.title,
    status: post.status,
    authorId: post.authorId,
    authorName: post.authorName,
  },
}))

const previewCommentReports = createCommunityPreviewComments(12)
  .slice(0, 3)
  .map((comment, index) => normalizeAdminCommentReport({
    id: 700 + index,
    reason: ['人身攻击', '无关灌水', '重复刷屏'][index],
    status: index === 0 ? 'PENDING' : index === 1 ? 'RESOLVED' : 'REJECTED',
    reviewNote: index === 1 ? '该评论已被隐藏。' : '',
    createdAt: comment.createdAt,
    reviewedAt: index === 0 ? null : comment.updatedAt,
    reporter: { id: 9800 + index, name: `举报人 ${index + 1}` },
    comment: {
      id: comment.id,
      content: comment.content,
      status: comment.status,
      authorId: comment.authorId,
      authorName: comment.authorName,
      postId: 12,
      postTitle: previewReviewPosts[0]?.title || '示例帖子',
    },
  }))

const previewCategories = createCommunityPreviewCategories().map((item, index) => normalizeCommunityCategory({
  ...item,
  description: `${item.name}相关经验、资料与问答内容。`,
  sortOrder: index + 1,
  active: index !== 4,
}))

const previewUsers = [
  { id: 301, name: '考研用户 A', email: 'ky-a@test.local', phone: '13800000001', target: 'kaoyan', school: '华东师范大学', role: 'user', status: 'normal', createdAt: '2026-06-01T10:00:00' },
  { id: 302, name: '考公用户 B', email: 'kg-b@test.local', phone: '13800000002', target: 'kaogong', school: '南京师范大学', role: 'user', status: 'muted', createdAt: '2026-06-03T12:00:00' },
  { id: 303, name: '就业用户 C', email: 'job-c@test.local', phone: '13800000003', target: 'job', school: '苏州大学', role: 'user', status: 'upload_limited', createdAt: '2026-06-05T16:20:00' },
  { id: 304, name: '留学用户 D', email: 'sa-d@test.local', phone: '13800000004', target: 'liuxue', school: '浙江大学', role: 'user', status: 'temporary_locked', createdAt: '2026-06-06T08:45:00' },
]
  .map(normalizeManagedUser)

function AdminCommunityHeader({ title, lead, pathLabel }) {
  return (
    <>
      <PageIntro
        kicker="社区治理"
        title={title}
        lead={lead}
        pathItems={[
          { label: '管理员主站', to: '/admin' },
          { label: '社区治理', to: '/admin/community' },
          ...(pathLabel ? [{ label: pathLabel }] : []),
        ]}
        actions={<Link className="v2-secondary-link" to="/admin/community">返回治理总览</Link>}
      />
      <SubnavTabs items={adminCommunityTabs} compact />
    </>
  )
}

function QueueList({ items, selectedId, onSelect, title, emptyText }) {
  return (
    <section className="v2-article-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">{title}</p>
          <h3>先从列表选择一个任务，再在右侧做处理</h3>
        </div>
      </div>
      {items.length ? (
        <div className="v2-check-list">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`v2-check-row v2-check-row--selectable ${String(selectedId || '') === String(item.id) ? 'is-active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <strong>{item.title || item.name || `任务 #${item.id}`}</strong>
              <span>{item.note || item.reason || item.description || '点击查看详情'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="v2-empty-card">{emptyText}</div>
      )}
    </section>
  )
}

function AdminPreviewNotice({ preview }) {
  if (!preview) return null
  return <div className="v2-status-note">当前是演示管理员身份，页面展示的是治理预览数据；真实处理请使用后端管理员账号登录。</div>
}

export function AdminCommunityPage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState({
    pendingPosts: 0,
    postReports: 0,
    commentReports: 0,
    categories: 0,
    users: 0,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const preview = token === 'dev-token'

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        if (preview) {
          if (!active) return
          setSummary({
            pendingPosts: previewReviewPosts.filter((item) => item.status === 'PENDING').length,
            postReports: previewPostReports.filter((item) => item.status === 'PENDING').length,
            commentReports: previewCommentReports.filter((item) => item.status === 'PENDING').length,
            categories: previewCategories.length,
            users: previewUsers.length,
          })
          return
        }

        const [pendingPosts, reports, commentReports, categories, users] = await withRequestTimeout(
          Promise.all([
            adminApi.pendingPosts(0, 20, token),
            adminApi.reports('PENDING', 0, 20, token),
            adminApi.commentReports('PENDING', 0, 20, token),
            adminApi.postCategories(token),
            adminApi.users(undefined, undefined, 0, 20, token),
          ]),
          9000,
          '社区治理总览请求超时，请检查后端服务是否正常启动。',
        )

        if (!active) return
        setSummary({
          pendingPosts: extractPagePayload(pendingPosts).totalElements,
          postReports: extractPagePayload(reports).totalElements,
          commentReports: extractPagePayload(commentReports).totalElements,
          categories: Array.isArray(categories) ? categories.length : 0,
          users: extractPagePayload(users).totalElements,
        })
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '社区治理总览加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [preview, token])

  const summaryCards = [
    { label: '待审帖子', value: summary.pendingPosts, note: '进入帖子审核页继续处理' },
    { label: '帖子举报', value: summary.postReports, note: '先看举报理由，再决定是否处置' },
    { label: '评论举报', value: summary.commentReports, note: '和帖子举报分开处理，避免混乱' },
    { label: '社区分类', value: summary.categories, note: '单独进入分类维护与合并' },
    { label: '用户状态', value: summary.users, note: '在用户状态页集中调整限制' },
  ]

  return (
    <>
      <div className="v2-main-column">
        <AdminCommunityHeader
          title="社区治理先分流，再进入单项任务处理。"
          lead="总览页只做待处理摘要和入口，不把审核、举报、分类、用户状态堆成一个页面。"
        />

        <AdminPreviewNotice preview={preview} />
        {error ? <div className="v2-status-error">{error}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在汇总社区治理数据...</div>
        ) : (
          <section className="v2-overview-grid">
            {summaryCards.map((item) => (
              <article className="v2-summary-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </section>
        )}

        <section className="v2-card-grid">
          {adminCommunityTabs.slice(1).map((item) => (
            <Link className="v2-preview-panel" key={item.to} to={item.to}>
              <div className="v2-preview-panel__head">
                <strong>{item.label}</strong>
                <span className="v2-inline-link">进入</span>
              </div>
              <p>{item.note}</p>
            </Link>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">治理顺序</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>先审帖子</strong>
              <span>决定内容能否发布或下线。</span>
            </div>
            <div className="v2-check-row">
              <strong>再处理举报</strong>
              <span>帖子举报和评论举报拆成两条队列。</span>
            </div>
            <div className="v2-check-row">
              <strong>最后维护底层</strong>
              <span>分类与用户状态放到独立页面处理。</span>
            </div>
          </div>
        </section>
      </aside>
    </>
  )
}

export function AdminCommunityReviewsPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState('PENDING')
  const [pageState, setPageState] = useState(() => extractPagePayload([]))
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const preview = token === 'dev-token'

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        if (preview) {
          const items = previewReviewPosts.filter((item) => !status || item.status === status)
          if (!active) return
          setPageState(extractPagePayload(items))
          setSelectedId(items[0]?.id ?? null)
          return
        }

        const data = await adminApi.reviewList(status, 0, 20, token)
        if (!active) return
        const payload = extractPagePayload(data)
        const items = payload.content.map(normalizeAdminReviewPost)
        setPageState({ ...payload, content: items })
        setSelectedId(items[0]?.id ?? null)
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '帖子审核队列加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [preview, status, token])

  const items = pageState.content
  const selected = items.find((item) => String(item.id) === String(selectedId)) || items[0] || null

  async function handleAction(action) {
    if (!selected) return
    if ((action === 'REJECT' || action === 'OFFLINE') && !reason.trim()) {
      setError('驳回或下线前，请先填写处理原因。')
      return
    }

    setActing(true)
    setError('')
    setMessage('')

    try {
      if (preview) {
        setPageState((current) => ({
          ...current,
          content: current.content.map((item) => (
            item.id === selected.id
              ? {
                  ...item,
                  status: action === 'APPROVE' ? 'PUBLISHED' : action === 'REJECT' ? 'REJECTED' : 'OFFLINE',
                  reviewReason: reason.trim(),
                }
              : item
          )),
        }))
        setMessage('演示模式下已更新本地审核结果。')
      } else {
        await adminApi.reviewPost(selected.id, action, reason.trim(), token)
        const data = await adminApi.reviewList(status, 0, 20, token)
        const payload = extractPagePayload(data)
        const nextItems = payload.content.map(normalizeAdminReviewPost)
        setPageState({ ...payload, content: nextItems })
        setSelectedId(nextItems[0]?.id ?? null)
        setMessage('审核操作已提交。')
      }

      setReason('')
    } catch (requestError) {
      setError(requestError.message || '审核操作失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <AdminCommunityHeader
          title="帖子审核页只做内容审核，不混入举报或用户处理。"
          lead="先在中间列表选中帖子，再在右栏填写原因并执行通过、驳回或下线。"
          pathLabel="帖子审核"
        />

        <AdminPreviewNotice preview={preview} />
        {message ? <div className="v2-status-note">{message}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在加载帖子审核队列...</div>
        ) : (
          <>
            <QueueList
              items={items.map((item) => ({
                ...item,
                note: `${item.category?.name || '社区'} · ${item.authorName || item.authorId || '匿名'} · ${item.status}`,
              }))}
              selectedId={selectedId}
              onSelect={setSelectedId}
              title="审核队列"
              emptyText="当前筛选条件下没有帖子审核任务。"
            />

            {selected ? (
              <section className="v2-article-card">
                <div className="v2-section-head">
                  <div>
                    <p className="v2-kicker">帖子详情</p>
                    <h3>{selected.title}</h3>
                  </div>
                </div>
                <div className="v2-article-meta">
                  <span>{selected.category?.name || '社区'}</span>
                  <span>{selected.authorName || selected.authorId || '匿名发布'}</span>
                  <span>{selected.status}</span>
                  <span>{formatDateTime(selected.createdAt)}</span>
                </div>
                <div className="v2-post-markdown">
                  <FrontendV2MarkdownContent content={selected.content || ''} />
                </div>
                {selected.reviewReason ? <p>历史处理原因：{selected.reviewReason}</p> : null}
              </section>
            ) : null}
          </>
        )}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">审核筛选</p>
          <div className="v2-segment-group" role="group" aria-label="审核状态筛选">
            {adminReviewStatusOptions.map((item) => (
              <button
                key={item.value}
                className={`v2-segment-button ${status === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => setStatus(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">处理动作</p>
          <label className="v2-field">
            <span>处理原因</span>
            <textarea
              rows="6"
              value={reason}
              placeholder="驳回或下线时请写明原因。通过时可留空。"
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="v2-side-action-stack">
            <button className="v2-primary-link" type="button" disabled={!selected || acting} onClick={() => handleAction('APPROVE')}>
              通过发布
            </button>
            <button className="v2-secondary-link" type="button" disabled={!selected || acting} onClick={() => handleAction('REJECT')}>
              驳回帖子
            </button>
            <button className="v2-ghost-link v2-ghost-link--danger" type="button" disabled={!selected || acting} onClick={() => handleAction('OFFLINE')}>
              下线帖子
            </button>
          </div>
        </section>
      </aside>
    </>
  )
}

function AdminReportPage({
  title,
  lead,
  pathLabel,
  preview,
  previewItems,
  loadItems,
  reviewItem,
  itemType,
}) {
  const { token } = useAuth()
  const [status, setStatus] = useState('PENDING')
  const [pageState, setPageState] = useState(() => extractPagePayload([]))
  const [selectedId, setSelectedId] = useState(null)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        if (preview) {
          const items = previewItems.filter((item) => !status || item.status === status)
          if (!active) return
          setPageState(extractPagePayload(items))
          setSelectedId(items[0]?.id ?? null)
          return
        }

        const data = await loadItems(status, token)
        if (!active) return
        const payload = extractPagePayload(data)
        const items = payload.content
        setPageState({ ...payload, content: items })
        setSelectedId(items[0]?.id ?? null)
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '举报队列加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [loadItems, preview, previewItems, status, token])

  const items = pageState.content
  const selected = items.find((item) => String(item.id) === String(selectedId)) || items[0] || null

  async function handleAction(action) {
    if (!selected) return

    setActing(true)
    setError('')
    setMessage('')

    try {
      if (preview) {
        setPageState((current) => ({
          ...current,
          content: current.content.map((item) => (
            item.id === selected.id
              ? {
                  ...item,
                  status: action === 'RESOLVE' ? 'RESOLVED' : 'REJECTED',
                  reviewNote: note.trim(),
                }
              : item
          )),
        }))
        setMessage('演示模式下已更新本地举报结果。')
      } else {
        await reviewItem(selected.id, action, note.trim(), token)
        const data = await loadItems(status, token)
        const payload = extractPagePayload(data)
        const nextItems = payload.content
        setPageState({ ...payload, content: nextItems })
        setSelectedId(nextItems[0]?.id ?? null)
        setMessage('举报处理结果已提交。')
      }

      setNote('')
    } catch (requestError) {
      setError(requestError.message || '举报处理失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <AdminCommunityHeader
          title={title}
          lead={lead}
          pathLabel={pathLabel}
        />

        <AdminPreviewNotice preview={preview} />
        {message ? <div className="v2-status-note">{message}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在加载举报队列...</div>
        ) : (
          <>
            <QueueList
              items={items.map((item) => ({
                ...item,
                title: itemType === 'post'
                  ? item.post?.title || `帖子举报 #${item.id}`
                  : `${item.comment?.authorName || '匿名用户'} 的评论举报`,
                note: `${reportStatusLabelMap[item.status] || item.status} · ${item.reason}`,
              }))}
              selectedId={selectedId}
              onSelect={setSelectedId}
              title="举报队列"
              emptyText="当前筛选条件下没有举报任务。"
            />

            {selected ? (
              <section className="v2-article-card">
                <div className="v2-section-head">
                  <div>
                    <p className="v2-kicker">举报详情</p>
                    <h3>{itemType === 'post' ? selected.post?.title : '评论举报'}</h3>
                  </div>
                </div>
                <div className="v2-check-list">
                  <div className="v2-check-row">
                    <strong>举报人</strong>
                    <span>{selected.reporter?.name} · ID {selected.reporter?.id}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>举报原因</strong>
                    <span>{selected.reason}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>提交时间</strong>
                    <span>{formatDateTime(selected.createdAt)}</span>
                  </div>
                  {itemType === 'post' ? (
                    <>
                      <div className="v2-check-row">
                        <strong>目标帖子</strong>
                        <span>{selected.post?.title}</span>
                      </div>
                      <div className="v2-check-row">
                        <strong>作者</strong>
                        <span>{selected.post?.authorName || selected.post?.authorId}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="v2-check-row">
                        <strong>评论内容</strong>
                        <span>{selected.comment?.content}</span>
                      </div>
                      <div className="v2-check-row">
                        <strong>所属帖子</strong>
                        <span>{selected.comment?.postTitle}</span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">状态筛选</p>
          <div className="v2-segment-group" role="group" aria-label="举报状态筛选">
            {adminReportStatusOptions.map((item) => (
              <button
                key={item.value}
                className={`v2-segment-button ${status === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => setStatus(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">处理说明</p>
          <label className="v2-field">
            <span>处理备注</span>
            <textarea
              rows="5"
              value={note}
              placeholder="写明为什么成立，或为什么驳回。"
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="v2-side-action-stack">
            <button className="v2-primary-link" type="button" disabled={!selected || acting} onClick={() => handleAction('RESOLVE')}>
              举报成立
            </button>
            <button className="v2-secondary-link" type="button" disabled={!selected || acting} onClick={() => handleAction('REJECT')}>
              驳回举报
            </button>
          </div>
        </section>
      </aside>
    </>
  )
}

export function AdminCommunityPostReportsPage() {
  const { token } = useAuth()
  const preview = token === 'dev-token'

  return (
    <AdminReportPage
      title="帖子举报和评论举报分开处理，避免治理动作混用。"
      lead="帖子举报页只聚焦帖子本身的处置与说明。"
      pathLabel="帖子举报"
      preview={preview}
      previewItems={previewPostReports}
      loadItems={async (status, tokenValue) => {
        const data = await adminApi.reports(status, 0, 20, tokenValue)
        const payload = extractPagePayload(data)
        return { ...payload, content: payload.content.map(normalizeAdminPostReport) }
      }}
      reviewItem={(id, action, note, tokenValue) => adminApi.reviewReport(id, action, note, tokenValue)}
      itemType="post"
    />
  )
}

export function AdminCommunityCommentReportsPage() {
  const { token } = useAuth()
  const preview = token === 'dev-token'

  return (
    <AdminReportPage
      title="评论举报放在独立页面，避免和帖子处置互相干扰。"
      lead="评论治理只针对评论本身，不在这里夹带帖子审核动作。"
      pathLabel="评论举报"
      preview={preview}
      previewItems={previewCommentReports}
      loadItems={async (status, tokenValue) => {
        const data = await adminApi.commentReports(status, 0, 20, tokenValue)
        const payload = extractPagePayload(data)
        return { ...payload, content: payload.content.map(normalizeAdminCommentReport) }
      }}
      reviewItem={(id, action, note, tokenValue) => adminApi.reviewCommentReport(id, action, note, tokenValue)}
      itemType="comment"
    />
  )
}

export function AdminCommunityCategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    sortOrder: 0,
    active: true,
  })
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const preview = token === 'dev-token'

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const items = preview
          ? previewCategories
          : (await adminApi.postCategories(token)).map(normalizeCommunityCategory)
        if (!active) return
        setCategories(items)
        const first = items[0] || null
        setSelectedId(first?.id ?? null)
        if (first) {
          setForm({
            code: first.code,
            name: first.name,
            description: first.description,
            sortOrder: Number(first.sortOrder ?? 0),
            active: first.active !== false,
          })
        }
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '分类列表加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [preview, token])

  const selected = categories.find((item) => String(item.id) === String(selectedId)) || null

  function handleSelect(id) {
    setSelectedId(id)
    const current = categories.find((item) => String(item.id) === String(id))
    if (!current) return
    setForm({
      code: current.code,
      name: current.name,
      description: current.description,
      sortOrder: Number(current.sortOrder ?? 0),
      active: current.active !== false,
    })
  }

  async function handleSave() {
    setError('')
    setMessage('')

    try {
      if (preview) {
        setCategories((current) => current.map((item) => (
          item.id === selectedId
            ? { ...item, ...form, sortOrder: Number(form.sortOrder || 0) }
            : item
        )))
        setMessage('演示模式下已更新本地分类。')
      } else if (selectedId) {
        await adminApi.updatePostCategory(selectedId, {
          ...form,
          sortOrder: Number(form.sortOrder || 0),
        }, token)
        const next = (await adminApi.postCategories(token)).map(normalizeCommunityCategory)
        setCategories(next)
        setMessage('分类已更新。')
      }
    } catch (requestError) {
      setError(requestError.message || '分类保存失败，请稍后再试。')
    }
  }

  async function handleToggleStatus() {
    if (!selected) return

    try {
      if (preview) {
        const nextActive = !selected.active
        setCategories((current) => current.map((item) => (
          item.id === selected.id ? { ...item, active: nextActive } : item
        )))
        setForm((current) => ({ ...current, active: nextActive }))
        setMessage('演示模式下已切换分类状态。')
      } else {
        await adminApi.updatePostCategoryStatus(selected.id, !selected.active, token)
        const next = (await adminApi.postCategories(token)).map(normalizeCommunityCategory)
        setCategories(next)
        setMessage('分类状态已更新。')
      }
    } catch (requestError) {
      setError(requestError.message || '分类状态更新失败，请稍后再试。')
    }
  }

  async function handleMerge() {
    if (!selected || !mergeTargetId || String(selected.id) === String(mergeTargetId)) {
      setError('请选择一个不同的目标分类进行合并。')
      return
    }

    try {
      if (preview) {
        setCategories((current) => current.map((item) => (
          item.id === selected.id ? { ...item, active: false } : item
        )))
        setMessage('演示模式下已模拟分类合并，源分类已停用。')
      } else {
        await adminApi.mergePostCategory(selected.id, mergeTargetId, token)
        const next = (await adminApi.postCategories(token)).map(normalizeCommunityCategory)
        setCategories(next)
        setMessage('分类合并已执行。')
      }
    } catch (requestError) {
      setError(requestError.message || '分类合并失败，请稍后再试。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <AdminCommunityHeader
          title="分类维护和分类合并拆开处理，避免误操作。"
          lead="中间区只看当前分类及其内容说明，右侧再执行状态切换和合并动作。"
          pathLabel="分类管理"
        />

        <AdminPreviewNotice preview={preview} />
        {message ? <div className="v2-status-note">{message}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在加载社区分类...</div>
        ) : (
          <>
            <QueueList
              items={categories.map((item) => ({
                ...item,
                title: item.name,
                note: `${item.code} · 排序 ${item.sortOrder} · ${item.active ? '启用中' : '已停用'}`,
              }))}
              selectedId={selectedId}
              onSelect={handleSelect}
              title="分类列表"
              emptyText="当前还没有社区分类。"
            />

            {selected ? (
              <section className="v2-article-card">
                <div className="v2-section-head">
                  <div>
                    <p className="v2-kicker">分类编辑</p>
                    <h3>{selected.name}</h3>
                  </div>
                </div>
                <div className="v2-form-grid">
                  <label className="v2-field">
                    <span>分类编码</span>
                    <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
                  </label>
                  <label className="v2-field">
                    <span>分类名称</span>
                    <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="v2-field">
                    <span>排序值</span>
                    <input type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
                  </label>
                  <label className="v2-field">
                    <span>启用状态</span>
                    <input value={form.active ? '启用中' : '已停用'} disabled />
                  </label>
                </div>
                <label className="v2-field">
                  <span>分类说明</span>
                  <textarea rows="6" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                </label>
              </section>
            ) : null}
          </>
        )}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">分类动作</p>
          <div className="v2-side-action-stack">
            <button className="v2-primary-link" type="button" disabled={!selected} onClick={handleSave}>
              保存当前分类
            </button>
            <button className="v2-secondary-link" type="button" disabled={!selected} onClick={handleToggleStatus}>
              {selected?.active ? '停用当前分类' : '启用当前分类'}
            </button>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">分类合并</p>
          <label className="v2-field">
            <span>目标分类</span>
            <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
              <option value="">请选择目标分类</option>
              {categories.filter((item) => String(item.id) !== String(selectedId)).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <button className="v2-ghost-link v2-ghost-link--danger" type="button" disabled={!selected} onClick={handleMerge}>
            合并到目标分类
          </button>
          <p className="v2-note-text">合并适合处理重复分类，和普通编辑动作分开执行更安全。</p>
        </section>
      </aside>
    </>
  )
}

export function AdminCommunityUsersPage() {
  const { token } = useAuth()
  const [targetFilter, setTargetFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const preview = token === 'dev-token'

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const items = preview
          ? previewUsers
            .filter((item) => !targetFilter || item.target === targetFilter)
            .filter((item) => !statusFilter || item.status === statusFilter)
          : extractPagePayload(await adminApi.users(targetFilter || undefined, statusFilter || undefined, 0, 20, token)).content.map(normalizeManagedUser)

        if (!active) return
        setUsers(items)
        setSelectedId(items[0]?.id ?? null)
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '用户状态列表加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [preview, statusFilter, targetFilter, token])

  const selected = users.find((item) => String(item.id) === String(selectedId)) || null

  async function handleUpdateStatus(nextStatus) {
    if (!selected) return

    setActing(true)
    setError('')
    setMessage('')

    try {
      if (preview) {
        setUsers((current) => current.map((item) => (
          item.id === selected.id ? { ...item, status: nextStatus } : item
        )))
        setMessage('演示模式下已更新本地用户状态。')
      } else {
        await adminApi.updateUserStatus(selected.id, nextStatus, reason.trim(), token)
        const refreshed = extractPagePayload(await adminApi.users(targetFilter || undefined, statusFilter || undefined, 0, 20, token)).content.map(normalizeManagedUser)
        setUsers(refreshed)
        setSelectedId(refreshed[0]?.id ?? null)
        setMessage('用户状态已更新。')
      }
    } catch (requestError) {
      setError(requestError.message || '用户状态更新失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <AdminCommunityHeader
          title="用户状态单独治理，不和帖子审核混在一起。"
          lead="先在中间选择目标用户，再在右侧执行限制、解封或临时锁定。"
          pathLabel="用户状态"
        />

        <AdminPreviewNotice preview={preview} />
        {message ? <div className="v2-status-note">{message}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在加载用户状态列表...</div>
        ) : (
          <>
            <QueueList
              items={users.map((item) => ({
                ...item,
                title: item.name,
                note: `${item.target || '未设置方向'} · ${userStatusLabelMap[item.status] || item.status} · ${item.school || '未设置学校'}`,
              }))}
              selectedId={selectedId}
              onSelect={setSelectedId}
              title="用户列表"
              emptyText="当前筛选条件下没有用户。"
            />

            {selected ? (
              <section className="v2-article-card">
                <div className="v2-section-head">
                  <div>
                    <p className="v2-kicker">用户详情</p>
                    <h3>{selected.name}</h3>
                  </div>
                </div>
                <div className="v2-check-list">
                  <div className="v2-check-row">
                    <strong>邮箱</strong>
                    <span>{selected.email || '未设置'}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>手机</strong>
                    <span>{selected.phone || '未设置'}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>方向</strong>
                    <span>{selected.target || '未设置'}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>角色</strong>
                    <span>{selected.role}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>当前状态</strong>
                    <span>{userStatusLabelMap[selected.status] || selected.status}</span>
                  </div>
                  <div className="v2-check-row">
                    <strong>注册时间</strong>
                    <span>{formatDateTime(selected.createdAt)}</span>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选用户</p>
          <label className="v2-field">
            <span>方向</span>
            <select value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)}>
              <option value="">全部方向</option>
              <option value="kaoyan">考研</option>
              <option value="kaogong">考公</option>
              <option value="job">就业</option>
              <option value="liuxue">留学</option>
            </select>
          </label>
          <label className="v2-field">
            <span>状态</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {adminUserStatusOptions.map((item) => (
                <option key={item.value || 'all'} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">状态动作</p>
          <label className="v2-field">
            <span>处理说明</span>
            <textarea
              rows="5"
              value={reason}
              placeholder="例如：连续发布无关广告，先禁言 7 天。"
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="v2-side-action-stack">
            {adminUserStatusActionOptions.map((item) => (
              <button
                key={item.value}
                className={item.value === 'banned' ? 'v2-ghost-link v2-ghost-link--danger' : 'v2-secondary-link'}
                type="button"
                disabled={!selected || acting}
                onClick={() => handleUpdateStatus(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </>
  )
}
