import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { kaogongApi } from '../../lib/api.js'
import '../../App.css'

const PAGE_SIZE = {
  rooms: 6,
  messages: 8,
  attachments: 6,
  feedbackPreview: 2,
  feedback: 4,
}

const ACCEPTED_ATTACHMENT_TYPES = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md', '.png', '.jpg', '.jpeg', '.gif',
  '.mp3', '.wav', '.m4a', '.mp4', '.zip', '.rar',
].join(',')

const STATUS_TEXT = {
  OPEN: '开放中',
  IN_PROGRESS: '进行中',
  COMPLETED: '已结束',
}

function tomorrowMorning() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(9, 0, 0, 0)
  return date.toISOString().slice(0, 16)
}

const initialRoom = {
  title: '公务员结构化面试练习',
  jobDirection: '税务 / 综合管理岗',
  scheduledAt: tomorrowMorning(),
  description: '围绕自我认知、组织协调、应急处理做一轮模拟练习。',
  inviteNote: '欢迎同方向同学加入互评。',
}

const initialFeedback = {
  score: 85,
  expressionScore: 85,
  logicScore: 85,
  etiquetteScore: 85,
  strengths: '',
  problems: '',
  suggestions: '',
  attachmentNote: '',
}

const initialRoomFilters = {
  title: '',
  jobDirection: '',
  status: '',
  dateFrom: '',
  dateTo: '',
}

function emptyPage(size) {
  return { content: [], page: 0, size, totalElements: 0, totalPages: 1 }
}

function toUiPage(apiPage) {
  return Number(apiPage || 0) + 1
}

