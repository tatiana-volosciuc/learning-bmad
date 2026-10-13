import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { deleteAccount, exportAccountData } from '@/api/account.api'
import { useAuthStore } from '@/store/authStore'

function DeleteAccountModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 id="delete-account-title" className="text-lg font-semibold text-gray-900 mb-2">
          {t('gdpr.delete_account_btn', 'Delete account')}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {t(
            'gdpr.delete_account_confirm',
            'This action is irreversible. All your data will be anonymized and your listings, inquiries, and files will be removed.'
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {t('gdpr.delete_account_btn', 'Delete account')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const exportMutation = useMutation({
    mutationFn: exportAccountData,
    onSuccess: ({ data }) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pawtrust-data-export.json'
      link.click()
      URL.revokeObjectURL(url)
      toast.success(t('gdpr.export_success', 'Your data has been exported.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      clearAuth()
      toast.success(t('gdpr.account_deleted_toast', 'Your account has been deleted.'))
      navigate('/')
    },
  })

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('nav.profile', 'Profile')}</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {t('gdpr.export_data_btn', 'Export my data')}
          </h3>
          <button
            type="button"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('gdpr.export_data_btn', 'Export my data')}
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-red-700 mb-1">
            {t('gdpr.delete_account_btn', 'Delete account')}
          </h3>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50"
          >
            {t('gdpr.delete_account_btn', 'Delete account')}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => deleteMutation.mutate()}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
