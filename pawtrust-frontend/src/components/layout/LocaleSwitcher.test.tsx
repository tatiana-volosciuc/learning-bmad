import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocaleSwitcher } from './LocaleSwitcher'

const mockChangeLanguage = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      resolvedLanguage: 'ro',
      language: 'ro',
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

describe('LocaleSwitcher', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders RO and RU buttons only', () => {
    render(<LocaleSwitcher />)
    expect(screen.getByRole('button', { name: 'RO' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'EN' })).not.toBeInTheDocument()
  })

  it('clicking RU calls i18n.changeLanguage with "ru"', () => {
    render(<LocaleSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'RU' }))
    expect(mockChangeLanguage).toHaveBeenCalledWith('ru')
  })

  it('active language button (RO) has bold/underline class', () => {
    render(<LocaleSwitcher />)
    const roBtn = screen.getByRole('button', { name: 'RO' })
    expect(roBtn.className).toContain('font-bold')
    expect(roBtn.className).toContain('underline')
  })
})
