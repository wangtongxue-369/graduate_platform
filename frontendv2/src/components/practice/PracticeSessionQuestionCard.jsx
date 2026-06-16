import { isSubjectiveQuestionType } from '@/lib/practice/normalizers.js'

function getOptionKey(index) {
  return String.fromCharCode(65 + index)
}

export default function PracticeSessionQuestionCard({
  question,
  value,
  disabled = false,
  onAnswer,
}) {
  if (!question) return null

  return (
    <section className="v2-article-card v2-practice-session">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">{question.questionType || 'single'}</p>
          <h3>{question.stem || '未命名题目'}</h3>
        </div>
      </div>

      {isSubjectiveQuestionType(question.questionType) ? (
        <label className="v2-field">
          <span>你的答案</span>
          <textarea
            className="v2-practice-textarea"
            value={value || ''}
            onChange={(event) => onAnswer?.(event.target.value)}
            disabled={disabled}
          />
        </label>
      ) : (
        <div className="v2-practice-option-list">
          {(question.options || []).map((option, index) => {
            const optionKey = getOptionKey(index)

            return (
              <button
                key={optionKey}
                type="button"
                className={`v2-practice-option ${value === optionKey ? 'is-active' : ''}`}
                onClick={() => onAnswer?.(optionKey)}
                disabled={disabled}
              >
                <span>{optionKey}</span>
                <strong>{option}</strong>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
