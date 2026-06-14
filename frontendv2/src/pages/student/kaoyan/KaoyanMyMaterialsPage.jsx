import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { materialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  countMaterialsByStatus,
  createKaoyanMaterialPreviewRows,
  materialStatusOptions,
  normalizeMaterialRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'

export default function KaoyanMyMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [activeStatus, setActiveStatus] = useState('PENDING')
  const [rows, setRows] = useState(createKaoyanMaterialPreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('我的资料'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        setRows(createKaoyanMaterialPreviewRows())
        setNotice(previewDataNotice('我的资料'))
        return
      }

      setLoading(true)
      try {
        const data = await materialApi.myMaterials({ status: activeStatus, page: 0, size: 12 }, token)
        if (!active) return
        setRows(normalizeMaterialRows(data))
        setNotice(remoteDataNotice('我的资料'))
      } catch (error) {
        if (!active) return
        setRows(createKaoyanMaterialPreviewRows().filter((item) => item.status === activeStatus))
        setNotice(fallbackDataNotice('我的资料', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [activeStatus, canUseRemote, token])

  const counts = countMaterialsByStatus(createKaoyanMaterialPreviewRows())

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="我的资料"
        pathItems={[
          { label: '考研主站', to: '/station/kaoyan' },
          { label: '资料中枢', to: '/station/kaoyan/materials' },
          { label: '我的资料' },
        ]}
        title="我的资料状态只围绕审核进度查看，不混入公开资料浏览。"
        lead="用分段按钮切换状态，把自己提交的资料按审核结果拆开。"
        actions={<Link className="v2-secondary-link" to="/station/kaoyan/materials/upload">继续上传</Link>}
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-summary-strip" aria-label="我的资料摘要">
        {materialStatusOptions.map((status) => (
          <article className="v2-summary-card" key={status}>
            <span>{status}</span>
            <strong>{counts[status] || 0}</strong>
            <p>按审核状态分组回看资料。</p>
          </article>
        ))}
      </section>

      <section className="v2-side-card">
        <div className="v2-segment-group" role="group" aria-label="资料状态">
          {materialStatusOptions.map((status) => (
            <button
              className={`v2-segment-button ${activeStatus === status ? 'is-active' : ''}`}
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {loading ? <div className="v2-status-note">正在同步我的资料…</div> : null}

      <section className="v2-card-grid" aria-label="我的资料列表">
        {rows.map((item) => (
          <Link className="v2-module-card" key={item.id} to={`/station/kaoyan/materials/${item.id}`}>
            <strong>{item.title}</strong>
            <p>{item.school} / {item.major}</p>
            <p>{item.description}</p>
            <div className="v2-tag-row">
              <span>{item.status}</span>
              <span>附件 {item.attachments.length}</span>
            </div>
          </Link>
        ))}
        {!rows.length ? <article className="v2-module-card"><p>当前状态下没有资料条目。</p></article> : null}
      </section>
    </div>
  )
}

