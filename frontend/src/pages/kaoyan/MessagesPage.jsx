import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { mentorApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

function formatTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

export default function MessagesPage() {
  const { token, user } = useAuth()
  const [tab, setTab] = useState('sent')
  const [sessions, setSessions] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesListRef = useRef(null)

  const fetchSessions = useCallback(async (t, p) => {
    setLoading(true)
    try {
      let data
      if (t === 'sent') {
        data = await mentorApi.sentSessions({ page: p - 1, size: 10 }, token)
      } else {
        data = await mentorApi.receivedSessions({ page: p - 1, size: 10 }, token)
      }
      setSessions(data?.content || [])
      setTotalPages(data?.totalPages || 1)
      setTotalElements(data?.totalElements || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchMessages = useCallback(async (sessionId) => {
    try {
      const data = await mentorApi.sessionMessages(sessionId, token)
      setMessages(data || [])
      await mentorApi.markAsRead(sessionId, token)
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s))
      fetchSessions(tab, page)
    } catch (err) {
      console.error(err)
    }
  }, [token, fetchSessions, tab, page])

  useEffect(() => {
    if (token && token !== 'dev-token') {
      fetchSessions(tab, page)
    }
  }, [tab, page, fetchSessions])

  useEffect(() => {
    const el = messagesListRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const handleTabChange = (t) => {
    setTab(t)
    setPage(1)
    setActiveSession(null)
  }

  const handleSelectSession = (session) => {
    setActiveSession(session)
    fetchMessages(session.id)
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!inputText.trim() || !activeSession || sending) return
    setSending(true)
    try {
      await mentorApi.sendMessage(activeSession.id, inputText.trim(), token)
      setInputText('')
      fetchMessages(activeSession.id)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!token || token === 'dev-token') return
    const t = setInterval(() => { fetchSessions(tab, page) }, 15000)
    return () => clearInterval(t)
  }, [token, tab, page, fetchSessions])

  const otherParty = (session) => {
    if (!user) return { name: '未知', avatar: null }
    if (tab === 'sent') {
      return { name: session.mentorName, avatar: session.mentorAvatar }
    }
    return { name: session.studentName, avatar: session.studentAvatar }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <Link to="/kaoyan/mentors" className="btn ghost small">返回列表</Link>
            <h2>我的私信</h2>
          </div>
        </section>

        <section className="section">
          <div className="feature-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 0 }}>
              <button
                className={`tag ${tab === 'sent' ? '' : 'subtle'}`}
                style={{ cursor: 'pointer', border: tab === 'sent' ? '1px solid var(--primary)' : '1px solid var(--border)', background: tab === 'sent' ? 'var(--primary-light)' : 'transparent', padding: '6px 16px' }}
                onClick={() => handleTabChange('sent')}
              >
                发出的咨询
              </button>
              <button
                className={`tag ${tab === 'received' ? '' : 'subtle'}`}
                style={{ cursor: 'pointer', border: tab === 'received' ? '1px solid var(--primary)' : '1px solid var(--border)', background: tab === 'received' ? 'var(--primary-light)' : 'transparent', padding: '6px 16px' }}
                onClick={() => handleTabChange('received')}
              >
                收到的咨询
              </button>
            </div>
          </div>

          <div className="grid-two" style={{ gap: 16, alignItems: 'stretch' }}>
            <div className="feature-card">
              <div className="card-title">{tab === 'sent' ? '发出的咨询' : '收到的咨询'}</div>
              {loading ? (
                <p className="muted">加载中...</p>
              ) : sessions.length === 0 ? (
                <p className="muted">暂无会话</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sessions.map((session) => {
                    const other = otherParty(session)
                    return (
                      <div
                        key={session.id}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          cursor: 'pointer',
                          borderColor: activeSession?.id === session.id ? 'var(--primary)' : 'var(--border)',
                          background: activeSession?.id === session.id ? 'var(--primary-light)' : 'transparent',
                        }}
                        onClick={() => handleSelectSession(session)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{other.name}</div>
                              {session.unreadCount > 0 && (
                                <span className="badge" style={{ background: '#e74c3c', color: '#fff', fontSize: 11, padding: '1px 7px', borderRadius: 999 }}>
                                  {session.unreadCount}
                                </span>
                              )}
                            </div>
                            {session.subject && (
                              <div className="muted small" style={{ marginTop: 2 }}>{session.subject}</div>
                            )}
                            <div className="muted small">{formatTime(session.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  total={totalPages}
                  totalItems={totalElements}
                  onChange={(p) => { setPage(p); setActiveSession(null) }}
                />
              )}
            </div>

            <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
              {!activeSession ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="muted">选择一个会话开始聊天</p>
                </div>
              ) : (
                <>
                  <div className="card-title" style={{ marginBottom: 12 }}>
                    与 {otherParty(activeSession).name} 的咨询
                    {activeSession.subject && (
                      <span className="muted small" style={{ marginLeft: 8 }}>{activeSession.subject}</span>
                    )}
                  </div>
                  <div ref={messagesListRef} className="chat-message-list" style={{ flex: 1, overflowY: 'auto' }}>
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <p className="muted">暂无消息，开始对话吧</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const mine = msg.senderId === user?.id
                        return (
                          <div key={msg.id} className={`chat-bubble-row ${mine ? 'mine' : ''}`}>
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
                  <form className="chat-composer" onSubmit={handleSend} style={{ marginTop: 12 }}>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="输入消息..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      maxLength={500}
                    />
                    <button className="btn primary" type="submit" disabled={sending || !inputText.trim()}>
                      {sending ? '...' : '发送'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}