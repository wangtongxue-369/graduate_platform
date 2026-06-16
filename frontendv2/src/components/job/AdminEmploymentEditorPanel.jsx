const emptyFair = {
  title: '',
  companyName: '',
  city: '',
  industry: '',
  targetRoles: '',
  location: '',
  startTime: '',
  applyDeadline: '',
  applyUrl: '',
  description: '',
  active: true,
}

const emptyJob = {
  title: '',
  companyName: '',
  city: '',
  industry: '',
  companyType: '',
  roleType: '',
  salaryRange: '',
  educationRequirement: '',
  majorKeywords: '',
  skillTags: '',
  applyUrl: '',
  description: '',
  active: true,
}

export function createFairDraft(item) {
  return {
    ...emptyFair,
    ...(item || {}),
    startTime: item?.startTime ? String(item.startTime).slice(0, 16) : '',
    applyDeadline: item?.applyDeadline ? String(item.applyDeadline).slice(0, 16) : '',
  }
}

export function createJobDraft(item) {
  return {
    ...emptyJob,
    ...(item || {}),
  }
}

export default function AdminEmploymentEditorPanel({
  mode,
  draft,
  onChange,
  onSave,
  onReset,
}) {
  if (mode !== 'fairs' && mode !== 'jobs') return null

  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="v2-side-card v2-practice-drawer" data-testid="admin-employment-editor-panel">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">编辑工作台</p>
          <h3>{mode === 'fairs' ? '招聘会编辑台' : '岗位编辑台'}</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onReset}>重置</button>
      </div>

      <form className="v2-filter-form" onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}>
        <label className="v2-field">
          <span>标题</span>
          <input value={draft.title} onChange={(event) => updateField('title', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>企业名称</span>
          <input value={draft.companyName} onChange={(event) => updateField('companyName', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>城市</span>
          <input value={draft.city} onChange={(event) => updateField('city', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>行业</span>
          <input value={draft.industry} onChange={(event) => updateField('industry', event.target.value)} />
        </label>

        {mode === 'fairs' ? (
          <>
            <label className="v2-field">
              <span>面向岗位</span>
              <input value={draft.targetRoles} onChange={(event) => updateField('targetRoles', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>地点</span>
              <input value={draft.location} onChange={(event) => updateField('location', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>开始时间</span>
              <input type="datetime-local" value={draft.startTime} onChange={(event) => updateField('startTime', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>报名截止</span>
              <input type="datetime-local" value={draft.applyDeadline} onChange={(event) => updateField('applyDeadline', event.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className="v2-field">
              <span>企业类型</span>
              <input value={draft.companyType} onChange={(event) => updateField('companyType', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>岗位类型</span>
              <input value={draft.roleType} onChange={(event) => updateField('roleType', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>薪资范围</span>
              <input value={draft.salaryRange} onChange={(event) => updateField('salaryRange', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>学历要求</span>
              <input value={draft.educationRequirement} onChange={(event) => updateField('educationRequirement', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>专业关键词</span>
              <input value={draft.majorKeywords} onChange={(event) => updateField('majorKeywords', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>技能关键词</span>
              <input value={draft.skillTags} onChange={(event) => updateField('skillTags', event.target.value)} />
            </label>
          </>
        )}

        <label className="v2-field">
          <span>链接</span>
          <input value={draft.applyUrl} onChange={(event) => updateField('applyUrl', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>描述</span>
          <textarea value={draft.description} onChange={(event) => updateField('description', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>启用状态</span>
          <div className="v2-segment-group" role="group" aria-label="启用状态">
            {[
              { value: true, label: '启用' },
              { value: false, label: '停用' },
            ].map((item) => (
              <button
                key={item.label}
                className={`v2-segment-button ${draft.active === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => updateField('active', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </label>

        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">{mode === 'fairs' ? '保存招聘会' : '保存岗位'}</button>
        </div>
      </form>
    </section>
  )
}
