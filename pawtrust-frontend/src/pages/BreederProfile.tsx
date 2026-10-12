import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPublicBreederProfile } from '@/api/breeders.api'
import { getInquiryExists, getReviewExists } from '@/api/review.api'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { StarRating } from '@/components/shared/StarRating'
import { ReviewModal } from '@/components/reviews/ReviewModal'
import { useAuthStore } from '@/store/authStore'

function ProfileSkeleton() {
  return (
    <div className="animate-pulse p-6 max-w-4xl mx-auto">
      <div className="flex gap-6 mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  )
}

export default function BreederProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['publicBreederProfile', id],
    queryFn: () => getPublicBreederProfile(Number(id)).then((r) => r.data.data),
    retry: false,
  })

  const isBuyer = Boolean(token && user?.role === 'buyer')

  const { data: inquiryExistsData } = useQuery({
    queryKey: ['inquiryExists', data?.id],
    queryFn: () => getInquiryExists(data!.id).then((r) => r.data.data),
    enabled: isBuyer && data != null,
    retry: false,
  })

  const { data: reviewExistsData } = useQuery({
    queryKey: ['reviewExists', data?.id],
    queryFn: () => getReviewExists(data!.id).then((r) => r.data.data),
    enabled: isBuyer && data != null,
    retry: false,
  })

  const canLeaveReview = isBuyer && inquiryExistsData?.has_inquiry === true
  const hasReviewed = reviewExistsData?.has_reviewed === true

  if (isLoading) return <ProfileSkeleton />

  const is404 =
    isError &&
    'response' in (error as object) &&
    (error as { response?: { status?: number } }).response?.status === 404

  if (is404) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-gray-600">
          {t('breeder.profile.not_found', 'Profile not found')}
        </p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline text-sm">
          {t('common.go_back', 'Go back')}
        </button>
      </div>
    )
  }

  if (isError || !data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 flex flex-col sm:flex-row gap-6">
          {/* Photo */}
          {data.profile_photo_url ? (
            <img
              src={data.profile_photo_url}
              alt={data.kennel_name ?? ''}
              className="w-24 h-24 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold shrink-0">
              {(data.kennel_name ?? '?')[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {data.kennel_name ?? t('breeder.profile.unnamed', 'Unnamed Kennel')}
              </h1>
              <VerifiedBadge verified={data.verified} size="md" />
            </div>

            {data.location && <p className="text-gray-500 text-sm mt-1">📍 {data.location}</p>}
            {data.years_active != null && (
              <p className="text-gray-500 text-sm">
                {t('breeder.profile.years_active', '{{n}} years active', { n: data.years_active })}
              </p>
            )}
            {typeof data.documents_on_file === 'number' ? (
              data.documents_on_file > 0 ? (
                <p className="text-green-600 text-sm mt-1">
                  ✓{' '}
                  {t(
                    'breeder.profile.documents_on_file',
                    '{{count}} verification document(s) on file',
                    {
                      count: data.documents_on_file,
                    }
                  )}
                </p>
              ) : (
                <p className="text-gray-400 text-sm mt-1">
                  {t('breeder.profile.no_documents', 'No verification documents yet')}
                </p>
              )
            ) : null}
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline mt-1 inline-block"
              >
                {data.website}
              </a>
            )}
          </div>
        </div>

        {/* Breed specializations */}
        {data.breed_specialization && data.breed_specialization.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('breeder.profile.specializations', 'Breed Specializations')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.breed_specialization.map((b) => (
                <span key={b} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('breeder.profile.about', 'About')}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
          </div>
        )}

        {/* Active Listings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            {t('breeder.profile.active_listings', 'Active Listings')}
          </h2>
          {!data.listings || data.listings.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {t('breeder.profile.no_listings', 'No active listings at the moment.')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.listings.map((listing) => (
                <div key={listing.id} className="border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-900">
                    {listing.title ?? `Listing #${listing.id}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
                {t('breeder.profile.reviews', 'Reviews')}
              </h2>
              {data.review_summary && data.review_summary.total_count > 0 ? (
                <div className="flex items-center gap-2">
                  <StarRating mode="display" value={data.review_summary.average_rating ?? 0} />
                  <span className="text-sm text-gray-600">
                    {t(
                      data.review_summary.total_count === 1
                        ? 'review.aggregate_label'
                        : 'review.aggregate_label_plural',
                      '{{average}} out of 5 ({{count}} reviews)',
                      {
                        average: data.review_summary.average_rating,
                        count: data.review_summary.total_count,
                      }
                    )}
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  {t('review.no_reviews', 'No reviews yet for this breeder.')}
                </p>
              )}
            </div>

            {isBuyer &&
              (hasReviewed ? (
                <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                  {t('review.btn_review_submitted', 'Review Submitted')}
                </span>
              ) : (
                canLeaveReview && (
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    {t('review.btn_leave_review', 'Leave a Review')}
                  </button>
                )
              ))}
          </div>

          {showReviewModal && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <ReviewModal
                breederProfileId={data.id}
                breederName={data.kennel_name ?? ''}
                onSuccess={() => {
                  setShowReviewModal(false)
                  queryClient.invalidateQueries({ queryKey: ['publicBreederProfile', id] })
                  queryClient.invalidateQueries({ queryKey: ['reviewExists', data.id] })
                }}
              />
            </div>
          )}

          {data.reviews && data.reviews.length > 0 && (
            <div className="space-y-4 divide-y divide-gray-100">
              {data.reviews.map((review) => (
                <div key={review.id} className="pt-4 first:pt-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <StarRating mode="display" value={review.rating} size="sm" />
                    <span className="text-xs text-gray-400">{review.posted_at}</span>
                  </div>
                  <p className="text-sm text-gray-700">{review.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{review.buyer_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
