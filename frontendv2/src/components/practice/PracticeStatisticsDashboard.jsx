import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'

const granularityOptions = [
  { value: 'day', label: '按日' },
  { value: 'week', label: '按周' },
  { value: 'month', label: '按月' },
]

const trendModes = [
  { value: 'accuracy', label: '看正确率' },
  { value: 'duration', label: '看时长' },
]

function formatDuration(seconds) {
  if (!seconds) return '0 分钟'
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  return `${hours} 小时 ${minutes % 60} 分钟`
}

function formatPeriod(period, granularity) {
  if (!period) return '-'
  if (granularity === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(period)) return period.slice(5)
  if (granularity === 'month') return period
  if (granularity === 'week' && /^(\d{4})-W(\d{2})$/.test(period)) {
    const [, year, week] = period.match(/^(\d{4})-W(\d{2})$/)
    return `${year} 第 ${Number(week)} 周`
  }
  return period
}

function buildInsight(stats, trendMode) {
  const trend = stats?.trend || []

  if (trend.length < 2) {
    return trendMode === 'accuracy'
      ? '当前统计样本还不多，继续完成练习后会出现更稳定的正确率走势。'
      : '当前统计样本还不多，继续完成练习后会出现更稳定的投入时长走势。'
  }

  const latest = trend[trend.length - 1]
  const previous = trend[trend.length - 2]

  if (trendMode === 'duration') {
    const delta = (latest.totalDurationSeconds ?? 0) - (previous.totalDurationSeconds ?? 0)
    return delta >= 0
      ? '最近一个周期投入时长上升，可以结合错点榜检查投入是否转化为命中率。'
      : '最近一个周期投入时长下降，若正确率也同步回落，建议补一轮针对性练习。'
  }

  const latestAccuracy = latest.averageAccuracy
  const previousAccuracy = previous.averageAccuracy

  if (latestAccuracy == null || previousAccuracy == null) {
    return '部分周期没有可统计的客观题正确率，图中会保留断点而不是补成 0%。'
  }

  return latestAccuracy >= previousAccuracy
    ? '最近一个周期正确率较上一周期改善，可以继续巩固当前节奏。'
    : '最近一个周期正确率有所回落，建议优先处理右侧高频错点。'
}

