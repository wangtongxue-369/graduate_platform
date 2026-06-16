import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminStudyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import AdminStudyAbroadDetailDrawer from '@/components/studyabroad/AdminStudyAbroadDetailDrawer.jsx'
import AdminStudyAbroadFilters from '@/components/studyabroad/AdminStudyAbroadFilters.jsx'
import AdminStudyAbroadSummaryStrip from '@/components/studyabroad/AdminStudyAbroadSummaryStrip.jsx'
import {
  getAdmissionResultLabel,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackCases,
  normalizeCasesPage,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function AdminStudyAbroadCasesPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({ country: '', result: '', major: '', keyword: '' })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(createFallbackCases())
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: createFallbackCases().length })
  const [notice, setNotice] = useState('')
  const [activeItem, setActiveItem] = useState(null)
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
          adminStudyAbroadApi.admissionCases({
            page,
            size: 10,
            country: filters.country,
            result: filters.result,
            major: filters.major,
            keyword: deferredKeyword,
          }, token),
          8000,
          '录取案例管理读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeCasesPage(data)
        setRows(normalized.content)
        setPageInfo({ totalPages: normalized.totalPages, totalElements: normalized.totalElements })
        setNotice('')
      } catch (error) {
        if (!active) return
        setRows(createFallbackCases())
        setPageInfo({ totalPages: 1, totalElements: createFallbackCases().length })
        setNotice('录取案例管理暂时不可用，请稍后再试。')
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.major, filters.result, page, token])

  const summaryItems = useMemo(() => ([
    { label: '当前页案例', value: String(rows.length), note: '当前分页内展示的案例数' },
    { label: '案例总数', value: String(pageInfo.totalElements), note: '来自后端分页结果的案例总量' },
    { label: '录取样本', value: String(rows.filter((item) => item.admissionResult === 'admit').length), note: '当前页里成功录取的样本数' },
  ]), [pageInfo.totalElements, rows])

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await adminStudyAbroadApi.deleteAdmissionCase(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setActiveItem(null)
    setNotice('案例记录已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="录取案例管理"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '留学管理', to: '/admin/studyabroad' },
            { label: '录取案例' },
          ]}
          title="录取案例管理"
          lead="查看学生提交的申请背景和录取结果。点击查看详情后，会弹出独立页面浏览完整案例。"
          compact
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <AdminStudyAbroadSummaryStrip items={summaryItems} />
        <section className="v2-feed-list" aria-label="录取案例管理列表">
          {rows.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.applicationYear}</div>
              <div className="v2-feed-body">
                <strong>{item.school}</strong>
                <p>{item.program}</p>
                <p>{item.studentMajor} / GPA {item.gpa}</p>
                <p>{item.summary}</p>
              </div>
              <div className="v2-feed-side">
                <span>{getAdmissionResultLabel(item.admissionResult)}</span>
                <button className="v2-secondary-link" type="button" onClick={() => setActiveItem(item)}>查看详情</button>
                <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
              </div>
            </article>
          ))}
        </section>
      </div>
      <aside className="v2-side-column">
        <AdminStudyAbroadFilters
          filters={filters}
          onChange={setFilters}
          onSubmit={() => setPage(0)}
          onReset={() => {
            setPage(0)
            setFilters({ country: '', result: '', major: '', keyword: '' })
          }}
          mode="cases"
        />
        <section className="v2-side-card">
          <div className="v2-inline-actions">
            <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
            <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => (current + 1 < pageInfo.totalPages ? current + 1 : current))}>下一页</button>
          </div>
        </section>
        <AdminStudyAbroadDetailDrawer
          open={Boolean(activeItem)}
          mode="cases"
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条案例记录？"
        body="删除后会从当前录取案例列表中移除这条记录。"
        confirmLabel="删除案例"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
