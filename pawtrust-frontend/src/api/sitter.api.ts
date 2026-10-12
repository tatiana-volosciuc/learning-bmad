import axiosClient from './axiosClient'
import type { PaginationMeta } from './admin.api'

export type SitterService = 'boarding' | 'dog_walking' | 'day_care' | 'drop_in'

export interface SitterPortfolioPhoto {
  id: number
  url: string | null
}

export interface SitterProfile {
  id: number
  full_name: string
  bio: string | null
  service_areas: string[]
  services: SitterService[]
  rates: string | null
  experience_years: number | null
  languages: string[] | null
  portfolio_photos: SitterPortfolioPhoto[]
  is_complete: boolean
}

export interface SitterProfilePayload {
  full_name: string
  bio?: string
  service_areas: string[]
  services: SitterService[]
  rates?: string
  experience_years?: number
  languages?: string[]
}

export interface ContactSitterPayload {
  name: string
  email: string
  message: string
}

export interface SitterContactSubmission {
  id: number
  sender_name: string
  sender_email: string
  message: string
  created_at: string
}

export interface SitterCard {
  id: number
  full_name: string
  bio_excerpt: string | null
  service_areas: string[]
  services: SitterService[]
  rates: string | null
  experience_years: number | null
  photo_url: string | null
  average_review: number | null
}

export interface SitterFilters {
  service_area?: string
  service?: SitterService
  page?: number
}

export interface PaginatedSitters {
  data: SitterCard[]
  meta: PaginationMeta
}

export const getSitterProfile = (id: number) =>
  axiosClient.get<{ data: SitterProfile }>(`/sitters/${id}`)

export const getMySitterProfile = () => axiosClient.get<{ data: SitterProfile }>('/sitter/profile')

export const createSitterProfile = (payload: SitterProfilePayload) =>
  axiosClient.post<{ data: SitterProfile }>('/sitter/profile', payload)

export const updateSitterProfile = (payload: SitterProfilePayload) =>
  axiosClient.put<{ data: SitterProfile }>('/sitter/profile', payload)

export const uploadPortfolioPhoto = (file: File) => {
  const form = new FormData()
  form.append('photo', file)
  return axiosClient.post<{ data: SitterProfile }>('/sitter/profile/photos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deletePortfolioPhoto = (photoId: number) =>
  axiosClient.delete(`/sitter/profile/photos/${photoId}`)

export const contactSitter = (sitterId: number, payload: ContactSitterPayload) =>
  axiosClient.post<{ message: string }>(`/sitters/${sitterId}/contact`, payload)

export const getContactSubmissions = (page = 1) =>
  axiosClient.get<{ data: SitterContactSubmission[]; meta: PaginationMeta }>(
    '/sitter/contact-submissions',
    { params: { page } }
  )

export const getSitters = (filters?: SitterFilters) =>
  axiosClient.get<PaginatedSitters>('/sitters', { params: filters })
