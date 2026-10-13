import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import axios from 'axios'
import BreederProfilePage from './BreederProfile'
import * as breedersApi from '@/api/breeders.api'
import type { BreederProfile } from '@/api/breeders.api'

vi.mock('@/api/breeders.api')

function makeProfile(overrides: Partial<BreederProfile> = {}): BreederProfile {
  return {
    id: 42,
    kennel_name: 'Sunrise Kennels',
    display_name: 'Ion Dogaru',
    description: 'We breed happy dogs.',
    location: 'Chișinău, Moldova',
    website: 'https://sunrise.md',
    breed_specialization: ['Labrador Retriever', 'Golden Retriever'],
    profile_photo_url: null,
    years_active: 5,
    verified: false,
    verified_at: null,
    listings: [],
    ...overrides,
  }
}

function makeAxiosResponse<T>(data: T) {
  return {
    data: { data },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  }
}

function renderPage(id = '42') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/breeders/${id}`]}>
          <Routes>
            <Route path="/breeders/:id" element={<BreederProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

describe('BreederProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders kennel name and location from API response', async () => {
    vi.spyOn(breedersApi, 'getPublicBreederProfile').mockResolvedValue(
      makeAxiosResponse(makeProfile())
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Sunrise Kennels')).toBeInTheDocument()
      expect(screen.getByText(/Chișinău, Moldova/)).toBeInTheDocument()
    })
  })

  it('renders verified badge when profile is verified', async () => {
    vi.spyOn(breedersApi, 'getPublicBreederProfile').mockResolvedValue(
      makeAxiosResponse(makeProfile({ verified: true, verified_at: '2025-01-01T00:00:00.000Z' }))
    )
    renderPage()
    await waitFor(() => {
      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('title', expect.stringMatching(/verified by pawtrust/i))
    })
  })

  it('does NOT render phone or email fields on the public page', async () => {
    vi.spyOn(breedersApi, 'getPublicBreederProfile').mockResolvedValue(
      makeAxiosResponse(makeProfile())
    )
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Sunrise Kennels')).toBeInTheDocument()
    })
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument()
  })

  it('shows "Profile not found" message on 404 response', async () => {
    vi.spyOn(breedersApi, 'getPublicBreederProfile').mockRejectedValue(
      Object.assign(new axios.AxiosError('Not Found'), { response: { status: 404 } })
    )
    renderPage('999')
    await waitFor(() => {
      expect(screen.getByText(/profile not found/i)).toBeInTheDocument()
    })
  })
})
