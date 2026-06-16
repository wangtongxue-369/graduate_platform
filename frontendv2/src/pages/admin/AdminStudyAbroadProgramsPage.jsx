import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminStudyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import AdminStudyAbroadDetailDrawer from '@/components/studyabroad/AdminStudyAbroadDetailDrawer.jsx'
import AdminStudyAbroadFilters from '@/components/studyabroad/AdminStudyAbroadFilters.jsx'
import AdminStudyAbroadSummaryStrip from '@/components/studyabroad/AdminStudyAbroadSummaryStrip.jsx'
import {
  buildSchoolPayload,
  createEmptyStudyAbroadSchoolForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  createFallbackPrograms,
  normalizeProgramsPage,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function AdminStudyAbroadProgramsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    country: '',
    subjectArea: '',
    partnerOnly: '',
    keyword: '',
  })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(createFallbackPrograms())
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: createFallbackPrograms().length })
  const [notice, setNotice] = useState(previewDataNotice('院校项目管理'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(createEmptyStudyAbroadSchoolForm())
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function loadPrograms() {
      if (!canUseRemote) {
        setRows(createFallbackPrograms())
        setPageInfo({ totalPages: 1, totalElements: createFallbackPrograms().length })
        setNotice(previewDataNotice('院校项目管理'))
        return
      }

      try {
        const data = await withRequestTimeout(
          adminStudyAbroadApi.schools({
            page,
            size: 10,
            country: filters.country,
            subjectArea: filters.subjectArea,
            partnerOnly: filters.partnerOnly,
            keyword: deferredKeyword,
          }, token),
          8000,
          '院校项目管理读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeProgramsPage(data)
        setRows(normalized.content)
        setPageInfo({ totalPages: normalized.totalPages, totalElements: normalized.totalElements })
        setNotice(remoteDataNotice('院校项目管理'))
      } catch (error) {
        if (!active) return
        setRows(createFallbackPrograms())
        setPageInfo({ totalPages: 1, totalElements: createFallbackPrograms().length })
        setNotice(fallbackDataNotice('院校项目管理', error))
      }
    }

    loadPrograms()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.partnerOnly, filters.subjectArea, page, token])

  const summaryItems = useMemo(() => ([
    { label: '当前页项目', value: String(rows.length), note: '当前分页里展示的项目数' },
    { label: '项目总数', value: String(pageInfo.totalElements), note: '来自后端分页结果的项目总量' },
    { label: '合作项目', value: String(rows.filter((item) => item.partnerProgram).length), note: '当前页里已经标记为合作的项目数' },
  ]), [pageInfo.totalElements, rows])

  function openCreateDrawer() {
    setEditingItem(null)
    setForm(createEmptyStudyAbroadSchoolForm())
    setDrawerOpen(true)
  }

  function openEditDrawer(item) {
    setEditingItem(item)
    setForm({
      ...createEmptyStudyAbroadSchoolForm(),
      ...item,
      riskTags: Array.isArray(item.riskTags) ? item.riskTags.join(', ') : item.riskTags,
    })
    setDrawerOpen(true)
  }

  async function handleSave() {
    const payload = buildSchoolPayload(form)
    const saved = canUseRemote
      ? editingItem
        ? await adminStudyAbroadApi.updateSchool(editingItem.id, payload, token)
        : await adminStudyAbroadApi.createSchool(payload, token)
      : { ...payload, id: editingItem?.id || Date.now() }
    const nextRow = normalizeProgramsPage({ content: [saved] }).content[0]
    setRows((current) => (
      editingItem
        ? current.map((item) => (item.id === editingItem.id ? nextRow : item))
        : [nextRow, ...current]
    ))
    setDrawerOpen(false)
    setEditingItem(null)
    setNotice(editingItem ? '院校项目已更新。' : '院校项目已创建。')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await adminStudyAbroadApi.deleteSchool(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setNotice('院校项目已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="院校项目管理"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '留学管理', to: '/admin/studyabroad' },
            { label: '院校项目' },
          ]}
          title="院校项目管理"
          lead="管理可供学生浏览和对比的院校项目。点击新建或编辑后，会弹出独立页面填写项目详情。"
          compact
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <AdminStudyAbroadSummaryStrip items={summaryItems} />
        <section className="v2-feed-list" aria-label="院校项目列表">
          {rows.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.country.slice(0, 2).toUpperCase()}</div>
              <div className="v2-feed-body">
                <strong>{item.schoolName}</strong>
                <p>{item.programName}</p>
                <p>{item.subjectArea} / {item.degree} / {item.qsRank}</p>
              </div>
              <div className="v2-feed-side">
                <span>{item.partnerProgram ? '合作项目' : '普通项目'}</span>
                <button className="v2-secondary-link" type="button" onClick={() => openEditDrawer(item)}>编辑</button>
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
            setFilters({
              country: '',
              subjectArea: '',
              partnerOnly: '',
              keyword: '',
            })
          }}
          mode="programs"
        />
        <section className="v2-side-card">
          <div className="v2-inline-actions">
            <button className="v2-primary-link" type="button" onClick={openCreateDrawer}>新建院校项目</button>
            <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
            <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => (current + 1 < pageInfo.totalPages ? current + 1 : current))}>下一页</button>
          </div>
        </section>
        <AdminStudyAbroadDetailDrawer
          open={drawerOpen}
          mode="programs"
          item={editingItem}
          form={form}
          onChange={setForm}
          onSubmit={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条院校项目？"
        body="删除后会从当前院校项目列表中移除这条记录。"
        confirmLabel="删除项目"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
