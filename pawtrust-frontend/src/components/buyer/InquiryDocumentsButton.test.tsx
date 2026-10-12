import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InquiryDocumentsButton } from './InquiryDocumentsButton'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

const mockGetInquiryDocuments = vi.fn()

vi.mock('@/api/inquiry.api', () => ({
  getInquiryDocuments: (...args: unknown[]) => mockGetInquiryDocuments(...args),
}))

const mockToast = vi.hoisted(() => {
  const fn = vi.fn() as unknown as { (msg: string): void; error: ReturnType<typeof vi.fn> }
  fn.error = vi.fn()
  return fn
})

vi.mock('react-hot-toast', () => ({
  default: mockToast,
}))

function renderComponent(inquiryId = 1) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <InquiryDocumentsButton inquiryId={inquiryId} />
    </QueryClientProvider>
  )
}

describe('InquiryDocumentsButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with "View Documents" label', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: /view documents/i })).toBeInTheDocument()
  })

  it('on click calls getInquiryDocuments with correct inquiryId', async () => {
    mockGetInquiryDocuments.mockResolvedValue({ data: { data: [] } })

    renderComponent(42)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockGetInquiryDocuments).toHaveBeenCalledWith(42)
    })
  })

  it('on success with documents opens a tab for each document', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    mockGetInquiryDocuments.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            document_type: 'kennel_cert',
            filename: 'a.pdf',
            url: 'http://a',
            expires_at: '',
          },
          {
            id: 2,
            document_type: 'vet_record',
            filename: 'b.pdf',
            url: 'http://b',
            expires_at: '',
          },
        ],
      },
    })

    renderComponent()
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledTimes(2)
    })
    expect(openSpy).toHaveBeenCalledWith('http://a', '_blank', 'noopener,noreferrer')
    expect(openSpy).toHaveBeenCalledWith('http://b', '_blank', 'noopener,noreferrer')

    openSpy.mockRestore()
  })

  it('on success with empty array shows toast and does not open a tab', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    mockGetInquiryDocuments.mockResolvedValue({ data: { data: [] } })

    renderComponent()
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled()
    })
    expect(openSpy).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })

  it('shows loading state while fetching', async () => {
    let resolveFn: (value: unknown) => void = () => {}
    mockGetInquiryDocuments.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve
      })
    )

    renderComponent()
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })

    resolveFn({ data: { data: [] } })
  })

  it('on error shows error toast', async () => {
    mockGetInquiryDocuments.mockRejectedValue(new Error('network error'))

    renderComponent()
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled()
    })
  })
})
