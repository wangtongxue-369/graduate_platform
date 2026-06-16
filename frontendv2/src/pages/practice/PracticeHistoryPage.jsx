import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeFilterSidebar from '@/components/practice/PracticeFilterSidebar.jsx'
import PracticeHistoryTable from '@/components/practice/PracticeHistoryTable.jsx'
import { normalizePagedResult } from '@/lib/practice/normalizers.js'

const defaultFilters = {
  page: 1,
  size: 20,
  mode: '',
  target: '',
  subject: '',
  dateFrom: '',
  dateTo: '',
}

export default function PracticeHistoryPage() {
  const { token } = useAuth()
  const [filters, setFilters] = useState(defaultFilters)
  const [history, setHistory] = useState({
    items: [],
    total: 0,
    page: 1,
    size: 20,
    totalPages: 0,
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadHistory() {
      try {
        const data = await practiceApi.history(filters, token)
        if (!active) return
        const normalized = normalizePagedResult(data)
        setHistory({
          ...normalized,
          page: normalized.page || 1,
        })
        setMessage('')
      } catch (error) {
        if (!active) return
        setHistory({ items: [], total: 0, page: 1, size: 20, totalPages: 0 })
        setMessage(error.message || '练习历史暂时不可用。')
      }
    }

    loadHistory()
    return () => {
      active = false
    }
  }, [filters, token])

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }))
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="练习历史"
          pathItems={[
            { label: '题库目录', to: '/practice' },
            { label: '练习历史' },
          ]}
          title="练习历史"
          lead="把每次提交拆成独立记录，便于按模式、方向和时间回看训练节奏。"
        />

        {message ? <div className="v2-status-note">{message}</div> : null}

        <PracticeHistoryTable
          history={history}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </div>

      <PracticeFilterSidebar
        title="历史筛选"
        fields={(
          <>
            <label className="v2-field">
              <span>模式</span>
              <select value={filters.mode} onChange={(event) => updateFilter('mode', event.target.value)}>
                <option value="">全部</option>
                <option value="chapter">章节练习</option>
                <option value="random">随机练习</option>
                <option value="mock">模拟练习</option>
                <option value="wrong_retry">错题回练</option>
              </select>
            </label>
            <label className="v2-field">
              <span>方向</span>
              <input value={filters.target} onChange={(event) => updateFilter('target', event.target.value)} placeholder="如：kaoyan" />
            </label>
            <label className="v2-field">
              <span>科目</span>
              <input value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)} placeholder="如：政治" />
            </label>
            <label className="v2-field">
              <span>开始日期</span>
              <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>结束日期</span>
              <input type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} />
            </label>
          </>
        )}
      />
    </>
  )
}
