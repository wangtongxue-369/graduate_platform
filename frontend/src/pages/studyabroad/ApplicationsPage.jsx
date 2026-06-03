import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import {
  defaultApplicationItems,
  getApplicationItems,
  saveApplicationItems,
} from './studyAbroadStorage.js'
import '../../App.css'

const emptyForm = {
  country: 'UK',
  school: '',
  program: '',
  degree: 'Master',
  intake: '2027 Fall',
  applicationRound: 'Round 1',
  deadline: '2026-10-15',
  status: 'planning',
  priority: 'match',
  note: '',
}

const statusOptions = [
  { value: 'planning', label: '规划中' },
  { value: 'preparing', label: '准备中' },
  { value: 'submitted', label: '已提交' },
  { value: 'offer', label: '已获 Offer' },
  { value: 'rejected', label: '未录取' },
]

const priorityOptions = [
  { value: 'dream', label: '冲刺' },
  { value: 'match', label: '匹配' },
  { value: 'safe', label: '保底' },
]

const statusLabelMap = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]))
const priorityLabelMap = Object.fromEntries(priorityOptions.map((item) => [item.value, item.label]))

function byDeadline(a, b) {
  return String(a.deadline).localeCompare(String(b.deadline))
}

export default function ApplicationsPage() {
  const { token } = useAuth()
  const isDevMode = token === 'dev-token'
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const [items, setItems] = useState(() => (isDevMode ? getApplicationItems() : defaultApplicationItems))
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState({ status: 'all', keyword: '' })
  const [notice, setNotice] = useState('')

  const dataNotice = notice || (
    canUseRemote
      ? ''
      : isDevMode
        ? '当前是开发演示账号，操作只会保存到本机 localStorage，不会进入真实后端。'
        : '请登录后管理真实申请项目。未登录时仅展示示例，不会伪装成保存结果。'
  )

  useEffect(() => {
    if (!canUseRemote) {
      setItems(isDevMode ? getApplicationItems() : defaultApplicationItems)
      return undefined
    }

    let active = true
    async function loadApplications() {
      try {
        const data = await studyAbroadApi.applications(token)
        if (active) {
          setItems(data)
          setNotice('已加载后端申请项目。')
        }
      } catch (error) {
        if (active) {
          setItems([])
          setNotice(error.message || '后端数据加载失败，请稍后重试。')
        }
      }
    }

    loadApplications()
    return () => {
      active = false
    }
  }, [canUseRemote, isDevMode, token])

  const filteredItems = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase()
    return [...items]
      .filter((item) => filter.status === 'all' || item.status === filter.status)
      .filter((item) => {
        if (!keyword) return true
        const text = `${item.country} ${item.school} ${item.program} ${item.note}`.toLowerCase()
        return text.includes(keyword)
      })
      .sort(byDeadline)
  }, [filter, items])

  const summary = useMemo(() => {
    const submitted = items.filter((item) => ['submitted', 'offer', 'rejected'].includes(item.status)).length
    const offers = items.filter((item) => item.status === 'offer').length
    const nearest = [...items].sort(byDeadline)[0]
    return { total: items.length, submitted, offers, nearest }
  }, [items])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function saveLocal(nextItems) {
    setItems(nextItems)
    saveApplicationItems(nextItems)
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      ...form,
      school: form.school.trim(),
      program: form.program.trim(),
      note: form.note.trim(),
    }
    if (!payload.school || !payload.program) {
      setNotice('请填写院校和专业。')
      return
    }

    try {
      if (canUseRemote) {
        const saved = editingId
          ? await studyAbroadApi.updateApplication(editingId, payload, token)
          : await studyAbroadApi.createApplication(payload, token)
        setItems((current) => {
          const next = editingId
            ? current.map((item) => (item.id === editingId ? saved : item))
            : [...current, saved]
          return next.sort(byDeadline)
        })
        setNotice(editingId ? '申请项目已更新。' : '申请项目已创建。')
      } else if (isDevMode) {
        const saved = { ...payload, id: editingId || `local-${Date.now()}` }
        const next = editingId
          ? items.map((item) => (item.id === editingId ? saved : item))
          : [...items, saved]
        saveLocal(next.sort(byDeadline))
        setNotice(editingId ? '本地演示项目已更新。' : '本地演示项目已创建。')
      } else {
        setNotice('请先登录真实账号，再保存申请项目。')
        return
      }
      resetForm()
    } catch (error) {
      setNotice(error.message || '保存失败。')
    }
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      country: item.country,
      school: item.school,
      program: item.program,
      degree: item.degree,
      intake: item.intake,
      applicationRound: item.applicationRound,
      deadline: item.deadline,
      status: item.status,
      priority: item.priority,
      note: item.note || '',
    })
  }

  async function handleDelete(id) {
    if (!window.confirm('确认删除这个申请项目吗？')) return
    try {
      if (canUseRemote) {
        await studyAbroadApi.deleteApplication(id, token)
        setItems((current) => current.filter((item) => item.id !== id))
      } else if (isDevMode) {
        saveLocal(items.filter((item) => item.id !== id))
      } else {
        setNotice('请先登录真实账号，再删除申请项目。')
        return
      }
      if (editingId === id) resetForm()
      setNotice('申请项目已删除。')
    } catch (error) {
      setNotice(error.message || '删除失败。')
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 申请项目</p>
              <h2>申请项目追踪</h2>
              <p className="muted">管理目标院校、专业、申请轮次、截止日期、当前状态和梯度。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="mini-grid">
            <div className="mini-card">
              <div className="mini-value">{summary.total}</div>
              <div className="mini-label">申请项目</div>
            </div>
            <div className="mini-card">
              <div className="mini-value">{summary.submitted}</div>
              <div className="mini-label">已提交/出结果</div>
            </div>
            <div className="mini-card">
              <div className="mini-value">{summary.offers}</div>
              <div className="mini-label">Offer</div>
            </div>
          </div>

          <div className="notice-box">
            <strong>最近截止</strong>
            <p className="muted">
              {summary.nearest
                ? `${summary.nearest.deadline} / ${summary.nearest.school} / ${summary.nearest.program}`
                : '还没有申请项目。'}
            </p>
          </div>

          {dataNotice ? (
            <div className="notice-box">
              <strong>数据来源</strong>
              <p className="muted">{dataNotice}</p>
            </div>
          ) : null}

          <form className="feature-card" onSubmit={handleSubmit}>
            <div className="section-head compact">
              <h2>{editingId ? '编辑申请项目' : '新增申请项目'}</h2>
              <button className="btn outline small" type="button" onClick={resetForm}>清空</button>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>国家 / 地区</span>
                <input value={form.country} onChange={(event) => updateForm('country', event.target.value)} />
              </label>
              <label className="field">
                <span>院校</span>
                <input value={form.school} onChange={(event) => updateForm('school', event.target.value)} />
              </label>
              <label className="field">
                <span>专业</span>
                <input value={form.program} onChange={(event) => updateForm('program', event.target.value)} />
              </label>
              <label className="field">
                <span>学位</span>
                <input value={form.degree} onChange={(event) => updateForm('degree', event.target.value)} />
              </label>
              <label className="field">
                <span>入学季</span>
                <input value={form.intake} onChange={(event) => updateForm('intake', event.target.value)} />
              </label>
              <label className="field">
                <span>申请轮次</span>
                <input value={form.applicationRound} onChange={(event) => updateForm('applicationRound', event.target.value)} />
              </label>
              <label className="field">
                <span>截止日期</span>
                <input type="date" value={form.deadline} onChange={(event) => updateForm('deadline', event.target.value)} />
              </label>
              <label className="field">
                <span>状态</span>
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                  {statusOptions.map((item) => (
                    <option value={item.value} key={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>梯度</span>
                <select value={form.priority} onChange={(event) => updateForm('priority', event.target.value)}>
                  {priorityOptions.map((item) => (
                    <option value={item.value} key={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>备注</span>
              <textarea rows="3" value={form.note} onChange={(event) => updateForm('note', event.target.value)} />
            </label>
            <button className="btn primary" type="submit">{editingId ? '保存修改' : '创建项目'}</button>
          </form>

          <div className="feature-card">
            <div className="filter-grid">
              <label className="field">
                <span>状态筛选</span>
                <select value={filter.status} onChange={(event) => setFilter({ ...filter, status: event.target.value })}>
                  <option value="all">全部</option>
                  {statusOptions.map((item) => (
                    <option value={item.value} key={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>关键词</span>
                <input
                  value={filter.keyword}
                  placeholder="搜索院校、专业、国家或备注"
                  onChange={(event) => setFilter({ ...filter, keyword: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="study-list">
            {filteredItems.map((item) => (
              <article className="study-row" key={item.id}>
                <div className="study-row-main">
                  <div className="study-row-title">{item.school}</div>
                  <p className="muted">{item.program} / {item.degree} / {item.intake}</p>
                  <div className="tag-row">
                    <span className="tag subtle">{item.country}</span>
                    <span className="tag subtle">{item.applicationRound}</span>
                    <span className="tag subtle">{priorityLabelMap[item.priority] || item.priority}</span>
                  </div>
                  <p className="muted">{item.note}</p>
                </div>
                <span className={`study-status ${item.status === 'offer' ? 'done' : item.status === 'planning' ? 'todo' : 'doing'}`}>
                  {statusLabelMap[item.status] || item.status}
                </span>
                <div className="study-row-side">
                  <span className="tag subtle">{item.deadline}</span>
                  <button className="btn outline small" type="button" onClick={() => startEdit(item)}>编辑</button>
                  <button className="btn outline small" type="button" onClick={() => handleDelete(item.id)}>删除</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
