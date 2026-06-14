import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { materialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  countMaterialsByStatus,
  createKaoyanMaterialPreviewRows,
  filterMaterialRows,
  normalizeMaterialRows,
  paginateRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'

const statusTabs = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已拒绝' },
]
const previewMaterialRows = createKaoyanMaterialPreviewRows()
const previewMaterialCounts = {
  ALL: previewMaterialRows.length,
  ...countMaterialsByStatus(previewMaterialRows),
}

function statusLabel(status) {
  return {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }[status] || status || '未知状态'
}

export default function KaoyanMyMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState(previewMaterialCounts)
  const [totalElements, setTotalElements] = useState(previewMaterialRows.length)
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(previewMaterialRows.length / 10)))
  const [notice, setNotice] = useState(previewDataNotice('我的资料'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        const filtered = activeStatus === 'ALL'
          ? previewMaterialRows
          : filterMaterialRows(previewMaterialRows, { status: activeStatus })
        const paged = paginateRows(filtered, { page, size: pageSize })
        if (!active) return
        setRows(paged.pageRows)
        setTotalElements(paged.totalElements)
        setTotalPages(paged.totalPages)
        setCounts(previewMaterialCounts)
        setNotice(previewDataNotice('我的资料'))
        return
      }

      setLoading(true)
      try {
        const query = activeStatus === 'ALL'
          ? { page, size: pageSize }
          : { status: activeStatus, page, size: pageSize }
        const [listData, allData, pendingData, approvedData, rejectedData] = await Promise.all([
          materialApi.myMaterials(query, token),
          materialApi.myMaterials({ page: 0, size: 1 }, token),
          materialApi.myMaterials({ status: 'PENDING', page: 0, size: 1 }, token),
          materialApi.myMaterials({ status: 'APPROVED', page: 0, size: 1 }, token),
          materialApi.myMaterials({ status: 'REJECTED', page: 0, size: 1 }, token),
        ])
        if (!active) return
        setRows(normalizeMaterialRows(listData))
        setTotalElements(Number(listData?.totalElements || 0))
        setTotalPages(Math.max(1, Number(listData?.totalPages || 1)))
        setCounts({
          ALL: Number(allData?.totalElements || 0),
          PENDING: Number(pendingData?.totalElements || 0),
          APPROVED: Number(approvedData?.totalElements || 0),
          REJECTED: Number(rejectedData?.totalElements || 0),
        })
        setNotice(remoteDataNotice('我的资料'))
      } catch (error) {
        if (!active) return
        const filtered = activeStatus === 'ALL'
          ? previewMaterialRows
          : filterMaterialRows(previewMaterialRows, { status: activeStatus })
        const paged = paginateRows(filtered, { page, size: pageSize })
        setRows(paged.pageRows)
        setTotalElements(paged.totalElements)
        setTotalPages(paged.totalPages)
        setCounts(previewMaterialCounts)
        setNotice(fallbackDataNotice('我的资料', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [activeStatus, canUseRemote, page, pageSize, token])

  function switchStatus(nextStatus) {
    setActiveStatus(nextStatus)
    setPage(0)
  }

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="我的资料"
        pathItems={[
          { label: '考研主站', to: '/station/kaoyan' },
          { label: '资料中枢', to: '/station/kaoyan/materials' },
          { label: '我的资料' },
        ]}
        title="我的资料状态按旧版工作流拆回待审、通过、拒绝与全部视角，方便追踪每份资料的流转。"
        lead="这里不混入公开浏览，只看自己上传过的资料与审核结果，避免和公开资料列表互相打架。"
        actions={(
          <>
            <Link className="v2-secondary-link" to="/station/kaoyan/materials/upload">上传新资料</Link>
            <Link className="v2-secondary-link" to="/station/kaoyan/materials">浏览资料</Link>
          </>
        )}
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-summary-strip" aria-label="我的资料状态摘要">
        {statusTabs.map((item) => (
          <article className="v2-summary-card" key={item.key}>
            <span>{item.label}</span>
            <strong>{counts[item.key] || 0}</strong>
            <p>按当前审核状态查看自己上传过的资料。</p>
          </article>
        ))}
      </section>

      <section className="v2-side-card">
        <div className="v2-segment-group" role="group" aria-label="资料状态">
          {statusTabs.map((item) => (
            <button
              className={`v2-segment-button ${activeStatus === item.key ? 'is-active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => switchStatus(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? <div className="v2-status-note">正在同步我的资料…</div> : null}

      <section className="v2-side-card" aria-label="我的资料列表">
        <div className="v2-side-card__head">
          <div>
            <p className="v2-kicker">状态清单</p>
            <h3>{activeStatus === 'ALL' ? '全部资料' : statusLabel(activeStatus)}</h3>
          </div>
          <span className="v2-plan-status-pill">{`共 ${totalElements} 条`}</span>
        </div>

        <div className="v2-ledger-card">
          {rows.map((item) => (
            <article className="v2-ledger-row v2-ledger-row--material" key={item.id}>
              <div className="v2-ledger-row__main">
                <strong>{item.title}</strong>
                <p>{item.school} / {item.major}</p>
                <div className="v2-tag-row">
                  <span>{statusLabel(item.status)}</span>
                  <span>{item.subject}</span>
                  <span>{item.year}</span>
                  <span>{item.materialType}</span>
                </div>
              </div>
              <div className="v2-ledger-row__meta">
                <span>{`附件 ${item.attachments?.length || 0}`}</span>
                <span>{`浏览 ${item.viewCount || 0}`}</span>
                <span>{`下载 ${item.downloadCount || 0}`}</span>
              </div>
              <div className="v2-ledger-row__actions">
                <Link className="v2-secondary-link" to={`/station/kaoyan/materials/${item.id}`}>
                  查看详情
                </Link>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-empty-card">
              <p>当前状态下还没有资料记录，可以先上传第一份资料。</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="v2-pagination-row" aria-label="我的资料分页">
        <button
          className="v2-secondary-link"
          type="button"
          disabled={loading || page <= 0}
          onClick={() => setPage((current) => current - 1)}
        >
          上一页
        </button>
        <span className="v2-pagination-note">{`第 ${Math.min(page + 1, totalPages)} / ${totalPages} 页`}</span>
        <button
          className="v2-secondary-link"
          type="button"
          disabled={loading || page >= totalPages - 1}
          onClick={() => setPage((current) => current + 1)}
        >
          下一页
        </button>
      </section>
    </div>
  )
}
