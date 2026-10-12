import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { contactSitter } from '@/api/sitter.api'

interface Props {
  sitterId: number
  sitterName: string
  onSuccess: () => void
}

const MIN_LENGTH = 10
const MAX_LENGTH = 1000

export function SitterContactModal({ sitterId, sitterName, onSuccess }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [rateLimited, setRateLimited] = useState(false)

  const mutation = useMutation({
    mutationFn: () => contactSitter(sitterId, { name, email, message }),
    onSuccess: () => {
      toast.success(t('sitter.contact_success', 'Your message has been sent!'))
      onSuccess()
    },
    onError: (err: any) => {
      if (err?.response?.status === 429) {
        setRateLimited(true)
      }
    },
  })

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length >= MIN_LENGTH &&
    !mutation.isPending

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">
        {t('sitter.contact_modal_title', 'Send a message to {{name}}', { name: sitterName })}
      </h2>

      {rateLimited && (
        <div
          role="alert"
          className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2"
        >
          {t('sitter.contact_rate_limited', 'Too many messages. Please try again later.')}
        </div>
      )}

      {mutation.isError && !rateLimited && (
        <div
          role="alert"
          className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2"
        >
          {t('common.error_generic', 'Something went wrong. Please try again.')}
        </div>
      )}

      <div>
        <label
          htmlFor="sitter-contact-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('sitter.contact_name_label', 'Your name')}
        </label>
        <input
          id="sitter-contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={mutation.isPending}
        />
      </div>

      <div>
        <label
          htmlFor="sitter-contact-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('sitter.contact_email_label', 'Your email')}
        </label>
        <input
          id="sitter-contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={mutation.isPending}
        />
      </div>

      <div>
        <label
          htmlFor="sitter-contact-message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('sitter.contact_message_label', 'Message (min 10, max 1000 characters)')}
        </label>
        <textarea
          id="sitter-contact-message"
          rows={4}
          maxLength={MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={mutation.isPending}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">
          {MAX_LENGTH - message.length} {t('inquiry.chars_remaining', 'characters remaining')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={!canSubmit}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {mutation.isPending
          ? t('sitter.contact_submitting', 'Sending…')
          : t('sitter.contact_btn', 'Contact')}
      </button>
    </div>
  )
}
