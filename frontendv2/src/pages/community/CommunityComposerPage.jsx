import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import SubnavTabs from '@/components/SubnavTabs.jsx'
import {
  createCommunityPreviewCategories,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import {
  communityVisibilityOptions,
  normalizeCommunityCategory,
} from '@/lib/communityUi.js'

const communityTabs = [
  { label: '社区目录', to: '/community', note: '浏览与筛选' },
  { label: '发布帖子', to: '/community/new', note: '提交正文与附件' },
  { label: '消息通知', to: '/community/notifications', note: '查看互动提醒' },
]

const initialForm = {
  title: '',
  categoryCode: '',
  visibility: 'public',
  anonymous: false,
  tags: [''],
  content: '',
  attachmentNote: '',
  attachments: [],
  markdownFile: null,
}

function normalizeFileList(fileList) {
  return Array.from(fileList || [])
}

function normalizeTagValue(value) {
  return Array.from(String(value || '')).slice(0, 10).join('')
}

export default function CommunityComposerPage() {
  const navigate = useNavigate()
  const { isAuthed, token } = useAuth()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const isForcedPreview = shouldForceCommunityPreview(token)

  useEffect(() => {
    let active = true

    async function loadCategories() {
      setLoading(true)
      setError('')

      try {
        const categoryData = isForcedPreview
          ? createCommunityPreviewCategories()
          : await communityApi.categories()
        if (!active) return
        setCategories((categoryData || []).map(normalizeCommunityCategory))
        setForm((current) => ({
          ...current,
          categoryCode: current.categoryCode || categoryData?.[0]?.code || '',
        }))
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || '分类加载失败，请稍后再试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCategories()
    return () => {
      active = false
    }
  }, [isForcedPreview])

  const selectedCategory = useMemo(() => (
    categories.find((item) => item.code === form.categoryCode) || null
  ), [categories, form.categoryCode])

  const canSubmitForReal = isAuthed && token && token !== 'dev-token'
  const estimatedTagList = form.tags
    .map((item) => item.trim())
    .filter(Boolean)
  const identitySummary = !isAuthed
    ? '游客浏览，登录后才能真正提交。'
    : !canSubmitForReal
      ? '演示身份，可先检查结构，但不会真正提交。'
      : '真实登录，可直接提交审核。'
  const preSubmitNotice = !canSubmitForReal
    ? (isAuthed
        ? '当前是演示身份，可以先查看发布结构，但不会真正提交到后端。'
        : '游客当前可以先查看发布结构，登录后再提交到后端。')
    : ''

  function updateField(name, value) {
    setMessage('')
    setError('')
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateTagAt(index, value) {
    const nextValue = normalizeTagValue(value)
    setMessage('')
    setError('')
    setForm((current) => ({
      ...current,
      tags: current.tags.map((item, itemIndex) => (itemIndex === index ? nextValue : item)),
    }))
  }

  function appendTagField() {
    setMessage('')
    setError('')
    setForm((current) => ({
      ...current,
      tags: [...current.tags, ''],
    }))
  }

  function removeTagAt(index) {
    setMessage('')
    setError('')
    setForm((current) => {
      const nextTags = current.tags.filter((_, itemIndex) => itemIndex !== index)
      return {
        ...current,
        tags: nextTags.length ? nextTags : [''],
      }
    })
  }

  async function handleSubmit(submitAction) {
    if (!form.title.trim()) {
      setError('请先填写帖子标题。')
      return
    }
    if (!form.categoryCode) {
      setError('请先选择帖子分类。')
      return
    }
    if (!form.content.trim() && !form.markdownFile) {
      setError('正文和 Markdown 文件至少填写一种。')
      return
    }

    if (!canSubmitForReal) {
      setMessage(isAuthed
        ? '当前是演示身份，只展示发帖流程，不会真正提交到后端。请用真实账号登录后联调。'
        : '游客不能发帖，请先登录或注册。')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const payload = new FormData()
      payload.append('title', form.title.trim())
      payload.append('categoryCode', form.categoryCode)
      payload.append('visibility', form.visibility)
      payload.append('anonymous', String(Boolean(form.anonymous)))
      payload.append('hasAttachment', String(Boolean(form.attachments.length)))
      payload.append('attachmentNote', form.attachmentNote.trim())
      payload.append('status', submitAction === 'draft' ? 'DRAFT' : 'PENDING')
      payload.append('content', form.content.trim())

      if (form.markdownFile) {
        payload.append('markdownFile', form.markdownFile)
      }

      estimatedTagList.forEach((tag) => {
        payload.append('tags', tag)
      })

      form.attachments.forEach((file) => {
        payload.append('attachments', file)
      })

      const result = await communityApi.createPost(payload, token)
      const nextPostId = result?.id

      if (nextPostId) {
        navigate(`/community/${nextPostId}`)
      } else {
        navigate('/community')
      }
    } catch (requestError) {
      setError(requestError.message || '发帖失败，请稍后再试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="社区发帖"
          title="把标题、正文、附件说明分开整理，再送进审核流。"
          lead="发帖页只负责帖子本身，不在这里夹带评论、通知或其他社区动作。"
          pathItems={[
            { label: '社区目录', to: '/community' },
            { label: '发布帖子' },
          ]}
          actions={(
            <Link className="v2-secondary-link" to="/community">返回社区目录</Link>
          )}
        />

        <SubnavTabs items={communityTabs} />

        {preSubmitNotice ? <div className="v2-status-note">{preSubmitNotice}</div> : null}
        {message ? <div className="v2-status-note">{message}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        <section className="v2-article-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">基础信息</p>
              <h3>先明确帖子归属与公开范围</h3>
            </div>
          </div>

          {loading ? (
            <div className="v2-empty-card">正在加载分类...</div>
          ) : (
            <div className="v2-form-grid">
              <label className="v2-field">
                <span>帖子标题</span>
                <input
                  type="text"
                  value={form.title}
                  placeholder="例如：复试资料整理经验，如何避免附件无序堆积"
                  onChange={(event) => updateField('title', event.target.value)}
                />
              </label>

              <label className="v2-field">
                <span>帖子分类</span>
                <select
                  value={form.categoryCode}
                  onChange={(event) => updateField('categoryCode', event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item.id || item.code} value={item.code}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label className="v2-field">
                <span>可见范围</span>
                <div className="v2-segment-group" role="group" aria-label="帖子可见范围">
                  {communityVisibilityOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`v2-segment-button ${form.visibility === item.value ? 'is-active' : ''}`}
                      onClick={() => updateField('visibility', item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="v2-field v2-field--checkbox">
                <span>匿名发布</span>
                <button
                  type="button"
                  className={`v2-toggle-button ${form.anonymous ? 'is-active' : ''}`}
                  onClick={() => updateField('anonymous', !form.anonymous)}
                >
                  {form.anonymous ? '已开启匿名' : '使用实名发布'}
                </button>
              </label>
            </div>
          )}
        </section>

        <section className="v2-article-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">正文</p>
              <h3>正文独立整理，附件说明不要混进主体内容</h3>
            </div>
          </div>

          <div className="v2-form-grid v2-form-grid--single">
            <div className="v2-field">
              <span>标签</span>
              <div className="v2-tag-input-list" role="group" aria-label="标签">
                {form.tags.map((tag, index) => (
                  <div className="v2-tag-input-row" key={`tag-slot-${index}`}>
                    <input
                      type="text"
                      value={tag}
                      maxLength={10}
                      aria-label={`标签 ${index + 1}`}
                      placeholder="一个空格填一个标签"
                      onChange={(event) => updateTagAt(index, event.target.value)}
                    />
                    <button
                      className="v2-tag-input-action"
                      type="button"
                      aria-label="新增标签输入框"
                      title="新增标签输入框"
                      onClick={appendTagField}
                    >
                      +
                    </button>
                    {form.tags.length > 1 ? (
                      <button
                        className="v2-tag-input-action v2-tag-input-action--muted"
                        type="button"
                        aria-label={`删除标签 ${index + 1}`}
                        title={`删除标签 ${index + 1}`}
                        onClick={() => removeTagAt(index)}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <small className="v2-field-hint">每个标签最多 10 个字，点击 + 新增下一个标签。</small>
            </div>

            <label className="v2-field">
              <span>正文内容</span>
              <textarea
                rows="14"
                value={form.content}
                placeholder="支持直接粘贴正文，也可以搭配 Markdown 文件上传。"
                onChange={(event) => updateField('content', event.target.value)}
              />
            </label>

            <label className="v2-field">
              <span>Markdown 文件</span>
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={(event) => updateField('markdownFile', event.target.files?.[0] || null)}
              />
            </label>
          </div>
        </section>

        <section className="v2-article-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">附件</p>
              <h3>附件和附件说明单独管理，避免用户下载后找不到入口</h3>
            </div>
          </div>

          <div className="v2-form-grid v2-form-grid--single">
            <label className="v2-field">
              <span>附件说明</span>
              <textarea
                rows="5"
                value={form.attachmentNote}
                placeholder="建议写清楚附件用途、适用阶段、推荐先看哪一个文件。"
                onChange={(event) => updateField('attachmentNote', event.target.value)}
              />
            </label>

            <label className="v2-field">
              <span>上传附件</span>
              <input
                type="file"
                multiple
                onChange={(event) => updateField('attachments', normalizeFileList(event.target.files))}
              />
            </label>
          </div>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">提交控制</p>
          <div className="v2-side-action-stack">
            <button
              className="v2-primary-link"
              type="button"
              disabled={submitting || loading}
              onClick={() => handleSubmit('publish')}
            >
              {submitting ? '提交中...' : '提交审核'}
            </button>
            <button
              className="v2-secondary-link"
              type="button"
              disabled={submitting || loading}
              onClick={() => handleSubmit('draft')}
            >
              保存草稿
            </button>
          </div>
          <p className="v2-note-text">
            {canSubmitForReal
              ? '提交审核后会进入后端审核流。'
              : '当前页面可完整预览发帖结构，但只有真实登录账号才会真正提交。'}
          </p>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">提交前确认</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>当前身份</strong>
              <span>{identitySummary}</span>
            </div>
            <div className="v2-check-row">
              <strong>标题预览</strong>
              <span>{form.title.trim() || '未填写'}</span>
            </div>
            <div className="v2-check-row">
              <strong>分类</strong>
              <span>{selectedCategory?.name || '未选择'}</span>
            </div>
            <div className="v2-check-row">
              <strong>标签数</strong>
              <span>{estimatedTagList.length} 个</span>
            </div>
            <div className="v2-check-row">
              <strong>附件数</strong>
              <span>{form.attachments.length} 个</span>
            </div>
            <div className="v2-check-row">
              <strong>正文状态</strong>
              <span>{form.content.trim() || form.markdownFile ? '已填写' : '待填写'}</span>
            </div>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">发布检查</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>标题与分类</strong>
              <span>先让帖子能被准确归档。</span>
            </div>
            <div className="v2-check-row">
              <strong>正文与说明分离</strong>
              <span>附件使用方法写在说明里，不要混在正文中部。</span>
            </div>
            <div className="v2-check-row">
              <strong>附件顺序明确</strong>
              <span>最好写清楚先看哪一个，再下载哪一个。</span>
            </div>
          </div>
        </section>
      </aside>
    </>
  )
}
