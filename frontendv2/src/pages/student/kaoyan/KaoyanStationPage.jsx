import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import {
  kaoyanApi,
  materialApi,
  mentorApi,
  studyPlanApi,
  studyRoomApi,
} from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { kaoyanWorkspace } from '@/lib/workspacePreview.js'
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
  formatRatioText,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

function createKaoyanPreviewOverview() {
  return {
    metrics: [
      { label: '院校样本', value: formatCountText(kaoyanWorkspace.compareBoard.length, '所') },
      { label: '计划阶段', value: formatCountText(kaoyanWorkspace.plans.length, '段') },
      { label: '资料归档', value: formatCountText(kaoyanWorkspace.shelves.length, '层') },
    ],
    schools: kaoyanWorkspace.compareBoard,
    plans: kaoyanWorkspace.plans,
    materials: kaoyanWorkspace.shelves,
    mentors: kaoyanWorkspace.support.mentors,
    rooms: kaoyanWorkspace.support.rooms,
  }
}

function createKaoyanSchoolPreviewRows() {
  return kaoyanWorkspace.compareBoard.map((item, index) => ({
    id: `preview-school-${index}`,
    schoolName: item.school,
    majorName: item.major,
    region: '待补充',
    schoolType: '预览院校',
    totalScoreLine: String(item.line).replace(/[^\d]/g, ''),
    year: '近年',
    admissionRatio: item.trend,
    plannedEnrollment: '待补充',
    note: item.note,
    is985: item.school.includes('大学'),
    is211: item.school.includes('大学'),
  }))
}

function createKaoyanPlanPreviewRows() {
  return kaoyanWorkspace.plans.map((item, index) => ({
    id: `preview-plan-${index}`,
    name: item.title,
    description: item.note,
    startDate: `2026-06-${String(index + 10).padStart(2, '0')}`,
    endDate: `2026-06-${String(index + 11).padStart(2, '0')}`,
    totalDurationHours: 4 + index * 2,
    stageLabel: item.state,
  }))
}

function createKaoyanMaterialPreviewRows() {
  return kaoyanWorkspace.shelves.map((item, index) => ({
    id: `preview-material-${index}`,
    title: item.label,
    subject: item.label,
    materialType: '资料包',
    school: '方向预览',
    major: '公共能力',
    year: '近三年',
    attachments: Array.from({ length: item.count }, (_, attachmentIndex) => ({
      id: `preview-attachment-${attachmentIndex}`,
    })),
    description: item.note,
    status: 'APPROVED',
    viewCount: item.count * 12,
    downloadCount: item.count * 4,
  }))
}

function createKaoyanSupportPreview() {
  return {
    mentors: kaoyanWorkspace.support.mentors.map((item, index) => ({
      id: `preview-mentor-${index}`,
      nickname: item.name,
      graduateSchool: '方向预览',
      major: item.field,
      expertiseSubjects: item.note,
      bio: item.status,
      enrollmentYear: '2024',
    })),
    rooms: kaoyanWorkspace.support.rooms.map((item, index) => ({
      id: `preview-room-${index}`,
      name: item.room,
      schoolName: '方向预览',
      major: item.topic,
      memberCount: item.online,
      createdByName: item.rank,
      createdAt: '2026-06-12T09:00:00',
    })),
    unreadCount: 0,
  }
}

