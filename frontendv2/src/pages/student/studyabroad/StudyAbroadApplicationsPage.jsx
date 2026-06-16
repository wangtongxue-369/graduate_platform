import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadApplicationEditorDrawer from '@/components/studyabroad/StudyAbroadApplicationEditorDrawer.jsx'
import {
  buildApplicationPayload,
  createEmptyStudyAbroadApplicationForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  getApplicationPriorityLabel,
  getApplicationStatusLabel,
  getPriorityChip,
  studyAbroadBoardColumns,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackApplications,
  normalizeApplications,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function StudyAbroadApplicationsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({ lane: 'all', keyword: '', view: 'board' })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [rows, setRows] = useState(createFallbackApplications())
  const [notice, setNotice] = useState(previewDataNotice('申请跟踪'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(createEmptyStudyAbroadApplicationForm())
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function loadApplications() {
      if (!canUseRemote) {
        setRows(createFallbackApplications())
        setNotice(previewDataNotice('申请跟踪'))
        return
      }

      try {
        const data = await withRequestTimeout(
          studyAbroadApi.applications(token),
          8000,
          '申请跟踪读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeApplications(data))
        setNotice(remoteDataNotice('申请跟踪'))
      } catch (error) {
        if (!active) return
        setRows(createFallbackApplications())
        setNotice(fallbackDataNotice('申请跟踪', error))
      }
    }

    loadApplications()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const filteredRows = useMemo(() => {
    const keyword = deferredKeyword.trim().toLowerCase()
    return rows.filter((item) => {
      const laneMatch = filters.lane === 'all' || item.status === filters.lane
      const keywordMatch = !keyword || `${item.school} ${item.program} ${item.note}`.toLowerCase().includes(keyword)
      return laneMatch && keywordMatch
    })
  }, [deferredKeyword, filters.lane, rows])

  const boardGroups = useMemo(
    () => studyAbroadBoardColumns.map((column) => ({
      ...column,
      items: filteredRows.filter((item) => item.status === column.key),
    })),
    [filteredRows],
  )

  function openCreateDrawer() {
    setEditingItem(null)
    setForm(createEmptyStudyAbroadApplicationForm())
    setDrawerOpen(true)
  }

  function openEditDrawer(item) {
    setEditingItem(item)
    setForm({
      ...createEmptyStudyAbroadApplicationForm(),
      ...item,
    })
    setDrawerOpen(true)
  }

  async function handleSave() {
    const payload = buildApplicationPayload(form)
    const saved = canUseRemote
      ? editingItem
        ? await studyAbroadApi.updateApplication(editingItem.id, payload, token)
        : await studyAbroadApi.createApplication(payload, token)
      : { ...payload, id: editingItem?.id || Date.now() }
    const nextRow = normalizeApplications([saved])[0]
    setRows((current) => (
      editingItem
        ? current.map((item) => (item.id === editingItem.id ? nextRow : item))
        : [nextRow, ...current]
    ))
    setDrawerOpen(false)
    setEditingItem(null)
    setForm(createEmptyStudyAbroadApplicationForm())
    setNotice(editingItem ? '申请项目已更新。' : '申请项目已新增。')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await studyAbroadApi.deleteApplication(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setNotice('申请项目已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="申请跟踪"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '申请跟踪' },
          ]}
          title="每个申请项目都挂在一条清晰的推进线上。"
          lead="主区负责推进状态，创建和编辑收进右侧抽屉。"
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <section className="v2-summary-strip">
          <article className="v2-summary-card">
            <span>全部项目</span>
            <strong>{rows.length}</strong>
            <p>当前账号下的全部申请项目。</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选后</span>
            <strong>{filteredRows.length}</strong>
            <p>当前看板或列表里保留的项目数。</p>
          </article>
          <article className="v2-summary-card">
            <span>最早截止</span>
            <strong>{filteredRows[0]?.deadline ? formatDateLabel(filteredRows[0].deadline) : '待补充'}</strong>
            <p>{filteredRows[0]?.school || '当前没有命中的申请项目'}</p>
          </article>
        </section>
        {filters.view === 'board' ? (
          <section className="v2-studyabroad-board" aria-label="申请看板">
            {boardGroups.map((group) => (
              <article className="v2-side-card" key={group.key}>
                <div className="v2-side-card__head">
                  <div>
                    <p className="v2-kicker">{group.label}</p>
                    <h3>{group.items.length} 个项目</h3>
                  </div>
                </div>
                <div className="v2-check-list">
                  {group.items.length ? group.items.map((item) => (
                    <div className="v2-check-row" key={item.id}>
                      <strong>{item.school}</strong>
                      <span>{item.program}</span>
                      <div className="v2-inline-actions">
                        <button className="v2-secondary-link" type="button" onClick={() => openEditDrawer(item)}>编辑</button>
                        <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
                      </div>
                    </div>
                  )) : (
                    <div className="v2-check-row">
                      <strong>当前没有项目</strong>
                      <span>可以直接从右侧抽屉新建申请。</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="v2-feed-list" aria-label="申请列表">
            {filteredRows.map((item) => (
              <article className="v2-feed-item" key={item.id}>
                <div className="v2-feed-index">{getPriorityChip(item.priority)}</div>
                <div className="v2-feed-body">
                  <strong>{item.school} / {item.program}</strong>
                  <p>{item.country} / {item.degree} / {item.intake}</p>
                  <p>{getApplicationStatusLabel(item.status)} / {getApplicationPriorityLabel(item.priority)}</p>
                  <p>{item.note}</p>
                </div>
                <div className="v2-feed-side">
                  <span>{item.deadline ? formatDateLabel(item.deadline) : '待补充'}</span>
                  <button className="v2-secondary-link" type="button" onClick={() => openEditDrawer(item)}>编辑</button>
                  <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">看板控制台</p>
              <h3>筛选后再决定是否打开抽屉</h3>
            </div>
            <button className="v2-primary-link" type="button" onClick={openCreateDrawer}>新建申请</button>
          </div>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>推进状态</span>
              <select value={filters.lane} onChange={(event) => setFilters((current) => ({ ...current, lane: event.target.value }))}>
                <option value="all">全部</option>
                {studyAbroadBoardColumns.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>视图模式</span>
              <div className="v2-segment-group" role="group" aria-label="申请视图">
                <button className={`v2-segment-button ${filters.view === 'board' ? 'is-active' : ''}`} type="button" onClick={() => setFilters((current) => ({ ...current, view: 'board' }))}>看板</button>
                <button className={`v2-segment-button ${filters.view === 'list' ? 'is-active' : ''}`} type="button" onClick={() => setFilters((current) => ({ ...current, view: 'list' }))}>列表</button>
              </div>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} />
            </label>
          </form>
        </section>
        <StudyAbroadApplicationEditorDrawer
          open={drawerOpen}
          form={form}
          editingItem={editingItem}
          onChange={setForm}
          onSubmit={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条申请项目？"
        body="删除后会从当前申请工作台中移除这条记录。"
        confirmLabel="删除申请"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
