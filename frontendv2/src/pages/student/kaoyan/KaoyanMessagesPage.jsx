import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { mentorApi } from '@legacy/lib/api.js'
import CounselingMessagePanel from '@/components/kaoyan/CounselingMessagePanel.jsx'
import CounselingSessionList from '@/components/kaoyan/CounselingSessionList.jsx'
import KaoyanMentorProfileModal from '@/components/kaoyan/KaoyanMentorProfileModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import {
  normalizeCounselingMessages,
  normalizeCounselingSessions,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import { canUseRemoteToken, formatDateTimeLabel } from '@/lib/stationData.js'

const PAGE_SIZE = 10
const AUTO_REFRESH_MS = 15000

function getSessionCounterpart(session, currentUserId, activeTab) {
  if (!session) return ''

  const currentId = String(currentUserId || '')
  const mentorId = String(session.mentorId || '')
  const studentId = String(session.studentId || '')

  if (currentId && currentId === mentorId) {
    return session.studentName || '咨询同学'
  }

  if (currentId && currentId === studentId) {
    return session.mentorName || '学长学姐'
  }

  return activeTab === 'sent'
    ? (session.mentorName || '学长学姐')
    : (session.studentName || '咨询同学')
}

function matchesSessionGroup(session, currentUserId, activeTab) {
  if (!currentUserId) return true

  const currentId = String(currentUserId)
  const mentorId = String(session.mentorId || '')
  const studentId = String(session.studentId || '')

  return activeTab === 'sent'
    ? studentId === currentId
    : mentorId === currentId
}

