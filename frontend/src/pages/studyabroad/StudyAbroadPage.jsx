import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import {
  getApplicationItems,
  getMaterialItems,
  getTimelineItems,
} from './studyAbroadStorage.js'
import '../../App.css'

const features = [
  {
    title: '申请项目管理',
    desc: '集中管理目标院校、专业、轮次、截止日期、申请状态和冲刺梯度。',
    to: '/studyabroad/applications',
    metric: '项目追踪',
  },
  {
    title: '申请时间线',
    desc: '管理语言考试、选校、文书、网申、面试和签证等关键节点。',
    to: '/studyabroad/timeline',
    metric: '节点推进',
  },
  {
    title: '申请材料清单',
    desc: '按国家、阶段和类型核对护照、成绩单、文书、推荐信和签证材料。',
    to: '/studyabroad/materials',
    metric: '材料核对',
  },
  {
    title: '留学经验库',
    desc: '按国家和主题查看选校、PS、语言考试、签证与海外生活经验。',
    to: '/studyabroad/experience',
    metric: '经验参考',
  },
]

const sharedFeatures = [
  { title: '社区交流', desc: '进入社区留学分类，发布经验或查看同伴讨论。', to: '/community?category=liuxue' },
  { title: '题库练习', desc: '复用平台题库练习能力，保留刷题记录和错题反馈。', to: '/practice' },
]

const statusLabels = {
  planning: '规划中',
  preparing: '准备中',
  submitted: '已提交',
  offer: '已获 Offer',
  rejected: '未录取',
}

const priorityLabels = {
  dream: '冲刺',
  match: '匹配',
  safe: '保底',
}

function byDateField(field) {
  return (a, b) => String(a[field] || '').localeCompare(String(b[field] || ''))
}

