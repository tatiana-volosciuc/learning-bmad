import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useListings } from '@/hooks/useListings'
import { ListingGrid } from '@/components/listings/ListingGrid'
import { SearchFilters } from '@/components/listings/SearchFilters'
import { PageMeta } from '@/components/shared/PageMeta'
import type { ListingSearchParams } from '@/api/listings.api'

function parseParams(searchParams: URLSearchParams): ListingSearchParams {
  const params: ListingSearchParams = {}
  if (searchParams.get('q')) params.q = searchParams.get('q')!
  if (searchParams.get('species'))
    params.species = searchParams.get('species') as ListingSearchParams['species']
  if (searchParams.get('location_city')) params.location_city = searchParams.get('location_city')!
  if (searchParams.get('location_region'))
    params.location_region = searchParams.get('location_region')!
  if (searchParams.get('price_min')) params.price_min = Number(searchParams.get('price_min'))
  if (searchParams.get('price_max')) params.price_max = Number(searchParams.get('price_max'))
  if (searchParams.get('verified_only'))
    params.verified_only = searchParams.get('verified_only') === '1'
  if (searchParams.get('page')) params.page = Number(searchParams.get('page'))
  return params
}

function buildSearchParams(filters: ListingSearchParams): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.q) p.set('q', filters.q)
  if (filters.species) p.set('species', filters.species)
  if (filters.location_city) p.set('location_city', filters.location_city)
  if (filters.location_region) p.set('location_region', filters.location_region)
  if (filters.price_min != null) p.set('price_min', String(filters.price_min))
  if (filters.price_max != null) p.set('price_max', String(filters.price_max))
  if (filters.verified_only) p.set('verified_only', '1')
  if (filters.page && filters.page > 1) p.set('page', String(filters.page))
  return p
}

export default function SearchPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = parseParams(searchParams)
  const { data, isFetching } = useListings(filters)

  const handleFiltersChange = useCallback(
    (newFilters: ListingSearchParams) => {
      setSearchParams(buildSearchParams(newFilters), { replace: false })
    },
    [setSearchParams]
  )

  function handlePageChange(page: number) {
    const p = buildSearchParams({ ...filters, page })
    setSearchParams(p, { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const total = data?.meta.total ?? 0
  const currentPage = data?.meta.current_page ?? 1
  const lastPage = data?.meta.last_page ?? 1
  const listings = data?.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageMeta
          title={t('seo.browse_title', 'Browse Pet Listings')}
          description={t(
            'seo.browse_description',
            'Browse hundreds of listings from verified breeders.'
          )}
        />
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('search.title', 'Browse Pets')}</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              {t('search.results_count', '{{count}} listings found', { count: total })}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <SearchFilters filters={filters} onChange={handleFiltersChange} />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {!isFetching && listings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-3">
                  {t('search.empty_state', 'No listings match your search.')}
                </p>
                <button
                  type="button"
                  onClick={() => handleFiltersChange({})}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {t('search.clear_filters', 'Clear all filters')}
                </button>
              </div>
            ) : (
              <ListingGrid listings={listings} isLoading={isFetching && listings.length === 0} />
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  ← {t('common.prev', 'Prev')}
                </button>

                {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      p === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= lastPage}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                >
                  {t('common.next', 'Next')} →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
