import { useEffect, useRef, useState } from 'react'
import MarkdownContent from './MarkdownContent.jsx'

const TITLE_MAX = 60
const CONTENT_MAX = 50000
const MAX_ATTACHMENT_COUNT = 6
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024

const ATTACH_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar,.7z'
const ATTACH_EXT_ALLOW = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'zip', 'rar', '7z'])
const STUDY_ABROAD_TOPICS = ['选校定位', '申请流程', '语言考试', '文书PS', '签证办理', '海外生活']
const STUDY_ABROAD_PHASES = ['准备阶段', '网申阶段', '面试阶段', '签证阶段', '行前准备']

function buildInitialForm(categories) {
  return {
    title: '',
    markdownFile: null,
    markdownFileName: '',
    markdownContent: '',
    categoryCode: categories[0]?.code || 'kaoyan',
    tags: '',
    visibility: 'public',
    anonymous: false,
    hasAttachment: false,
    attachmentNote: '',
    attachments: [],
    studyAbroadMeta: {
      country: '',
      topic: STUDY_ABROAD_TOPICS[0],
      phase: STUDY_ABROAD_PHASES[0],
      targetSchool: '',
      targetMajor: '',
      intakeTerm: '',
      summary: '',
    },
    submitAction: 'publish',
  }
}

function extractMarkdownTitle(content, fileName) {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine.startsWith('#')) continue
    const title = trimmedLine.replace(/^#{1,6}\s*/, '').trim()
    if (title) return title
  }
  return fileName.replace(/\.[^.]+$/, '')
}

async function readMarkdownFile(file) {
  const fileName = file?.name || ''
  const lowerName = fileName.toLowerCase()
  if (!lowerName.endsWith('.md') && !lowerName.endsWith('.markdown')) {
    throw new Error('请上传 .md 或 .markdown 文件')
  }

  const rawContent = await file.text()
  return rawContent.replace(/\r\n/g, '\n').trim()
}

