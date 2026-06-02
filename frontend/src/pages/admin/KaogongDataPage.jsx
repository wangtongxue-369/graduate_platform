import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const tabs = [
  { key: 'jobs', label: '岗位信息' },
  { key: 'scores', label: '进面分数线' },
  { key: 'events', label: '考试节点' },
]

const emptyJob = {
  examType: '国家公务员考试',
  year: '2026',
  region: '',
  jobName: '',
  recruitingUnit: '',
  unitType: '',
  jobCategory: '',
  recruitCount: '1',
  educationRequirement: '',
  degreeRequirement: '',
  majorRequirement: '',
  householdRequirement: '',
  politicalStatusRequirement: '',
  examSubjects: '',
  registrationStart: '',
  registrationEnd: '',
  sourceUrl: '',
  remark: '',
}

const emptyScore = {
  region: '',
  year: '2026',
  examType: '国家公务员考试',
  unitType: '',
  jobCategory: '',
  jobName: '',
  recruitingUnit: '',
  scoreLine: '',
  interviewRatio: '',
  recruitCount: '1',
  interviewCount: '',
  dataNote: '',
  source: '',
}

const emptyEvent = {
  region: '',
  examType: '国家公务员考试',
  year: '2026',
  nodeType: '报名',
  title: '',
  eventDate: '',
  description: '',
  sourceUrl: '',
}

const emptyFilters = {
  region: '',
  examType: '',
  year: '',
  jobCategory: '',
  unitType: '',
}

const pageSize = 8

const activeStatusClassMap = {
  true: 'is-success',
  false: 'is-neutral',
}

