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
  const [view, setView] = useState('home')
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

  function handleReviewRoom(roomId) {
    navigate(`/station/kaogong/interviews/rooms/${roomId}#feedback`)
  }

  function renderRoomList(isReview = false) {
    return (
      <>
        <section className="v2-kaogong-interview-list-head" aria-label={isReview ? '评价房间选择页头' : '加入房间选择页头'}>
          <div>
            <p className="v2-kicker">{isReview ? '评价房间' : '加入房间'}</p>
            <h2>{isReview ? '选择房间查看复盘评价' : '选择一个面试房间'}</h2>
            <p>{isReview ? '先选中房间，再进入房间里的复盘评价区域继续补充。' : '先筛选标题、方向和时间，再进入讨论区交流。'}</p>
          </div>
          <button className="v2-secondary-link" type="button" onClick={() => setView('home')}>
            返回
          </button>
        </section>

        {loading ? <div className="v2-status-note">正在刷新模拟面试大厅…</div> : null}

        <section className="v2-kaogong-interview-room-list" aria-label={isReview ? '评价房间列表' : '加入房间列表'}>
          {roomsPage.content.map((room) => (
            <article className="v2-kaogong-interview-room-card" key={room.id}>
              <div className="v2-kaogong-interview-room-card__main">
                <div className="v2-kaogong-interview-room-card__title">
                  <strong>{room.title}</strong>
                  <span>{getInterviewStatusLabel(room.status)}</span>
                </div>
                <p>{room.jobDirection}</p>
                <div className="v2-kaogong-interview-room-card__meta">
                  <span>{formatDateTimeLabel(room.scheduledAt)}</span>
                  <span>{room.ownerName || '房主待补充'}</span>
                  <span>{room.participantCount || 0} 人</span>
                </div>
                <p className="v2-kaogong-interview-room-card__desc">{room.description || '暂无房间描述。'}</p>
              </div>
              <button
                aria-label={`${isReview ? '进入评价' : '加入讨论区'} ${room.id}`}
                className={`v2-segment-button ${room.status === 'COMPLETED' && !isReview ? '' : 'is-active'}`}
                type="button"
                disabled={!isReview && room.status === 'COMPLETED'}
                onClick={() => (isReview ? handleReviewRoom(room.id) : handleJoinRoom(room.id))}
              >
                {isReview ? '进入评价' : room.status === 'COMPLETED' ? '已结束' : '加入讨论区'}
              </button>
            </article>
          ))}
          {!roomsPage.content.length ? (
            <article className="v2-empty-card">
              <p>当前筛选条件下还没有匹配的房间，可以返回创建一间新的模拟面试房。</p>
            </article>
          ) : null}
        </section>
      </>
    )
  }

  function renderCreate() {
    return (
      <section className="v2-kaogong-interview-create" aria-label="创建模拟面试房间">
        <div className="v2-kaogong-interview-list-head">
          <div>
            <p className="v2-kicker">创建房间</p>
            <h2>新建模拟面试</h2>
            <p>填写房间标题、岗位方向和面试时间，创建后直接进入讨论区。</p>
          </div>
          <button className="v2-secondary-link" type="button" onClick={() => setView('home')}>
            返回
          </button>
        </div>

        <form className="v2-side-card v2-kaogong-interview-create-form" onSubmit={handleCreateRoom}>
          <div className="v2-kaogong-interview-create-grid">
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
              <span>邀请说明</span>
              <input
                aria-label="邀请说明"
                type="text"
                value={roomForm.inviteNote}
                onChange={(event) => setRoomForm((current) => ({ ...current, inviteNote: event.target.value }))}
              />
            </label>
          </div>
          <label className="v2-field">
            <span>房间描述</span>
            <textarea
              value={roomForm.description}
              onChange={(event) => setRoomForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="v2-inline-actions">
            <button className="v2-segment-button" type="button" onClick={() => setView('home')}>取消</button>
            <button className="v2-segment-button is-active" disabled={creating} type="submit">
              {creating ? '创建中...' : '创建并进入讨论区'}
            </button>
          </div>
        </form>
      </section>
    )
  }

  function renderHome() {
    return (
      <>
        <PageIntro
          kicker="模拟面试"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '模拟面试' },
          ]}
          title="模拟面试"
          lead="先创建房间、加入房间或查看评价，再进入对应的房间工作区。"
        />

        <section className="v2-kaogong-interview-action-grid" aria-label="模拟面试入口">
          <button className="v2-kaogong-interview-action-card" type="button" onClick={() => setView('create')}>
            <span>01</span>
            <strong>创建房间</strong>
            <p>发起一场新的模拟面试，创建后直接进入讨论区。</p>
          </button>
          <button className="v2-kaogong-interview-action-card" type="button" onClick={() => setView('join')}>
            <span>02</span>
            <strong>加入房间</strong>
            <p>先选择已有房间，再进入房间交流、上传附件和参与练习。</p>
          </button>
          <button className="v2-kaogong-interview-action-card" type="button" onClick={() => setView('reviews')}>
            <span>03</span>
            <strong>评价房间</strong>
            <p>查看房间复盘评价，进入后继续补充亮点、问题和建议。</p>
          </button>
        </section>

        {/* <section className="v2-summary-strip" aria-label="模拟面试大厅摘要">
          <article className="v2-summary-card">
            <span>可进入房间</span>
            <strong>{roomsPage.content.length}</strong>
            <p>点击加入房间后再查看完整房间列表。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前房间</span>
            <strong>{currentRoom?.title || '暂无'}</strong>
            <p>已加入的进行中房间会保留续接入口。</p>
          </article>
          <article className="v2-summary-card">
            <span>我参与过</span>
            <strong>{myRooms.length}</strong>
            <p>你的房间记录会放在右侧，方便回到原上下文。</p>
          </article>
        </section> */}
      </>
    )
  }

  return (
    <>
      <div className="v2-main-column">
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {view === 'home' ? renderHome() : null}
        {view === 'create' ? renderCreate() : null}
        {view === 'join' ? renderRoomList(false) : null}
        {view === 'reviews' ? renderRoomList(true) : null}
      </div>

      <aside className="v2-side-column v2-kaogong-interview-side-column">
        {view === 'join' || view === 'reviews' ? (
          <section className="v2-side-card v2-kaogong-filter-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">筛选条件</p>
                <h3>{view === 'reviews' ? '筛选评价房间' : '筛选可加入房间'}</h3>
              </div>
            </div>

            <form className="v2-filter-form" onSubmit={handleApplyFilters}>
              <section className="v2-kaogong-filter-cluster" aria-label="模拟面试房间筛选器">
                <label className="v2-field">
                  <span>房间标题</span>
                  <input
                    type="text"
                    value={draftFilters.title}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, title: event.target.value }))}
                    placeholder="搜索房间标题"
                  />
                </label>
                <label className="v2-field">
                  <span>岗位方向</span>
                  <input
                    type="text"
                    value={draftFilters.jobDirection}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, jobDirection: event.target.value }))}
                    placeholder="税务 / 综合管理"
                  />
                </label>
                <label className="v2-field">
                  <span>房间状态</span>
                  <select
                    value={draftFilters.status}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    {interviewStatusOptions.map((item) => (
                      <option key={item.value || 'all'} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <div className="v2-kaogong-filter-grid">
                  <label className="v2-field">
                    <span>开始日期</span>
                    <input
                      type="date"
                      value={draftFilters.dateFrom}
                      onChange={(event) => setDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                    />
                  </label>
                  <label className="v2-field">
                    <span>结束日期</span>
                    <input
                      type="date"
                      value={draftFilters.dateTo}
                      onChange={(event) => setDraftFilters((current) => ({ ...current, dateTo: event.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <div className="v2-inline-actions v2-kaogong-filter-actions">
                <button className="v2-segment-button is-active" type="submit" disabled={loading}>
                  {loading ? '筛选中...' : '应用筛选'}
                </button>
                <button className="v2-segment-button" type="button" disabled={loading} onClick={resetFilters}>重置</button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="v2-side-card v2-kaogong-interview-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">房间快捷入口</p>
              <h3>保留正在进行的房间上下文</h3>
            </div>
          </div>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>当前房间：</strong>
              <span>{currentRoom ? '可续接' : '暂无'}</span>
            </div>
            <span>{currentRoom ? currentRoom.title : '暂无'}</span>
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
