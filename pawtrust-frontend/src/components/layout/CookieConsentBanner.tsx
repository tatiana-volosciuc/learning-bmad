import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const CONSENT_KEY = 'pawtrust_cookie_consent'

export function CookieConsentBanner() {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(() => Boolean(localStorage.getItem(CONSENT_KEY)))

  const decide = (decision: 'accepted' | 'rejected') => {
    localStorage.setItem(CONSENT_KEY, decision)
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      role="dialog"
      aria-label={t('gdpr.cookie_banner_aria', 'Cookie consent')}
      className="fixed bottom-0 inset-x-0 z-50 bg-gray-900 text-white px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
    >
      <p className="text-sm text-gray-200">
        {t(
          'gdpr.cookie_banner_text',
          'We use only essential cookies to make this site work. We do not track you for any other purpose.'
        )}
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => decide('rejected')}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-500 hover:bg-gray-800"
        >
          {t('gdpr.cookie_reject', 'Reject non-essential')}
        </button>
        <button
          type="button"
          onClick={() => decide('accepted')}
          className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700"
        >
          {t('gdpr.cookie_accept_all', 'Accept all')}
        </button>
      </div>
    </div>
  )
}
