import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { studyAbroadWorkspace } from '@/lib/workspacePreview.js'
import {
  canUseRemoteToken,
  ensureArray,
  ensurePage,
  firstNonEmpty,
  formatCountText,
  formatDateLabel,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

function createStudyAbroadPreviewOverview() {
  return {
    metrics: [
      { label: '项目样本', value: formatCountText(studyAbroadWorkspace.programs.length, '条') },
      { label: '在申项目', value: formatCountText(studyAbroadWorkspace.applications.length, '项') },
      { label: '材料条目', value: formatCountText(studyAbroadWorkspace.materials.length, '项') },
    ],
    programs: createStudyAbroadProgramPreviewRows(),
    cases: createStudyAbroadCasePreviewRows(),
    applications: createStudyAbroadApplicationPreviewRows(),
    timeline: createStudyAbroadTimelinePreviewRows(),
    materials: createStudyAbroadMaterialPreviewRows(),
  }
}

function createStudyAbroadProgramPreviewRows() {
  return [
    {
      id: 'preview-program-nus',
      country: 'Singapore',
      schoolName: 'National University of Singapore',
      programName: 'MSc Artificial Intelligence',
      degree: 'Master',
      subjectArea: '计算机与数据',
      qsRank: 'QS 2026: Top 10',
      tuitionRange: '约 SGD 60k/项目',
      durationText: '1 年',
      deadlineText: '3 月中旬',
      applicationRequirements: '相关专业背景、语言成绩、推荐信',
      visaPolicy: '按学校录取流程申请学生准证',
      employmentPolicy: '科技岗位集中，建议尽早准备实习和作品',
      partnerProgram: true,
      partnerNote: '与本校有合作交流项目',
      riskTags: ['竞争强'],
      riskSummary: '建议同时准备 1-2 个保底项目。',
      sourceNote: '当前为前端预览样本。',
      policyUpdatedAt: '2026-06-01',
    },
    ...studyAbroadWorkspace.programs.map((item, index) => ({
      id: `preview-program-${index}`,
      country: 'UK',
      schoolName: item.school,
      programName: item.track,
      degree: 'Master',
      subjectArea: '综合方向',
      qsRank: '排名待补充',
      tuitionRange: '学费待补充',
      durationText: '学制待补充',
      deadlineText: item.round,
      applicationRequirements: item.note,
      visaPolicy: '签证信息待补充',
      employmentPolicy: '就业说明待补充',
      partnerProgram: false,
      partnerNote: '',
      riskTags: [],
      riskSummary: item.note,
      sourceNote: '当前为前端预览样本。',
      policyUpdatedAt: '2026-06-01',
    })),
  ]
}

function createStudyAbroadCasePreviewRows() {
  return studyAbroadWorkspace.cases.map((item, index) => ({
    id: `preview-case-${index}`,
    country: 'UK',
    school: item.title,
    program: item.accent,
    studentMajor: '跨专业样本',
    gpa: '3.6/4.0',
    languageScore: 'IELTS 7.0',
    admissionResult: index === 0 ? 'admit' : 'waitlist',
    tags: ['案例预览'],
    summary: item.summary,
    applicationYear: '2026',
  }))
}

function createStudyAbroadApplicationPreviewRows() {
  return studyAbroadWorkspace.applications.map((item, index) => ({
    id: `preview-application-${index}`,
    country: 'UK',
    school: item.school,
    program: item.owner,
    degree: 'Master',
    intake: '2027 秋季',
    applicationRound: '第一轮',
    deadline: `2026-09-${String(index + 10).padStart(2, '0')}`,
    status: item.status,
    priority: index === 0 ? 'dream' : 'match',
    note: item.nextStep,
  }))
}

function createStudyAbroadTimelinePreviewRows() {
  return studyAbroadWorkspace.timeline.map((item, index) => ({
    id: `preview-timeline-${index}`,
    title: item.stage,
    country: 'UK',
    school: '方向预览',
    phase: item.stage,
    dueDate: `2026-07-${String(index + 6).padStart(2, '0')}`,
    status: index === 0 ? 'doing' : 'todo',
    note: item.note,
    applicationSchool: '方向预览',
    applicationProgram: item.stage,
  }))
}

function createStudyAbroadMaterialPreviewRows() {
  return studyAbroadWorkspace.materials.map((item, index) => ({
    id: `preview-material-${index}`,
    title: item.title,
    country: 'UK',
    stage: 'Documents',
    category: '申请材料',
    deadline: `2026-08-${String(index + 8).padStart(2, '0')}`,
    completed: item.state.includes('已'),
    note: item.note,
    attachments: index === 0 ? [{ id: 'preview-attachment-1' }] : [],
    applicationSchool: '方向预览',
    applicationProgram: '项目待补充',
  }))
}

function normalizeProgramRows(data) {
  return ensurePage(data).content.map((item) => ({
    id: item.id,
    country: item.country || '地区待补充',
    schoolName: item.schoolName || '院校待补充',
    programName: item.programName || '项目待补充',
    degree: item.degree || '学位待补充',
    subjectArea: item.subjectArea || '方向待补充',
    qsRank: item.qsRank || '排名待补充',
    tuitionRange: item.tuitionRange || '学费待补充',
    durationText: item.durationText || '学制待补充',
    deadlineText: item.deadlineText || '截止待补充',
    applicationRequirements: item.applicationRequirements || '申请要求待补充',
    visaPolicy: item.visaPolicy || '签证说明待补充',
    employmentPolicy: item.employmentPolicy || '就业说明待补充',
    partnerProgram: Boolean(item.partnerProgram),
    partnerNote: item.partnerNote || '暂无合作说明',
    riskTags: ensureArray(item.riskTags),
    riskSummary: item.riskSummary || '暂无风险说明',
    sourceNote: item.sourceNote || '来源待补充',
    policyUpdatedAt: item.policyUpdatedAt || '',
  }))
}

function normalizeCaseRows(data) {
  return ensurePage(data).content.map((item) => ({
    id: item.id,
    country: item.country || '地区待补充',
    school: item.school || '院校待补充',
    program: item.program || '项目待补充',
    studentMajor: item.studentMajor || '本科专业待补充',
    gpa: item.gpa || 'GPA 待补充',
    languageScore: item.languageScore || '语言成绩待补充',
    admissionResult: item.admissionResult || '结果待补充',
    tags: Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').map((entry) => entry.trim()).filter(Boolean),
    summary: item.summary || '后端暂未补充案例总结',
    applicationYear: item.applicationYear || '申请年份待补充',
  }))
}

function normalizeApplicationRows(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    country: item.country || '地区待补充',
    school: item.school || '院校待补充',
    program: item.program || '项目待补充',
    degree: item.degree || '学位待补充',
    intake: item.intake || '入学季待补充',
    applicationRound: item.applicationRound || '轮次待补充',
    deadline: item.deadline || '',
    status: item.status || 'planning',
    priority: item.priority || 'match',
    note: item.note || '后端暂未补充申请说明',
  }))
}

