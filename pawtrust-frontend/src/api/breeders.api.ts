import axiosClient from './axiosClient'

export interface ListingSummary {
  id: number
  title: string | null
}

export interface BreederReview {
  id: number
  rating: number
  text: string
  buyer_name: string
  posted_at: string
}

export interface ReviewSummary {
  average_rating: number | null
  total_count: number
}

export interface BreederProfile {
  id: number
  kennel_name: string | null
  display_name: string | null
  description: string | null
  location: string | null
  website: string | null
  breed_specialization: string[] | null
  profile_photo_url: string | null
  years_active: number | null
  verified: boolean
  verified_at: string | null
  listings: ListingSummary[]
  documents_on_file?: number
  reviews?: BreederReview[]
  review_summary?: ReviewSummary
}

export interface BreederProfilePrivate extends BreederProfile {
  phone: string | null
  user_id: number
  documents?: BreederDocument[]
}

export type DocumentType =
  | 'kennel_cert'
  | 'fci_papers'
  | 'achr_papers'
  | 'vaccination_records'
  | 'health_tests'
  | 'other'

export type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface BreederDocument {
  id: number
  document_type: DocumentType
  filename: string
  uploaded_at: string
  status: DocumentStatus
}

export interface BreederProfilePayload {
  kennel_name?: string
  display_name?: string
  description?: string
  location?: string
  phone?: string
  website?: string
  breed_specialization?: string[]
  years_active?: number
}

export const createBreederProfile = (payload: BreederProfilePayload) =>
  axiosClient.post<{ data: BreederProfilePrivate }>('/breeder/profile', payload)

export const updateBreederProfile = (payload: BreederProfilePayload) =>
  axiosClient.put<{ data: BreederProfilePrivate }>('/breeder/profile', payload)

export const getMyBreederProfile = () =>
  axiosClient.get<{ data: BreederProfilePrivate }>('/breeder/profile')

export const getPublicBreederProfile = (id: number) =>
  axiosClient.get<{ data: BreederProfile }>(`/breeders/${id}`)

export const uploadBreederProfilePhoto = (file: File) => {
  const form = new FormData()
  form.append('profile_photo', file)
  return axiosClient.post<{ data: BreederProfilePrivate }>('/breeder/profile/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const uploadBreederDocument = (
  breederId: number,
  file: File,
  documentType: DocumentType
) => {
  const form = new FormData()
  form.append('file', file)
  form.append('document_type', documentType)
  return axiosClient.post<{ data: BreederDocument }>(`/breeders/${breederId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteBreederDocument = (breederId: number, docId: number) =>
  axiosClient.delete(`/breeders/${breederId}/documents/${docId}`)

export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'

export interface VerificationStatusResponse {
  status: VerificationStatus
  admin_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
}

export interface SubmitVerificationPayload {
  document_ids: number[]
}

export const getVerificationStatus = () =>
  axiosClient.get<{ data: VerificationStatusResponse }>('/verification-requests/status')

export const submitVerificationRequest = (payload: SubmitVerificationPayload) =>
  axiosClient.post<{ data: VerificationStatusResponse }>('/verification-requests', payload)
