import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBuyerInquiries } from '@/api/buyer.api'
import { formatDate } from '@/utils/date'
import { InquiryDocumentsButton } from '@/components/buyer/InquiryDocumentsButton'
import { ReviewCta } from '@/components/buyer/ReviewCta'
import { ContactRevealCard } from '@/components/listings/ContactRevealCard'

const STATUS_BADGE: Record<string, string> = {
  contact_revealed: 'bg-blue-100 text-blue-700',
}

export function BuyerInquiryList() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['buyer', 'inquiries', page],
    queryFn: () => getBuyerInquiries(page).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="py-10 text-center text-gray-400 text-sm">
        {t('common.loading', 'Loading…')}
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="py-10 text-center bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm mb-3">
          {t('buyer_dashboard.empty_inquiries', 'You have not inquired about any listing yet.')}
        </p>
        <Link to="/search" className="text-blue-600 hover:underline text-sm">
          {t('buyer_dashboard.cta_browse', 'Browse Listings')}
        </Link>
      </div>
    )
  }

  const lastPage = data.meta?.last_page ?? 1

  return (
    <div className="space-y-4">
      {data.data.map((inquiry) => (
        <div key={inquiry.id} className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
          <div className="w-20 h-20 rounded-md bg-gray-100 shrink-0 overflow-hidden">
            {inquiry.listing.photo_url ? (
              <img
                src={inquiry.listing.photo_url}
                alt={inquiry.listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                🐾
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{inquiry.listing.title}</p>
                <p className="text-xs text-gray-500 capitalize">{inquiry.listing.breed}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {inquiry.breeder.kennel_name ?? inquiry.breeder.name}
                </p>
                <p className="text-xs text-gray-400">{formatDate(inquiry.submitted_at)}</p>
              </div>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_BADGE[inquiry.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {t(`breeder_dashboard.status_${inquiry.status}`, inquiry.status)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-3">
              <button
                type="button"
                onClick={() => setExpandedId((id) => (id === inquiry.id ? null : inquiry.id))}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('buyer_dashboard.btn_contact_details', 'View Contact Details')}
              </button>
              <InquiryDocumentsButton inquiryId={inquiry.id} />
              {inquiry.status === 'contact_revealed' && (
                <ReviewCta
                  breederProfileId={inquiry.breeder.id}
                  breederName={inquiry.breeder.kennel_name ?? inquiry.breeder.name}
                />
              )}
            </div>

            {expandedId === inquiry.id && (
              <div className="mt-3">
                <ContactRevealCard contact={inquiry.breeder_contact} />
              </div>
            )}
          </div>
        </div>
      ))}

      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            {t('common.prev', 'Previous')}
          </button>
          <span className="text-sm text-gray-500">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            {t('common.next', 'Next')}
          </button>
        </div>
      )}
    </div>
  )
}
