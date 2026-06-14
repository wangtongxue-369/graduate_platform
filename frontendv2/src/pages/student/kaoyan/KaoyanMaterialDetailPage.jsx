import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

export default function KaoyanMaterialDetailPage() {
  const { materialId } = useParams()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [detail, setDetail] = useState(createKaoyanMaterialDetailPreview(materialId))
  const [notice, setNotice] = useState(previewDataNotice('资料详情'))

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
          lead={detail.description}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-article-card">
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>适用院校 / 专业</strong>
              <span>{detail.school} / {detail.major}</span>
            </div>
            <div className="v2-check-row">
              <strong>资料类型</strong>
              <span>{detail.subject} / {detail.materialType} / {detail.year}</span>
            </div>
            <div className="v2-check-row">
              <strong>使用说明</strong>
              <span>{detail.description}</span>
            </div>
          </div>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">附件列表</p>
          <div className="v2-check-list">
            {detail.attachments.map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.originalName}</strong>
                <span>{formatBytes(item.fileSize)}</span>
                <a
                  className="v2-secondary-link"
                  href={materialApi.downloadUrl(detail.id, item.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  下载附件
                </a>
              </div>
            ))}
            {!detail.attachments.length ? <p>当前资料没有可下载附件。</p> : null}
          </div>
        </section>
      </aside>
    </>
  )
}
