import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import SittersPage from './SittersPage'
import * as sitterApi from '@/api/sitter.api'
import type { SitterCard, PaginatedSitters } from '@/api/sitter.api'

vi.mock('@/api/sitter.api')

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, opts?: Record<string, unknown>) => {
      if (opts && 'area' in opts)
        return `No sitters found in ${opts.area}. Try expanding your area.`
      if (opts && 'count' in opts) return `${opts.count} listings found`
      return fallback ?? _key
    },
  }),
}))

function makeCard(overrides: Partial<SitterCard> = {}): SitterCard {
  return {
    id: 1,
    full_name: 'Ana Sitter',
    bio_excerpt: 'I love pets.',
    service_areas: ['Chișinău'],
    services: ['boarding'],
    rates: '€15/night',
    experience_years: 5,
    photo_url: null,
    average_review: null,
    ...overrides,
  }
}

function makePaginated(items: SitterCard[], total = items.length): PaginatedSitters {
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

function renderSitters(initialUrl = '/sitters') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialUrl]}>
          <Routes>
            <Route path="/sitters" element={<SittersPage />} />
            <Route path="/sitters/:id" element={<div>Sitter detail</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SittersPage', () => {
  it('renders sitter cards from mock API', async () => {
    vi.mocked(sitterApi.getSitters).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard({ full_name: 'Ana Sitter' })]))
    )

    renderSitters()

    await waitFor(() => expect(screen.getByText('Ana Sitter')).toBeInTheDocument())
  })

  it('shows empty state when API returns empty array', async () => {
    vi.mocked(sitterApi.getSitters).mockResolvedValue(makeAxiosResponse(makePaginated([])))

    renderSitters()

    await waitFor(() =>
      expect(screen.getByText('No sitters available right now.')).toBeInTheDocument()
    )
  })

  it('shows service area name in empty state when filter is active', async () => {
    vi.mocked(sitterApi.getSitters).mockResolvedValue(makeAxiosResponse(makePaginated([])))

    renderSitters('/sitters?service_area=Cahul')

    await waitFor(() =>
      expect(
        screen.getByText('No sitters found in Cahul. Try expanding your area.')
      ).toBeInTheDocument()
    )
  })

  it('service type checkbox updates query param', async () => {
    vi.mocked(sitterApi.getSitters).mockResolvedValue(
      makeAxiosResponse(makePaginated([makeCard()]))
    )

    renderSitters()

    await waitFor(() => screen.getByText('Ana Sitter'))

    fireEvent.click(screen.getByLabelText(/boarding/i))

    await waitFor(() =>
      expect(sitterApi.getSitters).toHaveBeenCalledWith(
        expect.objectContaining({ service: 'boarding' })
      )
    )
  })

  it('clear filters button resets filter state', async () => {
    vi.mocked(sitterApi.getSitters).mockResolvedValue(makeAxiosResponse(makePaginated([])))

    renderSitters('/sitters?service_area=Cahul')

    const clearBtn = await screen.findByText('Clear Filters')
    fireEvent.click(clearBtn)

    await waitFor(() =>
      expect(sitterApi.getSitters).toHaveBeenCalledWith(
        expect.not.objectContaining({ service_area: 'Cahul' })
      )
    )
  })
})
