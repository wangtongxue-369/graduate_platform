import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PageIntro from './PageIntro.jsx'

describe('PageIntro', () => {
  it('renders breadcrumb-style path items when provided', () => {
    render(
      <MemoryRouter>
        <PageIntro
          kicker="题库预览"
          title="英语阅读训练"
          pathItems={[
            { label: '题库目录', to: '/practice' },
            { label: '英语阅读训练' },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '题库目录' })).toHaveAttribute('href', '/practice')
    expect(screen.getByRole('heading', { name: '英语阅读训练' })).toBeInTheDocument()
  })
})
