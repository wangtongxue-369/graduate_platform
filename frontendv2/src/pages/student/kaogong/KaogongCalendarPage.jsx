import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  formatDateTimeLabel,
  previewDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  buildExamGroupKey,
  calculateDaysLeft,
  createKaogongCalendarPreviewRows,
  normalizeCalendarBoard,
  pickNextExamNode,
} from '@/pages/student/kaogong/kaogongPageData.js'

const calendarExamTypeOptions = [
  '',
  '国家公务员考试',
  '上海市公务员考试',
  '事业单位考试',
]

const reminderLeadOptions = [1, 3, 7, 14]

function createCalendarFilters() {
  return {
    region: '',
    examType: '',
    year: '',
  }
}

export default function KaogongCalendarPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [draftFilters, setDraftFilters] = useState(createCalendarFilters())
  const [appliedFilters, setAppliedFilters] = useState(createCalendarFilters())
  const [subscriptionLeadDays, setSubscriptionLeadDays] = useState(3)
  const [calendar, setCalendar] = useState({
    groups: createKaogongCalendarPreviewRows(),
    subscriptions: [],
    notifications: [],
  })
  const [notice, setNotice] = useState(previewDataNotice('考试日历'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCalendar() {
      if (!canUseRemote) {
        setCalendar({
          groups: createKaogongCalendarPreviewRows(),
          subscriptions: [],
          notifications: [],
        })
        setNotice(previewDataNotice('考试日历'))
        return
      }

      setLoading(true)
      try {
        const [groupsData, subscriptionsData, notificationsData] = await withRequestTimeout(
          Promise.all([
            kaogongApi.calendarExamGroupsPage({ ...appliedFilters, page: 0, size: 8 }),
            kaogongApi.mySubscriptions(token).catch(() => []),
            kaogongApi.notifications(token).catch(() => []),
          ]),
          8000,
          '考试日历数据读取超时，请检查后端服务。',
        )

        if (!active) return

        setCalendar(normalizeCalendarBoard(groupsData, subscriptionsData, notificationsData))
        setNotice('')
      } catch (error) {
        if (!active) return
        setCalendar({
          groups: createKaogongCalendarPreviewRows(),
          subscriptions: [],
          notifications: [],
        })
        setNotice(fallbackDataNotice('考试日历', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCalendar()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, token])

  const activeSubscriptions = new Map(
    calendar.subscriptions
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => [buildExamGroupKey(item), item]),
  )
  const focusNode = pickNextExamNode(calendar.groups, calendar.subscriptions)
  const focusNodeStatusText = !focusNode
    ? '暂无可提醒节点'
    : focusNode.daysLeft === null
      ? '日期待确认'
      : focusNode.daysLeft >= 0
        ? `还有 ${focusNode.daysLeft} 天`
        : `已过 ${Math.abs(focusNode.daysLeft)} 天`

  function getUpcomingNode(group) {
    return group.events
      .map((event) => ({
        ...event,
        daysLeft: calculateDaysLeft(event.eventDate),
      }))
      .filter((event) => event.daysLeft !== null && event.daysLeft >= 0)
      .sort((left, right) => left.daysLeft - right.daysLeft)[0] || null
  }

  async function reloadAfterAction() {
    const [groupsData, subscriptionsData, notificationsData] = await Promise.all([
      kaogongApi.calendarExamGroupsPage({ ...appliedFilters, page: 0, size: 8 }).catch(() => ({ content: [] })),
      kaogongApi.mySubscriptions(token).catch(() => []),
      kaogongApi.notifications(token).catch(() => []),
    ])
    setCalendar(normalizeCalendarBoard(groupsData, subscriptionsData, notificationsData))
  }

  async function handleSubscribe(group) {
    if (!canUseRemote || activeSubscriptions.has(group.key)) return

    try {
      await kaogongApi.subscribeCalendar({
        region: group.region,
        examType: group.examType,
        examYear: group.year,
        remindBeforeDays: subscriptionLeadDays,
      }, token)
      await reloadAfterAction()
    } catch (error) {
      setNotice(error.message || '考试订阅失败。')
    }
  }

  async function handleCancel(id) {
    if (!canUseRemote) return

    try {
      await kaogongApi.cancelSubscription(id, token)
      await reloadAfterAction()
    } catch (error) {
      setNotice(error.message || '取消考试订阅失败。')
    }
  }

  function updateReminderDays(id, value) {
    setCalendar((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((item) => (
        item.id === id
          ? { ...item, remindBeforeDays: Number(value) }
          : item
      )),
    }))
  }

  async function handleSaveReminder(item) {
    if (!canUseRemote) return

    try {
      await kaogongApi.subscribeCalendar({
        region: item.region,
        examType: item.examType,
        examYear: item.examYear,
        remindBeforeDays: item.remindBeforeDays,
      }, token)
      await reloadAfterAction()
    } catch (error) {
      setNotice(error.message || '提醒参数更新失败。')
    }
  }

  function handleApplyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
  }

  function resetFilters() {
    const nextFilters = createCalendarFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <div className="v2-main-column">
        <section className="v2-kaogong-calendar-hero-grid">
          <PageIntro
            kicker="考试日历"
            pathItems={[
              { label: '考公主站', to: '/station/kaogong' },
              { label: '日历时间墙' },
            ]}
            title="把一场考试的多个节点串成流程卡，再决定订阅和提醒节奏。"
            lead="主区负责看考试进程和订阅回看，右栏只保留筛选器与新订阅默认提醒，避免一个页面同时像列表、表单和工作台。"
          />

          <article className="v2-article-card v2-kaogong-calendar-spotlight" aria-label="当前最近节点">
            <p className="v2-kicker">当前最近节点</p>
            {focusNode ? (
              <>
                <strong>{focusNode.nodeType}</strong>
                <p className="v2-kaogong-calendar-spotlight__title">{focusNode.title}</p>
                <div className="v2-kaogong-calendar-spotlight__meta">
                  <span>{focusNode.examType}</span>
                  <span>{focusNode.region} / {focusNode.year}</span>
                </div>
                <div className="v2-kaogong-calendar-spotlight__band">
                  <em>{focusNodeStatusText}</em>
                  <small>{formatDateLabel(focusNode.eventDate)}</small>
                </div>
              </>
            ) : (
              <p>当前筛选范围内还没有可聚焦的节点，先调整地区、考试类型或年份。</p>
            )}
          </article>
        </section>

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新考试日历...</div> : null}

        <section className="v2-summary-strip" aria-label="考试日历摘要">
          <article className="v2-summary-card">
            <span>考试分组</span>
            <strong>{calendar.groups.length}</strong>
            <p>按考试聚合节点，而不是把报名、笔试和面试拆成散点事项。</p>
          </article>
          <article className="v2-summary-card">
            <span>已订阅</span>
            <strong>{calendar.subscriptions.length}</strong>
            <p>订阅后会持续保留在工作台里，方便统一调整提醒节奏。</p>
          </article>
          <article className="v2-summary-card">
            <span>提醒消息</span>
            <strong>{calendar.notifications.length}</strong>
            <p>提醒记录集中回看，避免和筛选表单挤在同一侧栏里。</p>
          </article>
        </section>

        <section className="v2-calendar-wall" aria-label="考试时间墙">
          {calendar.groups.map((group) => {
            const upcomingNode = getUpcomingNode(group)
            const isSubscribed = activeSubscriptions.has(group.key)

            return (
              <article
                className="v2-calendar-wall__group"
                key={group.key}
                aria-label={`exam-flow-card ${group.key}`}
              >
                <div className="v2-calendar-wall__head">
                  <div className="v2-calendar-wall__title">
                    <strong>{group.examType}</strong>
                    <div className="v2-calendar-wall__meta">
                      <span className="v2-calendar-pill">{group.region} / {group.year}</span>
                      <span className="v2-calendar-pill">{group.events.length} 个节点</span>
                      {isSubscribed ? <span className="v2-calendar-pill">已订阅</span> : null}
                    </div>
                  </div>
                  <button
                    className={`v2-segment-button ${isSubscribed ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => handleSubscribe(group)}
                    disabled={isSubscribed}
                  >
                    {isSubscribed ? '已订阅' : '订阅考试'}
                  </button>
                </div>

                <div className="v2-calendar-flow-summary">
                  <div className="v2-calendar-flow-summary__head">
                    <span className="v2-kicker">下一节点</span>
                    <strong>{upcomingNode ? upcomingNode.nodeType : '当前没有未完成节点'}</strong>
                  </div>
                  <p className="v2-calendar-flow-summary__title">
                    {upcomingNode ? upcomingNode.title : '这场考试当前没有可以继续跟进的时间节点。'}
                  </p>
                  <div className="v2-calendar-flow-summary__meta">
                    <span>
                      {upcomingNode
                        ? upcomingNode.daysLeft === null
                          ? '日期待确认'
                          : `还有 ${upcomingNode.daysLeft} 天`
                        : '可以先回看已发生节点'}
                    </span>
                    <span>{upcomingNode ? formatDateLabel(upcomingNode.eventDate) : '暂无更新'}</span>
                  </div>
                </div>

                <ol className="v2-calendar-rail" aria-label={`exam-flow-timeline ${group.key}`}>
                  {group.events.map((event, index) => (
                    <li className="v2-calendar-rail__item" key={event.id}>
                      <span className="v2-calendar-rail__index">{index + 1}</span>
                      <div className="v2-calendar-rail__body">
                        <div className="v2-calendar-rail__line">
                          <strong>{event.nodeType}</strong>
                          <time dateTime={event.eventDate}>{event.eventDate}</time>
                        </div>
                        <p>{event.title}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            )
          })}
          {!calendar.groups.length ? (
            <article className="v2-empty-card">
              <p>当前筛选条件下还没有考试时间墙，先调整地区、考试类型或年份。</p>
            </article>
          ) : null}
        </section>

        <section className="v2-card-grid v2-kaogong-calendar-workbench" aria-label="订阅与提醒工作台">
          <article className="v2-article-card v2-kaogong-calendar-panel">
            <div className="v2-room-side-section__head">
              <strong>我的订阅</strong>
              <span>{calendar.subscriptions.length} 项</span>
            </div>
            <div className="v2-check-list">
              {calendar.subscriptions.map((item) => (
                <div className="v2-check-row v2-kaogong-calendar-check-row" key={item.id}>
                  <strong>{item.examType}</strong>
                  <span>{item.region} / {item.examYear}</span>
                  <select
                    aria-label={`提醒提前天数 ${item.id}`}
                    value={item.remindBeforeDays}
                    onChange={(event) => updateReminderDays(item.id, event.target.value)}
                  >
                    {reminderLeadOptions.map((value) => (
                      <option key={`subscription-remind-${item.id}-${value}`} value={value}>
                        提前 {value} 天
                      </option>
                    ))}
                  </select>
                  <div className="v2-inline-actions v2-kaogong-calendar-inline-actions">
                    <button
                      className="v2-secondary-link"
                      aria-label={`保存提醒 ${item.id}`}
                      type="button"
                      onClick={() => handleSaveReminder(item)}
                    >
                      保存提醒
                    </button>
                    <button
                      className="v2-secondary-link"
                      aria-label={`取消订阅 ${item.id}`}
                      type="button"
                      onClick={() => handleCancel(item.id)}
                    >
                      取消订阅
                    </button>
                  </div>
                </div>
              ))}
              {!calendar.subscriptions.length ? <p>当前还没有考试订阅，先从时间墙里锁住需要持续跟进的考试。</p> : null}
            </div>
          </article>

          <article className="v2-article-card v2-kaogong-calendar-panel">
            <div className="v2-room-side-section__head">
              <strong>提醒消息</strong>
              <span>{calendar.notifications.length} 条</span>
            </div>
            <div className="v2-check-list">
              {calendar.notifications.map((item) => (
                <div className="v2-check-row v2-kaogong-calendar-check-row" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.content}</span>
                  <span>{formatDateTimeLabel(item.createdAt)}</span>
                </div>
              ))}
              {!calendar.notifications.length ? <p>当前还没有提醒消息，订阅后系统会按你设置的提前天数推送提醒。</p> : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column v2-kaogong-calendar-side-column">
        <section className="v2-side-card v2-kaogong-filter-card v2-kaogong-calendar-filter-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选与订阅</p>
              <h3>先锁定考试，再决定提醒提前量</h3>
            </div>
          </div>

          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <section className="v2-kaogong-filter-cluster" aria-label="考试日历筛选器">
              <div className="v2-kaogong-filter-cluster__head">
                <strong>筛选条件</strong>
                <span>沿用旧版筛选方式，先锁定地区、考试类型和年份，再看哪些考试线值得继续跟踪。</span>
              </div>
              <div className="v2-kaogong-filter-grid">
                <label className="v2-field">
                  <span>地区</span>
                  <input
                    type="text"
                    placeholder="如：北京/上海"
                    value={draftFilters.region}
                    onChange={(event) => updateDraftFilter('region', event.target.value)}
                  />
                </label>
                <label className="v2-field">
                  <span>考试类型</span>
                  <select
                    value={draftFilters.examType}
                    onChange={(event) => updateDraftFilter('examType', event.target.value)}
                  >
                    {calendarExamTypeOptions.map((item) => (
                      <option key={`calendar-exam-type-${item || 'empty'}`} value={item}>
                        {item || '全部'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="v2-field v2-field--wide">
                  <span>年份</span>
                  <input
                    type="text"
                    placeholder="可选，如：2027"
                    value={draftFilters.year}
                    onChange={(event) => updateDraftFilter('year', event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="v2-kaogong-filter-cluster" aria-label="新订阅默认提醒">
              <div className="v2-kaogong-filter-cluster__head">
                <strong>新订阅默认提醒</strong>
                <span>这里只设置新订阅的默认提前量，已订阅考试的调整放回主区工作台处理。</span>
              </div>
              <label className="v2-field">
                <span>提前提醒</span>
                <select value={subscriptionLeadDays} onChange={(event) => setSubscriptionLeadDays(Number(event.target.value))}>
                  {reminderLeadOptions.map((value) => (
                    <option key={`new-subscription-remind-${value}`} value={value}>
                      提前 {value} 天
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <div className="v2-inline-actions v2-kaogong-filter-actions">
              <button className="v2-segment-button is-active" type="submit">应用筛选</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置</button>
            </div>
          </form>
        </section>
      </aside>
    </>
  )
}
