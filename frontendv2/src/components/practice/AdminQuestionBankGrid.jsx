import { Link } from 'react-router-dom'

export default function AdminQuestionBankGrid({
  banks = [],
  page = 0,
  totalPages = 0,
  onPageChange,
  onEdit,
  onToggle,
  onDelete,
}) {
  return (
    <section className="v2-article-card v2-practice-card">
      {banks.length ? (
        <div className="v2-practice-admin-grid">
          {banks.map((bank) => (
            <article className="v2-preview-panel" key={bank.id}>
              <div className="v2-preview-panel__head">
                <strong>{bank.name}</strong>
                <span className="v2-inline-link">{bank.active !== false ? '启用中' : '已停用'}</span>
              </div>
              <p>
                {bank.target || '通用'}
                {' / '}
                {bank.subject || '未分类科目'}
                {' / '}
                {bank.difficulty || 'middle'}
              </p>
              <div className="v2-summary-stack">
                <article className="v2-summary-mini">
                  <strong>{bank.questionCount || 0}</strong>
                  <span>题目</span>
                </article>
                <article className="v2-summary-mini">
                  <strong>{bank.chapterCount || 0}</strong>
                  <span>章节</span>
                </article>
                <article className="v2-summary-mini">
                  <strong>{bank.active !== false ? '在线' : '停用'}</strong>
                  <span>状态</span>
                </article>
              </div>
              <div className="v2-inline-actions">
                <Link className="v2-primary-link" to={`/admin/question-banks/${bank.id}`}>进入工作区</Link>
                <button className="v2-secondary-link" type="button" onClick={() => onEdit(bank)}>编辑</button>
                <button className="v2-secondary-link" type="button" onClick={() => onToggle(bank)}>
                  {bank.active !== false ? '停用' : '启用'}
                </button>
                <button className="v2-ghost-link v2-ghost-link--danger" type="button" onClick={() => onDelete(bank.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="v2-empty-card">当前还没有题库。</div>
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
