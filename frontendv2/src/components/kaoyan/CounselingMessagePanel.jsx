import { formatDateTimeLabel } from '@/lib/stationData.js'

export default function CounselingMessagePanel({
  session,
  messages,
  draft,
  sending,
  onDraftChange,
  onSend,
}) {
  return (
    <section className="v2-article-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">咨询消息</p>
          <strong>{session ? (session.mentorName || session.studentName || session.subject) : '先选一个会话'}</strong>
        </div>
      </div>

      {!session ? (
        <p className="v2-note-text">从左侧选择一个会话后，这里会展开完整消息和发送入口。</p>
      ) : (
        <>
          <div className="v2-check-list">
            {messages.map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.senderName}</strong>
                <span>{item.content}</span>
                <span>{formatDateTimeLabel(item.createdAt)}</span>
              </div>
            ))}
            {!messages.length ? <p>当前会话还没有消息，可以先发第一条。</p> : null}
          </div>

          <form className="v2-filter-form" onSubmit={onSend}>
            <label className="v2-field">
              <span>发送消息</span>
              <textarea
                rows={4}
                value={draft}
                placeholder="把复习阶段、问题背景和希望得到的建议写清楚。"
                onChange={(event) => onDraftChange(event.target.value)}
              />
            </label>
            <button className="v2-segment-button is-active" disabled={sending || !draft.trim()} type="submit">
              {sending ? '发送中…' : '发送消息'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
