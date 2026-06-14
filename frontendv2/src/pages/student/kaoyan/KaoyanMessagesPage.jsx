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

export default function KaoyanMessagesPage() {
  const location = useLocation()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [activeTab, setActiveTab] = useState('sent')
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState(previewDataNotice('咨询消息'))
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const selectedSession = useMemo(
    () => sessions.find((item) => String(item.id) === String(selectedSessionId)) || null,
    [selectedSessionId, sessions],
  )

  async function loadSessions(nextTab = activeTab) {
    if (!canUseRemote) {
      setSessions([])
      setMessages([])
      setSelectedSessionId('')
      setNotice(previewDataNotice('咨询消息'))
      return
    }

    setLoading(true)
    try {
      const data = nextTab === 'sent'
        ? await mentorApi.sentSessions({ page: 0, size: 12 }, token)
        : await mentorApi.receivedSessions({ page: 0, size: 12 }, token)
      const nextSessions = normalizeCounselingSessions(data)
      const preferredId = location.state?.sessionId ? String(location.state.sessionId) : ''
      const fallbackId = nextSessions[0]?.id ? String(nextSessions[0].id) : ''

      setSessions(nextSessions)
      setSelectedSessionId((current) => {
        if (preferredId && nextSessions.some((item) => String(item.id) === preferredId)) return preferredId
        if (current && nextSessions.some((item) => String(item.id) === String(current))) return current
        return fallbackId
      })
      setNotice(remoteDataNotice('咨询消息'))
    } catch (error) {
      setSessions([])
      setMessages([])
      setSelectedSessionId('')
      setNotice(fallbackDataNotice('咨询消息', error))
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(sessionId) {
    if (!sessionId || !canUseRemote) {
      setMessages([])
      return
    }

    try {
      const data = await mentorApi.sessionMessages(sessionId, token)
      setMessages(normalizeCounselingMessages(data))
      await mentorApi.markAsRead(sessionId, token).catch(() => {})
    } catch (error) {
      setMessages([])
      setNotice(error.message || '消息读取失败')
    }
  }

  useEffect(() => {
    loadSessions(activeTab)
  }, [activeTab, canUseRemote, token])

  useEffect(() => {
    if (!selectedSessionId) return
    loadMessages(selectedSessionId)
  }, [selectedSessionId, canUseRemote, token])

  async function handleSend(event) {
    event.preventDefault()
    if (!selectedSessionId || !draft.trim() || !canUseRemote || !token) return

    setSending(true)
    try {
      await mentorApi.sendMessage(selectedSessionId, draft.trim(), token)
      await mentorApi.markAsRead(selectedSessionId, token).catch(() => {})
      setDraft('')
      await loadMessages(selectedSessionId)
      await loadSessions(activeTab)
    } catch (error) {
      setNotice(error.message || '消息发送失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="咨询消息"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '陪跑协同', to: '/station/kaoyan/support' },
            { label: '咨询消息' },
          ]}
          title="把发起中的咨询、收到的回复和继续追问放在一条连续消息流里。"
          lead="旧前端的私信和咨询列表在这里被拆成左侧会话、右侧消息面板两块，不再互相打断。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/support">返回协同总览</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步咨询会话…</div> : null}

        <section className="v2-summary-strip" aria-label="咨询摘要">
          <article className="v2-summary-card">
            <span>当前分组</span>
            <strong>{activeTab === 'sent' ? '我发起的' : '我收到的'}</strong>
            <p>左侧列表只保留当前分类下的会话。</p>
          </article>
          <article className="v2-summary-card">
            <span>会话数量</span>
            <strong>{sessions.length}</strong>
            <p>进入消息页后，优先把已有会话处理完再新开咨询。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前选中</span>
            <strong>{selectedSession?.subject || '尚未选择'}</strong>
            <p>会话切换后，消息区会自动拉取并标记已读。</p>
          </article>
        </section>

        <section className="v2-split-board">
          <CounselingSessionList
            activeTab={activeTab}
            sessions={sessions}
            selectedId={selectedSessionId}
            onSelect={setSelectedSessionId}
            onTabChange={setActiveTab}
          />
          <CounselingMessagePanel
            draft={draft}
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
          <p className="v2-kicker">处理建议</p>
          <ul>
            <li>发起咨询时把问题背景写清楚，消息区再补细节，能减少来回追问。</li>
            <li>收到回复后先在当前会话里继续追问，不要重复创建多个并行主题。</li>
            <li>会话状态与未读提醒仍以旧后端接口为准，这里只重做页面结构。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
