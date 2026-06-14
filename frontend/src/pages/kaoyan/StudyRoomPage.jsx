import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyRoomApi, kaoyanApi } from '../../lib/api.js'
import '../../App.css'

const PAGE_SIZE = 10

function emptyPage(size) {
  return { content: [], page: 0, size, totalElements: 0, totalPages: 1 }
}

function formatDuration(seconds) {
  if (!seconds) return '0秒'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}小时${m}分钟`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function formatDateTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

function calcElapsed(startedAt) {
  if (!startedAt) return 0
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  return Math.floor((now - start) / 1000)
}

// Live duration for a leaderboard row: backend's `totalDurationSeconds` is
// a snapshot of finished sessions only, so for users still studying we add
// the seconds elapsed since their active `sessionStartedAt` so the badge
// ticks up without a server roundtrip.
function leaderboardDisplaySeconds(entry, nowMs) {
  const base = entry?.totalDurationSeconds || 0
  if (!entry?.sessionStartedAt) return base
  const startMs = new Date(entry.sessionStartedAt).getTime()
  if (Number.isNaN(startMs)) return base
  return base + Math.max(0, Math.floor((nowMs - startMs) / 1000))
}

// ===== LIST VIEW =====
function ListView({
  roomsPage, loadingRooms, filters, schoolOptions,
  myCreatedRooms, isAuthed,
  onFilterChange, onLoadRooms, onEnterRoom, onShowCreate,
}) {
  return (
    <>
      {/* Filter */}
      <form className="feature-card" onSubmit={e => { e.preventDefault(); onLoadRooms(0) }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="field" style={{ marginBottom: 0, minWidth: 160 }}>
            <span>目标院校</span>
            <select
              value={filters.schoolId}
              onChange={e => onFilterChange({ ...filters, schoolId: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="">全部院校</option>
              {schoolOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0, flex: 1, minWidth: 120 }}>
            <span>专业</span>
            <input
              type="text"
              placeholder="输入专业名称"
              value={filters.major}
              onChange={e => onFilterChange({ ...filters, major: e.target.value })}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            <button className="btn primary" type="submit">查询</button>
            <button className="btn ghost" type="button" onClick={() => onFilterChange({ schoolId: '', major: '' })}>清空</button>
          </div>
          <button
            className="btn primary"
            type="button"
            style={{ marginLeft: 'auto' }}
            onClick={() => isAuthed ? onShowCreate(true) : alert('请先登录')}
          >
            + 创建自习室
          </button>
        </div>
      </form>

      {/* Room list + current room info */}
      <div className="grid-two" style={{ gap: 16 }}>
        {/* Left: room list */}
        <div>
          {loadingRooms ? (
            <p className="muted">加载中...</p>
          ) : roomsPage.content?.length === 0 ? (
            <div className="feature-card">
              <div className="notice-box">
                <p>暂无自习室，{isAuthed ? '可以创建一个' : '请先登录后创建'}。</p>
              </div>
            </div>
          ) : (
            roomsPage.content?.map(room => (
              <div key={room.id} className="feature-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="card-title">{room.name}</div>
                    <div className="tag-row" style={{ marginTop: 8 }}>
                      {room.schoolName && <span className="tag subtle">{room.schoolName}</span>}
                      {room.major && <span className="tag subtle">{room.major}</span>}
                      <span className="tag subtle">{room.memberCount} 人</span>
                      <span className="tag">开放中</span>
                    </div>
                    <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                      创建者：{room.createdByName} · {formatDateTime(room.createdAt)}
                    </p>
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => onEnterRoom(room.id)}
                  >
                    加入
                  </button>
                </div>
              </div>
            ))
          )}
          {roomsPage.totalPages > 1 && (
            <Pagination
              page={roomsPage.page + 1}
              total={roomsPage.totalPages}
              totalItems={roomsPage.totalElements}
              onChange={p => onLoadRooms(p - 1)}
            />
          )}
        </div>

        {/* Right: my created rooms */}
        <div className="feature-card">
          <div className="card-title">我创建的自习室</div>
          {!isAuthed ? (
            <p className="muted" style={{ fontSize: 14 }}>请先登录查看</p>
          ) : myCreatedRooms.filter(r => r.status === 'OPEN').length === 0 ? (
            <div>
              <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>暂无创建的自习室</p>
              <button
                className="btn ghost"
                style={{ width: '100%' }}
                onClick={() => onShowCreate(true)}
              >
                + 创建自习室
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myCreatedRooms.filter(r => r.status === 'OPEN').map(room => (
                <div key={room.id} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{room.name}</div>
                    <div className="tag-row" style={{ marginTop: 4 }}>
                      {room.schoolName && <span className="tag subtle">{room.schoolName}</span>}
                      {room.major && <span className="tag subtle">{room.major}</span>}
                      <span className="tag subtle">{room.memberCount}人</span>
                    </div>
                  </div>
                  <button
                    className="btn ghost"
                    style={{ fontSize: 13, padding: '4px 12px' }}
                    onClick={() => onEnterRoom(room.id)}
                  >
                    进入
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ===== ROOM VIEW =====
function RoomView({
  currentRoom, members, messages, myElapsed, leaderboard,
  activePeriod, realtimeState, newMessage, sending,
  user, token, isOwner, tickNow,
  onLeaveRoom, onSendMessage, onMessageChange, onPeriodChange, onSend, onCloseRoom,
}) {
  const messagesListRef = useRef(null)

  useEffect(() => {
    const el = messagesListRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  return (
    <>
      {/* Room header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">同频自习室</p>
          <h2>{currentRoom?.name}</h2>
          <p className="muted">
            {currentRoom?.schoolName || '未选择院校'} · {currentRoom?.major || '未填写专业'}
            {' · '}
            <span style={{ color: '#22c55e' }}>● {realtimeState}</span>
            {' · '}
            我的学习时长：{formatDuration(myElapsed)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isOwner && (
            <button className="btn ghost" style={{ color: '#ef4444' }} onClick={onCloseRoom}>关闭自习室</button>
          )}
          <button className="btn ghost" onClick={onLeaveRoom}>退出自习室</button>
        </div>
      </div>

      <div className="grid-two" style={{ marginTop: 16, gap: 16, alignItems: 'stretch' }}>
        {/* Left: members + leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Members */}
          <div className="feature-card">
            <div className="card-title">在线成员 ({members.length})</div>
            {members.length === 0 ? (
              <p className="muted" style={{ fontSize: 14 }}>暂无成员</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => (
                  <div key={m.id || m.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 500 }}>{m.userName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="feature-card">
            <div className="card-title">学习排行</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[['all', '全部'], ['week', '本周'], ['day', '今日']].map(([p, label]) => (
                <button
                  key={p}
                  className={`tag ${activePeriod === p ? '' : 'subtle'}`}
                  style={{ cursor: 'pointer', border: activePeriod === p ? '1px solid var(--primary)' : '1px solid var(--border)', background: activePeriod === p ? 'var(--primary-light)' : 'transparent' }}
                  onClick={() => onPeriodChange(p)}
                >
                  {label}
                </button>
              ))}
            </div>
            {leaderboard.length === 0 ? (
              <p className="muted" style={{ fontSize: 14 }}>暂无排行数据</p>
            ) : (
              <div>
                {leaderboard.slice(0, 10).map((entry, idx) => (
                  <div key={entry.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: idx < 3 ? 600 : 400, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7c2c' : 'inherit' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {entry.userName}
                      {entry.leftAt ? (
                        <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>(已离开)</span>
                      ) : null}
                    </span>
                    <span className="muted" style={{ fontSize: 13, opacity: entry.leftAt ? 0.7 : 1 }}>{formatDuration(leaderboardDisplaySeconds(entry, tickNow))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: chat */}
        <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
          <div className="card-title">讨论区</div>
          <div ref={messagesListRef} className="chat-message-list" style={{ flex: 1, overflowY: 'auto', marginTop: 12 }}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p className="muted">暂无消息，进入房间后开始聊天吧。</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const mine = msg.senderId === user?.id
                return (
                  <div key={msg.id || i} className={`chat-bubble-row ${mine ? 'mine' : ''}`}>
                    <div className="chat-bubble">
                      <div className="chat-bubble-head">
                        <strong>{msg.senderName}</strong>
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form className="chat-composer" onSubmit={onSend} style={{ marginTop: 12 }}>
            <textarea
              value={newMessage}
              onChange={e => onMessageChange(e.target.value)}
              placeholder="输入讨论内容..."
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend(e)
                }
              }}
              maxLength={500}
            />
            <button className="btn primary" type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? '...' : '发送'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default function StudyRoomPage() {
  const { user, token, isAuthed } = useAuth()

  const [view, setView] = useState('list')
  const [roomsPage, setRoomsPage] = useState(emptyPage(PAGE_SIZE))
  const [currentRoom, setCurrentRoom] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [mySessionStartedAt, setMySessionStartedAt] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [myCreatedRooms, setMyCreatedRooms] = useState([])
  const [isOwner, setIsOwner] = useState(false)

  const [schoolOptions, setSchoolOptions] = useState([])
  const [filters, setFilters] = useState({ schoolId: '', major: '' })
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', schoolId: '', major: '' })
  const [creating, setCreating] = useState(false)

  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [realtimeState, setRealtimeState] = useState('未连接')
  const [myElapsed, setMyElapsed] = useState(0)
  const [activePeriod, setActivePeriod] = useState('all')
  // Wall-clock tick used to re-render every leaderboard row once a second
  // so each user's badge counts up while they're studying.
  const [tickNow, setTickNow] = useState(() => Date.now())

  const timerRef = useRef(null)
  const sseRef = useRef(null)
  const majorDebounceRef = useRef(null)
  // Tracks the leaderboard period the user is currently viewing, so the
  // SSE handler can read the freshest value (the closure in connectSSE is
  // captured once and would otherwise go stale when the user switches
  // tabs).
  const activePeriodRef = useRef(activePeriod)

  // Load schools for filter dropdown
  useEffect(() => {
    setLoadingSchools(true)
    kaoyanApi.schoolsPage({ size: 200 })
      .then(data => setSchoolOptions(data?.content || []))
      .catch(() => {})
      .finally(() => setLoadingSchools(false))
  }, [])

  function loadRooms(page = 0) {
    setLoadingRooms(true)
    const params = { page, size: PAGE_SIZE }
    if (filters.schoolId) params.schoolId = filters.schoolId
    if (filters.major) params.major = filters.major
    studyRoomApi.roomList(params)
      .then(data => setRoomsPage(data || emptyPage(PAGE_SIZE)))
      .catch(() => {})
      .finally(() => setLoadingRooms(false))
  }

  // 进入页面时：如果已在自习室中则直接跳转
  useEffect(() => {
    if (!isAuthed || !token) return
    studyRoomApi.myCurrentRoom(token)
      .then(data => {
        if (data?.inRoom) handleEnterRoom(data.roomId)
      })
      .catch(() => {})
    studyRoomApi.myCreatedRooms(token)
      .then(data => setMyCreatedRooms(Array.isArray(data) ? data : []))
      .catch(() => setMyCreatedRooms([]))
  }, [isAuthed, token])

  // Debounce major filter, schoolId change triggers immediate load
  useEffect(() => {
    clearTimeout(majorDebounceRef.current)
    majorDebounceRef.current = setTimeout(() => {
      if (view === 'list') loadRooms(0)
    }, 1000)
    return () => clearTimeout(majorDebounceRef.current)
  }, [filters.major])

  useEffect(() => {
    if (view === 'list') loadRooms(0)
  }, [filters.schoolId])

  async function handleEnterRoom(roomId) {
    if (!isAuthed) { alert('请先登录'); return }
    try {
      const detail = await studyRoomApi.roomDetail(roomId, token)
      setCurrentRoom({ id: roomId, name: detail.name, schoolName: detail.schoolName, major: detail.major })
      setMembers(detail.members || [])
      setIsOwner(!!detail.isOwner)
      loadLeaderboard(roomId, 'all')

      const member = await studyRoomApi.joinRoom(roomId, token)
      setMySessionStartedAt(member.sessionStartedAt || member.joinedAt)

      const since = member.joinedAt
      const msgsData = await studyRoomApi.messagesAfter(roomId, since, token)
      setMessages(msgsData?.content || [])

      connectSSE(roomId)
      setView('room')
    } catch (err) {
      alert(err.message || '加入失败')
    }
  }

  async function loadLeaderboard(roomId, period) {
    try {
      const board = await studyRoomApi.leaderboard(roomId, period, token)
      setLeaderboard(board || [])
    } catch { setLeaderboard([]) }
  }

  // Initial leaderboard fetch when entering a room or switching period.
  // Real-time updates arrive via the SSE "leaderboard-update" event in
  // connectSSE, so no polling is needed.
  useEffect(() => {
    if (view !== 'room' || !currentRoom) return
    loadLeaderboard(currentRoom.id, activePeriod)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentRoom, activePeriod])

  useEffect(() => {
    activePeriodRef.current = activePeriod
  }, [activePeriod])

  function connectSSE(roomId) {
    disconnectSSE()
    setRealtimeState('连接中')
    const source = new EventSource(studyRoomApi.roomStreamUrl(roomId))
    sseRef.current = source

    source.addEventListener('room-update', (event) => {
      const payload = JSON.parse(event.data || '{}')
      if (payload.type === 'connected') { setRealtimeState('已连接'); return }
      const data = payload.data || {}
      if (payload.type === 'member-joined') {
        setMembers(prev => {
          if (prev.find(m => m.userId === data.member?.userId)) return prev
          return [...prev, data.member]
        })
      } else if (payload.type === 'member-left') {
        setMembers(prev => prev.filter(m => m.userId !== data.userId))
      } else if (payload.type === 'room-closed') {
        alert('自习室已被创建者关闭')
        disconnectSSE()
        if (timerRef.current) clearInterval(timerRef.current)
        setView('list')
        setCurrentRoom(null); setMembers([]); setMessages([]); setMyElapsed(0); setIsOwner(false)
        loadMyCreatedRooms()
        loadRooms(roomsPage.page)
        return
      } else if (payload.type === 'message') {
        setMessages(prev => [...prev, data])
      } else if (payload.type === 'leaderboard-update') {
        // Real-time leaderboard pushed by the backend on join/leave/close.
        // Only apply if the period matches what the user is currently
        // viewing — otherwise the user is on week/day tab and the "all"
        // update would clobber it (they can still switch tabs to refresh).
        // Read the latest activePeriod via the ref so the closure-captured
        // value can't go stale.
        if (data.period === activePeriodRef.current) {
          setLeaderboard(Array.isArray(data.board) ? data.board : [])
        }
      }
    })

    source.onerror = () => setRealtimeState('正在重连')
  }

  function disconnectSSE() {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null }
  }

  // Timer
  useEffect(() => {
    if (view === 'room' && mySessionStartedAt) {
      timerRef.current = setInterval(() => setMyElapsed(calcElapsed(mySessionStartedAt)), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [view, mySessionStartedAt])

  // Tick once per second while in a room so the leaderboard rows refresh
  // their duration badges in real time (the helper
  // `leaderboardDisplaySeconds` adds the elapsed time on top of the
  // backend's session-end snapshot).
  useEffect(() => {
    if (view !== 'room') return
    const id = setInterval(() => setTickNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [view])

  function loadMyCreatedRooms() {
    if (!isAuthed) return
    studyRoomApi.myCreatedRooms(token)
      .then(data => setMyCreatedRooms(Array.isArray(data) ? data : []))
      .catch(() => setMyCreatedRooms([]))
  }

  async function handleLeaveRoom() {
    disconnectSSE()
    if (timerRef.current) clearInterval(timerRef.current)
    try { await studyRoomApi.leaveRoom(token) } catch {}
    setView('list')
    setCurrentRoom(null); setMembers([]); setMessages([]); setMyElapsed(0); setIsOwner(false)
    loadMyCreatedRooms()
    loadRooms(roomsPage.page)
  }

  async function handleCloseRoom() {
    if (!window.confirm('确定要关闭此自习室吗？关闭后所有成员将被移出。')) return
    try {
      await studyRoomApi.closeRoom(currentRoom.id, token)
      disconnectSSE()
      if (timerRef.current) clearInterval(timerRef.current)
      setView('list')
      setCurrentRoom(null); setMembers([]); setMessages([]); setMyElapsed(0); setIsOwner(false)
      loadMyCreatedRooms()
      loadRooms(roomsPage.page)
    } catch (err) { alert(err.message || '关闭失败') }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await studyRoomApi.sendMessage(currentRoom.id, newMessage.trim(), token)
      setNewMessage('')
    } catch (err) { alert(err.message || '发送失败') }
    finally { setSending(false) }
  }

  async function handleCreateRoom(e) {
    e.preventDefault()
    if (!createForm.name.trim()) { alert('请输入自习室名称'); return }
    setCreating(true)
    try {
      const room = await studyRoomApi.createRoom({
        name: createForm.name.trim(),
        schoolId: createForm.schoolId || null,
        major: createForm.major.trim() || null,
      }, token)
      setShowCreate(false)
      setCreateForm({ name: '', schoolId: '', major: '' })
      await handleEnterRoom(room.id)
    } catch (err) { alert(err.message || '创建失败') }
    finally { setCreating(false) }
  }

  function handlePeriodChange(period) {
    setActivePeriod(period)
    if (currentRoom) loadLeaderboard(currentRoom.id, period)
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">考研 · 陪伴学习</p>
            <h2>同频自习室</h2>
            <p className="muted">按院校、专业筛选加入自习室，在线陪伴学习，支持学习计时与排行榜。</p>
          </div>

          {view === 'list' ? (
            <ListView
              roomsPage={roomsPage} loadingRooms={loadingRooms}
              filters={filters} schoolOptions={schoolOptions}
              myCreatedRooms={myCreatedRooms}
              isAuthed={isAuthed}
              onFilterChange={setFilters} onLoadRooms={loadRooms}
              onEnterRoom={handleEnterRoom} onShowCreate={setShowCreate}
            />
          ) : (
            <RoomView
              currentRoom={currentRoom} members={members} messages={messages}
              myElapsed={myElapsed} leaderboard={leaderboard}
              activePeriod={activePeriod} realtimeState={realtimeState}
              newMessage={newMessage} sending={sending}
              user={user} token={token} isOwner={isOwner}
              tickNow={tickNow}
              onLeaveRoom={handleLeaveRoom} onMessageChange={setNewMessage}
              onSend={handleSend} onPeriodChange={handlePeriodChange}
              onCloseRoom={handleCloseRoom}
            />
          )}

          <Link className="btn ghost" to="/kaoyan">返回考研面板</Link>
        </section>
      </main>
      <Footer />

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>创建自习室</h3>
              <button className="btn ghost" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleCreateRoom}>
              <label className="field">
                <span>自习室名称 *</span>
                <input type="text" placeholder="例如：清华大学计算机考研小组"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={50} required />
              </label>
              <label className="field">
                <span>目标院校</span>
                <select value={createForm.schoolId}
                  onChange={e => setCreateForm(f => ({ ...f, schoolId: e.target.value }))}
                  style={{ width: '100%' }}>
                  <option value="">暂不选择</option>
                  {schoolOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>专业</span>
                <input type="text" placeholder="例如：计算机科学与技术"
                  value={createForm.major}
                  onChange={e => setCreateForm(f => ({ ...f, major: e.target.value }))}
                  maxLength={50} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn primary" disabled={creating}>
                  {creating ? '创建中...' : '创建并加入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}