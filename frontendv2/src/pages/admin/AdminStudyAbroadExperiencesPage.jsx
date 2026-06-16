import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminStudyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import AdminStudyAbroadDetailDrawer from '@/components/studyabroad/AdminStudyAbroadDetailDrawer.jsx'
import AdminStudyAbroadFilters from '@/components/studyabroad/AdminStudyAbroadFilters.jsx'
import AdminStudyAbroadSummaryStrip from '@/components/studyabroad/AdminStudyAbroadSummaryStrip.jsx'
import { getTopicLabel } from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackExperiences,
  normalizeExperiencesPage,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function AdminStudyAbroadExperiencesPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({ country: '', topic: '', keyword: '' })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(createFallbackExperiences())
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: createFallbackExperiences().length })
  const [notice, setNotice] = useState(previewDataNotice('经验治理'))
  const [activeItem, setActiveItem] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function loadExperiences() {
      if (!canUseRemote) {
        setRows(createFallbackExperiences())
        setPageInfo({ totalPages: 1, totalElements: createFallbackExperiences().length })
        setNotice(previewDataNotice('经验治理'))
        return
      }

      try {
        const data = await withRequestTimeout(
          adminStudyAbroadApi.experiences({
            page,
            size: 10,
            country: filters.country,
            topic: filters.topic,
            keyword: deferredKeyword,
          }, token),
          8000,
          '经验治理读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeExperiencesPage(data)
        setRows(normalized.content)
        setPageInfo({ totalPages: normalized.totalPages, totalElements: normalized.totalElements })
        setNotice(remoteDataNotice('经验治理'))
      } catch (error) {
        if (!active) return
        setRows(createFallbackExperiences())
        setPageInfo({ totalPages: 1, totalElements: createFallbackExperiences().length })
        setNotice(fallbackDataNotice('经验治理', error))
      }
    }

    loadExperiences()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.topic, page, token])

  const summaryItems = useMemo(() => ([
    { label: '当前页经验', value: String(rows.length), note: '当前分页里可直接治理的经验数' },
    { label: '经验总数', value: String(pageInfo.totalElements), note: '来自后端分页结果的经验总量' },
    { label: '文书主题', value: String(rows.filter((item) => item.topic === 'Writing').length), note: '当前页里与文书相关的经验数' },
  ]), [pageInfo.totalElements, rows])

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await adminStudyAbroadApi.deleteExperience(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setActiveItem(null)
    setNotice('经验记录已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="经验治理"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '留学管理', to: '/admin/studyabroad' },
            { label: '留学经验' },
          ]}
          title="把经验筛选、详情查看和内容清理放进独立治理页。"
          lead="治理页只负责查看与清理，不在这里叠加替用户写稿的后台动作。"
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <AdminStudyAbroadSummaryStrip items={summaryItems} />
        <section className="v2-feed-list" aria-label="经验治理列表">
          {rows.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.readTime}</div>
              <div className="v2-feed-body">
                <strong>{item.title}</strong>
                <p>{item.authorName} / {getTopicLabel(item.topic)}</p>
                <p>{item.summary}</p>
              </div>
              <div className="v2-feed-side">
                <span>{item.country}</span>
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
            setFilters({ country: '', topic: '', keyword: '' })
          }}
          mode="experiences"
        />
        <section className="v2-side-card">
          <div className="v2-inline-actions">
            <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
            <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => (current + 1 < pageInfo.totalPages ? current + 1 : current))}>下一页</button>
          </div>
        </section>
        <AdminStudyAbroadDetailDrawer
          open={Boolean(activeItem)}
          mode="experiences"
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条经验记录？"
        body="删除后会从当前经验治理列表中移除这条记录。"
        confirmLabel="删除经验"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
