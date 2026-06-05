import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { materialApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const MATERIAL_TYPES = ['笔记', '真题', '课件', '模拟卷', '其他']
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021]

export default function MaterialsPage() {
  const navigate = useNavigate()
  const { token, isAuthed } = useAuth()
  const [materials, setMaterials] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [filters, setFilters] = useState({
    keyword: '',
    school: '',
    major: '',
    subject: '',
    year: '',
    materialType: '',
  })

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const params = { page, size, ...filters }
      Object.keys(params).forEach(k => {
        if (params[k] === '') delete params[k]
      })
      const data = await materialApi.listPage(params)
      setMaterials(data?.content || [])
      setTotalElements(data?.totalElements || 0)
      setTotalPages(data?.totalPages || 1)
    } catch (e) {
      setMessage(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, size, filters])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchMaterials()
  }

  const clearFilters = () => {
    setFilters({ keyword: '', school: '', major: '', subject: '', year: '', materialType: '' })
    setPage(0)
  }

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v != null)

  const statusLabel = (s) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已拒绝' }[s] || s)
  const statusClass = (s) => ({ PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }[s] || '')

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">考研 · 资源共享</p>
            <h2>备考资料</h2>
            <p className="muted">按院校、专业、科目分类检索备考资料，下载前请先登录。</p>
          </div>
        </section>

        <section className="section">
          <form className="feature-card calendar-filter-panel" onSubmit={handleSearch}>
            <div className="filter-grid">
              <label className="field">
                <span>关键词</span>
                <input
                  value={filters.keyword}
                  onChange={e => updateFilter('keyword', e.target.value)}
                  placeholder="搜索标题/院校/专业/科目"
                />
              </label>
              <label className="field">
                <span>院校</span>
                <input
                  value={filters.school}
                  onChange={e => updateFilter('school', e.target.value)}
                  placeholder="如：北京大学"
                />
              </label>
              <label className="field">
                <span>专业</span>
                <input
                  value={filters.major}
                  onChange={e => updateFilter('major', e.target.value)}
                  placeholder="如：计算机科学与技术"
                />
              </label>
              <label className="field">
                <span>科目</span>
                <input
                  value={filters.subject}
                  onChange={e => updateFilter('subject', e.target.value)}
                  placeholder="如：政治、英语"
                />
              </label>
              <label className="field">
                <span>年份</span>
                <select value={filters.year} onChange={e => updateFilter('year', e.target.value)}>
                  <option value="">全部</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label className="field">
                <span>资料类型</span>
                <select value={filters.materialType} onChange={e => updateFilter('materialType', e.target.value)}>
                  <option value="">全部</option>
                  {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="question-actions">
              <button className="btn primary" type="submit" disabled={loading}>{loading ? '查询中...' : '查询'}</button>
              <button className="btn ghost" type="button" onClick={clearFilters}>清空</button>
            </div>
            {message ? <div className="muted" style={{ marginTop: '8px' }}>{message}</div> : null}
          </form>

          <div className="action-row" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <button className="btn primary" onClick={() => isAuthed ? navigate('/kaoyan/materials/upload') : navigate('/login')}>
              上传资料
            </button>
            <button className="btn outline" style={{ marginLeft: 'auto' }} onClick={() => isAuthed ? navigate('/kaoyan/materials/my') : navigate('/login')}>
              我的资料
            </button>
          </div>

          {hasActiveFilters && (
            <div className="track-head" style={{ marginBottom: '0.75rem' }}>
              <h3>查询结果</h3>
              <span className="tag subtle">共 {totalElements} 条</span>
            </div>
          )}
          {materials.length === 0 && !loading ? (
            <p className="muted">暂无相关资料，请调整筛选条件</p>
          ) : (
            <div className="material-list">
              {materials.map(m => (
                <article className="material-card" key={m.id} onClick={() => navigate(`/kaoyan/materials/${m.id}`)}>
                  <div className="track-head">
                    <h3>{m.title}</h3>
                    <span className={`material-status status-${statusClass(m.status)}`}>{statusLabel(m.status)}</span>
                  </div>
                  <div className="tag-row">
                    {m.school && <span className="tag subtle">📍 {m.school}</span>}
                    {m.major && <span className="tag subtle">📚 {m.major}</span>}
                    {m.subject && <span className="tag subtle">📖 {m.subject}</span>}
                    {m.year && <span className="tag subtle">📅 {m.year}</span>}
                    {m.materialType && <span className="tag subtle">{m.materialType}</span>}
                  </div>
                  {m.description && <p className="muted">{m.description.slice(0, 80)}{m.description.length > 80 ? '...' : ''}</p>}
                  <div className="metric-row">
                    <span>附件 {m.attachments?.length || 0} 个</span>
                    <span>👁 {m.viewCount || 0} 浏览</span>
                    <span>⬇ {m.downloadCount || 0} 下载</span>
                  </div>
                  <div className="panel-footer">
                    <span>{m.createdAt?.slice(0, 10)}</span>
                    <button className="btn outline small" type="button" onClick={e => { e.stopPropagation(); navigate(`/kaoyan/materials/${m.id}`) }}>
                      查看详情
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {materials.length > 0 && (
            <Pagination
              page={page + 1}
              total={totalPages}
              totalItems={totalElements}
              onChange={(nextPage) => setPage(nextPage - 1)}
            />
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}