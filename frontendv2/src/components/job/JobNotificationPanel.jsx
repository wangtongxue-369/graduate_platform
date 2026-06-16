import { Link } from 'react-router-dom'

export default function JobNotificationPanel({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onDelete,
}) {
  return (
    <section className="v2-side-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">提醒收件箱</p>
        </div>
        <span className="v2-note-text">未读 {unreadCount}</span>
      </div>

      <div className="v2-check-list" aria-label="就业提醒列表">
        {notifications.map((item) => (
          <article className="v2-check-row" key={item.id}>
            <strong>{item.title || '就业提醒'}</strong>
            <span>{item.content || '请前往对应工作区继续处理。'}</span>
            <span>{item.readFlag ? '已读' : '未读'}</span>
            <div className="v2-inline-actions">
              {item.targetUrl ? (
                <Link className="v2-secondary-link" to={item.targetUrl}>查看</Link>
              ) : null}
              {!item.readFlag ? (
                <button className="v2-secondary-link" type="button" onClick={() => onMarkRead(item.id)}>标记已读</button>
              ) : null}
              <button className="v2-secondary-link" type="button" onClick={() => onDelete(item.id)}>删除</button>
            </div>
          </article>
        ))}
        {!notifications.length ? <p>当前没有就业提醒。</p> : null}
      </div>
    </section>
  )
}
