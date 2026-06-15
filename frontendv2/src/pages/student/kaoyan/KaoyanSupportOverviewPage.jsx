import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { mentorApi, studyRoomApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createKaoyanSupportPreview } from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

function buildPreviewSnapshot() {
  const preview = createKaoyanSupportPreview()
  return {
    unreadCount: Number(preview.unreadCount || 0),
    currentRoom: preview.rooms[0]
      ? {
          id: preview.rooms[0].id,
          roomId: preview.rooms[0].id,
          name: preview.rooms[0].name,
        }
      : null,
    createdRooms: preview.rooms.slice(0, 2),
    seniorCount: preview.seniors.length,
    roomCount: preview.rooms.length,
  }
}

export default function KaoyanSupportOverviewPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const previewSnapshot = useMemo(() => buildPreviewSnapshot(), [])
  const [snapshot, setSnapshot] = useState(previewSnapshot)
  const [notice, setNotice] = useState(previewDataNotice('考研陪伴'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setSnapshot(previewSnapshot)
        setNotice(previewDataNotice('考研陪伴'))
        return
      }

      setLoading(true)
      try {
        const [unreadData, currentRoomData, createdRoomsData] = await withRequestTimeout(
          Promise.all([
            mentorApi.unreadCount(token).catch(() => ({ count: 0 })),
            studyRoomApi.myCurrentRoom(token).catch(() => null),
            studyRoomApi.myCreatedRooms(token).catch(() => []),
          ]),
          8000,
          '考研陪伴入口数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const createdRooms = Array.isArray(createdRoomsData) ? createdRoomsData : []
        setSnapshot({
          unreadCount: Number(unreadData?.count || 0),
          currentRoom: currentRoomData || null,
          createdRooms,
          seniorCount: previewSnapshot.seniorCount,
          roomCount: createdRooms.length || previewSnapshot.roomCount,
        })
        setNotice(remoteDataNotice('考研陪伴'))
      } catch (error) {
        if (!active) return
        setSnapshot(previewSnapshot)
        setNotice(fallbackDataNotice('考研陪伴', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOverview()
    return () => {
      active = false
    }
  }, [canUseRemote, previewSnapshot, token])

  const createdRooms = Array.isArray(snapshot.createdRooms) ? snapshot.createdRooms : []
  const currentRoomId = snapshot.currentRoom?.roomId || snapshot.currentRoom?.id

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考研陪伴"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '协作入口' },
          ]}
          title="进入 1v1咨询，或直接进入同频自习室。"
          lead="这个页面只作为兼容旧入口保留的分流页，真正的功能分别在 1v1咨询 与 同频自习室中完成。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步考研陪伴入口…</div> : null}

        <section className="v2-split-board v2-support-route-grid" aria-label="考研陪伴分流">
          <article className="v2-article-card v2-support-route-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">1v1咨询</p>
                <h3>先找人，再追问</h3>
              </div>
              <span className="v2-plan-status-pill">{`未读 ${snapshot.unreadCount}`}</span>
            </div>
            <p>
              适合已经有明确问题的人。先按院校、届次、专业和擅长科目筛出合适的学长学姐，再决定查看档案或发起 1v1 咨询。
            </p>
            <div className="v2-tag-row">
              <span>院校下拉筛选</span>
              <span>年级下拉筛选</span>
              <span>专业关键词</span>
              <span>擅长科目关键词</span>
            </div>
            <div className="v2-support-route-foot">
              <Link className="v2-segment-button is-active" to="/station/kaoyan/support/mentors">
                进入 1v1咨询
              </Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/messages">
                查看咨询消息
              </Link>
            </div>
          </article>

          <article className="v2-article-card v2-support-route-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">同频自习室</p>
                <h3>先择房，再进场</h3>
              </div>
              <span className="v2-plan-status-pill">{currentRoomId ? '可继续' : '可新建'}</span>
            </div>
            <p>
              适合想快速进入学习状态的人。房间大厅集中处理筛选、续接当前房间、查看我创建的房间和创建新房间。
            </p>
            <div className="v2-tag-row">
              <span>院校下拉筛选</span>
              <span>专业关键词</span>
              <span>当前房间续接</span>
              <span>右栏建房</span>
            </div>
            <div className="v2-support-route-foot">
              <Link className="v2-segment-button is-active" to="/station/kaoyan/support/rooms">
                进入同频自习室
              </Link>
              {currentRoomId ? (
                <Link className="v2-secondary-link" to={`/station/kaoyan/support/rooms/${currentRoomId}`}>
                  回到当前房间
                </Link>
              ) : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">当前陪伴状态</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>未读咨询</strong>
              <strong>{snapshot.unreadCount}</strong>
              <span>条待处理消息</span>
            </div>
            <div className="v2-check-row">
              <strong>当前房间</strong>
              <span>{snapshot.currentRoom?.name || '暂未加入自习室'}</span>
            </div>
            <div className="v2-check-row">
              <strong>我创建的房间</strong>
              <span>{createdRooms.length ? `${createdRooms.length} 间可继续管理` : '还没有创建房间'}</span>
            </div>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">最近房间</p>
          <div className="v2-check-list">
            {createdRooms.map((room) => (
              <div className="v2-check-row" key={room.id}>
                <strong>{room.name}</strong>
                <span>{room.schoolName || '院校待补充'} / {room.major || '专业待补充'}</span>
              </div>
            ))}
            {!createdRooms.length ? <p>当前还没有自己创建的房间。</p> : null}
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">适合这样用</p>
          <ul>
            <li>问题明确时先走 1v1咨询，减少盲目发起会话。</li>
            <li>只是想立刻进入学习状态时，直接去同频自习室更高效。</li>
            <li>消息页负责持续沟通，房间详情页负责实时陪伴，不再在这里混做。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