export default function KaoyanMessagesPage() {
  const location = useLocation()
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [activeTab, setActiveTab] = useState('sent')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasLoadedSessions, setHasLoadedSessions] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const selectedSessionIdRef = useRef('')
  const [profileMentor, setProfileMentor] = useState(null)

  async function handleViewMentor(mentorId) {
    if (!canUseRemote || !mentorId) return
    try {
      const data = await mentorApi.mentorsPage({ size: 200 })
      const list = Array.isArray(data?.content) ? data.content : []
      const found = list.find((item) => String(item.id) === String(mentorId))
      setProfileMentor(found || null)
    } catch {
      setProfileMentor(null)
    }
  }

  const visibleSessions = useMemo(
    () => sessions.filter((item) => matchesSessionGroup(item, user?.id, activeTab)),
    [activeTab, sessions, user?.id],
  )

  const visibleTotalElements = visibleSessions.length !== sessions.length
    ? visibleSessions.length
    : totalElements

  const visibleTotalPages = visibleSessions.length !== sessions.length
    ? 1
    : totalPages

  const selectedSession = useMemo(
    () => visibleSessions.find((item) => String(item.id) === String(selectedSessionId)) || null,
    [selectedSessionId, visibleSessions],
  )

  const selectedSessionCounterpart = useMemo(
    () => getSessionCounterpart(selectedSession, user?.id, activeTab),
    [activeTab, selectedSession, user?.id],
  )

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId
  }, [selectedSessionId])

  useEffect(() => {
    setPage(0)
    setSelectedSessionId('')
    setMessages([])
    setHasLoadedSessions(false)
  }, [activeTab])

  useEffect(() => {
    if (!canUseRemote) return undefined

    const intervalId = setInterval(() => {
      setRefreshTick((current) => current + 1)
    }, AUTO_REFRESH_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [canUseRemote])

  useEffect(() => {
    if (!canUseRemote || !token || typeof EventSource === 'undefined') {
      return undefined
    }

    const eventSource = new EventSource(mentorApi.counselingStreamUrl(token))

    const handleCounselingUpdate = (event) => {
      let payload = null
      try {
        payload = event?.data ? JSON.parse(event.data) : null
      } catch {
        payload = null
      }

      if (payload?.type === 'connected') return
      setRefreshTick((current) => current + 1)
    }

    const handleError = () => {
      eventSource.close()
    }

    eventSource.addEventListener('counseling-update', handleCounselingUpdate)
    eventSource.addEventListener('error', handleError)

    return () => {
      eventSource.close()
    }
  }, [canUseRemote, token])

  useEffect(() => {
    let active = true

    async function loadSessions() {
      if (!canUseRemote) {
        setSessions([])
        setSelectedSessionId('')
        setMessages([])
        setTotalPages(1)
        setTotalElements(0)
        setHasLoadedSessions(true)
        return
      }

      setLoadingSessions(true)
      try {
        const data = activeTab === 'sent'
          ? await mentorApi.sentSessions({ page, size: PAGE_SIZE }, token)
          : await mentorApi.receivedSessions({ page, size: PAGE_SIZE }, token)

        if (!active) return

        const nextSessions = normalizeCounselingSessions(data)
        const nextVisibleSessions = nextSessions.filter((item) => matchesSessionGroup(item, user?.id, activeTab))
        const currentSelectedId = String(selectedSessionIdRef.current || '')
        const preferredId = String(location.state?.sessionId || '')
        const nextSelectedId = currentSelectedId && nextVisibleSessions.some((item) => String(item.id) === currentSelectedId)
          ? currentSelectedId
          : preferredId && nextVisibleSessions.some((item) => String(item.id) === preferredId)
            ? preferredId
            : nextVisibleSessions[0]?.id
              ? String(nextVisibleSessions[0].id)
              : ''

        setSessions(nextSessions)
        setSelectedSessionId(nextSelectedId)
        setTotalPages(Math.max(1, Number(data?.totalPages || 1)))
        setTotalElements(Number(data?.totalElements || nextSessions.length))
      } catch {
        if (!active) return
        setSessions([])
        setSelectedSessionId('')
        setMessages([])
        setTotalPages(1)
        setTotalElements(0)
      } finally {
        if (active) {
          setLoadingSessions(false)
          setHasLoadedSessions(true)
        }
      }
    }

    loadSessions()
    return () => {
      active = false
    }
  }, [activeTab, canUseRemote, location.state?.sessionId, page, refreshTick, token])

  useEffect(() => {
    let active = true

    async function loadMessages() {
      if (!canUseRemote || !selectedSessionId) {
        setMessages([])
        return
      }

      setLoadingMessages(true)
      try {
        const data = await mentorApi.sessionMessages(selectedSessionId, token)
        if (!active) return
        setMessages(normalizeCounselingMessages(data))
        await mentorApi.markAsRead(selectedSessionId, token).catch(() => {})
        // Immediately zero the unread badge in local state so the UI
        // responds instantly (same as v1 behaviour). The next SSE / poll
        // cycle will reconcile with the authoritative backend count.
        setSessions((prev) =>
          prev.map((s) =>
            String(s.id) === String(selectedSessionId)
              ? { ...s, unreadCount: 0 }
              : s,
          ),
        )
      } catch {
        if (!active) return
        setMessages([])
      } finally {
        if (active) setLoadingMessages(false)
      }
    }

    loadMessages()
    return () => {
      active = false
    }
    // 注意：故意不依赖 refreshTick。loadMessages 内部会调 markAsRead，
    // 后端会 emit "read" 事件推回 SSE，handleCounselingUpdate 把
    // refreshTick +1，再回到这里会形成 markAsRead → SSE → loadMessages
    // 死循环，每 15s 把 /api/.../sessions/received|sent 打爆。
    // loadSessions 那边依赖 refreshTick 已足够保证列表实时刷新；
    // 消息本身的实时刷新走 SSE 推送。
  }, [canUseRemote, selectedSessionId, token])

  async function handleSend(event) {
    event.preventDefault()
    if (!canUseRemote || !selectedSession || !draft.trim()) return

    setSending(true)
    try {
      await mentorApi.sendMessage(selectedSession.id, draft.trim(), token)
      setDraft('')
      const data = await mentorApi.sessionMessages(selectedSession.id, token)
      setMessages(normalizeCounselingMessages(data))
      await mentorApi.markAsRead(selectedSession.id, token).catch(() => {})
      setSessions((prev) =>
        prev.map((s) =>
          String(s.id) === String(selectedSession.id)
            ? { ...s, unreadCount: 0 }
            : s,
        ),
      )
    } finally {
      setSending(false)
    }
  }

  function handleTabChange(nextTab) {
    if (nextTab === activeTab) return
    setActiveTab(nextTab)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考研咨询"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '1v1咨询', to: '/station/kaoyan/support/mentors' },
            { label: '咨询消息' },
          ]}
          title="咨询消息"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/support/mentors">回到 1v1 咨询</Link>}
        />

        <section className="v2-split-board v2-counseling-board v2-counseling-workbench">
          <CounselingSessionList
            activeTab={activeTab}
            currentUserId={user?.id}
            loading={loadingSessions}
            page={page}
            sessions={visibleSessions}
            showEmptyState={hasLoadedSessions && !visibleSessions.length}
            selectedId={selectedSessionId}
            totalElements={visibleTotalElements}
            totalPages={visibleTotalPages}
            onNextPage={() => setPage((current) => Math.min(visibleTotalPages - 1, current + 1))}
            onPreviousPage={() => setPage((current) => Math.max(0, current - 1))}
            onSelect={setSelectedSessionId}
            onTabChange={handleTabChange}
          />
          <CounselingMessagePanel
            activeTab={activeTab}
            currentUserId={user?.id}
            draft={draft}
            loading={loadingMessages}
            messages={messages}
            sending={sending}
            session={selectedSession}
            sessionCounterpart={selectedSessionCounterpart}
            onDraftChange={setDraft}
            onSend={handleSend}
            onViewMentor={handleViewMentor}
          />
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card v2-counseling-context-card">
          <p className="v2-kicker">当前会话</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>会话分组</strong>
              <span>{activeTab === 'sent' ? '我发起的咨询' : '我收到的咨询'}</span>
            </div>
            <div className="v2-check-row">
              <strong>当前对象</strong>
              <span>{selectedSession ? selectedSessionCounterpart : '先从左侧选择一条会话'}</span>
            </div>
            <div className="v2-check-row">
              <strong>最近时间</strong>
              <span>{selectedSession?.createdAt ? formatDateTimeLabel(selectedSession.createdAt) : '会话选中后显示'}</span>
            </div>
            <div className="v2-check-row">
              <strong>会话总数</strong>
              <span>{`${visibleTotalElements} 条`}</span>
            </div>
          </div>
        </section>
      </aside>

      {profileMentor ? (
        <KaoyanMentorProfileModal
          mentor={profileMentor}
          onClose={() => setProfileMentor(null)}
          onConsult={() => setProfileMentor(null)}
        />
      ) : null}
    </>
  )
}