function daysLeft(dateText) {
  if (!dateText) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateText}T00:00:00`)
  return Math.ceil((target - today) / 86400000)
}

function urgencyLabel(left) {
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

function isSameApplication(item, application) {
  return item.applicationId !== null
    && item.applicationId !== undefined
    && String(item.applicationId) === String(application.id)
}

export default function StudyAbroadPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState(() => getApplicationItems())
  const [timelineItems, setTimelineItems] = useState(() => getTimelineItems())
  const [materialItems, setMaterialItems] = useState(() => getMaterialItems())
  const [syncNote, setSyncNote] = useState('')

  const canUseRemote = Boolean(token && token !== 'dev-token')

  useEffect(() => {
    if (!canUseRemote) return undefined
    let active = true

    async function loadRemoteSummary() {
      try {
        const [remoteApplications, remoteTimeline, remoteMaterials] = await Promise.all([
          studyAbroadApi.applications(token),
          studyAbroadApi.timeline(token),
          studyAbroadApi.materials(token),
        ])
        if (active) {
          setApplications(remoteApplications)
          setTimelineItems(remoteTimeline)
          setMaterialItems(remoteMaterials)
          setSyncNote('已加载后端保存的留学申请数据。')
        }
      } catch (error) {
        if (active) {
          setSyncNote(error.message || '后端暂不可用，当前展示本地演示数据。')
        }
      }
    }

    loadRemoteSummary()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const summary = useMemo(() => {
    const doneNodes = timelineItems.filter((item) => item.status === 'done').length
    const doneMaterials = materialItems.filter((item) => item.completed).length
    const submitted = applications.filter((item) => ['submitted', 'offer', 'rejected'].includes(item.status)).length
    return {
      projectTotal: applications.length,
      submitted,
      nodeTotal: timelineItems.length,
      nodeDone: doneNodes,
      nodeRate: timelineItems.length ? Math.round((doneNodes / timelineItems.length) * 100) : 0,
      materialTotal: materialItems.length,
      materialDone: doneMaterials,
      materialRate: materialItems.length ? Math.round((doneMaterials / materialItems.length) * 100) : 0,
    }
  }, [applications, timelineItems, materialItems])

  const projectCards = useMemo(() => {
    return [...applications].sort(byDateField('deadline')).map((application) => {
      const relatedTimeline = timelineItems.filter((item) => isSameApplication(item, application))
      const relatedMaterials = materialItems.filter((item) => isSameApplication(item, application))
      const pendingTasks = relatedTimeline.filter((item) => item.status !== 'done').length
      const finishedMaterials = relatedMaterials.filter((item) => item.completed).length
      const left = daysLeft(application.deadline)
      return {
        ...application,
        pendingTasks,
        materialDone: finishedMaterials,
        materialTotal: relatedMaterials.length,
        left,
      }
    })
  }, [applications, timelineItems, materialItems])

  const urgentItems = useMemo(() => {
    const timelineUrgent = timelineItems
      .filter((item) => item.status !== 'done')
      .map((item) => ({
        id: `timeline-${item.id}`,
        title: item.title,
        date: item.dueDate,
        source: item.applicationSchool || item.school || '通用事项',
        type: '时间线',
        left: daysLeft(item.dueDate),
        to: '/studyabroad/timeline',
      }))

    const materialUrgent = materialItems
      .filter((item) => !item.completed)
      .map((item) => ({
        id: `material-${item.id}`,
        title: item.title,
        date: item.deadline,
        source: item.applicationSchool || item.country || '通用材料',
        type: '材料',
        left: daysLeft(item.deadline),
        to: '/studyabroad/materials',
      }))

    return [...timelineUrgent, ...materialUrgent]
      .sort((a, b) => a.left - b.left)
      .slice(0, 3)
  }, [timelineItems, materialItems])

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="study-hero">
          <div className="study-hero-main">
            <p className="eyebrow">留学方向</p>
            <h1>留学申请工作台</h1>
            <p className="lead">
              把目标院校、申请节点、材料清单和经验参考集中在一个入口，帮助你看清当前进度和最紧急的下一步。
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/studyabroad/applications">管理申请项目</Link>
              <Link className="btn ghost" to="/studyabroad/timeline">查看时间线</Link>
            </div>
          </div>

          <div className="study-dashboard">
            <div className="mini-grid">
              <div className="mini-card">
                <div className="mini-value">{summary.projectTotal}</div>
                <div className="mini-label">申请项目</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.nodeRate}%</div>
                <div className="mini-label">时间线完成</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.materialRate}%</div>
                <div className="mini-label">材料完成</div>
              </div>
            </div>
            <div className="progress-block">
              <div className="progress-label">申请节点 {summary.nodeDone}/{summary.nodeTotal}</div>
              <div className="progress-bar"><span style={{ width: `${summary.nodeRate}%` }} /></div>
            </div>
            <div className="progress-block">
              <div className="progress-label">材料清单 {summary.materialDone}/{summary.materialTotal}</div>
              <div className="progress-bar alt"><span style={{ width: `${summary.materialRate}%` }} /></div>
            </div>
            <div className="notice-box">
              <strong>提交进度</strong>
              <p className="muted">已有 {summary.submitted} 个项目进入提交、Offer 或结果阶段。</p>
            </div>
            {syncNote ? (
              <div className="notice-box">
                <strong>数据来源</strong>
                <p className="muted">{syncNote}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>项目概览</h2>
            <p className="muted">按目标院校聚合状态、截止日期、待办任务和材料完成度。</p>
          </div>
          <div className="project-grid">
            {projectCards.map((item) => (
              <article className={`project-card ${item.left < 0 ? 'is-overdue' : item.left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                <div className="track-head">
                  <h3>{item.school}</h3>
                  <span className={`tag ${urgencyClass(item.left)}`}>{urgencyLabel(item.left)}</span>
                </div>
                <p className="muted">{item.program} · {item.degree} · {item.intake}</p>
                <div className="tag-row">
                  <span className="tag subtle">{item.country}</span>
                  <span className="tag subtle">{item.applicationRound}</span>
                  <span className="tag subtle">{priorityLabels[item.priority] || item.priority}</span>
                  <span className={`study-status ${item.status === 'offer' ? 'done' : item.status === 'planning' ? 'todo' : 'doing'}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>
                <div className="project-metrics">
                  <span>待办节点 {item.pendingTasks}</span>
                  <span>材料 {item.materialDone}/{item.materialTotal}</span>
                  <span>Deadline {item.deadline}</span>
                </div>
              </article>
            ))}
            {!projectCards.length ? (
              <div className="feature-card soft">
                <div className="card-title">还没有申请项目</div>
                <p className="muted">先创建一个目标院校项目，再继续补时间线和材料清单。</p>
                <Link className="btn primary small" to="/studyabroad/applications">创建申请项目</Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>紧急事项</h2>
            <p className="muted">优先处理逾期和 7 天内截止的任务。</p>
          </div>
          <div className="study-list">
            {urgentItems.map((item) => (
              <article className={`study-row ${item.left < 0 ? 'is-overdue' : item.left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                <span className={`tag ${urgencyClass(item.left)}`}>{item.type}</span>
                <div className="study-row-main">
                  <div className="study-row-title">{item.title}</div>
                  <p className="muted">{item.source} · {item.date}</p>
                </div>
                <div className="study-row-side">
                  <span className={`tag ${urgencyClass(item.left)}`}>{urgencyLabel(item.left)}</span>
                  <Link className="btn outline small" to={item.to}>处理</Link>
                </div>
              </article>
            ))}
            {!urgentItems.length ? (
              <div className="notice-box">
                <strong>当前没有紧急事项</strong>
                <p className="muted">所有未完成任务都还有比较充足的时间。</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>专属功能</h2>
            <p className="muted">真实登录后使用后端保存，开发模式下保留本地演示数据。</p>
          </div>
          <div className="track-grid">
            {features.map((item) => (
              <article className="track-card" key={item.to}>
                <div className="track-head">
                  <h3>{item.title}</h3>
                  <span className="tag subtle">{item.metric}</span>
                </div>
                <p className="muted">{item.desc}</p>
                <Link className="btn primary small" to={item.to}>进入功能</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>通用功能入口</h2>
            <p className="muted">留学方向复用平台已有社区与题库能力。</p>
          </div>
          <div className="grid-two">
            {sharedFeatures.map((item) => (
              <div className="feature-card soft" key={item.to}>
                <div className="card-title">{item.title}</div>
                <p className="muted">{item.desc}</p>
                <Link className="btn outline small" to={item.to}>前往</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
