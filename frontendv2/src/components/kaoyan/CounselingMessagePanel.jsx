import { useEffect, useRef } from 'react'
import { formatDateTimeLabel } from '@/lib/stationData.js'

export default function CounselingMessagePanel({
  activeTab,
  currentUserId,
  session,
  sessionCounterpart,
  messages,
  draft,
  loading,
  sending,
  onDraftChange,
  onSend,
}) {
  const threadRef = useRef(null)

  useEffect(() => {
    const threadElement = threadRef.current
    if (!threadElement) return
    threadElement.scrollTop = threadElement.scrollHeight
  }, [messages, session?.id])

  return (
    <section className="v2-article-card v2-counseling-message-card">
      <div className="v2-counseling-message-card__head">
        <div>
          <p className="v2-kicker">当前对话</p>
          <h3>{session ? sessionCounterpart : '先选择一条会话'}</h3>
          <p className="v2-counseling-message-card__summary">
            {session
              ? `${activeTab === 'sent' ? '我发起的咨询' : '我收到的咨询'} · ${session.subject || '未命名咨询'}`
              : '左侧切换历史会话，右侧会保持同一块聊天工作台。'}
          </p>
        </div>
        {session?.createdAt ? (
          <span className="v2-plan-status-pill">{formatDateTimeLabel(session.createdAt)}</span>
        ) : null}
      </div>

      {!session ? (
        <div className="v2-counseling-thread v2-counseling-thread--empty">
          <article className="v2-counseling-empty-state">
            <strong>还没有展开的聊天窗</strong>
            <p>从左侧选中一条咨询后，这里会显示完整历史消息，并把输入区固定在底部。</p>
          </article>
        </div>
      ) : (
        <>
          <div className="v2-counseling-thread" ref={threadRef}>
            {messages.map((item) => {
              const mine = String(item.senderId || '') === String(currentUserId || '')
              return (
                <div className={`v2-chat-bubble-row ${mine ? 'mine' : ''}`} key={item.id}>
                  <article className="v2-chat-bubble">
                    <div className="v2-chat-bubble__head">
                      <strong>{mine ? '我' : item.senderName}</strong>
                      <span>{formatDateTimeLabel(item.createdAt)}</span>
                    </div>
                    <p>{item.content}</p>
                  </article>
                </div>
              )
            })}
            {!loading && !messages.length ? (
              <article className="v2-counseling-empty-state">
                <strong>{sessionCounterpart}</strong>
                <p>当前会话还没有消息，可以先发第一条，把背景、问题和期待说清楚。</p>
              </article>
            ) : null}
          </div>

          <form className="v2-counseling-composer" onSubmit={onSend}>
            <label className="v2-field">
              <span>发送消息</span>
              <textarea
                aria-label="发送消息"
                rows={3}
                value={draft}
                placeholder="把你的问题背景、当前进度和想得到的建议写清楚。"
                onChange={(event) => onDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    if (!sending && draft.trim()) onSend(event)
                  }
                }}
              />
            </label>
            <div className="v2-counseling-composer__actions">
              <p>Enter 发送，Shift + Enter 换行</p>
              <button className="v2-segment-button is-active" disabled={sending || !draft.trim()} type="submit">
                {sending ? '发送中...' : '发送消息'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
