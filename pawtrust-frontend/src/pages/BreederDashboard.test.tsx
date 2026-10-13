import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BreederDashboard from './BreederDashboard'
import type { Listing } from '@/api/listings.api'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: { user: { id: number; name: string; role: string } }) => unknown) =>
    sel({ user: { id: 1, name: 'Ion', role: 'breeder' } }),
}))

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockGetMyBreederProfile = vi.fn()
vi.mock('@/api/breeders.api', () => ({
  getMyBreederProfile: (...args: unknown[]) => mockGetMyBreederProfile(...args),
  getVerificationStatus: vi.fn().mockResolvedValue({ data: { data: { status: 'not_submitted' } } }),
}))

const mockGetMyListings = vi.fn()
const mockInitiateListingPayment = vi.fn()
const mockUpgradeListingToFeatured = vi.fn()
vi.mock('@/api/listings.api', () => ({
  getMyListings: (...args: unknown[]) => mockGetMyListings(...args),
  initiateListingPayment: (...args: unknown[]) => mockInitiateListingPayment(...args),
  upgradeListingToFeatured: (...args: unknown[]) => mockUpgradeListingToFeatured(...args),
}))

vi.mock('@/api/inquiry.api', () => ({
  getBreederUnreadCount: vi.fn().mockResolvedValue({ data: { data: { unread_count: 0 } } }),
}))

const mockToast = vi.hoisted(() => {
  const fn = vi.fn() as unknown as { (msg: string): void; success: ReturnType<typeof vi.fn> }
  fn.success = vi.fn()
  return fn
})
vi.mock('react-hot-toast', () => ({ default: mockToast }))

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 1,
    title: 'Golden Retriever Puppy',
    description: 'desc',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    date_of_birth: null,
    price: '500.00',
    currency: 'EUR',
    location: null,
    status: 'active',
    listing_type: 'standard',
    featured_until: null,
    health_certificate: null,
    photos: [],
    breeder: null,
    created_at: new Date().toISOString(),
    featured: false,
    ...overrides,
  }
}

function renderDashboard(initialEntry = '/breeder/dashboard') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <BreederDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetMyBreederProfile.mockResolvedValue({ data: { data: { kennel_name: 'Sunrise Kennels' } } })
})

describe('BreederDashboard payment flow', () => {
  it('shows Complete Payment button for pending_payment listings', async () => {
    mockGetMyListings.mockResolvedValue({
      data: { data: [makeListing({ status: 'pending_payment' })] },
    })

    renderDashboard()

    await waitFor(() => expect(screen.getByText('Complete Payment')).toBeInTheDocument())
  })

  it('does not show Complete Payment button for active listings', async () => {
    mockGetMyListings.mockResolvedValue({ data: { data: [makeListing({ status: 'active' })] } })

    renderDashboard()

    await waitFor(() => expect(screen.getByText('Golden Retriever Puppy')).toBeInTheDocument())
    expect(screen.queryByText('Complete Payment')).not.toBeInTheDocument()
  })

  it('clicking Complete Payment calls initiateListingPayment and redirects to checkout URL', async () => {
    mockGetMyListings.mockResolvedValue({
      data: { data: [makeListing({ id: 7, status: 'pending_payment' })] },
    })
    mockInitiateListingPayment.mockResolvedValue({
      data: { data: { checkout_url: 'https://checkout.stripe.com/test-session' } },
    })

    const originalLocation = window.location
    // @ts-expect-error - jsdom location is not writable by default
    delete window.location
    window.location = { ...originalLocation, href: '' } as Location

    renderDashboard()

    fireEvent.click(await screen.findByText('Complete Payment'))

    await waitFor(() => expect(mockInitiateListingPayment).toHaveBeenCalledWith(7))
    await waitFor(() =>
      expect(window.location.href).toBe('https://checkout.stripe.com/test-session')
    )

    window.location = originalLocation
  })

  it('shows success toast and refetches listings on ?payment=success', async () => {
    mockGetMyListings.mockResolvedValue({ data: { data: [makeListing()] } })

    renderDashboard('/breeder/dashboard?payment=success&listing_id=7')

    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Your listing is now live!'))
  })

  it('shows info toast on ?payment=cancelled', async () => {
    mockGetMyListings.mockResolvedValue({ data: { data: [makeListing()] } })

    renderDashboard('/breeder/dashboard?payment=cancelled&listing_id=7')

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith('Payment cancelled. Your listing is still pending.')
    )
  })
})

describe('BreederDashboard featured upgrade flow', () => {
  it('shows Upgrade to Featured button for active standard listings', async () => {
    mockGetMyListings.mockResolvedValue({
      data: { data: [makeListing({ status: 'active', featured: false })] },
    })

    renderDashboard()

    await waitFor(() => expect(screen.getByText('Upgrade to Featured (€5)')).toBeInTheDocument())
  })

  it('shows FeaturedBadge instead of upgrade button for active featured listings', async () => {
    mockGetMyListings.mockResolvedValue({
      data: { data: [makeListing({ status: 'active', featured: true })] },
    })

    renderDashboard()

    await waitFor(() => expect(screen.getByText('Golden Retriever Puppy')).toBeInTheDocument())
    expect(screen.getByText('Featured')).toBeInTheDocument()
    expect(screen.queryByText('Upgrade to Featured (€5)')).not.toBeInTheDocument()
  })

  it('clicking Upgrade button calls upgradeListingToFeatured and redirects to checkout URL', async () => {
    mockGetMyListings.mockResolvedValue({
      data: { data: [makeListing({ id: 9, status: 'active', featured: false })] },
    })
    mockUpgradeListingToFeatured.mockResolvedValue({
      data: { data: { checkout_url: 'https://checkout.stripe.com/upgrade-session' } },
    })

    const originalLocation = window.location
    // @ts-expect-error - jsdom location is not writable by default
    delete window.location
    window.location = { ...originalLocation, href: '' } as Location

    renderDashboard()

    fireEvent.click(await screen.findByText('Upgrade to Featured (€5)'))

    await waitFor(() => expect(mockUpgradeListingToFeatured).toHaveBeenCalledWith(9))
    await waitFor(() =>
      expect(window.location.href).toBe('https://checkout.stripe.com/upgrade-session')
    )

    window.location = originalLocation
  })

  it('shows upgrade success toast on ?payment=success&action=upgrade', async () => {
    mockGetMyListings.mockResolvedValue({ data: { data: [makeListing()] } })

    renderDashboard('/breeder/dashboard?payment=success&action=upgrade&listing_id=7')

    await waitFor(() =>
      expect(mockToast.success).toHaveBeenCalledWith('Your listing is now featured!')
    )
  })
})
