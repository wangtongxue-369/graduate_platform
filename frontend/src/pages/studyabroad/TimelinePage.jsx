import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import {
  defaultApplicationItems,
  defaultTimelineItems,
  getApplicationItems,
  getTimelineItems,
  saveTimelineItems,
} from './studyAbroadStorage.js'
import {
  addMonthsDate,
  appLabel,
  createLocalId,
  daysLeft,
  deadlineText,
  findApplication,
  normalizeApplicationId,
  urgencyClass,
} from './studyAbroadUtils.js'
import '../../App.css'

const statusLabels = {
  todo: '待开始',
  doing: '进行中',
  done: '已完成',
}

const phaseOptions = [
  { value: 'all', label: '全部阶段' },
  { value: 'Language test', label: '语言考试' },
  { value: 'School selection', label: '选校定位' },
  { value: 'Documents', label: '文书材料' },
  { value: 'Submission', label: '网申提交' },
  { value: 'Interview', label: '面试' },
  { value: 'Visa', label: '签证' },
]

const phaseLabelMap = Object.fromEntries(phaseOptions.map((item) => [item.value, item.label]))

const emptyForm = {
  applicationId: '',
  title: '',
  country: 'UK',
  school: '',
  phase: 'Documents',
  dueDate: addMonthsDate(3),
  note: '',
}

function toTimelinePayload(item, canUseRemote) {
  return {
    applicationId: normalizeApplicationId(item.applicationId, canUseRemote),
    title: item.title,
    country: item.country,
    school: item.school,
    phase: item.phase,
    dueDate: item.dueDate,
    status: item.status,
    note: item.note,
  }
}

function formFromItem(item) {
  return {
    applicationId: item.applicationId ? String(item.applicationId) : '',
    title: item.title || '',
    country: item.country || 'UK',
    school: item.school || '',
    phase: item.phase || 'Documents',
    dueDate: item.dueDate || addMonthsDate(3),
    note: item.note || '',
  }
}

