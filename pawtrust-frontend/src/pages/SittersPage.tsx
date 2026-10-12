import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getSitters, type SitterFilters, type SitterService } from '@/api/sitter.api'
import { SitterCard } from '@/components/sitters/SitterCard'
import { SitterCardSkeleton } from '@/components/sitters/SitterCardSkeleton'

const SERVICE_OPTIONS: SitterService[] = ['boarding', 'dog_walking', 'day_care', 'drop_in']
const DEBOUNCE_MS = 400

function parseParams(searchParams: URLSearchParams): SitterFilters {
  const filters: SitterFilters = {}
  if (searchParams.get('service_area')) filters.service_area = searchParams.get('service_area')!
  if (searchParams.get('service')) filters.service = searchParams.get('service') as SitterService
  if (searchParams.get('page')) filters.page = Number(searchParams.get('page'))
  return filters
}

function buildSearchParams(filters: SitterFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.service_area) p.set('service_area', filters.service_area)
  if (filters.service) p.set('service', filters.service)
  if (filters.page && filters.page > 1) p.set('page', String(filters.page))
  return p
}

function FilterSidebar({
  filters,
  onChange,
}: {
  filters: SitterFilters
  onChange: (filters: SitterFilters) => void
}) {
  const { t } = useTranslation()
  const [area, setArea] = useState(filters.service_area ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setArea(filters.service_area ?? '')
  }, [filters.service_area])

  function handleAreaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setArea(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, service_area: val || undefined, page: undefined })
    }, DEBOUNCE_MS)
  }

  function handleServiceChange(service: SitterService) {
    onChange({
      ...filters,
      service: filters.service === service ? undefined : service,
      page: undefined,
    })
  }

  const hasFilters = !!filters.service_area || !!filters.service

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div>
        <label
          htmlFor="sitters-area-filter"
          className="block text-xs font-medium text-gray-500 uppercase mb-1"
        >
          {t('sitters_page.filter_service_area', 'Service Area')}
        </label>
        <input
          id="sitters-area-filter"
          type="text"
          value={area}
          onChange={handleAreaChange}
          placeholder={t('sitters_page.filter_service_area_placeholder', 'e.g. Chișinău')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">
          {t('sitters_page.filter_service_type', 'Service Type')}
        </p>
        <div className="space-y-1.5">
          {SERVICE_OPTIONS.map((service) => (
            <label key={service} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.service === service}
                onChange={() => handleServiceChange(service)}
                className="accent-blue-600"
              />
              {t(`sitter.service_${service}`, service)}
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setArea('')
            onChange({})
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {t('sitters_page.clear_filters', 'Clear Filters')}
        </button>
      )}
    </div>
  )
}

export default function SittersPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseParams(searchParams)

  const { data, isFetching } = useQuery({
    queryKey: ['sitters', filters],
    queryFn: () => getSitters(filters).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const handleFiltersChange = useCallback(
    (newFilters: SitterFilters) => {
      setSearchParams(buildSearchParams(newFilters), { replace: false })
    },
    [setSearchParams]
  )

  function handlePageChange(page: number) {
    setSearchParams(buildSearchParams({ ...filters, page }), { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sitters = data?.data ?? []
  const total = data?.meta.total ?? 0
  const currentPage = data?.meta.current_page ?? 1
  const lastPage = data?.meta.last_page ?? 1
  const isEmpty = !isFetching && sitters.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('sitters_page.title', 'Pet Sitters')}
          </h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              {t('search.results_count', '{{count}} listings found', { count: total })}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 shrink-0">
            <FilterSidebar filters={filters} onChange={handleFiltersChange} />
          </aside>

          <div className="flex-1 min-w-0">
            {isEmpty ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500 mb-3">
                  {filters.service_area
                    ? t(
                        'sitters_page.empty_state',
                        'No sitters found in {{area}}. Try expanding your area.',
                        { area: filters.service_area }
                      )
                    : t('sitters_page.empty_state_no_filter', 'No sitters available right now.')}
                </p>
                {(filters.service_area || filters.service) && (
                  <button
                    type="button"
                    onClick={() => handleFiltersChange({})}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {t('sitters_page.clear_filters', 'Clear Filters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isFetching && sitters.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => <SitterCardSkeleton key={i} />)
                  : sitters.map((sitter) => <SitterCard key={sitter.id} sitter={sitter} />)}
              </div>
            )}

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
