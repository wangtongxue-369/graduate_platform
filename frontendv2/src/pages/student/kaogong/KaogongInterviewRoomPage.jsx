import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatBytes,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  acceptedInterviewAttachmentTypes,
  createEmptyFeedbackForm,
  createInterviewRoomWorkspacePreview,
  getInterviewStatusLabel,
  loadInterviewRoomMeta,
  normalizeInterviewAttachmentsPage,
  normalizeInterviewFeedbackPage,
  normalizeInterviewMessagesPage,
} from '@/pages/student/kaogong/kaogongPageData.js'

export default function KaogongInterviewRoomPage() {
  const { roomId } = useParams()
  const attachmentInputRef = useRef(null)
  const feedbackSectionRef = useRef(null)
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const previewWorkspace = createInterviewRoomWorkspacePreview(roomId)
  const [room, setRoom] = useState(previewWorkspace.room)
  const [messages, setMessages] = useState(previewWorkspace.messages)
  const [attachments, setAttachments] = useState(previewWorkspace.attachments)
  const [feedback, setFeedback] = useState(previewWorkspace.feedback)
  const [draft, setDraft] = useState('')
  const [attachmentNote, setAttachmentNote] = useState('')
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState(null)
  const [reviewFeedbackForm, setReviewFeedbackForm] = useState(createEmptyFeedbackForm())
  const [endFeedbackForm, setEndFeedbackForm] = useState(createEmptyFeedbackForm())
  const [uploadProgress, setUploadProgress] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [realtimeState, setRealtimeState] = useState(canUseRemote ? 'connecting' : 'preview')
  const [notice, setNotice] = useState(previewDataNotice('模拟面试房间'))
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  async function loadRoomWorkspace(options = {}) {
    if (!canUseRemote) {
      setRoom(previewWorkspace.room)
      setMessages(previewWorkspace.messages)
      setAttachments(previewWorkspace.attachments)
      setFeedback(previewWorkspace.feedback)
      setNotice(previewDataNotice('模拟面试房间'))
      setRealtimeState('preview')
      return
    }

    if (!options.silent) setLoading(true)
    try {
      const roomMeta = await loadInterviewRoomMeta(roomId, token, kaogongApi)
      const [messagesData, attachmentsData, feedbackData] = await withRequestTimeout(
        Promise.all([
          kaogongApi.interviewMessagesPage(Number(roomId), { page: 0, size: 20 }),
          kaogongApi.interviewAttachmentsPage(Number(roomId), { page: 0, size: 12 }),
          kaogongApi.interviewFeedbackPage(Number(roomId), { page: 0, size: 12 }),
        ]),
        8000,
        '模拟面试房间数据读取超时，请检查后端服务。',
      )

      setRoom(roomMeta || previewWorkspace.room)
      setMessages(normalizeInterviewMessagesPage(messagesData))
      setAttachments(normalizeInterviewAttachmentsPage(attachmentsData))
      setFeedback(normalizeInterviewFeedbackPage(feedbackData))
      setNotice(remoteDataNotice('模拟面试房间'))
    } catch (error) {
      setRoom(previewWorkspace.room)
      setMessages(previewWorkspace.messages)
      setAttachments(previewWorkspace.attachments)
      setFeedback(previewWorkspace.feedback)
      setNotice(fallbackDataNotice('模拟面试房间', error))
      setRealtimeState('fallback')
    } finally {
      if (!options.silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadRoomWorkspace()
  }, [canUseRemote, roomId, token])

  useEffect(() => {
    if (window.location.hash !== '#feedback') return

    const timer = window.setTimeout(() => {
      feedbackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(timer)
  }, [feedback.length])

  useEffect(() => {
    if (!canUseRemote) return undefined

    const source = new EventSource(kaogongApi.interviewRoomStreamUrl(roomId))
    setRealtimeState('connecting')

    source.addEventListener('room-update', async () => {
      setRealtimeState('live')
      await loadRoomWorkspace({ silent: true })
    })

    source.onerror = () => {
      setRealtimeState('fallback')
      source.close()
    }

    return () => {
      source.close()
    }
  }, [canUseRemote, roomId, token])

  async function handleSendMessage(event) {
    event.preventDefault()
    if (!canUseRemote || !draft.trim() || room.status === 'COMPLETED') return

    setBusy(true)
    try {
      await kaogongApi.sendInterviewMessage(Number(roomId), { content: draft.trim() }, token)
      setDraft('')
      await loadRoomWorkspace({ silent: true })
    } catch (error) {
      setNotice(error.message || '发送房间消息失败。')
    } finally {
      setBusy(false)
    }
  }

  async function handleUploadAttachment(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !canUseRemote || room.status === 'COMPLETED') return

    setSelectedAttachmentFile(file)
    setAttachmentNote('')
    setShowAttachmentModal(true)
  }

  async function handleConfirmAttachmentUpload(event) {
    event.preventDefault()
    if (!selectedAttachmentFile || !canUseRemote || room.status === 'COMPLETED') return

    setBusy(true)
    setUploadProgress({ fileName: selectedAttachmentFile.name, percent: 0 })
    try {
      await kaogongApi.uploadInterviewAttachment(Number(roomId), selectedAttachmentFile, attachmentNote.trim(), token, (percent) => {
        setUploadProgress({ fileName: selectedAttachmentFile.name, percent })
      })
      setAttachmentNote('')
      setSelectedAttachmentFile(null)
      setShowAttachmentModal(false)
      await loadRoomWorkspace({ silent: true })
      setUploadProgress({ fileName: selectedAttachmentFile.name, percent: 100 })
    } catch (error) {
      setNotice(error.message || '上传附件失败。')
      setUploadProgress(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadAttachment(attachmentId) {
    if (!canUseRemote) return
    try {
      await kaogongApi.downloadInterviewAttachment(attachmentId, token)
    } catch (error) {
      setNotice(error.message || '下载附件失败。')
    }
  }

  async function handleSubmitFeedback(event) {
    event.preventDefault()
    if (!canUseRemote) return

    const hasText = reviewFeedbackForm.suggestions.trim()
    if (!hasText) {
      setNotice('请先填写评价内容，再发布房间评价。')
      return
    }

    setBusy(true)
    try {
      await kaogongApi.addInterviewFeedback(Number(roomId), reviewFeedbackForm, token)
      setReviewFeedbackForm(createEmptyFeedbackForm())
      await loadRoomWorkspace({ silent: true })
    } catch (error) {
      setNotice(error.message || '发布房间评价失败。')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmitFeedbackAndEnd(event) {
    event.preventDefault()
    if (!canUseRemote) return

    setBusy(true)
    try {
      await kaogongApi.addInterviewFeedback(Number(roomId), endFeedbackForm, token)
      await kaogongApi.updateInterviewRoomStatus(Number(roomId), 'COMPLETED', token)
      setEndFeedbackForm(createEmptyFeedbackForm())
      setShowFeedbackModal(false)
      await loadRoomWorkspace({ silent: true })
    } catch (error) {
      setNotice(error.message || '提交复盘或结束房间失败。')
    } finally {
      setBusy(false)
    }
  }

  const isOwner = user?.id && Number(room.ownerId) === Number(user.id)
  const isCompleted = room.status === 'COMPLETED'

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="模拟面试房间"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '模拟面试', to: '/station/kaogong/interviews' },
            { label: room.title || '模拟面试房间' },
          ]}
          title={room.title || '模拟面试房间'}
          lead="消息、附件和复盘都收进当前房间，交流区保持像聊天一样直接。"
          actions={<Link className="v2-secondary-link" to="/station/kaogong/interviews">返回大厅</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步模拟面试房间数据...</div> : null}
        {isCompleted ? (
          <div className="v2-status-note">房间已结束，当前页面进入只读模式，仍可回看消息、附件和复盘评价。</div>
        ) : null}
        {realtimeState === 'fallback' ? (
          <div className="v2-status-note">实时连接已中断，当前页面已退回手动刷新模式。</div>
        ) : null}

        <section className="v2-side-card v2-interview-chat-card" aria-label="房间消息流">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">消息流</p>
              <h3>房间讨论区</h3>
            </div>
            <div className="v2-inline-actions">
              <button className="v2-segment-button" type="button" onClick={() => loadRoomWorkspace()}>
                手动刷新
              </button>
              {isOwner && !isCompleted ? (
                <button className="v2-segment-button is-active" disabled={busy} type="button" onClick={() => setShowFeedbackModal(true)}>
                  面试结束
                </button>
              ) : null}
            </div>
          </div>

          <div className={`v2-counseling-thread ${messages.length ? '' : 'v2-counseling-thread--empty'}`}>
            {messages.map((item) => {
              const mine = user?.id && Number(item.senderId) === Number(user.id)
              return (
                <div className={`v2-chat-bubble-row ${mine ? 'mine' : ''}`} key={item.id}>
                  <article className="v2-chat-bubble">
                    <div className="v2-chat-bubble__head">
                      <strong>{item.senderName}</strong>
                      <span>{formatDateTimeLabel(item.createdAt)}</span>
                    </div>
                    <p>{item.content}</p>
                  </article>
                </div>
              )
            })}
            {!messages.length ? <p>当前还没有房间消息，先发第一条把答题节奏带起来。</p> : null}
          </div>

          {uploadProgress ? (
            <div className="v2-interview-upload-progress">
              <strong>{uploadProgress.fileName}</strong>
              <div>
                <span style={{ width: `${Math.min(uploadProgress.percent, 100)}%` }} />
              </div>
              <small>{uploadProgress.percent}%</small>
            </div>
          ) : null}

          <form className="v2-interview-composer" onSubmit={handleSendMessage}>
            <input
              ref={attachmentInputRef}
              hidden
              accept={acceptedInterviewAttachmentTypes}
              type="file"
              onChange={handleUploadAttachment}
            />
            <button
              aria-label="上传附件"
              className="v2-icon-button"
              disabled={busy || isCompleted || !canUseRemote}
              title="上传附件"
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
            >
              +
            </button>
            <label className="v2-field v2-interview-message-input">
              <span>发送消息</span>
              <textarea
                aria-label="发送消息"
                disabled={busy || isCompleted}
                placeholder="输入讨论内容..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            <button className="v2-segment-button is-active" disabled={busy || isCompleted || !draft.trim()} type="submit">
              发送
            </button>
          </form>
        </section>

        <section
          id="feedback"
          ref={feedbackSectionRef}
          className="v2-side-card v2-interview-feedback-panel"
          aria-label="房间复盘评价区"
        >
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">复盘评价</p>
              <h3>房间评论区</h3>
            </div>
            <span className="v2-plan-status-pill">{feedback.length} 条</span>
          </div>

          <div className="v2-interview-comment-list">
            {feedback.map((item) => (
              <article className="v2-interview-comment" key={item.id}>
                <div className="v2-interview-comment__avatar">{(item.reviewerName || '评').slice(0, 1)}</div>
                <div className="v2-interview-comment__body">
                  <div className="v2-interview-comment__head">
                    <strong>{item.reviewerName || '匿名用户'}</strong>
                    <span>{item.score} 分</span>
                  </div>
                  <p>{item.suggestions || item.strengths || item.problems || '这位用户暂时只留下了评分。'}</p>
                  {item.createdAt ? <time>{formatDateTimeLabel(item.createdAt)}</time> : null}
                </div>
              </article>
            ))}
            {!feedback.length ? <p className="v2-empty-copy">当前还没有评价，先发布一条复盘意见。</p> : null}
          </div>

          <form className="v2-interview-comment-form" onSubmit={handleSubmitFeedback}>
            <label className="v2-field v2-interview-score-field">
              <span>评分</span>
              <input
                aria-label="评价评分"
                max="100"
                min="0"
                type="number"
                value={reviewFeedbackForm.score}
                onChange={(event) => setReviewFeedbackForm((current) => ({ ...current, score: Number(event.target.value) }))}
              />
            </label>
            <label className="v2-field v2-interview-comment-input">
              <span>评价内容</span>
              <textarea
                aria-label="评价内容"
                placeholder="像评论一样写下这场面试的表现和评价..."
                value={reviewFeedbackForm.suggestions}
                onChange={(event) => setReviewFeedbackForm((current) => ({ ...current, suggestions: event.target.value }))}
              />
            </label>
            <button
              className="v2-segment-button is-active"
              disabled={busy || !canUseRemote || !reviewFeedbackForm.suggestions.trim()}
              type="submit"
            >
              发布评价
            </button>
          </form>
        </section>
      </div>

      <aside className="v2-side-column v2-interview-room-sidebar">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">房间侧栏</p>
              <h3>房间信息与资料</h3>
            </div>
            <span className="v2-plan-status-pill">{realtimeState}</span>
          </div>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>房间信息</strong>
              <span>{getInterviewStatusLabel(room.status)}</span>
            </div>
            <dl className="v2-interview-room-facts">
              <div>
                <dt>岗位方向</dt>
                <dd>{room.jobDirection || '待补充'}</dd>
              </div>
              <div>
                <dt>房间成员</dt>
                <dd>{room.participantCount || 0} 人</dd>
              </div>
              <div>
                <dt>面试时间</dt>
                <dd>{formatDateTimeLabel(room.scheduledAt)}</dd>
              </div>
            </dl>
            <p>{room.description || room.inviteNote || '当前还没有补充房间说明。'}</p>
          </section>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>附件资料</strong>
              <span>{attachments.length} 份</span>
            </div>
            <div className="v2-interview-side-list">
              {attachments.map((item) => (
                <article className="v2-interview-side-item" key={item.id}>
                  <div>
                    <strong>{item.originalName}</strong>
                    <span>{item.note || formatBytes(item.sizeBytes)}</span>
                  </div>
                  <button
                    aria-label={`下载附件 ${item.originalName}`}
                    className="v2-secondary-link"
                    type="button"
                    onClick={() => handleDownloadAttachment(item.id)}
                  >
                    下载
                  </button>
                </article>
              ))}
              {!attachments.length ? <p>暂无附件。点击消息输入框左侧的加号即可上传题本、语音或文档。</p> : null}
            </div>
          </section>

        </section>
      </aside>

      {showFeedbackModal ? (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="interview-feedback-title">
          <section className="v2-modal-card v2-room-feedback-modal">
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">面试总结</p>
                <h3 id="interview-feedback-title">结束房间前填写复盘</h3>
              </div>
              <button className="v2-secondary-link" type="button" onClick={() => setShowFeedbackModal(false)}>
                关闭
              </button>
            </div>

            <form className="v2-filter-form" onSubmit={handleSubmitFeedbackAndEnd}>
              <div className="v2-card-grid v2-card-grid--dense">
                <label className="v2-field">
                  <span>总分</span>
                  <input
                    type="number"
                    value={endFeedbackForm.score}
                    onChange={(event) => setEndFeedbackForm((current) => ({ ...current, score: Number(event.target.value) }))}
                  />
                </label>
                <label className="v2-field">
                  <span>表达</span>
                  <input
                    type="number"
                    value={endFeedbackForm.expressionScore}
                    onChange={(event) => setEndFeedbackForm((current) => ({ ...current, expressionScore: Number(event.target.value) }))}
                  />
                </label>
                <label className="v2-field">
                  <span>逻辑</span>
                  <input
                    type="number"
                    value={endFeedbackForm.logicScore}
                    onChange={(event) => setEndFeedbackForm((current) => ({ ...current, logicScore: Number(event.target.value) }))}
                  />
                </label>
                <label className="v2-field">
                  <span>礼仪</span>
                  <input
                    type="number"
                    value={endFeedbackForm.etiquetteScore}
                    onChange={(event) => setEndFeedbackForm((current) => ({ ...current, etiquetteScore: Number(event.target.value) }))}
                  />
                </label>
              </div>
              <label className="v2-field">
                <span>评价内容</span>
                <textarea value={endFeedbackForm.suggestions} onChange={(event) => setEndFeedbackForm((current) => ({ ...current, suggestions: event.target.value }))} />
              </label>
              <div className="v2-inline-actions">
                <button className="v2-segment-button" type="button" onClick={() => setShowFeedbackModal(false)}>取消</button>
                <button className="v2-segment-button is-active" disabled={busy} type="submit">
                  提交总结并结束房间
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {showAttachmentModal ? (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="interview-attachment-title">
          <section className="v2-modal-card v2-attachment-note-modal">
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">上传附件</p>
                <h3 id="interview-attachment-title">填写附件备注</h3>
              </div>
              <button
                className="v2-secondary-link"
                type="button"
                onClick={() => {
                  setShowAttachmentModal(false)
                  setSelectedAttachmentFile(null)
                  setAttachmentNote('')
                }}
              >
                关闭
              </button>
            </div>
            <form className="v2-filter-form" onSubmit={handleConfirmAttachmentUpload}>
              <div className="v2-room-side-section">
                <div className="v2-room-side-section__head">
                  <strong>{selectedAttachmentFile?.name || '待上传附件'}</strong>
                  <span>{selectedAttachmentFile ? formatBytes(selectedAttachmentFile.size) : ''}</span>
                </div>
                <p>备注会跟附件一起显示在右侧资料区，方便区分题本、语音、提纲或答题卡。</p>
              </div>
              <label className="v2-field">
                <span>附件备注</span>
                <input
                  autoFocus
                  placeholder="例如：第一轮题本 / 语音复盘 / 答题提纲"
                  value={attachmentNote}
                  onChange={(event) => setAttachmentNote(event.target.value)}
                />
              </label>
              <div className="v2-inline-actions">
                <button
                  className="v2-segment-button"
                  type="button"
                  onClick={() => {
                    setShowAttachmentModal(false)
                    setSelectedAttachmentFile(null)
                    setAttachmentNote('')
                  }}
                >
                  取消
                </button>
                <button className="v2-segment-button is-active" disabled={busy} type="submit">
                  上传附件
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