function buildSchoolRows(schoolsData, scoreLinesData) {
  const schoolPage = ensurePage(schoolsData)
  const scorePage = ensurePage(scoreLinesData)
  const schoolMap = new Map(
    schoolPage.content.map((item) => [
      item.id ?? item.name,
      item,
    ]),
  )

  const rows = scorePage.content.map((item) => {
    const matchedSchool = schoolMap.get(item.schoolId) || schoolPage.content.find(
      (school) => school.name === item.schoolName,
    ) || {}

    return {
      id: item.id,
      schoolName: item.schoolName || matchedSchool.name || '未命名院校',
      majorName: item.majorName || '未命名专业',
      majorCategory: item.majorCategory || '未标注门类',
      region: matchedSchool.region || matchedSchool.province || '地区待补充',
      schoolType: matchedSchool.schoolType || '院校类型待补充',
      totalScoreLine: item.totalScoreLine,
      year: item.year,
      admissionRatio: item.admissionRatio,
      plannedEnrollment: item.plannedEnrollment,
      note: firstNonEmpty(
        matchedSchool.province && `${matchedSchool.province} / ${matchedSchool.region || '地区未标注'}`,
        matchedSchool.region,
        '后端暂未补充附加说明',
      ),
      is985: Boolean(matchedSchool.is985),
      is211: Boolean(matchedSchool.is211),
    }
  })

  if (rows.length) {
    return {
      rows,
      schoolCount: schoolPage.totalElements,
      scoreCount: scorePage.totalElements,
    }
  }

  return {
    rows: schoolPage.content.map((item, index) => ({
      id: item.id ?? `school-${index}`,
      schoolName: item.name || '未命名院校',
      majorName: '等待分数线数据',
      majorCategory: '待补充',
      region: item.region || item.province || '地区待补充',
      schoolType: item.schoolType || '院校类型待补充',
      totalScoreLine: '',
      year: '',
      admissionRatio: '',
      plannedEnrollment: '',
      note: firstNonEmpty(item.province, item.region, '当前仅返回院校档案'),
      is985: Boolean(item.is985),
      is211: Boolean(item.is211),
    })),
    schoolCount: schoolPage.totalElements,
    scoreCount: scorePage.totalElements,
  }
}

function normalizePlanRows(data) {
  return ensureArray(data).map((item, index) => ({
    id: item.id ?? `plan-${index}`,
    name: item.name || '未命名计划',
    description: item.description || '后端暂未补充计划说明',
    startDate: item.startDate,
    endDate: item.endDate,
    totalDurationHours: item.totalDurationHours,
    stageLabel: item.status || item.stage || '计划执行中',
  }))
}

function normalizeMaterialRows(data) {
  return ensurePage(data).content.map((item) => ({
    id: item.id,
    title: item.title || '未命名资料',
    subject: item.subject || '科目待补充',
    materialType: item.materialType || '类型待补充',
    school: item.school || '院校待补充',
    major: item.major || '专业待补充',
    year: item.year || '年份待补充',
    attachments: ensureArray(item.attachments),
    description: item.description || '后端暂未补充资料说明',
    status: item.status || 'APPROVED',
    viewCount: Number(item.viewCount || 0),
    downloadCount: Number(item.downloadCount || 0),
  }))
}

function normalizeSupportRows(mentorsData, roomsData, unreadData) {
  const mentorPage = ensurePage(mentorsData)
  const roomPage = ensurePage(roomsData)

  return {
    mentors: mentorPage.content.map((item) => ({
      id: item.id,
      nickname: item.nickname || '匿名导师',
      graduateSchool: item.graduateSchool || '院校待补充',
      major: item.major || '专业待补充',
      expertiseSubjects: item.expertiseSubjects || '擅长方向待补充',
      bio: item.bio || '后端暂未补充导师简介',
      enrollmentYear: item.enrollmentYear || '届次待补充',
    })),
    rooms: roomPage.content.map((item) => ({
      id: item.id,
      name: item.name || '未命名自习室',
      schoolName: item.schoolName || '院校待补充',
      major: item.major || '专业待补充',
      memberCount: Number(item.memberCount || 0),
      createdByName: item.createdByName || '发起人待补充',
      createdAt: item.createdAt,
    })),
    unreadCount: Number(unreadData?.count || 0),
  }
}

