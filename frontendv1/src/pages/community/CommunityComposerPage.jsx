import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import {
  canUseCommunityPreview,
  createCommunityPreviewCategories,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const fallbackCategories = [
  { id: 'kaoyan', code: 'kaoyan', name: '考研' },
  { id: 'kaogong', code: 'kaogong', name: '考公考编' },
  { id: 'job', code: 'job', name: '就业' },
  { id: 'liuxue', code: 'liuxue', name: '留学' },
  { id: 'experience', code: 'experience', name: '经验分享' },
  { id: 'resource', code: 'resource', name: '资料互助' },
]

const initialForm = {
  title: '',
  categoryCode: 'job',
  visibility: 'public',
  tags: '',
  anonymous: false,
  content: '',
  attachmentNote: '',
  markdownFile: null,
  attachments: [],
}

function createEmptyForm(categories) {
  const firstCategory = categories[0]?.code || 'job'

  return {
    ...initialForm,
    categoryCode: firstCategory,
  }
}

const COMMUNITY_COMPOSER_TIMEOUT_MESSAGE = '社区分类请求超时，请检查后端服务是否可用。'
const COMMUNITY_COMPOSER_PREVIEW_NOTICE = '当前为开发预览：分类、审核提示和提交反馈基于后端字段结构提供演示内容。'

export default function CommunityComposerPage() {
  const { token, isAuthed } = useAuth()
  const [categories, setCategories] = useState(fallbackCategories)
  const [form, setForm] = useState(createEmptyForm(fallbackCategories))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [previewNotice, setPreviewNotice] = useState('')
  const isForcedPreview = shouldForceCommunityPreview(token)
  const isPreviewMode = Boolean(previewNotice)

  useEffect(() => {
    let active = true

    async function loadCategories() {
      setLoading(true)
      setError('')
      setPreviewNotice('')

      function applyPreviewCategories() {
        const nextCategories = createCommunityPreviewCategories()
        setCategories(nextCategories)
        setForm((current) => ({
          ...current,
          categoryCode: nextCategories[0]?.code || 'kaoyan',
        }))
        setPreviewNotice(COMMUNITY_COMPOSER_PREVIEW_NOTICE)
      }

      if (isForcedPreview) {
        if (!active) return
        applyPreviewCategories()
        setLoading(false)
        return
      }

      try {
        const data = await withRequestTimeout(
          communityApi.categories(),
          8000,
          COMMUNITY_COMPOSER_TIMEOUT_MESSAGE,
        )
        if (!active) return

        const nextCategories = data?.length ? data : fallbackCategories
        setCategories(nextCategories)
        setForm((current) => ({
          ...current,
          categoryCode: current.categoryCode || nextCategories[0]?.code || 'job',
        }))
        setPreviewNotice('')
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview()) {
          applyPreviewCategories()
          setError('')
        } else {
          setCategories(fallbackCategories)
          setError(requestError.message || '分类加载失败，请稍后再试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [isForcedPreview])

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(status) {
    if (!isAuthed) {
      setError('请先登录后再发帖。')
      return
    }

    const normalizedTitle = form.title.trim()
    const normalizedContent = form.content.trim()

    if (!normalizedTitle) {
      setError('标题不能为空。')
      return
    }
    if (!form.categoryCode) {
      setError('请选择帖子分类。')
      return
    }
    if (!normalizedContent && !form.markdownFile) {
      setError('请填写正文，或上传 Markdown 文件。')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (isPreviewMode) {
        setMessage(
          status === 'DRAFT'
            ? '当前为开发预览：已模拟保存草稿，正式保存仍需连接后端。'
            : '当前为开发预览：已模拟提交审核，正式审核流仍需连接后端。',
        )
        setForm(createEmptyForm(categories))
        return
      }

      const payload = new FormData()
      payload.append('title', normalizedTitle)
      payload.append('categoryCode', form.categoryCode)
      payload.append('visibility', form.visibility)
      payload.append('anonymous', String(Boolean(form.anonymous)))
      payload.append('hasAttachment', String(form.attachments.length > 0))
      payload.append('attachmentNote', form.attachmentNote.trim())
      payload.append('status', status)
      payload.append('content', normalizedContent)

      if (form.markdownFile) {
        payload.append('markdownFile', form.markdownFile)
      }

      form.tags
        .split(/[，,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((tag) => payload.append('tags', tag))

      form.attachments.forEach((file) => {
        payload.append('attachments', file)
      })

      await communityApi.createPost(payload, token)

      setMessage(status === 'DRAFT' ? '草稿已保存。你可以返回社区列表，稍后再继续整理。' : '帖子已提交审核。审核完成后会按可见范围进入社区列表。')
      setForm(createEmptyForm(categories))
    } catch (requestError) {
      setError(requestError.message || '发帖失败，请稍后再试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="v1-community-composer-page">
      <ReturnBar
        items={[
          { label: '游客门厅', to: '/' },
          { label: '社区', to: '/community' },
          { label: '发帖' },
        ]}
        hint="社区发帖被拆成独立页面，写完后再明确回到列表流。"
      />

      <div className="v1-community-composer-hero">
        <div className="v1-community-hero-copy">
          <p className="v1-eyebrow">发帖工作页</p>
          <h1>发一篇能被人快速看懂的帖子。</h1>
          <p className="v1-lead">
            发帖入口不再塞在列表弹窗里，而是单独拆成工作页。你可以先整理标题、正文、附件说明，再决定存草稿还是提交审核。
          </p>
        </div>

        <aside className="v1-community-rule-panel">
          <div className="v1-community-rule-kicker">审核提醒</div>
          <p className="v1-community-hero-note">
            附件帖子会进入审核队列，Markdown 正文与附件说明请写清楚。
          </p>
          <ul className="v1-community-rule-list">
            <li>正文可以直接输入，也可以补充上传 Markdown 文件。</li>
            <li>附件越多，越需要把文件用途写在附件说明里。</li>
            <li>只有登录用户可以提交草稿或审核请求。</li>
          </ul>
        </aside>
      </div>

      {!isAuthed ? (
        <section className="v1-panel v1-community-login-callout v1-community-login-callout--standalone">
          <strong>登录后继续发帖</strong>
          <p>游客可以先浏览社区，但真正发帖前需要登录，这样审核流和互动记录才能绑定到你的账号。</p>
          <div className="v1-action-row">
            <RoleAuthLink className="v1-btn v1-btn--primary">
              去登录
            </RoleAuthLink>
            <Link className="v1-btn" to="/community">
              先回社区列表
            </Link>
          </div>
        </section>
      ) : (
        <div className="v1-community-compose-grid">
          <section className="v1-panel v1-community-compose-main">
            <div className="v1-panel-head">
              <p className="v1-eyebrow">内容编辑</p>
              <h2>先把内容讲清楚，再决定发布动作。</h2>
            </div>

            {loading ? <div className="v1-community-state">正在载入分类…</div> : null}
            {previewNotice ? <PreviewBanner>{previewNotice}</PreviewBanner> : null}
            {error ? <div className="v1-error">{error}</div> : null}
            {message ? <div className="v1-message">{message}</div> : null}

            <div className="v1-form-grid">
              <label className="v1-field">
                <span>标题</span>
                <input
                  type="text"
                  value={form.title}
                  placeholder="让人一眼知道这篇帖子在解决什么问题"
                  onChange={(event) => updateField('title', event.target.value)}
                />
              </label>

              <label className="v1-field">
                <span>分类</span>
                <select
                  value={form.categoryCode}
                  onChange={(event) => updateField('categoryCode', event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item.id || item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="v1-field">
                <span>可见范围</span>
                <select value={form.visibility} onChange={(event) => updateField('visibility', event.target.value)}>
                  <option value="public">公开可见</option>
                  <option value="members">仅注册成员可见</option>
                </select>
              </label>

              <label className="v1-field">
                <span>标签</span>
                <input
                  type="text"
                  value={form.tags}
                  placeholder="多个标签用逗号分开"
                  onChange={(event) => updateField('tags', event.target.value)}
                />
              </label>
            </div>

            <label className="v1-field">
              <span>正文</span>
              <textarea
                rows="14"
                value={form.content}
                placeholder="把过程、结论和适用人群写清楚。Markdown 语法可以直接输入。"
                onChange={(event) => updateField('content', event.target.value)}
              />
            </label>

            <div className="v1-form-grid">
              <label className="v1-field">
                <span>Markdown 文件</span>
                <input
                  type="file"
                  accept=".md,.markdown,text/markdown,text/plain"
                  onChange={(event) => updateField('markdownFile', event.target.files?.[0] || null)}
                />
              </label>

              <label className="v1-field">
                <span>上传附件</span>
                <input
                  type="file"
                  multiple
                  onChange={(event) => updateField('attachments', Array.from(event.target.files || []))}
                />
              </label>
            </div>

            <label className="v1-field">
              <span>附件说明</span>
              <textarea
                rows="5"
                value={form.attachmentNote}
                placeholder="告诉别人附件里是什么，适合谁下载，以及使用前要注意什么。"
                onChange={(event) => updateField('attachmentNote', event.target.value)}
              />
            </label>

            <label className="v1-community-checkbox">
              <input
                checked={form.anonymous}
                type="checkbox"
                onChange={(event) => updateField('anonymous', event.target.checked)}
              />
              <span>匿名发布</span>
            </label>

            <div className="v1-action-row">
              <button
                className="v1-btn v1-btn--primary"
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('PENDING')}
              >
                {submitting ? '提交中…' : '提交审核'}
              </button>
              <button
                className="v1-btn"
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('DRAFT')}
              >
                先存草稿
              </button>
            </div>
          </section>

          <aside className="v1-community-side-stack">
            <section className="v1-panel v1-community-panel">
              <div className="v1-panel-head">
                <p className="v1-eyebrow">当前材料</p>
                <h2>提交前确认一遍。</h2>
              </div>

              <div className="v1-card-stack">
                <div className="v1-list-card">
                  <strong>Markdown 文件</strong>
                  <span>{form.markdownFile?.name || '还没有上传文件，当前以正文输入为主。'}</span>
                </div>
                <div className="v1-list-card">
                  <strong>附件数量</strong>
                  <span>{form.attachments.length ? `${form.attachments.length} 个附件待提交` : '当前没有附件。'}</span>
                </div>
                <div className="v1-list-card">
                  <strong>发帖路径</strong>
                  <span>写内容 -&gt; 选提交动作 -&gt; 返回社区列表继续浏览或等待审核结果。</span>
                </div>
              </div>
            </section>

            {form.attachments.length ? (
              <section className="v1-panel v1-community-panel">
                <div className="v1-panel-head">
                  <p className="v1-eyebrow">附件清单</p>
                  <h2>本次会一并提交这些文件。</h2>
                </div>
                <div className="v1-card-stack">
                  {form.attachments.map((file) => (
                    <div className="v1-list-card" key={`${file.name}-${file.size}`}>
                      <strong>{file.name}</strong>
                      <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  )
}
