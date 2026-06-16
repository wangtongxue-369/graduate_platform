import { isSubjectiveQuestionType } from '@/lib/practice/normalizers.js'

function getOptionKey(index) {
  return String.fromCharCode(65 + index)
}

// 兜底：若上层未走 normalizer 直传 [{key,value}] 这类对象选项，避免直接渲染对象造成白屏。
function renderOptionText(option) {
  if (option == null) return ''
  if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
    return String(option)
  }
  if (typeof option === 'object') {
    const key = option.key ?? option.label ?? option.optionKey ?? option.code
    const value = option.value ?? option.text ?? option.content ?? option.optionValue ?? option.label
    if (key != null && value != null && key !== value) return `${key}.${value}`
    if (value != null) return String(value)
    if (key != null) return String(key)
  }
  return ''
}

export default function PracticeSessionQuestionCard({
  question,
  value,
  disabled = false,
  onAnswer,
  isFirst = false,
  isLast = false,
  onPrev,
  onNext,
  onSubmit,
}) {
  if (!question) return null

  function handleOptionClick(optionKey) {
    onAnswer?.(optionKey)
    // 选择选项后自动跳转到下一题（最后一题不自动跳转，等用户手动点"提交"）
    if (!isLast) {
      onNext?.()
    }
  }

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
                onClick={() => handleOptionClick(optionKey)}
                disabled={disabled}
              >
                <span>{optionKey}</span>
                <strong>{renderOptionText(option)}</strong>
              </button>
            )
          })}
        </div>
      )}

      <div className="v2-inline-actions v2-practice-nav-actions">
        {!isFirst ? (
          <button className="v2-secondary-link" type="button" onClick={onPrev} disabled={disabled}>
            上一题
          </button>
        ) : null}
        {!isLast ? (
          <button className="v2-primary-link" type="button" onClick={onNext} disabled={disabled}>
            下一题
          </button>
        ) : (
          <button className="v2-primary-link" type="button" onClick={onSubmit} disabled={disabled}>
            提交练习
          </button>
        )}
      </div>
    </section>
  )
}
