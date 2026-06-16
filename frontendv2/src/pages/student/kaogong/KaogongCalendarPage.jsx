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
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  buildExamGroupKey,
  createKaogongCalendarPreviewRows,
  normalizeCalendarBoard,
} from '@/pages/student/kaogong/kaogongPageData.js'

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
        setNotice(remoteDataNotice('考试日历'))
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

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考试日历"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '日历时间墙' },
          ]}
          title="把一场考试的多个节点串成时间墙，再决定订阅和提醒节奏。"
          lead="中间只负责看考试进程，订阅设置和提醒管理收进右栏，避免一个页面同时像列表页和设置页。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新考试日历…</div> : null}

        <section className="v2-summary-strip" aria-label="考试日历摘要">
          <article className="v2-summary-card">
            <span>考试分组</span>
            <strong>{calendar.groups.length}</strong>
            <p>按考试聚合节点，而不是把报名、笔试和面试拆成散点事项。</p>
          </article>
          <article className="v2-summary-card">
            <span>已订阅</span>
            <strong>{calendar.subscriptions.length}</strong>
            <p>订阅后主页会优先显示下一节点倒计时。</p>
          </article>
          <article className="v2-summary-card">
            <span>提醒消息</span>
            <strong>{calendar.notifications.length}</strong>
            <p>提醒生成后会在站内消息和右栏提醒里同步出现。</p>
          </article>
        </section>

        <section className="v2-calendar-wall" aria-label="考试时间墙">
          {calendar.groups.map((group) => (
            <article className="v2-calendar-wall__group" key={group.key}>
              <div className="v2-calendar-wall__head">
                <div>
                  <strong>{group.examType}</strong>
                  <p>{group.region} / {group.year}</p>
                </div>
                <button
                  className={`v2-segment-button ${activeSubscriptions.has(group.key) ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handleSubscribe(group)}
                >
                  {activeSubscriptions.has(group.key) ? '已订阅' : '订阅考试'}
                </button>
              </div>
              <div className="v2-calendar-wall__nodes">
                {group.events.map((event) => (
                  <div className="v2-calendar-node" key={event.id}>
                    <strong>{event.nodeType}</strong>
                    <span>{event.title}</span>
                    <small>{formatDateLabel(event.eventDate)}</small>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {!calendar.groups.length ? (
            <article className="v2-empty-card">
              <p>当前筛选条件下还没有考试时间墙，先调整地区、考试类型或年份。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选与订阅</p>
              <h3>先锁定考试，再决定提醒提前量</h3>
            </div>
          </div>

          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={draftFilters.region}
                onChange={(event) => setDraftFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>考试类型</span>
              <input
                type="text"
                value={draftFilters.examType}
                onChange={(event) => setDraftFilters((current) => ({ ...current, examType: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <input
                type="text"
                value={draftFilters.year}
                onChange={(event) => setDraftFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>新订阅提前提醒</span>
              <select value={subscriptionLeadDays} onChange={(event) => setSubscriptionLeadDays(Number(event.target.value))}>
                <option value={1}>提前 1 天</option>
                <option value={3}>提前 3 天</option>
                <option value={7}>提前 7 天</option>
                <option value={14}>提前 14 天</option>
              </select>
            </label>
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">应用筛选</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置</button>
            </div>
          </form>

          <div className="v2-room-side-divider" />

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>我的订阅</strong>
              <span>{calendar.subscriptions.length} 项</span>
            </div>
            <div className="v2-check-list">
              {calendar.subscriptions.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.examType}</strong>
                  <span>{item.region} / {item.examYear}</span>
                  <select
                    aria-label={`提醒提前天数 ${item.id}`}
                    value={item.remindBeforeDays}
                    onChange={(event) => updateReminderDays(item.id, event.target.value)}
                  >
                    <option value={1}>提前 1 天</option>
                    <option value={3}>提前 3 天</option>
                    <option value={7}>提前 7 天</option>
                    <option value={14}>提前 14 天</option>
                  </select>
                  <div className="v2-inline-actions">
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
              {!calendar.subscriptions.length ? <p>当前还没有考试订阅，订阅后这里会出现提醒参数和取消入口。</p> : null}
            </div>
          </section>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>提醒消息</strong>
              <span>{calendar.notifications.length} 条</span>
            </div>
            <div className="v2-check-list">
              {calendar.notifications.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.content}</span>
                  <span>{formatDateTimeLabel(item.createdAt)}</span>
                </div>
              ))}
              {!calendar.notifications.length ? <p>当前还没有提醒消息，订阅后系统会按你设置的提前天数推送提醒。</p> : null}
            </div>
          </section>
        </section>
      </aside>
    </>
  )
}
