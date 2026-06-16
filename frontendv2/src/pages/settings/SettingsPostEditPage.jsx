import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import {
  postCategoryOptions,
  POST_CONTENT_MAX,
  POST_CONTENT_MIN,
  POST_TITLE_MAX,
  POST_TITLE_MIN,
} from '@legacy/constants/postEditor.js'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { previewDataNotice } from '@/lib/stationData.js'

const PostMarkdownEditor = lazy(() => import('@/components/editor/PostMarkdownEditor.jsx'))

const statusLabelMap = {
  DRAFT: '草稿',
  PENDING: '待审核',
  PUBLISHED: '已发布',
  REJECTED: '已驳回',
  OFFLINE: '已下线',
}

const visibilityOptions = [
  { value: 'public', label: '公开可见' },
  { value: 'members', label: '仅注册用户可见' },
]

function createPreviewPost(postId) {
  return {
    id: postId || 'demo-post',
    title: '钱钟书著述格局',
    content:
      '# 钱钟书著述格局\n\n这是一段用于预览模式的个人帖子正文内容，长度足够长，便于在设置域内直接验证编辑与保存体验。',
    categoryCode: 'kaoyan',
    category: '考研',
    tags: '文学,经验',
    visibility: 'public',
    anonymous: false,
    status: 'PUBLISHED',
    createdAt: '2026-05-31T09:00:00',
    updatedAt: '2026-06-12T10:00:00',
  }
}

function createPostForm(post = {}) {
  return {
    title: post.title || '',
    categoryCode: post.categoryCode || 'kaoyan',
    tags: post.tags || '',
    visibility: post.visibility || 'public',
    anonymous: Boolean(post.anonymous),
    content: post.content || '',
  }
}

function getCategoryName(categoryCode) {
  return postCategoryOptions.find((item) => item.code === categoryCode)?.name || '未分类'
}

function getStatusLabel(status) {
  const key = String(status || '').toUpperCase()
  return statusLabelMap[key] || status || '未知状态'
}

function formatDateLabel(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '待补充'
}

function getLineCount(content) {
  return String(content || '').split('\n').length
}

