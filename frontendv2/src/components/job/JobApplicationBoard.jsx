import { formatDateTimeLabel } from '@/lib/stationData.js'

const laneToneMap = {
  todo: '待启动',
  active: '推进中',
  interview: '面试中',
  result: '已出结果',
}

export default function JobApplicationBoard({ groups = [], onEdit, onDelete }) {
  return (
    <section className="v2-check-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">推进泳道</p>
          <h3>把每条记录挂到明确的推进阶段</h3>
        </div>
      </div>

      <div className="v2-split-board" aria-label="投递泳道">
        {groups.map((group) => (
          <section className="v2-check-card" key={group.key}>
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">{laneToneMap[group.key] || group.key}</p>
                <h3>{group.title}</h3>
              </div>
              <span className="v2-note-text">{group.items.length}</span>
            </div>
            <p>{group.description}</p>

            <div className="v2-check-list">
              {group.items.map((item) => (
                <article className="v2-check-row" key={item.id}>
                  <strong>{item.companyName} / {item.jobTitle}</strong>
                  <span>{item.city || '待补充城市'} / {item.industry || '待补充行业'}</span>
                  <span>下一步：{item.nextStepAt ? formatDateTimeLabel(item.nextStepAt) : '待安排'}</span>
                  <span>{item.notes || '暂未补充备注'}</span>
                  <div className="v2-inline-actions">
                    <button className="v2-secondary-link" type="button" onClick={() => onEdit(item)}>编辑</button>
                    <button className="v2-secondary-link" type="button" onClick={() => onDelete(item)}>删除</button>
                  </div>
                </article>
              ))}
              {!group.items.length ? <p>当前泳道还没有记录。</p> : null}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
