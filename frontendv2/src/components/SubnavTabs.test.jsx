import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SubnavTabs from './SubnavTabs.jsx'

describe('SubnavTabs', () => {
  it('renders a badge when a tab provides unread message metadata', () => {
    render(
      <MemoryRouter initialEntries={['/community/notifications']}>
        <SubnavTabs
          items={[
            { label: '社区目录', to: '/community' },
            { label: '消息通知', to: '/community/notifications', badge: '12' },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByLabelText('消息通知 未读 12')).toBeInTheDocument()
  })
})