function normalizeTimelineRows(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    title: item.title || '未命名节点',
    country: item.country || '地区待补充',
    school: item.school || '院校待补充',
    phase: item.phase || '阶段待补充',
    dueDate: item.dueDate || '',
    status: item.status || 'todo',
    note: item.note || '后端暂未补充节点说明',
    applicationSchool: item.applicationSchool || '',
    applicationProgram: item.applicationProgram || '',
  }))
}

function normalizeMaterialRows(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    title: item.title || '未命名材料',
    country: item.country || '地区待补充',
    stage: item.stage || '阶段待补充',
    category: item.category || '类型待补充',
    deadline: item.deadline || '',
    completed: Boolean(item.completed),
    note: item.note || '后端暂未补充材料说明',
    attachments: ensureArray(item.attachments),
    applicationSchool: item.applicationSchool || '',
    applicationProgram: item.applicationProgram || '',
  }))
}

export default function StudyAbroadStationPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [overview, setOverview] = useState(createStudyAbroadPreviewOverview())
  const [notice, setNotice] = useState('当前显示的是留学主站预览数据，页面层级已经按后端流程拆好。')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setOverview(createStudyAbroadPreviewOverview())
        setNotice('当前显示的是留学主站预览数据，登录真实账号后会切换成后端项目、申请、时间线和材料数据。')
        return
      }

      setLoading(true)
      try {
        const [programData, caseData, applicationData, timelineData, materialData] = await withRequestTimeout(
          Promise.all([
            studyAbroadApi.schoolProgramsPage({ page: 0, size: 6 }),
            studyAbroadApi.admissionCasesPage({ page: 0, size: 6 }),
            studyAbroadApi.applications(token),
            studyAbroadApi.timeline(token),
            studyAbroadApi.materials(token),
          ]),
          8000,
          '留学主站数据读取超时，请检查后端服务。',
        )

        if (!active) return

        setOverview({
          metrics: [
            { label: '项目目录', value: formatCountText(normalizeProgramRows(programData).length, '条') },
            { label: '在申项目', value: formatCountText(normalizeApplicationRows(applicationData).length, '项') },
            { label: '材料清单', value: formatCountText(normalizeMaterialRows(materialData).length, '项') },
          ],
          programs: normalizeProgramRows(programData).slice(0, 3),
          cases: normalizeCaseRows(caseData).slice(0, 3),
          applications: normalizeApplicationRows(applicationData).slice(0, 3),
          timeline: normalizeTimelineRows(timelineData).slice(0, 3),
          materials: normalizeMaterialRows(materialData).slice(0, 3),
        })
        setNotice('已连接留学后端数据。主站会先展示项目、案例、申请、时间线和材料五条主线，再进入子页继续处理。')
      } catch (error) {
        if (!active) return
        setOverview(createStudyAbroadPreviewOverview())
        setNotice(error.message || '留学主站数据读取失败，当前回退到预览数据。')
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
        kicker="留学主站"
        title="把项目筛选、申请推进和材料状态收进同一张留学推进图里。"
        lead="留学主站先展示项目目录、案例参考、申请跟踪、时间线和材料清单五条主线，再把每一步拆到对应子页里继续处理。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步留学主站数据…</div> : null}

      <section className="v2-summary-strip" aria-label="留学主站摘要">
        {overview.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>先看整体密度，再决定进入哪个子页继续推进。</p>
          </article>
        ))}
      </section>

      <section className="v2-overview-grid" aria-label="留学主站入口">
        <Link className="v2-preview-panel" to="/station/studyabroad/programs">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">项目目录</p>
              <strong>先比项目，再决定主申、冲刺和保底组合。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.programs.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.schoolName}</strong>
                <span>{item.programName}</span>
                <small>{item.qsRank}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/studyabroad/cases">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">案例库</p>
              <strong>先看相近背景案例，再判断自己的风险和空间。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.cases.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.school}</strong>
                <span>{item.program}</span>
                <small>{item.summary}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-overview-grid" aria-label="留学推进入口">
        <Link className="v2-preview-panel" to="/station/studyabroad/applications">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">申请跟踪</p>
              <strong>每个项目都挂在一条可继续推进的状态线上。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.applications.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.school}</strong>
                <span>{item.status}</span>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/studyabroad/timeline">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">时间线</p>
              <strong>阶段节点和截止日期留在同一个时间轨道上。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.timeline.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.phase}</span>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-overview-grid" aria-label="留学材料入口">
        <Link className="v2-preview-panel" to="/station/studyabroad/materials">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">材料清单</p>
              <strong>材料状态单独看，不把上传和筛选动作混成一屏。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.materials.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.completed ? '已完成' : '待完成'}</span>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>
    </div>
  )
}

