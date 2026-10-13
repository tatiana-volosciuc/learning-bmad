import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getVerificationRequests, type AdminVerificationRequest } from '@/api/admin.api'
import { formatDate } from '@/utils/date'
import ReviewModal from './ReviewModal'

type StatusFilter = '' | 'pending' | 'under_review' | 'approved' | 'rejected'

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function VerificationQueue() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [page, setPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<AdminVerificationRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verificationRequests', statusFilter, page],
    queryFn: () =>
      getVerificationRequests({ status: statusFilter || undefined, page }).then((r) => r.data),
  })

  const filters: { label: string; value: StatusFilter }[] = [
    { label: t('admin.verification.filter_all', 'All'), value: '' },
    { label: t('admin.verification.filter_pending', 'Pending'), value: 'pending' },
    { label: t('admin.verification.filter_under_review', 'Under Review'), value: 'under_review' },
    { label: t('admin.verification.filter_approved', 'Approved'), value: 'approved' },
    { label: t('admin.verification.filter_rejected', 'Rejected'), value: 'rejected' },
  ]

  function handleFilterChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleReviewed() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'verificationRequests'] })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t('admin.verification.title', 'Verification Queue')}
      </h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === f.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-500 text-sm py-4">Loading…</p>}

      {!isLoading && data && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    {t('admin.verification.col_breeder', 'Breeder')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    {t('admin.verification.col_kennel', 'Kennel')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    {t('admin.verification.col_submitted', 'Submitted')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    {t('admin.verification.col_documents', 'Documents')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    {t('admin.verification.col_status', 'Status')}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.data.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-3">{req.breeder.name}</td>
                    <td className="px-4 py-3">{req.breeder.kennel_name ?? '—'}</td>
                    <td className="px-4 py-3">{formatDate(req.submitted_at)}</td>
                    <td className="px-4 py-3">{req.documents.length}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_BADGE_CLASSES[req.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-indigo-600 hover:underline text-sm font-medium"
                      >
                        {t('admin.verification.btn_review', 'Review')} →
                      </button>
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No submissions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.meta && data.meta.last_page > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                {t('common.prev', 'Prev')}
              </button>
              <span className="text-sm text-gray-500">
                {page} / {data.meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.last_page, p + 1))}
                disabled={page === data.meta.last_page}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40"
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          )}
        </>
      )}

      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onReviewed={() => {
            handleReviewed()
            setSelectedRequest(null)
          }}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
