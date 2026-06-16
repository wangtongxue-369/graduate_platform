import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaoyanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import KaoyanSchoolLedgerTable from '@/components/kaoyan/KaoyanSchoolLedgerTable.jsx'
import {
  createKaoyanFavoritePreviewRows,
  normalizeFavoriteRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'

export default function KaoyanSchoolFavoritesPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const previewRows = createKaoyanFavoritePreviewRows()
  const [rows, setRows] = useState(previewRows)
  const [notice, setNotice] = useState(previewDataNotice('收藏账本'))
  const [expandedRowIds, setExpandedRowIds] = useState(new Set())

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        const nextRows = createKaoyanFavoritePreviewRows()
        if (!active) return
        setRows(nextRows)
        setNotice(previewDataNotice('收藏账本'))
        return
      }

      try {
        const data = await kaoyanApi.favoriteScoreLines(token)
        if (!active) return
        setRows(normalizeFavoriteRows(data))
        setNotice(remoteDataNotice('收藏账本'))
      } catch (error) {
        const nextRows = createKaoyanFavoritePreviewRows()
        if (!active) return
        setRows(nextRows)
        setNotice(fallbackDataNotice('收藏账本', error))
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  function handleToggleExpand(rowId) {
    setExpandedRowIds((current) => {
      const next = new Set(current)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="收藏账本"
        pathItems={[
          { label: '考研主站', to: '/station/kaoyan' },
          { label: '择校账本', to: '/station/kaoyan/schools' },
          { label: '收藏账本' },
        ]}
        title="把你已经决定持续跟踪的分数线单独收进回看账本。"
        lead="这里不再混入全量筛选，只看真正留下来的目标记录。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-summary-strip" aria-label="收藏账本摘要">
        <article className="v2-summary-card">
          <span>收藏记录</span>
          <strong>{rows.length}</strong>
          <p>这里只保留你已经决定持续跟踪的目标分数线。</p>
        </article>
        <article className="v2-summary-card">
          <span>信息密度</span>
          <strong>表格视图</strong>
          <p>字段结构和主账本保持一致，方便来回比对。</p>
        </article>
      </section>

      <KaoyanSchoolLedgerTable
        rows={rows}
        compareIds={[]}
        expandedRowIds={expandedRowIds}
        favoriteIds={new Set(rows.map((item) => item.id))}
        page={0}
        totalPages={1}
        totalElements={rows.length}
        compareEnabled={false}
        favoriteActionEnabled={false}
        paginationEnabled={false}
        emptyMessage="你当前还没有收藏任何分数线。"
        onToggleExpand={handleToggleExpand}
      />
    </div>
  )
}
