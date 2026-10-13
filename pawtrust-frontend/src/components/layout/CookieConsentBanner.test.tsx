import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { CookieConsentBanner } from './CookieConsentBanner'

const CONSENT_KEY = 'pawtrust_cookie_consent'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}))

describe('CookieConsentBanner', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('is shown when no consent is stored', () => {
    render(<CookieConsentBanner />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('is hidden after clicking "Accept all"', () => {
    render(<CookieConsentBanner />)
    fireEvent.click(screen.getByText('Accept all'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is hidden after clicking "Reject non-essential"', () => {
    render(<CookieConsentBanner />)
    fireEvent.click(screen.getByText('Reject non-essential'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('persists the decision in localStorage', () => {
    render(<CookieConsentBanner />)
    fireEvent.click(screen.getByText('Accept all'))
    expect(localStorage.getItem(CONSENT_KEY)).toBe('accepted')
  })

  it('is not shown on re-render after consent was already given', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    render(<CookieConsentBanner />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
