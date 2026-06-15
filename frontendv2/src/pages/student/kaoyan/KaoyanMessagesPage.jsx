import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { mentorApi } from '@legacy/lib/api.js'
import CounselingMessagePanel from '@/components/kaoyan/CounselingMessagePanel.jsx'
import CounselingSessionList from '@/components/kaoyan/CounselingSessionList.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import {
  normalizeCounselingMessages,
  normalizeCounselingSessions,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'

const PAGE_SIZE = 10

export default function KaoyanMessagesPage() {
  const location = useLocation()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [activeTab, setActiveTab] = useState('sent')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState(previewDataNotice('咨询消息'))
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const selectedSession = useMemo(
    () => sessions.find((item) => String(item.id) === String(selectedSessionId)) || null,
    [selectedSessionId, sessions],
  )

  useEffect(() => {
    setPage(0)
    setSelectedSessionId('')
    setMessages([])
  }, [activeTab])

  useEffect(() => {
    let active = true

    async function loadSessions() {
      if (!canUseRemote) {
        setSessions([])
        setSelectedSessionId('')
        setMessages([])
        setTotalPages(1)
        setTotalElements(0)
        setNotice(previewDataNotice('咨询消息'))
        return
      }

      setLoadingSessions(true)
      try {
        const data = activeTab === 'sent'
          ? await mentorApi.sentSessions({ page, size: PAGE_SIZE }, token)
          : await mentorApi.receivedSessions({ page, size: PAGE_SIZE }, token)

        if (!active) return

        const nextSessions = normalizeCounselingSessions(data)
        const preferredId = String(location.state?.sessionId || '')
        const nextSelectedId = preferredId && nextSessions.some((item) => String(item.id) === preferredId)
          ? preferredId
          : nextSessions[0]?.id
            ? String(nextSessions[0].id)
            : ''

        setSessions(nextSessions)
        setSelectedSessionId(nextSelectedId)
        setTotalPages(Math.max(1, Number(data?.totalPages || 1)))
        setTotalElements(Number(data?.totalElements || nextSessions.length))
        setNotice(remoteDataNotice('咨询消息'))
      } catch (error) {
        if (!active) return
        setSessions([])
        setSelectedSessionId('')
        setMessages([])
        setTotalPages(1)
        setTotalElements(0)
        setNotice(fallbackDataNotice('咨询消息', error))
      } finally {
        if (active) setLoadingSessions(false)
      }
    }

    loadSessions()
    return () => {
      active = false
    }
  }, [activeTab, canUseRemote, location.state?.sessionId, page, token])

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
      } catch (error) {
        if (!active) return
        setMessages([])
        setNotice(error.message || '咨询消息读取失败。')
      } finally {
        if (active) setLoadingMessages(false)
      }
    }

    loadMessages()
    return () => {
      active = false
    }
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
    } catch (error) {
      setNotice(error.message || '发送消息失败。')
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
          kicker="咨询消息"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '1v1咨询', to: '/station/kaoyan/support/mentors' },
            { label: '咨询消息' },
          ]}
          title="把 1v1咨询会话和连续追问收进同一条消息流。"
          lead="左边只管切会话，右边只管读消息和继续发送，避免旧版列表和聊天区来回切换。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/support/mentors">回到 1v1咨询</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loadingSessions ? <div className="v2-status-note">正在同步咨询会话…</div> : null}

        <section className="v2-split-board v2-counseling-board">
          <CounselingSessionList
            activeTab={activeTab}
            loading={loadingSessions}
            page={page}
            sessions={sessions}
            selectedId={selectedSessionId}
            totalElements={totalElements}
            totalPages={totalPages}
            onNextPage={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            onPreviousPage={() => setPage((current) => Math.max(0, current - 1))}
            onSelect={setSelectedSessionId}
            onTabChange={handleTabChange}
          />
          <CounselingMessagePanel
            draft={draft}
            loading={loadingMessages}
            messages={messages}
            sending={sending}
            session={selectedSession}
            onDraftChange={setDraft}
            onSend={handleSend}
          />
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">当前工作流</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>会话分组</strong>
              <span>{activeTab === 'sent' ? '我发起的咨询' : '我收到的咨询'}</span>
            </div>
            <div className="v2-check-row">
              <strong>会话总数</strong>
              <span>{totalElements} 条</span>
            </div>
            <div className="v2-check-row">
              <strong>当前选中</strong>
              <span>{selectedSession ? '已展开当前会话主题' : '先从左侧选择会话'}</span>
            </div>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">消息建议</p>
          <ul>
            <li>先在主题里说明问题场景，再在消息里补细节，学长学姐更容易快速接住。</li>
            <li>同一问题尽量在同一会话里追问，避免重复新建主题造成信息断裂。</li>
            <li>如果问题已经转成长期结伴复习，改走同频自习室会更合适。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
