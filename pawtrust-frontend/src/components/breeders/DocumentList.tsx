import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { deleteBreederDocument, type BreederDocument } from '@/api/breeders.api'
import { formatDate } from '@/utils/date'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

interface Props {
  breederId: number
  documents: BreederDocument[]
}

export function DocumentList({ breederId, documents }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => deleteBreederDocument(breederId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBreederProfile'] })
      setConfirmDeleteId(null)
    },
  })

  if (documents.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">
        {t('documents.empty_state', 'No documents uploaded yet.')}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide text-xs">
          <tr>
            <th className="px-4 py-3 text-left">{t('documents.columns.type', 'Type')}</th>
            <th className="px-4 py-3 text-left">{t('documents.columns.filename', 'Filename')}</th>
            <th className="px-4 py-3 text-left">{t('documents.columns.uploaded', 'Uploaded')}</th>
            <th className="px-4 py-3 text-left">{t('documents.columns.status', 'Status')}</th>
            <th className="px-4 py-3 text-left"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-700">
                {t(`documents.types.${doc.document_type}`, doc.document_type)}
              </td>
              <td className="px-4 py-3 text-gray-600 break-all max-w-xs">{doc.filename}</td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {formatDate(doc.uploaded_at)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[doc.status] ?? 'bg-gray-100 text-gray-600'}`}
                  title={
                    doc.status === 'rejected'
                      ? t(
                          'documents.rejected_tooltip',
                          'This document was rejected by the admin. Please re-upload.'
                        )
                      : undefined
                  }
                >
                  {t(`documents.status.${doc.status}`, doc.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {confirmDeleteId === doc.id ? (
                  <span className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-gray-500">
                      {t('documents.confirm_delete', 'Delete?')}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      {t('common.yes', 'Yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(doc.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
