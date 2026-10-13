import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-6 py-6 text-sm text-gray-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-gray-800">
            {t('common.privacy_policy', 'Privacy Policy')}
          </Link>
          <Link to="/terms" className="hover:text-gray-800">
            {t('common.terms_of_service', 'Terms of Service')}
          </Link>
          {/* Shown as plain text, not a mailto link, to avoid address scraping */}
          <span>{t('common.contact_us', 'Contact Us')}: contact@pawtrust.md</span>
        </div>
        <span>&copy; {new Date().getFullYear()} PawTrust</span>
      </div>
    </footer>
  )
}
