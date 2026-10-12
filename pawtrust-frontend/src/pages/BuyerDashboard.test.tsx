import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BuyerDashboard from './BuyerDashboard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: { user: { id: number; name: string; role: string } }) => unknown) =>
    sel({ user: { id: 1, name: 'Ana', role: 'buyer' } }),
}))

const mockGetBuyerInquiries = vi.fn()
const mockGetBuyerReviews = vi.fn()
const mockGetSavedListings = vi.fn()
const mockUnsaveListing = vi.fn()

vi.mock('@/api/buyer.api', () => ({
  getBuyerInquiries: (...args: unknown[]) => mockGetBuyerInquiries(...args),
  getBuyerReviews: (...args: unknown[]) => mockGetBuyerReviews(...args),
  getSavedListings: (...args: unknown[]) => mockGetSavedListings(...args),
  saveListing: vi.fn(),
  unsaveListing: (...args: unknown[]) => mockUnsaveListing(...args),
}))

vi.mock('@/api/inquiry.api', () => ({
  getInquiryDocuments: vi.fn(),
}))

vi.mock('@/api/review.api', () => ({
  getReviewExists: vi.fn().mockResolvedValue({ data: { data: { has_reviewed: false } } }),
}))

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function emptyPaginated() {
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } }
}

function renderDashboard(initialEntry = '/buyer/dashboard') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <BuyerDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BuyerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBuyerInquiries.mockResolvedValue({ data: emptyPaginated() })
    mockGetBuyerReviews.mockResolvedValue({ data: { data: [] } })
    mockGetSavedListings.mockResolvedValue({ data: emptyPaginated() })
  })

  it('renders three tabs', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('My Inquiries')).toBeInTheDocument()
      expect(screen.getByText('My Reviews')).toBeInTheDocument()
      expect(screen.getByText('Saved Listings')).toBeInTheDocument()
    })
  })

  it('default tab is My Inquiries', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/have not inquired/i)).toBeInTheDocument()
    })
  })

  it('tab change updates URL query param and renders the selected section', async () => {
    renderDashboard()
    await waitFor(() => expect(screen.getByText('My Reviews')).toBeInTheDocument())

    fireEvent.click(screen.getByText('My Reviews'))

    await waitFor(() => {
      expect(screen.getByText(/have not written any reviews/i)).toBeInTheDocument()
    })
  })

  it('shows inquiry cards from mock API on My Inquiries tab', async () => {
    mockGetBuyerInquiries.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            status: 'contact_revealed',
            submitted_at: '2026-01-01T00:00:00.000Z',
            has_reviewed: false,
            listing: {
              id: 5,
              title: 'Golden Retriever Puppy',
              breed: 'Golden Retriever',
              photo_url: null,
            },
            breeder: { id: 2, name: 'Ion Popescu', kennel_name: 'Sunrise Kennels' },
            breeder_contact: { name: 'Ion Popescu', email: 'ion@test.com', phone: null },
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      },
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Golden Retriever Puppy')).toBeInTheDocument()
      expect(screen.getByText('Sunrise Kennels')).toBeInTheDocument()
    })
  })

  it('shows saved listings with filled heart icon and unsave calls API', async () => {
    mockGetSavedListings.mockResolvedValue({
      data: {
        data: [
          {
            id: 9,
            title: 'Persian Kitten',
            species: 'cat',
            breed: 'Persian',
            price: '1200',
            currency: 'MDL',
            location: null,
            main_photo_url: null,
            breeder_name: 'Happy Paws',
            verified: false,
            listing_type: 'standard',
            featured: false,
            created_at: '2026-01-01T00:00:00.000Z',
            is_saved: true,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      },
    })

    renderDashboard()
    fireEvent.click(await screen.findByText('Saved Listings'))

    const heart = await screen.findByRole('button', { name: /remove from saved/i })
    expect(heart).toBeInTheDocument()

    fireEvent.click(heart)

    await waitFor(() => {
      expect(mockUnsaveListing).toHaveBeenCalledWith(9)
    })
  })

  it('shows empty state per tab when API returns empty arrays', async () => {
    renderDashboard()

    await waitFor(() => expect(screen.getByText(/have not inquired/i)).toBeInTheDocument())

    fireEvent.click(screen.getByText('My Reviews'))
    await waitFor(() =>
      expect(screen.getByText(/have not written any reviews/i)).toBeInTheDocument()
    )

    fireEvent.click(screen.getByText('Saved Listings'))
    await waitFor(() =>
      expect(screen.getByText(/have not saved any listings/i)).toBeInTheDocument()
    )
  })
})
