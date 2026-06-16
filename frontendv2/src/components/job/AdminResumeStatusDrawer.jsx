export default function AdminResumeStatusDrawer({ resume, onClose }) {
  if (!resume) return null

  return (
    <section className="v2-side-card v2-practice-drawer" data-testid="admin-resume-status-drawer">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">简历状态</p>
          <h3>{resume.name}</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
      </div>

      <div className="v2-check-list">
        <article className="v2-check-row"><strong>学号</strong><span>{resume.studentId || '待补充'}</span></article>
        <article className="v2-check-row"><strong>学校 / 专业</strong><span>{[resume.school, resume.major].filter(Boolean).join(' / ') || '待补充'}</span></article>
        <article className="v2-check-row"><strong>目标岗位</strong><span>{resume.targetRole || '待补充'}</span></article>
        <article className="v2-check-row"><strong>附件状态</strong><span>{resume.resumeFile?.hasFile ? resume.resumeFile.fileName : '未上传附件'}</span></article>
      </div>
    </section>
  )
}
