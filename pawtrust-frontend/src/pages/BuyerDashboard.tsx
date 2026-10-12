import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import { getStoredInquiries } from '@/store/buyerInquiries'
import { InquiryDocumentsButton } from '@/components/buyer/InquiryDocumentsButton'
import { ReviewCta } from '@/components/buyer/ReviewCta'

export default function BuyerDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const inquiries = user ? getStoredInquiries(user.id) : []

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {t('buyer.dashboard.title', 'My Dashboard')}
        </h1>
        {user && (
          <p className="text-gray-500 mb-6">
            {t('buyer.dashboard.welcome', 'Welcome back, {{name}}', { name: user.name })}
          </p>
        )}

        {inquiries.length === 0 ? (
          <p className="text-gray-600">
            {t('buyer.dashboard.empty_state', 'No inquiries yet.')}{' '}
            <Link to="/search" className="text-blue-600 hover:underline">
              {t('nav.browse_listings', 'Browse listings')}
            </Link>{' '}
            to find your perfect pet.
          </p>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.inquiryId}
                className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{inquiry.listingTitle}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(inquiry.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {t(`breeder_dashboard.status_${inquiry.status}`, inquiry.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((id) => (id === inquiry.inquiryId ? null : inquiry.inquiryId))
                    }
                    className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {t('buyer_dashboard.view_contact_details', 'View Contact Details')}
                  </button>
                  <InquiryDocumentsButton inquiryId={inquiry.inquiryId} />
                  {inquiry.status === 'contact_revealed' && (
                    <ReviewCta
                      breederProfileId={inquiry.breederProfileId}
                      breederName={inquiry.contact.name}
                    />
                  )}
                </div>

                {expandedId === inquiry.inquiryId && (
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 space-y-1">
                    <div>{inquiry.contact.name}</div>
                    <div>{inquiry.contact.email}</div>
                    {inquiry.contact.phone && <div>{inquiry.contact.phone}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
