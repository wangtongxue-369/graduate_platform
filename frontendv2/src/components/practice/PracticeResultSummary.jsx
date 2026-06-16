export default function PracticeResultSummary({
  result,
  wrongQuestions = [],
  actions,
}) {
  if (!result) return null

  const summaryItems = [
    { label: '总题数', value: result.totalCount ?? 0 },
    { label: '正确数', value: result.correctCount ?? 0 },
    { label: '错题数', value: result.wrongCount ?? 0 },
    { label: '得分', value: result.score ?? 0 },
    { label: '正确率', value: `${result.accuracy ?? 0}%` },
  ]

  return (
    <section className="v2-article-card v2-practice-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">练习结果</p>
          <h3>本次练习已经完成</h3>
        </div>
        {actions}
      </div>

      <div className="v2-practice-stats-grid">
        {summaryItems.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      {wrongQuestions.length ? (
        <div className="v2-check-list">
          {wrongQuestions.map((item) => (
            <article className="v2-check-row" key={item.id}>
              <strong>{item.stem}</strong>
              <span>正确答案：{item.answer || '-'}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