export default function PracticeStatisticsDashboard({
  granularity,
  onGranularityChange,
  stats,
}) {
  const [trendMode, setTrendMode] = useState('accuracy')
  const [showDetails, setShowDetails] = useState(false)
  const granularityLabel = granularityOptions.find((item) => item.value === granularity)?.label ?? '按日'

  const summaryItems = [
    {
      signal: '频率',
      label: '练习次数',
      value: stats?.practiceCount ?? 0,
      hint: '已交卷练习总次数',
    },
    {
      signal: '命中',
      label: '平均正确率',
      value: stats?.averageAccuracy == null ? '-' : `${stats.averageAccuracy}%`,
      hint: '仅统计可自动判分题目',
    },
    {
      signal: '投入',
      label: '累计时长',
      value: formatDuration(stats?.totalDurationSeconds ?? 0),
      hint: '所有已交卷练习累计',
    },
  ]

  const trendData = useMemo(() => {
    return (stats?.trend || []).map((item) => ({
      ...item,
      label: formatPeriod(item.period, granularity),
      accuracy: item.averageAccuracy,
      durationMinutes: Math.round((item.totalDurationSeconds ?? 0) / 60),
    }))
  }, [granularity, stats])

  const wrongPointMax = Math.max(
    ...(stats?.frequentWrongKnowledgePoints || []).map((item) => item.wrongCount ?? 0),
    0,
  )
  const insight = buildInsight(stats, trendMode)
  const periodCountLabel = trendData.length ? `${trendData.length} 个统计周期` : '等待更多周期样本'

  return (
    <section className="v2-article-card v2-practice-dashboard-shell">
      <header className="v2-practice-dashboard-hero">
        <div className="v2-practice-dashboard-overview">
          <div className="v2-practice-dashboard-overview__copy">
            <p className="v2-kicker">训练信号带</p>
            <h3>复盘总览</h3>
            <p className="v2-practice-dashboard-lead">
              看清练习频率、命中率、投入时长和高频错点，把日常刷题真正转成可复盘的训练轨迹。
            </p>
          </div>

          <div className="v2-practice-dashboard-meta">
            <span>仅统计已交卷练习</span>
            <span>{granularityLabel}视角</span>
            <span>{periodCountLabel}</span>
          </div>
        </div>

        <aside className="v2-practice-dashboard-control-dock">
          <div className="v2-practice-dashboard-control-dock__head">
            <span className="v2-statistics-badge">基于已交卷练习</span>
            <strong>切换观察尺度</strong>
          </div>

          <div className="v2-segment-group v2-practice-dashboard-control-dock__segments" role="group" aria-label="统计粒度">
            {granularityOptions.map((item) => (
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

          <p className="v2-practice-dashboard-control-dock__hint">
            按日看练习节奏，按周看波动，按月看长期投入。下方趋势图和明细表会同步切换。
          </p>
        </aside>
      </header>

      <section className="v2-practice-signal-strip" aria-label="复盘信号条">
        <div className="v2-practice-signal-strip__head">
          <p className="v2-kicker">训练信号带</p>
          <h4>三项核心读数</h4>
        </div>

        <div className="v2-practice-stats-grid v2-practice-stats-band">
          {summaryItems.map((item) => (
            <article className="v2-summary-card v2-summary-card--signal" key={item.label}>
              <em>{item.signal}</em>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="v2-practice-dashboard-body">
        <section className="v2-practice-chart-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">主趋势区</p>
              <h4>频率与表现走势</h4>
            </div>
            <div className="v2-segment-group" role="group" aria-label="趋势模式">
              {trendModes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`v2-segment-button ${trendMode === item.value ? 'is-active' : ''}`}
                  onClick={() => setTrendMode(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <p className="v2-practice-insight-copy">{insight}</p>

          {trendData.length ? (
            <div className="v2-practice-chart-wrap">
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(160, 147, 120, 0.22)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--v2-muted)' }} />
                  <YAxis yAxisId="count" tick={{ fontSize: 12, fill: 'var(--v2-muted)' }} />
                  <YAxis
                    yAxisId="metric"
                    orientation="right"
                    tick={{ fontSize: 12, fill: 'var(--v2-muted)' }}
                    domain={trendMode === 'accuracy' ? [0, 100] : ['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'accuracy') return [value == null ? '-' : `${value}%`, '平均正确率']
                      if (name === 'durationMinutes') return [`${value} 分钟`, '累计时长']
                      return [value, '练习次数']
                    }}
                  />
                  <Legend formatter={(value) => {
                    if (value === 'practiceCount') return '练习次数'
                    if (value === 'accuracy') return '平均正确率'
                    if (value === 'durationMinutes') return '累计时长'
                    return value
                  }}
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="practiceCount"
                    stroke="var(--v2-practice-count-line)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  {trendMode === 'accuracy' ? (
                    <Line
                      yAxisId="metric"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="var(--v2-practice-accuracy-line)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls={false}
                    />
                  ) : (
                    <Line
                      yAxisId="metric"
                      type="monotone"
                      dataKey="durationMinutes"
                      stroke="var(--v2-practice-duration-line)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="v2-practice-subempty">当前粒度下暂无趋势样本。</div>
          )}
        </section>

        <aside className="v2-practice-insight-card">
          <div className="v2-section-head">
            <div>
              <p className="v2-kicker">错点行动区</p>
              <h4>高频错点 Top 10</h4>
            </div>
          </div>

          {(stats?.frequentWrongKnowledgePoints || []).length ? (
            <div className="v2-practice-wrong-rank">
              {stats.frequentWrongKnowledgePoints.map((item) => {
                const width = wrongPointMax
                  ? `${Math.max(12, Math.round(((item.wrongCount ?? 0) / wrongPointMax) * 100))}%`
                  : '12%'

                return (
                  <article className="v2-practice-wrong-rank-item" key={item.knowledgePoint}>
                    <div className="v2-practice-wrong-rank-head">
                      <strong>{item.knowledgePoint}</strong>
                      <span>{item.wrongCount ?? 0} 次</span>
                    </div>
                    <div className="v2-practice-wrong-rank-bar">
                      <span style={{ width }} />
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="v2-practice-subempty">暂未形成高频错点。</div>
          )}

          <div className="v2-inline-actions v2-practice-dashboard-actions">
            <Link className="v2-primary-button" to="/practice/wrong-questions">去错题本</Link>
            <Link className="v2-secondary-link" to="/practice/history">查看练习历史</Link>
          </div>
        </aside>
      </div>

      <div className="v2-practice-detail-panel">
        <div className="v2-practice-detail-head">
          <div>
            <p className="v2-kicker">周期明细</p>
            <h4>分段记录表</h4>
          </div>
          <button
            type="button"
            className="v2-secondary-link v2-detail-toggle"
            onClick={() => setShowDetails((value) => !value)}
          >
            {showDetails ? '收起明细' : '查看明细'}
          </button>
        </div>

        {showDetails ? (
          <div className="v2-table-scroll">
            <table className="v2-practice-detail-table">
              <thead>
                <tr>
                  <th>周期</th>
                  <th>练习次数</th>
                  <th>平均正确率</th>
                  <th>累计时长</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((item) => (
                  <tr key={item.period}>
                    <td>{item.period}</td>
                    <td>{item.practiceCount ?? 0}</td>
                    <td>{item.averageAccuracy == null ? '-' : `${item.averageAccuracy}%`}</td>
                    <td>{formatDuration(item.totalDurationSeconds ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}
