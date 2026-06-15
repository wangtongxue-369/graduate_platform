import { formatDateTimeLabel } from '@/lib/stationData.js'

export default function CounselingSessionList({
  activeTab,
  loading,
  page,
  sessions,
  selectedId,
  totalElements,
  totalPages,
  onNextPage,
  onPreviousPage,
  onSelect,
  onTabChange,
}) {
  return (
    <section className="v2-article-card v2-counseling-session-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">咨询会话</p>
          <h3>{activeTab === 'sent' ? '我发起的咨询' : '我收到的咨询'}</h3>
        </div>
        <span className="v2-plan-status-pill">{`共 ${totalElements} 条`}</span>
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

      <div className="v2-check-list">
        {sessions.map((item) => (
          <button
            className={`v2-check-row v2-check-row--selectable ${String(selectedId || '') === String(item.id) ? 'is-active' : ''}`}
            key={item.id}
            type="button"
            onClick={() => onSelect(String(item.id))}
          >
            <strong>{item.subject || '未命名咨询'}</strong>
            <span>{item.mentorName || item.studentName || '会话对象待补充'}</span>
            <span>{item.unreadCount ? `未读 ${item.unreadCount}` : '已读完当前会话'}</span>
            <span>{formatDateTimeLabel(item.createdAt)}</span>
          </button>
        ))}
        {!loading && !sessions.length ? <p>当前分组下还没有咨询会话。</p> : null}
      </div>

      <div className="v2-pagination-row" aria-label="咨询消息分页">
        <button
          className="v2-secondary-link"
          type="button"
          disabled={loading || page <= 0}
          onClick={onPreviousPage}
        >
          上一页
        </button>
        <span className="v2-pagination-note">{`第 ${Math.min(page + 1, totalPages)} / ${totalPages} 页`}</span>
        <button
          className="v2-secondary-link"
          type="button"
          disabled={loading || page >= totalPages - 1}
          onClick={onNextPage}
        >
          下一页
        </button>
      </div>
    </section>
  )
}
