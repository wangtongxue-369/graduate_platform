import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createKaogongOverviewPreview,
  defaultJobCriteria,
  getInterviewStatusLabel,
  normalizeFavoriteJobs,
  normalizeFavoriteScoreLines,
  pickNextExamNode,
} from '@/pages/student/kaogong/kaogongPageData.js'

export default function KaogongOverviewPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [overview, setOverview] = useState(createKaogongOverviewPreview())
  const [notice, setNotice] = useState(previewDataNotice('考公主站'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setOverview(createKaogongOverviewPreview())
        setNotice(previewDataNotice('考公主站'))
        return
      }

      setLoading(true)
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
            { label: '考试订阅', value: `${Array.isArray(subscriptionsData) ? subscriptionsData.length : 0} 项` },
            { label: '我的房间', value: `${Array.isArray(myRoomsData) ? myRoomsData.length : 0} 间` },
          ],
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
        setNotice(remoteDataNotice('考公主站'))
      } catch (error) {
        if (!active) return
        setOverview(createKaogongOverviewPreview())
        setNotice(fallbackDataNotice('考公主站', error))
      } finally {
        if (active) setLoading(false)
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

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="考公主站"
        title="先判断岗位，再盯紧节点，然后把模拟面试推进到房间里。"
        lead="总览页只负责给出你现在最该处理的信号，不把所有表单和深层操作铺满一屏。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步考公主站数据…</div> : null}

      <section className="v2-summary-strip" aria-label="考公主站摘要">
        {overview.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>主站先帮你判断本轮要推进哪条线。</p>
          </article>
        ))}
      </section>

      <section className="v2-kaogong-signal-board" aria-label="考公主站信号板">
        <article className="v2-side-card v2-kaogong-signal-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">个人信号板</p>
              <h3>把倒计时、收藏和房间动态收成一张页内情报板</h3>
            </div>
            <span className="v2-plan-status-pill">{countdown ? nextStepText : '暂无订阅'}</span>
          </div>

          <section className="v2-kaogong-signal-card__section">
            <div className="v2-kaogong-signal-card__head">
              <strong>下一考试节点</strong>
              <span>{countdown?.eventDate ? formatDateLabel(countdown.eventDate) : '待补充'}</span>
            </div>
            {countdown ? (
              <div className="v2-kaogong-focus-node">
                <strong>{countdown.examType}</strong>
                <p>{countdown.nodeType} / {countdown.title}</p>
                <small>{countdown.region} / {nextStepText}</small>
              </div>
            ) : (
              <p>当前还没有考试订阅，先去日历页锁定一场考试。</p>
            )}
          </section>

          <section className="v2-kaogong-signal-card__section">
            <div className="v2-kaogong-signal-card__head">
              <strong>关注岗位</strong>
              <span>{overview.favoriteJobs.length} 项</span>
            </div>
            <div className="v2-check-list">
              {overview.favoriteJobs.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.jobName}</strong>
                  <span>{item.region}</span>
                  <span>{item.recruitingUnit}</span>
                </div>
              ))}
              {!overview.favoriteJobs.length ? <p>还没有收藏岗位，先去岗位匹配页判断哪些岗位值得投时间。</p> : null}
            </div>
          </section>

          <section className="v2-kaogong-signal-card__section">
            <div className="v2-kaogong-signal-card__head">
              <strong>收藏分数线</strong>
              <span>{overview.favoriteScoreLines.length} 项</span>
            </div>
            <div className="v2-check-list">
              {overview.favoriteScoreLines.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.jobName}</strong>
                  <span>{item.region} / {item.year}</span>
                  <span>{item.scoreLine}</span>
                </div>
              ))}
              {!overview.favoriteScoreLines.length ? <p>还没有收藏分数线，账本页可以把关键岗位线收进固定回看清单。</p> : null}
            </div>
          </section>

          <section className="v2-kaogong-signal-card__section">
            <div className="v2-kaogong-signal-card__head">
              <strong>最近房间状态</strong>
              <span>{overview.room ? getInterviewStatusLabel(overview.room.status) : '暂无房间'}</span>
            </div>
            {overview.room ? (
              <div className="v2-kaogong-room-pulse">
                <strong>{overview.room.title}</strong>
                <p>{overview.room.jobDirection}</p>
                <small>{overview.room.latestMessage?.content || '当前还没有新消息，进入房间可以继续组织面试流程。'}</small>
              </div>
            ) : (
              <p>当前还没有加入模拟面试房间，进入大厅后可以筛房、建房或续接已有房间。</p>
            )}
          </section>
        </article>

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
              <span className="v2-feed-action">进入</span>
            </div>
            <div className="v2-preview-panel__rows">
              {countdown ? (
                <div className="v2-preview-row">
                  <strong>{countdown.examType}</strong>
                  <span>{countdown.region}</span>
                  <small>{countdown.nodeType} / {formatDateLabel(countdown.eventDate)}</small>
                </div>
              ) : (
                <div className="v2-preview-row">
                  <strong>还没有锁定考试</strong>
                  <small>先订阅一场考试，主页才会出现真正的倒计时提醒。</small>
                </div>
              )}
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
      </section>
    </div>
  )
}
