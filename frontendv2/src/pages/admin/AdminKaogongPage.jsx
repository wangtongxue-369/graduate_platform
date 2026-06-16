import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'

const domainTabs = [
  { key: 'jobs', label: '岗位台账', summary: '维护招录岗位、报名窗口和岗位条件。' },
  { key: 'scoreLines', label: '分数线看板', summary: '维护进面分数、招录人数和面试比例。' },
  { key: 'events', label: '考试节点', summary: '维护公告、报名、笔试和面试节点。' },
]

const summaryLoaders = {
  jobs: (token) => adminApi.kaogongJobs({ page: 0, size: 1 }, token),
  scoreLines: (token) => adminApi.kaogongScoreLines({ page: 0, size: 1 }, token),
  events: (token) => adminApi.kaogongCalendarEvents({ page: 0, size: 1 }, token),
}

const defaultFiltersByDomain = {
  jobs: {
    region: '',
    examType: '',
    year: '',
    unitType: '',
    jobCategory: '',
  },
  scoreLines: {
    region: '',
    examType: '',
    year: '',
    unitType: '',
    jobCategory: '',
  },
  events: {
    region: '',
    examType: '',
    year: '',
  },
}

const emptyJobForm = {
  examType: '',
  year: '',
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
  active: true,
}

const emptyScoreLineForm = {
  region: '',
  year: '',
  examType: '',
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
  active: true,
}

const emptyEventForm = {
  region: '',
  examType: '',
  year: '',
  nodeType: '',
  title: '',
  eventDate: '',
  description: '',
  sourceUrl: '',
  active: true,
}

function createInitialForms() {
  return {
    jobs: { ...emptyJobForm },
    scoreLines: { ...emptyScoreLineForm },
    events: { ...emptyEventForm },
  }
}

function createInitialCounts() {
  return {
    jobs: 0,
    scoreLines: 0,
    events: 0,
  }
}

function createInitialPages() {
  return {
    jobs: 0,
    scoreLines: 0,
    events: 0,
  }
}

function createInitialPageMeta() {
  return {
    jobs: { totalElements: 0, totalPages: 1 },
    scoreLines: { totalElements: 0, totalPages: 1 },
    events: { totalElements: 0, totalPages: 1 },
  }
}

function createInitialRows() {
  return {
    jobs: [],
    scoreLines: [],
    events: [],
  }
}

function createInitialFilters() {
  return {
    jobs: { ...defaultFiltersByDomain.jobs },
    scoreLines: { ...defaultFiltersByDomain.scoreLines },
    events: { ...defaultFiltersByDomain.events },
  }
}

function getDomainTitle(domain) {
  return {
    jobs: '岗位台账',
    scoreLines: '分数线看板',
    events: '考试节点',
  }[domain]
}

function getEmptyFormByDomain(domain) {
  if (domain === 'jobs') return { ...emptyJobForm }
  if (domain === 'scoreLines') return { ...emptyScoreLineForm }
  return { ...emptyEventForm }
}

function getCreateButtonLabel(domain) {
  return {
    jobs: '新增岗位',
    scoreLines: '新增分数线',
    events: '新增考试节点',
  }[domain]
}

function normalizeEditValue(row = {}, fallbackForm = {}) {
  return Object.fromEntries(
    Object.keys(fallbackForm).map((key) => {
      const value = row[key]
      if (typeof fallbackForm[key] === 'boolean') {
        return [key, value !== false]
      }
      return [key, value ?? fallbackForm[key]]
    }),
  )
}

function formatDateValue(value) {
  if (!value) return '待补充'
  return String(value)
}

function formatPageNote(page, totalPages) {
  return `第 ${Math.min(page + 1, totalPages)} / ${totalPages} 页`
}

function extractFieldValue(rawValue, fallback = '') {
  if (rawValue === null || rawValue === undefined) return fallback
  return String(rawValue)
}

