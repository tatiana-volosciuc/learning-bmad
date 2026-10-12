import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BreederInquiryList } from './BreederInquiryList'
import type { BreederInquiry } from '@/api/inquiry.api'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}))

vi.mock('@/api/inquiry.api', () => ({
  getBreederInquiries: vi.fn(),
}))

import { getBreederInquiries } from '@/api/inquiry.api'

const mockInquiry: BreederInquiry = {
  id: 1,
  status: 'contact_revealed',
  message: 'I am very interested in this puppy.',
  submitted_at: '2026-05-01T10:00:00.000Z',
  read_at: null,
  buyer: { id: 10, name: 'Alice Smith' },
  listing: { id: 5, title: 'Golden Retriever Puppy' },
}

function renderComponent() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BreederInquiryList />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BreederInquiryList', () => {
  it('renders inquiry rows from mock API', async () => {
    vi.mocked(getBreederInquiries).mockResolvedValue({
      data: {
        data: [mockInquiry],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      },
    } as any)

    renderComponent()

    expect(await screen.findByText('Golden Retriever Puppy')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('I am very interested in this puppy.')).toBeInTheDocument()
  })

  it('shows empty state when API returns empty array', async () => {
    vi.mocked(getBreederInquiries).mockResolvedValue({
      data: {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
      },
    } as any)

    renderComponent()

    expect(await screen.findByText('breeder_dashboard.no_inquiries')).toBeInTheDocument()
  })

  it('pagination controls render and change page when multiple pages exist', async () => {
    vi.mocked(getBreederInquiries).mockResolvedValue({
      data: {
        data: [mockInquiry],
        meta: { current_page: 1, last_page: 3, per_page: 20, total: 50 },
      },
    } as any)

    renderComponent()

    await screen.findByText('Golden Retriever Puppy')

    const nextBtn = screen.getByText('Next')
    expect(nextBtn).toBeInTheDocument()
    expect(nextBtn).not.toBeDisabled()

    const prevBtn = screen.getByText('Previous')
    expect(prevBtn).toBeDisabled()

    fireEvent.click(nextBtn)
    expect(await screen.findByText('2 / 3')).toBeInTheDocument()
  })
})
