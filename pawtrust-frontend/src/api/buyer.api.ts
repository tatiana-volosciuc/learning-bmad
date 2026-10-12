import axiosClient from './axiosClient'
import type { PaginationMeta } from './admin.api'
import type { ListingCard } from './listings.api'

export interface BuyerInquiry {
  id: number
  status: string
  submitted_at: string
  has_reviewed: boolean
  listing: {
    id: number
    title: string
    breed: string
    photo_url: string | null
  }
  breeder: {
    id: number
    name: string
    kennel_name: string | null
  }
  breeder_contact: {
    name: string
    email: string
    phone: string | null
  }
}

export interface BuyerReview {
  id: number
  rating: number
  text: string
  posted_at: string
  breeder: { id: number; user_id: number; kennel_name: string | null }
}

export interface SavedListing extends ListingCard {
  is_saved: boolean
}

export const getBuyerInquiries = (page = 1) =>
  axiosClient.get<{ data: BuyerInquiry[]; meta: PaginationMeta }>('/buyer/inquiries', {
    params: { page },
  })

export const getBuyerInquiryDetail = (id: number) =>
  axiosClient.get<{ data: BuyerInquiry & { message: string | null } }>(`/buyer/inquiries/${id}`)

export const getBuyerReviews = () => axiosClient.get<{ data: BuyerReview[] }>('/buyer/reviews')

export const getSavedListings = (page = 1) =>
  axiosClient.get<{ data: SavedListing[]; meta: PaginationMeta }>('/buyer/saved-listings', {
    params: { page },
  })

export const saveListing = (listingId: number) =>
  axiosClient.post<{ data: { saved: boolean } }>(`/buyer/saved-listings/${listingId}/save`)

export const unsaveListing = (listingId: number) =>
  axiosClient.delete<{ data: { saved: boolean } }>(`/buyer/saved-listings/${listingId}/save`)
