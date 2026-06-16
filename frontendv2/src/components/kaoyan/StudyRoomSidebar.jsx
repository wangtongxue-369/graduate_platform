import { formatDateTimeLabel } from '@/lib/stationData.js'

function formatDuration(seconds) {
  const total = Number(seconds || 0)
  if (!total) return '0 分钟'
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes || 1} 分钟`
}

export default function StudyRoomSidebar({
  room,
  members,
  leaderboard,
  activePeriod,
  currentRoom,
  createdRooms,
  canJoin,
  canLeave,
  canClose,
  onPeriodChange,
  onJoinRoom,
  onLeaveRoom,
  onCloseRoom,
}) {
  return (
    <>
      <section className="v2-side-card">
        <div className="v2-side-card__head">
          <div>
            <p className="v2-kicker">房间状态</p>
            <strong>{room.name}</strong>
          </div>
        </div>
        <div className="v2-check-list">
          <div className="v2-check-row">
            <strong>目标方向</strong>
            <span>{room.schoolName} / {room.major}</span>
          </div>
          <div className="v2-check-row">
            <strong>成员规模</strong>
            <span>{room.memberCount} 人</span>
          </div>
          <div className="v2-check-row">
            <strong>当前状态</strong>
            <span>{room.closed ? '已关闭' : '开放中'}</span>
          </div>
          <div className="v2-inline-actions">
            {canJoin ? <button className="v2-segment-button is-active" type="button" onClick={onJoinRoom}>加入房间</button> : null}
            {canLeave ? <button className="v2-segment-button" type="button" onClick={onLeaveRoom}>退出房间</button> : null}
            {canClose ? <button className="v2-segment-button" type="button" onClick={onCloseRoom}>关闭房间</button> : null}
          </div>
        </div>
      </section>

      <section className="v2-side-card">
        <p className="v2-kicker">学习排行</p>
        <div className="v2-segment-group" role="group" aria-label="排行周期">
          {[
            { value: 'all', label: '全部' },
            { value: 'week', label: '本周' },
            { value: 'day', label: '今天' },
          ].map((item) => (
            <button
              className={`v2-segment-button ${activePeriod === item.value ? 'is-active' : ''}`}
              key={item.value}
              type="button"
              onClick={() => onPeriodChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="v2-check-list">
          {leaderboard.map((item, index) => (
            <div className="v2-check-row" key={item.userId}>
              <strong>{index + 1}. {item.userName}</strong>
              <span>{formatDuration(item.durationSeconds || item.totalDurationSeconds)}</span>
            </div>
          ))}
          {!leaderboard.length ? <p>当前周期下还没有排行数据。</p> : null}
        </div>
      </section>

      <section className="v2-side-card">
        <p className="v2-kicker">房间成员</p>
        <div className="v2-check-list">
          {members.map((item) => (
            <div className="v2-check-row" key={item.id || item.userId}>
              <strong>{item.userName}</strong>
              <span>已同步到当前房间成员列表</span>
            </div>
          ))}
          {!members.length ? <p>当前房间暂时还没有成员名单。</p> : null}
        </div>
      </section>

      <section className="v2-side-card">
        <p className="v2-kicker">我的房间</p>
        <div className="v2-check-list">
          {currentRoom?.id ? (
            <div className="v2-check-row">
              <strong>当前所在</strong>
              <span>{currentRoom.name || `房间 ${currentRoom.roomId || currentRoom.id}`}</span>
            </div>
          ) : null}
          {createdRooms.map((item) => (
            <div className="v2-check-row" key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.schoolName || '院校待补充'} / {item.major || '专业待补充'}</span>
              <span>{formatDateTimeLabel(item.createdAt)}</span>
            </div>
          ))}
          {!currentRoom?.id && !createdRooms.length ? <p>当前还没有已加入或已创建的房间。</p> : null}
        </div>
      </section>
    </>
  )
}
