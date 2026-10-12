import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { submitReview } from '@/api/review.api'
import { StarRating } from '@/components/shared/StarRating'

interface Props {
  breederProfileId: number
  breederName: string
  onSuccess: () => void
}

const MAX_LENGTH = 500
const MIN_LENGTH = 10

export function ReviewModal({ breederProfileId, breederName, onSuccess }: Props) {
  const { t } = useTranslation()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [noInquiryError, setNoInquiryError] = useState(false)

  const mutation = useMutation({
    mutationFn: () => submitReview(breederProfileId, { rating, text }),
    onSuccess: () => {
      toast.success(t('review.toast_success', 'Review submitted!'))
      onSuccess()
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setAlreadyReviewed(true)
      } else if (err?.response?.status === 422) {
        setNoInquiryError(true)
      }
    },
  })

  const canSubmit = rating >= 1 && text.trim().length >= MIN_LENGTH && !mutation.isPending

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">
        {t('review.modal_title', 'Review {{name}}', { name: breederName })}
      </h2>

      {alreadyReviewed && (
        <div
          role="status"
          className="text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-3 py-2"
        >
          {t('review.already_reviewed', 'You have already reviewed this breeder.')}
        </div>
      )}

      {noInquiryError && (
        <div
          role="alert"
          className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2"
        >
          {t(
            'review.no_inquiry_error',
            'You must have an inquiry with this breeder before leaving a review.'
          )}
        </div>
      )}

      {mutation.isError && !alreadyReviewed && !noInquiryError && (
        <div
          role="alert"
          className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2"
        >
          {t('common.error_generic', 'Something went wrong. Please try again.')}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('review.rating_label', 'Rating (1–5 stars)')}
        </label>
        <StarRating mode="input" value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-1">
          {t('review.text_label', 'Your review (min 10, max 500 characters)')}
        </label>
        <textarea
          id="review-text"
          rows={4}
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={mutation.isPending || alreadyReviewed}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">
          {MAX_LENGTH - text.length} {t('inquiry.chars_remaining', 'characters remaining')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={!canSubmit || alreadyReviewed}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {mutation.isPending
          ? t('review.submitting', 'Submitting…')
          : t('review.btn_submit', 'Submit Review')}
      </button>
    </div>
  )
}
