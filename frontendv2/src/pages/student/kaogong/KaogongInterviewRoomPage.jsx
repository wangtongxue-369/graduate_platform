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
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const previewWorkspace = createInterviewRoomWorkspacePreview(roomId)
  const [room, setRoom] = useState(previewWorkspace.room)
  const [messages, setMessages] = useState(previewWorkspace.messages)
  const [attachments, setAttachments] = useState(previewWorkspace.attachments)
  const [feedback, setFeedback] = useState(previewWorkspace.feedback)
  const [draft, setDraft] = useState('')
  const [attachmentNote, setAttachmentNote] = useState('')
  const [feedbackForm, setFeedbackForm] = useState(createEmptyFeedbackForm())
  const [uploadProgress, setUploadProgress] = useState(null)
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

    setBusy(true)
    setUploadProgress({ fileName: file.name, percent: 0 })
    try {
      await kaogongApi.uploadInterviewAttachment(Number(roomId), file, attachmentNote.trim(), token, (percent) => {
        setUploadProgress({ fileName: file.name, percent })
      })
      setAttachmentNote('')
      await loadRoomWorkspace({ silent: true })
      setUploadProgress({ fileName: file.name, percent: 100 })
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

    setBusy(true)
    try {
      await kaogongApi.addInterviewFeedback(Number(roomId), feedbackForm, token)
      setFeedbackForm(createEmptyFeedbackForm())
      await loadRoomWorkspace({ silent: true })
    } catch (error) {
      setNotice(error.message || '提交复盘评价失败。')
    } finally {
      setBusy(false)
    }
  }

  async function handleEndRoom() {
    if (!canUseRemote) return

    setBusy(true)
    try {
      await kaogongApi.updateInterviewRoomStatus(Number(roomId), 'COMPLETED', token)
      await loadRoomWorkspace({ silent: true })
    } catch (error) {
      setNotice(error.message || '结束房间失败。')
    } finally {
      setBusy(false)
    }
  }

  const isOwner = user?.id && Number(room.ownerId) === Number(user.id)

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
          lead="房间页只处理答题协作、消息、附件、复盘和房间状态，不再让大厅承载高交互流程。"
          actions={<Link className="v2-secondary-link" to="/station/kaogong/interviews">返回大厅</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步模拟面试房间数据…</div> : null}
        {room.status === 'COMPLETED' ? (
          <div className="v2-status-note">房间已结束，当前页面进入只读模式，仍可回看消息、附件和复盘评价。</div>
        ) : null}
        {realtimeState === 'fallback' ? (
          <div className="v2-status-note">实时连接已中断，当前页面已退回手动刷新模式。</div>
        ) : null}

        <section className="v2-summary-strip" aria-label="房间摘要">
          <article className="v2-summary-card">
            <span>岗位方向</span>
            <strong>{room.jobDirection || '待补充'}</strong>
            <p>房间主题和岗位方向会决定你接下来答题的上下文。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前状态</span>
            <strong>{getInterviewStatusLabel(room.status)}</strong>
            <p>实时连接失败时也保留手动刷新和历史回看能力。</p>
          </article>
          <article className="v2-summary-card">
            <span>房间成员</span>
            <strong>{room.participantCount}</strong>
            <p>消息、附件和复盘都围绕当前房间成员展开。</p>
          </article>
        </section>

        <section className="v2-kaogong-room-feed" aria-label="房间消息与操作">
          <article className="v2-side-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">消息流</p>
                <h3>围绕当前房间持续推进答题、追问和分工</h3>
              </div>
              <div className="v2-inline-actions">
                <button className="v2-segment-button" type="button" onClick={() => loadRoomWorkspace()}>
                  手动刷新
                </button>
                {isOwner && room.status !== 'COMPLETED' ? (
                  <button className="v2-segment-button is-active" disabled={busy} type="button" onClick={handleEndRoom}>
                    结束房间
                  </button>
                ) : null}
              </div>
            </div>

            <div className="v2-check-list">
              {messages.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.senderName}</strong>
                  <span>{item.content}</span>
                  <span>{formatDateTimeLabel(item.createdAt)}</span>
                </div>
              ))}
              {!messages.length ? <p>当前还没有房间消息，先发第一条把答题节奏带起来。</p> : null}
            </div>

            <form className="v2-filter-form" onSubmit={handleSendMessage}>
              <label className="v2-field">
                <span>发送消息</span>
                <textarea
                  aria-label="发送消息"
                  disabled={busy || room.status === 'COMPLETED'}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <div className="v2-inline-actions">
                <button className="v2-segment-button is-active" disabled={busy || room.status === 'COMPLETED'} type="submit">
                  发送消息
                </button>
              </div>
            </form>
          </article>

          <article className="v2-side-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">复盘评价</p>
                <h3>先留结构化反馈，再沉淀完整复盘</h3>
              </div>
            </div>

            <form className="v2-filter-form" onSubmit={handleSubmitFeedback}>
              <div className="v2-card-grid v2-card-grid--dense">
                <label className="v2-field">
                  <span>总分</span>
                  <input
                    type="number"
                    value={feedbackForm.score}
                    onChange={(event) => setFeedbackForm((current) => ({ ...current, score: Number(event.target.value) }))}
                  />
                </label>
                <label className="v2-field">
                  <span>表达</span>
                  <input
                    type="number"
                    value={feedbackForm.expressionScore}
                    onChange={(event) => setFeedbackForm((current) => ({ ...current, expressionScore: Number(event.target.value) }))}
                  />
                </label>
                <label className="v2-field">
                  <span>逻辑</span>
                  <input
                    type="number"
                    value={feedbackForm.logicScore}
                    onChange={(event) => setFeedbackForm((current) => ({ ...current, logicScore: Number(event.target.value) }))}
                  />
                </label>
                <label className="v2-field">
                  <span>礼仪</span>
                  <input
                    type="number"
                    value={feedbackForm.etiquetteScore}
                    onChange={(event) => setFeedbackForm((current) => ({ ...current, etiquetteScore: Number(event.target.value) }))}
                  />
                </label>
              </div>
              <label className="v2-field">
                <span>亮点</span>
                <textarea value={feedbackForm.strengths} onChange={(event) => setFeedbackForm((current) => ({ ...current, strengths: event.target.value }))} />
              </label>
              <label className="v2-field">
                <span>问题</span>
                <textarea value={feedbackForm.problems} onChange={(event) => setFeedbackForm((current) => ({ ...current, problems: event.target.value }))} />
              </label>
              <label className="v2-field">
                <span>建议</span>
                <textarea value={feedbackForm.suggestions} onChange={(event) => setFeedbackForm((current) => ({ ...current, suggestions: event.target.value }))} />
              </label>
              <div className="v2-inline-actions">
                <button className="v2-segment-button is-active" disabled={busy} type="submit">提交复盘</button>
              </div>
            </form>

            <div className="v2-check-list">
              {feedback.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.reviewerName} / {item.score} 分</strong>
                  <span>{item.strengths}</span>
                  <span>{item.suggestions}</span>
                </div>
              ))}
              {!feedback.length ? <p>当前还没有复盘评价，面试结束后可以立刻把意见沉到这里。</p> : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">房间侧栏</p>
              <h3>房间信息、附件与反馈摘要</h3>
            </div>
            <span className="v2-plan-status-pill">{realtimeState}</span>
          </div>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>房间信息</strong>
              <span>{getInterviewStatusLabel(room.status)}</span>
            </div>
            <p>{room.description || room.inviteNote || '当前还没有补充房间说明。'}</p>
            <small>{formatDateTimeLabel(room.scheduledAt)}</small>
          </section>

          <div className="v2-room-side-divider" />

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>附件资料</strong>
              <span>{attachments.length} 份</span>
            </div>
            <label className="v2-field">
              <span>附件备注</span>
              <input
                value={attachmentNote}
                onChange={(event) => setAttachmentNote(event.target.value)}
              />
            </label>
            <input
              ref={attachmentInputRef}
              hidden
              accept={acceptedInterviewAttachmentTypes}
              type="file"
              onChange={handleUploadAttachment}
            />
            <div className="v2-inline-actions">
              <button
                className="v2-segment-button is-active"
                disabled={busy || room.status === 'COMPLETED'}
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
              >
                上传附件
              </button>
            </div>
            {uploadProgress ? (
              <div className="v2-check-row">
                <strong>{uploadProgress.fileName}</strong>
                <span>{uploadProgress.percent}%</span>
              </div>
            ) : null}
            <div className="v2-check-list">
              {attachments.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.originalName}</strong>
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <button
                    aria-label={`下载附件 ${item.originalName}`}
                    className="v2-secondary-link"
                    type="button"
                    onClick={() => handleDownloadAttachment(item.id)}
                  >
                    下载附件
                  </button>
                </div>
              ))}
              {!attachments.length ? <p>当前还没有上传附件，题本、提纲和答题卡都可以挂在这里。</p> : null}
            </div>
          </section>
        </section>
      </aside>
    </>
  )
}
