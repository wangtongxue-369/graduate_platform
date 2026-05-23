import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminQuestionBankApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

export default function AdminQuestionsPage() {
  const { bankId } = useParams()
  const { user, token, isAuthed } = useAuth()
  const [questions, setQuestions] = useState([])
  const [bankName, setBankName] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editQuestion, setEditQuestion] = useState(null)
  const [form, setForm] = useState({
    stem: '', optionsJson: '', answer: '', analysis: '',
    chapter: '', questionType: '', knowledgePoint: '', difficulty: '', year: '', status: 'published',
  })
  const [error, setError] = useState('')
  const [showBatch, setShowBatch] = useState(false)
  const [batchJson, setBatchJson] = useState('')
  const [batchResult, setBatchResult] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [snapshotQuestionId, setSnapshotQuestionId] = useState(null)
  const SIZE = 20

  const loadQuestions = () => {
    adminQuestionBankApi.questions(bankId, page, SIZE, token).then((data) => {
      setQuestions(data.content)
      setTotalPages(data.totalPages)
    }).catch((e) => setError(e.message))
  }

  // Load bank info for the header
  useEffect(() => {
    adminQuestionBankApi.banks(0, 100, token).then((data) => {
      const bank = data.content.find((b) => String(b.id) === bankId)
      if (bank) setBankName(bank.name)
    }).catch(() => {})
  }, [bankId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadQuestions() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthed || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  const openCreate = () => {
    setEditQuestion(null)
    setForm({ stem: '', optionsJson: '', answer: '', analysis: '', chapter: '', questionType: '', knowledgePoint: '', difficulty: '', year: '', status: 'published' })
    setShowForm(true)
  }

  const openEdit = (q) => {
    setEditQuestion(q)
    setForm({
      stem: q.stem || '',
      optionsJson: q.optionsJson || '',
      answer: q.answer || '',
      analysis: q.analysis || '',
      chapter: q.chapter || '',
      questionType: q.questionType || '',
      knowledgePoint: q.knowledgePoint || '',
      difficulty: q.difficulty || '',
      year: q.year != null ? String(q.year) : '',
      status: q.status || 'published',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
      }
      if (editQuestion) {
        await adminQuestionBankApi.updateQuestion(editQuestion.id, payload, token)
      } else {
        await adminQuestionBankApi.createQuestion(Number(bankId), payload, token)
      }
      setShowForm(false)
      loadQuestions()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (id, stem) => {
    const preview = stem.length > 30 ? stem.substring(0, 30) + '...' : stem
    if (!window.confirm(`确定删除题目「${preview}」吗？删除后不可恢复。`)) return
    try {
      await adminQuestionBankApi.deleteQuestion(id, token)
      loadQuestions()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleBatchImport = async () => {
    setError('')
    setBatchResult(null)
    try {
      const parsed = JSON.parse(batchJson)
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || [])
      if (questions.length === 0) { setError('未解析到题目数据'); return }
      const result = await adminQuestionBankApi.batchCreateQuestions(Number(bankId), questions, token)
      setBatchResult(result)
      loadQuestions()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleViewSnapshots = async (qId) => {
    setSnapshotQuestionId(qId)
    try {
      const data = await adminQuestionBankApi.snapshots(qId, token)
      setSnapshots(data)
      setShowSnapshots(true)
    } catch (e) {
      setError(e.message)
    }
  }

  const truncate = (s, n = 60) => (s && s.length > n ? s.substring(0, n) + '...' : s)

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">管理后台 / 题库管理</p>
            <h2>题目管理{bankName ? ` — ${bankName}` : ''}</h2>
            <p className="muted">新增、修改、删除题库中的题目。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button className="btn primary" type="button" onClick={openCreate}>新建题目</button>
            <button className="btn outline" type="button" onClick={() => { setShowBatch(!showBatch); setBatchResult(null) }} style={{ marginLeft: '0.5rem' }}>批量导入</button>
            <Link className="btn outline" to="/admin/question-banks" style={{ marginLeft: '0.5rem' }}>返回题库列表</Link>
          </div>

          {showBatch && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>批量导入题目</h3>
              <p className="muted" style={{ marginBottom: '1rem' }}>粘贴 JSON 数组，每项包含 stem(answer 必填)、optionsJson、analysis、chapter、questionType、difficulty、year 等字段。</p>
              <textarea
                rows={10} value={batchJson}
                placeholder={'[\n  {"stem": "中国的首都是？", "optionsJson": "[\"A. 北京\",\"B. 上海\",\"C. 广州\",\"D. 深圳\"]", "answer": "A", "chapter": "地理", "questionType": "single", "difficulty": "easy"}\n]'}
                onChange={(e) => setBatchJson(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
              />
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn primary" type="button" onClick={handleBatchImport}>开始导入</button>
                <button className="btn outline" type="button" onClick={() => { setBatchJson(''); setBatchResult(null) }}>清空</button>
              </div>
              {batchResult && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(15,118,110,0.06)', borderRadius: '6px' }}>
                  <p>共 {batchResult.total} 条，成功 <strong>{batchResult.created}</strong> 条，失败 {batchResult.failed} 条</p>
                  {batchResult.errors && batchResult.errors.length > 0 && (
                    <ul style={{ marginTop: '0.5rem', fontSize: '13px', color: '#b91c1c' }}>
                      {batchResult.errors.map((e, i) => (
                        <li key={i}>第 {e.index} 条 (stem: {e.stem}) — {e.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{editQuestion ? '编辑题目' : '新建题目'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>题干 *</label>
                  <textarea
                    required value={form.stem} rows={3}
                    onChange={(e) => setForm({ ...form, stem: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>选项 (JSON)</label>
                  <textarea
                    value={form.optionsJson} rows={3} placeholder='["A. xxx","B. xxx","C. xxx","D. xxx"]'
                    onChange={(e) => setForm({ ...form, optionsJson: e.target.value })}
                  />
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>答案 *</label>
                    <input
                      type="text" required value={form.answer}
                      onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>题型</label>
                    <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="single">单选题</option>
                      <option value="multiple">多选题</option>
                      <option value="judge">判断题</option>
                      <option value="subjective">主观题</option>
                    </select>
                  </div>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>难度</label>
                    <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="easy">简单</option>
                      <option value="middle">中等</option>
                      <option value="hard">困难</option>
                    </select>
                  </div>
                  <div>
                    <label>年份</label>
                    <input
                      type="number" value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label>章节</label>
                  <input
                    type="text" value={form.chapter}
                    onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>知识点</label>
                  <input
                    type="text" value={form.knowledgePoint}
                    onChange={(e) => setForm({ ...form, knowledgePoint: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>解析</label>
                  <textarea
                    value={form.analysis} rows={3}
                    onChange={(e) => setForm({ ...form, analysis: e.target.value })}
                  />
                </div>
                {editQuestion && (
                  <div className="form-row">
                    <label>状态</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="published">已发布</option>
                      <option value="draft">草稿</option>
                      <option value="disabled">禁用</option>
                    </select>
                  </div>
                )}
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn primary" type="submit">保存</button>
                  <button className="btn outline" type="button" onClick={() => setShowForm(false)} style={{ marginLeft: '0.5rem' }}>取消</button>
                </div>
              </form>
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>题干</th>
                <th>章节</th>
                <th>题型</th>
                <th>难度</th>
                <th>年份</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncate(q.stem)}</td>
                  <td>{q.chapter || '-'}</td>
                  <td>{q.questionType || '-'}</td>
                  <td>{q.difficulty || '-'}</td>
                  <td>{q.year || '-'}</td>
                  <td>{q.status || 'published'}</td>
                  <td>
                    <button className="btn outline small" type="button" onClick={() => openEdit(q)}>编辑</button>
                    <button className="btn ghost small" type="button" onClick={() => handleViewSnapshots(q.id)} style={{ marginLeft: '0.25rem' }}>版本</button>
                    <button className="btn danger small" type="button" onClick={() => handleDelete(q.id, q.stem)} style={{ marginLeft: '0.25rem' }}>删除</button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>暂无题目</td></tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>上一页</button>
              <span>{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}

          {showSnapshots && (
            <div className="modal-overlay" onClick={() => setShowSnapshots(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                  <h3>版本历史 — 题目 #{snapshotQuestionId}</h3>
                  <button className="btn ghost small" type="button" onClick={() => setShowSnapshots(false)}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'block' }}>
                  {snapshots.length === 0 ? (
                    <p className="muted">暂无历史版本</p>
                  ) : (
                    snapshots.map((s) => (
                      <div key={s.id} className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong>v{s.versionNo}</strong>
                          <span className="muted small">{s.createdAt}</span>
                        </div>
                        <p style={{ fontSize: '13px', marginBottom: '0.25rem' }}><strong>题干:</strong> {truncate(s.stem, 100)}</p>
                        <p style={{ fontSize: '13px', marginBottom: '0.25rem' }}><strong>答案:</strong> {s.answer}</p>
                        {s.chapter && <p style={{ fontSize: '13px', marginBottom: '0.25rem' }}><strong>章节:</strong> {s.chapter}</p>}
                        {s.difficulty && <p style={{ fontSize: '13px' }}><strong>难度:</strong> {s.difficulty}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
