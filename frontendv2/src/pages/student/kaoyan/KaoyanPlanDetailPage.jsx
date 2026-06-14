import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyPlanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import KaoyanPlanCalendarCard from '@/components/kaoyan/KaoyanPlanCalendarCard.jsx'
import KaoyanPlanCheckInModal from '@/components/kaoyan/KaoyanPlanCheckInModal.jsx'
import KaoyanPlanDayPanel from '@/components/kaoyan/KaoyanPlanDayPanel.jsx'
import KaoyanPlanEditModal from '@/components/kaoyan/KaoyanPlanEditModal.jsx'
import {
  buildPlanCalendarDays,
  buildPlanDetailMetrics,
  createEmptyCheckInForm,
  createEmptyPlanForm,
  createKaoyanPlanDetailPreview,
  getPlanDayStatus,
  groupCheckInsByDate,
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

function buildPlanFormState(plan) {
  return {
    ...createEmptyPlanForm(),
    name: plan.name || '',
    description: plan.description || '',
    startDate: plan.startDate || '',
    endDate: plan.endDate || '',
    totalDurationHours: String(plan.plannedDurationHours || plan.totalDurationHours || ''),
  }
}

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
  const [selectedDate, setSelectedDate] = useState('')
  const [displayMonth, setDisplayMonth] = useState(() => new Date())
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [planFormError, setPlanFormError] = useState('')
  const [planForm, setPlanForm] = useState(buildPlanFormState(preview))
  const [checkInForm, setCheckInForm] = useState(createEmptyCheckInForm())

  useEffect(() => {
    setSelectedDate('')
    setDisplayMonth(new Date())
    setCheckInModalOpen(false)
    setEditModalOpen(false)
    setCheckInError('')
    setPlanFormError('')
    setCheckInForm(createEmptyCheckInForm())
  }, [planId])

  async function loadPlanWorkspace() {
    if (!canUseRemote) {
      const nextPreview = createKaoyanPlanDetailPreview(planId)
      const nextPlan = normalizePlanDetail(nextPreview)
      setPlan(nextPlan)
      setCheckIns(normalizeCheckInRows(nextPreview.checkIns))
      setPlanForm(buildPlanFormState(nextPlan))
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
      setPlan(nextPlan)
      setCheckIns(normalizeCheckInRows(checkInData))
      setPlanForm(buildPlanFormState(nextPlan))
      setNotice(remoteDataNotice('计划详情'))
    } catch (error) {
      const nextPreview = createKaoyanPlanDetailPreview(planId)
      const nextPlan = normalizePlanDetail(nextPreview)
      setPlan(nextPlan)
      setCheckIns(normalizeCheckInRows(nextPreview.checkIns))
      setPlanForm(buildPlanFormState(nextPlan))
      setNotice(fallbackDataNotice('计划详情', error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlanWorkspace()
  }, [canUseRemote, planId, token])

  function handleCheckInFormChange(key, value) {
    setCheckInForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handlePlanFormChange(key, value) {
    setPlanForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function openCheckInModal() {
    setCheckInError('')
    setCheckInForm({
      ...createEmptyCheckInForm(),
      checkInDate: selectedDate,
    })
    setCheckInModalOpen(true)
  }

  function openEditModal() {
    setPlanFormError('')
    setPlanForm(buildPlanFormState(plan))
    setEditModalOpen(true)
  }

  async function handleSubmitCheckIn(event) {
    event.preventDefault()
    if (!canUseRemote || !token || !selectedDate) return

    const hours = Number(checkInForm.durationHours)
    if (!Number.isFinite(hours) || hours <= 0) {
      setCheckInError('请输入大于 0 的学习时长')
      return
    }
    if (hours >= 24) {
      setCheckInError('单次打卡时长必须小于 24 小时')
      return
    }

    setCheckInError('')
    setSavingCheckIn(true)
    try {
      await studyPlanApi.addCheckIn(planId, {
        checkInDate: selectedDate,
        durationHours: hours,
        remark: checkInForm.remark.trim(),
      }, token)
      setCheckInModalOpen(false)
      setCheckInForm(createEmptyCheckInForm())
      await loadPlanWorkspace()
    } catch (error) {
      setCheckInError(error.message || '打卡失败')
    } finally {
      setSavingCheckIn(false)
    }
  }

  async function handleSubmitPlan(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return

    if (!planForm.name.trim() || !planForm.startDate || !planForm.endDate || !planForm.totalDurationHours) {
      setPlanFormError('请填写完整信息')
      return
    }
    if (planForm.endDate < planForm.startDate) {
      setPlanFormError('结束日期不能早于开始日期')
      return
    }

    setPlanFormError('')
    setSavingPlan(true)
    try {
      await studyPlanApi.updatePlan(planId, {
        name: planForm.name.trim(),
        description: planForm.description.trim(),
        startDate: planForm.startDate,
        endDate: planForm.endDate,
        totalDurationHours: Number(planForm.totalDurationHours),
      }, token)
      setEditModalOpen(false)
      await loadPlanWorkspace()
    } catch (error) {
      setPlanFormError(error.message || '更新失败')
    } finally {
      setSavingPlan(false)
    }
  }

  async function handleDeletePlan() {
    if (!canUseRemote || !token) return
    if (!window.confirm('确定删除该计划？')) return

    setSavingPlan(true)
    try {
      await studyPlanApi.deletePlan(planId, token)
      navigate('/station/kaoyan/plans')
    } catch (error) {
      setNotice(error.message || '计划删除失败')
      setSavingPlan(false)
    }
  }

  async function handleDeleteCheckIn(checkInId) {
    if (!canUseRemote || !token) return
    if (!window.confirm('确定删除该打卡记录？')) return

    setSavingCheckIn(true)
    try {
      await studyPlanApi.deleteCheckIn(checkInId, token)
      await loadPlanWorkspace()
    } catch (error) {
      setNotice(error.message || '打卡删除失败')
    } finally {
      setSavingCheckIn(false)
    }
  }

  const metrics = buildPlanDetailMetrics(plan, checkIns, new Date())
  const monthSeed = selectedDate || `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, '0')}-01`
  const calendarCells = buildPlanCalendarDays(monthSeed)
  const statusByDate = Object.fromEntries(
    calendarCells
      .filter(Boolean)
      .map((cell) => [cell.key, getPlanDayStatus(cell.key, {
        startDate: plan.startDate,
        endDate: plan.endDate,
        checkedDates: metrics.checkedDates,
        todayKey: metrics.todayKey,
      })]),
  )
  const dayGroups = groupCheckInsByDate(checkIns)
  const dayCheckIns = selectedDate ? (dayGroups[selectedDate] || []) : []
  const selectedStatus = selectedDate
    ? getPlanDayStatus(selectedDate, {
      startDate: plan.startDate,
      endDate: plan.endDate,
      checkedDates: metrics.checkedDates,
      todayKey: metrics.todayKey,
    })
    : 'out'

  const selectedStatusLabel = {
    checked: '已打卡',
    today: '今日',
    missed: '未打卡',
    future: '未来',
    out: '超出范围',
  }[selectedStatus] || '未选择'

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
          lead={plan.description || '把旧版的月历打卡工作流收进新版工作台。'}
          actions={(
            <>
              <button className="v2-segment-button" type="button" onClick={() => navigate('/station/kaoyan/plans')}>
                返回列表
              </button>
              <button
                className="v2-segment-button"
                disabled={!canUseRemote || savingPlan}
                type="button"
                onClick={openEditModal}
              >
                编辑计划
              </button>
              <button
                className="v2-segment-button"
                disabled={!canUseRemote || savingPlan}
                type="button"
                onClick={handleDeletePlan}
              >
                删除计划
              </button>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-plan-summary-workbench" aria-label="计划摘要">
          <article className="v2-plan-summary-hero">
            <div className="v2-plan-summary-hero__head">
              <div>
                <p className="v2-kicker">完成率</p>
                <h2>{metrics.completionRate}%</h2>
              </div>
              <span className="v2-plan-summary-hero__label">当前进度</span>
            </div>

            <div className="v2-plan-progress-track v2-plan-progress-track--hero">
              <div className="v2-plan-progress-fill" style={{ width: `${Math.min(metrics.completionRate, 100)}%` }} />
            </div>
            <div className="v2-plan-summary-hero__meta">
              <div className="v2-plan-summary-hero__meta-item">
                <span>已完成时长</span>
                <strong>{metrics.totalCheckedHours.toFixed(1)}h</strong>
              </div>
              <div className="v2-plan-summary-hero__meta-item">
                <span>剩余时长</span>
                <strong>{Math.max(metrics.plannedHours - metrics.totalCheckedHours, 0).toFixed(1)}h</strong>
              </div>
            </div>
          </article>
        </section>

        {loading ? <div className="v2-status-note">正在同步计划详情…</div> : null}

        <KaoyanPlanCalendarCard
          monthLabel={displayMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          cells={calendarCells}
          selectedDate={selectedDate}
          statusByDate={statusByDate}
          onPrevMonth={() => setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}
          onNextMonth={() => setDisplayMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}
          onSelectDate={setSelectedDate}
        />

        <KaoyanPlanDayPanel
          canCheckIn={selectedStatus === 'today' && canUseRemote}
          canDelete={canUseRemote}
          dayCheckIns={dayCheckIns}
          deleting={savingCheckIn}
          selectedDate={selectedDate}
          selectedStatus={selectedStatus}
          onDeleteCheckIn={handleDeleteCheckIn}
          onOpenCheckIn={openCheckInModal}
        />
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">计划区间</p>
          <div className="v2-side-section">
            <strong>{plan.startDate || '待补充'} - {plan.endDate || '待补充'}</strong>
            <p className="v2-note-text">先在主区切日期，再查看当天记录。旧版规则仍然是只有今天可以新增打卡。</p>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">执行信息</p>
          <div className="v2-side-section">
            <div className="v2-plan-side-facts">
              <div className="v2-plan-side-fact">
                <span>连续打卡天数</span>
                <strong>{metrics.streak}</strong>
              </div>
              <div className="v2-plan-side-fact">
                <span>总打卡天数</span>
                <strong>{metrics.checkedDays}</strong>
              </div>
              <div className="v2-plan-side-fact">
                <span>计划总时长</span>
                <strong>{metrics.plannedHours}h</strong>
              </div>
              <div className="v2-plan-side-fact">
                <span>总打卡时长</span>
                <strong>{metrics.totalCheckedHours.toFixed(1)}h</strong>
              </div>
              <div className="v2-plan-side-fact">
                <span>计划起点</span>
                <strong>{plan.startDate ? formatDateLabel(plan.startDate) : '待补充'}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">当前选中日期</p>
          <div className="v2-side-section">
            <strong>{selectedDate || '未选择日期'}</strong>
            <p className="v2-note-text">
              {selectedDate
                ? `当前状态：${selectedStatusLabel}`
                : '点击月历中的日期后，这里会显示当天状态。'}
            </p>
          </div>
        </section>
      </aside>

      {checkInModalOpen ? (
        <KaoyanPlanCheckInModal
          dateLabel={selectedDate}
          error={checkInError}
          form={checkInForm}
          saving={savingCheckIn}
          onChange={handleCheckInFormChange}
          onClose={() => {
            setCheckInModalOpen(false)
            setCheckInError('')
          }}
          onSubmit={handleSubmitCheckIn}
        />
      ) : null}

      {editModalOpen ? (
        <KaoyanPlanEditModal
          error={planFormError}
          form={planForm}
          saving={savingPlan}
          onChange={handlePlanFormChange}
          onClose={() => {
            setEditModalOpen(false)
            setPlanFormError('')
          }}
          onSubmit={handleSubmitPlan}
        />
      ) : null}
    </>
  )
}
