import { useTranslation } from 'react-i18next'

export default function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('privacy.title', 'Privacy Policy')}
      </h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('privacy.data_collected_title', 'Data We Collect')}
        </h2>
        <p className="text-gray-700">{t('privacy.data_collected_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('privacy.how_used_title', 'How We Use Your Data')}
        </h2>
        <p className="text-gray-700">{t('privacy.how_used_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('privacy.processors_title', 'Third-Party Processors')}
        </h2>
        <p className="text-gray-700">{t('privacy.processors_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('privacy.rights_title', 'Your Rights')}
        </h2>
        <p className="text-gray-700">{t('privacy.rights_body')}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('privacy.contact_title', 'Contact Us')}
        </h2>
        <p className="text-gray-700">{t('privacy.contact_body')}</p>
      </section>
    </div>
  )
}
