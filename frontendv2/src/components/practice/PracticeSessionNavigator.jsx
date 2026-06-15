export default function PracticeSessionNavigator({
  questions = [],
  answers = {},
  currentIndex = 0,
  onSelect,
}) {
  return (
    <section className="v2-side-card v2-practice-session-nav">
      <p className="v2-kicker">答题进度</p>
      <div className="v2-practice-nav-grid">
        {questions.map((question, index) => (
          <button
            key={question.id || index}
            type="button"
            className={`v2-practice-nav-btn ${index === currentIndex ? 'is-active' : ''} ${answers[question.id] ? 'is-answered' : ''}`}
            onClick={() => onSelect?.(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  )
}
