import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import JobSummaryStrip from '@/components/job/JobSummaryStrip.jsx'
import JobWorkspaceEntryCard from '@/components/job/JobWorkspaceEntryCard.jsx'
import {
  buildApplicationGroups,
  normalizeApplications,
  normalizeFairPage,
  normalizeNotifications,
  normalizeRecommendations,
  normalizeResume,
} from '@/lib/job/employmentNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  firstNonEmpty,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

function createOverviewFallback() {
  return {
    cards: [
      { label: '简历完成度', value: '待完善简历定位' },
      { label: '待跟进行动数', value: '0' },
      { label: '最近节点', value: '暂无节点' },
      { label: '未读提醒', value: '0' },
    ],
    notifications: { items: [], unreadCount: 0 },
    resume: normalizeResume({}),
    recommendations: [],
    applications: [],
    fairs: [],
  }
}

export default function JobStationOverviewPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [summary, setSummary] = useState(createOverviewFallback())
  const [notice, setNotice] = useState(previewDataNotice('就业总览'))

  useEffect(() => {
    let active = true

    async function load() {
      if (!canUseRemote) {
        setSummary(createOverviewFallback())
        setNotice(previewDataNotice('就业总览'))
        return
      }

      try {
        const [resumeData, recommendationData, applicationData, fairData, notificationData] = await withRequestTimeout(
          Promise.all([
            employmentApi.resume(token),
            employmentApi.recommendations({}, token),
            employmentApi.applications(token),
            employmentApi.fairs({ page: 1, size: 4 }),
            employmentApi.notifications(token).catch(() => ({ items: [], unreadCount: 0 })),
          ]),
          8000,
          '就业总览数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const resume = normalizeResume(resumeData)
        const recommendations = normalizeRecommendations(recommendationData)
        const applications = normalizeApplications(applicationData)
        const fairs = normalizeFairPage(fairData).items
        const notifications = normalizeNotifications(notificationData)
        const applicationGroups = buildApplicationGroups(applications)
        const nextActionCount = applications.filter((item) => item.nextStepAt).length
        const latestNode = firstNonEmpty(
          applicationGroups.find((group) => group.items.length)?.items[0]?.jobTitle,
          fairs[0]?.title,
          '暂无节点',
        )

        setSummary({
          cards: [
            { label: '简历完成度', value: resume.targetRole ? '已建立求职画像' : '待完善简历定位' },
            { label: '待跟进行动数', value: String(nextActionCount) },
            { label: '最近节点', value: latestNode },
            { label: '未读提醒', value: String(notifications.unreadCount) },
          ],
          notifications,
          resume,
          recommendations: recommendations.slice(0, 2),
          applications: applications.slice(0, 2),
          fairs: fairs.slice(0, 2),
        })
        setNotice(remoteDataNotice('就业总览'))
      } catch (error) {
        if (!active) return
        setSummary(createOverviewFallback())
        setNotice(fallbackDataNotice('就业总览', error))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="就业主站"
          title="先看推进总览，再进入简历、推荐、投递和招聘会工作区。"
          lead="主区展示当前求职节奏，右栏只保留提醒和行动建议。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <JobSummaryStrip items={summary.cards} />

        <section className="v2-card-grid v2-card-grid--dense" aria-label="就业工作区入口">
          <JobWorkspaceEntryCard
            kicker="简历中心"
            title="先确认求职定位和附件状态"
            description="在线简历、附件简历和导出动作都从这里进入。"
            to="/station/job/resume"
            rows={[
              { label: '目标岗位', value: summary.resume.targetRole || '待补充' },
              { label: '附件状态', value: summary.resume.resumeFile.hasFile ? summary.resume.resumeFile.fileName : '当前没有附件简历' },
            ]}
          />
          <JobWorkspaceEntryCard
            kicker="岗位推荐"
            title="先读匹配理由，再决定是否继续投递"
            description="把高频筛选留在右栏，主区专注看推荐结果。"
            to="/station/job/recommendations"
            rows={summary.recommendations.map((item) => ({
              label: `${item.companyName} / ${item.title}`,
              value: firstNonEmpty(item.matchReasons[0], `${item.matchScore} 分匹配`, '等待补充匹配理由'),
            }))}
          />
          <JobWorkspaceEntryCard
            kicker="投递跟踪"
            title="把每条投递挂在清楚的推进线上"
            description="进入状态看板后再处理面试、结果和后续动作。"
            to="/station/job/applications"
            rows={summary.applications.map((item) => ({
              label: `${item.companyName} / ${item.jobTitle}`,
              value: item.status,
            }))}
          />
          <JobWorkspaceEntryCard
            kicker="招聘会目录"
            title="先筛会场，再看报名与到场安排"
            description="浏览筛选和提醒偏好分离，避免把右栏变成长表单。"
            to="/station/job/fairs"
            rows={summary.fairs.map((item) => ({
              label: item.title,
              value: `${item.city} / ${item.industry}`,
            }))}
          />
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">今日推进建议</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>先补齐简历目标</strong>
              <span>{summary.resume.targetRole ? '已建立求职画像，可继续投递。' : '先去简历中心确认目标岗位、城市和行业。'}</span>
            </div>
            <div className="v2-check-row">
              <strong>跟进当前节点</strong>
              <span>{summary.applications[0]?.jobTitle || '当前还没有需要跟进的投递节点。'}</span>
            </div>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">最近提醒</p>
          <div className="v2-check-list">
            {summary.notifications.items.slice(0, 4).map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.title || '就业提醒'}</strong>
                <span>{item.content || '请前往对应工作区处理。'}</span>
                <span>{item.readFlag ? '已读' : '未读'}</span>
              </div>
            ))}
            {!summary.notifications.items.length ? <p>当前没有就业提醒。</p> : null}
          </div>
        </section>
      </aside>
    </>
  )
}
