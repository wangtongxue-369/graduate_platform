import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { pageItems, totalPages } from '../../components/paginationUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { kaogongApi } from '../../lib/api.js'
import '../../App.css'

const defaultFilters = {
  region: '北京',
  examType: '国家公务员考试',
  year: '',
}

const EXAM_PAGE_SIZE = 4
const SUBSCRIPTION_PAGE_SIZE = 4
const NOTIFICATION_PAGE_SIZE = 6

export default function ExamCalendarPage() {
  const { token, isAuthed } = useAuth()
  const [filters, setFilters] = useState(defaultFilters)
  const [examGroups, setExamGroups] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [remindBeforeDays, setRemindBeforeDays] = useState(3)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState('')
  const [examPage, setExamPage] = useState(1)
  const [examTotalPages, setExamTotalPages] = useState(1)
  const [examTotalItems, setExamTotalItems] = useState(0)
  const [subscriptionPage, setSubscriptionPage] = useState(1)
  const [notificationPage, setNotificationPage] = useState(1)

  const activeSubscriptionMap = useMemo(() => {
    const map = new Map()
    subscriptions
      .filter((item) => item.status === 'ACTIVE' && !item.eventId)
      .forEach((item) => map.set(examKey(item), item))
    return map
  }, [subscriptions])

  useEffect(() => {
    loadEvents()
    loadMine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateField(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function examKey(item) {
    return `${item.region || ''}::${item.examType || ''}::${item.year || item.examYear || ''}`
  }

  function getRealToken() {
    return token && token !== 'dev-token' ? token : localStorage.getItem('gp_token')
  }

  function daysUntil(dateText) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateText)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target - today) / 86400000)
  }

  async function loadEvents(event, nextPage = 1) {
    event?.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const data = await kaogongApi.calendarExamGroupsPage({
        ...filters,
        page: nextPage - 1,
        size: EXAM_PAGE_SIZE,
      })
      setExamGroups(data?.content || [])
      setExamPage(nextPage)
      setExamTotalPages(data?.totalPages || 1)
      setExamTotalItems(data?.totalElements || 0)
    } catch (err) {
      setMessage(err.message || '考试日历加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleExamPageChange(nextPage) {
    await loadEvents(null, nextPage)
  }

  async function loadMine() {
    const realToken = getRealToken()
    if (!isAuthed || !realToken || realToken === 'dev-token') return
    const [subData, noteData] = await Promise.all([
      kaogongApi.mySubscriptions(realToken).catch(() => []),
      kaogongApi.notifications(realToken).catch(() => []),
    ])
    setSubscriptions(subData || [])
    setNotifications(noteData || [])
    setSubscriptionPage(1)
    setNotificationPage(1)
  }

  async function handleToggleExam(group) {
    const realToken = getRealToken()
    if (!isAuthed || !realToken || realToken === 'dev-token') {
      setMessage('请先用真实账号登录后订阅提醒。请确认当前访问地址和登录地址一致，例如都使用 http://127.0.0.1:5173。')
      return
    }

    const active = activeSubscriptionMap.get(group.key)
    setBusyKey(group.key)
    setMessage('')
    try {
      if (active) {
        await kaogongApi.cancelSubscription(active.id, realToken)
        setMessage(`已取消 ${group.year} ${group.region} ${group.examType} 的提醒订阅。`)
      } else {
        await kaogongApi.subscribeCalendar({
          region: group.region,
          examType: group.examType,
          examYear: group.year,
          remindBeforeDays,
        }, realToken)
        setMessage(`已订阅 ${group.year} ${group.region} ${group.examType}，主页会按后续节点显示倒计时提醒。`)
      }
      await loadMine()
    } catch (err) {
      setMessage(err.message || '操作失败')
    } finally {
      setBusyKey('')
    }
  }

  async function handleCancel(id) {
    const realToken = getRealToken()
    try {
      await kaogongApi.cancelSubscription(id, realToken)
      await loadMine()
      setMessage('订阅已取消。')
    } catch (err) {
      setMessage(err.message || '取消失败')
    }
  }

  function updateSubscriptionDays(id, value) {
    setSubscriptions((prev) => prev.map((item) => (
      item.id === id ? { ...item, remindBeforeDays: Number(value) } : item
    )))
  }

  async function handleUpdateSubscription(item) {
    const realToken = getRealToken()
    if (!realToken || realToken === 'dev-token') {
      setMessage('请先用真实账号登录后修改订阅。')
      return
    }
    try {
      await kaogongApi.subscribeCalendar({
        region: item.region,
        examType: item.examType,
        examYear: item.examYear,
        remindBeforeDays: item.remindBeforeDays,
        email: item.email,
        sms: item.sms,
      }, realToken)
      await loadMine()
      setMessage('提醒参数已更新。')
    } catch (err) {
      setMessage(err.message || '更新失败')
    }
  }

  function nextNode(group) {
    return group.events
      .map((event) => ({ ...event, daysLeft: daysUntil(event.eventDate) }))
      .filter((event) => event.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)[0]
  }

  const examSubscriptions = subscriptions.filter((item) => !item.eventId)
  const subscriptionTotalPages = totalPages(examSubscriptions, SUBSCRIPTION_PAGE_SIZE)
  const notificationTotalPages = totalPages(notifications, NOTIFICATION_PAGE_SIZE)
  const visibleExamGroups = examGroups
  const visibleSubscriptions = pageItems(examSubscriptions, subscriptionPage, SUBSCRIPTION_PAGE_SIZE)
  const visibleNotifications = pageItems(notifications, notificationPage, NOTIFICATION_PAGE_SIZE)

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <Link className="page-back" to="/kaogong">‹ 返回</Link>
          <div className="section-head">
            <p className="eyebrow">考公考编 · 时间管理</p>
            <h2>考录全周期日历提醒</h2>
            <p className="muted">按考试订阅提醒，公告、报名、缴费、笔试、成绩公布和面试会作为同一场考试的后续节点展示。</p>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">考试事项</p>
            <h2>筛选并订阅考试</h2>
          </div>

          <form className="feature-card calendar-filter-panel" onSubmit={loadEvents}>
            <div className="filter-grid">
              <label className="field">
                <span>地区</span>
                <input value={filters.region} onChange={(event) => updateField('region', event.target.value)} placeholder="如：北京/上海" />
              </label>
              <label className="field">
                <span>考试类型</span>
                <select value={filters.examType} onChange={(event) => updateField('examType', event.target.value)}>
                  <option>国家公务员考试</option>
                  <option>上海市公务员考试</option>
                  <option>事业单位考试</option>
                </select>
              </label>
              <label className="field">
                <span>年份</span>
                <input value={filters.year} onChange={(event) => updateField('year', event.target.value)} placeholder="可选，如：2027" />
              </label>
              <label className="field">
                <span>提前提醒</span>
                <select value={remindBeforeDays} onChange={(event) => setRemindBeforeDays(Number(event.target.value))}>
                  <option value={1}>提前 1 天</option>
                  <option value={3}>提前 3 天</option>
                  <option value={7}>提前 7 天</option>
                  <option value={14}>提前 14 天</option>
                </select>
              </label>
            </div>
            <div className="question-actions">
              <button className="btn primary" type="submit" disabled={loading}>{loading ? '加载中...' : '查询考试'}</button>
            </div>
            {message ? <div className="muted">{message}</div> : null}
          </form>

          <div className="track-grid exam-calendar-grid">
            {visibleExamGroups.map((group) => {
              const subscribed = activeSubscriptionMap.has(group.key)
              const upcoming = nextNode(group)
              return (
                <article className="track-card exam-calendar-card" key={group.key}>
                  <div className="track-head">
                    <div>
                      <h3>{group.year} {group.region} · {group.examType}</h3>
                      <p className="muted">{group.events.length} 个考试事项已合并为一场考试提醒</p>
                    </div>
                    <button
                      className={`btn small ${subscribed ? 'outline' : 'primary'}`}
                      type="button"
                      disabled={busyKey === group.key}
                      onClick={() => handleToggleExam(group)}
                    >
                      {busyKey === group.key ? '处理中...' : subscribed ? '已订阅' : '订阅考试'}
                    </button>
                  </div>
                  {upcoming ? (
                    <div className="notice-box compact">
                      <strong>下一节点：{upcoming.nodeType}</strong>
                      <p className="muted">还有 {upcoming.daysLeft} 天 · {upcoming.eventDate}</p>
                    </div>
                  ) : (
                    <p className="muted">当前考试暂无未完成节点。</p>
                  )}
                  <div className="calendar-node-list">
                    {group.events.map((item, index) => (
                      <div className="calendar-node-row" key={item.id}>
                        <span className="timeline-index">{index + 1}</span>
                        <div>
                          <div className="timeline-title">{item.nodeType} · {item.eventDate}</div>
                          <p className="muted">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
          <Pagination
            page={examPage}
            total={examTotalPages}
            totalItems={examTotalItems}
            onChange={handleExamPageChange}
          />
          {examGroups.length === 0 ? <div className="feature-card">暂无考试事项，请调整筛选条件。</div> : null}
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">我的订阅</p>
            <h2>提醒状态</h2>
          </div>
          {examSubscriptions.length === 0 ? (
            <div className="feature-card">暂无考试订阅。订阅后，主页会显示该考试下一个未完成事项的倒计时。</div>
          ) : (
            <div className="track-grid">
              {visibleSubscriptions.map((item) => (
                <article className="track-card" key={item.id}>
                  <div className="track-head">
                    <h3>{item.examYear || ''} {item.region} · {item.examType}</h3>
                    <span className="tag subtle">{item.status === 'ACTIVE' ? '已订阅' : '已取消'}</span>
                  </div>
                  <label className="field">
                    <span>提前提醒</span>
                    <select
                      value={item.remindBeforeDays}
                      onChange={(event) => updateSubscriptionDays(item.id, event.target.value)}
                      disabled={item.status !== 'ACTIVE'}
                    >
                      <option value={1}>提前 1 天</option>
                      <option value={3}>提前 3 天</option>
                      <option value={7}>提前 7 天</option>
                      <option value={14}>提前 14 天</option>
                    </select>
                  </label>
                  {item.status === 'ACTIVE' ? (
                    <div className="question-actions">
                      <button className="btn outline small" type="button" onClick={() => handleUpdateSubscription(item)}>保存提醒</button>
                      <button className="btn ghost small" type="button" onClick={() => handleCancel(item.id)}>取消订阅</button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          <Pagination
            page={subscriptionPage}
            total={subscriptionTotalPages}
            totalItems={examSubscriptions.length}
            onChange={setSubscriptionPage}
          />
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">站内消息</p>
            <h2>提醒记录</h2>
          </div>
          {notifications.length === 0 ? (
            <div className="feature-card">暂无提醒消息。订阅后，系统会按提前天数生成站内提醒。</div>
          ) : (
            <div className="track-grid">
              {visibleNotifications.map((item) => (
                <article className="track-card" key={item.id}>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.content}</p>
                  <span className="tag subtle">{item.createdAt}</span>
                </article>
              ))}
            </div>
          )}
          <Pagination
            page={notificationPage}
            total={notificationTotalPages}
            totalItems={notifications.length}
            onChange={setNotificationPage}
          />
        </section>
      </main>
      <Footer />
    </div>
  )
}
