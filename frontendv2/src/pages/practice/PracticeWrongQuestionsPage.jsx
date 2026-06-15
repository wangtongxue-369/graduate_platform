import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeFilterSidebar from '@/components/practice/PracticeFilterSidebar.jsx'
import WrongQuestionWorkbench from '@/components/practice/WrongQuestionWorkbench.jsx'
import { normalizePagedResult } from '@/lib/practice/normalizers.js'

const defaultFilters = {
  page: 0,
  size: 20,
  target: '',
  subject: '',
  chapter: '',
  minWrongCount: '',
}

export default function PracticeWrongQuestionsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [filters, setFilters] = useState(defaultFilters)
  const [wrongs, setWrongs] = useState({
    items: [],
    total: 0,
    page: 0,
    size: 20,
    totalPages: 0,
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadWrongs() {
      try {
        const data = await practiceApi.wrongQuestions(filters, token)
        if (!active) return
        setWrongs(normalizePagedResult(data))
        setMessage('')
      } catch (error) {
        if (!active) return
        setWrongs({ items: [], total: 0, page: 0, size: 20, totalPages: 0 })
        setMessage(error.message || '错题列表暂时不可用。')
      }
    }

    loadWrongs()
    return () => {
      active = false
    }
  }, [filters, token])

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 0 }))
  }

  async function handleRetry(ids) {
    const session = await practiceApi.rebuildWrongSession(ids, token)
    navigate(`/practice/sessions/${session.id}`)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="错题回练"
          pathItems={[
            { label: '题库目录', to: '/practice' },
            { label: '错题回练' },
          ]}
          title="错题回练"
          lead="错题不再塞进目录页，而是在这里集中筛选、批量挑选并重新进入会话。"
        />

        {message ? <div className="v2-status-note">{message}</div> : null}

        <WrongQuestionWorkbench
          wrongs={wrongs}
          onRetry={handleRetry}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </div>

      <PracticeFilterSidebar
        title="错题筛选"
        fields={(
          <>
            <label className="v2-field">
              <span>方向</span>
              <input value={filters.target} onChange={(event) => updateFilter('target', event.target.value)} placeholder="如：kaoyan" />
            </label>
            <label className="v2-field">
              <span>科目</span>
              <input value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)} placeholder="如：政治" />
            </label>
            <label className="v2-field">
              <span>章节</span>
              <input value={filters.chapter} onChange={(event) => updateFilter('chapter', event.target.value)} placeholder="如：马原" />
            </label>
            <label className="v2-field">
              <span>最低错题次数</span>
              <input value={filters.minWrongCount} onChange={(event) => updateFilter('minWrongCount', event.target.value)} placeholder="如：2" />
            </label>
          </>
        )}
      />
    </>
  )
}
