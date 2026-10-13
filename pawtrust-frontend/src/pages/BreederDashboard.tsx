import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import {
  getMyBreederProfile,
  getVerificationStatus,
  type BreederDocument,
} from '@/api/breeders.api'
import {
  getMyListings,
  initiateListingPayment,
  upgradeListingToFeatured,
  type Listing,
} from '@/api/listings.api'
import { BreederProfileForm } from '@/components/breeders/BreederProfileForm'
import { DocumentUpload } from '@/components/breeders/DocumentUpload'
import { DocumentList } from '@/components/breeders/DocumentList'
import VerificationStatusCard from '@/components/breeders/VerificationStatusCard'
import VerificationSubmitModal from '@/components/breeders/VerificationSubmitModal'
import { BreederInquiryList } from '@/components/breeder/BreederInquiryList'
import { FeaturedBadge } from '@/components/listings/FeaturedBadge'
import { getBreederUnreadCount } from '@/api/inquiry.api'

const STATUS_BADGE: Record<Listing['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_payment: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  sold: 'bg-blue-100 text-blue-700',
  expired: 'bg-orange-100 text-orange-700',
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

export default function BreederDashboard() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'listings' | 'documents' | 'verification'>(
    'listings'
  )
  const activeTab = location.pathname === '/dashboard/breeder/inquiries' ? 'inquiries' : selectedTab
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  const { data: profileData } = useQuery({
    queryKey: ['myBreederProfile'],
    queryFn: () => getMyBreederProfile().then((r) => r.data.data),
    retry: false,
  })

  const { data: listings } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => getMyListings().then((r) => r.data.data),
    retry: false,
  })

  // Stripe redirect landing — ?payment=success|cancelled&action=activate|upgrade&listing_id=... (Stories 5.3/5.4)
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (!payment) return

    const isUpgrade = searchParams.get('action') === 'upgrade'

    if (payment === 'success') {
      toast.success(
        isUpgrade
          ? t('featured.upgrade_success_toast', 'Your listing is now featured!')
          : t('payment.success_toast', 'Your listing is now live!')
      )
      queryClient.invalidateQueries({ queryKey: ['myListings'] })
    } else if (payment === 'cancelled') {
      toast(
        isUpgrade
          ? t('featured.upgrade_cancelled', 'Upgrade cancelled.')
          : t('payment.cancelled_toast', 'Payment cancelled. Your listing is still pending.')
      )
    }

    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    next.delete('action')
    next.delete('listing_id')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const paymentMutation = useMutation({
    mutationFn: (listingId: number) => initiateListingPayment(listingId),
    onSuccess: (res) => {
      window.location.href = res.data.data.checkout_url
    },
  })

  const upgradeMutation = useMutation({
    mutationFn: (listingId: number) => upgradeListingToFeatured(listingId),
    onSuccess: (res) => {
      window.location.href = res.data.data.checkout_url
    },
  })

  const { data: verificationStatus } = useQuery({
    queryKey: ['verificationStatus'],
    queryFn: () => getVerificationStatus().then((r) => r.data.data),
    retry: false,
  })

  const { data: unreadData } = useQuery({
    queryKey: ['breeder', 'inquiries', 'unread-count'],
    queryFn: () => getBreederUnreadCount().then((r) => r.data.data),
    staleTime: 60_000,
    retry: false,
  })

  const unreadCount = unreadData?.unread_count ?? 0

  const activeCount = listings?.filter((l) => l.status === 'active').length ?? 0

  const isProfileComplete = profileData?.kennel_name != null && profileData.kennel_name !== ''

  if (showProfileForm) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl">
          <button
            onClick={() => setShowProfileForm(false)}
            className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
          >
            ← {t('common.back', 'Back')}
          </button>
          <BreederProfileForm onSuccess={() => setShowProfileForm(false)} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {t('breeder.dashboard.title', 'Breeder Dashboard')}
        </h1>
        {user && (
          <p className="text-gray-500 mb-6">
            {t('breeder.dashboard.welcome', 'Welcome back, {{name}}', { name: user.name })}
          </p>
        )}

        {!isProfileComplete && (
          <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-yellow-800 text-sm">
              {t(
                'breeder.dashboard.profile_incomplete',
                'Complete your breeder profile to attract buyers and list animals.'
              )}
            </p>
            <button
              onClick={() => setShowProfileForm(true)}
              className="shrink-0 px-4 py-2 text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
            >
              {t('breeder.dashboard.complete_profile', 'Complete profile →')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label={t('breeder.dashboard.stats.active_listings', 'Active Listings')}
            value={activeCount}
          />
          <StatCard
            label={t('breeder.dashboard.stats.pending_inquiries', 'Pending Inquiries')}
            value={0}
          />
          <StatCard
            label={t('breeder.dashboard.stats.verified', 'Verified')}
            value={t('common.no', 'No')}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['listings', 'inquiries', 'documents', 'verification'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === 'inquiries') {
                  navigate('/dashboard/breeder/inquiries')
                } else {
                  setSelectedTab(tab)
                  navigate('/breeder/dashboard')
                }
              }}
              className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'inquiries'
                ? t('breeder_dashboard.inquiries_nav', 'Inquiries')
                : t(
                    `breeder.dashboard.tabs.${tab}`,
                    tab === 'listings'
                      ? 'Listings'
                      : tab === 'documents'
                        ? 'Documents'
                        : 'Verification'
                  )}
              {tab === 'inquiries' && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('breeder.dashboard.my_listings', 'My Listings')}
              </h2>
              <Link
                to="/breeder/listings/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                + {t('breeder.dashboard.create_listing', 'Create Listing')}
              </Link>
            </div>

            {!listings || listings.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm mb-3">
                  {t('breeder.dashboard.no_listings', 'No listings yet.')}
                </p>
                <Link to="/breeder/listings/new" className="text-blue-600 hover:underline text-sm">
                  {t('breeder.dashboard.create_first', 'Create your first listing →')}
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">{t('listing.fields.title', 'Title')}</th>
                      <th className="px-4 py-3 text-left">
                        {t('listing.fields.species_breed', 'Species / Breed')}
                      </th>
                      <th className="px-4 py-3 text-left">
                        {t('listing.fields.status', 'Status')}
                      </th>
                      <th className="px-4 py-3 text-left">{t('listing.fields.price', 'Price')}</th>
                      <th className="px-4 py-3 text-left">
                        {t('listing.fields.created', 'Created')}
                      </th>
                      <th className="px-4 py-3 text-left" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{listing.title}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">
                          {listing.species} / {listing.breed}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[listing.status]}`}
                          >
                            {listing.status === 'pending_payment'
                              ? t('payment.status_pending', 'Payment Pending')
                              : listing.status}
                          </span>
                          {listing.status === 'active' && listing.featured && (
                            <span className="ml-1.5 inline-block align-middle">
                              <FeaturedBadge size="sm" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {listing.price} {listing.currency}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {listing.status === 'pending_payment' && (
                            <button
                              type="button"
                              disabled={paymentMutation.isPending}
                              onClick={() => paymentMutation.mutate(listing.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-md transition-colors"
                            >
                              {paymentMutation.isPending
                                ? t('common.loading', 'Loading…')
                                : t('payment.btn_complete_payment', 'Complete Payment')}
                            </button>
                          )}
                          {listing.status === 'active' && !listing.featured && (
                            <button
                              type="button"
                              disabled={upgradeMutation.isPending}
                              onClick={() => upgradeMutation.mutate(listing.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
                            >
                              {upgradeMutation.isPending
                                ? t('common.loading', 'Loading…')
                                : t('featured.upgrade_cta', 'Upgrade to Featured (€5)')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Inquiries tab */}
        {activeTab === 'inquiries' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('breeder_dashboard.inquiries_title', 'My Inquiries')}
            </h2>
            <BreederInquiryList />
          </div>
        )}

        {/* Documents tab */}
        {activeTab === 'documents' && profileData && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('breeder.dashboard.tabs.documents', 'Documents')}
            </h2>

            <div className="mb-6">
              <DocumentList breederId={profileData.id} documents={profileData.documents ?? []} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {t('documents.upload_cta', 'Upload Document')}
              </h3>
              <DocumentUpload
                breederId={profileData.id}
                onUploaded={(doc: BreederDocument) => {
                  queryClient.setQueryData(
                    ['myBreederProfile'],
                    (old: typeof profileData | undefined) =>
                      old ? { ...old, documents: [...(old.documents ?? []), doc] } : old
                  )
                }}
              />
            </div>

            {(profileData.documents ?? []).length > 0 &&
              !(profileData.documents ?? []).some((d) => d.status === 'rejected') && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  {t(
                    'breeder.dashboard.ready_to_verify',
                    'Ready to verify? Submit your profile for review →'
                  )}
                </div>
              )}
          </div>
        )}
        {/* Verification tab */}
        {activeTab === 'verification' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('breeder.dashboard.tabs.verification', 'Verification')}
            </h2>
            {verificationStatus ? (
              <VerificationStatusCard
                status={verificationStatus}
                onSubmitClick={() => setShowVerificationModal(true)}
              />
            ) : (
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>
        )}

        {showVerificationModal && profileData && (
          <VerificationSubmitModal
            breederId={profileData.id}
            documents={profileData.documents ?? []}
            onSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ['verificationStatus'] })
              queryClient.invalidateQueries({ queryKey: ['myBreederProfile'] })
            }}
            onClose={() => setShowVerificationModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
