import { formatResumeFileMeta } from '@/lib/job/employmentNormalizers.js'

export default function JobResumeAttachmentCard({
  resumeFile,
  onUploadClick,
  onDownload,
  onDelete,
  onExportWord,
  onExportPdf,
}) {
  return (
    <section className="v2-side-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">附件与导出</p>
          <h3>文件简历状态</h3>
        </div>
      </div>

      <div className="v2-check-list">
        <article className="v2-check-row">
          <strong>附件状态</strong>
          <span>{resumeFile.hasFile ? '已上传' : '未上传'}</span>
        </article>
        <article className="v2-check-row">
          <strong>当前文件</strong>
          <span>{resumeFile.hasFile ? resumeFile.fileName : '当前没有附件简历'}</span>
        </article>
        <article className="v2-check-row">
          <strong>文件信息</strong>
          <span>{formatResumeFileMeta(resumeFile)}</span>
        </article>
      </div>

      <div className="v2-inline-actions">
        <button className="v2-secondary-link" type="button" onClick={onUploadClick}>上传 / 替换附件</button>
        <button className="v2-secondary-link" type="button" onClick={onDownload} disabled={!resumeFile.hasFile}>下载附件</button>
      </div>
      <div className="v2-inline-actions">
        <button className="v2-primary-link" type="button" onClick={onExportWord}>导出 Word</button>
        <button className="v2-secondary-link" type="button" onClick={onExportPdf}>导出 PDF</button>
      </div>
      <div className="v2-inline-actions">
        <button className="v2-ghost-link v2-ghost-link--danger" type="button" onClick={onDelete} disabled={!resumeFile.hasFile}>删除附件</button>
      </div>
    </section>
  )
}
