import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { adminStudyAbroadApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { countryLabelMap, countryOptions } from '../studyabroad/studyAbroadUtils.js'
import '../../App.css'

const tabs = [
  { key: 'schools', label: '院校项目' },
  { key: 'cases', label: '录取案例' },
  { key: 'experiences', label: '经验分享' },
]

const pageSize = 8

const emptyFilters = {
  country: '',
  subjectArea: '',
  partnerOnly: '',
  result: '',
  topic: '',
  major: '',
  keyword: '',
}

const emptySchool = {
  country: 'UK',
  schoolName: '',
  programName: '',
  degree: 'Master',
  subjectArea: '',
  qsRank: '',
  theRank: '',
  usNewsRank: '',
  tuitionRange: '',
  durationText: '',
  deadlineText: '',
  applicationRequirements: '',
  visaPolicy: '',
  employmentPolicy: '',
  partnerProgram: false,
  partnerNote: '',
  riskTags: '',
  riskSummary: '',
  sourceNote: '',
  policyUpdatedAt: '',
}

const subjectOptions = ['Computer Science', 'Business', 'Engineering', 'Education', 'Design', 'Data Science']
const resultOptions = [
  { value: 'admit', label: '录取' },
  { value: 'reject', label: '拒信' },
  { value: 'waitlist', label: '候补' },
]
const topicOptions = [
  { value: 'School Selection', label: '选校定位' },
  { value: 'Application', label: '申请流程' },
  { value: 'Language Test', label: '语言考试' },
  { value: 'Writing', label: '文书材料' },
  { value: 'Visa', label: '签证' },
  { value: 'Life Abroad', label: '海外生活' },
]

const resultLabelMap = Object.fromEntries(resultOptions.map((item) => [item.value, item.label]))
const topicLabelMap = Object.fromEntries(topicOptions.map((item) => [item.value, item.label]))

export default function AdminStudyAbroadPage() {
  const { user, token, isAuthed } = useAuth()
  const [active, setActive] = useState('schools')
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: 0 })
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [schoolForm, setSchoolForm] = useState(emptySchool)

  const activeTab = useMemo(() => tabs.find((item) => item.key === active), [active])

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadRows(null, page)
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

  async function loadDashboard() {
    try {
      const data = await adminStudyAbroadApi.dashboard(token)
      setDashboard(data)
    } catch (err) {
      setMessage(err.message || '留学后台统计加载失败')
    }
  }

  async function loadRows(event, nextPage = page) {
    event?.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const params = activeParams(nextPage)
      const data = active === 'schools'
        ? await adminStudyAbroadApi.schools(params, token)
        : active === 'cases'
          ? await adminStudyAbroadApi.admissionCases(params, token)
          : await adminStudyAbroadApi.experiences(params, token)
      setRows(data?.content || [])
      setPageInfo({
        totalPages: data?.totalPages || 1,
        totalElements: data?.totalElements || 0,
      })
    } catch (err) {
      setRows([])
      setPageInfo({ totalPages: 1, totalElements: 0 })
      setMessage(err.message || '数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  function activeParams(nextPage) {
    const base = { page: nextPage, size: pageSize, keyword: filters.keyword }
    if (active === 'schools') {
      return {
        ...base,
        country: filters.country,
        subjectArea: filters.subjectArea,
        partnerOnly: filters.partnerOnly,
      }
    }
    if (active === 'cases') {
      return {
        ...base,
        country: filters.country,
        result: filters.result,
        major: filters.major,
      }
    }
    return {
      ...base,
      country: filters.country,
      topic: filters.topic,
    }
  }

  async function handleFilter(event) {
    event.preventDefault()
    setPage(0)
    await loadRows(event, 0)
  }

  function switchTab(key) {
    setActive(key)
    setPage(0)
    setRows([])
    setMessage('')
    setEditingId(null)
    setShowFormModal(false)
  }

  function openCreateModal() {
    setEditingId(null)
    setSchoolForm(emptySchool)
    setMessage('')
    setShowFormModal(true)
  }

  function editSchool(row) {
    setEditingId(row.id)
    setSchoolForm({
      ...emptySchool,
      ...row,
      riskTags: Array.isArray(row.riskTags) ? row.riskTags.join(', ') : row.riskTags || '',
      partnerProgram: Boolean(row.partnerProgram),
      policyUpdatedAt: row.policyUpdatedAt || '',
    })
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    setEditingId(null)
    setSchoolForm(emptySchool)
  }

  async function saveSchool(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (editingId) {
        await adminStudyAbroadApi.updateSchool(editingId, schoolForm, token)
      } else {
        await adminStudyAbroadApi.createSchool(schoolForm, token)
      }
      setMessage(editingId ? '院校项目已更新' : '院校项目已创建')
      closeFormModal()
      setPage(0)
      await loadRows(null, 0)
      await loadDashboard()
    } catch (err) {
      setMessage(err.message || '院校项目保存失败')
    } finally {
      setLoading(false)
    }
  }

  async function deleteRecord(row) {
    const label = row.schoolName || row.title || row.school || '这条数据'
    if (!window.confirm(`确认删除「${label}」吗？`)) return
    setLoading(true)
    setMessage('')
    try {
      if (active === 'schools') {
        await adminStudyAbroadApi.deleteSchool(row.id, token)
      } else if (active === 'cases') {
        await adminStudyAbroadApi.deleteAdmissionCase(row.id, token)
      } else {
        await adminStudyAbroadApi.deleteExperience(row.id, token)
      }
      setMessage('数据已删除')
      await loadRows(null, page)
      await loadDashboard()
    } catch (err) {
      setMessage(err.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <Link className="page-back" to="/admin">← 返回后台</Link>
          <div className="section-head">
            <p className="eyebrow">留学管理</p>
            <h2>留学数据管理后台</h2>
            <p className="muted">管理员可以维护院校项目库，并管理用户发布的录取案例和经验分享。</p>
          </div>

          <div className="admin-summary-grid">
            <SummaryCard label="院校项目" value={dashboard?.totalSchools} />
            <SummaryCard label="录取案例" value={dashboard?.totalAdmissionCases} />
            <SummaryCard label="经验分享" value={dashboard?.totalExperiences} />
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
                <CountryField value={filters.country} onChange={(value) => updateFilter('country', value)} />
                {active === 'schools' ? (
                  <>
                    <SelectField label="学科领域" value={filters.subjectArea} onChange={(value) => updateFilter('subjectArea', value)} options={subjectOptions} />
                    <label className="field">
                      <span>合作项目</span>
                      <select value={filters.partnerOnly} onChange={(event) => updateFilter('partnerOnly', event.target.value)}>
                        <option value="">不限</option>
                        <option value="true">只看合作项目</option>
                        <option value="false">非合作项目</option>
                      </select>
                    </label>
                  </>
                ) : null}
                {active === 'cases' ? (
                  <>
                    <label className="field">
                      <span>录取结果</span>
                      <select value={filters.result} onChange={(event) => updateFilter('result', event.target.value)}>
                        <option value="">全部</option>
                        {resultOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </label>
                    <TextField label="学生专业" value={filters.major} onChange={(value) => updateFilter('major', value)} placeholder="如：计算机" />
                  </>
                ) : null}
                {active === 'experiences' ? (
                  <label className="field">
                    <span>主题</span>
                    <select value={filters.topic} onChange={(event) => updateFilter('topic', event.target.value)}>
                      <option value="">全部</option>
                      {topicOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                ) : null}
                <TextField label="关键词" value={filters.keyword} onChange={(value) => updateFilter('keyword', value)} placeholder="学校、项目、标题或标签" />
              </div>
              <div className="admin-filter-bar">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? '查询中...' : '查询'}</button>
                <button className="btn ghost" type="button" onClick={() => { setFilters(emptyFilters); setPage(0) }}>清空</button>
                <span className="admin-filter-pill is-active">{activeTab?.label}</span>
                <span className="admin-filter-pill">共 {pageInfo.totalElements} 条</span>
              </div>
              {message ? <div className="admin-note-panel"><p>{message}</p></div> : null}
            </form>

            {active === 'schools' ? (
              <div className="admin-page-action-row" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn primary" type="button" onClick={openCreateModal}>新增院校项目</button>
              </div>
            ) : null}

            <div className="admin-surface-card">
              <div className="track-head">
                <h3>{activeTab?.label}列表</h3>
                <span className="admin-status-chip is-neutral">共 {pageInfo.totalElements} 条</span>
              </div>
              {rows.length === 0 ? (
                <p className="muted">{loading ? '正在加载数据...' : '暂无数据'}</p>
              ) : (
                <div className="admin-record-grid">
                  {active === 'schools' ? rows.map((row) => renderSchoolRow(row, editSchool, deleteRecord)) : null}
                  {active === 'cases' ? rows.map((row) => renderCaseRow(row, deleteRecord)) : null}
                  {active === 'experiences' ? rows.map((row) => renderExperienceRow(row, deleteRecord)) : null}
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

      {showFormModal ? (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 880 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingId ? '编辑院校项目' : '新增院校项目'}</h3>
              <button className="btn ghost" type="button" onClick={closeFormModal}>×</button>
            </div>
            <form onSubmit={saveSchool}>
              <div className="modal-body">
                {renderSchoolForm(schoolForm, updateSchoolForm)}
              </div>
              <div className="modal-actions">
                <button className="btn ghost" type="button" onClick={closeFormModal}>取消</button>
                <button className="btn primary" type="submit" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <article className="admin-summary-card">
      <span className="admin-summary-label">{label}</span>
      <strong className="admin-summary-value">{value ?? '-'}</strong>
      <span className="muted">留学模块当前收录数据</span>
    </article>
  )
}

function renderSchoolForm(form, update) {
  return (
    <div className="filter-grid">
      <CountryField value={form.country} onChange={(value) => update('country', value)} required />
      <TextField label="院校名称" value={form.schoolName} onChange={(value) => update('schoolName', value)} required />
      <TextField label="项目名称" value={form.programName} onChange={(value) => update('programName', value)} required />
      <TextField label="学位" value={form.degree} onChange={(value) => update('degree', value)} required />
      <SelectField label="学科领域" value={form.subjectArea} onChange={(value) => update('subjectArea', value)} options={subjectOptions} required />
      <TextField label="QS 排名" value={form.qsRank} onChange={(value) => update('qsRank', value)} />
      <TextField label="THE 排名" value={form.theRank} onChange={(value) => update('theRank', value)} />
      <TextField label="USNews 排名" value={form.usNewsRank} onChange={(value) => update('usNewsRank', value)} />
      <TextField label="学费范围" value={form.tuitionRange} onChange={(value) => update('tuitionRange', value)} />
      <TextField label="学制" value={form.durationText} onChange={(value) => update('durationText', value)} />
      <TextField label="截止日期说明" value={form.deadlineText} onChange={(value) => update('deadlineText', value)} />
      <TextField label="政策更新时间" value={form.policyUpdatedAt} onChange={(value) => update('policyUpdatedAt', value)} type="date" />
      <label className="field admin-field-wide">
        <span>合作项目</span>
        <div className="admin-inline-checkbox-group">
          <label className="admin-inline-checkbox">
            <input type="checkbox" checked={form.partnerProgram} onChange={(event) => update('partnerProgram', event.target.checked)} />
            <span>标记为本校合作项目</span>
          </label>
        </div>
      </label>
      <TextField label="合作说明" value={form.partnerNote} onChange={(value) => update('partnerNote', value)} />
      <TextField label="避雷标签" value={form.riskTags} onChange={(value) => update('riskTags', value)} placeholder="逗号分隔，如：学费高,竞争激烈" />
      <TextAreaField label="申请要求" value={form.applicationRequirements} onChange={(value) => update('applicationRequirements', value)} />
      <TextAreaField label="签证政策" value={form.visaPolicy} onChange={(value) => update('visaPolicy', value)} />
      <TextAreaField label="就业政策" value={form.employmentPolicy} onChange={(value) => update('employmentPolicy', value)} />
      <TextAreaField label="避雷说明" value={form.riskSummary} onChange={(value) => update('riskSummary', value)} />
      <TextField label="数据来源" value={form.sourceNote} onChange={(value) => update('sourceNote', value)} />
    </div>
  )
}

function renderSchoolRow(row, onEdit, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.schoolName} · {row.programName}</strong>
        <p className="muted">{countryLabelMap[row.country] || row.country} / {row.degree} / {row.subjectArea}</p>
        <div className="admin-record-meta">
          <span>QS: {row.qsRank || '-'}</span>
          <span>{row.partnerProgram ? '本校合作' : '普通项目'}</span>
          <span>{row.deadlineText || '截止日期待补充'}</span>
        </div>
      </div>
      <div className="admin-record-side">
        <span className={`admin-status-chip ${row.partnerProgram ? 'is-success' : 'is-neutral'}`}>
          {row.partnerProgram ? '合作项目' : '非合作'}
        </span>
        <div className="admin-inline-actions">
          <button className="btn outline small" type="button" onClick={() => onEdit(row)}>编辑</button>
          <button className="btn outline-neutral small" type="button" onClick={() => onDelete(row)}>删除</button>
        </div>
      </div>
    </article>
  )
}

function renderCaseRow(row, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.school} · {row.program}</strong>
        <p className="muted">{row.studentMajor} / GPA {row.gpa} / {row.languageType} {row.languageScore}</p>
        <div className="admin-record-meta">
          <span>{countryLabelMap[row.country] || row.country}</span>
          <span>{resultLabelMap[row.admissionResult] || row.admissionResult}</span>
          <span>{formatDate(row.createdAt)}</span>
        </div>
      </div>
      <div className="admin-record-side">
        <span className="admin-status-chip is-neutral">作者 #{row.authorId || '-'}</span>
        <button className="btn outline-neutral small" type="button" onClick={() => onDelete(row)}>删除</button>
      </div>
    </article>
  )
}

function renderExperienceRow(row, onDelete) {
  return (
    <article className="admin-record-card" key={row.id}>
      <div className="admin-record-main">
        <strong>{row.title}</strong>
        <p className="muted">{row.summary}</p>
        <div className="admin-record-meta">
          <span>{countryLabelMap[row.country] || row.country}</span>
          <span>{topicLabelMap[row.topic] || row.topic}</span>
          <span>{formatDate(row.createdAt)}</span>
        </div>
      </div>
      <div className="admin-record-side">
        <span className="admin-status-chip is-neutral">{row.authorName || `作者 #${row.authorId || '-'}`}</span>
        <button className="btn outline-neutral small" type="button" onClick={() => onDelete(row)}>删除</button>
      </div>
    </article>
  )
}

function CountryField({ value, onChange, required = false }) {
  return (
    <label className="field">
      <span>国家 / 地区</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} required={required}>
        {!required ? <option value="">全部</option> : null}
        {countryOptions
          .filter((item) => item.value !== 'General')
          .map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  )
}

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} required={required}>
        {!required ? <option value="">全部</option> : <option value="">请选择</option>}
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  )
}

function TextField({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="field admin-field-wide">
      <span>{label}</span>
      <textarea rows="3" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function formatDate(value) {
  if (!value) return '发布时间待补充'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
