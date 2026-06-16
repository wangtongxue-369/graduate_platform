export default function JobResumeEditor({ draft, onChange, onSubmit, saving = false }) {
  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <form className="v2-article-card" onSubmit={onSubmit}>
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">编辑简历</p>
          <h3>在线简历</h3>
        </div>
      </div>

      <div className="v2-form-grid">
        <label className="v2-field">
          <span>目标岗位</span>
          <input value={draft.targetRole} onChange={(event) => updateField('targetRole', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>意向城市</span>
          <input value={draft.expectedCities} onChange={(event) => updateField('expectedCities', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>目标行业</span>
          <input value={draft.expectedIndustries} onChange={(event) => updateField('expectedIndustries', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>期望薪资</span>
          <input value={draft.expectedSalary} onChange={(event) => updateField('expectedSalary', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>学历</span>
          <input value={draft.highestEducation} onChange={(event) => updateField('highestEducation', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>专业</span>
          <input value={draft.major} onChange={(event) => updateField('major', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>手机号</span>
          <input value={draft.phone} onChange={(event) => updateField('phone', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>邮箱</span>
          <input value={draft.email} onChange={(event) => updateField('email', event.target.value)} />
        </label>
      </div>

      <label className="v2-field">
        <span>基础信息</span>
        <textarea value={draft.baseInfo} onChange={(event) => updateField('baseInfo', event.target.value)} />
      </label>
      <label className="v2-field">
        <span>技能标签</span>
        <input value={draft.skillTags} onChange={(event) => updateField('skillTags', event.target.value)} />
      </label>
      <label className="v2-field">
        <span>项目经历</span>
        <textarea value={draft.projectExperience} onChange={(event) => updateField('projectExperience', event.target.value)} />
      </label>
      <label className="v2-field">
        <span>工作经历</span>
        <textarea value={draft.internshipExperience} onChange={(event) => updateField('internshipExperience', event.target.value)} />
      </label>
      <label className="v2-field">
        <span>在校经历</span>
        <textarea value={draft.educationExperience} onChange={(event) => updateField('educationExperience', event.target.value)} />
      </label>
      <label className="v2-field">
        <span>自我评价</span>
        <textarea value={draft.selfEvaluation} onChange={(event) => updateField('selfEvaluation', event.target.value)} />
      </label>

      <div className="v2-inline-actions">
        <button className="v2-primary-link" type="submit" disabled={saving}>
          {saving ? '保存中...' : '保存简历'}
        </button>
      </div>
    </form>
  )
}
