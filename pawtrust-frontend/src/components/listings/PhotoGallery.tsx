import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ListingPhoto } from '@/api/listings.api'

interface Props {
  photos: ListingPhoto[]
}

export function PhotoGallery({ photos }: Props) {
  const { t } = useTranslation()
  const [activeIdx, setActiveIdx] = useState(0)

  const listingPhotos = photos.filter((p) => p.photo_type === 'listing')
  const parentPhotos = photos.filter((p) => p.photo_type === 'parent')

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') setActiveIdx((i) => Math.min(i + 1, listingPhotos.length - 1))
    if (e.key === 'ArrowLeft') setActiveIdx((i) => Math.max(i - 1, 0))
  }

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-6xl">
        🐾
      </div>
    )
  }

  const current = listingPhotos[activeIdx]

  return (
    <div onKeyDown={handleKey} tabIndex={0} className="outline-none">
      {/* Main photo */}
      {current && (
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-2">
          <img
            src={current.url}
            alt={`Photo ${activeIdx + 1}`}
            loading={activeIdx === 0 ? 'eager' : 'lazy'}
            fetchPriority={activeIdx === 0 ? 'high' : 'auto'}
            className="w-full h-full object-cover"
          />
          {listingPhotos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {t('listing_detail.photo_count', '{{current}} / {{total}}', {
                current: activeIdx + 1,
                total: listingPhotos.length,
              })}
            </div>
          )}
          {activeIdx > 0 && (
            <button
              type="button"
              onClick={() => setActiveIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}
          {activeIdx < listingPhotos.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {listingPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {listingPhotos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                i === activeIdx ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img src={photo.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Parent photos */}
      {parentPhotos.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Parents</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {parentPhotos.map((photo) => (
              <div
                key={photo.id}
                className="shrink-0 w-20 h-20 rounded overflow-hidden border border-gray-200"
              >
                <img
                  src={photo.url}
                  alt="Parent"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
