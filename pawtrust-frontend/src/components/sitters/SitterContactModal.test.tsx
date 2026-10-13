import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { type ReactNode } from 'react'
import { SitterContactModal } from './SitterContactModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const mockContactSitter = vi.fn()

vi.mock('@/api/sitter.api', () => ({
  contactSitter: (...args: unknown[]) => mockContactSitter(...args),
}))

const mockToast = vi.hoisted(() => {
  const fn = vi.fn() as unknown as { (msg: string): void; success: ReturnType<typeof vi.fn> }
  fn.success = vi.fn()
  return fn
})

vi.mock('react-hot-toast', () => ({
  default: mockToast,
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const defaultProps = {
  sitterId: 1,
  sitterName: 'Ana Sitter',
  onSuccess: vi.fn(),
}

describe('SitterContactModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name, email, message fields', () => {
    render(<SitterContactModal {...defaultProps} />, { wrapper })

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('submit calls contactSitter with correct payload', async () => {
    mockContactSitter.mockResolvedValueOnce({ data: { message: 'Your message has been sent.' } })

    render(<SitterContactModal {...defaultProps} />, { wrapper })

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'John Buyer' } })
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Could you watch my dog next week?' },
    })

    fireEvent.click(screen.getByRole('button', { name: /contact/i }))

    await waitFor(() => {
      expect(mockContactSitter).toHaveBeenCalledWith(1, {
        name: 'John Buyer',
        email: 'john@example.com',
        message: 'Could you watch my dog next week?',
      })
    })
  })

  it('shows rate limited banner on 429 response', async () => {
    mockContactSitter.mockRejectedValueOnce({ response: { status: 429 } })

    render(<SitterContactModal {...defaultProps} />, { wrapper })

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'John Buyer' } })
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Could you watch my dog next week?' },
    })

    fireEvent.click(screen.getByRole('button', { name: /contact/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/too many messages/i)
    })
  })
})
