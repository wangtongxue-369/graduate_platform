import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import KaogongStationPage from './kaogong/KaogongStationPage.jsx'
import KaoyanStationPage from './kaoyan/KaoyanStationPage.jsx'
import StudyAbroadStationPage from './studyabroad/StudyAbroadStationPage.jsx'

describe('direction stations', () => {
  it('renders the kaoyan station as a school board plus plan ledger', () => {
    render(
      <MemoryRouter>
        <KaoyanStationPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '复习台账' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '院校对照板' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '计划推进栏' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '资料柜' })).toBeInTheDocument()
  })

  it('renders the kaogong station as a radar room instead of metric cards', () => {
    render(
      <MemoryRouter>
        <KaogongStationPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '报考雷达室' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '报考热区' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '分数线账本' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '考试日历墙' })).toBeInTheDocument()
  })

  it('renders the studyabroad station as a dossier and route board', () => {
    render(
      <MemoryRouter>
        <StudyAbroadStationPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '申请航线图' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '项目目录册' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '案例卷宗' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '时间线轨道' })).toBeInTheDocument()
  })
})
