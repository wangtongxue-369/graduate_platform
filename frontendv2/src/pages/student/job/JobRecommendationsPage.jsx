import { useDeferredValue, useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import { useNavigate } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import JobNotificationPanel from '@/components/job/JobNotificationPanel.jsx'
import JobPostingDetailDrawer from '@/components/job/JobPostingDetailDrawer.jsx'
import JobRecommendationFilters from '@/components/job/JobRecommendationFilters.jsx'
import JobSummaryStrip from '@/components/job/JobSummaryStrip.jsx'
import {
  normalizeNotifications,
  normalizePostingDetail,
  normalizeRecommendations,
} from '@/lib/job/employmentNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  firstNonEmpty,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const emptyFilters = {
  keyword: '',
  city: '',
  industry: '',
  roleType: '',
  skills: '',
  onlyApplyable: false,
}

function createFallbackRecommendations() {
  return normalizeRecommendations([
    {
      id: 301,
      title: '平台后端工程师',
      companyName: '云梯教育',
      city: '上海',
      industry: '教育科技',
      companyType: '民企',
      roleType: '后端',
      salaryRange: '16k-22k',
      educationRequirement: '本科',
      skillTags: 'Java, Spring Boot, MySQL',
      matchScore: 88,
      matchReasons: ['后端技能匹配', '教育行业经历相关'],
      description: '适合作为站内预览用的推荐样例。',
    },
  ])
}

function createFallbackNotifications() {
  return normalizeNotifications({
    items: [
      {
        id: 901,
        title: '演示提醒',
        content: '登录真实账号后，这里会同步后端推荐提醒。',
        readFlag: false,
      },
    ],
    unreadCount: 1,
  })
}

function compactFilters(filters) {
  const next = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      if (value) next[key] = value
      return
    }

    if (value) next[key] = value
  })
  return next
}

function createTrackingSearch(posting) {
  const params = new URLSearchParams()
  params.set('jobPostingId', String(posting.id || ''))
  params.set('companyName', posting.companyName || '')
  params.set('jobTitle', posting.title || '')
  params.set('city', posting.city || '')
  params.set('industry', posting.industry || '')
  params.set('companyType', posting.companyType || '')
  params.set('roleType', posting.roleType || '')
  params.set('salaryRange', posting.salaryRange || '')
  params.set('educationRequirement', posting.educationRequirement || '')
  params.set('majorKeywords', posting.majorKeywords || '')
  params.set('skillTags', posting.skillTags || '')
  params.set('applyUrl', posting.applyUrl || '')
  params.set('openDrawer', 'create')
  return params.toString()
}

