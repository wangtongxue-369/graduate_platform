import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import {
  canUseRemoteToken,
  formatDateLabel,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createKaogongOverviewPreview,
  getInterviewStatusLabel,
  normalizeFavoriteJobs,
  normalizeFavoriteScoreLines,
  pickNextExamNode,
} from '@/pages/student/kaogong/kaogongPageData.js'

export default function KaogongOverviewPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [overview, setOverview] = useState(createKaogongOverviewPreview())

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setOverview(createKaogongOverviewPreview())
        return
      }

      try {
        const [favoriteJobsData, favoriteScoreData, subscriptionsData, groupsData, myRoomsData] = await withRequestTimeout(
          Promise.all([
            kaogongApi.favoriteJobs(token).catch(() => []),
            kaogongApi.favoriteScoreLines(token).catch(() => []),
            kaogongApi.mySubscriptions(token).catch(() => []),
            kaogongApi.calendarExamGroupsPage({ page: 0, size: 12 }).catch(() => ({ content: [] })),
            kaogongApi.myInterviewRooms(token).catch(() => []),
          ]),
          8000,
          '考公主站数据读取超时，请检查后端服务。',
        )

        const favoriteJobs = normalizeFavoriteJobs(favoriteJobsData)
        const favoriteScoreLines = normalizeFavoriteScoreLines(favoriteScoreData)
        const activeSubscriptions = Array.isArray(subscriptionsData)
          ? subscriptionsData.filter((item) => item.status === 'ACTIVE')
          : []
        const nextNode = pickNextExamNode(groupsData, subscriptionsData)
        const myRoom = Array.isArray(myRoomsData) ? myRoomsData[0] : null
        const latestMessagePage = myRoom?.id
          ? await kaogongApi.interviewMessagesPage(myRoom.id, { page: 0, size: 1 }).catch(() => ({ content: [] }))
          : { content: [] }
        const latestMessage = Array.isArray(latestMessagePage?.content) ? latestMessagePage.content.at(-1) : null

        if (!active) return

        setOverview({
          metrics: [
            { label: '关注岗位', value: `${favoriteJobs.length} 项` },
            { label: '收藏分数线', value: `${favoriteScoreLines.length} 项` },
            { label: '考试订阅', value: `${activeSubscriptions.length} 项` },
            { label: '我的房间', value: `${Array.isArray(myRoomsData) ? myRoomsData.length : 0} 间` },
          ],
          subscriptionCount: activeSubscriptions.length,
          countdown: nextNode,
          favoriteJobs: favoriteJobs.slice(0, 3),
          favoriteScoreLines: favoriteScoreLines.slice(0, 3),
          room: myRoom
            ? {
                ...myRoom,
                latestMessage,
              }
            : null,
        })
      } catch (error) {
        if (!active) return
        setOverview(createKaogongOverviewPreview())
        console.error('考公主站数据加载失败', error)
      }
    }

    loadOverview()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const countdown = overview.countdown
  const nextStepText = !countdown
    ? '待确认'
    : countdown.daysLeft === 0
      ? '今天'
      : Number.isFinite(countdown.daysLeft) && countdown.daysLeft < 0
        ? `已过 ${Math.abs(countdown.daysLeft)} 天`
        : `还有 ${countdown.daysLeft ?? '待确认'} 天`
  const nextStepClass = countdown?.daysLeft === 0
    ? 'is-today'
    : Number.isFinite(countdown?.daysLeft) && countdown.daysLeft < 0
      ? 'is-missed'
      : Number.isFinite(countdown?.daysLeft) && countdown.daysLeft <= 3
        ? 'is-checked'
        : ''
  const subscriptionCount = overview.subscriptionCount ?? 0
  const subscriptionFootNote = subscriptionCount > 1
    ? `另有 ${subscriptionCount - 1} 场考试在日历页管理`
    : '进入日历查看完整时间线'

  return (
    <div className="v2-main-column">
      <section className="v2-card-grid v2-kaogong-action-grid" aria-label="考公主流程入口">
        <Link className="v2-preview-panel" to="/station/kaogong/jobs">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">岗位匹配</p>
              <strong>先判断值得投入时间的岗位，再决定后续材料与练习优先级。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.favoriteJobs.map((item) => (
              <div className="v2-preview-row" key={`overview-job-${item.id}`}>
                <strong>{item.jobName}</strong>
                <span>{item.region}</span>
                <small>{item.recruitingUnit}</small>
              </div>
            ))}
            {!overview.favoriteJobs.length ? (
              <div className="v2-preview-row">
                <strong>岗位还没收口</strong>
                <small>先填条件，再看匹配理由和报名窗口。</small>
              </div>
            ) : null}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaogong/score-lines">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">分数线账本</p>
              <strong>把历年进面线摆成纵向账本，方便固定回看和收藏。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.favoriteScoreLines.map((item) => (
              <div className="v2-preview-row" key={`overview-score-${item.id}`}>
                <strong>{item.jobName}</strong>
                <span>{item.year}</span>
                <small>进面线 {item.scoreLine}</small>
              </div>
            ))}
            {!overview.favoriteScoreLines.length ? (
              <div className="v2-preview-row">
                <strong>分数线还没定锚</strong>
                <small>先查近三年记录，再把重点岗位收进收藏夹。</small>
              </div>
            ) : null}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaogong/calendar">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">考试日历</p>
              <strong>把公告、报名、笔试、面试串成一条考试时间墙。</strong>
            </div>
            <span className={`v2-plan-status-pill v2-kaogong-calendar-pill ${nextStepClass}`}>{countdown ? nextStepText : '暂无订阅'}</span>
          </div>
          <div className="v2-preview-panel__rows">
            {countdown ? (
              <div className="v2-preview-row v2-kaogong-subscription-row">
                <span className="v2-kaogong-subscription-label">下一节点</span>
                <strong>{countdown.examType}</strong>
                <span>{countdown.nodeType} · {formatDateLabel(countdown.eventDate)} · {countdown.region}</span>
                <small>{countdown.title}</small>
              </div>
            ) : (
              <div className="v2-preview-row v2-kaogong-subscription-row">
                <span className="v2-kaogong-subscription-label">订阅提醒</span>
                <strong>还没有锁定考试</strong>
                <small>先订阅一场考试，总览页会只保留最近的关键节点。</small>
              </div>
            )}
            <div className="v2-kaogong-subscription-foot">
              <span>{subscriptionCount > 0 ? `已订阅 ${subscriptionCount} 场考试` : '暂无考试订阅'}</span>
              <small>{subscriptionFootNote}</small>
            </div>
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaogong/interviews">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">模拟面试</p>
              <strong>大厅负责筛房建房，消息、附件和复盘全部收进房间详情页。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.room ? (
              <div className="v2-preview-row">
                <strong>{overview.room.title}</strong>
                <span>{getInterviewStatusLabel(overview.room.status)}</span>
                <small>{overview.room.latestMessage?.content || overview.room.description}</small>
              </div>
            ) : (
              <div className="v2-preview-row">
                <strong>面试大厅待进入</strong>
                <small>先找房或创建一间房，再把答题、资料和复盘放进同一个上下文。</small>
              </div>
            )}
          </div>
        </Link>
      </section>
    </div>
  )
}
