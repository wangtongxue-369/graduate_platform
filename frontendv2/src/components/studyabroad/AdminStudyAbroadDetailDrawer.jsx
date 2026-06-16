import {
  getAdmissionResultLabel,
  getCountryLabel,
  getTopicLabel,
  studyAbroadCountryOptions,
  studyAbroadSubjectOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import StudyAbroadPageModal from '@/components/studyabroad/StudyAbroadPageModal.jsx'

export default function AdminStudyAbroadDetailDrawer({
  open,
  mode,
  item,
  form,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!open) return null

  function updateField(key, value) {
    onChange?.((current) => ({ ...current, [key]: value }))
  }

  const isProgramEditor = mode === 'programs' && form
  const title = isProgramEditor ? (form?.schoolName || '院校项目') : (item?.title || item?.school || '详情')
  const lead = isProgramEditor
    ? '在这个页面中维护院校项目的国家、专业、排名、学费、申请要求和合作项目标记。'
    : '在这个页面中查看完整内容，确认无误后再执行删除等管理操作。'

  return (
    <StudyAbroadPageModal
      open={open}
      kicker={isProgramEditor ? '院校项目管理' : '留学内容详情'}
      title={title}
      lead={lead}
      onClose={onClose}
      className="v2-studyabroad-detail-drawer"
      testId="admin-studyabroad-detail-drawer"
    >
      {mode === 'programs' && form ? (
        <form className="v2-form-grid" onSubmit={(event) => {
          event.preventDefault()
          onSubmit?.()
        }}
        >
          <label className="v2-field">
            <span>国家 / 地区</span>
            <select value={form.country} onChange={(event) => updateField('country', event.target.value)}>
              {studyAbroadCountryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="v2-field">
            <span>院校名称</span>
            <input value={form.schoolName} onChange={(event) => updateField('schoolName', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>项目名称</span>
            <input value={form.programName} onChange={(event) => updateField('programName', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>学位</span>
            <input value={form.degree} onChange={(event) => updateField('degree', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>学科方向</span>
            <select value={form.subjectArea} onChange={(event) => updateField('subjectArea', event.target.value)}>
              {studyAbroadSubjectOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="v2-field">
            <span>QS 排名</span>
            <input value={form.qsRank} onChange={(event) => updateField('qsRank', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>学费范围</span>
            <input value={form.tuitionRange} onChange={(event) => updateField('tuitionRange', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>学制</span>
            <input value={form.durationText} onChange={(event) => updateField('durationText', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>截止说明</span>
            <input value={form.deadlineText} onChange={(event) => updateField('deadlineText', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>申请要求</span>
            <textarea value={form.applicationRequirements} onChange={(event) => updateField('applicationRequirements', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>合作项目</span>
            <select value={form.partnerProgram ? 'yes' : 'no'} onChange={(event) => updateField('partnerProgram', event.target.value === 'yes')}>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </label>
          <div className="v2-inline-actions">
            <button className="v2-primary-link" type="submit">保存院校项目</button>
          </div>
        </form>
      ) : (
        <div className="v2-check-list">
          {mode === 'cases' ? (
            <>
              <div className="v2-check-row"><strong>院校 / 项目</strong><span>{item?.school} / {item?.program}</span></div>
              <div className="v2-check-row"><strong>地区 / 结果</strong><span>{getCountryLabel(item?.country)} / {getAdmissionResultLabel(item?.admissionResult)}</span></div>
              <div className="v2-check-row"><strong>硬背景</strong><span>{item?.studentMajor} / GPA {item?.gpa}{item?.rankPercent ? ` / ${item.rankPercent}` : ''}</span></div>
              <div className="v2-check-row"><strong>语言与标化</strong><span>{item?.languageType} {item?.languageScore}{item?.standardizedScore ? ` / ${item.standardizedScore}` : ''}</span></div>
              <div className="v2-check-row"><strong>软背景</strong><span>{item?.softBackground || '未填写'}</span></div>
              <div className="v2-check-row"><strong>奖学金 / 方式</strong><span>{item?.scholarship || '无'} / {item?.applicationMode || '未填写'}</span></div>
              <div className="v2-check-row"><strong>年份 / 联系方式</strong><span>{item?.applicationYear || '未填写'} / {item?.contact || '未公开'}</span></div>
              <div className="v2-check-row"><strong>总结</strong><span>{item?.summary}</span></div>
              {item?.tags?.length ? <div className="v2-check-row"><strong>标签</strong><span>{item.tags.join('、')}</span></div> : null}
            </>
          ) : (
            <>
              <div className="v2-check-row"><strong>标题</strong><span>{item?.title}</span></div>
              <div className="v2-check-row"><strong>地区 / 主题</strong><span>{getCountryLabel(item?.country)} / {getTopicLabel(item?.topic)}</span></div>
              <div className="v2-check-row"><strong>作者 / 发布时间</strong><span>{item?.authorName || '匿名作者'} / {formatPublishedAt(item?.createdAt)}</span></div>
              <div className="v2-check-row"><strong>摘要</strong><span>{item?.summary}</span></div>
              <div className="v2-check-row"><strong>正文</strong><span>{item?.content}</span></div>
              {item?.tags?.length ? <div className="v2-check-row"><strong>标签</strong><span>{item.tags.join('、')}</span></div> : null}
            </>
          )}
        </div>
      )}
    </StudyAbroadPageModal>
  )
}

function formatPublishedAt(value) {
  if (!value) return '待补充'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
