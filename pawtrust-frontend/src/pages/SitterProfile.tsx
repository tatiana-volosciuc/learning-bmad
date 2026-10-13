import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getSitterProfile, type SitterService } from '@/api/sitter.api'
import { SitterContactModal } from '@/components/sitters/SitterContactModal'
import { PageMeta } from '@/components/shared/PageMeta'

const SERVICE_ICONS: Record<SitterService, string> = {
  boarding: '🏠',
  dog_walking: '🐕',
  day_care: '☀️',
  drop_in: '📍',
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse p-6 max-w-4xl mx-auto">
      <div className="flex gap-6 mb-6">
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

export default function SitterProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showContactModal, setShowContactModal] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sitterProfile', id],
    queryFn: () => getSitterProfile(Number(id)).then((r) => r.data.data),
    retry: false,
  })

  if (isLoading) return <ProfileSkeleton />

  const is404 =
    isError &&
    'response' in (error as object) &&
    (error as { response?: { status?: number } }).response?.status === 404

  if (is404) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-gray-600">
          {t('sitter.profile.not_found', 'Profile not found')}
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
        <PageMeta
          title={data.full_name}
          description={data.bio?.slice(0, 150)}
          ogImage={data.portfolio_photos[0]?.url ?? undefined}
        />
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{data.full_name}</h1>
            {data.experience_years != null && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                {t('sitter.profile.years_experience', '{{n}} years experience', {
                  n: data.experience_years,
                })}
              </span>
            )}
          </div>
          {data.service_areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.service_areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  📍 {area}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="mt-4 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {t('sitter.contact_btn_named', 'Contact {{name}}', { name: data.full_name })}
          </button>
        </div>

        {showContactModal && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <SitterContactModal
              sitterId={data.id}
              sitterName={data.full_name}
              onSuccess={() => setShowContactModal(false)}
            />
          </div>
        )}

        {/* Services offered */}
        {data.services.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('sitter.profile.services', 'Services Offered')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {data.services.map((service) => (
                <span
                  key={service}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  <span>{SERVICE_ICONS[service]}</span>
                  {t(`sitter.service_${service}`, service)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rates */}
        {data.rates && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('sitter.profile.rates', 'Rates')}
            </h2>
            <p className="text-gray-700">{data.rates}</p>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('sitter.profile.languages', 'Languages Spoken')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {lang.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio photos */}
        {data.portfolio_photos.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('sitter.profile.portfolio', 'Care Portfolio')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.portfolio_photos.map(
                (photo) =>
                  photo.url && (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt=""
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {data.bio && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {t('sitter.profile.about', 'About')}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{data.bio}</p>
          </div>
        )}
      </div>
    </div>
  )
}
