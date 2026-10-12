import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getReviewExists } from '@/api/review.api'
import { ReviewModal } from '@/components/reviews/ReviewModal'

interface Props {
  breederProfileId: number
  breederName: string
}

export function ReviewCta({ breederProfileId, breederName }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data } = useQuery({
    queryKey: ['reviewExists', breederProfileId],
    queryFn: () => getReviewExists(breederProfileId).then((r) => r.data.data),
    retry: false,
  })

  if (data?.has_reviewed) {
    return (
      <span className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
        {t('review.btn_review_submitted', 'Review Submitted')}
      </span>
    )
  }

  if (showModal) {
    return (
      <div className="w-full border border-gray-200 rounded-lg p-4">
        <ReviewModal
          breederProfileId={breederProfileId}
          breederName={breederName}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ['reviewExists', breederProfileId] })
          }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowModal(true)}
      className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
    >
      {t('review.btn_leave_review', 'Leave a Review')}
    </button>
  )
}