function extOf(fileName = '') {
  const seg = String(fileName).split('.')
  return seg.length > 1 ? seg.pop().toLowerCase() : ''
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function isLiuxueCategory(code) {
  return String(code || '').toLowerCase() === 'liuxue'
}

function PostComposerModal({ open, onClose, categories, onSubmit, submitting, error }) {
  const [form, setForm] = useState(() => buildInitialForm(categories))
  const [localError, setLocalError] = useState('')
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(true)
  const fileInputRef = useRef(null)
  const attachmentInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm(categories))
    setLocalError('')
    setIsPreviewCollapsed(true)
  }, [open, categories])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setLocalError('')
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const titleLength = form.title.trim().length
  const contentLength = form.markdownContent.length
  const categoryCode = categories.find((item) => item.code === form.categoryCode)
    ? form.categoryCode
    : (categories[0]?.code || 'kaoyan')
  const isStudyAbroad = isLiuxueCategory(categoryCode)

  function closeModal() {
    setLocalError('')
    onClose()
  }

  function clearNativeFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function clearAttachmentInput() {
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
  }

  function updateStudyAbroadMeta(field, value) {
    setLocalError('')
    setForm((current) => ({
      ...current,
      studyAbroadMeta: {
        ...current.studyAbroadMeta,
        [field]: value,
      },
    }))
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setLocalError('')
    try {
      const markdownContent = await readMarkdownFile(file)
      const nextTitle = form.title.trim() || extractMarkdownTitle(markdownContent, file.name)
      setForm((current) => ({
        ...current,
        title: nextTitle.slice(0, TITLE_MAX),
        markdownFile: file,
        markdownFileName: file.name,
        markdownContent,
      }))
    } catch (fileError) {
      setForm((current) => ({
        ...current,
        markdownFile: null,
        markdownFileName: '',
      }))
      clearNativeFileInput()
      setLocalError(fileError.message || 'Markdown 文件读取失败')
    }
  }

  function handleAttachmentChange(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      setForm((current) => ({ ...current, attachments: [] }))
      return
    }

    if (files.length > MAX_ATTACHMENT_COUNT) {
      setLocalError(`单帖最多上传 ${MAX_ATTACHMENT_COUNT} 个附件`)
      clearAttachmentInput()
      return
    }

    for (const file of files) {
      const ext = extOf(file.name)
      if (!ATTACH_EXT_ALLOW.has(ext)) {
        setLocalError(`不支持的附件格式: .${ext || '(无扩展名)'}`)
        clearAttachmentInput()
        return
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setLocalError(`附件超过 20MB 限制: ${file.name}`)
        clearAttachmentInput()
        return
      }
    }

    setLocalError('')
    setForm((current) => ({
      ...current,
      hasAttachment: true,
      attachments: files,
    }))
  }

  function clearFile() {
    setLocalError('')
    setForm((current) => ({
      ...current,
      markdownFile: null,
      markdownFileName: '',
    }))
    clearNativeFileInput()
  }

  function clearAttachments() {
    setLocalError('')
    setForm((current) => ({
      ...current,
      attachments: [],
      hasAttachment: false,
      attachmentNote: '',
    }))
    clearAttachmentInput()
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card composer-modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">发布帖子</div>
            <div className="muted">直接填写正文即可发布，也可以导入 Markdown 文件并附加学习资料。</div>
          </div>
          <button className="icon-btn" type="button" onClick={closeModal}>x</button>
        </div>
        <form
          className="modal-body"
          onSubmit={(event) => {
            event.preventDefault()
            setLocalError('')
            if (titleLength < 6 || titleLength > TITLE_MAX) {
              setLocalError(`标题需在 6-${TITLE_MAX} 个字符之间`)
              return
            }
            if (contentLength < 20 || contentLength > CONTENT_MAX) {
              setLocalError(`Markdown 正文需在 20-${CONTENT_MAX} 个字符之间`)
              return
            }
            if (form.hasAttachment && form.attachments.length === 0) {
              setLocalError('勾选“含附件”后，请至少上传一个附件')
              return
            }
            if (isStudyAbroad) {
              const meta = form.studyAbroadMeta || {}
              if (!meta.country.trim()) {
                setLocalError('留学分类帖子请填写申请国家/地区')
                return
              }
              if (!meta.summary.trim()) {
                setLocalError('留学分类帖子请填写经验摘要')
                return
              }
            }
            onSubmit({ ...form, categoryCode })
          }}
        >
          <label className="field">
            <span>Markdown 文件导入（可选）</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              onChange={handleFileChange}
            />
            <span className="field-tip">导入后会填充正文编辑区；正文长度 20-50000 字符</span>
          </label>

          {form.markdownFileName ? (
            <div className="notice-box">
              <strong>已选择 Markdown 文件</strong>
              <p className="muted">{form.markdownFileName}</p>
              <p className="muted">正文长度：{contentLength}/{CONTENT_MAX}</p>
              <button className="btn ghost small" type="button" onClick={clearFile}>移除文件记录</button>
            </div>
          ) : null}

          <label className="field">
            <span>标题</span>
            <input
              type="text"
              placeholder="可手动填写；留空时优先使用 Markdown 一级标题"
              value={form.title}
              onChange={(event) => {
                setLocalError('')
                setForm({ ...form, title: event.target.value.slice(0, TITLE_MAX) })
              }}
              required
            />
            <span className="field-tip">{titleLength}/{TITLE_MAX}</span>
          </label>

          <label className="field">
            <span>正文</span>
            <textarea
              rows="10"
              placeholder="支持 Markdown：可以写经验、问题、资料说明、清单和链接。"
              value={form.markdownContent}
              onChange={(event) => {
                setLocalError('')
                setForm({ ...form, markdownContent: event.target.value })
              }}
              required
            />
            <span className="field-tip">{contentLength}/{CONTENT_MAX}</span>
          </label>

          <label className="field">
            <span>分类</span>
            <select
              value={categoryCode}
              onChange={(event) => {
                setLocalError('')
                setForm({ ...form, categoryCode: event.target.value })
              }}
            >
              {categories.map((item) => (
                <option key={item.code} value={item.code}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>标签</span>
            <input
              type="text"
              placeholder="英文逗号分隔，如：复试,资料,经验"
              value={form.tags}
              onChange={(event) => {
                setLocalError('')
                setForm({ ...form, tags: event.target.value })
              }}
            />
          </label>

          {isStudyAbroad ? (
            <>
              <div className="notice-box">
                <strong>留学社区信息卡</strong>
                <p className="muted">为便于同学筛选经验，请补充以下留学相关信息。</p>
              </div>
              <div className="grid-two compact">
                <label className="field">
                  <span>申请国家/地区（必填）</span>
                  <input
                    type="text"
                    placeholder="如：英国 / 美国 / 新加坡"
                    value={form.studyAbroadMeta.country}
                    onChange={(event) => updateStudyAbroadMeta('country', event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>主题方向</span>
                  <select
                    value={form.studyAbroadMeta.topic}
                    onChange={(event) => updateStudyAbroadMeta('topic', event.target.value)}
                  >
                    {STUDY_ABROAD_TOPICS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>申请阶段</span>
                  <select
                    value={form.studyAbroadMeta.phase}
                    onChange={(event) => updateStudyAbroadMeta('phase', event.target.value)}
                  >
                    {STUDY_ABROAD_PHASES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>目标院校（可选）</span>
                  <input
                    type="text"
                    placeholder="如：UCL / NUS / HKU"
                    value={form.studyAbroadMeta.targetSchool}
                    onChange={(event) => updateStudyAbroadMeta('targetSchool', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>专业方向（可选）</span>
                  <input
                    type="text"
                    placeholder="如：CS / 金融 / 教育学"
                    value={form.studyAbroadMeta.targetMajor}
                    onChange={(event) => updateStudyAbroadMeta('targetMajor', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>入学季（可选）</span>
                  <input
                    type="text"
                    placeholder="如：2027 Fall"
                    value={form.studyAbroadMeta.intakeTerm}
                    onChange={(event) => updateStudyAbroadMeta('intakeTerm', event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>经验摘要（必填）</span>
                <textarea
                  rows="3"
                  placeholder="一句话说明这篇经验最能帮到谁、解决什么问题。"
                  value={form.studyAbroadMeta.summary}
                  onChange={(event) => updateStudyAbroadMeta('summary', event.target.value)}
                  required
                />
              </label>
            </>
          ) : null}

          <div className="grid-two compact">
            <label className="field">
              <span>可见范围</span>
              <select
                value={form.visibility}
                onChange={(event) => {
                  setLocalError('')
                  setForm({ ...form, visibility: event.target.value })
                }}
              >
                <option value="public">公开可见</option>
                <option value="members">仅注册用户可见</option>
              </select>
            </label>
            <label className="field">
              <span>发布状态</span>
              <select
                value={form.submitAction}
                onChange={(event) => {
                  setLocalError('')
                  setForm({ ...form, submitAction: event.target.value })
                }}
              >
                <option value="publish">提交发布</option>
                <option value="draft">保存草稿</option>
              </select>
            </label>
          </div>

          <div className="switch-row">
            <label className="switch-item">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(event) => {
                  setLocalError('')
                  setForm({ ...form, anonymous: event.target.checked })
                }}
              />
              <span>匿名发布（前台隐藏身份）</span>
            </label>
            <label className="switch-item">
              <input
                type="checkbox"
                checked={form.hasAttachment}
                onChange={(event) => {
                  setLocalError('')
                  const checked = event.target.checked
                  setForm((current) => ({
                    ...current,
                    hasAttachment: checked,
                    attachments: checked ? current.attachments : [],
                    attachmentNote: checked ? current.attachmentNote : '',
                  }))
                  if (!checked) clearAttachmentInput()
                }}
              />
              <span>含附件</span>
            </label>
          </div>

          {form.hasAttachment ? (
            <>
              <label className="field">
                <span>附件文件</span>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept={ATTACH_ACCEPT}
                  onChange={handleAttachmentChange}
                />
                <span className="field-tip">支持文档/图片/压缩包；单帖最多 {MAX_ATTACHMENT_COUNT} 个，单文件不超过 20MB</span>
              </label>

              {form.attachments.length ? (
                <div className="notice-box">
                  <strong>已选择附件（{form.attachments.length}）</strong>
                  {form.attachments.map((file) => (
                    <p key={`${file.name}-${file.size}`} className="muted">{file.name} · {formatSize(file.size)}</p>
                  ))}
                  <button className="btn ghost small" type="button" onClick={clearAttachments}>清空附件</button>
                </div>
              ) : null}

              <label className="field">
                <span>附件说明（可选）</span>
                <input
                  type="text"
                  placeholder="例如：真题整理、复试资料、模板文档等"
                  value={form.attachmentNote}
                  onChange={(event) => {
                    setLocalError('')
                    setForm({ ...form, attachmentNote: event.target.value })
                  }}
                />
              </label>
            </>
          ) : null}

          {form.markdownContent ? (
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>正文预览</span>
                <button
                  className="btn ghost small"
                  type="button"
                  onClick={() => setIsPreviewCollapsed((prev) => !prev)}
                >
                  {isPreviewCollapsed ? '展开预览' : '收起预览'}
                </button>
              </div>
              {!isPreviewCollapsed ? (
                <div className="notice-box composer-preview">
                  <MarkdownContent content={form.markdownContent} />
                </div>
              ) : (
                <div className="muted">预览已折叠，点击“展开预览”查看正文。</div>
              )}
            </div>
          ) : null}

          {localError ? <div className="error-text">{localError}</div> : null}
          {error ? <div className="error-text">{error}</div> : null}
          <div className="modal-actions">
            <button className="btn ghost" type="button" onClick={closeModal}>取消</button>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? '发布中...' : '发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostComposerModal
