const statusOptions = [
  { value: 'TODO', label: '待投递' },
  { value: 'APPLIED', label: '已投递' },
  { value: 'SCREENING', label: '筛选中' },
  { value: 'WRITTEN_TEST', label: '笔试' },
  { value: 'FIRST_INTERVIEW', label: '一面' },
  { value: 'SECOND_INTERVIEW', label: '二面' },
  { value: 'HR_INTERVIEW', label: 'HR 面' },
  { value: 'FINAL_INTERVIEW', label: '终面' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'ACCEPTED', label: '已接受' },
  { value: 'DECLINED', label: '已拒绝' },
  { value: 'REJECTED', label: '未通过' },
  { value: 'WITHDRAWN', label: '已撤回' },
  { value: 'CLOSED', label: '已关闭' },
]

const interviewModeOptions = ['线上', '线下', '电话', '待定']

export default function JobApplicationEditorDrawer({
  open,
  mode,
  draft,
  onChange,
  onClose,
  onSave,
}) {
  if (!open) return null

  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSave()
  }

  return (
    <section
      className="v2-side-card v2-practice-drawer v2-employment-drawer"
      data-testid="job-application-editor-drawer"
    >
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">跟踪抽屉</p>
          <h3>{mode === 'edit' ? '编辑跟踪条目' : '新建跟踪条目'}</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
      </div>

      <form className="v2-filter-form" onSubmit={handleSubmit}>
        <label className="v2-field">
          <span>公司</span>
          <input value={draft.companyName} onChange={(event) => updateField('companyName', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>岗位名称</span>
          <input value={draft.jobTitle} onChange={(event) => updateField('jobTitle', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>岗位 ID</span>
          <input value={draft.jobPostingId} onChange={(event) => updateField('jobPostingId', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>投递渠道</span>
          <input value={draft.channel} onChange={(event) => updateField('channel', event.target.value)} placeholder="官网 / 内推 / 招聘平台" />
        </label>
        <label className="v2-field">
          <span>城市</span>
          <input value={draft.city} onChange={(event) => updateField('city', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>行业</span>
          <input value={draft.industry} onChange={(event) => updateField('industry', event.target.value)} />
        </label>
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
        <label className="v2-field">
          <span>状态</span>
          <select value={draft.status} onChange={(event) => updateField('status', event.target.value)}>
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>投递时间</span>
          <input type="datetime-local" value={draft.appliedAt} onChange={(event) => updateField('appliedAt', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>下一步时间</span>
          <input type="datetime-local" value={draft.nextStepAt} onChange={(event) => updateField('nextStepAt', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>面试轮次</span>
          <input value={draft.interviewRound} onChange={(event) => updateField('interviewRound', event.target.value)} placeholder="一面 / 终面" />
        </label>
        <label className="v2-field">
          <span>面试方式</span>
          <select value={draft.interviewMode} onChange={(event) => updateField('interviewMode', event.target.value)}>
            <option value="">未设置</option>
            {interviewModeOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>联系信息</span>
          <input value={draft.contactInfo} onChange={(event) => updateField('contactInfo', event.target.value)} placeholder="姓名 / 电话 / 微信" />
        </label>
        <label className="v2-field">
          <span>面试地点或链接</span>
          <input value={draft.interviewLocation} onChange={(event) => updateField('interviewLocation', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>使用简历</span>
          <input value={draft.resumeFileName} onChange={(event) => updateField('resumeFileName', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>申请链接</span>
          <input value={draft.applyUrl} onChange={(event) => updateField('applyUrl', event.target.value)} placeholder="https://..." />
        </label>
        <label className="v2-field">
          <span>Offer 薪资</span>
          <input value={draft.offerSalary} onChange={(event) => updateField('offerSalary', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>未通过原因</span>
          <input value={draft.failureReason} onChange={(event) => updateField('failureReason', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>备注</span>
          <textarea value={draft.notes} onChange={(event) => updateField('notes', event.target.value)} />
        </label>

        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">保存跟踪条目</button>
        </div>
      </form>
    </section>
  )
}
