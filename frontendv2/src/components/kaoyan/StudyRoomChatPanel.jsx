import { formatDateTimeLabel } from '@/lib/stationData.js'

export default function StudyRoomChatPanel({
  messages,
  draft,
  sending,
  realtimeState,
  onDraftChange,
  onSend,
  onRefresh,
}) {
  return (
    <section className="v2-article-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">房间讨论</p>
          <strong>把打卡、提问和当天任务都放在同一条讨论流里。</strong>
        </div>
        <button className="v2-segment-button" type="button" onClick={onRefresh}>
          手动刷新
        </button>
      </div>

      {realtimeState === 'fallback' ? (
        <div className="v2-status-note">实时连接已中断，当前退回手动刷新模式。</div>
      ) : null}

      <div className="v2-check-list">
        {messages.map((item) => (
          <div className="v2-check-row" key={item.id}>
            <strong>{item.senderName}</strong>
            <span>{item.content}</span>
            <span>{formatDateTimeLabel(item.createdAt)}</span>
          </div>
        ))}
        {!messages.length ? <p>当前房间还没有讨论消息。</p> : null}
      </div>

      <form className="v2-filter-form" onSubmit={onSend}>
        <label className="v2-field">
          <span>发送房间消息</span>
          <textarea
            rows={4}
            value={draft}
            placeholder="例如：我先做英语阅读 40 分钟，结束后回来复盘。"
            onChange={(event) => onDraftChange(event.target.value)}
          />
        </label>
        <button className="v2-segment-button is-active" disabled={sending || !draft.trim()} type="submit">
          {sending ? '发送中…' : '发送到房间'}
        </button>
      </form>
    </section>
  )
}
