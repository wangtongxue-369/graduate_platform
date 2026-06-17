import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyRoomApi } from '@legacy/lib/api.js'
import StudyRoomChatPanel from '@/components/kaoyan/StudyRoomChatPanel.jsx'
import StudyRoomSidebar from '@/components/kaoyan/StudyRoomSidebar.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createKaoyanSupportPreview,
  normalizeLeaderboardRows,
  normalizeRoomDetail,
  normalizeRoomMessages,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function KaoyanStudyRoomPage() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const previewRoom = createKaoyanSupportPreview().rooms[0]
  const [room, setRoom] = useState(normalizeRoomDetail(previewRoom, roomId))
  const [messages, setMessages] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [createdRooms, setCreatedRooms] = useState([])
  const [activePeriod, setActivePeriod] = useState('all')
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState(previewDataNotice('自习室'))
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [realtimeState, setRealtimeState] = useState('preview')
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [joinConflict, setJoinConflict] = useState(null)
  // 进入房间页只 join 一次：loadRoomWorkspace 多次更新 state 会让
  // canLeave/canUseRemote 等依赖项反复变化导致 useEffect 重跑，ref 标记
  // 后只在首次进入页面对当前 roomId 调一次 joinRoom，避免并发/重复插入。
  const joinAttemptedRef = useRef('')

  async function refreshMessages() {
    if (!canUseRemote || !roomId) return
    const data = await studyRoomApi.messagesAfter(roomId, undefined, token)
    setMessages(normalizeRoomMessages(data))
  }

  async function refreshLeaderboard(period = activePeriod) {
    if (!canUseRemote || !roomId) return
    const data = await studyRoomApi.leaderboard(roomId, period, token)
    setLeaderboard(normalizeLeaderboardRows(data))
  }

  async function loadRoomWorkspace(period = activePeriod) {
    if (!canUseRemote) {
      setRoom(normalizeRoomDetail(previewRoom, roomId))
      setMessages([])
      setLeaderboard([])
      setCurrentRoom(null)
      setCreatedRooms([])
      setRealtimeState('preview')
      setNotice(previewDataNotice('自习室'))
      return
    }

    setLoading(true)
    try {
      const [roomData, messageData, boardData, currentRoomData, createdData] = await withRequestTimeout(
        Promise.all([
          studyRoomApi.roomDetail(roomId, token),
          studyRoomApi.messagesAfter(roomId, undefined, token),
          studyRoomApi.leaderboard(roomId, period, token),
          studyRoomApi.myCurrentRoom(token).catch(() => null),
          studyRoomApi.myCreatedRooms(token).catch(() => []),
        ]),
        8000,
        '自习室数据读取超时，请检查后端服务。',
      )

      setRoom(normalizeRoomDetail(roomData, roomId))
      setMessages(normalizeRoomMessages(messageData))
      setLeaderboard(normalizeLeaderboardRows(boardData))
      setCurrentRoom(currentRoomData)
      setCreatedRooms(Array.isArray(createdData) ? createdData : [])
      setNotice(remoteDataNotice('自习室'))
    } catch (error) {
      setRoom(normalizeRoomDetail(previewRoom, roomId))
      setMessages([])
      setLeaderboard([])
      setCurrentRoom(null)
      setCreatedRooms([])
      setNotice(fallbackDataNotice('自习室', error))
    } finally {
      setLoading(false)
    }
  }

  const canLeave = Boolean(currentRoom?.id || currentRoom?.roomId)
  const canJoin = !canLeave && !room.closed
  const canClose = Boolean(room.isOwner)

  useEffect(() => {
    loadRoomWorkspace(activePeriod)
  }, [activePeriod, canUseRemote, roomId, token])

  // 进入房间页即默认加入（参考 v1 handleEnterRoom 模式）。
  // 仅在首次进入 roomId 时 join 一次，依赖 joinAttemptedRef + roomId，
  // 不会因为 canLeave/canUseRemote 等 state 变化重跑。
  // 已在别的房间时后端会抛「请先离开当前所在自习室，再加入新房间」，
  // 弹确认 modal 让用户选择「去当前房间 / 取消」。
  useEffect(() => {
    if (!canUseRemote || !token || !roomId) return
    if (room.closed) return
    if (joinAttemptedRef.current === String(roomId)) return
    joinAttemptedRef.current = String(roomId)
    handleJoinRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseRemote, token, roomId, room.closed])

  useEffect(() => {
    if (!canUseRemote || !roomId) return undefined

    const eventSource = new EventSource(studyRoomApi.roomStreamUrl(roomId))
    setRealtimeState('connecting')

    function sortMessagesByCreatedAt(rows) {
      return [...rows].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime()
        const bTime = new Date(b.createdAt || 0).getTime()
        return aTime - bTime
      })
    }

    eventSource.addEventListener('room-update', (event) => {
      setRealtimeState('live')
      let payload = null
      try {
        payload = event?.data ? JSON.parse(event.data) : null
      } catch {
        payload = null
      }
      if (!payload) return

      const data = payload.data || {}
      if (payload.type === 'connected') return

      if (payload.type === 'message') {
        // 后端按时间顺序推送，新消息追加在末尾即可
        setMessages((prev) => {
          if (prev.some((item) => String(item.id) === String(data.id))) return prev
          const next = normalizeRoomMessages({ content: [...prev, data] })
          return sortMessagesByCreatedAt(next)
        })
        return
      }

      if (payload.type === 'member-joined') {
        setRoom((current) => {
          const members = Array.isArray(current.members) ? current.members : []
          if (members.some((item) => String(item.userId || item.id) === String(data.member?.userId))) {
            return current
          }
          return { ...current, members: [...members, data.member] }
        })
        return
      }

      if (payload.type === 'member-left') {
        setRoom((current) => {
          const members = Array.isArray(current.members) ? current.members : []
          return { ...current, members: members.filter((item) => String(item.userId || item.id) !== String(data.userId)) }
        })
        return
      }

      if (payload.type === 'leaderboard-update') {
        refreshLeaderboard()
        return
      }

      if (payload.type === 'room-closed') {
        navigate('/station/kaoyan/support/rooms')
      }
    })

    eventSource.onerror = () => {
      // EventSource 会自动重连；标记为「重连中」即可，不主动 close
      setRealtimeState('reconnecting')
    }

    return () => {
      eventSource.close()
    }
  }, [activePeriod, canUseRemote, roomId, token])

  async function handleJoinRoom() {
    if (!canUseRemote || !token) return
    try {
      await studyRoomApi.joinRoom(roomId, token)
      await loadRoomWorkspace(activePeriod)
    } catch (error) {
      const message = error?.message || '加入房间失败'
      // 后端「请先离开当前所在自习室」 → 弹确认 modal
      if (message.includes('请先离开') && currentRoom) {
        setJoinConflict({
          currentRoomId: currentRoom.roomId || currentRoom.id,
          currentRoomName: currentRoom.name,
          message,
        })
        return
      }
      setNotice(message)
    }
  }

  async function handleLeaveRoom() {
    if (!canUseRemote || !token) return
    try {
      await studyRoomApi.leaveRoom(token)
      navigate('/station/kaoyan/support/rooms')
    } catch (error) {
      setNotice(error.message || '退出房间失败')
    }
  }

  async function handleCloseRoom() {
    if (!canUseRemote || !token) return
    try {
      await studyRoomApi.closeRoom(roomId, token)
      navigate('/station/kaoyan/support/rooms')
    } catch (error) {
      setNotice(error.message || '关闭房间失败')
    }
  }

  async function handleSend(event) {
    event.preventDefault()
    if (!canUseRemote || !token || !draft.trim()) return

    setSending(true)
    try {
      await studyRoomApi.sendMessage(roomId, draft.trim(), token)
      setDraft('')
      // 不主动 refreshMessages：等 SSE room-update(message) 事件统一推送新消息，
      // 与其它成员保持一致的消息顺序与时间戳。
    } catch (error) {
      setNotice(error.message || '发送房间消息失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="同频自习室"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '同频自习室', to: '/station/kaoyan/support/rooms' },
            { label: room.name || '自习室' },
          ]}
          title={room.name || '同频自习室'}
          lead="专注每一分钟，剩下的交给时间。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/support/rooms">返回同频自习室</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步房间数据…</div> : null}

        <StudyRoomChatPanel
          currentUserId={user?.id}
          draft={draft}
          messages={messages}
          realtimeState={realtimeState}
          sending={sending}
          onDraftChange={setDraft}
          onRefresh={() => loadRoomWorkspace(activePeriod)}
          onSend={handleSend}
        />
      </div>

      <aside className="v2-side-column">
        <StudyRoomSidebar
          activePeriod={activePeriod}
          canClose={canClose}
          canLeave={canLeave}
          createdRooms={createdRooms}
          currentRoom={currentRoom}
          leaderboard={leaderboard}
          members={room.members || []}
          room={room}
          onCloseRoom={() => setShowCloseConfirm(true)}
          onLeaveRoom={handleLeaveRoom}
          onPeriodChange={setActivePeriod}
        />
      </aside>

      {showCloseConfirm ? (
        <div className="v2-modal-overlay" onClick={() => setShowCloseConfirm(false)}>
          <div className="v2-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>关闭自习室</h3>
            <p style={{ margin: '12px 0 20px', color: 'var(--v2-soft-strong)' }}>
              确定要关闭此自习室吗？关闭后所有成员将被移出，讨论记录保留但不可继续发言。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="v2-segment-button" type="button" onClick={() => setShowCloseConfirm(false)}>
                取消
              </button>
              <button className="v2-segment-button is-active" type="button" onClick={handleCloseRoom}>
                确认关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {joinConflict ? (
        <div className="v2-modal-overlay" onClick={() => setJoinConflict(null)}>
          <div
            className="v2-modal-card v2-room-join-conflict"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="v2-modal-head">
              <h3>只能加入一个自习室</h3>
              <button className="v2-segment-button" type="button" onClick={() => setJoinConflict(null)}>
                关闭
              </button>
            </div>
            <p>
              {joinConflict.currentRoomName
                ? `你当前已经加入「${joinConflict.currentRoomName}」，请先离开它，再加入新房间。`
                : '你当前已加入其它自习室，请先离开它，再加入新房间。'}
            </p>
            <div className="v2-inline-actions">
              <button className="v2-segment-button" type="button" onClick={() => setJoinConflict(null)}>
                取消
              </button>
              <button
                className="v2-segment-button is-active"
                type="button"
                onClick={() => {
                  const target = joinConflict.currentRoomId
                  setJoinConflict(null)
                  if (target) navigate(`/station/kaoyan/support/rooms/${target}`)
                }}
              >
                回到当前房间
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
