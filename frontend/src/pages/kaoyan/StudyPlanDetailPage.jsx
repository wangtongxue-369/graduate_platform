import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyPlanApi } from '../../lib/api.js'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import '../../App.css'

export default function StudyPlanDetailPage() {
  const { id } = useParams()
  const { token, isAuthed } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInForm, setCheckInForm] = useState({ durationHours: '', remark: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', startDate: '', endDate: '', totalDurationHours: '' })

  useEffect(() => {
    if (isAuthed) loadDetail()
    else setLoading(false)
  }, [isAuthed, id])

  async function loadDetail() {
    try {
      const data = await studyPlanApi.planDetail(id, token)
      setPlan(data)
    } catch (e) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn(e) {
    e.preventDefault()
    if (!checkInForm.durationHours) return
    const hours = parseFloat(checkInForm.durationHours)
    if (!Number.isFinite(hours) || hours <= 0) {
      alert('请输入大于 0 的学习时长')
      return
    }
    if (hours >= 24) {
      alert('单次打卡时长必须小于 24 小时')
      return
    }
    setSubmitting(true)
    try {
      await studyPlanApi.addCheckIn(id, {
        checkInDate: selectedDate,
        durationHours: parseFloat(checkInForm.durationHours),
        remark: checkInForm.remark,
      }, token)
      setShowCheckInModal(false)
      setCheckInForm({ durationHours: '', remark: '' })
      loadDetail()
    } catch (e) {
      alert(e.message || '打卡失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCheckIn(checkInId) {
    if (!confirm('确定删除该打卡记录？')) return
    try {
      await studyPlanApi.deleteCheckIn(checkInId, token)
      loadDetail()
    } catch (e) {
      alert(e.message || '删除失败')
    }
  }

  function openEditModal() {
    setEditForm({
      name: plan.name || '',
      description: plan.description || '',
      startDate: plan.startDate || '',
      endDate: plan.endDate || '',
      totalDurationHours: plan.plannedDurationHours || plan.totalDurationHours || '',
    })
    setShowEditModal(true)
  }

  async function handleUpdatePlan(e) {
    e.preventDefault()
    if (!editForm.name.trim() || !editForm.startDate || !editForm.endDate || !editForm.totalDurationHours) {
      alert('请填写完整信息')
      return
    }
    setSubmitting(true)
    try {
      await studyPlanApi.updatePlan(id, {
        name: editForm.name,
        description: editForm.description,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        totalDurationHours: parseFloat(editForm.totalDurationHours),
      }, token)
      setShowEditModal(false)
      loadDetail()
    } catch (e) {
      alert(e.message || '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePlan() {
    if (!confirm('确定删除该计划？')) return
    try {
      await studyPlanApi.deletePlan(id, token)
      window.location.href = '/kaoyan/plan'
    } catch (e) {
      alert(e.message || '删除失败')
    }
  }

  if (!isAuthed) {
    return (
      <div className="app">
        <Navbar />
        <main className="shell">
          <section className="section">
            <div className="notice-box" style={{ textAlign: 'center' }}>
              <p>请先 <Link to="/login">登录</Link> 后查看</p>
            </div>
            <Link className="btn ghost" to="/kaoyan/plan">返回计划列表</Link>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app">
        <Navbar />
        <main className="shell"><section className="section"><p className="muted">加载中...</p></section></main>
        <Footer />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="app">
        <Navbar />
        <main className="shell">
          <section className="section">
            <div className="notice-box"><p>{error || '计划不存在'}</p></div>
            <Link className="btn ghost" to="/kaoyan/plan">返回计划列表</Link>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  function parseLocalDate(str) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d, 12, 0, 0)
  }

  function toDateStr(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const checkIns = plan.checkIns || []
  const start = parseLocalDate(plan.startDate)
  const end = parseLocalDate(plan.endDate)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const todayStr = toDateStr(today)

  const checkedDates = new Set(checkIns.map(c => c.checkInDate))

  function getDayStatus(date) {
    const d = parseLocalDate(toDateStr(date))
    if (d < start || d > end) return 'out'
    if (checkedDates.has(toDateStr(d))) return 'checked'
    const ds = toDateStr(d)
    if (ds === todayStr) return 'today'
    if (d < today) return 'missed'
    return 'future'
  }

  function buildCalendarDays() {
    const base = selectedDate
      ? parseLocalDate(selectedDate)
      : new Date(today.getFullYear(), today.getMonth(), 1, 12)
    const year = base.getFullYear()
    const month = base.getMonth()
    const firstDay = new Date(year, month, 1, 12)
    const lastDay = new Date(year, month + 1, 0, 12)
    const days = []
    const startWeek = firstDay.getDay()
    for (let i = 0; i < startWeek; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d, 12))
    return days
  }

  function prevMonth() {
    const base = selectedDate
      ? parseLocalDate(selectedDate)
      : new Date(today.getFullYear(), today.getMonth(), 1, 12)
    const d = new Date(base.getFullYear(), base.getMonth() - 1, 1, 12)
    setSelectedDate(toDateStr(d))
  }

  function nextMonth() {
    const base = selectedDate
      ? parseLocalDate(selectedDate)
      : new Date(today.getFullYear(), today.getMonth(), 1, 12)
    const d = new Date(base.getFullYear(), base.getMonth() + 1, 1, 12)
    setSelectedDate(toDateStr(d))
  }

  function handleDayClick(date) {
    const status = getDayStatus(date)
    if (status === 'out') return
    setSelectedDate(toDateStr(date))
  }

  const dayCheckIns = selectedDate
    ? checkIns.filter(c => c.checkInDate === selectedDate)
    : []

  const selectedDayStatus = selectedDate
    ? getDayStatus(parseLocalDate(selectedDate))
    : null
  // Can check in: must be 'today' and has already checked in (so they can add another check-in for today)
  // Or: today with no check-in yet (first check-in of the day)
  const isToday = selectedDayStatus === 'today'
  const canShowCheckIn = isToday

  const completionRate = plan.completionRate ?? 0

  const displayMonth = (() => {
    const base = selectedDate ? parseLocalDate(selectedDate) : today
    return base.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  })()

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Link to="/kaoyan/plan" className="btn ghost">← 返回</Link>
            <div style={{ flex: 1 }}>
              <p className="eyebrow">考研 · 复习计划</p>
              <h2 style={{ margin: 0 }}>{plan.name}</h2>
              {plan.description && <p className="muted" style={{ margin: '0.25rem 0 0' }}>{plan.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn ghost" onClick={openEditModal}>编辑</button>
              <button className="btn ghost" onClick={handleDeletePlan} style={{ color: '#e74c3c' }}>删除</button>
            </div>
          </div>

          {/* Stats */}
          <div className="hero-stats" style={{ marginBottom: '1.5rem' }}>
            <div className="feature-card metrics">
              <div className="mini-value">{plan.streak ?? 0}</div>
              <div className="mini-label">连续打卡天数</div>
            </div>
            <div className="feature-card metrics">
              <div className="mini-value">{plan.checkedDays ?? 0}</div>
              <div className="mini-label">总打卡天数</div>
            </div>
            <div className="feature-card metrics">
              <div className="mini-value">{parseFloat(plan.plannedDurationHours || 0).toFixed(1)}h</div>
              <div className="mini-label">计划总时长</div>
            </div>
            <div className="feature-card metrics">
              <div className="mini-value">{parseFloat(plan.totalDurationHours || 0).toFixed(1)}h</div>
              <div className="mini-label">总打卡时长</div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 600 }}>完成率：</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: completionRate >= 100 ? '#27ae60' : '#3498db' }}>
              {completionRate}%
            </span>
            <div style={{ height: '8px', background: 'var(--surface-muted)', borderRadius: '4px', marginTop: '0.5rem' }}>
              <div style={{ height: '100%', width: `${Math.min(100, completionRate)}%`, background: completionRate >= 100 ? '#27ae60' : '#3498db', borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Calendar */}
          <div className="feature-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button className="btn ghost" onClick={prevMonth}>&lt; 上月</button>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{displayMonth}</div>
              <button className="btn ghost" onClick={nextMonth}>下月 &gt;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '0.5rem' }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '0.85rem', padding: '4px' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {buildCalendarDays().map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />
                const dateStr = toDateStr(date)
                const status = getDayStatus(date)
                const isSelected = selectedDate === dateStr
                const isClickable = status !== 'out'

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(date)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '6px',
                      cursor: isClickable ? 'pointer' : 'default',
                      background: status === 'checked' ? '#3498db' : status === 'missed' ? '#e74c3c' : status === 'today' ? '#27ae60' : status === 'out' ? 'var(--surface-muted)' : 'transparent',
                      color: status === 'checked' || status === 'missed' || status === 'today' ? '#fff' : status === 'out' ? 'var(--ink-muted)' : 'var(--ink)',
                      border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                      fontWeight: (status === 'checked' || status === 'missed' || status === 'today') ? 600 : 400,
                    }}
                  >
                    {date.getDate()}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#27ae60', borderRadius: '2px', verticalAlign: 'middle' }}></span> 当天</span>
              <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#3498db', borderRadius: '2px', verticalAlign: 'middle' }}></span> 已打卡</span>
              <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e74c3c', borderRadius: '2px', verticalAlign: 'middle' }}></span> 未打卡</span>
              <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--surface-muted)', borderRadius: '2px', verticalAlign: 'middle' }}></span> 超出范围</span>
            </div>
          </div>

          {/* Selected day panel */}
          {selectedDate && selectedDayStatus !== 'out' && (
            <div className="feature-card" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h4 style={{ margin: 0 }}>{selectedDate}</h4>
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    background: selectedDayStatus === 'checked' ? '#3498db' : selectedDayStatus === 'today' ? '#27ae60' : selectedDayStatus === 'missed' ? '#e74c3c' : 'var(--surface-muted)',
                    color: selectedDayStatus === 'checked' || selectedDayStatus === 'today' || selectedDayStatus === 'missed' ? '#fff' : 'var(--muted)',
                  }}>
                    {selectedDayStatus === 'checked' ? '已打卡' : selectedDayStatus === 'today' ? '今日' : selectedDayStatus === 'missed' ? '未打卡' : '未来'}
                  </span>
                </div>
                {canShowCheckIn && (
                  <button className="btn primary" onClick={() => setShowCheckInModal(true)}>打卡</button>
                )}
              </div>

              {dayCheckIns.length === 0 ? (
                <p className="muted" style={{ fontSize: '0.9rem' }}>
                  {selectedDayStatus === 'today' ? '今日暂无打卡记录，点击上方按钮打卡' : '暂无打卡记录'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dayCheckIns.map(checkIn => (
                    <div key={checkIn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-soft)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{parseFloat(checkIn.durationHours || 0).toFixed(2)} 小时</div>
                        {checkIn.remark && <div className="muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{checkIn.remark}</div>}
                      </div>
                      <button className="btn ghost" style={{ color: '#e74c3c', fontSize: '0.85rem' }} onClick={() => handleDeleteCheckIn(checkIn.id)}>删除</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Check-in modal */}
      {showCheckInModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>打卡 · {selectedDate}</h3>
              <button className="btn ghost" onClick={() => setShowCheckInModal(false)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>✕</button>
            </div>
            <form onSubmit={handleCheckIn} className="modal-body">
              <div className="field">
                <label>学习时长（小时）</label>
                <input
                  type="number"
                  min="0.1"
                  max="24"
                  step="0.1"
                  value={checkInForm.durationHours}
                  onChange={e => setCheckInForm({ ...checkInForm, durationHours: e.target.value })}
                  placeholder="如：2.5（最多一位小数，且小于 24 小时）"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>备注</label>
                <input
                  type="text"
                  value={checkInForm.remark}
                  onChange={e => setCheckInForm({ ...checkInForm, remark: e.target.value })}
                  placeholder="如：完成高数第二章习题"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCheckInModal(false)}>取消</button>
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认打卡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>编辑计划</h3>
              <button className="btn ghost" onClick={() => setShowEditModal(false)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>✕</button>
            </div>
            <form onSubmit={handleUpdatePlan} className="modal-body">
              <div className="field">
                <label>计划名称</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>计划简介</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>开始日期</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} required />
                </div>
                <div className="field">
                  <label>结束日期</label>
                  <input type="date" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} required />
                </div>
              </div>
              <div className="field">
                <label>计划总时长（小时）</label>
                <input type="number" min="1" step="0.5" value={editForm.totalDurationHours} onChange={e => setEditForm({ ...editForm, totalDurationHours: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowEditModal(false)}>取消</button>
                <button type="submit" className="btn primary" disabled={submitting}>{submitting ? '保存中...' : '保存修改'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}