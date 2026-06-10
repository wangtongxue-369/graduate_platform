import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const tabs = [
  { key: 'schools', label: '院校信息' },
  { key: 'scores', label: '分数线' },
]

const emptySchool = {
  name: '',
  region: '',
  province: '',
  is985: false,
  is211: false,
  isDoubleFirstClass: false,
  schoolType: '',
  logoUrl: '',
  description: '',
  officialSite: '',
}

const emptyScore = {
  schoolId: '',
  year: '2026',
  majorCategory: '',
  majorName: '',
  degreeType: '',
  isNationalLine: false,
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

const emptyFilters = {
  name: '',
  region: '',
  province: '',
  is985: '',
  is211: '',
  isDoubleFirstClass: '',
  schoolType: '',
  year: '',
  majorCategory: '',
  majorName: '',
  schoolName: '',
}

const pageSize = 8

const majorCategories = [
  '哲学', '经济学', '法学', '教育学', '文学', '历史学',
  '理学', '工学', '农学', '医学', '军事学', '管理学', '艺术学',
]

const schoolTypes = ['综合', '理工', '师范', '农林', '医药', '财经', '政法', '民族', '体育', '艺术', '军事', '其他']

const activeStatusClassMap = {
  true: 'is-success',
  false: 'is-neutral',
}

export default function AdminKaoyanDataPage() {
  const { user, token, isAuthed } = useAuth()
  const [active, setActive] = useState('schools')
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [schoolForm, setSchoolForm] = useState(emptySchool)
  const [scoreForm, setScoreForm] = useState(emptyScore)
  const [schools, setSchools] = useState([])

  const activeTab = useMemo(() => tabs.find((item) => item.key === active), [active])

  useEffect(() => {
    loadRows()
    loadSchoolOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, page])

  if (!isAuthed || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function updateSchoolForm(key, value) {
    setSchoolForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateScoreForm(key, value) {
    setScoreForm((prev) => ({ ...prev, [key]: value }))
  }

  async function loadSchoolOptions() {
    try {
      const data = await adminApi.kaoyanSchools({ size: 1000 }, token)
      setSchools(data?.content || [])
    } catch {
      // ignore
    }
  }

  async function loadRows(event, nextPage = page) {
    event?.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const params = { ...filters, page: nextPage, size: pageSize }
      const data = active === 'schools'
        ? await adminApi.kaoyanSchools(params, token)
        : await adminApi.kaoyanScoreLines(params, token)
      setRows(data?.content || [])
      setPageInfo({
        totalPages: data?.totalPages || 1,
        totalElements: data?.totalElements || 0,
      })
    } catch (err) {
      setMessage(err.message || '数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleFilter(event) {
    event.preventDefault()
    setPage(0)
    await loadRows(event, 0)
  }

  async function createRecord(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (active === 'schools') {
        if (editingId) {
          await adminApi.updateKaoyanSchool(editingId, schoolForm, token)
        } else {
          await adminApi.createKaoyanSchool(schoolForm, token)
        }
        setSchoolForm(emptySchool)
      } else {
        if (editingId) {
          await adminApi.updateKaoyanScoreLine(editingId, scoreForm, token)
        } else {
          await adminApi.createKaoyanScoreLine(scoreForm, token)
        }
        setScoreForm(emptyScore)
      }
      setEditingId(null)
      setMessage(`${activeTab?.label || '数据'}已保存`)
      setShowFormModal(false)
      setSchoolForm(emptySchool)
      setScoreForm(emptyScore)
      setPage(0)
      await loadRows(null, 0)
      await loadSchoolOptions()
    } catch (err) {
      setMessage(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  function switchTab(key) {
    setActive(key)
    setPage(0)
    setEditingId(null)
    setMessage('')
  }

  function editRecord(row) {
    setEditingId(row.id)
    setMessage(`正在编辑：${row.name || row.schoolName}`)
    if (active === 'schools') {
      setSchoolForm({ ...emptySchool, ...row })
    } else {
      const form = { ...emptyScore }
      Object.keys(row).forEach((key) => {
        if (key in form) form[key] = row[key]
      })
      if (row.schoolId) form.schoolId = row.schoolId
      setScoreForm(form)
    }
    setShowFormModal(true)
  }

  function openCreateModal() {
    setEditingId(null)
    setSchoolForm(emptySchool)
    setScoreForm(emptyScore)
    setMessage('')
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    setEditingId(null)
    setSchoolForm(emptySchool)
    setScoreForm(emptyScore)
  }

  async function deleteRecord(id) {
    setLoading(true)
    setMessage('')
    try {
      if (active === 'schools') {
        await adminApi.deleteKaoyanSchool(id, token)
      } else {
        await adminApi.deleteKaoyanScoreLine(id, token)
      }
      setMessage(`${activeTab?.label || '数据'}已停用`)
      await loadRows()
    } catch (err) {
      setMessage(err.message || '停用失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <Link className="page-back" to="/admin">← 返回</Link>
          <div className="section-head">
            <p className="eyebrow">考研数据维护</p>
            <h2>院校信息与历年分数线</h2>
            <p className="muted">后台维护考研院校库与历年分数线数据，用户可按院校、年份、专业查询并对比。</p>
          </div>

          <div className="admin-tabs">
            {tabs.map((tab) => (
              <button
                className={`admin-tab ${active === tab.key ? 'active' : ''}`}
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-page-shell">
            <form className="admin-toolbar-card admin-filter-stack" onSubmit={handleFilter}>
              {active === 'schools' ? (
                <div className="filter-grid">
                  <label className="field">
                    <span>院校名称</span>
                    <input value={filters.name} onChange={(e) => updateFilter('name', e.target.value)} placeholder="模糊搜索" />
                  </label>
                  <label className="field">
                    <span>地区</span>
                    <input value={filters.region} onChange={(e) => updateFilter('region', e.target.value)} placeholder="如：北京" />
                  </label>
                  <label className="field">
                    <span>省份</span>
                    <input value={filters.province} onChange={(e) => updateFilter('province', e.target.value)} placeholder="如：江苏" />
                  </label>
                  <label className="field">
                    <span>院校类型</span>
                    <select value={filters.schoolType} onChange={(e) => updateFilter('schoolType', e.target.value)}>
                      <option value="">全部</option>
                      {schoolTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>985</span>
                    <select value={filters.is985} onChange={(e) => updateFilter('is985', e.target.value)}>
                      <option value="">不限</option>
                      <option value="true">是</option>
                      <option value="false">否</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>211</span>
                    <select value={filters.is211} onChange={(e) => updateFilter('is211', e.target.value)}>
                      <option value="">不限</option>
                      <option value="true">是</option>
                      <option value="false">否</option>
                    </select>
                  </label>
                </div>
              ) : (
                <div className="filter-grid">
                  <label className="field">
                    <span>院校名称</span>
                    <input value={filters.schoolName} onChange={(e) => updateFilter('schoolName', e.target.value)} placeholder="模糊搜索" />
                  </label>
                  <label className="field">
                    <span>年份</span>
                    <input value={filters.year} onChange={(e) => updateFilter('year', e.target.value)} placeholder="如：2025" />
                  </label>
                  <label className="field">
                    <span>专业门类</span>
                    <select value={filters.majorCategory} onChange={(e) => updateFilter('majorCategory', e.target.value)}>
                      <option value="">全部</option>
                      {majorCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>具体专业</span>
                    <input value={filters.majorName} onChange={(e) => updateFilter('majorName', e.target.value)} placeholder="模糊搜索" />
                  </label>
                </div>
              )}
              <div className="admin-filter-bar">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? '查询中...' : '查询'}</button>
                <button className="btn ghost" type="button" onClick={() => { setFilters(emptyFilters); setPage(0) }}>清空</button>
                <span className="admin-filter-pill is-active">{activeTab?.label || '数据'}</span>
                <span className="admin-filter-pill">共 {pageInfo.totalElements} 条</span>
              </div>
              {message ? <div className="admin-note-panel"><p>{message}</p></div> : null}
            </form>

            <div className="admin-page-action-row" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn primary" type="button" onClick={openCreateModal}>+ 新增{activeTab?.label}</button>
            </div>

            <div className="admin-surface-card">
              <div className="track-head">
                <h3>{activeTab?.label}列表</h3>
                <span className="admin-status-chip is-neutral">共 {pageInfo.totalElements} 条</span>
              </div>
              {rows.length === 0 ? (
                <p className="muted">暂无数据</p>
              ) : (
                <div className="admin-record-grid">
                  {active === 'schools' ? rows.map((row) => renderSchoolRow(row, editRecord, deleteRecord)) : null}
                  {active === 'scores' ? rows.map((row) => renderScoreRow(row, editRecord, deleteRecord)) : null}
                </div>
              )}
              <Pagination
                page={page + 1}
                total={pageInfo.totalPages}
                totalItems={pageInfo.totalElements}
                onChange={(nextPage) => setPage(nextPage - 1)}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingId ? `编辑${activeTab?.label || ''}` : `新增${activeTab?.label || ''}`}</h3>
              <button className="btn ghost" type="button" onClick={closeFormModal} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>✕</button>
            </div>
            <form onSubmit={createRecord}>
              <div className="modal-body">
                {active === 'schools'
                  ? renderSchoolForm(schoolForm, updateSchoolForm)
                  : renderScoreForm(scoreForm, updateScoreForm, schools)}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={closeFormModal}>取消</button>
                <button type="submit" className="btn primary" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function renderSchoolForm(form, update) {
  return (
    <div className="filter-grid">
      <TextField label="院校名称" value={form.name} onChange={(value) => update('name', value)} required />
      <TextField label="地区" value={form.region} onChange={(value) => update('region', value)} placeholder="如：华北" />
      <TextField label="省份" value={form.province} onChange={(value) => update('province', value)} placeholder="如：北京" />
      <TextField label="院校类型" value={form.schoolType} onChange={(value) => update('schoolType', value)} placeholder="如：综合/理工/师范" />
      <label className="field admin-field-wide">
        <span>院校层次</span>
        <div className="admin-inline-checkbox-group">
          <label className="admin-inline-checkbox">
            <input type="checkbox" checked={form.is985} onChange={(e) => update('is985', e.target.checked)} />
            <span>985</span>
          </label>
          <label className="admin-inline-checkbox">
            <input type="checkbox" checked={form.is211} onChange={(e) => update('is211', e.target.checked)} />
            <span>211</span>
          </label>
          <label className="admin-inline-checkbox">
            <input type="checkbox" checked={form.isDoubleFirstClass} onChange={(e) => update('isDoubleFirstClass', e.target.checked)} />
            <span>双一流</span>
          </label>
        </div>
      </label>
      <TextField label="官网" value={form.officialSite} onChange={(value) => update('officialSite', value)} />
      <TextField label="Logo URL" value={form.logoUrl} onChange={(value) => update('logoUrl', value)} />
      <TextField label="简介" value={form.description} onChange={(value) => update('description', value)} />
    </div>
  )
}

function renderScoreForm(form, update, schools) {
  return (
    <div className="filter-grid">
      <label className="field">
        <span>院校</span>
        <select value={form.schoolId} onChange={(e) => update('schoolId', e.target.value)} required>
          <option value="">选择院校</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <TextField label="年份" value={form.year} onChange={(value) => update('year', value)} required placeholder="如：2025" />
      <label className="field">
        <span>专业门类</span>
        <select value={form.majorCategory} onChange={(e) => update('majorCategory', e.target.value)}>
          <option value="">请选择</option>
          {majorCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <TextField label="具体专业" value={form.majorName} onChange={(value) => update('majorName', value)} />
      <TextField label="学位类型" value={form.degreeType} onChange={(value) => update('degreeType', value)} placeholder="学术型/专业型" />
      <label className="field">
        <span>国家线</span>
        <input type="checkbox" checked={form.isNationalLine} onChange={(e) => update('isNationalLine', e.target.checked)} />
      </label>
      <TextField label="政治线" value={form.politicsLine} onChange={(value) => update('politicsLine', value)} type="number" />
      <TextField label="外语线" value={form.foreignLangLine} onChange={(value) => update('foreignLangLine', value)} type="number" />
      <TextField label="业务课1线" value={form.subject1Line} onChange={(value) => update('subject1Line', value)} type="number" />
      <TextField label="业务课2线" value={form.subject2Line} onChange={(value) => update('subject2Line', value)} type="number" />
      <TextField label="总分线" value={form.totalScoreLine} onChange={(value) => update('totalScoreLine', value)} type="number" required />
      <TextField label="计划招生" value={form.plannedEnrollment} onChange={(value) => update('plannedEnrollment', value)} type="number" />
      <TextField label="报考人数" value={form.actualApplicants} onChange={(value) => update('actualApplicants', value)} type="number" />
      <TextField label="报录比" value={form.admissionRatio} onChange={(value) => update('admissionRatio', value)} type="number" placeholder="如：5.2" />
      <TextField label="备注" value={form.note} onChange={(value) => update('note', value)} />
      <TextField label="来源" value={form.source} onChange={(value) => update('source', value)} />
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text', required = false, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
}

function rowActions(row, onEdit, onDelete) {
  return (
    <div className="admin-record-side">
      <span className={`admin-status-chip ${activeStatusClassMap[String(row.active !== false)] || 'is-neutral'}`}>{row.active === false ? '已停用' : '启用中'}</span>
      <div className="admin-inline-actions">
        <button className="btn outline small" type="button" onClick={() => onEdit(row)}>编辑</button>
        <button className="btn outline-neutral small" type="button" onClick={() => onDelete(row.id)} disabled={row.active === false}>停用</button>
      </div>
    </div>
  )
}

function renderSchoolRow(row, onEdit, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.name}</strong>
        <p className="muted">{row.region} {row.province} {row.schoolType}</p>
        <div className="admin-record-meta">
          <span>{row.is985 ? '985' : '非985'}</span>
          <span>{row.is211 ? '211' : '非211'}</span>
          <span>{row.isDoubleFirstClass ? '双一流' : '普通院校'}</span>
        </div>
      </div>
      {rowActions(row, onEdit, onDelete)}
    </article>
  )
}

function renderScoreRow(row, onEdit, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.schoolName}</strong>
        <p className="muted">{row.majorName || row.majorCategory}</p>
        <div className="admin-record-meta">
          <span>年份：{row.year}</span>
          <span>总分线：{row.totalScoreLine}</span>
          <span>{row.admissionRatio ? `${row.admissionRatio}:1` : '报录比待补充'}</span>
        </div>
      </div>
      {rowActions(row, onEdit, onDelete)}
    </article>
  )
}
