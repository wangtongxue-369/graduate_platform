import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaoyanStudyRoomsPage from '@/pages/student/kaoyan/KaoyanStudyRoomsPage.jsx'

const authState = vi.hoisted(() => ({
  token: 'remote-token',
}))

const apiMocks = vi.hoisted(() => ({
  studyRoomApi: {
    roomList: vi.fn(),
    createRoom: vi.fn(),
    myCurrentRoom: vi.fn(),
    myCreatedRooms: vi.fn(),
  },
  kaoyanApi: {
    schoolsPage: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', async () => {
  const actual = await vi.importActual('@legacy/lib/api.js')
  return {
    ...actual,
    kaoyanApi: {
      ...actual.kaoyanApi,
      schoolsPage: apiMocks.kaoyanApi.schoolsPage,
    },
    studyRoomApi: {
      ...actual.studyRoomApi,
      roomList: apiMocks.studyRoomApi.roomList,
      createRoom: apiMocks.studyRoomApi.createRoom,
      myCurrentRoom: apiMocks.studyRoomApi.myCurrentRoom,
      myCreatedRooms: apiMocks.studyRoomApi.myCreatedRooms,
    },
  }
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/station/kaoyan/support/rooms']}>
      <Routes>
        <Route path="/station/kaoyan/support/rooms" element={<KaoyanStudyRoomsPage />} />
        <Route path="/station/kaoyan/support/rooms/:roomId" element={<div>房间占位</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('KaoyanStudyRoomsPage modal layout', () => {
  beforeEach(() => {
    authState.token = 'remote-token'
    Object.values(apiMocks).forEach((group) => {
      Object.values(group).forEach((fn) => fn.mockReset())
    })

    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [{ id: 1, name: '华东师范大学' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.studyRoomApi.myCurrentRoom.mockResolvedValue({
      id: 19,
      roomId: 19,
      name: '政治晨读房',
    })
    apiMocks.studyRoomApi.myCreatedRooms.mockResolvedValue([
      { id: 31, name: '教育学晚自习', schoolName: '华东师范大学', major: '教育学', createdAt: '2026-06-12T21:00:00' },
    ])
    apiMocks.studyRoomApi.roomList
      .mockResolvedValueOnce({
        content: [
          {
            id: 7,
            name: '晨间背书房',
            schoolName: '华东师范大学',
            major: '教育学',
            memberCount: 18,
            createdByName: '阿周',
            createdAt: '2026-06-12T09:00:00',
          },
        ],
        totalElements: 15,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 8,
            name: '晚间刷题房',
            schoolName: '华东师范大学',
            major: '教育学',
            memberCount: 12,
            createdByName: '小林',
            createdAt: '2026-06-12T20:00:00',
          },
        ],
        totalElements: 15,
        totalPages: 2,
      })
    apiMocks.studyRoomApi.createRoom.mockResolvedValue({ id: 41 })
  })

  it('keeps filters and shortcuts in one sidebar card and creates rooms through a modal', async () => {
    renderPage()

    expect(await screen.findByText('晨间背书房')).toBeInTheDocument()
    expect(screen.getByText('政治晨读房')).toBeInTheDocument()
    expect(document.querySelectorAll('.v2-side-column .v2-side-card')).toHaveLength(1)
    expect(screen.queryByRole('heading', { name: '继续当前房间，或管理你创建的房间' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('目标院校'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('专业方向'), {
      target: { value: '教育学' },
    })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(apiMocks.studyRoomApi.roomList).toHaveBeenLastCalledWith({
        schoolId: '1',
        major: '教育学',
        page: 0,
        size: 10,
      })
    })

    fireEvent.click(screen.getByRole('button', { name: '新建房间' }))

    const createDialog = await screen.findByRole('dialog', { name: '新建同频自习室' })
    fireEvent.change(within(createDialog).getByLabelText('房间名称'), {
      target: { value: '新建冲刺房' },
    })
    fireEvent.change(within(createDialog).getByLabelText('目标院校'), {
      target: { value: '1' },
    })
    fireEvent.change(within(createDialog).getByLabelText('创建专业'), {
      target: { value: '教育学' },
    })
    fireEvent.click(within(createDialog).getByRole('button', { name: '创建并进入' }))

    await waitFor(() => {
      expect(apiMocks.studyRoomApi.createRoom).toHaveBeenCalledWith({
        name: '新建冲刺房',
        schoolId: 1,
        major: '教育学',
      }, 'remote-token')
    })
    expect(await screen.findByText('房间占位')).toBeInTheDocument()
  })

  it('keeps current-room and created-room shortcuts in the sidebar card', async () => {
    renderPage()

    expect(await screen.findByLabelText('当前在房快捷入口')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '继续当前房间' })).toBeInTheDocument()
    expect(screen.getByLabelText('我创建的房间快捷入口')).toBeInTheDocument()
    expect(screen.getByText('教育学晚自习')).toBeInTheDocument()
  })
})
