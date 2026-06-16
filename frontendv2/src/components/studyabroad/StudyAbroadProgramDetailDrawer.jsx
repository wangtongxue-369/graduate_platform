import { getCountryLabel } from '@/lib/studyabroad/studyAbroadLabels.js'
import StudyAbroadPageModal from '@/components/studyabroad/StudyAbroadPageModal.jsx'

export default function StudyAbroadProgramDetailDrawer({ open, row, onClose }) {
  if (!open || !row) return null

  return (
    <StudyAbroadPageModal
      open={open}
      kicker="院校项目详情"
      title={row.schoolName}
      lead={`${row.programName}，${getCountryLabel(row.country)}，${row.degree}。`}
      onClose={onClose}
      className="v2-studyabroad-detail-drawer"
      testId="studyabroad-program-detail-drawer"
    >
      <div className="v2-check-list">
        <div className="v2-check-row"><strong>项目</strong><span>{row.programName}</span></div>
        <div className="v2-check-row"><strong>地区</strong><span>{getCountryLabel(row.country)}</span></div>
        <div className="v2-check-row"><strong>学位 / 学制</strong><span>{row.degree} / {row.durationText}</span></div>
        <div className="v2-check-row"><strong>学费</strong><span>{row.tuitionRange}</span></div>
        <div className="v2-check-row"><strong>截止说明</strong><span>{row.deadlineText}</span></div>
        <div className="v2-check-row"><strong>申请要求</strong><span>{row.applicationRequirements}</span></div>
        <div className="v2-check-row"><strong>签证政策</strong><span>{row.visaPolicy}</span></div>
        <div className="v2-check-row"><strong>就业政策</strong><span>{row.employmentPolicy}</span></div>
        <div className="v2-check-row"><strong>风险摘要</strong><span>{row.riskSummary}</span></div>
      </div>
    </StudyAbroadPageModal>
  )
}
