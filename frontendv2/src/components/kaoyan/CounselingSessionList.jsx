export default function CounselingSessionList({
  activeTab,
  sessions,
  selectedId,
  onSelect,
  onTabChange,
}) {
  return (
    <section className="v2-article-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">咨询会话</p>
          <strong>{activeTab === 'sent' ? '我发起的' : '我收到的'}</strong>
        </div>
        <div className="v2-segment-group" role="group" aria-label="咨询会话类型">
          <button
            className={`v2-segment-button ${activeTab === 'sent' ? 'is-active' : ''}`}
            type="button"
            onClick={() => onTabChange('sent')}
          >
            我发起的
          </button>
          <button
            className={`v2-segment-button ${activeTab === 'received' ? 'is-active' : ''}`}
            type="button"
            onClick={() => onTabChange('received')}
          >
            我收到的
          </button>
        </div>
      </div>

      <div className="v2-check-list">
        {sessions.map((item) => (
          <button
            className={`v2-check-row v2-check-row--selectable ${String(selectedId || '') === String(item.id) ? 'is-active' : ''}`}
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            <strong>{item.subject || '未命名咨询'}</strong>
            <span>{item.mentorName || item.studentName || '会话对象待补充'}</span>
            <span>{item.unreadCount ? `未读 ${item.unreadCount}` : '已同步会话状态'}</span>
          </button>
        ))}
        {!sessions.length ? <p>当前分类下还没有咨询会话。</p> : null}
      </div>
    </section>
  )
}
