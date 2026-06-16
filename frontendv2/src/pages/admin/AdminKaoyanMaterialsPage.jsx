import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminMaterialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'

const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'all', label: '全部' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已拒绝' },
]

function statusLabel(status) {
  return {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }[status] || status || '未知状态'
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminKaoyanMaterialsPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({ pending: 0, all: 0, APPROVED: 0, REJECTED: 0 })
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [actingId, setActingId] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadMaterials() {
      setLoading(true)
      try {
        const currentData = await (activeTab === 'pending'
          ? adminMaterialApi.pending({ page, size: pageSize }, token)
          : activeTab === 'all'
            ? adminMaterialApi.listPage({ page, size: pageSize }, token)
            : adminMaterialApi.listPage({ status: activeTab, page, size: pageSize }, token))
        if (!active) return
        setRows(currentData?.content || [])
        setTotalElements(Number(currentData?.totalElements || 0))
        setTotalPages(Math.max(1, Number(currentData?.totalPages || 1)))
        setCounts((current) => ({
          ...current,
          [activeTab]: Number(currentData?.totalElements || 0),
        }))
        setNotice('资料审核队列已同步。')
      } catch (error) {
        if (!active) return
        setRows([])
        setTotalElements(0)
        setTotalPages(1)
        setNotice(error.message || '资料审核队列加载失败。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMaterials()
    return () => {
      active = false
    }
  }, [activeTab, page, pageSize, refreshKey, token])

  async function handleReview(id, status) {
    setActingId(String(id))
    try {
      await adminMaterialApi.review(id, status, token)
      setNotice(status === 'APPROVED' ? '资料已通过审核。' : '资料已标记为拒绝。')
      const nextPage = page > 0 && rows.length === 1 ? page - 1 : page
      setPage(nextPage)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setNotice(error.message || '资料审核操作失败。')
    } finally {
      setActingId('')
    }
  }

  async function handleDelete(id) {
    setActingId(String(id))
    try {
      await adminMaterialApi.delete(id, token)
      setNotice('资料已删除。')
      const nextPage = page > 0 && rows.length === 1 ? page - 1 : page
      setPage(nextPage)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setNotice(error.message || '资料删除失败。')
    } finally {
      setActingId('')
    }
  }

  function switchTab(nextTab) {
    setActiveTab(nextTab)
    setPage(0)
  }

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="资料审核"
        pathItems={[
          { label: '管理员主站', to: '/admin' },
          { label: '考研治理', to: '/admin/kaoyan' },
          { label: '资料审核' },
        ]}
        title="资料审核"
        lead="审得细，才走得远。"
        actions={<Link className="v2-secondary-link" to="/admin/kaoyan">返回考研治理总览</Link>}
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-summary-strip" aria-label="资料审核概览">
        {tabs.map((item) => (
          <article className="v2-summary-card" key={item.key}>
            <span>{item.label}</span>
            <strong>{counts[item.key] || 0}</strong>
            <p>快速确认当前审核队列的积压规模。</p>
          </article>
        ))}
      </section>

      <section className="v2-side-card">
        <div className="v2-segment-group" role="group" aria-label="资料审核状态">
          {tabs.map((item) => (
            <button
              className={`v2-segment-button ${activeTab === item.key ? 'is-active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => switchTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? <div className="v2-status-note">正在同步资料审核队列…</div> : null}

      <section className="v2-side-card" aria-label="资料审核列表">
        <div className="v2-side-card__head">
          <div>
            <p className="v2-kicker">审核列表</p>
            <h3>{tabs.find((item) => item.key === activeTab)?.label || '资料审核'}</h3>
          </div>
          <span className="v2-plan-status-pill">{`共 ${totalElements} 条`}</span>
        </div>

        <div className="v2-ledger-card">
          {rows.map((item) => (
            <article className="v2-ledger-row v2-ledger-row--admin-material" key={item.id}>
              <div className="v2-ledger-row__main">
                <strong>{item.title}</strong>
                <p>{item.school || '院校待补充'} / {item.major || '专业待补充'}</p>
                <div className="v2-tag-row">
                  <span>{statusLabel(item.status)}</span>
                  <span>{item.subject || '科目待补充'}</span>
                  <span>{item.materialType || '类型待补充'}</span>
                  <span>{`上传者 ${item.uploaderId || '未知'}`}</span>
                </div>
                <p>{item.description || '暂无资料说明。'}</p>
                {item.attachments?.length ? (
                  <div className="v2-tag-row">
                    {item.attachments.map((attachment) => (
                      <span key={attachment.id}>{`${attachment.originalName} (${formatFileSize(attachment.fileSize)})`}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="v2-ledger-row__meta">
                <span>{`附件 ${item.attachments?.length || 0}`}</span>
                <span>{`浏览 ${item.viewCount || 0}`}</span>
                <span>{`下载 ${item.downloadCount || 0}`}</span>
              </div>
              <div className="v2-ledger-row__actions">
                {item.status === 'PENDING' ? (
                  <>
                    <button
                      className="v2-segment-button is-active"
                      disabled={actingId === String(item.id)}
                      type="button"
                      onClick={() => handleReview(item.id, 'APPROVED')}
                    >
                      通过
                    </button>
                    <button
                      className="v2-segment-button"
                      disabled={actingId === String(item.id)}
                      type="button"
                      onClick={() => handleReview(item.id, 'REJECTED')}
                    >
                      拒绝
                    </button>
                  </>
                ) : null}
                <button
                  className="v2-segment-button"
                  disabled={actingId === String(item.id)}
                  type="button"
                  onClick={() => handleDelete(item.id)}
                >
                  删除资料
                </button>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-empty-card">
              <p>当前状态下没有资料记录。</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="v2-pagination-row" aria-label="资料审核分页">
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
