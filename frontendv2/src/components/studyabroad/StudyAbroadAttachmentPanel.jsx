import { formatBytes } from '@/lib/stationData.js'

export default function StudyAbroadAttachmentPanel({
  materialId,
  attachments = [],
  canUpload = false,
  uploadProgress = 0,
  onUpload,
  onDownload,
  onDelete,
}) {
  return (
    <div className="v2-studyabroad-attachment-panel">
      <div className="v2-inline-actions">
        <label className="v2-secondary-link" htmlFor={`material-upload-${materialId}`}>
          上传附件
        </label>
        <input
          id={`material-upload-${materialId}`}
          type="file"
          multiple
          disabled={!canUpload}
          style={{ display: 'none' }}
          onChange={(event) => {
            if (!event.target.files?.length) return
            onUpload(event.target.files)
            event.target.value = ''
          }}
        />
        {canUpload ? <span className="v2-feed-action">上传进度 {uploadProgress}%</span> : null}
      </div>
      <div className="v2-check-list">
        {attachments.length ? attachments.map((attachment) => (
          <div className="v2-check-row" key={attachment.id}>
            <strong>{attachment.originalName || `附件 ${attachment.id}`}</strong>
            <span>{formatBytes(attachment.fileSize)}</span>
            <div className="v2-inline-actions">
              <button className="v2-secondary-link" type="button" onClick={() => onDownload(attachment.id)}>下载</button>
              <button className="v2-secondary-link" type="button" onClick={() => onDelete(attachment.id)}>删除</button>
            </div>
          </div>
        )) : (
          <div className="v2-check-row">
            <strong>当前没有附件</strong>
            <span>可以直接把材料文件挂到当前条目下。</span>
          </div>
        )}
      </div>
    </div>
  )
}