export default function TimelinePage() {
  const { token } = useAuth()
  const isDevMode = token === 'dev-token'
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const [items, setItems] = useState(() => (canUseRemote ? [] : isDevMode ? getTimelineItems() : defaultTimelineItems))
  const [applications, setApplications] = useState(() => (canUseRemote ? [] : isDevMode ? getApplicationItems() : defaultApplicationItems))
  const [phase, setPhase] = useState('all')
  const [syncNote, setSyncNote] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!canUseRemote) {
      setItems(isDevMode ? getTimelineItems() : defaultTimelineItems)
      setApplications(isDevMode ? getApplicationItems() : defaultApplicationItems)
      setSyncNote(isDevMode
        ? '当前是开发演示账号，时间线只保存到本机 localStorage。'
        : '请登录后管理真实时间线。未登录时仅展示示例数据。')
      return undefined
    }
    let active = true

    async function loadRemoteData() {
      setLoading(true)
      try {
        const [remoteApplications, remoteItems] = await Promise.all([
          studyAbroadApi.applications(token),
          studyAbroadApi.timeline(token),
        ])
        if (active) {
          setApplications(remoteApplications)
          setItems(remoteItems)
          setSyncNote('已从后端加载时间线和申请项目。')
        }
      } catch (error) {
        if (active) {
          setApplications([])
          setItems([])
          setSyncNote(error.message || '后端数据加载失败，请稍后重试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRemoteData()
    return () => {
      active = false
    }
  }, [canUseRemote, isDevMode, token])

  function updateLocalItems(nextItems) {
    setItems(nextItems)
    saveTimelineItems(nextItems)
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleApplicationChange(value) {
    const app = findApplication(applications, value)
    setForm((current) => ({
      ...current,
      applicationId: value,
      country: app?.country || current.country,
      school: app?.school || current.school,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  const filteredItems = useMemo(() => {
    const nextItems = phase === 'all'
      ? items
      : items.filter((item) => item.phase === phase)
    return [...nextItems].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  }, [items, phase])

  const stats = useMemo(() => {
    const done = items.filter((item) => item.status === 'done').length
    const doing = items.filter((item) => item.status === 'doing').length
    const overdue = items.filter((item) => {
      const left = daysLeft(item.dueDate)
      return item.status !== 'done' && left !== null && left < 0
    }).length
    const rate = items.length ? Math.round((done / items.length) * 100) : 0
    return { done, doing, overdue, rate }
  }, [items])

  function enrichWithApplication(payload) {
    const app = findApplication(applications, payload.applicationId)
    return {
      ...payload,
      applicationSchool: app?.school || null,
      applicationProgram: app?.program || null,
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setSyncNote('请填写时间线事项标题。')
      return
    }

    const existing = items.find((item) => item.id === editingId)
    const payload = {
      applicationId: normalizeApplicationId(form.applicationId, canUseRemote),
      title,
      country: form.country.trim() || '未指定',
      school: form.school.trim() || '待定院校',
      phase: form.phase,
      dueDate: form.dueDate,
      status: existing?.status || 'todo',
      note: form.note.trim() || '暂无备注',
    }

    if (canUseRemote) {
      try {
        const saved = editingId
          ? await studyAbroadApi.updateTimeline(editingId, payload, token)
          : await studyAbroadApi.createTimeline(payload, token)
        setItems((current) => {
          const next = editingId
            ? current.map((item) => (item.id === editingId ? saved : item))
            : [...current, saved]
          return next.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
        })
        setSyncNote(editingId ? '时间线事项已更新。' : '时间线事项已保存到后端。')
      } catch (error) {
        setSyncNote(error.message || '保存失败。')
        return
      }
    } else if (isDevMode) {
      const saved = {
        id: editingId || createLocalId('timeline'),
        ...enrichWithApplication(payload),
      }
      const next = editingId
        ? items.map((item) => (item.id === editingId ? saved : item))
        : [...items, saved]
      updateLocalItems(next.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))))
      setSyncNote(editingId ? '本地演示时间线已更新。' : '本地演示时间线已创建。')
    } else {
      setSyncNote('请先登录真实账号，再保存时间线事项。')
      return
    }
    resetForm()
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm(formFromItem(item))
  }

  async function cycleStatus(targetId) {
    const order = ['todo', 'doing', 'done']
    const targetItem = items.find((item) => item.id === targetId)
    if (!targetItem) return
    const nextIndex = (order.indexOf(targetItem.status) + 1) % order.length
    const nextItem = { ...targetItem, status: order[nextIndex] }

    if (canUseRemote) {
      try {
        const updated = await studyAbroadApi.updateTimeline(targetId, toTimelinePayload(nextItem, canUseRemote), token)
        setItems(items.map((item) => (item.id === targetId ? updated : item)))
        setSyncNote('时间线状态已同步。')
      } catch (error) {
        setSyncNote(error.message || '状态同步失败。')
      }
      return
    }

    if (isDevMode) {
      updateLocalItems(items.map((item) => (item.id === targetId ? nextItem : item)))
      return
    }
    setSyncNote('请先登录真实账号，再更新时间线状态。')
  }

  async function removeItem(targetId) {
    if (!window.confirm('确认删除这个时间线事项吗？')) return
    if (canUseRemote) {
      try {
        await studyAbroadApi.deleteTimeline(targetId, token)
        setItems(items.filter((item) => item.id !== targetId))
        setSyncNote('时间线事项已删除。')
      } catch (error) {
        setSyncNote(error.message || '删除失败。')
      }
      return
    }
    if (isDevMode) {
      updateLocalItems(items.filter((item) => item.id !== targetId))
      setSyncNote('本地演示时间线已删除。')
      return
    }
    setSyncNote('请先登录真实账号，再删除时间线事项。')
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 时间线</p>
              <h2>申请时间线</h2>
              <p className="muted">创建、编辑并推进语言考试、文书、网申、面试和签证节点。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="grid-two">
            <form className="feature-card" onSubmit={handleSubmit}>
              <div className="section-head compact">
                <h2>{editingId ? '编辑时间线事项' : '新增时间线事项'}</h2>
                <button className="btn outline small" type="button" onClick={resetForm}>清空</button>
              </div>
              <label className="field">
                <span>关联申请项目</span>
                <select value={form.applicationId} onChange={(event) => handleApplicationChange(event.target.value)}>
                  <option value="">通用事项 / 不关联项目</option>
                  {applications.map((item) => (
                    <option key={item.id} value={String(item.id)}>{appLabel(item)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>事项标题</span>
                <input
                  type="text"
                  value={form.title}
                  placeholder="例如：完成第二版 PS"
                  onChange={(event) => updateForm('title', event.target.value)}
                />
              </label>
              <div className="grid-two compact">
                <label className="field">
                  <span>国家 / 地区</span>
                  <input type="text" value={form.country} onChange={(event) => updateForm('country', event.target.value)} />
                </label>
                <label className="field">
                  <span>目标院校</span>
                  <input
                    type="text"
                    value={form.school}
                    placeholder="选择项目后自动带出"
                    onChange={(event) => updateForm('school', event.target.value)}
                  />
                </label>
              </div>
              <div className="grid-two compact">
                <label className="field">
                  <span>阶段</span>
                  <select value={form.phase} onChange={(event) => updateForm('phase', event.target.value)}>
                    {phaseOptions.slice(1).map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>截止日期</span>
                  <input type="date" value={form.dueDate} onChange={(event) => updateForm('dueDate', event.target.value)} />
                </label>
              </div>
              <label className="field">
                <span>备注</span>
                <textarea
                  rows="3"
                  value={form.note}
                  placeholder="记录材料要求、负责人或下一步动作"
                  onChange={(event) => updateForm('note', event.target.value)}
                />
              </label>
              <button className="btn primary" type="submit">{editingId ? '保存修改' : '添加事项'}</button>
            </form>

            <div className="feature-card metrics">
              <div className="card-title">进度概览</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{items.length}</div>
                  <div className="mini-label">全部事项</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{stats.doing}</div>
                  <div className="mini-label">进行中</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{stats.overdue}</div>
                  <div className="mini-label">已逾期</div>
                </div>
              </div>
              <div className="progress-block">
                <div className="progress-label">完成度 {stats.rate}%</div>
                <div className="progress-bar"><span style={{ width: `${stats.rate}%` }} /></div>
              </div>
              {syncNote ? <div className="notice-box"><p className="muted">{syncNote}</p></div> : null}
              <label className="field">
                <span>阶段筛选</span>
                <select value={phase} onChange={(event) => setPhase(event.target.value)}>
                  {phaseOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="study-list">
            {filteredItems.map((item) => {
              const left = daysLeft(item.dueDate)
              return (
                <article className={`study-row ${item.status !== 'done' && left !== null && left < 0 ? 'is-overdue' : item.status !== 'done' && left !== null && left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                  <div className={`study-status ${item.status}`}>{statusLabels[item.status]}</div>
                  <div className="study-row-main">
                    <div className="study-row-title">{item.title}</div>
                    <div className="detail-meta">
                      <span>{item.country}</span>
                      <span>{item.school}</span>
                      <span>{phaseLabelMap[item.phase] || item.phase}</span>
                      <span>{item.dueDate}</span>
                    </div>
                    {item.applicationSchool ? (
                      <div className="tag-row">
                        <span className="tag subtle">{item.applicationSchool}</span>
                        <span className="tag subtle">{item.applicationProgram}</span>
                      </div>
                    ) : null}
                    <p className="muted">{item.note}</p>
                  </div>
                  <div className="study-row-side">
                    <span className={`tag ${item.status === 'done' ? 'subtle' : urgencyClass(left)}`}>{deadlineText(left)}</span>
                    <button className="btn ghost small" type="button" onClick={() => cycleStatus(item.id)}>切换状态</button>
                    <button className="btn outline small" type="button" onClick={() => startEdit(item)}>编辑</button>
                    <button className="btn outline small" type="button" onClick={() => removeItem(item.id)}>删除</button>
                  </div>
                </article>
              )
            })}
            {loading ? (
              <div className="notice-box"><p className="muted">正在加载时间线...</p></div>
            ) : null}
            {!loading && !filteredItems.length ? (
              <div className="notice-box">
                <strong>没有匹配的时间线事项</strong>
                <p className="muted">可以调整阶段筛选，或新增一个申请节点。</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
