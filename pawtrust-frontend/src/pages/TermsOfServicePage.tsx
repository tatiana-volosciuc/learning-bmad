import { useTranslation } from 'react-i18next'

export default function TermsOfServicePage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('terms.title', 'Terms of Service')}
      </h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('terms.acceptance_title', 'Acceptance of Terms')}
        </h2>
        <p className="text-gray-700">{t('terms.acceptance_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('terms.accounts_title', 'Accounts & Eligibility')}
        </h2>
        <p className="text-gray-700">{t('terms.accounts_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('terms.conduct_title', 'Acceptable Use')}
        </h2>
        <p className="text-gray-700">{t('terms.conduct_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('terms.liability_title', 'Limitation of Liability')}
        </h2>
        <p className="text-gray-700">{t('terms.liability_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('terms.contact_title', 'Contact Us')}
        </h2>
        <p className="text-gray-700">{t('terms.contact_body')}</p>
      </section>
    </div>
  )
}
