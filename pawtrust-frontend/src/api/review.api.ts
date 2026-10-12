import axiosClient from './axiosClient'

export interface ReviewPayload {
  rating: number
  text: string
}

export interface BreederReview {
  id: number
  rating: number
  text: string
  buyer_name: string
  posted_at: string
}

// breederUserId matches GET /breeders/{id} — the breeder's user id, not breeder_profile_id
export const submitReview = (breederUserId: number, payload: ReviewPayload) =>
  axiosClient.post<{ data: BreederReview }>(`/breeders/${breederUserId}/reviews`, payload)

export const getInquiryExists = (breederProfileId: number) =>
  axiosClient.get<{ data: { has_inquiry: boolean } }>('/buyer/inquiry-exists', {
    params: { breeder_profile_id: breederProfileId },
  })

export const getReviewExists = (breederProfileId: number) =>
  axiosClient.get<{ data: { has_reviewed: boolean } }>('/buyer/review-exists', {
    params: { breeder_profile_id: breederProfileId },
  })
