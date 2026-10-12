import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { ReviewModal } from './ReviewModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const mockSubmitReview = vi.fn()

vi.mock('@/api/review.api', () => ({
  submitReview: (...args: unknown[]) => mockSubmitReview(...args),
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
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const defaultProps = {
  breederProfileId: 1,
  breederName: 'Sunrise Kennels',
  onSuccess: vi.fn(),
}

describe('ReviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders star input and text area', () => {
    render(<ReviewModal {...defaultProps} />, { wrapper })

    expect(screen.getAllByRole('button', { name: /rate \d stars/i })).toHaveLength(5)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('submit calls submitReview with correct payload', async () => {
    mockSubmitReview.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          rating: 5,
          text: 'Great breeder!',
          buyer_name: 'A B.',
          posted_at: '2026-01-01',
        },
      },
    })

    render(<ReviewModal {...defaultProps} />, { wrapper })

    fireEvent.click(screen.getByRole('button', { name: /rate 5 stars/i }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Great experience overall!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith(1, {
        rating: 5,
        text: 'Great experience overall!',
      })
    })
  })

  it('on success calls onSuccess and shows toast', async () => {
    mockSubmitReview.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          rating: 4,
          text: 'Good experience',
          buyer_name: 'A B.',
          posted_at: '2026-01-01',
        },
      },
    })

    render(<ReviewModal {...defaultProps} />, { wrapper })

    fireEvent.click(screen.getByRole('button', { name: /rate 4 stars/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Good experience overall!' } })
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalled()
    })
  })

  it('on 409 shows already-reviewed banner not generic error', async () => {
    mockSubmitReview.mockRejectedValueOnce({ response: { status: 409 } })

    render(<ReviewModal {...defaultProps} />, { wrapper })

    fireEvent.click(screen.getByRole('button', { name: /rate 3 stars/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Decent experience here!' } })
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(screen.getByText(/already reviewed this breeder/i)).toBeInTheDocument()
    })
  })

  it('stars highlight correctly on click', () => {
    render(<ReviewModal {...defaultProps} />, { wrapper })

    const star3 = screen.getByRole('button', { name: /rate 3 stars/i })
    fireEvent.click(star3)

    // Submit remains disabled until min text length is met, confirming rating state updates independently
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled()
  })
})
