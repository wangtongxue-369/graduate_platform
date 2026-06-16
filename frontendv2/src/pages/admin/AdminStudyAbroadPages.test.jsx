import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminStudyAbroadCasesPage from './AdminStudyAbroadCasesPage.jsx'
import AdminStudyAbroadExperiencesPage from './AdminStudyAbroadExperiencesPage.jsx'
import AdminStudyAbroadProgramsPage from './AdminStudyAbroadProgramsPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: '管理员',
    role: 'admin',
  },
  token: 'remote-token',
}))

const apiMocks = vi.hoisted(() => ({
  adminStudyAbroadApi: {
    dashboard: vi.fn(),
    schools: vi.fn(),
    createSchool: vi.fn(),
    updateSchool: vi.fn(),
    deleteSchool: vi.fn(),
    admissionCases: vi.fn(),
    deleteAdmissionCase: vi.fn(),
    experiences: vi.fn(),
    deleteExperience: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => apiMocks)

function renderPage(node) {
  return render(
    <MemoryRouter>
      {node}
    </MemoryRouter>,
  )
}

describe('admin study abroad pages', () => {
  beforeEach(() => {
    authState.user = {
      id: 1,
      name: '管理员',
      role: 'admin',
    }
    authState.token = 'remote-token'

    Object.values(apiMocks.adminStudyAbroadApi).forEach((fn) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
    })
  })

  it('renders the admin study abroad programs page and creates school programs through a drawer', async () => {
    apiMocks.adminStudyAbroadApi.schools.mockResolvedValue({
      content: [
        { id: 101, country: 'UK', schoolName: 'UCL', programName: 'MSc CS', degree: 'Master', subjectArea: 'Computer Science' },
      ],
      totalPages: 1,
      totalElements: 1,
    })
    apiMocks.adminStudyAbroadApi.createSchool.mockResolvedValue({
      id: 102,
      country: 'UK',
      schoolName: 'LSE',
      programName: 'MSc DS',
      degree: 'Master',
      subjectArea: 'Data Science',
    })

    renderPage(<AdminStudyAbroadProgramsPage />)

    expect(await screen.findByText('UCL')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '新建院校项目' }))
    fireEvent.change(screen.getByLabelText('院校名称'), { target: { value: 'LSE' } })
    fireEvent.change(screen.getByLabelText('项目名称'), { target: { value: 'MSc DS' } })
    fireEvent.click(screen.getByRole('button', { name: '保存院校项目' }))

    await waitFor(() => {
      expect(apiMocks.adminStudyAbroadApi.createSchool).toHaveBeenCalledWith(
        expect.objectContaining({ schoolName: 'LSE', programName: 'MSc DS' }),
        'remote-token',
      )
    })
  })

  it('lists study abroad cases and deletes selected records', async () => {
    apiMocks.adminStudyAbroadApi.admissionCases.mockResolvedValue({
      content: [
        { id: 201, applicationYear: '2026', school: 'UCL', program: 'MSc CS', admissionResult: 'admit', studentMajor: 'Computer Science', gpa: '3.8', summary: '案例总结' },
      ],
      totalPages: 1,
      totalElements: 1,
    })
    apiMocks.adminStudyAbroadApi.deleteAdmissionCase.mockResolvedValue({})

    renderPage(<AdminStudyAbroadCasesPage />)

    expect(await screen.findByText('UCL')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    fireEvent.click(await screen.findByRole('button', { name: '删除案例' }))

    await waitFor(() => {
      expect(apiMocks.adminStudyAbroadApi.deleteAdmissionCase).toHaveBeenCalledWith(201, 'remote-token')
    })
  })

  it('lists study abroad experiences and deletes selected records', async () => {
    apiMocks.adminStudyAbroadApi.experiences.mockResolvedValue({
      content: [
        { id: 301, title: '文书复盘', country: 'UK', topic: 'Writing', authorName: '作者 A', readTime: '5 min', summary: 'PS 迭代经验', content: '正文' },
      ],
      totalPages: 1,
      totalElements: 1,
    })
    apiMocks.adminStudyAbroadApi.deleteExperience.mockResolvedValue({})

    renderPage(<AdminStudyAbroadExperiencesPage />)

    expect(await screen.findByText('文书复盘')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    fireEvent.click(await screen.findByRole('button', { name: '删除经验' }))

    await waitFor(() => {
      expect(apiMocks.adminStudyAbroadApi.deleteExperience).toHaveBeenCalledWith(301, 'remote-token')
    })
  })
})
