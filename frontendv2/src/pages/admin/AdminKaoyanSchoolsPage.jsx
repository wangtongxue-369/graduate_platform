import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'

const emptySchoolForm = {
  name: '',
  region: '',
  province: '',
  schoolType: '',
  is985: false,
  is211: false,
  isDoubleFirstClass: false,
}

export default function AdminKaoyanSchoolsPage() {
  const { token } = useAuth()
  const [filters, setFilters] = useState({
    name: '',
    region: '',
    province: '',
    schoolType: '',
  })
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptySchoolForm)
  const [editingId, setEditingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadRows() {
    setLoading(true)
    try {
      const data = await adminApi.kaoyanSchools({ ...filters, page: 0, size: 12 }, token)
      setRows(data?.content || [])
      setNotice('院校维护列表已同步。')
    } catch (error) {
      setRows([])
      setNotice(error.message || '院校维护列表加载失败。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [filters.name, filters.province, filters.region, filters.schoolType, token])

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      name: row.name || '',
      region: row.region || '',
      province: row.province || '',
      schoolType: row.schoolType || '',
      is985: Boolean(row.is985),
      is211: Boolean(row.is211),
      isDoubleFirstClass: Boolean(row.isDoubleFirstClass),
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptySchoolForm)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateKaoyanSchool(editingId, form, token)
      } else {
        await adminApi.createKaoyanSchool(form, token)
      }
      resetForm()
      await loadRows()
    } catch (error) {
      setNotice(error.message || '院校保存失败。')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisable(id) {
    try {
      await adminApi.deleteKaoyanSchool(id, token)
      await loadRows()
    } catch (error) {
      setNotice(error.message || '院校停用失败。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="院校维护"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考研治理', to: '/admin/kaoyan' },
            { label: '院校维护' },
          ]}
          title="院校维护"
          lead="基业长青，始于根基。"
          actions={<Link className="v2-secondary-link" to="/admin/kaoyan/score-lines">去分数线维护</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步院校列表…</div> : null}

        <section className="v2-card-grid" aria-label="院校维护列表">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.name}</strong>
              <p>{item.region || '地区待补充'} / {item.province || '省份待补充'}</p>
              <p>{item.schoolType || '类型待补充'}</p>
              <div className="v2-tag-row">
                {item.is985 ? <span>985</span> : null}
                {item.is211 ? <span>211</span> : null}
                {item.isDoubleFirstClass ? <span>双一流</span> : null}
              </div>
              <div className="v2-inline-actions">
                <button className="v2-segment-button is-active" type="button" onClick={() => startEdit(item)}>
                  编辑院校
                </button>
                <button className="v2-segment-button" type="button" onClick={() => handleDisable(item.id)}>
                  停用院校
                </button>
              </div>
            </article>
          ))}
          {!rows.length ? <article className="v2-module-card"><p>当前筛选下没有院校记录。</p></article> : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>院校名称</span>
              <input
                type="text"
                value={filters.name}
                onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={filters.region}
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>省份</span>
              <input
                type="text"
                value={filters.province}
                onChange={(event) => setFilters((current) => ({ ...current, province: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>院校类型</span>
              <input
                type="text"
                value={filters.schoolType}
                onChange={(event) => setFilters((current) => ({ ...current, schoolType: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">{editingId ? '编辑院校' : '新增院校'}</p>
          <form className="v2-filter-form" onSubmit={handleSave}>
            <label className="v2-field">
              <span>院校名称</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={form.region}
                onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>省份</span>
              <input
                type="text"
                value={form.province}
                onChange={(event) => setForm((current) => ({ ...current, province: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>院校类型</span>
              <input
                type="text"
                value={form.schoolType}
                onChange={(event) => setForm((current) => ({ ...current, schoolType: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>院校标签</span>
              <div className="v2-check-list">
                <label className="v2-check-row">
                  <strong>985</strong>
                  <input type="checkbox" checked={form.is985} onChange={(event) => setForm((current) => ({ ...current, is985: event.target.checked }))} />
                </label>
                <label className="v2-check-row">
                  <strong>211</strong>
                  <input type="checkbox" checked={form.is211} onChange={(event) => setForm((current) => ({ ...current, is211: event.target.checked }))} />
                </label>
                <label className="v2-check-row">
                  <strong>双一流</strong>
                  <input type="checkbox" checked={form.isDoubleFirstClass} onChange={(event) => setForm((current) => ({ ...current, isDoubleFirstClass: event.target.checked }))} />
                </label>
              </div>
            </label>
            <button className="v2-segment-button is-active" disabled={saving} type="submit">
              {saving ? '保存中…' : editingId ? '保存院校修改' : '新增院校'}
            </button>
            <button className="v2-segment-button" type="button" onClick={resetForm}>
              重置表单
            </button>
          </form>
        </section>
      </aside>
    </>
  )
}
