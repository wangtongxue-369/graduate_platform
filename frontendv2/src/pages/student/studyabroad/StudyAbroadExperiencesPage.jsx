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
  const [notice, setNotice] = useState(previewDataNotice('留学经验库'))
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(createEmptyStudyAbroadExperienceForm())
  const [pendingDelete, setPendingDelete] = useState(null)
  const [readingItem, setReadingItem] = useState(null)

  useEffect(() => {
    let active = true

    async function loadExperiences() {
      if (!canUseRemote) {
        setRows(createFallbackExperiences())
        setPageInfo({ totalPages: 1, totalElements: createFallbackExperiences().length })
        setNotice(previewDataNotice('留学经验库'))
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
          '留学经验库读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeExperiencesPage(data)
        setRows(normalized.content)
        setPageInfo({ totalPages: normalized.totalPages, totalElements: normalized.totalElements })
        setNotice(remoteDataNotice('留学经验库'))
      } catch (error) {
        if (!active) return
        setRows(createFallbackExperiences())
        setPageInfo({ totalPages: 1, totalElements: createFallbackExperiences().length })
        setNotice(fallbackDataNotice('留学经验库', error))
      }
    }

    loadExperiences()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.topic, page, token])

  const myExperienceCount = useMemo(
    () => rows.filter((item) => canManageExperience(item, user)).length,
    [rows, user?.id],
  )

  function openCreateDrawer() {
    setEditingItem(null)
    setForm(createEmptyStudyAbroadExperienceForm())
    setComposerOpen(true)
  }

  function openEditDrawer(item) {
    setReadingItem(null)
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
          kicker="留学经验库"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '留学经验库' },
          ]}
          title="留学经验库"
          lead="浏览同学发布的申请经验，点击查看全文；登录后可以发布、编辑和删除自己的经验帖。"
          compact
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
              <div className="v2-feed-index">{formatPublishedAt(item.createdAt)}</div>
              <div className="v2-feed-body">
                <strong>{item.title}</strong>
                <p>{item.authorName} / {getTopicLabel(item.topic)}</p>
                <p>{item.summary}</p>
              </div>
              <div className="v2-feed-side">
                <span>{item.country}</span>
                <button className="v2-secondary-link" type="button" onClick={() => setReadingItem(item)}>查看全文</button>
                {canManageExperience(item, user) ? (
                  <>
                    <button className="v2-secondary-link" type="button" onClick={() => openEditDrawer(item)}>编辑</button>
                    <button className="v2-secondary-link" type="button" onClick={() => setPendingDelete(item)}>删除</button>
                  </>
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
              <p className="v2-kicker">筛选条件</p>
              <h3>筛选经验帖</h3>
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

      {readingItem ? (
        <div className="v2-modal-overlay" onClick={() => setReadingItem(null)}>
          <article className="v2-modal-card v2-studyabroad-reading-modal" onClick={(event) => event.stopPropagation()}>
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">{readingItem.authorName} / {formatPublishedAt(readingItem.createdAt)}</p>
                <h3>{readingItem.title}</h3>
              </div>
              <button className="v2-secondary-link" type="button" onClick={() => setReadingItem(null)}>关闭</button>
            </div>
            <div className="v2-check-list">
              <div className="v2-check-row"><strong>主题</strong><span>{getTopicLabel(readingItem.topic)}</span></div>
              <div className="v2-check-row"><strong>国家 / 地区</strong><span>{readingItem.country}</span></div>
            </div>
            <p className="v2-status-note">{readingItem.summary}</p>
            <div className="v2-studyabroad-reading-body">
              {(readingItem.content || readingItem.summary || '').split('\n').filter(Boolean).map((paragraph, index) => (
                <p key={`${readingItem.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
            {readingItem.tags?.length ? (
              <div className="v2-inline-actions">
                {readingItem.tags.map((tag) => <span className="v2-tag" key={tag}>{tag}</span>)}
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
    </>
  )
}

function canManageExperience(item, user) {
  return item.authorId != null && user?.id != null && String(item.authorId) === String(user.id)
}

function formatPublishedAt(value) {
  if (!value) return '发布时间待补充'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
