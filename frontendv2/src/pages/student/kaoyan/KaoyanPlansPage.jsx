import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyPlanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createEmptyPlanForm,
  createKaoyanPlanPreviewRows,
  normalizePlanRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function KaoyanPlansPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [plans, setPlans] = useState(createKaoyanPlanPreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('计划轨道'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(createEmptyPlanForm())

  async function loadPlans() {
    if (!canUseRemote) {
      setPlans(createKaoyanPlanPreviewRows())
      setNotice(previewDataNotice('计划轨道'))
      return
    }

    setLoading(true)
    try {
      const data = await withRequestTimeout(
        studyPlanApi.myPlans(token),
        8000,
        '学习计划读取超时，请检查后端服务。',
      )
      setPlans(normalizePlanRows(data))
      setNotice(remoteDataNotice('计划轨道'))
    } catch (error) {
      setPlans(createKaoyanPlanPreviewRows())
      setNotice(fallbackDataNotice('计划轨道', error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [canUseRemote, token])

  async function handleCreatePlan(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return
    if (!form.name.trim() || !form.startDate || !form.endDate || !form.totalDurationHours) {
      setNotice('请先补全计划名称、起止日期和总时长。')
      return
    }

    setSaving(true)
    try {
      await studyPlanApi.createPlan({
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        totalDurationHours: Number(form.totalDurationHours),
      }, token)
      setForm(createEmptyPlanForm())
      await loadPlans()
    } catch (error) {
      setNotice(error.message || '计划创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="计划轨道"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '计划轨道' },
          ]}
          title="计划列表负责排布阶段，编辑和打卡都进入计划详情页。"
          lead="把创建动作收进右栏，让主区保持时间轨道视图。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="计划轨道摘要">
          <article className="v2-summary-card">
            <span>计划数量</span>
            <strong>{plans.length}</strong>
            <p>当前账号下已保存的计划总数。</p>
          </article>
          <article className="v2-summary-card">
            <span>最近开场</span>
            <strong>{plans[0]?.startDate ? formatDateLabel(plans[0].startDate) : '待补充'}</strong>
            <p>优先从最先要落地的计划开始推进。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前主线</span>
            <strong>{plans[0]?.name || '暂无计划'}</strong>
            <p>{plans[0]?.status || '等待补充状态说明'}</p>
          </article>
        </section>

        {loading ? <div className="v2-status-note">正在同步计划列表…</div> : null}

        <section className="v2-timeline-card" aria-label="计划轨道列表">
          {plans.map((item) => (
            <Link className="v2-timeline-row" key={item.id} to={`/station/kaoyan/plans/${item.id}`}>
              <div className="v2-timeline-pin">
                {item.startDate ? formatDateLabel(item.startDate).slice(5) : '待排期'}
              </div>
              <div className="v2-timeline-body">
                <strong>{item.name}</strong>
                <p>
                  {item.startDate ? formatDateLabel(item.startDate) : '待补充开始时间'}
                  {' 至 '}
                  {item.endDate ? formatDateLabel(item.endDate) : '待补充结束时间'}
                </p>
                <span>{item.description}</span>
                <div className="v2-tag-row">
                  <span>{item.status}</span>
                  {item.totalDurationHours ? <span>{item.totalDurationHours} 小时</span> : null}
                  <span>{item.completionRate}% 完成</span>
                </div>
              </div>
            </Link>
          ))}
          {!plans.length ? <div className="v2-status-note">当前还没有计划，请先创建一条新计划。</div> : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">新建计划</p>
          <form className="v2-filter-form" onSubmit={handleCreatePlan}>
            <label className="v2-field">
              <span>计划名称</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>计划说明</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>开始日期</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>结束日期</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>总时长（小时）</span>
              <input
                type="number"
                value={form.totalDurationHours}
                onChange={(event) => setForm((current) => ({ ...current, totalDurationHours: event.target.value }))}
              />
            </label>
            <button className="v2-segment-button is-active" disabled={saving || !canUseRemote} type="submit">
              {saving ? '保存中…' : '新建计划'}
            </button>
          </form>
        </section>
      </aside>
    </>
  )
}

