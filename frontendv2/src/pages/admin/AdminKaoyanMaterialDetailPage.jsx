import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminMaterialApi, materialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { normalizeMaterialDetail } from '@/pages/student/kaoyan/kaoyanPageData.js'
import { formatBytes } from '@/lib/stationData.js'

function statusLabel(status) {
  return {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }[status] || status || '未知状态'
}

export default function AdminKaoyanMaterialDetailPage() {
  const { materialId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState('')
  const [downloadingId, setDownloadingId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadDetail() {
    setLoading(true)
    setError('')
    try {
      const data = await materialApi.detail(materialId, token)
      setDetail(normalizeMaterialDetail(data))
    } catch (err) {
      setDetail(null)
      setError(err.message || '资料详情加载失败。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId, token])

  async function handleReview(nextStatus) {
    if (!detail) return
    setActing(nextStatus)
    try {
      await adminMaterialApi.review(detail.id, nextStatus, token)
      setNotice(nextStatus === 'APPROVED' ? '资料已通过审核。' : '资料已标记为拒绝。')
      await loadDetail()
    } catch (err) {
      setError(err.message || '资料审核操作失败。')
    } finally {
      setActing('')
    }
  }

  async function handleDelete() {
    if (!detail) return
    setActing('DELETE')
    try {
      await adminMaterialApi.delete(detail.id, token)
      setNotice('资料已删除，返回审核列表。')
      navigate('/admin/kaoyan/materials')
    } catch (err) {
      setError(err.message || '资料删除失败。')
    } finally {
      setActing('')
    }
  }

  async function handleDownload(event, attachment) {
    if (!detail || !token) return
    event.preventDefault()
    setDownloadingId(String(attachment.id))
    try {
      const response = await fetch(materialApi.downloadUrl(detail.id, attachment.id), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('附件下载失败')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = attachment.originalName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      setDetail((current) => current ? ({
        ...current,
        downloadCount: Number(current.downloadCount || 0) + 1,
        attachments: (current.attachments || []).map((item) => (
          String(item.id) === String(attachment.id)
            ? { ...item, downloadCount: Number(item.downloadCount || 0) + 1 }
            : item
        )),
      }) : current)
    } catch (err) {
      setError(err.message || '附件下载失败')
    } finally {
      setDownloadingId('')
    }
  }

  const attachments = Array.isArray(detail?.attachments) ? detail.attachments : []

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="资料审核"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考研治理', to: '/admin/kaoyan' },
            { label: '资料审核', to: '/admin/kaoyan/materials' },
            { label: detail?.title || '资料详情' },
          ]}
          title={detail?.title || '资料详情'}
          lead={detail?.description || '管理员视角下预览这份资料，确认内容后再决定通过、拒绝或删除。'}
          actions={
            <Link className="v2-secondary-link" to="/admin/kaoyan/materials">返回审核列表</Link>
          }
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {error ? <div className="v2-status-note">{error}</div> : null}
        {loading ? <div className="v2-status-note">正在加载资料详情…</div> : null}

        {detail ? (
          <>
            <section className="v2-article-card" aria-label="资料附件">
              <div className="v2-side-card__head">
                <h3 className="v2-card-title">附件下载</h3>
                <span className="v2-plan-status-pill">{`共 ${attachments.length} 个`}</span>
              </div>
              {attachments.length ? (
                <div className="v2-attachment-list">
                  {attachments.map((item) => (
                    <div className="v2-attachment-row" key={item.id}>
                      <div className="v2-attachment-row__meta">
                        <strong>{item.originalName}</strong>
                        <span>{formatBytes(item.fileSize)}</span>
                        {Number(item.downloadCount || 0) > 0 ? (
                          <span className="v2-attachment-row__count">
                            {`已下载 ${item.downloadCount}`}
                          </span>
                        ) : null}
                      </div>
                      <button
                        className="v2-segment-button is-active"
                        type="button"
                        disabled={downloadingId === String(item.id)}
                        onClick={(event) => handleDownload(event, item)}
                      >
                        {downloadingId === String(item.id) ? '下载中…' : '下载附件'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>当前资料没有可下载附件。</p>
              )}
              <p
                className="muted"
                style={{ fontSize: 12, marginTop: 12, textAlign: 'right' }}
              >
                {`浏览 ${detail.viewCount || 0} · 下载 ${detail.downloadCount || 0}`}
              </p>
            </section>

            <section className="v2-article-card">
              <h3 className="v2-card-title">资料信息</h3>
              <div className="v2-check-list">
                <div className="v2-check-row">
                  <strong>审核状态</strong>
                  <span>{statusLabel(detail.status)}</span>
                </div>
                <div className="v2-check-row">
                  <strong>适用院校 / 专业</strong>
                  <span>{detail.school} / {detail.major}</span>
                </div>
                <div className="v2-check-row">
                  <strong>资料分类</strong>
                  <span>{detail.subject} / {detail.materialType} / {detail.year}</span>
                </div>
                <div className="v2-check-row">
                  <strong>上传者</strong>
                  <span>{detail.uploaderName || '匿名上传者'}</span>
                </div>
                <div className="v2-check-row">
                  <strong>资料介绍</strong>
                  <span>{detail.description || '暂无资料说明。'}</span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">审核操作</p>
          {detail ? (
            <div className="v2-side-action-stack">
              {detail.status === 'PENDING' ? (
                <>
                  <button
                    className="v2-segment-button is-active"
                    type="button"
                    disabled={Boolean(acting)}
                    onClick={() => handleReview('APPROVED')}
                  >
                    {acting === 'APPROVED' ? '处理中…' : '通过审核'}
                  </button>
                  <button
                    className="v2-segment-button"
                    type="button"
                    disabled={Boolean(acting)}
                    onClick={() => handleReview('REJECTED')}
                  >
                    {acting === 'REJECTED' ? '处理中…' : '拒绝资料'}
                  </button>
                </>
              ) : (
                <p>{`当前状态：${statusLabel(detail.status)}`}</p>
              )}
              <button
                className="v2-segment-button"
                type="button"
                disabled={Boolean(acting)}
                onClick={handleDelete}
              >
                {acting === 'DELETE' ? '删除中…' : '删除资料'}
              </button>
            </div>
          ) : (
            <p>资料未加载时无法操作。</p>
          )}
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">返回入口</p>
          <div className="v2-side-action-stack">
            <Link className="v2-secondary-link" to="/admin/kaoyan/materials">资料审核列表</Link>
            <Link className="v2-secondary-link" to="/admin/kaoyan">考研治理总览</Link>
          </div>
        </section>
      </aside>
    </>
  )
}
