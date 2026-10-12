import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ListingCard as ListingCardType } from '@/api/listings.api'
import { saveListing, unsaveListing } from '@/api/buyer.api'
import { useAuthStore } from '@/store/authStore'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'

interface Props {
  listing: ListingCardType
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path d="M12 21s-6.7-4.35-9.3-8.1C.7 10 1.4 6.3 4.6 5.1c2-.75 4.1 0 5.4 1.8C11.3 5.1 13.4 4.35 15.4 5.1c3.2 1.2 3.9 4.9 1.9 7.8C18.7 16.65 12 21 12 21Z" />
    </svg>
  )
}

export function ListingCard({ listing }: Props) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [isSaved, setIsSaved] = useState(listing.is_saved ?? false)

  const toggleSave = useMutation({
    // Target state passed explicitly (not read from reactive `isSaved`) to avoid a race
    // with the optimistic onMutate update flipping the closed-over value mid-flight.
    mutationFn: (nextSaved: boolean) =>
      nextSaved ? saveListing(listing.id) : unsaveListing(listing.id),
    onMutate: (nextSaved) => {
      setIsSaved(nextSaved)
    },
    onError: (_err, nextSaved) => {
      setIsSaved(!nextSaved)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'savedListings'] })
    },
  })

  const formattedPrice = new Intl.NumberFormat('ro-MD', {
    style: 'currency',
    currency: listing.currency,
    maximumFractionDigits: 0,
  }).format(Number(listing.price))

  return (
    <Link
      to={`/listings/${listing.id}`}
      role="article"
      aria-label={listing.title}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {listing.main_photo_url ? (
          <img
            src={listing.main_photo_url}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🐾
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.featured && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
              {t('listing_card.featured', 'Featured')}
            </span>
          )}
        </div>

        {user?.role === 'buyer' && (
          <button
            type="button"
            aria-label={
              isSaved
                ? t('buyer_dashboard.btn_unsave_listing', 'Remove from saved')
                : t('buyer_dashboard.btn_save_listing', 'Save')
            }
            aria-pressed={isSaved}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleSave.mutate(!isSaved)
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors ${
              isSaved ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <HeartIcon filled={isSaved} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate capitalize">{listing.breed}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-blue-600 font-bold text-sm">{formattedPrice}</span>
          {listing.location && (
            <span className="text-xs text-gray-400 truncate max-w-[50%]">
              📍 {listing.location}
            </span>
          )}
        </div>
        {listing.breeder_name && (
          <p className="text-xs text-gray-400 mt-1 truncate">{listing.breeder_name}</p>
        )}
        <div className="mt-1.5">
          <VerifiedBadge verified={listing.verified} size="sm" />
        </div>
      </div>
    </Link>
  )
}
