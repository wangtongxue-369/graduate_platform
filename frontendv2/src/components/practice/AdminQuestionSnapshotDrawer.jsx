export default function AdminQuestionSnapshotDrawer({ questionId, snapshots = [], onClose }) {
  if (!questionId) return null

  return (
    <section className="v2-side-card v2-practice-drawer">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">版本快照</p>
          <h3>题目 #{questionId} 的历史版本</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
      </div>

      {snapshots.length ? (
        <div className="v2-check-list">
          {snapshots.map((item) => (
            <article className="v2-check-row" key={item.id}>
              <strong>版本 {item.versionNo || item.id}</strong>
              <span>{item.stem}</span>
              <span>{String(item.createdAt || '').slice(0, 16).replace('T', ' ')}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="v2-empty-card">暂无快照记录。</div>
      )}
    </section>
  )
}
