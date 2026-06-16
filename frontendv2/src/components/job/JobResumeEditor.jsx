export default function JobResumeEditor({ draft, onChange, onSubmit }) {
  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <form className="v2-article-card" onSubmit={onSubmit}>
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">编辑简历</p>
          <h3>结构化维护在线简历字段</h3>
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
          <span>最高学历</span>
          <input value={draft.highestEducation} onChange={(event) => updateField('highestEducation', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>专业</span>
          <input value={draft.major} onChange={(event) => updateField('major', event.target.value)} />
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
        <span>项目关键词</span>
        <input value={draft.projectKeywords} onChange={(event) => updateField('projectKeywords', event.target.value)} />
      </label>
      <label className="v2-field">
        <span>自我评价</span>
        <textarea value={draft.selfEvaluation} onChange={(event) => updateField('selfEvaluation', event.target.value)} />
      </label>

      <div className="v2-inline-actions">
        <button className="v2-primary-link" type="submit">保存简历</button>
      </div>
    </form>
  )
}
