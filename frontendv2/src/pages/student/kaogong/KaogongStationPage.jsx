import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { kaogongWorkspace } from '@/lib/workspacePreview.js'
import {
  canUseRemoteToken,
  ensureArray,
  ensurePage,
  fallbackDataNotice,
  firstNonEmpty,
  formatCountText,
  formatDateLabel,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const defaultJobCriteria = {
  education: '本科',
  degree: '学士',
  major: '计算机科学与技术',
  region: '浙江',
  household: '',
  politicalStatus: '',
  jobCategory: '',
  unitType: '',
}

const interviewStatusOptions = [
  { value: '', label: '全部' },
  { value: 'OPEN', label: '开放中' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已结束' },
]

function getInterviewStatusLabel(value) {
  return interviewStatusOptions.find((item) => item.value === value)?.label || value || '待补充'
}

function createKaogongPreviewOverview() {
  return {
    metrics: [
      { label: '匹配岗位', value: formatCountText(kaogongWorkspace.hotZones.length, '条') },
      { label: '分数线样本', value: formatCountText(kaogongWorkspace.scoreLedger.length, '条') },
      { label: '考试节点', value: formatCountText(kaogongWorkspace.calendar.length, '项') },
    ],
    jobs: kaogongWorkspace.hotZones,
    scoreLines: kaogongWorkspace.scoreLedger,
    calendar: kaogongWorkspace.calendar,
    rooms: kaogongWorkspace.interviews.rooms,
    feedback: kaogongWorkspace.interviews.feedback,
  }
}

function createKaogongJobPreviewRows() {
  return kaogongWorkspace.hotZones.map((item, index) => ({
    id: `preview-job-${index}`,
    jobName: item.title,
    recruitingUnit: `${item.region} 招录单位`,
    region: item.region,
    examType: '公务员考试',
    recruitCount: item.openings,
    educationRequirement: '本科',
    majorRequirement: '方向相关专业',
    matchScore: 80 + index * 4,
    matchReasons: [item.fit],
    registrationStart: '2026-02-03',
    registrationEnd: '2026-02-08',
    sourceUrl: '',
  }))
}

function createKaogongScorePreviewRows() {
  return kaogongWorkspace.scoreLedger.map((item, index) => ({
    id: `preview-score-${index}`,
    jobName: item.title,
    recruitingUnit: '方向预览',
    region: '待补充',
    year: item.year,
    examType: '公务员考试',
    scoreLine: item.score,
    interviewRatio: item.delta,
    recruitCount: 0,
    interviewCount: 0,
    dataNote: '当前为前端预览样本。',
    source: '预览数据',
  }))
}

function createKaogongCalendarPreviewRows() {
  return kaogongWorkspace.calendar.map((item, index) => ({
    key: `preview-calendar-${index}`,
    region: '浙江',
    examType: '浙江省公务员考试',
    year: '2026',
    events: [
      {
        id: `${index}-1`,
        nodeType: item.title,
        title: item.note,
        eventDate: `2026-06-${String(index + 10).padStart(2, '0')}`,
      },
    ],
  }))
}

function createKaogongInterviewPreview() {
  return {
    rooms: kaogongWorkspace.interviews.rooms.map((item, index) => ({
      id: `preview-room-${index}`,
      title: item.name,
      jobDirection: item.note,
      scheduledAt: '2026-06-20T19:00:00',
      ownerName: '方向预览',
      participantCount: item.people,
      status: item.status.includes('进行') ? 'IN_PROGRESS' : 'OPEN',
      description: item.note,
    })),
    feedback: kaogongWorkspace.interviews.feedback.map((item, index) => ({
      id: `preview-feedback-${index}`,
      reviewerName: item.from,
      score: 85 + index,
      suggestions: item.note,
      strengths: item.topic,
      createdAt: '2026-06-12T09:00:00',
    })),
  }
}

function normalizeKaogongJobRows(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    jobName: item.jobName || item.title || '未命名岗位',
    recruitingUnit: item.recruitingUnit || item.companyName || '招录单位待补充',
    region: item.region || '地区待补充',
    examType: item.examType || '考试类型待补充',
    recruitCount: Number(item.recruitCount || 0),
    educationRequirement: item.educationRequirement || '学历待补充',
    majorRequirement: item.majorRequirement || '专业待补充',
    matchScore: Number(item.matchScore || 0),
    matchReasons: ensureArray(item.matchReasons),
    registrationStart: item.registrationStart,
    registrationEnd: item.registrationEnd,
    sourceUrl: item.sourceUrl || '',
  }))
}

