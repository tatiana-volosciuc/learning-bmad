import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { InquireModal } from './InquireModal'
import { ContactRevealCard } from './ContactRevealCard'
import type { BreederContact } from '@/api/inquiry.api'

interface Props {
  listingId: number
  listingTitle?: string
}

export function InquiryCTA({ listingId, listingTitle = '' }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  const [modalOpen, setModalOpen] = useState(false)
  const [revealedContact, setRevealedContact] = useState<BreederContact | null>(null)

  if (!token) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/login?redirect=/listings/${listingId}`)}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        {t('inquiry.btn_login_to_contact', 'Log in to Contact Breeder')}
      </button>
    )
  }

  if (user?.role !== 'buyer') return null

  if (revealedContact) {
    return <ContactRevealCard contact={revealedContact} />
  }

  if (modalOpen) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <InquireModal
          listingId={listingId}
          listingTitle={listingTitle}
          onSuccess={(data) => {
            setRevealedContact(data.breeder_contact)
            setModalOpen(false)
          }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setModalOpen(true)}
      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
    >
      {t('inquiry.btn_contact_breeder', 'Contact Breeder')}
    </button>
  )
}
