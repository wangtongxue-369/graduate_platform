import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminQuestionBankApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

export default function AdminQuestionBankPage() {
  const { user, token, isAuthed } = useAuth()
  const [banks, setBanks] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editBank, setEditBank] = useState(null)
  const [form, setForm] = useState({ name: '', target: '', subject: '', difficulty: '', description: '' })
  const [error, setError] = useState('')
  const SIZE = 20

  const loadBanks = () => {
    adminQuestionBankApi.banks(page, SIZE, token).then((data) => {
      setBanks(data.content)
      setTotalPages(data.totalPages)
    }).catch((e) => setError(e.message))
  }

  useEffect(() => { loadBanks() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthed || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  const openCreate = () => {
    setEditBank(null)
    setForm({ name: '', target: '', subject: '', difficulty: '', description: '' })
    setShowForm(true)
  }

  const openEdit = (bank) => {
    setEditBank(bank)
    setForm({ name: bank.name, target: bank.target || '', subject: bank.subject || '', difficulty: bank.difficulty || '', description: bank.description || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editBank) {
        await adminQuestionBankApi.updateBank(editBank.id, form, token)
      } else {
        await adminQuestionBankApi.createBank(form, token)
      }
      setShowForm(false)
      loadBanks()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`确定删除题库「${name}」吗？该操作会同时删除库内所有题目且不可恢复。`)) return
    try {
      await adminQuestionBankApi.deleteBank(id, token)
      loadBanks()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">管理后台</p>
            <h2>题库管理</h2>
            <p className="muted">新增、修改、删除题库。点击「管理试题」进入对应题库的题目管理。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <button className="btn primary" type="button" onClick={openCreate}>新建题库</button>
            <Link className="btn outline" to="/admin" style={{ marginLeft: '0.5rem' }}>返回控制台</Link>
          </div>

          {showForm && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{editBank ? '编辑题库' : '新建题库'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>名称 *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>目标方向</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="kaoyan">考研</option>
                    <option value="kaogong">考公</option>
                    <option value="job">就业</option>
                    <option value="general">通用</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>科目</label>
                  <input
                    type="text" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>难度</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="easy">简单</option>
                    <option value="middle">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
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
                <th>名称</th>
                <th>目标方向</th>
                <th>科目</th>
                <th>难度</th>
                <th>题目数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {banks.map((bank) => (
                <tr key={bank.id}>
                  <td>{bank.id}</td>
                  <td>{bank.name}</td>
                  <td>{bank.target || '-'}</td>
                  <td>{bank.subject || '-'}</td>
                  <td>{bank.difficulty || '-'}</td>
                  <td>{bank.questionCount}</td>
                  <td>
                    <Link className="btn primary small" to={`/admin/question-banks/${bank.id}/questions`}>管理试题</Link>
                    <button className="btn outline small" type="button" onClick={() => openEdit(bank)} style={{ marginLeft: '0.25rem' }}>编辑</button>
                    <button className="btn danger small" type="button" onClick={() => handleDelete(bank.id, bank.name)} style={{ marginLeft: '0.25rem' }}>删除</button>
                  </td>
                </tr>
              ))}
              {banks.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>暂无题库</td></tr>
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
        </section>
      </main>
      <Footer />
    </div>
  )
}