export default function SettingsPostEditPage() {
  const { postId } = useParams()
  const { token } = useAuth()
  const isPreview = !token || token === 'dev-token'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState(() => createPreviewPost(postId))
  const [form, setForm] = useState(() => createPostForm(createPreviewPost(postId)))
  const [feedback, setFeedback] = useState('')
  const [feedbackTone, setFeedbackTone] = useState('note')
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)

      if (isPreview) {
        const previewPost = createPreviewPost(postId)
        if (!active) return
        setPost(previewPost)
        setForm(createPostForm(previewPost))
        setFeedbackTone('note')
        setFeedback(previewDataNotice('帖子编辑'))
        setLoading(false)
        return
      }

      try {
        const data = await userApi.myPostDetail(postId, token)
        if (!active) return
        setPost(data)
        setForm(createPostForm(data))
        setFeedback('')
      } catch (error) {
        if (!active) return
        setFeedbackTone('error')
        setFeedback(error.message || '帖子读取失败，请稍后重试。')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [isPreview, postId, token])

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timerId = window.setTimeout(() => {
      setToastMessage('')
    }, 2800)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [toastMessage])

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const title = form.title.trim()
    const content = form.content.trim()
    const payload = {
      title,
      content,
      categoryCode: form.categoryCode,
      tags: form.tags.trim(),
      visibility: form.visibility,
      anonymous: form.anonymous,
    }

    if (title.length < POST_TITLE_MIN || title.length > POST_TITLE_MAX) {
      setFeedbackTone('error')
      setFeedback(`标题需在 ${POST_TITLE_MIN}-${POST_TITLE_MAX} 个字符之间`)
      return
    }

    if (content.length < POST_CONTENT_MIN || content.length > POST_CONTENT_MAX) {
      setFeedbackTone('error')
      setFeedback(`正文需在 ${POST_CONTENT_MIN}-${POST_CONTENT_MAX} 个字符之间`)
      return
    }

    setSaving(true)

    if (isPreview) {
      const nextPost = {
        ...post,
        ...payload,
        category: getCategoryName(payload.categoryCode),
        updatedAt: new Date().toISOString(),
      }
      setPost(nextPost)
      setForm(createPostForm(nextPost))
      setSaving(false)
      setFeedbackTone('note')
      setFeedback(previewDataNotice('帖子编辑'))
      setToastMessage('帖子编辑：本地预览已更新')
      return
    }

    try {
      const updated = await userApi.updateMyPost(postId, payload, token)
      const nextPost = {
        ...post,
        ...updated,
        ...payload,
        category: updated?.category || getCategoryName(payload.categoryCode),
      }
      setPost(nextPost)
      setForm(createPostForm(nextPost))
      setFeedback('')
      setToastMessage('帖子内容已保存。')
    } catch (error) {
      setToastMessage('')
      setFeedbackTone('error')
      setFeedback(error.message || '帖子保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  const visibilityLabel =
    visibilityOptions.find((item) => item.value === form.visibility)?.label || '公开可见'
  const currentCategoryName = getCategoryName(form.categoryCode)
  const contentLength = form.content.trim().length
  const lineCount = getLineCount(form.content)

  return (
    <div className="v2-main-column">
      {toastMessage ? (
        <div className="v2-floating-toast-wrap" aria-live="polite" aria-atomic="true">
          <div className="v2-floating-toast v2-floating-toast--success" role="status">
            {toastMessage}
          </div>
        </div>
      ) : null}

      <PageIntro
        kicker="post editor"
        pathItems={[
          { label: '个人设置', to: '/settings/profile' },
          { label: '我的发帖', to: '/settings/posts' },
          { label: '编辑帖子' },
        ]}
        title="编辑个人帖子"
        actions={(
          <div className="v2-form-actions">
            <Link className="v2-secondary-link" to="/settings/posts">返回帖子列表</Link>
            {post?.status === 'PUBLISHED' ? (
              <Link className="v2-secondary-link" to={`/community/${postId}`}>查看公开帖</Link>
            ) : null}
            <button className="v2-primary-link" type="submit" form="settings-post-form" disabled={saving}>
              {saving ? '保存中…' : '保存修改'}
            </button>
          </div>
        )}
      />

      {feedback ? (
        <div className={feedbackTone === 'error' ? 'v2-status-error' : 'v2-status-note'}>
          {feedback}
        </div>
      ) : null}

      {loading ? <div className="v2-status-note">正在加载帖子内容…</div> : null}

      {!loading ? (
        <form id="settings-post-form" className="v2-post-edit-stack" onSubmit={handleSubmit}>
          <section className="v2-split-board v2-post-edit-layout">
            <section className="v2-article-card v2-settings-form v2-post-edit-form">
              <div className="v2-settings-section-head v2-post-edit-head">
                <p className="v2-kicker">内容编辑</p>
                <h3>先维护必要元信息</h3>
              </div>

              <div className="v2-form-grid v2-post-edit-grid">
                <label className="v2-field">
                  <span>标题</span>
                  <input
                    maxLength={POST_TITLE_MAX}
                    onChange={(event) => updateField('title', event.target.value)}
                    type="text"
                    value={form.title}
                  />
                </label>

                <label className="v2-field">
                  <span>分类</span>
                  <select
                    onChange={(event) => updateField('categoryCode', event.target.value)}
                    value={form.categoryCode}
                  >
                    {postCategoryOptions.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="v2-field">
                  <span>标签</span>
                  <input
                    onChange={(event) => updateField('tags', event.target.value)}
                    type="text"
                    value={form.tags}
                  />
                </label>

                <label className="v2-field">
                  <span>可见范围</span>
                  <select
                    onChange={(event) => updateField('visibility', event.target.value)}
                    value={form.visibility}
                  >
                    {visibilityOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="v2-post-edit-inline-row">
                <label className="v2-post-edit-toggle" htmlFor="settings-post-anonymous">
                  <span>匿名发布</span>
                  <input
                    checked={form.anonymous}
                    id="settings-post-anonymous"
                    onChange={(event) => updateField('anonymous', event.target.checked)}
                    type="checkbox"
                  />
                </label>
              </div>
            </section>

            <article className="v2-article-card v2-post-edit-summary">
              <div className="v2-settings-section-head v2-post-edit-summary-head">
                <p className="v2-kicker">帖子概览</p>
                <h3>发布状态简要确认</h3>
              </div>

              <div className="v2-preview-row v2-post-edit-summary-row">
                <strong>当前分类</strong>
                <small>{currentCategoryName}</small>
              </div>
              <div className="v2-preview-row v2-post-edit-summary-row">
                <strong>发布状态</strong>
                <small>{getStatusLabel(post?.status)}</small>
              </div>
              <div className="v2-preview-row v2-post-edit-summary-row">
                <strong>可见范围</strong>
                <small>{visibilityLabel}</small>
              </div>
              <div className="v2-preview-row v2-post-edit-summary-row">
                <strong>最后更新</strong>
                <small>{formatDateLabel(post?.updatedAt)}</small>
              </div>
              <div className="v2-preview-row v2-post-edit-summary-row">
                <strong>内容字数</strong>
                <small>{contentLength} / {POST_CONTENT_MAX}</small>
              </div>
            </article>
          </section>

          <section className="v2-article-card v2-post-workbench">
            <div className="v2-post-workbench-head">
              <div className="v2-settings-section-head v2-post-workbench-copy">
                <div>
                  <p className="v2-kicker">正文工作台</p>
                  <h3>正文工作台</h3>
                </div>
                <p>这里保留一个沉浸式 Markdown 文档编辑器，把写作、整理和保存放在同一个工作区里完成。</p>
              </div>
            </div>

            <div className="v2-post-workbench-meta">
              <span>字数 {contentLength}</span>
              <span>行数 {lineCount}</span>
              <span>{visibilityLabel}</span>
              {form.anonymous ? <span>匿名发布</span> : <span>实名发布</span>}
            </div>

            <div className="v2-post-workbench-grid v2-post-workbench-grid--single">
              <Suspense fallback={<div className="v2-status-note">正在加载 Markdown 编辑器…</div>}>
                <PostMarkdownEditor
                  className="v2-post-workbench-editor"
                  label="Markdown 文档编辑器"
                  value={form.content}
                  onChange={(nextValue) => updateField('content', nextValue)}
                />
              </Suspense>
            </div>

            <div className="v2-form-actions">
              <Link className="v2-secondary-link" to="/settings/posts">取消</Link>
              <button className="v2-primary-link" disabled={saving} type="submit">
                {saving ? '保存中…' : '保存并继续编辑'}
              </button>
            </div>
          </section>
        </form>
      ) : null}
    </div>
  )
}
