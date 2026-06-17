import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import AdminKaoyanSchoolFormModal from '@/components/admin/AdminKaoyanSchoolFormModal.jsx'
import AdminKaoyanScoreLinesModal from '@/components/admin/AdminKaoyanScoreLinesModal.jsx'

const emptySchoolForm = {
  name: '',
  region: '',
  province: '',
  schoolType: '',
  is985: false,
  is211: false,
  isDoubleFirstClass: false,
  active: true,
}

function buildFormFromRow(row) {
  if (!row) return { ...emptySchoolForm }
  return {
    name: row.name || '',
    region: row.region || '',
    province: row.province || '',
    schoolType: row.schoolType || '',
    is985: Boolean(row.is985),
    is211: Boolean(row.is211),
    isDoubleFirstClass: Boolean(row.isDoubleFirstClass),
    active: row.active !== false,
  }
}

function statusLabel(row) {
  return row?.active === false ? '已停用' : '正常'
}

export default function AdminKaoyanSchoolsPage() {
  const { token } = useAuth()
  const [filters, setFilters] = useState({
    name: '',
    region: '',
    province: '',
    schoolType: '',
  })
  const [rows, setRows] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 学校表单弹窗
  const [formModal, setFormModal] = useState({ open: false, mode: 'create', school: null })
  const [form, setForm] = useState(emptySchoolForm)
  const [formError, setFormError] = useState('')
  const [savingForm, setSavingForm] = useState(false)

  // 分数线弹窗
  const [scoreLinesSchool, setScoreLinesSchool] = useState(null)

  // 停用/启用二次确认
  const [statusConfirm, setStatusConfirm] = useState(null)
  const [actingId, setActingId] = useState('')

  async function loadRows() {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.kaoyanSchools({ ...filters, page: 0, size: 12 }, token)
      setRows(data?.content || [])
    } catch (err) {
      setRows([])
      setError(err.message || '院校维护列表加载失败。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [filters.name, filters.province, filters.region, filters.schoolType, token])

  function openCreateModal() {
    setForm({ ...emptySchoolForm })
    setFormError('')
    setFormModal({ open: true, mode: 'create', school: null })
  }

  function openEditModal(row) {
    setForm(buildFormFromRow(row))
    setFormError('')
    setFormModal({ open: true, mode: 'edit', school: row })
  }

  function closeFormModal() {
    if (savingForm) return
    setFormModal({ open: false, mode: 'create', school: null })
    setFormError('')
  }

  function updateFormField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSaveForm(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setFormError('院校名称不能为空。')
      return
    }
    setSavingForm(true)
    setFormError('')
    try {
      if (formModal.mode === 'edit' && formModal.school) {
        await adminApi.updateKaoyanSchool(formModal.school.id, form, token)
        setNotice(`院校「${form.name}」已保存。`)
      } else {
        await adminApi.createKaoyanSchool(form, token)
        setNotice(`院校「${form.name}」已新增。`)
      }
      setFormModal({ open: false, mode: 'create', school: null })
      await loadRows()
    } catch (err) {
      setFormError(err.message || '院校保存失败。')
    } finally {
      setSavingForm(false)
    }
  }

  function requestToggleStatus(row) {
    if (!row) return
    const nextActive = row.active === false
    setStatusConfirm({ row, nextActive })
  }

  function cancelStatusConfirm() {
    if (actingId) return
    setStatusConfirm(null)
  }

  async function confirmToggleStatus() {
    if (!statusConfirm) return
    const { row, nextActive } = statusConfirm
    setActingId(String(row.id))
    setError('')
    try {
      await adminApi.updateKaoyanSchool(row.id, { ...row, active: nextActive }, token)
      setNotice(nextActive ? `院校「${row.name}」已重新启用。` : `院校「${row.name}」已停用。`)
      setStatusConfirm(null)
      await loadRows()
    } catch (err) {
      setError(err.message || '院校状态更新失败。')
    } finally {
      setActingId('')
    }
  }

  function openScoreLines(school) {
    setScoreLinesSchool(school)
  }

  function closeScoreLines() {
    setScoreLinesSchool(null)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="院校维护"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考研治理', to: '/admin/kaoyan' },
            { label: '院校维护' },
          ]}
          title="院校维护"
          lead="基业长青，始于根基。"
          actions={(
            <button
              className="v2-segment-button is-active"
              type="button"
              onClick={openCreateModal}
            >
              新增院校
            </button>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {error ? <div className="v2-status-note">{error}</div> : null}
        {loading ? <div className="v2-status-note">正在同步院校列表…</div> : null}

        <section className="v2-card-grid" aria-label="院校维护列表">
          {rows.map((item) => {
            const isInactive = item.active === false
            const isActing = actingId === String(item.id)
            return (
              <article
                className={`v2-module-card ${isInactive ? 'is-inactive' : ''}`}
                key={item.id}
              >
                <div className="v2-module-card__head">
                  <strong>{item.name}</strong>
                  <span className={`v2-plan-status-pill ${isInactive ? 'is-inactive' : ''}`}>
                    {statusLabel(item)}
                  </span>
                </div>
                <p>{item.region || '地区待补充'} / {item.province || '省份待补充'}</p>
                <p>{item.schoolType || '类型待补充'}</p>
                <div className="v2-tag-row">
                  {item.is985 ? <span>985</span> : null}
                  {item.is211 ? <span>211</span> : null}
                  {item.isDoubleFirstClass ? <span>双一流</span> : null}
                </div>
                <div className="v2-inline-actions">
                  <button
                    className="v2-segment-button is-active"
                    type="button"
                    onClick={() => openEditModal(item)}
                  >
                    编辑院校
                  </button>
                  <button
                    className="v2-segment-button"
                    type="button"
                    onClick={() => openScoreLines(item)}
                  >
                    分数线
                  </button>
                  <button
                    className={`v2-segment-button ${isInactive ? 'is-active' : ''}`}
                    disabled={isActing}
                    type="button"
                    onClick={() => requestToggleStatus(item)}
                  >
                    {isActing ? '处理中…' : isInactive ? '重新启用' : '停用院校'}
                  </button>
                </div>
              </article>
            )
          })}
          {!rows.length ? (
            <article className="v2-module-card">
              <p>当前筛选下没有院校记录。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>院校名称</span>
              <input
                type="text"
                value={filters.name}
                onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={filters.region}
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>省份</span>
              <input
                type="text"
                value={filters.province}
                onChange={(event) => setFilters((current) => ({ ...current, province: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>院校类型</span>
              <input
                type="text"
                value={filters.schoolType}
                onChange={(event) => setFilters((current) => ({ ...current, schoolType: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">维护说明</p>
          <ul>
            <li>停用后学校仍保留记录，状态变更为「已停用」。</li>
            <li>分数线在「分数线」弹窗里独立管理，不随院校一起停用。</li>
            <li>如需彻底移除，请联系研发同学走数据库清理。</li>
          </ul>
        </section>
      </aside>

      {formModal.open ? (
        <AdminKaoyanSchoolFormModal
          mode={formModal.mode}
          form={form}
          error={formError}
          saving={savingForm}
          onChange={updateFormField}
          onClose={closeFormModal}
          onSubmit={handleSaveForm}
        />
      ) : null}

      {scoreLinesSchool ? (
        <AdminKaoyanScoreLinesModal
          token={token}
          school={scoreLinesSchool}
          onClose={closeScoreLines}
        />
      ) : null}

      {statusConfirm ? (
        <div className="v2-modal-overlay" onClick={cancelStatusConfirm}>
          <div
            className="v2-modal-card v2-school-status-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="v2-modal-head">
              <h3>{statusConfirm.nextActive ? '重新启用院校' : '停用院校'}</h3>
              <button
                className="v2-segment-button"
                type="button"
                onClick={cancelStatusConfirm}
              >
                关闭
              </button>
            </div>
            <p>
              {statusConfirm.nextActive
                ? `确认重新启用「${statusConfirm.row.name}」吗？启用后会立即对学生侧恢复可见。`
                : `确认停用「${statusConfirm.row.name}」吗？停用后学生侧将看不到这条记录。`}
            </p>
            {error ? <div className="v2-status-note">{error}</div> : null}
            <div className="v2-inline-actions">
              <button
                className="v2-segment-button"
                type="button"
                onClick={cancelStatusConfirm}
              >
                取消
              </button>
              <button
                className="v2-segment-button is-active"
                type="button"
                onClick={confirmToggleStatus}
              >
                {statusConfirm.nextActive ? '确认启用' : '确认停用'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
