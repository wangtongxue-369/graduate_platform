import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import { getExperienceItems, saveExperienceItems } from './studyAbroadStorage.js'
import { countryLabelMap, countryOptions, createLocalId } from './studyAbroadUtils.js'
import '../../App.css'

const countries = ['all', ...countryOptions.filter((item) => item.value !== 'General').map((item) => item.value)]
const topicOptions = [
  { value: 'all', label: '全部主题' },
  { value: 'School Selection', label: '选校定位' },
  { value: 'Application', label: '申请流程' },
  { value: 'Language Test', label: '语言考试' },
  { value: 'Writing', label: 'PS 文书' },
  { value: 'Visa', label: '签证' },
  { value: 'Life Abroad', label: '海外生活' },
]

const topicLabelMap = Object.fromEntries(topicOptions.map((item) => [item.value, item.label]))

const emptyForm = {
  title: '',
  country: 'UK',
  topic: 'Application',
  authorName: '',
  readTime: '5 min',
  summary: '',
  content: '',
  tags: '',
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags
  if (!tags) return []
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export default function ExperiencePage() {
  const { token, user } = useAuth()
  const formRef = useRef(null)
  const isDevMode = token === 'dev-token'
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const [experiences, setExperiences] = useState([])
  const [filters, setFilters] = useState({ country: 'all', topic: 'all', keyword: '' })
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [selectedExperienceId, setSelectedExperienceId] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(filters.keyword.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [filters.keyword])

  const remoteFilters = useMemo(() => ({
    country: filters.country,
    topic: filters.topic,
    keyword: debouncedKeyword,
  }), [debouncedKeyword, filters.country, filters.topic])

  useEffect(() => {
    setPage(0)
  }, [filters.country, filters.topic, debouncedKeyword])

  useEffect(() => {
    let active = true

    async function loadExperiences() {
      setLoading(true)
      try {
        const data = await studyAbroadApi.experiencesPage({ ...remoteFilters, page, size: 6 })
        if (!active) return
        setExperiences(data.content || [])
        setPageInfo({
          page: data.page ?? page,
          size: data.size ?? 6,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || 0,
        })
        setNotice('经验库来自后端公开接口，游客也可以浏览。')
      } catch (error) {
        if (!active) return
        if (isDevMode) {
          const demoItems = getExperienceItems()
          setExperiences(demoItems)
          setPageInfo({ page: 0, size: demoItems.length, totalPages: 1, totalElements: demoItems.length })
          setNotice('后端经验库暂不可用，当前开发账号显示本机演示经验。')
        } else {
          setExperiences([])
          setPageInfo({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
          setNotice(error.message || '经验库加载失败，请稍后重试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadExperiences()
    return () => {
      active = false
    }
  }, [isDevMode, page, remoteFilters])

  const visibleExperiences = useMemo(() => {
    if (!isDevMode || pageInfo.totalElements !== experiences.length) return experiences
    const keyword = debouncedKeyword.toLowerCase()
    return experiences.filter((item) => {
      const matchCountry = filters.country === 'all' || item.country === filters.country
      const matchTopic = filters.topic === 'all' || item.topic === filters.topic
      const text = `${item.title} ${item.summary} ${normalizeTags(item.tags).join(' ')}`.toLowerCase()
      const matchKeyword = !keyword || text.includes(keyword)
      return matchCountry && matchTopic && matchKeyword
    })
  }, [debouncedKeyword, experiences, filters.country, filters.topic, isDevMode, pageInfo.totalElements])

  const selectedExperience = useMemo(() => {
    return visibleExperiences.find((item) => String(item.id) === String(selectedExperienceId)) || null
  }, [selectedExperienceId, visibleExperiences])

  useEffect(() => {
    if (selectedExperienceId && !selectedExperience) {
      setSelectedExperienceId(null)
    }
  }, [selectedExperience, selectedExperienceId])

  useEffect(() => {
    if (!selectedExperience) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedExperienceId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedExperience])

  function saveLocal(nextItems) {
    setExperiences(nextItems)
    saveExperienceItems(nextItems)
    setPageInfo({ page: 0, size: nextItems.length, totalPages: 1, totalElements: nextItems.length })
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function canManageExperience(item) {
    return isDevMode || (canUseRemote && user?.id != null && String(item.authorId) === String(user.id))
  }

  function startEdit(item) {
    setSelectedExperienceId(null)
    setEditingId(item.id)
    setForm({
      title: item.title || '',
      country: item.country || 'UK',
      topic: item.topic || 'Application',
      authorName: item.authorName || '',
      readTime: item.readTime || '5 min',
      summary: item.summary || '',
      content: item.content || '',
      tags: normalizeTags(item.tags).join(', '),
    })
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = {
      ...form,
      title: form.title.trim(),
      authorName: form.authorName.trim() || user?.name || '留学申请同学',
      summary: form.summary.trim(),
      content: form.content.trim(),
      tags: form.tags.trim(),
    }
    if (!payload.title || !payload.summary || !payload.content) {
      setNotice('请填写标题、摘要和正文。')
      return
    }

    try {
      if (canUseRemote) {
        const saved = editingId
          ? await studyAbroadApi.updateExperience(editingId, payload, token)
          : await studyAbroadApi.createExperience(payload, token)
        setExperiences((current) => {
          if (editingId) {
            return current.map((item) => (item.id === editingId ? saved : item))
          }
          return [saved, ...current]
        })
        if (!editingId) {
          setPageInfo((current) => ({ ...current, totalElements: current.totalElements + 1 }))
        }
        setSelectedExperienceId(saved.id)
        setNotice(editingId ? '经验已更新。' : '经验已发布到后端。')
      } else if (isDevMode) {
        const saved = {
          ...payload,
          id: editingId || createLocalId('experience'),
          tags: normalizeTags(payload.tags),
        }
        const next = editingId
          ? experiences.map((item) => (item.id === editingId ? saved : item))
          : [saved, ...experiences]
        saveLocal(next)
        setSelectedExperienceId(saved.id)
        setNotice(editingId ? '本地演示经验已更新。' : '本地演示经验已创建。真实发布需要登录正式账号。')
      } else {
        setNotice('请先登录，再发布留学经验。游客可以浏览，不能发布。')
        return
      }
      resetForm()
    } catch (error) {
      setNotice(error.message || '保存失败。')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('确认删除这篇经验吗？')) return
    try {
      if (canUseRemote) {
        await studyAbroadApi.deleteExperience(id, token)
        setExperiences((current) => current.filter((item) => item.id !== id))
        if (String(selectedExperienceId) === String(id)) {
          setSelectedExperienceId(null)
        }
      } else if (isDevMode) {
        saveLocal(experiences.filter((item) => item.id !== id))
        if (String(selectedExperienceId) === String(id)) {
          setSelectedExperienceId(null)
        }
      } else {
        setNotice('请先登录，再删除自己发布的经验。')
        return
      }
      setNotice('经验已删除。')
    } catch (error) {
      setNotice(error.message || '删除失败。只能删除自己发布的经验。')
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section experience-page">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 经验库</p>
              <h2>留学经验库</h2>
              <p className="muted">游客可浏览公开经验，登录后可以发布申请复盘和材料准备心得。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="feature-card experience-filters">
            <div className="filter-grid">
              <label className="field">
                <span>国家 / 地区</span>
                <select value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })}>
                  {countries.map((item) => (
                    <option key={item} value={item}>{item === 'all' ? '全部国家' : countryLabelMap[item] || item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>主题</span>
                <select value={filters.topic} onChange={(event) => setFilters({ ...filters, topic: event.target.value })}>
                  {topicOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                placeholder="搜索 PS、签证、IELTS、选校或海外生活"
                onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
              />
            </label>
            <div className="tag-row">
              {topicOptions.slice(1).map((topic) => (
                <button
                  className={`tag tag-btn ${filters.topic === topic.value ? 'selected' : 'subtle'}`}
                  type="button"
                  key={topic.value}
                  onClick={() => setFilters({ ...filters, topic: topic.value })}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          <form className="feature-card experience-form" ref={formRef} onSubmit={handleSubmit}>
            <div className="section-head compact">
              <h2>{editingId ? '编辑经验' : '发布经验'}</h2>
              <span className="tag subtle">{canUseRemote ? '后端保存' : isDevMode ? '本地演示' : '登录后发布'}</span>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>标题</span>
                <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
              </label>
              <label className="field">
                <span>作者名称</span>
                <input
                  value={form.authorName}
                  placeholder={user?.name || '留学申请同学'}
                  onChange={(event) => updateForm('authorName', event.target.value)}
                />
              </label>
              <label className="field">
                <span>国家 / 地区</span>
                <select value={form.country} onChange={(event) => updateForm('country', event.target.value)}>
                  {countries.slice(1).map((item) => (
                    <option key={item} value={item}>{countryLabelMap[item] || item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>主题</span>
                <select value={form.topic} onChange={(event) => updateForm('topic', event.target.value)}>
                  {topicOptions.slice(1).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>阅读时长</span>
                <input value={form.readTime} onChange={(event) => updateForm('readTime', event.target.value)} />
              </label>
              <label className="field">
                <span>标签</span>
                <input value={form.tags} placeholder="PS, visa, IELTS" onChange={(event) => updateForm('tags', event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>摘要</span>
              <textarea rows="2" value={form.summary} onChange={(event) => updateForm('summary', event.target.value)} />
            </label>
            <label className="field">
              <span>正文</span>
              <textarea rows="4" value={form.content} onChange={(event) => updateForm('content', event.target.value)} />
            </label>
            <div className="hero-actions">
              <button className="btn primary" type="submit" disabled={!canUseRemote && !isDevMode}>
                {editingId ? '保存经验' : '发布经验'}
              </button>
              {editingId ? (
                <button className="btn outline" type="button" onClick={resetForm}>取消编辑</button>
              ) : null}
            </div>
          </form>

          {notice ? (
            <div className="notice-box">
              <strong>数据来源</strong>
              <p className="muted">{notice}</p>
            </div>
          ) : null}

          <div className="track-grid experience-grid">
            {visibleExperiences.map((item) => (
              <article className="track-card experience-card" key={item.id}>
                <div className="track-head">
                  <h3>{item.title}</h3>
                  <span className="tag subtle">{countryLabelMap[item.country] || item.country}</span>
                </div>
                <div className="detail-meta">
                  <span>{topicLabelMap[item.topic] || item.topic}</span>
                  <span>{item.authorName}</span>
                  <span>{item.readTime}</span>
                </div>
                <p className="muted">{item.summary}</p>
                <div className="tag-row">
                  {normalizeTags(item.tags).map((tag) => (
                    <span className="tag subtle" key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="hero-actions experience-card-actions">
                  <button className="btn primary small" type="button" onClick={() => setSelectedExperienceId(item.id)}>查看全文</button>
                </div>
                {canManageExperience(item) ? (
                  <div className="hero-actions experience-card-actions">
                    <button className="btn outline small" type="button" onClick={() => startEdit(item)}>编辑</button>
                    <button className="btn outline small" type="button" onClick={() => handleDelete(item.id)}>删除</button>
                  </div>
                ) : null}
              </article>
            ))}
            {loading ? (
              <div className="notice-box"><p className="muted">正在加载经验库...</p></div>
            ) : null}
            {!loading && !visibleExperiences.length ? (
              <div className="feature-card soft">
                <div className="card-title">暂无经验内容</div>
                <p className="muted">可以调整筛选条件，或登录后发布第一篇留学经验。</p>
              </div>
            ) : null}
          </div>

          <div className="pagination">
            <span className="pagination-count">共 {pageInfo.totalElements} 条，第 {pageInfo.page + 1} / {pageInfo.totalPages} 页</span>
            <div className="pagination-actions">
              <button className="btn outline small" type="button" disabled={page <= 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
              <button className="btn outline small" type="button" disabled={page + 1 >= pageInfo.totalPages} onClick={() => setPage((current) => current + 1)}>下一页</button>
            </div>
          </div>

          <div className="cta study-cta">
            <div>
              <h2>想继续讨论？</h2>
              <p className="muted">进入社区留学分类，适合发布更长的讨论帖和问答。</p>
            </div>
            <Link className="btn primary" to="/community?category=liuxue">打开社区</Link>
          </div>
        </section>
      </main>
      {selectedExperience ? (
        <div
          className="experience-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedExperienceId(null)
            }
          }}
        >
          <article
            className="experience-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="experience-modal-title"
          >
            <div className="experience-modal-head">
              <div>
                <div className="tag-row">
                  <span className="tag subtle">{countryLabelMap[selectedExperience.country] || selectedExperience.country}</span>
                  <span className="tag subtle">{topicLabelMap[selectedExperience.topic] || selectedExperience.topic}</span>
                </div>
                <h2 id="experience-modal-title">{selectedExperience.title}</h2>
                <div className="detail-meta">
                  <span>{selectedExperience.authorName}</span>
                  <span>{selectedExperience.readTime}</span>
                </div>
              </div>
              <button className="btn outline small" type="button" onClick={() => setSelectedExperienceId(null)}>关闭</button>
            </div>
            <div className="experience-modal-body">
              <p className="lead">{selectedExperience.summary}</p>
              <div className="experience-detail-content">
                {(selectedExperience.content || '').split('\n').filter(Boolean).map((paragraph, index) => (
                  <p key={`${selectedExperience.id}-${index}`}>{paragraph}</p>
                ))}
              </div>
              <div className="tag-row">
                {normalizeTags(selectedExperience.tags).map((tag) => (
                  <span className="tag subtle" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            {canManageExperience(selectedExperience) ? (
              <div className="experience-modal-actions">
                <button className="btn outline small" type="button" onClick={() => startEdit(selectedExperience)}>编辑这篇经验</button>
                <button className="btn outline small" type="button" onClick={() => handleDelete(selectedExperience.id)}>删除</button>
              </div>
            ) : null}
          </article>
        </div>
      ) : null}
      <Footer />
    </div>
  )
}
