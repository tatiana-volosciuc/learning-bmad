import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBreederInquiries, type BreederInquiry } from '@/api/inquiry.api'

const STATUS_BADGE: Record<string, string> = {
  contact_revealed: 'bg-blue-100 text-blue-700',
}

export function BreederInquiryList() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['breeder', 'inquiries', page],
    queryFn: () => getBreederInquiries(page).then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="py-10 text-center text-gray-400 text-sm">
        {t('common.loading', 'Loading…')}
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500 text-sm bg-white rounded-lg border border-gray-200">
        {t('breeder_dashboard.no_inquiries')}
      </div>
    )
  }

  const lastPage = data.meta?.last_page ?? 1

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-4 py-3 text-left">{t('breeder_dashboard.col_listing')}</th>
              <th className="px-4 py-3 text-left">{t('breeder_dashboard.col_buyer')}</th>
              <th className="px-4 py-3 text-left">{t('breeder_dashboard.col_date')}</th>
              <th className="px-4 py-3 text-left">{t('breeder_dashboard.col_message')}</th>
              <th className="px-4 py-3 text-left">{t('breeder_dashboard.col_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.data.map((inquiry: BreederInquiry) => (
              <tr key={inquiry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{inquiry.listing.title}</td>
                <td className="px-4 py-3 text-gray-600">{inquiry.buyer.name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(inquiry.submitted_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                  {inquiry.message ?? (
                    <span className="italic text-gray-400">
                      {t('breeder_dashboard.no_message', 'No message')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inquiry.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {t(`breeder_dashboard.status_${inquiry.status}`, inquiry.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            {t('common.prev', 'Previous')}
          </button>
          <span className="text-sm text-gray-500">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
          >
            {t('common.next', 'Next')}
          </button>
        </div>
      )}
    </div>
  )
}
