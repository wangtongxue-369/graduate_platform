import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import {
  defaultApplicationItems,
  defaultMaterialItems,
  getApplicationItems,
  getMaterialItems,
  saveMaterialItems,
} from './studyAbroadStorage.js'
import '../../App.css'

const countries = ['全部国家', 'General', 'UK', 'US', 'Australia', 'Canada', 'Singapore']
const countryLabelMap = {
  General: '通用',
}

const stageOptions = [
  { value: 'all', label: '全部阶段' },
  { value: 'Identity', label: '身份材料' },
  { value: 'Academic', label: '学术材料' },
  { value: 'Language test', label: '语言考试' },
  { value: 'Documents', label: '文书材料' },
  { value: 'Submission', label: '网申提交' },
  { value: 'Visa', label: '签证' },
]

const stageLabelMap = Object.fromEntries(stageOptions.map((item) => [item.value, item.label]))

const emptyForm = {
  applicationId: '',
  title: '',
  country: 'General',
  stage: 'Documents',
  category: 'Writing',
  deadline: '2026-08-01',
  note: '',
}

function daysLeft(dateText) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateText}T00:00:00`)
  return Math.ceil((target - today) / 86400000)
}

function deadlineText(left) {
  if (left < 0) return `已逾期 ${Math.abs(left)} 天`
  if (left === 0) return '今天截止'
  if (left <= 7) return `${left} 天内截止`
  return `${left} 天后截止`
}

function urgencyClass(left) {
  if (left < 0) return 'danger'
  if (left <= 7) return 'warning'
  return 'subtle'
}

function createId() {
  return `material-${Date.now()}`
}

function appLabel(app) {
  return `${app.school} / ${app.program}`
}

function findApplication(applications, id) {
  return applications.find((item) => String(item.id) === String(id))
}

function normalizeApplicationId(value, canUseRemote) {
  if (!value) return null
  return canUseRemote ? Number(value) : value
}

function toMaterialPayload(item, canUseRemote) {
  return {
    applicationId: normalizeApplicationId(item.applicationId, canUseRemote),
    title: item.title,
    country: item.country,
    stage: item.stage,
    category: item.category,
    deadline: item.deadline,
    completed: item.completed,
    note: item.note,
  }
}

function formFromItem(item) {
  return {
    applicationId: item.applicationId ? String(item.applicationId) : '',
    title: item.title || '',
    country: item.country || 'General',
    stage: item.stage || 'Documents',
    category: item.category || 'Other',
    deadline: item.deadline || '2026-08-01',
    note: item.note || '',
  }
}

function formatFileSize(size) {
  if (!size) return '未知大小'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function SAMaterialsPage() {
  const { token } = useAuth()
  const isDevMode = token === 'dev-token'
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const [items, setItems] = useState(() => (isDevMode ? getMaterialItems() : defaultMaterialItems))
  const [applications, setApplications] = useState(() => (isDevMode ? getApplicationItems() : defaultApplicationItems))
  const [filters, setFilters] = useState({ country: '全部国家', stage: 'all', keyword: '' })
  const [syncNote, setSyncNote] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})

  useEffect(() => {
    if (!canUseRemote) {
      setItems(isDevMode ? getMaterialItems() : defaultMaterialItems)
      setApplications(isDevMode ? getApplicationItems() : defaultApplicationItems)
      setSyncNote(isDevMode
        ? '当前是开发演示账号，材料条目只保存到本机，附件上传需要真实登录。'
        : '请登录后管理真实材料和附件。未登录时仅展示示例清单。')
      return undefined
    }
    let active = true

    async function loadRemoteData() {
      try {
        const [remoteApplications, remoteItems] = await Promise.all([
          studyAbroadApi.applications(token),
          studyAbroadApi.materials(token),
        ])
        if (active) {
          setApplications(remoteApplications)
          setItems(remoteItems)
          setSyncNote('已从后端加载材料清单和附件。')
        }
      } catch (error) {
        if (active) {
          setApplications([])
          setItems([])
          setSyncNote(error.message || '后端数据加载失败，请稍后重试。')
        }
      }
    }

    loadRemoteData()
    return () => {
      active = false
    }
  }, [canUseRemote, isDevMode, token])

  function updateLocalItems(nextItems) {
    setItems(nextItems)
    saveMaterialItems(nextItems)
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
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  const filteredItems = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return items
      .filter((item) => {
        const matchCountry = filters.country === '全部国家' || item.country === filters.country
        const matchStage = filters.stage === 'all' || item.stage === filters.stage
        const text = `${item.title} ${item.category} ${item.note} ${item.applicationSchool || ''}`.toLowerCase()
        const matchKeyword = !keyword || text.includes(keyword)
        return matchCountry && matchStage && matchKeyword
      })
      .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
  }, [items, filters])

  const stats = useMemo(() => {
    const completed = items.filter((item) => item.completed).length
    const overdue = items.filter((item) => !item.completed && daysLeft(item.deadline) < 0).length
    const attachmentCount = items.reduce((sum, item) => sum + (item.attachments?.length || 0), 0)
    const rate = items.length ? Math.round((completed / items.length) * 100) : 0
    return { completed, overdue, attachmentCount, rate }
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
      setSyncNote('请填写材料名称。')
      return
    }

    const existing = items.find((item) => item.id === editingId)
    const payload = {
      applicationId: normalizeApplicationId(form.applicationId, canUseRemote),
      title,
      country: form.country,
      stage: form.stage,
      category: form.category.trim() || 'Other',
      deadline: form.deadline,
      completed: Boolean(existing?.completed),
      note: form.note.trim() || '暂无备注',
    }

    if (canUseRemote) {
      try {
        const saved = editingId
          ? await studyAbroadApi.updateMaterial(editingId, payload, token)
          : await studyAbroadApi.createMaterial(payload, token)
        setItems((current) => {
          const next = editingId
            ? current.map((item) => (item.id === editingId ? saved : item))
            : [...current, saved]
          return next.sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
        })
        setSyncNote(editingId ? '材料条目已更新。' : '材料条目已保存到后端。')
      } catch (error) {
        setSyncNote(error.message || '保存失败。')
        return
      }
    } else if (isDevMode) {
      const saved = {
        id: editingId || createId(),
        ...enrichWithApplication(payload),
        attachments: existing?.attachments || [],
      }
      const next = editingId
        ? items.map((item) => (item.id === editingId ? saved : item))
        : [...items, saved]
      updateLocalItems(next.sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))))
      setSyncNote(editingId ? '本地演示材料已更新。' : '本地演示材料已创建。')
    } else {
      setSyncNote('请先登录真实账号，再保存材料条目。')
      return
    }
    resetForm()
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm(formFromItem(item))
  }

  async function toggleCompleted(targetId) {
    const targetItem = items.find((item) => item.id === targetId)
    if (!targetItem) return
    const nextItem = { ...targetItem, completed: !targetItem.completed }

    if (canUseRemote) {
      try {
        const updated = await studyAbroadApi.updateMaterial(targetId, toMaterialPayload(nextItem, canUseRemote), token)
        setItems(items.map((item) => (item.id === targetId ? updated : item)))
        setSyncNote('材料完成状态已同步。')
      } catch (error) {
        setSyncNote(error.message || '材料状态同步失败。')
      }
      return
    }

    if (isDevMode) {
      updateLocalItems(items.map((item) => (item.id === targetId ? nextItem : item)))
      return
    }
    setSyncNote('请先登录真实账号，再更新材料状态。')
  }

  async function removeItem(targetId) {
    if (!window.confirm('确认删除这个材料条目吗？')) return
    if (canUseRemote) {
      try {
        await studyAbroadApi.deleteMaterial(targetId, token)
        setItems(items.filter((item) => item.id !== targetId))
        setSyncNote('材料条目已删除。')
      } catch (error) {
        setSyncNote(error.message || '删除失败。')
      }
      return
    }
    if (isDevMode) {
      updateLocalItems(items.filter((item) => item.id !== targetId))
      setSyncNote('本地演示材料已删除。')
      return
    }
    setSyncNote('请先登录真实账号，再删除材料条目。')
  }

  async function uploadAttachments(materialId) {
    const files = selectedFiles[materialId]
    if (!canUseRemote) {
      setSyncNote('附件上传需要真实登录账号。')
      return
    }
    if (!files?.length) {
      setSyncNote('请先选择要上传的附件。')
      return
    }
    try {
      setUploadProgress((current) => ({ ...current, [materialId]: 0 }))
      const updated = await studyAbroadApi.uploadMaterialAttachments(materialId, files, token, (progress) => {
        setUploadProgress((current) => ({ ...current, [materialId]: progress }))
      })
      setItems((current) => current.map((item) => (item.id === materialId ? updated : item)))
      setSelectedFiles((current) => ({ ...current, [materialId]: [] }))
      setUploadProgress((current) => ({ ...current, [materialId]: null }))
      setSyncNote('附件已上传。')
    } catch (error) {
      setUploadProgress((current) => ({ ...current, [materialId]: null }))
      setSyncNote(error.message || '附件上传失败。')
    }
  }

  async function downloadAttachment(materialId, attachmentId) {
    try {
      await studyAbroadApi.downloadMaterialAttachment(materialId, attachmentId, token)
      setSyncNote('附件下载已开始。')
    } catch (error) {
      setSyncNote(error.message || '附件下载失败。')
    }
  }

  async function deleteAttachment(materialId, attachmentId) {
    if (!window.confirm('确认删除这个附件吗？')) return
    try {
      await studyAbroadApi.deleteMaterialAttachment(materialId, attachmentId, token)
      setItems((current) => current.map((item) => (
        item.id === materialId
          ? { ...item, attachments: (item.attachments || []).filter((attachment) => attachment.id !== attachmentId) }
          : item
      )))
      setSyncNote('附件已删除。')
    } catch (error) {
      setSyncNote(error.message || '附件删除失败。')
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 材料清单</p>
              <h2>申请材料清单</h2>
              <p className="muted">按项目、国家和阶段追踪护照、成绩单、PS、推荐信、签证材料，并上传附件。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="grid-two">
            <form className="feature-card" onSubmit={handleSubmit}>
              <div className="section-head compact">
                <h2>{editingId ? '编辑材料条目' : '新增材料条目'}</h2>
                <button className="btn outline small" type="button" onClick={resetForm}>清空</button>
              </div>
              <label className="field">
                <span>关联申请项目</span>
                <select value={form.applicationId} onChange={(event) => handleApplicationChange(event.target.value)}>
                  <option value="">通用材料 / 不关联项目</option>
                  {applications.map((item) => (
                    <option key={item.id} value={String(item.id)}>{appLabel(item)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>材料名称</span>
                <input
                  type="text"
                  value={form.title}
                  placeholder="例如：第二封推荐信"
                  onChange={(event) => updateForm('title', event.target.value)}
                />
              </label>
              <div className="grid-two compact">
                <label className="field">
                  <span>国家 / 地区</span>
                  <select value={form.country} onChange={(event) => updateForm('country', event.target.value)}>
                    {countries.slice(1).map((item) => (
                      <option key={item} value={item}>{countryLabelMap[item] || item}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>阶段</span>
                  <select value={form.stage} onChange={(event) => updateForm('stage', event.target.value)}>
                    {stageOptions.slice(1).map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid-two compact">
                <label className="field">
                  <span>类型</span>
                  <input type="text" value={form.category} onChange={(event) => updateForm('category', event.target.value)} />
                </label>
                <label className="field">
                  <span>截止日期</span>
                  <input type="date" value={form.deadline} onChange={(event) => updateForm('deadline', event.target.value)} />
                </label>
              </div>
              <label className="field">
                <span>备注</span>
                <textarea
                  rows="3"
                  value={form.note}
                  placeholder="记录格式、盖章、负责人或提交要求"
                  onChange={(event) => updateForm('note', event.target.value)}
                />
              </label>
              <button className="btn primary" type="submit">{editingId ? '保存修改' : '添加材料'}</button>
            </form>

            <div className="feature-card metrics">
              <div className="card-title">材料进度</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{items.length}</div>
                  <div className="mini-label">全部材料</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{stats.completed}</div>
                  <div className="mini-label">已完成</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{stats.attachmentCount}</div>
                  <div className="mini-label">已传附件</div>
                </div>
              </div>
              <div className="progress-block">
                <div className="progress-label">完成度 {stats.rate}%</div>
                <div className="progress-bar alt"><span style={{ width: `${stats.rate}%` }} /></div>
              </div>
              {syncNote ? <div className="notice-box"><p className="muted">{syncNote}</p></div> : null}
              <div className="filter-grid">
                <label className="field">
                  <span>国家筛选</span>
                  <select value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })}>
                    {countries.map((item) => (
                      <option key={item} value={item}>{countryLabelMap[item] || item}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>阶段筛选</span>
                  <select value={filters.stage} onChange={(event) => setFilters({ ...filters, stage: event.target.value })}>
                    {stageOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>关键词</span>
                <input
                  type="text"
                  value={filters.keyword}
                  placeholder="搜索材料、类型、项目或备注"
                  onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="study-list">
            {filteredItems.map((item) => {
              const left = daysLeft(item.deadline)
              const attachments = item.attachments || []
              const files = selectedFiles[item.id] || []
              const progress = uploadProgress[item.id]
              return (
                <article className={`study-row material-row ${item.completed ? 'is-complete' : left < 0 ? 'is-overdue' : left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                  <label className="study-check">
                    <input type="checkbox" checked={Boolean(item.completed)} onChange={() => toggleCompleted(item.id)} />
                    <span>{item.completed ? '已完成' : '待完成'}</span>
                  </label>
                  <div className="study-row-main">
                    <div className="study-row-title">{item.title}</div>
                    <div className="detail-meta">
                      <span>{countryLabelMap[item.country] || item.country}</span>
                      <span>{stageLabelMap[item.stage] || item.stage}</span>
                      <span>{item.category}</span>
                      <span>{item.deadline}</span>
                    </div>
                    {item.applicationSchool ? (
                      <div className="tag-row">
                        <span className="tag subtle">{item.applicationSchool}</span>
                        <span className="tag subtle">{item.applicationProgram}</span>
                      </div>
                    ) : null}
                    <p className="muted">{item.note}</p>

                    <div className="material-attachments">
                      <div className="attachment-list compact">
                        {attachments.map((attachment) => (
                          <div className="attachment-item compact" key={attachment.id}>
                            <div className="attachment-info">
                              <span className="attachment-name">{attachment.originalName}</span>
                              <span className="muted">{formatFileSize(attachment.fileSize)}</span>
                            </div>
                            <div className="study-row-side">
                              <button className="btn outline small" type="button" onClick={() => downloadAttachment(item.id, attachment.id)}>下载</button>
                              <button className="btn outline small" type="button" onClick={() => deleteAttachment(item.id, attachment.id)}>删除</button>
                            </div>
                          </div>
                        ))}
                        {!attachments.length ? <p className="muted">还没有上传附件。</p> : null}
                      </div>

                      <div className="attachment-form">
                        <label className="field">
                          <span>上传附件</span>
                          <input
                            type="file"
                            multiple
                            disabled={!canUseRemote}
                            onChange={(event) => setSelectedFiles((current) => ({
                              ...current,
                              [item.id]: Array.from(event.target.files || []),
                            }))}
                          />
                        </label>
                        <div className="study-row-side">
                          {files.length ? <span className="tag subtle">已选择 {files.length} 个文件</span> : null}
                          {typeof progress === 'number' ? <span className="tag warning">上传 {progress}%</span> : null}
                          <button className="btn primary small" type="button" disabled={!canUseRemote} onClick={() => uploadAttachments(item.id)}>上传</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="study-row-side">
                    <span className={`tag ${item.completed ? 'subtle' : urgencyClass(left)}`}>{deadlineText(left)}</span>
                    <button className="btn outline small" type="button" onClick={() => startEdit(item)}>编辑</button>
                    <button className="btn outline small" type="button" onClick={() => removeItem(item.id)}>删除</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
