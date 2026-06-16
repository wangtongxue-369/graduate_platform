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
import { useCommunitySubnavItems } from '@/lib/communityTabs.js'

const communityTabItems = [
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

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return '0 B'
  if (size < 1024) return `${size} B`

  const units = ['KB', 'MB', 'GB']
  let value = size / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const fixed = value >= 10 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
  return `${fixed} ${units[unitIndex]}`
}

function isMarkdownFileName(fileName) {
  return /\.(md|markdown)$/i.test(String(fileName || ''))
}

const MAX_ATTACHMENT_COUNT = 6
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024
const ALLOWED_ATTACHMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'zip', 'rar', '7z',
]

function ensureSentence(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return /[。！？]$/.test(text) ? text : `${text}。`
}

function getFileExtension(fileName) {
  const normalizedName = String(fileName || '').trim()
  const lastDotIndex = normalizedName.lastIndexOf('.')
  if (lastDotIndex < 0 || lastDotIndex === normalizedName.length - 1) {
    return ''
  }
  return normalizedName.slice(lastDotIndex + 1).toLowerCase()
}

function getAttachmentRequirementHint() {
  return `合规附件要求：单帖最多 ${MAX_ATTACHMENT_COUNT} 个；每个文件不能超过 20MB；文件名需要带扩展名；支持 ${ALLOWED_ATTACHMENT_EXTENSIONS.join('、')}。`
}

function buildAttachmentGuidance(extraHint = '') {
  const segments = []
  if (extraHint) {
    segments.push(ensureSentence(extraHint))
  }
  segments.push(getAttachmentRequirementHint())
  return segments.join('')
}

function buildAttachmentValidationFeedback(title, problem, extraHint = '') {
  return {
    ...buildValidationFeedback(title, ensureSentence(problem)),
    extraMessage: buildAttachmentGuidance(extraHint),
  }
}

function buildAttachmentRequestFailureFeedback(rawMessage) {
  if (!rawMessage) return null

  const normalizedMessage = String(rawMessage).trim()
  const attachmentExtraHint = normalizedMessage.includes('至少上传一个附件')
    ? '如需发布含附件帖子，请先上传至少 1 个附件。'
    : ''

  if (
    normalizedMessage.includes('至少上传一个附件')
    || normalizedMessage.includes('单帖最多上传')
    || normalizedMessage.includes('检测到重复附件')
    || normalizedMessage.includes('附件不能为空文件')
    || normalizedMessage.includes('附件超过 20MB')
    || normalizedMessage.includes('不支持的附件格式')
    || normalizedMessage.includes('附件必须包含扩展名')
  ) {
    return {
      tone: 'error',
      kicker: '附件校验',
      title: '附件不符合要求',
      message: ensureSentence(normalizedMessage),
      extraMessage: buildAttachmentGuidance(attachmentExtraHint),
      confirmLabel: '继续修改',
    }
  }

  return null
}

function validateAttachments(attachments) {
  if (!attachments.length) return null

  if (attachments.length > MAX_ATTACHMENT_COUNT) {
    return buildAttachmentValidationFeedback(
      '附件数量过多',
      `当前选择了 ${attachments.length} 个附件。`,
    )
  }

  for (const file of attachments) {
    const originalName = String(file?.name || '').trim() || '未命名附件'
    if ((file?.size || 0) <= 0) {
      return buildAttachmentValidationFeedback(
        '附件为空文件',
        `当前附件为空文件：${originalName}`,
      )
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      return buildAttachmentValidationFeedback(
        '附件体积超出限制',
        `当前附件超过 20MB：${originalName}`,
      )
    }

    const extension = getFileExtension(originalName)
    if (!extension) {
      return buildAttachmentValidationFeedback(
        '附件缺少扩展名',
        `当前附件缺少扩展名：${originalName}`,
      )
    }

    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      return buildAttachmentValidationFeedback(
        '附件不符合要求',
        `当前附件格式暂不支持：${originalName}`,
      )
    }
  }

  return null
}

function buildValidationFeedback(title, message) {
  return {
    tone: 'warning',
    kicker: '发布检查',
    title,
    message,
    confirmLabel: '继续填写',
  }
}

