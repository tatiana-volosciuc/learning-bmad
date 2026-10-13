import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import SearchPage from './Search'
import * as listingsApi from '@/api/listings.api'
import type { ListingCard, PaginatedListings } from '@/api/listings.api'

vi.mock('@/api/listings.api')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, opts?: Record<string, unknown>) => {
      if (opts && 'count' in opts) return `${opts.count} listings found`
      return fallback ?? _key
    },
  }),
}))

function makeCard(overrides: Partial<ListingCard> = {}): ListingCard {
  return {
    id: 1,
    title: 'Golden Retriever Puppy',
    species: 'dog',
    breed: 'Golden Retriever',
    price: '500.00',
    currency: 'EUR',
    location: 'Chisinau',
    main_photo_url: null,
    breeder_name: 'Happy Kennel',
    verified: false,
    listing_type: 'standard',
    featured: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makePaginated(items: ListingCard[], total = items.length): PaginatedListings {
  return {
    data: items,
    meta: { current_page: 1, last_page: 1, per_page: 20, total },
  }
}

function makeAxiosResponse<T>(data: T) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  }
}

function renderSearch(initialUrl = '/search') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialUrl]}>
          <Routes>
            <Route path="/search" element={<SearchPage />} />
            <Route path="/listings/:id" element={<div>Listing detail</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SearchPage', () => {
  it('renders skeleton cards while loading', () => {
    vi.mocked(listingsApi.searchListings).mockReturnValue(new Promise(() => {}))

    renderSearch()

    // Skeleton cards have the animate-pulse class
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders listing cards when data loads', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard({ id: 1, title: 'Golden Retriever Puppy' })]))
    )

    renderSearch()

    await waitFor(() => expect(screen.getByText('Golden Retriever Puppy')).toBeInTheDocument())
  })

  it('shows empty state when data is empty array', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(makeAxiosResponse(makePaginated([])))

    renderSearch()

    await waitFor(() =>
      expect(screen.getByText('No listings match your search.')).toBeInTheDocument()
    )
    expect(screen.getByText('Clear all filters')).toBeInTheDocument()
  })

  it('updates URL params when species filter changes', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard()]))
    )

    renderSearch()

    await waitFor(() => screen.getByText('Golden Retriever Puppy'))

    const dogRadio = screen
      .getAllByRole('radio')
      .find((r) => (r as HTMLInputElement).value === 'dog')!
    fireEvent.click(dogRadio)

    await waitFor(() =>
      expect(listingsApi.searchListings).toHaveBeenCalledWith(
        expect.objectContaining({ species: 'dog' })
      )
    )
  })

  it('clear filters resets all filters', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(makeAxiosResponse(makePaginated([])))

    renderSearch('/search?species=dog')

    await waitFor(() => screen.getByText('No listings match your search.'))

    // "Clear all filters" button appears when empty state is shown
    const clearBtn = screen.getAllByText('Clear all filters')[0]
    fireEvent.click(clearBtn)

    await waitFor(() =>
      expect(listingsApi.searchListings).toHaveBeenCalledWith(
        expect.not.objectContaining({ species: 'dog' })
      )
    )
  })

  it('shows verified badge on verified listing card', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard({ verified: true })]))
    )

    renderSearch()

    await waitFor(() => expect(screen.getByText(/Verified/i)).toBeInTheDocument())
  })

  it('shows featured badge on featured listing card', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard({ featured: true })]))
    )

    renderSearch()

    await waitFor(() => expect(screen.getByText(/Featured/i)).toBeInTheDocument())
  })

  it('contact details not present in any rendered card', async () => {
    vi.mocked(listingsApi.searchListings).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard()]))
    )

    const { container } = renderSearch()

    await waitFor(() => screen.getByText('Golden Retriever Puppy'))

    const html = container.innerHTML
    expect(html).not.toMatch(/\+\d{3}/) // no phone
    expect(html).not.toMatch(/@.*\./) // no email pattern
    expect(html).not.toContain('health_certificate_key')
    expect(html).not.toContain('s3_key')
  })
})
