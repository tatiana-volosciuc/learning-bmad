import { useTranslation } from 'react-i18next'

interface FeaturedBadgeProps {
  size?: 'sm' | 'md'
}

const StarIcon = () => (
  <svg
    className="shrink-0"
    width="12"
    height="12"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 0 0-.363 1.118l1.287 3.957c.299.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 0 0-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.363-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 0 0 .95-.69l1.285-3.957Z" />
  </svg>
)

export function FeaturedBadge({ size = 'sm' }: FeaturedBadgeProps) {
  const { t } = useTranslation()

  const gapClass = size === 'md' ? 'gap-1.5' : 'gap-1'
  const textClass = size === 'md' ? 'text-sm' : 'text-xs'
  const paddingClass = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5'

  const label = t('featured.badge_label', 'Featured')

  return (
    <span
      className={`inline-flex items-center ${gapClass} ${paddingClass} rounded-full ${textClass} font-semibold bg-amber-100 text-amber-800 border border-amber-300`}
      role="status"
    >
      <StarIcon />
      {label}
    </span>
  )
}
