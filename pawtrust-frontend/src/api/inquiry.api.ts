import axiosClient from './axiosClient'
import type { PaginationMeta } from './admin.api'

export interface BreederContact {
  name: string
  email: string
  phone: string | null
}

export interface InquiryResponse {
  inquiry_id: number
  status: string
  breeder_contact: BreederContact
}

export interface BreederInquiry {
  id: number
  status: string
  message: string | null
  submitted_at: string
  read_at: string | null
  buyer: { id: number; name: string }
  listing: { id: number; title: string }
}

export const submitInquiry = (listingId: number, message?: string) =>
  axiosClient.post<{ data: InquiryResponse }>(`/listings/${listingId}/inquire`, {
    message: message ?? null,
  })

export const getBreederInquiries = (page = 1) =>
  axiosClient.get<{ data: BreederInquiry[]; meta: PaginationMeta }>('/breeder/inquiries', { params: { page } })

export const getBreederUnreadCount = () =>
  axiosClient.get<{ data: { unread_count: number } }>('/breeder/inquiries/unread-count')
