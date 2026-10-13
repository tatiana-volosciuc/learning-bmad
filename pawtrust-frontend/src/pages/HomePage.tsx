import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { PageMeta } from '@/components/shared/PageMeta'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PawTrust',
  url: 'https://pawtrust.md',
  logo: 'https://pawtrust.md/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@pawtrust.md',
    contactType: 'customer service',
  },
}

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4 py-24">
      <PageMeta
        title={t('seo.home_title', 'PawTrust — Responsible Pet Adoption in Moldova')}
        description={t(
          'seo.home_description',
          'Find verified breeders and pet sitters in Moldova and Romania.'
        )}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      </Helmet>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">PawTrust</h1>
      <p className="text-gray-600 max-w-md mb-6">
        {t(
          'seo.home_description',
          'Find verified breeders and pet sitters in Moldova and Romania.'
        )}
      </p>
      <div className="flex gap-3">
        <Link
          to="/search"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t('nav.browse_listings', 'Browse Listings')}
        </Link>
        <Link
          to="/sitters"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {t('nav.pet_sitters', 'Pet Sitters')}
        </Link>
      </div>
    </div>
  )
}
