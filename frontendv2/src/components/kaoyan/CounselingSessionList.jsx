import { formatDateTimeLabel } from '@/lib/stationData.js'

function getSessionCounterpart(item, currentUserId, activeTab) {
  const currentId = String(currentUserId || '')
  const mentorId = String(item.mentorId || '')
  const studentId = String(item.studentId || '')

  if (currentId && currentId === mentorId) {
    return item.studentName || '咨询同学'
  }

  if (currentId && currentId === studentId) {
    return item.mentorName || '学长学姐'
  }

  return activeTab === 'sent'
    ? (item.mentorName || '学长学姐')
    : (item.studentName || '咨询同学')
}

export default function CounselingSessionList({
  activeTab,
  currentUserId,
  loading,
  page,
  sessions,
  showEmptyState,
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
      <div className="v2-counseling-session-card__head">
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

      <div className="v2-counseling-session-list" aria-label="咨询历史会话列表">
        {sessions.map((item) => {
          const counterpart = getSessionCounterpart(item, currentUserId, activeTab)
          const selected = String(selectedId || '') === String(item.id)
          return (
            <button
              className={`v2-counseling-session-item ${selected ? 'is-active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => onSelect(String(item.id))}
            >
              <div className="v2-counseling-session-item__head">
                <strong>{counterpart}</strong>
                {item.unreadCount ? <span className="v2-counseling-session-item__badge">{item.unreadCount}</span> : null}
              </div>
              <p className="v2-counseling-session-item__subject">{item.subject || '未命名咨询'}</p>
              <div className="v2-counseling-session-item__meta">
                <span>{item.unreadCount ? `未读 ${item.unreadCount}` : '已读完当前会话'}</span>
                <span>{formatDateTimeLabel(item.createdAt)}</span>
              </div>
            </button>
          )
        })}
        {showEmptyState ? (
          <article className="v2-counseling-empty-state">
            <strong>还没有咨询会话</strong>
            <p>先回到 1v1 咨询大厅发起一条咨询，这里会按会话持续累积追问记录。</p>
          </article>
        ) : null}
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