function normalizeKaogongScoreRows(data) {
  return ensurePage(data).content.map((item) => ({
    id: item.id,
    jobName: item.jobName || '未命名岗位',
    recruitingUnit: item.recruitingUnit || '招录单位待补充',
    region: item.region || '地区待补充',
    year: item.year || '年份待补充',
    examType: item.examType || '考试类型待补充',
    scoreLine: item.scoreLine || '待补充',
    interviewRatio: item.interviewRatio || '待补充',
    recruitCount: Number(item.recruitCount || 0),
    interviewCount: Number(item.interviewCount || 0),
    dataNote: item.dataNote || '后端暂未补充说明',
    source: item.source || '来源待补充',
  }))
}

function normalizeKaogongCalendarRows(groupsData, subscriptionsData, notificationsData) {
  return {
    groups: ensurePage(groupsData).content.map((item) => ({
      key: item.key || `${item.region}-${item.examType}-${item.year}`,
      region: item.region || '地区待补充',
      examType: item.examType || '考试类型待补充',
      year: item.year || '年份待补充',
      events: ensureArray(item.events),
    })),
    subscriptions: ensureArray(subscriptionsData),
    notifications: ensureArray(notificationsData),
  }
}

function normalizeKaogongInterviewRows(roomsData, feedbackData) {
  return {
    rooms: ensurePage(roomsData).content.map((item) => ({
      id: item.id,
      title: item.title || '未命名房间',
      jobDirection: item.jobDirection || '方向待补充',
      scheduledAt: item.scheduledAt,
      ownerName: item.ownerName || '发起人待补充',
      participantCount: Number(item.participantCount || 0),
      status: item.status || 'OPEN',
      description: item.description || item.inviteNote || '后端暂未补充房间说明',
    })),
    feedback: ensurePage(feedbackData).content.map((item) => ({
      id: item.id,
      reviewerName: item.reviewerName || '匿名评审',
      score: item.score || '待补充',
      suggestions: item.suggestions || item.problems || '后端暂未补充反馈建议',
      strengths: item.strengths || '亮点待补充',
      createdAt: item.createdAt,
    })),
  }
}

