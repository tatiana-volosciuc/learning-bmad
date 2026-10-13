import { useTranslation } from 'react-i18next'

const LOCALES = ['ro', 'ru'] as const

export function LocaleSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {LOCALES.map((lng, i) => (
        <span key={lng} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">|</span>}
          <button
            onClick={() => i18n.changeLanguage(lng)}
            className={`px-1 ${current === lng ? 'font-bold underline text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            aria-pressed={current === lng}
          >
            {lng.toUpperCase()}
          </button>
        </span>
      ))}
      <span aria-live="polite" className="sr-only">
        {t('common.language_changed', { lng: current.toUpperCase() })}
      </span>
    </div>
  )
}
