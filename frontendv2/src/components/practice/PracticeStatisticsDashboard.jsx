export default function PracticeStatisticsDashboard({
  granularity,
  onGranularityChange,
  stats,
}) {
  const summaryItems = [
    { label: '练习次数', value: stats?.practiceCount ?? 0 },
    { label: '平均正确率', value: `${stats?.averageAccuracy ?? 0}%` },
    { label: '累计时长', value: `${Math.round((stats?.totalDurationSeconds ?? 0) / 60)} 分钟` },
  ]

  return (
    <section className="v2-article-card v2-practice-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">趋势面板</p>
          <h3>按时间粒度看训练次数、正确率和薄弱知识点</h3>
        </div>
      </div>

      <div className="v2-segment-group" role="group" aria-label="统计粒度">
        {[
          { value: 'day', label: '按日' },
          { value: 'week', label: '按周' },
          { value: 'month', label: '按月' },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            className={`v2-segment-button ${granularity === item.value ? 'is-active' : ''}`}
            onClick={() => onGranularityChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="v2-practice-stats-grid">
        {summaryItems.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="v2-split-board">
        <section className="v2-article-card">
          <p className="v2-kicker">趋势样本</p>
          <div className="v2-check-list">
            {(stats?.trend || []).map((item) => (
              <article className="v2-check-row" key={item.period}>
                <strong>{item.period}</strong>
                <span>
                  练习 {item.practiceCount ?? 0} 次 / 正确率 {item.averageAccuracy ?? 0}%
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="v2-article-card">
          <p className="v2-kicker">高频错点</p>
          <div className="v2-check-list">
            {(stats?.frequentWrongKnowledgePoints || []).map((item) => (
              <article className="v2-check-row" key={item.knowledgePoint}>
                <strong>{item.knowledgePoint}</strong>
                <span>累计错题 {item.wrongCount ?? 0} 次</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
