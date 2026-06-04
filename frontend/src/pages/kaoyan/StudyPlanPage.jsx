import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyPlanApi } from '../../lib/api.js'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import '../../App.css'

export default function StudyPlanPage() {
  const { token, isAuthed } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalDurationHours: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthed) {
      loadPlans()
    } else {
      setLoading(false)
    }
  }, [isAuthed])

  async function loadPlans() {
    try {
      const data = await studyPlanApi.myPlans(token)
      setPlans(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.startDate || !form.endDate || !form.totalDurationHours) {
      setError('请填写完整信息')
      return
    }
    setSubmitting(true)
    try {
      await studyPlanApi.createPlan({
        name: form.name,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDurationHours: parseFloat(form.totalDurationHours),
      }, token)
      setShowModal(false)
      setForm({ name: '', description: '', startDate: '', endDate: '', totalDurationHours: '' })
      loadPlans()
    } catch (e) {
      setError(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除该计划？')) return
    try {
      await studyPlanApi.deletePlan(id, token)
      loadPlans()
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
            <div className="section-head">
              <p className="eyebrow">考研 · 过程管理</p>
              <h2>复习计划与打卡</h2>
            </div>
            <div className="notice-box" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>请先 <Link to="/login">登录</Link> 后使用此功能</p>
            </div>
            <Link className="btn ghost" to="/kaoyan">返回考研面板</Link>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">考研 · 过程管理</p>
            <h2>复习计划与打卡</h2>
            <p className="muted">按阶段、科目制定学习计划，设置目标与提醒时间；每日打卡记录时长与完成度，自动生成统计。</p>
          </div>

          {loading ? (
            <p className="muted">加载中...</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>我的计划</h3>
                <button className="btn primary" onClick={() => setShowModal(true)}>创建新计划</button>
              </div>

              {plans.length === 0 ? (
                <div className="notice-box">
                  <p>暂无计划，点击上方按钮创建第一个复习计划。</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {plans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          )}

          <Link className="btn ghost" to="/kaoyan" style={{ marginTop: '2rem' }}>返回考研面板</Link>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>创建新计划</h3>
              <button className="btn ghost" onClick={() => setShowModal(false)} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>✕</button>
            </div>
            {error && <div className="error-msg" style={{ marginBottom: '0.5rem' }}>{error}</div>}
            <form onSubmit={handleCreate} className="modal-body">
              <div className="field">
                <label>计划名称</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：数学强化阶段" required />
              </div>
              <div className="field">
                <label>计划简介</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="简要描述该计划的目标和内容..." rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>开始日期</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="field">
                  <label>结束日期</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              <div className="field">
                <label>计划总时长（小时）</label>
                <input type="number" min="1" step="0.5" value={form.totalDurationHours} onChange={e => setForm({ ...form, totalDurationHours: e.target.value })} placeholder="如：120" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn primary" disabled={submitting}>{submitting ? '创建中...' : '创建计划'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

function PlanCard({ plan, onDelete }) {
  return (
    <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className="card-title">{plan.name}</div>
      {plan.description && <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>{plan.description}</p>}
      <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
        {plan.startDate} ~ {plan.endDate}
      </p>
      <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
        计划总时长：{plan.totalDurationHours} 小时
      </p>
      <div style={{ marginTop: 'auto', paddingTop: '0.5rem', textAlign: 'center' }}>
        <Link to={`/kaoyan/plan/${plan.id}`} className="btn primary" style={{ display: 'block' }}>查看详情</Link>
      </div>
    </div>
  )
}