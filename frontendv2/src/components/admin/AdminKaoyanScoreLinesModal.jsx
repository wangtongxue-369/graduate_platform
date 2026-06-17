import { useEffect, useState } from 'react'
import { adminApi } from '@legacy/lib/api.js'
import AdminKaoyanScoreLineFormModal from '@/components/admin/AdminKaoyanScoreLineFormModal.jsx'

const emptyScoreLineForm = {
  year: '',
  majorCategory: '',
  majorName: '',
  degreeType: '',
  politicsLine: '',
  foreignLangLine: '',
  subject1Line: '',
  subject2Line: '',
  totalScoreLine: '',
  plannedEnrollment: '',
  actualApplicants: '',
  admissionRatio: '',
  note: '',
  source: '',
}

function defaultFormFor(row) {
  if (!row) return { ...emptyScoreLineForm }
  return {
    year: row.year || '',
    majorCategory: row.majorCategory || '',
    majorName: row.majorName || '',
    degreeType: row.degreeType || '',
    politicsLine: row.politicsLine || '',
    foreignLangLine: row.foreignLangLine || '',
    subject1Line: row.subject1Line || '',
    subject2Line: row.subject2Line || '',
    totalScoreLine: row.totalScoreLine || '',
    plannedEnrollment: row.plannedEnrollment || '',
    actualApplicants: row.actualApplicants || '',
    admissionRatio: row.admissionRatio || '',
    note: row.note || '',
    source: row.source || '',
  }
}

export default function AdminKaoyanScoreLinesModal({
  token,
  school,
  onClose,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [formModal, setFormModal] = useState({ open: false, mode: 'create', row: null })
  const [form, setForm] = useState(emptyScoreLineForm)
  const [formError, setFormError] = useState('')
  const [savingForm, setSavingForm] = useState(false)

  async function loadLines() {
    if (!school?.id) return
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.kaoyanScoreLines({ schoolId: school.id, page: 0, size: 50 }, token)
      setRows(Array.isArray(data?.content) ? data.content : [])
      setNotice('分数线列表已同步。')
    } catch (err) {
      setRows([])
      setError(err.message || '分数线列表加载失败。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setError('')
    setNotice('')
    setFormModal({ open: false, mode: 'create', row: null })
    loadLines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id])

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreateForm() {
    setForm({ ...emptyScoreLineForm })
    setFormError('')
    setFormModal({ open: true, mode: 'create', row: null })
  }

  function openEditForm(row) {
    setForm(defaultFormFor(row))
    setFormError('')
    setFormModal({ open: true, mode: 'edit', row })
  }

  function closeFormModal() {
    if (savingForm) return
    setFormModal({ open: false, mode: 'create', row: null })
    setFormError('')
  }

  async function handleSaveForm(event) {
    event.preventDefault()
    if (!school?.id) return
    setSavingForm(true)
    setFormError('')
    try {
      if (formModal.mode === 'edit' && formModal.row) {
        await adminApi.updateKaoyanScoreLine(formModal.row.id, form, token)
      } else {
        await adminApi.createKaoyanScoreLine({ ...form, schoolId: Number(school.id) }, token)
      }
      setFormModal({ open: false, mode: 'create', row: null })
      await loadLines()
    } catch (err) {
      setFormError(err.message || '分数线保存失败。')
    } finally {
      setSavingForm(false)
    }
  }

  async function handleDisable(id) {
    try {
      await adminApi.deleteKaoyanScoreLine(id, token)
      if (formModal.row && String(formModal.row.id) === String(id)) {
        setFormModal({ open: false, mode: 'create', row: null })
      }
      await loadLines()
    } catch (err) {
      setError(err.message || '分数线停用失败。')
    }
  }

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div
        className="v2-modal-card v2-score-lines-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <div>
            <p className="v2-kicker">{school?.name || '院校'}</p>
            <h3>分数线维护</h3>
          </div>
          <div className="v2-inline-actions">
            <button
              className="v2-segment-button is-active"
              type="button"
              onClick={openCreateForm}
            >
              新增分数线
            </button>
            <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
          </div>
        </div>

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {error ? <div className="v2-status-note">{error}</div> : null}
        {loading ? <div className="v2-status-note">正在同步分数线列表…</div> : null}

        <div className="v2-ledger-card">
          {rows.map((item) => (
            <article
              className={`v2-ledger-row v2-ledger-row--material ${formModal.row && String(formModal.row.id) === String(item.id) ? 'is-selected' : ''}`}
              key={item.id}
            >
              <div className="v2-ledger-row__main">
                <strong>{item.majorName || item.majorCategory || '专业待补充'}</strong>
                <p>{item.year || '年份待补充'} / 总分线 {item.totalScoreLine || '待补充'}</p>
                <div className="v2-tag-row">
                  {item.degreeType ? <span>{item.degreeType}</span> : null}
                  {item.majorCategory ? <span>{item.majorCategory}</span> : null}
                  {item.admissionRatio ? <span>报录比 {item.admissionRatio}:1</span> : null}
                  {item.plannedEnrollment ? <span>计划 {item.plannedEnrollment}</span> : null}
                </div>
                {item.note ? <p>{item.note}</p> : null}
              </div>
              <div className="v2-ledger-row__actions">
                <button
                  className="v2-segment-button is-active"
                  type="button"
                  onClick={() => openEditForm(item)}
                >
                  编辑
                </button>
                <button
                  className="v2-segment-button"
                  type="button"
                  onClick={() => handleDisable(item.id)}
                >
                  停用
                </button>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-empty-card">
              <p>当前院校还没有分数线记录，点击右上「新增分数线」开始维护。</p>
            </article>
          ) : null}
        </div>

        {formModal.open ? (
          <AdminKaoyanScoreLineFormModal
            mode={formModal.mode}
            form={form}
            error={formError}
            saving={savingForm}
            onChange={updateForm}
            onClose={closeFormModal}
            onSubmit={handleSaveForm}
          />
        ) : null}
      </div>
    </div>
  )
}
