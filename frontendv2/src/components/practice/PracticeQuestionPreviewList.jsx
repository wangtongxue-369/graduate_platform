export default function PracticeQuestionPreviewList({
  title = '题目预览',
  questions = [],
  emptyText = '暂无可预览题目。',
}) {
  return (
    <section className="v2-article-card v2-practice-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">{title}</p>
          <h3>公开预览只展示题目结构，不在这里直接作答</h3>
        </div>
      </div>

      {questions.length ? (
        <div className="v2-check-list">
          {questions.map((question, index) => (
            <article className="v2-check-row" key={question.id || index}>
              <strong>{question.stem || `题目 ${index + 1}`}</strong>
              <span>
                {question.chapter || '未分章节'}
                {' / '}
                {question.questionType || 'single'}
                {' / '}
                {question.difficulty || 'middle'}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="v2-empty-card">{emptyText}</div>
      )}
    </section>
  )
}
