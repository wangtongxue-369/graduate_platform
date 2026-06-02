import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreferencesProvider } from '../context/PreferencesContext.jsx'
import PreferencesPanel from './PreferencesPanel.jsx'

function renderPanel() {
  return render(
    <PreferencesProvider>
      <PreferencesPanel />
    </PreferencesProvider>,
  )
}

describe('PreferencesPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  it('opens and closes the preferences dialog', async () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /open display preferences/i }))
    expect(screen.getByRole('dialog', { name: /显示偏好/i })).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /显示偏好/i })).toBeNull()
    })
  })

  it('updates the font scale through the slider and shows the current percent', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /open display preferences/i }))

    const slider = screen.getByLabelText(/font scale/i)
    fireEvent.change(slider, { target: { value: '1.1' } })

    expect(screen.getByText('110%')).toBeTruthy()
  })

  it('switches theme from the panel and resets back to system defaults', async () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /open display preferences/i }))

    const darkThemeButton = screen.getByRole('button', { name: /theme dark/i })
    fireEvent.click(darkThemeButton)

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })

    expect(darkThemeButton.getAttribute('aria-pressed')).toBe('true')

    fireEvent.change(screen.getByLabelText(/font scale/i), { target: { value: '1.125' } })
    fireEvent.click(screen.getByRole('button', { name: /reset display preferences/i }))

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light')
    })

    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getByRole('button', { name: /theme system/i }).getAttribute('aria-pressed')).toBe('true')
  })
})
