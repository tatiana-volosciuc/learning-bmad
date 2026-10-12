import type { BreederContact } from '@/api/inquiry.api'

export interface StoredInquiry {
  inquiryId: number
  listingId: number
  listingTitle: string
  status: string
  submittedAt: string
  contact: BreederContact
  breederProfileId: number
  breederUserId: number
}

const storageKey = (userId: number) => `pawtrust:buyerInquiries:${userId}`

export function getStoredInquiries(userId: number): StoredInquiry[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as StoredInquiry[]) : []
  } catch {
    return []
  }
}

export function addStoredInquiry(userId: number, inquiry: StoredInquiry): void {
  const existing = getStoredInquiries(userId).filter((i) => i.inquiryId !== inquiry.inquiryId)
  existing.unshift(inquiry)
  localStorage.setItem(storageKey(userId), JSON.stringify(existing))
}
