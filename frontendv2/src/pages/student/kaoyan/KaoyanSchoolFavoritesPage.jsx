import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaoyanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
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
  const [rows, setRows] = useState(createKaoyanFavoritePreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('收藏账本'))

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        setRows(createKaoyanFavoritePreviewRows())
        setNotice(previewDataNotice('收藏账本'))
        return
      }

      try {
        const data = await kaoyanApi.favoriteScoreLines(token)
        if (!active) return
        setRows(normalizeFavoriteRows(data))
        setNotice(remoteDataNotice('收藏账本'))
      } catch (error) {
        if (!active) return
        setRows(createKaoyanFavoritePreviewRows())
        setNotice(fallbackDataNotice('收藏账本', error))
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

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

      <section className="v2-ledger-card" aria-label="收藏分数线列表">
        {rows.map((item) => (
          <div className="v2-ledger-row" key={item.id}>
            <div>
              <strong>{item.schoolName}</strong>
              <p>{item.majorName}</p>
              <p>{item.majorCategory}</p>
            </div>
            <div>
              <strong>{item.totalScoreLine ? `总分线 ${item.totalScoreLine}` : '总分线待补充'}</strong>
              <p>{item.year ? `${item.year} 年` : '年份待补充'}</p>
            </div>
            <div>
              <p>{item.note}</p>
              <div className="v2-tag-row">
                <span>已收藏</span>
              </div>
            </div>
          </div>
        ))}
        {!rows.length ? <div className="v2-status-note">你当前还没有收藏任何分数线。</div> : null}
      </section>
    </div>
  )
}

