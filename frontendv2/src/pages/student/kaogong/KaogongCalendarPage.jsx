import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getReminderNodeName(item) {
  return (item.title || '提醒').replace(/^考录节点提醒[:：]\s*/, '')
}

function getReminderEventDate(item) {
  const match = String(item.content || '').match(/将在\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/)
  return match?.[1] || ''
}

function getReminderScope(item) {
  const nodeName = getReminderNodeName(item)
  const eventDate = getReminderEventDate(item)
  const beforeDate = eventDate ? String(item.content || '').split('将在')[0].trim() : String(item.content || '').trim()
  const withoutNode = beforeDate.replace(new RegExp(`[:：]\\s*${escapeRegExp(nodeName)}$`), '')
  return withoutNode || item.content || '提醒内容待补充'
}

function getReminderStatusText(item) {
  const eventDate = getReminderEventDate(item)
  if (!eventDate) return formatDateTimeLabel(item.createdAt)
  const daysLeft = calculateDaysLeft(eventDate)
  if (daysLeft === null) return eventDate
  return daysLeft >= 0 ? `还有 ${daysLeft} 天` : `已过 ${Math.abs(daysLeft)} 天`
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
  const [selectedTimelineGroup, setSelectedTimelineGroup] = useState(null)
  const [editingReminderId, setEditingReminderId] = useState(null)

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
  const urgentNotifications = [...calendar.notifications]
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
    .slice(0, 3)
  const latestReminder = urgentNotifications[0] || null
  const firstSubscription = calendar.subscriptions.find((item) => item.status === 'ACTIVE') || calendar.subscriptions[0] || null
  const calendarSummaryText = `共 ${calendar.groups.length} 场 · 已订阅 ${calendar.subscriptions.length} 场 · 提醒 ${calendar.notifications.length} 条`

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
    if (!canUseRemote) return

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
      setEditingReminderId(null)
    } catch (error) {
      setNotice(error.message || '提醒参数更新失败。')
    }
  }

  async function handleToggleSubscription(group, subscription) {
    if (subscription) {
      await handleCancel(subscription.id)
      return
    }

    await handleSubscribe(group)
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
        <section className="v2-kaogong-calendar-topline" aria-label="考试日历页头">
          <div>
            <p className="v2-kicker">考公主站 / 考试日历</p>
            <h2>考试日历</h2>
            <p>先看最近提醒，再管理订阅考试和完整时间线。</p>
          </div>
          <strong>{calendarSummaryText}</strong>
        </section>

        <section className="v2-kaogong-calendar-overview" aria-label="考试提醒概览">
          <div className="v2-kaogong-calendar-overview__head">
            <div>
              <p className="v2-kicker">考试提醒概览</p>
              <strong>{focusNode ? `${focusNode.nodeType} · ${focusNodeStatusText}` : '暂无可提醒节点'}</strong>
            </div>
            <span>{loading ? '正在刷新...' : '数据已就绪'}</span>
          </div>

          <div className="v2-kaogong-calendar-overview__grid">
            <div className="v2-kaogong-calendar-overview__item">
              <span>下一节点</span>
              <strong>{focusNode ? focusNode.nodeType : '暂无'}</strong>
              <p>{focusNode ? `${focusNode.examType} · ${formatDateLabel(focusNode.eventDate)}` : '当前筛选范围内没有可聚焦节点。'}</p>
            </div>
            <div className="v2-kaogong-calendar-overview__item">
              <span>已订阅</span>
              <strong>{calendar.subscriptions.length} 场</strong>
              <p>{firstSubscription ? `${firstSubscription.examType} · ${firstSubscription.region}/${firstSubscription.examYear}` : '订阅后会优先显示关键节点。'}</p>
            </div>
            <div className="v2-kaogong-calendar-overview__item">
              <span>近期提醒</span>
              <strong>{calendar.notifications.length} 条</strong>
              <p>{latestReminder ? `${getReminderNodeName(latestReminder)} · ${getReminderStatusText(latestReminder)}` : '暂无提醒消息。'}</p>
            </div>
            <div className="v2-kaogong-calendar-overview__item">
              <span>新订阅默认</span>
              <strong>提前 {subscriptionLeadDays} 天</strong>
              <p>右侧可调整新订阅考试的默认提醒。</p>
            </div>
          </div>

          {firstSubscription ? (
            <div className={`v2-kaogong-calendar-overview-subscription ${editingReminderId === firstSubscription.id ? 'is-editing' : ''}`}>
              <div>
                <span>当前关注</span>
                <strong>{firstSubscription.examType}</strong>
                <p>{`${firstSubscription.region} / ${firstSubscription.examYear} · 当前提前 ${firstSubscription.remindBeforeDays || subscriptionLeadDays} 天提醒`}</p>
              </div>
              {editingReminderId === firstSubscription.id ? (
                <label className="v2-field v2-kaogong-calendar-reminder-field">
                  <span>提前提醒</span>
                  <select
                    aria-label={`提醒提前天数 ${firstSubscription.id}`}
                    value={firstSubscription.remindBeforeDays}
                    onChange={(event) => updateReminderDays(firstSubscription.id, event.target.value)}
                  >
                    {reminderLeadOptions.map((value) => (
                      <option key={`subscription-remind-${firstSubscription.id}-${value}`} value={value}>
                        提前 {value} 天
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="v2-inline-actions v2-kaogong-calendar-inline-actions">
                {editingReminderId === firstSubscription.id ? (
                  <button
                    className="v2-secondary-link"
                    aria-label={`保存提醒 ${firstSubscription.id}`}
                    type="button"
                    onClick={() => handleSaveReminder(firstSubscription)}
                  >
                    保存提醒
                  </button>
                ) : (
                  <button
                    className="v2-secondary-link"
                    aria-label={`修改提醒 ${firstSubscription.id}`}
                    type="button"
                    onClick={() => setEditingReminderId(firstSubscription.id)}
                  >
                    修改提醒
                  </button>
                )}
                <button
                  className="v2-secondary-link"
                  aria-label={`取消订阅 ${firstSubscription.id}`}
                  type="button"
                  onClick={() => handleCancel(firstSubscription.id)}
                >
                  取消订阅
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-calendar-wall" aria-label="考试时间线">
          {calendar.groups.map((group) => {
            const upcomingNode = getUpcomingNode(group)
            const subscriptionKey = buildExamGroupKey(group)
            const isSubscribed = activeSubscriptions.has(subscriptionKey)
            const subscription = activeSubscriptions.get(subscriptionKey)

            return (
              <article
                className="v2-calendar-wall__group"
                key={group.key}
                aria-label={`exam-flow-card ${group.key}`}
              >
                <div className="v2-calendar-wall__head">
                  <div className="v2-calendar-wall__marker" aria-label={`${group.year} ${group.region}`}>
                    <strong>{group.year}</strong>
                    <span>{group.region}</span>
                  </div>
                  <div className="v2-calendar-wall__title">
                    <div className="v2-calendar-wall__title-line">
                      <strong>{group.examType}</strong>
                    </div>
                    <div className="v2-calendar-wall__meta-row">
                      <div className="v2-calendar-wall__meta">
                        <span className="v2-calendar-pill">{group.events.length} 个节点</span>
                        {isSubscribed ? <span className="v2-calendar-pill">已订阅</span> : null}
                      </div>
                      <button
                        className={`v2-segment-button ${isSubscribed ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => handleToggleSubscription(group, subscription)}
                      >
                        {isSubscribed ? '已订阅' : '订阅考试'}
                      </button>
                    </div>
                  </div>
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

                <button
                  className="v2-secondary-link v2-calendar-wall__expand"
                  type="button"
                  onClick={() => setSelectedTimelineGroup(group)}
                >
                  查看时间线 · {group.events.length} 个节点
                </button>
              </article>
            )
          })}
          {!calendar.groups.length ? (
            <article className="v2-empty-card">
              <p>当前筛选条件下还没有考试时间墙，先调整地区、考试类型或年份。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column v2-kaogong-calendar-side-column">
        <section className="v2-side-card v2-kaogong-filter-card v2-kaogong-calendar-filter-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选与订阅</p>
              <h3>筛选考试</h3>
            </div>
          </div>

          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <section className="v2-kaogong-filter-cluster" aria-label="考试日历筛选器">
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
                <span>已订阅考试可在概览里快速调整。</span>
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
              <button className="v2-segment-button is-active" type="submit" disabled={loading}>
                {loading ? '筛选中…' : '应用筛选'}
              </button>
              <button className="v2-segment-button" type="button" disabled={loading} onClick={resetFilters}>重置</button>
            </div>
          </form>
        </section>
      </aside>

      {selectedTimelineGroup ? (
        <div
          className="v2-modal-overlay"
          role="presentation"
          onClick={() => setSelectedTimelineGroup(null)}
        >
          <section
            aria-label={`${selectedTimelineGroup.examType} 时间线`}
            className="v2-modal-card v2-kaogong-calendar-timeline-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">{selectedTimelineGroup.region} / {selectedTimelineGroup.year}</p>
                <h3>{selectedTimelineGroup.examType}</h3>
              </div>
              <button
                aria-label="关闭考试时间线弹窗"
                className="v2-secondary-link"
                type="button"
                onClick={() => setSelectedTimelineGroup(null)}
              >
                关闭
              </button>
            </div>
            <ol className="v2-calendar-rail v2-calendar-rail--modal" aria-label={`exam-flow-timeline ${selectedTimelineGroup.key}`}>
              {selectedTimelineGroup.events.map((event, index) => (
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
          </section>
        </div>
      ) : null}
    </>
  )
}
