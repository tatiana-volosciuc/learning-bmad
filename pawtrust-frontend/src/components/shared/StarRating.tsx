import { useState } from 'react'

interface StarRatingProps {
  value: number
  mode?: 'input' | 'display'
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85L10 1.5z" />
    </svg>
  )
}

export function StarRating({ value, mode = 'display', onChange, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const isInput = mode === 'input'
  const displayValue = isInput ? (hovered ?? value) : value
  const starClass = `${SIZE_CLASSES[size]} text-yellow-400`

  if (!isInput) {
    return (
      <div
        role="img"
        aria-label={`Rating: ${value} out of 5`}
        className="flex items-center gap-0.5"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={n <= Math.round(value)} className={starClass} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} stars`}
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange?.(n)}
          className="focus:outline-none"
        >
          <StarIcon filled={n <= displayValue} className={starClass} />
        </button>
      ))}
    </div>
  )
}