export default function KaogongStationPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [overview, setOverview] = useState(createKaogongPreviewOverview())
  const [notice, setNotice] = useState(previewDataNotice('考公主站'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setOverview(createKaogongPreviewOverview())
        setNotice(previewDataNotice('考公主站'))
        return
      }

      setLoading(true)
      try {
        const [
          jobsData,
          scoreData,
          calendarData,
          roomsData,
          subscriptionsData,
        ] = await withRequestTimeout(
          Promise.all([
            kaogongApi.matchJobs(defaultJobCriteria, token),
            kaogongApi.scoreLinesPage({ page: 0, size: 4 }),
            kaogongApi.calendarExamGroupsPage({ page: 0, size: 4 }),
            kaogongApi.interviewRoomsPage({ page: 0, size: 4 }),
            kaogongApi.mySubscriptions(token).catch(() => []),
          ]),
          8000,
          '考公主站数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const jobs = normalizeKaogongJobRows(jobsData)
        const scoreLines = normalizeKaogongScoreRows(scoreData)
        const calendar = normalizeKaogongCalendarRows(calendarData, subscriptionsData, []).groups
        const interviews = normalizeKaogongInterviewRows(roomsData, { content: [] })

        setOverview({
          metrics: [
            { label: '匹配岗位', value: formatCountText(jobs.length, '条') },
            { label: '分数线样本', value: formatCountText(scoreLines.length, '条') },
            { label: '考试订阅', value: formatCountText(ensureArray(subscriptionsData).length, '项') },
          ],
          jobs: jobs.slice(0, 3),
          scoreLines: scoreLines.slice(0, 3),
          calendar: calendar.slice(0, 3),
          rooms: interviews.rooms.slice(0, 2),
          feedback: interviews.feedback.slice(0, 2),
        })
        setNotice(remoteDataNotice('考公主站'))
      } catch (error) {
        if (!active) return
        setOverview(createKaogongPreviewOverview())
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

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="考公主站"
        title="让岗位判断、节奏提醒和面试训练都回到同一条备考链上。"
        lead="考公主站先负责判断方向，再把你送进岗位匹配、分数线、考试日历和模拟面试四类页面，不再把各种入口铺满一屏。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步考公主站数据…</div> : null}

      <section className="v2-summary-strip" aria-label="考公主站摘要">
        {overview.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>先看总体分布，再决定进入哪个子页继续推进。</p>
          </article>
        ))}
      </section>

      <section className="v2-overview-grid" aria-label="考公核心入口">
        <Link className="v2-preview-panel" to="/station/kaogong/jobs">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">岗位匹配</p>
              <strong>先判断哪些岗位值得投时间，再继续备考投入。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.jobs.map((item) => (
              <div className="v2-preview-row" key={item.id || item.title}>
                <strong>{item.jobName || item.title}</strong>
                <span>{item.region}</span>
                <small>{firstNonEmpty(item.matchReasons?.[0], item.fit, '等待补充匹配理由')}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaogong/score-lines">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">分数线</p>
              <strong>把历年进面线整理成可比对的账本。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.scoreLines.map((item) => (
              <div className="v2-preview-row" key={item.id || item.title}>
                <strong>{item.jobName || item.title}</strong>
                <span>{item.year}</span>
                <small>{item.scoreLine ? `进面线 ${item.scoreLine}` : item.score}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-overview-grid" aria-label="考公支撑入口">
        <Link className="v2-preview-panel" to="/station/kaogong/calendar">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">考试日历</p>
              <strong>公告、报名、笔试和提醒都按时间线串起来。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.calendar.map((item, index) => (
              <div className="v2-preview-row" key={item.key || `${item.date}-${index}`}>
                <strong>{item.examType || item.title}</strong>
                <span>{item.region || item.date}</span>
                <small>{item.events?.[0]?.nodeType || item.note}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaogong/interviews">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">模拟面试</p>
              <strong>房间讨论和复盘评价分别进入更深一层页面处理。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.rooms.map((item) => (
              <div className="v2-preview-row" key={item.id || item.name}>
                <strong>{item.title || item.name}</strong>
                <span>{getInterviewStatusLabel(item.status)}</span>
                <small>{item.description || item.note}</small>
              </div>
            ))}
            {overview.feedback.map((item) => (
              <div className="v2-preview-row" key={item.id || item.from}>
                <strong>{item.reviewerName || item.from}</strong>
                <span>{item.score ? `${item.score} 分` : item.topic}</span>
                <small>{item.suggestions || item.note}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>
    </div>
  )
}

export function KaogongJobsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState(defaultJobCriteria)
  const [rows, setRows] = useState(createKaogongJobPreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('岗位匹配'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadJobs() {
      if (!canUseRemote) {
        setRows(createKaogongJobPreviewRows())
        setNotice(previewDataNotice('岗位匹配'))
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          kaogongApi.matchJobs(filters, token),
          8000,
          '岗位匹配数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeKaogongJobRows(data))
        setNotice(remoteDataNotice('岗位匹配'))
      } catch (error) {
        if (!active) return
        setRows(createKaogongJobPreviewRows())
        setNotice(fallbackDataNotice('岗位匹配', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.degree, filters.education, filters.household, filters.jobCategory, filters.major, filters.politicalStatus, filters.region, filters.unitType, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="岗位匹配"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '岗位结果' },
          ]}
          title="先把可报岗位筛出来，再决定后续备考优先级。"
          lead="中间只看结果，右栏单独收筛选。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新岗位匹配结果…</div> : null}

        <section className="v2-summary-strip" aria-label="岗位匹配摘要">
          <article className="v2-summary-card">
            <span>结果数量</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下可参考的岗位数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>最高匹配</span>
            <strong>{rows[0]?.matchScore || 0}</strong>
            <p>当前列表里最靠前的匹配分。</p>
          </article>
          <article className="v2-summary-card">
            <span>地区偏好</span>
            <strong>{filters.region || '未限定'}</strong>
            <p>{filters.major || '未填写专业条件'}</p>
          </article>
        </section>

        <section className="v2-feed-list" aria-label="岗位匹配结果">
          {rows.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.matchScore}</div>
              <div className="v2-feed-body">
                <strong>{item.jobName}</strong>
                <p>{item.recruitingUnit}</p>
                <p>{item.region} / {item.examType} / 招录 {item.recruitCount} 人</p>
                <p>{item.educationRequirement} / {item.majorRequirement}</p>
                <div className="v2-tag-row">
                  {item.matchReasons.map((reason) => <span key={reason}>{reason}</span>)}
                </div>
              </div>
              <div className="v2-feed-side">
                <span>{item.registrationStart ? formatDateLabel(item.registrationStart) : '待补充'}</span>
                <span>{item.registrationEnd ? formatDateLabel(item.registrationEnd) : '待补充'}</span>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <div className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有命中的岗位结果</strong>
                <p>可以放宽地区、专业或政治面貌条件后再试一次。</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>学历</span>
              <input
                type="text"
                value={filters.education}
                onChange={(event) => setFilters((current) => ({ ...current, education: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>学位</span>
              <input
                type="text"
                value={filters.degree}
                onChange={(event) => setFilters((current) => ({ ...current, degree: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业</span>
              <input
                type="text"
                value={filters.major}
                onChange={(event) => setFilters((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>地区偏好</span>
              <input
                type="text"
                value={filters.region}
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>岗位类别</span>
              <input
                type="text"
                value={filters.jobCategory}
                onChange={(event) => setFilters((current) => ({ ...current, jobCategory: event.target.value }))}
              />
            </label>
          </form>
        </section>

      </aside>
    </>
  )
}

export function KaogongScoreLinesPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    region: '',
    year: '',
    jobCategory: '',
    unitType: '',
    examType: '',
  })
  const [rows, setRows] = useState(createKaogongScorePreviewRows())
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [notice, setNotice] = useState(previewDataNotice('分数线'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadScoreLines() {
      if (!canUseRemote) {
        const previewRows = createKaogongScorePreviewRows()
        setRows(previewRows)
        setFavoriteCount(0)
        setNotice(previewDataNotice('分数线'))
        return
      }

      setLoading(true)
      try {
        const [scoreData, favoriteData] = await withRequestTimeout(
          Promise.all([
            kaogongApi.scoreLinesPage({ ...filters, page: 0, size: 12 }),
            kaogongApi.favoriteScoreLines(token).catch(() => []),
          ]),
          8000,
          '分数线数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeKaogongScoreRows(scoreData))
        setFavoriteCount(ensureArray(favoriteData).length)
        setNotice(remoteDataNotice('分数线'))
      } catch (error) {
        if (!active) return
        setRows(createKaogongScorePreviewRows())
        setFavoriteCount(0)
        setNotice(fallbackDataNotice('分数线', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadScoreLines()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.examType, filters.jobCategory, filters.region, filters.unitType, filters.year, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="分数线"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '进面账本' },
          ]}
          title="把历年进面分数线排成一张连续账本，方便做纵向比较。"
          lead="这里只看进面线，筛选留在右栏。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新分数线结果…</div> : null}

        <section className="v2-summary-strip" aria-label="分数线摘要">
          <article className="v2-summary-card">
            <span>记录数</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下命中的分数线记录数。</p>
          </article>
          <article className="v2-summary-card">
            <span>最高线</span>
            <strong>{rows[0]?.scoreLine || '待补充'}</strong>
            <p>当前列表中最靠前的进面分数线。</p>
          </article>
          <article className="v2-summary-card">
            <span>已收藏</span>
            <strong>{favoriteCount}</strong>
            <p>真实账号下会同步后端收藏数量。</p>
          </article>
        </section>

        <section className="v2-card-grid">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.jobName}</strong>
              <p>{item.recruitingUnit}</p>
              <p>{item.region} / {item.examType} / {item.year}</p>
              <p>进面线 {item.scoreLine}</p>
              <p>面试比 {item.interviewRatio} / 招录 {item.recruitCount} / 进面 {item.interviewCount}</p>
              <div className="v2-tag-row">
                <span>{item.source}</span>
                <span>{item.dataNote}</span>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-article-card">
              <p>当前筛选条件下没有分数线结果。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={filters.region}
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <input
                type="text"
                value={filters.year}
                onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>岗位类别</span>
              <input
                type="text"
                value={filters.jobCategory}
                onChange={(event) => setFilters((current) => ({ ...current, jobCategory: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>单位类型</span>
              <input
                type="text"
                value={filters.unitType}
                onChange={(event) => setFilters((current) => ({ ...current, unitType: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>考试类别</span>
              <input
                type="text"
                value={filters.examType}
                onChange={(event) => setFilters((current) => ({ ...current, examType: event.target.value }))}
              />
            </label>
          </form>
        </section>

      </aside>
    </>
  )
}

export function KaogongCalendarPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    region: '',
    examType: '',
    year: '',
  })
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
            kaogongApi.calendarExamGroupsPage({ ...filters, page: 0, size: 8 }),
            kaogongApi.mySubscriptions(token).catch(() => []),
            kaogongApi.notifications(token).catch(() => []),
          ]),
          8000,
          '考试日历数据读取超时，请检查后端服务。',
        )

        if (!active) return

        setCalendar(normalizeKaogongCalendarRows(groupsData, subscriptionsData, notificationsData))
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
  }, [canUseRemote, filters.examType, filters.region, filters.year, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考试日历"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '日历时间墙' },
          ]}
          title="让每一个考试节点都带着下一步动作出现，而不是分散在多个页面里。"
          lead="分组、订阅和提醒分开排布，时间墙留在中间。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新考试日历…</div> : null}

        <section className="v2-summary-strip" aria-label="考试日历摘要">
          <article className="v2-summary-card">
            <span>考试分组</span>
            <strong>{calendar.groups.length}</strong>
            <p>当前条件下命中的考试组数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>已订阅</span>
            <strong>{calendar.subscriptions.length}</strong>
            <p>真实账号下会同步后端订阅数据。</p>
          </article>
          <article className="v2-summary-card">
            <span>提醒消息</span>
            <strong>{calendar.notifications.length}</strong>
            <p>当前账号收到的站内考试提醒数量。</p>
          </article>
        </section>

        <section className="v2-card-grid">
          {calendar.groups.map((item) => (
            <article className="v2-module-card" key={item.key}>
              <strong>{item.examType}</strong>
              <p>{item.region} / {item.year}</p>
              {item.events.map((event) => (
                <div className="v2-check-row" key={event.id}>
                  <strong>{event.nodeType}</strong>
                  <span>{event.title}</span>
                  <span>{formatDateLabel(event.eventDate)}</span>
                </div>
              ))}
            </article>
          ))}
        </section>

        <section className="v2-split-board">
          <article className="v2-article-card">
            <p className="v2-kicker">我的订阅</p>
            <div className="v2-check-list">
              {calendar.subscriptions.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.examType}</strong>
                  <span>{item.region} / {item.examYear}</span>
                  <span>提前 {item.remindBeforeDays} 天</span>
                  <span>{item.status}</span>
                </div>
              ))}
              {!calendar.subscriptions.length ? <p>当前还没有考试订阅。</p> : null}
            </div>
          </article>

          <article className="v2-article-card">
            <p className="v2-kicker">提醒消息</p>
            <div className="v2-check-list">
              {calendar.notifications.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.content}</span>
                  <span>{formatDateTimeLabel(item.createdAt)}</span>
                </div>
              ))}
              {!calendar.notifications.length ? <p>当前还没有提醒消息。</p> : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={filters.region}
                placeholder="如：浙江"
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>考试类型</span>
              <input
                type="text"
                value={filters.examType}
                placeholder="如：浙江省公务员考试"
                onChange={(event) => setFilters((current) => ({ ...current, examType: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <input
                type="text"
                value={filters.year}
                placeholder="如：2026"
                onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
          </form>
        </section>

      </aside>
    </>
  )
}

export function KaogongInterviewsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    title: '',
    jobDirection: '',
    status: '',
  })
  const [interviews, setInterviews] = useState(createKaogongInterviewPreview())
  const [notice, setNotice] = useState(previewDataNotice('模拟面试'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadInterviews() {
      if (!canUseRemote) {
        setInterviews(createKaogongInterviewPreview())
        setNotice(previewDataNotice('模拟面试'))
        return
      }

      setLoading(true)
      try {
        const roomsData = await withRequestTimeout(
          kaogongApi.interviewRoomsPage({ ...filters, page: 0, size: 8 }),
          8000,
          '模拟面试房间读取超时，请检查后端服务。',
        )

        const rooms = ensurePage(roomsData).content
        const feedbackSource = rooms[0]?.id
          ? await kaogongApi.interviewFeedbackPage(rooms[0].id, { page: 0, size: 6 }).catch(() => ({ content: [] }))
          : { content: [] }

        if (!active) return

        setInterviews(normalizeKaogongInterviewRows({ content: rooms }, feedbackSource))
        setNotice(remoteDataNotice('模拟面试'))
      } catch (error) {
        if (!active) return
        setInterviews(createKaogongInterviewPreview())
        setNotice(fallbackDataNotice('模拟面试', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInterviews()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.jobDirection, filters.status, filters.title, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="模拟面试"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '房间与复盘' },
          ]}
          title="房间讨论和复盘评价分层展示，先判断是否进入，再看细节。"
          lead="房间和复盘拆成双面板，先决定进哪间，再看反馈。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新面试房间与反馈…</div> : null}

        <section className="v2-summary-strip" aria-label="模拟面试摘要">
          <article className="v2-summary-card">
            <span>房间数量</span>
            <strong>{interviews.rooms.length}</strong>
            <p>当前筛选下可进入的房间数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>复盘条目</span>
            <strong>{interviews.feedback.length}</strong>
            <p>当前房间对应的可见反馈数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选方向</span>
            <strong>{filters.jobDirection || '全部方向'}</strong>
            <p>{filters.status ? getInterviewStatusLabel(filters.status) : '全部状态'}</p>
          </article>
        </section>

        <section className="v2-split-board">
          <article className="v2-article-card">
            <p className="v2-kicker">房间列表</p>
            <div className="v2-check-list">
              {interviews.rooms.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.jobDirection}</span>
                  <span>{item.participantCount} 人 / {getInterviewStatusLabel(item.status)}</span>
                  <span>{item.ownerName} / {formatDateTimeLabel(item.scheduledAt)}</span>
                </div>
              ))}
              {!interviews.rooms.length ? <p>当前没有命中的面试房间。</p> : null}
            </div>
          </article>

          <article className="v2-article-card">
            <p className="v2-kicker">复盘评价</p>
            <div className="v2-check-list">
              {interviews.feedback.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.reviewerName}</strong>
                  <span>{item.score} 分</span>
                  <span>{item.strengths}</span>
                  <span>{item.suggestions}</span>
                </div>
              ))}
              {!interviews.feedback.length ? <p>当前还没有可展示的复盘评价。</p> : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>房间标题</span>
              <input
                type="text"
                value={filters.title}
                onChange={(event) => setFilters((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>岗位方向</span>
              <input
                type="text"
                value={filters.jobDirection}
                onChange={(event) => setFilters((current) => ({ ...current, jobDirection: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>房间状态</span>
              <div className="v2-segment-group" role="group" aria-label="房间状态">
                {interviewStatusOptions.map((item) => (
                  <button
                    className={`v2-segment-button ${filters.status === item.value ? 'is-active' : ''}`}
                    key={item.value || 'all'}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, status: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
          </form>
        </section>
      </aside>
    </>
  )
}
