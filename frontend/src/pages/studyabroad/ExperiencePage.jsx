import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import {
  getExperienceItems,
  saveExperienceItems,
} from './studyAbroadStorage.js'
import '../../App.css'

const countries = ['all', 'UK', 'US', 'Australia', 'Canada', 'Singapore']
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

function createId() {
  return `experience-${Date.now()}`
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
  const [experiences, setExperiences] = useState(() => getExperienceItems())
  const [filters, setFilters] = useState({ country: 'all', topic: 'all', keyword: '' })
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState('')

  const canUseRemote = Boolean(token && token !== 'dev-token')

  useEffect(() => {
    if (!canUseRemote) return undefined
    let active = true

    async function loadExperiences() {
      try {
        const data = await studyAbroadApi.experiences(filters, token)
        if (active) {
          setExperiences(data)
          setNotice('已从后端加载留学经验。')
        }
      } catch (error) {
        if (active) {
          setNotice(error.message || '后端暂不可用，当前展示本地演示经验。')
        }
      }
    }

    loadExperiences()
    return () => {
      active = false
    }
  }, [canUseRemote, filters, token])

  const filteredExperiences = useMemo(() => {
    if (canUseRemote) return experiences
    const keyword = filters.keyword.trim().toLowerCase()
    return experiences.filter((item) => {
      const matchCountry = filters.country === 'all' || item.country === filters.country
      const matchTopic = filters.topic === 'all' || item.topic === filters.topic
      const text = `${item.title} ${item.summary} ${normalizeTags(item.tags).join(' ')}`.toLowerCase()
      const matchKeyword = !keyword || text.includes(keyword)
      return matchCountry && matchTopic && matchKeyword
    })
  }, [canUseRemote, experiences, filters])

  function saveLocal(nextItems) {
    setExperiences(nextItems)
    saveExperienceItems(nextItems)
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
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
        const created = await studyAbroadApi.createExperience(payload, token)
        setExperiences((current) => [created, ...current])
        setNotice('经验已保存到后端。')
      } else {
        const created = {
          ...payload,
          id: createId(),
          tags: normalizeTags(payload.tags),
        }
        saveLocal([created, ...experiences])
        setNotice('本地经验已创建。')
      }
      setForm(emptyForm)
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
      } else {
        saveLocal(experiences.filter((item) => item.id !== id))
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
        <section className="section">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 · 经验库</p>
              <h2>留学经验库</h2>
              <p className="muted">检索、筛选并发布留学申请经验，沉淀选校、PS、签证和生活信息。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="feature-card">
            <div className="filter-grid">
              <label className="field">
                <span>国家 / 地区</span>
                <select value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })}>
                  {countries.map((item) => (
                    <option key={item} value={item}>{item === 'all' ? '全部国家' : item}</option>
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

          <form className="feature-card" onSubmit={handleSubmit}>
            <div className="section-head compact">
              <h2>发布经验</h2>
              <span className="tag subtle">{canUseRemote ? '后端保存' : '本地演示保存'}</span>
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
                    <option key={item} value={item}>{item}</option>
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
            <button className="btn primary" type="submit">发布经验</button>
          </form>

          {notice ? (
            <div className="notice-box">
              <strong>数据来源</strong>
              <p className="muted">{notice}</p>
            </div>
          ) : null}

          <div className="track-grid">
            {filteredExperiences.map((item) => (
              <article className="track-card experience-card" key={item.id}>
                <div className="track-head">
                  <h3>{item.title}</h3>
                  <span className="tag subtle">{item.country}</span>
                </div>
                <div className="detail-meta">
                  <span>{topicLabelMap[item.topic] || item.topic}</span>
                  <span>{item.authorName}</span>
                  <span>{item.readTime}</span>
                </div>
                <p className="muted">{item.summary}</p>
                {item.content ? <p className="muted">{item.content}</p> : null}
                <div className="tag-row">
                  {normalizeTags(item.tags).map((tag) => (
                    <span className="tag subtle" key={tag}>{tag}</span>
                  ))}
                </div>
                <button className="btn outline small" type="button" onClick={() => handleDelete(item.id)}>删除</button>
              </article>
            ))}
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
      <Footer />
    </div>
  )
}
