import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const emptyPreference = { cities: '', industries: '', roleTypes: '', salaryRange: '', companyTypes: '', active: true }
const emptyFilters = { city: '', industry: '', keyword: '', includeExpired: false }
const pageSize = 6

export default function CareerFairPage() {
  const { token, isAuthed } = useAuth()
  const canUseRemote = Boolean(isAuthed && token && token !== 'dev-token')
  const [filters, setFilters] = useState(emptyFilters)
  const [preference, setPreference] = useState(emptyPreference)
  const [fairs, setFairs] = useState([])
  const [fairPage, setFairPage] = useState({ page: 1, totalPages: 1, totalItems: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadFairs = useCallback(async (nextFilters = emptyFilters, nextPage = 1) => {
    setLoading(true)
    setError('')
    try {
      const data = await employmentApi.fairs({ ...nextFilters, page: nextPage, size: pageSize })
      setFairs(data.items || [])
      setFairPage({
        page: data.page || nextPage,
        totalPages: data.totalPages || 1,
        totalItems: data.totalItems || 0,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFairs() }, [loadFairs])
  useEffect(() => {
    if (!canUseRemote) return
    employmentApi.preference(token).then(data => setPreference({ ...emptyPreference, ...data })).catch(e => setError(e.message))
  }, [canUseRemote, token])

  async function savePreference() {
    if (!canUseRemote) { setError('请使用真实账号登录后再保存偏好。'); return }
    if (!isAuthed) { setError('请先登录后再保存偏好。'); return }
    setSaving(true); setMessage(''); setError('')
    try {
      const saved = await employmentApi.savePreference(preference, token)
      setPreference({ ...emptyPreference, ...saved })
      setMessage('偏好已保存，站内提醒将按这些匹配规则生成。')
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const updatePreference = (key, value) => setPreference(prev => ({ ...prev, [key]: value }))
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const searchFairs = () => loadFairs(filters, 1)

  return (
    <div className="app"><Navbar /><main className="shell"><section className="section">
      <div className="section-head">
        <p className="eyebrow">就业方向 - 招聘会</p>
        <h2>招聘会与线上申请链接</h2>
        <p className="muted">浏览校园招聘活动、网申链接、截止时间，并保存站内提醒偏好。</p>
        {error && <div className="error-text">{error}</div>}{message && <div className="notice-box">{message}</div>}
      </div>
      <div className="grid-two">
        <div className="feature-card"><div className="card-title">偏好设置</div><p className="muted">站内提醒当前按城市、行业、岗位匹配；薪资和企业类型作为求职偏好记录展示。</p><div className="form-grid">
          <label className="field"><span>城市</span><input value={preference.cities || ''} onChange={e => updatePreference('cities', e.target.value)} placeholder="上海,苏州" /></label>
          <label className="field"><span>行业</span><input value={preference.industries || ''} onChange={e => updatePreference('industries', e.target.value)} placeholder="互联网,制造业" /></label>
          <label className="field"><span>岗位</span><input value={preference.roleTypes || ''} onChange={e => updatePreference('roleTypes', e.target.value)} placeholder="后端,产品" /></label>
          <label className="field"><span>薪资</span><input value={preference.salaryRange || ''} onChange={e => updatePreference('salaryRange', e.target.value)} placeholder="10k-20k" /></label>
          <label className="field"><span>企业类型</span><input value={preference.companyTypes || ''} onChange={e => updatePreference('companyTypes', e.target.value)} placeholder="国企,民企" /></label>
        </div><button className="btn primary" type="button" onClick={savePreference} disabled={saving}>{saving ? '保存中...' : '保存偏好'}</button></div>
        <div className="feature-card metrics"><div className="card-title">招聘会筛选</div><div className="form-grid">
          <label className="field"><span>城市</span><input value={filters.city} onChange={e => updateFilter('city', e.target.value)} placeholder="上海" /></label>
          <label className="field"><span>行业</span><input value={filters.industry} onChange={e => updateFilter('industry', e.target.value)} placeholder="互联网" /></label>
          <label className="field"><span>关键词</span><input value={filters.keyword} onChange={e => updateFilter('keyword', e.target.value)} placeholder="公司或岗位" /></label>
          <label className="field"><span>过期记录</span><select value={filters.includeExpired ? 'true' : 'false'} onChange={e => updateFilter('includeExpired', e.target.value === 'true')}><option value="false">仅显示未结束</option><option value="true">显示全部并标记</option></select></label>
        </div><button className="btn outline" type="button" onClick={searchFairs}>搜索招聘会</button></div>
      </div>
      <div className="track-grid">
        {loading && <div className="track-card"><p className="muted">正在加载招聘会...</p></div>}
        {!loading && fairs.length === 0 && <div className="track-card"><p className="muted">暂无匹配的招聘会。</p></div>}
        {fairs.map(fair => <div className="track-card" key={fair.id}><div className="track-head"><h3>{fair.title}</h3><div className="tag-row"><span className="tag subtle">{fair.city || '待定'}</span><span className="tag subtle">{fair.statusLabel || (fair.expired ? '已结束' : '未开始')}</span><span className="tag subtle">{fair.applyStatusLabel || (fair.applicationClosed ? '网申已截止' : '可网申')}</span></div></div><p className="muted">{fair.companyName} - {fair.industry || '行业待定'} - {fair.location || '地点待定'}</p><p>{fair.description || '暂无描述。'}</p><p className="room-sub">开始时间：{fair.startTime || '待定'}；截止时间：{fair.applyDeadline || '待定'}</p><div className="tag-row"><Link className="btn outline small" to={`/job/fairs/${fair.id}`}>查看详情</Link>{fair.applyUrl && !fair.applicationClosed && <a className="btn primary small" href={fair.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a>}{fair.applyUrl && fair.applicationClosed && <span className="tag subtle">申请已截止</span>}</div></div>)}
      </div>
      {!loading && <Pagination page={fairPage.page} total={fairPage.totalPages} totalItems={fairPage.totalItems} onChange={(nextPage) => loadFairs(filters, nextPage)} />}
      <Link className="btn ghost" to="/job">返回就业面板</Link>
    </section></main><Footer /></div>
  )
}
