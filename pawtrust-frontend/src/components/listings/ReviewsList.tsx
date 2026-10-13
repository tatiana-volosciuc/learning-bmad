import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Review, ReviewSummary } from '@/api/listings.api'
import { formatDate } from '@/utils/date'

interface Props {
  reviews: Review[]
  summary: ReviewSummary
  breederId: number
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-300'}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

export function ReviewsList({ reviews, summary, breederId }: Props) {
  const { t } = useTranslation()

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center gap-3 mb-4">
        {summary.average_rating != null ? (
          <>
            <Stars rating={Math.round(summary.average_rating)} />
            <span className="text-sm text-gray-600">
              {summary.average_rating} / 5 ({summary.total_count} reviews)
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-400">
            {t('listing_detail.no_reviews', 'No reviews yet.')}
          </span>
        )}
      </div>

      {/* Review list */}
      {reviews.map((r) => (
        <div key={r.id} className="border-t border-gray-100 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Stars rating={r.rating} />
            <span className="text-xs text-gray-500 font-medium">{r.buyer_name}</span>
            <span className="text-xs text-gray-400 ml-auto">{formatDate(r.created_at)}</span>
          </div>
          {r.comment && <p className="text-sm text-gray-700 line-clamp-3">{r.comment}</p>}
        </div>
      ))}

      {/* See all link */}
      {summary.total_count > 0 && (
        <div className="mt-3">
          <Link
            to={`/breeders/${breederId}#reviews`}
            className="text-sm text-blue-600 hover:underline"
          >
            {t('listing_detail.see_all_reviews', 'See all reviews on breeder profile →')}
          </Link>
        </div>
      )}
    </div>
  )
}
