import axiosClient from './axiosClient'

export interface ListingPhoto {
  id: number
  photo_type: 'listing' | 'parent'
  sort_order: number
  url: string
}

// Extend BreederSummary with detail fields
export interface BreederSummary {
  id: number
  kennel_name: string | null
  display_name: string | null
  location: string | null
  profile_photo_url: string | null
  verified: boolean
  verified_at: string | null
  breed_specialization: string[] | null
  achievements_count: number
}

export interface Listing {
  id: number
  title: string
  description: string
  species: 'dog' | 'cat' | 'other'
  breed: string
  gender: 'male' | 'female'
  date_of_birth: string | null
  price: string
  currency: 'EUR' | 'MDL' | 'RON'
  location: string | null
  status: 'draft' | 'active' | 'sold' | 'expired'
  listing_type: 'standard' | 'featured'
  featured_until: string | null
  health_certificate: 'on_file' | null
  photos: ListingPhoto[]
  breeder: BreederSummary | null
  created_at: string
}

export interface CreateListingPayload {
  title: string
  description: string
  species: 'dog' | 'cat' | 'other'
  breed: string
  gender: 'male' | 'female'
  date_of_birth?: string
  price: number
  currency?: 'EUR' | 'MDL' | 'RON'
  location?: string
  listing_type?: 'standard' | 'featured'
}

export const createListing = (payload: CreateListingPayload) =>
  axiosClient.post<{ data: Listing }>('/listings', payload)

export const getListing = (id: number) => axiosClient.get<{ data: Listing }>(`/listings/${id}`)

export const updateListing = (id: number, payload: Partial<CreateListingPayload>) =>
  axiosClient.put<{ data: Listing }>(`/listings/${id}`, payload)

export const getMyListings = () => axiosClient.get<{ data: Listing[] }>('/breeder/listings')

export interface ListingSearchParams {
  q?: string
  species?: 'dog' | 'cat' | 'other'
  breed?: string
  location_city?: string
  location_region?: string
  price_min?: number
  price_max?: number
  verified_only?: boolean
  page?: number
  per_page?: number
}

export interface ListingCard {
  id: number
  title: string
  species: 'dog' | 'cat' | 'other'
  breed: string
  price: string
  currency: 'EUR' | 'MDL' | 'RON'
  location: string | null
  main_photo_url: string | null
  breeder_name: string | null
  verified: boolean
  listing_type: 'standard' | 'featured'
  featured: boolean
  created_at: string
  is_saved?: boolean
}

export interface PaginatedListings {
  data: ListingCard[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const searchListings = (params: ListingSearchParams) =>
  axiosClient.get<PaginatedListings>('/listings', { params })

export interface Achievement {
  id: number
  title: string
  federation: string
  year: number
}

export interface Review {
  id: number
  rating: number
  comment: string | null
  buyer_name: string
  created_at: string
}

export interface ReviewSummary {
  average_rating: number | null
  total_count: number
}

export interface ListingDetail extends Listing {
  featured: boolean
  photos: ListingPhoto[]
  breeder: BreederSummary
  achievements: Achievement[]
  review_summary: ReviewSummary
  recent_reviews: Review[]
}

export const getListingDetail = (id: number) =>
  axiosClient.get<{ data: ListingDetail }>(`/listings/${id}`)

export const getListingReviews = (listingId: number, page = 1) =>
  axiosClient.get<PaginatedListings>(`/listings/${listingId}/reviews`, { params: { page } })

export const uploadListingPhoto = (
  listingId: number,
  file: File,
  photoType: 'listing' | 'parent'
) => {
  const form = new FormData()
  form.append('photo', file)
  form.append('photo_type', photoType)
  return axiosClient.post(`/listings/${listingId}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const uploadHealthCertificate = (listingId: number, file: File) => {
  const form = new FormData()
  form.append('certificate', file)
  return axiosClient.post(`/listings/${listingId}/health-certificate`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
