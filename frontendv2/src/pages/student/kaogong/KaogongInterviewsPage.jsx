import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createInterviewFilters,
  createInterviewRoomForm,
  createKaogongInterviewPreview,
  emptyPage,
  getInterviewStatusLabel,
  interviewStatusOptions,
  normalizeInterviewRoomsPage,
} from '@/pages/student/kaogong/kaogongPageData.js'

export default function KaogongInterviewsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const preview = createKaogongInterviewPreview()
  const [draftFilters, setDraftFilters] = useState(createInterviewFilters())
  const [appliedFilters, setAppliedFilters] = useState(createInterviewFilters())
  const [roomsPage, setRoomsPage] = useState({
    ...emptyPage(8),
    content: preview.rooms,
  })
  const [myRooms, setMyRooms] = useState([])
  const [roomForm, setRoomForm] = useState(createInterviewRoomForm())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [notice, setNotice] = useState(previewDataNotice('模拟面试'))
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true

    async function loadHall() {
      if (!canUseRemote) {
        setRoomsPage({
          ...emptyPage(8),
          content: preview.rooms,
          totalElements: preview.rooms.length,
        })
        setMyRooms(preview.rooms.slice(0, 2))
        setNotice(previewDataNotice('模拟面试'))
        return
      }

      setLoading(true)
      try {
        const [roomsData, myRoomsData] = await withRequestTimeout(
          Promise.all([
            kaogongApi.interviewRoomsPage({ ...appliedFilters, page: 0, size: 8 }),
            kaogongApi.myInterviewRooms(token).catch(() => []),
          ]),
          8000,
          '模拟面试大厅数据读取超时，请检查后端服务。',
        )
        if (!active) return

        setRoomsPage({
          ...emptyPage(8),
          ...roomsData,
          content: normalizeInterviewRoomsPage(roomsData),
        })
        setMyRooms(Array.isArray(myRoomsData) ? myRoomsData : [])
        setNotice(remoteDataNotice('模拟面试'))
      } catch (error) {
        if (!active) return
        setRoomsPage({
          ...emptyPage(8),
          content: preview.rooms,
          totalElements: preview.rooms.length,
        })
        setMyRooms(preview.rooms.slice(0, 2))
        setNotice(fallbackDataNotice('模拟面试', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHall()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, token])

  const currentRoom = myRooms.find((item) => item.status !== 'COMPLETED') || null

  function handleApplyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
  }

  function resetFilters() {
    const nextFilters = createInterviewFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  async function handleCreateRoom(event) {
    event.preventDefault()
    if (!canUseRemote) return

    setCreating(true)
    try {
      const created = await kaogongApi.createInterviewRoom({
        title: roomForm.title.trim(),
        jobDirection: roomForm.jobDirection.trim(),
        scheduledAt: `${roomForm.scheduledAt}:00`,
        description: roomForm.description.trim(),
        inviteNote: roomForm.inviteNote.trim(),
      }, token)
      setRoomForm(createInterviewRoomForm())
      setShowCreateForm(false)
      navigate(`/station/kaogong/interviews/rooms/${created.id}`)
    } catch (error) {
      setNotice(error.message || '创建模拟面试房间失败。')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinRoom(roomId) {
    if (!canUseRemote) {
      navigate(`/station/kaogong/interviews/rooms/${roomId}`)
      return
    }

    try {
      await kaogongApi.joinInterviewRoom(roomId, token)
      navigate(`/station/kaogong/interviews/rooms/${roomId}`)
    } catch (error) {
      setNotice(error.message || '加入模拟面试房间失败。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="模拟面试"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '房间大厅' },
          ]}
          title="大厅只负责找房、建房和续接，真正的答题协作全部进入房间详情。"
          lead="不再把消息、附件、复盘和筛房混在一页里，大厅只做你进入哪间房之前的那一步判断。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新模拟面试大厅…</div> : null}

        <section className="v2-summary-strip" aria-label="模拟面试大厅摘要">
          <article className="v2-summary-card">
            <span>可进入房间</span>
            <strong>{roomsPage.content.length}</strong>
            <p>当前筛选下大厅里能直接加入的房间数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前房间</span>
            <strong>{currentRoom?.title || '暂无'}</strong>
            <p>如果你已经在某个房间里，这里会保留续接入口。</p>
          </article>
          <article className="v2-summary-card">
            <span>我参与过</span>
            <strong>{myRooms.length}</strong>
            <p>自己参加过的房间会沉在右侧，便于快速回到原上下文。</p>
          </article>
        </section>

        <section className="v2-room-board" aria-label="模拟面试大厅结果">
          {roomsPage.content.map((room) => (
            <article className="v2-room-board__item" key={room.id}>
              <div className="v2-room-board__main">
                <strong>{room.title}</strong>
                <p>{room.jobDirection}</p>
                <p>{formatDateTimeLabel(room.scheduledAt)} / {room.ownerName} / {room.participantCount} 人</p>
                <div className="v2-tag-row">
                  <span>{getInterviewStatusLabel(room.status)}</span>
                  <span>{room.description}</span>
                </div>
              </div>
              <div className="v2-room-board__actions">
                <button
                  aria-label={`进入房间 ${room.id}`}
                  className="v2-segment-button is-active"
                  type="button"
                  onClick={() => handleJoinRoom(room.id)}
                >
                  进入房间
                </button>
              </div>
            </article>
          ))}
          {!roomsPage.content.length ? (
            <article className="v2-empty-card">
              <p>当前筛选条件下还没有匹配的房间，右侧可以直接新建一间。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选与快捷操作</p>
              <h3>先决定进哪间房，再进入高交互工作区</h3>
            </div>
            <button className="v2-segment-button is-active" type="button" onClick={() => setShowCreateForm((current) => !current)}>
              新建房间
            </button>
          </div>

          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <label className="v2-field">
              <span>房间标题</span>
              <input
                type="text"
                value={draftFilters.title}
                onChange={(event) => setDraftFilters((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>岗位方向</span>
              <input
                type="text"
                value={draftFilters.jobDirection}
                onChange={(event) => setDraftFilters((current) => ({ ...current, jobDirection: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>房间状态</span>
              <div className="v2-segment-group" role="group" aria-label="房间状态">
                {interviewStatusOptions.map((item) => (
                  <button
                    className={`v2-segment-button ${draftFilters.status === item.value ? 'is-active' : ''}`}
                    key={item.value || 'all'}
                    type="button"
                    onClick={() => setDraftFilters((current) => ({ ...current, status: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">应用筛选</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置</button>
            </div>
          </form>

          {showCreateForm ? (
            <>
              <div className="v2-room-side-divider" />
              <form className="v2-filter-form" onSubmit={handleCreateRoom}>
                <label className="v2-field">
                  <span>房间标题</span>
                  <input
                    aria-label="房间标题"
                    type="text"
                    value={roomForm.title}
                    onChange={(event) => setRoomForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label className="v2-field">
                  <span>岗位方向</span>
                  <input
                    aria-label="岗位方向"
                    type="text"
                    value={roomForm.jobDirection}
                    onChange={(event) => setRoomForm((current) => ({ ...current, jobDirection: event.target.value }))}
                  />
                </label>
                <label className="v2-field">
                  <span>面试时间</span>
                  <input
                    aria-label="面试时间"
                    type="datetime-local"
                    value={roomForm.scheduledAt}
                    onChange={(event) => setRoomForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                  />
                </label>
                <label className="v2-field">
                  <span>房间描述</span>
                  <textarea
                    value={roomForm.description}
                    onChange={(event) => setRoomForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <div className="v2-inline-actions">
                  <button className="v2-segment-button" type="button" onClick={() => setShowCreateForm(false)}>取消</button>
                  <button className="v2-segment-button is-active" disabled={creating} type="submit">
                    {creating ? '创建中...' : '创建并进入'}
                  </button>
                </div>
              </form>
            </>
          ) : null}

          <div className="v2-room-side-divider" />

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>当前房间</strong>
              <span>{currentRoom ? '可续接' : '暂无'}</span>
            </div>
            {currentRoom ? (
              <button
                className="v2-segment-button is-active"
                type="button"
                onClick={() => navigate(`/station/kaogong/interviews/rooms/${currentRoom.id}`)}
              >
                继续当前房间
              </button>
            ) : (
              <p>当前没有进行中的模拟面试房间，先筛房或新建一间。</p>
            )}
          </section>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>我的房间</strong>
              <span>{`${myRooms.length} 间`}</span>
            </div>
            <div className="v2-room-mini-list">
              {myRooms.map((item) => (
                <button
                  className="v2-room-mini-button"
                  key={`my-room-${item.id}`}
                  type="button"
                  onClick={() => navigate(`/station/kaogong/interviews/rooms/${item.id}`)}
                >
                  <strong>{item.title}</strong>
                  <span>{getInterviewStatusLabel(item.status)}</span>
                </button>
              ))}
              {!myRooms.length ? <p>你参与过的房间会留在这里，方便快速回到同一个上下文。</p> : null}
            </div>
          </section>
        </section>
      </aside>
    </>
  )
}
