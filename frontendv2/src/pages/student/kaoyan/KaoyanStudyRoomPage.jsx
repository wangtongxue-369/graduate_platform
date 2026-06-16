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

  // Auto-join when the page is opened by the room's creator so they don't
  // need to click "加入房间" manually every time.
  useEffect(() => {
    if (!loading && room.isOwner && canJoin) {
      handleJoinRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, room.isOwner, canJoin])

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
      await refreshMessages()
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
