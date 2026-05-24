import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { mentorApi, kaoyanApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const years = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020']

export default function MentorListPage() {
  const { token, user } = useAuth()

  const [mentors, setMentors] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  const [schools, setSchools] = useState([])
  const [filters, setFilters] = useState({ graduateSchool: '', enrollmentYear: '', major: '', expertiseSubjects: '' })
  const [filterDraft, setFilterDraft] = useState({ ...filters })
  const debounceTimer = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const [selectedMentor, setSelectedMentor] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showMyProfileModal, setShowMyProfileModal] = useState(false)
  const [myProfile, setMyProfile] = useState(null)

  const [registerForm, setRegisterForm] = useState({
    bio: '', graduateSchool: '', enrollmentYear: '', major: '', expertiseSubjects: '', examSubjects: '',
  })

  const fetchUnread = useCallback(async () => {
    if (!token || token === 'dev-token') return
    try {
      const data = await mentorApi.unreadCount(token)
      setUnreadCount(data.count || 0)
    } catch {}
  }, [token])

  const fetchSchools = useCallback(async () => {
    try {
      const data = await kaoyanApi.schoolsPage({ size: 200 })
      setSchools(data?.content || [])
    } catch {}
  }, [])

  const fetchMentors = useCallback(async (f = filters, p = page) => {
    setLoading(true)
    try {
      const data = await mentorApi.mentorsPage({ ...f, page: p - 1, size: 10 })
      setMentors(data?.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalElements(data.totalElements || 0)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  const fetchMyProfile = useCallback(async () => {
    if (!token || token === 'dev-token') {
      setMyProfile(null)
      return
    }
    try {
      const data = await mentorApi.myProfile(token)
      setMyProfile(data)
    } catch (err) {
      setMyProfile(null)
    }
  }, [token])

  useEffect(() => { fetchSchools() }, [fetchSchools])
  useEffect(() => { fetchMentors() }, [page, fetchMentors])
  useEffect(() => { fetchUnread() }, [fetchUnread])
  useEffect(() => { fetchMyProfile() }, [fetchMyProfile])

  const handleFilterChange = (key, value) => {
    const updated = { ...filterDraft, [key]: value }
    setFilterDraft(updated)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setFilters(updated)
      setPage(1)
      fetchMentors(updated, 1)
    }, 2000)
  }

  const handleSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setFilters(filterDraft)
    setPage(1)
    fetchMentors(filterDraft, 1)
  }

  const openDetail = (mentor) => {
    setSelectedMentor(mentor)
    setShowModal(true)
  }

  const handleConsult = async (mentor) => {
    if (!token || token === 'dev-token') {
      window.location.href = '/login'
      return
    }
    if (myProfile && myProfile.id === mentor.id) {
      alert('不能咨询自己')
      return
    }
    try {
      await mentorApi.createSession({ mentorId: mentor.id }, token)
      window.location.href = '/kaoyan/messages'
    } catch (err) { alert(err.message) }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!token || token === 'dev-token') {
      window.location.href = '/login'
      return
    }
    try {
      await mentorApi.saveProfile(registerForm, token)
      setShowRegisterModal(false)
      fetchMyProfile()
      fetchMentors()
    } catch (err) { alert(err.message) }
  }

  const handleDeleteProfile = async () => {
    if (!confirm('确认注销入驻？')) return
    try {
      await mentorApi.deleteProfile(token)
      setMyProfile(null)
      setShowMyProfileModal(false)
      fetchMentors()
    } catch (err) { alert(err.message) }
  }

  const isMyself = myProfile && selectedMentor && selectedMentor.id === myProfile.id

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">考研 · 校友灯塔</p>
            <h2>1v1 咨询</h2>
            <p className="muted">联系已入驻的学长学姐，一对一咨询考研经验。</p>
          </div>
        </section>

        <section className="section">
          <form className="feature-card calendar-filter-panel" onSubmit={(e) => { e.preventDefault(); handleSearch() }}>
            <div className="filter-grid">
              <label className="field">
                <span>学校</span>
                <select value={filterDraft.graduateSchool} onChange={(e) => handleFilterChange('graduateSchool', e.target.value)}>
                  <option value="">全部</option>
                  {schools.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>年级</span>
                <select value={filterDraft.enrollmentYear} onChange={(e) => handleFilterChange('enrollmentYear', e.target.value)}>
                  <option value="">全部</option>
                  {years.slice(1).map((y) => <option key={y} value={y}>{y}级</option>)}
                </select>
              </label>
              <label className="field">
                <span>专业</span>
                <input value={filterDraft.major} onChange={(e) => handleFilterChange('major', e.target.value)} placeholder="模糊搜索" />
              </label>
              <label className="field">
                <span>擅长科目</span>
                <input value={filterDraft.expertiseSubjects} onChange={(e) => handleFilterChange('expertiseSubjects', e.target.value)} placeholder="模糊搜索" />
              </label>
            </div>
            <div className="question-actions">
              <button className="btn primary" type="submit">筛选</button>
              <button className="btn ghost" type="button" onClick={() => {
                const cleared = { graduateSchool: '', enrollmentYear: '', major: '', expertiseSubjects: '' }
                setFilterDraft(cleared)
                setFilters(cleared)
                setPage(1)
                fetchMentors(cleared, 1)
              }}>清空</button>
              {myProfile ? (
                <>
                  <button className="btn outline" type="button" onClick={() => setShowMyProfileModal(true)}>我的入驻</button>
                  <button className="btn ghost" type="button" onClick={() => setShowRegisterModal(true)}>编辑入驻</button>
                </>
              ) : (
                <button className="btn primary" type="button" onClick={() => setShowRegisterModal(true)}>申请入驻</button>
              )}
              <Link to="/kaoyan/messages" className="btn ghost">
                查看私信
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </Link>
            </div>
          </form>

          <div className="feature-card">
            <div className="track-head">
              <h3>入驻校友</h3>
              <span className="tag subtle">共 {totalElements} 位</span>
            </div>
            {loading ? (
              <p className="muted">加载中...</p>
            ) : mentors.length === 0 ? (
              <p className="muted">暂无入驻校友，请调整筛选条件或成为第一位入驻者</p>
            ) : (
              <div className="score-table-wrap">
                <table className="score-table">
                  <thead>
                    <tr>
                      <th>昵称</th>
                      <th>学校</th>
                      <th>年级</th>
                      <th>专业</th>
                      <th>擅长科目</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((mentor) => (
                      <tr key={mentor.id}>
                        <td><strong>{mentor.nickname || '匿名'}</strong><div className="muted small">{mentor.bio || '暂无简介'}</div></td>
                        <td>{mentor.graduateSchool}</td>
                        <td>{mentor.enrollmentYear}级</td>
                        <td>{mentor.major || '-'}</td>
                        <td>{mentor.expertiseSubjects || '-'}</td>
                        <td>
                          <button className="btn ghost small" type="button" onClick={() => openDetail(mentor)}>查看详情</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} total={totalPages} totalItems={totalElements} onChange={setPage} />
          </div>
        </section>
      </main>

      {showModal && selectedMentor && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>校友详情</h3>
              <button className="btn ghost small" onClick={() => setShowModal(false)}>关闭</button>
            </div>
            <div className="modal-body">
              <div className="feature-card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="card-title">{selectedMentor.nickname || '匿名'}</div>
                      <div className="tag-row" style={{ marginTop: 8 }}>
                        <span className="tag subtle">{selectedMentor.graduateSchool}</span>
                        <span className="tag subtle">{selectedMentor.enrollmentYear}级</span>
                        {selectedMentor.major && <span className="tag subtle">{selectedMentor.major}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="muted" style={{ fontSize: 14 }}>{selectedMentor.bio || '暂无简介'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>擅长科目</div>
                      <div style={{ fontSize: 14 }}>{selectedMentor.expertiseSubjects || '-'}</div>
                    </div>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>考研科目</div>
                      <div style={{ fontSize: 14 }}>{selectedMentor.examSubjects || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {isMyself ? (
                <button className="btn ghost small" type="button" disabled>这是你自己</button>
              ) : (
                <button className="btn primary" onClick={() => handleConsult(selectedMentor)}>咨询Ta</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{myProfile ? '编辑入驻信息' : '申请入驻'}</h3>
              <button className="btn ghost small" onClick={() => setShowRegisterModal(false)}>关闭</button>
            </div>
            <form className="modal-body" onSubmit={handleRegisterSubmit}>
              <label className="field">
                <span>学校 *</span>
                <select value={registerForm.graduateSchool} onChange={(e) => setRegisterForm({ ...registerForm, graduateSchool: e.target.value })} required>
                  <option value="">请选择学校</option>
                  {schools.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>年级 *</span>
                <select value={registerForm.enrollmentYear} onChange={(e) => setRegisterForm({ ...registerForm, enrollmentYear: e.target.value })} required>
                  <option value="">请选择年级</option>
                  {years.slice(1).map((y) => <option key={y} value={y}>{y}级</option>)}
                </select>
              </label>
              <label className="field">
                <span>专业</span>
                <input value={registerForm.major} onChange={(e) => setRegisterForm({ ...registerForm, major: e.target.value })} placeholder="研究生专业" />
              </label>
              <label className="field">
                <span>擅长科目</span>
                <input value={registerForm.expertiseSubjects} onChange={(e) => setRegisterForm({ ...registerForm, expertiseSubjects: e.target.value })} placeholder="如：数学一、英语一、政治" />
              </label>
              <label className="field">
                <span>考研科目</span>
                <input value={registerForm.examSubjects} onChange={(e) => setRegisterForm({ ...registerForm, examSubjects: e.target.value })} placeholder="如：101政治、201英语一、301数学一" />
              </label>
              <label className="field">
                <span>个人简介</span>
                <textarea value={registerForm.bio} onChange={(e) => setRegisterForm({ ...registerForm, bio: e.target.value })} placeholder="介绍一下自己的考研经验、上岸心得等" rows={3} />
              </label>
              <div className="modal-actions">
                {myProfile && (
                  <button type="button" className="btn danger small" onClick={handleDeleteProfile}>注销入驻</button>
                )}
                <button type="submit" className="btn primary">{myProfile ? '保存修改' : '确认入驻'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMyProfileModal && myProfile && (
        <div className="modal-overlay" onClick={() => setShowMyProfileModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>我的入驻信息</h3>
              <button className="btn ghost small" onClick={() => setShowMyProfileModal(false)}>关闭</button>
            </div>
            <div className="modal-body">
              <div className="feature-card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="card-title">{myProfile.nickname || '匿名'}</div>
                      <div className="tag-row" style={{ marginTop: 8 }}>
                        <span className="tag subtle">{myProfile.graduateSchool}</span>
                        <span className="tag subtle">{myProfile.enrollmentYear}级</span>
                        {myProfile.major && <span className="tag subtle">{myProfile.major}</span>}
                      </div>
                    </div>
                    <span className="tag">已入驻</span>
                  </div>
                  <p className="muted" style={{ fontSize: 14 }}>{myProfile.bio || '暂无简介'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>擅长科目</div>
                      <div style={{ fontSize: 14 }}>{myProfile.expertiseSubjects || '-'}</div>
                    </div>
                    <div>
                      <div className="muted small" style={{ marginBottom: 4 }}>考研科目</div>
                      <div style={{ fontSize: 14 }}>{myProfile.examSubjects || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn danger small" onClick={async () => {
                if (!confirm('确认取消入驻？取消后将无法再收到新的咨询请求。')) return
                try {
                  await mentorApi.deleteProfile(token)
                  setMyProfile(null)
                  setShowMyProfileModal(false)
                  fetchMentors()
                } catch (err) { alert(err.message) }
              }}>取消入驻</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}