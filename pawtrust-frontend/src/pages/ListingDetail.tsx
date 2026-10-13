import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getListingDetail } from '@/api/listings.api'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PhotoGallery } from '@/components/listings/PhotoGallery'
import { AchievementsList } from '@/components/breeders/AchievementsList'
import { BreederSummaryCard } from '@/components/breeders/BreederSummaryCard'
import { ReviewsList } from '@/components/listings/ReviewsList'
import { InquiryCTA } from '@/components/listings/InquiryCTA'
import { FeaturedBadge } from '@/components/listings/FeaturedBadge'

function calcAge(dob: string | null): string | null {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44))
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 max-w-7xl mx-auto px-4 py-8">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-12 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingDetail(Number(id)).then((r) => r.data.data),
    retry: false,
  })

  if (isLoading) return <DetailSkeleton />

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-3">Listing not found or no longer available.</p>
          <Link to="/search" className="text-blue-600 hover:underline text-sm">
            ← {t('search.title', 'Browse Pets')}
          </Link>
        </div>
      </div>
    )
  }

  const age = calcAge(data.date_of_birth)
  const price = new Intl.NumberFormat('ro-MD', {
    style: 'currency',
    currency: data.currency,
    maximumFractionDigits: 0,
  }).format(Number(data.price))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: t('listing_detail.breadcrumb.home', 'Home'), href: '/' },
            { label: t('listing_detail.breadcrumb.browse', 'Browse Pets'), href: '/search' },
            { label: data.title },
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-6">
            <PhotoGallery photos={data.photos} />

            {/* Listing info */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
                {data.featured && <FeaturedBadge size="md" />}
              </div>
              <p className="text-gray-500 text-sm capitalize">
                {data.species} · {data.breed} · {data.gender}
                {age && ` · ${age}`}
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{price}</p>
              {data.location && <p className="text-sm text-gray-500 mt-1">📍 {data.location}</p>}
            </div>

            {/* Health certificate */}
            {data.health_certificate === 'on_file' && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                📄 {t('listing_detail.health_cert_on_file', 'Health Certificate on file')}
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {data.description}
              </p>
            </div>

            {/* Achievements */}
            {data.achievements.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Cynology Achievements
                </h2>
                <AchievementsList achievements={data.achievements} />
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Reviews</h2>
              <ReviewsList
                reviews={data.recent_reviews}
                summary={data.review_summary}
                breederId={data.breeder.id}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <BreederSummaryCard breeder={data.breeder} />
            <InquiryCTA listingId={data.id} listingTitle={data.title} />
          </aside>
        </div>
      </div>
    </div>
  )
}
