import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SitterCard as SitterCardType, SitterService } from '@/api/sitter.api'

const SERVICE_ICONS: Record<SitterService, string> = {
  boarding: '🏠',
  dog_walking: '🐕',
  day_care: '☀️',
  drop_in: '📍',
}

interface Props {
  sitter: SitterCardType
}

export function SitterCard({ sitter }: Props) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/sitters/${sitter.id}`}
      role="article"
      aria-label={sitter.full_name}
      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-gray-100">
        {sitter.photo_url ? (
          <img
            src={sitter.photo_url}
            alt={sitter.full_name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🐾
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900 truncate">{sitter.full_name}</h3>
          <span className="text-xs text-gray-400 shrink-0">{sitter.average_review ?? '-'}</span>
        </div>

        {sitter.service_areas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sitter.service_areas.map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                📍 {area}
              </span>
            ))}
          </div>
        )}

        {sitter.services.length > 0 && (
          <div className="flex gap-1.5 text-sm">
            {sitter.services.map((service) => (
              <span key={service} title={t(`sitter.service_${service}`, service)}>
                {SERVICE_ICONS[service]}
              </span>
            ))}
          </div>
        )}

        {sitter.rates && <p className="text-sm text-gray-700 truncate">{sitter.rates}</p>}

        {sitter.bio_excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2">{sitter.bio_excerpt}</p>
        )}

        {sitter.experience_years != null && (
          <p className="text-xs text-gray-400">
            {t('sitter.profile.years_experience', '{{n}} years experience', {
              n: sitter.experience_years,
            })}
          </p>
        )}
      </div>
    </Link>
  )
}
