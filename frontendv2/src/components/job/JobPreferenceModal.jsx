import { useEffect, useState } from 'react'

const emptyPreference = {
  cities: '',
  industries: '',
  roleTypes: '',
  salaryRange: '',
  companyTypes: '',
}

export default function JobPreferenceModal({ open, preference, onClose, onSave }) {
  const [draft, setDraft] = useState(emptyPreference)

  useEffect(() => {
    if (!open) return
    setDraft({
      ...emptyPreference,
      ...(preference || {}),
    })
  }, [open, preference])

  if (!open) return null

  function updateField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSave(draft)
  }

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <section
        className="v2-modal-card v2-employment-confirm"
        data-testid="job-preference-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <div>
            <p className="v2-kicker">偏好编辑</p>
            <h3>把提醒规则和求职偏好分开管理</h3>
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>

        <form className="v2-filter-form" onSubmit={handleSubmit}>
          <label className="v2-field">
            <span>偏好城市</span>
            <input value={draft.cities} onChange={(event) => updateField('cities', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>偏好行业</span>
            <input value={draft.industries} onChange={(event) => updateField('industries', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>偏好岗位</span>
            <input value={draft.roleTypes} onChange={(event) => updateField('roleTypes', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>偏好薪资</span>
            <input value={draft.salaryRange} onChange={(event) => updateField('salaryRange', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>偏好企业类型</span>
            <input value={draft.companyTypes} onChange={(event) => updateField('companyTypes', event.target.value)} />
          </label>

          <div className="v2-inline-actions">
            <button className="v2-secondary-link" type="button" onClick={onClose}>取消</button>
            <button className="v2-primary-link" type="submit">保存偏好</button>
          </div>
        </form>
      </section>
    </div>
  )
}
