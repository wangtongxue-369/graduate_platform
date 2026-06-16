import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadTimelineEditorModal from '@/components/studyabroad/StudyAbroadTimelineEditorModal.jsx'
import {
  buildTimelinePayload,
  createEmptyStudyAbroadTimelineForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  getTimelinePhaseLabel,
  getTimelineStatusLabel,
  studyAbroadTimelinePhaseOptions,
  studyAbroadTimelineStatusOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackApplications,
  createFallbackTimeline,
  normalizeApplications,
  normalizeTimelineItems,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function StudyAbroadTimelinePage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [applications, setApplications] = useState(createFallbackApplications())
  const [rows, setRows] = useState(createFallbackTimeline())
  const [filters, setFilters] = useState({ phase: 'all', status: 'all', keyword: '' })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [notice, setNotice] = useState(previewDataNotice('时间线'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(createEmptyStudyAbroadTimelineForm(applications))
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function loadTimeline() {
      if (!canUseRemote) {
        setApplications(createFallbackApplications())
        setRows(createFallbackTimeline())
        setNotice(previewDataNotice('时间线'))
        return
      }

      try {
        const [applicationData, timelineData] = await withRequestTimeout(
          Promise.all([
            studyAbroadApi.applications(token),
            studyAbroadApi.timeline(token),
          ]),
          8000,
          '时间线读取超时，请检查后端服务。',
        )
        if (!active) return
        setApplications(normalizeApplications(applicationData))
        setRows(normalizeTimelineItems(timelineData))
        setNotice(remoteDataNotice('时间线'))
      } catch (error) {
        if (!active) return
        setApplications(createFallbackApplications())
        setRows(createFallbackTimeline())
        setNotice(fallbackDataNotice('时间线', error))
      }
    }

    loadTimeline()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const filteredRows = useMemo(() => {
    const keyword = deferredKeyword.trim().toLowerCase()
    return rows.filter((item) => {
      const phaseMatch = filters.phase === 'all' || item.phase === filters.phase
      const statusMatch = filters.status === 'all' || item.status === filters.status
      const keywordMatch = !keyword || `${item.title} ${item.note}`.toLowerCase().includes(keyword)
      return phaseMatch && statusMatch && keywordMatch
    })
  }, [deferredKeyword, filters.phase, filters.status, rows])

  function openCreateModal() {
    setEditingItem(null)
    setForm(createEmptyStudyAbroadTimelineForm(applications))
    setModalOpen(true)
  }

  function openEditModal(item) {
    setEditingItem(item)
    setForm({
      ...createEmptyStudyAbroadTimelineForm(applications),
      ...item,
      applicationId: item.applicationId ? String(item.applicationId) : '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payload = buildTimelinePayload(form)
    const saved = canUseRemote
      ? editingItem
        ? await studyAbroadApi.updateTimeline(editingItem.id, payload, token)
        : await studyAbroadApi.createTimeline(payload, token)
      : { ...payload, id: editingItem?.id || Date.now() }
    const nextRow = normalizeTimelineItems([saved])[0]
    setRows((current) => (
      editingItem
        ? current.map((item) => (item.id === editingItem.id ? nextRow : item))
        : [nextRow, ...current]
    ))
    setModalOpen(false)
    setEditingItem(null)
    setNotice(editingItem ? '时间线节点已更新。' : '时间线节点已新增。')
  }

  async function toggleStatus(item) {
    const nextStatus = item.status === 'done' ? 'todo' : item.status === 'todo' ? 'doing' : 'done'
    const payload = buildTimelinePayload({ ...item, status: nextStatus, applicationId: item.applicationId ? String(item.applicationId) : '' })
    const saved = canUseRemote
      ? await studyAbroadApi.updateTimeline(item.id, payload, token)
      : { ...item, status: nextStatus }
    const nextRow = normalizeTimelineItems([saved])[0]
    setRows((current) => current.map((entry) => (entry.id === item.id ? nextRow : entry)))
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await studyAbroadApi.deleteTimeline(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setNotice('时间线节点已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="时间线"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '时间线' },
          ]}
          title="把阶段节点和截止日期挂到同一条时间轨道上。"
          lead="先看节奏，再决定是否直接改状态、编辑节点或删除节点。"
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <section className="v2-timeline-card" aria-label="时间线轨道">
          {filteredRows.map((item) => (
            <article className="v2-timeline-row" key={item.id}>
              <div className="v2-timeline-pin">{item.dueDate ? formatDateLabel(item.dueDate).slice(5) : '待排期'}</div>
              <div className="v2-timeline-body">
                <strong>{item.title}</strong>
                <p>{getTimelinePhaseLabel(item.phase)} / {getTimelineStatusLabel(item.status)}</p>
                <span>{item.note}</span>
                <div className="v2-inline-actions">
                  <button className="v2-secondary-link" type="button" onClick={() => openEditModal(item)}>编辑</button>
                  <button className="v2-secondary-link" type="button" onClick={() => toggleStatus(item)}>{item.status === 'done' ? '改回待办' : '推进状态'}</button>
                  <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">轨道控制器</p>
              <h3>筛选后再决定节点操作</h3>
            </div>
            <button className="v2-primary-link" type="button" onClick={openCreateModal}>新增节点</button>
          </div>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>阶段</span>
              <select value={filters.phase} onChange={(event) => setFilters((current) => ({ ...current, phase: event.target.value }))}>
                <option value="all">全部</option>
                {studyAbroadTimelinePhaseOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>状态</span>
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="all">全部</option>
                {studyAbroadTimelineStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
            </label>
          </form>
        </section>
      </aside>

      <StudyAbroadTimelineEditorModal
        open={modalOpen}
        applications={applications}
        form={form}
        onChange={setForm}
        onSubmit={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条时间线节点？"
        body="删除后会从当前时间轨道中移除这条记录。"
        confirmLabel="删除节点"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
