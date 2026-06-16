const statusLabelMap = {
  checked: '已打卡',
  today: '今日',
  missed: '未打卡',
  future: '未来',
  out: '超出范围',
}

export default function KaoyanPlanDayPanel({
  selectedDate,
  selectedStatus,
  dayCheckIns,
  canCheckIn,
  canDelete,
  deleting,
  onOpenCheckIn,
  onDeleteCheckIn,
}) {
  if (!selectedDate || selectedStatus === 'out') {
    return null
  }

  return (
    <section className="v2-side-card v2-plan-day-panel" aria-label="当日记录">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">当日记录</p>
          <h3>{selectedDate}</h3>
        </div>
        <span className={`v2-plan-status-pill is-${selectedStatus}`}>
          {statusLabelMap[selectedStatus] || selectedStatus}
        </span>
      </div>

      {canCheckIn ? (
        <div className="v2-inline-actions">
          <button className="v2-segment-button is-active" type="button" onClick={onOpenCheckIn}>打卡</button>
        </div>
      ) : null}

      {!dayCheckIns.length ? (
        <div className="v2-status-note">暂无打卡记录</div>
      ) : (
        <div className="v2-check-list">
          {dayCheckIns.map((item) => (
            <div className="v2-check-row v2-check-row--action" key={item.id}>
              <div>
                <strong>{Number(item.durationHours || 0).toFixed(1)} 小时</strong>
                <span>{item.remark || '暂无备注'}</span>
              </div>
              <button
                className="v2-segment-button"
                disabled={!canDelete || deleting}
                type="button"
                onClick={() => onDeleteCheckIn(item.id)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
