function formatDuration(seconds = 0) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function PracticeHistoryTable({ history, onPageChange }) {
  return (
    <section className="v2-article-card v2-practice-table">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">提交记录</p>
          <h3>每次练习提交都单独沉淀，方便回看节奏</h3>
        </div>
      </div>

      {history.items.length ? (
        <div className="v2-check-list">
          {history.items.map((item) => (
            <article className="v2-check-row" key={item.id}>
              <strong>{item.bankName || `题库 ${item.bankId}`}</strong>
              <span>
                {item.mode || 'chapter'}
                {' / 得分 '}
                {item.score ?? '-'}
                {' / 正确率 '}
                {item.accuracy ?? 0}%
              </span>
              <span>
                {String(item.submittedAt || '').slice(0, 16).replace('T', ' ')}
                {' / '}
                {formatDuration(item.durationSeconds || 0)}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="v2-empty-card">当前还没有练习历史记录。</div>
      )}

      {history.totalPages > 1 ? (
        <div className="v2-inline-actions">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={history.page <= 1}
            onClick={() => onPageChange(history.page - 1)}
          >
            上一页
          </button>
          <span className="v2-note-text">{history.page} / {history.totalPages}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={history.page >= history.totalPages}
            onClick={() => onPageChange(history.page + 1)}
          >
            下一页
          </button>
        </div>
      ) : null}
    </section>
  )
}