export default function JobRecommendationsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState(emptyFilters)
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [recommendations, setRecommendations] = useState(createFallbackRecommendations())
  const [notifications, setNotifications] = useState(createFallbackNotifications())
  const [notice, setNotice] = useState(previewDataNotice('岗位推荐'))
  const [detail, setDetail] = useState(null)
  const [pendingTracking, setPendingTracking] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!canUseRemote) {
        setRecommendations(createFallbackRecommendations())
        setNotifications(createFallbackNotifications())
        setNotice(previewDataNotice('岗位推荐'))
        return
      }

      try {
        const requestFilters = compactFilters({
          ...filters,
          keyword: deferredKeyword.trim(),
          city: filters.city.trim(),
          industry: filters.industry.trim(),
          roleType: filters.roleType.trim(),
          skills: filters.skills.trim(),
        })

        const [recommendationData, notificationData] = await withRequestTimeout(
          Promise.all([
            employmentApi.recommendations(requestFilters, token),
            employmentApi.notifications(token).catch(() => ({ items: [], unreadCount: 0 })),
          ]),
          8000,
          '岗位推荐数据读取超时，请检查后端服务。',
        )

        if (!active) return

        setRecommendations(normalizeRecommendations(recommendationData))
        setNotifications(normalizeNotifications(notificationData))
        setNotice(remoteDataNotice('岗位推荐'))
      } catch (error) {
        if (!active) return
        setRecommendations(createFallbackRecommendations())
        setNotifications(createFallbackNotifications())
        setNotice(fallbackDataNotice('岗位推荐', error))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.city, filters.industry, filters.onlyApplyable, filters.roleType, filters.skills, token])

  async function handleOpenDetail(posting) {
    if (!canUseRemote) {
      setDetail(normalizePostingDetail(posting))
      return
    }

    try {
      const data = await employmentApi.postingDetail(posting.id)
      setDetail(normalizePostingDetail(data))
    } catch (error) {
      setDetail(normalizePostingDetail(posting))
      setNotice(fallbackDataNotice('岗位详情', error))
    }
  }

  async function handleMarkRead(notificationId) {
    if (canUseRemote) {
      await employmentApi.markNotificationRead(notificationId, token)
    }

    setNotifications((current) => {
      const items = current.items.map((item) => (
        item.id === notificationId ? { ...item, readFlag: true } : item
      ))

      return {
        items,
        unreadCount: items.filter((item) => !item.readFlag).length,
      }
    })
  }

  async function handleDeleteNotification(notificationId) {
    if (canUseRemote) {
      await employmentApi.deleteNotification(notificationId, token)
    }

    setNotifications((current) => {
      const items = current.items.filter((item) => item.id !== notificationId)
      return {
        items,
        unreadCount: items.filter((item) => !item.readFlag).length,
      }
    })
  }

  function handleConfirmTracking() {
    if (!pendingTracking) return
    navigate(`/station/job/applications?${createTrackingSearch(pendingTracking)}`)
    setPendingTracking(null)
  }

  const summaryItems = [
    {
      label: '推荐数量',
      value: String(recommendations.length),
      note: '当前筛选下命中的推荐岗位数。',
    },
    {
      label: '最高匹配',
      value: String(recommendations[0]?.matchScore || 0),
      note: '先看最靠前的匹配岗位，再决定是否展开详情。',
    },
    {
      label: '未读提醒',
      value: String(notifications.unreadCount),
      note: '提醒被收进右栏，不再打断主区浏览。',
    },
    {
      label: '当前筛选',
      value: firstNonEmpty(filters.city, filters.industry, filters.roleType, filters.skills, filters.keyword.trim(), '全部'),
      note: '主区列表和右栏筛选保持同步。',
    },
  ]

  return (
    <>
      <div className="v2-main-column" data-testid="job-recommendations-page">
        <PageIntro
          kicker="岗位推荐"
          pathItems={[
            { label: '就业主站', to: '/station/job' },
            { label: '推荐结果' },
          ]}
          title="先读懂匹配理由，再决定是否进入投递链。"
          lead="主区看结果，右栏保留筛选和提醒。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <JobSummaryStrip items={summaryItems} />

        <section className="v2-feed-list" aria-label="岗位推荐列表">
          {recommendations.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.matchScore}</div>
              <div className="v2-feed-body">
                <strong>{item.companyName} / {item.title}</strong>
                <p>{item.city} / {item.industry} / {item.companyType}</p>
                <p>{item.salaryRange}</p>
                <p>{item.description}</p>
                <div className="v2-tag-row">
                  {item.matchReasons.map((reason) => <span key={reason}>{reason}</span>)}
                  {!item.matchReasons.length ? <span>等待补充匹配理由</span> : null}
                </div>
              </div>
              <div className="v2-feed-side">
                <span>{item.canApplyDirectly ? '可外链投递' : '建议先进入详情确认'}</span>
                <button className="v2-secondary-link" type="button" onClick={() => handleOpenDetail(item)}>查看详情</button>
                <button className="v2-primary-link" type="button" onClick={() => setPendingTracking(item)}>加入投递跟踪</button>
              </div>
            </article>
          ))}
          {!recommendations.length ? (
            <article className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有命中的推荐岗位</strong>
                <p>可以放宽城市、行业或技能关键词后再看一轮。</p>
              </div>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <JobRecommendationFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(emptyFilters)}
        />
        <JobNotificationPanel
          notifications={notifications.items}
          unreadCount={notifications.unreadCount}
          onMarkRead={handleMarkRead}
          onDelete={handleDeleteNotification}
        />
        <JobPostingDetailDrawer
          posting={detail}
          onClose={() => setDetail(null)}
          onTrack={(posting) => setPendingTracking(posting)}
        />
      </aside>

      <EmploymentConfirmModal
        open={Boolean(pendingTracking)}
        title="把这条推荐送进投递看板？"
        body="加入投递跟踪前，先把这条推荐带到投递看板。"
        confirmLabel="去建立跟踪条目"
        onConfirm={handleConfirmTracking}
        onClose={() => setPendingTracking(null)}
      />
    </>
  )
}
