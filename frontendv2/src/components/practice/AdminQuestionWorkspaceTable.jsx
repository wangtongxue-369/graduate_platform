export default function AdminQuestionWorkspaceTable({
  questions = [],
  selectedIds = [],
  onToggleSelected,
  onCreate,
  onEdit,
  onSnapshots,
  onToggleStatus,
  onDelete,
  page = 0,
  totalPages = 0,
  onPageChange,
}) {
  return (
    <section className="v2-article-card v2-practice-workbench">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">题目列表</p>
          <h3>在单题库上下文中处理题目编辑、状态和快照</h3>
        </div>
        <button className="v2-primary-link" type="button" onClick={onCreate}>新建题目</button>
      </div>

      {questions.length ? (
        <div className="v2-check-list">
          {questions.map((question) => (
            <article className="v2-check-row" key={question.id}>
              <strong>{question.stem}</strong>
              <span>
                {question.chapter || '未分章节'}
                {' / '}
                {question.questionType || 'single'}
                {' / '}
                {question.difficulty || 'middle'}
              </span>
              <div className="v2-inline-actions">
                <button
                  className={`v2-secondary-link ${selectedIds.includes(question.id) ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => onToggleSelected(question.id)}
                >
                  {selectedIds.includes(question.id) ? '已选中' : '选择'}
                </button>
                <button className="v2-secondary-link" type="button" onClick={() => onEdit(question)}>编辑</button>
                <button className="v2-secondary-link" type="button" onClick={() => onSnapshots(question.id)}>快照</button>
                <button className="v2-secondary-link" type="button" onClick={() => onToggleStatus(question)}>
                  {question.active !== false ? '停用' : '启用'}
                </button>
                <button className="v2-ghost-link v2-ghost-link--danger" type="button" onClick={() => onDelete(question.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="v2-empty-card">这个题库下还没有题目。</div>
      )}

      {totalPages > 1 ? (
        <div className="v2-inline-actions">
          <button className="v2-secondary-link" type="button" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>上一页</button>
          <span className="v2-note-text">{page + 1} / {totalPages}</span>
          <button className="v2-secondary-link" type="button" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>下一页</button>
        </div>
      ) : null}
    </section>
  )
}
