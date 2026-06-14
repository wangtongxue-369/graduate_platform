import { useEffect, useState } from 'react'
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
  const { token } = useAuth()
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

  useEffect(() => {
    loadRoomWorkspace(activePeriod)
  }, [activePeriod, canUseRemote, roomId, token])

  useEffect(() => {
    if (!canUseRemote || !roomId) return undefined

    const eventSource = new EventSource(studyRoomApi.roomStreamUrl(roomId))
    setRealtimeState('connecting')

    eventSource.addEventListener('message', async () => {
      setRealtimeState('live')
      await Promise.all([
        refreshMessages(),
        refreshLeaderboard(),
      ])
    })

    eventSource.onerror = () => {
      setRealtimeState('fallback')
      eventSource.close()
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
      setNotice(error.message || '加入房间失败')
    }
  }

  async function handleLeaveRoom() {
    if (!canUseRemote || !token) return
    try {
      await studyRoomApi.leaveRoom(token)
      navigate('/station/kaoyan/support')
    } catch (error) {
      setNotice(error.message || '退出房间失败')
    }
  }

  async function handleCloseRoom() {
    if (!canUseRemote || !token) return
    try {
      await studyRoomApi.closeRoom(roomId, token)
      navigate('/station/kaoyan/support')
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
      await refreshMessages()
    } catch (error) {
      setNotice(error.message || '发送房间消息失败')
    } finally {
      setSending(false)
    }
  }

  const canLeave = Boolean(currentRoom?.id || currentRoom?.roomId)
  const canJoin = !canLeave && !room.closed
  const canClose = Boolean(room.isOwner)

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="同频自习室"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '陪跑协同', to: '/station/kaoyan/support' },
            { label: room.name || '自习室' },
          ]}
          title={room.name || '同频自习室'}
          lead="房间页只处理实时讨论、房间加入与排行协作，房间筛选和新建仍留在协同总览。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/support">返回协同总览</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步房间数据…</div> : null}

        <section className="v2-summary-strip" aria-label="房间摘要">
          <article className="v2-summary-card">
            <span>房间成员</span>
            <strong>{room.memberCount}</strong>
            <p>实时成员清单和排行都以当前房间为中心展开。</p>
          </article>
          <article className="v2-summary-card">
            <span>消息数量</span>
            <strong>{messages.length}</strong>
            <p>讨论流支持 SSE，同步失败时会回退手动刷新。</p>
          </article>
          <article className="v2-summary-card">
            <span>实时状态</span>
            <strong>{realtimeState}</strong>
            <p>如果显示 fallback，页面仍可继续使用，只是不再自动推送。</p>
          </article>
        </section>

        <StudyRoomChatPanel
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
          canJoin={canJoin}
          canLeave={canLeave}
          createdRooms={createdRooms}
          currentRoom={currentRoom}
          leaderboard={leaderboard}
          members={room.members || []}
          room={room}
          onCloseRoom={handleCloseRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onPeriodChange={setActivePeriod}
        />
      </aside>
    </>
  )
}
