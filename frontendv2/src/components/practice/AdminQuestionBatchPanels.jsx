import { useState } from 'react'

export default function AdminQuestionBatchPanels({
  selectedIds = [],
  onBatchCreate,
  onFileImport,
  onBatchStatus,
}) {
  const [batchText, setBatchText] = useState('[]')
  const [batchStatus, setBatchStatus] = useState('active')
  const [file, setFile] = useState(null)

  return (
    <>
      <section className="v2-side-card">
        <p className="v2-kicker">批量导入</p>
        <label className="v2-field">
          <span>JSON 数组</span>
          <textarea value={batchText} onChange={(event) => setBatchText(event.target.value)} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="button" onClick={() => onBatchCreate(batchText)}>导入 JSON</button>
        </div>
      </section>

      <section className="v2-side-card">
        <p className="v2-kicker">文件导入</p>
        <label className="v2-field">
          <span>上传题库文件</span>
          <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-secondary-link" type="button" onClick={() => file && onFileImport(file)} disabled={!file}>上传文件</button>
        </div>
      </section>

      <section className="v2-side-card">
        <p className="v2-kicker">批量状态</p>
        <label className="v2-field">
          <span>目标状态</span>
          <select value={batchStatus} onChange={(event) => setBatchStatus(event.target.value)}>
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </label>
        <div className="v2-inline-actions">
          <button className="v2-secondary-link" type="button" disabled={!selectedIds.length} onClick={() => onBatchStatus(batchStatus)}>
            批量更新选中题目
          </button>
        </div>
      </section>
    </>
  )
}
