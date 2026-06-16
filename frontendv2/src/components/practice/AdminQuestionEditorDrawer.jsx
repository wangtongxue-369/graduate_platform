import { useEffect, useState } from 'react'

const emptyForm = {
  stem: '',
  chapter: '',
  questionType: 'single',
  difficulty: 'middle',
  optionsText: '',
  answer: '',
  analysis: '',
  year: '',
}

export default function AdminQuestionEditorDrawer({ question, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!question) {
      setForm(emptyForm)
      return
    }

    setForm({
      stem: question.stem || '',
      chapter: question.chapter || '',
      questionType: question.questionType || 'single',
      difficulty: question.difficulty || 'middle',
      optionsText: Array.isArray(question.options)
        ? question.options.join('\n')
        : '',
      answer: question.answer || '',
      analysis: question.analysis || '',
      year: question.year || '',
    })
  }, [question])

  if (!question) return null

  function handleSubmit(event) {
    event.preventDefault()

    const options = form.optionsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    onSave({
      stem: form.stem,
      chapter: form.chapter,
      questionType: form.questionType,
      difficulty: form.difficulty,
      optionsJson: JSON.stringify(options),
      answer: form.answer,
      analysis: form.analysis,
      year: form.year ? Number(form.year) : undefined,
    }, question)
  }

  return (
    <section className="v2-side-card v2-practice-drawer">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">题目编辑</p>
          <h3>{question.id ? `编辑题目 #${question.id}` : '新建题目'}</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
      </div>

      <form className="v2-filter-form" onSubmit={handleSubmit}>
        <label className="v2-field">
          <span>题干</span>
          <textarea value={form.stem} onChange={(event) => setForm((current) => ({ ...current, stem: event.target.value }))} />
        </label>
        <label className="v2-field">
          <span>章节</span>
          <input value={form.chapter} onChange={(event) => setForm((current) => ({ ...current, chapter: event.target.value }))} />
        </label>
        <label className="v2-field">
          <span>题型</span>
          <select value={form.questionType} onChange={(event) => setForm((current) => ({ ...current, questionType: event.target.value }))}>
            <option value="single">单选题</option>
            <option value="multiple">多选题</option>
            <option value="judge">判断题</option>
            <option value="essay">主观题</option>
          </select>
        </label>
        <label className="v2-field">
          <span>难度</span>
          <select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}>
            <option value="easy">基础</option>
            <option value="middle">进阶</option>
            <option value="hard">冲刺</option>
          </select>
        </label>
        <label className="v2-field">
          <span>选项（每行一个）</span>
          <textarea value={form.optionsText} onChange={(event) => setForm((current) => ({ ...current, optionsText: event.target.value }))} />
        </label>
        <label className="v2-field">
          <span>答案</span>
          <input value={form.answer} onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))} />
        </label>
        <label className="v2-field">
          <span>解析</span>
          <textarea value={form.analysis} onChange={(event) => setForm((current) => ({ ...current, analysis: event.target.value }))} />
        </label>
        <label className="v2-field">
          <span>年份</span>
          <input value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">保存题目</button>
        </div>
      </form>
    </section>
  )
}