function buildRestrictionFeedback(isAuthed) {
  if (!isAuthed) {
    return {
      tone: 'warning',
      kicker: '当前受限',
      title: '当前还不能提交帖子',
      message: '游客状态只能先浏览和整理内容，登录后才能把帖子真正提交到社区。',
      confirmLabel: '知道了',
    }
  }

  return {
    tone: 'warning',
    kicker: '当前受限',
    title: '当前账号处于演示模式',
    message: '演示账号只展示发帖流程，不会真的向后端创建帖子。请切换到真实账号后再提交。',
    confirmLabel: '知道了',
  }
}

function buildSubmitSuccessFeedback(submitAction, nextPostId) {
  if (submitAction === 'draft') {
    return {
      tone: 'success',
      kicker: '保存成功',
      title: '草稿已保存',
      message: '这篇帖子已经保存到你的个人帖子里，你可以稍后继续编辑。',
      confirmLabel: nextPostId ? '继续编辑' : '返回社区',
      confirmAction: {
        type: 'navigate',
        to: nextPostId ? `/settings/posts/${nextPostId}/edit` : '/community',
      },
    }
  }

  return {
    tone: 'success',
    kicker: '提交成功',
    title: '帖子已提交审核',
    message: '你的帖子已经提交到社区审核流，审核通过后就会出现在社区目录里。',
    confirmLabel: nextPostId ? '查看帖子' : '返回社区',
    confirmAction: {
      type: 'navigate',
      to: nextPostId ? `/community/${nextPostId}` : '/community',
    },
  }
}

function buildRequestFailureFeedback(requestError) {
  const status = typeof requestError?.status === 'number' ? requestError.status : null
  const rawMessage = String(requestError?.message || '').trim()

  if (status === 401 || status === 403) {
    return {
      tone: 'error',
      kicker: '登录状态异常',
      title: '登录状态需要重新确认',
      message: '当前登录状态可能已经失效，请重新登录后再提交帖子。',
      confirmLabel: '知道了',
    }
  }

  if (rawMessage === 'Failed to fetch' || (!status && !rawMessage)) {
    return {
      tone: 'error',
      kicker: '网络异常',
      title: '网络连接暂时不可用',
      message: '当前没有成功连上服务，请检查网络或稍后重试。',
      confirmLabel: '知道了',
    }
  }

  if (status !== null && status >= 500) {
    return {
      tone: 'error',
      kicker: '服务异常',
      title: '服务暂时不可用',
      message: '服务器暂时没有给出有效响应，请稍后再试。',
      confirmLabel: '知道了',
    }
  }

  const attachmentFeedback = buildAttachmentRequestFailureFeedback(rawMessage)
  if (attachmentFeedback) {
    return attachmentFeedback
  }

  return {
    tone: 'error',
    kicker: '系统反馈',
    title: '提交失败',
    message: rawMessage || '发帖失败，请稍后再试。',
    confirmLabel: '继续修改',
  }
}

