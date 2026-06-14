import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { materialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createKaoyanMaterialPreviewRows,
  normalizeMaterialRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function KaoyanMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    keyword: '',
    subject: '',
    year: '',
    materialType: '',
  })
  const [rows, setRows] = useState(createKaoyanMaterialPreviewRows())
  const [notice, setNotice] = useState(previewDataNotice('资料中枢'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        setRows(createKaoyanMaterialPreviewRows())
        setNotice(previewDataNotice('资料中枢'))
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          materialApi.listPage({
            keyword: filters.keyword.trim(),
            subject: filters.subject.trim(),
            year: filters.year.trim(),
            materialType: filters.materialType.trim(),
            page: 0,
            size: 12,
          }),
          8000,
          '资料中枢读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeMaterialRows(data))
        setNotice(remoteDataNotice('资料中枢'))
      } catch (error) {
        if (!active) return
        setRows(createKaoyanMaterialPreviewRows())
        setNotice(fallbackDataNotice('资料中枢', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.keyword, filters.materialType, filters.subject, filters.year])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="资料中枢"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '资料中枢' },
          ]}
          title="公开资料、上传入口和我的审核状态拆成不同深层页面。"
          lead="主区只保留公开资料结果，动作通过深层路由承接。"
          actions={(
            <>
              <Link className="v2-secondary-link" to="/station/kaoyan/materials/upload">上传资料</Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/materials/mine">我的资料</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="资料中枢摘要">
          <article className="v2-summary-card">
            <span>公开资料</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下可浏览的资料条目。</p>
          </article>
          <article className="v2-summary-card">
            <span>下载动机</span>
            <strong>{rows[0]?.subject || '待补充'}</strong>
            <p>先按科目和用途筛，再决定进入详情页下载。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前筛选</span>
            <strong>{filters.year || '全部年份'}</strong>
            <p>{filters.subject || '全部科目'} / {filters.materialType || '全部类型'}</p>
          </article>
        </section>

        {loading ? <div className="v2-status-note">正在刷新资料列表…</div> : null}

        <section className="v2-card-grid" aria-label="资料卡片列表">
          {rows.map((item) => (
            <Link className="v2-module-card" key={item.id} to={`/station/kaoyan/materials/${item.id}`}>
              <strong>{item.title}</strong>
              <p>{item.school} / {item.major}</p>
              <p>{item.subject} / {item.materialType} / {item.year}</p>
              <p>{item.description}</p>
              <div className="v2-tag-row">
                <span>{item.status}</span>
                <span>附件 {item.attachments.length}</span>
                <span>浏览 {item.viewCount}</span>
                <span>下载 {item.downloadCount}</span>
              </div>
            </Link>
          ))}
          {!rows.length ? <article className="v2-module-card"><p>当前筛选条件下没有资料条目。</p></article> : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>科目</span>
              <input
                type="text"
                value={filters.subject}
                onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <input
                type="text"
                value={filters.year}
                onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>资料类型</span>
              <input
                type="text"
                value={filters.materialType}
                onChange={(event) => setFilters((current) => ({ ...current, materialType: event.target.value }))}
              />
            </label>
          </form>
        </section>
      </aside>
    </>
  )
}

