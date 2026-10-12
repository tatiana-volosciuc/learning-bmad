import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getSavedListings } from '@/api/buyer.api'
import { ListingCard } from '@/components/listings/ListingCard'

export function BuyerSavedListings() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['buyer', 'savedListings', page],
    queryFn: () => getSavedListings(page).then((r) => r.data),
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
          {t('buyer_dashboard.empty_saved', 'You have not saved any listings yet.')}
        </p>
        <Link to="/search" className="text-blue-600 hover:underline text-sm">
          {t('buyer_dashboard.cta_browse', 'Browse Listings')}
        </Link>
      </div>
    )
  }

  const lastPage = data.meta?.last_page ?? 1

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.data.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

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
