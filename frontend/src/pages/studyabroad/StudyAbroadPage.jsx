import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import {
  defaultApplicationItems,
  defaultMaterialItems,
  defaultTimelineItems,
} from './studyAbroadStorage.js'
import { daysLeft, deadlineText, urgencyClass } from './studyAbroadUtils.js'
import '../../App.css'

const featureCards = [
  {
    title: '申请项目管理',
    desc: '维护目标院校、专业、轮次、截止日期和申请状态。',
    to: '/studyabroad/applications',
  },
  {
    title: '申请时间线',
    desc: '追踪语言考试、文书、网申、面试和签证节点。',
    to: '/studyabroad/timeline',
  },
  {
    title: '材料清单',
    desc: '核对材料完成进度，并上传每个材料条目的附件。',
    to: '/studyabroad/materials',
  },
  {
    title: '留学经验库',
    desc: '浏览公开经验，登录后发布自己的申请复盘。',
    to: '/studyabroad/experience',
  },
]

const sharedEntries = [
  { title: '社区交流', desc: '进入综合社区的留学分类，继续发帖讨论和提问。', to: '/community?category=liuxue' },
  { title: '题库练习', desc: '使用平台通用题库能力，保留刷题记录和错题反馈。', to: '/practice' },
]

function isSameApplication(item, application) {
  return item.applicationId !== null
    && item.applicationId !== undefined
    && String(item.applicationId) === String(application.id)
}

