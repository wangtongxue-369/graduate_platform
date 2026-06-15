import { useState } from 'react'

export default function WrongQuestionWorkbench({ wrongs, onRetry, onPageChange }) {
  const [selectedIds, setSelectedIds] = useState([])

  function toggleQuestion(id) {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ))
  }

  async function handleRetry() {
    if (!selectedIds.length) return
    await onRetry(selectedIds)
  }

  return (
    <section className="v2-article-card v2-practice-workbench">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">错题池</p>
          <h3>把高频错题拎出来，单独进入回练会话</h3>
        </div>
        <button className="v2-primary-link" type="button" onClick={handleRetry} disabled={!selectedIds.length}>
          重练选中
        </button>
      </div>

      {wrongs.items.length ? (
        <div className="v2-check-list">
          {wrongs.items.map((item) => {
            const checked = selectedIds.includes(item.id)

            return (
              <button
                key={item.id}
                type="button"
                className={`v2-check-row v2-check-row--selectable ${checked ? 'is-active' : ''}`}
                onClick={() => toggleQuestion(item.id)}
              >
                <strong>{item.stem}</strong>
                <span>
                  {item.subject || '未分类'}
                  {' / '}
                  {item.chapter || '未分章节'}
                  {' / 已错 '}
                  {item.wrongCount || 0} 次
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="v2-empty-card">当前筛选条件下暂无错题。</div>
      )}

      {wrongs.totalPages > 1 ? (
        <div className="v2-inline-actions">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={wrongs.page <= 0}
            onClick={() => onPageChange(wrongs.page - 1)}
          >
            上一页
          </button>
          <span className="v2-note-text">{wrongs.page + 1} / {wrongs.totalPages}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={wrongs.page >= wrongs.totalPages - 1}
            onClick={() => onPageChange(wrongs.page + 1)}
          >
            下一页
          </button>
        </div>
      ) : null}
    </section>
  )
}
