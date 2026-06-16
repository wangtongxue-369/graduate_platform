import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadCaseSubmitModal from '@/components/studyabroad/StudyAbroadCaseSubmitModal.jsx'
import StudyAbroadPageModal from '@/components/studyabroad/StudyAbroadPageModal.jsx'
import {
  buildAdmissionCasePayload,
  createEmptyStudyAbroadCaseForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  getAdmissionResultLabel,
  studyAbroadCountryOptions,
  studyAbroadResultOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackCases,
  normalizeCasesPage,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function StudyAbroadCasesPage() {
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    country: '',
    result: '',
    major: '',
    keyword: '',
  })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(createFallbackCases())
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: createFallbackCases().length })
  const [notice, setNotice] = useState('')
  const [selectedCase, setSelectedCase] = useState(createFallbackCases()[0] || null)
  const [readingCase, setReadingCase] = useState(null)
  const [caseModalOpen, setCaseModalOpen] = useState(false)
  const [caseForm, setCaseForm] = useState(createEmptyStudyAbroadCaseForm())
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function loadCases() {
      if (!canUseRemote) {
        setRows(createFallbackCases())
        setPageInfo({ totalPages: 1, totalElements: createFallbackCases().length })
        setNotice('')
        return
      }

      try {
        const data = await withRequestTimeout(
          studyAbroadApi.admissionCasesPage({
            page,
            size: 9,
            country: filters.country,
            result: filters.result,
            major: filters.major,
            keyword: deferredKeyword,
          }),
          8000,
          '录取案例库读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeCasesPage(data)
        setRows(normalized.content)
        setPageInfo({ totalPages: normalized.totalPages, totalElements: normalized.totalElements })
        setSelectedCase(normalized.content[0] || null)
        setReadingCase(null)
        setNotice('')
      } catch (error) {
        if (!active) return
        setRows(createFallbackCases())
        setPageInfo({ totalPages: 1, totalElements: createFallbackCases().length })
        setSelectedCase(createFallbackCases()[0] || null)
        setReadingCase(null)
        setNotice('录取案例库暂时不可用，请稍后再试。')
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.major, filters.result, page, token])

  const myCaseCount = useMemo(
    () => rows.filter((item) => item.authorId === user?.id).length,
    [rows, user?.id],
  )

  async function handleCreateCase() {
    const payload = buildAdmissionCasePayload(caseForm)
    const created = canUseRemote
      ? await studyAbroadApi.createAdmissionCase(payload, token)
      : { ...payload, id: Date.now(), authorId: user?.id || 9 }
    const nextRow = normalizeCasesPage({ content: [created] }).content[0]
    setRows((current) => [nextRow, ...current])
    setSelectedCase(nextRow)
    setCaseForm(createEmptyStudyAbroadCaseForm())
    setCaseModalOpen(false)
    setNotice('案例样本已提交。')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await studyAbroadApi.deleteAdmissionCase(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setSelectedCase((current) => (current?.id === pendingDelete.id ? null : current))
    setPendingDelete(null)
    setNotice('案例样本已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="录取案例库"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '录取案例库' },
          ]}
          title="录取案例库"
          lead="查看往届学生的录取、候补和拒信案例，按国家、结果、本科专业和关键词筛选，也可以匿名提交自己的案例。"
          compact
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <section className="v2-summary-strip">
          <article className="v2-summary-card">
            <span>当前页案例</span>
            <strong>{rows.length}</strong>
            <p>本页可直接进入详情判断的案例数。</p>
          </article>
          <article className="v2-summary-card">
            <span>案例总数</span>
            <strong>{pageInfo.totalElements}</strong>
            <p>来自后端分页结果的样本总量。</p>
          </article>
          <article className="v2-summary-card">
            <span>我的案例</span>
            <strong>{myCaseCount}</strong>
            <p>当前列表里属于你的案例样本数量。</p>
          </article>
        </section>
        <section className="v2-feed-list" aria-label="录取案例库列表">
          {rows.map((row) => (
            <article className="v2-feed-item" key={row.id}>
              <div className="v2-feed-index">{row.applicationYear}</div>
              <div className="v2-feed-body">
                <strong>{row.school}</strong>
                <p>{row.program}</p>
                <p>{row.studentMajor} / GPA {row.gpa} / {row.languageType} {row.languageScore}</p>
                <p>{row.summary}</p>
              </div>
              <div className="v2-feed-side">
                <span>{getAdmissionResultLabel(row.admissionResult)}</span>
                <button className="v2-secondary-link" type="button" onClick={() => { setSelectedCase(row); setReadingCase(row) }}>查看详情</button>
                {row.authorId === user?.id ? (
                  <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(row)}>删除</button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">案例筛选</p>
              <h3>筛选录取案例</h3>
            </div>
            <button className="v2-primary-link" type="button" onClick={() => setCaseModalOpen(true)}>提交案例</button>
          </div>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>国家 / 地区</span>
              <select value={filters.country} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, country: event.target.value })) }}>
                <option value="">全部</option>
                {studyAbroadCountryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>录取结果</span>
              <select value={filters.result} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, result: event.target.value })) }}>
                <option value="">全部</option>
                {studyAbroadResultOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>本科专业</span>
              <input value={filters.major} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, major: event.target.value })) }} />
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input value={filters.keyword} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, keyword: event.target.value })) }} />
            </label>
            <div className="v2-inline-actions">
              <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
              <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => (current + 1 < pageInfo.totalPages ? current + 1 : current))}>下一页</button>
            </div>
          </form>
        </section>
      </aside>

      <StudyAbroadPageModal
        open={Boolean(readingCase)}
        kicker="录取案例详情"
        title={readingCase?.school || '案例详情'}
        lead={readingCase ? `${readingCase.program}，${getAdmissionResultLabel(readingCase.admissionResult)}。` : ''}
        onClose={() => setReadingCase(null)}
      >
        {readingCase ? (
          <div className="v2-check-list">
            <div className="v2-check-row"><strong>项目</strong><span>{readingCase.program}</span></div>
            <div className="v2-check-row"><strong>背景</strong><span>{readingCase.studentMajor} / GPA {readingCase.gpa}</span></div>
            <div className="v2-check-row"><strong>语言</strong><span>{readingCase.languageType} {readingCase.languageScore}</span></div>
            <div className="v2-check-row"><strong>软背景</strong><span>{readingCase.softBackground || '未补充'}</span></div>
            <div className="v2-check-row"><strong>联系方式</strong><span>{readingCase.contact || '未公开'}</span></div>
            <div className="v2-check-row"><strong>总结</strong><span>{readingCase.summary}</span></div>
          </div>
        ) : null}
      </StudyAbroadPageModal>

      <StudyAbroadCaseSubmitModal
        open={caseModalOpen}
        form={caseForm}
        onChange={setCaseForm}
        onSubmit={handleCreateCase}
        onClose={() => setCaseModalOpen(false)}
      />
      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条案例样本？"
        body="删除后会从当前录取案例库中移除这条记录。"
        confirmLabel="删除案例"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
