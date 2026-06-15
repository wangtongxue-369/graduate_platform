import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaoyanApi, studyRoomApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import KaoyanStudyRoomCreateModal from '@/components/kaoyan/KaoyanStudyRoomCreateModal.jsx'
import {
  createEmptyRoomForm,
  createKaoyanSchoolPreviewRows,
  createKaoyanSupportPreview,
  paginateRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateTimeLabel,
  previewDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const previewRooms = createKaoyanSupportPreview().rooms
const previewSchoolOptions = createKaoyanSchoolPreviewRows().map((item) => ({
  id: item.schoolId,
  name: item.schoolName,
}))

function createFilters() {
  return {
    schoolId: '',
    major: '',
  }
}

function filterRooms(rows, filters) {
  const major = String(filters.major || '').trim().toLowerCase()

  return rows.filter((item) => {
    if (major && !String(item.major || '').toLowerCase().includes(major)) return false
    return true
  })
}

function normalizeRoomRows(data) {
  const content = Array.isArray(data?.content) ? data.content : []
  return content.map((item, index) => ({
    id: item.id ?? `room-${index}`,
    name: item.name || '未命名自习室',
    schoolName: item.schoolName || '院校待补充',
    major: item.major || '专业待补充',
    memberCount: Number(item.memberCount || 0),
    createdByName: item.createdByName || '发起人待补充',
    createdAt: item.createdAt || '',
    closed: Boolean(item.closed),
  }))
}

export default function KaoyanStudyRoomsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [schoolOptions, setSchoolOptions] = useState(previewSchoolOptions)
  const [draftFilters, setDraftFilters] = useState(createFilters())
  const [appliedFilters, setAppliedFilters] = useState(createFilters())
  const [rows, setRows] = useState(previewRooms.slice(0, 10))
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(previewRooms.length)
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(previewRooms.length / 10)))
  const [currentRoom, setCurrentRoom] = useState(null)
  const [createdRooms, setCreatedRooms] = useState([])
  const [roomForm, setRoomForm] = useState(createEmptyRoomForm())
  const [notice, setNotice] = useState(previewDataNotice('同频自习室'))
  const [loading, setLoading] = useState(false)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [createError, setCreateError] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const currentRoomId = currentRoom?.roomId || currentRoom?.id || ''

  useEffect(() => {
    let active = true

    async function loadRoomsHall() {
      if (!canUseRemote) {
        const filteredRows = filterRooms(previewRooms, appliedFilters)
        const pagedRows = paginateRows(filteredRows, { page, size: pageSize })
        if (!active) return
        setSchoolOptions(previewSchoolOptions)
        setRows(pagedRows.pageRows)
        setTotalElements(pagedRows.totalElements)
        setTotalPages(pagedRows.totalPages)
        setCurrentRoom(null)
        setCreatedRooms([])
        setNotice(previewDataNotice('同频自习室'))
        return
      }

      setLoading(true)
      try {
        const [schoolsData, roomData, currentRoomData, createdRoomsData] = await withRequestTimeout(
          Promise.all([
            kaoyanApi.schoolsPage({ size: 200 }),
            studyRoomApi.roomList({
              schoolId: appliedFilters.schoolId,
              major: appliedFilters.major.trim(),
              page,
              size: pageSize,
            }),
            studyRoomApi.myCurrentRoom(token).catch(() => null),
            studyRoomApi.myCreatedRooms(token).catch(() => []),
          ]),
          8000,
          '同频自习室数据读取超时，请检查后端服务。',
        )
        if (!active) return

        const nextSchoolOptions = Array.isArray(schoolsData?.content) && schoolsData.content.length
          ? schoolsData.content.map((item) => ({ id: item.id, name: item.name }))
          : previewSchoolOptions

        setSchoolOptions(nextSchoolOptions)
        setRows(normalizeRoomRows(roomData))
        setTotalElements(Number(roomData?.totalElements || 0))
        setTotalPages(Math.max(1, Number(roomData?.totalPages || 1)))
        setCurrentRoom(currentRoomData || null)
        setCreatedRooms(Array.isArray(createdRoomsData) ? createdRoomsData : [])
        setNotice('')
      } catch (error) {
        if (!active) return
        const filteredRows = filterRooms(previewRooms, appliedFilters)
        const pagedRows = paginateRows(filteredRows, { page, size: pageSize })
        setSchoolOptions(previewSchoolOptions)
        setRows(pagedRows.pageRows)
        setTotalElements(pagedRows.totalElements)
        setTotalPages(pagedRows.totalPages)
        setCurrentRoom(null)
        setCreatedRooms([])
        setNotice(fallbackDataNotice('同频自习室', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRoomsHall()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, page, pageSize, token])

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(0)
    setAppliedFilters({
      ...draftFilters,
    })
  }

  function resetFilters() {
    const nextFilters = createFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  function handleEnterRoom(roomId) {
    navigate(`/station/kaoyan/support/rooms/${roomId}`)
  }

  function handleOpenCreateModal() {
    setCreateError('')
    setIsCreateModalOpen(true)
  }

  function handleCloseCreateModal() {
    if (creatingRoom) return
    setCreateError('')
    setIsCreateModalOpen(false)
  }

  function updateRoomForm(key, value) {
    setRoomForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleCreateRoom(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return

    if (!roomForm.name.trim()) {
      setCreateError('请先填写房间名称。')
      return
    }

    setCreateError('')
    setCreatingRoom(true)
    try {
      const room = await studyRoomApi.createRoom({
        name: roomForm.name.trim(),
        schoolId: roomForm.schoolId ? Number(roomForm.schoolId) : null,
        major: roomForm.major.trim() || null,
      }, token)
      setRoomForm(createEmptyRoomForm())
      setIsCreateModalOpen(false)
      navigate(`/station/kaoyan/support/rooms/${room.id}`)
    } catch (error) {
      const message = error.message || '自习室创建失败。'
      setCreateError(message)
      setNotice(message)
    } finally {
      setCreatingRoom(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="同频自习室"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '同频自习室' },
          ]}
          title="找房间和筛房间都留在大厅，创建房间改成更轻的弹窗动作。"
          lead="主区只保留结果列表，右侧负责筛选与快捷操作，进入房间后再继续实时学习和讨论。"
          actions={(
            <>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/mentors">去 1v1 咨询</Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/messages">咨询消息</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新自习室大厅...</div> : null}

        <section className="v2-summary-strip" aria-label="自习室大厅摘要">
          <article className="v2-summary-card">
            <span>可加入房间</span>
            <strong>{totalElements}</strong>
            <p>当前筛选条件下可加入或围观的房间数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前在房</span>
            <strong>{currentRoom?.name || (currentRoomId ? `房间 ${currentRoomId}` : '暂无')}</strong>
            <p>如果已经在某个房间学习，可以直接从右侧快捷续回。</p>
          </article>
          <article className="v2-summary-card">
            <span>我创建的房间</span>
            <strong>{createdRooms.length}</strong>
            <p>自己创建过的房间会保留在右侧快捷入口里。</p>
          </article>
        </section>

        <section className="v2-side-card" aria-label="自习室结果">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">房间列表</p>
              <h3>查询结果</h3>
            </div>
            <span className="v2-plan-status-pill">{`共 ${totalElements} 间`}</span>
          </div>

          <div className="v2-ledger-card">
            {rows.map((item) => (
              <article className="v2-ledger-row v2-ledger-row--material v2-room-ledger-row" key={item.id}>
                <div className="v2-ledger-row__main">
                  <strong>{item.name}</strong>
                  <p>{item.schoolName} / {item.major}</p>
                  <div className="v2-tag-row">
                    <span>{item.memberCount} 人在线</span>
                    <span>{item.closed ? '已关闭' : '开放中'}</span>
                    <span>{item.createdByName}</span>
                  </div>
                  <p>{formatDateTimeLabel(item.createdAt)}</p>
                </div>
                <div className="v2-ledger-row__meta">
                  <span>{item.schoolName}</span>
                  <span>{item.major}</span>
                  <span>{item.memberCount} 人</span>
                </div>
                <div className="v2-ledger-row__actions">
                  <button
                    className="v2-segment-button is-active"
                    type="button"
                    onClick={() => handleEnterRoom(item.id)}
                  >
                    进入房间
                  </button>
                </div>
              </article>
            ))}
            {!rows.length ? (
              <article className="v2-empty-card">
                <p>当前筛选条件下还没有匹配的自习室，可以先放宽筛选或从右侧新建一间。</p>
              </article>
            ) : null}
          </div>
        </section>

        <section className="v2-pagination-row" aria-label="自习室大厅分页">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || page <= 0}
            onClick={() => setPage((current) => current - 1)}
          >
            上一页
          </button>
          <span className="v2-pagination-note">{`第 ${Math.min(page + 1, totalPages)} / ${totalPages} 页`}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || page >= totalPages - 1}
            onClick={() => setPage((current) => current + 1)}
          >
            下一页
          </button>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card v2-room-filter-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选条件</p>
              <h3>先缩小范围，再决定进入或创建</h3>
            </div>
            <button
              className="v2-segment-button is-active"
              disabled={!canUseRemote}
              type="button"
              onClick={handleOpenCreateModal}
            >
              新建房间
            </button>
          </div>

          <form className="v2-filter-form" onSubmit={handleSearch}>
            <label className="v2-field">
              <span>目标院校</span>
              <select
                aria-label="目标院校"
                value={draftFilters.schoolId}
                onChange={(event) => updateDraftFilter('schoolId', event.target.value)}
              >
                <option value="">全部</option>
                {schoolOptions.map((item) => (
                  <option key={`${item.id}-${item.name}`} value={String(item.id)}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                aria-label="专业方向"
                type="text"
                value={draftFilters.major}
                onChange={(event) => updateDraftFilter('major', event.target.value)}
              />
            </label>
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">查询</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>清空</button>
            </div>
          </form>

          <div className="v2-room-side-divider" />

          <section className="v2-room-side-section" aria-label="当前在房快捷入口">
            <div className="v2-room-side-section__head">
              <strong>当前在房</strong>
              <span>{currentRoomId ? '可续回' : '暂无'}</span>
            </div>
            <p>
              {currentRoomId
                ? `当前房间：${currentRoom.name || `房间 ${currentRoomId}`}`
                : '当前没有正在进行中的房间。'}
            </p>
            {currentRoomId ? (
              <button
                className="v2-segment-button is-active"
                type="button"
                onClick={() => handleEnterRoom(currentRoomId)}
              >
                继续当前房间
              </button>
            ) : null}
          </section>

          <section className="v2-room-side-section" aria-label="我创建的房间快捷入口">
            <div className="v2-room-side-section__head">
              <strong>我创建的房间</strong>
              <span>{`${createdRooms.length} 间`}</span>
            </div>
            {createdRooms.length ? (
              <div className="v2-room-mini-list">
                {createdRooms.map((item) => (
                  <button
                    className="v2-room-mini-button"
                    key={item.id}
                    type="button"
                    onClick={() => handleEnterRoom(item.id)}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.schoolName || '院校待补充'} / {item.major || '专业待补充'}</span>
                    <small>{formatDateTimeLabel(item.createdAt)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p>当前还没有自己创建的房间，先筛选后也可以直接新建一间。</p>
            )}
          </section>
        </section>
      </aside>

      {isCreateModalOpen ? (
        <KaoyanStudyRoomCreateModal
          canUseRemote={canUseRemote}
          error={createError}
          form={roomForm}
          saving={creatingRoom}
          schoolOptions={schoolOptions}
          onChange={updateRoomForm}
          onClose={handleCloseCreateModal}
          onSubmit={handleCreateRoom}
        />
      ) : null}
    </>
  )
}