export default function StudyAbroadPage() {
  const { token, isAuthed } = useAuth()
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const isDevMode = token === 'dev-token'
  const shouldShowDemo = !canUseRemote

  const [applications, setApplications] = useState(() => (shouldShowDemo ? defaultApplicationItems : []))
  const [timelineItems, setTimelineItems] = useState(() => (shouldShowDemo ? defaultTimelineItems : []))
  const [materialItems, setMaterialItems] = useState(() => (shouldShowDemo ? defaultMaterialItems : []))
  const [syncNote, setSyncNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!canUseRemote) {
      setApplications(defaultApplicationItems)
      setTimelineItems(defaultTimelineItems)
      setMaterialItems(defaultMaterialItems)
      setSyncNote(isDevMode
        ? '当前是开发演示账号，页面展示示例数据，不会写入真实后端。'
        : '登录后将显示你保存在后端的真实申请、时间线和材料数据。')
      return undefined
    }

    let active = true
    async function loadRemoteSummary() {
      setLoading(true)
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
        setApplications([])
        setTimelineItems([])
        setMaterialItems([])
        setSyncNote(error.message || '后端数据加载失败，请稍后重试。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRemoteSummary()
    return () => {
      active = false
    }
  }, [canUseRemote, isDevMode, token])

  const summary = useMemo(() => {
    const doneTimeline = timelineItems.filter((item) => item.status === 'done').length
    const doneMaterials = materialItems.filter((item) => item.completed).length
    const deadlines = [
      ...applications.map((item) => ({ ...item, type: '申请', date: item.deadline, to: '/studyabroad/applications' })),
      ...timelineItems
        .filter((item) => item.status !== 'done')
        .map((item) => ({ ...item, type: '时间线', date: item.dueDate, to: '/studyabroad/timeline' })),
      ...materialItems
        .filter((item) => !item.completed)
        .map((item) => ({ ...item, type: '材料', date: item.deadline, to: '/studyabroad/materials' })),
    ].map((item) => ({ ...item, left: daysLeft(item.date) }))

    return {
      projectTotal: applications.length,
      timelineTotal: timelineItems.length,
      timelineDone: doneTimeline,
      timelineRate: timelineItems.length ? Math.round((doneTimeline / timelineItems.length) * 100) : 0,
      materialTotal: materialItems.length,
      materialDone: doneMaterials,
      materialRate: materialItems.length ? Math.round((doneMaterials / materialItems.length) * 100) : 0,
      dueSoon: deadlines.filter((item) => item.left !== null && item.left >= 0 && item.left <= 7).length,
      overdue: deadlines.filter((item) => item.left !== null && item.left < 0).length,
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
    const applicationUrgent = applications.map((item) => ({
      id: `application-${item.id}`,
      title: item.school,
      date: item.deadline,
      source: item.program,
      type: '申请',
      left: daysLeft(item.deadline),
      to: '/studyabroad/applications',
    }))

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

    return [...applicationUrgent, ...timelineUrgent, ...materialUrgent]
      .filter((item) => item.left !== null)
      .sort((a, b) => a.left - b.left)
      .slice(0, 5)
  }, [applications, timelineItems, materialItems])

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="study-hero">
          <div className="study-hero-main">
            <p className="eyebrow">留学方向</p>
            <h1>留学申请工作台</h1>
            <p className="lead">
              把申请项目、时间线、材料和经验浏览放在同一个视图里，优先处理最紧急的下一步。
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/studyabroad/applications">管理申请项目</Link>
              <Link className="btn ghost" to="/studyabroad/experience">浏览经验库</Link>
            </div>
          </div>

          <div className="study-dashboard">
            <div className="mini-grid">
              <div className="mini-card">
                <div className="mini-value">{summary.projectTotal}</div>
                <div className="mini-label">申请项目</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.materialRate}%</div>
                <div className="mini-label">材料完成率</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.dueSoon}</div>
                <div className="mini-label">7 天内截止</div>
              </div>
              <div className="mini-card">
                <div className="mini-value">{summary.overdue}</div>
                <div className="mini-label">已逾期</div>
              </div>
            </div>

            <div className="progress-block">
              <div className="progress-label">时间线完成 {summary.timelineDone}/{summary.timelineTotal}</div>
              <div className="progress-bar"><span style={{ width: `${summary.timelineRate}%` }} /></div>
            </div>
            <div className="progress-block">
              <div className="progress-label">材料清单 {summary.materialDone}/{summary.materialTotal}</div>
              <div className="progress-bar alt"><span style={{ width: `${summary.materialRate}%` }} /></div>
            </div>

            <div className="notice-box">
              <strong>数据来源</strong>
              <p className="muted">{loading ? '正在读取后端数据...' : syncNote}</p>
              {!isAuthed ? <Link className="btn outline small" to="/login">登录后使用真实数据</Link> : null}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>项目概览</h2>
            <p className="muted">按截止日期查看每个项目的待办节点和材料进度。</p>
          </div>
          <div className="project-grid">
            {projectCards.map((item) => (
              <article className={`project-card ${item.left != null && item.left < 0 ? 'is-overdue' : item.left != null && item.left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                <div className="track-head">
                  <h3>{item.school}</h3>
                  <span className={`tag ${urgencyClass(item.left)}`}>{deadlineText(item.left)}</span>
                </div>
                <p className="muted">{item.program} / {item.degree} / {item.intake}</p>
                <div className="tag-row">
                  <span className="tag subtle">{item.country}</span>
                  <span className="tag subtle">{item.applicationRound}</span>
                  <span className="tag subtle">{item.priority}</span>
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
                <div className="card-title">还没有真实申请项目</div>
                <p className="muted">登录后先创建一个目标项目，再规划时间线和材料清单。</p>
                <Link className="btn primary small" to="/studyabroad/applications">创建申请项目</Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>截止提醒</h2>
            <p className="muted">优先处理已逾期和 7 天内到期的申请、时间线和材料。</p>
          </div>
          <div className="study-list">
            {urgentItems.map((item) => (
              <article className={`study-row ${item.left != null && item.left < 0 ? 'is-overdue' : item.left != null && item.left <= 7 ? 'is-due-soon' : ''}`} key={item.id}>
                <span className={`tag ${urgencyClass(item.left)}`}>{item.type}</span>
                <div className="study-row-main">
                  <div className="study-row-title">{item.title}</div>
                  <p className="muted">{item.source} / {item.date || '未设置日期'}</p>
                </div>
                <div className="study-row-side">
                  <span className={`tag ${urgencyClass(item.left)}`}>{deadlineText(item.left)}</span>
                  <Link className="btn outline small" to={item.to}>处理</Link>
                </div>
              </article>
            ))}
            {!urgentItems.length ? (
              <div className="notice-box">
                <strong>当前没有截止事项</strong>
                <p className="muted">你可以先完善项目资料，或到经验库查看其他同学的申请复盘。</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>留学功能</h2>
            <p className="muted">本模块覆盖申请管理、时间线、材料附件和公开经验浏览。</p>
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
