import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'

const emptyScoreLineForm = {
  year: '',
  majorCategory: '',
  majorName: '',
  degreeType: '',
  politicsLine: '',
  foreignLangLine: '',
  subject1Line: '',
  subject2Line: '',
  totalScoreLine: '',
  plannedEnrollment: '',
  actualApplicants: '',
  admissionRatio: '',
  note: '',
  source: '',
}

export default function AdminKaoyanScoreLinesPage() {
  const { token } = useAuth()
  const [schools, setSchools] = useState([])
  const [schoolId, setSchoolId] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyScoreLineForm)
  const [editingId, setEditingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSchools() {
      try {
        const data = await adminApi.kaoyanSchools({ page: 0, size: 200 }, token)
        if (!active) return
        const nextSchools = data?.content || []
        setSchools(nextSchools)
        if (!schoolId && nextSchools[0]?.id) {
          setSchoolId(String(nextSchools[0].id))
        }
      } catch (error) {
        if (!active) return
        setSchools([])
        setNotice(error.message || '院校上下文加载失败。')
      }
    }

    loadSchools()
    return () => {
      active = false
    }
  }, [schoolId, token])

  async function loadRows() {
    if (!schoolId) return
    setLoading(true)
    try {
      const data = await adminApi.kaoyanScoreLines({ schoolId, page: 0, size: 12 }, token)
      setRows(data?.content || [])
      setNotice('分数线维护列表已同步。')
    } catch (error) {
      setRows([])
      setNotice(error.message || '分数线列表加载失败。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [schoolId, token])

  function startEdit(row) {
    setEditingId(row.id)
    setForm({
      year: row.year || '',
      majorCategory: row.majorCategory || '',
      majorName: row.majorName || '',
      degreeType: row.degreeType || '',
      politicsLine: row.politicsLine || '',
      foreignLangLine: row.foreignLangLine || '',
      subject1Line: row.subject1Line || '',
      subject2Line: row.subject2Line || '',
      totalScoreLine: row.totalScoreLine || '',
      plannedEnrollment: row.plannedEnrollment || '',
      actualApplicants: row.actualApplicants || '',
      admissionRatio: row.admissionRatio || '',
      note: row.note || '',
      source: row.source || '',
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyScoreLineForm)
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!schoolId) return
    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateKaoyanScoreLine(editingId, form, token)
      } else {
        await adminApi.createKaoyanScoreLine({ ...form, schoolId: Number(schoolId) }, token)
      }
      resetForm()
      await loadRows()
    } catch (error) {
      setNotice(error.message || '分数线保存失败。')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisable(id) {
    try {
      await adminApi.deleteKaoyanScoreLine(id, token)
      await loadRows()
    } catch (error) {
      setNotice(error.message || '分数线停用失败。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="分数线维护"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考研治理', to: '/admin/kaoyan' },
            { label: '分数线维护' },
          ]}
          title="分数线维护"
          lead="数字虽冷，承载的是千万人的前程。"
          actions={<Link className="v2-secondary-link" to="/admin/kaoyan/schools">去院校维护</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步分数线列表…</div> : null}

        <section className="v2-card-grid" aria-label="分数线维护列表">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.schoolName || schools.find((school) => String(school.id) === String(schoolId))?.name || '院校待补充'}</strong>
              <p>{item.majorName || item.majorCategory || '专业待补充'}</p>
              <p>{item.year || '年份待补充'} / 总分线 {item.totalScoreLine || '待补充'}</p>
              <div className="v2-tag-row">
                {item.admissionRatio ? <span>报录比 {item.admissionRatio}:1</span> : null}
                {item.plannedEnrollment ? <span>计划 {item.plannedEnrollment}</span> : null}
              </div>
              <div className="v2-inline-actions">
                <button className="v2-segment-button is-active" type="button" onClick={() => startEdit(item)}>
                  编辑分数线
                </button>
                <button className="v2-segment-button" type="button" onClick={() => handleDisable(item.id)}>
                  停用分数线
                </button>
              </div>
            </article>
          ))}
          {!rows.length ? <article className="v2-module-card"><p>当前院校下还没有分数线记录。</p></article> : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">当前院校</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>院校</span>
              <select value={schoolId} onChange={(event) => setSchoolId(event.target.value)}>
                {schools.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">{editingId ? '编辑分数线' : '新增分数线'}</p>
          <form className="v2-filter-form" onSubmit={handleSave}>
            <label className="v2-field">
              <span>年份</span>
              <input type="text" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>专业门类</span>
              <input type="text" value={form.majorCategory} onChange={(event) => setForm((current) => ({ ...current, majorCategory: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>具体专业</span>
              <input type="text" value={form.majorName} onChange={(event) => setForm((current) => ({ ...current, majorName: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>总分线</span>
              <input type="number" value={form.totalScoreLine} onChange={(event) => setForm((current) => ({ ...current, totalScoreLine: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>计划招生</span>
              <input type="number" value={form.plannedEnrollment} onChange={(event) => setForm((current) => ({ ...current, plannedEnrollment: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>报录比</span>
              <input type="number" value={form.admissionRatio} onChange={(event) => setForm((current) => ({ ...current, admissionRatio: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>备注</span>
              <textarea rows={4} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
            </label>
            <button className="v2-segment-button is-active" disabled={saving || !schoolId} type="submit">
              {saving ? '保存中…' : editingId ? '保存分数线修改' : '新增分数线'}
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
