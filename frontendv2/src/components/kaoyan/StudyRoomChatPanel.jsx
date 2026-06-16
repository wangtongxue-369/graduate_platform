import { useEffect, useRef } from 'react'
import { formatDateTimeLabel } from '@/lib/stationData.js'

export default function StudyRoomChatPanel({
  messages,
  draft,
  sending,
  realtimeState,
  currentUserId,
  onDraftChange,
  onSend,
  onRefresh,
}) {
  const threadRef = useRef(null)

  useEffect(() => {
    const threadElement = threadRef.current
    if (!threadElement) return
    threadElement.scrollTop = threadElement.scrollHeight
  }, [messages])

  return (
    <section className="v2-article-card v2-counseling-message-card">
      <div className="v2-counseling-message-card__head">
        <p className="v2-kicker">房间讨论</p>
        <button className="v2-segment-button" type="button" onClick={onRefresh}>
          手动刷新
        </button>
      </div>

      {realtimeState === 'fallback' ? (
        <div className="v2-status-note">实时连接已中断，当前退回手动刷新模式。</div>
      ) : null}

      <div className="v2-counseling-thread" ref={threadRef}>
        {messages.map((item) => {
          const mine = String(item.senderId || '') === String(currentUserId || '')
          return (
            <div
              className={`v2-chat-bubble-row ${mine ? 'mine' : ''}`}
              key={item.id}
            >
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
        {!messages.length ? (
          <article className="v2-counseling-empty-state">
            <strong>房间还没有讨论消息</strong>
            <p>可以先发第一条，把今天的学习任务、打卡或问题说清楚。</p>
          </article>
        ) : null}
      </div>

      <form className="v2-counseling-composer" onSubmit={onSend}>
        <label className="v2-field">
          <span>发送房间消息</span>
          <textarea
            aria-label="发送房间消息"
            rows={3}
            value={draft}
            placeholder="例如：我先做英语阅读 40 分钟，结束后回来复盘。"
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
          <button
            className="v2-segment-button is-active"
            disabled={sending || !draft.trim()}
            type="submit"
          >
            {sending ? '发送中…' : '发送到房间'}
          </button>
        </div>
      </form>
    </section>
  )
}
