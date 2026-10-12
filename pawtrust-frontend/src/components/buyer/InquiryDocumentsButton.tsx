import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getInquiryDocuments } from '@/api/inquiry.api'

interface Props {
  inquiryId: number
}

export function InquiryDocumentsButton({ inquiryId }: Props) {
  const { t } = useTranslation()

  const { refetch, isFetching } = useQuery({
    queryKey: ['inquiry', inquiryId, 'documents'],
    queryFn: () => getInquiryDocuments(inquiryId).then((r) => r.data.data),
    enabled: false,
    staleTime: 0,
  })

  const handleClick = async () => {
    const { data: documents, error } = await refetch()

    if (error) {
      toast.error(t('common.error_generic', 'Something went wrong. Please try again.'))
      return
    }

    if (!documents || documents.length === 0) {
      toast(t('buyer_dashboard.no_documents', 'No documents available for this listing.'))
      return
    }

    documents.forEach((doc) => {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isFetching}
      className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isFetching
        ? t('buyer_dashboard.documents_loading', 'Loading documents…')
        : t('buyer_dashboard.btn_view_documents', 'View Documents')}
    </button>
  )
}
