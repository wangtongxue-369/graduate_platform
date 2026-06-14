import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyPlanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createEmptyCheckInForm,
  createEmptyPlanForm,
  createKaoyanPlanDetailPreview,
  normalizeCheckInRows,
  normalizePlanDetail,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function KaoyanPlanDetailPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const preview = createKaoyanPlanDetailPreview(planId)
  const [plan, setPlan] = useState(normalizePlanDetail(preview))
  const [checkIns, setCheckIns] = useState(normalizeCheckInRows(preview.checkIns))
  const [notice, setNotice] = useState(previewDataNotice('计划详情'))
  const [loading, setLoading] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [savingCheckIn, setSavingCheckIn] = useState(false)
  const [planForm, setPlanForm] = useState({
    ...createEmptyPlanForm(),
    name: preview.name,
    description: preview.description,
    startDate: preview.startDate,
    endDate: preview.endDate,
    totalDurationHours: preview.totalDurationHours,
  })
  const [checkInForm, setCheckInForm] = useState({
    ...createEmptyCheckInForm(),
    checkInDate: preview.checkIns[0]?.checkInDate || preview.startDate,
  })

  async function loadPlanWorkspace() {
    if (!canUseRemote) {
      const nextPreview = createKaoyanPlanDetailPreview(planId)
      setPlan(normalizePlanDetail(nextPreview))
      setCheckIns(normalizeCheckInRows(nextPreview.checkIns))
      setPlanForm({
        ...createEmptyPlanForm(),
        name: nextPreview.name,
        description: nextPreview.description,
        startDate: nextPreview.startDate,
        endDate: nextPreview.endDate,
        totalDurationHours: nextPreview.totalDurationHours,
      })
      setNotice(previewDataNotice('计划详情'))
      return
    }

    setLoading(true)
    try {
      const [planData, checkInData] = await withRequestTimeout(
        Promise.all([
          studyPlanApi.planDetail(planId, token),
          studyPlanApi.checkIns(planId, token),
        ]),
        8000,
        '计划详情读取超时，请检查后端服务。',
      )
      const nextPlan = normalizePlanDetail(planData)
      const nextCheckIns = normalizeCheckInRows(checkInData)
      setPlan(nextPlan)
      setCheckIns(nextCheckIns)
      setPlanForm({
        ...createEmptyPlanForm(),
        name: nextPlan.name,
        description: nextPlan.description,
        startDate: nextPlan.startDate,
        endDate: nextPlan.endDate,
        totalDurationHours: nextPlan.totalDurationHours,
      })
      setNotice(remoteDataNotice('计划详情'))
    } catch (error) {
      const nextPreview = createKaoyanPlanDetailPreview(planId)
      setPlan(normalizePlanDetail(nextPreview))
      setCheckIns(normalizeCheckInRows(nextPreview.checkIns))
      setNotice(fallbackDataNotice('计划详情', error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlanWorkspace()
  }, [canUseRemote, planId, token])

  function startEditCheckIn(item) {
    setCheckInForm({
      id: item.id,
      checkInDate: item.checkInDate,
      durationHours: String(item.durationHours || ''),
      remark: item.remark || '',
    })
  }

  async function handleSavePlan(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return
    setSavingPlan(true)
    try {
      await studyPlanApi.updatePlan(planId, {
        name: planForm.name.trim(),
        description: planForm.description.trim(),
        startDate: planForm.startDate,
        endDate: planForm.endDate,
        totalDurationHours: Number(planForm.totalDurationHours),
      }, token)
      await loadPlanWorkspace()
    } catch (error) {
      setNotice(error.message || '计划更新失败')
    } finally {
      setSavingPlan(false)
    }
  }

  async function handleDeletePlan() {
    if (!canUseRemote || !token) return
    setSavingPlan(true)
    try {
      await studyPlanApi.deletePlan(planId, token)
      navigate('/station/kaoyan/plans')
    } catch (error) {
      setNotice(error.message || '计划删除失败')
      setSavingPlan(false)
    }
  }

  async function handleSaveCheckIn(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return
    setSavingCheckIn(true)
    try {
      const payload = {
        checkInDate: checkInForm.checkInDate,
        durationHours: Number(checkInForm.durationHours),
        remark: checkInForm.remark.trim(),
      }
      if (checkInForm.id) {
        await studyPlanApi.updateCheckIn(checkInForm.id, payload, token)
      } else {
        await studyPlanApi.addCheckIn(planId, payload, token)
      }
      setCheckInForm({
        ...createEmptyCheckInForm(),
        checkInDate: plan.startDate || '',
      })
      await loadPlanWorkspace()
    } catch (error) {
      setNotice(error.message || '打卡保存失败')
    } finally {
      setSavingCheckIn(false)
    }
  }

  async function handleDeleteCheckIn() {
    if (!checkInForm.id || !canUseRemote || !token) return
    setSavingCheckIn(true)
    try {
      await studyPlanApi.deleteCheckIn(checkInForm.id, token)
      setCheckInForm({
        ...createEmptyCheckInForm(),
        checkInDate: plan.startDate || '',
      })
      await loadPlanWorkspace()
    } catch (error) {
      setNotice(error.message || '打卡删除失败')
    } finally {
      setSavingCheckIn(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="计划详情"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '计划轨道', to: '/station/kaoyan/plans' },
            { label: plan.name },
          ]}
          title={plan.name}
          lead={plan.description || '把计划总览、打卡轨迹和维护动作拆进同一个详情工作区。'}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="计划摘要">
          <article className="v2-summary-card">
            <span>完成率</span>
            <strong>{plan.completionRate ?? 0}%</strong>
            <p>由后端聚合 check-ins 后返回。</p>
          </article>
          <article className="v2-summary-card">
            <span>计划时长</span>
            <strong>{plan.totalDurationHours || '待补充'}</strong>
            <p>总时长用于估算当前轨道密度。</p>
          </article>
          <article className="v2-summary-card">
            <span>打卡数量</span>
            <strong>{checkIns.length}</strong>
            <p>{plan.startDate ? `${formatDateLabel(plan.startDate)} 开始` : '开始时间待补充'}</p>
          </article>
        </section>

        {loading ? <div className="v2-status-note">正在同步计划详情…</div> : null}

        <section className="v2-timeline-card" aria-label="打卡记录">
          {checkIns.map((item) => (
            <div className="v2-timeline-row" key={item.id}>
              <div className="v2-timeline-pin">
                {item.checkInDate ? formatDateLabel(item.checkInDate).slice(5) : '待排期'}
              </div>
              <div className="v2-timeline-body">
                <strong>{item.durationHours} 小时</strong>
                <p>{item.checkInDate ? formatDateLabel(item.checkInDate) : '打卡日期待补充'}</p>
                <span>{item.remark || '暂无备注'}</span>
                <div className="v2-inline-actions">
                  <button className="v2-segment-button" type="button" onClick={() => startEditCheckIn(item)}>
                    编辑打卡
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!checkIns.length ? <div className="v2-status-note">当前计划还没有打卡记录。</div> : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">快捷打卡</p>
          <form className="v2-filter-form" onSubmit={handleSaveCheckIn}>
            <label className="v2-field">
              <span>打卡日期</span>
              <input
                type="date"
                value={checkInForm.checkInDate}
                onChange={(event) => setCheckInForm((current) => ({ ...current, checkInDate: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>学习时长（小时）</span>
              <input
                type="number"
                value={checkInForm.durationHours}
                onChange={(event) => setCheckInForm((current) => ({ ...current, durationHours: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>备注</span>
              <textarea
                value={checkInForm.remark}
                onChange={(event) => setCheckInForm((current) => ({ ...current, remark: event.target.value }))}
              />
            </label>
            <button className="v2-segment-button is-active" disabled={savingCheckIn || !canUseRemote} type="submit">
              {savingCheckIn ? '保存中…' : '保存打卡'}
            </button>
            <button
              className="v2-segment-button"
              disabled={savingCheckIn || !checkInForm.id || !canUseRemote}
              type="button"
              onClick={handleDeleteCheckIn}
            >
              删除打卡
            </button>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">计划设置</p>
          <form className="v2-filter-form" onSubmit={handleSavePlan}>
            <label className="v2-field">
              <span>计划名称</span>
              <input
                type="text"
                value={planForm.name}
                onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>计划说明</span>
              <textarea
                value={planForm.description}
                onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>开始日期</span>
              <input
                type="date"
                value={planForm.startDate}
                onChange={(event) => setPlanForm((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>结束日期</span>
              <input
                type="date"
                value={planForm.endDate}
                onChange={(event) => setPlanForm((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>总时长（小时）</span>
              <input
                type="number"
                value={planForm.totalDurationHours}
                onChange={(event) => setPlanForm((current) => ({ ...current, totalDurationHours: event.target.value }))}
              />
            </label>
            <button className="v2-segment-button is-active" disabled={savingPlan || !canUseRemote} type="submit">
              {savingPlan ? '保存中…' : '更新计划'}
            </button>
            <button
              className="v2-segment-button"
              disabled={savingPlan || !canUseRemote}
              type="button"
              onClick={handleDeletePlan}
            >
              删除计划
            </button>
          </form>
        </section>
      </aside>
    </>
  )
}