export default function KaogongDataPage() {
  const { user, token, isAuthed } = useAuth()
  const [active, setActive] = useState('jobs')
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [jobForm, setJobForm] = useState(emptyJob)
  const [scoreForm, setScoreForm] = useState(emptyScore)
  const [eventForm, setEventForm] = useState(emptyEvent)

  const activeTab = useMemo(() => tabs.find((item) => item.key === active), [active])

  useEffect(() => {
    loadRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, page])

  if (!isAuthed || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function updateForm(setter, key, value) {
    setter((prev) => ({ ...prev, [key]: value }))
  }

  async function loadRows(event, nextPage = page) {
    event?.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const params = { ...filters, page: nextPage, size: pageSize }
      const data = active === 'jobs'
        ? await adminApi.kaogongJobs(params, token)
        : active === 'scores'
          ? await adminApi.kaogongScoreLines(params, token)
          : await adminApi.kaogongCalendarEvents(params, token)
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
      if (active === 'jobs') {
        if (editingId) {
          await adminApi.updateKaogongJob(editingId, jobForm, token)
        } else {
          await adminApi.createKaogongJob(jobForm, token)
        }
        setJobForm(emptyJob)
      } else if (active === 'scores') {
        if (editingId) {
          await adminApi.updateKaogongScoreLine(editingId, scoreForm, token)
        } else {
          await adminApi.createKaogongScoreLine(scoreForm, token)
        }
        setScoreForm(emptyScore)
      } else {
        if (editingId) {
          await adminApi.updateKaogongCalendarEvent(editingId, eventForm, token)
        } else {
          await adminApi.createKaogongCalendarEvent(eventForm, token)
        }
        setEventForm(emptyEvent)
      }
      setEditingId(null)
      setMessage(`${activeTab?.label || '数据'}已保存`)
      setPage(0)
      await loadRows(null, 0)
    } catch (err) {
      setMessage(err.message || '新增失败')
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
    setMessage(`正在编辑：${row.jobName || row.title}`)
    if (active === 'jobs') {
      setJobForm({ ...emptyJob, ...normalizeDates(row) })
    } else if (active === 'scores') {
      setScoreForm({ ...emptyScore, ...row })
    } else {
      setEventForm({ ...emptyEvent, ...normalizeDates(row) })
    }
  }

  async function deleteRecord(id) {
    setLoading(true)
    setMessage('')
    try {
      if (active === 'jobs') {
        await adminApi.deleteKaogongJob(id, token)
      } else if (active === 'scores') {
        await adminApi.deleteKaogongScoreLine(id, token)
      } else {
        await adminApi.deleteKaogongCalendarEvent(id, token)
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
            <p className="eyebrow">考公数据维护</p>
            <h2>岗位、分数线与考试节点</h2>
            <p className="muted">后台可以新增基础数据，列表通过后端分页返回，前台查询与订阅会直接使用这些数据。</p>
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
              <div className="filter-grid">
                <label className="field">
                  <span>地区</span>
                  <input value={filters.region} onChange={(event) => updateFilter('region', event.target.value)} placeholder="如：北京" />
                </label>
                <label className="field">
                  <span>考试类型</span>
                  <input value={filters.examType} onChange={(event) => updateFilter('examType', event.target.value)} placeholder="如：国家公务员考试" />
                </label>
                <label className="field">
                  <span>年份</span>
                  <input value={filters.year} onChange={(event) => updateFilter('year', event.target.value)} placeholder="如：2026" />
                </label>
                {active !== 'events' ? (
                  <>
                    <label className="field">
                      <span>岗位类别</span>
                      <input value={filters.jobCategory} onChange={(event) => updateFilter('jobCategory', event.target.value)} placeholder="如：综合管理" />
                    </label>
                    <label className="field">
                      <span>单位类型</span>
                      <input value={filters.unitType} onChange={(event) => updateFilter('unitType', event.target.value)} placeholder="如：中央机关直属机构" />
                    </label>
                  </>
                ) : null}
              </div>
              <div className="admin-filter-bar">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? '查询中...' : '查询'}</button>
                <button className="btn ghost" type="button" onClick={() => { setFilters(emptyFilters); setPage(0) }}>清空</button>
                <span className="admin-filter-pill is-active">{activeTab?.label || '数据'}</span>
                <span className="admin-filter-pill">共 {pageInfo.totalElements} 条</span>
              </div>
              {message ? <div className="admin-note-panel"><p>{message}</p></div> : null}
            </form>

            <form className="admin-form-surface" onSubmit={createRecord}>
              <div className="track-head">
                <h3>{editingId ? '编辑' : '新增'}{activeTab?.label}</h3>
                <span className="admin-status-chip is-neutral">后台维护</span>
              </div>
              {active === 'jobs' ? renderJobForm(jobForm, (key, value) => updateForm(setJobForm, key, value)) : null}
              {active === 'scores' ? renderScoreForm(scoreForm, (key, value) => updateForm(setScoreForm, key, value)) : null}
              {active === 'events' ? renderEventForm(eventForm, (key, value) => updateForm(setEventForm, key, value)) : null}
              <div className="question-actions">
                <button className="btn primary" type="submit" disabled={loading}>保存</button>
                {editingId ? (
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setJobForm(emptyJob)
                      setScoreForm(emptyScore)
                      setEventForm(emptyEvent)
                      setMessage('')
                    }}
                  >
                    取消编辑
                  </button>
                ) : null}
              </div>
            </form>

            <div className="admin-surface-card">
              <div className="track-head">
                <h3>{activeTab?.label}列表</h3>
                <span className="admin-status-chip is-neutral">共 {pageInfo.totalElements} 条</span>
              </div>
              {rows.length === 0 ? (
                <p className="muted">暂无数据</p>
              ) : (
                <div className="admin-record-grid">
                  {active === 'jobs' ? rows.map((row) => renderJobRow(row, editRecord, deleteRecord)) : null}
                  {active === 'scores' ? rows.map((row) => renderScoreRow(row, editRecord, deleteRecord)) : null}
                  {active === 'events' ? rows.map((row) => renderEventRow(row, editRecord, deleteRecord)) : null}
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
    </div>
  )
}

function renderJobForm(form, update) {
  return (
    <div className="filter-grid">
      <TextField label="考试类型" value={form.examType} onChange={(value) => update('examType', value)} required />
      <TextField label="年份" value={form.year} onChange={(value) => update('year', value)} required />
      <TextField label="地区" value={form.region} onChange={(value) => update('region', value)} required />
      <TextField label="岗位名称" value={form.jobName} onChange={(value) => update('jobName', value)} required />
      <TextField label="招录单位" value={form.recruitingUnit} onChange={(value) => update('recruitingUnit', value)} required />
      <TextField label="单位类型" value={form.unitType} onChange={(value) => update('unitType', value)} />
      <TextField label="岗位类别" value={form.jobCategory} onChange={(value) => update('jobCategory', value)} />
      <TextField label="招录人数" value={form.recruitCount} onChange={(value) => update('recruitCount', value)} type="number" />
      <TextField label="学历要求" value={form.educationRequirement} onChange={(value) => update('educationRequirement', value)} />
      <TextField label="专业要求" value={form.majorRequirement} onChange={(value) => update('majorRequirement', value)} />
      <TextField label="报名开始" value={form.registrationStart} onChange={(value) => update('registrationStart', value)} type="date" />
      <TextField label="报名结束" value={form.registrationEnd} onChange={(value) => update('registrationEnd', value)} type="date" />
    </div>
  )
}

function renderScoreForm(form, update) {
  return (
    <div className="filter-grid">
      <TextField label="地区" value={form.region} onChange={(value) => update('region', value)} required />
      <TextField label="年份" value={form.year} onChange={(value) => update('year', value)} required />
      <TextField label="考试类型" value={form.examType} onChange={(value) => update('examType', value)} required />
      <TextField label="岗位名称" value={form.jobName} onChange={(value) => update('jobName', value)} required />
      <TextField label="招录单位" value={form.recruitingUnit} onChange={(value) => update('recruitingUnit', value)} required />
      <TextField label="进面分数" value={form.scoreLine} onChange={(value) => update('scoreLine', value)} type="number" required />
      <TextField label="单位类型" value={form.unitType} onChange={(value) => update('unitType', value)} />
      <TextField label="岗位类别" value={form.jobCategory} onChange={(value) => update('jobCategory', value)} />
      <TextField label="面试比例" value={form.interviewRatio} onChange={(value) => update('interviewRatio', value)} />
      <TextField label="招录人数" value={form.recruitCount} onChange={(value) => update('recruitCount', value)} type="number" />
      <TextField label="进面人数" value={form.interviewCount} onChange={(value) => update('interviewCount', value)} type="number" />
      <TextField label="来源" value={form.source} onChange={(value) => update('source', value)} />
    </div>
  )
}

function renderEventForm(form, update) {
  return (
    <div className="filter-grid">
      <TextField label="地区" value={form.region} onChange={(value) => update('region', value)} required />
      <TextField label="考试类型" value={form.examType} onChange={(value) => update('examType', value)} required />
      <TextField label="年份" value={form.year} onChange={(value) => update('year', value)} required />
      <TextField label="节点类型" value={form.nodeType} onChange={(value) => update('nodeType', value)} required />
      <TextField label="标题" value={form.title} onChange={(value) => update('title', value)} required />
      <TextField label="日期" value={form.eventDate} onChange={(value) => update('eventDate', value)} type="date" required />
      <TextField label="说明" value={form.description} onChange={(value) => update('description', value)} />
      <TextField label="来源链接" value={form.sourceUrl} onChange={(value) => update('sourceUrl', value)} />
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text', required = false, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
}

function normalizeDates(row) {
  return {
    ...row,
    registrationStart: row.registrationStart || '',
    registrationEnd: row.registrationEnd || '',
    eventDate: row.eventDate || '',
  }
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

function renderJobRow(row, onEdit, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.jobName}</strong>
        <p className="muted">{row.recruitingUnit}</p>
        <div className="admin-record-meta">
          <span>地区：{row.region}</span>
          <span>考试：{row.examType}</span>
          <span>类别：{row.jobCategory || '待补充'}</span>
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
        <strong>{row.jobName}</strong>
        <p className="muted">{row.recruitingUnit}</p>
        <div className="admin-record-meta">
          <span>地区：{row.region}</span>
          <span>年份：{row.year}</span>
          <span>分数：{row.scoreLine || '待补充'}</span>
        </div>
      </div>
      {rowActions(row, onEdit, onDelete)}
    </article>
  )
}

function renderEventRow(row, onEdit, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.title}</strong>
        <p className="muted">{row.description || row.examType}</p>
        <div className="admin-record-meta">
          <span>地区：{row.region}</span>
          <span>节点：{row.nodeType}</span>
          <span>日期：{row.eventDate || '待补充'}</span>
        </div>
      </div>
      {rowActions(row, onEdit, onDelete)}
    </article>
  )
}
