import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadAttachmentPanel from '@/components/studyabroad/StudyAbroadAttachmentPanel.jsx'
import StudyAbroadMaterialEditorDrawer from '@/components/studyabroad/StudyAbroadMaterialEditorDrawer.jsx'
import {
  buildMaterialPayload,
  createEmptyStudyAbroadMaterialForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  getMaterialStageLabel,
  studyAbroadMaterialCompletionOptions,
  studyAbroadMaterialStageOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackApplications,
  createFallbackMaterials,
  normalizeApplications,
  normalizeMaterialItems,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function StudyAbroadMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [applications, setApplications] = useState(createFallbackApplications())
  const [rows, setRows] = useState(createFallbackMaterials())
  const [filters, setFilters] = useState({
    country: 'all',
    stage: 'all',
    completed: 'all',
    keyword: '',
  })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [notice, setNotice] = useState(previewDataNotice('材料清单'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(createEmptyStudyAbroadMaterialForm(applications))
  const [pendingDelete, setPendingDelete] = useState(null)
  const [uploadProgressById, setUploadProgressById] = useState({})

  useEffect(() => {
    let active = true

    async function loadMaterials() {
      if (!canUseRemote) {
        setApplications(createFallbackApplications())
        setRows(createFallbackMaterials())
        setNotice(previewDataNotice('材料清单'))
        return
      }

      try {
        const [applicationData, materialData] = await withRequestTimeout(
          Promise.all([
            studyAbroadApi.applications(token),
            studyAbroadApi.materials(token),
          ]),
          8000,
          '材料清单读取超时，请检查后端服务。',
        )
        if (!active) return
        setApplications(normalizeApplications(applicationData))
        setRows(normalizeMaterialItems(materialData))
        setNotice(remoteDataNotice('材料清单'))
      } catch (error) {
        if (!active) return
        setApplications(createFallbackApplications())
        setRows(createFallbackMaterials())
        setNotice(fallbackDataNotice('材料清单', error))
      }
    }

    loadMaterials()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const filteredRows = useMemo(() => {
    const keyword = deferredKeyword.trim().toLowerCase()
    return rows.filter((item) => {
      const countryMatch = filters.country === 'all' || item.country === filters.country
      const stageMatch = filters.stage === 'all' || item.stage === filters.stage
      const completedMatch = filters.completed === 'all'
        || (filters.completed === 'done' && item.completed)
        || (filters.completed === 'todo' && !item.completed)
      const keywordMatch = !keyword || `${item.title} ${item.category} ${item.note}`.toLowerCase().includes(keyword)
      return countryMatch && stageMatch && completedMatch && keywordMatch
    })
  }, [deferredKeyword, filters.completed, filters.country, filters.stage, rows])

  function openCreateDrawer() {
    setEditingItem(null)
    setForm(createEmptyStudyAbroadMaterialForm(applications))
    setDrawerOpen(true)
  }

  function openEditDrawer(item) {
    setEditingItem(item)
    setForm({
      ...createEmptyStudyAbroadMaterialForm(applications),
      ...item,
      applicationId: item.applicationId ? String(item.applicationId) : '',
    })
    setDrawerOpen(true)
  }

  async function handleSave() {
    const payload = buildMaterialPayload(form)
    const saved = canUseRemote
      ? editingItem
        ? await studyAbroadApi.updateMaterial(editingItem.id, payload, token)
        : await studyAbroadApi.createMaterial(payload, token)
      : { ...payload, id: editingItem?.id || Date.now(), attachments: editingItem?.attachments || [] }
    const nextRow = normalizeMaterialItems([saved])[0]
    setRows((current) => (
      editingItem
        ? current.map((item) => (item.id === editingItem.id ? nextRow : item))
        : [nextRow, ...current]
    ))
    setDrawerOpen(false)
    setEditingItem(null)
    setNotice(editingItem ? '材料条目已更新。' : '材料条目已新增。')
  }

  async function toggleCompleted(item) {
    const payload = buildMaterialPayload({
      ...item,
      completed: !item.completed,
      applicationId: item.applicationId ? String(item.applicationId) : '',
    })
    const saved = canUseRemote
      ? await studyAbroadApi.updateMaterial(item.id, payload, token)
      : { ...item, completed: !item.completed }
    const nextRow = normalizeMaterialItems([saved])[0]
    setRows((current) => current.map((entry) => (entry.id === item.id ? nextRow : entry)))
  }

  async function handleUpload(materialId, files) {
    if (!canUseRemote) {
      const localAttachments = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        originalName: file.name,
        fileSize: file.size,
      }))
      setRows((current) => current.map((item) => (
        item.id === materialId
          ? { ...item, attachments: [...(item.attachments || []), ...localAttachments] }
          : item
      )))
      return
    }
    const updated = await studyAbroadApi.uploadMaterialAttachments(materialId, files, token, (progress) => {
      setUploadProgressById((current) => ({ ...current, [materialId]: progress }))
    })
    const nextRow = normalizeMaterialItems([updated])[0]
    setRows((current) => current.map((entry) => (entry.id === materialId ? nextRow : entry)))
  }

  async function handleDownload(materialId, attachmentId) {
    if (!canUseRemote) return
    await studyAbroadApi.downloadMaterialAttachment(materialId, attachmentId, token)
  }

  async function handleDeleteAttachment(materialId, attachmentId) {
    if (canUseRemote) {
      await studyAbroadApi.deleteMaterialAttachment(materialId, attachmentId, token)
    }
    setRows((current) => current.map((item) => (
      item.id === materialId
        ? { ...item, attachments: (item.attachments || []).filter((attachment) => attachment.id !== attachmentId) }
        : item
    )))
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await studyAbroadApi.deleteMaterial(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setNotice('材料条目已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="材料清单"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '材料清单' },
          ]}
          title="把材料状态、完成缺口和附件操作留在同一张材料工作区。"
          lead="先判断缺口，再决定是编辑条目、切换状态还是直接处理附件。"
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <section className="v2-summary-strip">
          <article className="v2-summary-card">
            <span>材料总数</span>
            <strong>{rows.length}</strong>
            <p>当前账号下的全部材料条目数。</p>
          </article>
          <article className="v2-summary-card">
            <span>已完成</span>
            <strong>{rows.filter((item) => item.completed).length}</strong>
            <p>已经切换成完成状态的材料数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选后</span>
            <strong>{filteredRows.length}</strong>
            <p>当前筛选条件下保留下来的材料数。</p>
          </article>
        </section>
        <section className="v2-card-grid">
          {filteredRows.map((item) => (
            <article className="v2-check-card" key={item.id}>
              <div className="v2-section-head">
                <div>
                  <p className="v2-kicker">{getMaterialStageLabel(item.stage)}</p>
                  <h3>{item.title}</h3>
                </div>
                <div className="v2-inline-actions">
                  <button className="v2-secondary-link" type="button" onClick={() => openEditDrawer(item)}>编辑</button>
                  <button className="v2-secondary-link" type="button" onClick={() => toggleCompleted(item)}>{item.completed ? '改回待完成' : '标记完成'}</button>
                  <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
                </div>
              </div>
              <div className="v2-check-list">
                <div className="v2-check-row"><strong>类型</strong><span>{item.category}</span></div>
                <div className="v2-check-row"><strong>截止</strong><span>{item.deadline ? formatDateLabel(item.deadline) : '待补充'}</span></div>
                <div className="v2-check-row"><strong>状态</strong><span>{item.completed ? '已完成' : '待完成'}</span></div>
                <div className="v2-check-row"><strong>备注</strong><span>{item.note}</span></div>
              </div>
              <StudyAbroadAttachmentPanel
                materialId={item.id}
                attachments={item.attachments || []}
                canUpload={true}
                uploadProgress={uploadProgressById[item.id] || 0}
                onUpload={(files) => handleUpload(item.id, files)}
                onDownload={(attachmentId) => handleDownload(item.id, attachmentId)}
                onDelete={(attachmentId) => handleDeleteAttachment(item.id, attachmentId)}
              />
            </article>
          ))}
        </section>
      </div>
      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">材料控制器</p>
              <h3>筛选后再决定条目操作</h3>
            </div>
            <button className="v2-primary-link" type="button" onClick={openCreateDrawer}>新增材料</button>
          </div>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>国家 / 地区</span>
              <select value={filters.country} onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}>
                <option value="all">全部</option>
                <option value="UK">英国</option>
                <option value="US">美国</option>
                <option value="Hong Kong">中国香港</option>
                <option value="Singapore">新加坡</option>
              </select>
            </label>
            <label className="v2-field">
              <span>阶段</span>
              <select value={filters.stage} onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}>
                <option value="all">全部</option>
                {studyAbroadMaterialStageOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>完成状态</span>
              <select value={filters.completed} onChange={(event) => setFilters((current) => ({ ...current, completed: event.target.value }))}>
                {studyAbroadMaterialCompletionOptions.map((item) => (
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
        <StudyAbroadMaterialEditorDrawer
          open={drawerOpen}
          applications={applications}
          form={form}
          onChange={setForm}
          onSubmit={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条材料记录？"
        body="删除后会从当前材料清单中移除这条记录。"
        confirmLabel="删除材料"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
