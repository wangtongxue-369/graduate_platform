import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaoyanApi, mentorApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import KaoyanMentorProfileModal from '@/components/kaoyan/KaoyanMentorProfileModal.jsx'
import {
  createKaoyanSchoolPreviewRows,
  createKaoyanSupportPreview,
  paginateRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const mentorYearOptions = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020']
const previewMentors = createKaoyanSupportPreview().seniors
const previewSchoolOptions = createKaoyanSchoolPreviewRows().map((item) => ({
  id: item.schoolId,
  name: item.schoolName,
}))

function createFilters() {
  return {
    graduateSchool: '',
    enrollmentYear: '',
    major: '',
    expertiseSubjects: '',
  }
}

function filterMentors(rows, filters) {
  const school = String(filters.graduateSchool || '').trim().toLowerCase()
  const year = String(filters.enrollmentYear || '').trim()
  const major = String(filters.major || '').trim().toLowerCase()
  const expertise = String(filters.expertiseSubjects || '').trim().toLowerCase()

  return rows.filter((item) => {
    if (school && !String(item.graduateSchool || '').toLowerCase().includes(school)) return false
    if (year && String(item.enrollmentYear || '') !== year) return false
    if (major && !String(item.major || '').toLowerCase().includes(major)) return false
    if (expertise && !String(item.expertiseSubjects || '').toLowerCase().includes(expertise)) return false
    return true
  })
}

function matchesMentorFilters(item, filters) {
  return filterMentors([item], filters).length > 0
}

function excludeOwnMentor(rows, ownMentorId) {
  if (!ownMentorId) return rows
  return rows.filter((item) => String(item.id) !== String(ownMentorId))
}

function normalizeMentorRows(data) {
  const content = Array.isArray(data?.content) ? data.content : []
  return content.map((item, index) => ({
    id: item.id ?? `mentor-${index}`,
    nickname: item.nickname || '未命名学长学姐',
    graduateSchool: item.graduateSchool || '院校待补充',
    enrollmentYear: item.enrollmentYear || '',
    major: item.major || '专业待补充',
    expertiseSubjects: item.expertiseSubjects || '擅长科目待补充',
    examSubjects: item.examSubjects || '',
    bio: item.bio || '暂未补充个人简介',
  }))
}

export default function KaoyanMentorHallPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [schoolOptions, setSchoolOptions] = useState(previewSchoolOptions)
  const [draftFilters, setDraftFilters] = useState(createFilters())
  const [appliedFilters, setAppliedFilters] = useState(createFilters())
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [notice, setNotice] = useState(previewDataNotice('学长学姐咨询'))
  const [unreadCount, setUnreadCount] = useState(0)
  const [myProfile, setMyProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actingId, setActingId] = useState('')
  const [previewMentorId, setPreviewMentorId] = useState('')

  const previewMentor = useMemo(
    () => rows.find((item) => String(item.id) === String(previewMentorId)) || null,
    [rows, previewMentorId],
  )

  useEffect(() => {
    let active = true

    async function loadMentorHall() {
      if (!canUseRemote) {
        const filteredRows = filterMentors(previewMentors, appliedFilters)
        const pagedRows = paginateRows(filteredRows, { page, size: pageSize })
        if (!active) return
        setSchoolOptions(previewSchoolOptions)
        setRows(pagedRows.pageRows)
        setTotalElements(pagedRows.totalElements)
        setTotalPages(pagedRows.totalPages)
        setUnreadCount(0)
        setMyProfile(null)
        setNotice(previewDataNotice('学长学姐咨询'))
        return
      }

      setLoading(true)
      try {
        const [schoolsData, mentorsData, unreadData, profileData] = await withRequestTimeout(
          Promise.all([
            kaoyanApi.schoolsPage({ size: 200 }),
            mentorApi.mentorsPage({
              graduateSchool: appliedFilters.graduateSchool,
              enrollmentYear: appliedFilters.enrollmentYear,
              major: appliedFilters.major.trim(),
              expertiseSubjects: appliedFilters.expertiseSubjects.trim(),
              page,
              size: pageSize,
            }),
            mentorApi.unreadCount(token).catch(() => ({ count: 0 })),
            mentorApi.myProfile(token).catch(() => null),
          ]),
          8000,
          '学长学姐咨询数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const mentorRows = normalizeMentorRows(mentorsData)
        const ownMentorId = profileData?.id || ''
        const visibleMentorRows = excludeOwnMentor(mentorRows, ownMentorId)
        const ownMentorOnPage = mentorRows.length !== visibleMentorRows.length
        const shouldSubtractOwn = Boolean(ownMentorId) && (
          ownMentorOnPage || matchesMentorFilters(profileData, appliedFilters)
        )
        const adjustedTotalElements = Math.max(
          0,
          Number(mentorsData?.totalElements || 0) - (shouldSubtractOwn ? 1 : 0),
        )
        const nextSchoolOptions = Array.isArray(schoolsData?.content) && schoolsData.content.length
          ? schoolsData.content.map((item) => ({ id: item.id, name: item.name }))
          : previewSchoolOptions

        setSchoolOptions(nextSchoolOptions)
        setRows(visibleMentorRows)
        setTotalElements(adjustedTotalElements)
        setTotalPages(Math.max(1, Math.ceil(adjustedTotalElements / pageSize)))
        setUnreadCount(Number(unreadData?.count || 0))
        setMyProfile(profileData || null)
        setNotice(remoteDataNotice('学长学姐咨询'))
      } catch (error) {
        if (!active) return
        const filteredRows = filterMentors(previewMentors, appliedFilters)
        const pagedRows = paginateRows(filteredRows, { page, size: pageSize })
        setSchoolOptions(previewSchoolOptions)
        setRows(pagedRows.pageRows)
        setTotalElements(pagedRows.totalElements)
        setTotalPages(pagedRows.totalPages)
        setUnreadCount(0)
        setMyProfile(null)
        setNotice(fallbackDataNotice('学长学姐咨询', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMentorHall()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, page, token])

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(0)
    setAppliedFilters({ ...draftFilters })
  }

  function resetFilters() {
    const nextFilters = createFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  async function handleCreateSession(mentor) {
    if (!canUseRemote || !token) return
    if (myProfile?.id && String(myProfile.id) === String(mentor.id)) {
      setNotice('不能向自己的入驻档案发起咨询。')
      return
    }

    setActingId(String(mentor.id))
    try {
      const session = await mentorApi.createSession({ mentorId: mentor.id }, token)
      navigate('/station/kaoyan/support/messages', {
        state: { sessionId: session?.id },
      })
    } catch (error) {
      setNotice(error.message || '咨询会话创建失败')
    } finally {
      setActingId('')
    }
  }

  const hasActiveFilters = Object.values(appliedFilters).some((value) => String(value || '').trim() !== '')

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="1v1咨询"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '1v1咨询' },
          ]}
          title="1v1 咨询"
          lead="站在巨人的肩膀上看得更远。"
          actions={(
            <>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/messages">咨询消息</Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/mentors/apply">申请入驻</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新学长学姐咨询大厅…</div> : null}

        <section className="v2-summary-strip" aria-label="1v1咨询摘要">
          <article className="v2-summary-card">
            <span>匹配学长学姐</span>
            <strong>{totalElements}</strong>
            <p>按照院校、年级、专业和擅长科目筛选后的学长学姐数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>未读消息</span>
            <strong>{unreadCount}</strong>
            <p>沿用后端未读统计，便于从这里直接进入消息页。</p>
          </article>
          <article className="v2-summary-card">
            <span>我的入驻</span>
            <strong>{myProfile ? '已入驻' : '未入驻'}</strong>
            <p>{myProfile?.graduateSchool || '还没有提交个人入驻资料。'}</p>
          </article>
        </section>

        <section className="v2-side-card" aria-label="1v1咨询匹配结果">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">匹配结果</p>
              <h3>学长学姐列表</h3>
            </div>
            <span className="v2-plan-status-pill">{`共 ${totalElements} 位`}</span>
          </div>

          {hasActiveFilters ? (
            <div className="v2-tag-row">
              {appliedFilters.graduateSchool ? <span>院校 {appliedFilters.graduateSchool}</span> : null}
              {appliedFilters.enrollmentYear ? <span>年级 {appliedFilters.enrollmentYear}</span> : null}
              {appliedFilters.major ? <span>专业 {appliedFilters.major}</span> : null}
              {appliedFilters.expertiseSubjects ? <span>擅长 {appliedFilters.expertiseSubjects}</span> : null}
            </div>
          ) : null}

          <div className="v2-ledger-card">
            {rows.map((item) => (
              <article className="v2-ledger-row v2-ledger-row--material" key={item.id}>
                <div className="v2-ledger-row__main">
                  <strong>{item.nickname}</strong>
                  <p>{item.graduateSchool} / {item.major}</p>
                  <div className="v2-tag-row">
                    {item.enrollmentYear ? <span>{item.enrollmentYear} 级</span> : null}
                    <span>{item.expertiseSubjects}</span>
                    {item.examSubjects ? <span>{item.examSubjects}</span> : null}
                  </div>
                  <p>{item.bio}</p>
                </div>
                <div className="v2-ledger-row__meta">
                  <span>{item.graduateSchool}</span>
                  <span>{item.major}</span>
                  <span>{item.enrollmentYear ? `${item.enrollmentYear} 级` : '届次待补充'}</span>
                </div>
                <div className="v2-ledger-row__actions">
                  <button
                    className={`v2-segment-button ${String(previewMentorId || '') === String(item.id) ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setPreviewMentorId(String(item.id))}
                  >
                    查看资料
                  </button>
                  <button
                    className="v2-segment-button is-active"
                    disabled={actingId === String(item.id)}
                    type="button"
                    onClick={() => handleCreateSession(item)}
                  >
                    发起咨询
                  </button>
                </div>
              </article>
            ))}
            {!rows.length ? (
              <article className="v2-empty-card">
                <p>当前筛选条件下还没有匹配到学长学姐，可以先放宽筛选再试。</p>
              </article>
            ) : null}
          </div>
        </section>

        <section className="v2-pagination-row" aria-label="咨询大厅分页">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || page <= 0}
            onClick={() => setPage((current) => current - 1)}
          >
            上一页
          </button>
          <span className="v2-pagination-note">{`第 ${Math.min(page + 1, totalPages)} / ${totalPages} 页`}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || page >= totalPages - 1}
            onClick={() => setPage((current) => current + 1)}
          >
            下一页
          </button>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">咨询筛选</p>
          <form className="v2-filter-form" onSubmit={handleSearch}>
            <label className="v2-field">
              <span>目标院校</span>
              <select
                aria-label="目标院校"
                value={draftFilters.graduateSchool}
                onChange={(event) => updateDraftFilter('graduateSchool', event.target.value)}
              >
                <option value="">全部</option>
                {schoolOptions.map((item) => (
                  <option key={`${item.id}-${item.name}`} value={item.name}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>年级</span>
              <select
                aria-label="年级"
                value={draftFilters.enrollmentYear}
                onChange={(event) => updateDraftFilter('enrollmentYear', event.target.value)}
              >
                <option value="">全部</option>
                {mentorYearOptions.slice(1).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                aria-label="专业方向"
                type="text"
                value={draftFilters.major}
                onChange={(event) => updateDraftFilter('major', event.target.value)}
              />
            </label>
            <label className="v2-field">
              <span>擅长科目</span>
              <input
                aria-label="擅长科目"
                type="text"
                value={draftFilters.expertiseSubjects}
                onChange={(event) => updateDraftFilter('expertiseSubjects', event.target.value)}
              />
            </label>
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">查询</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>清空</button>
            </div>
          </form>
        </section>
      </aside>

      <KaoyanMentorProfileModal
        mentor={previewMentor}
        acting={actingId === String(previewMentor?.id || '')}
        onClose={() => setPreviewMentorId('')}
        onConsult={handleCreateSession}
      />
    </>
  )
}
