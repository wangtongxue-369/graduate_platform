export default function Pagination({ page, total, totalItems, onChange }) {
  if (total <= 1) return null
  return (
    <div className="pagination">
      <span className="pagination-count">共 {totalItems} 条 / 第 {page}/{total} 页</span>
      <div className="pagination-actions">
        <button className="btn ghost small" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</button>
        <button className="btn ghost small" type="button" disabled={page >= total} onClick={() => onChange(page + 1)}>下一页</button>
      </div>
    </div>
  )
}
