import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import { getBuyerInquiries, getBuyerReviews, getSavedListings } from '@/api/buyer.api'
import { BuyerInquiryList } from '@/components/buyer/BuyerInquiryList'
import { BuyerReviewList } from '@/components/buyer/BuyerReviewList'
import { BuyerSavedListings } from '@/components/buyer/BuyerSavedListings'

type Tab = 'inquiries' | 'reviews' | 'saved'

const TABS: Tab[] = ['inquiries', 'reviews', 'saved']

export default function BuyerDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab')
  const activeTab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'inquiries'

  const { data: inquiriesData } = useQuery({
    queryKey: ['buyer', 'inquiries', 1],
    queryFn: () => getBuyerInquiries(1).then((r) => r.data),
    staleTime: 60_000,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['buyer', 'reviews'],
    queryFn: () => getBuyerReviews().then((r) => r.data.data),
    staleTime: 60_000,
  })

  const { data: savedData } = useQuery({
    queryKey: ['buyer', 'savedListings', 1],
    queryFn: () => getSavedListings(1).then((r) => r.data),
    staleTime: 60_000,
  })

  const counts = {
    inquiries: inquiriesData?.meta?.total ?? 0,
    reviews: reviewsData?.length ?? 0,
    saved: savedData?.meta?.total ?? 0,
  }

  function setTab(tab: Tab) {
    setSearchParams({ tab })
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {t('buyer.dashboard.title', 'My Dashboard')}
        </h1>
        {user && (
          <p className="text-gray-500 mb-6">
            {t('buyer.dashboard.welcome', 'Welcome back, {{name}}', { name: user.name })}
          </p>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(tab)}
              className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(
                `buyer_dashboard.tab_${tab}`,
                tab === 'inquiries'
                  ? 'My Inquiries'
                  : tab === 'reviews'
                    ? 'My Reviews'
                    : 'Saved Listings'
              )}
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold leading-none">
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'inquiries' && <BuyerInquiryList />}
        {activeTab === 'reviews' && <BuyerReviewList />}
        {activeTab === 'saved' && <BuyerSavedListings />}
      </div>
    </DashboardLayout>
  )
}