function JobEditorForm({ form, saving, editingId, onChange, onSubmit, onReset }) {
  return (
    <form className="v2-filter-form" onSubmit={onSubmit}>
      <div className="v2-card-grid v2-card-grid--dense">
        <Field label="岗位名称">
          <input value={form.jobName} onChange={(event) => onChange('jobName', event.target.value)} />
        </Field>
        <Field label="招录单位">
          <input value={form.recruitingUnit} onChange={(event) => onChange('recruitingUnit', event.target.value)} />
        </Field>
        <Field label="地区">
          <input value={form.region} onChange={(event) => onChange('region', event.target.value)} />
        </Field>
        <Field label="考试类型">
          <input value={form.examType} onChange={(event) => onChange('examType', event.target.value)} />
        </Field>
        <Field label="年份">
          <input value={form.year} onChange={(event) => onChange('year', event.target.value)} />
        </Field>
        <Field label="单位类型">
          <input value={form.unitType} onChange={(event) => onChange('unitType', event.target.value)} />
        </Field>
        <Field label="岗位类别">
          <input value={form.jobCategory} onChange={(event) => onChange('jobCategory', event.target.value)} />
        </Field>
        <Field label="招录人数">
          <input type="number" value={form.recruitCount} onChange={(event) => onChange('recruitCount', event.target.value)} />
        </Field>
        <Field label="学历要求">
          <input value={form.educationRequirement} onChange={(event) => onChange('educationRequirement', event.target.value)} />
        </Field>
        <Field label="专业要求">
          <input value={form.majorRequirement} onChange={(event) => onChange('majorRequirement', event.target.value)} />
        </Field>
        <Field label="报名开始">
          <input type="date" value={form.registrationStart} onChange={(event) => onChange('registrationStart', event.target.value)} />
        </Field>
        <Field label="报名结束">
          <input type="date" value={form.registrationEnd} onChange={(event) => onChange('registrationEnd', event.target.value)} />
        </Field>
      </div>

      <Field label="备注">
        <textarea rows={4} value={form.remark} onChange={(event) => onChange('remark', event.target.value)} />
      </Field>

      <div className="v2-inline-actions">
        <button className="v2-segment-button is-active" disabled={saving} type="submit">
          {saving ? '保存中…' : editingId ? '保存岗位修改' : '新增岗位记录'}
        </button>
        <button className="v2-segment-button" type="button" onClick={onReset}>
          重置表单
        </button>
      </div>
    </form>
  )
}

function ScoreLineEditorForm({ form, saving, editingId, onChange, onSubmit, onReset }) {
  return (
    <form className="v2-filter-form" onSubmit={onSubmit}>
      <div className="v2-card-grid v2-card-grid--dense">
        <Field label="岗位名称">
          <input value={form.jobName} onChange={(event) => onChange('jobName', event.target.value)} />
        </Field>
        <Field label="招录单位">
          <input value={form.recruitingUnit} onChange={(event) => onChange('recruitingUnit', event.target.value)} />
        </Field>
        <Field label="地区">
          <input value={form.region} onChange={(event) => onChange('region', event.target.value)} />
        </Field>
        <Field label="考试类型">
          <input value={form.examType} onChange={(event) => onChange('examType', event.target.value)} />
        </Field>
        <Field label="年份">
          <input value={form.year} onChange={(event) => onChange('year', event.target.value)} />
        </Field>
        <Field label="单位类型">
          <input value={form.unitType} onChange={(event) => onChange('unitType', event.target.value)} />
        </Field>
        <Field label="岗位类别">
          <input value={form.jobCategory} onChange={(event) => onChange('jobCategory', event.target.value)} />
        </Field>
        <Field label="进面分数线">
          <input type="number" step="0.1" value={form.scoreLine} onChange={(event) => onChange('scoreLine', event.target.value)} />
        </Field>
        <Field label="面试比例">
          <input value={form.interviewRatio} onChange={(event) => onChange('interviewRatio', event.target.value)} />
        </Field>
        <Field label="招录人数">
          <input type="number" value={form.recruitCount} onChange={(event) => onChange('recruitCount', event.target.value)} />
        </Field>
        <Field label="进面人数">
          <input type="number" value={form.interviewCount} onChange={(event) => onChange('interviewCount', event.target.value)} />
        </Field>
      </div>

      <Field label="数据说明">
        <textarea rows={4} value={form.dataNote} onChange={(event) => onChange('dataNote', event.target.value)} />
      </Field>

      <div className="v2-inline-actions">
        <button className="v2-segment-button is-active" disabled={saving} type="submit">
          {saving ? '保存中…' : editingId ? '保存分数线修改' : '新增分数线记录'}
        </button>
        <button className="v2-segment-button" type="button" onClick={onReset}>
          重置表单
        </button>
      </div>
    </form>
  )
}

