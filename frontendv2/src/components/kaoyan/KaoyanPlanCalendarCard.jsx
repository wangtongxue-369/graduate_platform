const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

export default function KaoyanPlanCalendarCard({
  monthLabel,
  cells,
  selectedDate,
  statusByDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}) {
  return (
    <section className="v2-side-card v2-plan-calendar-card" aria-label="打卡月历">
      <div className="v2-plan-calendar-head">
        <button className="v2-segment-button" type="button" onClick={onPrevMonth}>上月</button>
        <strong>{monthLabel}</strong>
        <button className="v2-segment-button" type="button" onClick={onNextMonth}>下月</button>
      </div>

      <div className="v2-plan-calendar-weekdays">
        {weekdayLabels.map((item) => <span key={item}>{item}</span>)}
      </div>

      <div className="v2-plan-calendar-grid">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div className="v2-plan-calendar-gap" key={`gap-${index}`} />
          }

          const status = statusByDate[cell.key] || 'future'
          const selected = selectedDate === cell.key

          return (
            <button
              aria-label={`选择 ${cell.key}`}
              className={`v2-plan-calendar-day is-${status} ${selected ? 'is-selected' : ''}`}
              key={cell.key}
              type="button"
              onClick={() => onSelectDate(cell.key)}
            >
              {cell.day}
            </button>
          )
        })}
      </div>

      <div className="v2-plan-legend">
        <span className="is-today">今日</span>
        <span className="is-checked">已打卡</span>
        <span className="is-missed">未打卡</span>
        <span className="is-out">超出范围</span>
      </div>
    </section>
  )
}
