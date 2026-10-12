import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBuyerReviews } from '@/api/buyer.api'
import { StarRating } from '@/components/shared/StarRating'

export function BuyerReviewList() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['buyer', 'reviews'],
    queryFn: () => getBuyerReviews().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="py-10 text-center text-gray-400 text-sm">
        {t('common.loading', 'Loading…')}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm mb-3">
          {t('buyer_dashboard.empty_reviews', 'You have not written any reviews yet.')}
        </p>
        <Link to="/search" className="text-blue-600 hover:underline text-sm">
          {t('buyer_dashboard.cta_browse', 'Browse Listings')}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {data.map((review) => (
        <div key={review.id} className="p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Link
              to={`/breeders/${review.breeder.user_id}`}
              className="font-medium text-gray-900 hover:underline"
            >
              {review.breeder.kennel_name ?? t('breeder.profile.unnamed', 'Unnamed Kennel')}
            </Link>
            <span className="text-xs text-gray-400">{review.posted_at}</span>
          </div>
          <StarRating mode="display" value={review.rating} size="sm" />
          <p className="text-sm text-gray-600 mt-1">{review.text}</p>
        </div>
      ))}
    </div>
  )
}
