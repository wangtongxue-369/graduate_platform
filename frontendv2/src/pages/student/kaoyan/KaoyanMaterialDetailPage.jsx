import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { materialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createKaoyanMaterialDetailPreview,
  normalizeMaterialDetail,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatBytes,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'

function statusLabel(status) {
  return {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }[status] || status || '未知状态'
}

export default function KaoyanMaterialDetailPage() {
  const { materialId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [detail, setDetail] = useState(createKaoyanMaterialDetailPreview(materialId))
  const [notice, setNotice] = useState(previewDataNotice('资料详情'))
  const [downloadingId, setDownloadingId] = useState('')

  useEffect(() => {
    let active = true

    async function loadDetail() {
      if (!canUseRemote) {
        setDetail(createKaoyanMaterialDetailPreview(materialId))
        setNotice(previewDataNotice('资料详情'))
        return
      }

      try {
        const data = await materialApi.detail(materialId, token)
        if (!active) return
        setDetail(normalizeMaterialDetail(data))
        setNotice(remoteDataNotice('资料详情'))
      } catch (error) {
        if (!active) return
        setDetail(createKaoyanMaterialDetailPreview(materialId))
        setNotice(fallbackDataNotice('资料详情', error))
      }
    }

    loadDetail()
    return () => {
      active = false
    }
  }, [canUseRemote, materialId, token])

  async function handleDownload(event, attachment) {
    if (!canUseRemote || !token) {
      event.preventDefault()
      setNotice('请先使用真实账号登录后再下载附件。')
      navigate('/login')
      return
    }

    event.preventDefault()
    setDownloadingId(String(attachment.id))
    try {
      const response = await fetch(materialApi.downloadUrl(detail.id, attachment.id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('附件下载失败')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = attachment.originalName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)

      setDetail((current) => ({
        ...current,
        downloadCount: Number(current.downloadCount || 0) + 1,
        attachments: (current.attachments || []).map((item) => (
          String(item.id) === String(attachment.id)
            ? { ...item, downloadCount: Number(item.downloadCount || 0) + 1 }
            : item
        )),
      }))
    } catch (error) {
      setNotice(error.message || '附件下载失败')
    } finally {
      setDownloadingId('')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="资料详情"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '资料中枢', to: '/station/kaoyan/materials' },
            { label: detail.title },
          ]}
          title={detail.title}
          lead={detail.description || '这份资料暂时还没有补充使用说明。'}
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/materials">返回资料列表</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="资料详情摘要">
          <article className="v2-summary-card">
            <span>审核状态</span>
            <strong>{statusLabel(detail.status)}</strong>
            <p>当前资料的审核结果与公开状态。</p>
          </article>
          <article className="v2-summary-card">
            <span>浏览次数</span>
            <strong>{detail.viewCount || 0}</strong>
            <p>公开页浏览量，用来判断资料是否持续被使用。</p>
          </article>
          <article className="v2-summary-card">
            <span>下载次数</span>
            <strong>{detail.downloadCount || 0}</strong>
            <p>附件下载总量，方便判断资料实际价值。</p>
          </article>
        </section>

        <section className="v2-article-card">
          <div className="v2-check-list">
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
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">附件列表</p>
          <div className="v2-check-list">
            {(detail.attachments || []).map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.originalName}</strong>
                <span>{formatBytes(item.fileSize)}</span>
                <span>{`下载 ${item.downloadCount || 0}`}</span>
                <a
                  className="v2-secondary-link"
                  href={materialApi.downloadUrl(detail.id, item.id)}
                  rel="noreferrer"
                  target="_blank"
                  onClick={(event) => handleDownload(event, item)}
                >
                  {downloadingId === String(item.id) ? '下载中…' : '下载附件'}
                </a>
              </div>
            ))}
            {!detail.attachments?.length ? <p>当前资料没有可下载附件。</p> : null}
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">快捷入口</p>
          <div className="v2-side-action-stack">
            <Link className="v2-secondary-link" to="/station/kaoyan/materials/mine">我的资料</Link>
            <Link className="v2-secondary-link" to="/station/kaoyan/materials/upload">继续上传</Link>
          </div>
        </section>
      </aside>
    </>
  )
}