export default function KaoyanStationPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [overview, setOverview] = useState(createKaoyanPreviewOverview())
  const [notice, setNotice] = useState(previewDataNotice('考研主站'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setOverview(createKaoyanPreviewOverview())
        setNotice(previewDataNotice('考研主站'))
        return
      }

      setLoading(true)
      try {
        const [
          schoolsData,
          scoreLinesData,
          plansData,
          materialsData,
          mentorsData,
          roomsData,
        ] = await withRequestTimeout(
          Promise.all([
            kaoyanApi.schoolsPage({ size: 6 }),
            kaoyanApi.scoreLinesPage({ size: 6 }),
            studyPlanApi.myPlans(token),
            materialApi.listPage({ size: 6 }),
            mentorApi.mentorsPage({ size: 4 }),
            studyRoomApi.roomList({ page: 0, size: 4 }),
          ]),
          8000,
          '考研主站数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const schoolRows = buildSchoolRows(schoolsData, scoreLinesData).rows
        const planRows = normalizePlanRows(plansData)
        const materialRows = normalizeMaterialRows(materialsData)
        const supportRows = normalizeSupportRows(mentorsData, roomsData)

        setOverview({
          metrics: [
            { label: '院校样本', value: formatCountText(schoolRows.length, '条') },
            { label: '计划节点', value: formatCountText(planRows.length, '项') },
            { label: '资料条目', value: formatCountText(materialRows.length, '条') },
          ],
          schools: schoolRows.slice(0, 3),
          plans: planRows.slice(0, 4),
          materials: materialRows.slice(0, 3),
          mentors: supportRows.mentors.slice(0, 2),
          rooms: supportRows.rooms.slice(0, 2),
        })
        setNotice(remoteDataNotice('考研主站'))
      } catch (error) {
        if (!active) return
        setOverview(createKaoyanPreviewOverview())
        setNotice(fallbackDataNotice('考研主站', error))
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
        kicker="考研主站"
        title="考研总览"
        lead="先看总览，再进子页。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步考研主站数据…</div> : null}

      <section className="v2-summary-strip" aria-label="考研主站摘要">
        {overview.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>先看状态，再决定进入哪个子页继续处理。</p>
          </article>
        ))}
      </section>

      <section className="v2-overview-grid" aria-label="考研主站入口">
        <Link className="v2-preview-panel" to="/station/kaoyan/schools">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">院校比较</p>
              <strong>把院校档案和分数线放到同一张比较账本里。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.schools.map((item) => (
              <div className="v2-preview-row" key={item.id || `${item.schoolName}-${item.majorName}`}>
                <strong>{item.schoolName || item.school}</strong>
                <span>{item.majorName || item.major}</span>
                <small>
                  {item.totalScoreLine ? `总分线 ${item.totalScoreLine}` : item.line}
                  {' / '}
                  {item.region || item.trend}
                </small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/plans">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">学习计划</p>
              <strong>把长期计划拆成可以逐段完成的时间节点。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.plans.map((item) => (
              <div className="v2-preview-row" key={item.id || `${item.slot}-${item.name}`}>
                <strong>{item.name || item.title}</strong>
                <span>{item.stageLabel || item.state}</span>
                <small>{firstNonEmpty(item.description, item.note, '等待补充计划说明')}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-overview-grid" aria-label="考研支撑入口">
        <Link className="v2-preview-panel" to="/station/kaoyan/materials">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">资料管理</p>
              <strong>先看资料用途和状态，再决定下载、收藏或换源。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.materials.map((item) => (
              <div className="v2-preview-row" key={item.id || item.label}>
                <strong>{item.title || item.label}</strong>
                <span>{item.subject || `${item.count} 份资料`}</span>
                <small>{item.description || item.note}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/support">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">陪跑协同</p>
              <strong>导师咨询和自习室都收进同一个支持页里。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.mentors.map((item) => (
              <div className="v2-preview-row" key={item.id || item.nickname}>
                <strong>{item.nickname || item.name}</strong>
                <span>{item.major || item.field}</span>
                <small>{item.bio || item.note}</small>
              </div>
            ))}
            {overview.rooms.map((item) => (
              <div className="v2-preview-row" key={item.id || item.name || item.room}>
                <strong>{item.name || item.room}</strong>
                <span>{item.major || item.topic}</span>
                <small>{item.memberCount ? `${item.memberCount} 人在线` : item.rank}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>
    </div>
  )
}

export function KaoyanSchoolsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    region: '',
    majorCategory: '',
    year: '',
    is985: '',
    keyword: '',
  })
  const [rows, setRows] = useState(createKaoyanSchoolPreviewRows())
  const [meta, setMeta] = useState({ schoolCount: rows.length, scoreCount: rows.length })
  const [notice, setNotice] = useState(previewDataNotice('院校比较'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        const previewRows = createKaoyanSchoolPreviewRows()
        setRows(previewRows)
        setMeta({ schoolCount: previewRows.length, scoreCount: previewRows.length })
        setNotice(previewDataNotice('院校比较'))
        return
      }

      setLoading(true)
      try {
        const [schoolsData, scoreLinesData] = await withRequestTimeout(
          Promise.all([
            kaoyanApi.schoolsPage({
              schoolName: filters.keyword.trim(),
              region: filters.region.trim(),
              is985: filters.is985,
              size: 24,
            }),
            kaoyanApi.scoreLinesPage({
              schoolName: filters.keyword.trim(),
              region: filters.region.trim(),
              majorCategory: filters.majorCategory,
              year: filters.year,
              size: 24,
            }),
          ]),
          8000,
          '院校比较数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const next = buildSchoolRows(schoolsData, scoreLinesData)
        setRows(next.rows)
        setMeta({ schoolCount: next.schoolCount, scoreCount: next.scoreCount })
        setNotice(remoteDataNotice('院校比较'))
      } catch (error) {
        if (!active) return
        const previewRows = createKaoyanSchoolPreviewRows()
        setRows(previewRows)
        setMeta({ schoolCount: previewRows.length, scoreCount: previewRows.length })
        setNotice(fallbackDataNotice('院校比较', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.is985, filters.keyword, filters.majorCategory, filters.region, filters.year])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="院校比较"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '择校账本' },
          ]}
          title="择校账本"
          lead="主区只看比较结果。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="院校比较摘要">
          <article className="v2-summary-card">
            <span>院校档案</span>
            <strong>{meta.schoolCount}</strong>
            <p>当前命中的院校基础档案数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>分数线样本</span>
            <strong>{meta.scoreCount}</strong>
            <p>当前账本中可直接比较的分数线记录数。</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选状态</span>
            <strong>{filters.year || '全部年份'}</strong>
            <p>{filters.majorCategory || '全部门类'} / {filters.region || '全部地区'}</p>
          </article>
        </section>

        {loading ? <div className="v2-status-note">正在刷新院校比较结果…</div> : null}

        <section className="v2-ledger-card" aria-label="院校账本">
          {rows.map((item) => (
            <div className="v2-ledger-row" key={item.id}>
              <div>
                <strong>{item.schoolName}</strong>
                <p>{item.majorName}</p>
                <p>{item.region} / {item.schoolType}</p>
              </div>
              <div>
                <strong>{item.totalScoreLine ? `总分线 ${item.totalScoreLine}` : '总分线待补充'}</strong>
                <p>{item.year ? `${item.year} 年` : '年份待补充'}</p>
                <p>{item.majorCategory}</p>
              </div>
              <div>
                <p>{item.note}</p>
                <div className="v2-tag-row">
                  {item.is985 ? <span>985</span> : null}
                  {item.is211 ? <span>211</span> : null}
                  {item.admissionRatio ? <span>报录比 {formatRatioText(item.admissionRatio)}</span> : null}
                  {item.plannedEnrollment ? <span>计划 {item.plannedEnrollment}</span> : null}
                </div>
              </div>
            </div>
          ))}
          {!rows.length ? (
            <div className="v2-status-note">当前筛选条件下没有可比较的院校样本。</div>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>院校地区</span>
              <input
                type="text"
                value={filters.region}
                placeholder="如：华东 / 浙江"
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业门类</span>
              <input
                type="text"
                value={filters.majorCategory}
                placeholder="如：工学 / 教育学"
                onChange={(event) => setFilters((current) => ({ ...current, majorCategory: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>分数线年份</span>
              <input
                type="text"
                value={filters.year}
                placeholder="如：2025"
                onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>985 院校</span>
              <div className="v2-segment-group">
                {[
                  { value: '', label: '全部' },
                  { value: 'true', label: '只看 985' },
                  { value: 'false', label: '排除 985' },
                ].map((item) => (
                  <button
                    key={item.value || 'all'}
                    className={`v2-segment-button ${filters.is985 === item.value ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, is985: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                placeholder="院校名或专业名"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

      </aside>
    </>
  )
}

export function KaoyanPlansPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [plans, setPlans] = useState(createKaoyanPlanPreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('学习计划'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPlans() {
      if (!canUseRemote) {
        setPlans(createKaoyanPlanPreviewRows())
        setNotice(previewDataNotice('学习计划'))
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          studyPlanApi.myPlans(token),
          8000,
          '学习计划读取超时，请检查后端服务。',
        )
        if (!active) return
        const nextPlans = normalizePlanRows(data)
        setPlans(nextPlans)
        setNotice(remoteDataNotice('学习计划'))
      } catch (error) {
        if (!active) return
        setPlans(createKaoyanPlanPreviewRows())
        setNotice(fallbackDataNotice('学习计划', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPlans()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="学习计划"
        pathItems={[
          { label: '考研主站', to: '/station/kaoyan' },
          { label: '计划轨道' },
        ]}
        title="计划轨道"
        lead="主区直接看时间轨。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步计划数据…</div> : null}

      <section className="v2-summary-strip" aria-label="学习计划摘要">
        <article className="v2-summary-card">
          <span>计划数量</span>
          <strong>{plans.length}</strong>
          <p>后端已保存的学习计划总数。</p>
        </article>
        <article className="v2-summary-card">
          <span>最早开始</span>
          <strong>{plans[0]?.startDate ? formatDateLabel(plans[0].startDate) : '待补充'}</strong>
          <p>主站会按时间顺序展示计划轨道。</p>
        </article>
        <article className="v2-summary-card">
          <span>当前关注</span>
          <strong>{plans[0]?.name || '暂无计划'}</strong>
          <p>{plans[0]?.stageLabel || '等待补充状态说明'}</p>
        </article>
      </section>

      <section className="v2-timeline-card" aria-label="学习计划轨道">
        {plans.map((item) => (
          <article className="v2-timeline-row" key={item.id}>
            <div className="v2-timeline-pin">
              {item.startDate ? formatDateLabel(item.startDate).slice(5) : '待排期'}
            </div>
            <div className="v2-timeline-body">
              <strong>{item.name}</strong>
              <p>
                {item.startDate ? formatDateLabel(item.startDate) : '待补充开始时间'}
                {' 至 '}
                {item.endDate ? formatDateLabel(item.endDate) : '待补充结束时间'}
              </p>
              <span>{item.description}</span>
              <div className="v2-tag-row">
                <span>{item.stageLabel}</span>
                {item.totalDurationHours ? <span>{item.totalDurationHours} 小时</span> : null}
              </div>
            </div>
          </article>
        ))}
        {!plans.length ? (
          <div className="v2-status-note">当前还没有学习计划，请先在后端创建计划。</div>
        ) : null}
      </section>
    </div>
  )
}

export function KaoyanMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    keyword: '',
    subject: '',
    year: '',
    materialType: '',
  })
  const [rows, setRows] = useState(createKaoyanMaterialPreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('资料页'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadMaterials() {
      if (!canUseRemote) {
        setRows(createKaoyanMaterialPreviewRows())
        setNotice(previewDataNotice('资料页'))
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          materialApi.listPage({
            keyword: filters.keyword.trim(),
            subject: filters.subject.trim(),
            year: filters.year,
            materialType: filters.materialType.trim(),
            page: 0,
            size: 12,
          }),
          8000,
          '资料页数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeMaterialRows(data))
        setNotice(remoteDataNotice('资料页'))
      } catch (error) {
        if (!active) return
        setRows(createKaoyanMaterialPreviewRows())
        setNotice(fallbackDataNotice('资料页', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMaterials()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.keyword, filters.materialType, filters.subject, filters.year])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="资料管理"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '资料货架' },
          ]}
          title="资料中枢"
          lead="主区只保留资料结果。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新资料列表…</div> : null}

        <section className="v2-card-grid">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.school} / {item.major}</p>
              <p>{item.subject} / {item.materialType} / {item.year}</p>
              <p>{item.description}</p>
              <div className="v2-tag-row">
                <span>{item.status}</span>
                <span>附件 {item.attachments.length}</span>
                <span>浏览 {item.viewCount}</span>
                <span>下载 {item.downloadCount}</span>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-article-card">
              <p>当前筛选条件下没有资料条目。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                placeholder="标题、院校或专业"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>科目</span>
              <input
                type="text"
                value={filters.subject}
                placeholder="如：政治 / 英语"
                onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <input
                type="text"
                value={filters.year}
                placeholder="如：2025"
                onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>资料类型</span>
              <input
                type="text"
                value={filters.materialType}
                placeholder="如：真题 / 课件"
                onChange={(event) => setFilters((current) => ({ ...current, materialType: event.target.value }))}
              />
            </label>
          </form>
        </section>

      </aside>
    </>
  )
}

export function KaoyanSupportPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    school: '',
    major: '',
    expertise: '',
  })
  const [support, setSupport] = useState(createKaoyanSupportPreview())
  const [notice, setNotice] = useState(previewDataNotice('协同页'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSupport() {
      if (!canUseRemote) {
        setSupport(createKaoyanSupportPreview())
        setNotice(previewDataNotice('协同页'))
        return
      }

      setLoading(true)
      try {
        const [mentorsData, roomsData, unreadData] = await withRequestTimeout(
          Promise.all([
            mentorApi.mentorsPage({
              graduateSchool: filters.school.trim(),
              major: filters.major.trim(),
              expertiseSubjects: filters.expertise.trim(),
              page: 0,
              size: 8,
            }),
            studyRoomApi.roomList({
              major: filters.major.trim(),
              page: 0,
              size: 8,
            }),
            mentorApi.unreadCount(token).catch(() => ({ count: 0 })),
          ]),
          8000,
          '陪跑协同数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setSupport(normalizeSupportRows(mentorsData, roomsData, unreadData))
        setNotice(remoteDataNotice('协同页'))
      } catch (error) {
        if (!active) return
        setSupport(createKaoyanSupportPreview())
        setNotice(fallbackDataNotice('协同页', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSupport()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.expertise, filters.major, filters.school, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="陪跑协同"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '支持协同' },
          ]}
          title="考研陪伴"
          lead="先选支持资源，再继续下钻。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新协同资源…</div> : null}

        <section className="v2-summary-strip" aria-label="协同摘要">
          <article className="v2-summary-card">
            <span>导师样本</span>
            <strong>{support.mentors.length}</strong>
            <p>当前筛选下可浏览的导师档案数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>自习室</span>
            <strong>{support.rooms.length}</strong>
            <p>当前可加入或围观的自习室数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>未读咨询</span>
            <strong>{support.unreadCount}</strong>
            <p>真实账号下会同步后端未读会话提醒。</p>
          </article>
        </section>

        <section className="v2-split-board">
          <article className="v2-article-card">
            <p className="v2-kicker">导师咨询</p>
            <div className="v2-check-list">
              {support.mentors.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.nickname}</strong>
                  <span>{item.graduateSchool} / {item.major}</span>
                  <span>{item.expertiseSubjects}</span>
                  <span>{item.bio}</span>
                </div>
              ))}
              {!support.mentors.length ? <p>当前没有命中的导师档案。</p> : null}
            </div>
          </article>

          <article className="v2-article-card">
            <p className="v2-kicker">自习室</p>
            <div className="v2-check-list">
              {support.rooms.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.schoolName} / {item.major}</span>
                  <span>{item.memberCount} 人在场</span>
                  <span>{item.createdByName} / {formatDateTimeLabel(item.createdAt)}</span>
                </div>
              ))}
              {!support.rooms.length ? <p>当前没有命中的自习室。</p> : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>目标院校</span>
              <input
                type="text"
                value={filters.school}
                placeholder="如：浙江大学"
                onChange={(event) => setFilters((current) => ({ ...current, school: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                type="text"
                value={filters.major}
                placeholder="如：计算机 / 教育学"
                onChange={(event) => setFilters((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>擅长科目</span>
              <input
                type="text"
                value={filters.expertise}
                placeholder="如：英语 / 政治"
                onChange={(event) => setFilters((current) => ({ ...current, expertise: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">进入建议</p>
          <ul>
            <li>先用院校和专业缩小范围，再判断是找导师还是进自习室。</li>
            <li>咨询和陪跑都放在这里，避免来回跳两个无关页面。</li>
            <li>处理完支持问题后，可沿路径返回主站继续看计划或资料。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