export function StudyAbroadProgramsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    country: '',
    subjectArea: '',
    keyword: '',
    partnerOnly: false,
  })
  const [rows, setRows] = useState(createStudyAbroadProgramPreviewRows())
  const [notice, setNotice] = useState('当前显示的是项目目录预览数据。')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadPrograms() {
      if (!canUseRemote) {
        setRows(createStudyAbroadProgramPreviewRows())
        setNotice('当前显示的是项目目录预览数据，登录真实账号后会切换成后端项目目录。')
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          studyAbroadApi.schoolProgramsPage({
            country: filters.country.trim(),
            subjectArea: filters.subjectArea.trim(),
            keyword: filters.keyword.trim(),
            partnerOnly: filters.partnerOnly || undefined,
            page: 0,
            size: 12,
          }),
          8000,
          '项目目录读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeProgramRows(data))
        setNotice('当前内容来自项目目录接口。筛选器放在右栏，中间区域只保留项目比较结果。')
      } catch (error) {
        if (!active) return
        setRows(createStudyAbroadProgramPreviewRows())
        setNotice(error.message || '项目目录读取失败，当前回退到预览数据。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPrograms()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.country, filters.keyword, filters.partnerOnly, filters.subjectArea])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="项目目录"
          pathItems={[
            { label: '留学主站', to: '/station/studyabroad' },
            { label: '项目书架' },
          ]}
          title="先比较项目，再决定主申、冲刺和保底的组合结构。"
          lead="项目页中间只做项目比较。右栏收拢筛选条件，避免项目信息和控制器混在一起。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新项目目录…</div> : null}

        <section className="v2-summary-strip" aria-label="项目目录摘要">
          <article className="v2-summary-card">
            <span>项目数量</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下可比较的项目数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>国家筛选</span>
            <strong>{filters.country || '全部国家'}</strong>
            <p>{filters.subjectArea || '全部方向'}</p>
          </article>
          <article className="v2-summary-card">
            <span>合作项目</span>
            <strong>{rows.filter((item) => item.partnerProgram).length}</strong>
            <p>当前结果中带合作标记的项目数量。</p>
          </article>
        </section>

        <section className="v2-card-grid">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.schoolName}</strong>
              <p>{item.programName}</p>
              <p>{item.country} / {item.degree} / {item.subjectArea}</p>
              <p>{item.qsRank} / {item.tuitionRange}</p>
              <p>{item.deadlineText}</p>
              <div className="v2-tag-row">
                {item.partnerProgram ? <span>合作项目</span> : null}
                {item.riskTags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-article-card">
              <p>当前筛选条件下没有项目目录结果。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>国家 / 地区</span>
              <input
                type="text"
                value={filters.country}
                placeholder="如：Singapore / UK"
                onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                type="text"
                value={filters.subjectArea}
                placeholder="如：计算机与数据"
                onChange={(event) => setFilters((current) => ({ ...current, subjectArea: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                placeholder="院校或项目名"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>合作项目</span>
              <select
                value={filters.partnerOnly ? 'true' : 'false'}
                onChange={(event) => setFilters((current) => ({ ...current, partnerOnly: event.target.value === 'true' }))}
              >
                <option value="false">全部</option>
                <option value="true">只看合作项目</option>
              </select>
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">查看建议</p>
          <ul>
            <li>先按国家和方向缩小范围，再比较学费、截止时间和风险标签。</li>
            <li>项目页只负责“筛项目”，案例判断请回到案例页继续看。</li>
            <li>确认目标后，再回主站进入申请跟踪或时间线页面。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}

export function StudyAbroadCasesPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    country: '',
    result: '',
    major: '',
    keyword: '',
  })
  const [rows, setRows] = useState(createStudyAbroadCasePreviewRows())
  const [notice, setNotice] = useState('当前显示的是案例库预览数据。')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadCases() {
      if (!canUseRemote) {
        setRows(createStudyAbroadCasePreviewRows())
        setNotice('当前显示的是案例库预览数据，登录真实账号后会切换成后端案例。')
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          studyAbroadApi.admissionCasesPage({
            country: filters.country.trim(),
            result: filters.result.trim(),
            major: filters.major.trim(),
            keyword: filters.keyword.trim(),
            page: 0,
            size: 12,
          }),
          8000,
          '案例库读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeCaseRows(data))
        setNotice('当前内容来自案例接口。筛选收在右栏，中间区域专门用来看相近背景样本。')
      } catch (error) {
        if (!active) return
        setRows(createStudyAbroadCasePreviewRows())
        setNotice(error.message || '案例库读取失败，当前回退到预览数据。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.country, filters.keyword, filters.major, filters.result])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="案例库"
          pathItems={[
            { label: '留学主站', to: '/station/studyabroad' },
            { label: '案例档案' },
          ]}
          title="先看相近背景案例，再判断自己的风险、空间和补强顺序。"
          lead="案例页中间只保留样本本身。右栏负责筛选国家、结果和背景关键词，不把项目目录混进来。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新案例库…</div> : null}

        <section className="v2-card-grid">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.school}</strong>
              <p>{item.program}</p>
              <p>{item.country} / {item.applicationYear}</p>
              <p>{item.studentMajor} / {item.gpa} / {item.languageScore}</p>
              <p>{item.summary}</p>
              <div className="v2-tag-row">
                <span>{item.admissionResult}</span>
                {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-article-card">
              <p>当前筛选条件下没有案例样本。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>国家 / 地区</span>
              <input
                type="text"
                value={filters.country}
                onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>结果</span>
              <input
                type="text"
                value={filters.result}
                placeholder="如：admit / reject"
                onChange={(event) => setFilters((current) => ({ ...current, result: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>本科专业</span>
              <input
                type="text"
                value={filters.major}
                onChange={(event) => setFilters((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">判断顺序</p>
          <ul>
            <li>先按国家和结果过滤，再看本科专业与语言成绩。</li>
            <li>案例页只负责参考判断，不直接替代申请策略。</li>
            <li>确认方向后，请回到申请页或时间线页安排下一步。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}

export function StudyAbroadApplicationsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    keyword: '',
  })
  const [rows, setRows] = useState(createStudyAbroadApplicationPreviewRows())
  const [notice, setNotice] = useState('当前显示的是申请跟踪预览数据。')
  const [loading, setLoading] = useState(false)

  const filteredRows = rows.filter((item) => {
    const matchStatus = filters.status === 'all' || item.status === filters.status
    const matchPriority = filters.priority === 'all' || item.priority === filters.priority
    const keyword = filters.keyword.trim().toLowerCase()
    const text = `${item.school} ${item.program} ${item.note}`.toLowerCase()
    const matchKeyword = !keyword || text.includes(keyword)
    return matchStatus && matchPriority && matchKeyword
  })

  useEffect(() => {
    let active = true

    async function loadApplications() {
      if (!canUseRemote) {
        setRows(createStudyAbroadApplicationPreviewRows())
        setNotice('当前显示的是申请跟踪预览数据，登录真实账号后会切换成后端申请项目。')
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          studyAbroadApi.applications(token),
          8000,
          '申请项目读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeApplicationRows(data))
        setNotice('当前内容来自申请项目接口。右栏只保留筛选器，主区专门看推进状态。')
      } catch (error) {
        if (!active) return
        setRows(createStudyAbroadApplicationPreviewRows())
        setNotice(error.message || '申请项目读取失败，当前回退到预览数据。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadApplications()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="申请跟踪"
          pathItems={[
            { label: '留学主站', to: '/station/studyabroad' },
            { label: '项目进度' },
          ]}
          title="每个项目都沿着一条清楚的申请线推进，不在这里混进案例和材料操作。"
          lead="申请页的重点是状态、优先级和下一步说明。筛选器放在右栏，列表主体保持干净。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新申请项目…</div> : null}

        <section className="v2-summary-strip" aria-label="申请跟踪摘要">
          <article className="v2-summary-card">
            <span>全部项目</span>
            <strong>{rows.length}</strong>
            <p>当前账号保存的申请项目数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选后</span>
            <strong>{filteredRows.length}</strong>
            <p>当前条件下保留下来的项目数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>最近截止</span>
            <strong>{filteredRows[0]?.deadline ? formatDateLabel(filteredRows[0].deadline) : '待补充'}</strong>
            <p>{filteredRows[0]?.school || '当前没有命中的项目'}</p>
          </article>
        </section>

        <section className="v2-feed-list" aria-label="申请项目列表">
          {filteredRows.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.priority.slice(0, 2)}</div>
              <div className="v2-feed-body">
                <strong>{item.school} / {item.program}</strong>
                <p>{item.country} / {item.degree} / {item.intake}</p>
                <p>{item.applicationRound} / {item.status}</p>
                <p>{item.note}</p>
              </div>
              <div className="v2-feed-side">
                <span>{item.deadline ? formatDateLabel(item.deadline) : '待补充'}</span>
              </div>
            </article>
          ))}
          {!filteredRows.length ? (
            <div className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有命中的申请项目</strong>
                <p>可以放宽状态或优先级筛选后再看。</p>
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
              <span>状态</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="planning">规划中</option>
                <option value="preparing">准备中</option>
                <option value="submitted">已提交</option>
                <option value="offer">已获 offer</option>
                <option value="rejected">未录取</option>
              </select>
            </label>
            <label className="v2-field">
              <span>优先级</span>
              <select
                value={filters.priority}
                onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="dream">冲刺</option>
                <option value="match">匹配</option>
                <option value="safe">保底</option>
              </select>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">推进建议</p>
          <ul>
            <li>先筛到准备中和已提交项目，再看截止日期。</li>
            <li>申请页只做推进，不负责材料细节和案例参考。</li>
            <li>要补节点时请回到时间线页，要补文件时请进材料页。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}

export function StudyAbroadTimelinePage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    phase: 'all',
    status: 'all',
    keyword: '',
  })
  const [rows, setRows] = useState(createStudyAbroadTimelinePreviewRows())
  const [notice, setNotice] = useState('当前显示的是时间线预览数据。')
  const [loading, setLoading] = useState(false)

  const filteredRows = rows.filter((item) => {
    const matchPhase = filters.phase === 'all' || item.phase === filters.phase
    const matchStatus = filters.status === 'all' || item.status === filters.status
    const keyword = filters.keyword.trim().toLowerCase()
    const text = `${item.title} ${item.phase} ${item.note}`.toLowerCase()
    const matchKeyword = !keyword || text.includes(keyword)
    return matchPhase && matchStatus && matchKeyword
  })

  useEffect(() => {
    let active = true

    async function loadTimeline() {
      if (!canUseRemote) {
        setRows(createStudyAbroadTimelinePreviewRows())
        setNotice('当前显示的是时间线预览数据，登录真实账号后会切换成后端时间线。')
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          studyAbroadApi.timeline(token),
          8000,
          '时间线读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeTimelineRows(data))
        setNotice('当前内容来自时间线接口。右栏只做阶段和状态筛选，中间区域保留完整时间轨。')
      } catch (error) {
        if (!active) return
        setRows(createStudyAbroadTimelinePreviewRows())
        setNotice(error.message || '时间线读取失败，当前回退到预览数据。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTimeline()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="时间线"
          pathItems={[
            { label: '留学主站', to: '/station/studyabroad' },
            { label: '阶段轨道' },
          ]}
          title="每个申请节点都挂在一条时间轨道上，先看节奏，再决定去哪个操作页。"
          lead="时间线页专门负责阶段与日期，不把材料和案例内容混在一起，便于直接肉眼判断整体节奏。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新时间线…</div> : null}

        <section className="v2-timeline-card" aria-label="时间线轨道">
          {filteredRows.map((item) => (
            <article className="v2-timeline-row" key={item.id}>
              <div className="v2-timeline-pin">
                {item.dueDate ? formatDateLabel(item.dueDate).slice(5) : '待排期'}
              </div>
              <div className="v2-timeline-body">
                <strong>{item.title}</strong>
                <p>{item.phase} / {item.status}</p>
                <span>{item.note}</span>
                <div className="v2-tag-row">
                  {item.applicationSchool ? <span>{item.applicationSchool}</span> : null}
                  {item.applicationProgram ? <span>{item.applicationProgram}</span> : null}
                </div>
              </div>
            </article>
          ))}
          {!filteredRows.length ? (
            <div className="v2-status-note">当前筛选条件下没有时间线节点。</div>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>阶段</span>
              <select
                value={filters.phase}
                onChange={(event) => setFilters((current) => ({ ...current, phase: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="Language test">语言考试</option>
                <option value="School selection">选校定位</option>
                <option value="Documents">文书材料</option>
                <option value="Submission">网申提交</option>
                <option value="Visa">签证</option>
              </select>
            </label>
            <label className="v2-field">
              <span>状态</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="todo">待开始</option>
                <option value="doing">进行中</option>
                <option value="done">已完成</option>
              </select>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">阅读方式</p>
          <ul>
            <li>先按阶段缩小范围，再看进行中和待开始节点。</li>
            <li>时间线只管节奏，补文件请去材料页，项目变更请回申请页。</li>
            <li>如果要找相似经验，请回案例页看同背景样本。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}

export function StudyAbroadMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    country: 'all',
    stage: 'all',
    completed: 'all',
    keyword: '',
  })
  const [rows, setRows] = useState(createStudyAbroadMaterialPreviewRows())
  const [notice, setNotice] = useState('当前显示的是材料清单预览数据。')
  const [loading, setLoading] = useState(false)

  const filteredRows = rows.filter((item) => {
    const matchCountry = filters.country === 'all' || item.country === filters.country
    const matchStage = filters.stage === 'all' || item.stage === filters.stage
    const matchCompleted = filters.completed === 'all'
      || (filters.completed === 'done' && item.completed)
      || (filters.completed === 'todo' && !item.completed)
    const keyword = filters.keyword.trim().toLowerCase()
    const text = `${item.title} ${item.category} ${item.note}`.toLowerCase()
    const matchKeyword = !keyword || text.includes(keyword)
    return matchCountry && matchStage && matchCompleted && matchKeyword
  })

  useEffect(() => {
    let active = true

    async function loadMaterials() {
      if (!canUseRemote) {
        setRows(createStudyAbroadMaterialPreviewRows())
        setNotice('当前显示的是材料清单预览数据，登录真实账号后会切换成后端材料与附件状态。')
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          studyAbroadApi.materials(token),
          8000,
          '材料清单读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeMaterialRows(data))
        setNotice('当前内容来自材料接口。右栏保留筛选器，中间区域专门观察材料状态和附件数量。')
      } catch (error) {
        if (!active) return
        setRows(createStudyAbroadMaterialPreviewRows())
        setNotice(error.message || '材料清单读取失败，当前回退到预览数据。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMaterials()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="材料清单"
          pathItems={[
            { label: '留学主站', to: '/station/studyabroad' },
            { label: '材料状态' },
          ]}
          title="材料状态单独看，先判断缺口，再决定去哪里补。"
          lead="材料页中间只保留条目状态和附件概览，不把上传表单和其它模块挤到一屏里，方便观察真实数据有无的差异。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新材料清单…</div> : null}

        <section className="v2-summary-strip" aria-label="材料清单摘要">
          <article className="v2-summary-card">
            <span>材料总数</span>
            <strong>{rows.length}</strong>
            <p>当前账号保存的材料条目数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>已完成</span>
            <strong>{rows.filter((item) => item.completed).length}</strong>
            <p>已经完成的材料条目数。</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选后</span>
            <strong>{filteredRows.length}</strong>
            <p>当前条件下保留下来的材料条目数。</p>
          </article>
        </section>

        <section className="v2-check-card">
          <div className="v2-check-list">
            {filteredRows.map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.country} / {item.stage} / {item.category}</span>
                <span>{item.completed ? '已完成' : '待完成'} / 附件 {item.attachments.length}</span>
                <span>{item.deadline ? formatDateLabel(item.deadline) : '截止待补充'} / {item.note}</span>
              </div>
            ))}
            {!filteredRows.length ? <p>当前筛选条件下没有材料条目。</p> : null}
          </div>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>国家 / 地区</span>
              <select
                value={filters.country}
                onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="UK">UK</option>
                <option value="Hong Kong">Hong Kong</option>
                <option value="Singapore">Singapore</option>
              </select>
            </label>
            <label className="v2-field">
              <span>阶段</span>
              <select
                value={filters.stage}
                onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="Identity">身份材料</option>
                <option value="Academic">学术材料</option>
                <option value="Language test">语言考试</option>
                <option value="Documents">文书材料</option>
                <option value="Visa">签证</option>
              </select>
            </label>
            <label className="v2-field">
              <span>完成状态</span>
              <select
                value={filters.completed}
                onChange={(event) => setFilters((current) => ({ ...current, completed: event.target.value }))}
              >
                <option value="all">全部</option>
                <option value="done">已完成</option>
                <option value="todo">待完成</option>
              </select>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">使用提示</p>
          <ul>
            <li>先筛到待完成条目，再按国家和阶段查看缺口。</li>
            <li>材料页只负责看状态，上传和细项编辑可以后续再下钻。</li>
            <li>如果不确定是否该补，先回案例页或项目页重新判断。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