export default function CommunityComposerPage() {
  const navigate = useNavigate()
  const { isAuthed, token } = useAuth()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const isForcedPreview = shouldForceCommunityPreview(token)
  const communityTabs = useCommunitySubnavItems(communityTabItems)

  function openFeedback(config) {
    setFeedback({
      tone: 'info',
      kicker: '提交提醒',
      title: '提醒',
      message: '',
      extraMessage: '',
      confirmLabel: '知道了',
      confirmAction: null,
      ...config,
    })
  }

  function clearFeedback() {
    setFeedback(null)
  }

  function handleFeedbackConfirm() {
    const nextAction = feedback?.confirmAction
    clearFeedback()
    if (nextAction?.type === 'navigate') {
      navigate(nextAction.to)
    }
  }

  useEffect(() => {
    let active = true

    async function loadCategories() {
      setLoading(true)
      clearFeedback()

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
        openFeedback({
          tone: 'error',
          kicker: '页面初始化失败',
          title: '分类加载失败',
          message: requestError.message || '分类数据暂时没有加载成功，请稍后重试。',
          confirmLabel: '知道了',
        })
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
  const markdownFileSummary = form.markdownFile
    ? `已选择：${form.markdownFile.name}（${formatFileSize(form.markdownFile.size)}）`
    : ''
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
    clearFeedback()
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateTagAt(index, value) {
    const nextValue = normalizeTagValue(value)
    clearFeedback()
    setForm((current) => ({
      ...current,
      tags: current.tags.map((item, itemIndex) => (itemIndex === index ? nextValue : item)),
    }))
  }

  function appendTagField() {
    clearFeedback()
    setForm((current) => ({
      ...current,
      tags: [...current.tags, ''],
    }))
  }

  function removeTagAt(index) {
    clearFeedback()
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
      openFeedback(buildValidationFeedback('请先补全标题', '标题是帖子进入社区后的第一眼信息，请先填写标题。'))
      return
    }
    if (!form.categoryCode) {
      openFeedback(buildValidationFeedback('请先选择分类', '分类决定帖子会被归到哪里，请先选好分类再提交。'))
      return
    }
    if (!form.content.trim() && !form.markdownFile) {
      openFeedback(buildValidationFeedback('请先补全正文', '正文内容和 Markdown 文件至少要提供一种，帖子才能进入发布流程。'))
      return
    }
    if (form.markdownFile && form.markdownFile.size === 0) {
      openFeedback(buildValidationFeedback('Markdown 文件为空', '你选择的 Markdown 文件是空文件，请确认内容后重新上传。'))
      return
    }
    if (form.markdownFile && !isMarkdownFileName(form.markdownFile.name)) {
      openFeedback(buildValidationFeedback('Markdown 格式不支持', '请上传 .md 或 .markdown 格式的正文文件。'))
      return
    }
    const attachmentFeedback = validateAttachments(form.attachments)
    if (attachmentFeedback) {
      openFeedback(attachmentFeedback)
      return
    }
    if (!canSubmitForReal) {
      openFeedback(buildRestrictionFeedback(isAuthed))
      return
    }

    setSubmitting(true)
    clearFeedback()

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
      openFeedback(buildSubmitSuccessFeedback(submitAction, result?.id))
    } catch (requestError) {
      openFeedback(buildRequestFailureFeedback(requestError))
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
                rows="9"
                value={form.content}
                placeholder="支持直接粘贴正文，也可以搭配 Markdown 文件上传。"
                onChange={(event) => updateField('content', event.target.value)}
              />
            </label>

            <label className="v2-field">
              <span>Markdown 文件</span>
              <input
                type="file"
                accept=".md,.markdown"
                onChange={(event) => updateField('markdownFile', event.target.files?.[0] || null)}
              />
              <small className="v2-field-hint">
                {markdownFileSummary || '支持 .md / .markdown，选中后会在这里显示文件名。'}
              </small>
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

      <aside className="v2-side-column v2-composer-side-column">
        <section className="v2-side-card v2-side-card--composer-summary">
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
          <div className="v2-composer-summary">
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

      {feedback ? (
        <div className="v2-feedback-backdrop" onClick={clearFeedback}>
          <section
            aria-labelledby="v2-composer-error-title"
            aria-modal="true"
            className="v2-feedback-dialog"
            data-tone={feedback.tone}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="v2-feedback-dialog__head">
              <div>
                <p className="v2-kicker">{feedback.kicker}</p>
                <h2 id="v2-composer-error-title">{feedback.title}</h2>
              </div>
              <button
                aria-label="关闭提醒"
                className="v2-feedback-dialog__close"
                onClick={clearFeedback}
                type="button"
              >
                关闭
              </button>
            </div>
            <p className="v2-feedback-dialog__message">{feedback.message}</p>
            {feedback.extraMessage ? (
              <p className="v2-feedback-dialog__message v2-feedback-dialog__message--muted">
                {feedback.extraMessage}
              </p>
            ) : null}
            <div className="v2-feedback-dialog__actions">
              <button className="v2-primary-link" onClick={handleFeedbackConfirm} type="button">
                {feedback.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
