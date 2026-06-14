import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const studyRoomPageSource = readFileSync(
  resolve(import.meta.dirname, './pages/kaoyan/StudyRoomPage.jsx'),
  'utf8',
)
const studyRoomServiceSource = readFileSync(
  resolve(
    import.meta.dirname,
    '../../backend/src/main/java/com/graduateplatform/kaoyan/service/StudyRoomService.java',
  ),
  'utf8',
)

describe('study room real-time updates (members + leaderboard)', () => {
  it('connects via SSE and keeps the members list real-time on join/leave', () => {
    // The members list is already kept in sync with backend SSE
    // member-joined / member-left events. The handler is bounded by the
    // trailing `source.onerror` registration so we capture the whole body.
    const sseHandler = studyRoomPageSource.match(
      /source\.addEventListener\(['"]room-update['"][\s\S]*?\n\s+\}\)\s*\n\s*source\.onerror/,
    )
    expect(sseHandler, 'SSE room-update handler must exist').not.toBeNull()
    expect(sseHandler[0]).toMatch(/'member-joined'/)
    expect(sseHandler[0]).toMatch(/'member-left'/)
  })

  it('drops the 60s leaderboard polling in favor of SSE events', () => {
    // The old 60s setInterval was the only thing refreshing the
    // leaderboard. With real-time updates it must be gone — otherwise we
    // are double-fetching and the leaderboard is no longer purely
    // event-driven.
    expect(studyRoomPageSource).not.toMatch(/setInterval\([^,]+,\s*60000\)/)
  })

  it('handles leaderboard-update SSE events in connectSSE', () => {
    // Backend now emits a "leaderboard-update" event on every
    // join/leave/close. The handler must update setLeaderboard when the
    // payload period matches what the user is viewing.
    const sseHandler = studyRoomPageSource.match(
      /source\.addEventListener\(['"]room-update['"][\s\S]*?\n\s+\}\)\s*\n\s*source\.onerror/,
    )
    expect(sseHandler, 'SSE room-update handler must exist').not.toBeNull()
    expect(sseHandler[0]).toMatch(/'leaderboard-update'/)
    expect(sseHandler[0]).toMatch(/setLeaderboard\(/)
  })

  it('reads activePeriod via a ref so the SSE closure cannot go stale', () => {
    // The SSE handler is registered once when entering a room. If it
    // read `activePeriod` directly, switching tabs later would not update
    // what the handler checks. The fix is to mirror activePeriod into a
    // ref so the handler always sees the freshest value.
    expect(studyRoomPageSource).toMatch(/activePeriodRef/)
    expect(studyRoomPageSource).toMatch(/activePeriodRef\.current/)
  })

  it('still does an initial leaderboard fetch on room entry / period change', () => {
    // The initial REST fetch on enter/tab-switch is still useful: the
    // first SSE push only arrives after the next join/leave event, so the
    // first paint of the leaderboard comes from this fetch.
    expect(studyRoomPageSource).toMatch(
      /useEffect\(\(\)\s*=>\s*\{[\s\S]*?loadLeaderboard\(currentRoom\.id,\s*activePeriod\)[\s\S]*?\}, \[view, currentRoom, activePeriod]\)/,
    )
  })

  it('backend emits leaderboard-update on every membership change', () => {
    // joinRoom / leaveRoom / closeRoom must each call the helper that
    // pushes a fresh leaderboard snapshot. The helper centralizes the
    // period="all" choice so we don't broadcast three periods on every
    // event.
    expect(studyRoomServiceSource).toMatch(/private\s+void\s+emitLeaderboardUpdate\(/)
    const joinBlock = studyRoomServiceSource.match(
      /public\s+Map<String,\s*Object>\s+joinRoom[\s\S]*?\n    \}\s*\n/,
    )
    expect(joinBlock, 'joinRoom must exist').not.toBeNull()
    expect(joinBlock[0]).toMatch(/emitLeaderboardUpdate\(roomId,\s*"all"\)/)

    const leaveBlock = studyRoomServiceSource.match(
      /public\s+void\s+leaveRoom[\s\S]*?\n    \}\s*\n/,
    )
    expect(leaveBlock, 'leaveRoom must exist').not.toBeNull()
    expect(leaveBlock[0]).toMatch(/emitLeaderboardUpdate\(roomId,\s*"all"\)/)

    const closeBlock = studyRoomServiceSource.match(
      /public\s+void\s+closeRoom[\s\S]*?\n    \}\s*\n/,
    )
    expect(closeBlock, 'closeRoom must exist').not.toBeNull()
    expect(closeBlock[0]).toMatch(/emitLeaderboardUpdate\(roomId,\s*"all"\)/)
  })

  it('leaderboard-update payload shape matches what the frontend expects', () => {
    // The helper emits { period: "all", board: [...] }. The frontend
    // reads both fields, so both must be present.
    const helper = studyRoomServiceSource.match(
      /private\s+void\s+emitLeaderboardUpdate\([\s\S]*?\n    \}\s*\n/,
    )
    expect(helper, 'emitLeaderboardUpdate must exist').not.toBeNull()
    expect(helper[0]).toMatch(/"period"/)
    expect(helper[0]).toMatch(/"board"/)
    expect(helper[0]).toMatch(/getLeaderboard\(roomId,\s*period\)/)
  })

  it('backend embeds the active sessionStartedAt in each leaderboard row', () => {
    // The frontend needs the active session's startedAt to tick each
    // user's duration badge locally; the backend must include it in every
    // leaderboard entry that has an open session.
    const leaderboardFn = studyRoomServiceSource.match(
      /public\s+List<Map<String,\s*Object>>\s+getLeaderboard\([\s\S]*?\n    \}\s*\n/,
    )
    expect(leaderboardFn, 'getLeaderboard must exist').not.toBeNull()
    expect(leaderboardFn[0]).toMatch(/findByUserIdAndRoomIdAndEndedAtIsNull/)
    expect(leaderboardFn[0]).toMatch(/sessionStartedAt/)
  })

  it('frontend ticks the wall clock every second while in a room', () => {
    // Each leaderboard row reads from the tick state so it can show the
    // running duration. The tick effect must be active only inside the
    // room view and tear down on exit.
    const tickEffect = studyRoomPageSource.match(
      /useEffect\(\(\)\s*=>\s*\{[\s\S]*?setInterval\(\(\)\s*=>\s*setTickNow\(Date\.now\(\)\),\s*1000\)[\s\S]*?\},\s*\[view\]\)/,
    )
    expect(tickEffect, '1s tickNow effect must exist').not.toBeNull()
    expect(studyRoomPageSource).toMatch(/setTickNow\(/)
    expect(studyRoomPageSource).toMatch(/const\s+\[tickNow/)
  })

  it('leaderboard render uses leaderboardDisplaySeconds with the tick', () => {
    // The row JSX must read the tick so the duration re-renders each
    // second. The helper itself adds sessionStartedAt's elapsed to the
    // backend's snapshot.
    expect(studyRoomPageSource).toMatch(/function\s+leaderboardDisplaySeconds\(/)
    expect(studyRoomPageSource).toMatch(/leaderboardDisplaySeconds\(entry,\s*tickNow\)/)
  })

  it('RoomView receives the tickNow prop so the row can re-render', () => {
    // The parent passes tickNow down to RoomView which uses it in the
    // leaderboard row's duration badge.
    const roomViewProps = studyRoomPageSource.match(
      /function\s+RoomView\(\{[\s\S]*?\}\)\s*\{/,
    )
    expect(roomViewProps, 'RoomView prop destructure must exist').not.toBeNull()
    expect(roomViewProps[0]).toMatch(/\btickNow\b/)

    const roomViewUsage = studyRoomPageSource.match(
      /<RoomView[\s\S]*?\/>/,
    )
    expect(roomViewUsage, '<RoomView ... /> call must exist').not.toBeNull()
    expect(roomViewUsage[0]).toMatch(/tickNow=\{tickNow\}/)
  })

  it('backend leaderboard includes both active and departed members', () => {
    // Switched from findByRoomIdAndLeftAtIsNull to findByRoomId so
    // departed members stay visible with their frozen final duration.
    const leaderboardFn = studyRoomServiceSource.match(
      /public\s+List<Map<String,\s*Object>>\s+getLeaderboard\([\s\S]*?\n    \}\s*\n/,
    )
    expect(leaderboardFn, 'getLeaderboard must exist').not.toBeNull()
    expect(leaderboardFn[0]).toMatch(/memberRepository\.findByRoomId\(roomId\)/)
    expect(leaderboardFn[0]).not.toMatch(/findByRoomIdAndLeftAtIsNull/)
    expect(leaderboardFn[0]).toMatch(/"leftAt"/)
  })

  it('frontend shows a (已离开) badge for departed leaderboard rows', () => {
    // The leaderboard row must visually distinguish departed members so
    // users understand why their duration isn't ticking anymore.
    expect(studyRoomPageSource).toMatch(/entry\.leftAt\s*\?/)
    expect(studyRoomPageSource).toMatch(/已离开/)
  })
})
