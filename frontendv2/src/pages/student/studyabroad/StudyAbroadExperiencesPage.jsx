import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadExperienceComposerDrawer from '@/components/studyabroad/StudyAbroadExperienceComposerDrawer.jsx'
import {
  buildExperiencePayload,
  createEmptyStudyAbroadExperienceForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  getTopicLabel,
  studyAbroadCountryOptions,
  studyAbroadTopicOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'
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

export default function StudyAbroadExperiencesPage() {
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({ country: '', topic: '', keyword: '' })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(createFallbackExperiences())
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: createFallbackExperiences().length })
  const [notice, setNotice] = useState(previewDataNotice('留学经验'))
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(createEmptyStudyAbroadExperienceForm())
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function loadExperiences() {
      if (!canUseRemote) {
        setRows(createFallbackExperiences())
        setPageInfo({ totalPages: 1, totalElements: createFallbackExperiences().length })
        setNotice(previewDataNotice('留学经验'))
        return
      }

      try {
        const data = await withRequestTimeout(
          studyAbroadApi.experiencesPage({
            page,
            size: 9,
            country: filters.country,
            topic: filters.topic,
            keyword: deferredKeyword,
          }),
          8000,
          '留学经验读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeExperiencesPage(data)
        setRows(normalized.content)
        setPageInfo({ totalPages: normalized.totalPages, totalElements: normalized.totalElements })
        setNotice(remoteDataNotice('留学经验'))
      } catch (error) {
        if (!active) return
        setRows(createFallbackExperiences())
        setPageInfo({ totalPages: 1, totalElements: createFallbackExperiences().length })
        setNotice(fallbackDataNotice('留学经验', error))
      }
    }

    loadExperiences()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.topic, page, token])

  const myExperienceCount = useMemo(
    () => rows.filter((item) => item.authorId === user?.id).length,
    [rows, user?.id],
  )

  function openCreateDrawer() {
    setEditingItem(null)
    setForm(createEmptyStudyAbroadExperienceForm())
    setComposerOpen(true)
  }

  function openEditDrawer(item) {
    setEditingItem(item)
    setForm({
      ...createEmptyStudyAbroadExperienceForm(),
      ...item,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
    })
    setComposerOpen(true)
  }

  async function handleSave() {
    const payload = buildExperiencePayload(form)
    const saved = canUseRemote
      ? editingItem
        ? await studyAbroadApi.updateExperience(editingItem.id, payload, token)
        : await studyAbroadApi.createExperience(payload, token)
      : { ...payload, id: editingItem?.id || Date.now(), authorId: user?.id || 9, createdAt: new Date().toISOString() }
    const nextRow = normalizeExperiencesPage({ content: [saved] }).content[0]
    setRows((current) => (
      editingItem
        ? current.map((item) => (item.id === editingItem.id ? nextRow : item))
        : [nextRow, ...current]
    ))
    setComposerOpen(false)
    setEditingItem(null)
    setNotice(editingItem ? '经验内容已更新。' : '经验内容已发布。')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (canUseRemote) {
      await studyAbroadApi.deleteExperience(pendingDelete.id, token)
    }
    setRows((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setNotice('经验内容已删除。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="留学经验"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '经验沉淀' },
          ]}
          title="把可复用的申请经验沉淀成可筛选、可阅读、可维护的经验流。"
          lead="阅读和创作分层，避免把长表单和长列表堆在同一屏里。"
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <section className="v2-summary-strip">
          <article className="v2-summary-card">
            <span>当前页经验</span>
            <strong>{rows.length}</strong>
            <p>当前分页里可直接进入阅读的经验条目数。</p>
          </article>
          <article className="v2-summary-card">
            <span>经验总数</span>
            <strong>{pageInfo.totalElements}</strong>
            <p>来自后端分页结果的经验总量。</p>
          </article>
          <article className="v2-summary-card">
            <span>我的经验</span>
            <strong>{myExperienceCount}</strong>
            <p>当前页里由你发布的经验条目数。</p>
          </article>
        </section>
        <section className="v2-feed-list" aria-label="留学经验列表">
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
                <button className="v2-secondary-link" type="button" onClick={() => openEditDrawer(item)}>查看 / 编辑</button>
                {item.authorId === user?.id ? (
                  <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
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
              <p className="v2-kicker">经验筛选</p>
              <h3>先收口，再决定要读还是要写</h3>
            </div>
            <button className="v2-primary-link" type="button" onClick={openCreateDrawer}>发布经验</button>
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
              <span>主题</span>
              <select value={filters.topic} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, topic: event.target.value })) }}>
                <option value="">全部</option>
                {studyAbroadTopicOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
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
        <StudyAbroadExperienceComposerDrawer
          open={composerOpen}
          form={form}
          editingItem={editingItem}
          onChange={setForm}
          onSubmit={handleSave}
          onClose={() => setComposerOpen(false)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条经验内容？"
        body="删除后会从当前经验页中移除这条记录。"
        confirmLabel="删除经验"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
