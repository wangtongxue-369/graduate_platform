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

const featureCards = [
  {
    title: '申请项目管理',
    desc: '集中维护目标院校、专业方向、批次与申请状态。',
    to: '/studyabroad/applications',
  },
  {
    title: '申请时间线',
    desc: '按优先级追踪语言考试、网申、面试与签证节点。',
    to: '/studyabroad/timeline',
  },
  {
    title: '文书资料库',
    desc: '整理材料清单，核对完成进度与截止日期。',
    to: '/studyabroad/materials',
  },
  {
    title: '留学社区（已并入）',
    desc: '经验交流已并入综合社区，发帖请选择“留学”分类。',
    to: '/community?category=liuxue',
  },
]

const sharedEntries = [
  { title: '社区交流', desc: '查看留学分类讨论，发帖可填写留学专属信息卡。', to: '/community?category=liuxue' },
  { title: '题库练习', desc: '继续使用平台通用题库能力，保留刷题记录和错题反馈。', to: '/practice' },
]

function daysLeft(dateText) {
  if (!dateText) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target - today) / 86400000)
}

function urgencyLabel(left) {
  if (left == null) return '未设置日期'
  if (left < 0) return `已逾期 ${Math.abs(left)} 天`
  if (left === 0) return '今天截止'
  if (left <= 7) return `${left} 天内截止`
  return `${left} 天后截止`
}

function urgencyClass(left) {
  if (left == null) return 'subtle'
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
        if (!active) return
        setApplications(remoteApplications)
        setTimelineItems(remoteTimeline)
        setMaterialItems(remoteMaterials)
        setSyncNote('已加载后端保存的留学数据。')
      } catch (error) {
        if (!active) return
        setSyncNote(error.message || '后端暂不可用，当前展示本地演示数据。')
      }
    }

    loadRemoteSummary()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const summary = useMemo(() => {
    const doneTimeline = timelineItems.filter((item) => item.status === 'done').length
    const doneMaterials = materialItems.filter((item) => item.completed).length
    return {
      projectTotal: applications.length,
      timelineTotal: timelineItems.length,
      timelineDone: doneTimeline,
      timelineRate: timelineItems.length ? Math.round((doneTimeline / timelineItems.length) * 100) : 0,
      materialTotal: materialItems.length,
      materialDone: doneMaterials,
      materialRate: materialItems.length ? Math.round((doneMaterials / materialItems.length) * 100) : 0,
    }
  }, [applications, timelineItems, materialItems])

  const projectCards = useMemo(() => {
    return [...applications]
      .sort((a, b) => String(a.deadline || '').localeCompare(String(b.deadline || '')))
      .map((application) => {
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
      .sort((a, b) => (a.left ?? 9999) - (b.left ?? 9999))
      .slice(0, 4)
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
              项目、时间线、材料、社区入口放在同一视图，帮助你先做最紧急、最关键的下一步。
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/studyabroad/applications">管理申请项目</Link>
              <Link className="btn ghost" to="/community?category=liuxue">进入留学社区</Link>
            </div>
          </div>

          <div className="study-dashboard">
            <div className="mini-grid">
              <div className="mini-card">
                <div className="mini-value">{summary.projectTotal}</div>
                <div className="mini-label">申请项目</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.timelineRate}%</div>
                <div className="mini-label">时间线完成</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.materialRate}%</div>
                <div className="mini-label">材料完成</div>
              </div>
            </div>

            <div className="progress-block">
              <div className="progress-label">时间线 {summary.timelineDone}/{summary.timelineTotal}</div>
              <div className="progress-bar"><span style={{ width: `${summary.timelineRate}%` }} /></div>
            </div>
            <div className="progress-block">
              <div className="progress-label">材料清单 {summary.materialDone}/{summary.materialTotal}</div>
              <div className="progress-bar alt"><span style={{ width: `${summary.materialRate}%` }} /></div>
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
            <p className="muted">按截止日期查看每个项目的待办节点与材料进度。</p>
          </div>
          <div className="project-grid">
            {projectCards.map((item) => (
              <article className={`project-card ${item.left != null && item.left < 0 ? 'is-overdue' : item.left != null && item.left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                <div className="track-head">
                  <h3>{item.school}</h3>
                  <span className={`tag ${urgencyClass(item.left)}`}>{urgencyLabel(item.left)}</span>
                </div>
                <p className="muted">{item.program} · {item.degree} · {item.intake}</p>
                <div className="tag-row">
                  <span className="tag subtle">{item.country}</span>
                  <span className="tag subtle">{item.applicationRound}</span>
                </div>
                <div className="project-metrics">
                  <span>待办节点 {item.pendingTasks}</span>
                  <span>材料 {item.materialDone}/{item.materialTotal}</span>
                  <span>Deadline {item.deadline || '未设置'}</span>
                </div>
              </article>
            ))}
            {!projectCards.length ? (
              <div className="feature-card soft">
                <div className="card-title">还没有申请项目</div>
                <p className="muted">先创建一个目标项目，再继续规划时间线和材料清单。</p>
                <Link className="btn primary small" to="/studyabroad/applications">创建申请项目</Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>紧急事项</h2>
            <p className="muted">优先处理逾期或 7 天内到期的任务。</p>
          </div>
          <div className="study-list">
            {urgentItems.map((item) => (
              <article className={`study-row ${item.left != null && item.left < 0 ? 'is-overdue' : item.left != null && item.left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                <span className={`tag ${urgencyClass(item.left)}`}>{item.type}</span>
                <div className="study-row-main">
                  <div className="study-row-title">{item.title}</div>
                  <p className="muted">{item.source} · {item.date || '未设置日期'}</p>
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
                <p className="muted">你可以先完善项目资料，或去社区查看留学经验帖。</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>专属功能</h2>
            <p className="muted">留学经验社区已并入综合社区，其他留学能力保持不变。</p>
          </div>
          <div className="track-grid">
            {featureCards.map((item) => (
              <article className="track-card" key={item.to}>
                <div className="track-head">
                  <h3>{item.title}</h3>
                </div>
                <p className="muted">{item.desc}</p>
                <Link className="btn primary small" to={item.to}>进入功能</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>通用入口</h2>
          </div>
          <div className="grid-two">
            {sharedEntries.map((item) => (
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