function EventEditorForm({ form, saving, editingId, onChange, onSubmit, onReset }) {
  return (
    <form className="v2-filter-form" onSubmit={onSubmit}>
      <div className="v2-card-grid v2-card-grid--dense">
        <Field label="标题">
          <input value={form.title} onChange={(event) => onChange('title', event.target.value)} />
        </Field>
        <Field label="地区">
          <input value={form.region} onChange={(event) => onChange('region', event.target.value)} />
        </Field>
        <Field label="考试类型">
          <input value={form.examType} onChange={(event) => onChange('examType', event.target.value)} />
        </Field>
        <Field label="年份">
          <input value={form.year} onChange={(event) => onChange('year', event.target.value)} />
        </Field>
        <Field label="节点类型">
          <input value={form.nodeType} onChange={(event) => onChange('nodeType', event.target.value)} />
        </Field>
        <Field label="日期">
          <input type="date" value={form.eventDate} onChange={(event) => onChange('eventDate', event.target.value)} />
        </Field>
      </div>

      <Field label="说明">
        <textarea rows={4} value={form.description} onChange={(event) => onChange('description', event.target.value)} />
      </Field>

      <div className="v2-inline-actions">
        <button className="v2-segment-button is-active" disabled={saving} type="submit">
          {saving ? '保存中…' : editingId ? '保存节点修改' : '新增节点记录'}
        </button>
        <button className="v2-segment-button" type="button" onClick={onReset}>
          重置表单
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function RowActions({ id, onEdit, onDisable }) {
  return (
    <div className="v2-inline-actions">
      <button className="v2-segment-button is-active" type="button" aria-label={`编辑记录 ${id}`} onClick={() => onEdit(id)}>
        编辑
      </button>
      <button className="v2-segment-button" type="button" aria-label={`停用记录 ${id}`} onClick={() => onDisable(id)}>
        停用
      </button>
    </div>
  )
}

export default function AdminKaogongPage() {
  const { token } = useAuth()
  const [activeDomain, setActiveDomain] = useState('jobs')
  const [filtersByDomain, setFiltersByDomain] = useState(createInitialFilters)
  const [rowsByDomain, setRowsByDomain] = useState(createInitialRows)
  const [pageByDomain, setPageByDomain] = useState(createInitialPages)
  const [pageMetaByDomain, setPageMetaByDomain] = useState(createInitialPageMeta)
  const [counts, setCounts] = useState(createInitialCounts)
  const [forms, setForms] = useState(createInitialForms)
  const [editing, setEditing] = useState({ domain: '', id: null })
  const [editorOpen, setEditorOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const activeFilters = filtersByDomain[activeDomain]
  const activeRows = rowsByDomain[activeDomain]
  const activePage = pageByDomain[activeDomain]
  const activePageMeta = pageMetaByDomain[activeDomain]
  const activeForm = forms[activeDomain]
  const editingId = editing.domain === activeDomain ? editing.id : null
  const activeTabMeta = domainTabs.find((item) => item.key === activeDomain)

  const rightRailChecklist = useMemo(() => (
    {
      jobs: [
        '岗位台账优先保证地区、考试类型和岗位名称稳定，学生端匹配才不会漂移。',
        '报名起止时间放进表单主区，避免和筛选条件挤在一起。',
      ],
      scoreLines: [
        '分数线要和岗位上下文一起录，避免“同名岗位”跨地区串改。',
        '如果只有单年数据，先补来源与说明，方便后续追溯。',
      ],
      events: [
        '考试节点按一场考试的时间链组织，主区先看顺序，右侧再做编辑。',
        '节点标题和节点类型分开录，学生端时间墙会直接使用这两个字段。',
      ],
    }[activeDomain]
  ), [activeDomain])

  async function loadSummaryCounts() {
    try {
      const [jobs, scoreLines, events] = await Promise.all([
        summaryLoaders.jobs(token),
        summaryLoaders.scoreLines(token),
        summaryLoaders.events(token),
      ])
      setCounts({
        jobs: Number(jobs?.totalElements || 0),
        scoreLines: Number(scoreLines?.totalElements || 0),
        events: Number(events?.totalElements || 0),
      })
    } catch {
      setCounts(createInitialCounts())
    }
  }

  async function loadActiveDomain({ keepNotice = true } = {}) {
    setLoading(true)
    try {
      const page = pageByDomain[activeDomain]
      const filters = filtersByDomain[activeDomain]
      const params = {
        ...filters,
        page,
        size: 10,
      }
      const data = activeDomain === 'jobs'
        ? await adminApi.kaogongJobs(params, token)
        : activeDomain === 'scoreLines'
          ? await adminApi.kaogongScoreLines(params, token)
          : await adminApi.kaogongCalendarEvents(params, token)

      setRowsByDomain((current) => ({
        ...current,
        [activeDomain]: data?.content || [],
      }))
      setPageMetaByDomain((current) => ({
        ...current,
        [activeDomain]: {
          totalElements: Number(data?.totalElements || 0),
          totalPages: Math.max(1, Number(data?.totalPages || 1)),
        },
      }))
      if (keepNotice) {
        setNotice(`${getDomainTitle(activeDomain)}已同步后端数据。`)
      }
    } catch (error) {
      setRowsByDomain((current) => ({ ...current, [activeDomain]: [] }))
      setPageMetaByDomain((current) => ({
        ...current,
        [activeDomain]: { totalElements: 0, totalPages: 1 },
      }))
      setNotice(error.message || `${getDomainTitle(activeDomain)}加载失败。`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummaryCounts()
  }, [token])

  useEffect(() => {
    loadActiveDomain()
  }, [activeDomain, pageByDomain, filtersByDomain, token])

  function updateFilter(field, value) {
    setPageByDomain((current) => ({ ...current, [activeDomain]: 0 }))
    setFiltersByDomain((current) => ({
      ...current,
      [activeDomain]: {
        ...current[activeDomain],
        [field]: value,
      },
    }))
  }

  function resetFilters() {
    setPageByDomain((current) => ({ ...current, [activeDomain]: 0 }))
    setFiltersByDomain((current) => ({
      ...current,
      [activeDomain]: { ...defaultFiltersByDomain[activeDomain] },
    }))
  }

  function changePage(nextPage) {
    setPageByDomain((current) => ({
      ...current,
      [activeDomain]: nextPage,
    }))
  }

  function updateActiveForm(field, value) {
    setForms((current) => ({
      ...current,
      [activeDomain]: {
        ...current[activeDomain],
        [field]: value,
      },
    }))
  }

  function resetEditor() {
    setEditing({ domain: '', id: null })
    setForms((current) => ({
      ...current,
      [activeDomain]: getEmptyFormByDomain(activeDomain),
    }))
  }

  function openCreateEditor() {
    setEditing({ domain: '', id: null })
    setForms((current) => ({
      ...current,
      [activeDomain]: getEmptyFormByDomain(activeDomain),
    }))
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditorOpen(false)
    resetEditor()
  }

  function startEditById(id) {
    const row = rowsByDomain[activeDomain].find((item) => item.id === id)
    if (!row) return

    setEditing({ domain: activeDomain, id })
    setForms((current) => ({
      ...current,
      [activeDomain]: activeDomain === 'jobs'
        ? normalizeEditValue(row, emptyJobForm)
        : activeDomain === 'scoreLines'
          ? normalizeEditValue(row, emptyScoreLineForm)
          : normalizeEditValue(row, emptyEventForm),
    }))
    setEditorOpen(true)
    setNotice(`已载入${getDomainTitle(activeDomain)}编辑态。`)
  }

  async function handleDisable(id) {
    try {
      if (activeDomain === 'jobs') {
        await adminApi.deleteKaogongJob(id, token)
      } else if (activeDomain === 'scoreLines') {
        await adminApi.deleteKaogongScoreLine(id, token)
      } else {
        await adminApi.deleteKaogongCalendarEvent(id, token)
      }
      setNotice(`${getDomainTitle(activeDomain)}已停用。`)
      await Promise.all([
        loadSummaryCounts(),
        loadActiveDomain({ keepNotice: false }),
      ])
    } catch (error) {
      setNotice(error.message || `${getDomainTitle(activeDomain)}停用失败。`)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      if (activeDomain === 'jobs') {
        if (editingId) {
          await adminApi.updateKaogongJob(editingId, activeForm, token)
        } else {
          await adminApi.createKaogongJob(activeForm, token)
        }
      } else if (activeDomain === 'scoreLines') {
        if (editingId) {
          await adminApi.updateKaogongScoreLine(editingId, activeForm, token)
        } else {
          await adminApi.createKaogongScoreLine(activeForm, token)
        }
      } else if (editingId) {
        await adminApi.updateKaogongCalendarEvent(editingId, activeForm, token)
      } else {
        await adminApi.createKaogongCalendarEvent(activeForm, token)
      }

      setNotice(editingId ? `${getDomainTitle(activeDomain)}修改已保存。` : `${getDomainTitle(activeDomain)}新增完成。`)
      resetEditor()
      setEditorOpen(false)
      await Promise.all([
        loadSummaryCounts(),
        loadActiveDomain({ keepNotice: false }),
      ])
    } catch (error) {
      setNotice(error.message || `${getDomainTitle(activeDomain)}保存失败。`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考公治理"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考公治理' },
          ]}
          title="考公数据治理工作台"
          lead="按岗位、分数线和考试节点分轨维护，筛选留在右侧，新增和编辑进入弹窗处理。"
          actions={(
            <>
              <button className="v2-segment-button is-active" type="button" onClick={openCreateEditor}>
                {getCreateButtonLabel(activeDomain)}
              </button>
              <Link className="v2-secondary-link" to="/admin/employment">查看就业运营</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新考公治理工位…</div> : null}

        <section className="v2-summary-strip v2-admin-kaogong-metrics" aria-label="考公治理摘要">
          <article className="v2-summary-card">
            <span>岗位记录</span>
            <strong>{counts.jobs}</strong>
            <p>{activeDomain === 'jobs' ? '当前维护轨道' : '匹配、收藏和报名窗口依赖此台账'}</p>
          </article>
          <article className="v2-summary-card">
            <span>分数线记录</span>
            <strong>{counts.scoreLines}</strong>
            <p>{activeDomain === 'scoreLines' ? '当前维护轨道' : '用于学生端进面线索回看'}</p>
          </article>
          <article className="v2-summary-card">
            <span>考试节点</span>
            <strong>{counts.events}</strong>
            <p>{activeDomain === 'events' ? '当前维护轨道' : '驱动考试日历和首页倒计时'}</p>
          </article>
        </section>

        <section className="v2-side-card v2-admin-kaogong-toolbar">
          <div className="v2-segment-group v2-admin-kaogong-tabs" role="group" aria-label="考公治理视图">
            {domainTabs.map((item) => (
              <button
                className={`v2-segment-button ${activeDomain === item.key ? 'is-active' : ''}`}
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveDomain(item.key)
                  setEditing({ domain: '', id: null })
                  setEditorOpen(false)
                }}
              >
                {item.label}
                <span>{counts[item.key]} 条</span>
              </button>
            ))}
          </div>
          <button className="v2-segment-button is-active" type="button" onClick={openCreateEditor}>
            {getCreateButtonLabel(activeDomain)}
          </button>
        </section>

        <section className="v2-card-grid v2-card-grid--dense" aria-label={`${activeTabMeta?.label || '考公治理'}记录列表`}>
          {activeRows.map((row) => (
            <article className="v2-module-card" key={row.id}>
              {activeDomain === 'jobs' ? (
                <>
                  <div className="v2-kaogong-admin-card-head">
                    <div>
                      <strong>{row.jobName}</strong>
                      <p>{row.recruitingUnit}</p>
                    </div>
                    <span className={`v2-plan-status-pill ${row.active === false ? '' : 'is-checked'}`}>
                      {row.active === false ? '已停用' : '启用中'}
                    </span>
                  </div>
                  <div className="v2-tag-row">
                    <span>{extractFieldValue(row.region, '地区待补充')}</span>
                    <span>{extractFieldValue(row.examType, '考试类型待补充')}</span>
                    <span>{extractFieldValue(row.jobCategory, '岗位类别待补充')}</span>
                  </div>
                  <p>{`报名 ${formatDateValue(row.registrationStart)} 至 ${formatDateValue(row.registrationEnd)}`}</p>
                  <RowActions id={row.id} onEdit={startEditById} onDisable={handleDisable} />
                </>
              ) : null}

              {activeDomain === 'scoreLines' ? (
                <>
                  <div className="v2-kaogong-admin-card-head">
                    <div>
                      <strong>{row.jobName}</strong>
                      <p>{row.recruitingUnit}</p>
                    </div>
                    <span className={`v2-plan-status-pill ${row.active === false ? '' : 'is-checked'}`}>
                      {row.active === false ? '已停用' : '启用中'}
                    </span>
                  </div>
                  <div className="v2-tag-row">
                    <span>{extractFieldValue(row.region, '地区待补充')}</span>
                    <span>{extractFieldValue(row.year, '年份待补充')}</span>
                    <span>{extractFieldValue(row.interviewRatio, '面试比例待补充')}</span>
                  </div>
                  <p>{`进面分数 ${extractFieldValue(row.scoreLine, '待补充')} / 招录 ${extractFieldValue(row.recruitCount, '待补充')}`}</p>
                  <RowActions id={row.id} onEdit={startEditById} onDisable={handleDisable} />
                </>
              ) : null}

              {activeDomain === 'events' ? (
                <>
                  <div className="v2-kaogong-admin-card-head">
                    <div>
                      <strong>{row.title}</strong>
                      <p>{row.examType}</p>
                    </div>
                    <span className={`v2-plan-status-pill ${row.active === false ? '' : 'is-checked'}`}>
                      {row.active === false ? '已停用' : '启用中'}
                    </span>
                  </div>
                  <div className="v2-tag-row">
                    <span>{extractFieldValue(row.region, '地区待补充')}</span>
                    <span>{extractFieldValue(row.nodeType, '节点类型待补充')}</span>
                    <span>{formatDateValue(row.eventDate)}</span>
                  </div>
                  <p>{extractFieldValue(row.description, '当前节点还没有说明。')}</p>
                  <RowActions id={row.id} onEdit={startEditById} onDisable={handleDisable} />
                </>
              ) : null}
            </article>
          ))}

          {!activeRows.length ? (
            <article className="v2-empty-card v2-kaogong-admin-empty">
              <strong>当前筛选下还没有记录</strong>
              <p>可以先放宽筛选，或者点击上方新增按钮录入这一轨的第一条数据。</p>
            </article>
          ) : null}
        </section>

        <section className="v2-pagination-row" aria-label={`${activeTabMeta?.label || '考公治理'}分页`}>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || activePage <= 0}
            onClick={() => changePage(activePage - 1)}
          >
            上一页
          </button>
          <span className="v2-pagination-note">{formatPageNote(activePage, activePageMeta.totalPages)}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || activePage >= activePageMeta.totalPages - 1}
            onClick={() => changePage(activePage + 1)}
          >
            下一页
          </button>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">当前轨道</p>
              <h3>{activeTabMeta?.label}</h3>
            </div>
            <span className="v2-plan-status-pill">{activePageMeta.totalElements} 条</span>
          </div>
          <p>{activeTabMeta?.summary}</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <Field label="筛选地区">
              <input placeholder="如：北京 / 上海" value={activeFilters.region} onChange={(event) => updateFilter('region', event.target.value)} />
            </Field>
            <Field label="筛选考试类型">
              <input placeholder="如：国家公务员考试" value={activeFilters.examType} onChange={(event) => updateFilter('examType', event.target.value)} />
            </Field>
            <Field label="筛选年份">
              <input placeholder="如：2027" value={activeFilters.year} onChange={(event) => updateFilter('year', event.target.value)} />
            </Field>
            {activeDomain !== 'events' ? (
              <>
                <Field label="筛选单位类型">
                  <input placeholder="如：税务 / 海关" value={activeFilters.unitType} onChange={(event) => updateFilter('unitType', event.target.value)} />
                </Field>
                <Field label="筛选岗位类别">
                  <input placeholder="如：综合管理" value={activeFilters.jobCategory} onChange={(event) => updateFilter('jobCategory', event.target.value)} />
                </Field>
              </>
            ) : null}
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit" onClick={() => loadActiveDomain()}>
                应用筛选
              </button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置筛选</button>
            </div>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">治理提示</p>
          <div className="v2-check-list">
            {rightRailChecklist.map((item) => (
              <div className="v2-check-row" key={item}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>

      {editorOpen ? (
        <div className="v2-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-kaogong-editor-title">
          <section className="v2-modal-card v2-admin-kaogong-editor-modal">
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">{editingId ? '编辑记录' : '新增记录'}</p>
                <h3 id="admin-kaogong-editor-title">
                  {editingId ? `编辑${activeTabMeta?.label}` : getCreateButtonLabel(activeDomain)}
                </h3>
              </div>
              <button className="v2-secondary-link" type="button" onClick={closeEditor}>
                关闭
              </button>
            </div>

            {activeDomain === 'jobs' ? (
              <JobEditorForm
                editingId={editingId}
                form={activeForm}
                onChange={updateActiveForm}
                onReset={resetEditor}
                onSubmit={handleSubmit}
                saving={saving}
              />
            ) : null}

            {activeDomain === 'scoreLines' ? (
              <ScoreLineEditorForm
                editingId={editingId}
                form={activeForm}
                onChange={updateActiveForm}
                onReset={resetEditor}
                onSubmit={handleSubmit}
                saving={saving}
              />
            ) : null}

            {activeDomain === 'events' ? (
              <EventEditorForm
                editingId={editingId}
                form={activeForm}
                onChange={updateActiveForm}
                onReset={resetEditor}
                onSubmit={handleSubmit}
                saving={saving}
              />
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}
