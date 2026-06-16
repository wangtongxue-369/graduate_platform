import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import {
  createCommunityPreviewPosts,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import {
  createPreviewNotificationItems,
  extractPagePayload,
  normalizeCommunityNotification,
} from '@/lib/communityUi.js'

const notificationTabPath = '/community/notifications'

export function formatCommunityUnreadBadge(unreadCount) {
  const safeCount = Number(unreadCount || 0)
  if (safeCount <= 0) return ''
  if (safeCount > 99) return '99+'
  return String(safeCount)
}

export function attachCommunityUnreadBadge(items, unreadCount) {
  const badge = formatCommunityUnreadBadge(unreadCount)

  return items.map((item) => (
    item.to === notificationTabPath
      ? { ...item, badge }
      : item
  ))
}

function extractUnreadCount(payload) {
  const explicitCount = Number(payload?.unreadCount)
  if (Number.isFinite(explicitCount)) return explicitCount

  return extractPagePayload(payload).content
    .map((item) => normalizeCommunityNotification(item))
    .filter((item) => !item.read)
    .length
}

export function useCommunitySubnavItems(items, unreadCountOverride = null) {
  const { isAuthed, token } = useAuth()
  const isForcedPreview = shouldForceCommunityPreview(token)
  const [unreadCount, setUnreadCount] = useState(() => Number(unreadCountOverride || 0))

  useEffect(() => {
    if (unreadCountOverride !== null && unreadCountOverride !== undefined) {
      setUnreadCount(Number(unreadCountOverride || 0))
      return undefined
    }

    if (!isAuthed) {
      setUnreadCount(0)
      return undefined
    }

    let active = true

    async function loadUnreadCount() {
      try {
        if (isForcedPreview) {
          const previewUnreadCount = createPreviewNotificationItems(
            createCommunityPreviewPosts({ sort: 'latest' }),
          ).filter((item) => !item.read).length

          if (active) {
            setUnreadCount(previewUnreadCount)
          }
          return
        }

        const payload = await communityApi.notifications(0, 1, token)
        if (active) {
          setUnreadCount(extractUnreadCount(payload))
        }
      } catch {
        if (active) {
          setUnreadCount(0)
        }
      }
    }

    loadUnreadCount()

    return () => {
      active = false
    }
  }, [isAuthed, isForcedPreview, token, unreadCountOverride])

  return useMemo(
    () => attachCommunityUnreadBadge(items, unreadCountOverride ?? unreadCount),
    [items, unreadCount, unreadCountOverride],
  )
}
