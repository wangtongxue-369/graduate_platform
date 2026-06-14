import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { mentorApi, studyRoomApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createEmptyRoomForm,
  createKaoyanSupportPreview,
  normalizeSupportRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function KaoyanSupportOverviewPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    school: '',
    major: '',
    expertise: '',
  })
  const [support, setSupport] = useState(createKaoyanSupportPreview())
  const [notice, setNotice] = useState(previewDataNotice('陪跑协同'))
  const [loading, setLoading] = useState(false)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [roomForm, setRoomForm] = useState(createEmptyRoomForm())

  async function loadSupport() {
    if (!canUseRemote) {
      setSupport(createKaoyanSupportPreview())
      setNotice(previewDataNotice('陪跑协同'))
      return
    }

    setLoading(true)
    try {
      const [mentorsData, roomsData, unreadData] = await withRequestTimeout(
        Promise.all([
          mentorApi.mentorsPage({
            graduateSchool: filters.school.trim(),
            major: filters.major.trim(),
            expertiseSubjects: filters.expertise.trim(),
            page: 0,
            size: 8,
          }),
          studyRoomApi.roomList({
            major: filters.major.trim(),
            page: 0,
            size: 8,
          }),
          mentorApi.unreadCount(token).catch(() => ({ count: 0 })),
        ]),
        8000,
        '陪跑协同数据读取超时，请检查后端服务。',
      )
      setSupport(normalizeSupportRows(mentorsData, roomsData, unreadData))
      setNotice(remoteDataNotice('陪跑协同'))
    } catch (error) {
      setSupport(createKaoyanSupportPreview())
      setNotice(fallbackDataNotice('陪跑协同', error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSupport()
  }, [canUseRemote, filters.expertise, filters.major, filters.school, token])

  async function handleCreateSession(mentorId) {
    if (!canUseRemote || !token) return
    try {
      const session = await mentorApi.createSession({ mentorId }, token)
      navigate('/station/kaoyan/support/messages', { state: { sessionId: session?.id } })
    } catch (error) {
      setNotice(error.message || '咨询会话创建失败')
    }
  }

  async function handleCreateRoom(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return
    if (!roomForm.name.trim()) {
      setNotice('请先填写自习室名称。')
      return
    }

    setCreatingRoom(true)
    try {
      const room = await studyRoomApi.createRoom({
        name: roomForm.name.trim(),
        schoolId: roomForm.schoolId ? Number(roomForm.schoolId) : null,
        major: roomForm.major.trim() || null,
      }, token)
      setRoomForm(createEmptyRoomForm())
      navigate(`/station/kaoyan/support/rooms/${room.id}`)
    } catch (error) {
      setNotice(error.message || '自习室创建失败')
    } finally {
      setCreatingRoom(false)
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="陪跑协同"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '陪跑协同' },
          ]}
          title="把学长学姐咨询和同频自习室放在同一张协同调度板里。"
          lead="左侧看资源质量，右侧再决定是发起咨询、处理消息，还是直接进入房间。"
          actions={(
            <>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/mentors/apply">学长学姐入驻</Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/messages">咨询消息</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步协同资源…</div> : null}

        <section className="v2-summary-strip" aria-label="协同摘要">
          <article className="v2-summary-card">
            <span>学长学姐</span>
            <strong>{support.seniors?.length || support.mentors?.length || 0}</strong>
            <p>先看谁能回答你当前阶段最关键的问题。</p>
          </article>
          <article className="v2-summary-card">
            <span>自习室</span>
            <strong>{support.rooms.length}</strong>
            <p>房间页只负责实时协作，列表和筛选留在总览里处理。</p>
          </article>
          <article className="v2-summary-card">
            <span>未读咨询</span>
            <strong>{support.unreadCount || 0}</strong>
            <p>从这里直接跳去消息页，不需要在旧大页里来回切换。</p>
          </article>
        </section>

        <section className="v2-split-board">
          <article className="v2-article-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">学长学姐咨询池</p>
                <strong>按目标院校、专业方向和擅长科目缩小范围。</strong>
              </div>
            </div>
            <div className="v2-check-list">
              {(support.mentors || support.seniors || []).map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.nickname}</strong>
                  <span>{item.graduateSchool} / {item.major}</span>
                  <span>{item.expertiseSubjects}</span>
                  <span>{item.bio}</span>
                  <div className="v2-inline-actions">
                    <button className="v2-segment-button is-active" type="button" onClick={() => handleCreateSession(item.id)}>
                      发起咨询
                    </button>
                  </div>
                </div>
              ))}
              {!(support.mentors || support.seniors || []).length ? <p>当前筛选下还没有匹配到学长学姐。</p> : null}
            </div>
          </article>

          <article className="v2-article-card">
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">同频自习室</p>
                <strong>房间列表负责择场，进入后再做实时消息和排行协作。</strong>
              </div>
            </div>
            <div className="v2-check-list">
              {support.rooms.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.schoolName} / {item.major}</span>
                  <span>{item.memberCount} 人在线 / {item.createdByName}</span>
                  <span>{formatDateTimeLabel(item.createdAt)}</span>
                  <div className="v2-inline-actions">
                    <Link className="v2-secondary-link" to={`/station/kaoyan/support/rooms/${item.id}`}>进入房间</Link>
                  </div>
                </div>
              ))}
              {!support.rooms.length ? <p>当前筛选下还没有匹配到自习室。</p> : null}
            </div>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>目标院校</span>
              <input
                type="text"
                value={filters.school}
                placeholder="例如：浙江大学"
                onChange={(event) => setFilters((current) => ({ ...current, school: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                type="text"
                value={filters.major}
                placeholder="例如：计算机科学与技术"
                onChange={(event) => setFilters((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>擅长科目</span>
              <input
                type="text"
                value={filters.expertise}
                placeholder="例如：英语 / 政治 / 专业课"
                onChange={(event) => setFilters((current) => ({ ...current, expertise: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">新建自习室</p>
          <form className="v2-filter-form" onSubmit={handleCreateRoom}>
            <label className="v2-field">
              <span>房间名称</span>
              <input
                type="text"
                value={roomForm.name}
                placeholder="例如：浙大计算机早读房"
                onChange={(event) => setRoomForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>目标院校 ID</span>
              <input
                type="number"
                value={roomForm.schoolId}
                placeholder="旧后端按 schoolId 创建"
                onChange={(event) => setRoomForm((current) => ({ ...current, schoolId: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                type="text"
                value={roomForm.major}
                placeholder="例如：计算机科学与技术"
                onChange={(event) => setRoomForm((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <button className="v2-segment-button is-active" disabled={creatingRoom || !canUseRemote} type="submit">
              {creatingRoom ? '创建中…' : '创建并进入'}
            </button>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">进入建议</p>
          <ul>
            <li>先用院校和专业缩小范围，再判断是去找学长学姐还是直接进房间。</li>
            <li>咨询页负责 1 对 1 沟通，自习室页负责同频打卡和群聊。</li>
            <li>总览只做分流，不再塞进旧版那种混合大页。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