function toApiPage(uiPage) {
  return Math.max(0, Number(uiPage || 1) - 1)
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

function formatSize(bytes) {
  const value = Number(bytes || 0)
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.ceil(value / 1024))} KB`
}

export default function MockInterviewPage() {
  const { user, token, isAuthed } = useAuth()
  const [searchParams] = useSearchParams()
  const attachmentInputRef = useRef(null)
  const [view, setView] = useState('home')
  const [roomsPage, setRoomsPage] = useState(emptyPage(PAGE_SIZE.rooms))
  const [activeRoom, setActiveRoom] = useState(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [messagesPage, setMessagesPage] = useState(emptyPage(PAGE_SIZE.messages))
  const [attachmentsPage, setAttachmentsPage] = useState(emptyPage(PAGE_SIZE.attachments))
  const [feedbackPreviewPage, setFeedbackPreviewPage] = useState(emptyPage(PAGE_SIZE.feedbackPreview))
  const [feedbackPage, setFeedbackPage] = useState(emptyPage(PAGE_SIZE.feedback))
  const [roomForm, setRoomForm] = useState(initialRoom)
  const [roomFilters, setRoomFilters] = useState(initialRoomFilters)
  const [feedbackForm, setFeedbackForm] = useState(initialFeedback)
  const [newMessage, setNewMessage] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [realtimeState, setRealtimeState] = useState('未连接')

  const rooms = roomsPage.content || []
  const selectedRoom = useMemo(() => {
    const listedRoom = rooms.find((room) => String(room.id) === String(selectedRoomId))
    return listedRoom || (String(activeRoom?.id) === String(selectedRoomId) ? activeRoom : null)
  }, [activeRoom, rooms, selectedRoomId])
  const roomEnded = selectedRoom?.status === 'COMPLETED'
  const realToken = token && token !== 'dev-token' ? token : localStorage.getItem('gp_token')

  useEffect(() => {
    loadRooms(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const roomId = searchParams.get('room')
    if (roomId) {
      setSelectedRoomId(String(roomId))
      setView('room')
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedRoomId) return
    const room = rooms.find((item) => String(item.id) === String(selectedRoomId))
    if (room) setActiveRoom(room)
  }, [rooms, selectedRoomId])

  useEffect(() => {
    if (!selectedRoomId || !['room', 'review-detail'].includes(view)) return undefined
    loadRoomData(selectedRoomId)
    if (view !== 'room') return undefined

    setRealtimeState('连接中')
    const source = new EventSource(kaogongApi.interviewRoomStreamUrl(selectedRoomId))
    source.addEventListener('room-update', (event) => {
      const payload = JSON.parse(event.data || '{}')
      if (payload.type === 'connected') {
        setRealtimeState('实时连接中')
        return
      }
      setRealtimeState('实时连接中')
      if (payload.type === 'message') {
        jumpToLastMessagePage(selectedRoomId, { silent: true })
        return
      }
      if (payload.type === 'attachment') {
        loadRoomData(selectedRoomId, { silent: true, attachmentPage: 1 })
        return
      }
      if (payload.type === 'feedback') {
        loadRoomData(selectedRoomId, { silent: true, feedbackPage: 1, feedbackPreviewPage: 1 })
        return
      }
      if (payload.type === 'status') {
        setActiveRoom(payload.data || null)
        loadRooms(toUiPage(roomsPage.page), { silent: true })
      }
    })
    source.onerror = () => setRealtimeState('正在重连')
    return () => {
      source.close()
      setRealtimeState('未连接')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId, view])

  function ensureLogin() {
    if (!isAuthed || !realToken || realToken === 'dev-token') {
      setMessage('请使用真实账号登录后操作模拟面试。顶部 DevBar 的模拟用户只能看页面，不能创建、加入、发消息或上传附件。')
      return false
    }
    return true
  }

  async function loadRooms(page = toUiPage(roomsPage.page), options = {}) {
    if (!options.silent) setLoading(true)
    try {
      const data = await kaogongApi.interviewRoomsPage({
        ...(options.filters || roomFilters),
        page: toApiPage(page),
        size: PAGE_SIZE.rooms,
      })
      setRoomsPage(data || emptyPage(PAGE_SIZE.rooms))
    } catch (err) {
      setMessage(err.message || '面试房间加载失败')
    } finally {
      if (!options.silent) setLoading(false)
    }
  }

  async function loadRoomData(roomId, options = {}) {
    const messagePage = options.messagePage ?? toUiPage(messagesPage.page)
    const attachmentPage = options.attachmentPage ?? toUiPage(attachmentsPage.page)
    const previewPage = options.feedbackPreviewPage ?? toUiPage(feedbackPreviewPage.page)
    const reviewPage = options.feedbackPage ?? toUiPage(feedbackPage.page)

    try {
      const [messageData, attachmentData, previewData, reviewData] = await Promise.all([
        kaogongApi.interviewMessagesPage(roomId, { page: toApiPage(messagePage), size: PAGE_SIZE.messages }),
        kaogongApi.interviewAttachmentsPage(roomId, { page: toApiPage(attachmentPage), size: PAGE_SIZE.attachments }),
        kaogongApi.interviewFeedbackPage(roomId, { page: toApiPage(previewPage), size: PAGE_SIZE.feedbackPreview }),
        kaogongApi.interviewFeedbackPage(roomId, { page: toApiPage(reviewPage), size: PAGE_SIZE.feedback }),
      ])
      setMessagesPage(messageData || emptyPage(PAGE_SIZE.messages))
      setAttachmentsPage(attachmentData || emptyPage(PAGE_SIZE.attachments))
      setFeedbackPreviewPage(previewData || emptyPage(PAGE_SIZE.feedbackPreview))
      setFeedbackPage(reviewData || emptyPage(PAGE_SIZE.feedback))
      const latest = (messageData?.content || []).at(-1)
      if (latest?.id) localStorage.setItem(`kg_room_seen_${roomId}`, String(latest.id))
    } catch (err) {
      if (!options.silent) setMessage(err.message || '房间数据加载失败')
    }
  }

  async function jumpToLastMessagePage(roomId, options = {}) {
    const countPage = await kaogongApi.interviewMessagesPage(roomId, { page: 0, size: 1 })
    const lastPage = Math.max(1, Math.ceil((countPage?.totalElements || 0) / PAGE_SIZE.messages))
    await loadRoomData(roomId, { ...options, messagePage: lastPage })
  }

  function updateRoomFilter(key, value) {
    setRoomFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function handleRoomFilterSubmit(event) {
    event.preventDefault()
    await loadRooms(1)
  }

  async function resetRoomFilters() {
    setRoomFilters(initialRoomFilters)
    await loadRooms(1, { filters: initialRoomFilters })
  }

  function openRoom(room) {
    const roomId = typeof room === 'object' ? room.id : room
    setActiveRoom(typeof room === 'object' ? room : null)
    setSelectedRoomId(String(roomId))
    setView('room')
    setMessage('')
  }

  function openReview(room) {
    const roomId = typeof room === 'object' ? room.id : room
    setActiveRoom(typeof room === 'object' ? room : null)
    setSelectedRoomId(String(roomId))
    setView('review-detail')
    setMessage('')
  }

  async function handleCreateRoom(event) {
    event.preventDefault()
    if (!ensureLogin()) return
    setBusy(true)
    try {
      const room = await kaogongApi.createInterviewRoom(
        { ...roomForm, scheduledAt: new Date(roomForm.scheduledAt).toISOString().slice(0, 19) },
        realToken,
      )
      setActiveRoom(room)
      setSelectedRoomId(String(room.id))
      await loadRooms(1, { silent: true })
      setView('room')
      setMessage('房间已创建，已进入讨论区。')
    } catch (err) {
      setMessage(err.message || '创建房间失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoinRoom(room) {
    if (!ensureLogin()) return
    setBusy(true)
    try {
      const joinedRoom = await kaogongApi.joinInterviewRoom(room.id, realToken)
      setActiveRoom(joinedRoom || room)
      await loadRooms(toUiPage(roomsPage.page), { silent: true })
      openRoom(joinedRoom || room)
      setMessage('已加入房间，已进入讨论区。')
    } catch (err) {
      setMessage(err.message || '加入房间失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleEndRoom() {
    if (!ensureLogin() || !selectedRoomId) return
    setBusy(true)
    try {
      const room = await kaogongApi.updateInterviewRoomStatus(selectedRoomId, 'COMPLETED', realToken)
      setActiveRoom(room)
      await loadRooms(toUiPage(roomsPage.page), { silent: true })
      await loadRoomData(selectedRoomId, { silent: true })
      setMessage('房间已结束，后续不能继续发消息或上传附件。')
    } catch (err) {
      setMessage(err.message || '结束房间失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault()
    if (!ensureLogin() || !selectedRoomId) return
    if (roomEnded) {
      setMessage('房间已结束，不能继续发消息。')
      return
    }
    if (!newMessage.trim()) {
      setMessage('消息内容不能为空。')
      return
    }
    setBusy(true)
    try {
      await kaogongApi.sendInterviewMessage(selectedRoomId, { content: newMessage.trim() }, realToken)
      setNewMessage('')
      await jumpToLastMessagePage(selectedRoomId)
      setMessage('')
    } catch (err) {
      setMessage(err.message || '发送失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleAttachmentPicked(event) {
    if (!ensureLogin() || !selectedRoomId) return
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (roomEnded) {
      setMessage('房间已结束，不能继续上传附件。')
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      setMessage('单个附件不能超过 30MB。')
      return
    }
    setBusy(true)
    setUploadProgress({ fileName: file.name, percent: 0 })
    try {
      await kaogongApi.uploadInterviewAttachment(selectedRoomId, file, '', realToken, (percent) => {
        setUploadProgress({ fileName: file.name, percent })
      })
      setUploadProgress({ fileName: file.name, percent: 100 })
      await loadRoomData(selectedRoomId, { attachmentPage: 1 })
      setMessage('附件已上传。')
      window.setTimeout(() => setUploadProgress(null), 900)
    } catch (err) {
      setUploadProgress(null)
      setMessage(err.message || '上传失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadAttachment(attachmentId) {
    if (!ensureLogin()) return
    try {
      await kaogongApi.downloadInterviewAttachment(attachmentId, realToken)
    } catch (err) {
      setMessage(err.message || '下载失败')
    }
  }

  async function handleSubmitFeedback(event) {
    event.preventDefault()
    if (!ensureLogin() || !selectedRoomId) return
    setBusy(true)
    try {
      await kaogongApi.addInterviewFeedback(selectedRoomId, feedbackForm, realToken)
      setFeedbackForm(initialFeedback)
      await loadRoomData(selectedRoomId, { feedbackPage: 1, feedbackPreviewPage: 1 })
      await loadRooms(toUiPage(roomsPage.page), { silent: true })
      setMessage('复盘评价已保存。')
    } catch (err) {
      setMessage(err.message || '保存评价失败')
    } finally {
      setBusy(false)
    }
  }

  function renderHome() {
    return (
      <section className="section">
        <Link className="page-back" to="/kaogong">返回</Link>
        <div className="section-head">
          <p className="eyebrow">考公 / 模拟面试</p>
          <h2>模拟面试房间</h2>
          <p className="muted">先创建房间、加入房间或查看复盘评价，再进入对应功能。</p>
        </div>
        <div className="track-grid">
          <button className="track-card action-card" type="button" onClick={() => setView('create')}>
            <h3>创建房间</h3>
            <p className="muted">发起一场新的模拟面试，创建后直接进入讨论区。</p>
          </button>
          <button className="track-card action-card" type="button" onClick={() => setView('join')}>
            <h3>加入房间</h3>
            <p className="muted">选择已有房间加入，进入后可以实时交流和上传资料。</p>
          </button>
          <button className="track-card action-card" type="button" onClick={() => setView('reviews')}>
            <h3>评价房间</h3>
            <p className="muted">查看各房间精华复盘，并进入评价区域继续补充。</p>
          </button>
        </div>
        {message ? <div className="notice-box">{message}</div> : null}
      </section>
    )
  }

  function renderCreate() {
    return (
      <section className="section">
        <button className="page-back" type="button" onClick={() => setView('home')}>返回</button>
        <div className="section-head">
          <p className="eyebrow">创建房间</p>
          <h2>新建模拟面试</h2>
        </div>
        <form className="feature-card" onSubmit={handleCreateRoom}>
          <div className="form-grid">
            <label className="field">
              <span>房间标题</span>
              <input value={roomForm.title} onChange={(event) => setRoomForm({ ...roomForm, title: event.target.value })} />
            </label>
            <label className="field">
              <span>岗位方向</span>
              <input value={roomForm.jobDirection} onChange={(event) => setRoomForm({ ...roomForm, jobDirection: event.target.value })} />
            </label>
            <label className="field">
              <span>面试时间</span>
              <input type="datetime-local" value={roomForm.scheduledAt} onChange={(event) => setRoomForm({ ...roomForm, scheduledAt: event.target.value })} />
            </label>
            <label className="field">
              <span>邀请说明</span>
              <input value={roomForm.inviteNote} onChange={(event) => setRoomForm({ ...roomForm, inviteNote: event.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>房间描述</span>
            <textarea value={roomForm.description} onChange={(event) => setRoomForm({ ...roomForm, description: event.target.value })} />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? '创建中...' : '创建并进入讨论区'}</button>
        </form>
      </section>
    )
  }

  function renderRoomList(mode) {
    const isReview = mode === 'reviews'
    return (
      <section className="section">
        <button className="page-back" type="button" onClick={() => setView('home')}>返回</button>
        <div className="section-head compact">
          <p className="eyebrow">{isReview ? '复盘评价' : '加入房间'}</p>
          <h2>{isReview ? '选择房间查看评价' : '选择一个面试房间'}</h2>
        </div>

        <form className="room-filter-panel" onSubmit={handleRoomFilterSubmit}>
          <label className="room-filter-field wide">
            <span>标题</span>
            <input value={roomFilters.title} onChange={(event) => updateRoomFilter('title', event.target.value)} placeholder="搜索房间标题" />
          </label>
          <label className="room-filter-field">
            <span>方向</span>
            <input value={roomFilters.jobDirection} onChange={(event) => updateRoomFilter('jobDirection', event.target.value)} placeholder="税务 / 综合管理" />
          </label>
          <label className="room-filter-field compact">
            <span>状态</span>
            <select value={roomFilters.status} onChange={(event) => updateRoomFilter('status', event.target.value)}>
              <option value="">全部</option>
              <option value="OPEN">开放中</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已结束</option>
            </select>
          </label>
          <label className="room-filter-field compact">
            <span>开始</span>
            <input type="date" value={roomFilters.dateFrom} onChange={(event) => updateRoomFilter('dateFrom', event.target.value)} />
          </label>
          <label className="room-filter-field compact">
            <span>结束</span>
            <input type="date" value={roomFilters.dateTo} onChange={(event) => updateRoomFilter('dateTo', event.target.value)} />
          </label>
          <div className="room-filter-actions">
            <button className="btn primary small" type="submit" disabled={loading}>{loading ? '筛选中...' : '筛选'}</button>
            <button className="btn ghost small" type="button" onClick={resetRoomFilters}>清空</button>
          </div>
        </form>

        {loading ? <div className="feature-card">加载中...</div> : null}
        <div className="room-list-grid">
          {rooms.map((room) => (
            <article className="room-list-item" key={room.id}>
              <div className="room-list-main">
                <span className={`room-status status-${String(room.status || 'OPEN').toLowerCase()}`}>{STATUS_TEXT[room.status] || room.status}</span>
                <h3>{room.title}</h3>
                <p>{room.jobDirection} / {formatTime(room.scheduledAt)}</p>
                <div className="room-list-meta">
                  <span>房主：{room.ownerName || '-'}</span>
                  <span>{room.participantCount || 0} 人</span>
                </div>
              </div>
              <p className="room-list-desc">{room.description || room.inviteNote || '暂无描述'}</p>
              {isReview ? (
                <button className="btn outline small" type="button" onClick={() => openReview(room)}>进入评价</button>
              ) : (
                <button className="btn primary small" type="button" disabled={busy || room.status === 'COMPLETED'} onClick={() => handleJoinRoom(room)}>
                  {room.status === 'COMPLETED' ? '已结束' : '加入讨论区'}
                </button>
              )}
            </article>
          ))}
          {!loading && rooms.length === 0 ? <div className="feature-card muted">没有找到符合条件的房间。</div> : null}
        </div>
        <Pagination
          page={toUiPage(roomsPage.page)}
          total={roomsPage.totalPages || 1}
          totalItems={roomsPage.totalElements || 0}
          onChange={(page) => loadRooms(page)}
        />
      </section>
    )
  }

  function renderDiscussion() {
    return (
      <section className="section">
        <button className="page-back" type="button" onClick={() => setView('home')}>返回</button>
        {message ? <div className="notice-box">{message}</div> : null}

        <div className="chat-room">
          <header className="chat-room-header">
            <div>
              <p className="eyebrow">讨论区</p>
              <h2>{selectedRoom?.title || '面试房间'}</h2>
              <p className="muted">{selectedRoom?.jobDirection || '模拟面试'} / {realtimeState}</p>
            </div>
            <div className="chat-room-actions">
              <span className={`room-status status-${String(selectedRoom?.status || 'OPEN').toLowerCase()}`}>
                {STATUS_TEXT[selectedRoom?.status] || selectedRoom?.status || '开放中'}
              </span>
              {Number(selectedRoom?.ownerId) === Number(user?.id) && !roomEnded ? (
                <button className="btn outline small" type="button" disabled={busy} onClick={handleEndRoom}>结束房间</button>
              ) : null}
              <button className="btn ghost small" type="button" onClick={() => openReview(selectedRoom || selectedRoomId)}>复盘评价</button>
            </div>
          </header>

          <div className="chat-room-body">
            <div className="chat-attachment-strip">
              <div className="chat-strip-title">附件资料</div>
              <div className="chat-attachment-list">
                {(attachmentsPage.content || []).map((item) => (
                  <button className="chat-attachment-chip" type="button" key={item.id} onClick={() => handleDownloadAttachment(item.id)}>
                    <span className="chat-file-badge">{(item.originalName || 'FILE').split('.').pop()?.slice(0, 4).toUpperCase()}</span>
                    <span className="chat-file-meta">
                      <strong>{item.originalName}</strong>
                      <small>{formatSize(item.sizeBytes)} / 点击下载</small>
                    </span>
                  </button>
                ))}
                {attachmentsPage.totalElements === 0 ? <span className="muted">暂无附件</span> : null}
              </div>
              <Pagination
                page={toUiPage(attachmentsPage.page)}
                total={attachmentsPage.totalPages || 1}
                totalItems={attachmentsPage.totalElements || 0}
                onChange={(page) => loadRoomData(selectedRoomId, { attachmentPage: page })}
              />
            </div>

            <div className="chat-message-list">
              {(messagesPage.content || []).map((item) => {
                const mine = user?.id && Number(item.senderId) === Number(user.id)
                return (
                  <div className={`chat-bubble-row ${mine ? 'mine' : ''}`} key={item.id}>
                    {!mine ? <span className="chat-avatar">{(item.senderName || '用').slice(0, 1)}</span> : null}
                    <div className="chat-bubble-wrap">
                      <div className="chat-bubble-head">
                        <strong>{item.senderName}</strong>
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                      <div className="chat-bubble">
                        <p>{item.content}</p>
                      </div>
                    </div>
                    {mine ? <span className="chat-avatar mine-avatar">{(item.senderName || user?.name || '我').slice(0, 1)}</span> : null}
                  </div>
                )
              })}
              {messagesPage.totalElements === 0 ? <p className="chat-empty">暂无消息，发一句开始模拟面试吧。</p> : null}
            </div>

            <Pagination
              page={toUiPage(messagesPage.page)}
              total={messagesPage.totalPages || 1}
              totalItems={messagesPage.totalElements || 0}
              onChange={(page) => loadRoomData(selectedRoomId, { messagePage: page })}
            />

            {uploadProgress ? (
              <div className="upload-progress">
                <div className="upload-progress-head">
                  <span>{uploadProgress.fileName}</span>
                  <strong>{uploadProgress.percent}%</strong>
                </div>
                <div className="upload-progress-track">
                  <span style={{ width: `${uploadProgress.percent}%` }} />
                </div>
              </div>
            ) : null}

            {roomEnded ? <div className="chat-ended-tip">房间已结束，讨论区已锁定。仍可查看消息、下载附件和进入复盘评价。</div> : null}

            <form className="chat-composer" onSubmit={handleSendMessage}>
              <input
                ref={attachmentInputRef}
                className="chat-file-input"
                type="file"
                accept={ACCEPTED_ATTACHMENT_TYPES}
                onChange={handleAttachmentPicked}
              />
              <button
                className="chat-icon-button"
                type="button"
                title="上传附件"
                aria-label="上传附件"
                disabled={busy || roomEnded}
                onClick={() => attachmentInputRef.current?.click()}
              >
                <span className="chat-plus-icon" aria-hidden="true" />
              </button>
              <textarea
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder={roomEnded ? '房间已结束，不能继续发消息' : '输入讨论内容...'}
                disabled={busy || roomEnded}
              />
              <button className="btn primary" type="submit" disabled={busy || roomEnded}>发送</button>
            </form>
          </div>
        </div>

        <div className="feature-card">
          <div className="track-head">
            <div className="card-title">精华复盘评价</div>
            <button className="btn ghost small" type="button" onClick={() => openReview(selectedRoom || selectedRoomId)}>全部评价</button>
          </div>
          <div className="track-grid">
            {(feedbackPreviewPage.content || []).map((item) => (
              <article className="track-card" key={item.id}>
                <div className="track-head">
                  <h3>{item.score} 分</h3>
                  <span className="tag subtle">{item.reviewerName}</span>
                </div>
                <p className="muted">{item.suggestions || item.strengths || '暂无文字评价'}</p>
              </article>
            ))}
            {feedbackPreviewPage.totalElements === 0 ? <p className="muted">暂无复盘评价。</p> : null}
          </div>
          <Pagination
            page={toUiPage(feedbackPreviewPage.page)}
            total={feedbackPreviewPage.totalPages || 1}
            totalItems={feedbackPreviewPage.totalElements || 0}
            onChange={(page) => loadRoomData(selectedRoomId, { feedbackPreviewPage: page })}
          />
        </div>
      </section>
    )
  }

  function renderReviewDetail() {
    return (
      <section className="section">
        <button className="page-back" type="button" onClick={() => setView('room')}>返回讨论区</button>
        <div className="section-head">
          <p className="eyebrow">复盘评价</p>
          <h2>{selectedRoom?.title || '房间复盘'}</h2>
        </div>
        <div className="grid-two">
          <form className="feature-card" onSubmit={handleSubmitFeedback}>
            <div className="card-title">新增评价</div>
            <div className="form-grid">
              {[
                ['score', '总分'],
                ['expressionScore', '表达'],
                ['logicScore', '逻辑'],
                ['etiquetteScore', '礼仪'],
              ].map(([key, label]) => (
                <label className="field" key={key}>
                  <span>{label}</span>
                  <input type="number" min="0" max="100" value={feedbackForm[key]} onChange={(event) => setFeedbackForm({ ...feedbackForm, [key]: Number(event.target.value) })} />
                </label>
              ))}
            </div>
            <label className="field">
              <span>亮点</span>
              <textarea value={feedbackForm.strengths} onChange={(event) => setFeedbackForm({ ...feedbackForm, strengths: event.target.value })} />
            </label>
            <label className="field">
              <span>问题</span>
              <textarea value={feedbackForm.problems} onChange={(event) => setFeedbackForm({ ...feedbackForm, problems: event.target.value })} />
            </label>
            <label className="field">
              <span>建议</span>
              <textarea value={feedbackForm.suggestions} onChange={(event) => setFeedbackForm({ ...feedbackForm, suggestions: event.target.value })} />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>保存评价</button>
          </form>

          <div className="feature-card">
            <div className="card-title">评价记录</div>
            <div className="result-stack">
              {(feedbackPage.content || []).map((item) => (
                <div className="wrong-item" key={item.id}>
                  <div className="track-head">
                    <strong>{item.reviewerName} / {item.score} 分</strong>
                    <span className="tag subtle">{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="muted">亮点：{item.strengths || '-'}</p>
                  <p className="muted">问题：{item.problems || '-'}</p>
                  <p className="muted">建议：{item.suggestions || '-'}</p>
                </div>
              ))}
              {feedbackPage.totalElements === 0 ? <p className="muted">暂无评价。</p> : null}
            </div>
            <Pagination
              page={toUiPage(feedbackPage.page)}
              total={feedbackPage.totalPages || 1}
              totalItems={feedbackPage.totalElements || 0}
              onChange={(page) => loadRoomData(selectedRoomId, { feedbackPage: page })}
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        {view === 'home' ? renderHome() : null}
        {view === 'create' ? renderCreate() : null}
        {view === 'join' ? renderRoomList('join') : null}
        {view === 'reviews' ? renderRoomList('reviews') : null}
        {view === 'room' ? renderDiscussion() : null}
        {view === 'review-detail' ? renderReviewDetail() : null}
      </main>
      <Footer />
    </div>
  )
}
