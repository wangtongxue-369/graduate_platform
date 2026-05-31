import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const emptyForm = {
  code: '',
  name: '',
  description: '',
  sortOrder: 0,
  active: true,
}

function normalizeForm(row = emptyForm) {
  return {
    code: row.code || '',
    name: row.name || '',
    description: row.description || '',
    sortOrder: Number(row.sortOrder ?? 0),
    active: row.active !== false,
  }
}

export default function CategoryManagementPage() {
  const { user, token, isAuthed } = useAuth()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [mergeSourceId, setMergeSourceId] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const activeCount = useMemo(() => categories.filter((item) => item.active !== false).length, [categories])

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!isAuthed || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  async function loadCategories() {
    setLoading(true)
    setMessage('')
    try {
      const data = await adminApi.postCategories(token)
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setMessage(err.message || '分类加载失败')
    } finally {
      setLoading(false)
    }
  }

  function updateField(field, value) {
    setMessage('')
    setForm((current) => ({ ...current, [field]: value }))
  }

  function startEdit(row) {
    setEditingId(row.id)
    setForm(normalizeForm(row))
    setMessage(`正在编辑：${row.name}`)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setMessage('')
  }

  async function saveCategory(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const payload = {
        ...form,
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder || 0),
      }
      if (editingId) {
        await adminApi.updatePostCategory(editingId, payload, token)
        setMessage('分类已更新')
      } else {
        await adminApi.createPostCategory(payload, token)
        setMessage('分类已新增')
      }
      resetForm()
      await loadCategories()
    } catch (err) {
      setMessage(err.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  async function toggleCategory(row) {
    setLoading(true)
    setMessage('')
    try {
      await adminApi.updatePostCategoryStatus(row.id, row.active === false, token)
      await loadCategories()
    } catch (err) {
      setMessage(err.message || '状态更新失败')
    } finally {
      setLoading(false)
    }
  }

  async function mergeCategory(event) {
    event.preventDefault()
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      setMessage('请选择不同的源分类和目标分类')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const result = await adminApi.mergePostCategory(mergeSourceId, mergeTargetId, token)
      setMessage(`已合并 ${result?.movedPostCount ?? 0} 篇帖子，源分类已停用`)
      setMergeSourceId('')
      setMergeTargetId('')
      await loadCategories()
    } catch (err) {
      setMessage(err.message || '合并失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <Link className="page-back" to="/admin">返回后台</Link>
          <div className="section-head">
            <p className="eyebrow">社区后台</p>
            <h2>社区分类管理</h2>
            <p className="muted">维护社区一级分类、排序、启停状态，并把旧分类帖子合并到目标分类。</p>
            {message ? <div className="notice-box compact">{message}</div> : null}
          </div>
        </section>

        <section className="section">
          <div className="grid-two">
            <form className="feature-card" onSubmit={saveCategory}>
              <div className="track-head">
                <h3>{editingId ? '编辑分类' : '新增分类'}</h3>
                <span className="tag subtle">{activeCount} 个启用</span>
              </div>
              <div className="filter-grid">
                <label className="field">
                  <span>分类编码</span>
                  <input
                    value={form.code}
                    onChange={(event) => updateField('code', event.target.value)}
                    placeholder="resource-help"
                    required
                  />
                  <span className="field-tip">2-32 位小写字母、数字、下划线或短横线</span>
                </label>
                <label className="field">
                  <span>分类名称</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="资料互助"
                    required
                  />
                </label>
                <label className="field">
                  <span>排序值</span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) => updateField('sortOrder', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>启用状态</span>
                  <select
                    value={form.active ? 'true' : 'false'}
                    onChange={(event) => updateField('active', event.target.value === 'true')}
                  >
                    <option value="true">启用</option>
                    <option value="false">停用</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>说明</span>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="说明这个分类适合发布哪些内容"
                />
              </label>
              <div className="question-actions">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? '保存中...' : '保存分类'}</button>
                {editingId ? <button className="btn ghost" type="button" onClick={resetForm}>取消编辑</button> : null}
              </div>
            </form>

            <form className="feature-card soft" onSubmit={mergeCategory}>
              <div className="track-head">
                <h3>分类合并</h3>
                <span className="tag subtle">迁移帖子</span>
              </div>
              <label className="field">
                <span>源分类</span>
                <select value={mergeSourceId} onChange={(event) => setMergeSourceId(event.target.value)}>
                  <option value="">选择要合并的分类</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>目标分类</span>
                <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
                  <option value="">选择承接分类</option>
                  {categories.filter((item) => String(item.id) !== String(mergeSourceId)).map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                  ))}
                </select>
              </label>
              <p className="muted">合并后，源分类下的帖子会迁移到目标分类，源分类会自动停用，前台不再展示。</p>
              <button className="btn outline" type="submit" disabled={loading}>执行合并</button>
            </form>
          </div>
        </section>

        <section className="section">
          <div className="feature-card">
            <div className="track-head">
              <h3>分类列表</h3>
              <button className="btn ghost small" type="button" onClick={loadCategories} disabled={loading}>刷新</button>
            </div>
            {categories.length === 0 ? (
              <p className="muted">{loading ? '加载中...' : '暂无分类'}</p>
            ) : (
              <div className="admin-data-list">
                {categories.map((row) => (
                  <article className="category-admin-row" key={row.id}>
                    <div>
                      <strong>{row.name}</strong>
                      <p className="muted">{row.description || '暂无说明'}</p>
                    </div>
                    <span className="tag subtle">{row.code}</span>
                    <span>排序 {row.sortOrder ?? 0}</span>
                    <div className="admin-row-actions">
                      <span className={`tag subtle ${row.active === false ? 'danger-tag' : ''}`}>
                        {row.active === false ? '停用' : '启用'}
                      </span>
                      <button className="btn outline small" type="button" onClick={() => startEdit(row)}>编辑</button>
                      <button className="btn ghost small" type="button" onClick={() => toggleCategory(row)}>
                        {row.active === false ? '启用' : '停用'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
