import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { submitInquiry, type BreederContact, type InquiryResponse } from '@/api/inquiry.api'
import { ContactRevealCard } from './ContactRevealCard'

interface Props {
  listingId: number
  listingTitle: string
  onSuccess: (data: InquiryResponse) => void
}

const MAX_LENGTH = 500

export function InquireModal({ listingId, listingTitle, onSuccess }: Props) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [alreadyInquired, setAlreadyInquired] = useState(false)
  const [revealedContact, setRevealedContact] = useState<BreederContact | null>(null)

  const mutation = useMutation({
    mutationFn: () => submitInquiry(listingId, message.trim() || undefined),
    onSuccess: (res) => {
      setRevealedContact(res.data.data.breeder_contact)
      onSuccess(res.data.data)
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setAlreadyInquired(true)
      }
    },
  })

  if (revealedContact) {
    return <ContactRevealCard contact={revealedContact} />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">
        {t('inquiry.modal_title', 'Send an Inquiry')}
      </h2>
      <p className="text-sm text-gray-500">{listingTitle}</p>

      {alreadyInquired && (
        <div
          role="status"
          className="text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-3 py-2"
        >
          {t('inquiry.already_inquired', 'You have already inquired about this listing.')}
        </div>
      )}

      {mutation.isError && !alreadyInquired && (
        <div
          role="alert"
          className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2"
        >
          {t('common.error_generic', 'Something went wrong. Please try again.')}
        </div>
      )}

      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium text-gray-700 mb-1">
          {t('inquiry.message_label', 'Optional message (max 500 characters)')}
        </label>
        <textarea
          id="inquiry-message"
          rows={4}
          maxLength={MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={t('inquiry.message_placeholder', 'Tell the breeder about yourself…')}
          disabled={mutation.isPending || alreadyInquired}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">
          {MAX_LENGTH - message.length} {t('inquiry.chars_remaining', 'characters remaining')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || alreadyInquired}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {mutation.isPending
          ? t('inquiry.sending', 'Sending…')
          : t('inquiry.btn_send', 'Send Inquiry')}
      </button>
    </div>
  )
}
