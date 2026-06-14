import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaoyanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  buildSchoolRows,
  createKaoyanSchoolPreviewRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatRatioText,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function KaoyanSchoolsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    region: '',
    majorCategory: '',
    year: '',
    is985: '',
    keyword: '',
  })
  const [rows, setRows] = useState(createKaoyanSchoolPreviewRows())
  const [meta, setMeta] = useState({ schoolCount: rows.length, scoreCount: rows.length })
  const [notice, setNotice] = useState(previewDataNotice('择校账本'))
  const [loading, setLoading] = useState(false)
  const [pendingFavoriteId, setPendingFavoriteId] = useState('')

  async function loadRows() {
    if (!canUseRemote) {
      const previewRows = createKaoyanSchoolPreviewRows()
      setRows(previewRows)
      setMeta({ schoolCount: previewRows.length, scoreCount: previewRows.length })
      setNotice(previewDataNotice('择校账本'))
      return
    }

    setLoading(true)
    try {
      const [schoolsData, scoreLinesData] = await withRequestTimeout(
        Promise.all([
          kaoyanApi.schoolsPage({
            schoolName: filters.keyword.trim(),
            region: filters.region.trim(),
            is985: filters.is985,
            size: 24,
          }),
          kaoyanApi.scoreLinesPage({
            schoolName: filters.keyword.trim(),
            region: filters.region.trim(),
            majorCategory: filters.majorCategory.trim(),
            year: filters.year.trim(),
            size: 24,
          }),
        ]),
        8000,
        '择校账本数据读取超时，请检查后端服务。',
      )
      const next = buildSchoolRows(schoolsData, scoreLinesData)
      setRows(next.rows)
      setMeta({ schoolCount: next.schoolCount, scoreCount: next.scoreCount })
      setNotice(remoteDataNotice('择校账本'))
    } catch (error) {
      const previewRows = createKaoyanSchoolPreviewRows()
      setRows(previewRows)
      setMeta({ schoolCount: previewRows.length, scoreCount: previewRows.length })
      setNotice(fallbackDataNotice('择校账本', error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [canUseRemote, filters.is985, filters.keyword, filters.majorCategory, filters.region, filters.year])

  async function handleFavoriteToggle(row) {
    if (!canUseRemote || !token) return
    setPendingFavoriteId(String(row.id))
    try {
      if (row.favorite) {
        await kaoyanApi.unfavoriteScoreLine(row.id, token)
      } else {
        await kaoyanApi.favoriteScoreLine(row.id, token)
      }
      await loadRows()
    } catch (error) {
      setNotice(error.message || '收藏状态更新失败')
    } finally {
      setPendingFavoriteId('')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="择校账本"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '择校账本' },
          ]}
          title="把院校档案、分数线和收藏动作叠在同一张比较账本里。"
          lead="主区只显示比较结果，筛选收进右栏，收藏单独回看。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/schools/favorites">查看收藏账本</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="择校账本摘要">
          <article className="v2-summary-card">
            <span>院校档案</span>
            <strong>{meta.schoolCount}</strong>
            <p>当前命中的基础院校档案数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>分数线记录</span>
            <strong>{meta.scoreCount}</strong>
            <p>当前可直接比较的分数线条目数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前筛选</span>
            <strong>{filters.year || '全部年份'}</strong>
            <p>{filters.majorCategory || '全部门类'} / {filters.region || '全部地区'}</p>
          </article>
        </section>

        {loading ? <div className="v2-status-note">正在刷新择校账本…</div> : null}

        <section className="v2-ledger-card" aria-label="择校账本列表">
          {rows.map((item) => (
            <div className="v2-ledger-row" key={item.id}>
              <div>
                <strong>{item.schoolName}</strong>
                <p>{item.majorName}</p>
                <p>{item.region} / {item.schoolType}</p>
              </div>
              <div>
                <strong>{item.totalScoreLine ? `总分线 ${item.totalScoreLine}` : '总分线待补充'}</strong>
                <p>{item.year ? `${item.year} 年` : '年份待补充'}</p>
                <p>{item.majorCategory}</p>
              </div>
              <div>
                <p>{item.note}</p>
                <div className="v2-tag-row">
                  {item.is985 ? <span>985</span> : null}
                  {item.is211 ? <span>211</span> : null}
                  {item.admissionRatio ? <span>报录比 {formatRatioText(item.admissionRatio)}</span> : null}
                  {item.plannedEnrollment ? <span>计划 {item.plannedEnrollment}</span> : null}
                </div>
                <div className="v2-inline-actions">
                  <button
                    className={`v2-segment-button ${item.favorite ? 'is-active' : ''}`}
                    disabled={pendingFavoriteId === String(item.id)}
                    type="button"
                    onClick={() => handleFavoriteToggle(item)}
                  >
                    {item.favorite ? '取消收藏' : '收藏分数线'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!rows.length ? <div className="v2-status-note">当前筛选下没有可比较的院校记录。</div> : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>院校地区</span>
              <input
                placeholder="如：华东 / 浙江"
                type="text"
                value={filters.region}
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业门类</span>
              <input
                placeholder="如：工学 / 教育学"
                type="text"
                value={filters.majorCategory}
                onChange={(event) => setFilters((current) => ({ ...current, majorCategory: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>分数线年份</span>
              <input
                placeholder="如：2025"
                type="text"
                value={filters.year}
                onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>985 院校</span>
              <div className="v2-segment-group">
                {[
                  { value: '', label: '全部' },
                  { value: 'true', label: '只看 985' },
                  { value: 'false', label: '排除 985' },
                ].map((item) => (
                  <button
                    className={`v2-segment-button ${filters.is985 === item.value ? 'is-active' : ''}`}
                    key={item.label}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, is985: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                placeholder="院校名或专业名"
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>
      </aside>
    </>
  )
}

