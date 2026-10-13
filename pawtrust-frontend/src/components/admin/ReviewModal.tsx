import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  reviewVerificationRequest,
  getDocumentPreviewUrl,
  type AdminVerificationRequest,
  type VerificationReviewStatus,
} from '@/api/admin.api'
import { formatDate } from '@/utils/date'

interface Props {
  request: AdminVerificationRequest
  onReviewed: () => void
  onClose: () => void
}

export default function ReviewModal({ request, onReviewed, onClose }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<VerificationReviewStatus | ''>('')
  const [notes, setNotes] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      reviewVerificationRequest(request.id, {
        status: status as VerificationReviewStatus,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success(t('admin.verification.toast_success', 'Decision saved.'))
      onReviewed()
    },
  })

  async function handlePreview(docId: number) {
    try {
      const res = await getDocumentPreviewUrl(docId)
      window.open(res.data.data.url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error(t('admin.verification.preview_error', 'Could not load document preview.'))
    }
  }

  const canSubmit = status !== '' && (status !== 'rejected' || notes.length >= 20) && !isPending

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="review-modal-title" className="text-lg font-semibold text-gray-900">
              {t('admin.verification.modal_title', 'Verification Decision')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {request.breeder.name}
              {request.breeder.kennel_name ? ` · ${request.breeder.kennel_name}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{request.breeder.email}</p>
            <p className="text-xs text-gray-400">
              {t('admin.verification.col_submitted', 'Submitted')}:{' '}
              {formatDate(request.submitted_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Documents */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t('admin.verification.col_documents', 'Documents')}
            </p>
            <ul className="space-y-1">
              {request.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {doc.document_type} — {doc.filename}
                  </span>
                  <button
                    onClick={() => handlePreview(doc.id)}
                    className="text-indigo-600 hover:underline ml-4 shrink-0"
                  >
                    {t('admin.verification.btn_preview', 'Preview')}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Status selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Decision</p>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    value: 'under_review',
                    label: t('admin.verification.status_under_review', 'Set Under Review'),
                  },
                  { value: 'approved', label: t('admin.verification.status_approve', 'Approve') },
                  { value: 'rejected', label: t('admin.verification.status_reject', 'Reject') },
                ] as { value: VerificationReviewStatus; label: string }[]
              ).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="review-status"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    disabled={isPending}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes (rejection only) */}
          {status === 'rejected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.verification.notes_label', 'Notes for breeder (minimum 20 characters):')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isPending}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
              {notes.length > 0 && notes.length < 20 && (
                <p className="text-xs text-red-500 mt-1">
                  Minimum 20 characters ({notes.length}/20)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {t('common.back', 'Cancel')}
          </button>
          <button
            onClick={() => mutate()}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40"
          >
            {isPending ? '…' : t('admin.verification.btn_save', 'Save Decision')}
          </button>
        </div>
      </div>
    </div>
  )
}
