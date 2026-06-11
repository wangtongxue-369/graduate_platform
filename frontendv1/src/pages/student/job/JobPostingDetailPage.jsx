import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import { findPreviewJobById } from '@/lib/employmentPreview.js'

function trackingUrl(job) {
  const params = new URLSearchParams()
  params.set('jobPostingId', job.id)
  params.set('companyName', job.companyName || '')
  params.set('jobTitle', job.title || job.jobTitle || '')
  return `/job/applications?${params.toString()}`
}

export default function JobPostingDetailPage() {
  const { id } = useParams()
  const { token, isAuthed, loading: authLoading } = useAuth()
  const isPreviewMode = Boolean(isAuthed && token === 'dev-token')
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(async () => {
      if (cancelled) return

      setLoading(true)
      setError('')

      if (isPreviewMode) {
        const previewJob = findPreviewJobById(id)
        if (!cancelled) {
          setJob(previewJob)
          setLoading(false)
          if (!previewJob) setError('当前预览集中没有这条岗位。')
        }
        return
      }

      try {
        const data = await employmentApi.postingDetail(id)
        if (!cancelled) setJob(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [id, isPreviewMode])

  if (!authLoading && !isAuthed) return <Navigate replace to="/login" />

  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '就业站', to: '/station/job' }, { label: '岗位筛选台', to: '/job/recommend' }, { label: '岗位详情' }]} hint="确认岗位要求后，再决定加入投递跟踪还是打开站外链接。" />
      <header className="v1-task-head">
        <p className="v1-eyebrow">job / posting detail</p>
        <h1>{job?.title || job?.jobTitle || '岗位详情'}</h1>
        <p>这里只做两件事：加入投递跟踪，或打开外部申请链接。</p>
      </header>
      <div className="v1-callout">提示：平台内不会自动投递；打开申请链接会跳转站外。</div>
      {isPreviewMode ? (
        <PreviewBanner>当前为开发预览：岗位详情基于后端返回字段生成演示内容，正式申请链接与实时状态需连接后端。</PreviewBanner>
      ) : null}

      {loading ? (
        <div className="v1-list-card">正在加载岗位详情...</div>
      ) : job ? (
        <article className="v1-list-card v1-list-card--detail">
          <strong>{job.companyName}</strong>
          <span>{job.city || '城市待定'} · {job.industry || '行业待定'} · {job.salaryRange || '薪资面议'}</span>
          <span>学历要求：{job.educationRequirement || '未设置'}</span>
          <span>技能标签：{job.skillTags || '未设置'}</span>
          <p>{job.description || '暂无岗位描述。'}</p>
          <div className="v1-action-row">
            <Link className="v1-btn v1-btn--primary" to={trackingUrl(job)}>加入投递跟踪</Link>
            {job.applyUrl ? <a className="v1-btn" href={job.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a> : null}
            <Link className="v1-btn" to="/job/recommend">返回岗位推荐</Link>
          </div>
        </article>
      ) : (
        <div className="v1-list-card">未找到岗位。</div>
      )}

      {error ? <div className="v1-error">{error}</div> : null}
    </section>
  )
}
